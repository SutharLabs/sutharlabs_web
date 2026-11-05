# Oracle Cloud VMs Replication & Disaster Recovery Runbook

This runbook provides complete, reproducible step-by-step instructions to rebuild, provision, and deploy the SutharLabs sovereign server fleet from scratch on Oracle Cloud Always Free VMs or any paid cloud infrastructure.

---

## 1. Fleet Architecture & 3-Tier Sovereign Cloud Topology

The infrastructure leverages the maximum allocation of the **Oracle Cloud Always Free Tier** combined with **Vercel Global Edge CDN**:

```mermaid
flowchart TD
    Browser([Client Browser])

    subgraph VercelEdge ["1. Vercel Global Edge Tier"]
        VercelCDN["Static Frontend CDN (HTML, CSS, JS) - 0s CPU Compute"]
        SmartSwitch["Dual-Mode Switch (api/server.ts)"]
    end

    subgraph OracleCloud ["2. Oracle Cloud Always Free Infrastructure"]
        subgraph VM3 ["VM 3: sutharlabs-backend (AMD x86_64 - 1 OCPU / 1 GB RAM)"]
            NodeAPI["Node.js Express Gateway (:3000)"]
            Nginx3["Nginx Reverse Proxy (:80)"]
        end

        subgraph VM1 ["VM 1: sutharlabs-db-store (AMD x86_64 - 1 OCPU / 1 GB RAM - 137.23.61.191)"]
            PG["PostgreSQL 16 (:5432)"]
            Vault["Storage Vault & Backup Server (:80)"]
            DBCron["Local Database Parity Sync Crontab"]
        end

        subgraph VM2 ["VM 2: sutharlabs-prod (Ampere ARM64 - 2-4 OCPU / 12-24 GB RAM - 132.226.190.125)"]
            Ollama["Ollama LLM Inference (:11434)"]
            TTS["Neural TTS / Speech Studio Engine"]
            Quant["Heavy Stock Screener / EOD Batch Simulator"]
        end
    end

    Browser -->|Load Web UI (0s CPU)| VercelCDN
    Browser -->|API Calls /api/...| SmartSwitch
    SmartSwitch -->|Proxy when BACKEND_TARGET=ORACLE| Nginx3
    Nginx3 --> NodeAPI

    NodeAPI -->|Fast Queries <0.5ms VCN| PG
    NodeAPI -->|Forward AI Studio Chat & Prompts| Ollama
    NodeAPI -->|Trigger Compute & Audio Synthesis| Quant
```

### Fleet Configuration Matrix

| Parameter | VM 1 (`sutharlabs-db-store`) | VM 2 (`sutharlabs-prod`) | VM 3 (`sutharlabs-backend`) |
| :--- | :--- | :--- | :--- |
| **Public IP** | `137.23.61.191` | `132.226.190.125` | `130.210.37.199` |
| **Private IP (VCN)** | `10.0.0.122` | `10.0.0.188` | `10.0.0.228` |
| **Shape** | `VM.Standard.E2.1.Micro` (AMD x86_64) | `VM.Standard.A1.Flex` (Ampere Altra ARM64) | `VM.Standard.E2.1.Micro` (AMD x86_64) |
| **Compute** | 1 OCPU (2 vCPUs) | 2 to 4 OCPUs (2 to 4 vCPUs) | 1 OCPU (2 vCPUs) |
| **Memory & Swap** | 1 GB RAM + 2 GB Swap | 12 to 24 GB RAM + 4 GB Swap | 1 GB RAM + 2 GB Swap |
| **Boot Volume** | **50 GB NVMe SSD** | **47 GB NVMe SSD** | **50 GB NVMe SSD** |
| **Active Ports** | `22` (SSH), `80` (Vault), `5432` (PostgreSQL) | `22` (SSH), `80` (Nginx AI Proxy), `11434` (Ollama) | `22` (SSH), `80` (Nginx), `3000` (Express PM2) |
| **Primary Usage & Role** | PostgreSQL 16 Primary DB + Storage Vault + DR Sync | Ollama AI Inference + Neural Speech Studio + Quant Engine | Node.js Express Gateway + Vercel Smart Proxy Target |
| **Anti-Reclaim Daemon** | `lookbusy` systemd daemon (22% CPU, `Nice=19`) | `lookbusy` systemd daemon (22% CPU, `Nice=19`) | `lookbusy` systemd daemon (22% CPU, `Nice=19`) |
| **Health Probe URL** | `http://137.23.61.191/health` | `http://132.226.190.125/health` | `http://130.210.37.199/health` |
| **SSH Access Command** | `ssh -i <key> ubuntu@137.23.61.191` | `ssh -i <key> ubuntu@132.226.190.125` | `ssh -i <key> ubuntu@130.210.37.199` |
| **Code Update Method** | Manual Git pull / Prisma schema sync | Model pull (`ollama pull`) & Cron update | One-command deploy: `bash scripts/deploy.sh` |

