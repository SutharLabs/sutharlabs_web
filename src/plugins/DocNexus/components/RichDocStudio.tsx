import React, { useState } from 'react';
import { RichDocPage, RichDocState } from '../types.js';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Layers, 
  Sparkles 
} from 'lucide-react';

interface RichDocStudioProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  theme?: 'dark' | 'light';
}

const DEFAULT_DOC_STATE: RichDocState = {
  paperSize: 'A4',
  orientation: 'portrait',
  margins: 'normal',
  headerText: 'SUTHARLABS SOVEREIGN DOCUMENT',
  footerText: 'Page {page} of {total} • Strict Confidentiality',
  showPageNumbers: true,
  pages: [
    {
      id: 'p1',
      title: 'ENTERPRISE PROJECT CHARTER',
      watermark: 'CONFIDENTIAL',
      body: '1. EXECUTIVE SUMMARY\nThis document establishes the architecture deliverables and execution plan.\n\n2. TECHNICAL CRITERIA\n- Multi-tenant data segregation\n- Microservice sequence compilation\n- Rule 46 GST Invoicing compliance'
    }
  ]
};

export default function RichDocStudio({
  content,
  onChangeContent,
  theme = 'dark'
}: RichDocStudioProps) {
  const isLight = theme === 'light';

  const docState: RichDocState = React.useMemo(() => {
    try {
      if (!content) return DEFAULT_DOC_STATE;
      const parsed = JSON.parse(content);
      return { ...DEFAULT_DOC_STATE, ...parsed };
    } catch {
      return DEFAULT_DOC_STATE;
    }
  }, [content]);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [fontSize, setFontSize] = useState<number>(14);

  const activePage = docState.pages[activePageIndex] || docState.pages[0];

  const updateDoc = (newState: Partial<RichDocState>) => {
    const updated = { ...docState, ...newState };
    onChangeContent(JSON.stringify(updated));
  };

  const handleUpdateActivePage = (field: keyof RichDocPage, value: string) => {
    const updatedPages = docState.pages.map((p, idx) =>
      idx === activePageIndex ? { ...p, [field]: value } : p
    );
    updateDoc({ pages: updatedPages });
  };

  const handleAddPage = () => {
    const newPage: RichDocPage = {
      id: `p_${Date.now().toString(36)}`,
      title: `SECTION ${docState.pages.length + 1}`,
      body: 'Type page content here...',
      watermark: activePage?.watermark || ''
    };
    const updatedPages = [...docState.pages, newPage];
    updateDoc({ pages: updatedPages });
    setActivePageIndex(updatedPages.length - 1);
  };

  const handleDeletePage = () => {
    if (docState.pages.length <= 1) return;
    const updatedPages = docState.pages.filter((_, idx) => idx !== activePageIndex);
    updateDoc({ pages: updatedPages });
    setActivePageIndex(Math.max(0, activePageIndex - 1));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Studio Ribbon Toolbar */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 font-sans text-xs z-10 transition-colors ${
        isLight ? 'bg-slate-50/90 border-slate-200/90 text-slate-800' : 'bg-[#0e0e14]/90 border-white/[0.08] text-white'
      }`}>
        {/* Left: Page Navigator */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActivePageIndex(p => Math.max(0, p - 1))}
            disabled={activePageIndex === 0}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 ${
              isLight ? 'hover:bg-slate-200/70 text-slate-600' : 'hover:bg-white/10 text-slate-400'
            }`}
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-xs px-1 text-slate-700 dark:text-slate-200">
            Page {activePageIndex + 1} of {docState.pages.length}
          </span>
          <button
            onClick={() => setActivePageIndex(p => Math.min(docState.pages.length - 1, p + 1))}
            disabled={activePageIndex === docState.pages.length - 1}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 ${
              isLight ? 'hover:bg-slate-200/70 text-slate-600' : 'hover:bg-white/10 text-slate-400'
            }`}
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleAddPage}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 ml-2 transition-all cursor-pointer border ${
              isLight 
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs' 
                : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-cyan-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Page
          </button>

          {docState.pages.length > 1 && (
            <button
              onClick={handleDeletePage}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer ml-1"
              title="Delete Current Page"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: Formatting & Typography */}
        <div className="flex items-center gap-2">
          <select
            value={fontFamily}
            onChange={e => setFontFamily(e.target.value as any)}
            className={`border rounded-xl px-2.5 py-1.5 text-xs font-sans transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
            }`}
          >
            <option value="sans">Modern Sans</option>
            <option value="serif">Executive Serif</option>
            <option value="mono">Technical Mono</option>
          </select>

          <select
            value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))}
            className={`border rounded-xl px-2.5 py-1.5 text-xs font-sans transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
            }`}
          >
            <option value={12}>12pt Standard</option>
            <option value={14}>14pt Reading</option>
            <option value={16}>16pt Large</option>
            <option value={18}>18pt Heading</option>
          </select>

          <select
            value={activePage.watermark || ''}
            onChange={e => handleUpdateActivePage('watermark', e.target.value)}
            className={`border rounded-xl px-2.5 py-1.5 text-xs font-sans transition-colors ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
            }`}
          >
            <option value="">No Watermark</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="DRAFT">DRAFT</option>
            <option value="OFFICIAL">OFFICIAL</option>
            <option value="NDA PROTECTED">NDA PROTECTED</option>
          </select>
        </div>

        {/* Right: Print / PDF */}
        <button
          onClick={handlePrint}
          className={`px-3.5 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
            isLight 
              ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs' 
              : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-slate-200'
          }`}
        >
          <Printer className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
          <span>Print / PDF</span>
        </button>
      </div>

      {/* Center Paginated A4 Viewport */}
      <div className={`flex-1 overflow-auto p-8 flex justify-center custom-scrollbar ${isLight ? 'bg-slate-200/80' : 'bg-[#050507]'}`}>
        {/* A4 Sheet Container */}
        <div 
          className={`w-[750px] min-h-[1050px] shadow-2xl rounded-sm p-14 flex flex-col justify-between relative border transition-all ${
            isLight 
              ? 'bg-white text-slate-900 border-slate-300' 
              : 'bg-[#0f0f13] text-white border-outline/25 shadow-[0_0_30px_rgba(0,0,0,0.8)]'
          } ${fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}
        >
          {/* Watermark Diagonal Overlay */}
          {activePage.watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
              <span className="text-7xl font-black opacity-5 tracking-widest -rotate-45 font-sans border-8 border-current px-8 py-4">
                {activePage.watermark}
              </span>
            </div>
          )}

          {/* Running Header */}
          <div className="border-b pb-3 flex justify-between items-center text-[11px] font-mono opacity-50 z-10">
            <input
              type="text"
              value={docState.headerText}
              onChange={e => updateDoc({ headerText: e.target.value })}
              className="bg-transparent border-none focus:outline-none w-full font-mono text-[11px]"
            />
            <span className="shrink-0 ml-4 font-bold uppercase">{docState.paperSize}</span>
          </div>

          {/* Page Body Content */}
          <div className="flex-1 py-8 z-10 flex flex-col space-y-4">
            <input
              type="text"
              value={activePage.title}
              onChange={e => handleUpdateActivePage('title', e.target.value)}
              placeholder="DOCUMENT / SECTION TITLE"
              className="text-2xl font-bold tracking-tight bg-transparent border-none focus:outline-none w-full uppercase"
            />
            <textarea
              value={activePage.body}
              onChange={e => handleUpdateActivePage('body', e.target.value)}
              placeholder="Start drafting legal or executive document content..."
              style={{ fontSize: `${fontSize}px` }}
              className="flex-1 w-full bg-transparent border-none focus:outline-none resize-none leading-relaxed custom-scrollbar"
            />
          </div>

          {/* Running Footer */}
          <div className="border-t pt-3 flex justify-between items-center text-[11px] font-mono opacity-50 z-10">
            <input
              type="text"
              value={docState.footerText.replace('{page}', String(activePageIndex + 1)).replace('{total}', String(docState.pages.length))}
              onChange={e => updateDoc({ footerText: e.target.value })}
              className="bg-transparent border-none focus:outline-none w-2/3 font-mono text-[11px]"
            />
            <span className="font-bold">
              Page {activePageIndex + 1} of {docState.pages.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
