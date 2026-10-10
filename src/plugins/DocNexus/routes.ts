import { Router } from "express";
import { optionalAuth } from "../../middleware/auth.js";
import { BUILT_IN_TEMPLATES } from "./templates.js";
import {
  listDocuments,
  getDocument,
  saveDocument,
  createDocument,
  deleteDocument,
  duplicateDocument,
  getLegacyDocument,
  saveLegacyDocument
} from "./storage.js";

function resolveUserEmail(req: any): string {
  return req.user?.email || "guest@sutharlabs.com";
}

export function registerRoutes(router: Router) {
  // GET /templates - Get pre-configured gallery of built-in templates
  router.get("/templates", (_req, res) => {
    res.json(BUILT_IN_TEMPLATES);
  });

  // GET /documents - List all user documents
  router.get("/documents", optionalAuth, async (req: any, res) => {
    try {
      const userEmail = resolveUserEmail(req);
      const docs = await listDocuments(userEmail);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve documents." });
    }
  });

  // POST /documents - Create new document
  router.post("/documents", optionalAuth, async (req: any, res) => {
    try {
      const userEmail = resolveUserEmail(req);
      const { title, format, content, templateId, metadata } = req.body;
      const created = await createDocument(userEmail, {
        title,
        format,
        content,
        templateId,
        metadata
      });
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document." });
    }
  });

  // GET /documents/:id - Fetch single document
  router.get("/documents/:id", optionalAuth, async (req: any, res: any) => {
    try {
      const userEmail = resolveUserEmail(req);
      const doc = await getDocument(userEmail, req.params.id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found." });
      }
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve document details." });
    }
  });

  // PUT /documents/:id - Save / Update document
  router.put("/documents/:id", optionalAuth, async (req: any, res: any) => {
    try {
      const userEmail = resolveUserEmail(req);
      const { title, format, content, metadata } = req.body;
      const updated = await saveDocument(userEmail, {
        id: req.params.id,
        title,
        format,
        content,
        metadata
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to save document." });
    }
  });

  // DELETE /documents/:id - Remove document
  router.delete("/documents/:id", optionalAuth, async (req: any, res) => {
    try {
      const userEmail = resolveUserEmail(req);
      const success = await deleteDocument(userEmail, req.params.id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document." });
    }
  });

  // POST /documents/:id/duplicate - 1-Click clone document
  router.post("/documents/:id/duplicate", optionalAuth, async (req: any, res: any) => {
    try {
      const userEmail = resolveUserEmail(req);
      const duplicated = await duplicateDocument(userEmail, req.params.id);
      if (!duplicated) {
        return res.status(404).json({ error: "Source document not found for duplication." });
      }
      res.status(201).json(duplicated);
    } catch (error) {
      res.status(500).json({ error: "Failed to duplicate document." });
    }
  });

  // Backward compatibility legacy routes for /document
  router.get("/document", optionalAuth, async (_req, res) => {
    try {
      const doc = await getLegacyDocument();
      res.json({
        id: "doc_nexus_default",
        ...doc
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve legacy document state." });
    }
  });

  router.post("/document", optionalAuth, async (req: any, res: any) => {
    const { title, content } = req.body;
    if (content === undefined) {
      return res.status(400).json({ error: "Document content is required." });
    }
    try {
      await saveLegacyDocument(title || "DocNexus Guide", content);
      res.json({
        id: "doc_nexus_default",
        title: title || "DocNexus Guide",
        content
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to save legacy document." });
    }
  });
}
