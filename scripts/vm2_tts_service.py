import io
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

VOICE_MAP = {
    "aarav-neural": "hi-IN-MadhurNeural",
    "priya-neural": "hi-IN-SwaraNeural",
    "marcus-neural": "en-US-GuyNeural",
    "seraphina-neural": "en-US-JennyNeural",
    "ava-expressive": "en-US-AvaMultilingualNeural",
    "andrew-warm": "en-US-AndrewMultilingualNeural",
    "aria-confident": "en-US-AriaNeural",
    "brian-sincere": "en-US-BrianMultilingualNeural",
    "emma-cheerful": "en-US-EmmaMultilingualNeural",
    "neerja-expressive": "en-IN-NeerjaExpressiveNeural",
    "prabhat-executive": "en-IN-PrabhatNeural",
    "sonia-british": "en-GB-SoniaNeural",
    "ryan-documentary": "en-GB-RyanNeural",
    "cloned-user": "en-US-ChristopherNeural",
    "kokoro-heart": "en-US-AvaMultilingualNeural",
    "f5-flow": "en-US-ChristopherNeural",
    "chattts-dialogue": "en-US-AndrewMultilingualNeural"
}

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
    voice = VOICE_MAP.get(voice_id, voice_id if "-" in voice_id else "en-US-JennyNeural")
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

    voice = "en-US-ChristopherNeural"
    rate = float(data.get("rate", 1.0))
    pitch = float(data.get("pitch", 1.0))

    try:
        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate=format_rate(rate),
            pitch=format_pitch(pitch)
        )
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])

        audio_bytes = audio_stream.getvalue()
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)
