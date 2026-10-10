import { DocNexusDocument, DocumentFormat } from "./types.js";
import { BUILT_IN_TEMPLATES } from "./templates.js";
import { getPrismaClient } from "../../../api/_utils.js";

const prisma = getPrismaClient();

// In-Memory cache keyed by userEmail -> Map<id, DocNexusDocument>
const inMemoryUserStore = new Map<string, Map<string, DocNexusDocument>>();

/**
 * Generates initial seed documents from built-in templates for first-time user initialization
 */
function createDefaultUserDocuments(userEmail: string): DocNexusDocument[] {
  const now = new Date().toISOString();
  return BUILT_IN_TEMPLATES.map((tpl, idx) => ({
    id: `doc_${tpl.format}_${idx + 1}_${Date.now().toString(36)}`,
    title: tpl.defaultTitle,
    format: tpl.format,
    content: tpl.initialContent,
    metadata: {
      ...tpl.metadata,
      authorEmail: userEmail,
      isPinned: idx === 0
    },
    createdAt: now,
    updatedAt: now
  }));
}

/**
 * Ensures user has an initialized document store
 */
function getUserDocumentMap(userEmail: string): Map<string, DocNexusDocument> {
  const normalizedEmail = (userEmail || "anonymous@sutharlabs.com").toLowerCase().trim();
  if (!inMemoryUserStore.has(normalizedEmail)) {
    const docMap = new Map<string, DocNexusDocument>();
    const seedDocs = createDefaultUserDocuments(normalizedEmail);
    seedDocs.forEach(d => docMap.set(d.id, d));
    inMemoryUserStore.set(normalizedEmail, docMap);
  }
  return inMemoryUserStore.get(normalizedEmail)!;
}

