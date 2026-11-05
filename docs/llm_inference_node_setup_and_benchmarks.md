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

## 5. Natural Neural Text-to-Speech (TTS) Gateway

To eliminate robotic, garbled sine-wave audio and provide natural human audiobook-grade speech in Hindi and English:

```
[User Browser / Speech Studio] 
              │
              ▼ (POST /api/plugins/speech-studio/synthesize)
[VM 3 Node.js Gateway — 130.210.37.199]
              │
              ▼ (HTTP POST http://132.226.190.125/tts/api/tts)
[VM 2 Nginx Reverse Proxy — 132.226.190.125:80]
              │
              ▼ (Proxy Pass http://127.0.0.1:5050/)
[Python FastAPI + edge-tts Daemon — PM2 "neural-tts"]
              │
              ▼ (Generates 100% Real Neural MP3 in ~0.3s)
[Base64 Audio Stream Played Crystal-Clear in HTML5 Audio Player]
```

### A. Voice Mapping Matrix
| SutharLabs Voice ID | Neural Model Voice | Language / Accent | Cadence & Tone |
| :--- | :--- | :--- | :--- |
| `aarav-neural` | `hi-IN-MadhurNeural` | Hindi (हिंदी) | Deep, warm studio narrator |
| `priya-neural` | `hi-IN-SwaraNeural` | Hindi (हिंदी) | Clear, conversational, natural prosody |
| `marcus-neural` | `en-US-GuyNeural` | English (US) | Rich, resonant broadcaster voice |
| `seraphina-neural` | `en-US-JennyNeural` | English (US) | Expressive, melodic audiobook narrator |
| `cloned-user` | `en-US-ChristopherNeural`| Adaptive English | Neutral, dynamic narrator |

### B. Python Virtualenv & Service Setup (`scripts/tts_service.py`)
```bash
# 1. Install prerequisites
sudo apt update && sudo apt install -y python3-pip python3-venv

# 2. Create virtualenv
python3 -m venv /home/ubuntu/tts_env
/home/ubuntu/tts_env/bin/pip install edge-tts fastapi uvicorn

# 3. Launch service under PM2
pm2 start "/home/ubuntu/tts_env/bin/python3 /home/ubuntu/tts_service.py" --name neural-tts
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