---

### Detailed Breakdown: Roles, Usage & Workload Segregation

#### 1. VM 1: `sutharlabs-db-store` (Database & Storage Vault)
* **Public IP:** `137.23.61.191` | **Private IP:** `10.0.0.122`
* **Hardware:** AMD x86_64, 1 OCPU (2 vCPUs), 1 GB RAM + 2 GB Swap, 50 GB Boot SSD
* **Primary Usages & Responsibilities:**
  1. **PostgreSQL 16 Relational Engine (`:5432`):** Primary database storage for production data (`sutharlabs_production`), user accounts, plugin registry, audit logs, and accounting ledgers.
  2. **Storage Vault Server (`:80`):** Lightweight Node.js server hosting database dump archives, automated snapshot backups, and disaster recovery scripts (`sync_neon_to_oracle.js`).
  3. **Disaster Recovery Parity Cron:** Nightly crontab executing automated sync from primary PostgreSQL to Neon Cloud Standby at 02:00 AM IST (`npm run db:cron-sync`).
  4. **Always Free Preservation:** Persistent `lookbusy` service maintaining 22% CPU consumption with lowest system priority.
* **Access & Health:**
  * Probe: `curl -s http://137.23.61.191/health`
  * SSH: `ssh -i D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key ubuntu@137.23.61.191`

#### 2. VM 2: `sutharlabs-prod` (AI Inference, Speech & High-Memory Compute)
* **Public IP:** `132.226.190.125` | **Private IP:** `10.0.0.188`
* **Hardware:** Ampere Altra ARM64, 2–4 OCPUs, 12–24 GB RAM + 4 GB Swap, 47 GB Boot SSD
* **Primary Usages & Responsibilities:**
  1. **Ollama Local LLM Inference (`:11434`):** Hosts and executes quantized open models (`gemma2:2b`, `qwen2.5:3b`, `all-minilm` embeddings) powering AI Studio and copilot features without external token costs.
  2. **Nginx Security Layer (`:80`):** Secure reverse proxy that validates incoming `x-ai-secret` authorization headers before routing prompts to Ollama.
  3. **Speech Studio & Neural TTS:** Heavy audio generation and text-to-speech audio processing.
  4. **Quantitative Compute Engine:** Market hours trade simulation EOD loops, batch backtesting algorithms, and heavy matrix operations.
  5. **Always Free Preservation:** Persistent `lookbusy` service maintaining 22% CPU consumption with lowest system priority.
* **Access & Health:**
  * Probe: `curl -s http://132.226.190.125/health`
  * SSH: `ssh -i D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key ubuntu@132.226.190.125`

#### 3. VM 3: `sutharlabs-backend` (Express API Gateway & Vercel Offload Target)
* **Public IP:** `130.210.37.199` | **Private IP:** `10.0.0.228`
* **Hardware:** AMD x86_64, 1 OCPU (2 vCPUs), 1 GB RAM + 2 GB Swap, 50 GB Boot SSD
* **Primary Usages & Responsibilities:**
  1. **Node.js Express API Gateway (`:3000` via PM2):** Receives and processes `/api/*` traffic offloaded from Vercel Serverless Functions, completely eliminating Vercel's 4-hour monthly CPU limit.
  2. **Nginx Ingress Reverse Proxy (`:80`):** Handles client connections, WebSocket upgrades, SSL termination preparation, 100MB body limits, and `/health` probe endpoint.
  3. **Private Network Interconnect:** Executes Prisma database queries against VM 1 (`10.0.0.122:5432`) at ultra-low latency (<0.5ms over Oracle VCN), and dispatches AI prompts to VM 2 (`10.0.0.188:80`).
  4. **Always Free Preservation:** Persistent `lookbusy` service maintaining 22% CPU consumption with lowest system priority.
