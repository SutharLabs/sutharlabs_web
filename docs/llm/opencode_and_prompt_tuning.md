# OpenCode & Sovereign LLM Agent Prompt Tuning

## Executive Summary
This document specifies the prompt engineering, context window sizing, and runtime configuration for the **OpenCode Developer Agent** and **Custom Studio Inference Node** on Oracle Cloud VM 2 (`132.226.190.125:4096` and `:11434`).

---

## 1. System Prompt Optimization & Token Budget

A primary cause of `⚠️ Inference Error: Failed to fetch` or timeout crashes during initial testing was an oversized default system prompt (6,400 tokens) on an Ollama model configured with an 8,192 token context window. This left only ~1,700 tokens for the user prompt and model generation, triggering context exhaustion and slow prompt ingestion on CPU.

### Optimized Production System Prompt
```
You are the Sovereign Cloud Architect and Senior Full-Stack Engineer at SutharLabs.
You specialize in TypeScript, React, Node.js, PostgreSQL, and Linux cloud systems.
Provide concise, institutional-grade solutions. Format code in markdown with syntax highlighting.
```
- **Prompt Size**: Reduced from 6,400 tokens to **48 tokens**.
- **Ingestion Latency**: Dropped from 3.8 seconds to **12 milliseconds**.
- **Available Context for User & Generation**: **8,144 tokens**.

---

## 2. Ollama Modelfile 8K Context Configuration

All models on VM 2 are built with explicit `num_ctx 8192` in their Modelfiles:

```dockerfile
FROM qwen2.5:1.5b
PARAMETER num_ctx 8192
PARAMETER temperature 0.6
PARAMETER top_p 0.9
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"
```

### Models Active on VM 2
1. `qwen2.5:1.5b` (Primary conversational & code generation model, ~50 tok/s)
2. `deepseek-r1:1.5b` (Reasoning & chain-of-thought mathematical model)
3. `llama3.2:1b` (Lightweight classifier & intent parser)
4. `smollm2:1.7b` (High-density summarization model)
5. `qwen2.5-coder:1.5b` (Dedicated code synthesis & review model)
6. `granite3-moe:1b` (Mixture-of-Experts high-efficiency model)

---

## 3. OpenCode Remote Bridge Architecture & Named Cloudflare Tunnel Runbook

### Current Architecture (Quick-Tunnel + Auto-Auth Cookie Bridge)
* **OpenCode Daemon (VM 2 `132.226.190.125`)**: `opencode web --port 4096 --hostname 127.0.0.1` (PM2 process `opencode`), protected by Basic Auth (`OPENCODE_SERVER_PASSWORD`).
* **Tunnel Runner (VM 2)**: `/home/ubuntu/start-opencode-tunnel.sh` (PM2 process `cloudflared-opencode`) runs `cloudflared tunnel --url http://127.0.0.1:80` and writes the active `https://*.trycloudflare.com` URL to `/tmp/opencode_url.json`.
* **Nginx Reverse Proxy (VM 2 `/etc/nginx/sites-available/default`)**:
  * `GET /opencode-url` serves `/tmp/opencode_url.json`.
  * `GET /_sl_bridge_auth?token=<ORACLE_AI_SECRET>` sets an `HttpOnly; SameSite=None; Secure` cookie (`sl_oc_auth`) and redirects `302` to `https://$http_host/`.
  * `location /` injects the upstream Basic Auth `Authorization` header (`$oc_upstream_auth`) only when `sl_oc_auth` is valid; direct public traffic still receives `401 Unauthorized`.
* **Backend Discovery (VM 3 `server.ts`)**:
  * `GET /api/ai/opencode-info` (public): checks `OPENCODE_PUBLIC_URL`, falls back to `http://132.226.190.125/opencode-url`, and runs a `HEAD` probe.
  * `GET /api/ai/opencode-bridge-session` (`authenticateToken` protected): returns `launchUrl` pointing to `/_sl_bridge_auth?token=...` for seamless iframe login in `AdminAIChatView.tsx`.

### Future Migration: Permanent Named Cloudflare Tunnel (`opencode.sutharlabs.com`)
Free `trycloudflare.com` quick-tunnels rotate subdomains on restart and can drop long-lived SSE/HTTP2 streams (`/global/event`), causing OpenCode SPA reconnect loops. When ready to switch to a permanent Named Cloudflare Tunnel:

1. **Create the Tunnel in Cloudflare Zero Trust**:
   * Open [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels** → **Create a tunnel** → **Cloudflared**.
   * Name it `vm2-opencode` and copy the connector token (`eyJhIjoi...`).
   * Add a **Public Hostname**:
     * **Subdomain**: `opencode`
     * **Domain**: `sutharlabs.com`
     * **Service**: `HTTP` → `127.0.0.1:80`
2. **Replace Quick-Tunnel on VM 2 (`132.226.190.125`)**:
   ```bash
   pm2 delete cloudflared-opencode
   pm2 start "cloudflared tunnel run --token <YOUR_CLOUDFLARE_TUNNEL_TOKEN>" --name cloudflared-opencode
   pm2 save
   ```
3. **Pin `OPENCODE_PUBLIC_URL` on VM 3 (`130.210.37.199`)**:
   ```bash
   echo 'OPENCODE_PUBLIC_URL="https://opencode.sutharlabs.com"' >> /home/ubuntu/website/.env
   pm2 restart sutharlabs-backend --update-env
   ```
4. **Verify**:
   ```bash
   curl -s https://www.sutharlabs.com/api/ai/opencode-info
   # Expected: {"url":"https://opencode.sutharlabs.com",...,"status":"online","reason":"Tunnel active"}
   ```


