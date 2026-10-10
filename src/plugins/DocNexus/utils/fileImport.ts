import { 
  DocNexusDocument, 
  DocumentFormat, 
  SpreadsheetState, 
  SheetColumn, 
  SheetRow 
} from '../types.js';
import { 
  parsePPTX, 
  parseDOCX, 
  parseXLSX, 
  parsePDF, 
  parseJupyterNotebook, 
  parseExcalidraw, 
  parseImageToCanvas, 
  parseRTF 
} from './documentParsers.js';

/**
 * Parses raw CSV/TSV text into DocNexus Spreadsheet JSON state
 */
export function parseCSVToSpreadsheet(csvText: string): string {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    const emptyState: SpreadsheetState = {
      currencySymbol: '₹',
      showSummaryRow: false,
      columns: [{ id: 'col_1', name: 'Column 1', type: 'text', width: 160 }],
      rows: [{ id: 'r_1', cells: { col_1: '' } }]
    };
    return JSON.stringify(emptyState);
  }

  // Parse header
  const separator = lines[0].includes('\t') ? '\t' : ',';
  const parseRow = (rowStr: string): string[] => {
    const cells: string[] = [];
    let inQuotes = false;
    let current = '';
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"' && (i === 0 || rowStr[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        cells.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim().replace(/^"|"$/g, ''));
    return cells;
  };

  const headerCells = parseRow(lines[0]);
  const columns: SheetColumn[] = headerCells.map((h, idx) => {
    const name = h.trim() || `Column ${idx + 1}`;
    let type: SheetColumn['type'] = 'text';
    const lower = name.toLowerCase();
    if (lower.includes('cost') || lower.includes('price') || lower.includes('amount') || lower.includes('revenue') || lower.includes('₹') || lower.includes('$')) {
      type = 'currency';
    } else if (lower.includes('qty') || lower.includes('units') || lower.includes('count') || lower.includes('number') || lower.includes('age')) {
      type = 'number';
    } else if (lower.includes('status') || lower.includes('state')) {
      type = 'status';
    } else if (lower.includes('date') || lower.includes('time')) {
      type = 'date';
    }
    return {
      id: `col_${idx + 1}`,
      name,
      type,
      width: Math.max(140, Math.min(280, name.length * 12 + 40))
    };
  });

  const rows: SheetRow[] = lines.slice(1).map((line, rIdx) => {
    const rawCells = parseRow(line);
    const cellsObj: Record<string, any> = {};
    columns.forEach((col, cIdx) => {
      const val = rawCells[cIdx] || '';
      if (col.type === 'number' || col.type === 'currency') {
        const num = parseFloat(val.replace(/[^\d.-]/g, ''));
        cellsObj[col.id] = isNaN(num) ? val : num;
      } else {
        cellsObj[col.id] = val;
      }
    });
    return {
      id: `r_${rIdx + 1}`,
      cells: cellsObj
    };
  });

  const state: SpreadsheetState = {
    currencySymbol: '₹',
    showSummaryRow: columns.some(c => c.type === 'currency' || c.type === 'number'),
    columns,
    rows: rows.length > 0 ? rows : [{ id: 'r_1', cells: {} }]
  };

  return JSON.stringify(state);
}

/**
 * High-performance file parser that handles binary OOXML (.pptx, .docx, .xlsx),
 * PDF, vector diagrams, images, Jupyter notebooks, and text files.
 */