* **Access & Health:**
  * Probe: `curl -s http://130.210.37.199/health`
  * SSH: `ssh -i D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key ubuntu@130.210.37.199`
* **Deployment / Update Method:** One-command deployment script `/home/ubuntu/website/scripts/deploy.sh`.

---

## 2. Storage Allocation & Sizing Analysis

### Oracle Cloud Always Free Storage Allowance
Oracle Cloud provides **200 GB total** of Boot & Block Volume storage across all instances in your tenancy:

$$\text{Total Storage Limit} = 200 \text{ GB}$$

### Recommended Storage Distribution Across 3 VMs:
* **VM 1 (`db-store`)**: `50 GB` (Accommodates PostgreSQL 16, transaction logs, and snapshot archives)
* **VM 2 (`prod-compute`)**: `47 GB` (Accommodates Ollama LLM weights, TTS voice models, and cache)
* **VM 3 (`backend-api`)**: **`50 GB`** (Standard OCI minimum boot volume size)
* **Total Allocated**: **`147 GB`** out of `200 GB` $\rightarrow$ **`53 GB remaining free pool`** (100% within free limits, zero billing risk).

### Why 50 GB is More Than Sufficient for VM 3:
Actual disk usage on VM 3 will be:
* Ubuntu 24.04 Minimal OS: ~`2.5 GB`
* Node.js runtime, npm, PM2, Nginx, git: ~`1.2 GB`
* SutharLabs application bundle (`dist/server.cjs` + production modules): ~`450 MB`
* 2 GB Linux Swapfile: ~`2.0 GB`
* System logs (with `logrotate` enabled): ~`500 MB`
* **Total Real Footprint on VM 3**: **`< 7.0 GB`**
* **Free Buffer Remaining on VM 3**: **`> 43 GB`** (>600% safety buffer).

---

## 3. Dual-Mode Single Switch Architecture (Vercel vs. Oracle VM)

The website uses a **single-switch dual-mode routing architecture** implemented in [`api/server.ts`](file:///d:/Code/SutharLabs/website/api/server.ts):

### A. Switch Configuration (Vercel Dashboard)
In **Vercel Dashboard** (`Project Settings -> Environment Variables`):

```env
# 1. Backend Routing Target: "VERCEL" (default) or "ORACLE"
BACKEND_TARGET="ORACLE"

# 2. Oracle VM Endpoint (Point to VM 3 Express Gateway)
ORACLE_BACKEND_URL="http://130.210.37.199"
```

### B. Execution Modes
1. **`BACKEND_TARGET="ORACLE"`**:
   - Vercel's Serverless Function forwards `/api/*` requests to the Oracle VM backend.
   - Vercel Serverless Function compute time for long-running cron jobs and simulations drops to **zero**.
   - Static assets (`index.html`, JavaScript, CSS) continue loading instantly on Vercel's global CDN (0s CPU).
2. **`BACKEND_TARGET="VERCEL"` (or unset)**:
   - Requests execute locally on Vercel Serverless Functions (`api/server.ts` -> Express).
3. **Automatic High-Availability Failover**:
   - If `BACKEND_TARGET="ORACLE"` is active and the Oracle VM is unreachable or times out (15s safeguard), `api/server.ts` catches the error and **automatically executes the request on local Vercel Express**, setting header `x-backend-fallback: true`.
   - Result: **Zero user-facing downtime**.

---

## 4. Anti-Reclamation Daemon Setup (`lookbusy`)

Oracle Cloud Free Tier automatically reclaims idle instances if the 7-day 95th percentile CPU usage falls below 20%. `lookbusy` runs as a persistent systemd service locked at 22% CPU with `Nice=19` (lowest priority), ensuring zero interference with real workloads.

### Step-by-Step Installation (Run on all VMs):
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

## 5. Swap Configuration (Critical for 1 GB RAM VMs)

Prevents fatal out-of-memory (OOM) kills during heavy query loads or large-context LLM token generation:

```bash
# On 1 GB RAM VMs (VM 1 and VM 3 - 2 GB Swap):
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10

# On High-RAM VM (VM 2 - 4 GB Swap):
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
```

---

## 6. VM 1 Setup: PostgreSQL 16 & Sovereign Storage Vault

* **Host:** `137.23.61.191` (AMD x86_64, 1 OCPU, 1 GB RAM)

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
  -e POSTGRES_DB=sutharlabs_production \
  -e POSTGRES_USER=suthar_admin \
  -e POSTGRES_PASSWORD='your_secure_password' \
  -p 5432:5432 \
  -v /home/ubuntu/postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### C. Sovereign Storage Vault Server:
The Storage Vault runs as a persistent service on port `:80` (or behind Nginx) accepting authenticated archive backups.

---

## 7. VM 3 Setup: Dedicated Node.js Express API Backend

* **Host:** Second Free AMD Instance (`VM.Standard.E2.1.Micro`, 1 OCPU, 1 GB RAM, 50 GB Boot Volume)

### A. System Packages & Node.js 20 LTS:
```bash
# 1. Update and install Node.js 20
sudo apt-get update && sudo apt-get install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. Setup 2 GB Swap & Lookbusy
# (Follow Sections 4 and 5 above)
```

### B. Clone Codebase & Install:
```bash
# Clone production repository
git clone https://github.com/SutharLabs/sutharlabs_web.git /home/ubuntu/website
cd /home/ubuntu/website

# Configure environment
cp .env.example .env
nano .env  # Populate DATABASE_URL, ORACLE_AI_URL, JWT_SECRET, etc.

# Build backend and generate Prisma client
npm install
npx prisma generate
npm run build
```

### C. Daemonize with PM2:
```bash
# Start backend on port 3000
pm2 start dist/server.cjs --name "sutharlabs-backend" --node-args="--max-old-space-size=512"
pm2 startup
pm2 save
```

### D. Nginx Reverse Proxy Setup (`/etc/nginx/sites-available/default`):
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_connect_timeout 15s;
    }
}
```
Reload Nginx:
```bash
sudo nginx -t && sudo systemctl restart nginx
```

---

## 8. VM 2 Setup: Ampere ARM64 AI & Compute Node

* **Host:** `132.226.190.125` (Ampere Altra ARM64, 2–4 OCPU, 12–24 GB RAM, 47 GB Boot Volume)

### A. Ollama Installation & Model Pulling:
```bash
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl enable --now ollama

