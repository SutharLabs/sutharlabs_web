import { 
  DocumentFormat, 
  DocNexusDocument, 
  SlideDeckState, 
  SlideItem, 
  RichDocState, 
  RichDocPage, 
  SpreadsheetState, 
  SheetColumn, 
  SheetRow, 
  CanvasSceneState, 
  CanvasElement 
} from '../types.js';
import { unzipArchive, getZipEntryAsText } from './zipReader.js';

export interface ParsedDocumentResult {
  format: DocumentFormat;
  content: string;
  category: string;
  tags: string[];
  extraMetadata?: Record<string, any>;
}

/**
 * 1. PPTX (PowerPoint Presentation) Parser
 * Extracts slides, paragraphs, titles, bullets and speaker notes from OpenXML archive.
 */
export async function parsePPTX(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocumentResult> {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Imported Presentation';
  const entries = await unzipArchive(buffer);

  // Discover all slide XML paths: ppt/slides/slide{N}.xml
  const slideKeys: string[] = [];
  for (const key of entries.keys()) {
    if (/^ppt\/slides\/slide\d+\.xml$/i.test(key)) {
      slideKeys.push(key);
    }
  }

  // Sort slides numerically: slide1, slide2, ... slide10
  slideKeys.sort((a, b) => {
    const numA = parseInt(a.replace(/[^\d]/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/[^\d]/g, ''), 10) || 0;
    return numA - numB;
  });

  const parsedSlides: SlideItem[] = [];

  for (let i = 0; i < slideKeys.length; i++) {
    const slideXml = getZipEntryAsText(entries, slideKeys[i]);
    if (!slideXml) continue;

    // Extract text runs inside <a:p> (paragraphs)
    const paragraphs: string[] = [];
    const pRegex = /<a:p\b[^>]*>([\s\S]*?)<\/a:p>/gi;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = pRegex.exec(slideXml)) !== null) {
      const pContent = pMatch[1];
      const tRegex = /<a:t\b[^>]*>([^<]*)<\/a:t>/gi;
      let tMatch: RegExpExecArray | null;
      let fullPara = '';
      while ((tMatch = tRegex.exec(pContent)) !== null) {
        fullPara += tMatch[1];
      }
      const trimmed = fullPara.trim();
      if (trimmed) {
        paragraphs.push(trimmed);
      }
    }

    // Attempt to extract speaker notes for this slide
    let speakerNotes = '';
    const noteKey = `ppt/notesSlides/notesSlide${i + 1}.xml`;
    const noteXml = getZipEntryAsText(entries, noteKey);
    if (noteXml) {
      const noteParaRegex = /<a:t\b[^>]*>([^<]*)<\/a:t>/gi;
      let noteMatch: RegExpExecArray | null;
      const noteParts: string[] = [];
      while ((noteMatch = noteParaRegex.exec(noteXml)) !== null) {
        if (noteMatch[1].trim()) noteParts.push(noteMatch[1].trim());
      }
      speakerNotes = noteParts.join(' ');
    }

    const slideId = `slide_import_${i + 1}`;
    if (paragraphs.length === 0) {
      parsedSlides.push({
        id: slideId,
        title: `Slide ${i + 1}`,
        layout: 'title',
        speakerNotes
      });
    } else if (i === 0 || paragraphs.length === 1) {
      parsedSlides.push({
        id: slideId,
        title: paragraphs[0],
        subtitle: paragraphs[1] || '',
        layout: 'title',
        speakerNotes
      });
    } else {
      const title = paragraphs[0];
      const bulletPoints = paragraphs.slice(1);
      parsedSlides.push({
        id: slideId,
        title,
        layout: bulletPoints.length > 4 ? 'split' : 'bullets',
        bulletPoints,
        leftContent: bulletPoints.slice(0, Math.ceil(bulletPoints.length / 2)).join('\n• '),
        rightContent: bulletPoints.slice(Math.ceil(bulletPoints.length / 2)).join('\n• '),
        speakerNotes
      });
    }
  }

  // Fallback if no slides could be extracted from OOXML
  if (parsedSlides.length === 0) {
    parsedSlides.push({
      id: 'slide_1',
      title: cleanTitle,
      subtitle: 'Imported PowerPoint Presentation',
      layout: 'title',
      speakerNotes: 'Slide parsed from local storage.'
    });
  }

  const deckState: SlideDeckState = {
    aspectRatio: '16:9',
    theme: 'cyan',
    slides: parsedSlides
  };

  return {
    format: 'slides',
    content: JSON.stringify(deckState),
    category: 'Presentations',
    tags: ['Presentation', 'PPTX', 'Slide Deck'],
    extraMetadata: { slideCount: parsedSlides.length }
  };
}

