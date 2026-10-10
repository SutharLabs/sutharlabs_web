import { DocNexusDocument } from '../types.js';

const STORAGE_KEY = 'sutharlabs_docnexus_vault';
const DB_NAME = 'DocNexusVaultDB';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

/**
 * Open or create IndexedDB instance for high-capacity sovereign vault storage
 */
function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Strip heavy binary blobs (e.g. multi-MB PDF Data URLs or raw bitmaps)
 * before persisting to 5MB quota-limited localStorage.
 */
function sanitizeForLocalStorage(documents: DocNexusDocument[]): DocNexusDocument[] {
  return documents.map(doc => {
    const meta: Record<string, any> = { ...doc.metadata };
    // Remove massive pdfDataUrl or truncate heavy image strings from localStorage copy
    if (meta.pdfDataUrl && typeof meta.pdfDataUrl === 'string' && meta.pdfDataUrl.length > 50000) {
      delete meta.pdfDataUrl;
    }
    if (meta.imageSrc && typeof meta.imageSrc === 'string' && meta.imageSrc.length > 50000) {
      delete meta.imageSrc;
    }

    // If document content itself exceeds 500KB (e.g. massive embedded canvas images), trim for localStorage
    let content = doc.content;
    if (content.length > 500000 && doc.format === 'canvas') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.elements) {
          parsed.elements = parsed.elements.map((el: any) => {
            if (el.imageUrl && typeof el.imageUrl === 'string' && el.imageUrl.length > 50000) {
              return { ...el, imageUrl: '[STALL_IDB_STORED]' };
            }
            return el;
          });
          content = JSON.stringify(parsed);
        }
      } catch {}
    } else if (content.length > 300000 && doc.format === 'richtext') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.pages) {
          parsed.pages = parsed.pages.map((p: any) => {
            if (p.pageImage && typeof p.pageImage === 'string' && p.pageImage.length > 25000) {
              return { ...p, pageImage: undefined };
            }
            return p;
          });
          content = JSON.stringify(parsed);
        }
      } catch {}
    }

    return {
      ...doc,
      content,
      metadata: meta
    };
  });
}

/**
 * Saves documents reliably using IndexedDB as primary, with a quota-protected
 * sanitized localStorage cache fallback.
 */
export async function saveVault(documents: DocNexusDocument[]): Promise<void> {
  // 1. Save full, pristine documents to IndexedDB (virtually unlimited quota)
  try {
    const db = await openVaultDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear existing and rewrite
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const doc of documents) {
      store.put(doc);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (idbErr) {
    console.warn('DocNexus: IndexedDB persistence fallback to localStorage:', idbErr);
  }

  // 2. Save sanitized representation to localStorage without exceeding 5MB quota
  try {
    const sanitized = sanitizeForLocalStorage(documents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (quotaErr) {
    console.warn('DocNexus: localStorage quota exceeded, pruning further:', quotaErr);
    try {
      // Emergency prune: keep only document titles, metadata, and first 5 docs
      const emergencyDocs = documents.slice(0, 5).map(d => ({
        ...d,
        content: d.content.slice(0, 10000)
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencyDocs));
    } catch {
      // Ignore localStorage failure since IndexedDB holds the authoritative data
    }
  }
}

/**
 * Loads documents, prioritizing IndexedDB if available, falling back to localStorage
 */
export async function loadVault(): Promise<DocNexusDocument[] | null> {
  // 1. Try IndexedDB first
  try {
    const db = await openVaultDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const docs = await new Promise<DocNexusDocument[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (Array.isArray(docs) && docs.length > 0) {
      return docs;
    }
  } catch (idbErr) {
    console.warn('DocNexus: Failed loading from IndexedDB, checking localStorage:', idbErr);
  }

  // 2. Fallback to localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return null;
}
