import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Film, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Check, 
  Sliders, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Mic, 
  Palette, 
  Zap, 
  FolderArchive,
  Image as ImageIcon,
  Clock,
  Video
} from 'lucide-react';
import { ToolCommonProps } from './types.js';

export type AspectRatioType = '9:16' | '16:9' | '1:1' | '4:5';
export type VideoTemplateType = 'launch' | 'growth' | 'spotlight' | 'quote';

interface AspectRatioConfig {
  label: string;
  sub: string;
  width: number;
  height: number;
  cssAspect: string;
}

const ASPECT_RATIOS: Record<AspectRatioType, AspectRatioConfig> = {
  '9:16': { label: '9:16 Vertical', sub: 'Reels / Shorts / TikTok', width: 1080, height: 1920, cssAspect: '9/16' },
  '16:9': { label: '16:9 Horizontal', sub: 'YouTube / Desktop', width: 1920, height: 1080, cssAspect: '16/9' },
  '1:1': { label: '1:1 Square', sub: 'Instagram / Feed', width: 1080, height: 1080, cssAspect: '1/1' },
  '4:5': { label: '4:5 Portrait', sub: 'Social Posts', width: 1080, height: 1350, cssAspect: '4/5' }
};

const TEMPLATES: { id: VideoTemplateType; label: string; desc: string; icon: any }[] = [
  { id: 'launch', label: 'Tech Launch', desc: 'Kinetic HUD & matrix grid', icon: Sparkles },
  { id: 'growth', label: 'Metric Ticker', desc: 'Animated chart & ROI pulse', icon: TrendingUp },
  { id: 'spotlight', label: 'Product Glow', desc: 'Radial flare & particle halo', icon: Layers },
  { id: 'quote', label: 'Social Hook', desc: 'Audio soundwave & bold quote', icon: Mic }
];

