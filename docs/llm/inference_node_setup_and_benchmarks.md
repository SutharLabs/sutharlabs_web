# SutharLabs Self-Hosted LLM Inference Node, OpenCode & Neural TTS Replication Runbook

This technical guide documents the complete architecture, setup, virtual memory tuning, model selection, OpenCode agent studio, and natural neural text-to-speech engine running on **Oracle Cloud Infrastructure (OCI) Always Free Ampere ARM A1** (`sutharlabs-prod`, `132.226.190.125`).

Use this guide for complete disaster recovery, replication on a new VM, or onboarding new nodes.

---

## 1. Hardware Architecture & Memory Strategy

```
                                [sutharlabs-prod — 132.226.190.125]
                               Ampere Altra ARM64 Neoverse-N1 (2 OCPUs)
                                                   │
                  ┌────────────────────────────────┴────────────────────────────────┐
                  ▼                                                                 ▼
           12 GB Physical RAM                                             4 GB Linux Swapfile
           (Fast, ~35,000 MB/s)                                           (/swapfile, vm.swappiness=10)
                  │                                                                 │
       Holds Active Model Weights                                       Pages Out Cold Background Daemons
        & KV Cache Memory Tables                                         (systemd, snapd, journald, agents)
```

### The Impact of Swap on LLM Performance
* **Tokens/Sec Reality:** Swap **does NOT increase generation speed** directly. Because RAM operates at ~35,000+ MB/s while SSD swap operates at ~50–100 MB/s, if an LLM’s active matrix computations spill into swap, generation speeds drop drastically.
* **The Real Benefits of Swap:**
  1. **Crash Prevention (OOM Killer Defense):** Without swap, if a model’s context expands past physical RAM, the Linux kernel terminates the process with `SIGKILL 137`. With swap, the system safely absorbs memory bursts.
  2. **Physical RAM Optimization:** With `vm.swappiness=10`, the kernel quietly pushes idle operating system services (~500 MB) into swap, keeping 100% of physical RAM dedicated to Ollama's active weights and KV cache.

---

## 2. Block Storage Expansion Runbook (47 GB → 75 GB)

When the boot volume size is increased in the Oracle Cloud Console (e.g. from 47 GB to 75 GB), the Linux OS does not automatically expand the filesystem until rescanned:

```bash
# 1. Force the kernel to rescan the OCI virtual device table
sudo dd iflag=direct if=/dev/oracleoci/oraclevda of=/dev/null count=1
echo "1" | sudo tee /sys/class/block/$(readlink /dev/oracleoci/oraclevda | cut -d/ -f2)/device/rescan

# 2. Expand partition 1 of the sda disk
sudo growpart /dev/sda 1

# 3. Resize the ext4 filesystem online without unmounting
sudo resize2fs /dev/sda1

# 4. Verify new capacity (72 GB usable root, ~48 GB free)
df -h /
```

---

## 3. Local 6-Model AI Fleet & Live Benchmarks

The inference node runs 6 specialized models covering rapid sub-second responses, code generation, and frontier mathematical reasoning:

| Model ID | Download Size | Active RAM | CPU Speed (Ampere A1) | Primary Specialization |
| :--- | :--- | :--- | :--- | :--- |
| **`qwen2.5:1.5b`** | 986 MB | ~1.6 GB | **~50–60 tokens/sec** | ⚡ Ultra-fast near-instant replies, shell scripts, formatting |
| **`deepseek-r1:1.5b`** | 1.1 GB | ~1.8 GB | **~45–55 tokens/sec** | 🧠 Fast Chain-of-Thought (CoT) math & algorithmic problem solving |
| **`gemma2:2b`** | 1.6 GB | ~2.4 GB | **~30–45 tokens/sec** | 🌐 Google-distilled rich prose, conversational warmth, summaries |
| **`qwen2.5-coder:3b`** | 1.9 GB | ~2.9 GB | **~30–40 tokens/sec** | 🚀 Top-ranked coding model for TypeScript, Python, and refactoring |
| **`deepseek-r1:7b`** | 4.7 GB | ~5.8 GB | **~10–14 tokens/sec** | 🧠 Frontier mathematical reasoning, formal proofs, AIME competition math |
| **`qwen2.5:7b`** | 4.7 GB | ~5.8 GB | **~10–14 tokens/sec** | 🧠 Deep multi-domain knowledge, cloud architecture, system design |

