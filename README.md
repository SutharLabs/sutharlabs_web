# SutharLabs Sovereign Engine Portal

Welcome to the **SutharLabs Sovereign Engine Portal**, a high-performance command center for modern developers. This workspace is engineered with a premium glassmorphic dark interface, real-time analytics, and visual microservice orchestration, providing an interactive, full-stack environment for deploying next-generation web apps, agents, and modular workflows.

---

## 🚀 Key Features & Applets

- **AI Studio & Autonomous Copilot**: Multi-mode reasoning workbench supporting **Chat**, **Plan**, **Agent**, and **Autonomous** modes, Model Context Protocol (MCP) tool integration, Contextual Hybrid BM25/Vector RRF RAG, and continuous cross-device session synchronization.
- **Open-Weight Image Studio**: Text-to-image synthesis and computer vision processing featuring **DeepSeek Janus-Pro-1B** (1.5B visual token LLM for CPU), **FLUX.1 [schnell]** (12B 4-step flow matching), **SDXL-Turbo**, and **Show-o (1.3B)**, with background removal and vision inspection via Qwen2.5-VL.
- **Speech Studio (v1.0.0 Production Enterprise Edition)**: Studio-grade neural text-to-speech with **Kokoro-82M** (complete 54-voice community-graded roster), **Piper** (deterministic sub-100ms C++ engine), zero-shot cloning with **F5-TTS**, and **Neural Voice Blending** (continuous acoustic latent vector interpolation).
- **NVDA Stock Tracker**: Interactive Bollinger predictive analytics panel with real-time SVG charting, trade execution (BUY/SELL), and multi-tabbed developer terminal logs.
- **Visual Flow Designer**: An interactive pipeline canvas using dynamic Bezier curves, draggable nodes, custom plugin triggers, and a schema dataset drop-zone (.csv/.json).
- **Ledger Accounting**: A financial payout analyzer featuring dynamic aggregate formula calculations, custom cycle bar metrics, and real-time client-filtering logs.
- **Admin Command Center**: Secure gateway cockpit with live hardware telemetry, system-wide maintenance locks, automated database parity synchronization (PostgreSQL 16 to Neon Standby), and sovereign mail server management.

---

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript + Lucide Icons + Framer Motion
- **Styling**: Tailwind CSS v4 featuring Curated Theme CSS-variables and Neon Matrix Grids
- **Backend Node**: Node.js + Express (Full-stack API & Vite middleware integration)
- **Database**: Local File-system JSON Database (`plugins-db.json`)

---

## 📂 Systems Documentation

- **[System Architecture & Documentation](docs/DOCUMENTATION.md)**: File directories, coordinate SVG math formulas, REST endpoints, and CSS theme specifications.
- **[Fleet Replication & Disaster Recovery Runbook](docs/oracle_vms_replication_and_disaster_recovery_runbook.md)**: Step-by-step instructions for cold-starting, provisioning, and replicating the entire 3-tier fleet (PostgreSQL 16, Ollama, Stalwart Mail, and Node.js gateway) on any fresh VPS in the event of provider shutdowns.
- **[System Updates & Full Changelog](docs/SYSTEM_UPDATES_AND_CHANGELOG.md)**: Complete chronological changelog of platform architecture milestones.

---

## ⚡ Run Locally

### Prerequisites
Make sure you have **Node.js** (v18 or higher recommended) installed.

### 1. Clone & Install Dependencies
Navigate to your local repository path and install the package dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and specify your credentials:
```bash
cp .env.example .env.local
```
*(Open `.env.local` and add your `GEMINI_API_KEY` to enable active model context features).*

### 3. Start the Full-Stack Workspace Server
Run the local hot-reloading development server:
```bash
npm run dev
```

Once running, navigate to **`http://localhost:3000`** in your browser to launch the portal.

---

## 📦 Production Builds

To compile and bundle client assets alongside the backend server into production targets:
```bash
npm run build
```
To run the optimized production bundle:
```bash
npm start
```

---

*Copyright &copy; 2026 SutharLabs. All rights reserved.*
