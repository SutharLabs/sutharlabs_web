import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  FileAudio, 
  Download, 
  Copy, 
  Check, 
  UploadCloud, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2, 
  FileText, 
  Subtitles, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  FolderArchive,
  Volume2
} from 'lucide-react';
import JSZip from 'jszip';
import { ToolCommonProps } from './types.js';

interface SubtitleSegment {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

interface AudioFileItem {
  id: string;
  file: File;
  name: string;
  sizeMb: string;
  durationSec: number;
  status: 'pending' | 'decoding' | 'transcribing' | 'done' | 'error';
  errorMessage?: string;
  progressPercent: number;
  progressStage: string;
  fullTranscript: string;
  segments: SubtitleSegment[];
}

export default function AudioTranscriberTool({
  isLight,
  isProcessing,
  setIsProcessing,
  setStatus,
  setError,
  addLog,
  checkDownloadAccess
}: ToolCommonProps) {
  const [items, setItems] = useState<AudioFileItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subtitles' | 'transcript' | 'raw'>('subtitles');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const selectedItem = items.find(i => i.id === selectedItemId) || items[0] || null;

  // Format seconds to SRT timestamp: HH:MM:SS,mmm
  const formatSrtTime = (seconds: number): string => {
    const pad = (n: number, z = 2) => ('00' + n).slice(-z);
    const date = new Date(seconds * 1000);
    const hh = pad(Math.floor(seconds / 3600));
    const mm = pad(date.getUTCMinutes());
    const ss = pad(date.getUTCSeconds());
    const mmm = pad(date.getUTCMilliseconds(), 3);
    return `${hh}:${mm}:${ss},${mmm}`;
  };

  // Format seconds to WebVTT timestamp: HH:MM:SS.mmm
  const formatVttTime = (seconds: number): string => {
    const srt = formatSrtTime(seconds);
    return srt.replace(',', '.');
  };

  const handleFilesAdded = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = Array.from(fileList).filter(f => 
      f.type.startsWith('audio/') || 
      f.type.startsWith('video/') ||
      f.name.match(/\.(mp3|wav|m4a|ogg|flac|aac|mp4|webm|mov|mkv)$/i)
    );

    if (validFiles.length === 0) {
      setError?.('Please select valid audio or video files (MP3, WAV, M4A, MP4, WebM).');
      return;
    }

    const newItems: AudioFileItem[] = validFiles.map((file, idx) => ({
      id: `audio_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name.replace(/\.[^/.]+$/, ''),
      sizeMb: (file.size / (1024 * 1024)).toFixed(1),
      durationSec: 0,
      status: 'pending',
      progressPercent: 0,
      progressStage: 'Queued',
      fullTranscript: '',
      segments: []
    }));

    setItems(prev => [...prev, ...newItems]);
    if (!selectedItemId && newItems.length > 0) {
      setSelectedItemId(newItems[0].id);
    }

    addLog?.('INFO', `Added ${newItems.length} audio file(s) for in-browser transcription.`);

    // Auto-transcribe if first single file
    if (newItems.length === 1 && items.length === 0) {
      transcribeSingleItem(newItems[0]);
    }
  };

  const transcribeSingleItem = async (item: AudioFileItem) => {
    setIsProcessing(true);
    setError?.(null);
    setStatus(`Loading Whisper neural model on client WebGPU/WASM...`);

    setItems(prev => prev.map(i => i.id === item.id ? {
      ...i,
      status: 'decoding',
      progressPercent: 15,
      progressStage: 'Decoding audio frames in RAM'
    } : i));

    try {
      addLog?.('INFO', `Decoding audio for "${item.file.name}"...`);

      // 1. Decode Audio locally using browser Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const arrayBuffer = await item.file.arrayBuffer();
      const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioDuration = decodedBuffer.duration;

      // Extract mono Float32Array channel
      const float32Data = decodedBuffer.getChannelData(0);

      setItems(prev => prev.map(i => i.id === item.id ? {
        ...i,
        durationSec: Math.round(audioDuration),
        status: 'transcribing',
        progressPercent: 35,
        progressStage: 'Whisper neural inference on WebGPU'
      } : i));

      addLog?.('INFO', `Loaded ${audioDuration.toFixed(1)}s audio buffer. Running Whisper WebGPU...`);

      // 2. Load Transformers.js automatic-speech-recognition pipeline
      const { pipeline } = await import('@huggingface/transformers');

      // Check WebGPU availability
      const device = (navigator as any).gpu ? 'webgpu' : 'wasm';

      const transcriber = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny.en',
        { 
          device: device as any,
          progress_callback: (p: any) => {
            if (p.status === 'progress') {
              const pct = Math.min(95, 35 + Math.round((p.progress || 0) * 0.6));
              setItems(prev => prev.map(i => i.id === item.id ? {
                ...i,
                progressPercent: pct,
                progressStage: `Transcribing (${pct}%)`
              } : i));
            }
          }
        }
      );

      // 3. Transcribe audio array with timestamps
      const output: any = await transcriber(float32Data, {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5
      });

      const fullText = (output.text || '').trim();
      let generatedSegments: SubtitleSegment[] = [];

      if (output.chunks && output.chunks.length > 0) {
        generatedSegments = output.chunks.map((chunk: any, idx: number) => ({
          id: idx + 1,
          start: chunk.timestamp[0] ?? (idx * 3),
          end: chunk.timestamp[1] ?? ((idx + 1) * 3),
          text: (chunk.text || '').trim()
        }));
      } else {
        // Fallback: chunk into reasonable subtitle sentences
        const sentences = fullText.split(/(?<=[.?!])\s+/);
        const secPerSentence = sentences.length > 0 ? audioDuration / sentences.length : 3;
        generatedSegments = sentences.map((sentence: string, idx: number) => ({
          id: idx + 1,
          start: idx * secPerSentence,
          end: Math.min(audioDuration, (idx + 1) * secPerSentence),
          text: sentence
        }));
      }

      setItems(prev => prev.map(i => i.id === item.id ? {
        ...i,
        status: 'done',
        progressPercent: 100,
        progressStage: 'Completed',
        fullTranscript: fullText,
        segments: generatedSegments
      } : i));

      setStatus(`Transcription completed! Generated ${generatedSegments.length} subtitle timestamps.`);
      addLog?.('SUCCESS', `Successfully transcribed "${item.file.name}" into ${generatedSegments.length} segments.`);
      await audioContext.close();
    } catch (err: any) {
      console.error('Whisper transcription error:', err);
      const errMsg = err?.message || 'Failed to transcribe audio locally.';
      setItems(prev => prev.map(i => i.id === item.id ? {
        ...i,
        status: 'error',
        errorMessage: errMsg,
        progressStage: 'Error'
      } : i));
      setError?.(`Transcription failed: ${errMsg}`);
      addLog?.('ERROR', `Failed transcribing "${item.file.name}": ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSrtContent = (segments: SubtitleSegment[]): string => {
    return segments.map(seg => {
      return `${seg.id}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text}\n`;
    }).join('\n');
  };

  const generateVttContent = (segments: SubtitleSegment[]): string => {
    const body = segments.map(seg => {
      return `${seg.id}\n${formatVttTime(seg.start)} --> ${formatVttTime(seg.end)}\n${seg.text}\n`;
    }).join('\n');
    return `WEBVTT - Generated by SutharLabs Whisper WebGPU Studio\n\n${body}`;
  };

  const downloadSrt = (item: AudioFileItem) => {
    if (item.segments.length === 0) return;
    const content = generateSrtContent(item.segments);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name}_subtitles.srt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded .SRT subtitle file: ${item.name}`);
    addLog?.('SUCCESS', `Exported .SRT subtitles for "${item.name}".`);
  };

  const downloadVtt = (item: AudioFileItem) => {
    if (item.segments.length === 0) return;
    const content = generateVttContent(item.segments);
    const blob = new Blob([content], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name}_subtitles.vtt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded .VTT subtitle file: ${item.name}`);
  };

  const downloadTxt = (item: AudioFileItem) => {
    if (!item.fullTranscript) return;
    const blob = new Blob([item.fullTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded transcript text file: ${item.name}`);
  };

  const copyTranscript = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2500);
    setStatus(`Copied ${formatName} to clipboard!`);
  };

  const downloadAllZip = async () => {
    const doneItems = items.filter(i => i.status === 'done' && i.segments.length > 0);
    if (doneItems.length === 0) {
      setError?.('No completed transcriptions ready for ZIP export.');
      return;
    }

    setIsProcessing(true);
    setStatus('Packaging subtitle bundles (.SRT, .VTT, .TXT) into ZIP archive...');

    try {
      const zip = new JSZip();
      for (const item of doneItems) {
        const folder = zip.folder(item.name) || zip;
        folder.file(`${item.name}.srt`, generateSrtContent(item.segments));
        folder.file(`${item.name}.vtt`, generateVttContent(item.segments));
        folder.file(`${item.name}_transcript.txt`, item.fullTranscript);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sutharlabs_subtitles_bundle_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus(`ZIP archive exported with all subtitles!`);
      addLog?.('SUCCESS', `Exported subtitle ZIP package for ${doneItems.length} files.`);
    } catch (err: any) {
      setError?.(`Failed to generate ZIP: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border shadow-sm space-y-6 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Hidden File Input */}
      <input 
        ref={fileInputRef} 
        type="file" 
        multiple
        accept="audio/*,video/*,.mp3,.wav,.m4a,.ogg,.flac,.mp4,.webm,.mov" 
        onChange={(e) => handleFilesAdded(e.target.files)} 
        className="hidden" 
      />

      {/* Main View Header with Standard Themed Icon Container */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Subtitles className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                Audio Transcriber & Subtitles Studio
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Whisper WebGPU
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Transcribe podcasts, videos & voice notes into synced .SRT / .VTT subtitles directly in your browser
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shrink-0 ${
                isLight 
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm' 
                  : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 shrink-0" />
              <span>Add Audio</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty Upload Zone */}
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
            <Mic className="w-7 h-7 shrink-0" />
          </div>

          <div>
            <h3 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Drop audio or video files here
            </h3>
            <p className="text-xs text-on-surface-variant font-mono mt-1 max-w-md mx-auto">
              Supports MP3, WAV, M4A, MP4, WebM. Quantized Whisper model runs locally in client RAM using WebGPU. No 3-minute caps or watermarks.
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
              <FileAudio className="w-3.5 h-3.5 shrink-0" />
              <span>Select Audio / Video File</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-on-surface-variant pt-2">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 100% Confidential (Never Leaves Device)</span>
            <span className="flex items-center gap-1"><Subtitles className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Synchronized .SRT & .VTT Export</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Hardware Accelerated via WebGPU</span>
          </div>
        </div>
      ) : (
        /* Active Transcription Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Subtitles & Transcript Viewer (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedItem && (
              <div className={`p-4 rounded-xl border space-y-4 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
              }`}>
                {/* File Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileAudio className="w-5 h-5 text-[#00dbe7] shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-on-surface truncate font-mono">{selectedItem.file.name}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {selectedItem.sizeMb} MB • {selectedItem.durationSec > 0 ? `${selectedItem.durationSec}s duration` : 'Audio buffer ready'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedItem.status === 'done' ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Transcribed
                      </span>
                    ) : selectedItem.status === 'transcribing' || selectedItem.status === 'decoding' ? (
                      <span className="flex items-center gap-1 text-[#00dbe7] font-bold text-[11px] font-mono animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" /> {selectedItem.progressStage}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => transcribeSingleItem(selectedItem)}
                        className={`h-7 px-3 rounded text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm ${
                          isLight 
                            ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' 
                            : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/50'
                        }`}
                      >
                        Start Transcription
                      </button>
                    )}
                  </div>
                </div>

                {/* Processing Progress Bar */}
                {(selectedItem.status === 'transcribing' || selectedItem.status === 'decoding') && (
                  <div className="space-y-1.5 p-3 rounded-lg border bg-sky-500/10 border-sky-500/20 text-xs font-mono">
                    <div className="flex justify-between items-center text-[#00dbe7]">
                      <span>{selectedItem.progressStage}</span>
                      <span className="font-bold">{selectedItem.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#00dbe7] h-full transition-all duration-300" 
                        style={{ width: `${selectedItem.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtitle / Transcript View Switcher */}
                {selectedItem.status === 'done' && (
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-white/10">
                    <div className={`flex rounded-lg p-0.5 border text-[11px] ${
                      isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setActiveTab('subtitles')}
                        className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
                          activeTab === 'subtitles'
                            ? isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        Synced Subtitles ({selectedItem.segments.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('transcript')}
                        className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
                          activeTab === 'transcript'
                            ? isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        Full Transcript
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('raw')}
                        className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
                          activeTab === 'raw'
                            ? isLight ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        Raw .SRT Code
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyTranscript(
                          activeTab === 'raw' ? generateSrtContent(selectedItem.segments) : selectedItem.fullTranscript,
                          activeTab === 'raw' ? 'SRT' : 'Transcript'
                        )}
                        className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-[#201f21] text-[#e5e1e4] border-white/10'
                        }`}
                      >
                        {copiedFormat ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                        <span>{copiedFormat ? 'Copied!' : 'Copy Text'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 1: Synced Subtitle Segments with Timestamps */}
                {selectedItem.status === 'done' && activeTab === 'subtitles' && (
                  <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
                    {selectedItem.segments.map((seg) => (
                      <div 
                        key={seg.id}
                        className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 transition-all ${
                          isLight ? 'bg-white border-slate-200 hover:border-sky-400' : 'bg-[#121215] border-white/5 hover:border-[#00dbe7]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                          <span className="flex items-center gap-1 font-bold text-sky-500">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatSrtTime(seg.start)} ➔ {formatSrtTime(seg.end)}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10">#{seg.id}</span>
                        </div>
                        <p className="text-on-surface leading-relaxed text-sm select-all">
                          {seg.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 2: Full Paragraph Transcript */}
                {selectedItem.status === 'done' && activeTab === 'transcript' && (
                  <div className={`p-4 rounded-xl border text-sm leading-relaxed select-all max-h-[460px] overflow-y-auto ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121215] border-white/10 text-[#e5e1e4]'
                  }`}>
                    {selectedItem.fullTranscript}
                  </div>
                )}

                {/* Tab 3: Raw .SRT Code Format */}
                {selectedItem.status === 'done' && activeTab === 'raw' && (
                  <pre className={`p-4 rounded-xl border font-mono text-xs select-all max-h-[460px] overflow-y-auto ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#121215] border-white/10 text-emerald-300'
                  }`}>
                    {generateSrtContent(selectedItem.segments)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Download Actions & Multi-file Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Export Downloads Card */}
            {selectedItem && selectedItem.status === 'done' && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-white/10">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                    Subtitle Formats
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Standard UTF-8</span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => downloadSrt(selectedItem)}
                    className={`w-full h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                      isLight 
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600' 
                        : 'bg-[#00dbe7] hover:bg-[#74f5ff] text-slate-900 border-[#00dbe7]'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>Download .SRT (Premiere/YouTube)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => downloadVtt(selectedItem)}
                      className={`h-7 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center justify-center gap-1 cursor-pointer ${
                        isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-white/10'
                      }`}
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span>Export .VTT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadTxt(selectedItem)}
                      className={`h-7 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center justify-center gap-1 cursor-pointer ${
                        isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-white/10'
                      }`}
                    >
                      <FileText className="w-3 h-3 shrink-0" />
                      <span>Export .TXT</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Queue List */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
            }`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-white/10">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
                  Audio Queue ({items.length})
                </span>
                {items.some(i => i.status === 'done') && (
                  <button
                    type="button"
                    onClick={downloadAllZip}
                    disabled={isProcessing}
                    className="text-[10px] font-mono font-bold text-sky-500 hover:underline cursor-pointer"
                  >
                    Download All ZIP
                  </button>
                )}
              </div>

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
                      <FileAudio className="w-4 h-4 text-[#00dbe7] shrink-0" />
                      <span className="truncate text-[11px] font-medium">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : item.status === 'transcribing' || item.status === 'decoding' ? (
                        <RefreshCw className="w-3.5 h-3.5 text-[#00dbe7] animate-spin shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

