import React from 'react';
import { DocNexusDocument, CanvasElement } from '../types.js';
import { 
  SlidersHorizontal, 
  Palette, 
  Type, 
  Layers, 
  Info, 
  FileText, 
  Table, 
  Presentation, 
  ChevronRight,
  ShieldCheck,
  Maximize2
} from 'lucide-react';

interface InspectorPanelProps {
  document: DocNexusDocument;
  selectedCanvasElement?: CanvasElement | null;
  onUpdateCanvasElement?: (updated: Partial<CanvasElement>) => void;
  theme?: 'dark' | 'light';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function InspectorPanel({
  document,
  selectedCanvasElement,
  onUpdateCanvasElement,
  theme = 'dark',
  isCollapsed = false,
  onToggleCollapse
}: InspectorPanelProps) {
  const isLight = theme === 'light';

  // Compute generic metrics based on format
  const wordCount = React.useMemo(() => {
    if (document.format === 'markdown') {
      return document.content.trim().split(/\s+/).filter(Boolean).length;
    }
    return 0;
  }, [document]);

  return (
    <aside className={`border-l flex flex-col transition-all duration-200 select-none ${
      isCollapsed ? 'w-12' : 'w-72'
    } ${
      isLight ? 'bg-slate-50/95 border-slate-200/90 text-slate-800' : 'bg-[#09090d]/95 border-white/[0.08] text-slate-300'
    }`}>
      {/* Top Header */}
      <div className={`p-3.5 border-b flex items-center justify-between ${
        isLight ? 'border-slate-200/80' : 'border-white/[0.08]'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-500/10 text-cyan-400'}`}>
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <span className="font-sans text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                Design Properties
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {selectedCanvasElement ? 'Element selected' : 'Document overview'}
              </span>
            </div>
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200/70 text-slate-500' : 'hover:bg-white/[0.08] text-slate-400'
            }`}
            title={isCollapsed ? "Expand Inspector" : "Collapse Inspector"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4 font-sans text-xs">
          {/* Document Format Identity Card */}
          <div className={`p-3 rounded-xl border space-y-1.5 ${
            isLight ? 'border-slate-200 bg-white shadow-xs' : 'border-white/10 bg-white/[0.03]'
          }`}>
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
              Document Blueprint
            </span>
            <div className="font-semibold text-xs capitalize flex items-center gap-2 text-slate-900 dark:text-white">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              {document.format} Engine
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Format: <span className="font-semibold text-slate-700 dark:text-slate-200">{document.format.toUpperCase()}</span>
            </div>
          </div>

          {/* Canvas Mode Properties */}
          {document.format === 'canvas' && (
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">
                {selectedCanvasElement ? 'Vector Properties' : 'Artboard Details'}
              </span>

              {selectedCanvasElement && onUpdateCanvasElement ? (
                <div className="space-y-3">
                  {/* Text Editor */}
                  <div>
                    <label className="text-[11px] font-medium block mb-1 text-slate-600 dark:text-slate-400">Label Text</label>
                    <textarea
                      value={selectedCanvasElement.text || ''}
                      onChange={e => onUpdateCanvasElement({ text: e.target.value })}
                      className={`w-full p-2.5 rounded-xl text-xs resize-none h-18 border transition-colors ${
                        isLight ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' : 'bg-white/[0.04] border-white/10 text-white focus:border-cyan-400'
                      }`}
                      placeholder="Element text..."
                    />
                  </div>

                  {/* Dimensions: W & H */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium block mb-1 text-slate-600 dark:text-slate-400">Width (px)</label>
                      <input
                        type="number"
                        value={selectedCanvasElement.width}
                        onChange={e => onUpdateCanvasElement({ width: Number(e.target.value) })}
                        className={`w-full p-2 rounded-xl text-xs border font-mono ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1 text-slate-600 dark:text-slate-400">Height (px)</label>
                      <input
                        type="number"
                        value={selectedCanvasElement.height}
                        onChange={e => onUpdateCanvasElement({ height: Number(e.target.value) })}
                        className={`w-full p-2 rounded-xl text-xs border font-mono ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Colors: Fill & Stroke */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium block mb-1 text-slate-600 dark:text-slate-400">Fill Color</label>
                      <input
                        type="text"
                        value={selectedCanvasElement.fill || '#1e1e24'}
                        onChange={e => onUpdateCanvasElement({ fill: e.target.value })}
                        className={`w-full p-2 rounded-xl text-xs font-mono border ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1 text-slate-600 dark:text-slate-400">Stroke Color</label>
                      <input
                        type="text"
                        value={selectedCanvasElement.stroke || '#3a494b'}
                        onChange={e => onUpdateCanvasElement({ stroke: e.target.value })}
                        className={`w-full p-2 rounded-xl text-xs font-mono border ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Layer Z-Index */}
                  <div>
                    <label className="text-[11px] font-medium block mb-1 text-slate-600 dark:text-slate-400">Layer Order (Z-Index)</label>
                    <input
                      type="number"
                      value={selectedCanvasElement.zIndex}
                      onChange={e => onUpdateCanvasElement({ zIndex: Number(e.target.value) })}
                      className={`w-full p-2 rounded-xl text-xs font-mono border ${
                        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-white/[0.04] border-white/10 text-white'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div className={`p-3.5 rounded-xl border text-[11px] leading-relaxed ${
                  isLight ? 'border-slate-200 bg-white/60 text-slate-600' : 'border-white/5 bg-white/[0.02] text-slate-400'
                }`}>
                  Select any shape, text box, or sticky note on the canvas to configure its vector styles and dimensions.
                </div>
              )}
            </div>
          )}

          {/* Markdown Mode Properties */}
          {document.format === 'markdown' && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                Document Metrics
              </span>
              <div className={`flex justify-between py-1.5 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <span className="text-slate-500">Word Count:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{wordCount}</span>
              </div>
              <div className={`flex justify-between py-1.5 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <span className="text-slate-500">Character Count:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{document.content.length}</span>
              </div>
              <div className={`flex justify-between py-1.5 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <span className="text-slate-500">Reading Time:</span>
                <span className="font-semibold text-emerald-500">{Math.max(1, Math.ceil(wordCount / 200))} min</span>
              </div>
            </div>
          )}

          {/* Rich Document Properties */}
          {document.format === 'richtext' && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                Print & Layout
              </span>
              <div className={`flex justify-between py-1.5 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <span className="text-slate-500">Standard Paper:</span>
                <span className="font-semibold text-sky-500">ISO A4 (210×297mm)</span>
              </div>
              <div className={`flex justify-between py-1.5 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <span className="text-slate-500">Print Media:</span>
                <span className="font-semibold text-emerald-500">Vector PDF Ready</span>
              </div>
            </div>
          )}

          {/* Spreadsheet Properties */}
          {document.format === 'sheet' && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                Grid Capabilities
              </span>
              <div className={`flex justify-between py-1.5 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <span className="text-slate-500">Auto Formatter:</span>
                <span className="font-semibold text-amber-500">Indian Rupee (₹)</span>
              </div>
              <div className={`flex justify-between py-1.5 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <span className="text-slate-500">Export Support:</span>
                <span className="font-semibold text-emerald-500">RFC 4180 CSV</span>
              </div>
            </div>
          )}

          {/* Slide Deck Properties */}
          {document.format === 'slides' && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block">
                Presentation Spec
              </span>
              <div className={`flex justify-between py-1.5 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <span className="text-slate-500">Aspect Ratio:</span>
                <span className="font-semibold text-rose-500">16:9 Widescreen</span>
              </div>
              <div className={`flex justify-between py-1.5 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`}>
                <span className="text-slate-500">Presenter Engine:</span>
                <span className="font-semibold text-emerald-500">Interactive Fullscreen</span>
              </div>
            </div>
          )}

          {/* Sovereign Security & Zero Loss Tag */}
          <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-1">
            <span className="font-semibold text-cyan-400 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Sovereign Cloud Engine
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time synchronization with PostgreSQL and zero-loss local vault caching.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
