import React, { useState, useEffect, useCallback } from 'react';
import { DocNexusDocument, DocNexusStudioProps, DocumentFormat, CanvasElement, DocTemplate } from '../types.js';
import DocExplorerSidebar from './DocExplorerSidebar.js';
import CanvasStudio from './CanvasStudio.js';
import MarkdownStudio from './MarkdownStudio.js';
import RichDocStudio from './RichDocStudio.js';
import SpreadsheetStudio from './SpreadsheetStudio.js';
import SlideDeckStudio from './SlideDeckStudio.js';
import InspectorPanel from './InspectorPanel.js';
import TemplateLibraryModal from './TemplateLibraryModal.js';
import ExportModal from './ExportModal.js';
import CommandPaletteModal from './CommandPaletteModal.js';
import OpenLocalWorkspaceModal from './OpenLocalWorkspaceModal.js';
import CollapsibleLogDrawer from '../../../components/CollapsibleLogDrawer.js';
import { 
  Save, 
  Download, 
  Sparkles, 
  BookOpen, 
  Layout, 
  Check, 
  Search,
  Command,
  Maximize2,
  Minimize2,
  Shapes,
  FileText,
  Table,
  Presentation,
  ChevronRight,
  HardDrive,
  FolderInput,
  FileUp
} from 'lucide-react';
import { BUILT_IN_TEMPLATES } from '../templates.js';

