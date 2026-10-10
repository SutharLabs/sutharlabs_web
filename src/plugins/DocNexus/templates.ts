import { DocTemplate } from "./types.js";

export const BUILT_IN_TEMPLATES: DocTemplate[] = [
  // 1. Visual Vector Canvas Templates (Canva / Adobe style)
  {
    id: "tpl_canvas_architecture",
    name: "Microservices System Architecture",
    format: "canvas",
    category: "Architecture & Design",
    description: "Visual cloud topology with load balancers, gateway services, databases, and message queues.",
    iconSymbol: "account_tree",
    defaultTitle: "Distributed Cloud Architecture Canvas",
    metadata: { format: "canvas", tags: ["cloud", "architecture", "microservices"], category: "Design" },
    initialContent: JSON.stringify({
      width: 1000,
      height: 650,
      backgroundColor: "#0d0d11",
      gridSnap: true,
      aspectRatio: "16:9",
      elements: [
        { id: "e1", type: "badge", x: 80, y: 180, width: 140, height: 60, text: "React 19 Client", fill: "#132338", stroke: "#00dbe7", strokeWidth: 2, textColor: "#74f5ff", fontSize: 13, zIndex: 1, shadow: true },
        { id: "e2", type: "arrow", x: 230, y: 210, width: 80, height: 2, text: "HTTPS / WSS", stroke: "#00dbe7", strokeWidth: 2, zIndex: 2 },
        { id: "e3", type: "rect", x: 320, y: 150, width: 180, height: 120, text: "Nginx Ingress / Gateway\nRate Limiting & Auth", fill: "#211633", stroke: "#ce5dff", strokeWidth: 2, textColor: "#ebb2ff", fontSize: 12, zIndex: 1, shadow: true },
        { id: "e4", type: "arrow", x: 510, y: 210, width: 90, height: 2, text: "Internal gRPC", stroke: "#ce5dff", strokeWidth: 2, zIndex: 2 },
        { id: "e5", type: "card", x: 610, y: 100, width: 170, height: 90, text: "Core API Cluster\nExpress + Node.js", fill: "#142c22", stroke: "#00e476", strokeWidth: 2, textColor: "#00e476", fontSize: 12, zIndex: 1, shadow: true },
        { id: "e6", type: "card", x: 610, y: 230, width: 170, height: 90, text: "Quant & Analytics\nWorker Pool", fill: "#142c22", stroke: "#00e476", strokeWidth: 2, textColor: "#00e476", fontSize: 12, zIndex: 1, shadow: true },
        { id: "e7", type: "arrow", x: 790, y: 145, width: 60, height: 2, text: "SQL", stroke: "#ffb4ab", strokeWidth: 2, zIndex: 2 },
        { id: "e8", type: "circle", x: 860, y: 100, width: 100, height: 100, text: "Neon\nPostgres", fill: "#2e1215", stroke: "#ffb4ab", strokeWidth: 2, textColor: "#ffb4ab", fontSize: 12, zIndex: 1, shadow: true },
        { id: "e9", type: "sticky", x: 80, y: 360, width: 220, height: 120, text: "Architectural Notes:\n- Zero Trust ingress validation\n- Asynchronous event bus via Redis\n- TLS 1.3 encryption across nodes", fill: "#2c2813", stroke: "#ffd700", strokeWidth: 1, textColor: "#fff280", fontSize: 11, zIndex: 3 }
      ]
    })
  },
  {
    id: "tpl_canvas_product_card",
    name: "Canva Product Banner & Mockup",
    format: "canvas",
    category: "Graphic Design",
    description: "Creative product showcase banner with visual badges, callouts, and gradient headers.",
    iconSymbol: "palette",
    defaultTitle: "SutharLabs Product Showcase Banner",
    metadata: { format: "canvas", tags: ["marketing", "banner", "graphics"], category: "Creativity" },
    initialContent: JSON.stringify({
      width: 900,
      height: 500,
      backgroundColor: "#0a0a0f",
      gridSnap: true,
      aspectRatio: "16:9",
      elements: [
        { id: "c1", type: "rect", x: 50, y: 50, width: 800, height: 400, text: "", fill: "#131318", stroke: "#3a494b", strokeWidth: 1, zIndex: 0, borderRadius: 16 },
        { id: "c2", type: "text", x: 90, y: 90, width: 500, height: 60, text: "SutharLabs Sovereign Suite", textColor: "#ffffff", fontSize: 28, zIndex: 1 },
        { id: "c3", type: "badge", x: 90, y: 160, width: 130, height: 35, text: "v0.2.0 Beta Release", fill: "#ce5dff", textColor: "#ffffff", fontSize: 11, zIndex: 1 },
        { id: "c4", type: "card", x: 90, y: 220, width: 320, height: 160, text: "Enterprise Document Processor\n\n- Visual Vector Whiteboard\n- Paginated PDF Publisher\n- High-Density Data Grids", fill: "#1a1a24", stroke: "#00dbe7", strokeWidth: 1, textColor: "#b9cacb", fontSize: 13, zIndex: 1, borderRadius: 8 },
        { id: "c5", type: "card", x: 440, y: 220, width: 360, height: 160, text: "Algorithmic Trading & ERP\n\n- Indian Rule 46 Tax Invoicing\n- Real-Time Bollinger Indicators\n- GSTR-1 Return JSON Generation", fill: "#1a1a24", stroke: "#00e476", strokeWidth: 1, textColor: "#b9cacb", fontSize: 13, zIndex: 1, borderRadius: 8 }
      ]
    })
  },

  // 2. Technical Markdown & Flow Templates
  {
    id: "tpl_md_system_spec",
    name: "System Architecture & API Spec",
    format: "markdown",
    category: "Technical Docs",
    description: "Full software specification featuring sequence diagrams, network topologies, and data tables.",
    iconSymbol: "terminal",
    defaultTitle: "Enterprise Software Architecture Spec",
    metadata: { format: "markdown", tags: ["spec", "engineering", "diagrams"], category: "Documentation" },
    initialContent: `# Enterprise Architecture & Protocol Specification

Welcome to the **SutharLabs Sovereign Documentation Engine**. This document demonstrates high-performance Markdown formatting, interactive sequence flows, and network topologies.

> [!NOTE]
> This document is compiled isomorphic to HTML, Markdown, and print-ready PDF formats.

## 1. Authentication & Session Flow
The sequence diagram below compiles automatically into an interactive calling diagram:

\`\`\`sequence
Client -> Gateway: POST /api/auth/token
Gateway -> Redis: Validate Session HMAC
Gateway -> Client: 200 OK + JWT Bearer Token
Client -> DocNexus: GET /api/plugins/wp_doc_nexus/documents
DocNexus -> Client: 200 OK Array[Document]
\`\`\`

## 2. Infrastructure Node Topology
Visualize multi-tier microservices topologies dynamically:

\`\`\`topology
[ClientSPA] === [CloudflareWAF]
[CloudflareWAF] === [ExpressGateway]
[ExpressGateway] --- [NeonPostgreSQL]
[ExpressGateway] --- [RedisSessionCache]
\`\`\`

## 3. SLA & Node Telemetry Matrix

| Cluster Node | Region | P99 Latency | Availability | Health |
| :--- | :--- | :---: | :---: | :---: |
| edge-ap-south-1 | Mumbai | 12ms | 99.98% | NOMINAL |
| edge-eu-central-1 | Frankfurt | 24ms | 99.95% | NOMINAL |
| edge-us-east-1 | N. Virginia | 19ms | 99.99% | NOMINAL |
`
  },

  // 3. Paginated Rich Document Templates (Adobe Acrobat style)
  {
    id: "tpl_doc_charter",
    name: "Executive Project Charter & Agreement",
    format: "richtext",
    category: "Corporate & Legal",
    description: "Paginated A4 executive document with official margins, watermarks, headers, and signature lines.",
    iconSymbol: "history_edu",
    defaultTitle: "Enterprise Software Engineering Charter",
    metadata: { format: "richtext", tags: ["legal", "contract", "charter"], category: "Operations" },
    initialContent: JSON.stringify({
      paperSize: "A4",
      orientation: "portrait",
      margins: "normal",
      headerText: "SUTHARLABS PRIVATE LIMITED • CONFIDENTIAL ENTERPRISE CHARTER",
      footerText: "Page {page} of {total} • Subject to Non-Disclosure Agreement",
      showPageNumbers: true,
      pages: [
        {
          id: "p1",
          title: "STATEMENT OF WORK & ARCHITECTURE COMMITMENT",
          watermark: "CONFIDENTIAL",
          body: `1. PROJECT OBJECTIVE
This Project Charter establishes the terms, operational parameters, and technical deliverables for the engineering engagement undertaken by SutharLabs.

2. SCOPE OF WORK & NATIVE PLUGINS
The engineering suite encompasses the following core native workspace modules:
- Indian GST Invoicing & Accounting Engine (Rule 46 & Section 128 Audit Trails)
- Multi-Asset Algorithmic Trading Suite & Quantitative Backtesting Simulator
- DocNexus Omni-Format Creative Processing Studio (Canva / Adobe / Markdown)

3. INTELLECTUAL PROPERTY & DATA SOVEREIGNTY
All source artifacts, cryptographic hashing functions, and tenant data structures shall remain solely under the sovereignty and legal governance of the enterprise client.`
        },
        {
          id: "p2",
          title: "STATUTORY COMPLIANCE & EXECUTION SIGN-OFF",
          watermark: "OFFICIAL",
          body: `4. ACCEPTANCE CRITERIA
Deliverables shall undergo automated linting, zero-regression type checks, and cryptographic AES-256 package verification prior to production rollout.

5. SIGNATURE & AUTHORIZATION

___________________________________________
Principal Software Architect, SutharLabs

Date: October 10, 2026


___________________________________________
Enterprise Client Representative

Date: October 10, 2026`
        }
      ]
    })
  },

  // 4. Data Grid & Spreadsheet Templates (Sheets style)
  {
    id: "tpl_sheet_budget",
    name: "Cloud Infrastructure Budget Matrix",
    format: "sheet",
    category: "Financials & Data",
    description: "Tabular spreadsheet with currency calculations, category sorting, and automated cost summaries.",
    iconSymbol: "table_chart",
    defaultTitle: "Cloud Infrastructure Operational Budget",
    metadata: { format: "sheet", tags: ["finance", "cloud", "budget"], category: "Operations" },
    initialContent: JSON.stringify({
      currencySymbol: "₹",
      showSummaryRow: true,
      columns: [
        { id: "col_service", name: "Infrastructure Component", type: "text", width: 220 },
        { id: "col_provider", name: "Provider", type: "text", width: 140 },
        { id: "col_qty", name: "Allocated Units", type: "number", width: 120 },
        { id: "col_cost", name: "Monthly Cost (₹)", type: "currency", width: 160 },
        { id: "col_status", name: "Tier Status", type: "status", width: 120 }
      ],
      rows: [
        { id: "r1", cells: { col_service: "Neon Serverless PostgreSQL", col_provider: "Neon.tech", col_qty: 4, col_cost: 4500, col_status: "Active" } },
        { id: "r2", cells: { col_service: "Vercel Edge Functions", col_provider: "Vercel Inc.", col_qty: 1, col_cost: 1650, col_status: "Active" } },
        { id: "r3", cells: { col_service: "Hostinger Dedicated VPS (KVM)", col_provider: "Hostinger", col_qty: 2, col_cost: 3200, col_status: "Active" } },
        { id: "r4", cells: { col_service: "Vercel Blob Storage CDN", col_provider: "Vercel Blob", col_qty: 50, col_cost: 950, col_status: "Active" } },
        { id: "r5", cells: { col_service: "Cloudflare Zero Trust DNS", col_provider: "Cloudflare", col_qty: 1, col_cost: 0, col_status: "Free Tier" } }
      ]
    })
  },

  // 5. Slide Deck Presentation Templates (Canva Slides style)
  {
    id: "tpl_slides_pitch",
    name: "Engineering Pitch Deck (16:9)",
    format: "slides",
    category: "Presentations",
    description: "Executive presentation deck with layout themes, key metric callouts, and speaker notes.",
    iconSymbol: "slideshow",
    defaultTitle: "SutharLabs Sovereign Suite Pitch Deck",
    metadata: { format: "slides", tags: ["pitch", "presentation", "slides"], category: "Creativity" },
    initialContent: JSON.stringify({
      aspectRatio: "16:9",
      theme: "cyan",
      slides: [
        {
          id: "s1",
          title: "SutharLabs Sovereign Suite",
          subtitle: "Enterprise Engineering Workspace & Creative Document Processor",
          layout: "title",
          speakerNotes: "Welcome stakeholders to the architectural review."
        },
        {
          id: "s2",
          title: "The Core Problem: Fragmented Tooling",
          layout: "bullets",
          bulletPoints: [
            "Developers toggle between 6 separate apps for diagrams, documents, spreadsheets, and invoices.",
            "Vendor lock-in across proprietary document clouds with zero source code control.",
            "High subscription overhead and lack of Indian GST regulatory compliance."
          ],
          speakerNotes: "Highlight the productivity loss from tool fragmentation."
        },
        {
          id: "s3",
          title: "Performance Impact & Throughput",
          layout: "metric",
          metricValue: "99.4%",
          metricLabel: "Time Saved in Technical Document Publishing",
          speakerNotes: "Showcase the tangible developer velocity increase."
        },
        {
          id: "s4",
          title: "Unified Platform Capabilities",
          layout: "split",
          leftContent: "Visual Vector Canvas & Whiteboard\n\n- Drag-and-drop vector shapes\n- Sequence flows & topologies\n- Isomorphic HTML/PDF exports",
          rightContent: "Statutory Accounting & Trading\n\n- Rule 46 GST Invoicing\n- GSTR-1 & GSTR-3B offline JSON\n- Algorithmic backtesting engine",
          speakerNotes: "Emphasize modularity and unified design philosophy."
        }
      ]
    })
  }
];
