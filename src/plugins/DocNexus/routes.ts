import { Router } from "express";
import { getPrismaClient } from "../../../api/_utils.js";
import { authenticateToken } from "../../middleware/auth.js";

const prisma = getPrismaClient();

const DEFAULT_DOC_CONTENT = `# DocNexus Document Sandbox Guide

Welcome to the **DocNexus Sovereign Document Engine**, a high-performance Markdown and diagramming playground!

> [!NOTE]
> This applet represents a complete TypeScript implementation of the enterprise-grade DocNexus core.

## Feature Showcases

### 1. Smart Sequence Diagram Compiler
Type standard sequence flows below to compile an interactive calling diagram:

\`\`\`sequence
Alice -> Bob: Request API Token
Bob -> Alice: Validate HMAC Signature
Alice -> Gateway: Sync Telemetry
\`\`\`

### 2. Network Topology Visualizer
Adorn your structural documents with professional node topologies instantly:

\`\`\`topology
[ClientApp] === [NginxGateway]
[NginxGateway] === [ExpressAPI]
[ExpressAPI] --- [PostgreSQL]
[ExpressAPI] --- [RedisCache]
\`\`\`

### 3. High-Density Data Tables
ASCII tables are parsed dynamically into modern dashboard grids:

| Service Node | Role | Telemetry | Status |
| :--- | :--- | :---: | :---: |
| VM-East-01 | Primary API | 14ms | ACTIVE |
| VM-East-02 | Secondary Node | 18ms | STANDBY |
| db-sqlite-01 | Core Database | 4ms | SYNCHRONIZED |
`;

export function registerRoutes(router: Router) {
  // GET /document or /api/docnexus/document
  router.get("/document", authenticateToken, async (_req, res) => {
    try {
      let doc = await prisma.document.findUnique({
        where: { id: "doc_nexus_default" }
      });

      if (!doc) {
        doc = await prisma.document.create({
          data: {
            id: "doc_nexus_default",
            title: "DocNexus Sovereign Guide",
            content: DEFAULT_DOC_CONTENT
          }
        });
      }

      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve docnexus document state." });
    }
  });

  // POST /document or /api/docnexus/document
  router.post("/document", authenticateToken, async (req: any, res: any) => {
    const { title, content } = req.body;
    if (content === undefined) {
      return res.status(400).json({ error: "Document content is required." });
    }

    try {
      const updated = await prisma.document.upsert({
        where: { id: "doc_nexus_default" },
        update: { title: title || "DocNexus Guide", content },
        create: { id: "doc_nexus_default", title: title || "DocNexus Guide", content }
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to save docnexus document." });
    }
  });
}