/**
 * 2. DOCX (Word Document) Parser
 * Extracts headings, paragraphs, and tables from OOXML archive.
 */
export async function parseDOCX(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocumentResult> {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Imported Word Document';
  const entries = await unzipArchive(buffer);
  const docXml = getZipEntryAsText(entries, 'word/document.xml');

  if (!docXml) {
    throw new Error('Invalid DOCX format: word/document.xml missing.');
  }

  const paragraphs: { text: string; isHeading: boolean; level: number }[] = [];
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(docXml)) !== null) {
    const pContent = pMatch[1];
    
    // Check if styled as heading
    const isHeading1 = /<w:pStyle\b[^>]*w:val="Heading1"/i.test(pContent);
    const isHeading2 = /<w:pStyle\b[^>]*w:val="Heading2"/i.test(pContent);
    const isHeading3 = /<w:pStyle\b[^>]*w:val="Heading3"/i.test(pContent);
    const isTitle = /<w:pStyle\b[^>]*w:val="Title"/i.test(pContent);

    // Extract all <w:t> elements
    const tRegex = /<w:t\b[^>]*>([^<]*)<\/w:t>/gi;
    let tMatch: RegExpExecArray | null;
    let paraText = '';
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      paraText += tMatch[1];
    }

    const trimmed = paraText.trim();
    if (trimmed) {
      const isHeading = isHeading1 || isHeading2 || isHeading3 || isTitle;
      const level = isTitle || isHeading1 ? 1 : isHeading2 ? 2 : 3;
      paragraphs.push({ text: trimmed, isHeading, level });
    }
  }

  // Create multi-page Executive A4 document structure
  const pages: RichDocPage[] = [];
  const chunkSize = 6; // ~6 paragraphs per executive A4 page
  for (let i = 0; i < Math.max(1, Math.ceil(paragraphs.length / chunkSize)); i++) {
    const slice = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize);
    const pageTitle = slice.find(p => p.isHeading)?.text || (i === 0 ? cleanTitle.toUpperCase() : `SECTION ${i + 1}`);
    const bodyText = slice
      .map(p => (p.isHeading ? `\n## ${p.text}\n` : p.text))
      .join('\n\n');

    pages.push({
      id: `page_${i + 1}`,
      title: pageTitle,
      watermark: '',
      body: bodyText || 'Empty page content.'
    });
  }

  const richDocState: RichDocState = {
    paperSize: 'A4',
    orientation: 'portrait',
    margins: 'normal',
    headerText: cleanTitle.toUpperCase(),
    footerText: 'Executive Specification • Page {page} of {total}',
    showPageNumbers: true,
    pages
  };

  return {
    format: 'richtext',
    content: JSON.stringify(richDocState),
    category: 'Word Documents',
    tags: ['Word', 'DOCX', 'Executive A4'],
    extraMetadata: { pageCount: pages.length }
  };
}

/**
 * 3. XLSX (Excel Spreadsheet) Parser
 * Extracts worksheets, shared strings, columns and cell rows from OOXML archive.
 */
