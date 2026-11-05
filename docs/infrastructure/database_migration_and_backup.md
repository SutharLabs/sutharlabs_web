# SutharLabs Database Migration & Disaster Recovery Guide

> **Target Audience:** Engineering team / DevOps  
> **Topic:** Migration from Neon to **Aiven for PostgreSQL** (Option 3) or **Oracle Cloud Infrastructure Always Free** (Option 5), plus Local Data Backup Audit.

---

## 1. Local Backup Audit: What We Have & What Is in Neon

### A. Data Stored Locally in Repository (100% Safe & Intact)
All primary application presets, configurations, and core structures are version-controlled in the repository:

| File / Location | Size | Content Description |
| :--- | :--- | :--- |
| `data/strategies.json` | ~29.3 KB | Complete quantitative algorithmic trading strategies (EMA Cross, Supertrend, RSI Pullback, TTM Squeeze, etc.) including entry/exit conditions, parameters, and backtest metrics. |
| `data/watchlists.json` | ~4.1 KB | Curated stock watchlists (India Core & Momentum, Tech Leaders, Banking, etc.) with NSE/BSE symbols. |
| `data/portfolios.json` | ~4.7 KB | Corporate client showcases, project descriptions, client testimonials, and live deployment URLs. |
| `data/bug_reports.json` | ~4.5 KB | Archived bug reports, diagnostic breadcrumbs, and triage notes. |
| `storage/plugins/catalog-manifest.json` | ~1.5 KB | Marketplace registry for all plugins (DocNexus, StockTracker, Accounting, FlowDesigner). |
| `src/plugins/StockTracker/strategies/presets.ts` | Code | Hardcoded immutable fallback strategies in TypeScript. |
| `prisma/schema.prisma` | ~10.2 KB | Complete declarative relational schema covering all 13 models (`User`, `Portfolio`, `SimulationStore`, `Invoice`, `FlowNode`, `AccountingTenantStore`, `BugReport`, etc.). |
| `prisma/dev.db` | ~106 KB | Local SQLite development database. |

### B. What Was Stored Only in Neon Cloud
Because Neon has locked access due to bandwidth quota exhaustion, the following dynamic runtime rows are locked in Neon until quota reset or plan upgrade:
1. Live user registrations created in production (`User` records).
2. Live paper trading simulation histories and real-time open positions (`SimulationStore`).
3. Enterprise accounting customer/voucher records (`AccountingTenantStore`).
4. Live contact form submissions (`ContactInquiry`).

> **Good News:** The application has built-in local JSON fallbacks (`readJsonData` in `storageUtils.ts`). When the cloud database is unavailable or fresh, the app automatically falls back to `data/strategies.json`, `data/watchlists.json`, and `data/portfolios.json`.

---

## 2. Root Cause & Prevention: Why Neon Blocked Us

Before commit `1fd1b93`, the simulation cron was running every minute and executing:
- Full `history` string roundtrips (each report history had accumulated 500 KB to 1.5 MB of serialized tick data).
- 1,440 executions/day $\times$ 1.5 MB = **~2.16 GB network bandwidth consumed per simulation per day**, quickly draining Neon's monthly free limit.

**Fix already pushed in commit `1fd1b93`:**
1. **Market Hours Guard:** Crons exit immediately when Indian markets are closed (before 09:15, after 15:30 IST, weekends, holidays) — saving 70% of redundant queries.
2. **Lean Heartbeat Writes:** Cron runs write only `{ cash, lastUpdated }` and avoid touching the large `history` column.
3. **Strict Column Selection:** Queries project only mandatory fields instead of `SELECT *`.
4. **20-Run History Cap:** Retains only the most recent 20 simulation snapshots.

**Result:** Your new database (whether Aiven or Oracle) will consume **< 95% less bandwidth** than Neon did.

---

## 3. Migration Option 1: Aiven for PostgreSQL (Option 3)
*Fastest setup (~5 minutes). Fully managed cloud DB with high reliability.*

