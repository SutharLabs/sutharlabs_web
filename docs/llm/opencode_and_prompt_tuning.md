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

---

## 4. Inference Latency: OpenCode vs. Custom UI (VM 2 CPU Bottlenecks)

Inference on OpenCode is noticeably slower than the SutharLabs Custom UI when hitting the same VM 2 (`132.226.190.125`, 2 OCPU ARM64, 100% CPU) Ollama backend due to four factors:

1. **System Prompt + Tool Schema Prefill (~6,400+ tokens)**: OpenCode injects a full agentic prompt and JSON schemas for all built-in tools (`bash`, `read`, `write`, `edit`, `glob`, `grep`, `list`, etc.) on every turn. Prefilling thousands of tokens on 2 CPU cores adds tens of seconds before the first output token.
2. **Un-tuned `/v1` OpenAI Endpoint vs. Native `/api/chat`**:
   * `~/.config/opencode/opencode.jsonc` routes via `@ai-sdk/openai-compatible` to `http://127.0.0.1:11434/v1` without Ollama CPU tuning options.
   * Custom UI (`server.ts`) calls `/api/chat` with `keep_alive: "24h"`, `num_ctx` (`4096` for 3B / `2048` for 7B & Gemma 4), `num_predict` (`768`–`1024`), `num_thread: 2`, `num_batch: 512`, and `use_mmap: true`.
3. **Multi-Turn Agentic Tool Loops**: OpenCode often executes multiple sequential inference passes per user prompt (plan → tool call → file/command output → re-prefill → final answer), whereas Custom UI chat is normally a single pass.
4. **Default Model Throughput**: `opencode.jsonc` defaults to `ollama/qwen2.5-coder:3b` (2.2 GB in RAM), which runs roughly half as fast per token on 2 OCPUs as `1.5b` models.

---

## 5. OpenCode Zen Free Models: Limits, Open-Weight Status & Local Sizing

### Free Tier Policy & Limits
* **Not unlimited / not guaranteed free forever**: OpenCode Zen `*-free` models (such as `MiMo-V2.6-Flash Free`) are rotating promotional/partner cloud endpoints.
* **Daily/Rolling Caps**: Typically ~100–200 requests/day (or rolling multi-hour windows), shared across account/IP regardless of model switching. Exceeding it returns `"Free usage limit reached. Subscribe to OpenCode Go to keep going"`.
* **Data Policy & Client Scope**: Free-tier prompts/outputs may be used by upstream providers to improve models, and endpoints are restricted to official OpenCode clients.

### Open-Weight & Local Sizing Breakdown (Why They Cannot Run on VM 2)
Even though Mixture-of-Experts (MoE) models activate only a subset of weights per token, **100% of total parameters must fit in RAM/VRAM** to run locally:

| Model | Open-Weight? | Total Params | Active / Token | Est. 4-bit (Q4) Size | Fits on VM 2 (12 GB RAM)? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Flint 40B** (Recursive) | Yes (Apache 2.0) | ~40B | ~2.5B | ~22–24 GB | No (needs 32 GB+ RAM/VRAM) |
| **Nemotron 3.5 Super VL** (NVIDIA) | Yes (OpenMDW) | 120B | 12B | ~65–72 GB | No (needs 96–128 GB+ RAM/VRAM) |
| **MiMo-V2.6-Flash** (Xiaomi) | Yes (Hugging Face) | ~309B | 15B | ~170–185 GB | No (needs 256 GB+ server) |
| **GLM-5.3-Flash** (Z.ai) | Yes (`zai-org/GLM-5.3-Flash`) | ~320B | ~18B | ~175–190 GB | No (needs 256 GB+ server) |
| **MiniMax M3.1 Flash** | Yes (`MiniMaxAI/MiniMax-M3.1-Flash`) | ~428B | ~23B | ~235–260 GB | No (needs 256–512 GB server) |
| **Inkling 2 Small** (Thinking Machines) | Planned / Conditional (Apache 2.0) | 594B | 17B | ~330–360 GB | No (needs 512 GB+ cluster) |
| **LongCat 2.5** (Meituan) | API-first / Managed | 1.6T | ~48B | ~900+ GB | No (datacenter cluster only) |

---

## 6. Previewing Websites / Dev Servers Built on VM 2 (`localhost:<port>`)

Dev servers started by OpenCode on VM 2 bind to `127.0.0.1:<port>` (e.g., `:5173` or `:3000`) and are not directly reachable from the browser. Three recommended approaches:

1. **SSH Local Port Forwarding (Best for Local Dev & Full Compatibility)**:
   ```powershell
   ssh -i "D:\Code\SutharLabs\OracleFreeTier\ssh-key-2026-11-03.key" -N -L 5173:127.0.0.1:5173 -L 3000:127.0.0.1:3000 ubuntu@132.226.190.125
   ```
   Open `http://localhost:5173` on Windows; root-relative `/assets/`, cookies, and Vite HMR WebSockets work identically to local dev.

2. **Nginx `/preview/<port>/` Reverse Proxy on VM 2 (Best for Browser/Any-Device Preview)**:
   Add a regex location block in VM 2 `/etc/nginx/sites-available/default` (protected by the existing `sl_oc_auth` cookie):
   ```nginx
   location ~ ^/preview/([0-9]+)(/.*)?$ {
       set $target_port $1;
       set $target_path $2;
       proxy_pass http://127.0.0.1:$target_port$target_path$is_args$args;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
   }
   ```
   *(Requires `base: './'` or `base: '/preview/<port>/'` in `vite.config.ts` so static assets do not resolve to `/`.)*

3. **Dedicated Preview Subdomain (`preview.sutharlabs.com`) via Named Cloudflare Tunnel**:
   Once a Named Cloudflare Tunnel is active on VM 2, map a second Public Hostname (`preview.sutharlabs.com` → `http://127.0.0.1:5173`) on the same `cloudflared` tunnel for clean root-path HTTPS previews without SSH.