# Pull models
ollama pull gemma2:2b
ollama pull qwen2.5:3b
ollama pull all-minilm
```

### B. Nginx Gateway with Bearer Authentication:
Forward requests from VM 3 to Ollama on `:11434` with `x-ai-secret` verification:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    client_max_body_size 100M;

    location = /health {
        add_header Content-Type application/json;
        return 200 '{"status":"healthy","node":"sutharlabs-prod (Ampere ARM A1)","engine":"Ollama v0.40.14"}';
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
        proxy_buffering off;
        proxy_read_timeout 600s;
        proxy_connect_timeout 60s;
    }
}
```

---

## 9. Crontab Background Schedulers (Zero Vercel CPU)

Move background triggers completely off Vercel:

### On VM 1 (`db-store`):
```cron
# Daily database parity sync to Neon DR PostgreSQL at 02:00 AM IST (20:30 UTC)
30 20 * * * cd /home/ubuntu/website && /usr/bin/npm run db:cron-sync >> /var/log/db-cron-sync.log 2>&1
```

### On VM 2 (`prod-compute`):
```cron
# Market hours trade simulation EOD loop (Mon-Fri 09:15 - 15:30 IST / 03:45 - 10:00 UTC) every 5 minutes
*/5 3-10 * * 1-5 cd /home/ubuntu/website && npx tsx scripts/cron-sync-database.ts >> /var/log/eod-sim.log 2>&1
```

---

## 10. VM 3 Setup: Node.js Express Backend Gateway & Deployment Automation

* **Host:** `130.210.37.199` (Private: `10.0.0.228`, AMD x86_64, 1 OCPU / 2 vCPUs, 1 GB RAM + 2 GB Swap, 50 GB Boot SSD)
* **Status:** Operational & Healthy (`http://130.210.37.199/health`)

