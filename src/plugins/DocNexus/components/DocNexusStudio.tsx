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
  ChevronRight
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
  { format: 'canvas', label: 'Edgeless Canvas', icon: Shapes },
  { format: 'markdown', label: 'Page / Markdown', icon: FileText },
  { format: 'sheet', label: 'Database Grid', icon: Table },
  { format: 'richtext', label: 'Executive A4', icon: Layout },
  { format: 'slides', label: 'Slide Deck', icon: Presentation }
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

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Layout sidebar & inspector toggles (Zen mode support)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const isZenMode = isSidebarCollapsed && isInspectorCollapsed;

  // Inspector selected element for canvas
  const [selectedCanvasElement, setSelectedCanvasElement] = useState<CanvasElement | null>(null);

  // Active document object
  const activeDocument = documents.find(d => d.id === activeDocId) || documents[0];

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
      {/* Top Studio Control Bar (Outline & Affine Standard) */}
      <div className={`p-2.5 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-3 z-20 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a0a0d] border-outline/15 text-white'
      }`}>
        {/* Left: Breadcrumbs & Document Title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="p-1.5 rounded-lg bg-[#00dbe7]/15 text-[#74f5ff] shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant truncate">
              <span>Vault</span>
              <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
              <span className="capitalize">{activeDocument?.metadata?.category || 'General'}</span>
              <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
              <input
                type="text"
                value={activeDocument?.title || 'DocNexus Studio'}
                onChange={e => handleTitleChange(e.target.value)}
                className={`bg-transparent border-none text-sm font-bold tracking-tight focus:outline-none focus:border-b truncate text-on-surface font-sans max-w-sm ${
                  isLight ? 'focus:border-purple-600' : 'focus:border-[#00dbe7]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Center: Affine-Style Segmented Mode Switcher (Page vs Edgeless Canvas vs Database) */}
        <div className="flex items-center gap-0.5 bg-surface-container-low p-1 rounded-xl border border-outline/15 text-xs font-mono">
          {FORMAT_TABS.map(tab => {
            const isSelected = activeDocument?.format === tab.format;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.format}
                onClick={() => handleSwitchFormat(tab.format)}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                      : 'bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/40 shadow-[0_0_10px_rgba(0,219,231,0.15)]'
                    : 'text-on-surface-variant hover:text-white border border-transparent'
                }`}
              >
                <IconComp className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Command Palette, Zen Mode, Save, Export */}
        <div className="flex items-center gap-2 font-mono text-xs shrink-0">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer border transition-all text-on-surface-variant hover:text-white ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-surface-container-low border-outline/20'
            }`}
            title="Open Command Palette (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#00dbe7]" />
            <span className="text-[11px] hidden lg:inline">Search</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/30 border border-white/10 opacity-70">
              ⌘K
            </kbd>
          </button>

          {/* Zen Focus Mode Toggle */}
          <button
            onClick={toggleZenMode}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isZenMode
                ? 'bg-[#00dbe7]/20 text-[#74f5ff] border-[#00dbe7]/40'
                : 'text-on-surface-variant hover:text-white border-outline/20 bg-surface-container-low'
            }`}
            title={isZenMode ? "Exit Zen Focus Mode" : "Enter Zen Focus Mode"}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer border transition-all ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                : 'bg-surface-container-low hover:bg-white/5 border-outline/20 text-[#74f5ff]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00dbe7]" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer border transition-all ${
              saveSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isLight
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-transparent'
                  : 'bg-[#ce5dff]/20 hover:bg-[#ce5dff]/30 text-[#ebb2ff] border border-[#ce5dff]/40'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Synced!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Vault'}
              </>
            )}
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer border transition-all ${
              isLight 
                ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100' 
                : 'bg-[#00dbe7]/15 text-[#74f5ff] border-[#00dbe7]/30 hover:bg-[#00dbe7]/25'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

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