export async function parseXLSX(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocumentResult> {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Imported Spreadsheet';
  const entries = await unzipArchive(buffer);

  // 1. Parse shared strings table: xl/sharedStrings.xml
  const sharedStringsXml = getZipEntryAsText(entries, 'xl/sharedStrings.xml');
  const sharedStrings: string[] = [];
  if (sharedStringsXml) {
    const sstRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
    let sstMatch: RegExpExecArray | null;
    while ((sstMatch = sstRegex.exec(sharedStringsXml)) !== null) {
      const siContent = sstMatch[1];
      const tRegex = /<t\b[^>]*>([^<]*)<\/t>/gi;
      let tMatch: RegExpExecArray | null;
      let fullText = '';
      while ((tMatch = tRegex.exec(siContent)) !== null) {
        fullText += tMatch[1];
      }
      sharedStrings.push(fullText);
    }
  }

  // 2. Parse sheet 1: xl/worksheets/sheet1.xml
  const sheetXml = getZipEntryAsText(entries, 'xl/worksheets/sheet1.xml');
  if (!sheetXml) {
    throw new Error('Invalid XLSX format: xl/worksheets/sheet1.xml missing.');
  }

  // Parse rows
  const parsedRows: Record<number, Record<number, string>> = {};
  const rowRegex = /<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowNum = parseInt(rowMatch[1], 10);
    const rowContent = rowMatch[2];
    parsedRows[rowNum] = {};

    // Cells inside row: <c r="A1" t="s"><v>0</v></c>
    const cRegex = /<c\b[^>]*r="([A-Z]+)(\d+)"(?:\s+t="([^"]*)")?[^>]*>([\s\S]*?)<\/c>/gi;
    let cMatch: RegExpExecArray | null;
    while ((cMatch = cRegex.exec(rowContent)) !== null) {
      const colLetters = cMatch[1];
      const colIndex = colLettersToNumber(colLetters);
      const cellType = cMatch[3] || '';
      const cellInner = cMatch[4];

      const vMatch = /<v\b[^>]*>([^<]*)<\/v>/i.exec(cellInner);
      let val = vMatch ? vMatch[1] : '';

      if (cellType === 's') {
        const sstIdx = parseInt(val, 10);
        val = sharedStrings[sstIdx] !== undefined ? sharedStrings[sstIdx] : val;
      }
      parsedRows[rowNum][colIndex] = val;
    }
  }

  const rowNums = Object.keys(parsedRows).map(Number).sort((a, b) => a - b);
  if (rowNums.length === 0) {
    throw new Error('Spreadsheet has no rows.');
  }

  // Header row = first row
  const headerRowNum = rowNums[0];
  const headerMap = parsedRows[headerRowNum];
  const colIndices = Object.keys(headerMap).map(Number).sort((a, b) => a - b);

  const columns: SheetColumn[] = colIndices.map((colIdx, idx) => {
    const rawName = (headerMap[colIdx] || '').trim() || `Column ${idx + 1}`;
    let type: SheetColumn['type'] = 'text';
    const lower = rawName.toLowerCase();
    if (lower.includes('cost') || lower.includes('price') || lower.includes('amount') || lower.includes('₹') || lower.includes('$')) {
      type = 'currency';
    } else if (lower.includes('units') || lower.includes('qty') || lower.includes('number') || lower.includes('count')) {
      type = 'number';
    } else if (lower.includes('status') || lower.includes('state')) {
      type = 'status';
    } else if (lower.includes('date') || lower.includes('time')) {
      type = 'date';
    }

    return {
      id: `col_${idx + 1}`,
      name: rawName,
      type,
      width: Math.max(150, Math.min(280, rawName.length * 12 + 40))
    };
  });

  const sheetRows: SheetRow[] = [];
  for (let r = 1; r < rowNums.length; r++) {
    const rNum = rowNums[r];
    const cellsData = parsedRows[rNum];
    const cellsObj: Record<string, any> = {};

    colIndices.forEach((colIdx, idx) => {
      const colDef = columns[idx];
      const rawVal = cellsData[colIdx] || '';
      if (colDef.type === 'number' || colDef.type === 'currency') {
        const num = parseFloat(rawVal.replace(/[^\d.-]/g, ''));
        cellsObj[colDef.id] = isNaN(num) ? rawVal : num;
      } else {
        cellsObj[colDef.id] = rawVal;
      }
    });

    sheetRows.push({
      id: `r_${r}`,
      cells: cellsObj
    });
  }

  const spreadsheetState: SpreadsheetState = {
    currencySymbol: '₹',
    showSummaryRow: columns.some(c => c.type === 'currency' || c.type === 'number'),
    columns,
    rows: sheetRows.length > 0 ? sheetRows : [{ id: 'r_1', cells: {} }]
  };

  return {
    format: 'sheet',
    content: JSON.stringify(spreadsheetState),
    category: 'Spreadsheets',
    tags: ['Spreadsheet', 'XLSX', 'Excel'],
    extraMetadata: { rowCount: sheetRows.length, colCount: columns.length }
  };
}

/**
 * 4. PDF Document Parser
 * Extracts text stream objects, page markers, and titles from raw PDF binary.
 */
