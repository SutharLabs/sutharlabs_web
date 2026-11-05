# Sovereign Neural Speech Engine Documentation

Welcome to the **SutharLabs Speech Studio** documentation suite.

---

## Directory Contents

| Document | Description |
|---|---|
| **[TTS Architecture & Models](file:///d:/Code/SutharLabs/website/docs/speech/tts_architecture_and_models.md)** | Technical architecture of the Edge TTS daemon on VM 2 (`132.226.190.125:5050`), architecture mapping (IndicParler, MeloTTS, Kokoro, ChatTTS, CosyVoice), Devanagari script detection, and commercial licensing audit. |
| **[Voice Cloning & Calibration](file:///d:/Code/SutharLabs/website/docs/speech/voice_cloning_and_calibration.md)** | Zero-shot voice cloning pipeline, standardized phonetic calibration test prompt, acoustic timbre fingerprinting, and multi-profile library. |

---

## Fleet Daemons & Ports
- **Daemon**: `neural-tts` (Python 3.10 `edge-tts` async HTTP service)
- **Host**: Oracle Cloud VM 2 (`132.226.190.125:5050`)
- **Process Manager**: PM2 (`pm2 status neural-tts`)
- **Reverse Proxy**: Nginx on VM 2 proxying `/tts/api/` $\rightarrow$ `http://127.0.0.1:5050/api/`

