# SutharLabs Systems Documentation Catalog

Welcome to the central documentation index for **SutharLabs**. This repository houses institutional-grade technical specifications, runtime architecture guides, quantitative finance models, neural audio pipelines, and cloud fleet operational runbooks.

---

## 1. Documentation Taxonomy & Directory Map

```
docs/
├── README.md                          <-- Master Index (You are here)
│
├── plugins/                           <-- Workspace Plugins & Extension Ecosystem
│   ├── README.md                      (Plugin catalog overview)
│   ├── speech_studio_architecture_and_logic.md
│   ├── image_studio_architecture_and_logic.md
│   ├── stock_tracker_architecture_and_logic.md
│   ├── accounting_architecture_and_logic.md
│   ├── docnexus_studio_architecture_and_logic.md
│   ├── flow_designer_architecture_and_logic.md
│   ├── publishing_and_versioning.md
│   └── state_of_plugin_dev.md
│
├── stock-quant/                       <-- Quantitative Trading & Algorithmic Strategy Suite
│   ├── README.md                      (Quantitative models overview)
│   ├── quantitative_model_architecture.md   (How the Quant Model works, UI locations & indicators)
│   ├── top_rated_quant_algorithms_backtested.md (8 verified presets: Connors, Minervini, Dual Momentum)
│   ├── algo_review_and_roadmap.md     (Strategy engine & condition trees)
│   └── live_trading_execution_guide.md(Friction math, STT, brokerage API routing)
│
├── image-studio/                      <-- AI Image Generation & 4K Super-Resolution
│   ├── README.md                      (Image Studio overview)
│   ├── inference_limits_and_gpu_sizing.md   (Hardware sizing: Why 12B DiT cannot run on 2-vCPU ARM, 45s rate limit explanation, and zero-watermark guide)
│   ├── diffusion_models_and_pipelines.md    (FLUX.1 [schnell] 12B, SD 3.5 Large 8.1B, SDXL Turbo, aspect ratios)
│   └── super_resolution_and_clarity.md      (Sovereign Free Real-ESRGAN vs Clarity Generative 4K)
│
├── speech/                            <-- Neural Voice Synthesis & Cloning Engine
│   ├── README.md                      (Speech engine overview)
│   ├── tts_architecture_and_models.md (Edge TTS daemon on VM 2, IndicParler, MeloTTS, Kokoro, licensing)
│   └── voice_cloning_and_calibration.md(Phonetic calibration prompt, timbre fingerprinting, multi-voice profiles)
│
├── llm/                               <-- Sovereign Large Language Models & Agentic Inference
│   ├── README.md                      (LLM stack overview)
│   ├── inference_node_setup_and_benchmarks.md(VM 2 Ollama, 6 models, 8192 context, benchmarks)
│   ├── opencode_and_prompt_tuning.md  (OpenCode 2.5B, 6.4K context prompt optimization)
│   └── speculative_decoding_and_speedups.md (Jev research, draft models, EAGLE-2, Medusa, grammar decoding)
│
├── infrastructure/                    <-- Cloud Fleet, Replication & Disaster Recovery
│   ├── README.md                      (Fleet topology overview)
│   ├── oracle_fleet_and_replication.md(3-VM Oracle topology, primary-standby sync, disaster recovery)
│   ├── database_migration_and_backup.md(PostgreSQL 16, Neon DR, Prisma migrations)
│   ├── storage_vault_and_security.md  (VM 1 Encrypted Storage Vault, AES-256-GCM, JWT)
│   ├── data_segregation_and_privacy.md(Multi-tenant tenant isolation, cryptographic scoping)
│   └── pre_commit_and_deployment.md   (Pre-commit verification, deploy.sh automation)
│
└── design-system/                     <-- Sovereign Engine UI Guidelines & Tokens
    ├── README.md                      (Design system overview)
    └── ui_styling_and_icons.md        (Zero native browser dialogs, icon badges, theme contrast)
```

---

## 2. Quick Reference by Operational Domain

