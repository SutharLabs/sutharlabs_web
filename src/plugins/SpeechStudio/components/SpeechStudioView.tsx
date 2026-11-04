import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Sparkles,
  Languages,
  Sliders,
  History,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Clock,
  Zap,
  Check,
  Copy,
  Cpu,
  Trash2
} from 'lucide-react';
import { WorkspacePluginViewProps } from '../../types.js';
import { TTSQuotaStatus, SpeechHistoryItem } from '../types.js';
import ConfirmModal from '../../../components/ConfirmModal.js';

const SAMPLE_PROMPTS = [
  {
    label: 'English Market Flash',
    lang: 'en-US',
    text: 'SutharLabs Sovereign Engine update: S&P 500 futures are trading higher by 0.4%, led by semiconductors and cloud infrastructure. Risk parity indices remain stable.'
  },
  {
    label: 'Hindi Market Brief (हिंदी)',
    lang: 'hi-IN',
    text: 'सुथारलैब्स मार्केट अपडेट में आपका स्वागत है। आज निफ्टी पचास और बैंक निफ्टी में मजबूत तेजी दर्ज की गई है। क्वांटिटेटिव मॉडल्स ऑटोमेटेड सिग्नल जनरेट कर रहे हैं।'
  },
  {
    label: 'Bilingual Tech Update',
    lang: 'en-IN',
    text: 'Welcome to SutharLabs. Our high-frequency algorithms and autonomous agents are actively monitoring Indian equity markets and global forex pairs.'
  },
  {
    label: 'Hindi AI Greeter (हिंदी)',
    lang: 'hi-IN',
    text: 'नमस्ते! मैं सुथारलैब्स का न्यूरल स्पीच असिस्टेंट हूँ। मैं हिंदी और अंग्रेजी दोनों भाषाओं में प्राकृतिक रूप से संवाद करने में सक्षम हूँ।'
  }
];

