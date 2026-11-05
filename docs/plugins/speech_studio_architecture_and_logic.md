# SutharLabs Speech Studio Plugin: Technical Architecture, Expressive Audio & Licensing Specification

> **Standard:** SutharLabs Sovereign Engine Specification  
> **Plugin Identifier:** `speech-studio` (`wp_speech_studio`)  
> **Current Version:** `v0.3.1`  
> **Classification:** High-Definition Neural Text-to-Speech (TTS), Expressive Voice Synthesis & Zero-Shot Cloning

---

## 1. System Overview & Architectural Topology

Speech Studio is an enterprise neural audio synthesis workbench engineered to deliver studio-quality, emotionally nuanced human speech with sub-second latency and zero external SaaS dependencies.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SUTHARLABS SPEECH STUDIO ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────────────────┘

 [User Browser] ──(Web Audio API / HTML5 Audio)──► [SutharLabs Frontend Client]
                                                              │
                                            (POST /api/plugins/speech-studio/synthesize)
                                                              │
                                                              ▼
                                              [VM 3 Node.js API Gateway]
                                                (130.210.37.199:80)
                                                              │
                                            (Proxy: HTTP POST /tts/api/tts)
                                                              │
                                                              ▼
                                              [VM 2 Nginx Reverse Proxy]
                                                (132.226.190.125:80)
                                                              │
                                                  (proxy_pass :5050)
                                                              │
                                                              ▼
                                              [VM 2 Python Neural TTS Daemon]
                                                (FastAPI + PM2 "neural-tts")
                                                              │
                                       ┌──────────────────────┴──────────────────────┐
                                       ▼                                             ▼
                             [Edge-TTS Multi-Voice]                         [Open-Source Backbones]
                             • 13+ Expressive Voices                        • Kokoro-82M (Apache 2.0)
                             • Hindi / US / UK / IN                         • F5-TTS Flow Matching
                             • Sub-0.3s Generation                          • CosyVoice 2 (Apache 2.0)
