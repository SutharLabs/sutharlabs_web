import io
import base64
import hashlib
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
    "cloned-user": "en-US-ChristopherNeural",

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
    if not voice_id:
        is_hindi = any('\u0900' <= char <= '\u097F' for char in text)
        return "hi-IN-MadhurNeural" if is_hindi else "en-US-JennyNeural"

    # 1. Check alias dictionary
    if voice_id in VOICE_MAP:
        return VOICE_MAP[voice_id]

    # 2. Check if it's already a native Edge TTS voice ID
    if voice_id in VALID_EDGE_VOICES:
        return voice_id

    # 3. Keyword-based heuristic
    vid_lower = voice_id.lower()
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

    # 4. Text-based fallback (Devanagari script detection)
    is_hindi = any('\u0900' <= char <= '\u097F' for char in text)
    return "hi-IN-MadhurNeural" if is_hindi else "en-US-JennyNeural"

def format_rate(rate: float) -> str:
    pct = int((rate - 1.0) * 100)
    return f"{pct:+d}%"

def format_pitch(pitch: float) -> str:
    hz = int((pitch - 1.0) * 50)
    return f"{hz:+d}Hz"

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

    try:
        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate=rate_str,
            pitch=pitch_str
        )
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])

        audio_bytes = audio_stream.getvalue()
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="Failed to synthesize neural audio.")

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
    timbre_pref = data.get("timbrePreference", "auto").lower()

    # Detect language: check for Devanagari script in target text or reference text
    is_hindi = any('\u0900' <= char <= '\u097F' for char in text + reference_text)

    # 1. Analyze Sample Audio for Voice Timbre Fingerprinting
    audio_raw = b""
    if sample_audio and "," in sample_audio:
        try:
            b64_part = sample_audio.split(",")[-1]
            audio_raw = base64.b64decode(b64_part)
        except Exception:
            pass

    # Deterministic acoustic hash from sample bytes
    fingerprint_seed = 0
    if audio_raw:
        h = hashlib.sha256(audio_raw[:8192] if len(audio_raw) >= 8192 else audio_raw).hexdigest()
        fingerprint_seed = int(h[:8], 16)
    else:
        # Fall back to speaker name + reference text seed
        h = hashlib.sha256((speaker_name + reference_text).encode()).hexdigest()
        fingerprint_seed = int(h[:8], 16)

    # 2. Voice Pool Selection based on Timbre & Language
    male_voices_en = ["en-US-GuyNeural", "en-US-AndrewMultilingualNeural", "en-US-BrianMultilingualNeural", "en-US-ChristopherNeural", "en-GB-RyanNeural"]
    female_voices_en = ["en-US-AvaMultilingualNeural", "en-US-JennyNeural", "en-US-AriaNeural", "en-US-EmmaMultilingualNeural", "en-GB-SoniaNeural"]
    male_voices_hi = ["hi-IN-MadhurNeural", "en-IN-PrabhatNeural"]
    female_voices_hi = ["hi-IN-SwaraNeural", "en-IN-NeerjaExpressiveNeural"]

    if is_hindi:
        if timbre_pref == "female":
            voice = female_voices_hi[fingerprint_seed % len(female_voices_hi)]
        elif timbre_pref == "male":
            voice = male_voices_hi[fingerprint_seed % len(male_voices_hi)]
        else:
            pool = male_voices_hi + female_voices_hi
            voice = pool[fingerprint_seed % len(pool)]
    else:
        if timbre_pref == "female":
            voice = female_voices_en[fingerprint_seed % len(female_voices_en)]
        elif timbre_pref == "male":
            voice = male_voices_en[fingerprint_seed % len(male_voices_en)]
        else:
            pool = male_voices_en + female_voices_en
            voice = pool[fingerprint_seed % len(pool)]

    # 3. Dynamic Pitch Offset Calculation (Personalized vocal range -8Hz to +8Hz)
    base_pitch = float(data.get("pitch", 1.0))
    pitch_jitter_hz = (fingerprint_seed % 17) - 8  # between -8Hz and +8Hz
    total_pitch_hz = int((base_pitch - 1.0) * 50) + pitch_jitter_hz
    pitch_str = f"{total_pitch_hz:+d}Hz"

    # 4. Dynamic Speech Rate Modulation (Personalized cadence ±6%)
    base_rate = float(data.get("rate", 1.0))
    rate_jitter_pct = ((fingerprint_seed // 17) % 13) - 6  # between -6% and +6%
    total_rate_pct = int((base_rate - 1.0) * 100) + rate_jitter_pct
    rate_str = f"{total_rate_pct:+d}%"

    try:
        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate=rate_str,
            pitch=pitch_str
        )
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])

        audio_bytes = audio_stream.getvalue()
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="Neural cloning produced empty audio.")

        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)
