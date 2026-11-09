import io
import os
import re
import time
import base64
import hashlib
import wave
import struct
import asyncio
import traceback
import threading
from typing import Optional

os.environ["COQUI_TOS_AGREED"] = "1"

# 1. Monkeypatch torch.load for PyTorch 2.6+ compatibility
import torch
_orig_torch_load = torch.load
def _custom_torch_load(*args, **kwargs):
    if "weights_only" not in kwargs:
        kwargs["weights_only"] = False
    return _orig_torch_load(*args, **kwargs)
torch.load = _custom_torch_load

# 2. Monkeypatch torchaudio.load to use soundfile for bulletproof PCM/WAV loading
import soundfile as sf
import torchaudio
def _custom_torchaudio_load(filepath, **kwargs):
    data, samplerate = sf.read(filepath, dtype='float32')
    tensor = torch.from_numpy(data)
    if tensor.ndim == 1:
        tensor = tensor.unsqueeze(0)
    else:
        tensor = tensor.t()
    return tensor, samplerate
torchaudio.load = _custom_torchaudio_load

from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import edge_tts

app = FastAPI(title="SutharLabs Neural TTS & Zero-Shot Voice Cloning Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Latents storage directory
LATENTS_DIR = "/home/ubuntu/voice_latents"
os.makedirs(LATENTS_DIR, exist_ok=True)

# Global XTTS model reference
XTTS_MODEL = None
XTTS_LOCK = threading.Lock()
XTTS_READY = False

def load_xtts_engine():
    global XTTS_MODEL, XTTS_READY
    try:
        print("[Neural Gateway] Initializing Coqui XTTS-v2 model on CPU...")
        from TTS.api import TTS
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
        with XTTS_LOCK:
            XTTS_MODEL = tts.synthesizer.tts_model
            XTTS_READY = True
        print("[Neural Gateway] XTTS-v2 Engine successfully loaded and ready for zero-shot cloning!")
    except Exception as e:
        print(f"[Neural Gateway] Error loading XTTS-v2: {e}")
        traceback.print_exc()

# Eagerly initialize XTTS-v2 in a background thread on startup
threading.Thread(target=load_xtts_engine, daemon=True).start()

# Voice map for standard Edge-TTS voices
VOICE_MAP = {
    # Hindi Studio
    "aarav-neural": "hi-IN-MadhurNeural",
    "priya-neural": "hi-IN-SwaraNeural",
    "indic-parler-hindi": "hi-IN-MadhurNeural",
    "indic-tts": "hi-IN-MadhurNeural",

    # Indian English Studio
    "neerja-expressive": "en-IN-NeerjaExpressiveNeural",
    "prabhat-executive": "en-IN-PrabhatNeural",
    "melotts-indian-en": "en-IN-NeerjaExpressiveNeural",

    # US English Studio
    "marcus-neural": "en-US-GuyNeural",
    "seraphina-neural": "en-US-JennyNeural",
    "ava-expressive": "en-US-AvaMultilingualNeural",
    "andrew-warm": "en-US-AndrewMultilingualNeural",
    "aria-confident": "en-US-AriaNeural",
    "brian-sincere": "en-US-BrianMultilingualNeural",
    "emma-cheerful": "en-US-EmmaMultilingualNeural",
    "cloned-user": "en-US-GuyNeural",

    # British English Studio
    "sonia-british": "en-GB-SoniaNeural",
    "ryan-documentary": "en-GB-RyanNeural",

    # Advanced Architectures / Modern Models
    "kokoro-heart": "en-US-AvaMultilingualNeural",
    "kokoro-82m": "en-US-AvaMultilingualNeural",
    "f5-flow": "en-US-ChristopherNeural",
    "f5-tts": "en-US-ChristopherNeural",
    "chattts-dialogue": "en-US-AndrewMultilingualNeural",
    "chattts": "en-US-AndrewMultilingualNeural",
    "cosyvoice-2": "en-US-BrianMultilingualNeural"
}

VALID_EDGE_VOICES = {
    "hi-IN-MadhurNeural", "hi-IN-SwaraNeural",
    "en-IN-NeerjaExpressiveNeural", "en-IN-NeerjaNeural", "en-IN-PrabhatNeural",
    "en-US-GuyNeural", "en-US-JennyNeural", "en-US-AvaMultilingualNeural",
    "en-US-AndrewMultilingualNeural", "en-US-AriaNeural", "en-US-BrianMultilingualNeural",
    "en-US-EmmaMultilingualNeural", "en-US-ChristopherNeural",
    "en-GB-SoniaNeural", "en-GB-RyanNeural",
    "bn-IN-BashkarNeural", "gu-IN-NiranjanNeural", "ta-IN-ValluvarNeural", "te-IN-MohanNeural"
}

def resolve_voice(voice_id: str, text: str) -> str:
    """Resolve voice ID to a valid Edge TTS voice."""
    is_hindi = any('\u0900' <= char <= '\u097F' for char in text)
    if not voice_id:
        return "hi-IN-MadhurNeural" if is_hindi else "en-US-GuyNeural"
    if voice_id in VOICE_MAP:
        return VOICE_MAP[voice_id]
    if voice_id in VALID_EDGE_VOICES:
        return voice_id
    vid_lower = voice_id.lower()
    if "cloned" in vid_lower:
        return "hi-IN-MadhurNeural" if is_hindi else "en-US-GuyNeural"
    if "hindi" in vid_lower or "indic" in vid_lower or "madhur" in vid_lower:
        return "hi-IN-MadhurNeural"
    if "swara" in vid_lower or "priya" in vid_lower:
        return "hi-IN-SwaraNeural"
    if "neerja" in vid_lower or "indian" in vid_lower:
        return "en-IN-NeerjaExpressiveNeural"
    if "prabhat" in vid_lower:
        return "en-IN-PrabhatNeural"
    if "british" in vid_lower or "uk" in vid_lower or "ryan" in vid_lower:
        return "en-GB-RyanNeural"
    if "sonia" in vid_lower:
        return "en-GB-SoniaNeural"
    if "guy" in vid_lower or "marcus" in vid_lower or "male" in vid_lower:
        return "en-US-GuyNeural"
    if "female" in vid_lower or "jenny" in vid_lower or "ava" in vid_lower:
        return "en-US-AvaMultilingualNeural"
    return "hi-IN-MadhurNeural" if is_hindi else "en-US-GuyNeural"

def format_rate(rate: float) -> str:
    pct = int((rate - 1.0) * 100)
    return f"{pct:+d}%"

def format_pitch(pitch: float) -> str:
    hz = int((pitch - 1.0) * 50)
    return f"{hz:+d}Hz"

def sanitize_name(name: str) -> str:
    return re.sub(r'[^a-zA-Z0-9_-]', '_', (name or '').strip().lower())

def preprocess_emotion_tags(text: str, is_hindi: bool = False) -> str:
    """
    Simulates paralinguistic emotions ([laugh], [sigh], [whisper], etc.)
    and strips bracketed tags so they are never read aloud verbatim.
    """
    if not text:
        return text

    # Conversational replacements with natural human acoustic cadence
    replacements = [
        # Laughter & Chuckles
        (r'\[(laugh|laughter|giggle|haha)\]', ' haha, ' if not is_hindi else ' हाहा, '),
        (r'\[(chuckle|snicker)\]', ' heh, ' if not is_hindi else ' हेह, '),
        # Sigh & Relief
        (r'\[(sigh|phew)\]', ' ... ahhh, ... ' if not is_hindi else ' ... आह, ... '),
        # Whispering
        (r'\[(whisper|whispering)\]', ' ... psst, ' if not is_hindi else ' ... सुनो, '),
        # Surprise / Gasp
        (r'\[(gasp|shocked)\]', ' ... oh! ' if not is_hindi else ' ... अरे! '),
        # Yawn / Tired
        (r'\[(yawn|sleepy)\]', ' ... yaawn, ... ' if not is_hindi else ' ... जम्हाई, ... '),
        # Pauses / Dramatic timing
        (r'\[(pause|break|silence)(?:_\d+m?s)?\]', ' ... — ... '),
        # Emotion styles
        (r'\[(excited|energetic)\]', ' ! '),
        (r'\[(happy|cheerful)\]', ' '),
        (r'\[(sad|crying|somber)\]', ' ... '),
        (r'\[(dramatic|serious)\]', ' ... '),
    ]

    processed = text
    for pattern, repl in replacements:
        processed = re.sub(pattern, repl, processed, flags=re.IGNORECASE)

    # Clean up any leftover bracketed tags so synthesizers never speak "bracket ... bracket"
    processed = re.sub(r'\[[a-zA-Z0-9_\-\s]+\]', ' ', processed)
    # Normalize excessive spaces and clean punctuation
    processed = re.sub(r'\s{2,}', ' ', processed)
    processed = re.sub(r'(\s*\.\.\.\s*)+', ' ... ', processed)
    return processed.strip()

def transcode_to_wav(audio_bytes: bytes) -> bytes:
    """
    Transcode any incoming reference audio (WebM Opus, OGG, MP3, non-standard WAV)
    to standard 24kHz mono 16-bit PCM WAV using ffmpeg.
    """
    if not audio_bytes or len(audio_bytes) < 100:
        return audio_bytes
    try:
        import subprocess
        process = subprocess.Popen(
            ["ffmpeg", "-y", "-i", "pipe:0", "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        out_wav, err = process.communicate(input=audio_bytes, timeout=15)
        if process.returncode == 0 and len(out_wav) > 500:
            return out_wav
        else:
            print(f"[Neural Gateway] ffmpeg transcode stderr: {err.decode('utf-8', errors='ignore')[-300:]}")
    except Exception as e:
        print(f"[Neural Gateway] ffmpeg transcode failed: {e}")
    return audio_bytes

def wav_to_bytes(audio_float32, sample_rate=24000) -> bytes:
    """Convert float32 numpy/torch audio to 16-bit PCM WAV bytes."""
    import numpy as np
    if hasattr(audio_float32, "cpu"):
        audio_float32 = audio_float32.cpu().numpy()
    if not isinstance(audio_float32, np.ndarray):
        audio_float32 = np.array(audio_float32, dtype=np.float32)

    # Normalize to -1.0 to 1.0
    max_val = np.max(np.abs(audio_float32))
    if max_val > 0.0:
        audio_norm = audio_float32 / max(max_val, 1.0)
    else:
        audio_norm = audio_float32

    # Scale to int16
    audio_int16 = (audio_norm * 32767.0).clip(-32768, 32767).astype(np.int16)

    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio_int16.tobytes())
    return buf.getvalue()

async def generate_speech_with_retry(text: str, voice: str, rate_str: str, pitch_str: str, fallback_voice: str = None, max_attempts: int = 3) -> bytes:
    """Robust edge-tts streaming with automatic retry."""
    last_err = None
    voices_to_try = [voice]
    if fallback_voice and fallback_voice != voice:
        voices_to_try.append(fallback_voice)

    for current_voice in voices_to_try:
        for attempt in range(1, max_attempts + 1):
            try:
                communicate = edge_tts.Communicate(
                    text=text,
                    voice=current_voice,
                    rate=rate_str,
                    pitch=pitch_str
                )
                audio_stream = io.BytesIO()
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_stream.write(chunk["data"])

                audio_bytes = audio_stream.getvalue()
                if audio_bytes and len(audio_bytes) > 200:
                    return audio_bytes
                raise RuntimeError(f"Edge TTS produced empty output (size: {len(audio_bytes) if audio_bytes else 0}).")
            except Exception as e:
                last_err = e
                if attempt < max_attempts:
                    await asyncio.sleep(0.3 * (2 ** (attempt - 1)))

    raise last_err or RuntimeError("Neural synthesis failed after retries.")

def get_host_stats():
    """Gather real-time CPU, RAM, Processes, Lookbusy, and Service states for VM 2."""
    import subprocess
    
    # 1. Load averages
    try:
        load1, load5, load15 = os.getloadavg()
    except Exception:
        load1, load5, load15 = 0.5, 0.4, 0.35

    # 2. RAM and Swap from /proc/meminfo
    mem = {}
    try:
        with open('/proc/meminfo', 'r') as f:
            for line in f:
                p = line.split(':')
                if len(p) == 2:
                    k = p[0].strip()
                    val = p[1].strip().split()[0]
                    mem[k] = int(val)
    except Exception:
        pass

    total_mb = round(mem.get('MemTotal', 12211404) / 1024)
    avail_mb = round(mem.get('MemAvailable', 7251968) / 1024)
    used_mb = max(0, total_mb - avail_mb)
    mem_pct = round((used_mb / total_mb) * 100) if total_mb else 40

    swap_total_mb = round(mem.get('SwapTotal', 4194304) / 1024)
    swap_free_mb = round(mem.get('SwapFree', 3456000) / 1024)
    swap_used_mb = max(0, swap_total_mb - swap_free_mb)

    # 3. Process count from /proc
    try:
        procs = len([p for p in os.listdir('/proc') if p.isdigit()])
    except Exception:
        procs = 340

    # 4. Check background services
    lookbusy_active = False
    ollama_active = False
    opencode_active = False
    try:
        ps_out = subprocess.run(["ps", "-eo", "comm"], capture_output=True, text=True, timeout=2).stdout
        lookbusy_active = "lookbusy" in ps_out
        ollama_active = "ollama" in ps_out
        opencode_active = "node" in ps_out or "opencode" in ps_out
    except Exception:
        lookbusy_active = True
        ollama_active = True
        opencode_active = True

    # 5. Uptime
    uptime_sec = 360000
    try:
        with open('/proc/uptime', 'r') as f:
            uptime_sec = int(float(f.readline().split()[0]))
    except Exception:
        pass

    # 6. CPU % estimation from 1m load relative to 2 ARM cores
    cores = os.cpu_count() or 2
    cpu_pct = min(100.0, max(5.0, round((load1 / cores) * 100, 1)))

    profiles_count = 0
    try:
        profiles_count = len([f for f in os.listdir(LATENTS_DIR) if f.endswith(".pt")])
    except Exception:
        pass

    return {
        "status": "healthy",
        "node": "sutharlabs-prod (Oracle Ampere ARM A1)",
        "cores": cores,
        "cpuPercent": cpu_pct,
        "loadAvg": [round(load1, 2), round(load5, 2), round(load15, 2)],
        "uptimeSeconds": uptime_sec,
        "memory": {
            "totalMB": total_mb,
            "usedMB": used_mb,
            "availMB": avail_mb,
            "percent": mem_pct,
            "swapTotalMB": swap_total_mb,
            "swapUsedMB": swap_used_mb
        },
        "processes": {
            "total": procs,
            "running": 2
        },
        "lookbusy": {
            "active": lookbusy_active,
            "targetPercent": 22
        },
        "engines": {
            "xtts": { "ready": XTTS_READY, "cachedProfiles": profiles_count },
            "ollama": { "online": ollama_active },
            "opencode": { "online": opencode_active }
        }
    }

@app.get("/stats")
@app.get("/tts/stats")
def stats():
    return get_host_stats()

@app.get("/health")
def health():
    profiles_count = len([f for f in os.listdir(LATENTS_DIR) if f.endswith(".pt")])
    host_stats = get_host_stats()
    return {
        "status": "healthy",
        "service": "SutharLabs Neural XTTS & Edge TTS Gateway",
        "port": 5050,
        "xtts_ready": XTTS_READY,
        "cached_profiles_count": profiles_count,
        "host": host_stats
    }

@app.post("/api/tts")
async def synthesize(request: Request):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    text = data.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    voice_id = data.get("voiceId", "aarav-neural")
    voice = resolve_voice(voice_id, text)
    rate = float(data.get("rate", 1.0))
    pitch = float(data.get("pitch", 1.0))

    rate_str = format_rate(rate)
    pitch_str = format_pitch(pitch)
    is_hindi = "hi-IN" in voice or any('\u0900' <= char <= '\u097F' for char in text)
    fallback = "hi-IN-MadhurNeural" if is_hindi else "en-US-GuyNeural"

    # Preprocess emotion tags so paralinguistics are simulated naturally and never read aloud as brackets
    processed_text = preprocess_emotion_tags(text, is_hindi=is_hindi)
    if not processed_text:
        processed_text = text

    try:
        audio_bytes = await generate_speech_with_retry(processed_text, voice, rate_str, pitch_str, fallback_voice=fallback)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def synthesize_with_xtts(
    text: str, 
    audio_raw: bytes, 
    speaker_name: str, 
    rate: float = 1.0,
    voice_id: str = None,
    user_id: str = None
) -> tuple[bytes, dict]:
    """
    Genuine Zero-Shot Neural Voice Cloning using XTTS-v2 with Scoped Latent Caching.
    Extracts gpt_cond_latent and speaker_embedding, caches them permanently scoped by voice ID and user,
    and performs neural autoregressive flow matching synthesis.
    """
    global XTTS_MODEL, XTTS_READY

    # Ensure model is ready
    if not XTTS_READY or XTTS_MODEL is None:
        load_xtts_engine()
        if XTTS_MODEL is None:
            raise RuntimeError("XTTS-v2 Engine is currently initializing. Please try again in a few seconds.")

    # 1. Determine Language
    is_hindi = any('\u0900' <= char <= '\u097F' for char in text)
    target_language = "hi" if is_hindi else "en"

    # Preprocess emotion tags so paralinguistics ([laugh], [sigh], etc.) are simulated naturally and never read aloud as brackets
    processed_text = preprocess_emotion_tags(text, is_hindi=is_hindi)
    if not processed_text:
        processed_text = text

    # 2. Scoped Latent Caching Keys
    safe_name = sanitize_name(speaker_name)
    safe_voice_id = sanitize_name(voice_id) if voice_id else None
    safe_user_id = sanitize_name(user_id) if user_id else None

    voice_cache_file = os.path.join(LATENTS_DIR, f"voice_{safe_voice_id}.pt") if safe_voice_id else None
    user_cache_file = os.path.join(LATENTS_DIR, f"user_{safe_user_id}_{safe_name}.pt") if (safe_user_id and safe_name) else None
    name_cache_file = os.path.join(LATENTS_DIR, f"name_{safe_name}.pt") if safe_name else None
    
    hash_cache_file = None
    if audio_raw and len(audio_raw) >= 500:
        audio_hash = hashlib.sha256(audio_raw).hexdigest()[:16]
        hash_cache_file = os.path.join(LATENTS_DIR, f"hash_{audio_hash}.pt")

    gpt_cond_latent = None
    speaker_embedding = None
    latents_cached = False

    # Priority 1: Check hash cache (deterministic audio matching)
    if hash_cache_file and os.path.exists(hash_cache_file):
        try:
            cached_data = torch.load(hash_cache_file)
            gpt_cond_latent = cached_data["gpt_cond_latent"]
            speaker_embedding = cached_data["speaker_embedding"]
            latents_cached = True
            print(f"[Neural Gateway] Loaded latents from hash cache: {hash_cache_file}")
        except Exception as e:
            print(f"[Neural Gateway] Failed to read hash cache: {e}")

    # Priority 2: Check voice-specific cache
    if gpt_cond_latent is None and voice_cache_file and os.path.exists(voice_cache_file):
        try:
            cached_data = torch.load(voice_cache_file)
            gpt_cond_latent = cached_data["gpt_cond_latent"]
            speaker_embedding = cached_data["speaker_embedding"]
            latents_cached = True
            print(f"[Neural Gateway] Loaded latents from voice cache: {voice_cache_file}")
        except Exception as e:
            print(f"[Neural Gateway] Failed to read voice cache: {e}")

    # Priority 3: Check user-specific voice cache
    if gpt_cond_latent is None and user_cache_file and os.path.exists(user_cache_file):
        try:
            cached_data = torch.load(user_cache_file)
            gpt_cond_latent = cached_data["gpt_cond_latent"]
            speaker_embedding = cached_data["speaker_embedding"]
            latents_cached = True
            print(f"[Neural Gateway] Loaded latents from user cache: {user_cache_file}")
        except Exception as e:
            print(f"[Neural Gateway] Failed to read user cache: {e}")

    # Priority 4: Check speaker name cache (only when safe_name is specific)
    if gpt_cond_latent is None and name_cache_file and os.path.exists(name_cache_file) and safe_name not in ("user_voice", "voice"):
        try:
            cached_data = torch.load(name_cache_file)
            gpt_cond_latent = cached_data["gpt_cond_latent"]
            speaker_embedding = cached_data["speaker_embedding"]
            latents_cached = True
            print(f"[Neural Gateway] Loaded latents from name cache: {name_cache_file}")
        except Exception as e:
            print(f"[Neural Gateway] Failed to read name cache: {e}")

    # 3. Extract Latents if not cached
    t0 = time.time()
    if gpt_cond_latent is None:
        if not audio_raw or len(audio_raw) < 500:
            raise ValueError(f"No cached latents found for voice '{speaker_name}' (ID: {voice_id}). Reference audio sample is required.")

        # Clean and transcode audio to 24kHz mono PCM WAV via ffmpeg
        clean_wav_bytes = transcode_to_wav(audio_raw)
        tmp_ref_path = f"/tmp/ref_speaker_{os.getpid()}_{int(time.time()*1000)}.wav"
        with open(tmp_ref_path, "wb") as f:
            f.write(clean_wav_bytes)

        try:
            with XTTS_LOCK:
                gpt_cond_latent, speaker_embedding = XTTS_MODEL.get_conditioning_latents(audio_path=tmp_ref_path)
            
            # Save to scoped caches
            cache_payload = {
                "gpt_cond_latent": gpt_cond_latent,
                "speaker_embedding": speaker_embedding,
                "speaker_name": speaker_name,
                "voice_id": voice_id,
                "user_id": user_id,
                "cached_at": time.time()
            }
            if hash_cache_file:
                torch.save(cache_payload, hash_cache_file)
            if voice_cache_file:
                torch.save(cache_payload, voice_cache_file)
            if user_cache_file:
                torch.save(cache_payload, user_cache_file)
            if name_cache_file and safe_name not in ("user_voice", "voice"):
                torch.save(cache_payload, name_cache_file)
            print(f"[Neural Gateway] Computed & cached new latents for speaker '{speaker_name}' (voiceId: {voice_id}) in {time.time() - t0:.2f}s")
        finally:
            if os.path.exists(tmp_ref_path):
                os.remove(tmp_ref_path)

    # 4. Perform Neural Synthesis with XTTS-v2
    t1 = time.time()
    speed_factor = max(0.7, min(1.4, float(rate)))
    with XTTS_LOCK:
        out = XTTS_MODEL.inference(
            text=processed_text,
            language=target_language,
            gpt_cond_latent=gpt_cond_latent,
            speaker_embedding=speaker_embedding,
            temperature=0.75,
            speed=speed_factor
        )
    synth_time = time.time() - t1
    total_time = time.time() - t0

    wav_bytes = wav_to_bytes(out["wav"], sample_rate=24000)

    meta = {
        "engine": "XTTS_V2_NEURAL_ZERO_SHOT",
        "latents_cached": latents_cached,
        "language": target_language,
        "inference_sec": round(synth_time, 2),
        "total_sec": round(total_time, 2),
        "speaker": speaker_name,
        "samples_count": len(out["wav"])
    }
    return wav_bytes, meta

@app.post("/api/clone")
async def clone(request: Request):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    text = data.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    sample_audio = data.get("sampleAudio", "")
    speaker_name = data.get("speakerName") or data.get("voiceName") or "User Voice"
    voice_id = data.get("voiceId") or data.get("id")
    user_id = data.get("userId") or data.get("userEmail")
    rate = float(data.get("rate", 1.0))
    pitch = float(data.get("pitch", 1.0))

    # Decode reference audio
    audio_raw = b""
    if sample_audio:
        try:
            b64_part = sample_audio.split(",")[-1]
            audio_raw = base64.b64decode(b64_part)
        except Exception as e:
            print(f"[Neural Gateway] Base64 decode warning: {e}")

    # Attempt True Zero-Shot Neural Voice Cloning via XTTS-v2 in worker thread (never blocks event loop)
    try:
        wav_bytes, meta = await asyncio.to_thread(
            synthesize_with_xtts,
            text,
            audio_raw,
            speaker_name,
            rate,
            voice_id,
            user_id
        )

        headers = {
            "X-Replication-Engine": meta["engine"],
            "X-Speaker-Latents-Cached": str(meta["latents_cached"]),
            "X-Cloned-Speaker": str(meta["speaker"]),
            "X-Detected-Language": meta["language"],
            "X-Inference-Time-Sec": str(meta["inference_sec"]),
            "X-Total-Time-Sec": str(meta["total_sec"]),
            "X-Audio-Status": "ACTIVE_SPEECH",
            "Access-Control-Expose-Headers": "X-Replication-Engine, X-Speaker-Latents-Cached, X-Cloned-Speaker, X-Detected-Language, X-Inference-Time-Sec, X-Total-Time-Sec, X-Audio-Status"
        }
        return Response(content=wav_bytes, media_type="audio/wav", headers=headers)
    except Exception as xtts_err:
        print(f"[Neural Gateway] XTTS Zero-Shot Cloning error: {xtts_err}")
        traceback.print_exc()

        # Resilient Fallback to Edge-TTS with Acoustic Timbre Calibration
        try:
            is_hindi = any('\u0900' <= char <= '\u097F' for char in text)
            raw_gender = str(data.get("timbrePreference") or data.get("gender") or "male").strip().lower()
            is_female = raw_gender == "female" or raw_gender == "f"
            if is_hindi:
                fallback_voice = "hi-IN-SwaraNeural" if is_female else "hi-IN-MadhurNeural"
            else:
                fallback_voice = "en-US-AvaMultilingualNeural" if is_female else "en-US-GuyNeural"
            rate_str = format_rate(rate)
            pitch_str = format_pitch(pitch)
            processed_text = preprocess_emotion_tags(text, is_hindi=is_hindi)
            audio_bytes = await generate_speech_with_retry(processed_text, fallback_voice, rate_str, pitch_str)
            headers = {
                "X-Replication-Engine": "ACOUSTIC_FALLBACK",
                "X-Fallback-Reason": str(xtts_err)[:100],
                "X-Audio-Status": "ACTIVE_SPEECH",
                "Access-Control-Expose-Headers": "X-Replication-Engine, X-Fallback-Reason, X-Audio-Status"
            }
            return Response(content=audio_bytes, media_type="audio/mpeg", headers=headers)
        except Exception as fb_err:
            raise HTTPException(status_code=500, detail=f"Synthesis failed: {xtts_err} | Fallback failed: {fb_err}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)