const INITIAL_DOCS: DocNexusDocument[] = BUILT_IN_TEMPLATES.map((tpl, idx) => ({
  id: `doc_${tpl.format}_${idx + 1}`,
  title: tpl.defaultTitle,
  format: tpl.format,
  content: tpl.initialContent,
  metadata: {
    ...tpl.metadata,
    isPinned: idx === 0
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

const FORMAT_TABS: { format: DocumentFormat; label: string; icon: any }[] = [
  { format: 'canvas', label: 'Canvas', icon: Shapes },
  { format: 'markdown', label: 'Docs', icon: FileText },
  { format: 'sheet', label: 'Grid', icon: Table },
  { format: 'richtext', label: 'A4', icon: Layout },
  { format: 'slides', label: 'Slides', icon: Presentation }
];

export default function DocNexusStudio({
  logs = [],
  onAddLog,
  userEmail,
  userToken,
  theme = 'dark'
}: DocNexusStudioProps) {
  const isLight = theme === 'light';

  // Documents state - initialized with rich blueprints so workspace is immediately active
  const [documents, setDocuments] = useState<DocNexusDocument[]>(() => {
    const saved = localStorage.getItem('sutharlabs_docnexus_vault');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_DOCS;
  });
  const [activeDocId, setActiveDocId] = useState<string>(() => {
    return INITIAL_DOCS[0].id;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modals & Local Workspace
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOpenLocalModalOpen, setIsOpenLocalModalOpen] = useState(false);
  const [activeLocalFolder, setActiveLocalFolder] = useState<{ name: string; count: number } | null>(null);

  // Layout sidebar & inspector toggles (Zen mode support)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const isZenMode = isSidebarCollapsed && isInspectorCollapsed;

  // Inspector selected element for canvas
  const [selectedCanvasElement, setSelectedCanvasElement] = useState<CanvasElement | null>(null);

  // Active document object
  const activeDocument = documents.find(d => d.id === activeDocId) || documents[0];

  // Ingestion handler for loaded local files or whole directories
  const handleImportDocuments = (newDocs: DocNexusDocument[], folderName?: string) => {
    setDocuments(prev => [...newDocs, ...prev]);
    if (newDocs.length > 0) {
      setActiveDocId(newDocs[0].id);
    }
    if (folderName) {
      setActiveLocalFolder({ name: folderName, count: newDocs.length });
    }
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `DOCNEXUS: Loaded ${newDocs.length} local document(s)${folderName ? ` from directory "${folderName}"` : ''} into sovereign workspace.`
    });
  };

  // Save to localStorage cache on update
  useEffect(() => {
    localStorage.setItem('sutharlabs_docnexus_vault', JSON.stringify(documents));
  }, [documents]);

  // Global Ctrl+K / Cmd+K Command Palette Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch documents from API on mount
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/plugins/wp_doc_nexus/documents', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const docs = await res.json();
        if (Array.isArray(docs) && docs.length > 0) {
          setDocuments(docs);
          setActiveDocId(docs[0].id);
        }
      }
    } catch (err) {
      // Local documents remain current
    }
  }, [userToken]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle active document content update
  const handleContentChange = (newContent: string) => {
    if (!activeDocument) return;
    setDocuments(prev =>
      prev.map(d => (d.id === activeDocument.id ? { ...d, content: newContent, updatedAt: new Date().toISOString() } : d))
    );
  };

  // Handle active document title update
  const handleTitleChange = (newTitle: string) => {
    if (!activeDocument) return;
    setDocuments(prev =>
      prev.map(d => (d.id === activeDocument.id ? { ...d, title: newTitle, updatedAt: new Date().toISOString() } : d))
    );
  };

  // Switch format directly on active document (Affine-style Page <-> Edgeless switch)
  const handleSwitchFormat = (newFormat: DocumentFormat) => {
    if (!activeDocument || activeDocument.format === newFormat) return;
    setDocuments(prev =>
      prev.map(d => d.id === activeDocument.id ? { ...d, format: newFormat, updatedAt: new Date().toISOString() } : d)
    );
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'INFO',
      message: `DOCNEXUS: Switched "${activeDocument.title}" view mode to ${newFormat.toUpperCase()}.`
    });
  };

  // Toggle Zen Focus Mode
  const toggleZenMode = () => {
    if (isZenMode) {
      setIsSidebarCollapsed(false);
      setIsInspectorCollapsed(false);
    } else {
      setIsSidebarCollapsed(true);
      setIsInspectorCollapsed(true);
    }
  };

  // Save document to backend
  const handleSave = async () => {
    if (!activeDocument) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/plugins/wp_doc_nexus/documents/${activeDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(activeDocument)
      });

      if (res.ok) {
        setSaveSuccess(true);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: `DOCNEXUS: Persisted "${activeDocument.title}" (${activeDocument.format.toUpperCase()}) to sovereign storage.`
        });
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Create new document
  const handleCreateDocument = async (format: DocumentFormat) => {
    try {
      const res = await fetch('/api/plugins/wp_doc_nexus/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: `Untitled ${format.toUpperCase()} Document`,
          format
        })
      });

      if (res.ok) {
        const newDoc = await res.json();
        setDocuments(prev => [newDoc, ...prev]);
        setActiveDocId(newDoc.id);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: `DOCNEXUS: Created new ${format.toUpperCase()} document: "${newDoc.title}".`
        });
      }
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  // Duplicate document
  const handleDuplicateDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/plugins/wp_doc_nexus/documents/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const clone = await res.json();
        setDocuments(prev => [clone, ...prev]);
        setActiveDocId(clone.id);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'INFO',
          message: `DOCNEXUS: Cloned document copy "${clone.title}".`
        });
      }
    } catch (err) {
      console.error('Failed to duplicate document:', err);
    }
  };

  // Delete document
  const handleDeleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/plugins/wp_doc_nexus/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const nextDocs = documents.filter(d => d.id !== id);
        setDocuments(nextDocs);
        if (activeDocId === id && nextDocs.length > 0) {
          setActiveDocId(nextDocs[0].id);
        }
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `DOCNEXUS: Deleted document ${id} from workspace.`
        });
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // Clone from template
  const handleSelectTemplate = async (template: DocTemplate) => {
    try {
      const res = await fetch('/api/plugins/wp_doc_nexus/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title: template.defaultTitle,
          format: template.format,
          templateId: template.id
        })
      });

      if (res.ok) {
        const created = await res.json();
        setDocuments(prev => [created, ...prev]);
        setActiveDocId(created.id);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: `DOCNEXUS: Instantiated template "${template.name}".`
        });
      }
    } catch (err) {
      console.error('Failed to instantiate template:', err);
    }
  };

  // Canvas Inspector update helper
  const handleUpdateCanvasElement = (updatedFields: Partial<CanvasElement>) => {
    if (!activeDocument || activeDocument.format !== 'canvas' || !selectedCanvasElement) return;
    try {
      const scene = JSON.parse(activeDocument.content);
      const elements: CanvasElement[] = scene.elements || [];
      const updatedElements = elements.map(el =>
        el.id === selectedCanvasElement.id ? { ...el, ...updatedFields } : el
      );
      handleContentChange(JSON.stringify({ ...scene, elements: updatedElements }));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Top Studio Ribbon Bar (World-Class Creative Suite Header) */}
      {/* Top Studio Ribbon Bar (World-Class Creative Suite Header - Zero Rollover) */}
      <header className={`px-3 sm:px-4 py-2 border-b flex items-center justify-between gap-2.5 z-20 backdrop-blur-md transition-colors ${
        isLight 
          ? 'bg-white/95 border-slate-200/90 text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]' 
          : 'bg-[#08080c]/95 border-white/[0.08] text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
      }`}>
        {/* Left: Breadcrumbs & Document Title (Constrained width to prevent collisions) */}
        <div className="flex items-center gap-2 shrink-0 min-w-0 max-w-[260px] sm:max-w-[320px]">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-sm shrink-0">
            <div className={`w-full h-full rounded-[7px] flex items-center justify-center ${
              isLight ? 'bg-white text-indigo-600' : 'bg-[#0e0e14] text-cyan-300'
            }`}>
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <div className="min-w-0 flex items-center gap-1.5 text-xs font-sans">
            <span className="hidden sm:inline font-medium text-slate-400 dark:text-slate-500 text-[11px] shrink-0">
              {activeDocument?.metadata?.category || 'Vault'} /
            </span>
            
            {/* Document Title Input */}
            <input
              type="text"
              value={activeDocument?.title || 'Untitled Document'}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Document Title"
              className={`bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-indigo-500 dark:focus:border-cyan-400 text-xs sm:text-sm font-semibold tracking-tight focus:outline-none truncate text-slate-900 dark:text-white font-sans w-28 sm:w-36 md:w-48 px-1 py-0.5 rounded transition-colors ${
                isLight ? 'hover:bg-slate-100/60' : 'hover:bg-white/[0.04]'
              }`}
            />

            {/* Compact Live Cloud Status Indicator */}
            <span 
              title="Saved to Sovereign Cloud Vault"
              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 cursor-help"
            />
          </div>
        </div>

        {/* Center: Apple / Figma / Canva-Style Segmented Paradigm Switcher Dock (Compact & Balanced) */}
        <div className={`flex items-center p-0.5 sm:p-1 rounded-xl border text-xs font-sans shrink-0 transition-all ${
          isLight 
            ? 'bg-slate-100/90 border-slate-200/80 shadow-inner' 
            : 'bg-[#121218]/90 border-white/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]'
        }`}>
          {FORMAT_TABS.map(tab => {
            const isSelected = activeDocument?.format === tab.format;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.format}
                onClick={() => handleSwitchFormat(tab.format)}
                title={`Switch to ${tab.label} Mode`}
                className={`px-2 sm:px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer relative ${
                  isSelected
                    ? isLight
                      ? 'bg-white text-indigo-600 shadow-sm font-semibold border border-slate-200/60'
                      : 'bg-[#1e1e28] text-cyan-300 shadow-[0_2px_8px_rgba(0,0,0,0.5)] font-semibold border border-cyan-400/30'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? (isLight ? 'text-indigo-600' : 'text-cyan-400') : 'opacity-70'}`} />
                <span className="hidden md:inline text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Search, Open Local, Templates, Save & Canva-Grade Export (Strict No-Rollover) */}
        <div className="flex items-center gap-1.5 font-sans text-xs shrink-0 whitespace-nowrap">
          {/* Quick Find (⌘K) */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl flex items-center gap-1 cursor-pointer border transition-all text-xs ${
              isLight 
                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs' 
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Quick Find & Command Palette (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-500" />
            <kbd className={`hidden xl:inline text-[9px] px-1 py-0.5 rounded font-mono font-medium ${
              isLight ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-black/40 text-slate-400 border border-white/10'
            }`}>
              ⌘K
            </kbd>
          </button>

          {/* Browse Document / Load Local Directory Button */}
          <button
            onClick={() => setIsOpenLocalModalOpen(true)}
            className={`px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1.5 cursor-pointer border transition-all shadow-xs ${
              isLight 
                ? 'bg-indigo-50/80 hover:bg-indigo-100/80 border-indigo-200/80 text-indigo-700' 
                : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-400/30 text-cyan-300'
            }`}
            title="Browse Local Document or Load Directory"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-xs">Open Local</span>
          </button>

          {/* Templates Trigger */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl font-medium flex items-center gap-1.5 cursor-pointer border transition-all shadow-xs ${
              isLight 
                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900' 
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200 hover:text-white'
            }`}
            title="Browse Document Blueprints & Templates"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden xl:inline text-xs">Templates</span>
          </button>

          {/* Save Vault Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl font-medium flex items-center gap-1.5 cursor-pointer border transition-all shadow-xs ${
              saveSuccess
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
                  : 'bg-white/[0.05] hover:bg-white/[0.09] text-white border-white/10'
            }`}
            title="Save to Sovereign Vault"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden xl:inline text-xs">Synced</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
                <span className="hidden xl:inline text-xs">{isSaving ? 'Saving...' : 'Save'}</span>
              </>
            )}
          </button>

          {/* Canva-Grade Luxury Export Primary CTA Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 text-white hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] active:scale-95 text-xs"
            title="Export Document (PDF, Markdown, HTML, CSV, PNG)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Zen Focus Mode Toggle */}
          <button
            onClick={toggleZenMode}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isZenMode
                ? isLight 
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-xs' 
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_10px_rgba(0,219,231,0.2)]'
                : isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-400 hover:text-white'
            }`}
            title={isZenMode ? "Exit Zen Focus Mode" : "Enter Zen Focus Mode"}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Studio Workbench (Sidebar + Active Format Canvas + Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Document Vault Explorer */}
        <DocExplorerSidebar
          documents={documents}
          activeDocId={activeDocId}
          onSelectDoc={id => setActiveDocId(id)}
          onCreateDoc={handleCreateDocument}
          onDuplicateDoc={handleDuplicateDocument}
          onDeleteDoc={handleDeleteDocument}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
          onOpenLocalWorkspace={() => setIsOpenLocalModalOpen(true)}
          activeLocalFolder={activeLocalFolder}
          onCloseLocalFolder={() => setActiveLocalFolder(null)}
          theme={theme}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* Center: Dynamic Active Document Engine */}
        <main className={`flex-1 flex flex-col overflow-hidden relative ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#050507] text-white'}`}>
          {activeDocument && activeDocument.format === 'canvas' && (
            <CanvasStudio
              content={activeDocument.content}
              onChangeContent={handleContentChange}
              theme={theme}
              selectedElementId={selectedCanvasElement?.id || null}
              onSelectElement={setSelectedCanvasElement}
            />
          )}

          {activeDocument && activeDocument.format === 'markdown' && (
            <MarkdownStudio
              content={activeDocument.content}
              onChangeContent={handleContentChange}
              theme={theme}
            />
          )}

          {activeDocument && activeDocument.format === 'richtext' && (
            <RichDocStudio
              content={activeDocument.content}
              onChangeContent={handleContentChange}
              theme={theme}
            />
          )}

          {activeDocument && activeDocument.format === 'sheet' && (
            <SpreadsheetStudio
              content={activeDocument.content}
              onChangeContent={handleContentChange}
              theme={theme}
            />
          )}

          {activeDocument && activeDocument.format === 'slides' && (
            <SlideDeckStudio
              content={activeDocument.content}
              onChangeContent={handleContentChange}
              theme={theme}
            />
          )}
        </main>

        {/* Right: Context-Sensitive Inspector Panel */}
        {activeDocument && (
          <InspectorPanel
            document={activeDocument}
            selectedCanvasElement={selectedCanvasElement}
            onUpdateCanvasElement={handleUpdateCanvasElement}
            theme={theme}
            isCollapsed={isInspectorCollapsed}
            onToggleCollapse={() => setIsInspectorCollapsed(prev => !prev)}
          />
        )}
      </div>

      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        documents={documents}
        onSelectDoc={id => setActiveDocId(id)}
        onCreateDoc={handleCreateDocument}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenLocalWorkspace={() => setIsOpenLocalModalOpen(true)}
        theme={theme}
      />

      {/* Open Local Workspace (Browse Document / Load Directory) Modal */}
      <OpenLocalWorkspaceModal
        isOpen={isOpenLocalModalOpen}
        onClose={() => setIsOpenLocalModalOpen(false)}
        onImportDocuments={handleImportDocuments}
        theme={theme}
      />

      {/* Template Library Modal */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        theme={theme}
      />

      {/* Export Modal */}
      {activeDocument && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          document={activeDocument}
          onAddLog={onAddLog}
          theme={theme}
        />
      )}

      {/* Bottom Collapsible Audit Drawer */}
      <CollapsibleLogDrawer
        title="DOCNEXUS SOVEREIGN ENGINE AUDIT LOG"
        logs={logs}
        defaultExpanded={false}
      />
    </div>
  );
}