export async function listDocuments(userEmail: string): Promise<DocNexusDocument[]> {
  const docMap = getUserDocumentMap(userEmail);

  // Attempt database retrieval if prisma document model contains records
  try {
    const dbDocs = await prisma.document.findMany({
      where: {
        id: { startsWith: `doc_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_` }
      }
    });

    if (dbDocs && dbDocs.length > 0) {
      dbDocs.forEach(dbDoc => {
        try {
          const parsed = JSON.parse(dbDoc.content);
          if (parsed && parsed.id && parsed.format) {
            docMap.set(parsed.id, parsed);
          }
        } catch {
          // Plain markdown document fallback
          docMap.set(dbDoc.id, {
            id: dbDoc.id,
            title: dbDoc.title,
            format: 'markdown',
            content: dbDoc.content,
            metadata: { format: 'markdown', authorEmail: userEmail },
            createdAt: dbDoc.updatedAt.toISOString(),
            updatedAt: dbDoc.updatedAt.toISOString()
          });
        }
      });
    }
  } catch (err) {
    // Database access error handled via in-memory fallback
  }

  return Array.from(docMap.values()).sort((a, b) => {
    if (a.metadata?.isPinned && !b.metadata?.isPinned) return -1;
    if (!a.metadata?.isPinned && b.metadata?.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export async function getDocument(userEmail: string, id: string): Promise<DocNexusDocument | null> {
  const docMap = getUserDocumentMap(userEmail);
  if (docMap.has(id)) {
    return docMap.get(id)!;
  }

  // Fallback check against Prisma database with strict per-user ownership verification
  try {
    const userPrefix = `doc_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_`;
    const dbDoc = await prisma.document.findUnique({ where: { id } });
    if (dbDoc) {
      let parsed: any = null;
      try {
        parsed = JSON.parse(dbDoc.content);
      } catch {}

      const author = parsed?.metadata?.authorEmail;
      // Strictly block access if document does not belong to this user
      if (!dbDoc.id.startsWith(userPrefix) && (!author || author.toLowerCase() !== userEmail.toLowerCase())) {
        return null;
      }

      if (parsed && parsed.id && parsed.format) {
        docMap.set(parsed.id, parsed);
        return parsed;
      }

      const fallbackDoc: DocNexusDocument = {
        id: dbDoc.id,
        title: dbDoc.title,
        format: 'markdown',
        content: dbDoc.content,
        metadata: { format: 'markdown', authorEmail: userEmail },
        createdAt: dbDoc.updatedAt.toISOString(),
        updatedAt: dbDoc.updatedAt.toISOString()
      };
      docMap.set(fallbackDoc.id, fallbackDoc);
      return fallbackDoc;
    }
  } catch {
    // Database query failed
  }

  return null;
}

export async function saveDocument(
  userEmail: string,
  docUpdate: Partial<DocNexusDocument> & { id: string }
): Promise<DocNexusDocument> {
  const docMap = getUserDocumentMap(userEmail);
  const existing = docMap.get(docUpdate.id);
  const now = new Date().toISOString();

  const updatedDoc: DocNexusDocument = {
    id: docUpdate.id,
    title: docUpdate.title || existing?.title || "Untitled Document",
    format: docUpdate.format || existing?.format || "markdown",
    content: docUpdate.content !== undefined ? docUpdate.content : (existing?.content || ""),
    metadata: {
      ...(existing?.metadata || {}),
      ...(docUpdate.metadata || {}),
      authorEmail: userEmail
    },
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  docMap.set(updatedDoc.id, updatedDoc);

  // Attempt async sync to database
  try {
    const dbKey = `doc_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${updatedDoc.id}`;
    await prisma.document.upsert({
      where: { id: dbKey },
      update: {
        title: updatedDoc.title,
        content: JSON.stringify(updatedDoc)
      },
      create: {
        id: dbKey,
        title: updatedDoc.title,
        content: JSON.stringify(updatedDoc)
      }
    });
  } catch {
    // Database sync failed; in-memory store remains current
  }

  return updatedDoc;
}

export async function createDocument(
  userEmail: string,
  data: {
    title?: string;
    format?: DocumentFormat;
    content?: string;
    templateId?: string;
    metadata?: any;
  }
): Promise<DocNexusDocument> {
  const docMap = getUserDocumentMap(userEmail);
  const now = new Date().toISOString();

  let initialTitle = data.title || "Untitled Studio Document";
  let initialFormat: DocumentFormat = data.format || "canvas";
  let initialContent = data.content || "";
  let initialMeta = data.metadata || {};

  // If created from template, populate defaults
  if (data.templateId) {
    const tpl = BUILT_IN_TEMPLATES.find(t => t.id === data.templateId);
    if (tpl) {
      initialTitle = data.title || tpl.defaultTitle;
      initialFormat = tpl.format;
      initialContent = tpl.initialContent;
      initialMeta = { ...tpl.metadata, ...initialMeta };
    }
  }

  // Default empty content if none specified
  if (!initialContent) {
    if (initialFormat === "canvas") {
      initialContent = JSON.stringify({
        width: 1000,
        height: 650,
        backgroundColor: "#0d0d11",
        gridSnap: true,
        aspectRatio: "16:9",
        elements: []
      });
    } else if (initialFormat === "sheet") {
      initialContent = JSON.stringify({
        currencySymbol: "₹",
        showSummaryRow: true,
        columns: [
          { id: "col1", name: "Item / Description", type: "text", width: 220 },
          { id: "col2", name: "Category", type: "text", width: 140 },
          { id: "col3", name: "Amount", type: "currency", width: 150 },
          { id: "col4", name: "Status", type: "status", width: 120 }
        ],
        rows: [
          { id: "r1", cells: { col1: "Item 1", col2: "General", col3: 1000, col4: "Active" } }
        ]
      });
    } else if (initialFormat === "slides") {
      initialContent = JSON.stringify({
        aspectRatio: "16:9",
        theme: "cyan",
        slides: [
          { id: "s1", title: initialTitle, subtitle: "Presented by SutharLabs", layout: "title" }
        ]
      });
    } else if (initialFormat === "richtext") {
      initialContent = JSON.stringify({
        paperSize: "A4",
        orientation: "portrait",
        margins: "normal",
        headerText: "CONFIDENTIAL DOCUMENT",
        footerText: "Page {page} of {total}",
        showPageNumbers: true,
        pages: [
          { id: "p1", title: initialTitle, watermark: "", body: "Start drafting executive document content here..." }
        ]
      });
    } else {
      initialContent = `# ${initialTitle}\n\nStart typing Markdown or diagrams here...`;
    }
  }

  const newId = `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const newDoc: DocNexusDocument = {
    id: newId,
    title: initialTitle,
    format: initialFormat,
    content: initialContent,
    metadata: {
      ...initialMeta,
      authorEmail: userEmail,
      format: initialFormat
    },
    createdAt: now,
    updatedAt: now
  };

  docMap.set(newDoc.id, newDoc);

  // Sync to database
  try {
    const dbKey = `doc_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${newDoc.id}`;
    await prisma.document.create({
      data: {
        id: dbKey,
        title: newDoc.title,
        content: JSON.stringify(newDoc)
      }
    });
  } catch {
    // Handled via memory map
  }

  return newDoc;
}

export async function deleteDocument(userEmail: string, id: string): Promise<boolean> {
  const docMap = getUserDocumentMap(userEmail);
  const existed = docMap.delete(id);

  try {
    const dbKey = `doc_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${id}`;
    await prisma.document.delete({ where: { id: dbKey } });
  } catch {
    // Delete in DB ignored if not present
  }

  return existed;
}

export async function duplicateDocument(userEmail: string, id: string): Promise<DocNexusDocument | null> {
  const original = await getDocument(userEmail, id);
  if (!original) return null;

  return createDocument(userEmail, {
    title: `${original.title} (Copy)`,
    format: original.format,
    content: original.content,
    metadata: { ...original.metadata, isPinned: false }
  });
}

/**
 * Legacy API compatibility helpers for /api/docnexus/document
 */
export async function getLegacyDocument(): Promise<{ title: string; content: string }> {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: "doc_nexus_default" }
    });
    if (doc) {
      return { title: doc.title, content: doc.content };
    }
  } catch {}

  const defaultTpl = BUILT_IN_TEMPLATES.find(t => t.format === 'markdown')!;
  return {
    title: defaultTpl.defaultTitle,
    content: defaultTpl.initialContent
  };
}

export async function saveLegacyDocument(title: string, content: string): Promise<void> {
  try {
    await prisma.document.upsert({
      where: { id: "doc_nexus_default" },
      update: { title, content },
      create: { id: "doc_nexus_default", title, content }
    });
  } catch {}
}
