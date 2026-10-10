import React from 'react';
import { DocNexusDocument, CanvasElement } from '../types.js';
import { 
  Sliders, 
  Palette, 
  Type, 
  Layers, 
  Info, 
  FileText, 
  Table, 
  Presentation, 
  ChevronRight,
  ShieldAlert
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
      isCollapsed ? 'w-10' : 'w-64'
    } ${
      isLight ? 'bg-slate-50/95 border-slate-200 text-slate-800' : 'bg-[#0a0a0c]/95 border-outline/15 text-[#b9cacb]'
    }`}>
      {/* Top Header */}
      <div className={`p-3 border-b flex items-center justify-between ${
        isLight ? 'border-slate-200' : 'border-outline/10'
      }`}>
        {!isCollapsed && (
          <div className={`flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider ${
            isLight ? 'text-slate-800' : 'text-on-surface'
          }`}>
            <Sliders className="w-3.5 h-3.5 text-[#00dbe7]" />
            Property Inspector
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`p-1 rounded transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
            title={isCollapsed ? "Expand Inspector" : "Collapse Inspector"}
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 font-mono text-xs">
          {/* Format Identification Card */}
          <div className={`p-2.5 rounded-lg border space-y-1.5 ${
            isLight ? 'border-slate-200 bg-white shadow-xs' : 'border-outline/15 bg-surface-container-low/40'
          }`}>
            <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>
              Document Type
            </span>
            <div className={`font-bold capitalize flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-on-surface'}`}>
              <span className="w-2 h-2 rounded-full bg-[#00dbe7]"></span>
              {document.format} Engine
            </div>
            <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>
              Format: <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{document.format.toUpperCase()}</span>
            </div>
          </div>

          {/* Canvas Mode Properties */}
          {document.format === 'canvas' && (
            <div className="space-y-3">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                {selectedCanvasElement ? 'Element Properties' : 'Canvas Artboard'}
              </span>

              {selectedCanvasElement && onUpdateCanvasElement ? (
                <div className="space-y-3">
                  <div>
                    <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>Text Content</label>
                    <textarea
                      value={selectedCanvasElement.text || ''}
                      onChange={e => onUpdateCanvasElement({ text: e.target.value })}
                      className={`w-full p-2 rounded text-xs resize-none h-16 ${
                        isLight ? 'bg-white border border-slate-300 text-slate-800' : 'bg-surface-container-low border border-outline/20 text-white'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>Width</label>
                      <input
                        type="number"
                        value={selectedCanvasElement.width}
                        onChange={e => onUpdateCanvasElement({ width: Number(e.target.value) })}
                        className={`w-full p-1.5 rounded text-xs ${
                          isLight ? 'bg-white border border-slate-300 text-slate-800' : 'bg-surface-container-low border border-outline/20 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>Height</label>
                      <input
                        type="number"
                        value={selectedCanvasElement.height}
                        onChange={e => onUpdateCanvasElement({ height: Number(e.target.value) })}
                        className={`w-full p-1.5 rounded text-xs ${
                          isLight ? 'bg-white border border-slate-300 text-slate-800' : 'bg-surface-container-low border border-outline/20 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>Fill Color</label>
                    <input
                      type="text"
                      value={selectedCanvasElement.fill || '#1e1e24'}
                      onChange={e => onUpdateCanvasElement({ fill: e.target.value })}
                      className={`w-full p-1.5 rounded text-xs font-mono ${
                        isLight ? 'bg-white border border-slate-300 text-slate-800' : 'bg-surface-container-low border border-outline/20 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>Stroke Color</label>
                    <input
                      type="text"
                      value={selectedCanvasElement.stroke || '#3a494b'}
                      onChange={e => onUpdateCanvasElement({ stroke: e.target.value })}
                      className={`w-full p-1.5 rounded text-xs font-mono ${
                        isLight ? 'bg-white border border-slate-300 text-slate-800' : 'bg-surface-container-low border border-outline/20 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] block mb-1 ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>Layer Depth (Z-Index)</label>
                    <input
                      type="number"
                      value={selectedCanvasElement.zIndex}
                      onChange={e => onUpdateCanvasElement({ zIndex: Number(e.target.value) })}
                      className={`w-full p-1.5 rounded text-xs ${
                        isLight ? 'bg-white border border-slate-300 text-slate-800' : 'bg-surface-container-low border border-outline/20 text-white'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div className={`p-3 rounded border text-[11px] leading-relaxed ${
                  isLight ? 'border-slate-200 bg-slate-100/60 text-slate-600' : 'border-outline/10 text-on-surface-variant'
                }`}>
                  Select any shape, text box, or sticky note on the canvas to configure its vector styles and dimensions.
                </div>
              )}
            </div>
          )}

          {/* Markdown Mode Properties */}
          {document.format === 'markdown' && (
            <div className="space-y-2">
              <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                Document Metrics
              </span>
              <div className={`flex justify-between py-1 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-on-surface-variant'}>Word Count:</span>
                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{wordCount}</span>
              </div>
              <div className={`flex justify-between py-1 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-on-surface-variant'}>Character Count:</span>
                <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{document.content.length}</span>
              </div>
              <div className={`flex justify-between py-1 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-on-surface-variant'}>Reading Time:</span>
                <span className="font-bold text-[#00e476]">{Math.max(1, Math.ceil(wordCount / 200))} min</span>
              </div>
            </div>
          )}

          {/* Rich Document Properties */}
          {document.format === 'richtext' && (
            <div className="space-y-2">
              <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                Print & Layout
              </span>
              <div className={`flex justify-between py-1 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-on-surface-variant'}>Standard Paper:</span>
                <span className="font-bold text-[#0284c7]">ISO A4 (210×297mm)</span>
              </div>
              <div className={`flex justify-between py-1 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-on-surface-variant'}>Print Media:</span>
                <span className="font-bold text-[#00e476]">Vector PDF Ready</span>
              </div>
            </div>
          )}

          {/* Spreadsheet Properties */}
          {document.format === 'sheet' && (
            <div className="space-y-2">
              <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                Grid Capabilities
              </span>
              <div className={`flex justify-between py-1 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-on-surface-variant'}>Auto Formatter:</span>
                <span className="font-bold text-amber-600">Indian Rupee (₹)</span>
              </div>
              <div className={`flex justify-between py-1 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-on-surface-variant'}>Export Support:</span>
                <span className="font-bold text-[#00e476]">RFC 4180 CSV</span>
              </div>
            </div>
          )}

          {/* Slide Deck Properties */}
          {document.format === 'slides' && (
            <div className="space-y-2">
              <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-on-surface-variant'}`}>
                Presentation Spec
              </span>
              <div className={`flex justify-between py-1 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-on-surface-variant'}>Aspect Ratio:</span>
                <span className="font-bold text-rose-500">16:9 Widescreen</span>
              </div>
              <div className={`flex justify-between py-1 border-b text-[11px] ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-on-surface-variant'}>Presenter Engine:</span>
                <span className="font-bold text-[#00e476]">Interactive Fullscreen</span>
              </div>
            </div>
          )}

          {/* Statutory Security & Sovereign Tag */}
          <div className="p-3 rounded-lg border border-[#00dbe7]/20 bg-[#00dbe7]/5 space-y-1">
            <span className="font-bold text-[#74f5ff] text-[10px] flex items-center gap-1 uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              Sovereign Storage
            </span>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Documents are encrypted and synced to PostgreSQL with automatic zero-loss fallback caching.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
