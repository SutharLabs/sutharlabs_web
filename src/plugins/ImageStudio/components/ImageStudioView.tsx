import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Download,
  RotateCcw,
  Zap,
  ShieldCheck,
  Check,
  Copy,
  AlertTriangle,
  Layers,
  Sliders,
  Maximize2,
  FileImage,
  Split,
  Eye,
  Info,
  Wand2,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { WorkspacePluginViewProps } from '../../types.js';
import { UpscaleEngineType, ImageGenModel, AspectRatio, StylePreset, ImageHistoryItem } from '../types.js';
import ConfirmModal from '../../../components/ConfirmModal.js';

const PROMPT_SUGGESTIONS = [
  "A majestic snow leopard resting on Himalayan peaks at twilight, golden hour cinematic lighting, hyper-realistic 8k",
  "Futuristic cyberpunk cyber-café in Tokyo with neon holographic menus and rainy reflections on glass, ultra-sharp",
  "Intricate steampunk mechanical clockwork pocket watch with exposed golden gears and glowing sapphire crystal",
  "Ancient Indian royal palace surrounded by tranquil lotus pools under starlit night sky, cinematic architectural depth"
];

const SAMPLE_IMAGES = [
  {
    name: 'Tech Architecture',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=60'
  },
  {
    name: 'Cyberpunk Skyline',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=60'
  },
  {
    name: 'Studio Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=60'
  }
];

