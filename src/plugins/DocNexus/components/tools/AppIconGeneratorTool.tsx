import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  Smartphone, 
  Globe, 
  Share2, 
  UploadCloud, 
  RefreshCw, 
  Sliders, 
  CheckCircle2,
  FileCode
} from 'lucide-react';
import JSZip from 'jszip';
import { ToolCommonProps } from './types';

interface GeneratedAsset {
  id: string;
  name: string;
  dimensions: string;
  category: 'web' | 'mobile' | 'social';
  blob: Blob;
  dataUrl: string;
}

export default function AppIconGeneratorTool({
  isLight,
  isProcessing,
  setIsProcessing,
  setStatus,
  setError,
  addLog,
  checkDownloadAccess
}: ToolCommonProps) {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [isTransparent, setIsTransparent] = useState<boolean>(true);
  const [paddingPct, setPaddingPct] = useState<number>(10);
  const [shape, setShape] = useState<'square' | 'squircle' | 'circle'>('squircle');
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('My App');
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'mobile' | 'social'>('all');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setSourceImage(img);
        setSourceName(file.name.replace(/\.[^/.]+$/, ''));
        addLog?.('INFO', `Loaded icon asset "${file.name}" (${img.width}x${img.height}px)`);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const renderIconToCanvas = (
    size: number, 
    customBg?: string, 
    customPadding?: number, 
    customShape?: 'square' | 'squircle' | 'circle'
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx || !sourceImage) return canvas;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw Background & Clip Path
    const activeShape = customShape || shape;
    ctx.save();
    if (activeShape === 'circle') {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    } else if (activeShape === 'squircle') {
      const radius = size * 0.22; // iOS standard squircle curvature
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();
    }

    if (!isTransparent || customBg) {
      ctx.fillStyle = customBg || bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    // 2. Draw Centered Source Image with Padding
    const pad = (size * (customPadding !== undefined ? customPadding : paddingPct)) / 100;
    const availDim = size - (pad * 2);
    const srcAspect = sourceImage.width / sourceImage.height;
    
    let drawW = availDim;
    let drawH = availDim;
    if (srcAspect > 1) {
      drawH = availDim / srcAspect;
    } else {
      drawW = availDim * srcAspect;
    }

    const drawX = (size - drawW) / 2;
    const drawY = (size - drawH) / 2;

    ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
    ctx.restore();

    return canvas;
  };

  // Re-generate all asset variants whenever image or settings change
  useEffect(() => {
    if (!sourceImage) return;

    let isMounted = true;
    const generateAll = async () => {
      setIsProcessing(true);
      try {
        const specs: { id: string; name: string; size: number; category: 'web' | 'mobile' | 'social'; shape?: 'square' | 'squircle' | 'circle'; bg?: string }[] = [
          // Web & PWA
          { id: 'fav-16', name: 'favicon-16x16.png', size: 16, category: 'web', shape: 'square' },
          { id: 'fav-32', name: 'favicon-32x32.png', size: 32, category: 'web', shape: 'square' },
          { id: 'fav-48', name: 'favicon-48x48.png', size: 48, category: 'web', shape: 'square' },
          { id: 'apple-touch', name: 'apple-touch-icon.png', size: 180, category: 'web', shape: 'squircle', bg: isTransparent ? '#ffffff' : undefined },
          { id: 'android-192', name: 'android-chrome-192x192.png', size: 192, category: 'web' },
          { id: 'android-512', name: 'android-chrome-512x512.png', size: 512, category: 'web' },
          
          // Mobile Store Icons
          { id: 'ios-1024', name: 'AppStore-1024x1024.png', size: 1024, category: 'mobile', shape: 'square', bg: isTransparent ? '#ffffff' : undefined },
          { id: 'android-play-512', name: 'GooglePlay-512x512.png', size: 512, category: 'mobile', shape: 'square', bg: isTransparent ? '#ffffff' : undefined },
          { id: 'ios-120', name: 'iPhone-Retina-120x120.png', size: 120, category: 'mobile', shape: 'squircle', bg: isTransparent ? '#ffffff' : undefined },
          { id: 'ios-167', name: 'iPad-Pro-167x167.png', size: 167, category: 'mobile', shape: 'squircle', bg: isTransparent ? '#ffffff' : undefined },

          // Social & Community
          { id: 'avatar-400', name: 'avatar-square-400x400.png', size: 400, category: 'social' },
          { id: 'discord-512', name: 'discord-icon-512x512.png', size: 512, category: 'social', shape: 'circle' }
        ];

        const results: GeneratedAsset[] = [];
        for (const spec of specs) {
          const canvas = renderIconToCanvas(spec.size, spec.bg, undefined, spec.shape);
          const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png'));
          results.push({
            id: spec.id,
            name: spec.name,
            dimensions: `${spec.size}x${spec.size}`,
            category: spec.category,
            blob,
            dataUrl: canvas.toDataURL('image/png')
          });
        }

        if (isMounted) {
          setGeneratedAssets(results);
          setStatus(`Successfully synthesized ${results.length} multi-resolution assets.`);
        }
      } catch (err: any) {
        if (isMounted) setError?.(`Failed to generate icons: ${err.message}`);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    generateAll();
    return () => { isMounted = false; };
  }, [sourceImage, bgColor, isTransparent, paddingPct, shape]);

  const handleDownloadSingle = (asset: GeneratedAsset) => {
    if (checkDownloadAccess && !checkDownloadAccess()) return;
    const url = URL.createObjectURL(asset.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZipPackage = async () => {
    if (checkDownloadAccess && !checkDownloadAccess()) return;
    if (generatedAssets.length === 0) return;

    setIsProcessing(true);
    setStatus('Packaging multi-resolution asset ZIP bundle...');

    try {
      const zip = new JSZip();
      
      // 1. Add all generated PNG icons
      for (const asset of generatedAssets) {
        zip.file(asset.name, asset.blob);
      }

      // 2. Synthesize multi-size favicon.ico (16, 32, 48)
      const fav32 = generatedAssets.find(a => a.id === 'fav-32');
      if (fav32) {
        zip.file('favicon.ico', fav32.blob); // Modern browsers read PNG format ICO directly
      }

      // 3. Web App Manifest
      const manifestJson = {
        name: appName,
        short_name: appName,
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
        theme_color: isTransparent ? '#00dbe7' : bgColor,
        background_color: isTransparent ? '#121215' : bgColor,
        display: 'standalone'
      };
      zip.file('site.webmanifest', JSON.stringify(manifestJson, null, 2));

      // 4. HTML Head Snippet
      const htmlSnippet = `<!-- SutharLabs Favicon & App Icon Meta Tags -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${isTransparent ? '#00dbe7' : bgColor}">`;
      zip.file('html_head_tags.html', htmlSnippet);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${sourceName || 'app'}_favicon_icon_bundle.zip`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      setStatus('Complete icon & favicon bundle downloaded successfully!');
      addLog?.('SUCCESS', `Exported full icon package (.ZIP) containing ${generatedAssets.length + 3} files.`);
    } catch (err: any) {
      setError?.(`Failed to generate ZIP bundle: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyHtmlSnippet = () => {
    const snippet = `<link rel="icon" type="image/x-icon" href="/favicon.ico">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredAssets = generatedAssets.filter(a => activeTab === 'all' || a.category === activeTab);

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border shadow-sm space-y-6 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Hidden File Input */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/png,image/jpeg,image/webp,image/svg+xml" 
        onChange={handleFileSelect} 
        className="hidden" 
      />

      {/* Upload Dropzone */}
      {!sourceImage ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
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
            <p className={`text-sm sm:text-base font-bold ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
              Upload Logo or Emblem (PNG, SVG, JPG, WebP)
            </p>
            <p className="text-xs text-on-surface-variant font-mono mt-1">
              Automatically generates multi-resolution Favicon.ico, Apple Touch Icon, Android Chrome & Store Icons
            </p>
          </div>
          <button
            type="button"
            className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-sky-500 hover:bg-sky-600 text-white shadow-sm mt-2 cursor-pointer"
          >
            Select Icon File
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Header & Image Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl border p-1 bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={sourceImage.src} alt="Source" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold truncate text-on-surface">{sourceName}</h3>
                <p className="text-[11px] font-mono text-on-surface-variant">
                  {sourceImage.naturalWidth} x {sourceImage.naturalHeight}px • High-DPI Source
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#1e1e24] hover:bg-[#272730] text-[#e5e1e4] border-white/10'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadZipPackage}
                disabled={isProcessing || generatedAssets.length === 0}
                className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm bg-sky-500 hover:bg-sky-600 text-white select-none transition-all ml-auto sm:ml-0"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download All (.ZIP)</span>
              </button>
            </div>
          </div>

          {/* Configuration Tooling Bar */}
          <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs ${
            isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-black/20 border-white/5'
          }`}>
            {/* Shape Preset */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-on-surface-variant block mb-1.5">
                Icon Mask / Shape
              </label>
              <div className={`flex rounded-lg p-0.5 border ${
                isLight ? 'bg-white border-slate-300' : 'bg-[#18181c] border-white/10'
              }`}>
                {(['square', 'squircle', 'circle'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShape(s)}
                    className={`flex-1 py-1 rounded text-[10px] font-mono font-bold uppercase capitalize cursor-pointer transition-all ${
                      shape === s
                        ? isLight ? 'bg-sky-500 text-white shadow-xs' : 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/40'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Padding Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-on-surface-variant">
                  Icon Padding
                </label>
                <span className="font-mono text-[10px] font-bold text-sky-400">{paddingPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                step="2"
                value={paddingPct}
                onChange={(e) => setPaddingPct(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Background Style */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-on-surface-variant">
                  Background Color
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTransparent}
                    onChange={(e) => setIsTransparent(e.target.checked)}
                    className="rounded accent-sky-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-on-surface-variant">Alpha</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  disabled={isTransparent}
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    setIsTransparent(false);
                  }}
                  className="w-8 h-8 rounded border p-0.5 cursor-pointer disabled:opacity-30 shrink-0"
                />
                <input
                  type="text"
                  value={isTransparent ? 'Transparent' : bgColor}
                  disabled={isTransparent}
                  onChange={(e) => setBgColor(e.target.value)}
                  className={`w-full h-8 px-2 rounded-lg font-mono text-xs border uppercase ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-white/10 text-[#e5e1e4]'
                  } disabled:opacity-40`}
                />
              </div>
            </div>

            {/* App Title for Manifest */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-on-surface-variant block mb-1.5">
                App / Brand Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My Application"
                className={`w-full h-8 px-2.5 rounded-lg font-mono text-xs border ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-white/10 text-[#e5e1e4]'
                }`}
              />
            </div>
          </div>

          {/* Interactive Mockup Previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mockup 1: Browser Tab Favicon */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-black/30 border-white/5'
            }`}>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-on-surface-variant">
                <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Browser Tab Live Preview</span>
              </div>
              <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 max-w-xs shadow-xs ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1e1e24] border-white/10 text-[#e5e1e4]'
              }`}>
                {generatedAssets.find(a => a.id === 'fav-32') && (
                  <img 
                    src={generatedAssets.find(a => a.id === 'fav-32')?.dataUrl} 
                    alt="Favicon" 
                    className="w-4 h-4 object-contain shrink-0" 
                  />
                )}
                <span className="text-xs font-sans font-medium truncate flex-1">{appName} • Developer Platform</span>
                <span className="text-[10px] text-on-surface-variant shrink-0">×</span>
              </div>
            </div>

            {/* Mockup 2: Mobile App Icon */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-black/30 border-white/5'
            }`}>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-on-surface-variant">
                <Smartphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Mobile Home Screen App Preview</span>
              </div>
              <div className="flex items-center gap-4">
                {generatedAssets.find(a => a.id === 'apple-touch') && (
                  <div className="flex flex-col items-center gap-1">
                    <img 
                      src={generatedAssets.find(a => a.id === 'apple-touch')?.dataUrl} 
                      alt="App Icon" 
                      className="w-14 h-14 rounded-2xl shadow-md border border-white/10 object-contain" 
                    />
                    <span className="text-[10px] font-sans font-semibold text-on-surface truncate max-w-[70px] text-center">
                      {appName}
                    </span>
                  </div>
                )}
                <div className="text-[11px] font-mono text-on-surface-variant space-y-1">
                  <p className="font-bold text-on-surface">iOS / Android Ready</p>
                  <p>Apple Touch Icon 180x180</p>
                  <p>Android Adaptive Icon 192x192</p>
                </div>
              </div>
            </div>
          </div>

          {/* HTML Snippet Box */}
          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isLight ? 'bg-slate-100/90 border-slate-300' : 'bg-[#18181d] border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>HTML &lt;head&gt; Meta Tags (Copy to your website)</span>
              </span>
              <button
                type="button"
                onClick={copyHtmlSnippet}
                className="text-[10px] font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied HTML!' : 'Copy Tags'}</span>
              </button>
            </div>
            <pre className="font-mono text-[10px] text-on-surface-variant overflow-x-auto p-2.5 rounded-lg bg-black/25 select-all leading-relaxed">
{`<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`}
            </pre>
          </div>

          {/* Category Tabs & Asset Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={`flex rounded-lg p-0.5 border text-[11px] ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
              }`}>
                {(['all', 'web', 'mobile', 'social'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveTab(cat)}
                    className={`px-3 py-1 rounded-md font-mono cursor-pointer uppercase transition-all ${
                      activeTab === cat
                        ? isLight
                          ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                          : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span className="text-xs font-mono text-on-surface-variant">
                {filteredAssets.length} assets ready
              </span>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredAssets.map(asset => (
                <div 
                  key={asset.id}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-between gap-2 text-center transition-all group ${
                    isLight ? 'bg-white border-slate-200 hover:border-sky-400' : 'bg-[#18181c] border-white/5 hover:border-[#00dbe7]/40'
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg bg-black/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={asset.dataUrl} alt={asset.name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-[11px] font-bold font-mono truncate text-on-surface">{asset.name}</p>
                    <p className="text-[9px] font-mono text-on-surface-variant opacity-75">{asset.dimensions}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(asset)}
                    className={`w-full py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      isLight 
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300' 
                        : 'bg-white/5 hover:bg-white/10 text-on-surface border-white/10'
                    }`}
                  >
                    <Download className="w-3 h-3 shrink-0" />
                    <span>Save</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

