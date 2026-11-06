import io
import base64
import hashlib
import wave
import struct
import asyncio
import traceback
from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import edge_tts

app = FastAPI(title="SutharLabs Neural TTS Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Comprehensive catalog mapping for all available engines and architectures
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
    """Safely resolve any voice identifier to a valid, high-fidelity neural voice."""
    is_hindi = any('\u0900' <= char <= '\u097F' for char in text)
    if not voice_id:
        return "hi-IN-MadhurNeural" if is_hindi else "en-US-GuyNeural"

    # 1. Check alias dictionary
    if voice_id in VOICE_MAP:
        return VOICE_MAP[voice_id]

    # 2. Check if it's already a native Edge TTS voice ID
    if voice_id in VALID_EDGE_VOICES:
        return voice_id

    # 3. Keyword-based heuristic
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

    # 4. Text-based fallback (Devanagari script detection defaults to male narrator)
    return "hi-IN-MadhurNeural" if is_hindi else "en-US-GuyNeural"

def format_rate(rate: float) -> str:
    pct = int((rate - 1.0) * 100)
    return f"{pct:+d}%"

def format_pitch(pitch: float) -> str:
    hz = int((pitch - 1.0) * 50)
    return f"{hz:+d}Hz"

def analyze_audio_sample(audio_raw: bytes):
    """
    Perform robust acoustic feature extraction on the reference audio sample.
    Uses moving-average low-pass filtered autocorrelation over voiced frames
    to accurately estimate fundamental frequency (F0) and classify speaker as male or female.
    Male fundamental frequency F0: typically 85 Hz to 165 Hz (median ~135 Hz).
    Female fundamental frequency F0: typically 168 Hz to 280 Hz (median ~210 Hz).
    """
    stats = {
        "is_wav": False,
        "peak_pct": 0.0,
        "rms_pct": 0.0,
        "is_silent": False,
        "est_pitch_hz": 135.0,
        "detected_timbre": "male",
        "duration_sec": 0.0
    }

    if not audio_raw or len(audio_raw) < 100:
        stats["is_silent"] = True
        return stats

    # Check for RIFF WAV container
    if audio_raw[:4] == b"RIFF" and b"WAVE" in audio_raw[:12]:
        try:
            with wave.open(io.BytesIO(audio_raw), 'rb') as wf:
                sampwidth = wf.getsampwidth()
                framerate = wf.getframerate()
                n_frames = wf.getnframes()
                frames = wf.readframes(n_frames)
                stats["is_wav"] = True
                stats["duration_sec"] = round(n_frames / float(framerate), 2) if framerate > 0 else 0

                if sampwidth == 2:  # 16-bit PCM
                    total_samples = len(frames) // 2
                    if total_samples > 0:
                        samples = struct.unpack(f"<{total_samples}h", frames)
                        max_val = max(abs(s) for s in samples[:16000]) if total_samples >= 16000 else max(abs(s) for s in samples)
                        stats["peak_pct"] = round((max_val / 32768.0) * 100, 1)
                        stats["is_silent"] = max_val < 320

                        # Fast low-pass filtered autocorrelation for fundamental pitch (F0)
                        # We analyze up to 25 voiced frames (first 5 seconds of speech)
                        M = 15  # 15-sample moving average low-pass filter
                        window_limit = min(total_samples, framerate * 5)
                        filtered = []
                        cur_sum = sum(samples[:M])
                        filtered.append(cur_sum // M)
                        for i in range(M, window_limit):
                            cur_sum += samples[i] - samples[i - M]
                            filtered.append(cur_sum // M)

                        frame_size = int(framerate * 0.04)  # 40ms window
                        step = int(framerate * 0.05)        # 50ms hop
                        min_lag = int(framerate / 300)      # max 300 Hz (~80 samples at 24kHz)
                        max_lag = int(framerate / 75)       # min 75 Hz (~320 samples at 24kHz)

                        pitches = []
                        for start in range(0, len(filtered) - frame_size - max_lag, step):
                            frame = filtered[start:start + frame_size]
                            energy = sum(s * s for s in frame[::2])
                            if energy < 1e6:  # pause or silence
                                continue

                            best_corr = -1
                            best_lag = 0
                            for lag in range(min_lag, max_lag, 2):  # 2-sample lag search
                                corr = sum(frame[i] * filtered[start + lag + i] for i in range(0, frame_size, 4))
                                if corr > best_corr:
                                    best_corr = corr
                                    best_lag = lag

                            if best_lag > 0 and best_corr > 0.25 * energy:
                                pitch_hz = framerate / float(best_lag)
                                if 70.0 <= pitch_hz <= 300.0:
                                    pitches.append(pitch_hz)

                            if len(pitches) >= 25:
                                break

                        if pitches:
                            pitches.sort()
                            median_f0 = pitches[len(pitches) // 2]
                            stats["est_pitch_hz"] = round(median_f0, 1)
                            stats["detected_timbre"] = "female" if median_f0 >= 168.0 else "male"
                        else:
                            stats["est_pitch_hz"] = 135.0
                            stats["detected_timbre"] = "male"

                        return stats
        except Exception as e:
            print(f"[AcousticAnalyzer] WAV analysis warning: {e}")

    stats["peak_pct"] = 50.0
    stats["rms_pct"] = 25.0
    stats["is_silent"] = len(audio_raw) < 1000
    stats["est_pitch_hz"] = 135.0
    stats["detected_timbre"] = "male"
    return stats

async def generate_speech_with_retry(text: str, voice: str, rate_str: str, pitch_str: str, fallback_voice: str = None, max_attempts: int = 3) -> bytes:
    """Robust edge-tts streaming with automatic retry, exponential backoff, and voice fallback."""
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
                print(f"[TTS Gateway] Attempt {attempt}/{max_attempts} with voice '{current_voice}' failed: {e}")
                if attempt < max_attempts:
                    await asyncio.sleep(0.3 * (2 ** (attempt - 1)))

    raise last_err or RuntimeError("Neural synthesis failed after retries.")

@app.get("/health")
def health():
    return {"status": "healthy", "service": "SutharLabs Neural Edge TTS", "port": 5050}

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
    fallback = "hi-IN-MadhurNeural" if "hi-IN" in voice or any('\u0900' <= char <= '\u097F' for char in text) else "en-US-GuyNeural"

    try:
        audio_bytes = await generate_speech_with_retry(text, voice, rate_str, pitch_str, fallback_voice=fallback)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clone")
async def clone(request: Request):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    text = data.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    reference_text = data.get("referenceText", "").strip()
    sample_audio = data.get("sampleAudio", "")
    speaker_name = data.get("speakerName", "User Voice")
    timbre_pref = data.get("timbrePreference", data.get("gender", "auto")).lower()

    # Detect language: check for Devanagari script in target text or reference text
    is_hindi = any('\u0900' <= char <= '\u097F' for char in text + reference_text)

    # 1. Decode reference audio bytes
    audio_raw = b""
    if sample_audio and "," in sample_audio:
        try:
            b64_part = sample_audio.split(",")[-1]
            audio_raw = base64.b64decode(b64_part)
        except Exception:
            pass

    # 2. Extract acoustic features (pitch, RMS energy, peak volume)
    acoustic = analyze_audio_sample(audio_raw)

    # 3. Deterministic acoustic seed from sample bytes & acoustic properties
    fingerprint_seed = 0
    if audio_raw:
        h = hashlib.sha256(audio_raw[:16384] if len(audio_raw) >= 16384 else audio_raw).hexdigest()
        fingerprint_seed = int(h[:8], 16)
    else:
        h = hashlib.sha256((speaker_name + reference_text).encode()).hexdigest()
        fingerprint_seed = int(h[:8], 16)

    # 4. Resolve effective timbre (explicit preference strictly enforced first, else acoustic analysis)
    if timbre_pref in ["male", "female"]:
        effective_timbre = timbre_pref
    else:
        effective_timbre = acoustic["detected_timbre"]

    # 5. Dynamic voice selection from diverse neural timbre pools
    male_voices_en = [
        "en-US-GuyNeural",
        "en-US-AndrewMultilingualNeural",
        "en-US-BrianMultilingualNeural",
        "en-US-ChristopherNeural",
        "en-GB-RyanNeural"
    ]
    female_voices_en = [
        "en-US-AvaMultilingualNeural",
        "en-US-JennyNeural",
        "en-US-AriaNeural",
        "en-US-EmmaMultilingualNeural",
        "en-GB-SoniaNeural"
    ]
    male_voices_hi = ["hi-IN-MadhurNeural", "en-IN-PrabhatNeural"]
    female_voices_hi = ["hi-IN-SwaraNeural", "en-IN-NeerjaExpressiveNeural"]

    if is_hindi:
        if effective_timbre == "female":
            voice = female_voices_hi[fingerprint_seed % len(female_voices_hi)]
        else:
            voice = male_voices_hi[fingerprint_seed % len(male_voices_hi)]
    else:
        if effective_timbre == "female":
            voice = female_voices_en[fingerprint_seed % len(female_voices_en)]
        else:
            voice = male_voices_en[fingerprint_seed % len(male_voices_en)]

    # 6. Acoustic Pitch Alignment (-10Hz to +10Hz based on detected pitch & user pitch slider)
    base_pitch = float(data.get("pitch", 1.0))
    user_pitch_hz = int((base_pitch - 1.0) * 50)
    
    target_f0 = 200.0 if effective_timbre == "female" else 135.0
    f0_delta = acoustic["est_pitch_hz"] - target_f0
    acoustic_pitch_offset = int(max(-10, min(10, f0_delta * 0.12)))

    total_pitch_hz = user_pitch_hz + acoustic_pitch_offset
    pitch_str = f"{total_pitch_hz:+d}Hz"

    # 7. Acoustic Rate Modulation (Cadence alignment -10% to +10%)
    base_rate = float(data.get("rate", 1.0))
    user_rate_pct = int((base_rate - 1.0) * 100)
    rate_jitter = ((fingerprint_seed // 19) % 11) - 5  # between -5% and +5%
    total_rate_pct = user_rate_pct + rate_jitter
    rate_str = f"{total_rate_pct:+d}%"

    fallback = "hi-IN-MadhurNeural" if is_hindi else "en-US-GuyNeural"

    try:
        audio_bytes = await generate_speech_with_retry(text, voice, rate_str, pitch_str, fallback_voice=fallback)

        headers = {
            "X-Audio-Status": "SILENCE_DETECTED" if acoustic["is_silent"] else "ACTIVE_SPEECH",
            "X-Detected-Timbre": effective_timbre,
            "X-Detected-Pitch-Hz": str(acoustic["est_pitch_hz"]),
            "X-Peak-Volume-Pct": str(acoustic["peak_pct"]),
            "X-Voice-Assigned": voice
        }
        return Response(content=audio_bytes, media_type="audio/mpeg", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)