### A. Quantitative Finance & Trading (`docs/stock-quant/`)
* **[Quantitative Model Architecture](file:///d:/Code/SutharLabs/website/docs/stock-quant/quantitative_model_architecture.md)**: Discover how the quant model evaluates real-time tick feeds, where to find it in the UI (Right sidebar "AI & Strategy Signal", top bar "Algo Marketplace", "Screener", "Simulator"), and how the 18 indicators (EMA, VWAP, Supertrend, Bollinger Bands, RSI) drive recommendations.
* **[Top-Rated Algorithms Backtested](file:///d:/Code/SutharLabs/website/docs/stock-quant/top_rated_quant_algorithms_backtested.md)**: Empirical backtest statistics (Win rate, Sharpe ratio, Max drawdown, CAGR) for Larry Connors RSI-2, Minervini SEPA, and Dual Momentum.

### B. AI Image Generation & 4K Super-Resolution (`docs/image-studio/`)
* **[Inference Limits & GPU Sizing Guide](file:///d:/Code/SutharLabs/website/docs/image-studio/inference_limits_and_gpu_sizing.md)**: Hardware reality breakdown: Why FLUX.1 (12 Billion parameters) takes 8–15 minutes on a 2-vCPU ARM CPU vs 3.5s on NVIDIA H100 GPUs, why the 45s rate limit and pollinations watermark occurred, and how to get 100% watermark-free images via Hugging Face API keys.
* **[Diffusion Models & Pipelines](file:///d:/Code/SutharLabs/website/docs/image-studio/diffusion_models_and_pipelines.md)**: Complete parameter, licensing, and latent grid sizing specifications for FLUX.1 [schnell], SD 3.5 Large, and SDXL Turbo.
* **[Super-Resolution & Clarity 4K](file:///d:/Code/SutharLabs/website/docs/image-studio/super_resolution_and_clarity.md)**: Sovereign zero-cost Real-ESRGAN super-resolution vs generative Clarity 4K AI upscaling.

### C. Neural Voice Synthesis & Audio Cloning (`docs/speech/`)
* **[TTS Architecture & Models](file:///d:/Code/SutharLabs/website/docs/speech/tts_architecture_and_models.md)**: Edge TTS neural daemon on VM 2 (`132.226.190.125:5050`), architecture mapping (IndicParler, MeloTTS, Kokoro-82M, ChatTTS, CosyVoice-2), Devanagari script detection, and commercial licensing audit.
* **[Voice Cloning & Calibration](file:///d:/Code/SutharLabs/website/docs/speech/voice_cloning_and_calibration.md)**: Zero-shot voice cloning pipeline, standardized phonetic calibration test prompt, acoustic timbre fingerprinting (SHA-256 seed), and multi-profile library.

### D. Cloud LLM Inference & Speculative Decoding (`docs/llm/`)
* **[Inference Node Setup & Benchmarks](file:///d:/Code/SutharLabs/website/docs/llm/inference_node_setup_and_benchmarks.md)**: Oracle Cloud VM 2 Ollama configuration, 6 models, 8192 context window, token throughput benchmarks on 2-vCPU ARM.
* **[OpenCode & Agent Prompt Tuning](file:///d:/Code/SutharLabs/website/docs/llm/opencode_and_prompt_tuning.md)**: System prompt sizing (reduced from 6.4K to 48 tokens), 8K context optimization, and sub-second agent response latency.
* **[Speculative Decoding & Speedups](file:///d:/Code/SutharLabs/website/docs/llm/speculative_decoding_and_speedups.md)**: Research on Jev-style speculative decoding, draft model pairing, EAGLE-2, Medusa, and grammar-constrained JSON decoding on CPU.

### E. Oracle Cloud Fleet & DevOps (`docs/infrastructure/`)
* **[Oracle Fleet & Replication Runbook](file:///d:/Code/SutharLabs/website/docs/infrastructure/oracle_fleet_and_replication.md)**: Complete 3-VM Oracle topology, primary-standby sync, disaster recovery runbook, crontab automation, and Nginx reverse proxy configs.
* **[Database Migration & Backup](file:///d:/Code/SutharLabs/website/docs/infrastructure/database_migration_and_backup.md)**: Dual-database PostgreSQL 16 schema migrations, Prisma migrations, Neon DR replication, and cron synchronization.
* **[Pre-Commit & Deployment Automation](file:///d:/Code/SutharLabs/website/docs/infrastructure/pre_commit_and_deployment.md)**: Pre-commit checklist, packaging verification, deploy.sh automation on VM 3, and zero-downtime rolling restart.

### F. Design System & UI Guidelines (`docs/design-system/`)
* **[UI Styling, Icon Alignment & Modals Specification](file:///d:/Code/SutharLabs/website/docs/design-system/ui_styling_and_icons.md)**: Strict rules: Zero native browser dialogs (`<ConfirmModal />`), container icon badges, `shrink-0` rules, light/dark theme contrast matrices, and code highlight block standards.

### G. Production Deployment Automation (`docs/AUTOMATED_DEPLOYMENT_PROCEDURE.md`)
* **[Automated Deployment & Fleet Replication Runbook](file:///d:/Code/SutharLabs/website/docs/AUTOMATED_DEPLOYMENT_PROCEDURE.md)**: 1-command deployment (`npm run deploy` / `deploy-production.ps1`), 8-stage zero-downtime pipeline, 1GB RAM micro-VM build avoidance, and automated health checks.

### H. System Updates & Comprehensive Changelog (`docs/SYSTEM_UPDATES_AND_CHANGELOG.md`)
* **[System Updates & Release Changelog](file:///d:/Code/SutharLabs/website/docs/SYSTEM_UPDATES_AND_CHANGELOG.md)**: Detailed breakdown of the official 3D metallic branding, App Icon & Favicon Studio, Resume Studio standalone plugin, 6-mode multi-input CV parser, menu decluttering, and camera OCR integration.


