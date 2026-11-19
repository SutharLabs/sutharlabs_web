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
  FileCheck,
  Folder,
  FolderInput,
  Pencil
} from 'lucide-react';
import { VaultFileItem, VaultStatsResponse, TerminalLog } from '../types';
import { 
  fetchVaultStats, 
  fetchVaultFiles, 
  uploadVaultFile, 
  deleteVaultFile, 
  getVaultDownloadUrl, 
  formatBytes,
  fetchVaultFolders,
  createVaultFolder,
  deleteVaultFolder,
  renameVaultFolder,
  renameVaultFile,
  updateVaultFile
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

/**
 * Extracts and deduplicates all ancestor and intermediate folder paths
 * e.g. ["Documents/Projects/2026"] -> ["Documents", "Documents/Projects", "Documents/Projects/2026"]
 */
const extractAllFolderPaths = (paths: string[]): string[] => {
  const set = new Set<string>();
  paths.forEach(p => {
    if (!p || typeof p !== 'string') return;
    const clean = p.trim().replace(/^\/+|\/+$/g, '');
    if (!clean) return;
    const segments = clean.split('/').filter(Boolean);
    let current = '';
    for (const seg of segments) {
      current = current ? `${current}/${seg}` : seg;
      set.add(current);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const getParentFolder = (folderPath: string | null): string | null => {
  if (!folderPath || !folderPath.includes('/')) return null;
  return folderPath.substring(0, folderPath.lastIndexOf('/'));
};

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

  // Folder Organisation state
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  // Direct child folders at current level
  const currentLevelFolders = useMemo(() => {
    if (currentFolder === null) {
      return folders.filter(f => !f.includes('/'));
    }
    const prefix = currentFolder + '/';
    return folders.filter(f => f.startsWith(prefix) && !f.slice(prefix.length).includes('/'));
  }, [folders, currentFolder]);
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [moveModalFiles, setMoveModalFiles] = useState<VaultFileItem[]>([]);
  const [targetMoveFolder, setTargetMoveFolder] = useState<string>('');
  const [isMovingFile, setIsMovingFile] = useState<boolean>(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [fileBrowserIframeKey, setFileBrowserIframeKey] = useState<number>(0);
  const [isLoggingInFb, setIsLoggingInFb] = useState<boolean>(false);

  // Rename state
  const [editingFile, setEditingFile] = useState<VaultFileItem | null>(null);
  const [editingFileName, setEditingFileName] = useState<string>('');
  const [isRenamingFile, setIsRenamingFile] = useState<boolean>(false);

  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>('');
  const [isRenamingFolder, setIsRenamingFolder] = useState<boolean>(false);

  // Drag-and-drop move state
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      const [statsData, filesData, foldersData] = await Promise.all([
        fetchVaultStats(userToken),
        fetchVaultFiles(userToken),
        fetchVaultFolders(userToken).catch(() => [])
      ]);
      setStats(statsData);
      setFiles(filesData);

      const rawPaths = [...(foldersData || [])];
      filesData.forEach(f => {
        if (f.folder && f.folder.trim()) {
          rawPaths.push(f.folder.trim());
        }
      });
      setFolders(extractAllFolderPaths(rawPaths));

      if (isRefresh) {
        addLog('DRIVE', 'Drive files, folders, and storage capacity synchronized.', 'SUCCESS');
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

  const handleCreateFolder = async () => {
    const raw = newFolderName.trim().replace(/[/\\:*?"<>|]/g, '');
    if (!raw) return;
    const fullPath = currentFolder ? `${currentFolder}/${raw}` : raw;
    setIsCreatingFolder(true);
    try {
      await createVaultFolder(fullPath, userToken);
      setFolders(prev => extractAllFolderPaths([...prev, fullPath]));
      addLog('DRIVE', `Created folder "${fullPath}".`, 'SUCCESS');
      setNewFolderName('');
      setShowNewFolderModal(false);
    } catch (err: any) {
      console.error('Failed to create folder:', err);
      setModalConfig({
        isOpen: true,
        title: 'Folder Creation Failed',
        message: err.message || 'Could not create folder in Cloud Drive.',
        variant: 'danger',
        isAlert: true,
        confirmLabel: 'Dismiss',
        onConfirm: () => setModalConfig(null)
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const promptDeleteFolder = (folderName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const affectedFiles = files.filter(f => f.folder === folderName || f.folder?.startsWith(folderName + '/'));
    const subCount = folders.filter(f => f.startsWith(folderName + '/')).length;
    const parent = getParentFolder(folderName);
    const baseName = folderName.split('/').pop() || folderName;

    setModalConfig({
      isOpen: true,
      title: 'Delete Folder',
      message: `Delete folder "${baseName}"?`,
      subtext: (affectedFiles.length > 0 || subCount > 0)
        ? `Contains ${affectedFiles.length} file(s) and ${subCount} subfolder(s). Files will be preserved in ${parent ? `"${parent}"` : 'My Drive Root'}.` 
        : 'This folder is empty.',
      confirmLabel: 'Delete Folder',
      cancelLabel: 'Cancel',
      variant: 'warning',
      onConfirm: async () => {
        setModalConfig(null);
        try {
          await deleteVaultFolder(folderName, userToken);
          setFolders(prev => prev.filter(f => f !== folderName && !f.startsWith(folderName + '/')));
          if (currentFolder === folderName || currentFolder?.startsWith(folderName + '/')) {
            setCurrentFolder(parent);
          }
          await loadVaultData(true);
          addLog('DRIVE', `Deleted folder "${folderName}".`, 'SUCCESS');
        } catch (err: any) {
          console.error('Failed to delete folder:', err);
        }
      }
    });
  };

  const startRenameFile = (file: VaultFileItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingFile(file);
    setEditingFileName(file.originalName);
  };

  const handleRenameFile = async () => {
    if (!editingFile) return;
    const trimmed = editingFileName.trim();
    if (!trimmed || trimmed === editingFile.originalName) {
      setEditingFile(null);
      return;
    }
    setIsRenamingFile(true);
    try {
      const updated = await renameVaultFile(editingFile.id, trimmed, userToken);
      setFiles(prev => prev.map(f => f.id === updated.id ? updated : f));
      if (previewFile?.id === updated.id) {
        setPreviewFile(updated);
      }
      addLog('DRIVE', `Renamed "${editingFile.originalName}" to "${updated.originalName}".`, 'SUCCESS');
      setEditingFile(null);
    } catch (err: any) {
      console.error('Failed to rename file:', err);
      setModalConfig({
        isOpen: true,
        title: 'Rename Failed',
        message: err.message || 'Could not rename file in Cloud Drive.',
        variant: 'danger',
        isAlert: true,
        confirmLabel: 'Dismiss',
        onConfirm: () => setModalConfig(null)
      });
    } finally {
      setIsRenamingFile(false);
    }
  };

  const startRenameFolder = (folderPath: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const baseName = folderPath.split('/').pop() || folderPath;
    setEditingFolder(folderPath);
    setEditingFolderName(baseName);
  };

  const handleRenameFolder = async () => {
    if (!editingFolder) return;
    const trimmed = editingFolderName.trim().replace(/[/\\:*?"<>|]/g, '');
    const oldBase = editingFolder.split('/').pop() || editingFolder;
    if (!trimmed || trimmed === oldBase) {
      setEditingFolder(null);
      return;
    }
    const parent = getParentFolder(editingFolder);
    const newFullPath = parent ? `${parent}/${trimmed}` : trimmed;

    setIsRenamingFolder(true);
    try {
      await renameVaultFolder(editingFolder, newFullPath, userToken);
      addLog('DRIVE', `Renamed folder "${editingFolder}" to "${newFullPath}".`, 'SUCCESS');
      
      // Update currentFolder if inside or looking at the renamed folder
      if (currentFolder === editingFolder) {
        setCurrentFolder(newFullPath);
      } else if (currentFolder?.startsWith(editingFolder + '/')) {
        setCurrentFolder(newFullPath + '/' + currentFolder.slice(editingFolder.length + 1));
      }
      
      setEditingFolder(null);
      await loadVaultData(true);
    } catch (err: any) {
      console.error('Failed to rename folder:', err);
      setModalConfig({
        isOpen: true,
        title: 'Rename Folder Failed',
        message: err.message || 'Could not rename folder in Cloud Drive.',
        variant: 'danger',
        isAlert: true,
        confirmLabel: 'Dismiss',
        onConfirm: () => setModalConfig(null)
      });
    } finally {
      setIsRenamingFolder(false);
    }
  };

  const handleMoveFilesToFolder = async (targetFolder: string, fileIds?: string[]) => {
    const ids = fileIds && fileIds.length > 0 ? fileIds : moveModalFiles.map(f => f.id);
    if (ids.length === 0) return;
    const dest = targetFolder.trim();
    setIsMovingFile(true);
    try {
      await Promise.all(
        ids.map(id => updateVaultFile(id, { folder: dest }, userToken))
      );
      if (ids.length === 1) {
        const targetItem = files.find(f => f.id === ids[0]);
        addLog('DRIVE', `Moved "${targetItem?.originalName || 'file'}" to ${dest ? `folder "${dest}"` : 'My Drive Root'}.`, 'SUCCESS');
      } else {
        addLog('DRIVE', `Moved ${ids.length} files to ${dest ? `folder "${dest}"` : 'My Drive Root'}.`, 'SUCCESS');
      }
      setMoveModalFiles([]);
      clearSelection();
      setDraggedFileIds([]);
      setDragOverFolder(null);
      await loadVaultData(true);
    } catch (err: any) {
      console.error('Failed to move file(s):', err);
      setModalConfig({
        isOpen: true,
        title: 'Move Failed',
        message: err.message || 'Could not move file(s) to selected folder.',
        variant: 'danger',
        isAlert: true,
        confirmLabel: 'Dismiss',
        onConfirm: () => setModalConfig(null)
      });
    } finally {
      setIsMovingFile(false);
      setDragOverFolder(null);
    }
  };

  const handleMoveFile = async () => {
    await handleMoveFilesToFolder(targetMoveFolder);
  };

  const toggleSelectFile = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (filesToSelect: VaultFileItem[]) => {
    const allSelected = filesToSelect.length > 0 && filesToSelect.every(f => selectedFileIds.has(f.id));
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        filesToSelect.forEach(f => next.delete(f.id));
      } else {
        filesToSelect.forEach(f => next.add(f.id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedFileIds(new Set());
  };

  const promptDeleteBatch = (selectedFiles: VaultFileItem[]) => {
    const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    setModalConfig({
      isOpen: true,
      title: `Delete ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}`,
      message: `Permanently delete ${selectedFiles.length} selected ${selectedFiles.length === 1 ? 'file' : 'files'}?`,
      subtext: `Total size: ${formatBytes(totalBytes)}. Standby and primary vault nodes will purge these items.`,
      confirmLabel: `Delete (${selectedFiles.length})`,
      cancelLabel: 'Keep Files',
      variant: 'danger',
      onConfirm: async () => {
        setModalConfig(null);
        try {
          addLog('DRIVE', `Deleting ${selectedFiles.length} files...`, 'INFO');
          await Promise.all(selectedFiles.map(f => deleteVaultFile(f.id, userToken)));
          addLog('DRIVE', `Successfully deleted ${selectedFiles.length} files.`, 'SUCCESS');
          clearSelection();
          await loadVaultData(true);
        } catch (err: any) {
          console.error('Batch delete failed:', err);
          setModalConfig({
            isOpen: true,
            title: 'Delete Incomplete',
            message: err.message || 'One or more files could not be deleted.',
            variant: 'danger',
            isAlert: true,
            confirmLabel: 'Dismiss',
            onConfirm: () => setModalConfig(null)
          });
        }
      }
    });
  };

  const handleBatchDownload = (selectedFiles: VaultFileItem[]) => {
    selectedFiles.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = getVaultDownloadUrl(file.id, userToken);
        link.download = file.originalName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 250);
    });
    addLog('DRIVE', `Triggered batch download for ${selectedFiles.length} files.`, 'INFO');
  };

  const handleBatchStar = (selectedFiles: VaultFileItem[]) => {
    const allStarred = selectedFiles.length > 0 && selectedFiles.every(f => starredIds.has(f.id));
    setStarredIds(prev => {
      const next = new Set(prev);
      if (allStarred) {
        selectedFiles.forEach(f => next.delete(f.id));
      } else {
        selectedFiles.forEach(f => next.add(f.id));
      }
      try {
        localStorage.setItem('sutharlabs_drive_starred', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    addLog('DRIVE', `${allStarred ? 'Unstarred' : 'Starred'} ${selectedFiles.length} files.`, 'INFO');
  };

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
    if (draggedFileIds.length > 0) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const targetFolder = currentFolder || '';
      addLog('DRIVE', `Starting upload for "${selectedFile.name}" (${formatBytes(selectedFile.size)})${targetFolder ? ` to folder "${targetFolder}"` : ''}...`, 'INFO');
      const uploaded = await uploadVaultFile(
        selectedFile,
        selectedCategory,
        targetFolder,
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
          setSelectedFileIds(prev => {
            if (prev.has(file.id)) {
              const next = new Set(prev);
              next.delete(file.id);
              return next;
            }
            return prev;
          });
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

  // Auto-fill & Auto-login credentials for embedded File Browser iframe
  const handleFileBrowserIframeLoad = () => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      try {
        const iframe = iframeRef.current;
        if (!iframe) {
          clearInterval(interval);
          return;
        }
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        const userInput = doc.querySelector('input[type="text"], input[name="username"]') as HTMLInputElement;
        const passInput = doc.querySelector('input[type="password"], input[name="password"]') as HTMLInputElement;
        if (userInput && passInput) {
          if (!userInput.value) {
            userInput.value = 'admin';
            userInput.dispatchEvent(new Event('input', { bubbles: true }));
            userInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (!passInput.value) {
            passInput.value = 'SutharLabs2026!';
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
            passInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
      if (attempts >= 15) {
        clearInterval(interval);
      }
    }, 200);
  };

  const triggerFileBrowserAutoLogin = async () => {
    setIsLoggingInFb(true);
    try {
      // 1. Direct API authentication against File Browser to receive JWT token
      const res = await fetch('/filebrowser/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'SutharLabs2026!' })
      });
      if (res.ok) {
        const token = (await res.text()).trim();
        if (token && token.length > 20) {
          try {
            localStorage.setItem('jwt', token);
          } catch {}
          const iframe = iframeRef.current;
          if (iframe) {
            try {
              iframe.contentWindow?.localStorage?.setItem('jwt', token);
            } catch {}
            // Navigate directly to file explorer with active JWT session
            iframe.src = '/filebrowser/files/';
            setFileBrowserStatus('online');
            addLog('DRIVE', 'File Browser session authenticated successfully.', 'SUCCESS');
            setIsLoggingInFb(false);
            return;
          }
        }
      }
    } catch (apiErr) {
      console.warn('Direct API login attempt failed:', apiErr);
    }

    // 2. DOM fallback: Fill inputs inside iframe if DOM is accessible
    try {
      const iframe = iframeRef.current;
      if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          const userInput = doc.querySelector('input[type="text"], input[name="username"]') as HTMLInputElement;
          const passInput = doc.querySelector('input[type="password"], input[name="password"]') as HTMLInputElement;
          const submitBtn = doc.querySelector('input[type="submit"], button[type="submit"]') as HTMLElement;
          if (userInput && passInput) {
            userInput.value = 'admin';
            userInput.dispatchEvent(new Event('input', { bubbles: true }));
            userInput.dispatchEvent(new Event('change', { bubbles: true }));
            passInput.value = 'SutharLabs2026!';
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
            passInput.dispatchEvent(new Event('change', { bubbles: true }));
            if (submitBtn) {
              submitBtn.click();
            }
          }
        }
      }
    } catch (err) {
      console.warn('Auto-login trigger error:', err);
    } finally {
      setIsLoggingInFb(false);
    }
  };

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
          file.checksum.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (file.folder && file.folder.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = categoryFilter === 'ALL' || file.category === categoryFilter;
        
        let matchesTab = true;
        if (activeTab === 'starred') {
          matchesTab = starredIds.has(file.id);
        } else if (activeTab === 'recent') {
          const uploadTime = new Date(file.uploadedAt).getTime();
          const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
          matchesTab = uploadTime >= oneDayAgo;
        } else if (activeTab === 'my-drive') {
          // If search is empty, filter by folder hierarchy
          if (!searchQuery.trim()) {
            if (currentFolder === null) {
              matchesTab = !file.folder || file.folder.trim() === '';
            } else {
              matchesTab = file.folder === currentFolder;
            }
          }
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
  }, [files, searchQuery, categoryFilter, activeTab, starredIds, currentFolder, sortBy, sortOrder]);

  const selectedFilesList = useMemo(() => {
    return files.filter(f => selectedFileIds.has(f.id));
  }, [files, selectedFileIds]);

  const allSelectedStarred = useMemo(() => {
    return selectedFilesList.length > 0 && selectedFilesList.every(f => starredIds.has(f.id));
  }, [selectedFilesList, starredIds]);

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const numSelectedInView = filteredFiles.filter(f => selectedFileIds.has(f.id)).length;
      selectAllCheckboxRef.current.indeterminate = numSelectedInView > 0 && numSelectedInView < filteredFiles.length;
    }
  }, [selectedFileIds, filteredFiles]);

  useEffect(() => {
    if (selectedFileIds.size > 0) {
      const validIds = new Set(files.map(f => f.id));
      setSelectedFileIds(prev => {
        let hasChanges = false;
        const next = new Set<string>();
        prev.forEach(id => {
          if (validIds.has(id)) {
            next.add(id);
          } else {
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [files]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedFileIds.size > 0 && !modalConfig && moveModalFiles.length === 0 && !previewFile && !showNewFolderModal) {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFileIds, modalConfig, moveModalFiles, previewFile, showNewFolderModal]);

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
          <div className={`px-3.5 sm:px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono shrink-0 flex-wrap gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#18181c]/60 border-[#3a494b]/30 text-gray-300'
          }`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2 h-2 rounded-full ${fileBrowserStatus === 'online' ? 'bg-emerald-500 animate-pulse' : fileBrowserStatus === 'checking' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'}`} />
              <span className="font-semibold">File Browser (v2.63)</span>
              
              {/* Credentials Pill with 1-Click Copy */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-mono ${
                isLight ? 'bg-white border-slate-200 text-slate-700 shadow-2xs' : 'bg-white/5 border-white/10 text-gray-300'
              }`}>
                <Key className="w-3 h-3 text-sky-500 shrink-0" />
                <span className="text-on-surface-variant">User:</span>
                <code className={`font-bold ${isLight ? 'text-sky-700' : 'text-[#00dbe7]'}`}>admin</code>
                <span className="text-on-surface-variant">• Pass:</span>
                <code className={`font-bold ${isLight ? 'text-sky-700' : 'text-[#00dbe7]'}`}>SutharLabs2026!</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard('SutharLabs2026!', 'fb_pass')}
                  title="Copy password"
                  className="hover:text-sky-500 cursor-pointer ml-0.5"
                >
                  {copiedKey === 'fb_pass' ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* 1-Click Auto-Fill & Login */}
              <button
                type="button"
                onClick={triggerFileBrowserAutoLogin}
                disabled={isLoggingInFb}
                className={`h-7 px-2.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1 cursor-pointer font-bold select-none disabled:opacity-60 disabled:cursor-not-allowed ${
                  isLight
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-2xs'
                    : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/40 shadow-2xs'
                }`}
              >
                {isLoggingInFb ? <RefreshCw className="w-3 h-3 animate-spin shrink-0" /> : <Key className="w-3 h-3 shrink-0" />}
                <span>{isLoggingInFb ? 'Logging in...' : 'Auto-Fill & Login'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFileBrowserIframeKey(k => k + 1)}
                title="Reload File Browser"
                className={`h-7 px-2 rounded text-[11px] font-mono border transition-all flex items-center gap-1 cursor-pointer ${
                  isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-white/10 text-on-surface border-white/10'
                }`}
              >
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">Reload</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('drive')}
                className={`h-7 px-2.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                  isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-white/10 text-[#00dbe7] border-[#00dbe7]/30'
                }`}
              >
                Native Drive
              </button>

              <a
                href="/filebrowser/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:underline flex items-center gap-1 font-bold text-xs"
              >
                <span>External</span>
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
              ref={iframeRef}
              key={fileBrowserIframeKey}
              src="/filebrowser/login"
              onLoad={handleFileBrowserIframeLoad}
              title="File Browser"
              className="w-full flex-1 border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups"
            />
          )}
        </div>
      ) : (
        /* VIEW MODE 2: SUTHARLABS NATIVE CLOUD DRIVE */
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-w-full">
        
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

        {/* Popular Drive Navigation & Standard Action Buttons */}
        <div className="space-y-3">
          
          {/* Top Row: Action Buttons (Upload + New Folder) + Storage Capacity Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Standard Toolbar Buttons: h-8 px-3 rounded-lg text-xs font-mono font-bold */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 sm:flex-initial h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs select-none ${
                  isLight
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sky-500/10'
                    : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border border-[#00dbe7]/50 shadow-[#00dbe7]/10'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Upload</span>
              </button>

              <button
                type="button"
                onClick={() => { setNewFolderName(''); setShowNewFolderModal(true); }}
                className={`flex-1 sm:flex-initial h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-xs select-none ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5 shrink-0 text-sky-500" />
                <span>New Folder</span>
              </button>
            </div>

            {/* Storage Capacity Pill */}
            <div className={`p-1.5 px-3 rounded-xl border text-xs font-mono flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-surface-container-low/40 border-outline/15 text-gray-300'
            }`}>
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="font-bold">{formatBytes(usedBytes)}</span>
                <span className="text-[10px] text-on-surface-variant">of 50 GB used</span>
              </div>
              <div className="w-24 sm:w-28 h-1 bg-surface-container-highest rounded-full overflow-hidden shrink-0">
                <div 
                  className={`h-full transition-all duration-300 ${percentUsed > 85 ? 'bg-rose-500' : 'bg-sky-500'}`}
                  style={{ width: `${Math.max(5, percentUsed)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Drive Navigation Tabs: My Drive | Recent | Starred */}
          {/* On mobile: 3 equal flex-1 buttons spanning 100% of screen with ZERO overflow */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto sm:inline-flex p-0.5 rounded-xl border bg-surface-container-low/20 border-outline/10">
            <button
              type="button"
              onClick={() => setActiveTab('my-drive')}
              className={`flex-1 sm:flex-initial h-8 px-2.5 sm:px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all min-w-0 ${
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
              <span className="truncate">Drive</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recent')}
              className={`flex-1 sm:flex-initial h-8 px-2.5 sm:px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all min-w-0 ${
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
              <span className="truncate">Recent</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('starred')}
              className={`flex-1 sm:flex-initial h-8 px-2.5 sm:px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all min-w-0 ${
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
              <span className="truncate">Starred{starredIds.size > 0 ? ` (${starredIds.size})` : ''}</span>
            </button>
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
                    {formatBytes(selectedFile.size)} • Destination: <span className="text-sky-500 font-bold">{selectedCategory}</span> • Folder: <span className="text-sky-500 font-bold">{currentFolder || 'Root'}</span>
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

        {/* Breadcrumb Trail when in My Drive */}
        {activeTab === 'my-drive' && (
          <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-2xs text-slate-700' : 'bg-surface-container-low/40 border-outline/15 text-[#e5e1e4]'
          }`}>
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <button
                type="button"
                onClick={() => setCurrentFolder(null)}
                onDragOver={(e) => {
                  if (draggedFileIds.length > 0) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverFolder('__ROOT__');
                  }
                }}
                onDragLeave={() => {
                  if (dragOverFolder === '__ROOT__') setDragOverFolder(null);
                }}
                onDrop={(e) => {
                  if (draggedFileIds.length > 0) {
                    e.preventDefault();
                    handleMoveFilesToFolder('', draggedFileIds);
                  }
                }}
                className={`hover:underline flex items-center gap-1.5 font-bold cursor-pointer transition-all ${
                  dragOverFolder === '__ROOT__'
                    ? 'ring-2 ring-sky-400 bg-sky-500/20 px-2 py-0.5 rounded-md text-sky-500'
                    : currentFolder === null 
                      ? (isLight ? 'text-sky-600' : 'text-[#00dbe7]') 
                      : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 shrink-0" />
                <span>My Drive</span>
              </button>

              {currentFolder && (
                <>
                  {currentFolder.split('/').map((seg, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    const pathSoFar = arr.slice(0, idx + 1).join('/');
                    return (
                      <React.Fragment key={pathSoFar}>
                        <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/60 shrink-0 select-none" />
                        {isLast ? (
                          <div 
                            className="flex items-center gap-1.5 font-bold text-on-surface truncate cursor-pointer select-none"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              startRenameFolder(currentFolder, e);
                            }}
                            title={`${seg} (Double-click to rename)`}
                          >
                            <Folder className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">{seg}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCurrentFolder(pathSoFar)}
                            onDragOver={(e) => {
                              if (draggedFileIds.length > 0) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                setDragOverFolder(pathSoFar);
                              }
                            }}
                            onDragLeave={() => {
                              if (dragOverFolder === pathSoFar) setDragOverFolder(null);
                            }}
                            onDrop={(e) => {
                              if (draggedFileIds.length > 0) {
                                e.preventDefault();
                                handleMoveFilesToFolder(pathSoFar, draggedFileIds);
                              }
                            }}
                            className={`hover:underline flex items-center gap-1 cursor-pointer truncate transition-all ${
                              dragOverFolder === pathSoFar
                                ? 'ring-2 ring-sky-400 bg-sky-500/20 px-2 py-0.5 rounded-md text-sky-500'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <span>{seg}</span>
                          </button>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentFolder && (
                <>
                  <button
                    type="button"
                    onClick={() => startRenameFolder(currentFolder)}
                    title={`Rename "${currentFolder.split('/').pop()}"`}
                    className={`h-7 px-2 rounded-lg text-[11px] font-mono border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-white/10 text-on-surface border-white/10'
                    }`}
                  >
                    <Pencil className="w-3 h-3 shrink-0" />
                    <span className="hidden sm:inline">Rename</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentFolder(getParentFolder(currentFolder))}
                    title="Up 1 level"
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-white/10 text-on-surface border-white/10'
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Up 1 Level</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => { setNewFolderName(''); setShowNewFolderModal(true); }}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-mono border transition-all cursor-pointer flex items-center gap-1 shrink-0 font-bold ${
                  isLight
                    ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300'
                    : 'bg-[#00dbe7]/10 hover:bg-[#00dbe7]/20 text-[#00dbe7] border-[#00dbe7]/30'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{currentFolder ? 'New Subfolder' : 'New Folder'}</span>
                <span className="sm:hidden">Folder</span>
              </button>
            </div>
          </div>
        )}

        {/* Folders Section: Show direct child folders for the current location */}
        {activeTab === 'my-drive' && !searchQuery.trim() && currentLevelFolders.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>{currentFolder ? 'Subfolders' : 'Folders'} ({currentLevelFolders.length})</span>
              </span>
              <button
                type="button"
                onClick={() => { setNewFolderName(''); setShowNewFolderModal(true); }}
                className="text-[11px] font-mono text-sky-500 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <Plus className="w-3 h-3 shrink-0" />
                <span>New {currentFolder ? 'Subfolder' : 'Folder'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {currentLevelFolders.map((folder) => {
                const folderFileCount = files.filter(f => f.folder === folder).length;
                const directSubfolders = folders.filter(f => f.startsWith(folder + '/') && !f.slice(folder.length + 1).includes('/')).length;
                const baseName = folder.split('/').pop() || folder;
                return (
                  <div
                    key={folder}
                    onClick={() => setCurrentFolder(folder)}
                    onDragOver={(e) => {
                      if (draggedFileIds.length > 0) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverFolder(folder);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverFolder === folder) setDragOverFolder(null);
                    }}
                    onDrop={(e) => {
                      if (draggedFileIds.length > 0) {
                        e.preventDefault();
                        handleMoveFilesToFolder(folder, draggedFileIds);
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all group ${
                      dragOverFolder === folder
                        ? 'ring-2 ring-sky-400 bg-sky-500/20 border-sky-400 scale-[1.02] shadow-md'
                        : isLight
                          ? 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-xs shadow-xs text-slate-800'
                          : 'bg-surface-container-low/40 border-outline/15 hover:border-[#00dbe7]/40 hover:bg-white/[0.03] text-[#e5e1e4]'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-2 min-w-0 flex-1 select-none"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startRenameFolder(folder, e);
                      }}
                      title={`${folder} (Double-click to rename)`}
                    >
                      <Folder className="w-4 h-4 text-sky-500 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate group-hover:text-sky-500 transition-colors" title={folder}>
                          {baseName}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-mono">
                          {folderFileCount} {folderFileCount === 1 ? 'file' : 'files'}{directSubfolders > 0 ? `, ${directSubfolders} sub` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={(e) => startRenameFolder(folder, e)}
                        title={`Rename "${baseName}"`}
                        className="p-1 rounded hover:bg-sky-500/10 text-sky-400 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 shrink-0" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => promptDeleteFolder(folder, e)}
                        title={`Delete "${baseName}"`}
                        className="p-1 rounded hover:bg-rose-500/10 text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar & Filter Toolbar */}
        <div className={`p-3 sm:p-4 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-surface-container-low/40 border-outline/15'
        }`}>
          {/* Search Box: "Search in Drive" */}
          <div className="relative w-full md:flex-1 md:min-w-[200px]">
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

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 min-w-0">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`flex-1 md:flex-initial h-8 px-2 sm:px-2.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer truncate min-w-0 ${
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
              className={`flex-1 md:flex-initial h-8 px-2 sm:px-2.5 rounded-lg text-xs font-mono border transition-colors cursor-pointer truncate min-w-0 ${
                isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#201f21] border-[#3a494b]/40 text-[#e5e1e4]'
              }`}
            >
              <option value="date">Date Modified</option>
              <option value="size">File Size</option>
              <option value="name">Name</option>
            </select>

            {/* Layout Toggle: List vs Grid (shrink-0 prevents right edge cut-off on mobile) */}
            <div className={`flex rounded-lg p-0.5 border text-xs shrink-0 ${
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
        ) : (activeTab === 'my-drive' && currentFolder !== null && !searchQuery.trim() && currentLevelFolders.length === 0 && filteredFiles.length === 0) ? (
          <div className={`p-8 sm:p-12 rounded-2xl border text-center transition-colors ${
            isLight ? 'bg-slate-50/60 border-slate-200 text-slate-700' : 'bg-surface-container-low/20 border-outline/10 text-gray-400'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border ${
              isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-primary/10 border-primary/25 text-[#00dbe7]'
            }`}>
              <Folder className="w-6 h-6 shrink-0" />
            </div>
            <h4 className="text-sm font-bold text-on-surface">This folder is empty</h4>
            <p className="text-xs text-on-surface-variant font-mono mt-1 mb-4">
              Upload files directly into &quot;{currentFolder.split('/').pop()}&quot; or create a subfolder.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => { setNewFolderName(''); setShowNewFolderModal(true); }}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5 shrink-0 text-sky-500" />
                <span>New Subfolder</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  isLight ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/50'
                }`}
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>Upload Here</span>
              </button>
            </div>
          </div>
        ) : (!searchQuery.trim() && categoryFilter === 'ALL' && activeTab === 'my-drive' && currentLevelFolders.length > 0 && filteredFiles.length === 0) ? (
          <div className="p-8 text-center text-xs font-mono text-on-surface-variant flex flex-col items-center gap-2 border border-dashed rounded-xl">
            <Folder className="w-6 h-6 text-sky-500/50 shrink-0" />
            <span className="text-on-surface font-semibold">No direct files in this folder</span>
            <span>Files will appear here when uploaded or moved from other locations.</span>
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
                draggable={true}
                onDragStart={(e) => {
                  const idsToDrag = selectedFileIds.has(file.id) ? Array.from(selectedFileIds) : [file.id];
                  setDraggedFileIds(idsToDrag);
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'vault-files', ids: idsToDrag }));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDraggedFileIds([]);
                  setDragOverFolder(null);
                }}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  draggedFileIds.includes(file.id)
                    ? 'opacity-40 scale-95 border-dashed border-sky-400'
                    : selectedFileIds.has(file.id)
                      ? isLight
                        ? 'bg-sky-50/60 border-sky-400 ring-2 ring-sky-300 shadow-md'
                        : 'bg-[#00dbe7]/10 border-[#00dbe7] ring-1 ring-[#00dbe7]/50 shadow-md'
                      : isLight 
                        ? 'bg-white border-slate-200 shadow-xs hover:shadow-md hover:border-sky-300' 
                        : 'bg-surface-container-low/40 border-outline/15 hover:border-[#00dbe7]/40 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedFileIds.has(file.id)}
                      onChange={(e) => toggleSelectFile(file.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${file.originalName}`}
                      className="w-4 h-4 rounded border-slate-300 dark:border-[#3a494b] text-sky-500 focus:ring-sky-500 cursor-pointer accent-sky-500 shrink-0"
                    />
                    <div 
                      onClick={() => setPreviewFile(file)}
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
                    >
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        {getFileIcon(file.mimeType, file.originalName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-semibold text-xs text-on-surface truncate font-sans group-hover:text-sky-500 transition-colors select-none" 
                          title={`${file.originalName} (Double-click to rename)`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startRenameFile(file, e);
                          }}
                        >
                          {file.originalName}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                          {formatBytes(file.size)}
                        </div>
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
                      onClick={() => {
                        setMoveModalFiles([file]);
                        setTargetMoveFolder(file.folder || '');
                      }}
                      title="Move to Folder"
                      className="p-1 rounded hover:bg-white/10 cursor-pointer text-on-surface-variant hover:text-sky-500"
                    >
                      <FolderInput className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => startRenameFile(file, e)}
                      title="Rename file"
                      className="p-1 rounded hover:bg-white/10 cursor-pointer text-on-surface-variant hover:text-sky-500"
                    >
                      <Pencil className="w-3.5 h-3.5 shrink-0" />
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
                <div 
                  key={file.id} 
                  className={`p-3 flex flex-col gap-2 max-w-full overflow-hidden transition-colors ${
                    selectedFileIds.has(file.id)
                      ? isLight ? 'bg-sky-50/70' : 'bg-[#00dbe7]/10'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5 min-w-0">
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedFileIds.has(file.id)}
                        onChange={(e) => toggleSelectFile(file.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${file.originalName}`}
                        className="w-4 h-4 rounded border-slate-300 dark:border-[#3a494b] text-sky-500 focus:ring-sky-500 cursor-pointer accent-sky-500 shrink-0"
                      />
                    </div>
                    <div 
                      onClick={() => setPreviewFile(file)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startRenameFile(file, e);
                      }}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                    >
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'
                      }`}>
                        {getFileIcon(file.mimeType, file.originalName)}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div 
                          className="font-semibold text-xs text-on-surface truncate font-sans group-hover:text-sky-500 transition-colors select-none" 
                          title={`${file.originalName} (Double-click to rename)`}
                        >
                          {file.originalName}
                        </div>
                        <div className="text-[10px] text-on-surface-variant font-mono mt-0.5 flex items-center gap-1.5 truncate">
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span>{file.category || 'General'}</span>
                          {file.folder && (
                            <>
                              <span>•</span>
                              <span className="text-sky-500 font-bold truncate">{file.folder}</span>
                            </>
                          )}
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

                  <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant pt-1.5 border-t border-outline/10 gap-2 min-w-0">
                    <span className="shrink-0">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        title="Preview"
                        className={`h-7 w-7 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          isLight ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100' : 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMoveModalFiles([file]);
                          setTargetMoveFolder(file.folder || '');
                        }}
                        title="Move to Folder"
                        className={`h-7 w-7 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-on-surface border-white/10'
                        }`}
                      >
                        <FolderInput className="w-3.5 h-3.5 shrink-0" />
                      </button>
                      <a
                        href={getVaultDownloadUrl(file.id, userToken)}
                        download={file.originalName}
                        title="Download"
                        className={`h-7 w-7 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-on-surface border-white/10'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                      </a>
                      <button
                        type="button"
                        onClick={(e) => startRenameFile(file, e)}
                        title="Rename file"
                        className={`h-7 w-7 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-on-surface border-white/10'
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5 shrink-0" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shareFileLink(file)}
                        title="Share link"
                        className={`h-7 w-7 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-on-surface border-white/10'
                        }`}
                      >
                        {shareFeedback === file.id ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Share2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDeleteFile(file)}
                        title="Delete"
                        className="h-7 w-7 rounded border flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
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
                    <th className="py-3 px-3 sm:px-4 w-10 text-center">
                      <input
                        ref={selectAllCheckboxRef}
                        type="checkbox"
                        checked={filteredFiles.length > 0 && filteredFiles.every(f => selectedFileIds.has(f.id))}
                        onChange={() => handleSelectAll(filteredFiles)}
                        aria-label="Select all files"
                        className="w-4 h-4 rounded border-slate-300 dark:border-[#3a494b] text-sky-500 focus:ring-sky-500 cursor-pointer accent-sky-500"
                      />
                    </th>
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
                      draggable={true}
                      onDragStart={(e) => {
                        const idsToDrag = selectedFileIds.has(file.id) ? Array.from(selectedFileIds) : [file.id];
                        setDraggedFileIds(idsToDrag);
                        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'vault-files', ids: idsToDrag }));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        setDraggedFileIds([]);
                        setDragOverFolder(null);
                      }}
                      className={`transition-colors ${
                        draggedFileIds.includes(file.id)
                          ? 'opacity-40 bg-sky-500/10'
                          : selectedFileIds.has(file.id)
                            ? isLight
                              ? 'bg-sky-50/80 hover:bg-sky-100/80'
                              : 'bg-[#00dbe7]/10 hover:bg-[#00dbe7]/15'
                            : isLight
                              ? 'hover:bg-slate-50'
                              : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 sm:px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedFileIds.has(file.id)}
                          onChange={(e) => toggleSelectFile(file.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${file.originalName}`}
                          className="w-4 h-4 rounded border-slate-300 dark:border-[#3a494b] text-sky-500 focus:ring-sky-500 cursor-pointer accent-sky-500"
                        />
                      </td>

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
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              startRenameFile(file, e);
                            }}
                            className="truncate max-w-[180px] sm:max-w-xs cursor-pointer hover:text-sky-500 transition-colors select-none" 
                            title={`${file.originalName} (Double-click to rename)`}
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

                      {/* Actions (Icon-only to prevent table horizontal scrolling) */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            title="Preview file"
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shadow-xs ${
                              isLight
                                ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300'
                                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/40'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMoveModalFiles([file]);
                              setTargetMoveFolder(file.folder || '');
                            }}
                            title="Move to folder"
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shadow-xs ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                            }`}
                          >
                            <FolderInput className="w-3.5 h-3.5 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => startRenameFile(file, e)}
                            title="Rename file (or double-click name)"
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shadow-xs ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => shareFileLink(file)}
                            title="Share link"
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shadow-xs ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                            }`}
                          >
                            {shareFeedback === file.id ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Share2 className="w-3.5 h-3.5 shrink-0" />}
                          </button>

                          <a
                            href={getVaultDownloadUrl(file.id, userToken)}
                            download={file.originalName}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download file"
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shadow-xs ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                            }`}
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                          </a>

                          <button
                            type="button"
                            onClick={() => promptDeleteFile(file)}
                            title="Delete file"
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer shadow-xs ${
                              isLight
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
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

      {/* Floating Action Button (FAB) for Mobile Quick Upload - hidden when multi-select bar is active */}
      {selectedFileIds.size === 0 && (
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
      )}

      {/* Floating Batch Action Bar (Google Drive / macOS style) */}
      {selectedFileIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 flex items-center justify-between gap-2.5 sm:gap-3 transition-colors bg-white/95 border-slate-300 text-slate-800 dark:bg-[#18181c]/95 dark:border-[#3a494b]/60 dark:text-[#e5e1e4]">
          {/* Left: Close button + Selection Summary */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={clearSelection}
              title="Clear selection (Esc)"
              className={`p-1.5 rounded-lg border cursor-pointer transition-colors shrink-0 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-on-surface'
              }`}
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
            <div className="min-w-0">
              <div className="text-xs font-bold font-sans text-on-surface truncate">
                {selectedFileIds.size} of {filteredFiles.length} selected
              </div>
              <div className="text-[10px] font-mono text-on-surface-variant truncate">
                {formatBytes(selectedFilesList.reduce((acc, f) => acc + f.size, 0))} total
              </div>
            </div>
          </div>

          {/* Right: Batch Actions */}
          <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
            <button
              type="button"
              onClick={() => handleSelectAll(filteredFiles)}
              className={`h-8 px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer select-none flex items-center gap-1 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-on-surface border-white/10'
              }`}
            >
              <span className="hidden sm:inline">{selectedFileIds.size === filteredFiles.length ? 'Deselect All' : 'Select All'}</span>
              <span className="sm:hidden">{selectedFileIds.size === filteredFiles.length ? 'None' : 'All'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMoveModalFiles(selectedFilesList);
                setTargetMoveFolder('');
              }}
              title="Move selected files"
              className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
            >
              <FolderInput className="w-3.5 h-3.5 shrink-0 text-sky-500" />
              <span className="hidden sm:inline">Move</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchStar(selectedFilesList)}
              title={allSelectedStarred ? 'Unstar all selected' : 'Star all selected'}
              className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
            >
              <Star className={`w-3.5 h-3.5 shrink-0 ${allSelectedStarred ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant'}`} />
              <span className="hidden sm:inline">{allSelectedStarred ? 'Unstar' : 'Star'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchDownload(selectedFilesList)}
              title="Download selected files"
              className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                isLight
                  ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                  : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/50'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={() => promptDeleteBatch(selectedFilesList)}
              title="Delete selected files"
              className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      )}

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

                {/* Rename Button */}
                <button
                  type="button"
                  onClick={(e) => startRenameFile(previewFile, e)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                  title="Rename file"
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Rename</span>
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

      {/* Modal 1: Create New Folder / Subfolder Modal */}
      {showNewFolderModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowNewFolderModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
            }`}
          >
            <div className="h-1 w-full bg-[#00dbe7] shrink-0" />
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-primary/10 border-primary/25 text-[#00dbe7]'
                }`}>
                  <FolderPlus className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface font-sans">
                    {currentFolder ? 'New Subfolder' : 'New Folder'}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                    {currentFolder ? `Create inside "${currentFolder}"` : 'Organize your files in Cloud Drive'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-on-surface-variant font-medium">Folder Name</label>
                <input
                  type="text"
                  autoFocus
                  placeholder={currentFolder ? "e.g. Subfolder name" : "e.g. Invoices, Projects, Backups"}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setShowNewFolderModal(false);
                  }}
                  className={`w-full h-9 px-3 rounded-lg text-xs font-mono border transition-colors outline-hidden ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                      : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder:text-gray-500 focus:border-[#00dbe7]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                  className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50'
                  }`}
                >
                  {isCreatingFolder ? <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" /> : <FolderPlus className="w-3.5 h-3.5 shrink-0" />}
                  <span>Create</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Move File(s) to Folder Modal */}
      {moveModalFiles.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setMoveModalFiles([])}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
            }`}
          >
            <div className="h-1 w-full bg-[#00dbe7] shrink-0" />
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-primary/10 border-primary/25 text-[#00dbe7]'
                }`}>
                  <FolderInput className="w-5 h-5 shrink-0" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-on-surface font-sans truncate">
                    {moveModalFiles.length === 1 ? 'Move File' : `Move ${moveModalFiles.length} Files`}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5 truncate" title={moveModalFiles.length === 1 ? moveModalFiles[0].originalName : `${moveModalFiles.length} files selected`}>
                    {moveModalFiles.length === 1 ? `"${moveModalFiles[0].originalName}"` : `${moveModalFiles.length} files selected`}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-on-surface-variant font-medium">Select Destination</label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  <div
                    onClick={() => setTargetMoveFolder('')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      targetMoveFolder === ''
                        ? isLight
                          ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold'
                          : 'bg-[#00dbe7]/15 border-[#00dbe7]/40 text-[#00dbe7] font-bold'
                        : isLight
                          ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-on-surface'
                    }`}
                  >
                    <HardDrive className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-mono">My Drive (Root)</span>
                    {moveModalFiles.length > 0 && moveModalFiles.every(f => !f.folder) && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-on-surface-variant ml-auto shrink-0">
                        Current
                      </span>
                    )}
                  </div>

                  {folders.map(folder => {
                    const depth = folder.split('/').length - 1;
                    const baseName = folder.split('/').pop() || folder;
                    const isCurrent = moveModalFiles.length > 0 && moveModalFiles.every(f => (f.folder || '') === folder);
                    return (
                      <div
                        key={folder}
                        onClick={() => setTargetMoveFolder(folder)}
                        style={{ paddingLeft: `${12 + depth * 16}px` }}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          targetMoveFolder === folder
                            ? isLight
                              ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold'
                              : 'bg-[#00dbe7]/15 border-[#00dbe7]/40 text-[#00dbe7] font-bold'
                            : isLight
                              ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-on-surface'
                        }`}
                      >
                        {depth > 0 && <span className="text-on-surface-variant font-mono text-xs select-none">└─</span>}
                        <Folder className="w-4 h-4 shrink-0 text-sky-500" />
                        <span className="text-xs font-mono truncate">{baseName}</span>
                        {depth > 0 && (
                          <span className="text-[10px] text-on-surface-variant font-mono ml-auto truncate pl-2 opacity-70">
                            {folder}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-on-surface-variant ml-auto shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMoveModalFiles([])}
                  className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMoveFile}
                  disabled={isMovingFile}
                  className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50'
                  }`}
                >
                  {isMovingFile ? <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" /> : <FolderInput className="w-3.5 h-3.5 shrink-0" />}
                  <span>{moveModalFiles.length === 1 ? 'Move' : `Move (${moveModalFiles.length})`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Rename File Modal */}
      {editingFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setEditingFile(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
            }`}
          >
            <div className="h-1 w-full bg-[#00dbe7] shrink-0" />
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-primary/10 border-primary/25 text-[#00dbe7]'
                }`}>
                  <Pencil className="w-5 h-5 shrink-0" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-on-surface font-sans">Rename File</h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5 truncate" title={editingFile.originalName}>
                    Current: {editingFile.originalName}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-on-surface-variant font-medium">New File Name</label>
                <input
                  type="text"
                  autoFocus
                  value={editingFileName}
                  onChange={(e) => setEditingFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameFile();
                    if (e.key === 'Escape') setEditingFile(null);
                  }}
                  className={`w-full h-9 px-3 rounded-lg text-xs font-mono border transition-colors outline-hidden ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                      : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder:text-gray-500 focus:border-[#00dbe7]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRenameFile}
                  disabled={!editingFileName.trim() || editingFileName.trim() === editingFile.originalName || isRenamingFile}
                  className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50'
                  }`}
                >
                  {isRenamingFile ? <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Rename Folder Modal */}
      {editingFolder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setEditingFolder(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
            }`}
          >
            <div className="h-1 w-full bg-[#00dbe7] shrink-0" />
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-primary/10 border-primary/25 text-[#00dbe7]'
                }`}>
                  <Folder className="w-5 h-5 shrink-0 text-sky-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-on-surface font-sans">Rename Folder</h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5 truncate" title={editingFolder}>
                    Path: {editingFolder}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-on-surface-variant font-medium">Folder Name</label>
                <input
                  type="text"
                  autoFocus
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameFolder();
                    if (e.key === 'Escape') setEditingFolder(null);
                  }}
                  className={`w-full h-9 px-3 rounded-lg text-xs font-mono border transition-colors outline-hidden ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                      : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder:text-gray-500 focus:border-[#00dbe7]'
                  }`}
                />
                <p className="text-[11px] text-on-surface-variant font-mono">
                  All subfolders and files inside this folder will stay preserved under the new name.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRenameFolder}
                  disabled={!editingFolderName.trim() || editingFolderName.trim() === (editingFolder.split('/').pop() || editingFolder) || isRenamingFolder}
                  className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50'
                  }`}
                >
                  {isRenamingFolder ? <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