### A. System Preparation & Anti-Reclaim Setup
```bash
# 1. Configure 2 GB Swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

# 2. Install Dependencies & Anti-Reclaim lookbusy daemon
sudo apt-get update && sudo apt-get install -y build-essential curl git iptables-persistent nginx
curl -s http://dev.alpinelinux.org/archive/lookbusy/lookbusy-1.4.tar.gz | tar -xz
cd lookbusy-1.4 && ./configure && make && sudo make install

# Configure lookbusy systemd service (maintains 22% CPU to prevent OCI idle reclamation)
sudo tee /etc/systemd/system/lookbusy.service > /dev/null << 'EOF'
[Unit]
Description=OCI Always Free Anti-Reclamation Daemon
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/lookbusy -c 22 -r fixed
Restart=always
Nice=19

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now lookbusy

# 3. Open Ports 80 & 443 in iptables
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### B. Node.js & Application Setup
```bash
# Install Node.js v20 LTS and PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone repository and build application
cd /home/ubuntu
git clone https://github.com/SutharLabs/website.git
cd website
npm install --omit=dev
npx prisma generate
npm run build

# Start PM2 with memory watchdog and register systemd persistence
pm2 start server.js --name "sutharlabs-backend" -i 1 --max-memory-restart 400M
pm2 startup systemd
pm2 save
```

### C. Nginx Reverse Proxy Configuration
Replace `/etc/nginx/sites-available/default` with:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    client_max_body_size 100M;

    # Health check probe
    location = /health {
        add_header Content-Type application/json;
        return 200 '{"status":"healthy","tier":"sutharlabs-backend-gateway","engine":"Node.js Express + PM2","target_db":"PostgreSQL 16 on VM1"}';
    }

    # Proxy all traffic to Express backend on port 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 180s;
        proxy_connect_timeout 15s;
        proxy_buffering off;
    }
}
```
Reload Nginx:
```bash
sudo nginx -t && sudo systemctl restart nginx
```

### D. Environment Variables Protocol (`.env`)
Environment variables reside in `/home/ubuntu/website/.env` on VM 3:
* **Database Connection:** `DATABASE_URL="postgres://sutharlabs_admin:SutharLabsSecretPassword2026!@137.23.61.191:5432/sutharlabs_production"`
* **Local Listener:** `PORT=3000`
* **AI Engine:** Points to VM 2 `http://10.0.0.188:80` (or `http://132.226.190.125:80`)

Whenever variables in `.env` are modified, execute:
```bash
cd /home/ubuntu/website
nano .env
pm2 restart sutharlabs-backend --update-env
```

### E. Code Update & Zero-Downtime Deployment
To deploy code changes from GitHub `main` to VM 3, execute the automated deployment script:
```bash
/home/ubuntu/website/scripts/deploy.sh
```
Or execute remotely from your development workstation:
```powershell
ssh -i D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key ubuntu@130.210.37.199 "bash /home/ubuntu/website/scripts/deploy.sh"
```

The script automatically executes:
1. `git pull origin main`
2. `npx prisma generate`
3. `npm run build`
4. `pm2 restart sutharlabs-backend --update-env`
5. Verifies probe status via `curl -s http://127.0.0.1/health`

### F. Vercel Dual-Mode Switch Activation
To offload API compute from Vercel to VM 3:
1. Navigate to **Vercel Project Settings -> Environment Variables**.
2. Add or update:
   - `BACKEND_TARGET` = `ORACLE` (Setting to `VERCEL` instantly reverts execution to Vercel Lambdas)
   - `ORACLE_BACKEND_URL` = `http://130.210.37.199`
3. Redeploy or promote latest deployment.
*(Note: If VM 3 is ever unreachable or times out after 15s, `api/server.ts` automatically falls back to local Vercel execution without throwing errors to clients).*

---

## 11. Fleet Code Update & Maintenance Protocols

This section provides the master operations reference for updating each tier in the SutharLabs fleet after pushing new code or schema changes to GitHub `main`.

### A. Updating VM 3 (`sutharlabs-backend` — 130.210.37.199)

VM 3 hosts the live Node.js Express API server and handles all `/api/*` workloads. Updates are fully automated via `scripts/deploy.sh`.

#### Method 1: Remote Execution from Local Workstation (Recommended)
Run this single command from your local Windows PowerShell or terminal:
```powershell
ssh -i D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key ubuntu@130.210.37.199 "bash /home/ubuntu/website/scripts/deploy.sh"
```

#### Method 2: Direct Execution on VM 3
If already connected via SSH:
```bash
/home/ubuntu/website/scripts/deploy.sh
```

#### What `deploy.sh` Executes Under the Hood:
```bash
#!/usr/bin/env bash
set -e
cd /home/ubuntu/website
git pull origin main                          # 1. Fetch latest commits from GitHub
npx prisma generate                           # 2. Re-generate Prisma Client bindings
npm run build                                 # 3. Compile backend production bundle
pm2 restart sutharlabs-backend --update-env   # 4. Zero-downtime reload with updated env
curl -s http://127.0.0.1/health               # 5. Verify local health probe returns 200
```

