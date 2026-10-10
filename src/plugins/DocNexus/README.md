# DocNexus Studio & Creative Document Suite

> **Plugin ID:** `wp_doc_nexus`  
> **Version:** `v3.0.0` (Production Release)  
> **Category:** Creativity & Docs  
> **Standard:** Isomorphic Omni-Format Document Processing (Adobe Acrobat / Canva / Notion / Excalidraw Parity)  
> **Detailed Master Specification:** See [DocNexus Architecture & Logic Specification](../../../docs/plugins/docnexus_studio_architecture_and_logic.md)

---

## 1. Overview

**DocNexus Studio** is an omni-format creative document processing engine and design workspace built for the SutharLabs platform. Rather than restricting users to plain markdown, DocNexus dynamically transforms its canvas into 5 distinct native document paradigms:

1. **🎨 Visual Vector Canvas (Canva & Adobe Illustrator Mode)**: Interactive whiteboard supporting vector rectangles, rounded cards, circular nodes, decision diamonds, sticky notes, connectors/arrows, text boxes, status badges, drag-and-drop movement, and z-index layer ordering.
2. **📝 Technical Markdown Studio (Notion & Obsidian Mode)**: Synchronized split-pane editor with live Table of Contents, smart sequence compiler (`Actor1 -> Actor2: Message`), network topology visualizer (`[Node1] === [Node2]`), sortable tables, and 1-click code copying.
3. **📄 Paginated Executive Document (Adobe Acrobat Mode)**: Realistic multi-page A4 and Letter paper sheets with official margins, headers, footers, page numbering, diagonal watermarks (`CONFIDENTIAL`, `OFFICIAL`, `DRAFT`), and vector print preview.
4. **📊 Data Grid & Spreadsheet (Canva Tables & Excel Mode)**: High-density matrix grid with configurable columns, cell types (Text, Currency ₹, Number, Status, Date), summary calculation rows, sorting, and CSV import/export.
5. **📽️ Slide Deck Studio (Canva Slides & Pitch Mode)**: 16:9 presentation slide engine with thumbnail timelines, layout presets, speaker notes, and an interactive **Fullscreen Presenter Mode** navigable via arrow keys.

---

## 2. Directory Structure

```
src/plugins/DocNexus/
├── manifest.json               # Package metadata descriptor (v3.0.0)
├── manifest.ts                 # Strongly-typed manifest for client bundling
├── index.ts                    # Client entrypoint exporting manifest + DocNexusStudio
├── routes.ts                   # Express REST API controller
├── types.ts                    # TypeScript data contracts & scene interfaces
├── storage.ts                  # Multi-tenant PostgreSQL persistence & fallback cache
├── templates.ts                # Built-in gallery of blueprints across all 5 formats
├── README.md                   # Plugin reference guide
└── components/
    ├── DocNexusStudio.tsx      # Master studio shell & top control bar
    ├── DocExplorerSidebar.tsx  # Document vault browser, search & format filters
    ├── CanvasStudio.tsx        # Vector design artboard & whiteboard
    ├── MarkdownStudio.tsx      # Dual-pane markdown, sequence & topology engine
    ├── RichDocStudio.tsx       # Paginated A4 executive document editor
    ├── SpreadsheetStudio.tsx   # Matrix spreadsheet grid with formulas
    ├── SlideDeckStudio.tsx     # Presentation deck & presenter mode
    ├── InspectorPanel.tsx      # Context-sensitive styling & properties drawer
    ├── TemplateLibraryModal.tsx# Pre-built blueprint picker
    └── ExportModal.tsx         # Universal exporter (PDF, SVG, MD, HTML, CSV, JSON)
```

---

## 3. REST API Reference

Mounted under `/api/plugins/wp_doc_nexus/` with JWT authentication (`Bearer <token>`):

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/templates` | List preloaded blueprints across all 5 formats |
| `GET` | `/documents` | List all user documents with metadata and tags |
| `POST` | `/documents` | Create new document (from scratch or template clone) |
| `GET` | `/documents/:id` | Fetch complete document content and scene state |
| `PUT` | `/documents/:id` | Save changes to title, format, content, or metadata |
| `DELETE`| `/documents/:id` | Delete document from user vault |
| `POST` | `/documents/:id/duplicate` | 1-Click clone document |
| `GET` | `/document` | *(Legacy)* Fetch default guide document |
| `POST` | `/document` | *(Legacy)* Save default guide document |

---

## 4. Multi-Tenant Persistence

DocNexus implements a multi-tenant persistence layer in [`storage.ts`](file:///d:/Code/SutharLabs/website/src/plugins/DocNexus/storage.ts):
* Scoped per user email (`req.user.email`).
* Documents are stored in Neon Serverless PostgreSQL with automatic in-memory and SQLite cache fallbacks.
* Users visiting DocNexus for the first time are automatically initialized with 5 ready-to-run template documents demonstrating each format.

---

## 5. Security & Packaging Pipeline

When running `npm run package:plugins`:
* The source directory is compressed into `storage/plugins/wp_doc_nexus-v3.0.0.zip`.
* The archive is encrypted using **AES-256-GCM** via [`pluginCrypto.ts`](file:///d:/Code/SutharLabs/website/src/plugins/security/pluginCrypto.ts).
* An immutable SHA-256 hash is computed.
* Release records are automatically synchronized to the `WorkspacePluginVersion` table in Neon PostgreSQL.