### Step 3.1: Create Aiven Account & Database
1. Go to [https://aiven.io](https://aiven.io) and register for a free account.
2. Click **Create Service** $\rightarrow$ Select **PostgreSQL**.
3. Choose cloud provider: **AWS** or **Google Cloud** (Select region closest to your Vercel deployment, e.g., `ap-south-1` Mumbai or `eu-central-1` Frankfurt).
4. Select the **Free Plan** (or lowest tier eligible with free trial credits).
5. Give the service a name (e.g., `sutharlabs-pg`) and click **Create Service**.

### Step 3.2: Obtain Connection Details
In the Aiven Console Overview:
1. Locate **Service URI** (looks like `postgres://avnadmin:PASSWORD@sutharlabs-pg-xxx.aivencloud.com:12345/defaultdb?sslmode=require`).
2. Copy this URI.
3. **Enable Connection Pooling (PgBouncer)**:
   - In Aiven Console, go to the **Connection Pools** tab.
   - Click **Add Connection Pool**.
   - Pool name: `prisma_pool`.
   - Database: `defaultdb`.
   - Pool mode: `Transaction`.
   - Pool size: `20`.
   - Aiven will give you a pooled URI (port usually `12346` or with `?pgbouncer=true`). This is optimal for serverless environments like Vercel.

### Step 3.3: Push Schema & Seed
In your local project root:
```bash
# 1. Temporarily test connection or set in .env
# Replace with your actual Aiven URI
set DATABASE_URL="postgres://avnadmin:YOUR_PASSWORD@sutharlabs-pg-xxx.aivencloud.com:PORT/defaultdb?sslmode=require"

# 2. Push all 13 Prisma models to the new database
npx prisma db push

# 3. Verify tables are generated
npx prisma studio
```

---

## 4. Migration Option 2: Oracle Cloud Always Free VPS (Option 5)
*True forever-free, self-hosted, unmetered bandwidth, 24 GB RAM.*

Oracle Cloud Infrastructure (OCI) provides **Always Free** Ampere ARM A1 instances (up to 4 OCPU cores, 24 GB RAM, 200 GB SSD storage, and 10 TB/month egress).

### Step 4.1: Provision the OCI Compute Instance
1. Register at [https://cloud.oracle.com](https://cloud.oracle.com) (Requires credit card for identity verification, but is $0).
2. In OCI Dashboard, navigate to **Compute** $\rightarrow$ **Instances** $\rightarrow$ **Create Instance**.
3. **Shape**:
   - Select **Ampere (ARM)** $\rightarrow$ **VM.Standard.A1.Flex**.
   - Configure: 2 OCPU, 12 GB RAM (or 4 OCPU, 24 GB RAM).
4. **Image**: Ubuntu 24.04 LTS (AArch64).
5. **Networking**: Assign a public IPv4 address.
6. **SSH Keys**: Download your private key (`oci_key.pem`) and paste your public key.
7. Click **Create**. Note the assigned Public IP (e.g., `129.154.xxx.yyy`).

### Step 4.2: Open Firewall Ports in OCI Security List
1. In OCI Console, go to **Virtual Cloud Networks (VCN)** $\rightarrow$ Click your VCN $\rightarrow$ **Security Lists** $\rightarrow$ **Default Security List**.
2. Click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0` (or restrict to your Vercel/Office IPs).
   - **IP Protocol**: TCP.
   - **Destination Port Range**: `5432,6432`.
   - Description: `PostgreSQL and PgBouncer access`.
3. SSH into the server and allow ports in `iptables`/`ufw`:
```bash
ssh -i oci_key.pem ubuntu@YOUR_SERVER_IP

sudo ufw allow 22/tcp
sudo ufw allow 5432/tcp
sudo ufw allow 6432/tcp
sudo ufw enable
```

### Step 4.3: Deploy PostgreSQL 16 + PgBouncer via Docker Compose
Create `/home/ubuntu/postgres/docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: sutharlabs_postgres
    restart: always
    environment:
      POSTGRES_USER: sutharlabs_admin
      POSTGRES_PASSWORD: YOUR_SECURE_STRONG_PASSWORD_HERE
      POSTGRES_DB: sutharlabs_production
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-tuning.sql:/docker-entrypoint-initdb.d/init-tuning.sql

  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: sutharlabs_pgbouncer
    restart: always
    environment:
      DB_USER: sutharlabs_admin
      DB_PASSWORD: YOUR_SECURE_STRONG_PASSWORD_HERE
      DB_HOST: db
      DB_NAME: sutharlabs_production
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
      AUTH_TYPE: scram-sha-256
    ports:
      - "6432:6432"
    depends_on:
      - db

volumes:
  pgdata:
```

Start the containers:
```bash
cd /home/ubuntu/postgres
docker compose up -d
```

### Step 4.4: Automated Daily Backups on the VPS
Add a daily cron job that saves backups locally on the VPS and auto-prunes files older than 14 days:
```bash
crontab -e
```
Add the line:
```cron
0 2 * * * docker exec sutharlabs_postgres pg_dump -U sutharlabs_admin sutharlabs_production | gzip > /home/ubuntu/backups/db_$(date +\%F).sql.gz && find /home/ubuntu/backups -name "db_*.sql.gz" -mtime +14 -delete
```

---

## 5. Application Code Adjustment: Universal Prisma Adapter

Neon uses `@prisma/adapter-neon` with websockets. For Aiven or Oracle Cloud VPS (standard PostgreSQL), we update `api/_utils.ts` to support standard PostgreSQL pool connections natively via `@prisma/adapter-pg` or standard Prisma Client.

### Updated `api/_utils.ts` (Universal DB Adapter)
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import pg from 'pg';
import ws from 'ws';

let cachedPrisma: PrismaClient | null = null;

export function getPrismaClient() {
  if (cachedPrisma) return cachedPrisma;
  
  const dbUrl = process.env["DATABASE_URL"] || process.env["NEON_DB_URL"] || "";

  // 1. Neon Serverless detection
  if (dbUrl.includes("neon.tech")) {
    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({ connectionString: dbUrl });
    cachedPrisma = new PrismaClient({ adapter });
    return cachedPrisma;
  }

  // 2. Standard PostgreSQL (Aiven, Oracle VPS, Supabase, Local)
  if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    const pool = new pg.Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    cachedPrisma = new PrismaClient({ adapter });
    return cachedPrisma;
  }

  // 3. Fallback standard client
  cachedPrisma = new PrismaClient();
  return cachedPrisma;
}
```

---

## 6. Deployment Checklist When Ready

When you are ready to switch databases:

1. **Update `.env` locally**:
   ```ini
   DATABASE_URL="postgresql://username:password@host:port/database_name?sslmode=require"
   ```
2. **Run Schema Push**:
   ```bash
   npx prisma db push
   ```
   *This provisions all 13 tables, relations, and indexes in under 5 seconds.*
3. **Update Vercel Environment Variables**:
   - Go to Vercel Project Dashboard $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**.
   - Edit `DATABASE_URL` with your new connection string.
   - Trigger a Redeploy.
4. **Initial Data Seeding**:
   - The app's `/api/plugins/stock-tracker/strategies` and `/api/watchlists` endpoints automatically populate baseline strategies and watchlists from `data/*.json` on first visit.