export async function parsePDF(buffer: ArrayBuffer, fileName: string): Promise<ParsedDocumentResult> {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Imported PDF Document';
  const bytes = new Uint8Array(buffer);
  
  // Convert buffer to binary string for pattern scanning
  let binaryStr = '';
  const len = Math.min(bytes.length, 1024 * 1024 * 4); // Max 4MB scan
  for (let i = 0; i < len; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }

  // 1. Extract text stream chunks between BT (Begin Text) and ET (End Text)
  const textChunks: string[] = [];
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;

  while ((btMatch = btEtRegex.exec(binaryStr)) !== null) {
    const textBlock = btMatch[1];
    // Match literal strings: (Hello World) Tj or [(Hello) 10 (World)] TJ
    const tjRegex = /\(([^)]*)\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    let line = '';
    while ((tjMatch = tjRegex.exec(textBlock)) !== null) {
      line += unescapePdfString(tjMatch[1]) + ' ';
    }

    // Match hex strings: <48656c6c6f> Tj
    const hexRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
    let hexMatch: RegExpExecArray | null;
    while ((hexMatch = hexRegex.exec(textBlock)) !== null) {
      line += decodePdfHexString(hexMatch[1]) + ' ';
    }

    const trimmed = line.trim();
    if (trimmed && trimmed.length > 2) {
      textChunks.push(trimmed);
    }
  }

  // Detect page count from /Count or /Type /Page
  let detectedPageCount = 1;
  const countMatch = /\/Count\s+(\d+)/.exec(binaryStr);
  if (countMatch) {
    detectedPageCount = Math.max(1, parseInt(countMatch[1], 10));
  } else {
    const pageMatches = binaryStr.match(/\/Type\s*\/Page\b/g);
    if (pageMatches) {
      detectedPageCount = Math.max(1, pageMatches.length);
    }
  }

  // Optional compact Data URL for small PDF files to prevent quota exhaustion
  let pdfDataUrl = '';
  if (bytes.length <= 64 * 1024) {
    let base64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      base64 += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
    }
    pdfDataUrl = `data:application/pdf;base64,${btoa(base64)}`;
  }

  // Construct Executive A4 multi-page document
  const pages: RichDocPage[] = [];
  const chunksPerPage = Math.max(1, Math.ceil(textChunks.length / detectedPageCount));

  for (let p = 0; p < detectedPageCount; p++) {
    const pageChunks = textChunks.slice(p * chunksPerPage, (p + 1) * chunksPerPage);
    const body = pageChunks.length > 0 
      ? pageChunks.join('\n\n')
      : `Page ${p + 1} content extracted from PDF document.\nOriginal text streams or vector visual.`;

    pages.push({
      id: `pdf_page_${p + 1}`,
      title: `${cleanTitle.toUpperCase()} - P.${p + 1}`,
      watermark: 'VERIFIED',
      body
    });
  }

  const richDocState: RichDocState = {
    paperSize: 'A4',
    orientation: 'portrait',
    margins: 'normal',
    headerText: cleanTitle.toUpperCase(),
    footerText: 'SutharLabs PDF Engine • Page {page} of {total}',
    showPageNumbers: true,
    pages
  };

  return {
    format: 'richtext',
    content: JSON.stringify(richDocState),
    category: 'PDF Documents',
    tags: ['PDF', 'Executive A4', 'Vector'],
    extraMetadata: { 
      pdfDataUrl, 
      pageCount: detectedPageCount,
      extractedStreams: textChunks.length 
    }
  };
}

/**
 * 5. Jupyter Notebook (.ipynb) Parser
 */
export function parseJupyterNotebook(jsonText: string, fileName: string): ParsedDocumentResult {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Imported Notebook';
  try {
    const nb = JSON.parse(jsonText);
    const cells = Array.isArray(nb.cells) ? nb.cells : [];

    let markdownOutput = `# ${cleanTitle}\n\n*Jupyter Notebook Ingestion (${cells.length} cells)*\n\n---\n\n`;

    cells.forEach((cell: any, idx: number) => {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
      if (cell.cell_type === 'markdown') {
        markdownOutput += `${source}\n\n`;
      } else if (cell.cell_type === 'code') {
        markdownOutput += `### In [${cell.execution_count ?? idx + 1}]:\n\`\`\`python\n${source}\n\`\`\`\n\n`;
        if (cell.outputs && Array.isArray(cell.outputs)) {
          cell.outputs.forEach((out: any) => {
            if (out.text) {
              const outText = Array.isArray(out.text) ? out.text.join('') : out.text;
              markdownOutput += `> **Output:**\n> \`\`\`\n> ${outText.trim()}\n> \`\`\`\n\n`;
            }
          });
        }
      }
    });

    return {
      format: 'markdown',
      content: markdownOutput,
      category: 'Data Science',
      tags: ['Notebook', 'Python', 'Jupyter'],
      extraMetadata: { cellCount: cells.length }
    };
  } catch (err: any) {
    return {
      format: 'markdown',
      content: `# ${cleanTitle}\n\n\`\`\`json\n${jsonText}\n\`\`\``,
      category: 'Notebook',
      tags: ['JSON', 'Notebook']
    };
  }
}

/**
 * 6. Diagram Parser (Excalidraw, Draw.io)
 */