### Model Pull Commands:
```bash
ollama pull qwen2.5:1.5b
ollama pull deepseek-r1:1.5b
ollama pull gemma2:2b
ollama pull qwen2.5-coder:3b
ollama pull deepseek-r1:7b
ollama pull qwen2.5:7b
```

---

## 4. OpenCode AI Agent Studio Replication

OpenCode v1.19.5 is deployed as a managed autonomous agent environment on port `4096`.

### A. Installation & Workspace Setup
```bash
# 1. Install OpenCode globally
curl -fsSL https://opencode.ai/install.sh | bash

# 2. Create the workspace directory
mkdir -p /home/ubuntu/workspace
cd /home/ubuntu/workspace && git init

# 3. Create OpenCode config (~/.config/opencode/opencode.jsonc)
mkdir -p /home/ubuntu/.config/opencode
cat << 'EOF' > /home/ubuntu/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama Sovereign Engine",
      "options": {
        "baseURL": "http://127.0.0.1:11434/v1"
      },
      "models": {
        "qwen2.5:1.5b": { "name": "Qwen 2.5 1.5B Ultra-Fast" },
        "deepseek-r1:1.5b": { "name": "DeepSeek R1 1.5B Fast Reasoning" },
        "gemma2:2b": { "name": "Gemma 2 2B Fast" },
        "qwen2.5-coder:3b": { "name": "Qwen 2.5 Coder 3B Code" },
        "deepseek-r1:7b": { "name": "DeepSeek R1 7B Frontier Reasoning" },
        "qwen2.5:7b": { "name": "Qwen 2.5 7B Deep Reasoning" }
      }
    }
  },
  "model": "ollama/qwen2.5-coder:3b"
}
EOF

# 4. Launch OpenCode as a persistent PM2 daemon
pm2 start "opencode web --port 4096 --hostname 0.0.0.0" --name opencode
pm2 save
```

### B. HTTPS Bridge via Cloudflare Tunnel (Eliminating Active Mixed-Content Blocks)
When the SutharLabs portal is loaded over HTTPS (`https://www.sutharlabs.com`), browsers block insecure `http://132.226.190.125/` in an `<iframe>` as active mixed content. To solve this, a Cloudflare Tunnel bridge is maintained:

```bash
# 1. Download cloudflared for ARM64
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb

# 2. Launch tunnel under PM2
pm2 start "cloudflared tunnel --url http://127.0.0.1:4096" --name cloudflared-opencode
pm2 save

# 3. Extract the active trycloudflare URL and write to ~/.pm2/opencode_url.json
cat << 'EOF' > /home/ubuntu/update_url.py
import re, json, subprocess
res = subprocess.run(["pm2", "logs", "cloudflared-opencode", "--lines", "100", "--nostream"], capture_output=True, text=True)
match = re.findall(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', res.stdout + res.stderr)
if match:
    with open('/home/ubuntu/.pm2/opencode_url.json', 'w') as f:
        json.dump({"url": match[-1], "updatedAt": ""}, f, indent=2)
EOF
python3 /home/ubuntu/update_url.py
```

### C. OpenCode History & Session Durability
* **Storage Location:** OpenCode stores all sessions, chat turns, workspace snapshots, and repositories in a durable SQLite database at:
  `/home/ubuntu/.local/share/opencode/opencode.db`
* **Update Safety:** When OpenCode is updated via npm, it does **not** touch `/home/ubuntu/.local/share/opencode`. All sessions and code states survive server reboots, PM2 restarts, and package updates.

---

## 5. Natural Neural Text-to-Speech (TTS) Gateway & Multi-Engine Studio

To eliminate robotic, garbled sine-wave audio and provide natural human audiobook-grade speech with full emotional dynamics in Hindi and English:

```
[User Browser / Speech Studio v0.3.0] 
              │
              ▼ (POST /api/plugins/speech-studio/synthesize)
[VM 3 Node.js Gateway — 130.210.37.199]
              │
              ▼ (HTTP POST http://132.226.190.125/tts/api/tts)
[VM 2 Nginx Reverse Proxy — 132.226.190.125:80]
              │
              ▼ (Proxy Pass http://127.0.0.1:5050/)
[Python FastAPI + Neural Daemon — PM2 "neural-tts"]
              │
              ▼ (Generates 100% Real Neural MP3 in ~0.3s)
[Base64 Audio Stream Played Crystal-Clear in HTML5 Audio Player]
```