export async function importFileFromBrowser(file: File, folderName?: string): Promise<DocNexusDocument> {
  const fileName = file.name;
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Untitled Document';
  const ext = fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  const docId = `doc_import_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  let format: DocumentFormat = 'markdown';
  let processedContent = '';
  let category = folderName || 'Local Import';
  let tags: string[] = ['Local', ext.toUpperCase()];
  let extraMeta: Record<string, any> = {};

  try {
    if (ext === 'pptx' || ext === 'ppt') {
      const buffer = await file.arrayBuffer();
      const res = await parsePPTX(buffer, fileName);
      format = res.format;
      processedContent = res.content;
      category = res.category;
      tags = res.tags;
      extraMeta = res.extraMetadata || {};
    } else if (ext === 'docx' || ext === 'doc') {
      const buffer = await file.arrayBuffer();
      const res = await parseDOCX(buffer, fileName);
      format = res.format;
      processedContent = res.content;
      category = res.category;
      tags = res.tags;
      extraMeta = res.extraMetadata || {};
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const res = await parseXLSX(buffer, fileName);
      format = res.format;
      processedContent = res.content;
      category = res.category;
      tags = res.tags;
      extraMeta = res.extraMetadata || {};
    } else if (ext === 'pdf') {
      const buffer = await file.arrayBuffer();
      const res = await parsePDF(buffer, fileName);
      format = res.format;
      processedContent = res.content;
      category = res.category;
      tags = res.tags;
      extraMeta = res.extraMetadata || {};
    } else if (ext === 'ipynb') {
      const text = await file.text();
      const res = parseJupyterNotebook(text, fileName);
      format = res.format;
      processedContent = res.content;
      category = res.category;
      tags = res.tags;
      extraMeta = res.extraMetadata || {};
    } else if (ext === 'excalidraw') {
      const text = await file.text();
      const res = parseExcalidraw(text, fileName);
      format = res.format;
      processedContent = res.content;
      category = res.category;
      tags = res.tags;
    } else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico', 'avif', 'tiff', 'tif', 'heic'].includes(ext)) {
      const dataUrl = await readFileAsDataURL(file);
      const res = parseImageToCanvas(dataUrl, fileName);
      format = res.format;
      processedContent = res.content;
      category = res.category;
      tags = res.tags;
      extraMeta = res.extraMetadata || {};
    } else if (ext === 'rtf') {
      const text = await file.text();
      const res = parseRTF(text, fileName);
      format = res.format;
      processedContent = res.content;
      category = res.category;
      tags = res.tags;
    } else if (ext === 'csv' || ext === 'tsv') {
      const text = await file.text();
      format = 'sheet';
      processedContent = parseCSVToSpreadsheet(text);
      category = 'Spreadsheets';
      tags = ['Local', ext.toUpperCase(), 'Grid'];
    } else if (ext === 'json') {
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.elements)) {
          format = 'canvas';
          processedContent = JSON.stringify(parsed);
        } else if (parsed && Array.isArray(parsed.slides)) {
          format = 'slides';
          processedContent = JSON.stringify(parsed);
        } else if (parsed && Array.isArray(parsed.pages)) {
          format = 'richtext';
          processedContent = JSON.stringify(parsed);
        } else if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
          format = 'sheet';
          processedContent = JSON.stringify(parsed);
        } else {
          format = 'markdown';
          processedContent = `# ${cleanTitle}\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
        }
      } catch {
        format = 'markdown';
        processedContent = `# ${cleanTitle}\n\n\`\`\`json\n${text}\n\`\`\``;
      }
    } else if (ext === 'html' || ext === 'htm') {
      const text = await file.text();
      format = 'richtext';
      const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();
      processedContent = JSON.stringify({
        paperSize: 'A4',
        orientation: 'portrait',
        margins: 'normal',
        headerText: cleanTitle.toUpperCase(),
        footerText: 'Imported Document • Page {page} of {total}',
        showPageNumbers: true,
        pages: [
          {
            id: 'p1',
            title: cleanTitle.toUpperCase(),
            watermark: '',
            body: plainText.slice(0, 3500)
          }
        ]
      });
    } else if (['md', 'markdown', 'txt'].includes(ext)) {
      const text = await file.text();
      format = 'markdown';
      processedContent = text.startsWith('#') ? text : `# ${cleanTitle}\n\n${text}`;
    } else {
      const text = await file.text();
      format = 'markdown';
      processedContent = `# Source: ${fileName}\n\n\`\`\`${ext}\n${text}\n\`\`\``;
    }
  } catch (err: any) {
    console.warn(`Fallback parsing for ${fileName}:`, err);
    format = 'markdown';
    processedContent = `# ${cleanTitle}\n\n*Document ingestion fallback.*\n\n${file.name}`;
  }

  return {
    id: docId,
    title: cleanTitle,
    format,
    content: processedContent,
    metadata: {
      category,
      tags: [...tags, folderName || 'Imported'],
      isPinned: false,
      ...extraMeta
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Synchronous text parser retained for inline string imports
 */
export function parseImportedFile(fileName: string, content: string, folderName?: string): DocNexusDocument {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Untitled Imported Document';
  const ext = fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  const docId = `doc_import_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  let format: DocumentFormat = 'markdown';
  let processedContent = content;

  if (ext === 'csv' || ext === 'tsv') {
    format = 'sheet';
    processedContent = parseCSVToSpreadsheet(content);
  } else if (ext === 'json') {
    try {
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.elements)) {
        format = 'canvas';
        processedContent = JSON.stringify(parsed);
      } else if (parsed && Array.isArray(parsed.slides)) {
        format = 'slides';
        processedContent = JSON.stringify(parsed);
      } else if (parsed && Array.isArray(parsed.pages)) {
        format = 'richtext';
        processedContent = JSON.stringify(parsed);
      } else if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
        format = 'sheet';
        processedContent = JSON.stringify(parsed);
      } else {
        format = 'markdown';
        processedContent = `# ${cleanTitle}\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
      }
    } catch {
      format = 'markdown';
      processedContent = `# ${cleanTitle}\n\n\`\`\`json\n${content}\n\`\`\``;
    }
  } else if (ext === 'html' || ext === 'htm') {
    format = 'richtext';
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();
    processedContent = JSON.stringify({
      paperSize: 'A4',
      orientation: 'portrait',
      margins: 'normal',
      headerText: cleanTitle.toUpperCase(),
      footerText: 'Imported Document • Page {page} of {total}',
      showPageNumbers: true,
      pages: [
        {
          id: 'p1',
          title: cleanTitle.toUpperCase(),
          watermark: '',
          body: plainText.slice(0, 3000)
        }
      ]
    });
  } else if (['md', 'markdown', 'txt'].includes(ext)) {
    format = 'markdown';
    processedContent = content.startsWith('#') ? content : `# ${cleanTitle}\n\n${content}`;
  } else {
    format = 'markdown';
    processedContent = `# Source: ${fileName}\n\n\`\`\`${ext}\n${content}\n\`\`\``;
  }

  return {
    id: docId,
    title: cleanTitle,
    format,
    content: processedContent,
    metadata: {
      category: folderName || 'Local Import',
      tags: ['Local', ext.toUpperCase(), folderName || 'Imported'],
      isPinned: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Reads a single File object using FileReader as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Reads a single File object using FileReader as base64 Data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Recursively reads document files from a FileSystemDirectoryHandle (File System Access API)
 * Supports all document extensions (.pptx, .docx, .xlsx, .pdf, .md, .csv, .json, .ipynb, etc.)
 */
export async function readDirectoryHandleRecursively(
  dirHandle: any,
  maxFiles = 60,
  pathPrefix = ''
): Promise<{ file: File; fileName: string; relativePath: string }[]> {
  const results: { file: File; fileName: string; relativePath: string }[] = [];
  const IGNORED_NAMES = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.idea', '.vscode', 'coverage', '.cache']);

  async function walk(handle: any, currentPath: string) {
    if (results.length >= maxFiles) return;

    for await (const entry of handle.values()) {
      if (results.length >= maxFiles) break;

      if (entry.kind === 'directory') {
        if (!IGNORED_NAMES.has(entry.name) && !entry.name.startsWith('.')) {
          await walk(entry, `${currentPath}${entry.name}/`);
        }
      } else if (entry.kind === 'file') {
        const name: string = entry.name;
        const ext = name.slice((name.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
        const ALLOWED_EXTS = new Set([
          'md', 'markdown', 'txt', 'json', 'csv', 'tsv', 'html', 'htm',
          'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'pdf', 'rtf',
          'ipynb', 'excalidraw', 'svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'avif',
          'js', 'ts', 'tsx', 'jsx', 'py', 'sql', 'yaml', 'yml'
        ]);

        if (ALLOWED_EXTS.has(ext) && !name.startsWith('.')) {
          try {
            const file = await entry.getFile();
            // Up to 15MB file size
            if (file.size < 15 * 1024 * 1024) {
              results.push({
                file,
                fileName: name,
                relativePath: `${currentPath}${name}`
              });
            }
          } catch (err) {
            console.warn(`Failed to read file ${name}:`, err);
          }
        }
      }
    }
  }

  await walk(dirHandle, pathPrefix);
  return results;
}
