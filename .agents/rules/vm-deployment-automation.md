# Mandatory Fleet Deployment Automation on Git Push

All AI agents operating in this repository MUST strictly follow this rule:
Whenever code changes are committed and pushed to `origin main`, the agent **MUST AUTOMATICALLY execute the deployment to all applicable Oracle Cloud VMs** without waiting for the user to ask or remind.

---

## 1. Fleet Deployment Routing Matrix

| Touched Files / Subsystems | Target Node | Automated Deployment Command |
| :--- | :--- | :--- |
| **Any Web Core, Server, or Plugin Code** (`src/*`, `server.ts`, `api/*`, `package.json`, etc.) | **VM 3 (`sutharlabs-backend` — 130.210.37.199)** | `ssh -o StrictHostKeyChecking=no -i "D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key" ubuntu@130.210.37.199 "bash /home/ubuntu/website/scripts/deploy.sh"` |
| **Database Schema Modifications** (`prisma/schema.prisma`, migrations) | **VM 1 (`sutharlabs-db-store` — 137.23.61.191)** | `DATABASE_URL="postgres://sutharlabs_admin:SutharLabsSecretPassword2026!@137.23.61.191:5432/sutharlabs_production" npx prisma migrate deploy` |
| **AI Models, Ollama, TTS, or Crontab Compute** (`scripts/cron*`, AI services) | **VM 2 (`sutharlabs-prod` — 132.226.190.125)** | `ssh -o StrictHostKeyChecking=no -i "D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key" ubuntu@132.226.190.125 "cd /home/ubuntu/website && git pull origin main"` |

---

## 2. Execution Protocol

Immediately after running `git push origin main`:
1. Execute the deployment command for each touched tier above.
2. Confirm the health probe responds with HTTP 200:
   `ssh -o StrictHostKeyChecking=no -i "D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key" ubuntu@130.210.37.199 "curl -s http://127.0.0.1/health"`
3. Report the deployment status clearly in the response to the user.

