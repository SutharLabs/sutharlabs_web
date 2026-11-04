# SutharLabs Self-Hosted LLM Inference Node & Benchmarks

This technical guide documents the setup, virtual memory tuning, model selection, and live inference benchmarks for the **Self-Hosted AI Inference Node** running on Oracle Cloud Infrastructure Always Free Ampere ARM A1 (`sutharlabs-prod`, `132.226.190.125`).

---

## 1. Hardware Architecture & Memory Strategy

```
                                [sutharlabs-prod]
                     Ampere Altra ARM64 Neoverse-N1 (2 OCPUs)
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
          12 GB Physical RAM                            4 GB Linux Swapfile
          (Fast, ~35,000 MB/s)                          (/swapfile, vm.swappiness=10)
                 │                                             │
      Holds Active Model Weights                       Pages Out Cold Background Daemons
       & KV Cache Memory Tables                        (systemd, snapd, journald, agents)
```

### The Impact of Swap on LLM Performance
* **Tokens/Sec Reality:** Swap **does NOT increase generation speed** directly. Because RAM operates at ~35,000+ MB/s while SSD swap operates at ~50–100 MB/s, if an LLM’s active matrix computations spill into swap, generation speeds drop drastically.
* **The Real Benefits of Swap:**
  1. **Crash Prevention (OOM Killer Defense):** Without swap, if a model’s context expands past physical RAM, the Linux kernel terminates the process with `SIGKILL 137`. With swap, the system safely absorbs memory bursts.
  2. **Physical RAM Optimization:** With `vm.swappiness=10`, the kernel quietly pushes idle operating system services (~500 MB) into swap, keeping 100% of physical RAM dedicated to Ollama's active weights and KV cache.

---

## 2. Deployed Model Fleet & Benchmarks

Two complementary models have been deployed to cover both fast interactive queries and complex algorithmic reasoning:

| Metric | `gemma2:2b` (Google) | `qwen2.5:7b` (Alibaba) |
| :--- | :--- | :--- |
| **Download Size** | 1.6 GB | 4.7 GB |
| **Active Resident RAM** | ~2.4 GB | ~5.1 GB |
| **Warm Load Time** | **0.001 s** | **0.001 s** |
| **Tokens/Sec on 2 OCPUs** | **9.12 – 9.87 tokens/sec** | **3.63 – 4.10 tokens/sec** |
| **Specialization** | Quick chat, UI autocomplete, text summary | Complex Python code, math logic, architecture proofs |

---

## 3. Quick Replication Instructions

### A. Swapfile Setup
```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.d/99-swappiness.conf
```

### B. Ollama Installation & Daemon Configuration
```bash
curl -fsSL https://ollama.com/install.sh | sh

sudo mkdir -p /etc/systemd/system/ollama.service.d
printf '[Service]\nEnvironment="OLLAMA_HOST=0.0.0.0:11434"\nEnvironment="OLLAMA_ORIGINS=*"\n' | sudo tee /etc/systemd/system/ollama.service.d/override.conf
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

### C. Download Models
```bash
ollama pull gemma2:2b
ollama pull qwen2.5:7b
```

### D. Benchmark Test Script (`test_inference.py`)
Run the test script located in `D:\Code\SutharLabs\OracleFreeTier\test_inference.py`:
```bash
python3 /home/ubuntu/test_inference.py gemma2:2b "Explain sovereign cloud architecture."
python3 /home/ubuntu/test_inference.py qwen2.5:7b "Write an algorithm for Dijkstra shortest path."
```

---

## 4. Reverse Proxy & Security Architecture

To securely expose Ollama across Oracle Cloud's open HTTP port (80) without exposing port 11434 directly, an Nginx reverse proxy was deployed on `sutharlabs-prod`:

* **Nginx Configuration (`/etc/nginx/sites-available/default`):**
  ```nginx
  server {
      listen 80 default_server;
      server_name _;

      location /health {
          return 200 '{"status":"ok","node":"sutharlabs-prod"}\n';
          add_header Content-Type application/json;
      }

      location / {
          # Require matrix secret key for non-health requests
          if ($http_x_ai_secret != "sutharlabs-matrix-ai-prod-2026") {
              return 403 '{"error":"Forbidden: Invalid AI Gateway Secret"}\n';
          }
          proxy_pass http://127.0.0.1:11434;
          proxy_http_version 1.1;
          proxy_set_header Host 127.0.0.1;
          proxy_set_header Connection "";
          proxy_buffering off;
          proxy_read_timeout 600s;
      }
  }
  ```

---

## 5. Website Admin AI Agent Studio Integration

The SutharLabs platform connects directly to the inference node through a dedicated admin-only streaming proxy:

### A. Backend Endpoints (`server.ts`):
- `GET /api/ai/health`: Real-time node liveness check.
- `GET /api/ai/models`: Queries Ollama's loaded tags (`/api/tags`) to populate model switchers dynamically.
- `POST /api/ai/chat`: Authenticated SSE (Server-Sent Events) streaming gateway forwarding user messages with persona system prompts to Ollama's `/api/chat` with `stream: true`.

### B. Frontend Claude-Style Agent Studio (`AdminAIChatView.tsx`):
- **Model Switcher:** Seamless toggle between `qwen2.5:7b` (deep reasoning) and `gemma2:2b` (ultra-fast generation at ~10 t/s).
- **Agent Personas Aggregator:** Instant switching between Cloud Architect, DB Architect, Software Engineer, Quant Strategist, and Sovereign Assistant.
- **Split-Screen Artifacts Studio Drawer:** Automatically detects markdown code fences (` ```language ... ``` `), parses them into interactive artifact cards, and displays them in a dedicated right-hand drawer with syntax highlighting, line numbers, one-click copy, and file download.
- **Real-Time Telemetry:** Calculates real-time tokens-per-second, elapsed generation time, token counts, and memory node status.
- **Sovereign Engine Design Compliance:** Fully styled with zero native browser dialogs (utilizing `<ConfirmModal />`), theme-aware button and code box matrices, and `shrink-0` icon containment.

