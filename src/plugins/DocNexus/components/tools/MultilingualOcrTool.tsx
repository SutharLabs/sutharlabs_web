import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Languages, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  RefreshCw, 
  AlertCircle,
  Sparkles,
  Sliders,
  Camera,
  SwitchCamera,
  X
} from 'lucide-react';
import { SubToolProps } from './types.js';

export default function MultilingualOcrTool({
  isLight,
  isProcessing,
  setIsProcessing,
  setStatus,
  setError,
  addLog
}: SubToolProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'eng+hin' | 'eng' | 'hin' | 'spa' | 'fra' | 'deu'>('eng+hin');
  const [extractedText, setExtractedText] = useState<string>(
    'श्री बालाजी किराना एवं जनरल स्टोर्स\nअहमदाबाद, गुजरात - ३८०००१\nकर इनवॉयस / रसीद क्र.: BK-2026/842\nदिनांक: 06/11/2026\nसामग्री विवरण: प्रीमियम बासमती चावल (Basmati Rice)\nसकल योग: ₹2,410.00\nजीएसटी: ₹173.00\nकुल योग: ₹2,583.00\nभुगतान माध्यम: UPI'
  );
  const [copied, setCopied] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera Capture States & Refs
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    stopCamera();
    setError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      setIsCameraActive(true);
      setCameraFacingMode(facing);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setIsCameraActive(false);
      setError(`Camera error: ${err.message || 'Unable to access device camera.'}`);
    }
  };

  const toggleFacingMode = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      stopCamera();
      runOcrOnDataUrl(dataUrl, 'Camera Photo');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const runOcrOnDataUrl = async (dataUrl: string, sourceName: string) => {
    setError(null);
    setIsProcessing(true);
    setUploadedImage(dataUrl);
    setProgressMsg('Loading WebAssembly Tesseract OCR core...');
    setStatus('Running multilingual character recognition...');
    addLog('INFO', `Scanning [${sourceName}] with language profile: ${selectedLanguage}...`);

    try {
      const { createWorker } = await import('tesseract.js');
      setProgressMsg(`Downloading and mounting [${selectedLanguage}] language neural weights...`);
      const langs = selectedLanguage.split('+');
      const worker = await createWorker(langs);

      setProgressMsg('Transcribing glyphs and layout structure...');
      const ret = await worker.recognize(dataUrl);
      const text = ret.data.text || '';
      await worker.terminate();

      setExtractedText(text);
      setIsProcessing(false);
      setStatus('Multilingual OCR extraction complete!');
      addLog('SUCCESS', `Successfully transcribed ${text.split(/\s+/).filter(Boolean).length} words.`);
    } catch (err: any) {
      setIsProcessing(false);
      setError(`OCR failed: ${err.message || 'Unknown error'}`);
      addLog('ERROR', `OCR Error: ${err.message}`);
    }
  };

  const compressImage = (dataUrl: string, maxDim: number = 1800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w <= maxDim && h <= maxDim && dataUrl.length < 1000000) {
          return resolve(dataUrl);
        }
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setProgressMsg('Loading WebAssembly Tesseract OCR core...');
    setStatus('Running multilingual character recognition...');
    addLog('INFO', `Scanning [${file.name}] with language profile: ${selectedLanguage}...`);

    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result as string;
      const dataUrl = await compressImage(rawDataUrl);
      setUploadedImage(dataUrl);

      try {
        const { createWorker } = await import('tesseract.js');
        setProgressMsg(`Downloading and mounting [${selectedLanguage}] language neural weights...`);
        const langs = selectedLanguage.split('+');
        const worker = await createWorker(langs);

        setProgressMsg('Transcribing glyphs and layout structure...');
        const ret = await worker.recognize(dataUrl);
        const text = ret.data.text || '';
        await worker.terminate();

        setExtractedText(text);
        setIsProcessing(false);
        setStatus('Multilingual OCR extraction complete!');
        addLog('SUCCESS', `Successfully transcribed ${text.split(/\s+/).filter(Boolean).length} words.`);
      } catch (err: any) {
        setIsProcessing(false);
        setError(`OCR failed: ${err.message || 'Unknown error'}`);
        addLog('ERROR', `OCR Error: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-extracted-text-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('SUCCESS', 'Downloaded extracted text file.');
  };

  const cleanFormatting = () => {
    const cleaned = extractedText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join('\n');
    setExtractedText(cleaned);
  };

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
  const charCount = extractedText.length;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
      }`}>
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center shrink-0">
            <Languages className="w-5 h-5 text-purple-400 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base">Multilingual Image OCR</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                100% PRIVATE WASM
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-gray-400 mt-0.5">
              Transcribe printed and handwritten text in Hindi (Devanagari), English, Spanish, and French directly in browser memory.
            </p>
          </div>
        </div>

        {/* Language Selector & Upload */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as any)}
            className={`h-8 px-2 rounded-lg text-xs font-mono border outline-none ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#201f21] border-[#3a494b]/40 text-[#e5e1e4]'
            }`}
          >
            <option value="eng+hin">English + Hindi (हिन्दी)</option>
            <option value="eng">English Only</option>
            <option value="hin">Hindi Only (हिन्दी)</option>
            <option value="spa">Spanish (Español)</option>
            <option value="fra">French (Français)</option>
            <option value="deu">German (Deutsch)</option>
          </select>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-sky-500 hover:bg-sky-600 text-white border border-sky-600'
                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => (isCameraActive ? stopCamera() : startCamera())}
            disabled={isProcessing}
            className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isLight
                ? isCameraActive
                  ? 'bg-rose-50 text-rose-700 border border-rose-300'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300'
                : isCameraActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>{isCameraActive ? 'Close Camera' : 'Use Camera'}</span>
          </button>
        </div>
      </div>

      {/* Main OCR Workspace */}
      <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
      }`}>
        {/* Live Camera Viewfinder Overlay */}
        {isCameraActive && (
          <div className="relative w-full h-72 sm:h-80 bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center border border-purple-500/30 shadow-lg mb-2">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Framing Guidelines */}
            <div className="absolute inset-4 sm:inset-6 border border-white/30 rounded-lg pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between items-start">
                <div className="w-5 h-5 border-t-2 border-l-2 border-purple-400"></div>
                <div className="w-5 h-5 border-t-2 border-r-2 border-purple-400"></div>
              </div>
              <div className="text-center font-mono text-[11px] text-white/90 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full mx-auto select-none border border-white/20">
                Point camera at physical document, bill, or sign
              </div>
              <div className="flex justify-between items-end">
                <div className="w-5 h-5 border-b-2 border-l-2 border-purple-400"></div>
                <div className="w-5 h-5 border-b-2 border-r-2 border-purple-400"></div>
              </div>
            </div>

            {/* Floating Camera Action Controls */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 px-4 z-10">
              <button
                type="button"
                onClick={toggleFacingMode}
                title="Switch Camera (Front / Back)"
                className="w-9 h-9 rounded-full bg-black/60 border border-white/30 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer"
              >
                <SwitchCamera className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                title="Capture Document Photo"
                className="h-10 px-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Snap & Transcribe</span>
              </button>

              <button
                type="button"
                onClick={stopCamera}
                title="Cancel Camera"
                className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center hover:bg-rose-500/30 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Extracted Text Editor
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-500 dark:text-gray-400">
              {wordCount} words • {charCount} chars
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cleanFormatting}
              className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
              title="Clean empty lines and whitespace"
            >
              Clean Text
            </button>

            <button
              type="button"
              onClick={copyToClipboard}
              className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${
                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={downloadTxt}
              className={`h-7 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
                isLight ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300' : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border-purple-500/40'
              }`}
            >
              <Download className="w-3 h-3 shrink-0" />
              <span>Download .txt</span>
            </button>
          </div>
        </div>

        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="p-4 rounded-lg bg-black/40 border border-[#00dbe7]/30 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#00dbe7] animate-spin shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">OCR In Progress</span>
              <span className="text-[11px] font-mono text-cyan-200">{progressMsg}</span>
            </div>
          </div>
        )}

        <textarea
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          placeholder="Upload an image or paste receipt/document text here..."
          rows={12}
          className={`w-full p-3 rounded-lg border font-mono text-xs outline-none transition-colors leading-relaxed ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-purple-500' : 'bg-[#18181c] border-[#3a494b]/40 text-[#e5e1e4] focus:border-purple-400'
          }`}
        />
      </div>
    </div>
  );
}
