import React, { useState, useEffect, useRef } from 'react';
import { DocNexusDocument, DocumentFormat } from '../types.js';
import { 
  Search, 
  FileText, 
  Shapes, 
  Table, 
  Presentation, 
  Layout, 
  Plus, 
  Sparkles, 
  Download, 
  X,
  Command,
  ArrowRight,
  HardDrive,
  FileUp,
  FolderInput
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocNexusDocument[];
  onSelectDoc: (id: string) => void;
  onCreateDoc: (format: DocumentFormat) => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenLocalWorkspace?: () => void;
  theme?: 'dark' | 'light';
}

const FORMAT_ICONS: Record<DocumentFormat, any> = {
  canvas: Shapes,
  markdown: FileText,
  richtext: Layout,
  sheet: Table,
  slides: Presentation
};

export default function CommandPaletteModal({
  isOpen,
  onClose,
  documents,
  onSelectDoc,
  onCreateDoc,
  onOpenTemplates,
  onOpenExport,
  onOpenLocalWorkspace,
  theme = 'dark'
}: CommandPaletteModalProps) {
  if (!isOpen) return null;
  const isLight = theme === 'light';

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filtered documents matching query
  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(query.toLowerCase()) ||
    (d.metadata?.tags && d.metadata.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
  );

  // Quick action items
  const actionItems = [
    { id: 'act_open_local_file', title: 'Open Local File (Browse Document)...', icon: FileUp, action: onOpenLocalWorkspace || (() => {}) },
    { id: 'act_load_directory', title: 'Load Local Directory / Project Workspace...', icon: FolderInput, action: onOpenLocalWorkspace || (() => {}) },
    { id: 'act_new_canvas', title: 'New Visual Canvas (Edgeless Whiteboard)', icon: Shapes, action: () => onCreateDoc('canvas') },
    { id: 'act_new_doc', title: 'New Technical Markdown Document', icon: FileText, action: () => onCreateDoc('markdown') },
    { id: 'act_new_sheet', title: 'New Database Grid & Spreadsheet', icon: Table, action: () => onCreateDoc('sheet') },
    { id: 'act_new_rich', title: 'New Executive Print A4 Document', icon: Layout, action: () => onCreateDoc('richtext') },
    { id: 'act_new_slides', title: 'New Slide Presentation Deck', icon: Presentation, action: () => onCreateDoc('slides') },
    { id: 'act_templates', title: 'Browse Template Gallery...', icon: Sparkles, action: onOpenTemplates },
    { id: 'act_export', title: 'Export Active Document (PDF, HTML, MD)...', icon: Download, action: onOpenExport }
  ].filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  const allItems = [
    ...filteredDocs.map(d => ({ type: 'doc' as const, item: d })),
    ...actionItems.map(a => ({ type: 'action' as const, item: a }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(allItems.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.type === 'doc') {
          onSelectDoc(current.item.id);
        } else {
          current.item.action();
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/70 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col font-mono text-xs ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-[#0f0f13] border-outline/25 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Command Search Input Bar */}
        <div className={`flex items-center px-4 py-3.5 border-b gap-3 ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-outline/10'
        }`}>
          <Search className={`w-4 h-4 shrink-0 ${isLight ? 'text-indigo-600' : 'text-[#00dbe7]'}`} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents or type a command... (Esc to exit)"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className={`w-full bg-transparent border-none focus:outline-none text-xs font-sans text-sm ${
              isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-on-surface placeholder:text-on-surface-variant'
            }`}
          />
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
            isLight ? 'border-slate-200 text-slate-500 bg-slate-100' : 'border-outline/20 text-on-surface-variant'
          }`}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {allItems.length === 0 ? (
            <div className={`p-8 text-center font-mono text-xs italic ${
              isLight ? 'text-slate-400' : 'text-on-surface-variant'
            }`}>
              No matching documents or actions found.
            </div>
          ) : (
            allItems.map((entry, idx) => {
              const isSelected = idx === selectedIndex;

              if (entry.type === 'doc') {
                const doc = entry.item;
                const IconComp = FORMAT_ICONS[doc.format] || FileText;

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      onSelectDoc(doc.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? isLight
                          ? 'bg-indigo-50 text-indigo-900 font-semibold border border-indigo-200/80 shadow-xs'
                          : 'bg-[#00dbe7]/15 text-white border border-[#00dbe7]/30'
                        : isLight
                          ? 'hover:bg-slate-100 text-slate-700 border border-transparent'
                          : 'hover:bg-white/5 text-[#b9cacb] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded ${
                        isLight ? 'bg-indigo-100/80 text-indigo-700' : 'bg-surface-container text-[#00dbe7]'
                      }`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </span>
                      <div className="truncate">
                        <span className="font-sans text-xs font-semibold block truncate">
                          {doc.title}
                        </span>
                        <span className={`font-mono text-[9px] capitalize ${
                          isLight ? 'text-slate-500' : 'text-on-surface-variant'
                        }`}>
                          {doc.format} • {new Date(doc.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-indigo-600' : 'text-[#00dbe7]'}`} />
                    )}
                  </div>
                );
              }

              // Action Item
              const act = entry.item;
              const IconComp = act.icon;

              return (
                <div
                  key={act.id}
                  onClick={() => {
                    act.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-900 font-semibold border border-indigo-200/80 shadow-xs'
                        : 'bg-[#ce5dff]/15 text-white border border-[#ce5dff]/30'
                      : isLight
                        ? 'hover:bg-slate-100 text-slate-700 border border-transparent'
                        : 'hover:bg-white/5 text-[#b9cacb] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`p-1.5 rounded ${
                      isLight ? 'bg-indigo-100/80 text-indigo-700' : 'bg-surface-container text-[#ce5dff]'
                    }`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-sans text-xs font-medium truncate">
                      {act.title}
                    </span>
                  </div>
                  {isSelected && (
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-indigo-600' : 'text-[#ce5dff]'}`} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className={`p-2.5 border-t text-[10px] flex items-center justify-between px-4 ${
          isLight ? 'border-slate-200 text-slate-500 bg-slate-50/50' : 'border-outline/10 text-on-surface-variant'
        }`}>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className={`font-semibold ${isLight ? 'text-indigo-600' : 'text-[#00dbe7]'}`}>Outline &amp; Affine Standard</span>
        </div>
      </div>
    </div>
  );
}