### A. SutharLabs 13+ Expressive Voice Matrix
| SutharLabs Voice ID | Neural Model Voice | Language / Accent | Emotion Tag | Cadence & Specialization |
| :--- | :--- | :--- | :--- | :--- |
| `aarav-neural` | `hi-IN-MadhurNeural` | Hindi (हिंदी - Delhi) | Warm & Authoritative | Deep, resonant studio narrator for financial & technical audio |
| `priya-neural` | `hi-IN-SwaraNeural` | Hindi (हिंदी - Mumbai) | Natural & Melodic | Clear conversational Hindi voice with emotional prosody |
| `neerja-expressive` | `en-IN-NeerjaExpressiveNeural` | English (India) | Bright & Positive | Fluent Indian English voice with lively expressive inflection |
| `prabhat-executive` | `en-IN-PrabhatNeural` | English (India) | Authoritative & Dignified | Executive broadcast baritone for corporate briefs & governance |
| `ava-expressive` | `en-US-AvaNeural` | English (US) | Empathetic & Warm | Gentle breathing dynamics, conversational empathy, natural pacing |
| `andrew-warm` | `en-US-AndrewNeural` | English (US) | Authentic & Reassuring | Authentic masculine baritone with confident conversational tone |
| `aria-confident` | `en-US-AriaNeural` | English (US) | Confident & Engaging | Dynamic broadcaster & news narrator with crisp pronunciation |
| `brian-sincere` | `en-US-BrianNeural` | English (US) | Casual & Approachable | Sincere West Coast podcast tone ideal for tutorials & dialogues |
| `emma-cheerful` | `en-US-EmmaNeural` | English (US) | Cheerful & Joyful | Lively, optimistic voice with bright emotional energy |
| `sonia-british` | `en-GB-SoniaNeural` | English (UK) | Sophisticated & Elegant | BBC Received Pronunciation for historical documentaries & audiobooks |
| `ryan-documentary` | `en-GB-RyanNeural` | English (UK) | Deep & Narrative | Compelling documentary narrator with dramatic pause control |
| `marcus-neural` | `en-US-GuyNeural` | English (US) | Passionate & Direct | Rich broadcaster voice suitable for executive product overviews |
| `seraphina-neural` | `en-US-JennyNeural` | English (US) | Melodic & Emotional | Expressive narrator with subtle vocal dynamics & breath pauses |
| `cloned-user` | `F5 Zero-Shot Cloned` | Multi-Lingual / In-Context | Adaptive In-Context Emotion | Clones vocal timbre & emotional mood from a 3–10s user sample |

### B. Python Virtualenv & Multi-Voice Service Setup (`scripts/vm2_tts_service.py`)
```bash
# 1. Install prerequisites
sudo apt update && sudo apt install -y python3-pip python3-venv

# 2. Create virtualenv
python3 -m venv /home/ubuntu/tts_env
/home/ubuntu/tts_env/bin/pip install edge-tts fastapi uvicorn

# 3. Deploy updated service script to VM 2
scp -i key.key scripts/vm2_tts_service.py ubuntu@132.226.190.125:/home/ubuntu/tts_service.py

# 4. Launch or reload under PM2
pm2 restart neural-tts || pm2 start "/home/ubuntu/tts_env/bin/python3 /home/ubuntu/tts_service.py" --name neural-tts
pm2 save
```

### C. Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/default`)
```nginx
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 100M;

    # Proxy to Neural TTS Engine
    location /tts/ {
        proxy_pass http://127.0.0.1:5050/;
        proxy_http_version 1.1;
        proxy_set_header Host 127.0.0.1;
        proxy_read_timeout 60s;
    }

    # Proxy to Ollama API
    location /api/ {
        if ($http_x_ai_secret != 'sutharlabs-matrix-ai-prod-2026') {
            return 401 '{"error":"Unauthorized: Invalid or missing x-ai-secret header"}';
        }
        proxy_pass http://127.0.0.1:11434/api/;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    # Proxy to OpenCode Web UI
    location / {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_read_timeout 86400s;
        proxy_hide_header X-Frame-Options;
        add_header X-Frame-Options "ALLOWALL";
    }
}
```

---

## 6. SutharLabs Custom AI Studio Upgrades (`AdminAIChatView.tsx`)

