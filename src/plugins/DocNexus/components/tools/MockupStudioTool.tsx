import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  Laptop, 
  Shirt, 
  Layers, 
  UploadCloud, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  Palette, 
  Type, 
  Eye, 
  Zap, 
  FolderArchive,
  Image as ImageIcon
} from 'lucide-react';
import { ToolCommonProps } from './types.js';

type MockupCategory = 'thumbnail' | 'device' | 'apparel';
type DeviceType = 'macbook' | 'iphone' | 'dual';
type ApparelType = 'tshirt' | 'hoodie';

export default function MockupStudioTool({
  isLight,
  isProcessing,
  setIsProcessing,
  setStatus,
  setError,
  addLog,
  checkDownloadAccess
}: ToolCommonProps) {
  const [activeCategory, setActiveCategory] = useState<MockupCategory>('thumbnail');
  
  // Thumbnail State
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string>('');
  const [thumbnailTitle, setThumbnailTitle] = useState<string>('BUILD $10K/MO MICRO-SAAS');
  const [thumbnailSubtitle, setThumbnailSubtitle] = useState<string>('ZERO SERVER COST • 100% WEBGPU');
  const [accentColor, setAccentColor] = useState<string>('#00dbe7');
  const [backgroundTheme, setBackgroundTheme] = useState<'cyber' | 'gradient' | 'studio' | 'amber'>('cyber');
  const [enableStickerGlow, setEnableStickerGlow] = useState<boolean>(true);
  const [characterScale, setCharacterScale] = useState<number>(95); // percentage
  const [characterPositionX, setCharacterPositionX] = useState<number>(75); // percentage from left
  
  // Device Mockup State
  const [screenImage, setScreenImage] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('macbook');
  const [deviceAngle, setDeviceAngle] = useState<'perspective' | 'front'>('perspective');
  const [deviceBgColor, setDeviceBgColor] = useState<string>('#0b0f19');
  
  // Apparel Mockup State
  const [apparelGraphic, setApparelGraphic] = useState<string | null>(null);
  const [shirtColor, setShirtColor] = useState<string>('#1e293b');
  const [apparelType, setApparelType] = useState<ApparelType>('tshirt');
  
  // Common state
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetUploadType, setTargetUploadType] = useState<'character' | 'screen' | 'apparel'>('character');

  const handleUploadClick = (type: 'character' | 'screen' | 'apparel') => {
    setTargetUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (targetUploadType === 'character') {
        setCharacterImage(dataUrl);
        setCharacterName(file.name.replace(/\.[^/.]+$/, ''));
        addLog?.('INFO', `Loaded character asset "${file.name}" for YouTube thumbnail.`);
      } else if (targetUploadType === 'screen') {
        setScreenImage(dataUrl);
        addLog?.('INFO', `Loaded screen capture for 3D device mockup.`);
      } else if (targetUploadType === 'apparel') {
        setApparelGraphic(dataUrl);
        addLog?.('INFO', `Loaded graphic for apparel mockup.`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Re-draw Canvas when thumbnail properties change
  useEffect(() => {
    if (activeCategory === 'thumbnail') {
      renderThumbnailToCanvas();
    }
  }, [
    activeCategory, 
    characterImage, 
    thumbnailTitle, 
    thumbnailSubtitle, 
    accentColor, 
    backgroundTheme, 
    enableStickerGlow,
    characterScale,
    characterPositionX
  ]);

  const renderThumbnailToCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw Background Theme
    if (backgroundTheme === 'cyber') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0a0a0f');
      grad.addColorStop(0.5, '#12121a');
      grad.addColorStop(1, '#050508');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Cyber Grid & Lighting
      ctx.strokeStyle = 'rgba(0, 219, 231, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Neon Backlight Glow on Character Side
      const radGrad = ctx.createRadialGradient(width * 0.8, height * 0.5, 50, width * 0.8, height * 0.5, 450);
      radGrad.addColorStop(0, `${accentColor}40`);
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (backgroundTheme === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#312e81');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (backgroundTheme === 'studio') {
      const radGrad = ctx.createRadialGradient(width * 0.4, height * 0.4, 100, width * 0.5, height * 0.5, 600);
      radGrad.addColorStop(0, '#27272a');
      radGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#451a03');
      grad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Left Typography & Badges
    ctx.save();
    
    // Subtitle Badge Pill
    if (thumbnailSubtitle) {
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(80, 160, ctx.measureText(thumbnailSubtitle).width + 240, 38, 8);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px "SF Mono", "Roboto Mono", monospace';
      ctx.fillText(thumbnailSubtitle, 96, 185);
    }

    // Bold Headline Text (Word Wrapping)
    ctx.font = '900 68px "Inter", "system-ui", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;

    const words = thumbnailTitle.split(' ');
    let line = '';
    let y = 270;
    const maxWidth = 680;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.strokeText(line, 80, y);
        ctx.fillText(line, 80, y);
        line = words[n] + ' ';
        y += 82;
      } else {
        line = testLine;
      }
    }
    ctx.strokeText(line, 80, y);
    ctx.fillText(line, 80, y);

    // Accent line badge under title
    ctx.fillStyle = accentColor;
    ctx.fillRect(80, y + 25, 140, 8);
    ctx.restore();

    // 3. Draw Character Cutout with Signature YouTube White Sticker Glow
    if (characterImage) {
      const charImg = new Image();
      charImg.crossOrigin = 'anonymous';
      charImg.src = characterImage;

      await new Promise<void>((resolve) => {
        charImg.onload = () => {
          ctx.save();
          const targetHeight = (height * (characterScale / 100));
          const scaleRatio = targetHeight / charImg.naturalHeight;
          const targetWidth = charImg.naturalWidth * scaleRatio;
          
          const xPos = (width * (characterPositionX / 100)) - (targetWidth / 2);
          const yPos = height - targetHeight;

          // Apply YouTube White Sticker Glow + Depth Shadow
          if (enableStickerGlow) {
            // First pass: white border outline
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 18;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.drawImage(charImg, xPos, yPos, targetWidth, targetHeight);

            // Second pass: dramatic dark depth drop shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 40;
            ctx.shadowOffsetX = -10;
            ctx.shadowOffsetY = 25;
            ctx.drawImage(charImg, xPos, yPos, targetWidth, targetHeight);
          } else {
            ctx.drawImage(charImg, xPos, yPos, targetWidth, targetHeight);
          }

          ctx.restore();
          resolve();
        };
        charImg.onerror = () => resolve();
      });
    } else {
      // Placeholder silhouette box
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(width * 0.65, 120, 360, 520);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 20px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+ Drop Portrait / Cutout', width * 0.65 + 180, 380);
      ctx.restore();
    }
  };

  const downloadThumbnail = (format: 'png' | 'jpeg' = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube_thumbnail_1280x720.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('YouTube 1280x720 thumbnail downloaded successfully!');
      addLog?.('SUCCESS', `Exported high-CTR 1280x720 thumbnail (${format.toUpperCase()}).`);
    }, format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
  };

  const copyThumbnailToClipboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
        setStatus('Thumbnail copied to clipboard!');
      } catch (e: any) {
        setError?.(`Failed to copy: ${e.message}`);
      }
    });
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border shadow-sm space-y-6 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Hidden File Input */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/png,image/jpeg,image/webp" 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Main View Header with Standard Themed Icon Container */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                Automated Thumbnail & Mockup Studio
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                100% Deterministic CPU
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Generate high-CTR YouTube thumbnails, 3D device mockups & apparel without GPU diffusion hallucinations
            </p>
          </div>
        </div>

        {/* Sub-Category Switcher */}
        <div className={`flex rounded-lg p-0.5 border text-[11px] ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
        }`}>
          <button
            type="button"
            onClick={() => setActiveCategory('thumbnail')}
            className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              activeCategory === 'thumbnail'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>YouTube Thumbnail</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('device')}
            className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              activeCategory === 'device'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 shrink-0" />
            <span>3D Device Mockups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('apparel')}
            className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              activeCategory === 'apparel'
                ? isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 shrink-0" />
            <span>Apparel Mockup</span>
          </button>
        </div>
      </div>

      {/* CATEGORY 1: YOUTUBE THUMBNAIL STUDIO */}
      {activeCategory === 'thumbnail' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Canvas Preview (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10 text-xs font-mono">
                <span className="font-bold text-on-surface">1280 × 720 px (YouTube 16:9 Standard)</span>
                <span className="text-emerald-400 font-bold text-[10px]">Pixel-Perfect CSS Canvas</span>
              </div>

              {/* Responsive Aspect Ratio Container */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-300 dark:border-white/15 bg-black shadow-xl">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleUploadClick('character')}
                  className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-white/10'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                  <span>{characterImage ? 'Swap Cutout' : 'Upload Portrait'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyThumbnailToClipboard}
                    className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                      isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-white/10'
                    }`}
                  >
                    {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    <span>{copiedSuccess ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadThumbnail('png')}
                    className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border shadow-sm flex items-center gap-1.5 ${
                      isLight ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' : 'bg-[#00dbe7] hover:bg-[#74f5ff] text-slate-900 border-[#00dbe7]'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>Download 1280x720 PNG</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Title & Copy Controls */}
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`}>
              <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-white/10">
                <Type className="w-4 h-4 text-[#00dbe7] shrink-0" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                  Typography & Overlay
                </h4>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <label className="block text-[11px] text-on-surface-variant mb-1 font-bold">Main Headline</label>
                  <input 
                    type="text" 
                    value={thumbnailTitle} 
                    onChange={(e) => setThumbnailTitle(e.target.value)}
                    className={`w-full h-8 px-2.5 rounded border ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-white/15 text-white'
                    }`}
                    placeholder="Enter bold title"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-on-surface-variant mb-1 font-bold">Subtitle Badge</label>
                  <input 
                    type="text" 
                    value={thumbnailSubtitle} 
                    onChange={(e) => setThumbnailSubtitle(e.target.value)}
                    className={`w-full h-8 px-2.5 rounded border ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-white/15 text-white'
                    }`}
                    placeholder="Badge callout text"
                  />
                </div>
              </div>
            </div>

            {/* Background & Styling Controls */}
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`}>
              <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-white/10">
                <Palette className="w-4 h-4 text-[#00dbe7] shrink-0" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                  Theme & Accent
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {(['cyber', 'gradient', 'studio', 'amber'] as const).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setBackgroundTheme(theme)}
                    className={`p-2 rounded-lg border text-center capitalize cursor-pointer transition-all ${
                      backgroundTheme === theme 
                        ? 'border-[#00dbe7] bg-[#00dbe7]/15 text-[#00dbe7] font-bold' 
                        : isLight ? 'bg-white border-slate-300' : 'bg-[#201f21] border-white/10'
                    }`}
                  >
                    {theme} Theme
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface-variant">Accent Color</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={accentColor} 
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded border cursor-pointer shrink-0"
                  />
                  <span className="font-bold">{accentColor}</span>
                </div>
              </div>

              {/* YouTube Sticker Glow Toggle */}
              <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-slate-200 dark:border-white/10">
                <div>
                  <span className="font-bold text-on-surface block">YouTube Sticker Glow</span>
                  <span className="text-[10px] text-on-surface-variant">White border + depth shadow</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={enableStickerGlow} 
                  onChange={(e) => setEnableStickerGlow(e.target.checked)}
                  className="w-4 h-4 accent-[#00dbe7] cursor-pointer"
                />
              </div>

              {/* Character Positioning Sliders */}
              {characterImage && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Portrait Scale</span>
                    <span>{characterScale}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="140" 
                    value={characterScale} 
                    onChange={(e) => setCharacterScale(Number(e.target.value))}
                    className="w-full accent-[#00dbe7]"
                  />

                  <div className="flex justify-between pt-1">
                    <span className="text-on-surface-variant">Horizontal Position</span>
                    <span>{characterPositionX}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="90" 
                    value={characterPositionX} 
                    onChange={(e) => setCharacterPositionX(Number(e.target.value))}
                    className="w-full accent-[#00dbe7]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 2: 3D DEVICE MOCKUPS */}
      {activeCategory === 'device' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-6 rounded-xl border flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`} style={{ backgroundColor: deviceBgColor }}>
              
              {/* Interactive 3D Device Container */}
              <div 
                className="transition-transform duration-500 ease-out"
                style={{
                  perspective: '1200px',
                  transform: deviceAngle === 'perspective' ? 'rotateY(-12deg) rotateX(4deg)' : 'none'
                }}
              >
                {/* Realistic Laptop Bezel */}
                <div className="w-[320px] sm:w-[540px] rounded-2xl bg-[#1e2024] p-3 shadow-2xl border border-white/10 relative">
                  {/* Camera Dot */}
                  <div className="w-2 h-2 rounded-full bg-black/80 mx-auto mb-2 border border-white/20" />

                  {/* Screen Display Area */}
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-black relative border border-white/5 flex items-center justify-center">
                    {screenImage ? (
                      <img 
                        src={screenImage} 
                        alt="Screen" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        onClick={() => handleUploadClick('screen')}
                        className="text-center p-6 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <UploadCloud className="w-8 h-8 text-[#00dbe7] mx-auto mb-2" />
                        <span className="text-xs font-mono text-white/70 block">Click to upload website screenshot or app UI</span>
                      </div>
                    )}

                    {/* Realistic Glass Reflection Glare Overlay */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, transparent 60%)',
                        mixBlendMode: 'screen'
                      }}
                    />
                  </div>

                  {/* Laptop Base Hinge */}
                  <div className="h-2 w-full bg-[#141517] rounded-b-md mt-2 border-t border-white/10" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`}>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                Device Mockup Settings
              </h4>

              <div className="space-y-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleUploadClick('screen')}
                  className={`w-full h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                    isLight ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' : 'bg-[#00dbe7] hover:bg-[#74f5ff] text-slate-900 border-[#00dbe7]'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                  <span>{screenImage ? 'Replace Screen Image' : 'Upload UI Screenshot'}</span>
                </button>

                <div>
                  <label className="block text-[11px] text-on-surface-variant mb-1 font-bold">3D Perspective Angle</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeviceAngle('perspective')}
                      className={`p-2 rounded border cursor-pointer ${
                        deviceAngle === 'perspective' ? 'border-[#00dbe7] bg-[#00dbe7]/15 text-[#00dbe7] font-bold' : isLight ? 'bg-white' : 'bg-[#201f21]'
                      }`}
                    >
                      3D Isometric
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceAngle('front')}
                      className={`p-2 rounded border cursor-pointer ${
                        deviceAngle === 'front' ? 'border-[#00dbe7] bg-[#00dbe7]/15 text-[#00dbe7] font-bold' : isLight ? 'bg-white' : 'bg-[#201f21]'
                      }`}
                    >
                      Frontal Flat
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-on-surface-variant">Studio Backdrop</span>
                  <input 
                    type="color" 
                    value={deviceBgColor} 
                    onChange={(e) => setDeviceBgColor(e.target.value)}
                    className="w-7 h-7 rounded border cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 3: APPAREL & PRINT-ON-DEMAND MOCKUPS */}
      {activeCategory === 'apparel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-8 rounded-xl border flex flex-col items-center justify-center min-h-[460px] relative ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`}>
              {/* T-Shirt Vector / Canvas with Dynamic SVG Mask */}
              <div className="relative w-[320px] sm:w-[420px] aspect-square flex items-center justify-center">
                {/* SVG Silhouette colored by shirtColor state */}
                <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
                  {/* T-shirt Path with Dynamic Color Fill */}
                  <path 
                    d="M 120 40 L 170 80 Q 200 95 230 80 L 280 40 L 360 110 L 310 160 L 280 140 L 280 360 L 120 360 L 120 140 L 90 160 L 40 110 Z" 
                    fill={shirtColor}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2"
                  />
                </svg>

                {/* Injected User Graphic bounded by chest print area */}
                <div className="absolute top-[28%] w-[130px] h-[130px] flex items-center justify-center pointer-events-none">
                  {apparelGraphic ? (
                    <img 
                      src={apparelGraphic} 
                      alt="Graphic" 
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="border-2 border-dashed border-white/40 p-3 rounded-lg text-center">
                      <span className="text-[10px] font-mono text-white/70">Print Area (Chest)</span>
                    </div>
                  )}
                </div>

                {/* Fabric wrinkle overlay using mix-blend-mode */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.15) 0%, transparent 60%)',
                    mixBlendMode: 'overlay'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`}>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                Apparel Customization
              </h4>

              <div className="space-y-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleUploadClick('apparel')}
                  className={`w-full h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                    isLight ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' : 'bg-[#00dbe7] hover:bg-[#74f5ff] text-slate-900 border-[#00dbe7]'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                  <span>{apparelGraphic ? 'Change Print Graphic' : 'Upload Design Graphic'}</span>
                </button>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-on-surface-variant">Garment Color</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={shirtColor} 
                      onChange={(e) => setShirtColor(e.target.value)}
                      className="w-7 h-7 rounded border cursor-pointer shrink-0"
                    />
                    <span className="font-bold">{shirtColor}</span>
                  </div>
                </div>

                {/* Popular POD Color Palettes */}
                <div>
                  <span className="text-[11px] text-on-surface-variant block mb-1">Standard Colorways</span>
                  <div className="flex items-center gap-2">
                    {[
                      { name: 'Black', hex: '#0f172a' },
                      { name: 'Navy', hex: '#1e3a8a' },
                      { name: 'Heather', hex: '#64748b' },
                      { name: 'Forest', hex: '#14532d' },
                      { name: 'Burgundy', hex: '#881337' }
                    ].map(c => (
                      <div 
                        key={c.name}
                        onClick={() => setShirtColor(c.hex)}
                        title={c.name}
                        className="w-6 h-6 rounded-full border-2 border-white/30 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