const PRESET_COLORS = ['#00dbe7', '#a855f7', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6'];

export default function MotionVideoStudioTool({
  isLight,
  isProcessing,
  setIsProcessing,
  setStatus,
  setError,
  addLog,
  checkDownloadAccess
}: ToolCommonProps) {
  // Video Configuration
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('9:16');
  const [template, setTemplate] = useState<VideoTemplateType>('launch');
  const [badgeText, setBadgeText] = useState<string>('SUTHARLABS 2.0');
  const [titleText, setTitleText] = useState<string>('BUILD NEXT-GEN AI AT THE EDGE');
  const [subtitleText, setSubtitleText] = useState<string>('Zero server latency • 100% Client WebGPU');
  const [ctaText, setCtaText] = useState<string>('GET INSTANT ACCESS →');
  const [accentColor, setAccentColor] = useState<string>('#00dbe7');
  const [durationSec, setDurationSec] = useState<number>(5);
  const [targetFps, setTargetFps] = useState<number>(30);

  // Playback & Recording State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [vaultSaved, setVaultSaved] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const currentTimeRef = useRef<number>(0);

  // Keep ref in sync
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Current Aspect Ratio dimensions
  const activeAspect = ASPECT_RATIOS[aspectRatio];

  // Particle Cache for animation
  const particlesRef = useRef<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);

  // Initialize particles
  useEffect(() => {
    const pts = [];
    for (let i = 0; i < 40; i++) {
      pts.push({
        x: Math.random(),
        y: Math.random(),
        size: 1 + Math.random() * 3,
        speed: 0.2 + Math.random() * 0.8,
        opacity: 0.1 + Math.random() * 0.5
      });
    }
    particlesRef.current = pts;
  }, []);

  // Main Render Frame Function
  const renderFrame = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const progress = (time % durationSec) / durationSec;
    ctx.clearRect(0, 0, width, height);

    // 1. Dark Sovereign Background
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.8);
    bgGrad.addColorStop(0, '#131317');
    bgGrad.addColorStop(1, '#08080a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Scale factors based on aspect ratio
    const isVertical = height > width;
    const baseFontSize = isVertical ? width * 0.075 : height * 0.085;

    // 2. Render Template-Specific Dynamic Visuals
    if (template === 'launch') {
      // Tech Matrix / Kinetic HUD
      // Background Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Moving Glow Orb
      const orbX = width / 2 + Math.sin(time * 1.5) * (width * 0.2);
      const orbY = height * 0.35 + Math.cos(time * 1.2) * (height * 0.08);
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, width * 0.45);
      orbGrad.addColorStop(0, `${accentColor}33`);
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orbX, orbY, width * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Tech Frame Lines (Corners)
      ctx.strokeStyle = `${accentColor}88`;
      ctx.lineWidth = 3;
      const cornerLen = 50;
      const pad = 40;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(pad, pad + cornerLen);
      ctx.lineTo(pad, pad);
      ctx.lineTo(pad + cornerLen, pad);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(width - pad - cornerLen, pad);
      ctx.lineTo(width - pad, pad);
      ctx.lineTo(width - pad, pad + cornerLen);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(pad, height - pad - cornerLen);
      ctx.lineTo(pad, height - pad);
      ctx.lineTo(pad + cornerLen, height - pad);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(width - pad - cornerLen, height - pad);
      ctx.lineTo(width - pad, height - pad);
      ctx.lineTo(width - pad, height - pad - cornerLen);
      ctx.stroke();

    } else if (template === 'growth') {
      // FinTech / Growth Metric Chart
      // Animated Spline Chart Line
      ctx.save();
      const chartPoints = 12;
      const chartWidth = width * 0.8;
      const chartHeight = height * 0.25;
      const startX = width * 0.1;
      const startY = height * (isVertical ? 0.65 : 0.68);

      ctx.beginPath();
      for (let i = 0; i <= chartPoints; i++) {
        const x = startX + (chartWidth / chartPoints) * i;
        const normalizedI = i / chartPoints;
        const trend = Math.pow(normalizedI, 1.4);
        const wave = Math.sin(normalizedI * 6 + time * 2) * 0.15;
        const y = startY - (trend + wave) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 6;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();

      // Pulsing Metric Pill
      const pulseScale = 1 + Math.sin(time * 4) * 0.04;
      ctx.save();
      ctx.translate(width / 2, height * (isVertical ? 0.38 : 0.35));
      ctx.scale(pulseScale, pulseScale);
      ctx.fillStyle = `${accentColor}18`;
      ctx.strokeStyle = `${accentColor}66`;
      ctx.lineWidth = 2;
      const pillW = 280;
      const pillH = 60;
      ctx.beginPath();
      ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+342.8% YoY', 0, 0);
      ctx.restore();

    } else if (template === 'spotlight') {
      // Neon Product Spotlight / Halo
      const cx = width / 2;
      const cy = height * (isVertical ? 0.42 : 0.45);

      // Rotating Particle Aura
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.5);
      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI * 2 / 8) * i;
        const rad = Math.min(width, height) * 0.28 + Math.sin(time * 3 + i) * 15;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        ctx.fillStyle = `${accentColor}aa`;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Central Pulsing Core Ring
      ctx.save();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      const ringRad = Math.min(width, height) * 0.18 + Math.sin(time * 2.5) * 8;
      ctx.arc(cx, cy, ringRad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

    } else if (template === 'quote') {
      // Audio Waveform Soundwave Hook
      const barCount = 28;
      const barSpacing = Math.min(width * 0.75, 600) / barCount;
      const startX = (width - (barCount * barSpacing)) / 2;
      const midY = height * (isVertical ? 0.35 : 0.32);

      for (let i = 0; i < barCount; i++) {
        const phase = i * 0.4 + time * 5;
        const barH = 15 + Math.abs(Math.sin(phase) * Math.cos(phase * 0.5)) * 90;
        const bx = startX + i * barSpacing;
        ctx.fillStyle = `${accentColor}${Math.floor(180 + Math.sin(phase) * 60).toString(16).padStart(2, '0')}`;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(bx, midY - barH / 2, barSpacing * 0.6, barH, 4);
        ctx.fill();
      }
    }

    // 3. Render Floating Ambient Particles
    particlesRef.current.forEach(p => {
      const px = p.x * width;
      const py = ((p.y + (time * p.speed * 0.05)) % 1) * height;
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.4})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Render Typography & Content Badges
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // A. Top Pill Badge
    const badgeY = height * (isVertical ? 0.16 : 0.14);
    ctx.save();
    ctx.font = 'bold 20px monospace';
    const badgeMetrics = ctx.measureText(badgeText);
    const bPadX = 24;
    const bPadY = 12;
    const bW = badgeMetrics.width + bPadX * 2;
    const bH = 38;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = `${accentColor}88`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(width / 2 - bW / 2, badgeY - bH / 2, bW, bH, 19);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.fillText(badgeText, width / 2, badgeY);
    ctx.restore();

    // B. Hero Headline Title (with dynamic kinetic slide-in / subtle scale)
    const titleY = height * (isVertical ? 0.54 : 0.48);
    ctx.save();
    ctx.font = `900 ${baseFontSize}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 20;

    // Word Wrap Title if too wide
    const maxTitleW = width * 0.85;
    const words = titleText.split(' ');
    let line = '';
    const lines: string[] = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleW && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    const lineHeight = baseFontSize * 1.15;
    const totalBlockH = lines.length * lineHeight;
    const startTextY = titleY - totalBlockH / 2 + lineHeight / 2;

    lines.forEach((l, lIdx) => {
      ctx.fillText(l, width / 2, startTextY + lIdx * lineHeight);
    });
    ctx.restore();

    // C. Subtitle Description
    const subY = height * (isVertical ? 0.70 : 0.72);
    ctx.save();
    ctx.font = `500 ${baseFontSize * 0.38}px sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(subtitleText, width / 2, subY);
    ctx.restore();

    // D. Call To Action Button
    if (ctaText.trim()) {
      const ctaY = height * (isVertical ? 0.82 : 0.84);
      ctx.save();
      ctx.font = `bold ${baseFontSize * 0.34}px monospace`;
      const ctaMetrics = ctx.measureText(ctaText);
      const ctaW = ctaMetrics.width + 56;
      const ctaH = baseFontSize * 0.72;

      // Glowing Button Body
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(width / 2 - ctaW / 2, ctaY - ctaH / 2, ctaW, ctaH, 12);
      ctx.fill();

      // Button Text
      ctx.fillStyle = '#08080a';
      ctx.shadowBlur = 0;
      ctx.fillText(ctaText, width / 2, ctaY);
      ctx.restore();
    }

    // 5. Video Progress Bar at Bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, height - 8, width, 8);
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, height - 8, width * progress, 8);
  }, [template, badgeText, titleText, subtitleText, ctaText, accentColor, durationSec]);

  // Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localIsPlaying = isPlaying;
    const loop = (timestamp: number) => {
      if (localIsPlaying && !isExporting) {
        const delta = (timestamp - lastTimeRef.current) / 1000;
        const newTime = (currentTimeRef.current + delta) % durationSec;
        currentTimeRef.current = newTime;
        setCurrentTime(newTime);
      }
      lastTimeRef.current = timestamp;

      renderFrame(ctx, activeAspect.width, activeAspect.height, currentTimeRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, isExporting, durationSec, activeAspect, renderFrame]);

  // Video Export Engine (Client-side MediaRecorder)
  const handleExportVideo = async () => {
    if (checkDownloadAccess && !checkDownloadAccess()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    setIsProcessing(true);
    setStatus('Rendering motion video frames...');
    setExportProgress(0);
    setError(null);
    addLog('INFO', `Starting video render: ${aspectRatio} at ${targetFps} FPS, duration: ${durationSec}s`);

    try {
      // 1. Determine optimal MIME type
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4;codecs=avc1';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      // 2. Capture Canvas Stream
      const stream = canvas.captureStream(targetFps);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000 // 8 Mbps high bitrate
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const renderPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: mimeType });
          resolve(videoBlob);
        };
        recorder.onerror = (e) => reject(e);
      });

      // 3. Drive Frame Rendering Sequentially
      recorder.start();
      const totalFrames = durationSec * targetFps;
      const ctx = canvas.getContext('2d')!;

      for (let f = 0; f < totalFrames; f++) {
        const frameTime = (f / targetFps);
        currentTimeRef.current = frameTime;
        setCurrentTime(frameTime);
        renderFrame(ctx, activeAspect.width, activeAspect.height, frameTime);

        // Advance progress
        const pct = Math.round(((f + 1) / totalFrames) * 100);
        setExportProgress(pct);

        // Yield to browser execution for smooth rendering
        await new Promise(r => setTimeout(r, 1000 / targetFps));
      }

      recorder.stop();
      const videoBlob = await renderPromise;

      // 4. Trigger Download
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `sutharlabs-motion-${template}-${aspectRatio.replace(':', 'x')}.${extension}`;
      const downloadUrl = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
      setStatus('Video rendered and downloaded successfully!');
      addLog('SUCCESS', `Exported ${fileName} (${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB)`);
    } catch (err: any) {
      console.error('Export video failed:', err);
      setError(err?.message || 'Failed to export video');
      addLog('ERROR', `Video export error: ${err?.message}`);
    } finally {
      setIsExporting(false);
      setIsProcessing(false);
      setIsPlaying(true);
    }
  };

  // Snapshot Poster Frame Export
  const handleSavePosterFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `sutharlabs-frame-${template}-${aspectRatio.replace(':', 'x')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addLog('SUCCESS', 'Poster frame saved as PNG');
    } catch (e: any) {
      setError('Failed to capture snapshot');
    }
  };

  // Save to File Vault
  const handleSaveToVault = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsProcessing(true);
    setStatus('Saving snapshot to File Vault...');
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('Could not create image blob');

      const formData = new FormData();
      formData.append('file', blob, `motion-snapshot-${template}-${Date.now()}.png`);

      const res = await fetch('/api/blob/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setVaultSaved(true);
      setTimeout(() => setVaultSaved(false), 3000);
      setStatus('Saved to File Vault successfully!');
      addLog('SUCCESS', 'Motion graphic frame saved to File Vault');
    } catch (err: any) {
      setError(err.message || 'Failed to save to File Vault');
      addLog('ERROR', `Vault save error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline/10">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Film className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
              Motion Graphic & Social Reel Studio
            </h2>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Kinetic HTML5 Video Generator • 9:16 Vertical, 16:9 Landscape & 1:1 Square • In-Browser Rendering
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <button
            type="button"
            onClick={handleSavePosterFrame}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Poster PNG</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToVault}
            disabled={isProcessing}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              vaultSaved
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5 shrink-0" />
            <span>{vaultSaved ? 'Vaulted!' : 'Save Vault'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportVideo}
            disabled={isProcessing || isExporting}
            className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              savedSuccess
                ? 'bg-emerald-500 text-white border-emerald-600'
                : isLight
                ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 font-bold'
                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 hover:border-[#00dbe7]'
            }`}
          >
            {savedSuccess ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-white" />
            ) : isExporting ? (
              <RotateCcw className="w-3.5 h-3.5 shrink-0 animate-spin" />
            ) : (
              <Video className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{isExporting ? `Rendering ${exportProgress}%` : savedSuccess ? 'Rendered!' : 'Export Video'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Canvas Preview Player & Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Canvas Wrapper */}
          <div className={`p-4 rounded-2xl border shadow-xl flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
            isLight ? 'bg-slate-900 border-slate-700' : 'bg-[#0f0f12] border-[#3a494b]/50'
          }`}>
            {/* Visual Screen Container */}
            <div 
              className="relative max-h-[520px] w-auto max-w-full rounded-xl overflow-hidden shadow-2xl flex items-center justify-center bg-black border border-white/10"
              style={{ aspectRatio: activeAspect.cssAspect }}
            >
              <canvas
                ref={canvasRef}
                width={activeAspect.width}
                height={activeAspect.height}
                className="w-full h-full object-contain"
              />

              {/* Rendering Overlay */}
              {isExporting && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
                  <RotateCcw className="w-10 h-10 text-[#00dbe7] animate-spin mb-3 shrink-0" />
                  <p className="text-white font-mono font-bold text-sm tracking-wider">
                    COMPOSITING VIDEO STREAM
                  </p>
                  <p className="text-xs text-gray-400 font-mono mt-1">
                    Frame capture in progress • {exportProgress}%
                  </p>
                  <div className="w-48 h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="h-full bg-[#00dbe7] transition-all duration-100"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Playback Controls & Timeline Bar */}
            <div className="w-full mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    currentTimeRef.current = 0;
                    setCurrentTime(0);
                  }}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Rewind to start"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                </button>
                <span className="text-gray-300">
                  {currentTime.toFixed(1)}s / {durationSec}.0s
                </span>
              </div>

              {/* Scrub Slider */}
              <input
                type="range"
                min="0"
                max={durationSec}
                step="0.05"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  currentTimeRef.current = val;
                  setCurrentTime(val);
                }}
                className="flex-1 mx-2 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#00dbe7]"
              />

              <div className="text-[11px] text-gray-400 shrink-0">
                {activeAspect.width}×{activeAspect.height}
              </div>
            </div>
          </div>

          {/* Quick Specs Callout */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#18181c]/60 border-[#3a494b]/30 text-gray-300'
          }`}>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>Canvas 60 FPS Engine</span>
            </span>
            <span>VP9 / AVC1 High Bitrate</span>
            <span className="text-emerald-500 font-bold">100% In-Browser</span>
          </div>
        </div>

        {/* Right Column: Aspect Ratio, Templates & Customizer (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Aspect Ratio Selector */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131315] border-[#3a494b]/50'
          }`}>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-on-surface mb-2.5">
              1. Aspect Ratio Configuration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ASPECT_RATIOS) as AspectRatioType[]).map((arKey) => {
                const item = ASPECT_RATIOS[arKey];
                const isSelected = aspectRatio === arKey;
                return (
                  <button
                    key={arKey}
                    type="button"
                    onClick={() => setAspectRatio(arKey)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-xs'
                          : 'bg-[#00dbe7]/10 border-[#00dbe7] text-[#00dbe7] shadow-xs'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300'
                    }`}
                  >
                    <div className="font-mono font-bold text-xs">{item.label}</div>
                    <div className="text-[10px] opacity-75 truncate">{item.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Motion Graphic Template Selection */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131315] border-[#3a494b]/50'
          }`}>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-on-surface mb-2.5">
              2. Kinetic Motion Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => {
                const IconComponent = tmpl.icon;
                const isSelected = template === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setTemplate(tmpl.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-xs'
                          : 'bg-[#00dbe7]/10 border-[#00dbe7] text-[#00dbe7] shadow-xs'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-xs">{tmpl.label}</div>
                      <div className="text-[10px] opacity-75 truncate">{tmpl.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Text & Content Fields */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131315] border-[#3a494b]/50'
          }`}>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
              3. Text & Typography Overlays
            </label>

            <div>
              <span className="block text-[11px] font-mono text-on-surface-variant mb-1">Top Badge Pill</span>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-hidden ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#00dbe7]'
                }`}
                placeholder="e.g. SUTHARLABS 2.0"
              />
            </div>

            <div>
              <span className="block text-[11px] font-mono text-on-surface-variant mb-1">Headline Hook Text</span>
              <textarea
                rows={2}
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-sans font-bold border focus:outline-hidden resize-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#00dbe7]'
                }`}
                placeholder="Headline hook text..."
              />
            </div>

            <div>
              <span className="block text-[11px] font-mono text-on-surface-variant mb-1">Subtitle / Value Proposition</span>
              <input
                type="text"
                value={subtitleText}
                onChange={(e) => setSubtitleText(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-sans border focus:outline-hidden ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#00dbe7]'
                }`}
                placeholder="Secondary description..."
              />
            </div>

            <div>
              <span className="block text-[11px] font-mono text-on-surface-variant mb-1">Call To Action Button</span>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-hidden ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#00dbe7]'
                }`}
                placeholder="e.g. GET STARTED NOW →"
              />
            </div>
          </div>

          {/* 4. Color, Duration & FPS Config */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131315] border-[#3a494b]/50'
          }`}>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
              4. Palette & Duration Controls
            </label>

            {/* Color Swatches */}
            <div>
              <span className="block text-[11px] font-mono text-on-surface-variant mb-1.5">Neon Accent Color</span>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccentColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer shrink-0 ${
                      accentColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Duration & FPS Row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="block text-[11px] font-mono text-on-surface-variant mb-1">Duration</span>
                <select
                  value={durationSec}
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <option value={3}>3 Seconds</option>
                  <option value={5}>5 Seconds (Recommended)</option>
                  <option value={10}>10 Seconds</option>
                  <option value={15}>15 Seconds</option>
                </select>
              </div>

              <div>
                <span className="block text-[11px] font-mono text-on-surface-variant mb-1">Frame Rate</span>
                <select
                  value={targetFps}
                  onChange={(e) => setTargetFps(Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <option value={30}>30 FPS (Faster render)</option>
                  <option value={60}>60 FPS (Ultra smooth)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