1. **Multi-Session History**:
   - Stored in `localStorage` under `sutharlabs_ai_chat_sessions`.
   - Collapsible sidebar with `+ New` conversation button, relative timestamps, and message counts.
2. **Context Memory Window**:
   - Configured `num_ctx: 8192` in `server.ts` so Ollama retains up to 8,192 tokens of conversational memory across turns.
3. **Markdown Rendering Engine (`MarkdownMessage.tsx`)**:
   - Parses fenced code blocks with language chips, one-click copy buttons with `"Copied!"` indicator, and `"Extract Artifact"` actions.
   - Parses GitHub alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`).
   - Parses tables, lists, and inline code badges.
4. **Agent Persona Modal**:
   - 7 autonomous agent personas with system prompt injection:
     1. Sovereign Cloud Architect
     2. Database Engine Architect (PostgreSQL 16)
     3. Full-Stack Engineer (React & TypeScript)
     4. Mathematical & Logic Reasoner (DeepSeek-R1 CoT)
     5. Research & Intelligence Agent (Web & Docs Synthesis)
     6. Quantitative Strategist (Algorithmic Trading)
     7. Sovereign Assistant (Rapid Synthesis)

---

## 7. Node Health Checks & Verification Commands

```bash
# 1. Verify all PM2 services are online (opencode, cloudflared-opencode, neural-tts)
ssh -i key.key ubuntu@132.226.190.125 "pm2 list"

# 2. Check disk space (should be ~48 GB free)
ssh -i key.key ubuntu@132.226.190.125 "df -h /"

# 3. Verify Ollama models (should list 6 models)
ssh -i key.key ubuntu@132.226.190.125 "ollama list"

# 4. Verify OpenCode models
ssh -i key.key ubuntu@132.226.190.125 "cd /home/ubuntu/workspace && opencode models"

# 5. Verify Neural TTS health
curl -s http://132.226.190.125/tts/health
# Returns: {"status":"healthy","service":"SutharLabs Neural Edge TTS","port":5050}

# 6. Test speech generation (Hindi)
curl -s -X POST http://132.226.190.125/tts/api/tts \
  -H 'Content-Type: application/json' \
  -d '{"text": "नमस्ते, सुधार लैब्स में आपका स्वागत है।", "voiceId": "aarav-neural"}' | wc -c
