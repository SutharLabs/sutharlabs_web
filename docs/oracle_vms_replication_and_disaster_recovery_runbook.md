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

| Parameter | VM 1 (`sutharlabs-db-store`) | VM 2 (`sutharlabs-prod`) | VM 3 (`sutharlabs-backend`) *(New)* |
| :--- | :--- | :--- | :--- |
| **Public IP** | `137.23.61.191` | `132.226.190.125` | *(Assigned on creation)* |
| **Private IP** | `10.0.0.122` | `10.0.0.188` | `10.0.0.x` (Same Subnet) |
| **Shape** | `VM.Standard.E2.1.Micro` (AMD) | `VM.Standard.A1.Flex` (Ampere ARM) | `VM.Standard.E2.1.Micro` (AMD) |
| **Compute** | 1 OCPU (2 vCPUs) | 2 to 4 OCPUs (2 to 4 vCPUs) | 1 OCPU (2 vCPUs) |
| **Memory** | 1 GB RAM + 2 GB Swap | 12 to 24 GB RAM + 4 GB Swap | 1 GB RAM + 2 GB Swap |
| **Boot Volume** | **50 GB NVMe SSD** | **47 GB NVMe SSD** | **50 GB NVMe SSD** |
| **Primary Roles** | PostgreSQL 16 (:5432) + Storage Vault (:80) | Ollama LLM (:11434) + Neural TTS + Heavy Quant | Node.js Express Gateway (:3000) + Nginx (:80) |
| **Anti-Reclaim** | `lookbusy` systemd daemon (22% CPU) | `lookbusy` systemd daemon (22% CPU) | `lookbusy` systemd daemon (22% CPU) |

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

# 2. Oracle VM Endpoint (Point to VM 3 or VM 2 public IP / domain)
ORACLE_BACKEND_URL="http://132.226.190.125"
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
