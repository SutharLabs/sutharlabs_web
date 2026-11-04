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

## 4. API Endpoints for Website Integration

The node exposes an OpenAI-compatible REST API at `http://132.226.190.125:11434`:

* **Ollama Native API:** `POST /api/generate`
* **OpenAI Chat Completions API:** `POST /v1/chat/completions`

```json
{
  "model": "gemma2:2b",
  "messages": [
    { "role": "user", "content": "Analyze portfolio risk indicators." }
  ],
  "stream": false
}
```