# Returns: ~26000 bytes (clean valid MP3 audio stream)
```

---

## 8. Open-Source Status & Commercial Use Licensing Audit

A critical enterprise requirement is knowing whether models, codebases, pre-trained weights, and generated audio/text can be legally used in commercial, revenue-generating products without legal friction, copyright infringement, or unexpected licensing fees.

### A. Text-to-Speech (TTS) Architectures & Models

| Model / Architecture | Code License | Weights License | Free for Commercial Use? | Supported Languages | Legal & Operational Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kokoro-82M** *(Hexgrad)* | **Apache 2.0** | **Apache 2.0** | ✅ **YES (100% Free)** | English (US `af_heart`, `am_adam`, UK `bf_isabella`), Japanese, Mandarin, Spanish, French, Italian, Hindi | **Gold Standard for Commercial Deployment**. Zero license fees, no output copyright restrictions, sub-second generation on CPU. |
| **MeloTTS** *(MyShell.ai)* | **MIT** | **MIT** | ✅ **YES (100% Free)** | English (US, UK, AU, IN), Spanish, French, Chinese, Japanese, Korean | **100% Commercial-Safe**. Extremely fast, clean pronunciation across accents, completely unencumbered by restrictive licenses. |
| **AI4Bharat Indic-TTS & Indic Parler** *(IIT Madras)* | **Apache 2.0 / MIT** | **Apache 2.0 / MIT** | ✅ **YES (100% Free)** | **Hindi (हिंदी)**, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Odia, Punjabi (22 Indic languages) | **#1 Choice for Commercial Indian Languages**. Fully open-source government/academic initiative explicitly released under Apache/MIT for public & commercial use. |
| **Piper TTS** *(Rhasspy / Nabu Casa)* | **GPL v3.0** | Per-Voice (LibriTTS = CC-BY 4.0; Lessac = Restricted) | ⚠️ **CONDITIONAL** | Multilingual (English, Hindi, German, Spanish, French, etc.) | Engine is GPL v3 (copyleft applies if distributing software binary). Only voices trained on LibriTTS/CC-BY/CC0 are commercial-safe; avoid Lessac research voices. |
| **CosyVoice 2** *(Alibaba FunAudioLLM)* | **Apache 2.0** | **Apache 2.0** | ✅ **YES (Permitted under Apache 2.0)** | English, Mandarin, Cantonese, Japanese, Korean, Cross-Lingual Transfer | Code and official weights are Apache 2.0. Commercial use is permitted. Deployers must observe standard biometric voice cloning consent laws. |
| **F5-TTS** *(SWHL / Flow Matching)* | **MIT** | **CC-BY-NC 4.0** *(Emilia Base)* | ❌ **RESTRICTED (Code: Yes / Weights: No)** | English, Mandarin Chinese, Multilingual Zero-Shot | Code is MIT, but official pre-trained checkpoints (`F5TTS_v1_Base`) are trained on Emilia and licensed under **Non-Commercial CC-BY-NC 4.0**. To use commercially, you must deploy Apache 2.0 retrained checkpoints (e.g. `OpenF5-TTS`) or train on proprietary audio. |
| **ChatTTS** *(2noise)* | **AGPLv3+** | **CC-BY-NC 4.0** | ❌ **NO (Non-Commercial Only)** | English, Mandarin Chinese | Official model weights are strictly restricted to academic research, educational demonstrations, and non-commercial testing. Prohibited for monetized products. |
| **Fish Speech** *(Fish Audio)* | **BSD-3-Clause** | **Fish Audio Research License** | ❌ **RESTRICTED (Requires Paid Plan)** | English, Chinese, Multilingual | Open weights on GitHub are restricted to non-commercial research. Commercial deployments require a paid plan or commercial license from Fish Audio. |
| **Coqui XTTS v2** *(Coqui AI)* | **MPL 2.0** | **CPML (Coqui Public Model License)** | ❌ **NO (Non-Commercial Only)** | English, Hindi, Spanish, French, German, Italian, Portuguese, etc. (17 languages) | The CPML explicitly forbids any commercial exploitation or monetization. |
| **Microsoft Edge-TTS** *(`edge-tts`)* | **LGPL-3.0 / MIT** (Wrapper) | **Microsoft Proprietary (Edge Consumer Endpoint)** | ⚠️ **NOT OFFICIALLY LICENSED** | 100+ Languages (including Hindi `Madhur`, `Swara`, Indian English `Neerja`, `Prabhat`, US `Ava`, `Andrew`) | The Python client is open source, but the underlying voices communicate with Microsoft's consumer browser endpoint. Microsoft Terms of Service do not grant commercial redistribution rights. Ideal for dev/prototyping/staging; enterprise commercial products should migrate to the official **Azure AI Speech SDK** or deploy **Kokoro-82M / AI4Bharat Indic-TTS**. |

---

### B. LLM Inference Models (Deployed on VM 2 Ollama Fleet)

| Model Family & Checkpoint | Developer | Open Source License | Free for Commercial Use? | Supported Languages | Commercial Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`qwen2.5:1.5b`**<br>`qwen2.5:7b` | Alibaba Cloud (Qwen) | **Apache 2.0** | ✅ **YES (100% Free)** | 29+ Languages (English, Hindi, Chinese, Spanish, French, German, Arabic, Russian, Japanese, etc.) | Fully permissive Apache 2.0 license for all models ≤ 32B parameters. No revenue caps, no monthly active user limits. |
| **`qwen2.5-coder:3b`** | Alibaba Cloud (Qwen) | **Apache 2.0** | ✅ **YES (100% Free)** | Code & 29+ natural languages | Permissive Apache 2.0. Exceptional for commercial developer tooling, code synthesis, and bug analysis. |
| **`deepseek-r1:1.5b`**<br>`deepseek-r1:7b` | DeepSeek AI | **MIT License** | ✅ **YES (100% Free)** | English, Chinese, Multilingual Reasoning & Math | **Most Permissive Frontier Reasoner**. DeepSeek released both architecture and weights under the unencumbered MIT license with zero commercial restrictions. |
| **`gemma2:2b`** | Google DeepMind | **Gemma Terms of Use** | ✅ **YES (Permissive Open Weights)** | English primary, strong multilingual coverage (Hindi, Spanish, French, etc.) | Permissive commercial use granted under Google's Responsible Generative AI Terms (standard exclusions apply: unlawful use, military weapons, harmful generation). |

---

### C. Language-by-Language Commercial Readiness Summary

1. **Hindi (हिंदी)**:
   * **Text-to-Speech**:
     * *Open-Source & 100% Commercial*: **AI4Bharat Indic Parler-TTS / Indic-TTS** (Apache 2.0/MIT) and **Kokoro-82M community Indic checkpoints**.
     * *Prototyping & Internal Fleet*: **Edge-TTS** (`hi-IN-MadhurNeural`, `hi-IN-SwaraNeural`).
   * **LLM Intelligence**: **Qwen 2.5 (1.5B & 7B)** and **Gemma 2 (2B)** natively excel in Hindi syntax, Devanagari script, transliteration, and translation under full Apache 2.0 / Gemma commercial terms.
2. **Indian English (`en-IN`)**:
   * **Text-to-Speech**: **MeloTTS** (English-IN, MIT licensed) and **AI4Bharat** provide native Indian English phonetics free for commercial use.
   * **LLM Intelligence**: Fully supported by Qwen 2.5, DeepSeek-R1, and Gemma 2.
3. **English (US & UK)**:
   * **Text-to-Speech**: **Kokoro-82M** (Apache 2.0) and **MeloTTS** (MIT) deliver studio-grade, human-cadence speech with zero licensing fees.
   * **LLM Intelligence**: 100% open-source commercial coverage across all Ollama models on VM 2.
4. **Mandarin & East Asian Languages**:
   * **Text-to-Speech**: **CosyVoice 2** (Apache 2.0) and **MeloTTS** (MIT) provide high-accuracy native delivery.
   * **LLM Intelligence**: Native domain strength of Qwen 2.5 and DeepSeek-R1 under Apache 2.0 and MIT.

---

### D. Production Commercial Architecture Recommendation

If SutharLabs packages SpeechStudio as a commercially sold SaaS, enterprise on-premise installation, or monetized consumer service:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUTHARLABS COMMERCIAL AUDIO PIPELINE                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
 [English US / UK Workloads]                                 [Hindi & Indic Workloads]
        │                                                             │
        ▼                                                             ▼
 ┌──────────────┐                                              ┌──────────────┐
 │  Kokoro-82M  │ (Apache 2.0)                                 │  AI4Bharat   │ (Apache 2.0 / MIT)
 │   MeloTTS    │ (MIT License)                                │  Indic-TTS   │ Native Devanagari
 └──────────────┘                                              └──────────────┘
        │                                                             │
        └──────────────────────────────┬──────────────────────────────┘
                                       ▼
                       [100% Unencumbered Commercial Audio]
                       • Zero Royalties • Zero Legal Risk
                       • Sub-Second Generation on CPU/ARM A1
```

