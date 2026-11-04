# Oracle Cloud VMs Replication & Disaster Recovery Runbook

This runbook provides complete, reproducible step-by-step instructions to rebuild, provision, and deploy the SutharLabs sovereign server fleet from scratch on any Oracle Cloud Always Free VM or paid cloud instance.

---

## 1. Fleet Architecture & Topology

| Parameter | VM 1 (`sutharlabs-db-store`) | VM 2 (`sutharlabs-prod`) |
| :--- | :--- | :--- |
| **Public IP** | `137.23.61.191` | `132.226.190.125` |
| **Private IP** | `10.0.0.122` | `10.0.0.188` |
| **Shape** | `VM.Standard.E2.1.Micro` (AMD x86_64) | `VM.Standard.A1.Flex` (Ampere ARM64) |
| **Compute** | 1 OCPU (2 vCPUs) | 2 OCPUs (2 vCPUs) |
| **Memory** | 1 GB RAM + 2 GB Swap (3 GB total) | 12 GB RAM + 4 GB Swap (16 GB total) |
| **Boot Volume** | 50 GB NVMe SSD | 47 GB NVMe SSD |
| **Primary Roles** | PostgreSQL 16 (:5432) + Storage Vault (:80) | Ollama LLMs (:11434) + Nginx Gateway (:80) |
| **Anti-Reclaim** | `lookbusy` systemd daemon (22% CPU) | `lookbusy` systemd daemon (22% CPU) |

---

## 2. Anti-Reclamation Daemon Setup (`lookbusy`)

Oracle Cloud Free Tier automatically reclaims instances if the 7-day 95th percentile CPU usage falls below 20%. Since LLM inference and database traffic are bursty, `lookbusy` is configured as a background systemd service locked at 22% CPU with `Nice=19` (lowest priority), ensuring zero interference with real workloads.

### Step-by-Step Installation (Run on Both VMs):
```bash
# 1. Install build tools
sudo apt-get update && sudo apt-get install -y build-essential curl

# 2. Download and compile lookbusy
cd /tmp
curl -sSL http://www.devin.com/lookbusy/download/lookbusy-1.4.tar.gz -o lookbusy-1.4.tar.gz
tar -xzf lookbusy-1.4.tar.gz
cd lookbusy-1.4
./configure
make
sudo make install

# 3. Create systemd service
sudo tee /etc/systemd/system/lookbusy.service > /dev/null << 'EOF'
[Unit]
Description=Lookbusy Anti-Reclamation CPU Keeper
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/lookbusy -c 22 -r fixed
Restart=always
RestartSec=10
Nice=19

[Install]
WantedBy=multi-user.target
EOF

# 4. Enable and start daemon
sudo systemctl daemon-reload
sudo systemctl enable --now lookbusy

# 5. Verify status and CPU consumption
sudo systemctl status lookbusy --no-pager
top -b -n 1 | head -n 12
```

---

## 3. Swap Configuration (Critical for Memory Resilience)

Prevents fatal out-of-memory (OOM) kills during heavy query loads or large-context LLM token generation:

```bash
# On VM 1 (2 GB Swap):
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10

# On VM 2 (4 GB Swap):
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
```

---

## 4. VM 1 Setup: PostgreSQL 16 & Sovereign Storage Vault

### A. Docker Engine Setup:
```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
```

### B. PostgreSQL 16 Container:
```bash
sudo docker run -d \
  --name sutharlabs_postgres \
  --restart always \
  -e POSTGRES_DB=sutharlabs \
  -e POSTGRES_USER=suthar_admin \
  -e POSTGRES_PASSWORD=your_secure_password \
  -v /data/postgres:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine
```

### C. Sovereign Storage Vault:
```bash
sudo mkdir -p /var/sutharlabs-vault/uploads /var/sutharlabs-vault/data
sudo docker run -d \
  --name sutharlabs_vault \
  --restart always \
  -p 80:80 \
  -e VAULT_SECRET_KEY="sutharlabs-vault-master-sec-2026-matrix" \
  -v /var/sutharlabs-vault:/vault/storage \
  sutharlabs/vault-node:latest
```

---

## 5. VM 2 Setup: Ollama ARM64 Inference Node & Nginx Gateway

### A. Install Ollama:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### B. Configure Systemd Override:
```bash
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee /etc/systemd/system/ollama.service.d/override.conf > /dev/null << 'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
EOF

sudo systemctl daemon-reload
sudo systemctl restart ollama
```

### C. Pull LLM Foundation Models:
```bash
ollama pull qwen2.5:7b
ollama pull gemma2:2b
```

### D. Nginx Gateway with Secret Authentication:
Create `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    client_max_body_size 100M;

    location = /health {
        add_header Content-Type application/json;
        return 200 '{"status":"healthy","node":"sutharlabs-prod (Ampere ARM A1)","engine":"Ollama v0.40.14","memory":"12GB RAM + 4GB Swap"}';
    }

    location / {
        if ($http_x_ai_secret != 'sutharlabs-matrix-ai-prod-2026') {
            add_header Content-Type application/json;
            return 401 '{"error":"Unauthorized: Invalid or missing x-ai-secret header"}';
        }

        proxy_pass http://127.0.0.1:11434;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host 127.0.0.1;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 600s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 600s;
    }
}
```
Reload Nginx:
```bash
sudo nginx -t && sudo systemctl restart nginx
```

---

## 6. Website Environment Variables (`.env`)

Add the following parameters to the website host (or Vercel environment variables):

```env
# Oracle Cloud Database
DATABASE_URL="postgresql://suthar_admin:your_secure_password@137.23.61.191:5432/sutharlabs?sslmode=disable"

# Oracle Cloud Storage Vault
ORACLE_VAULT_URL="http://137.23.61.191"
ORACLE_VAULT_SECRET="sutharlabs-vault-master-sec-2026-matrix"

# Oracle Cloud AI Inference Gateway
ORACLE_AI_URL="http://132.226.190.125"
ORACLE_AI_SECRET="sutharlabs-matrix-ai-prod-2026"
```

---

## 7. Integrated AI & Quant Systems Overview

### A. FinLLM & Chronos Multi-Horizon Alpha (`strat-finllm-alpha`):
* **Architecture:** Pre-configured in `src/plugins/StockTracker/strategies/presets.ts` and `engine.ts`.
* **Methodology:** Multi-horizon EMA corridor (20 / 50 / 200) + Supertrend regime filter + institutional volume multiple (≥ 1.2x) + dynamic ATR target (+2.5x) and stop (-1.2x).
* **Usage:** Instantly selectable in the Stock Tracker Strategy list for live paper trading and historical simulation replays.

### B. Neural Speech Studio Plugin (`speech-studio`):
* **Languages:** Native English (US, UK, Indian accents) and Hindi (हिंदी).
* **Open Source Models Evaluated:** Chatterbox Multilingual V3 (Resemble AI), svara-TTS, XTTS-v2 (Coqui), AI4Bharat IndicTTS (IIT Madras).
* **Tiered Rate Limiting:**
  * **Admin:** Unlimited queries (`isUnlimited: true`).
  * **Developer / Guest:** 10 requests per hour with automatic countdown resets.

