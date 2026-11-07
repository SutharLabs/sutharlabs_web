# SutharLabs Workspace Plugins: Master Documentation Index

> **Standard:** SutharLabs Sovereign Architecture  
> **Last Updated:** November 2026  
> **Documentation Strategy:** Centralized Master Catalog with Plugin-Specific Technical Specs

---

## 1. Documentation Organization Philosophy

To eliminate ambiguity across all workspace plugins, the SutharLabs platform organizes documentation into **two strictly demarcated layers**:

```
docs/
├── state_of_plugin_dev.md                 # Core hybrid architecture & developer guide
├── plugin_versioning_and_releases.md      # SemVer 2.0.0, release hashing & packaging specs
├── plugin_publishing_guide.md             # Marketplace publishing workflow
└── plugins/                               # MASTER REPOSITORY OF ALL PLUGIN SPECIFICATIONS
    ├── INDEX.md                           # This Master Index (Current Document)
    ├── docnexus_studio_architecture_and_logic.md # DocNexus Studio & PDF Suite Full Spec
    ├── accounting_architecture_and_logic.md      # Accounting ERP, Tally/MARG & GST Full Spec
    ├── stock_tracker_architecture_and_logic.md   # Stock Tracker & Quant Engine Full Spec
    ├── speech_studio_architecture_and_logic.md   # Speech Studio Neural TTS & Hush Studio Full Spec
    ├── flow_designer_architecture_and_logic.md   # Custom Flow Designer Architecture Spec
    ├── studiocast_architecture_and_logic.md      # StudioCast Broadcast & Podcast Spec
    └── resume_studio_architecture_and_logic.md   # Resume Studio Multi-Format & Vector Export Spec
```

---

## 2. Master Catalog of Developed Plugins

| Plugin Name | Identifier | Version | Category | Route | Architecture Specification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **StudioCast** | `wp_studiocast` | `v1.0.0` | Media & Podcasting | `/workspace/podcast` | [StudioCast Architecture & Logic](./studiocast_architecture_and_logic.md) |
| **Resume Studio** | `wp_resume_studio` | `v1.0.0` | Productivity & Career | `/workspace/resume` | [Resume Studio Architecture & Logic](./resume_studio_architecture_and_logic.md) |
| **Accounting ERP** | `wp_accounting` | `v0.2.3` | Operations & ERP | `/workspace/accounting` | [Accounting Architecture & GST Logic](./accounting_architecture_and_logic.md) |
| **Speech Studio** | `speech-studio` | `v0.3.2` | AI & Audio | `/workspace/speech-studio` | [Speech Studio Architecture & Logic](./speech_studio_architecture_and_logic.md) |
| **Doc Nexus** | `wp_doc_nexus` | `v0.3.0` | Creativity & Docs | `/workspace/docnexus` | [DocNexus Studio Architecture & Logic](./docnexus_studio_architecture_and_logic.md) |
| **Stock Tracker** | `wp_stock_analyzer`| `v1.1.3` | Finance & Quant | `/workspace/stock-tracker` | [Stock Tracker Algo Review & Quant Roadmap](./stock_tracker_architecture_and_logic.md) |
| **Custom Flow** | `wp_flow_designer` | `v0.1.0` | Architecture | `/workspace/flow` | [Flow Designer Architecture Spec](./flow_designer_architecture_and_logic.md) |
| **Image Studio** | `image-studio` | `v0.1.0` | AI & Multimedia | `/workspace/image-studio` | [Image Studio Architecture & Logic](./image_studio_architecture_and_logic.md) |
| **Tools Studio** | `wp_sovereign_tools`| `v1.0.0`| Utilities & Productivity| `/workspace/tools` | [Sovereign Tools Procedure](../SOVEREIGN_TOOLS_PROCEDURE.md) |

---

## 3. High-Level Technical Summary by Plugin

### A. StudioCast (`wp_studiocast` • v1.0.0)
* **Scope:** Live virtual broadcast and multi-track podcast recording studio with OBS Studio, Riverside.fm, and StreamYard parity.
* **Capabilities:** Zero-config WebRTC peer-to-peer video/audio calling, instant shareable guest links (`/workspace?plugin=studiocast&room=POD-XXXX`), and raw ISO track recording & download.
* **Compositor Engine:** HTML5 Canvas live video stream compositor supporting 5 fixed virtual presets (Side-by-Side 50/50 Split, Studio Grid 2x2, Spotlight + PIP, Broadcast Newsroom with Lower Thirds, and Cyberpunk Sovereign Minimal).
* **Endpoints:** `/api/podcast/rooms`, `/join`, `/signal`, `/preset`, `/chat`, `/recordings`.

### B. Resume Studio (`wp_resume_studio` • v1.0.0)
* **Scope:** Enterprise sovereign Resume & CV Studio supporting multi-format document ingestion and high-fidelity vector rendering.
* **Ingestion:** Microsoft Word DOCX (`jszip`), PDF (`pdfjs-dist`), LaTeX `.tex`, Markdown, Plain Text, and JSON Resume.
* **Export:** High-DPI Vector PDF (`pdf-lib`), formatted Word DOCX, compilable LaTeX moderncv `.tex`, and ATS Plain Text.
* **Privacy:** 100% client-side parsing; zero resumes uploaded to third-party clouds.

### C. Accounting ERP (`wp_accounting` • v0.2.3)
* **Scope:** Statutory Indian GST billing, double-entry general ledger, and ERP compliance suite (Frappe Books, Tally ERP, and MARG ERP parity).
* **Workflows:** Gateway of SutharLabs dual-pane layout with keyboard-first shortcut rail (`F1`..`F12`).
* **Multimodal OCR:** Live camera capture and file upload for English and Hindi receipts, with client-side canvas compression (`compressImage`) to eliminate API timeouts, pre-filling itemized vouchers before ledger posting.
* **Endpoints:** `/api/invoices`, `/parties`, `/reports/gstr1`, `/reports/gstr3b`, `/ocr-receipt`.

### D. Speech Studio (`speech-studio` • v0.3.2)
* **Scope:** High-fidelity multilingual neural text-to-speech, voice cloning, and acoustic reference synthesis.
* **Hush Studio Integration:** VoxCPM 0.5B offline in-context acoustic reference matching engine with 6 built-in reference voices (`Aria`, `Jenny`, `Maya`, `Ethan`, `Cole`, `Priya`).
* **Breeze-TTS-2 Evaluation:** 250M parameter SOTA Hindi/English model compatible with CPU edge inference.
* **Endpoints:** `/api/plugins/speech-studio/voices`, `/models`, `/cloned-voices`, `/synthesize`, `/quota`.

### E. Doc Nexus (`wp_doc_nexus` • v0.3.0)
* **Scope:** Omni-format creative document processing engine and visual design workspace (Adobe Acrobat, Canva, Notion & Excalidraw parity).
* **Endpoints:** `/api/docnexus/documents`, `/templates`, `/tools/ocr`.

### F. Stock Tracker (`wp_stock_analyzer` • v1.1.3)
* **Scope:** Real-time stock portfolio simulation, quantitative backtesting, market sentiment analysis, and risk parity metrics.
* **Endpoints:** `/api/workspace/stock-analyzer/quote`, `/backtest`, `/simulations`.
