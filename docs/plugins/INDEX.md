# SutharLabs Workspace Plugins: Master Documentation Index

> **Standard:** SutharLabs Sovereign Architecture  
> **Last Updated:** November 2026  
> **Documentation Strategy:** Centralized Master Catalog with Plugin-Specific Technical Specs

---

## 1. Documentation Organization Philosophy

To eliminate ambiguity across multiple developed plugins, the SutharLabs platform organizes documentation into **two strictly demarcated layers**:

```
docs/
├── state_of_plugin_dev.md                 # Core hybrid architecture & developer guide
├── plugin_versioning_and_releases.md      # SemVer 2.0.0, release hashing & packaging specs
├── plugin_publishing_guide.md             # Marketplace publishing workflow
└── plugins/                               # MASTER REPOSITORY OF ALL PLUGIN SPECIFICATIONS
    ├── INDEX.md                           # This Master Index (Current Document)
    ├── docnexus_studio_architecture_and_logic.md # DocNexus Studio (v0.2.0) Full Spec
    ├── accounting_architecture_and_logic.md      # Accounting ERP & GST (v0.2.3) Full Spec
    ├── stock_tracker_architecture_and_logic.md   # Stock Tracker & Quant (v1.1.3) Full Spec
    ├── speech_studio_architecture_and_logic.md   # Speech Studio Neural TTS (v0.3.0) Full Spec
    └── flow_designer_architecture_and_logic.md   # Custom Flow Designer (v0.1.0) Spec

src/plugins/<PluginName>/
└── README.md                              # Local quick-reference for the specific module
```

1. **Local Plugin Reference (`src/plugins/<PluginName>/README.md`)**:
   Lives right next to the code. Contains developer setup instructions, component breakdowns, file structure, and quick API tables.
2. **Master Architectural Specification (`docs/plugins/<plugin_spec>.md`)**:
   Provides exhaustive 360-degree regulatory, mathematical, architectural, and data contract specifications for stakeholders, auditors, and systems engineers.

---

## 2. Master Catalog of Developed Plugins

| Plugin Name | Identifier | Version | Category | Route | Local Reference | Master Architectural Specification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Doc Nexus** | `wp_doc_nexus` | `v0.3.0` | Creativity & Docs | `/workspace/docnexus` | [README.md](../../src/plugins/DocNexus/README.md) | [DocNexus Studio Architecture & Logic](./docnexus_studio_architecture_and_logic.md) |
| **Accounting** | `wp_accounting` | `v0.2.3` | Operations | `/workspace/accounting` | [README.md](../../src/plugins/Accounting/README.md) | [Accounting Architecture & GST Logic](./accounting_architecture_and_logic.md) |
| **Stock Tracker** | `wp_stock_analyzer`| `v1.1.3` | Finance | `/workspace/stock-tracker` | [README.md](../../src/plugins/StockTracker/README.md) | [Stock Tracker Algo Review & Quant Roadmap](./stock_tracker_architecture_and_logic.md) |
| **Speech Studio** | `speech-studio` | `v0.3.0` | AI & Audio | `/workspace/speech-studio` | In-Tree Module | [Speech Studio Architecture & Logic](./speech_studio_architecture_and_logic.md) |
| **Custom Flow** | `wp_flow_designer` | `v0.1.0` | Architecture | `/workspace/flow` | In-Tree Module | [Flow Designer Architecture Spec](./flow_designer_architecture_and_logic.md) |

---

## 3. High-Level Summary by Plugin

### A. Doc Nexus (`wp_doc_nexus` • v0.3.0)
* **Scope:** Omni-format creative document processing engine and visual design workspace (Adobe Acrobat, Canva, Notion & Excalidraw parity).
* **Paradigms:** Visual Vector Canvas, Technical Markdown with Sequence/Topology Compilers, Paginated A4 Executive Documents, High-Density Spreadsheets with Formulas, and 16:9 Presentation Slide Decks with Presenter Mode.
* **Storage:** Scoped per user in Neon PostgreSQL with in-memory fallback cache.
* **Endpoints:** `/api/plugins/wp_doc_nexus/documents`, `/templates`.

### B. Accounting ERP (`wp_accounting` • v0.2.3)
* **Scope:** Statutory Indian GST billing, double-entry general ledger, and ERP compliance suite (Frappe Books / ERPNext parity).
* **Compliance:** Section 31 CGST Act, Rule 46 Tax Invoicing, Section 128 Audit Trails, GSTR-1 & GSTR-3B offline JSON generation, and 64-char SHA-256 E-Invoice IRN calculation.
* **Storage:** Multi-tenant PostgreSQL store (`AccountingTenantStore`) with local disk fallback cache.
* **Endpoints:** `/api/plugins/wp_accounting/invoices`, `/company`, `/parties`, `/reports/gstr-1`.

### C. Stock Tracker (`wp_stock_analyzer` • v1.1.3)
* **Scope:** Enterprise quantitative trading and market analytics platform (TradingView & QuantConnect parity).
* **Engines:** Live WebSocket price streaming, Bollinger Bands, RSI indicators, automated deterministic order simulation, and institutional strategy backtesting.
* **Storage:** Neon PostgreSQL `Portfolio` and `SimulationStore` tables.
* **Endpoints:** `/api/plugins/wp_stock_analyzer/*`, `/api/workspace/stock-analyzer/*`.

### D. Speech Studio (`speech-studio` • v0.3.0)
* **Scope:** Enterprise neural text-to-speech studio, multi-engine architecture selector, expressive vocal dynamics, and zero-shot voice cloning.
* **Engines:** Edge-TTS Neural Fleet (13+ voices across Hindi, Indian English, US & UK English), F5-TTS (Flow-Matching with CFG Guidance), Kokoro-82M (Apache 2.0), ChatTTS (Conversational Dialogue Tokens), and CosyVoice 2 (Apache 2.0).
* **Licensing Compliance:** Full audit covering Apache 2.0, MIT, and CC-BY-NC 4.0 usage terms for commercial applications.
* **Endpoints:** `/api/plugins/speech-studio/models`, `/voices`, `/synthesize`, `/quota`.

### E. Custom Flow Designer (`wp_flow_designer` • v0.1.0)
* **Scope:** Interactive system node topology designer and microservice workflow modeler.
* **Features:** Node drag-and-drop, connection routing, status toggling, and JSON import/export.
* **Storage:** PostgreSQL `FlowNode` table.
* **Endpoints:** `/api/plugins/wp_flow_designer/*`, `/api/nodes`.

---

## 4. Package Release Catalog & Verification

All plugin packages are verified through the SutharLabs packaging pipeline (`scripts/package-plugins.ts`):
* **Storage Location:** `storage/plugins/`
* **Encryption Standard:** AES-256-GCM authenticated cipher with proprietary IV & auth tags.
* **Catalog Manifest:** [`storage/plugins/catalog-manifest.json`](file:///d:/Code/SutharLabs/website/storage/plugins/catalog-manifest.json)
* **Database Tracking:** `WorkspacePluginVersion` in Neon Serverless PostgreSQL.
