import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  UploadCloud, 
  RefreshCw, 
  Sliders, 
  CheckCircle2,
  Trash2,
  FolderArchive,
  Image as ImageIcon,
  Eye,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  SplitSquareVertical,
  Palette,
  FolderLock,
  Share2
} from 'lucide-react';
import JSZip from 'jszip';
import { ToolCommonProps } from './types.js';

interface ProcessedImageItem {
  id: string;
  originalFile: File;
  originalName: string;
  originalUrl: string;
  width: number;
  height: number;
  cutoutBlob: Blob | null;
  cutoutUrl: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  progressPercent: number;
  progressStage: string;
}

type BackdropPreset = 'transparent' | 'white' | 'shadow' | 'gradient' | 'custom';

export default function BackgroundRemoverTool({
  isLight,
  isProcessing,
  setIsProcessing,
  setStatus,
  setError,
  addLog,
  checkDownloadAccess
}: ToolCommonProps) {
  const [items, setItems] = useState<ProcessedImageItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [backdropPreset, setBackdropPreset] = useState<BackdropPreset>('transparent');
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100 for before/after comparison
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [currentProgressText, setCurrentProgressText] = useState<string>('');
  const [currentProgressPct, setCurrentProgressPct] = useState<number>(0);
  const [isSavingToVault, setIsSavingToVault] = useState<boolean>(false);
  const [vaultShareUrl, setVaultShareUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const comparisonContainerRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find(i => i.id === selectedItemId) || items[0] || null;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach(item => {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.cutoutUrl) URL.revokeObjectURL(item.cutoutUrl);
      });
    };
  }, []);

  const handleFilesAdded = async (fileList: FileList | null, isBatch: boolean = false) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError?.('Please select valid image files (PNG, JPG, WebP, AVIF).');
      return;
    }

    if (validFiles.length > 1 || isBatch) {
      setIsBatchMode(true);
    }

    const newItems: ProcessedImageItem[] = validFiles.map((file, idx) => {
      const url = URL.createObjectURL(file);
      return {
        id: `img_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        originalFile: file,
        originalName: file.name.replace(/\.[^/.]+$/, ''),
        originalUrl: url,
        width: 0,
        height: 0,
        cutoutBlob: null,
        cutoutUrl: null,
        status: 'pending',
        progressPercent: 0,
        progressStage: 'Queued'
      };
    });

    // Extract natural dimensions
    for (const item of newItems) {
      const img = new Image();
      img.src = item.originalUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => {
          item.width = img.naturalWidth;
          item.height = img.naturalHeight;
          resolve();
        };
        img.onerror = () => resolve();
      });
    }

    setItems(prev => [...prev, ...newItems]);
    if (!selectedItemId && newItems.length > 0) {
      setSelectedItemId(newItems[0].id);
    }

    addLog?.('INFO', `Added ${newItems.length} image(s) to in-browser AI processor.`);
    
    // Auto-trigger processing if single image
    if (newItems.length === 1 && items.length === 0) {
      processSingleItem(newItems[0]);
    }
  };

  const processSingleItem = async (item: ProcessedImageItem) => {
    setIsProcessing(true);
    setError?.(null);
    setStatus(`Initializing in-browser AI model (WebGPU / WASM)...`);
    setCurrentProgressText('Loading ONNX model weights in client RAM...');
    setCurrentProgressPct(10);

    setItems(prev => prev.map(i => i.id === item.id ? { 
      ...i, 
      status: 'processing', 
      progressPercent: 10, 
      progressStage: 'Loading AI model' 
    } : i));

    try {
      addLog?.('INFO', `Processing "${item.originalFile.name}" with client-side AI...`);

      // Dynamically import @imgly/background-removal to keep bundle optimized
      const { removeBackground } = await import('@imgly/background-removal');

      const cutoutBlob = await removeBackground(item.originalFile, {
        progress: (key: string, current: number, total: number) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 50;
          const cleanStage = key.includes('fetch') 
            ? 'Downloading model weights' 
            : key.includes('compute') 
              ? 'Segmenting subject on WebGPU' 
              : 'Refining alpha matte';
          
          setCurrentProgressText(`${cleanStage} (${pct}%)`);
          setCurrentProgressPct(pct);

          setItems(prev => prev.map(i => i.id === item.id ? {
            ...i,
            progressPercent: pct,
            progressStage: cleanStage
          } : i));
        }
      });

      const cutoutUrl = URL.createObjectURL(cutoutBlob);

      setItems(prev => prev.map(i => i.id === item.id ? {
        ...i,
        cutoutBlob,
        cutoutUrl,
        status: 'done',
        progressPercent: 100,
        progressStage: 'Completed'
      } : i));

      setStatus('Background removed successfully! Lossless HD/4K cutout ready.');
      addLog?.('SUCCESS', `Successfully extracted transparent cutout for "${item.originalFile.name}" (${item.width}x${item.height}px).`);
    } catch (err: any) {
      console.error('In-browser background removal error:', err);
      const errMsg = err?.message || 'Failed to remove background client-side.';
      setItems(prev => prev.map(i => i.id === item.id ? {
        ...i,
        status: 'error',
        errorMessage: errMsg,
        progressStage: 'Error'
      } : i));
      setError?.(`AI background removal failed: ${errMsg}`);
      addLog?.('ERROR', `Failed processing "${item.originalFile.name}": ${errMsg}`);
    } finally {
      setIsProcessing(false);
      setCurrentProgressText('');
      setCurrentProgressPct(0);
    }
  };

  const processAllPending = async () => {
    const pendingItems = items.filter(i => i.status === 'pending' || i.status === 'error');
    if (pendingItems.length === 0) return;

    setIsProcessing(true);
    addLog?.('INFO', `Starting batch queue for ${pendingItems.length} items...`);

    for (let idx = 0; idx < pendingItems.length; idx++) {
      const item = pendingItems[idx];
      setSelectedItemId(item.id);
      setStatus(`Processing ${idx + 1} of ${pendingItems.length}: ${item.originalFile.name}`);
      await processSingleItem(item);
    }

    setStatus(`Batch processing complete! ${pendingItems.length} images processed.`);
    setIsProcessing(false);
  };

  const removeItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const item = items.find(i => i.id === id);
    if (item) {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.cutoutUrl) URL.revokeObjectURL(item.cutoutUrl);
    }
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedItemId === id) {
      const remaining = items.filter(i => i.id !== id);
      setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const clearAll = () => {
    items.forEach(item => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.cutoutUrl) URL.revokeObjectURL(item.cutoutUrl);
    });
    setItems([]);
    setSelectedItemId(null);
  };

  // Render composite image with selected background preset
  const createCompositedCanvas = async (item: ProcessedImageItem): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = item.width || 1200;
    canvas.height = item.height || 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx || !item.cutoutUrl) return canvas;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw Background
    if (backdropPreset === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (backdropPreset === 'shadow') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Soft ground contact shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 15;
    } else if (backdropPreset === 'custom') {
      ctx.fillStyle = customBgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (backdropPreset === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Draw Cutout Subject
    const cutoutImg = new Image();
    cutoutImg.crossOrigin = 'anonymous';
    cutoutImg.src = item.cutoutUrl;
    await new Promise<void>((resolve) => {
      cutoutImg.onload = () => {
        ctx.drawImage(cutoutImg, 0, 0, canvas.width, canvas.height);
        if (backdropPreset === 'shadow') {
          ctx.restore();
        }
        resolve();
      };
      cutoutImg.onerror = () => resolve();
    });

    return canvas;
  };

  const downloadSingle = async (item: ProcessedImageItem, format: 'png' | 'jpeg' | 'webp' = 'png') => {
    if (!item.cutoutBlob || !item.cutoutUrl) return;

    if (backdropPreset === 'transparent' && format === 'png') {
      // Direct lossless download of the original alpha PNG
      const a = document.createElement('a');
      a.href = item.cutoutUrl;
      a.download = `${item.originalName}_transparent_hd.png`;
      a.click();
      setStatus(`Lossless transparent PNG downloaded: ${item.originalName}`);
      addLog?.('SUCCESS', `Downloaded HD transparent cutout for "${item.originalName}".`);
    } else {
      // Composite with background
      const canvas = await createCompositedCanvas(item);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.originalName}_${backdropPreset}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus(`Downloaded image with ${backdropPreset} background.`);
      }, format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png', 0.95);
    }
  };

  const copyToClipboard = async (item: ProcessedImageItem) => {
    if (!item.cutoutBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': item.cutoutBlob })
      ]);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
      setStatus('Cutout copied to clipboard as transparent PNG!');
      addLog?.('SUCCESS', `Copied cutout for "${item.originalName}" to clipboard.`);
    } catch (err: any) {
      setError?.(`Failed to copy to clipboard: ${err.message}`);
    }
  };

  const saveToVault = async (item: ProcessedImageItem) => {
    if (!item.cutoutBlob) return;
    setIsSavingToVault(true);
    setStatus('Saving cutout to SutharLabs Storage Vault...');
    try {
      const token = localStorage.getItem('sutharlabs_auth_token') || sessionStorage.getItem('sutharlabs_auth_token');
      const formData = new FormData();
      formData.append('file', item.cutoutBlob, `${item.originalName}_cutout.png`);
      formData.append('folder', 'cutouts');

      const res = await fetch('/api/blob/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Cloud upload requires sign-in or returned HTTP ${res.status}.`);
      }

      const data = await res.json();
      setVaultShareUrl(data.url);
      setStatus('Saved to SutharLabs Storage Vault! Shareable link generated.');
      addLog?.('SUCCESS', `Asset saved to Storage Vault: ${data.url}`);
    } catch (err: any) {
      setError?.(`Vault save: ${err.message}`);
    } finally {
      setIsSavingToVault(false);
    }
  };

  const downloadAllZip = async () => {
    const doneItems = items.filter(i => i.status === 'done' && i.cutoutBlob);
    if (doneItems.length === 0) {
      setError?.('No processed images ready to download.');
      return;
    }

    setIsProcessing(true);
    setStatus('Compressing batch assets into ZIP archive in RAM...');
    addLog?.('INFO', `Packing ${doneItems.length} cutouts into ZIP bundle...`);

    try {
      const zip = new JSZip();
      const folder = zip.folder('transparent_cutouts');

      for (const item of doneItems) {
        if (backdropPreset === 'transparent') {
          folder?.file(`${item.originalName}_transparent.png`, item.cutoutBlob!);
        } else {
          const canvas = await createCompositedCanvas(item);
          const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
          if (blob) {
            folder?.file(`${item.originalName}_${backdropPreset}.png`, blob);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sutharlabs_ai_cutouts_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus(`ZIP archive downloaded with ${doneItems.length} transparent cutouts!`);
      addLog?.('SUCCESS', `Exported ZIP archive containing ${doneItems.length} cutouts.`);
    } catch (err: any) {
      setError?.(`ZIP bundling failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border shadow-sm space-y-6 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Hidden File Inputs */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/png,image/jpeg,image/webp,image/avif" 
        onChange={(e) => handleFilesAdded(e.target.files, false)} 
        className="hidden" 
      />
      <input 
        ref={batchFileInputRef} 
        type="file" 
        multiple 
        accept="image/png,image/jpeg,image/webp,image/avif" 
        onChange={(e) => handleFilesAdded(e.target.files, true)} 
        className="hidden" 
      />

      {/* Main View Header with Standard Themed Icon Container */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                AI Background Remover
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Client-Side WebGPU
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Extract lossless transparent PNGs & product cutouts in client RAM with zero server uploads
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap w-full sm:w-auto overflow-x-auto">
          {items.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => batchFileInputRef.current?.click()}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shrink-0 ${
                  isLight 
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm' 
                    : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                <span>Add More</span>
              </button>

              <button
                type="button"
                onClick={clearAll}
                className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1 shrink-0 ${
                  isLight 
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300' 
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}
                title="Clear all images"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload Zone when empty */}
      {items.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
            isLight 
              ? 'border-slate-300 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/30' 
              : 'border-[#3a494b]/60 hover:border-[#00dbe7]/60 bg-white/2 hover:bg-[#00dbe7]/5'
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${
            isLight ? 'bg-white border-slate-200 text-sky-600' : 'bg-[#18181c] border-white/10 text-[#00dbe7]'
          }`}>
            <UploadCloud className="w-7 h-7 shrink-0" />
          </div>

          <div>
            <h3 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Drop product photos or portraits here
            </h3>
            <p className="text-xs text-on-surface-variant font-mono mt-1 max-w-md mx-auto">
              Supports full-resolution PNG, JPG, WebP. Processes locally in RAM using client WebGPU with zero cloud compute limits.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shadow-sm ${
                isLight 
                  ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' 
                  : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/50'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Select Single Image</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                batchFileInputRef.current?.click();
              }}
              className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shadow-sm ${
                isLight 
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' 
                  : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 shrink-0" />
              <span>Batch Drop (Folder)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-on-surface-variant pt-2">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 100% Private (Never Uploaded)</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Full 4K Resolution (No 0.25MP Trap)</span>
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-sky-400 shrink-0" /> E-Commerce Amazon White Presets</span>
          </div>
        </div>
      ) : (
        /* Active Workspace View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Before/After Split Viewer & Controls (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedItem && (
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
              }`}>
                {/* Image Title & Dimensions Bar */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-white/10 text-xs font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-on-surface truncate">{selectedItem.originalFile.name}</span>
                    {selectedItem.width > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-on-surface-variant shrink-0">
                        {selectedItem.width} × {selectedItem.height} px
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedItem.status === 'done' ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Ready
                      </span>
                    ) : selectedItem.status === 'processing' ? (
                      <span className="flex items-center gap-1 text-[#00dbe7] font-bold text-[11px] animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" /> Processing...
                      </span>
                    ) : selectedItem.status === 'error' ? (
                      <span className="text-rose-400 font-bold text-[11px]">Error</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => processSingleItem(selectedItem)}
                        className={`h-7 px-3 rounded text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm ${
                          isLight 
                            ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' 
                            : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/50'
                        }`}
                      >
                        Remove Background
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar when processing */}
                {selectedItem.status === 'processing' && (
                  <div className="mb-4 space-y-1.5 p-3 rounded-lg border bg-sky-500/10 border-sky-500/20 text-xs font-mono">
                    <div className="flex justify-between items-center text-[#00dbe7]">
                      <span>{selectedItem.progressStage || currentProgressText || 'Processing on WebGPU...'}</span>
                      <span className="font-bold">{selectedItem.progressPercent || currentProgressPct}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#00dbe7] h-full transition-all duration-200" 
                        style={{ width: `${selectedItem.progressPercent || currentProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Main Interactive Stage Container */}
                <div 
                  ref={comparisonContainerRef}
                  className="relative w-full h-[320px] sm:h-[460px] rounded-xl overflow-hidden border border-slate-300 dark:border-white/15 select-none flex items-center justify-center"
                  style={{
                    backgroundColor: backdropPreset === 'white' 
                      ? '#ffffff' 
                      : backdropPreset === 'custom' 
                        ? customBgColor 
                        : backdropPreset === 'shadow'
                          ? '#f8fafc'
                          : backdropPreset === 'gradient'
                            ? '#f1f5f9'
                            : 'transparent',
                    backgroundImage: backdropPreset === 'transparent' 
                      ? 'linear-gradient(45deg, #262626 25%, transparent 25%), linear-gradient(-45deg, #262626 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #262626 75%), linear-gradient(-45deg, transparent 75%, #262626 75%)'
                      : 'none',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  }}
                >
                  {selectedItem.status === 'done' && selectedItem.cutoutUrl ? (
                    <>
                      {/* Processed Cutout Layer (Full view or right side of split) */}
                      <img 
                        src={selectedItem.cutoutUrl} 
                        alt="Cutout" 
                        className={`max-w-full max-h-full object-contain pointer-events-none transition-all ${
                          backdropPreset === 'shadow' ? 'drop-shadow-[0_20px_25px_rgba(0,0,0,0.35)]' : ''
                        }`}
                      />

                      {/* Before / Original Overlay (clipped by slider) */}
                      <div 
                        className="absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-white shadow-lg"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <div className="w-full h-full relative" style={{ minWidth: comparisonContainerRef.current?.clientWidth || '100%' }}>
                          <img 
                            src={selectedItem.originalUrl} 
                            alt="Original" 
                            className="absolute inset-0 w-full h-full object-contain max-w-none"
                            style={{ width: comparisonContainerRef.current?.clientWidth || '100%' }}
                          />
                          <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-sm border border-white/20">
                            ORIGINAL
                          </div>
                        </div>
                      </div>

                      {/* Right Tag */}
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00dbe7]/90 text-black backdrop-blur-sm border border-[#00dbe7] pointer-events-none">
                        AI CUTOUT (HD)
                      </div>

                      {/* Interactive Drag Handle Slider */}
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                        title="Drag to compare original vs cutout"
                      />

                      {/* Visual Slider Divider line & Handle */}
                      <div 
                        className="absolute top-0 bottom-0 pointer-events-none z-10 flex items-center justify-center"
                        style={{ left: `calc(${sliderPosition}% - 14px)` }}
                      >
                        <div className="w-7 h-7 rounded-full bg-white text-slate-800 shadow-xl border-2 border-[#00dbe7] flex items-center justify-center text-[10px] font-bold">
                          ↔
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Original Preview before processing */
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                      <img 
                        src={selectedItem.originalUrl} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute bottom-4 inset-x-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => processSingleItem(selectedItem)}
                          disabled={isProcessing}
                          className={`h-9 px-5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border shadow-lg flex items-center gap-2 cursor-pointer ${
                            isLight 
                              ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' 
                              : 'bg-[#00dbe7] hover:bg-[#74f5ff] text-slate-900 border-[#00dbe7]'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>Remove Background Now (Free HD)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slider Helper description */}
                {selectedItem.status === 'done' && (
                  <div className="flex items-center justify-between pt-2.5 text-[11px] font-mono text-on-surface-variant">
                    <span className="flex items-center gap-1.5">
                      <SplitSquareVertical className="w-3.5 h-3.5 shrink-0" />
                      Drag slider horizontally to inspect edges & hair matting
                    </span>
                    <span>{sliderPosition}% Split</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Studio Presets, Export & Batch Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Backdrop Presets Card */}
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`}>
              <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-white/10">
                <Palette className="w-4 h-4 text-[#00dbe7] shrink-0" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                  Studio Backdrop Presets
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setBackdropPreset('transparent')}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    backdropPreset === 'transparent'
                      ? 'border-[#00dbe7] bg-[#00dbe7]/15 text-[#00dbe7] font-bold shadow-sm'
                      : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#201f21] border-white/10 text-on-surface'
                  }`}
                >
                  <div className="w-4 h-4 rounded border border-white/20 shrink-0 bg-transparent" />
                  <span className="truncate">Transparent</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackdropPreset('white')}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    backdropPreset === 'white'
                      ? 'border-[#00dbe7] bg-[#00dbe7]/15 text-[#00dbe7] font-bold shadow-sm'
                      : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#201f21] border-white/10 text-on-surface'
                  }`}
                >
                  <div className="w-4 h-4 rounded border border-slate-300 bg-white shrink-0" />
                  <span className="truncate">Amazon White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackdropPreset('shadow')}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    backdropPreset === 'shadow'
                      ? 'border-[#00dbe7] bg-[#00dbe7]/15 text-[#00dbe7] font-bold shadow-sm'
                      : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#201f21] border-white/10 text-on-surface'
                  }`}
                >
                  <div className="w-4 h-4 rounded border border-slate-300 bg-slate-100 shadow-sm shrink-0" />
                  <span className="truncate">Studio Shadow</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBackdropPreset('custom')}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    backdropPreset === 'custom'
                      ? 'border-[#00dbe7] bg-[#00dbe7]/15 text-[#00dbe7] font-bold shadow-sm'
                      : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#201f21] border-white/10 text-on-surface'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded border border-white/20 shrink-0" 
                    style={{ backgroundColor: customBgColor }}
                  />
                  <span className="truncate">Custom Color</span>
                </button>
              </div>

              {/* Custom Color Input when active */}
              {backdropPreset === 'custom' && (
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="color" 
                    value={customBgColor} 
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer shrink-0"
                  />
                  <input 
                    type="text" 
                    value={customBgColor} 
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className={`h-8 px-2.5 rounded font-mono text-xs border w-full ${
                      isLight ? 'bg-white border-slate-300' : 'bg-[#121215] border-white/15'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Export Actions for Selected Item */}
            {selectedItem && selectedItem.status === 'done' && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-white/10">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                    Export Cutout
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Lossless HD/4K</span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => downloadSingle(selectedItem, 'png')}
                    className={`w-full h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                      isLight 
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' 
                        : 'bg-[#00dbe7] hover:bg-[#74f5ff] text-slate-900 border-[#00dbe7]'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>Download Transparent PNG</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedItem)}
                      className={`h-7 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center justify-center gap-1 cursor-pointer ${
                        isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-white/10'
                      }`}
                    >
                      {copiedId === selectedItem.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 shrink-0" />
                          <span>Copy Cutout</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadSingle(selectedItem, 'webp')}
                      className={`h-7 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center justify-center gap-1 cursor-pointer ${
                        isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-white/10'
                      }`}
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span>Export WebP</span>
                    </button>
                  </div>

                  {/* 1-Click Save to File Vault & Share Link */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => saveToVault(selectedItem)}
                      disabled={isSavingToVault}
                      className={`w-full h-7 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        vaultShareUrl 
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-on-surface border-white/10'
                      }`}
                    >
                      {isSavingToVault ? (
                        <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                      ) : vaultShareUrl ? (
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <FolderLock className="w-3 h-3 text-[#00dbe7] shrink-0" />
                      )}
                      <span>{isSavingToVault ? 'Saving to Vault...' : vaultShareUrl ? 'Saved to Vault!' : 'Save to Vault & Get Share Link'}</span>
                    </button>

                    {vaultShareUrl && (
                      <div className="mt-1.5 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono flex items-center justify-between gap-1">
                        <span className="truncate text-emerald-300 select-all">{vaultShareUrl}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(vaultShareUrl);
                            setStatus('Share link copied to clipboard!');
                          }}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold hover:underline shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Batch Queue & Gallery */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                    Batch Queue ({items.length})
                  </span>
                </div>

                {items.some(i => i.status === 'pending') && (
                  <button
                    type="button"
                    onClick={processAllPending}
                    disabled={isProcessing}
                    className={`h-6 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      isLight ? 'bg-sky-500 text-white border-sky-600' : 'bg-[#00dbe7]/20 text-[#00dbe7] border-[#00dbe7]/40'
                    }`}
                  >
                    Process All
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      selectedItemId === item.id 
                        ? 'border-[#00dbe7] bg-[#00dbe7]/10 text-on-surface' 
                        : isLight ? 'bg-white border-slate-200 hover:bg-slate-100' : 'bg-[#121215] border-white/5 hover:bg-white/5 text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img 
                        src={item.cutoutUrl || item.originalUrl} 
                        alt="thumb" 
                        className="w-7 h-7 rounded object-cover border border-white/10 shrink-0 bg-black/20"
                      />
                      <span className="truncate text-[11px] font-medium">{item.originalName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : item.status === 'processing' ? (
                        <RefreshCw className="w-3.5 h-3.5 text-[#00dbe7] animate-spin shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => removeItem(item.id, e)}
                        className="p-1 hover:text-rose-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch Download All ZIP */}
              {items.some(i => i.status === 'done') && (
                <button
                  type="button"
                  onClick={downloadAllZip}
                  disabled={isProcessing}
                  className={`w-full h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                    isLight 
                      ? 'bg-slate-800 hover:bg-slate-900 text-white border-slate-800' 
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#00dbe7] border-[#00dbe7]/40 hover:border-[#00dbe7]'
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5 shrink-0" />
                  <span>Download All as ZIP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
