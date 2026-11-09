import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  HardDrive, 
  Upload, 
  Download, 
  Trash2, 
  RefreshCw, 
  FileText, 
  FileArchive, 
  Database, 
  Key, 
  Image as ImageIcon, 
  File, 
  Copy, 
  Check, 
  Server, 
  AlertCircle,
  Search,
  FolderPlus,
  Plus,
  Grid,
  List as ListIcon,
  Star,
  Clock,
  ExternalLink,
  Share2,
  X,
  ChevronDown,
  CheckCircle2,
  Globe,
  Eye,
  FileCode,
  Music,
  Video,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileCheck
} from 'lucide-react';
import { VaultFileItem, VaultStatsResponse, TerminalLog } from '../types';
import { 
  fetchVaultStats, 
  fetchVaultFiles, 
  uploadVaultFile, 
  deleteVaultFile, 
  getVaultDownloadUrl, 
  formatBytes 
} from '../services/vaultStorageService';
import ConfirmModal, { ModalVariant } from './ConfirmModal';

interface StorageVaultViewProps {
  logs?: TerminalLog[];
  onAddLog?: (log: TerminalLog) => void;
  userToken: string;
  theme?: 'light' | 'dark';
}

const CATEGORIES = [
  'General',
  'Documents',
  'Media',
  'Backups',
  'Credentials & Keys',
  'Database Dumps'
];

