# SutharLabs Workflow Studio: Master Architecture & Logic Specification

> **Plugin ID:** `wp_flow_designer`  
> **Plugin Name:** Workflow (formerly Custom Flow)  
> **Version:** `v0.2.0` (Production)  
> **Route:** `/workspace/flow`  
> **Category:** Architecture & Automation  
> **Permissive License:** 100% Commercial-Safe Open-Source TypeScript  

---

## 1. Executive Summary

**Workflow Studio** (`wp_flow_designer`) is an autonomous, visual workflow automation and tool orchestration studio replicating modern n8n-style multi-tool architectures. It empowers developers and quantitative systems to chain HTTP webhooks, AI FinLLM agents, PostgreSQL queries, crontab timers, and conditional branching nodes into directed acyclic graphs (DAGs) with real-time execution feedback and payload inspection.

---

## 2. Supported Multi-Tool Node Types

Workflow Studio provides 6 core tool categories built for full commercial safety without closed-source proprietary dependencies:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TOOL PALETTE ECOSYSTEM                            │
├───────────────┬──────────────────────────┬──────────────────────────────────┤
│ Category      │ Node Type                │ Primary Function & Capabilities  │
├───────────────┼──────────────────────────┼──────────────────────────────────┤
│ Triggers      │ `CRON_TRIGGER`           │ Scheduled recurrence (e.g. 60s,  │
│               │                          │ EOD, weekly) for pipeline boot   │
│               │ `WEBHOOK_TRIGGER`        │ Inbound HTTP POST listener       │
├───────────────┼──────────────────────────┼──────────────────────────────────┤
│ Actions       │ `HTTP_REQUEST`           │ External REST API caller (GET,   │
│               │                          │ POST, PUT, DELETE with headers)  │
│               │ `DATABASE_QUERY`         │ SQL execution on PostgreSQL 16   │
│               │                          │ (SELECT, INSERT, UPDATE, AUDIT)  │
├───────────────┼──────────────────────────┼──────────────────────────────────┤
│ Intelligence  │ `AI_AGENT`               │ Sovereign FinLLM / Qwen / Claude │
│               │                          │ reasoning & prompt synthesis     │
├───────────────┼──────────────────────────┼──────────────────────────────────┤
│ Routing       │ `CONDITION`              │ Dynamic If/Else boolean branching│
│               │                          │ based on preceding node output   │
└───────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## 3. Visual Canvas & Ergonomics

* **Draggable Node Cards**: Floating glassmorphism cards with category badges, status indicators (`IDLE`, `RUNNING`, `SUCCESS`, `ERROR`), and parameter summaries.
* **Dynamic Bezier Splines**: SVG cubic bezier connecting curves ($C(x_1, y_1, x_2, y_2)$) auto-rendered between output ports and input ports with active flow animation dots.
* **Node Inspector Drawer**: Slide-over parameter configuration panel for editing URLs, HTTP headers, SQL queries, system prompts, and cron expressions.
* **Live Execution Console**: Real-time log inspector displaying step-by-step node execution status, durations, and output JSON payloads.

---

## 4. Pre-built Starter Templates

1. **AI Market Sentiment to Webhook Dispatch**:
   * Chaining: `Cron Schedule (09:15 IST)` $\to$ `HTTP Request (Google News RSS)` $\to$ `AI FinLLM Agent (Sentiment Scoring)` $\to$ `Condition (Score > 0.65)` $\to$ `Discord/Slack Webhook Alert`.
2. **API Health Probe & Failover Notification**:
   * Chaining: `Interval Trigger (60s)` $\to$ `HTTP Request (API Health Ping)` $\to$ `Condition (Status != 200)` $\to$ `DB Failover Logger`.
3. **Database Parity & Replication Audit**:
   * Chaining: `Cron Schedule (20:30 IST)` $\to$ `DB Query (Oracle Primary)` $\to$ `DB Query (Neon Standby)` $\to$ `Condition (Checksum Diff)` $\to$ `Trigger Sync`.

---

## 5. Security & Isolation

* **Execution Engine**: Sandboxed asynchronous execution runner with strict per-node timeouts (10s max) to prevent blocking browser threads.
* **Credential Masking**: Sensitive API keys and PostgreSQL connection strings configured in drawers are masked with bullets and never logged to plain-text browser consoles.
* **Portability**: Complete pipeline state can be exported as a portable JSON schema or loaded dynamically into backend background workers.