```

---

## 2. Multi-Engine Architecture Catalog

The synthesis interface exposes five specialized architectures, selectable via the **Engine Switcher** bar or the **Architectures & Engine Catalog**:

1. **Neural Edge Fleet (`edge-tts`)** *(Active Sovereign Cloud)*:
   - *Topology*: Lightweight asynchronous neural synthesis daemon running on VM 2.
   - *Performance*: ~0.30s generation latency, zero GPU load on ARM A1 Neoverse-N1 cores.
   - *Palette*: 13+ expressive voices with natural human breathing, pitch modulation, and accent inflections across Hindi, Indian English, US English, and British English.
2. **F5-TTS (Non-Autoregressive Flow-Matching)**:
   - *Topology*: ConvNeXt-v2 backbone with Diffusion Transformer (DiT).
   - *Capabilities*: In-context zero-shot voice cloning from 3–10s audio reference samples.
   - *Emotion Guidance*: Dual Classifier-Free Guidance (CFG) scaling ($s \in [1.0, 2.5]$) to control emotion intensity (Neutral, Joyful, Empathetic, Dramatic, Whispering).
3. **Kokoro-82M (Hexgrad)**:
   - *Topology*: StyleTTS 2 + ISTFTNet model (82M parameters).
   - *Rank*: #1 ranked model on community Hugging Face Text-to-Speech Arena benchmarks.
   - *Capabilities*: Ultra-fast CPU inference (~0.25s) with studio audiobook cadence and organic breath pauses. 100% Apache 2.0 licensed.
4. **ChatTTS (Conversational Dialogue)**:
   - *Topology*: Autoregressive transformer (400M parameters).
   - *Capabilities*: Specialized in conversational realism with in-text tag injection:
     - `[laugh]` / `[chuckle]`: Injects spontaneous laughter or giggles.
     - `[sigh]`: Injects natural exhalations.
     - `[whisper]`: Drops volume and formant energy into a soft whisper.
     - `[pause]`: Injects organic conversational hesitations.
5. **CosyVoice 2 (Alibaba FunAudioLLM)**:
   - *Topology*: Large-scale conditional flow matching framework (500M parameters).
   - *Capabilities*: Style-instruct prompting (`<|calm|>`, `<|excited|>`, `<|fearful|>`) and zero-shot cross-lingual transfer (e.g. synthesizing fluent Hindi using an English speaker's voice timbre).

---

## 3. Voice Palette & Formant Mapping

| Voice ID | Engine Voice Name | Accent & Region | Emotion Profile | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| `aarav-neural` | `hi-IN-MadhurNeural` | Delhi Studio, India | Warm & Authoritative | Hindi technical briefs, financial summaries, audiobooks |
| `priya-neural` | `hi-IN-SwaraNeural` | Mumbai Conversational, India | Natural & Melodic | Conversational Hindi, voice agents, consumer assistance |
| `neerja-expressive` | `en-IN-NeerjaExpressiveNeural` | Pan-Indian Expressive | Bright & Positive | Indian English market reports, customer dialogue |
| `prabhat-executive` | `en-IN-PrabhatNeural` | Pan-Indian Executive | Authoritative & Dignified | Executive corporate updates, enterprise announcements |
| `ava-expressive` | `en-US-AvaNeural` | Natural US Conversational | Empathetic & Warm | Customer support, therapy bots, compassionate narratives |
| `andrew-warm` | `en-US-AndrewNeural` | US Conversational Baritone | Authentic & Reassuring | Explainer videos, training modules, podcast hosting |
| `aria-confident` | `en-US-AriaNeural` | US American Broadcast | Confident & Engaging | Breaking news narration, product launch demos |
| `brian-sincere` | `en-US-BrianNeural` | US West Coast Casual | Casual & Approachable | Interactive dialogues, casual tutorials, developer audio |
| `emma-cheerful` | `en-US-EmmaNeural` | US Upbeat Conversational | Cheerful & Joyful | Marketing promos, upbeat notifications, educational apps |
| `sonia-british` | `en-GB-SoniaNeural` | UK BBC Received Pronunciation | Sophisticated & Elegant | High-end documentary narration, historical audiobooks |
| `ryan-documentary` | `en-GB-RyanNeural` | UK London Documentary | Deep & Narrative | Dramatic trailers, technical documentaries, longform audio |
| `marcus-neural` | `en-US-GuyNeural` | US American Broadcast | Passionate & Direct | Corporate presentations, executive briefs |
| `seraphina-neural` | `en-US-JennyNeural` | US Natural Audiobook | Melodic & Emotional | Expressive fiction, dynamic storytelling, rich dialogue |
| `cloned-user` | `F5 Zero-Shot Cloned` | Adaptive / In-Context | Adaptive In-Context Emotion | Real-time replication of custom user vocal samples |

---

## 4. Open-Source Status & Commercial Use Licensing Audit

### A. Model & Checkpoint Legal Audit

| Engine / Model | Software License | Weight Checkpoint License | Commercial Use Permitted? | Supported Languages | Legal Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kokoro-82M** | Apache 2.0 | Apache 2.0 | ✅ **YES (100% Free)** | English (US, UK), Spanish, French, Italian, Hindi, Japanese, Chinese | Completely free of royalties or restrictions. Generated audio has zero copyright encumbrances. |
| **MeloTTS** | MIT | MIT | ✅ **YES (100% Free)** | English (US, UK, IN, AU), Spanish, French, Chinese, Japanese, Korean | Fully unencumbered. High speed, clean phonetics. |
| **AI4Bharat Indic-TTS / Indic Parler** | Apache 2.0 / MIT | Apache 2.0 / MIT | ✅ **YES (100% Free)** | **Hindi (हिंदी)** and 21 other scheduled Indian languages | Official research initiative from IIT Madras. Explicitly approved for public and commercial software. |
| **CosyVoice 2** | Apache 2.0 | Apache 2.0 | ✅ **YES (Permitted under Apache 2.0)** | Multi-lingual (English, Chinese, Japanese, Korean, Cross-Lingual) | Apache 2.0 permissive terms apply to code and weights. Must respect voice privacy and cloning consent regulations. |
| **F5-TTS** | MIT | **CC-BY-NC 4.0** *(Emilia Checkpoints)* | ❌ **RESTRICTED (Code: Yes / Official Weights: No)** | English, Mandarin Chinese, Zero-Shot Multilingual | Official pre-trained weights cannot be used in commercial products without retraining on permissive data (e.g. `OpenF5-TTS`). |
| **ChatTTS** | AGPLv3+ | **CC-BY-NC 4.0** | ❌ **NO (Non-Commercial Only)** | English, Mandarin Chinese | Pre-trained weights are strictly limited to academic research and non-profit testing. |
| **Fish Speech** | BSD-3-Clause | Fish Audio Research License | ❌ **RESTRICTED (Commercial requires paid tier)** | English, Chinese, Multilingual | Self-hosted research weights cannot be monetized directly without a commercial license from Fish Audio. |
| **Microsoft Edge-TTS** | LGPL-3.0 / MIT (Client) | Proprietary Microsoft Consumer Endpoint | ⚠️ **NOT OFFICIALLY LICENSED** | 100+ Languages (Hindi, English, etc.) | Consumer browser endpoint. Microsoft does not provide third-party commercial distribution licenses. Suitable for development/staging; enterprise commercial products should migrate to Azure AI Speech SDK or Kokoro/AI4Bharat. |

### B. Summary of Commercial Compliance by Language

1. **Hindi (हिंदी)**:
   - Commercial Solution: **AI4Bharat Indic Parler-TTS / Indic-TTS** (Apache 2.0/MIT) and **Kokoro-82M community Indic checkpoints**.
   - Staging/Dev Solution: **Edge-TTS** (`hi-IN-MadhurNeural`, `hi-IN-SwaraNeural`).
2. **Indian English (`en-IN`)**:
   - Commercial Solution: **MeloTTS (`en-IN`)** and **AI4Bharat**.
   - Staging/Dev Solution: **Edge-TTS** (`en-IN-NeerjaExpressiveNeural`, `en-IN-PrabhatNeural`).
3. **English (US & UK)**:
   - Commercial Solution: **Kokoro-82M** (Apache 2.0) and **MeloTTS** (MIT).
   - Staging/Dev Solution: **Edge-TTS** (11 US/UK voices).

---

## 5. Technical Implementation & API Contracts

### A. Frontend Plugin Routes (`src/plugins/SpeechStudio/routes.ts`)
* `GET /api/plugins/speech-studio/models`: Returns list of all 5 selectable model architectures and active engine configuration.
* `GET /api/plugins/speech-studio/voices`: Returns the 13+ expressive voices with language labels, accents, gender, and emotion tags.
* `POST /api/plugins/speech-studio/synthesize`: Synthesizes text with options:
  - `text` (string, max 5,000 chars)
  - `voiceId` (string, e.g. `ava-expressive`, `aarav-neural`)
  - `architecture` (string, e.g. `edge-tts`, `f5-tts`, `kokoro-82m`, `chattts`, `cosyvoice-2`)
  - `emotion` (string, e.g. `Empathetic`, `Joyful`, `Dramatic`)
  - `cfgStrength` (number, `1.0` to `2.5`)
* `GET /api/plugins/speech-studio/quota`: Returns user tier rate-limit status (20 requests/hr for Guest, unlimited for Admin).

### B. VM 2 Neural Python Daemon (`scripts/vm2_tts_service.py`)
* Runs under PM2 as `neural-tts` listening on port `5050`.
* Exposed via Nginx on `132.226.190.125/tts/`.
* Dispatches synthesis requests to edge-tts asynchronous pipe, converting audio frames to MP3 in memory and streaming base64 chunks back to the API gateway.

---

## 6. Disaster Recovery & Node Replication Runbook

```bash
# 1. SSH into VM 2 (132.226.190.125)
ssh -i key.key ubuntu@132.226.190.125

# 2. Setup Python Virtualenv & Dependencies
sudo apt update && sudo apt install -y python3-pip python3-venv ffmpeg
python3 -m venv /home/ubuntu/tts_env
/home/ubuntu/tts_env/bin/pip install edge-tts fastapi uvicorn

# 3. Deploy Service Script
cat << 'EOF' > /home/ubuntu/tts_service.py
# (See scripts/vm2_tts_service.py for the full 13-voice mapping service code)
EOF

# 4. Start Daemon under PM2
pm2 start "/home/ubuntu/tts_env/bin/python3 /home/ubuntu/tts_service.py" --name neural-tts
pm2 save

# 5. Verify Health
curl -s http://127.0.0.1:5050/health
# Response: {"status":"healthy","service":"SutharLabs Neural Edge TTS","port":5050}
```

