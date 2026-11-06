import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Scissors, 
  PenTool, 
  FileDown, 
  Minimize2, 
  FileCode, 
  Upload, 
  Download, 
  Trash2, 
  RotateCw, 
  Check, 
  Copy, 
  Eye, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw,
  Plus,
  MoveUp,
  MoveDown,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  ChevronDown,
  QrCode,
  Hash,
  KeyRound,
  GitCompare,
  Binary
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import QrGeneratorTool from './tools/QrGeneratorTool.js';
import JsonConverterTool from './tools/JsonConverterTool.js';
import HashGeneratorTool from './tools/HashGeneratorTool.js';
import UuidPasswordTool from './tools/UuidPasswordTool.js';
import TextDiffTool from './tools/TextDiffTool.js';
import Base64Tool from './tools/Base64Tool.js';


// Configure PDF.js worker
if (typeof window !== 'undefined' && (pdfjsLib as any).GlobalWorkerOptions) {
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${(pdfjsLib as any).version || '4.10.38'}/build/pdf.worker.min.mjs`;
  } catch {}
}

export type ToolType = 
  | 'pdf-to-image' 
  | 'image-to-pdf' 
  | 'merge-pdf' 
  | 'split-pdf' 
  | 'pdf-editor' 
  | 'pdf-to-word' 
  | 'compress-image' 
  | 'ocr-pdf'
  | 'qr-generator'
  | 'json-converter'
  | 'hash-generator'
  | 'uuid-password'
  | 'text-diff'
  | 'base64-tool';

export interface ToolMeta {
  id: ToolType;
  title: string;
  tagline: string;
  badge: string;
  category?: 'doc' | 'dev';
  icon: any;
  accentColor: string;
}

export const TOOLS_LIST: ToolMeta[] = [
  {
    id: 'pdf-to-image',
    title: 'PDF to Image',
    tagline: 'Convert PDF pages into high-resolution PNG, JPG, or WebP images.',
    badge: 'LOSSLESS',
    icon: ImageIcon,
    accentColor: '#00dbe7'
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    tagline: 'Combine JPG, PNG, and WebP images into a single formatted PDF.',
    badge: 'INSTANT',
    icon: FileText,
    accentColor: '#34d399'
  },
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    tagline: 'Combine multiple PDF documents into one organized file.',
    badge: 'UNLIMITED',
    icon: Layers,
    accentColor: '#818cf8'
  },
  {
    id: 'split-pdf',
    title: 'Split & Reorder',
    tagline: 'Extract specific pages, rotate, or split a PDF into separate files.',
    badge: 'VISUAL',
    icon: Scissors,
    accentColor: '#f59e0b'
  },
  {
    id: 'pdf-editor',
    title: 'PDF Sign & Edit',
    tagline: 'Draw signatures, annotate, redact, and stamp text directly on pages.',
    badge: 'E-SIGN',
    icon: PenTool,
    accentColor: '#ec4899'
  },
  {
    id: 'pdf-to-word',
    title: 'PDF to Word (DOCX)',
    tagline: 'Extract layout text and tables into editable Microsoft Word documents.',
    badge: 'CLEAN DOCX',
    icon: FileCode,
    accentColor: '#38bdf8'
  },
  {
    id: 'compress-image',
    title: 'Compress & Convert',
    tagline: 'Shrink image file sizes up to 90% without visible quality loss.',
    badge: 'WEBP / AVIF',
    icon: Minimize2,
    accentColor: '#fbbf24'
  },
  {
    id: 'ocr-pdf',
    title: 'Extract Text / OCR',
    tagline: 'Extract raw text, paragraphs, and data tables from any PDF document.',
    badge: 'PRIVACY-FIRST',
    icon: FileDown,
    accentColor: '#a78bfa'
  },
  {
    id: 'qr-generator',
    title: 'QR Code & Barcode',
    tagline: 'Generate custom QR codes for URLs, Wi-Fi, and text with vector SVG export.',
    badge: 'VECTOR SVG',
    category: 'dev',
    icon: QrCode,
    accentColor: '#00dbe7'
  },
  {
    id: 'json-converter',
    title: 'JSON Formatter & CSV',
    tagline: 'Format, minify, validate, and convert JSON to CSV and vice-versa in RAM.',
    badge: 'DEVELOPER',
    category: 'dev',
    icon: FileCode,
    accentColor: '#34d399'
  },
  {
    id: 'hash-generator',
    title: 'Hash & File Checksum',
    tagline: 'Hardware-accelerated SHA-256, SHA-512, and checksums for text and dropped files.',
    badge: 'WEB CRYPTO',
    category: 'dev',
    icon: Hash,
    accentColor: '#818cf8'
  },
  {
    id: 'uuid-password',
    title: 'Password & UUID Generator',
    tagline: 'Cryptographically secure random passwords, passphrases, and UUID v4 tokens.',
    badge: 'SECURE RNG',
    category: 'dev',
    icon: KeyRound,
    accentColor: '#f59e0b'
  },
  {
    id: 'text-diff',
    title: 'Text & Code Diff Checker',
    tagline: 'Side-by-side and inline visual difference comparison for text and source code.',
    badge: 'SIDE-BY-SIDE',
    category: 'dev',
    icon: GitCompare,
    accentColor: '#ec4899'
  },
  {
    id: 'base64-tool',
    title: 'Base64 & Data URI Studio',
    tagline: 'Encode and decode Base64, URL entities, and convert files into Data URIs.',
    badge: 'DATA URI',
    category: 'dev',
    icon: Binary,
    accentColor: '#38bdf8'
  }
];

interface PdfToolsStudioProps {
  initialTool?: ToolType;
  theme?: 'dark' | 'light';
  onAddLog?: (log: any) => void;
  isStandalone?: boolean;
}

export default function PdfToolsStudio({
  initialTool = 'pdf-to-image',
  theme = 'dark',
  onAddLog,
  isStandalone = false
}: PdfToolsStudioProps) {
  const isLight = theme === 'light';
  const [activeTool, setActiveTool] = useState<ToolType>(initialTool);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'doc' | 'dev'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialTool prop if changed from router
  useEffect(() => {
    setActiveTool(initialTool);
  }, [initialTool]);

  const addLogSafe = (type: 'INFO' | 'SUCCESS' | 'ERROR', message: string) => {
    if (onAddLog) {
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type,
        message: `[DocTools] ${message}`
      });
    }
  };

  return (
    <div className={`w-full flex flex-col ${isStandalone ? 'min-h-screen' : 'h-full'}`}>
      {/* Top Value Banner for Free Organic Traffic Funnel */}
      <div className={`px-4 sm:px-6 py-3 border-b text-xs flex flex-wrap items-center justify-between gap-3 ${
        isLight 
          ? 'bg-slate-50 border-slate-200 text-slate-700' 
          : 'bg-[#151518] border-[#3a494b]/40 text-[#c2c8c8]'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <span className="font-semibold text-emerald-500 dark:text-emerald-400">100% Sovereign & Private:</span>
          <span>Files are processed directly in your browser. Nothing is ever uploaded to any third-party server.</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-sky-500">
            <Zap className="w-3 h-3 shrink-0" /> Zero File Size Limits
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-purple-400">
            <Lock className="w-3 h-3 shrink-0" /> Client-Side WASM
          </span>
        </div>
      </div>

            {/* Category Pills & Tool Selector */}
      <div className={`px-4 sm:px-6 py-2 border-b flex items-center justify-between gap-3 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#151518] border-[#3a494b]/20'
      }`}>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? isLight ? 'bg-slate-200 text-slate-900 font-bold' : 'bg-white/10 text-white font-bold'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            All Tools (14)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('doc')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              selectedCategory === 'doc'
                ? isLight ? 'bg-sky-100 text-sky-800 font-bold' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            Document & PDF (8)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('dev')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              selectedCategory === 'dev'
                ? isLight ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-purple-500/15 text-purple-400 font-bold'
                : 'text-[#849495] hover:text-[#e5e1e4]'
            }`}
          >
            Developer & Misc (6)
          </button>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className={`px-4 sm:px-6 py-3 border-b overflow-x-auto scrollbar-thin ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121214] border-[#3a494b]/30'
      }`}>
        <div className="flex items-center gap-2 min-w-max">
          {TOOLS_LIST.filter(t => selectedCategory === 'all' || (selectedCategory === 'dev' ? t.category === 'dev' : t.category !== 'dev')).map(tool => {
            const Icon = tool.icon;
            const isSelected = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool(tool.id);
                  setStatusMessage(null);
                  setErrorMessage(null);
                }}
                className={`h-9 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 select-none ${
                  isSelected
                    ? isLight
                      ? 'bg-sky-500 text-white shadow-sm border border-sky-600'
                      : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/50 shadow-sm shadow-[#00dbe7]/10'
                    : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      : 'bg-[#1a191d] hover:bg-[#252429] text-[#a4a2a6] border border-[#3a494b]/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tool.title}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase ${
                  isSelected 
                    ? isLight ? 'bg-white/20 text-white' : 'bg-[#00dbe7]/20 text-[#00dbe7]'
                    : isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/5 text-[#849495]'
                }`}>
                  {tool.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tool Content Container */}
      <div className={`flex-1 p-4 sm:p-6 overflow-y-auto ${isLight ? 'bg-slate-100/60' : 'bg-[#0e0e11]'}`}>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Active Tool Header Badge */}
          {(() => {
            const current = TOOLS_LIST.find(t => t.id === activeTool) || TOOLS_LIST[0];
            const Icon = current.icon;
            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#3a494b]/20">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                    isLight 
                      ? 'bg-white border-slate-200 text-sky-600' 
                      : 'bg-[#1a191d] border-[#3a494b]/40 text-[#00dbe7]'
                  }`}>
                    <Icon className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-[#e5e1e4]'}`}>
                      {current.title}
                    </h2>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#849495]'}`}>
                      {current.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${
                    isLight 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    100% Client-Side Processing
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Error Banner */}
          {errorMessage && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in duration-150 ${
              isLight ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 font-mono">{errorMessage}</span>
              <button 
                type="button" 
                onClick={() => setErrorMessage(null)} 
                className="text-xs opacity-70 hover:opacity-100 uppercase font-mono font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Status / Success Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in duration-150 ${
              isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="flex-1 font-mono">{statusMessage}</span>
            </div>
          )}

          {/* Render Individual Active Sub-Tool */}
          {activeTool === 'pdf-to-image' && (
            <PdfToImageTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'image-to-pdf' && (
            <ImageToPdfTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'merge-pdf' && (
            <MergePdfTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'split-pdf' && (
            <SplitPdfTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'pdf-editor' && (
            <PdfEditorTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'pdf-to-word' && (
            <PdfToWordTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'compress-image' && (
            <CompressImageTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'ocr-pdf' && (
            <ExtractTextTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'qr-generator' && (
            <QrGeneratorTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'json-converter' && (
            <JsonConverterTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'hash-generator' && (
            <HashGeneratorTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'uuid-password' && (
            <UuidPasswordTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'text-diff' && (
            <TextDiffTool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}

          {activeTool === 'base64-tool' && (
            <Base64Tool 
              isLight={isLight} 
              isProcessing={isProcessing} 
              setIsProcessing={setIsProcessing} 
              setStatus={setStatusMessage} 
              setError={setErrorMessage} 
              addLog={addLogSafe} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-TOOL 1: PDF to Image (PNG / JPG / WebP) with Page Selection & ZIP Export
// ============================================================================
function PdfToImageTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageThumbnails, setPageThumbnails] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [dpiScale, setDpiScale] = useState<number>(2); // 2x for sharp 150-200 DPI
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }
    setError(null);
    setStatus(null);
    setFile(selected);
    setIsProcessing(true);
    setPageThumbnails([]);
    setSelectedPages(new Set());

    try {
      const buffer = await selected.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const total = pdf.numPages;
      setPageCount(total);

      // Render previews for all pages
      const thumbs: { pageNum: number; dataUrl: string }[] = [];
      const allSelected = new Set<number>();

      for (let p = 1; p <= total; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.5 }); // Thumbnail scale
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbs.push({ pageNum: p, dataUrl: canvas.toDataURL('image/jpeg', 0.8) });
          allSelected.add(p);
        }
      }

      setPageThumbnails(thumbs);
      setSelectedPages(allSelected);
      setStatus(`Loaded ${selected.name} (${total} pages ready).`);
      addLog('INFO', `Rendered ${total} pages from ${selected.name}`);
    } catch (err: any) {
      setError(`Failed to read PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set<number>();
    for (let i = 1; i <= pageCount; i++) next.add(i);
    setSelectedPages(next);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const handleExportImages = async () => {
    if (!file || selectedPages.size === 0) {
      setError('Please select at least one page to export.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const zip = new JSZip();
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      const mimeType = exportFormat === 'png' ? 'image/png' : exportFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      const ext = exportFormat === 'png' ? 'png' : exportFormat === 'webp' ? 'webp' : 'jpg';

      for (const pageNum of Array.from(selectedPages).sort((a, b) => a - b)) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: dpiScale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const blob: Blob = await new Promise(resolve => canvas.toBlob(b => resolve(b!), mimeType, 0.92));
          zip.file(`${baseName}_page_${pageNum}.${ext}`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${baseName}_images.zip`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      setStatus(`Successfully exported ${selectedPages.size} page(s) into ${baseName}_images.zip!`);
      addLog('SUCCESS', `Exported ${selectedPages.size} images from PDF.`);
    } catch (err: any) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* File Dropzone */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
          isLight 
            ? 'border-slate-300 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/30' 
            : 'border-[#3a494b]/60 hover:border-[#00dbe7]/60 bg-white/2 hover:bg-[#00dbe7]/5'
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
          isLight ? 'bg-white border-slate-200 text-sky-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-[#00dbe7]'
        }`}>
          <Upload className="w-6 h-6 shrink-0" />
        </div>
        <div>
          <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
            {file ? file.name : 'Click to select or drop a PDF here'}
          </p>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-[#849495]'}`}>
            {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • ${pageCount} total pages` : 'Supports multi-page PDFs of any size'}
          </p>
        </div>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </div>

      {/* Page Grid & Conversion Controls */}
      {pageThumbnails.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3a494b]/20">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-[#e5e1e4]'}`}>
                {selectedPages.size} of {pageCount} pages selected
              </span>
              <button 
                type="button" 
                onClick={selectAll} 
                className="text-[11px] font-mono text-sky-500 hover:underline cursor-pointer ml-2"
              >
                Select All
              </button>
              <span className="text-[#849495]">•</span>
              <button 
                type="button" 
                onClick={clearSelection} 
                className="text-[11px] font-mono text-[#849495] hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={isLight ? 'text-slate-500' : 'text-[#849495]'}>Format:</span>
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value as any)}
                  className={`h-8 px-2 rounded-lg text-xs font-mono border ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                >
                  <option value="png">PNG (Lossless)</option>
                  <option value="jpeg">JPG (Compact)</option>
                  <option value="webp">WebP (Modern)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={isLight ? 'text-slate-500' : 'text-[#849495]'}>Resolution:</span>
                <select
                  value={dpiScale}
                  onChange={e => setDpiScale(Number(e.target.value))}
                  className={`h-8 px-2 rounded-lg text-xs font-mono border ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                >
                  <option value={1}>Standard (72 DPI)</option>
                  <option value={2}>High-Res (150 DPI)</option>
                  <option value={3}>Ultra-Crisp (300 DPI)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportImages}
                disabled={isProcessing || selectedPages.size === 0}
                className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 select-none ${
                  isLight
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                    : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 shadow-[#00dbe7]/10'
                }`}
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>{isProcessing ? 'Converting...' : 'Download ZIP'}</span>
              </button>
            </div>
          </div>

          {/* Grid of Pages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[480px] overflow-y-auto p-2 scrollbar-thin">
            {pageThumbnails.map(thumb => {
              const isSelected = selectedPages.has(thumb.pageNum);
              return (
                <div
                  key={thumb.pageNum}
                  onClick={() => togglePageSelection(thumb.pageNum)}
                  className={`relative rounded-xl border p-2 cursor-pointer transition-all flex flex-col items-center gap-2 group select-none ${
                    isSelected
                      ? isLight
                        ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                        : 'border-[#00dbe7] bg-[#00dbe7]/10 shadow-xs shadow-[#00dbe7]/10'
                      : isLight
                        ? 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                        : 'border-[#3a494b]/30 hover:border-[#3a494b]/60 bg-white/2'
                  }`}
                >
                  <div className="relative w-full aspect-[1/1.4] bg-white rounded-lg overflow-hidden border border-slate-200 dark:border-transparent flex items-center justify-center">
                    <img 
                      src={thumb.dataUrl} 
                      alt={`Page ${thumb.pageNum}`} 
                      className="w-full h-full object-contain pointer-events-none" 
                    />
                    <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-sky-500 text-white' : 'bg-black/40 text-transparent group-hover:border group-hover:border-white/50'
                    }`}>
                      <Check className="w-3 h-3 shrink-0" />
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
                    Page {thumb.pageNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-TOOL 2: Images to PDF Converter (JPG / PNG / WebP to PDF)
// ============================================================================
function ImageToPdfTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: any) {
  const [images, setImages] = useState<{ id: string; file: File; previewUrl: string }[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Fit'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [margin, setMargin] = useState<number>(15);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const validImages = selected.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) {
      setError('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    const newItems = validImages.map(file => ({
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newItems]);
    setStatus(`Added ${validImages.length} image(s).`);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImages(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleCompilePdf = async () => {
    if (images.length === 0) {
      setError('Please add at least one image.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        const buffer = await item.file.arrayBuffer();
        let embeddedImage: any;

        if (item.file.type === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(buffer);
        } else if (item.file.type === 'image/jpeg' || item.file.type === 'image/jpg') {
          embeddedImage = await pdfDoc.embedJpg(buffer);
        } else {
          // Convert other formats (WebP, GIF) to PNG canvas first
          const imgBitmap = await createImageBitmap(item.file);
          const canvas = document.createElement('canvas');
          canvas.width = imgBitmap.width;
          canvas.height = imgBitmap.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(imgBitmap, 0, 0);
          const pngBlob: Blob = await new Promise(r => canvas.toBlob(b => r(b!), 'image/png'));
          const pngBuffer = await pngBlob.arrayBuffer();
          embeddedImage = await pdfDoc.embedPng(pngBuffer);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = 595.28; // Standard A4 points
        let pageHeight = 841.89;

        if (pageSize === 'Letter') {
          pageWidth = 612;
          pageHeight = 792;
        } else if (pageSize === 'Fit') {
          pageWidth = imgWidth + margin * 2;
          pageHeight = imgHeight + margin * 2;
        }

        if (orientation === 'landscape' || (orientation === 'auto' && imgWidth > imgHeight)) {
          const temp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = temp;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate aspect-ratio fitted image coordinates
        const availableW = pageWidth - margin * 2;
        const availableH = pageHeight - margin * 2;
        const scale = Math.min(availableW / imgWidth, availableH / imgHeight, 1);
        const finalW = imgWidth * scale;
        const finalH = imgHeight * scale;
        const posX = (pageWidth - finalW) / 2;
        const posY = (pageHeight - finalH) / 2;

        page.drawImage(embeddedImage, {
          x: posX,
          y: posY,
          width: finalW,
          height: finalH
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `compiled_images_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      setStatus(`Compiled ${images.length} image(s) into PDF successfully!`);
      addLog('SUCCESS', `Created PDF from ${images.length} images.`);
    } catch (err: any) {
      setError(`Failed to compile PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Dropzone */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isLight 
            ? 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30' 
            : 'border-[#3a494b]/60 hover:border-emerald-400/60 bg-white/2 hover:bg-emerald-500/5'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          isLight ? 'bg-white border-slate-200 text-emerald-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-emerald-400'
        }`}>
          <Plus className="w-5 h-5 shrink-0" />
        </div>
        <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
          Click to add JPG, PNG, or WebP images
        </p>
        <input 
          ref={fileInputRef} 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={handleFiles} 
          className="hidden" 
        />
      </div>

      {images.length > 0 && (
        <div className="space-y-4">
          {/* Format Settings Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3a494b]/20">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={isLight ? 'text-slate-500' : 'text-[#849495]'}>Page Size:</span>
                <select 
                  value={pageSize} 
                  onChange={e => setPageSize(e.target.value as any)}
                  className={`h-8 px-2 rounded-lg text-xs font-mono border ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                >
                  <option value="A4">A4 Standard</option>
                  <option value="Letter">US Letter</option>
                  <option value="Fit">Fit to Image Size</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={isLight ? 'text-slate-500' : 'text-[#849495]'}>Orientation:</span>
                <select 
                  value={orientation} 
                  onChange={e => setOrientation(e.target.value as any)}
                  className={`h-8 px-2 rounded-lg text-xs font-mono border ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                >
                  <option value="auto">Auto (Match Aspect)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={isLight ? 'text-slate-500' : 'text-[#849495]'}>Margin:</span>
                <select 
                  value={margin} 
                  onChange={e => setMargin(Number(e.target.value))}
                  className={`h-8 px-2 rounded-lg text-xs font-mono border ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                >
                  <option value={0}>None (Edge to Edge)</option>
                  <option value={15}>Compact (15pt)</option>
                  <option value={30}>Normal (30pt)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompilePdf}
              disabled={isProcessing || images.length === 0}
              className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 select-none ${
                isLight
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-white border-emerald-500/50 shadow-emerald-500/10'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{isProcessing ? 'Generating...' : `Create PDF (${images.length})`}</span>
            </button>
          </div>

          {/* List of images with re-order buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((item, idx) => (
              <div 
                key={item.id}
                className={`p-2 rounded-xl border flex flex-col items-center gap-2 relative group ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/2 border-[#3a494b]/40'
                }`}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-black/10 flex items-center justify-center">
                  <img src={item.previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between w-full text-[10px] font-mono px-1">
                  <span className="truncate max-w-[80px]" title={item.file.name}>{item.file.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {idx > 0 && (
                      <button 
                        type="button" 
                        onClick={() => moveImage(idx, 'up')} 
                        className="p-1 hover:text-sky-500 cursor-pointer"
                        title="Move Left"
                      >
                        <MoveUp className="w-3 h-3 -rotate-90 shrink-0" />
                      </button>
                    )}
                    {idx < images.length - 1 && (
                      <button 
                        type="button" 
                        onClick={() => moveImage(idx, 'down')} 
                        className="p-1 hover:text-sky-500 cursor-pointer"
                        title="Move Right"
                      >
                        <MoveDown className="w-3 h-3 -rotate-90 shrink-0" />
                      </button>
                    )}
                    <button 
                      type="button" 
                      onClick={() => removeImage(item.id)} 
                      className="p-1 hover:text-rose-500 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-TOOL 3: Merge Multiple PDF Documents
// ============================================================================
function MergePdfTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: any) {
  const [pdfFiles, setPdfFiles] = useState<{ id: string; file: File; pageCount?: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const validPdfs = selected.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (validPdfs.length === 0) {
      setError('Please select valid PDF documents.');
      return;
    }

    const items: { id: string; file: File; pageCount?: number }[] = [];
    for (const f of validPdfs) {
      try {
        const buf = await f.arrayBuffer();
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        items.push({
          id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          file: f,
          pageCount: doc.getPageCount()
        });
      } catch {
        items.push({
          id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          file: f
        });
      }
    }

    setPdfFiles(prev => [...prev, ...items]);
    setStatus(`Added ${items.length} PDF(s). Total: ${pdfFiles.length + items.length}`);
  };

  const removeFile = (id: string) => {
    setPdfFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setPdfFiles(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();
      let totalPagesAdded = 0;

      for (const item of pdfFiles) {
        const buffer = await item.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
        totalPagesAdded += copiedPages.length;
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `merged_document_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      setStatus(`Successfully merged ${pdfFiles.length} files (${totalPagesAdded} pages)!`);
      addLog('SUCCESS', `Merged ${pdfFiles.length} PDFs into unified document.`);
    } catch (err: any) {
      setError(`Merge failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Dropzone */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isLight 
            ? 'border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30' 
            : 'border-[#3a494b]/60 hover:border-indigo-400/60 bg-white/2 hover:bg-indigo-500/5'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          isLight ? 'bg-white border-slate-200 text-indigo-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-indigo-400'
        }`}>
          <Layers className="w-5 h-5 shrink-0" />
        </div>
        <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
          Click to add multiple PDF documents to merge
        </p>
        <input 
          ref={fileInputRef} 
          type="file" 
          multiple 
          accept="application/pdf" 
          onChange={handleFiles} 
          className="hidden" 
        />
      </div>

      {pdfFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-[#e5e1e4]'}`}>
              Document Merge Order ({pdfFiles.length} files)
            </span>
            <button
              type="button"
              onClick={handleMerge}
              disabled={isProcessing || pdfFiles.length < 2}
              className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 select-none ${
                isLight
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
                  : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 hover:text-white border-indigo-500/50 shadow-indigo-500/10'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{isProcessing ? 'Merging...' : 'Merge All into One PDF'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {pdfFiles.map((item, idx) => (
              <div 
                key={item.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/2 border-[#3a494b]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold ${
                    isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/5 text-[#849495]'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
                      {item.file.name}
                    </p>
                    <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#849495]'}`}>
                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB {item.pageCount ? `• ${item.pageCount} pages` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    type="button" 
                    disabled={idx === 0} 
                    onClick={() => moveFile(idx, 'up')}
                    className="p-1.5 rounded hover:bg-white/5 text-[#849495] hover:text-[#00dbe7] disabled:opacity-30 cursor-pointer"
                  >
                    <MoveUp className="w-4 h-4 shrink-0" />
                  </button>
                  <button 
                    type="button" 
                    disabled={idx === pdfFiles.length - 1} 
                    onClick={() => moveFile(idx, 'down')}
                    className="p-1.5 rounded hover:bg-white/5 text-[#849495] hover:text-[#00dbe7] disabled:opacity-30 cursor-pointer"
                  >
                    <MoveDown className="w-4 h-4 shrink-0" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => removeFile(item.id)}
                    className="p-1.5 rounded hover:bg-rose-500/10 text-[#849495] hover:text-rose-400 cursor-pointer ml-1"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-TOOL 4: Split, Rotate & Organize PDF Pages
// ============================================================================
function SplitPdfTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<{ pageNum: number; rotation: number; dataUrl: string }[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsProcessing(true);
    setPages([]);
    setSelectedPages(new Set());

    try {
      const buffer = await selected.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const total = pdf.numPages;

      const items: { pageNum: number; rotation: number; dataUrl: string }[] = [];
      const sel = new Set<number>();

      for (let p = 1; p <= total; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          items.push({ pageNum: p, rotation: 0, dataUrl: canvas.toDataURL('image/jpeg', 0.8) });
          sel.add(p);
        }
      }

      setPages(items);
      setSelectedPages(sel);
      setStatus(`Loaded ${total} pages. Select pages to extract or rotate individually.`);
    } catch (err: any) {
      setError(`Failed to read PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const rotatePage = (pageNum: number) => {
    setPages(prev => prev.map(p => {
      if (p.pageNum === pageNum) {
        return { ...p, rotation: (p.rotation + 90) % 360 };
      }
      return p;
    }));
  };

  const deletePage = (pageNum: number) => {
    setPages(prev => prev.filter(p => p.pageNum !== pageNum));
    setSelectedPages(prev => {
      const next = new Set(prev);
      next.delete(pageNum);
      return next;
    });
  };

  const handleExportSelected = async () => {
    if (!file || selectedPages.size === 0) {
      setError('Please select at least one page.');
      return;
    }
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const sorted = Array.from(selectedPages).sort((a, b) => a - b);
      for (const pNum of sorted) {
        const [copied] = await newDoc.copyPages(srcDoc, [pNum - 1]);
        const pageMeta = pages.find(p => p.pageNum === pNum);
        if (pageMeta && pageMeta.rotation > 0) {
          copied.setRotation(degrees((copied.getRotation().angle + pageMeta.rotation) % 360));
        }
        newDoc.addPage(copied);
      }

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `extracted_${sorted.length}_pages.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      setStatus(`Successfully exported ${sorted.length} pages into a new PDF!`);
      addLog('SUCCESS', `Extracted ${sorted.length} pages.`);
    } catch (err: any) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isLight 
            ? 'border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30' 
            : 'border-[#3a494b]/60 hover:border-amber-400/60 bg-white/2 hover:bg-amber-500/5'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          isLight ? 'bg-white border-slate-200 text-amber-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-amber-400'
        }`}>
          <Scissors className="w-5 h-5 shrink-0" />
        </div>
        <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
          {file ? file.name : 'Click to select a PDF to split, rotate, or organize'}
        </p>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="application/pdf" 
          onChange={handleFile} 
          className="hidden" 
        />
      </div>

      {pages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-[#e5e1e4]'}`}>
              {selectedPages.size} of {pages.length} pages selected
            </span>
            <button
              type="button"
              onClick={handleExportSelected}
              disabled={isProcessing || selectedPages.size === 0}
              className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                isLight
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-white border-amber-500/50 shadow-amber-500/10'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Export Extracted PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[480px] overflow-y-auto p-2 scrollbar-thin">
            {pages.map(item => {
              const isSelected = selectedPages.has(item.pageNum);
              return (
                <div 
                  key={item.pageNum}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-2 relative ${
                    isSelected
                      ? isLight ? 'border-amber-500 bg-amber-50/40' : 'border-amber-400 bg-amber-400/10'
                      : isLight ? 'border-slate-200 bg-slate-50' : 'border-[#3a494b]/30 bg-white/2'
                  }`}
                >
                  <div 
                    onClick={() => {
                      setSelectedPages(prev => {
                        const next = new Set(prev);
                        if (next.has(item.pageNum)) next.delete(item.pageNum);
                        else next.add(item.pageNum);
                        return next;
                      });
                    }}
                    className="w-full aspect-[1/1.4] bg-white rounded-lg overflow-hidden cursor-pointer flex items-center justify-center relative"
                  >
                    <img 
                      src={item.dataUrl} 
                      alt={`Page ${item.pageNum}`} 
                      style={{ transform: `rotate(${item.rotation}deg)` }}
                      className="w-full h-full object-contain transition-transform duration-200" 
                    />
                    <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-amber-500 text-white' : 'bg-black/40 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 shrink-0" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full text-[10px] font-mono px-1">
                    <span>P. {item.pageNum}</span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        type="button" 
                        onClick={() => rotatePage(item.pageNum)} 
                        className="p-1 hover:text-amber-500 cursor-pointer"
                        title="Rotate 90° Clockwise"
                      >
                        <RotateCw className="w-3.5 h-3.5 shrink-0" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => deletePage(item.pageNum)} 
                        className="p-1 hover:text-rose-500 cursor-pointer"
                        title="Remove Page"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-TOOL 5: PDF Visual Editor, Digital Signer & Annotation Pad
// ============================================================================
function PdfEditorTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageCanvasDataUrl, setPageCanvasDataUrl] = useState<string | null>(null);

  // Editor mode: 'text' | 'draw' | 'signature' | 'stamp' | 'redact'
  const [editorMode, setEditorMode] = useState<'text' | 'draw' | 'signature' | 'stamp' | 'redact'>('text');
  const [textToInsert, setTextToInsert] = useState<string>('Approved by SutharLabs');
  const [fontSize, setFontSize] = useState<number>(16);
  const [annotationColor, setAnnotationColor] = useState<string>('#00dbe7');
  
  // Placed annotations per page
  const [annotations, setAnnotations] = useState<{
    id: string;
    page: number;
    type: 'text' | 'signature' | 'stamp' | 'redact';
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    content: string;
    color: string;
    size: number;
  }[]>([]);

  // Signature modal & canvas state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingSig = useRef<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setCurrentPage(1);
    setAnnotations([]);
    setIsProcessing(true);

    try {
      const buffer = await selected.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      setTotalPages(pdf.numPages);
      await renderPage(pdf, 1);
      setStatus(`Loaded ${selected.name}. Click anywhere on the page to insert annotations.`);
    } catch (err: any) {
      setError(`Failed to open PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPage = async (pdfDoc: any, pageNum: number) => {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport }).promise;
      setPageCanvasDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const changePage = async (target: number) => {
    if (!file || target < 1 || target > totalPages) return;
    setCurrentPage(target);
    const buffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: new Uint8Array(buffer) }).promise;
    await renderPage(pdf, target);
  };

  // Add annotation on click
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pageContainerRef.current) return;
    const rect = pageContainerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    if (editorMode === 'text') {
      if (!textToInsert.trim()) return;
      setAnnotations(prev => [
        ...prev,
        {
          id: `ann_${Date.now()}`,
          page: currentPage,
          type: 'text',
          x: xPct,
          y: yPct,
          content: textToInsert,
          color: annotationColor,
          size: fontSize
        }
      ]);
    } else if (editorMode === 'signature') {
      if (!signatureDataUrl) {
        setIsSignatureModalOpen(true);
        return;
      }
      setAnnotations(prev => [
        ...prev,
        {
          id: `ann_${Date.now()}`,
          page: currentPage,
          type: 'signature',
          x: xPct,
          y: yPct,
          content: signatureDataUrl,
          color: '#000000',
          size: 60
        }
      ]);
    } else if (editorMode === 'stamp') {
      setAnnotations(prev => [
        ...prev,
        {
          id: `ann_${Date.now()}`,
          page: currentPage,
          type: 'stamp',
          x: xPct,
          y: yPct,
          content: 'CONFIDENTIAL',
          color: '#ef4444',
          size: 20
        }
      ]);
    } else if (editorMode === 'redact') {
      setAnnotations(prev => [
        ...prev,
        {
          id: `ann_${Date.now()}`,
          page: currentPage,
          type: 'redact',
          x: xPct,
          y: yPct,
          content: 'REDACTED',
          color: '#000000',
          size: 14
        }
      ]);
    }
  };

  // Burn annotations into the PDF and download
  const handleBurnAndDownload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const ann of annotations) {
        if (ann.page > pdfDoc.getPageCount()) continue;
        const page = pdfDoc.getPage(ann.page - 1);
        const { width, height } = page.getSize();
        const posX = (ann.x / 100) * width;
        const posY = height - ((ann.y / 100) * height); // PDF coords origin is bottom-left

        if (ann.type === 'text') {
          page.drawText(ann.content, {
            x: posX,
            y: posY,
            size: ann.size,
            font: helveticaFont,
            color: rgb(0, 0.85, 0.9) // Sovereign cyan
          });
        } else if (ann.type === 'signature' && ann.content.startsWith('data:image/')) {
          const pngBytes = await fetch(ann.content).then(res => res.arrayBuffer());
          const pngImg = await pdfDoc.embedPng(pngBytes);
          page.drawImage(pngImg, {
            x: posX,
            y: posY - 30,
            width: 120,
            height: 45
          });
        } else if (ann.type === 'stamp') {
          page.drawRectangle({
            x: posX,
            y: posY - 20,
            width: 130,
            height: 28,
            borderColor: rgb(0.9, 0.2, 0.2),
            borderWidth: 2,
            color: rgb(0.95, 0.95, 0.95),
            opacity: 0.9
          });
          page.drawText('CONFIDENTIAL', {
            x: posX + 8,
            y: posY - 14,
            size: 13,
            font: helveticaFont,
            color: rgb(0.9, 0.2, 0.2)
          });
        } else if (ann.type === 'redact') {
          page.drawRectangle({
            x: posX,
            y: posY - 15,
            width: 100,
            height: 20,
            color: rgb(0, 0, 0)
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `signed_edited_${file.name}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      setStatus(`Successfully burned annotations and saved ${file.name}!`);
      addLog('SUCCESS', `Saved edited PDF with ${annotations.length} annotations.`);
    } catch (err: any) {
      setError(`Failed to save PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Signature canvas handlers
  const startSigDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingSig.current = true;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#00dbe7';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopSigDrawing = () => {
    isDrawingSig.current = false;
  };

  const saveSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
      setIsSignatureModalOpen(false);
      setStatus('Signature saved! Click on the document page to stamp it.');
    }
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Upload button if no file loaded */}
      {!file && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isLight 
              ? 'border-slate-300 hover:border-pink-500 bg-slate-50/50 hover:bg-pink-50/30' 
              : 'border-[#3a494b]/60 hover:border-pink-400/60 bg-white/2 hover:bg-pink-500/5'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isLight ? 'bg-white border-slate-200 text-pink-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-pink-400'
          }`}>
            <PenTool className="w-5 h-5 shrink-0" />
          </div>
          <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
            Click to select a PDF to sign, annotate, or redact
          </p>
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="application/pdf" 
            onChange={handleFile} 
            className="hidden" 
          />
        </div>
      )}

      {/* Editor Active Toolbar */}
      {file && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3a494b]/20">
            {/* Mode Switcher */}
            <div className={`flex rounded-lg p-0.5 border text-[11px] ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
            }`}>
              <button
                type="button"
                onClick={() => setEditorMode('text')}
                className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  editorMode === 'text'
                    ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                    : 'text-[#849495] hover:text-[#e5e1e4]'
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditorMode('signature');
                  if (!signatureDataUrl) setIsSignatureModalOpen(true);
                }}
                className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  editorMode === 'signature'
                    ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-pink-500/15 text-pink-400 font-bold border border-pink-500/30'
                    : 'text-[#849495] hover:text-[#e5e1e4]'
                }`}
              >
                Signature
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('stamp')}
                className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  editorMode === 'stamp'
                    ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30'
                    : 'text-[#849495] hover:text-[#e5e1e4]'
                }`}
              >
                Stamp
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('redact')}
                className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  editorMode === 'redact'
                    ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                    : 'text-[#849495] hover:text-[#e5e1e4]'
                }`}
              >
                Redact
              </button>
            </div>

            {/* Sub-controls based on mode */}
            {editorMode === 'text' && (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={textToInsert} 
                  onChange={e => setTextToInsert(e.target.value)} 
                  placeholder="Text to insert..."
                  className={`h-8 px-2.5 rounded-lg text-xs font-mono border w-48 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                />
              </div>
            )}

            {editorMode === 'signature' && (
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="text-xs font-mono text-pink-400 hover:underline cursor-pointer"
              >
                {signatureDataUrl ? 'Change Signature' : 'Draw Signature'}
              </button>
            )}

            {/* Page navigation */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <button 
                type="button" 
                disabled={currentPage <= 1} 
                onClick={() => changePage(currentPage - 1)}
                className="px-2 py-1 rounded border disabled:opacity-30 cursor-pointer"
              >
                Prev
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button 
                type="button" 
                disabled={currentPage >= totalPages} 
                onClick={() => changePage(currentPage + 1)}
                className="px-2 py-1 rounded border disabled:opacity-30 cursor-pointer"
              >
                Next
              </button>
            </div>

            <button
              type="button"
              onClick={handleBurnAndDownload}
              disabled={isProcessing}
              className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 select-none ${
                isLight
                  ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                  : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 shadow-[#00dbe7]/10'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Burn & Download PDF</span>
            </button>
          </div>

          {/* Interactive Document Page Canvas */}
          <div className="flex justify-center p-4 bg-black/20 rounded-xl overflow-auto max-h-[600px] scrollbar-thin">
            <div 
              ref={pageContainerRef}
              onClick={handlePageClick}
              className="relative shadow-2xl border border-slate-300 dark:border-white/10 cursor-crosshair select-none bg-white"
            >
              {pageCanvasDataUrl && (
                <img 
                  src={pageCanvasDataUrl} 
                  alt="PDF Page" 
                  className="max-w-[700px] w-full block pointer-events-none" 
                />
              )}

              {/* Render placed annotations on this page */}
              {annotations.filter(a => a.page === currentPage).map(ann => (
                <div 
                  key={ann.id}
                  style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
                >
                  {ann.type === 'text' && (
                    <span className="font-bold font-sans text-sky-600 dark:text-[#00dbe7] bg-black/40 px-1 rounded shadow-xs" style={{ fontSize: `${ann.size}px` }}>
                      {ann.content}
                    </span>
                  )}
                  {ann.type === 'signature' && (
                    <img src={ann.content} alt="Signature" className="w-28 h-auto" />
                  )}
                  {ann.type === 'stamp' && (
                    <div className="border-2 border-rose-600 text-rose-600 bg-white/90 font-black px-2 py-0.5 rounded text-xs tracking-widest rotate-[-12deg] shadow-md">
                      CONFIDENTIAL
                    </div>
                  )}
                  {ann.type === 'redact' && (
                    <div className="w-24 h-5 bg-black rounded-xs shadow-xs" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#3a494b]/50'
          }`}>
            <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
              Draw Digital Signature
            </h3>
            <div className="border rounded-xl bg-white overflow-hidden">
              <canvas
                ref={sigCanvasRef}
                width={400}
                height={160}
                onMouseDown={startSigDrawing}
                onMouseMove={drawSig}
                onMouseUp={stopSigDrawing}
                onMouseLeave={stopSigDrawing}
                className="w-full h-40 cursor-crosshair block"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const canvas = sigCanvasRef.current;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                  }
                }}
                className="text-xs font-mono text-[#849495] hover:underline cursor-pointer"
              >
                Clear Pad
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(false)}
                  className="h-8 px-3 rounded-lg text-xs font-mono uppercase border border-[#3a494b]/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSignature}
                  className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase bg-pink-500 text-white cursor-pointer shadow-sm"
                >
                  Apply Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-TOOL 6: PDF to Word (DOCX) & Structured Text Extractor
// ============================================================================
function PdfToWordTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedPages, setExtractedPages] = useState<{ pageNum: number; text: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsProcessing(true);
    setExtractedPages([]);

    try {
      const buffer = await selected.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const total = pdf.numPages;

      const pageTexts: { pageNum: number; text: string }[] = [];
      for (let p = 1; p <= total; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const text = (textContent.items as any[]).map(item => item.str).join(' ');
        pageTexts.push({ pageNum: p, text });
      }

      setExtractedPages(pageTexts);
      setStatus(`Parsed ${total} pages. Ready to generate formatted Microsoft Word (.docx) document.`);
    } catch (err: any) {
      setError(`Failed to extract text: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!file || extractedPages.length === 0) return;
    setIsProcessing(true);

    try {
      // Build an authentic OpenXML Word Document (.docx) package with JSZip
      const zip = new JSZip();

      // [Content_Types].xml
      zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

      // _rels/.rels
      zip.folder('_rels')?.file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

      // word/_rels/document.xml.rels
      zip.folder('word')?.folder('_rels')?.file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);

      // Generate paragraphs for word/document.xml
      let paragraphsXml = '';
      for (const p of extractedPages) {
        paragraphsXml += `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="00838F"/></w:rPr><w:t>--- Page ${p.pageNum} ---</w:t></w:r></w:p>`;
        const cleanText = p.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        paragraphsXml += `<w:p><w:r><w:t>${cleanText}</w:t></w:r></w:p>`;
      }

      zip.folder('word')?.file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${file.name.replace(/\.[^/.]+$/, '')}</w:t></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="757575"/></w:rPr><w:t>Converted by SutharLabs Sovereign Engine on ${new Date().toLocaleDateString()}</w:t></w:r></w:p>
    ${paragraphsXml}
  </w:body>
</w:document>`);

      const docxBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const downloadUrl = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}.docx`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      setStatus(`Successfully exported Word document (.docx)!`);
      addLog('SUCCESS', `Converted PDF to Word (.docx) document.`);
    } catch (err: any) {
      setError(`Failed to create DOCX: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isLight 
            ? 'border-slate-300 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/30' 
            : 'border-[#3a494b]/60 hover:border-sky-400/60 bg-white/2 hover:bg-sky-500/5'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          isLight ? 'bg-white border-slate-200 text-sky-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-sky-400'
        }`}>
          <FileCode className="w-5 h-5 shrink-0" />
        </div>
        <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
          {file ? file.name : 'Click to select a PDF to convert to Microsoft Word (.docx)'}
        </p>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="application/pdf" 
          onChange={handleFile} 
          className="hidden" 
        />
      </div>

      {extractedPages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-[#e5e1e4]'}`}>
              Extracted Content ({extractedPages.length} pages)
            </span>
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isProcessing}
              className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                isLight
                  ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                  : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-white border-sky-500/50 shadow-sky-500/10'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download .DOCX</span>
            </button>
          </div>

          <div className={`p-4 rounded-xl border max-h-80 overflow-y-auto font-mono text-xs leading-relaxed scrollbar-thin ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/20 border-[#3a494b]/30 text-[#c2c8c8]'
          }`}>
            {extractedPages.map(p => (
              <div key={p.pageNum} className="mb-4">
                <span className="text-sky-500 font-bold block mb-1">Page {p.pageNum}</span>
                <p className="whitespace-pre-wrap">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-TOOL 7: Image Compressor & WebP / AVIF Converter
// ============================================================================
function CompressImageTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<'webp' | 'jpeg' | 'png'>('webp');
  const [scale, setScale] = useState<number>(100);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setCompressedSize(null);
    setCompressedBlob(null);
  };

  const processImage = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(r => { img.onload = r; });

      const canvas = document.createElement('canvas');
      const targetWidth = Math.round(img.width * (scale / 100));
      const targetHeight = Math.round(img.height * (scale / 100));
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }

      const mime = format === 'webp' ? 'image/webp' : format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const blob: Blob = await new Promise(r => canvas.toBlob(b => r(b!), mime, quality / 100));

      setCompressedBlob(blob);
      setCompressedSize(blob.size);
      const savedPct = Math.round(((file.size - blob.size) / file.size) * 100);
      setStatus(`Compressed! Original: ${(file.size / 1024).toFixed(1)} KB → New: ${(blob.size / 1024).toFixed(1)} KB (${savedPct}% reduction)`);
      addLog('SUCCESS', `Compressed image from ${(file.size/1024).toFixed(1)}KB to ${(blob.size/1024).toFixed(1)}KB`);
    } catch (err: any) {
      setError(`Compression failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob || !file) return;
    const downloadUrl = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `optimized_${file.name.replace(/\.[^/.]+$/, '')}.${format}`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isLight 
            ? 'border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30' 
            : 'border-[#3a494b]/60 hover:border-amber-400/60 bg-white/2 hover:bg-amber-500/5'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          isLight ? 'bg-white border-slate-200 text-amber-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-amber-400'
        }`}>
          <Minimize2 className="w-5 h-5 shrink-0" />
        </div>
        <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
          {file ? file.name : 'Click to select an image to compress and convert to WebP / PNG / JPG'}
        </p>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          onChange={handleFile} 
          className="hidden" 
        />
      </div>

      {file && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3a494b]/20">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={isLight ? 'text-slate-500' : 'text-[#849495]'}>Output Format:</span>
                <select 
                  value={format} 
                  onChange={e => setFormat(e.target.value as any)}
                  className={`h-8 px-2 rounded-lg text-xs font-mono border ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                >
                  <option value="webp">WebP (Smallest file size)</option>
                  <option value="jpeg">JPG (Universal)</option>
                  <option value="png">PNG (Lossless)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={isLight ? 'text-slate-500' : 'text-[#849495]'}>Quality: {quality}%</span>
                <input 
                  type="range" 
                  min="20" 
                  max="100" 
                  value={quality} 
                  onChange={e => setQuality(Number(e.target.value))}
                  className="w-24 accent-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={isLight ? 'text-slate-500' : 'text-[#849495]'}>Scale: {scale}%</span>
                <select 
                  value={scale} 
                  onChange={e => setScale(Number(e.target.value))}
                  className={`h-8 px-2 rounded-lg text-xs font-mono border ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                >
                  <option value={100}>100% (Original)</option>
                  <option value={75}>75%</option>
                  <option value={50}>50%</option>
                  <option value={25}>25%</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={processImage}
                disabled={isProcessing}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                  isLight
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{isProcessing ? 'Optimizing...' : 'Optimize Now'}</span>
              </button>

              {compressedBlob && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm bg-emerald-500 hover:bg-emerald-600 text-white select-none"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>

          {previewUrl && (
            <div className="flex justify-center p-4 bg-black/10 rounded-xl">
              <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg object-contain" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-TOOL 8: Extract Text / OCR Extractor
// ============================================================================
function ExtractTextTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsProcessing(true);
    setExtractedText('');

    try {
      const buffer = await selected.arrayBuffer();
      const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const total = pdf.numPages;

      let fullText = '';
      for (let p = 1; p <= total; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const pageStr = (textContent.items as any[]).map(i => i.str).join(' ');
        fullText += `\n--- PAGE ${p} ---\n${pageStr}\n`;
      }

      setExtractedText(fullText.trim());
      setStatus(`Extracted text from ${total} pages successfully!`);
      addLog('SUCCESS', `Extracted text from ${file?.name || 'PDF'}.`);
    } catch (err: any) {
      setError(`Extraction failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, '') || 'extracted'}_text.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isLight 
            ? 'border-slate-300 hover:border-purple-500 bg-slate-50/50 hover:bg-purple-50/30' 
            : 'border-[#3a494b]/60 hover:border-purple-400/60 bg-white/2 hover:bg-purple-500/5'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          isLight ? 'bg-white border-slate-200 text-purple-600' : 'bg-[#1a191d] border-[#3a494b]/50 text-purple-400'
        }`}>
          <FileDown className="w-5 h-5 shrink-0" />
        </div>
        <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
          {file ? file.name : 'Click to select a PDF to extract text and tables'}
        </p>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="application/pdf" 
          onChange={handleFile} 
          className="hidden" 
        />
      </div>

      {extractedText && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-700' : 'text-[#e5e1e4]'}`}>
              Extracted Raw Text ({extractedText.length} characters)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyText}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
                  isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
              <button
                type="button"
                onClick={downloadText}
                className="h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download .TXT</span>
              </button>
            </div>
          </div>

          <textarea
            value={extractedText}
            readOnly
            rows={12}
            className={`w-full p-4 rounded-xl border font-mono text-xs leading-relaxed resize-y scrollbar-thin select-all ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-black/20 border-[#3a494b]/40 text-[#e5e1e4]'
            }`}
          />
        </div>
      )}
    </div>
  );
}

