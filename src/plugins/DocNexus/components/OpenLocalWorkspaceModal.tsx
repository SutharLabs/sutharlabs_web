import React, { useState, useRef } from 'react';
import { 
  X, 
  FolderOpen, 
  FileUp, 
  HardDrive, 
  FileText, 
  Table, 
  Shapes, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  FolderInput,
  UploadCloud
} from 'lucide-react';
import { DocNexusDocument } from '../types.js';
import { parseImportedFile, readFileAsText, readDirectoryHandleRecursively } from '../utils/fileImport.js';

interface OpenLocalWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDocuments: (docs: DocNexusDocument[], folderName?: string) => void;
  theme?: 'dark' | 'light';
}

export default function OpenLocalWorkspaceModal({
  isOpen,
  onClose,
  onImportDocuments,
  theme = 'dark'
}: OpenLocalWorkspaceModalProps) {
  const isLight = theme === 'light';
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (dirInputRef.current) {
      dirInputRef.current.setAttribute('webkitdirectory', '');
      dirInputRef.current.setAttribute('directory', '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Process File List from native input or drag-and-drop
  const processFiles = async (files: FileList | File[], folderName?: string) => {
    setIsProcessing(true);
    setStatusMessage('Reading and parsing local documents...');
    try {
      const docs: DocNexusDocument[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        // Skip hidden and binaries > 5MB
        if (file.name.startsWith('.') || file.size > 5 * 1024 * 1024) continue;
        try {
          const content = await readFileAsText(file);
          // If relative path exists (webkitdirectory)
          const relPath = (file as any).webkitRelativePath;
          const detectedFolder = relPath ? relPath.split('/')[0] : folderName;
          const doc = parseImportedFile(file.name, content, detectedFolder);
          docs.push(doc);
        } catch (err) {
          console.warn(`Could not read file ${file.name}:`, err);
        }
      }

      if (docs.length > 0) {
        onImportDocuments(docs, folderName);
        onClose();
      } else {
        setStatusMessage('No supported text or document files found in selection.');
      }
    } catch (err: any) {
      setStatusMessage(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Browse Single or Multiple Files
  const handleBrowseFilesClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // 2. Load Entire Local Directory / Folder
  const handleLoadDirectoryClick = async () => {
    // Try modern File System Access API first
    if ('showDirectoryPicker' in window) {
      try {
        setIsProcessing(true);
        setStatusMessage('Selecting local directory...');
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        setStatusMessage(`Scanning folder "${dirHandle.name}" for documents...`);

        const filesData = await readDirectoryHandleRecursively(dirHandle, 50);
        if (filesData.length === 0) {
          setStatusMessage(`No compatible documents found in "${dirHandle.name}".`);
          setIsProcessing(false);
          return;
        }

        const docs: DocNexusDocument[] = filesData.map(f => 
          parseImportedFile(f.fileName, f.content, dirHandle.name)
        );

        onImportDocuments(docs, dirHandle.name);
        onClose();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setIsProcessing(false);
          setStatusMessage(null);
          return; // user cancelled dialog
        }
        console.warn('showDirectoryPicker failed, falling back to input:', err);
      } finally {
        setIsProcessing(false);
      }
    }

    // Fallback to webkitdirectory file input
    if (dirInputRef.current) {
      dirInputRef.current.click();
    }
  };

  const handleDirInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const firstRelPath = (e.target.files[0] as any).webkitRelativePath;
      const folderName = firstRelPath ? firstRelPath.split('/')[0] : 'Local Directory';
      processFiles(e.target.files, folderName);
    }
  };

  // Drag and Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".md,.markdown,.txt,.json,.csv,.tsv,.html,.htm,.doc,.docx"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={dirInputRef}
        type="file"
        multiple
        onChange={handleDirInputChange}
        className="hidden"
      />

      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden font-sans transition-all ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-400/40' 
          : 'bg-[#111218] border-white/10 text-white shadow-black/80'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200/80 bg-slate-50/70' : 'border-white/[0.08] bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-500/10 text-cyan-400'
            }`}>
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Open Local Workspace
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Browse local files or mount an entire directory into DocNexus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200/70 text-slate-500' : 'hover:bg-white/10 text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Action Grid: Browse File vs Load Directory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Action 1: Load Local Directory */}
            <button
              onClick={handleLoadDirectoryClick}
              disabled={isProcessing}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                isLight 
                  ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 shadow-xs' 
                  : 'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-400/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${
                    isLight ? 'bg-indigo-600 text-white' : 'bg-cyan-400 text-black'
                  }`}>
                    <FolderInput className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Full Workspace
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Load Local Directory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  Mount an entire project folder. Ingests all Markdown, CSV, JSON, and text specs into the vault.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Select Folder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Action 2: Browse Individual Files */}
            <button
              onClick={handleBrowseFilesClick}
              disabled={isProcessing}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                isLight 
                  ? 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs' 
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${
                    isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'
                  }`}>
                    <FileUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Multi-file
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Browse Document
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  Select one or more documents from your local filesystem (.md, .csv, .json, .txt, .html).
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:translate-x-1 transition-transform">
                <span>Choose Files</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`p-6 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
              dragOver 
                ? isLight ? 'border-indigo-500 bg-indigo-50/70' : 'border-cyan-400 bg-cyan-500/10'
                : isLight ? 'border-slate-200/90 hover:bg-slate-50/60' : 'border-white/10 hover:bg-white/[0.02]'
            }`}
            onClick={handleBrowseFilesClick}
          >
            <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${
              dragOver ? (isLight ? 'text-indigo-600' : 'text-cyan-400') : 'text-slate-400'
            }`} />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Drag and drop local files or folders here
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Supports Markdown (.md), CSV spreadsheets (.csv), JSON diagrams, and plain text
            </p>
          </div>

          {/* Status / Processing feedback */}
          {isProcessing && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-xs text-cyan-300 animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{statusMessage || 'Loading local files...'}</span>
            </div>
          )}

          {statusMessage && !isProcessing && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Supported Format Badges */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Compatible with:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono"><FileText className="w-3 h-3 text-cyan-400" /> .md, .txt</span>
              <span className="flex items-center gap-1 font-mono"><Table className="w-3 h-3 text-amber-400" /> .csv, .tsv</span>
              <span className="flex items-center gap-1 font-mono"><Shapes className="w-3 h-3 text-purple-400" /> .json</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
