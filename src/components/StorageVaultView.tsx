import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  HardDrive, 
  Upload, 
  Download, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
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
  FolderLock,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  Lock
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
  'Credentials',
  'Backups',
  'Database Dump',
  'Config & Keys',
  'Sensitive Docs'
];

export const StorageVaultView: React.FC<StorageVaultViewProps> = ({
  onAddLog,
  userToken,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  // Data state
  const [stats, setStats] = useState<VaultStatsResponse | null>(null);
  const [files, setFiles] = useState<VaultFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
        addLog('STORAGE', 'Vault telemetry and file directory updated successfully.', 'SUCCESS');
      }
    } catch (err: any) {
      console.error('Failed to load vault data:', err);
      setError(err.message || 'Unable to connect to Oracle VM Storage Vault.');
      addLog('STORAGE', `Failed to query Oracle Storage Vault: ${err.message}`, 'ERROR');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userToken, addLog]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
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
      addLog('STORAGE', `Starting upload for "${selectedFile.name}" (${formatBytes(selectedFile.size)})...`, 'INFO');
      const uploaded = await uploadVaultFile(
        selectedFile,
        selectedCategory,
        userToken,
        (percent) => setUploadProgress(percent)
      );
      
      addLog('STORAGE', `Successfully stored "${uploaded.originalName}" in Oracle VM vault. Checksum: ${uploaded.checksum.slice(0, 12)}...`, 'SUCCESS');
      setSelectedFile(null);
      setUploadProgress(0);
      await loadVaultData(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      setModalConfig({
        isOpen: true,
        title: 'Upload Failed',
        message: err.message || 'Failed to upload file to Oracle VM Vault.',
        subtext: 'Verify the VM storage daemon is running on port 80 and network is healthy.',
        variant: 'danger',
        isAlert: true,
        confirmLabel: 'Dismiss',
        onConfirm: () => setModalConfig(null)
      });
      addLog('STORAGE', `Upload failed: ${err.message}`, 'ERROR');
    } finally {
      setIsUploading(false);
    }
  };

  const promptDeleteFile = (file: VaultFileItem) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Private File',
      message: `Permanently delete "${file.originalName}" from Oracle Cloud Storage Vault?`,
      subtext: `File size: ${formatBytes(file.size)}. This action unlinks physical disk blocks on sutharlabs-db-store and cannot be undone.`,
      confirmLabel: 'Confirm & Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        setModalConfig(null);
        try {
          addLog('STORAGE', `Deleting file "${file.originalName}"...`, 'INFO');
          await deleteVaultFile(file.id, userToken);
          addLog('STORAGE', `File "${file.originalName}" permanently deleted from vault.`, 'SUCCESS');
          await loadVaultData(true);
        } catch (err: any) {
          console.error('Delete error:', err);
          setModalConfig({
            isOpen: true,
            title: 'Delete Failed',
            message: err.message || 'Could not delete file from vault.',
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
      return <FileArchive className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (['sql', 'dump', 'db', 'sqlite'].includes(ext)) {
      return <Database className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (['key', 'pem', 'crt', 'env'].includes(ext) || ext.includes('key')) {
      return <Key className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext) || mimeType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (['pdf', 'txt', 'md', 'json', 'csv', 'log'].includes(ext)) {
      return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesSearch = 
          file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.checksum.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || file.category === categoryFilter;
        return matchesSearch && matchesCategory;
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
  }, [files, searchQuery, categoryFilter, sortBy, sortOrder]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      
      {/* 1. Header Toolbar */}
      <div className={`p-4 sm:p-5 border-b shrink-0 flex items-center justify-between gap-4 flex-wrap transition-colors ${
        isLight ? 'bg-white/90 border-slate-200' : 'bg-surface-container-low/40 border-outline/15'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <HardDrive className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                Oracle VM Private Storage Vault
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                137.23.61.191 (Live)
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Secure persistent storage hosted on sutharlabs-db-store (AMD E2.1.Micro / 50 GB SSD)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <button
            type="button"
            onClick={() => loadVaultData(true)}
            disabled={isRefreshing || isLoading}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:text-sky-600 hover:border-sky-400'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border border-[#3a494b]/40 hover:text-[#00dbe7] hover:border-[#00dbe7]/50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin text-[#00dbe7]' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Vault'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        
        {/* Error Alert Banner */}
        {error && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadVaultData()}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-mono font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Telemetry Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Node State */}
          <div className={`p-4 rounded-xl border transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-surface-container-low/40 border-outline/15'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant mb-2">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Target Node
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <div className="text-base font-bold font-mono text-on-surface truncate">
              sutharlabs-db-store
            </div>
            <div className="text-[11px] font-mono text-on-surface-variant mt-1 flex items-center gap-1.5">
              <span>Port: 80 (HTTP)</span>
              <span>•</span>
              <span className="text-emerald-400">Docker Daemon</span>
            </div>
          </div>

          {/* Card 2: Disk Free */}
          <div className={`p-4 rounded-xl border transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-surface-container-low/40 border-outline/15'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant mb-2">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Free Volume Space
              </span>
              <span className="text-emerald-400 font-bold">
                {stats?.disk.percentUsed ? `${100 - parseInt(stats.disk.percentUsed, 10)}% Free` : '--'}
              </span>
            </div>
            <div className="text-base font-bold font-mono text-on-surface">
              {stats?.disk.availBytes ? formatBytes(stats.disk.availBytes) : '44.0 GB'}
            </div>
            <div className="text-[11px] font-mono text-on-surface-variant mt-1">
              Total Capacity: {stats?.disk.totalBytes ? formatBytes(stats.disk.totalBytes) : '50.0 GB'}
            </div>
          </div>

          {/* Card 3: Vault Items */}
          <div className={`p-4 rounded-xl border transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-surface-container-low/40 border-outline/15'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                Vault Records
              </span>
              <span className="text-purple-400 font-bold font-mono">
                {files.length} Files
              </span>
            </div>
            <div className="text-base font-bold font-mono text-on-surface">
              {stats?.totalVaultBytes ? formatBytes(stats.totalVaultBytes) : formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
            </div>
            <div className="text-[11px] font-mono text-on-surface-variant mt-1">
              Encrypted at rest on SSD
            </div>
          </div>

          {/* Card 4: Memory Footprint */}
          <div className={`p-4 rounded-xl border transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-surface-container-low/40 border-outline/15'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Memory Safety
              </span>
              <span className="text-cyan-400 font-bold font-mono">
                &lt; 60 MB RAM
              </span>
            </div>
            <div className="text-base font-bold font-mono text-on-surface">
              0% DB Overhead
            </div>
            <div className="text-[11px] font-mono text-on-surface-variant mt-1">
              Zero contention with Postgres 16
            </div>
          </div>

        </div>

        {/* Upload Zone */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-surface-container-low/40 border-outline/15'
        }`}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4 text-[#00dbe7] shrink-0" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Upload Private Artifact</h3>
                <p className="text-[11px] text-on-surface-variant font-mono">
                  Files are streamed directly to persistent storage in Oracle Mumbai
                </p>
              </div>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-on-surface-variant">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`h-8 px-2.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-[#201f21] border-[#3a494b]/40 text-[#e5e1e4]'
                }`}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? 'border-[#00dbe7] bg-[#00dbe7]/5'
                : isLight
                  ? 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                  : 'border-[#3a494b]/40 hover:border-[#3a494b]/80 bg-[#121215]/40'
            }`}
          >
            <input
              type="file"
              id="vault-file-input"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-[#00dbe7] shrink-0" />
                </div>
                <div>
                  <div className="text-sm font-bold font-mono text-on-surface">{selectedFile.name}</div>
                  <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                    {formatBytes(selectedFile.size)} • Ready to upload to category: <span className="text-[#00dbe7] font-semibold">{selectedCategory}</span>
                  </div>
                </div>

                {isUploading && (
                  <div className="w-full max-w-xs space-y-1 mt-2">
                    <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00dbe7] transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                    className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        : 'bg-white/5 hover:bg-white/10 text-on-surface'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border border-[#00dbe7]/50 hover:border-[#00dbe7] transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>{isUploading ? 'Streaming to VM...' : 'Store in Vault'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <label htmlFor="vault-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-1">
                  <FolderLock className="w-5 h-5 text-[#00dbe7] shrink-0" />
                </div>
                <div className="text-sm font-semibold text-on-surface">
                  Drop sensitive files here, or <span className="text-[#00dbe7] underline">browse files</span>
                </div>
                <div className="text-[11px] text-on-surface-variant font-mono">
                  Accepts .pem, .key, .sql, .dump, .zip, .tar.gz, .env, and sensitive records up to 2 GB
                </div>
              </label>
            )}
          </div>
        </div>

        {/* File Directory Header & Filters */}
        <div className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 flex-wrap ${
          isLight ? 'bg-white border-slate-200' : 'bg-surface-container-low/40 border-outline/15'
        }`}>
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
            <input
              type="text"
              placeholder="Search filename or SHA-256..."
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
            <div className="flex items-center gap-1.5 text-xs font-mono text-on-surface-variant">
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`h-8 px-2.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-[#201f21] border-[#3a494b]/40 text-[#e5e1e4]'
                }`}
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-on-surface-variant">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`h-8 px-2.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-[#201f21] border-[#3a494b]/40 text-[#e5e1e4]'
                }`}
              >
                <option value="date">Upload Date</option>
                <option value="size">File Size</option>
                <option value="name">File Name</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sorting: ${sortOrder.toUpperCase()}`}
              className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#201f21] border-[#3a494b]/40 text-on-surface hover:border-[#00dbe7]/40'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Files Table / List */}
        <div className={`rounded-xl border overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-surface-container-low/40 border-outline/15'
        }`}>
          {isLoading ? (
            <div className="p-12 text-center text-xs font-mono text-on-surface-variant flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#00dbe7] shrink-0" />
              <span>Querying Oracle Storage Vault catalog...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-on-surface-variant flex flex-col items-center gap-2">
              <FolderLock className="w-8 h-8 text-on-surface-variant/40 shrink-0" />
              <span className="font-semibold text-on-surface">No vault files found</span>
              <span>{searchQuery ? 'Try matching another query or clearing your filter.' : 'Upload your first private archive or credential using the form above.'}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-outline/15'
                  }`}>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Size</th>
                    <th className="py-3 px-4">SHA-256 Checksum</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-center">Actions</th>
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
                      <td className="py-3 px-4 font-semibold text-on-surface">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                            isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'
                          }`}>
                            {getFileIcon(file.mimeType, file.originalName)}
                          </div>
                          <span className="truncate max-w-[240px] sm:max-w-xs" title={file.originalName}>
                            {file.originalName}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          file.category === 'Credentials' || file.category === 'Config & Keys'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : file.category === 'Backups' || file.category === 'Database Dump'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        }`}>
                          {file.category || 'General'}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 text-right font-mono text-on-surface-variant font-medium">
                        {formatBytes(file.size)}
                      </td>

                      {/* Checksum */}
                      <td className="py-3 px-4 text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <code className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                            isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-on-surface'
                          }`}>
                            {file.checksum.slice(0, 10)}...{file.checksum.slice(-6)}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(file.checksum, file.id)}
                            title="Copy full SHA-256 Checksum"
                            className="p-1 rounded hover:bg-white/10 text-on-surface-variant hover:text-on-surface cursor-pointer"
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
                      <td className="py-3 px-4 text-on-surface-variant text-[11px]">
                        {new Date(file.uploadedAt).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={getVaultDownloadUrl(file.id, userToken)}
                            download={file.originalName}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download file"
                            className={`h-7 px-2.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1 cursor-pointer select-none shadow-sm ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                            }`}
                          >
                            <Download className="w-3 h-3 shrink-0" />
                            <span className="hidden sm:inline">Download</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => promptDeleteFile(file)}
                            title="Delete file"
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
          )}
        </div>

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
          theme={theme}
        />
      )}

    </div>
  );
};

export default StorageVaultView;