export const StorageVaultView: React.FC<StorageVaultViewProps> = ({
  onAddLog,
  userToken,
  theme
}) => {
  const effectiveTheme: 'light' | 'dark' = theme || (
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const isLight = effectiveTheme === 'light';

  // Navigation & View Mode: Native Drive vs Embedded File Browser (filebrowser/filebrowser)
  const [viewMode, setViewMode] = useState<'drive' | 'filebrowser'>('drive');
  const [activeTab, setActiveTab] = useState<'my-drive' | 'recent' | 'starred' | 'trash'>('my-drive');
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('list');

  // Data state
  const [stats, setStats] = useState<VaultStatsResponse | null>(null);
  const [files, setFiles] = useState<VaultFileItem[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('sutharlabs_drive_starred');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // File Preview Modal State (Google Drive / Dropbox standard)
  const [previewFile, setPreviewFile] = useState<VaultFileItem | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewCopied, setPreviewCopied] = useState<boolean>(false);
  const [fileBrowserStatus, setFileBrowserStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Confirm Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subtext?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ModalVariant;
    isAlert?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const addLog = useCallback((source: string, message: string, type: 'INFO' | 'SUCCESS' | 'ALERT' | 'ERROR' = 'INFO') => {
    if (onAddLog) {
      onAddLog({
        source,
        message: `[${source}] ${message}`,
        type,
        timestamp: new Date().toLocaleTimeString()
      } as any);
    }
  }, [onAddLog]);

  const loadVaultData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [statsData, filesData] = await Promise.all([
        fetchVaultStats(userToken),
        fetchVaultFiles(userToken)
      ]);
      setStats(statsData);
      setFiles(filesData);
      if (isRefresh) {
        addLog('DRIVE', 'Drive files and storage capacity synchronized.', 'SUCCESS');
      }
    } catch (err: any) {
      console.error('Failed to load drive data:', err);
      setError(err.message || 'Unable to connect to Cloud Storage Drive.');
      addLog('DRIVE', `Storage sync error: ${err.message}`, 'ERROR');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userToken, addLog]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  const toggleStar = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('sutharlabs_drive_starred', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const shareFileLink = (file: VaultFileItem) => {
    const url = `${window.location.origin}${getVaultDownloadUrl(file.id, userToken)}`;
    navigator.clipboard.writeText(url);
    setShareFeedback(file.id);
    setTimeout(() => setShareFeedback(null), 2500);
    addLog('DRIVE', `Generated secure share link for "${file.originalName}".`, 'INFO');
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      addLog('DRIVE', `Starting upload for "${selectedFile.name}" (${formatBytes(selectedFile.size)})...`, 'INFO');
      const uploaded = await uploadVaultFile(
        selectedFile,
        selectedCategory,
        userToken,
        (percent) => setUploadProgress(percent)
      );
      
      addLog('DRIVE', `File uploaded: "${uploaded.originalName}" (${formatBytes(uploaded.size)}).`, 'SUCCESS');
      setSelectedFile(null);
      setUploadProgress(0);
      await loadVaultData(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      setModalConfig({
        isOpen: true,
        title: 'Upload Incomplete',
        message: err.message || 'Failed to upload file to Cloud Drive.',
        subtext: err.message?.includes('413') || err.message?.includes('payload')
          ? 'Network gateway payload limit was encountered. File chunking is active.'
          : 'Please check your connection and retry.',
        variant: 'danger',
        isAlert: true,
        confirmLabel: 'Dismiss',
        onConfirm: () => setModalConfig(null)
      });
      addLog('DRIVE', `Upload failed: ${err.message}`, 'ERROR');
    } finally {
      setIsUploading(false);
    }
  };

  const promptDeleteFile = (file: VaultFileItem) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete File',
      message: `Permanently delete "${file.originalName}"?`,
      subtext: `Size: ${formatBytes(file.size)}. This action frees disk space on VM 1 storage and cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        setModalConfig(null);
        try {
          addLog('DRIVE', `Deleting "${file.originalName}"...`, 'INFO');
          await deleteVaultFile(file.id, userToken);
          addLog('DRIVE', `Deleted "${file.originalName}".`, 'SUCCESS');
          await loadVaultData(true);
        } catch (err: any) {
          console.error('Delete error:', err);
          setModalConfig({
            isOpen: true,
            title: 'Delete Failed',
            message: err.message || 'Could not delete file from drive.',
            variant: 'danger',
            isAlert: true,
            confirmLabel: 'Dismiss',
            onConfirm: () => setModalConfig(null)
          });
        }
      }
    });
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
      return <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (['sql', 'dump', 'db', 'sqlite'].includes(ext)) {
      return <Database className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (['key', 'pem', 'crt', 'env'].includes(ext) || ext.includes('key')) {
      return <Key className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext) || mimeType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (['pdf', 'txt', 'md', 'json', 'csv', 'log', 'docx', 'xlsx'].includes(ext)) {
      return <FileText className="w-4 h-4 text-sky-500 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const getPreviewType = (mimeType: string, filename: string): 'image' | 'pdf' | 'audio' | 'video' | 'text' | 'binary' => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'bmp', 'ico'].includes(ext) || mimeType.startsWith('image/')) return 'image';
    if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext) || mimeType.startsWith('audio/')) return 'audio';
    if (['mp4', 'webm', 'ogv', 'mov', 'mkv'].includes(ext) || mimeType.startsWith('video/')) return 'video';
    if (['txt', 'md', 'json', 'csv', 'log', 'xml', 'yaml', 'yml', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'scss', 'sql', 'sh', 'env', 'prisma'].includes(ext) || mimeType.startsWith('text/') || mimeType === 'application/json') return 'text';
    return 'binary';
  };

  // Asynchronously fetch text content when previewing documents, logs or code
  useEffect(() => {
    if (!previewFile) {
      setPreviewTextContent(null);
      setPreviewError(null);
      return;
    }
    const type = getPreviewType(previewFile.mimeType, previewFile.originalName);
    if (type === 'text') {
      setIsPreviewLoading(true);
      setPreviewError(null);
      const url = getVaultDownloadUrl(previewFile.id, userToken);
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load file preview`);
          return res.text();
        })
        .then(text => {
          setPreviewTextContent(text.slice(0, 150000));
          setIsPreviewLoading(false);
        })
        .catch(err => {
          setPreviewError(err.message || 'Unable to fetch file text content');
          setIsPreviewLoading(false);
        });
    } else {
      setIsPreviewLoading(false);
      setPreviewTextContent(null);
      setPreviewError(null);
    }
  }, [previewFile, userToken]);

  // Check File Browser Go Daemon Reachability on Oracle VM 1
  useEffect(() => {
    if (viewMode === 'filebrowser') {
      setFileBrowserStatus('checking');
      fetch('/filebrowser/login', { method: 'GET' })
        .then(res => {
          if (res.ok) {
            setFileBrowserStatus('online');
          } else {
            setFileBrowserStatus('offline');
          }
        })
        .catch(() => setFileBrowserStatus('offline'));
    }
  }, [viewMode]);

  // Navigate between files in preview modal (Google Drive style)
  const handlePrevPreview = () => {
    if (!previewFile) return;
    const currIdx = filteredFiles.findIndex(f => f.id === previewFile.id);
    if (currIdx > 0) {
      setPreviewFile(filteredFiles[currIdx - 1]);
    }
  };

  const handleNextPreview = () => {
    if (!previewFile) return;
    const currIdx = filteredFiles.findIndex(f => f.id === previewFile.id);
    if (currIdx >= 0 && currIdx < filteredFiles.length - 1) {
      setPreviewFile(filteredFiles[currIdx + 1]);
    }
  };

  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesSearch = 
          file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.checksum.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || file.category === categoryFilter;
        
        let matchesTab = true;
        if (activeTab === 'starred') {
          matchesTab = starredIds.has(file.id);
        } else if (activeTab === 'recent') {
          const uploadTime = new Date(file.uploadedAt).getTime();
          const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
          matchesTab = uploadTime >= oneDayAgo;
        }

        return matchesSearch && matchesCategory && matchesTab;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const diff = new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
          return sortOrder === 'asc' ? -diff : diff;
        }
        if (sortBy === 'size') {
          return sortOrder === 'asc' ? a.size - b.size : b.size - a.size;
        }
        if (sortBy === 'name') {
          return sortOrder === 'asc' 
            ? a.originalName.localeCompare(b.originalName) 
            : b.originalName.localeCompare(a.originalName);
        }
        return 0;
      });
  }, [files, searchQuery, categoryFilter, activeTab, starredIds, sortBy, sortOrder]);

  const usedBytes = stats?.totalVaultBytes || files.reduce((acc, f) => acc + f.size, 0);
  const totalCapacityBytes = stats?.disk.totalBytes || (50 * 1024 * 1024 * 1024);
  const percentUsed = Math.min(100, Math.round((usedBytes / totalCapacityBytes) * 100)) || 11;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
      
      {/* 1. Header View Bar */}
      <div className={`p-3.5 sm:p-5 border-b shrink-0 flex items-center justify-between gap-3 flex-wrap transition-colors ${
        isLight ? 'bg-white/95 border-slate-200 shadow-xs' : 'bg-surface-container-low/40 border-outline/15'
      }`}>
        {/* Title + Container Badge */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
            isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-primary/10 border-primary/25 text-[#00dbe7]'
          }`}>
            <HardDrive className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-on-surface font-sans">
                Cloud Drive
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border shadow-xs ${
                isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                50 GB Cloud Storage
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5 hidden sm:block">
              Persistent cloud storage powered by File Browser &amp; Oracle Always Free VM
            </p>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          
          {/* Switcher: Drive View vs File Browser Web */}
          <div className={`flex rounded-lg p-0.5 border text-xs ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('drive')}
              className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
                viewMode === 'drive'
                  ? isLight
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300'
                    : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 shrink-0" />
              <span>Drive</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('filebrowser')}
              className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
                viewMode === 'filebrowser'
                  ? isLight
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300'
                    : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>File Browser</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={() => loadVaultData(true)}
            disabled={isRefreshing || isLoading}
            className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600 hover:border-sky-400'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin text-[#00dbe7]' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: FILE BROWSER (OPEN SOURCE filebrowser/filebrowser EMBED) */}
      {/* ========================================================================= */}
      {viewMode === 'filebrowser' ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono shrink-0 flex-wrap gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#18181c]/60 border-[#3a494b]/30 text-gray-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${fileBrowserStatus === 'online' ? 'bg-emerald-500 animate-pulse' : fileBrowserStatus === 'checking' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'}`} />
              <span className="font-semibold">File Browser (v2.63)</span>
              <span className="text-[10px] text-on-surface-variant hidden sm:inline">• Go Container on Oracle Always Free VM 1 (Port 8080)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('drive')}
                className={`h-7 px-2.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                  isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-white/10 text-[#00dbe7] border-[#00dbe7]/30'
                }`}
              >
                Use Native Cloud Drive
              </button>
              <a
                href="/filebrowser/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:underline flex items-center gap-1 font-bold text-xs"
              >
                <span>External Tab</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>

          {fileBrowserStatus === 'checking' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-500 mb-3" />
              <p className="text-xs font-mono text-on-surface-variant">Connecting to File Browser daemon on VM 1...</p>
            </div>
          ) : fileBrowserStatus === 'offline' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border shadow-sm ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
              }`}>
                <Server className="w-7 h-7 shrink-0" />
              </div>
              <h3 className="text-base font-bold text-on-surface mb-1">
                Remote File Browser Container Standby
              </h3>
              <p className="text-xs text-on-surface-variant font-mono leading-relaxed mb-4">
                The containerized Go File Browser service is configured on Oracle Always Free VM 1 (Port 8080).
                All persistent files, backups, and media are safely stored and directly manageable in our integrated <strong>Native Cloud Drive</strong>.
              </p>
              <div className="flex items-center gap-2.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => setViewMode('drive')}
                  className={`h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/50'
                  }`}
                >
                  Switch to Native Cloud Drive
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFileBrowserStatus('checking');
                    fetch('/filebrowser/login', { method: 'GET' })
                      .then(res => setFileBrowserStatus(res.ok ? 'online' : 'offline'))
                      .catch(() => setFileBrowserStatus('offline'));
                  }}
                  className={`h-9 px-3 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-white/10 text-on-surface border-white/10'
                  }`}
                >
                  Probe Connection Again
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src="/filebrowser/login"
              title="File Browser"
              className="w-full flex-1 border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups"
            />
          )}
        </div>
      ) : (
        /* VIEW MODE 2: SUTHARLABS NATIVE CLOUD DRIVE */
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5">
        
        {/* Error Alert Banner */}
        {error && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadVaultData()}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-mono font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Popular Drive Navigation & Standard + New Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* + New Button with Upload Trigger */}
          <div className="relative inline-block text-left shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`h-10 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md select-none ${
                isLight
                  ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sky-500/20'
                  : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border border-[#00dbe7]/50 hover:border-[#00dbe7] shadow-[#00dbe7]/10'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Upload</span>
            </button>
          </div>

          {/* Drive Navigation Tabs: My Drive | Recent | Starred | Storage */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('my-drive')}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                activeTab === 'my-drive'
                  ? isLight
                    ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-xs'
                    : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30 shadow-xs'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-100 border border-transparent'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-transparent'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 shrink-0" />
              <span>My Drive</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recent')}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                activeTab === 'recent'
                  ? isLight
                    ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-xs'
                    : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30 shadow-xs'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-100 border border-transparent'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-transparent'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Recent (24h)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('starred')}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                activeTab === 'starred'
                  ? isLight
                    ? 'bg-amber-50 text-amber-700 border border-amber-300 shadow-xs'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-100 border border-transparent'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-transparent'
              }`}
            >
              <Star className="w-3.5 h-3.5 shrink-0" />
              <span>Starred ({starredIds.size})</span>
            </button>
          </div>

          {/* Storage Capacity Pill */}
          <div className={`p-2 px-3 rounded-xl border text-xs font-mono flex items-center gap-2.5 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-surface-container-low/40 border-outline/15 text-gray-300'
          }`}>
            <HardDrive className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatBytes(usedBytes)}</span>
                <span className="text-[10px] text-on-surface-variant">of 50 GB used</span>
              </div>
              <div className="w-28 h-1 bg-surface-container-highest rounded-full overflow-hidden mt-0.5">
                <div 
                  className={`h-full transition-all duration-300 ${percentUsed > 85 ? 'bg-rose-500' : 'bg-sky-500'}`}
                  style={{ width: `${Math.max(5, percentUsed)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Selected File Upload Staging Banner */}
        {selectedFile && (
          <div className={`p-4 rounded-xl border transition-all animate-in fade-in duration-150 ${
            isLight ? 'bg-sky-50/70 border-sky-200' : 'bg-[#00dbe7]/5 border-[#00dbe7]/30'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  isLight ? 'bg-white border-sky-300 text-sky-600' : 'bg-[#00dbe7]/15 border-[#00dbe7]/40 text-[#00dbe7]'
                }`}>
                  <Upload className="w-4 h-4 shrink-0" />
                </div>
                <div>
                  <div className="text-sm font-bold font-mono text-on-surface truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                    {formatBytes(selectedFile.size)} • Destination: <span className="text-sky-500 font-bold">{selectedCategory}</span>
                  </div>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-[#3a494b]/40 text-[#e5e1e4]'
                  }`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                  className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border shadow-sm flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="w-full space-y-1 mt-3">
                <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
                  <span>Uploading files to Cloud Drive...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setSelectedFile(e.target.files[0]);
            }
          }}
        />

        {/* Drag & Drop Hero Box (Active when dragging or when files empty) */}
        {files.length === 0 && !isLoading && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
              isDragging
                ? 'border-sky-500 bg-sky-500/5'
                : isLight
                  ? 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                  : 'border-[#3a494b]/40 hover:border-[#3a494b]/80 bg-[#121215]/40'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-primary/10 border-primary/25 text-[#00dbe7]'
              }`}>
                <FolderPlus className="w-6 h-6 shrink-0" />
              </div>
              <h3 className="text-base font-bold text-on-surface">Your Cloud Drive is empty</h3>
              <p className="text-xs text-on-surface-variant font-mono max-w-sm">
                Drag and drop files here, or click to upload documents, images, code backups, and archives.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`mt-2 h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border shadow-sm ${
                  isLight
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                    : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/50'
                }`}
              >
                Select Files to Upload
              </button>
            </div>
          </div>
        )}

        {/* Search Bar & Filter Toolbar */}
        <div className={`p-3 sm:p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 flex-wrap ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-surface-container-low/40 border-outline/15'
        }`}>
          {/* Search Box: "Search in Drive" */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
            <input
              type="text"
              placeholder="Search in Drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-8 pl-9 pr-3 rounded-lg text-xs font-mono border transition-colors outline-hidden ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                  : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4] placeholder:text-white/40 focus:border-[#00dbe7]/60'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`h-8 px-2.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#201f21] border-[#3a494b]/40 text-[#e5e1e4]'
              }`}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`h-8 px-2.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#201f21] border-[#3a494b]/40 text-[#e5e1e4]'
              }`}
            >
              <option value="date">Date Modified</option>
              <option value="size">File Size</option>
              <option value="name">Name</option>
            </select>

            {/* Layout Toggle: List vs Grid */}
            <div className={`flex rounded-lg p-0.5 border text-xs ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
            }`}>
              <button
                type="button"
                onClick={() => setLayoutMode('list')}
                title="List View"
                className={`p-1 rounded cursor-pointer transition-all ${
                  layoutMode === 'list'
                    ? isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-[#00dbe7]/20 text-[#00dbe7]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                title="Grid View"
                className={`p-1 rounded cursor-pointer transition-all ${
                  layoutMode === 'grid'
                    ? isLight ? 'bg-white text-slate-900 shadow-xs' : 'bg-[#00dbe7]/20 text-[#00dbe7]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Grid className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FILES DISPLAY: LIST VIEW VS GRID VIEW */}
        {/* ========================================================================= */}
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-on-surface-variant flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-500 shrink-0" />
            <span>Loading files from Cloud Drive...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-on-surface-variant flex flex-col items-center gap-2">
            <Search className="w-8 h-8 text-on-surface-variant/40 shrink-0" />
            <span className="font-semibold text-on-surface">No files match your filter</span>
            <span>Try searching with a different term or clearing your category filter.</span>
          </div>
        ) : layoutMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  isLight 
                    ? 'bg-white border-slate-200 shadow-xs hover:shadow-md hover:border-sky-300' 
                    : 'bg-surface-container-low/40 border-outline/15 hover:border-[#00dbe7]/40 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div 
                    onClick={() => setPreviewFile(file)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                  >
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                    }`}>
                      {getFileIcon(file.mimeType, file.originalName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-on-surface truncate font-sans group-hover:text-sky-500 transition-colors" title={file.originalName}>
                        {file.originalName}
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        {formatBytes(file.size)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => toggleStar(file.id, e)}
                    className="p-1 rounded hover:bg-white/10 cursor-pointer transition-colors shrink-0"
                  >
                    <Star className={`w-3.5 h-3.5 shrink-0 ${starredIds.has(file.id) ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant pt-2 border-t border-outline/10">
                  <span className="truncate">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      title="Preview File"
                      className="p-1 rounded hover:bg-white/10 cursor-pointer text-sky-500"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => shareFileLink(file)}
                      title="Share link"
                      className="p-1 rounded hover:bg-white/10 cursor-pointer"
                    >
                      {shareFeedback === file.id ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Share2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                    <a
                      href={getVaultDownloadUrl(file.id, userToken)}
                      download={file.originalName}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download"
                      className="p-1 rounded hover:bg-white/10 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0 text-sky-500" />
                    </a>
                    <button
                      type="button"
                      onClick={() => promptDeleteFile(file)}
                      title="Delete"
                      className="p-1 rounded hover:bg-white/10 cursor-pointer text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW (Table on tablet/desktop, touch cards on mobile) */
          <div className={`rounded-xl border overflow-hidden transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-surface-container-low/40 border-outline/15'
          }`}>
            {/* Mobile Touch Cards View (sm:hidden) */}
            <div className="sm:hidden divide-y divide-outline/10">
              {filteredFiles.map((file) => (
                <div key={file.id} className="p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div 
                      onClick={() => setPreviewFile(file)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                    >
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'
                      }`}>
                        {getFileIcon(file.mimeType, file.originalName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-on-surface truncate font-sans group-hover:text-sky-500 transition-colors">
                          {file.originalName}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-mono mt-0.5 flex items-center gap-2">
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span>{file.category || 'General'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleStar(file.id, e)}
                      className="p-1 rounded cursor-pointer shrink-0"
                    >
                      <Star className={`w-4 h-4 shrink-0 ${starredIds.has(file.id) ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant/40'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant pt-1 border-t border-outline/10">
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className={`h-7 px-2 rounded text-[10px] font-mono border flex items-center gap-1 cursor-pointer ${
                          isLight ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        }`}
                      >
                        <Eye className="w-3 h-3 shrink-0" />
                        <span>Preview</span>
                      </button>
                      <a
                        href={getVaultDownloadUrl(file.id, userToken)}
                        download={file.originalName}
                        className={`h-7 px-2 rounded text-[10px] font-mono border flex items-center gap-1 cursor-pointer ${
                          isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/5 text-on-surface border-white/10'
                        }`}
                      >
                        <Download className="w-3 h-3 shrink-0" />
                      </a>
                      <button
                        type="button"
                        onClick={() => shareFileLink(file)}
                        className={`h-7 w-7 rounded border flex items-center justify-center cursor-pointer ${
                          isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/5 text-on-surface border-white/10'
                        }`}
                      >
                        {shareFeedback === file.id ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Share2 className="w-3 h-3 shrink-0" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDeleteFile(file)}
                        className="h-7 w-7 rounded border flex items-center justify-center bg-rose-500/10 border-rose-500/30 text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / Tablet Table View (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-outline/15'
                  }`}>
                    <th className="py-3 px-3 sm:px-4">Name</th>
                    <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Category</th>
                    <th className="py-3 px-3 sm:px-4 text-right">Size</th>
                    <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Checksum</th>
                    <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Date Modified</th>
                    <th className="py-3 px-3 sm:px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {filteredFiles.map((file) => (
                    <tr 
                      key={file.id} 
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Name */}
                      <td className="py-3 px-3 sm:px-4 font-semibold text-on-surface">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => toggleStar(file.id, e)}
                            className="p-0.5 rounded cursor-pointer"
                          >
                            <Star className={`w-3.5 h-3.5 shrink-0 ${starredIds.has(file.id) ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant/40 hover:text-amber-400'}`} />
                          </button>
                          <div 
                            onClick={() => setPreviewFile(file)}
                            className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                              isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'
                            }`}
                          >
                            {getFileIcon(file.mimeType, file.originalName)}
                          </div>
                          <span 
                            onClick={() => setPreviewFile(file)}
                            className="truncate max-w-[180px] sm:max-w-xs cursor-pointer hover:text-sky-500 transition-colors" 
                            title={file.originalName}
                          >
                            {file.originalName}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white/5 text-gray-300 border-white/10'
                        }`}>
                          {file.category || 'General'}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3 sm:px-4 text-right font-mono text-on-surface-variant font-medium">
                        {formatBytes(file.size)}
                      </td>

                      {/* Checksum */}
                      <td className="py-3 px-3 sm:px-4 text-on-surface-variant hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <code className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                            isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-on-surface'
                          }`}>
                            {file.checksum.slice(0, 8)}...{file.checksum.slice(-4)}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(file.checksum, file.id)}
                            title="Copy checksum"
                            className="p-1 rounded hover:bg-white/10 cursor-pointer"
                          >
                            {copiedKey === file.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 sm:px-4 text-on-surface-variant text-[11px] hidden sm:table-cell">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            title="Preview File"
                            className={`h-7 px-2 rounded text-[10px] font-mono border transition-all flex items-center gap-1 cursor-pointer select-none shadow-xs ${
                              isLight
                                ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300'
                                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/40'
                            }`}
                          >
                            <Eye className="w-3 h-3 shrink-0" />
                            <span className="hidden sm:inline">Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => shareFileLink(file)}
                            title="Share Link"
                            className={`h-7 px-2 rounded text-[10px] font-mono border transition-all flex items-center gap-1 cursor-pointer select-none shadow-xs ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                            }`}
                          >
                            {shareFeedback === file.id ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Share2 className="w-3 h-3 shrink-0" />}
                            <span className="hidden sm:inline">Share</span>
                          </button>

                          <a
                            href={getVaultDownloadUrl(file.id, userToken)}
                            download={file.originalName}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download"
                            className={`h-7 px-2 rounded text-[10px] font-mono border transition-all flex items-center gap-1 cursor-pointer select-none shadow-xs ${
                              isLight
                                ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/40'
                            }`}
                          >
                            <Download className="w-3 h-3 shrink-0" />
                            <span className="hidden sm:inline">Download</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => promptDeleteFile(file)}
                            title="Delete"
                            className={`h-7 w-7 rounded flex items-center justify-center border transition-all cursor-pointer ${
                              isLight
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            <Trash2 className="w-3 h-3 shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
      )}

      {/* Floating Action Button (FAB) for Mobile Quick Upload */}
      <div className="sm:hidden fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="New Upload"
          className="w-14 h-14 rounded-full bg-sky-500 text-white shadow-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7 shrink-0" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* GOOGLE DRIVE / DROPBOX STANDARD IN-BROWSER FILE PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewFile(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setPreviewFile(null); }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-5xl h-[90vh] max-h-[850px] rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-all animate-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121215] border-[#3a494b]/60 text-[#e5e1e4]'
            }`}
          >
            {/* Top Single-tone Accent Bar */}
            <div className="h-1 w-full bg-[#00dbe7] shrink-0" />

            {/* Modal Header */}
            <div className={`p-3.5 sm:p-4 border-b shrink-0 flex items-center justify-between gap-3 border-inherit ${
              isLight ? 'bg-slate-50/90' : 'bg-[#18181c]/70'
            }`}>
              {/* File Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${
                  isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  {getFileIcon(previewFile.mimeType, previewFile.originalName)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm font-sans truncate text-on-surface" title={previewFile.originalName}>
                    {previewFile.originalName}
                  </div>
                  <div className="text-[10px] text-on-surface-variant font-mono mt-0.5 flex items-center gap-2">
                    <span className="font-semibold text-sky-500">{formatBytes(previewFile.size)}</span>
                    <span>•</span>
                    <span className="uppercase">{previewFile.category || 'General'}</span>
                    <span>•</span>
                    <span>{new Date(previewFile.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Navigation & Action Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Previous / Next buttons */}
                <div className="flex items-center rounded-lg border border-inherit p-0.5">
                  <button
                    type="button"
                    onClick={handlePrevPreview}
                    disabled={filteredFiles.findIndex(f => f.id === previewFile.id) <= 0}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Previous file"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                  </button>
                  <span className="text-[10px] font-mono px-1.5 text-on-surface-variant">
                    {filteredFiles.findIndex(f => f.id === previewFile.id) + 1} / {filteredFiles.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPreview}
                    disabled={filteredFiles.findIndex(f => f.id === previewFile.id) >= filteredFiles.length - 1}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Next file"
                  >
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>

                {/* Share Link */}
                <button
                  type="button"
                  onClick={() => shareFileLink(previewFile)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                  title="Copy direct share link"
                >
                  {shareFeedback === previewFile.id ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Share2 className="w-3.5 h-3.5 shrink-0" />}
                  <span className="hidden sm:inline">Share</span>
                </button>

                {/* Download Button */}
                <a
                  href={getVaultDownloadUrl(previewFile.id, userToken)}
                  download={previewFile.originalName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isLight ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/50'
                  }`}
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-white/10 cursor-pointer transition-colors"
                  title="Close preview (Esc)"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className={`flex-1 overflow-auto flex items-center justify-center p-3 sm:p-5 relative ${
              isLight ? 'bg-slate-100/70' : 'bg-black/40'
            }`}>
              {/* IMAGE PREVIEW */}
              {getPreviewType(previewFile.mimeType, previewFile.originalName) === 'image' && (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={getVaultDownloadUrl(previewFile.id, userToken)}
                    alt={previewFile.originalName}
                    className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl border border-outline/10 select-none animate-in fade-in zoom-in-95 duration-200"
                  />
                </div>
              )}

              {/* PDF PREVIEW */}
              {getPreviewType(previewFile.mimeType, previewFile.originalName) === 'pdf' && (
                <div className="w-full h-full rounded-xl overflow-hidden shadow-xl border border-outline/15 bg-white">
                  <iframe
                    src={getVaultDownloadUrl(previewFile.id, userToken)}
                    title={previewFile.originalName}
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* AUDIO PREVIEW */}
              {getPreviewType(previewFile.mimeType, previewFile.originalName) === 'audio' && (
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-md w-full">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 border shadow-lg ${
                    isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-cyan-500/10 border-cyan-500/30 text-[#00dbe7]'
                  }`}>
                    <Music className="w-10 h-10 shrink-0" />
                  </div>
                  <h4 className="text-sm font-bold text-on-surface font-sans mb-1 truncate max-w-full">
                    {previewFile.originalName}
                  </h4>
                  <p className="text-xs text-on-surface-variant font-mono mb-6">
                    {formatBytes(previewFile.size)} • High Fidelity Audio
                  </p>
                  <audio
                    controls
                    autoPlay
                    src={getVaultDownloadUrl(previewFile.id, userToken)}
                    className="w-full shadow-md rounded-lg"
                  />
                </div>
              )}

              {/* VIDEO PREVIEW */}
              {getPreviewType(previewFile.mimeType, previewFile.originalName) === 'video' && (
                <div className="w-full h-full flex items-center justify-center">
                  <video
                    controls
                    autoPlay
                    src={getVaultDownloadUrl(previewFile.id, userToken)}
                    className="max-w-full max-h-[72vh] rounded-xl shadow-2xl border border-outline/15"
                  />
                </div>
              )}

              {/* TEXT / CODE PREVIEW */}
              {getPreviewType(previewFile.mimeType, previewFile.originalName) === 'text' && (
                <div className={`w-full h-full rounded-xl border flex flex-col overflow-hidden shadow-xl ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#151518] border-[#3a494b]/50 text-[#e5e1e4]'
                }`}>
                  <div className={`p-2.5 px-4 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1b1a1f] border-outline/10'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="font-bold text-on-surface">{previewFile.originalName}</span>
                      {previewTextContent && (
                        <span className="text-[10px] text-on-surface-variant">
                          ({previewTextContent.split('\n').length} lines, {(previewTextContent.length / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                    {previewTextContent && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(previewTextContent);
                          setPreviewCopied(true);
                          setTimeout(() => setPreviewCopied(false), 2000);
                        }}
                        className={`h-6 px-2 rounded text-[10px] font-mono border transition-all flex items-center gap-1 cursor-pointer ${
                          isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-white/5 text-on-surface border-white/10'
                        }`}
                      >
                        {previewCopied ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                        <span>{previewCopied ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed select-text">
                    {isPreviewLoading ? (
                      <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-sky-500 shrink-0" />
                        <span>Loading file contents...</span>
                      </div>
                    ) : previewError ? (
                      <div className="p-6 text-center text-rose-400">
                        <p>{previewError}</p>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap font-mono text-[11px] sm:text-xs">
                        <code>{previewTextContent}</code>
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* BINARY / ARCHIVE / UNRENDERABLE FALLBACK */}
              {getPreviewType(previewFile.mimeType, previewFile.originalName) === 'binary' && (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md w-full">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border shadow-xl ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-cyan-400'
                  }`}>
                    <FileArchive className="w-10 h-10 shrink-0" />
                  </div>
                  <h4 className="text-base font-bold text-on-surface font-sans mb-1 truncate max-w-full">
                    {previewFile.originalName}
                  </h4>
                  <p className="text-xs text-on-surface-variant font-mono mb-1">
                    Format: {previewFile.mimeType || 'Binary payload'} • Size: {formatBytes(previewFile.size)}
                  </p>
                  <p className="text-xs text-on-surface-variant/80 font-mono mb-6 leading-relaxed">
                    This file format is binary or compressed and cannot be previewed directly in the web browser. Download the file to inspect with local tools.
                  </p>
                  <a
                    href={getVaultDownloadUrl(previewFile.id, userToken)}
                    download={previewFile.originalName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`h-10 px-5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                      isLight ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/50'
                    }`}
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Download File ({formatBytes(previewFile.size)})</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer Checksum Pill */}
            <div className={`px-4 py-2 border-t flex items-center justify-between text-[11px] font-mono shrink-0 border-inherit ${
              isLight ? 'bg-slate-50 text-slate-600' : 'bg-[#18181c]/70 text-gray-400'
            }`}>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-on-surface-variant">Checksum SHA256:</span>
                <code className="text-on-surface font-bold truncate max-w-[200px] sm:max-w-none">{previewFile.checksum}</code>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(previewFile.checksum, 'checksum_preview')}
                className="hover:text-on-surface cursor-pointer flex items-center gap-1 shrink-0"
              >
                {copiedKey === 'checksum_preview' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="hidden sm:inline">{copiedKey === 'checksum_preview' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for Mobile Quick Upload */}
      <div className="sm:hidden fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="New Upload"
          className="w-14 h-14 rounded-full bg-sky-500 text-white shadow-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7 shrink-0" />
        </button>
      </div>

      {/* Confirmation & Alert Modal */}
      {modalConfig && (
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          subtext={modalConfig.subtext}
          confirmLabel={modalConfig.confirmLabel}
          cancelLabel={modalConfig.cancelLabel}
          variant={modalConfig.variant}
          isAlert={modalConfig.isAlert}
          theme={effectiveTheme}
        />
      )}

    </div>
  );
};

export default StorageVaultView;
