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
  ChevronRight,
  FolderOpen,
  X,
  ShieldCheck,
  MoreVertical,
  HardDrive,
  FileUp,
  FolderInput
} from 'lucide-react';

interface DocExplorerSidebarProps {
  documents: DocNexusDocument[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onCreateDoc: (format: DocumentFormat) => void;
  onDuplicateDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onOpenTemplates: () => void;
  onOpenLocalWorkspace?: () => void;
  activeLocalFolder?: { name: string; count: number } | null;
  onCloseLocalFolder?: () => void;
  theme?: 'dark' | 'light';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const FILTER_LABELS: Record<string, string> = {
  ALL: 'All',
  canvas: 'Canvas',
  markdown: 'Docs',
  sheet: 'Grid',
  richtext: 'A4',
  slides: 'Slides'
};

const FORMAT_CONFIG: Record<DocumentFormat, { 
  label: string; 
  description: string;
  icon: any; 
  color: string; 
  bg: string;
}> = {
  canvas: { 
    label: 'Edgeless Canvas', 
    description: 'Vector whiteboard, architecture & mindmaps',
    icon: Shapes, 
    color: '#a855f7', 
    bg: 'rgba(168, 85, 247, 0.12)'
  },
  markdown: { 
    label: 'Technical Docs', 
    description: 'Markdown specs, code blocks & mermaid diagrams',
    icon: FileText, 
    color: '#06b6d4', 
    bg: 'rgba(6, 182, 212, 0.12)'
  },
  sheet: { 
    label: 'Database Grid', 
    description: 'Spreadsheets, formulas & structured datasets',
    icon: Table, 
    color: '#eab308', 
    bg: 'rgba(234, 179, 8, 0.12)'
  },
  richtext: { 
    label: 'Executive A4', 
    description: 'Paginated corporate briefs, memos & print ready',
    icon: Layout, 
    color: '#10b981', 
    bg: 'rgba(16, 185, 129, 0.12)'
  },
  slides: { 
    label: 'Slide Deck', 
    description: '16:9 widescreen presentation pitch decks',
    icon: Presentation, 
    color: '#f43f5e', 
    bg: 'rgba(244, 63, 94, 0.12)'
  }
};

export default function DocExplorerSidebar({
  documents,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
  onDuplicateDoc,
  onDeleteDoc,
  onOpenTemplates,
  onOpenLocalWorkspace,
  activeLocalFolder,
  onCloseLocalFolder,
  theme = 'dark',
  isCollapsed = false,
  onToggleCollapse
}: DocExplorerSidebarProps) {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'ALL' | DocumentFormat>('ALL');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  const filteredDocs = documents.filter(doc => {
    const matchesFormat = formatFilter === 'ALL' || doc.format === formatFilter;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.metadata?.tags && doc.metadata.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFormat && matchesSearch;
  });

  return (
    <aside className={`flex flex-col border-r transition-all duration-200 select-none ${
      isCollapsed ? 'w-14' : 'w-76'
    } ${
      isLight 
        ? 'bg-slate-50/95 border-slate-200/90 text-slate-800' 
        : 'bg-[#09090d]/95 border-white/[0.08] text-slate-300'
    }`}>
      {/* Top Header / Collapse Trigger */}
      <div className={`p-3.5 border-b flex items-center justify-between ${
        isLight ? 'border-slate-200/80' : 'border-white/[0.08]'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-500/10 text-cyan-400'}`}>
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <span className={`font-sans text-xs font-bold block leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Document Vault
              </span>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {documents.length} sovereign files
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
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Action Area: New Document & Browse / Load Local Workspace */}
          <div className={`p-3 space-y-2 border-b ${isLight ? 'border-slate-200/80' : 'border-white/[0.08]'}`}>
            <div className="relative">
              <button
                onClick={() => setIsCreateMenuOpen(prev => !prev)}
                className="w-full py-2 px-3.5 rounded-xl font-sans text-xs font-semibold flex items-center justify-between cursor-pointer transition-all shadow-sm bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 text-white active:scale-[0.98]"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Document</span>
                </span>
                <span className="text-[10px] opacity-80">▼</span>
              </button>

              {/* Rich Creation Menu (Adobe / Canva Creative Suite Style) */}
              {isCreateMenuOpen && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl z-50 p-2 font-sans text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 ${
                  isLight 
                    ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50' 
                    : 'bg-[#12121a]/95 border-white/10 text-white shadow-black/80'
                }`}>
                  <div className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Select Paradigm Blueprint
                  </div>
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
                        className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isLight ? 'hover:bg-slate-100' : 'hover:bg-white/[0.06]'
                        }`}
                      >
                        <div 
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                          className="p-2 rounded-lg shrink-0 mt-0.5"
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`block font-semibold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {cfg.label}
                          </span>
                          <span className={`block text-[10px] leading-snug ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {cfg.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Local Disk Option inside dropdown */}
                  {onOpenLocalWorkspace && (
                    <>
                      <div className={`my-1 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`} />
                      <button
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          onOpenLocalWorkspace();
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isLight ? 'hover:bg-indigo-50 text-indigo-700' : 'hover:bg-cyan-500/10 text-cyan-300'
                        }`}
                      >
                        <HardDrive className="w-4 h-4 shrink-0" />
                        <span className="font-semibold text-xs">Open Local Files / Folder...</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions Row: Browse File & Load Folder */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onOpenLocalWorkspace}
                className={`py-1.5 px-2 rounded-xl font-sans text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                  isLight 
                    ? 'bg-white hover:bg-indigo-50/70 border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 shadow-xs' 
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200'
                }`}
                title="Browse Local Document File (.md, .csv, .json, .txt, .pdf, .docx, .pptx)"
              >
                <FileUp className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`} />
                <span>Browse File</span>
              </button>

              <button
                onClick={onOpenLocalWorkspace}
                className={`py-1.5 px-2 rounded-xl font-sans text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                  isLight 
                    ? 'bg-white hover:bg-indigo-50/70 border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 shadow-xs' 
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200'
                }`}
                title="Load Local Project Directory"
              >
                <FolderInput className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`} />
                <span>Load Folder</span>
              </button>
            </div>

            <button
              onClick={onOpenTemplates}
              className={`w-full py-1.5 px-3 rounded-xl font-sans text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                isLight 
                  ? 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700 shadow-xs' 
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Explore Templates</span>
            </button>
          </div>

          {/* Active Local Folder Banner */}
          {activeLocalFolder && (
            <div className={`mx-3 mt-2 p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-sans animate-in fade-in ${
              isLight ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900' : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0 truncate">
                  <span className="font-semibold block truncate text-[11px]">{activeLocalFolder.name}</span>
                  <span className="text-[10px] opacity-75">{activeLocalFolder.count} local docs loaded</span>
                </div>
              </div>
              {onCloseLocalFolder && (
                <button 
                  onClick={onCloseLocalFolder}
                  className={`p-1 rounded shrink-0 transition-colors ${
                    isLight 
                      ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800' 
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                  title="Close Local Folder Workspace"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Search Input with Hotkey Pill */}
          <div className="px-3 pt-2 pb-1.5">
            <div className={`flex items-center px-3 py-1.5 rounded-xl border text-xs font-sans transition-colors ${
              isLight 
                ? 'bg-white border-slate-200 text-slate-800 focus-within:border-indigo-500' 
                : 'bg-white/[0.04] border-white/10 text-white focus-within:border-cyan-400'
            }`}>
              <Search className={`w-3.5 h-3.5 mr-2 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`bg-transparent border-none focus:outline-none w-full text-xs ${
                  isLight ? 'placeholder:text-slate-400 text-slate-800' : 'placeholder:text-slate-500 text-white'
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className={`p-0.5 rounded transition-colors ${
                    isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Format Filter Badges (Compact, Balanced, Zero Clipping) */}
          <div className="px-3 pb-2 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
            {(['ALL', 'canvas', 'markdown', 'sheet', 'richtext', 'slides'] as const).map(fmt => {
              const isSelected = formatFilter === fmt;
              const label = FILTER_LABELS[fmt];
              return (
                <button
                  key={fmt}
                  onClick={() => setFormatFilter(fmt)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-sans font-medium shrink-0 cursor-pointer transition-all ${
                    isSelected
                      ? isLight 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                      : isLight 
                        ? 'bg-slate-200/60 text-slate-600 hover:bg-slate-200' 
                        : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Document Cards List (High-Craft Creative Suite Items) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1 space-y-1.5">
            {filteredDocs.length === 0 ? (
              <div className={`py-10 text-center font-sans text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
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
                    className={`group relative p-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between gap-2.5 ${
                      isActive
                        ? isLight
                          ? 'bg-white border-indigo-200 text-slate-900 shadow-sm ring-1 ring-indigo-500/20'
                          : 'bg-[#15161f] border-cyan-400/40 text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] ring-1 ring-cyan-400/20'
                        : isLight
                          ? 'bg-transparent border-transparent hover:bg-white hover:border-slate-200/60 text-slate-700 hover:shadow-xs'
                          : 'bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Document Format Icon Badge */}
                      <div 
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      >
                        <IconComp className="w-4 h-4" />
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {doc.metadata?.isPinned && (
                            <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          )}
                          <span className={`font-sans text-xs font-semibold truncate block leading-snug ${isLight ? 'text-slate-800' : 'text-white'}`}>
                            {doc.title || "Untitled Document"}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1.5 mt-0.5 text-[10px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {doc.metadata?.tags?.find(t => ['PDF', 'PPTX', 'DOCX', 'XLSX', 'IPYNB', 'RTF', 'CSV', 'EXCALIDRAW', 'PNG', 'JPG', 'JPEG', 'WEBP', 'SVG', 'GIF', 'BMP', 'ICO'].includes(t)) ? (
                            <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              isLight 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20'
                            }`}>
                              {doc.metadata?.tags?.find(t => ['PDF', 'PPTX', 'DOCX', 'XLSX', 'IPYNB', 'RTF', 'CSV', 'EXCALIDRAW', 'PNG', 'JPG', 'JPEG', 'WEBP', 'SVG', 'GIF', 'BMP', 'ICO'].includes(t))}
                            </span>
                          ) : (
                            <span>{cfg.label.split(' ')[0]}</span>
                          )}
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
                        className={`p-1.5 rounded-lg transition-colors ${
                          isLight ? 'hover:bg-slate-200/80 text-slate-600' : 'hover:bg-white/10 text-slate-400 hover:text-white'
                        }`}
                        title="Duplicate Document"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteDoc(doc.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Vault Status Footer */}
          <div className={`p-3 border-t font-sans text-[11px] flex justify-between items-center ${
            isLight ? 'border-slate-200/80 text-slate-500' : 'border-white/[0.08] text-slate-400'
          }`}>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sovereign Storage</span>
            </span>
            <span className="text-emerald-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
          </div>
        </>
      )}
    </aside>
  );
}