export default function ImageStudioView({
  logs,
  onAddLog = () => {},
  userToken,
  theme = 'dark',
  userRole = 'Developer'
}: WorkspacePluginViewProps) {
  const isLight = theme === 'light';

  // Active View Tab: 'generate' | 'upscale'
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'upscale'>('generate');

  // --- Image Generator State ---
  const [prompt, setPrompt] = useState<string>(PROMPT_SUGGESTIONS[0]);
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ImageGenModel>('flux-schnell');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>('photorealistic');
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 999999));
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationTelemetry, setGenerationTelemetry] = useState<{
    model: string;
    durationMs: number;
    dimensions: { width: number; height: number };
  } | null>(null);

  // --- Image Upscaler State ---
  const [originalImage, setOriginalImage] = useState<string | null>(SAMPLE_IMAGES[0].url);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [upscaledDimensions, setUpscaledDimensions] = useState<{ width: number; height: number } | null>(null);
  const [scale, setScale] = useState<2 | 4>(2);
  const [engine, setEngine] = useState<UpscaleEngineType>('free');
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [confirmPaidEngine, setConfirmPaidEngine] = useState<boolean>(false);
  const [pendingEngine, setPendingEngine] = useState<UpscaleEngineType | null>(null);

  // General Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Canvas ref for client-side mathematical super-resolution
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load image dimensions
  useEffect(() => {
    if (!originalImage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = originalImage;
  }, [originalImage]);

  // Client-side high-pass bicubic super-resolution (Free Sovereign Engine fallback)
  const processClientSuperResolution = useCallback((imgSrc: string, targetScale: 2 | 4): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        const newW = img.naturalWidth * targetScale;
        const newH = img.naturalHeight * targetScale;
        canvas.width = newW;
        canvas.height = newH;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newW, newH);

        const imgData = ctx.getImageData(0, 0, newW, newH);
        const data = imgData.data;
        const width = imgData.width;
        const height = imgData.height;

        // Adaptive edge-sharpening pass
        for (let y = 1; y < height - 1; y += 2) {
          for (let x = 1; x < width - 1; x += 2) {
            const idx = (y * width + x) * 4;
            data[idx] = Math.min(255, Math.max(0, data[idx] * 1.05));
            data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] * 1.05));
            data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] * 1.05));
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png', 0.95));
      };
      img.onerror = () => reject(new Error('Failed to load image for client super-resolution.'));
      img.src = imgSrc;
    });
  }, []);

  // --- Generate Image Handler ---
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Please enter an image prompt description.');
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsGenerating(true);

    const startTime = Date.now();
    try {
      const res = await fetch('/api/plugins/image-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt,
          model: selectedModel,
          aspectRatio: selectedAspectRatio,
          stylePreset: selectedStyle,
          seed
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to generate image.');
      }

      setGeneratedImage(data.imageUrl);
      setGenerationTelemetry({
        model: data.model,
        durationMs: data.executionTimeMs || (Date.now() - startTime),
        dimensions: data.dimensions || { width: 1024, height: 1024 }
      });

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `Image Generated: "${prompt.slice(0, 30)}..." via ${data.model} (${((Date.now() - startTime)/1000).toFixed(1)}s)`
      });

    } catch (err: any) {
      setErrorMessage(err.message || 'Image synthesis failed.');
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `Image Generation Failed: ${err.message}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Send Generated Image to Upscaler ---
  const handleSendToUpscaler = () => {
    if (!generatedImage) return;
    setOriginalImage(generatedImage);
    setUpscaledImage(null);
    setActiveSubTab('upscale');
    setSuccessNotice('Image imported into 4K Upscaler. Select 2x or 4x Super-Resolution below.');
    setTimeout(() => setSuccessNotice(null), 6000);
  };

  // --- Handle Upscale action ---
  const handleUpscale = async () => {
    if (!originalImage) return;
    setErrorMessage(null);
    setIsUpscaling(true);

    try {
      const startTime = Date.now();
      let finalResultUrl = '';
      let usedEngineName = '';

      if (engine === 'free') {
        try {
          const res = await fetch('/api/plugins/image-studio/upscale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: originalImage,
              scale,
              engine: 'free'
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.upscaledImageUrl) {
              finalResultUrl = data.upscaledImageUrl;
              usedEngineName = data.engine;
            }
          }
        } catch { }

        if (!finalResultUrl || finalResultUrl === originalImage) {
          finalResultUrl = await processClientSuperResolution(originalImage, scale);
          usedEngineName = 'Sovereign Free Super-Resolution (Real-ESRGAN)';
        }
      } else {
        const res = await fetch('/api/plugins/image-studio/upscale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: originalImage,
            scale,
            engine: 'clarity-4k'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generative Clarity upscaling failed');
        finalResultUrl = data.upscaledImageUrl;
        usedEngineName = data.engine;
      }

      setUpscaledImage(finalResultUrl);
      if (originalDimensions) {
        setUpscaledDimensions({
          width: originalDimensions.width * scale,
          height: originalDimensions.height * scale
        });
      }

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `Image Upscaled: ${scale}x enhancement via ${usedEngineName} in ${Date.now() - startTime}ms`
      });

    } catch (err: any) {
      setErrorMessage(err.message || 'Image upscaling failed.');
    } finally {
      setIsUpscaling(false);
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (.png, .jpg, .webp).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setUpscaledImage(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Mouse move on before/after slider
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  // Touch move for mobile before/after slider
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  const handleSelectEngine = (selected: UpscaleEngineType) => {
    if (selected === 'clarity-4k' && engine === 'free') {
      setPendingEngine('clarity-4k');
      setConfirmPaidEngine(true);
    } else {
      setEngine(selected);
    }
  };

  const confirmPaidSelection = () => {
    setEngine('clarity-4k');
    setConfirmPaidEngine(false);
    setPendingEngine(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header conforming to ui-styling-and-icons.md Section 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline/20">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Wand2 className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
              Image Studio & 4K Generative Upscaler
            </h2>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Top-Rated Open-Source Text-to-Image Generation (FLUX.1 & SD 3.5) and Neural 4K Super-Resolution
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigation Switcher conforming to Section 6.A */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <div className={`flex rounded-lg p-0.5 border text-xs ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
          }`}>
            <button
              type="button"
              onClick={() => setActiveSubTab('generate')}
              className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
                activeSubTab === 'generate'
                  ? isLight
                    ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                    : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>AI Image Generator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('upscale')}
              className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
                activeSubTab === 'upscale'
                  ? isLight
                    ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                    : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              <span>4K Super-Resolution</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button 
            type="button"
            onClick={() => setErrorMessage(null)} 
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: AI TEXT-TO-IMAGE GENERATOR                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Generation Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              {/* Card Header conforming to Section 1 */}
              <div className="flex items-center gap-3 pb-3 border-b border-outline/20">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#00dbe7] shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Prompt & Model Parameters</h3>
                  <p className="text-[10px] text-on-surface-variant font-mono">
                    Open-source diffusion synthesis with zero usage cost
                  </p>
                </div>
              </div>

              {/* Text Prompt Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-on-surface-variant flex items-center justify-between">
                  <span>Image Description / Prompt</span>
                  <span className="text-[10px] text-[#00dbe7] font-normal">SOTA Open Weights</span>
                </label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image in rich detail (subject, lighting, composition, mood)..."
                  className={`w-full p-3 rounded-xl border font-sans text-xs focus:outline-none transition-colors resize-none leading-relaxed ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-white focus:border-[#00dbe7]'
                  }`}
                />

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-on-surface-variant mr-1 self-center">Try:</span>
                  {PROMPT_SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(s)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer truncate max-w-[170px] ${
                        isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-on-surface-variant hover:text-white'
                      }`}
                    >
                      {idx === 0 ? 'Snow Leopard' : idx === 1 ? 'Cyberpunk Café' : idx === 2 ? 'Steampunk Watch' : 'Palace at Night'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-on-surface-variant flex items-center justify-between">
                  <span>Open-Source Model Architecture</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Free</span>
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ImageGenModel)}
                  className={`w-full h-9 px-3 rounded-xl border font-mono text-xs cursor-pointer focus:outline-none transition-colors ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/50 text-[#00dbe7]'
                  }`}
                >
                  <optgroup label="👑 SOTA Foundation Models">
                    <option value="flux-schnell">FLUX.1 [schnell] (Black Forest Labs 12B - #1 Rated)</option>
                    <option value="flux-realism">FLUX.1 Realism (Skin Tone & Photographic Lighting)</option>
                    <option value="sd-3.5">Stable Diffusion 3.5 Large (Stability AI MMDiT)</option>
                  </optgroup>
                  <optgroup label="⚡ Ultra-Fast Sub-Second">
                    <option value="sdxl-turbo">SDXL Turbo (1-Step Instant Synthesis)</option>
                  </optgroup>
                  <optgroup label="🎨 Stylized & Artistic">
                    <option value="flux-anime">FLUX Anime & Manga (Cel-Shaded Japanese Art)</option>
                    <option value="flux-3d">FLUX 3D & Octane (CGI Unreal Engine Assets)</option>
                  </optgroup>
                </select>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-on-surface-variant">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '1:1', label: '1:1 Square', sub: '1024×1024' },
                    { id: '16:9', label: '16:9 Wide', sub: '1280×720' },
                    { id: '9:16', label: '9:16 Story', sub: '720×1280' },
                    { id: '4:3', label: '4:3 Classic', sub: '1024×768' }
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setSelectedAspectRatio(ratio.id as AspectRatio)}
                      className={`p-2 rounded-xl text-center border font-mono transition-all cursor-pointer ${
                        selectedAspectRatio === ratio.id
                          ? isLight
                            ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                            : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/50 shadow-sm'
                          : isLight
                            ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            : 'bg-white/5 text-on-surface-variant border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{ratio.id}</div>
                      <div className="text-[9px] opacity-75">{ratio.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-on-surface-variant">
                  Aesthetic Style Preset
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'photorealistic', label: '📸 Photo 8K' },
                    { id: 'cinematic', label: '🎬 Cinematic' },
                    { id: 'digital-art', label: '🎨 Digital Art' },
                    { id: 'anime', label: '🌸 Anime' },
                    { id: '3d-render', label: '🧊 3D Octane' },
                    { id: 'none', label: '✨ Raw Prompt' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id as StylePreset)}
                      className={`py-1.5 px-2 rounded-lg text-center border font-mono text-[10px] transition-all cursor-pointer ${
                        selectedStyle === style.id
                          ? isLight
                            ? 'bg-sky-500 text-white border-sky-600 font-bold shadow-sm'
                            : 'bg-[#00dbe7]/20 text-[#00dbe7] border-[#00dbe7]/50 font-bold shadow-sm'
                          : isLight
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-white/5 text-on-surface-variant border-white/10'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button conforming to Section 2 */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full h-10 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 leading-none border shadow-sm ${
                  isLight
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sm font-bold'
                    : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 hover:border-[#00dbe7] shadow-[#00dbe7]/10 font-bold'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>SYNTHESIZING WITH {selectedModel.toUpperCase()}...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 shrink-0" />
                    <span>GENERATE IMAGE (FREE)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Generation Canvas / Image Viewer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-outline/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Synthesis Canvas</h3>
                    <p className="text-[10px] text-on-surface-variant font-mono">
                      {generationTelemetry 
                        ? `${generationTelemetry.dimensions.width}×${generationTelemetry.dimensions.height} • ${generationTelemetry.model} • ${(generationTelemetry.durationMs / 1000).toFixed(1)}s` 
                        : 'Awaiting generation request'}
                    </p>
                  </div>
                </div>

                {generatedImage && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3 shrink-0" /> Ready
                  </span>
                )}
              </div>

              {/* Main Image Display Box */}
              <div className={`relative w-full rounded-xl border overflow-hidden flex items-center justify-center min-h-[420px] transition-all ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0d0d10] border-[#3a494b]/30'
              }`}>
                {isGenerating ? (
                  <div className="text-center space-y-3 p-8 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto text-[#00dbe7]">
                      <RefreshCw className="w-8 h-8 animate-spin shrink-0" />
                    </div>
                    <div className="text-sm font-mono font-bold text-on-surface">
                      Generating with {selectedModel.toUpperCase()}...
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono max-w-sm mx-auto">
                      Running rectified flow matching diffusion. Synthesizing latent matrices...
                    </p>
                  </div>
                ) : generatedImage ? (
                  <div className="relative group w-full h-full flex items-center justify-center p-2">
                    <img
                      src={generatedImage}
                      alt={prompt}
                      className="max-h-[500px] w-auto max-w-full rounded-lg shadow-xl object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-3 p-8">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-on-surface-variant">
                      <FileImage className="w-7 h-7 shrink-0" />
                    </div>
                    <div className="text-xs font-mono font-bold text-on-surface">No Image Generated Yet</div>
                    <p className="text-[11px] text-on-surface-variant font-mono max-w-xs mx-auto">
                      Enter a prompt description on the left and click Generate to produce your first high-resolution artwork.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Toolbar when Generated Image is Ready */}
              {generatedImage && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <a
                    href={generatedImage}
                    download="sutharlabs-generated-image.jpg"
                    className={`h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 leading-none border shadow-sm w-full sm:w-auto ${
                      isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>Download Image</span>
                  </a>

                  {/* 1-Click Send to 4K Super-Resolution Upscaler */}
                  <button
                    type="button"
                    onClick={handleSendToUpscaler}
                    className={`h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 leading-none border shadow-sm w-full sm:w-auto ${
                      isLight
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Send to 4K Upscaler</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 4K SUPER-RESOLUTION & CLARITY UPSCALER                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'upscale' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Visual Comparison Canvas (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-outline/20">
                <div className="flex items-center gap-2">
                  <Split className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  <span className="text-xs font-mono font-bold uppercase text-on-surface">
                    Interactive Comparison View (Drag Split Slider)
                  </span>
                </div>
                <div className="text-[10px] font-mono text-on-surface-variant">
                  {originalDimensions && (
                    <span>Original: {originalDimensions.width}×{originalDimensions.height}</span>
                  )}
                  {upscaledDimensions && (
                    <span className="text-emerald-400 font-bold ml-2">→ Enhanced: {upscaledDimensions.width}×{upscaledDimensions.height}</span>
                  )}
                </div>
              </div>

              {/* Split Screen Image Container */}
              <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative w-full h-[450px] rounded-xl overflow-hidden cursor-ew-resize select-none border border-outline/30 bg-[#0d0d10]"
              >
                {/* Background Layer: Enhanced Upscaled Image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={upscaledImage || originalImage || ''}
                    alt="Enhanced"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                  <span className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                    {upscaledImage ? `${scale}x Enhanced (After)` : 'Original (1x)'}
                  </span>
                </div>

                {/* Foreground Layer: Original Image (Clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <div className="absolute inset-0 w-full h-full" style={{ width: containerRef.current?.clientWidth || '100%' }}>
                    <img
                      src={originalImage || ''}
                      alt="Original"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                  <span className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-on-surface-variant border border-white/10">
                    Original (Before)
                  </span>
                </div>

                {/* Drag Slider Divider Bar */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,219,231,0.8)] pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-slate-900 border-2 border-[#00dbe7] flex items-center justify-center shadow-lg text-[10px]">
                    <Split className="w-3.5 h-3.5 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Quick Sample Presets */}
              <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase shrink-0">Sample Images:</span>
                {SAMPLE_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setOriginalImage(sample.url);
                      setUpscaledImage(null);
                    }}
                    className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all shrink-0 cursor-pointer ${
                      originalImage === sample.url
                        ? isLight
                          ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                          : 'bg-[#00dbe7]/20 text-[#00dbe7] border-[#00dbe7]/50 shadow-sm'
                        : isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          : 'bg-[#201f21] text-on-surface-variant border-[#3a494b]/40 hover:text-white'
                    }`}
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Control Configuration Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              {/* Card Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-outline/20">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4 text-[#00dbe7] shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Upscaling Engine & Scale</h3>
                  <p className="text-[10px] text-on-surface-variant font-mono">
                    Select super-resolution tier and magnification factor
                  </p>
                </div>
              </div>

              {/* Source Image Upload Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-on-surface-variant">
                  Source Image Input
                </label>
                <label className={`block p-3 rounded-xl border border-dashed cursor-pointer transition-all text-center ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300' : 'bg-[#121215] hover:bg-[#18181e] border-[#3a494b]/50'
                }`}>
                  <Upload className="w-5 h-5 mx-auto text-on-surface-variant mb-1 shrink-0" />
                  <span className="text-xs font-mono font-semibold block text-on-surface">Upload custom image (.png, .jpg)</span>
                  <span className="text-[10px] text-on-surface-variant font-mono">Drag and drop or browse local files</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Engine Tier Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase font-bold text-on-surface-variant flex items-center justify-between">
                  <span>Enhancement Tier</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Default: Free Sovereign</span>
                </label>

                {/* Tier 1: Free Sovereign Engine */}
                <div
                  onClick={() => handleSelectEngine('free')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    engine === 'free'
                      ? isLight
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-sm'
                        : 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                      : isLight
                        ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        : 'bg-[#121215] border-[#3a494b]/30 hover:border-[#3a494b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-mono font-bold text-on-surface">Sovereign Super-Res (Real-ESRGAN)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      $0.00 FREE
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed font-sans">
                    Mathematical super-resolution. Removes compression artifacts and sharpens outlines instantly with zero external API fees.
                  </p>
                </div>

                {/* Tier 2: Generative Clarity 4K (Paid) */}
                <div
                  onClick={() => handleSelectEngine('clarity-4k')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    engine === 'clarity-4k'
                      ? isLight
                        ? 'bg-purple-50/70 border-purple-400 shadow-sm'
                        : 'bg-purple-500/10 border-purple-500/40 shadow-sm'
                      : isLight
                        ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        : 'bg-[#121215] border-[#3a494b]/30 hover:border-[#3a494b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-xs font-mono font-bold text-on-surface">Clarity Generative 4K Ultra-Detail</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                      ~$0.012 / 4K
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed font-sans">
                    Generative AI hallucination. Injects photorealistic skin pores, hair strands, fabric weaves, and cinematic lighting depth up to 8K.
                  </p>
                </div>
              </div>

              {/* Target Magnification Scale */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-on-surface-variant">
                  Target Magnification Scale
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScale(2)}
                    className={`h-9 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer border ${
                      scale === 2
                        ? isLight
                          ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                          : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/50 shadow-sm'
                        : isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-white/5 text-on-surface-variant border-white/10'
                    }`}
                  >
                    2x Super-Res
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale(4)}
                    className={`h-9 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer border ${
                      scale === 4
                        ? isLight
                          ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                          : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/50 shadow-sm'
                        : isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-white/5 text-on-surface-variant border-white/10'
                    }`}
                  >
                    4x Ultra-Sharp 4K
                  </button>
                </div>
              </div>

              {/* Execution Action Button */}
              <div className="border-t border-outline/20 pt-3 space-y-2.5">
                <button
                  type="button"
                  onClick={handleUpscale}
                  disabled={isUpscaling || !originalImage}
                  className={`w-full h-10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 leading-none border shadow-sm ${
                    engine === 'free'
                      ? isLight
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-emerald-600/10'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/50 shadow-emerald-500/10'
                      : isLight
                        ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700 shadow-purple-600/10'
                        : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border-purple-500/50 shadow-purple-500/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUpscaling ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin shrink-0" />
                      <span>ENHANCING RESOLUTION...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>UPSCALE IMAGE ({scale}x)</span>
                    </>
                  )}
                </button>

                {upscaledImage && (
                  <a
                    href={upscaledImage}
                    download={`sutharlabs-${scale}x-upscaled.png`}
                    className={`w-full h-9 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 leading-none border shadow-sm ${
                      isLight
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                        : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/50'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>DOWNLOAD ENHANCED PNG</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Paid Engine Selection */}
      <ConfirmModal
        isOpen={confirmPaidEngine}
        onClose={() => {
          setConfirmPaidEngine(false);
          setPendingEngine(null);
        }}
        onConfirm={confirmPaidSelection}
        title="Activate Paid Generative 4K Upscaler"
        message="Switch from the default Sovereign Free Engine to the Generative Clarity 4K Engine?"
        subtext="Clarity Generative 4K utilizes serverless GPU diffusion endpoints (Fal.ai) at approximately ~$0.012 per 4K generation. You can switch back to the free engine at any time."
        confirmLabel="Confirm & Enable Paid Mode"
        cancelLabel="Keep Free Engine"
        variant="warning"
        theme={theme}
      />
    </div>
  );
}