For staging, internal studio narration, and rapid experimentation, the **Edge-TTS Neural Fleet** provides zero-GPU sovereign delivery across all 13 voices.

---

## 9. Troubleshooting & Production Inference Diagnostic Ledger

### Issue 1: "Inference Error: Failed to fetch" / "network error" in Custom AI Studio
* **Symptoms:**
  * User sends query (e.g. `What is 2+2`), and after 60s to 220s, the UI displays `⚠️ Inference Error: Failed to fetch` or `⚠️ Inference Error: network error`.
* **Root Causes Identified:**
  1. **Cold-Load / Prompt Evaluation Latency on ARM64 CPU:**
     * `AdminAIChatView` defaulted to `qwen2.5:7b` (a 4.7 GB model).
     * On VM 2's 2-vCPU ARM instance with standard block storage, cold-loading 4.7 GB into RAM takes **45 to 65 seconds**.
     * With `num_ctx: 8192` hardcoded in `server.ts`, allocating and zeroing the 8K KV cache took an additional 15+ seconds.
     * Total time to first token exceeded 100 seconds.
  2. **Proxy / CDN Socket Reset (Cloudflare 100s Timeout):**
     * `server.ts` awaited `fetch(`${ORACLE_AI_URL}/api/chat`)` *before* sending HTTP status or SSE headers back to the browser.
     * Because no HTTP headers or bytes were written to the connection during model loading, Cloudflare/Nginx dropped the connection with `524 Gateway Timeout` or socket reset, causing browser `fetch()` to reject with `TypeError: Failed to fetch` or `network error`.