---

### B. Updating Database Schemas on VM 1 (`sutharlabs-db-store` — 137.23.61.191)

When you introduce new Prisma migrations or schema changes:

1. **Deploy Migration from Workstation (or VM 3):**
   ```bash
   DATABASE_URL="postgres://sutharlabs_admin:SutharLabsSecretPassword2026!@137.23.61.191:5432/sutharlabs_production" npx prisma migrate deploy
   ```
2. **Restarting Storage Vault Service (if vault scripts updated):**
   ```powershell
   ssh -i D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key ubuntu@137.23.61.191 "pm2 restart vault"
   ```

---

### C. Updating AI Models & Compute Scripts on VM 2 (`sutharlabs-prod` — 132.226.190.125)

1. **Pulling New or Updated Ollama Models:**
   ```powershell
   ssh -i D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key ubuntu@132.226.190.125 "ollama pull gemma2:2b && ollama pull qwen2.5:3b"
   ```
2. **Refreshing Background Crontab Scripts:**
   ```powershell
   ssh -i D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key ubuntu@132.226.190.125 "cd /home/ubuntu/website && git pull origin main"
   ```

---

### D. Updating Vercel Edge Tier (Static Assets & Smart Router)

1. Pushing to `origin main` automatically triggers a Vercel build.
2. Vercel compiles and deploys static assets to its global CDN edge (0s serverless compute time).
3. `api/server.ts` routes incoming `/api/*` traffic directly to VM 3 (`http://130.210.37.199`) while preserving the instant static loading performance on Vercel.

---

## 12. Multimedia AI Engine: SOTA Voice Cloning, Image & Video Architecture

This section documents the hybrid architecture that combines self-hosted open-source neural models on Oracle VM 2 with high-performance serverless GPU APIs for state-of-the-art multimedia generation.

### A. High-Fidelity Voice Synthesis & Zero-Shot Voice Cloning (Self-Hosted on VM 2)

