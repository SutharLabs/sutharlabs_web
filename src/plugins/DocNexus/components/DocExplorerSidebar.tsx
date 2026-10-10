import React, { useState } from 'react';
import { DocNexusDocument, DocumentFormat } from '../types.js';
import { 
  Plus, 
  Search, 
  Pin, 
  Copy, 
  Trash2, 
  Layout, 
  FileText, 
  Table, 
  Presentation, 
  Shapes,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface DocExplorerSidebarProps {
  documents: DocNexusDocument[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onCreateDoc: (format: DocumentFormat) => void;
  onDuplicateDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onOpenTemplates: () => void;
  theme?: 'dark' | 'light';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const FORMAT_CONFIG: Record<DocumentFormat, { label: string; icon: any; color: string; bg: string }> = {
  canvas: { label: 'Canvas', icon: Shapes, color: '#ce5dff', bg: 'rgba(206,93,255,0.1)' },
  markdown: { label: 'Markdown', icon: FileText, color: '#74f5ff', bg: 'rgba(0,219,231,0.1)' },
  richtext: { label: 'Executive Doc', icon: Layout, color: '#00e476', bg: 'rgba(0,228,118,0.1)' },
  sheet: { label: 'Spreadsheet', icon: Table, color: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
  slides: { label: 'Slides', icon: Presentation, color: '#ff7b72', bg: 'rgba(255,123,114,0.1)' }
};

export default function DocExplorerSidebar({
  documents,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
  onDuplicateDoc,
  onDeleteDoc,
  onOpenTemplates,
  theme = 'dark',
  isCollapsed = false,
  onToggleCollapse
}: DocExplorerSidebarProps) {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'ALL' | DocumentFormat>('ALL');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const filteredDocs = documents.filter(doc => {
    const matchesFormat = formatFilter === 'ALL' || doc.format === formatFilter;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.metadata?.tags && doc.metadata.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFormat && matchesSearch;
  });

  return (
    <aside className={`flex flex-col border-r transition-all duration-200 select-none ${
      isCollapsed ? 'w-14' : 'w-72'
    } ${
      isLight 
        ? 'bg-slate-50/95 border-slate-200 text-slate-800' 
        : 'bg-[#0a0a0c]/95 border-outline/15 text-[#b9cacb]'
    }`}>
      {/* Top Header / Collapse Trigger */}
      <div className="p-3 border-b border-outline/10 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#00dbe7]">folder_open</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface">
              Document Vault
            </span>
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Action Buttons: New Document & Templates */}
          <div className="p-3 space-y-2 border-b border-outline/10">
            <div className="relative">
              <button
                onClick={() => setIsCreateMenuOpen(prev => !prev)}
                className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between shadow-sm cursor-pointer transition-all ${
                  isLight 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-[#ce5dff]/20 hover:bg-[#ce5dff]/30 text-[#ebb2ff] border border-[#ce5dff]/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  New Document
                </span>
                <span className="text-[10px] opacity-75">▼</span>
              </button>

              {isCreateMenuOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-lg border shadow-xl z-50 p-1.5 font-mono text-xs ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-outline/25 text-white'
                }`}>
                  {(Object.keys(FORMAT_CONFIG) as DocumentFormat[]).map(fmt => {
                    const cfg = FORMAT_CONFIG[fmt];
                    const IconComp = cfg.icon;
                    return (
                      <button
                        key={fmt}
                        onClick={() => {
                          onCreateDoc(fmt);
                          setIsCreateMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left transition-colors cursor-pointer ${
                          isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'
                        }`}
                      >
                        <span style={{ color: cfg.color }} className="p-1 rounded bg-black/20">
                          <IconComp className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex-1">
                          <span className="block font-semibold text-[11px]">{cfg.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={onOpenTemplates}
              className={`w-full py-1.5 px-3 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' 
                  : 'bg-surface-container-low hover:bg-white/5 border-outline/20 text-[#74f5ff]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00dbe7]" />
              Browse Templates
            </button>
          </div>

          {/* Search Input */}
          <div className="p-3 pb-2">
            <div className={`flex items-center px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121214] border-outline/15 text-white'
            }`}>
              <Search className="w-3.5 h-3.5 text-on-surface-variant mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none w-full text-xs placeholder:text-on-surface-variant"
              />
            </div>
          </div>

          {/* Format Filter Badges */}
          <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
            {(['ALL', 'canvas', 'markdown', 'richtext', 'sheet', 'slides'] as const).map(fmt => {
              const isSelected = formatFilter === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => setFormatFilter(fmt)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 cursor-pointer transition-all ${
                    isSelected
                      ? isLight ? 'bg-slate-900 text-white font-bold' : 'bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/40 font-bold'
                      : isLight ? 'bg-slate-200/70 text-slate-600 hover:bg-slate-200' : 'bg-surface-container-low text-on-surface-variant hover:text-white'
                  }`}
                >
                  {fmt === 'ALL' ? 'ALL' : FORMAT_CONFIG[fmt].label}
                </button>
              );
            })}
          </div>

          {/* Document Tree List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredDocs.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant font-mono text-xs italic">
                No matching documents.
              </div>
            ) : (
              filteredDocs.map(doc => {
                const isActive = doc.id === activeDocId;
                const cfg = FORMAT_CONFIG[doc.format] || FORMAT_CONFIG.markdown;
                const IconComp = cfg.icon;

                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className={`group relative p-2.5 rounded-lg cursor-pointer transition-all border flex items-start justify-between gap-2 ${
                      isActive
                        ? isLight
                          ? 'bg-purple-50/80 border-purple-300 text-slate-900 shadow-xs'
                          : 'bg-[#18181c] border-[#00dbe7]/40 text-white shadow-[0_0_12px_rgba(0,219,231,0.08)]'
                        : isLight
                          ? 'bg-transparent border-transparent hover:bg-slate-100/70 text-slate-700'
                          : 'bg-transparent border-transparent hover:bg-white/[0.03] text-[#b9cacb]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div 
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        className="p-1.5 rounded shrink-0 mt-0.5"
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {doc.metadata?.isPinned && (
                            <Pin className="w-3 h-3 text-[#ffd700] fill-current shrink-0" />
                          )}
                          <span className="font-sans text-xs font-semibold truncate block leading-snug">
                            {doc.title || "Untitled Document"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-on-surface-variant">
                          <span>{cfg.label}</span>
                          <span>•</span>
                          <span>{new Date(doc.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Hover Controls */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDuplicateDoc(doc.id);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-on-surface-variant hover:text-white"
                        title="Duplicate Document"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteDoc(doc.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-on-surface-variant hover:text-red-400"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Document Counter */}
          <div className="p-3 border-t border-outline/10 font-mono text-[10px] text-on-surface-variant flex justify-between items-center">
            <span>{documents.length} Sovereign Documents</span>
            <span className="text-[#00e476] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fb83]"></span>
              Synced
            </span>
          </div>
        </>
      )}
    </aside>
  );
}