export function parseExcalidraw(jsonText: string, fileName: string): ParsedDocumentResult {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Imported Canvas Diagram';
  try {
    const data = JSON.parse(jsonText);
    const rawElements = Array.isArray(data.elements) ? data.elements : [];

    const elements: CanvasElement[] = rawElements.map((el: any, idx: number) => {
      let type: CanvasElement['type'] = 'rect';
      if (el.type === 'ellipse') type = 'circle';
      else if (el.type === 'diamond') type = 'diamond';
      else if (el.type === 'text') type = 'text';
      else if (el.type === 'arrow' || el.type === 'line') type = 'arrow';

      return {
        id: el.id || `el_${idx + 1}`,
        type,
        x: el.x || 100 + (idx % 5) * 160,
        y: el.y || 100 + Math.floor(idx / 5) * 120,
        width: el.width || 140,
        height: el.height || 70,
        zIndex: idx + 1,
        text: el.text || el.label || '',
        fill: el.backgroundColor || '#00dbe7',
        stroke: el.strokeColor || '#ffffff',
        textColor: '#ffffff',
        fontSize: el.fontSize || 13,
        opacity: el.opacity || 1
      };
    });

    const canvasState: CanvasSceneState = {
      elements: elements.length > 0 ? elements : [
        {
          id: 'card_1',
          type: 'card',
          x: 200,
          y: 160,
          width: 320,
          height: 180,
          zIndex: 1,
          text: cleanTitle,
          fill: '#0f172a',
          stroke: '#00dbe7'
        }
      ],
      width: 1920,
      height: 1080,
      backgroundColor: '#0a0a0c',
      gridSnap: true,
      aspectRatio: '16:9'
    };

    return {
      format: 'canvas',
      content: JSON.stringify(canvasState),
      category: 'Diagrams',
      tags: ['Excalidraw', 'Canvas', 'Architecture']
    };
  } catch {
    return {
      format: 'canvas',
      content: JSON.stringify({ elements: [], width: 1920, height: 1080, backgroundColor: '#0a0a0c', gridSnap: true, aspectRatio: '16:9' }),
      category: 'Diagrams',
      tags: ['Canvas']
    };
  }
}

/**
 * 7. Image File Parser (PNG, JPG, SVG, WebP)
 * Places image card onto Edgeless Canvas
 */
export function parseImageToCanvas(dataUrl: string, fileName: string): ParsedDocumentResult {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Imported Graphic';
  const ext = fileName.split('.').pop()?.toUpperCase() || 'IMG';
  
  const canvasState: CanvasSceneState = {
    elements: [
      {
        id: `img_${Date.now().toString(36)}`,
        type: 'image',
        imageUrl: dataUrl,
        x: 180,
        y: 120,
        width: 520,
        height: 360,
        zIndex: 1,
        text: cleanTitle,
        stroke: '#00dbe7',
        strokeWidth: 1.5,
        borderRadius: 12,
        shadow: true,
        imageFit: 'contain'
      },
      {
        id: `sticky_${Date.now().toString(36)}`,
        type: 'sticky',
        x: 740,
        y: 140,
        width: 220,
        height: 160,
        zIndex: 2,
        text: `Image Asset:\n${fileName}\n\n• Format: ${ext}\n• Status: Sovereign Vault\n\nAnnotate or link system components to this graphic asset.`,
        fill: '#2c2813',
        stroke: '#ffd700',
        textColor: '#fff280',
        fontSize: 12,
        shadow: true
      }
    ],
    width: 1920,
    height: 1080,
    backgroundColor: '#0a0a0c',
    gridSnap: true,
    aspectRatio: '16:9'
  };

  return {
    format: 'canvas',
    content: JSON.stringify(canvasState),
    category: 'Media Assets',
    tags: ['Image', ext, 'Canvas'],
    extraMetadata: { imageSrc: dataUrl, fileName }
  };
}

/**
 * 8. RTF (Rich Text Format) Parser
 */
export function parseRTF(rtfText: string, fileName: string): ParsedDocumentResult {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').trim() || 'Imported Document';
  // Strip RTF control words: \rtf1, \b, \par, etc.
  let text = rtfText.replace(/\\par[d]?\b/g, '\n');
  text = text.replace(/\\line\b/g, '\n');
  text = text.replace(/\\tab\b/g, '\t');
  text = text.replace(/\\[a-zA-Z]+(-?\d+)? ?/g, '');
  text = text.replace(/[{}]/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return {
    format: 'markdown',
    content: `# ${cleanTitle}\n\n${text}`,
    category: 'Rich Text',
    tags: ['RTF', 'Document']
  };
}

// Helpers
function colLettersToNumber(letters: string): number {
  let num = 0;
  for (let i = 0; i < letters.length; i++) {
    num = num * 26 + (letters.charCodeAt(i) - 64);
  }
  return num;
}

function unescapePdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function decodePdfHexString(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}
