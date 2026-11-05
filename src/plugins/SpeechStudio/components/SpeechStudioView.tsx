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
  Trash2,
  Mic,
  MicOff,
  Radio,
  Upload,
  UserCheck
} from 'lucide-react';
import { WorkspacePluginViewProps } from '../../types.js';
import { TTSQuotaStatus, SpeechHistoryItem, TTSVoiceOption } from '../types.js';
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

const DEFAULT_NEURAL_VOICES: TTSVoiceOption[] = [
  {
    id: 'aarav-neural',
    name: 'Aarav (Hindi / Indic)',
    lang: 'hi-IN',
    languageLabel: 'Hindi (हिंदी)',
    gender: 'male',
    accent: 'Delhi Studio',
    isNeural: true,
    engine: 'neural',
    description: 'Deep, warm studio narrator voice tuned for Hindi and Indian English cadence.'
  },
  {
    id: 'priya-neural',
    name: 'Priya (Hindi / Indic)',
    lang: 'hi-IN',
    languageLabel: 'Hindi (हिंदी)',
    gender: 'female',
    accent: 'Mumbai Conversational',
    isNeural: true,
    engine: 'neural',
    description: 'Clear, conversational studio voice with natural prosody and emotional warmth.'
  },
  {
    id: 'marcus-neural',
    name: 'Marcus (English Studio)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'male',
    accent: 'American Broadcast',
    isNeural: true,
    engine: 'neural',
    description: 'Rich, resonant broadcaster voice suitable for tutorials, news, and technical overviews.'
  },
  {
    id: 'seraphina-neural',
    name: 'Seraphina (English Audiobook)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'female',
    accent: 'Natural Audiobook',
    isNeural: true,
    engine: 'neural',
    description: 'Expressive, melodic narrator voice with subtle breathing pauses and vocal dynamics.'
  }
];