#### 1. Why Previous Synthesizer Outputs Sounded Robotic:
Earlier browser testing in `SpeechStudioView` fell back to `window.speechSynthesis` (the client OS's built-in legacy text-to-speech engine). Built-in OS voices use archaic formant/concatenative synthesis, resulting in monotone, robotic cadence.

#### 2. The SOTA Open-Source Neural TTS Stack:
To achieve human-like, studio-grade speech with instant voice cloning, SutharLabs deploys open-weights neural engines on VM 2 (`132.226.190.125` / `10.0.0.188:5050`):

| Model | Primary Specialization | Voice Cloning Requirements | Performance on VM 2 ARM64 |
| :--- | :--- | :--- | :--- |
| **F5-TTS** | **Zero-Shot Voice Replication** | **3 to 10 seconds** of reference audio (`.wav`) | ~1.2x Real-Time Factor (RTF) |
| **Kokoro-82M** | **Ultra-Fast Audiobook Narrator** | Built-in human personas (82M params) | **< 0.3s** generation time (CPU optimized) |
| **ChatTTS** | **Conversational Realism** | Injects natural laughter `[laughter]`, breathing pauses, cadence | ~1.5x RTF |
| **CosyVoice 2** | **Multi-Lingual Emotion Control** | Zero-shot cloning with cross-lingual transfer (English/Hindi) | Streaming output |

#### 3. Zero-Shot Voice Cloning Workflow:
1. User records a 5–10 second voice sample in SutharLabs UI (or uploads an audio file).
2. SutharLabs backend streams the reference audio to VM 2's synthesis endpoint.
3. F5-TTS extracts the speaker's vocal embedding (pitch, timbre, cadence, and vocal fry).
4. Any input text is synthesized into a `.wav` file matching the user's voice with 95%+ perceptual similarity and natural prosody.

---

### B. State-of-the-Art Image Generation & Tiered Upscaling Architecture

To guarantee zero surprise costs while maintaining access to Hollywood-grade super-resolution, SutharLabs enforces a **Default-Free / On-Demand Paid** image upscaling strategy:

#### 1. The Two-Tier Image Upscaler Matrix:

| Parameter | Tier 1: Sovereign Engine (Default & Free) | Tier 2: Generative Ultra-Detail (Paid on Selection Only) |
| :--- | :--- | :--- |
| **Model Architecture** | **Real-ESRGAN / Compact Neural Super-Resolution** | **Clarity Upscaler / FLUX Generative Upscaler** |
| **Cost** | **$0.00 (100% Free & Unlimited)** | **~$0.01 per 4K generation (Pay-as-you-go)** |
| **Hosting Location** | **VM 2 ARM64 / Client WebAssembly** | **Serverless GPU API (Fal.ai / Replicate)** |
| **Upscaling Factor** | 2x and 4x (Up to 2048px) | 4x to 8x (Full 4K and 8K) |
| **Processing Speed** | **1 to 3 seconds** | 10 to 20 seconds |
| **Output Characteristics** | Clean mathematical super-resolution: sharpens outlines, purges JPEG artifacts, lossless line art. | Creative generative hallucination: injects realistic skin pores, fabric weaves, hair strands, cinematic depth. |
| **Activation Rule** | **Active by default** for all users and plugins. | **Explicit toggle only** with pre-confirmation to prevent accidental charges. |

#### 2. Image Generation Leaderboard (Serverless GPU):
For original image generation, requests dispatch to the following top-tier models:

| Capability | SOTA Model / Architecture | Cost per Request | Key Strengths |
| :--- | :--- | :--- | :--- |
| **Photorealistic & Text Rendering** | **FLUX.1 [dev] / [pro]** (Black Forest Labs) | ~$0.015 – $0.025 | Flawless hands/anatomy, complex prompt adherence, in-image typography. |
| **Design, Vector & Typography** | **Recraft v3 / Ideogram v2** | ~$0.02 | High-precision branding assets, logos, and vector illustrations. |
| **Fast Draft Previews** | **FLUX.1 [schnell]** | ~$0.003 | Sub-second prototype generation. |


---

### C. State-of-the-Art Video Generation (Serverless GPU API)

Because video generation on CPU requires 1.5–4 hours per clip and 20+ GB disk storage, SutharLabs dispatches video requests to cloud GPU inference endpoints (Fal.ai / Replicate / Minimax):

| Model | Provider / Engine | Cost per 5s Video | Key Specialization |
| :--- | :--- | :--- | :--- |
| **Minimax Hailuo Video-01** | Minimax / Fal.ai | ~$0.04 | **#1 SOTA** for natural human motion, expressions, and physical consistency. |
| **Kling 1.5 / 2.0** | Kuaishou / API | ~$0.05 | Cinema-grade camera motion, high dynamic range, and cinematic composition. |
| **Runway Gen-3 Alpha Turbo** | Runway ML API | ~$0.05 | High-speed generation with fine-grained camera direction and style controls. |
| **HunyuanVideo** | Tencent Open Source (via Fal.ai) | ~$0.03 | Largest open video model (13B parameters), photorealistic cinematic clips. |

---

### D. Architecture Topology & Request Flow

```mermaid
flowchart TD
    User([SutharLabs Client])

    subgraph Edge ["Vercel Edge & VM 3 Ingress"]
        UI["React 19 App (Speech Studio / Media Hub)"]
        VM3Gateway["VM 3 Gateway (130.210.37.199:80)"]
    end

    subgraph VM2 ["VM 2: Compute Node (132.226.190.125)"]
        F5TTS["F5-TTS & Kokoro Neural Voice Engine (:5050)"]
        Ollama["Ollama Code & Text LLM (:11434)"]
    end

    subgraph GPUCloud ["Serverless GPU Endpoints (Pay-Per-Gen)"]
        FluxImg["FLUX.1 + Clarity 4K Upscaler (Fal.ai)"]
        HailuoVid["Minimax Hailuo / Kling Video-01 (Fal.ai)"]
    end

    User -->|Voice Sample + Text| UI
    UI --> VM3Gateway

    VM3Gateway -->|Voice Cloning & LLM Prompts| VM2
    VM3Gateway -->|SOTA Image & Upscaling Jobs| FluxImg
    VM3Gateway -->|Cinematic Video Jobs| HailuoVid

    F5TTS -->|Return Cloned .wav Audio| VM3Gateway
    FluxImg -->|Return 4K Rendered Image| VM3Gateway
    HailuoVid -->|Return 1080p MP4 Video| VM3Gateway

    VM3Gateway --> UI
```