export default function SpeechStudioView({
  logs,
  onAddLog,
  userToken,
  theme = 'dark',
  userRole = 'Developer',
  userEmail
}: WorkspacePluginViewProps) {
  const isLight = theme === 'light';

  // Input text and voice parameters
  const [text, setText] = useState<string>(SAMPLE_PROMPTS[0].text);
  const [selectedLang, setSelectedLang] = useState<'all' | 'en' | 'hi'>('all');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

  // Modulation sliders
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // Rate-limiting quota telemetry
  const [quota, setQuota] = useState<TTSQuotaStatus>({
    role: userRole || 'Developer',
    isUnlimited: userRole === 'Admin',
    limit: 10,
    used: 0,
    remaining: userRole === 'Admin' ? Infinity : 10,
    resetInSeconds: 3600
  });

  const [activeTab, setActiveTab] = useState<'synthesize' | 'history' | 'models'>('synthesize');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Speech history
  const [history, setHistory] = useState<SpeechHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_tts_history');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });

  // Modal confirm state
  const [confirmClearHistory, setConfirmClearHistory] = useState<boolean>(false);

  // Load available system synthesis voices
  const populateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    setAvailableVoices(voices);

    if (voices.length > 0 && !selectedVoiceURI) {
      // Prefer an Indian English or Hindi voice by default if available, or first default
      const defaultVoice =
        voices.find(v => v.lang.startsWith('hi')) ||
        voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.lang === 'en-US') ||
        voices[0];
      if (defaultVoice) {
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    }
  }, [selectedVoiceURI]);

  useEffect(() => {
    populateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [populateVoices]);

  // Fetch initial quota status from server
  const fetchQuota = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;
      const res = await fetch('/api/plugins/speech-studio/quota', { headers });
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch {
      // Fallback based on role
      setQuota({
        role: userRole || 'Developer',
        isUnlimited: userRole === 'Admin',
        limit: 10,
        used: 0,
        remaining: userRole === 'Admin' ? Infinity : 10,
        resetInSeconds: 3600
      });
    }
  }, [userToken, userRole]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Filter voices by selected language pill
  const filteredVoices = availableVoices.filter(v => {
    if (selectedLang === 'hi') return v.lang.startsWith('hi');
    if (selectedLang === 'en') return v.lang.startsWith('en');
    return v.lang.startsWith('en') || v.lang.startsWith('hi');
  });

  // Handle Play Synthesis
  const handleSynthesizeAndPlay = async () => {
    if (!text.trim()) return;
    setErrorMessage(null);
    setIsSynthesizing(true);

    try {
      // 1. Call server synthesis API for telemetry and rate-limit verification
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

      const activeVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      const res = await fetch('/api/plugins/speech-studio/synthesize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          lang: activeVoice ? activeVoice.lang : 'en-US',
          voiceName: activeVoice ? activeVoice.name : 'Default',
          rate,
          pitch,
          volume
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setErrorMessage(data.error || 'Rate limit reached (10 queries/hour for non-admin accounts).');
          if (data.quota) setQuota(data.quota);
          setIsSynthesizing(false);
          return;
        }
        throw new Error(data.error || 'Synthesis error');
      }

      // Update quota status
      if (data.quota) {
        setQuota(data.quota);
      }

      // Add to terminal log
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `TTS: Synthesized "${text.slice(0, 35)}..." (${data.telemetry?.wordCount} words) via ${activeVoice?.name || 'Neural'}`
      });

      // 2. Play speech using Web Speech API
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Stop prior speech

        const utterance = new SpeechSynthesisUtterance(text);
        if (activeVoice) {
          utterance.voice = activeVoice;
          utterance.lang = activeVoice.lang;
        }
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };

        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          setIsPlaying(false);
          setIsPaused(false);
        };

        window.speechSynthesis.speak(utterance);
      }

      // 3. Save to speech history
      const historyEntry: SpeechHistoryItem = {
        id: `tts-${Date.now()}`,
        text: text.trim(),
        language: activeVoice?.lang || 'en',
        voiceName: activeVoice?.name || 'Default Voice',
        charCount: text.length,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationEstimateSec: data.telemetry?.estimatedDurationSec || 3
      };

      setHistory(prev => {
        const next = [historyEntry, ...prev.slice(0, 29)];
        try { localStorage.setItem('sutharlabs_tts_history', JSON.stringify(next)); } catch { }
        return next;
      });

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to synthesize speech.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePause = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (isPlaying && !isPaused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } else if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    }
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handleCopy = (content: string, key: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('sutharlabs_tts_history'); } catch { }
    setConfirmClearHistory(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* 1. Header with Container Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline/20 pb-4 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Volume2 className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                Neural Speech Studio
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">
                MULTILINGUAL: EN + HI (हिंदी)
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              High-fidelity multilingual neural voice generation with voice modulation, real-time waveform telemetry, and tiered rate-limiting.
            </p>
          </div>
        </div>

        {/* Top Quota Pill */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          {quota.isUnlimited ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">UNLIMITED QUOTA</span>
              <span className="text-[10px] text-emerald-400/80">(Admin Rank)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-xs">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Remaining: </span>
              <span className="font-bold text-amber-300">{quota.remaining} / {quota.limit}</span>
              <span className="text-[10px] text-amber-400/70">({Math.ceil(quota.resetInSeconds / 60)}m reset)</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className={`flex rounded-lg p-0.5 border text-xs ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
          }`}>
          <button
            type="button"
            onClick={() => setActiveTab('synthesize')}
            className={`px-3.5 py-1.5 rounded-md font-mono text-xs cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === 'synthesize'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Voice Synthesizer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-md font-mono text-xs cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === 'history'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>Speech History ({history.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`px-3.5 py-1.5 rounded-md font-mono text-xs cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === 'models'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>Open-Source Models</span>
          </button>
        </div>

        {/* Quick Language Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-on-surface-variant mr-1">Filter Voices:</span>
          {(['all', 'hi', 'en'] as const).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setSelectedLang(l)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase transition-all cursor-pointer border ${selectedLang === l
                  ? isLight
                    ? 'bg-sky-50 text-sky-700 border-sky-300 font-bold shadow-xs'
                    : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40 shadow-xs'
                  : isLight
                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    : 'bg-[#18181b] text-on-surface-variant border-[#3a494b]/30 hover:text-white'
                }`}
            >
              {l === 'all' ? 'All' : l === 'hi' ? 'Hindi (हिंदी)' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {/* Rate limit warning banner if reached */}
      {errorMessage && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-mono underline hover:text-rose-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SYNTHESIZE STUDIO */}
      {activeTab === 'synthesize' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Main Text Input Card (8 cols) */}
          <div className="lg:col-span-8 space-y-4">

            <div className={`p-4 sm:p-5 rounded-xl border shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
              }`}>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  <span>Script &amp; Speech Input</span>
                </span>
                <span className="text-[11px] font-mono text-on-surface-variant">
                  {text.length} / 3000 chars
                </span>
              </div>

              {/* Textarea */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Enter text to synthesize in English or Hindi (उदा. नमस्कार! सुथारलैब्स में आपका स्वागत है)..."
                className={`w-full p-3.5 rounded-lg border font-sans text-sm focus:outline-none focus:ring-1 transition-all resize-y ${isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-sky-500 focus:border-sky-500'
                    : 'bg-[#18181b] border-[#3a494b]/40 text-[#e5e1e4] focus:ring-[#00dbe7] focus:border-[#00dbe7]/60'
                  }`}
              />

              {/* Sample Prompts Pills */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-on-surface-variant mr-1">Quick Samples:</span>
                {SAMPLE_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setText(p.text)}
                    className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-[#201f21] hover:bg-[#28272a] text-[#b9cacb] border-[#3a494b]/40 hover:text-white'
                      }`}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[#00dbe7] shrink-0" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Waveform Visualization while playing */}
              <div className={`mt-4 p-3 rounded-lg border flex items-center justify-between gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-[#3a494b]/20'
                }`}>
                <div className="flex items-center gap-1 h-6">
                  {[24, 40, 60, 30, 80, 50, 90, 35, 70, 45, 60, 20, 75, 40, 85, 30].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        height: isPlaying && !isPaused ? `${Math.max(15, (h * (0.4 + (i % 3) * 0.3)))}%` : '20%',
                        animationDuration: `${0.4 + (i % 5) * 0.15}s`
                      }}
                      className={`w-1 rounded-full transition-all duration-150 ${isPlaying && !isPaused
                          ? 'bg-[#00dbe7] animate-pulse'
                          : isLight ? 'bg-slate-300' : 'bg-[#3a494b]/50'
                        }`}
                    />
                  ))}
                </div>

                <div className="text-right font-mono text-[11px] text-on-surface-variant">
                  {isPlaying ? (
                    <span className="text-[#00e476] font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#00e476] animate-ping shrink-0" />
                      SPEAKING
                    </span>
                  ) : isPaused ? (
                    <span className="text-amber-400 font-bold">PAUSED</span>
                  ) : (
                    <span>STANDBY</span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-outline/10 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSynthesizeAndPlay}
                    disabled={isSynthesizing || !text.trim()}
                    className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 leading-none shadow-sm disabled:opacity-50 ${isLight
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                        : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border border-[#00dbe7]/50 shadow-[#00dbe7]/10'
                      }`}
                  >
                    <Play className="w-3.5 h-3.5 shrink-0 fill-current" />
                    <span>{isSynthesizing ? 'SYNTHESIZING...' : isPlaying ? 'REPLAY' : 'SPEAK'}</span>
                  </button>

                  {isPlaying && (
                    <button
                      type="button"
                      onClick={handlePause}
                      className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 leading-none border shadow-sm ${isLight
                          ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                          : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                        }`}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5 shrink-0" /> : <Pause className="w-3.5 h-3.5 shrink-0" />}
                      <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
                    </button>
                  )}

                  {(isPlaying || isPaused) && (
                    <button
                      type="button"
                      onClick={handleStop}
                      className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 leading-none border shadow-sm ${isLight
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                    >
                      <Square className="w-3.5 h-3.5 shrink-0 fill-current" />
                      <span>STOP</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(text, 'inputText')}
                    className={`h-8 px-3 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                      }`}
                  >
                    {copiedKey === 'inputText' ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                    <span>{copiedKey === 'inputText' ? 'COPIED' : 'COPY SCRIPT'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setText('')}
                    className={`h-8 px-3 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        : 'bg-[#201f21] hover:bg-[#28272a] text-on-surface-variant border-[#3a494b]/40 hover:text-rose-400'
                      }`}
                  >
                    <span>CLEAR</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Voice Settings & Sliders Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-4">

            <div className={`p-4 sm:p-5 rounded-xl border shadow-sm space-y-4 ${isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
              }`}>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  <span>Acoustic Parameters</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setRate(1.0); setPitch(1.0); setVolume(1.0); }}
                  className="text-[10px] font-mono text-on-surface-variant hover:text-[#00dbe7] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 shrink-0" />
                  <span>RESET</span>
                </button>
              </div>

              {/* Voice Selector */}
              <div>
                <label className="block text-[11px] font-mono text-on-surface-variant mb-1.5">
                  Select Voice ({filteredVoices.length} detected)
                </label>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border font-mono text-xs focus:outline-none transition-colors ${isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-[#18181b] border-[#3a494b]/40 text-[#e5e1e4]'
                    }`}
                >
                  {filteredVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}) {v.default ? '★' : ''}
                    </option>
                  ))}
                  {filteredVoices.length === 0 && (
                    <option value="">Standard Browser Neural Voice</option>
                  )}
                </select>
              </div>

              {/* Speed / Rate Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-on-surface-variant">Speaking Rate</span>
                  <span className="text-[#00dbe7] font-bold">{rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-[#00dbe7] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-on-surface-variant mt-0.5">
                  <span>0.5x Slow</span>
                  <span>1.0x Normal</span>
                  <span>2.0x Fast</span>
                </div>
              </div>

              {/* Pitch Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-on-surface-variant">Pitch Modulation</span>
                  <span className="text-[#c084fc] font-bold">{pitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-[#c084fc] cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-on-surface-variant mt-0.5">
                  <span>Deep</span>
                  <span>Natural</span>
                  <span>High</span>
                </div>
              </div>

              {/* Volume Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-on-surface-variant">Output Volume</span>
                  <span className="text-[#00e476] font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#00e476] cursor-pointer"
                />
              </div>

              {/* Tier Information Box */}
              <div className={`p-3 rounded-lg border text-[11px] font-mono space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-[#18181b] border-[#3a494b]/30 text-on-surface-variant'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-semibold">Account Tier:</span>
                  <span className={quota.isUnlimited ? 'text-emerald-400 font-bold' : 'text-sky-400 font-bold'}>
                    {userRole || 'Developer'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hourly Allowance:</span>
                  <span>{quota.isUnlimited ? '∞ Unlimited' : `${quota.limit} calls/hr`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining Calls:</span>
                  <span className={quota.remaining > 2 ? 'text-emerald-400' : 'text-amber-400'}>
                    {quota.isUnlimited ? 'Unlimited' : quota.remaining}
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 2: SPEECH HISTORY */}
      {activeTab === 'history' && (
        <div className={`p-4 sm:p-5 rounded-xl border shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
          }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#00dbe7] shrink-0" />
              <h3 className="text-sm font-bold text-on-surface font-sans">
                Generated Speech Recordings ({history.length})
              </h3>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearHistory(true)}
                className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${isLight ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100' : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  }`}
              >
                <Trash2 className="w-3 h-3 shrink-0" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-mono text-xs">
              No speech syntheses generated yet. Use the Voice Synthesizer tab to convert text to speech.
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-[#3a494b]/30'
                    }`}
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-on-surface font-sans line-clamp-2">
                      {item.text}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-on-surface-variant">
                      <span>Voice: <strong className="text-on-surface">{item.voiceName}</strong></span>
                      <span>•</span>
                      <span>Lang: {item.language}</span>
                      <span>•</span>
                      <span>Chars: {item.charCount}</span>
                      <span>•</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setText(item.text);
                        setActiveTab('synthesize');
                      }}
                      className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                        }`}
                    >
                      <RotateCcw className="w-3 h-3 shrink-0" />
                      <span>Reload</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.text, item.id)}
                      className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                        }`}
                    >
                      {copiedKey === item.id ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OPEN SOURCE MODELS ARCHITECTURE REVIEW */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className={`p-4 sm:p-5 rounded-xl border shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
            }`}>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-[#00dbe7] shrink-0" />
              <h3 className="text-sm font-bold text-on-surface font-sans">
                Top-Rated Open-Source Multilingual TTS Architectures (English &amp; Hindi)
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant font-mono leading-relaxed mb-4">
              State-of-the-art open-source text-to-speech models evaluated for on-premise Oracle Cloud self-hosting and hybrid edge synthesis:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Chatterbox Multilingual V3 */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#18181b] border-[#3a494b]/40'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-on-surface">Chatterbox Multilingual V3</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    MIT LICENSE
                  </span>
                </div>
                <div className="text-[11px] font-mono text-on-surface-variant space-y-1 mb-2">
                  <div><strong>Developer:</strong> Resemble AI (Open Source)</div>
                  <div><strong>Parameters:</strong> ~0.5B (Fast GPU/CPU execution)</div>
                  <div><strong>Languages:</strong> English, Hindi, 23+ Multilingual</div>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  Premier choice for multilingual voice synthesis. Excels at zero-shot cross-lingual voice cloning and natural code-switching between Hindi and English in conversational streams.
                </p>
              </div>

              {/* svara-TTS */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#18181b] border-[#3a494b]/40'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-on-surface">svara-TTS</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    APACHE 2.0
                  </span>
                </div>
                <div className="text-[11px] font-mono text-on-surface-variant space-y-1 mb-2">
                  <div><strong>Developer:</strong> Indian Linguistic Research</div>
                  <div><strong>Parameters:</strong> ~300M lightweight</div>
                  <div><strong>Languages:</strong> Hindi, Indian English, 19 Indian Languages</div>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  Designed specifically for the Indian linguistic landscape. Preserves natural phonetic cadence, warmth, and emotion-aware inflections often flattened by Western TTS backbones.
                </p>
              </div>

              {/* XTTS-v2 */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#18181b] border-[#3a494b]/40'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-on-surface">XTTS-v2 (Coqui)</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    COQUI PUBLIC LICENSE
                  </span>
                </div>
                <div className="text-[11px] font-mono text-on-surface-variant space-y-1 mb-2">
                  <div><strong>Developer:</strong> Coqui Open Community</div>
                  <div><strong>Parameters:</strong> 1.2B</div>
                  <div><strong>Languages:</strong> English, Hindi, 17 languages</div>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  Battle-tested voice cloning framework capable of transferring a speaker's identity into fluent Hindi using just a 6-second English audio recording.
                </p>
              </div>

              {/* AI4Bharat IndicTTS */}
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#18181b] border-[#3a494b]/40'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-on-surface">AI4Bharat IndicTTS</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    MIT LICENSE
                  </span>
                </div>
                <div className="text-[11px] font-mono text-on-surface-variant space-y-1 mb-2">
                  <div><strong>Developer:</strong> IIT Madras / AI4Bharat</div>
                  <div><strong>Parameters:</strong> Modular FastSpeech / VITS</div>
                  <div><strong>Languages:</strong> Hindi, 22 Scheduled Indian Languages</div>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  The gold standard for Indian government infrastructure and localized acoustic benchmarks. Highly accurate phoneme-level mapping for Devanagari Hindi text.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal for Clear History */}
      <ConfirmModal
        isOpen={confirmClearHistory}
        onClose={() => setConfirmClearHistory(false)}
        onConfirm={clearHistory}
        title="Clear Speech History"
        message="Are you sure you want to permanently delete all locally saved speech syntheses?"
        subtext="This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        variant="danger"
        theme={theme}
      />

    </div>
  );
}