export default function SpeechStudioView({
  logs,
  onAddLog = () => {},
  userToken,
  theme = 'dark',
  userRole = 'Developer',
  userEmail
}: WorkspacePluginViewProps) {
  const isLight = theme === 'light';

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'synthesize' | 'clone' | 'history' | 'models'>('synthesize');

  // Input text and voice parameters
  const [text, setText] = useState<string>(SAMPLE_PROMPTS[0].text);
  const [selectedLang, setSelectedLang] = useState<'all' | 'en' | 'hi'>('all');
  const [neuralVoices, setNeuralVoices] = useState<TTSVoiceOption[]>(DEFAULT_NEURAL_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('aarav-neural');

  // Modulation sliders
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);

  // Audio Playback State
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Voice Cloning State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [clonedSampleBase64, setClonedSampleBase64] = useState<string | null>(null);
  const [clonedSpeakerName, setClonedSpeakerName] = useState<string>('My Replicated Voice');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Rate-limiting quota telemetry
  const [quota, setQuota] = useState<TTSQuotaStatus>({
    role: userRole || 'Developer',
    isUnlimited: userRole === 'Admin',
    limit: 20,
    used: 0,
    remaining: userRole === 'Admin' ? Infinity : 20,
    resetInSeconds: 3600
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState<boolean>(false);

  // Speech history
  const [history, setHistory] = useState<SpeechHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_tts_history');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });

  // Fetch neural voices from backend
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await fetch('/api/plugins/speech-studio/voices');
        if (res.ok) {
          const data = await res.json();
          if (data.voices && Array.isArray(data.voices)) {
            setNeuralVoices(data.voices);
          }
        }
      } catch {
        // Fallback to defaults
      }
    };
    fetchVoices();
  }, []);

  // Fetch quota
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
      setQuota({
        role: userRole || 'Developer',
        isUnlimited: userRole === 'Admin',
        limit: 20,
        used: 0,
        remaining: userRole === 'Admin' ? Infinity : 20,
        resetInSeconds: 3600
      });
    }
  }, [userToken, userRole]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Audio element event listeners
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setPlaybackProgress(0);
    };

    const handleError = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Filter voices by selected language pill
  const filteredVoices = neuralVoices.filter(v => {
    if (selectedLang === 'hi') return v.lang.startsWith('hi');
    if (selectedLang === 'en') return v.lang.startsWith('en');
    return true;
  });

  // Handle Play / Pause / Stop
  const handleTogglePlay = () => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    if (isPlaying && !isPaused) {
      audio.pause();
      setIsPaused(true);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setIsPaused(false);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleStop = () => {
    const audio = audioPlayerRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setPlaybackProgress(0);
  };

  // Handle Studio Synthesis
  const handleSynthesize = async () => {
    if (!text.trim()) return;
    setErrorMessage(null);
    setIsSynthesizing(true);
    handleStop();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

      const activeVoice = neuralVoices.find(v => v.id === selectedVoiceId) || neuralVoices[0];
      const res = await fetch('/api/plugins/speech-studio/synthesize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          lang: activeVoice.lang,
          voiceId: activeVoice.id,
          voiceName: activeVoice.name,
          rate,
          pitch,
          volume
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setErrorMessage(data.error || 'Rate limit reached.');
          if (data.quota) setQuota(data.quota);
          return;
        }
        throw new Error(data.error || 'Speech synthesis failed.');
      }

      if (data.quota) setQuota(data.quota);

      // Set audio and play
      if (data.audioUrl) {
        setCurrentAudioUrl(data.audioUrl);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = data.audioUrl;
          audioPlayerRef.current.volume = volume;
          audioPlayerRef.current.playbackRate = rate;
          audioPlayerRef.current.play().then(() => {
            setIsPlaying(true);
            setIsPaused(false);
          }).catch(() => {});
        }
      }

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `TTS: Synthesized "${text.slice(0, 30)}..." via ${activeVoice.name} (${data.engine})`
      });

      // Save to history
      const historyEntry: SpeechHistoryItem = {
        id: `tts-${Date.now()}`,
        text: text.trim(),
        language: activeVoice.lang,
        voiceName: activeVoice.name,
        charCount: text.length,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationEstimateSec: data.telemetry?.estimatedDurationSec || 3,
        audioUrl: data.audioUrl,
        engine: data.engine
      };

      setHistory(prev => {
        const next = [historyEntry, ...prev.slice(0, 29)];
        try { localStorage.setItem('sutharlabs_tts_history', JSON.stringify(next)); } catch { }
        return next;
      });

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to synthesize neural speech.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // --- Voice Cloning Handlers ---
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setClonedSampleBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 15) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      setErrorMessage(`Microphone access error: ${err.message}. Please allow microphone permissions.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrorMessage('Please select a valid audio file (.wav, .mp3, .ogg).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setClonedSampleBase64(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCloneAndSynthesize = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter the text you want your replicated voice to speak.');
      return;
    }

    if (!clonedSampleBase64) {
      setErrorMessage('Please record or upload a 5–10 second reference voice audio clip first.');
      return;
    }

    setErrorMessage(null);
    setIsSynthesizing(true);
    handleStop();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

      const res = await fetch('/api/plugins/speech-studio/clone-voice', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          sampleAudio: clonedSampleBase64,
          speakerName: clonedSpeakerName,
          rate,
          pitch,
          volume
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voice cloning failed.');

      if (data.quota) setQuota(data.quota);

      if (data.audioUrl) {
        setCurrentAudioUrl(data.audioUrl);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = data.audioUrl;
          audioPlayerRef.current.play().then(() => {
            setIsPlaying(true);
            setIsPaused(false);
          }).catch(() => {});
        }
      }

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `Voice Cloning: Replicated "${clonedSpeakerName}" speaking "${text.slice(0, 25)}..."`
      });

      const historyEntry: SpeechHistoryItem = {
        id: `clone-${Date.now()}`,
        text: text.trim(),
        language: 'Cloned Voice',
        voiceName: clonedSpeakerName,
        charCount: text.length,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationEstimateSec: data.telemetry?.estimatedDurationSec || 4,
        audioUrl: data.audioUrl,
        engine: data.engine
      };

      setHistory(prev => {
        const next = [historyEntry, ...prev.slice(0, 29)];
        try { localStorage.setItem('sutharlabs_tts_history', JSON.stringify(next)); } catch { }
        return next;
      });

    } catch (err: any) {
      setErrorMessage(err.message || 'Voice cloning synthesis failed.');
    } finally {
      setIsSynthesizing(false);
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
      {/* Hidden HTML5 Audio Element */}
      <audio ref={audioPlayerRef} preload="auto" />

      {/* 1. Header with Container Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline/20 pb-4 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Volume2 className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                Neural Speech Studio & Voice Cloning
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">
                SOTA VOICE REPLICATION
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Human-like neural speech synthesis & zero-shot voice cloning. Replicate any user voice from a 5-second audio sample.
            </p>
          </div>
        </div>

        {/* Quota Pill */}
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
        <div className={`flex rounded-lg p-0.5 border text-[11px] ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('synthesize')}
            className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'synthesize'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Studio Voices</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clone')}
            className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'clone'
                ? isLight
                  ? 'bg-white text-purple-700 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#ce5dff]/15 text-[#ce5dff] font-bold border border-[#ce5dff]/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span>Replicate My Voice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'models'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Architectures</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>History ({history.length})</span>
          </button>
        </div>

        {/* Global Player Status Pill */}
        {currentAudioUrl && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 leading-none border shadow-sm ${
                isPlaying
                  ? isLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : isLight ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40'
              }`}
            >
              {isPlaying && !isPaused ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
              <span>{isPlaying && !isPaused ? 'PAUSE' : 'PLAY'}</span>
            </button>

            <button
              type="button"
              onClick={handleStop}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 leading-none border shadow-sm ${
                isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <Square className="w-3.5 h-3.5 shrink-0" />
              <span>STOP</span>
            </button>

            <a
              href={currentAudioUrl}
              download="sutharlabs-neural-speech.wav"
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 leading-none border shadow-sm ${
                isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>DOWNLOAD WAV</span>
            </a>
          </div>
        )}
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: STUDIO VOICES SYNTHESIS */}
      {activeTab === 'synthesize' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Speech Input & Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`p-4 rounded-2xl border shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              {/* Language Filter Pills */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono font-semibold uppercase text-on-surface-variant flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 shrink-0 text-[#00dbe7]" />
                  Language Focus
                </span>
                <div className="flex items-center gap-1">
                  {(['all', 'hi', 'en'] as const).map(langCode => (
                    <button
                      key={langCode}
                      type="button"
                      onClick={() => setSelectedLang(langCode)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        selectedLang === langCode
                          ? isLight
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'bg-[#00dbe7] text-black font-extrabold'
                          : isLight
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-white/5 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {langCode === 'all' ? 'All' : langCode === 'hi' ? 'Hindi (हिंदी)' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Area */}
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  placeholder="Enter script text in Hindi, English, or mixed bilingual speech to synthesize with studio-quality neural voices..."
                  className={`w-full p-3.5 rounded-xl border font-sans text-sm focus:outline-none transition-colors resize-y leading-relaxed ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500'
                      : 'bg-[#121215] border-[#3a494b]/50 text-white focus:border-[#00dbe7]'
                  }`}
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2 pointer-events-none">
                  <span className="text-[10px] font-mono text-on-surface-variant/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                    {text.length} / 5000 chars ({text.trim().split(/\s+/).filter(Boolean).length} words)
                  </span>
                </div>
              </div>

              {/* Sample Script Quick Fillers */}
              <div className="mt-3">
                <div className="text-[10px] font-mono text-on-surface-variant uppercase font-bold mb-1.5">
                  Preset Prompts:
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setText(sample.text)}
                      className={`px-2 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3.5 border-t border-outline/20 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSynthesize}
                    disabled={isSynthesizing || !text.trim()}
                    className={`h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 leading-none border shadow-sm ${
                      isLight
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                        : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 shadow-[#00dbe7]/10'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSynthesizing ? (
                      <>
                        <Zap className="w-4 h-4 animate-spin shrink-0" />
                        <span>SYNTHESIZING...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>SYNTHESIZE NEURAL SPEECH</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setText('')}
                    className={`h-9 px-3 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center justify-center gap-1.5 leading-none ${
                      isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>CLEAR</span>
                  </button>
                </div>

                {playbackProgress > 0 && (
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#00dbe7]">
                    <div className="w-24 h-1.5 bg-black/30 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-[#00dbe7] transition-all duration-150"
                        style={{ width: `${playbackProgress}%` }}
                      />
                    </div>
                    <span>{Math.round(playbackProgress)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voice Selector & Acoustic Modulation Column */}
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center justify-between border-b border-outline/20 pb-2.5">
                <span className="text-xs font-mono font-bold uppercase text-on-surface flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                  Studio Neural Voices
                </span>
                <span className="text-[10px] font-mono text-[#00dbe7] font-semibold">
                  {filteredVoices.length} Models
                </span>
              </div>

              {/* Voice Cards Grid */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredVoices.map(voice => (
                  <div
                    key={voice.id}
                    onClick={() => setSelectedVoiceId(voice.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedVoiceId === voice.id
                        ? isLight
                          ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-xs'
                          : 'bg-[#00dbe7]/10 border-[#00dbe7]/50 text-white shadow-xs'
                        : isLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-sans">{voice.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        voice.gender === 'female'
                          ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {voice.gender}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-tight font-mono">
                      {voice.description || voice.accent}
                    </p>
                  </div>
                ))}
              </div>

              {/* Sliders for Rate, Pitch, Volume */}
              <div className="border-t border-outline/20 pt-3 space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-on-surface flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                  Voice Modulation
                </span>

                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span>Speed / Pace</span>
                    <span className="text-[#00dbe7] font-bold">{rate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-[#00dbe7]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span>Vocal Pitch</span>
                    <span className="text-[#00dbe7] font-bold">{pitch.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-[#00dbe7]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span>Volume</span>
                    <span className="text-[#00dbe7] font-bold">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-[#00dbe7]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ZERO-SHOT VOICE CLONING */}
      {activeTab === 'clone' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cloning Recorder & Sample Ingestion */}
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center gap-2 border-b border-outline/20 pb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4 text-[#ce5dff] shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Step 1: Ingest Voice Sample</h3>
                  <p className="text-[10px] text-on-surface-variant font-mono">Record 5–10s of audio or upload .wav</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-on-surface-variant mb-1">
                  Speaker Profile Name
                </label>
                <input
                  type="text"
                  value={clonedSpeakerName}
                  onChange={(e) => setClonedSpeakerName(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border font-mono text-xs focus:outline-none transition-colors ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                  }`}
                  placeholder="e.g., Suresh (Founder Voice)"
                />
              </div>

              {/* Record via Browser Mic */}
              <div className={`p-4 rounded-xl border text-center space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'
              }`}>
                <div className="flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-rose-500/20 border-2 border-rose-500 animate-pulse text-rose-400'
                      : 'bg-purple-500/10 border border-purple-500/30 text-[#ce5dff]'
                  }`}>
                    <Mic className="w-8 h-8 shrink-0" />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono font-bold">
                    {isRecording ? `Recording Audio: ${recordingDuration}s / 15s max` : 'Record via Microphone'}
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 font-mono">
                    Speak clearly for 5–10 seconds into your mic.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-purple-500 hover:bg-purple-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5 shrink-0" />
                      <span>START RECORDING</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5 shrink-0" />
                      <span>STOP RECORDING</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Or File Upload */}
              <div className="text-center">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase font-bold">
                  — Or Upload Audio File —
                </span>
                <label className={`mt-2 block p-3 rounded-xl border border-dashed cursor-pointer transition-all ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}>
                  <Upload className="w-5 h-5 mx-auto text-on-surface-variant mb-1 shrink-0" />
                  <span className="text-xs font-mono font-semibold block">Select audio file (.wav, .mp3)</span>
                  <span className="text-[10px] text-on-surface-variant font-mono">Max size: 10MB</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preview Ingested Sample */}
              {clonedSampleBase64 && (
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-mono text-emerald-300 font-semibold">
                      Sample Captured & Ready
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClonedSampleBase64(null)}
                    className="text-xs font-mono text-rose-400 hover:text-white cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Script Input & Replicated Output */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center justify-between border-b border-outline/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Step 2: Script for Cloned Voice</h3>
                    <p className="text-[10px] text-on-surface-variant font-mono">
                      Your replicated voice will synthesize this text
                    </p>
                  </div>
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                maxLength={5000}
                placeholder="Enter what you want your replicated voice to say in English, Hindi, or bilingual speech..."
                className={`w-full p-3.5 rounded-xl border font-sans text-sm focus:outline-none transition-colors resize-y leading-relaxed ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-purple-500'
                    : 'bg-[#121215] border-[#3a494b]/50 text-white focus:border-[#ce5dff]'
                }`}
              />

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloneAndSynthesize}
                  disabled={isSynthesizing || !text.trim() || !clonedSampleBase64}
                  className={`h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 leading-none border shadow-sm ${
                    isLight
                      ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700'
                      : 'bg-[#ce5dff]/15 hover:bg-[#ce5dff]/25 text-[#ce5dff] hover:text-white border-[#ce5dff]/50 shadow-[#ce5dff]/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSynthesizing ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin shrink-0" />
                      <span>CLONING & SYNTHESIZING...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 shrink-0" />
                      <span>REPLICATE VOICE & SPEAK</span>
                    </>
                  )}
                </button>

                {!clonedSampleBase64 && (
                  <span className="text-[11px] font-mono text-amber-400">
                    * Capture or upload a 5s voice sample in Step 1 first
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODEL ARCHITECTURES */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-on-surface">F5-TTS (Flow-Matching)</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Zero-Shot Cloning
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                State-of-the-art non-autoregressive flow matching model. Generates natural speech in English and Hindi, matching pitch, cadence, and vocal timbre from a 3–10s audio sample.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-on-surface">Kokoro-82M</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Sub-Second Narrator
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                Lightweight 82M parameter neural synthesizer running at ~0.3s on CPU. Generates natural studio audiobook narration without robotic artifacting.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-on-surface">ChatTTS</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Conversational Realism
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                Designed for dialogue agents. Inserts laughter tags, natural breathing sounds, and conversational pauses for ultra-realistic human rhythm.
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-on-surface">CosyVoice 2 (Alibaba)</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Cross-Lingual
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                Transfers an English voice sample to speak fluent Hindi, and enables fine-grained emotional modulation (calm, joyful, serious).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SPEECH HISTORY */}
      {activeTab === 'history' && (
        <div className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
        }`}>
          <div className="flex items-center justify-between border-b border-outline/20 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#00dbe7] shrink-0" />
              <h3 className="text-sm font-bold text-on-surface">Synthesized Audio History</h3>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearHistory(true)}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant text-xs font-mono">
              No speech history yet. Synthesize or clone a voice to populate audio records.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map(item => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-sans text-on-surface font-medium truncate max-w-lg">
                      "{item.text}"
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant">
                      <span className="text-[#00dbe7] font-bold">{item.voiceName}</span>
                      <span>•</span>
                      <span>{item.charCount} chars (~{item.durationEstimateSec}s)</span>
                      <span>•</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.audioUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.src = item.audioUrl!;
                            audioPlayerRef.current.play();
                            setIsPlaying(true);
                            setIsPaused(false);
                          }
                        }}
                        className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isLight
                            ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                            : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                        }`}
                      >
                        <Play className="w-3 h-3 shrink-0" />
                        <span>Play</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopy(item.text, item.id)}
                      className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                          : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                      }`}
                    >
                      {copiedKey === item.id ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                      <span>{copiedKey === item.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmClearHistory}
        onClose={() => setConfirmClearHistory(false)}
        onConfirm={clearHistory}
        title="Clear Speech History"
        message="Are you sure you want to permanently delete all saved audio synthesis records?"
        subtext="Audio waveforms and script entries will be cleared from your browser storage."
        confirmLabel="Clear History"
        cancelLabel="Cancel"
        variant="danger"
        theme={theme}
      />
    </div>
  );
}
