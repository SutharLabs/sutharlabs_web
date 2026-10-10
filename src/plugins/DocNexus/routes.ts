import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.js";
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

function getValidatedUserEmail(req: any): string | null {
  return req.user?.email ? String(req.user.email).toLowerCase().trim() : null;
}

export function registerRoutes(router: Router) {
  // GET /templates - Public pre-configured gallery of built-in templates
  router.get("/templates", (_req, res) => {
    res.json(BUILT_IN_TEMPLATES);
  });

  // GET /documents - Strictly list all documents for authenticated user
  router.get("/documents", authenticateToken, async (req: any, res: any) => {
    const userEmail = getValidatedUserEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing user authentication session." });
    }
    try {
      const docs = await listDocuments(userEmail);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve documents." });
    }
  });

  // POST /documents - Create new document isolated to authenticated user
  router.post("/documents", authenticateToken, async (req: any, res: any) => {
    const userEmail = getValidatedUserEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing user authentication session." });
    }
    try {
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

  // GET /documents/:id - Fetch single document strictly checking ownership
  router.get("/documents/:id", authenticateToken, async (req: any, res: any) => {
    const userEmail = getValidatedUserEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing user authentication session." });
    }
    try {
      const doc = await getDocument(userEmail, req.params.id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found or access denied." });
      }
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve document details." });
    }
  });

  // PUT /documents/:id - Save / Update document strictly checking ownership
  router.put("/documents/:id", authenticateToken, async (req: any, res: any) => {
    const userEmail = getValidatedUserEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing user authentication session." });
    }
    try {
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

  // DELETE /documents/:id - Remove document strictly isolated to authenticated user
  router.delete("/documents/:id", authenticateToken, async (req: any, res: any) => {
    const userEmail = getValidatedUserEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing user authentication session." });
    }
    try {
      const success = await deleteDocument(userEmail, req.params.id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document." });
    }
  });

  // POST /documents/:id/duplicate - Clone document strictly isolated to authenticated user
  router.post("/documents/:id/duplicate", authenticateToken, async (req: any, res: any) => {
    const userEmail = getValidatedUserEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing user authentication session." });
    }
    try {
      const duplicated = await duplicateDocument(userEmail, req.params.id);
      if (!duplicated) {
        return res.status(404).json({ error: "Source document not found for duplication." });
      }
      res.status(201).json(duplicated);
    } catch (error) {
      res.status(500).json({ error: "Failed to duplicate document." });
    }
  });

  // Backward compatibility legacy routes partitioned per user
  router.get("/document", authenticateToken, async (req: any, res: any) => {
    const userEmail = getValidatedUserEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    try {
      const doc = await getLegacyDocument(userEmail);
      res.json({
        id: `doc_nexus_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        ...doc
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve legacy document state." });
    }
  });

  router.post("/document", authenticateToken, async (req: any, res: any) => {
    const userEmail = getValidatedUserEmail(req);
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const { title, content } = req.body;
    if (content === undefined) {
      return res.status(400).json({ error: "Document content is required." });
    }
    try {
      await saveLegacyDocument(userEmail, title || "DocNexus Guide", content);
      res.json({
        id: `doc_nexus_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        title: title || "DocNexus Guide",
        content
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to save legacy document." });
    }
  });
}