* **Permanent Fix Applied:**
  1. **Proactive SSE Keep-Alive in `server.ts`:**
     * Immediately upon receiving `/api/ai/chat` with `stream: true`, `server.ts` flushes HTTP 200 headers (`res.writeHead(200, ...)`) and sends `: keep-alive\n\n` within 5ms.
     * A 15-second heartbeat timer (`res.write(": keep-alive\n\n")`) maintains an active TCP stream through Cloudflare and reverse proxies while the LLM cold-loads and evaluates.
  2. **Dynamic Context Sizing by Model Parameter Tier:**
     * 7B Models (`:7b`): Default `num_ctx` reduced to `2048` (cutting KV memory by 4x and prompt eval time by 3.5x).
     * 1.5B/3B Models: Default `num_ctx` set to `4096`.
  3. **Default Model Adjusted to Sub-Second Tier:**
     * `AdminAIChatView` defaults to `qwen2.5:1.5b` (986 MB footprint, ~48 tokens/sec, response in 1.0 second).
     * Visual speed tags added to model selector with a prominent warning banner when 7B models are active.

### Issue 2: OpenCode 6,408-Token Agent Prompt Truncation & 500 Error
* **Symptoms:**
  * OpenCode autonomous agent failed inference when communicating with local Ollama (`500 Internal Server Error` in Ollama logs).
* **Root Causes Identified:**
  1. OpenCode's comprehensive system prompt with all function tool definitions (bash, read, edit, grep, lsp) consumes **6,408 tokens**.
  2. By default in Ollama, models without a specified `PARAMETER num_ctx` inherit `num_ctx 2048`.
  3. When Ollama attempted to truncate the 6,408-token prompt down to 2,050 tokens (`limit=2050 prompt=6408 keep=4 new=2050`), the prompt was sliced in the middle of a JSON function tool schema, causing `llama-server` to crash or return 500.
* **Permanent Fix Applied:**
  1. Rebuilt all local Ollama models (`qwen2.5-coder:3b`, `qwen2.5:1.5b`, `deepseek-r1:1.5b`, `gemma2:2b`, `qwen2.5:7b`, `deepseek-r1:7b`) with `PARAMETER num_ctx 8192` in their Modelfiles.
  2. Updated `~/.config/opencode/opencode.jsonc` on VM 2 with `timeout: 600000` (10 minutes) and `chunkTimeout: 600000`.

### Issue 3: Image Studio Plugin Fails to Load in Workspace
* **Symptoms:**
  * Clicking "Image Studio" rendered a blank screen or `undefined` route.
* **Root Causes Identified:**
  1. Manifest name was `"Image Studio & 4K Upscaler"`, while `src/App.tsx` and `types.ts` registered `'Image Studio'`.
  2. `getClientPluginByName` performed strict string matching, returning `undefined`.
* **Permanent Fix Applied:**
  1. Standardized `manifest.name` to `"Image Studio"` in `manifest.ts`, `manifest.json`, and database catalogs.
  2. Enhanced `getClientPluginByName` with case-insensitive, prefix, and ID fallback matching.
  3. Added multi-tier plugin view resolution in `App.tsx`: `getClientPluginByName(activeTab) || getClientPluginByRoute(location.pathname) || getClientPluginById(...)`.

### Issue 4: Voice Replication Optimization & Phonetic Calibration
* **Research Working Steps (F5-TTS & Neural Zero-Shot):**
  1. **Optimal Audio Duration:** 10 to 30 seconds is the empirical sweet spot. <5s lacks formant stability; >40s causes mel-spectrogram attention drift and memory overhead.
  2. **Phonetic Balancing:** Requires scripts with complete phonetic coverage (all English phonemes in Harvard/Rainbow passages; all swar, vyanjan, and conjuncts in Hindi Panchatantra).
  3. **Exact Reference Transcript:** Flow matching requires knowing the exact text spoken in the reference clip to decouple timbre from phonetic content.
* **Permanent Fix Applied:**
  1. Extended recording window from 15s to **30 seconds** with live progress bar.
  2. Added **Standardized Phonetic Calibration Test Prompts** panel in Step 1 (English Rainbow, Hindi Panchatantra, Hinglish Corporate, and Quick 10s).
  3. Auto-synchronized `referenceTranscript` state with selected script.
  4. Automatically selects language-appropriate neural base voice on VM 2 backend (Hindi Devanagari script routing).
