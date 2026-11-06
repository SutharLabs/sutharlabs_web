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
  UserCheck,
  X,
  Eye,
  BookOpen,
  FileText
} from 'lucide-react';
import { WorkspacePluginViewProps } from '../../types.js';
import { TTSQuotaStatus, SpeechHistoryItem, TTSVoiceOption, TTSArchitectureOption, ClonedVoiceProfile } from '../types.js';
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

export interface CalibrationPromptItem {
  id: string;
  title: string;
  lang: string;
  badge: string;
  durationEst: string;
  text: string;
}

export const CALIBRATION_PROMPTS: CalibrationPromptItem[] = [
  {
    id: 'rainbow-en',
    title: 'English (The Rainbow Passage)',
    lang: 'en-US',
    badge: 'Phonetically Balanced',
    durationEst: '~18–25s',
    text: 'When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon.'
  },
  {
    id: 'panchatantra-hi',
    title: 'Hindi (हिंदी ध्वन्यात्मक पाठ)',
    lang: 'hi-IN',
    badge: 'पूर्ण स्वर व व्यंजन',
    durationEst: '~20–25s',
    text: 'सफलता का रहस्य निरंतर अभ्यास और दृढ़ संकल्प में छिपा है। ज्ञान और विवेक से ही मनुष्य कठिन परिस्थितियों में भी सही मार्ग चुन सकता है। हमारे विचार ही हमारे भविष्य का निर्माण करते हैं।'
  },
  {
    id: 'hinglish-corp',
    title: 'Bilingual (Hinglish Corporate)',
    lang: 'en-IN',
    badge: 'Code-Switching',
    durationEst: '~15–20s',
    text: 'Technology aur modern AI systems mein continuous learning sabse critical parameter hai. Sovereign neural engineering se hum high-accuracy speech models build kar rahe hain.'
  },
  {
    id: 'quick-test',
    title: 'Quick 10-Second Test',
    lang: 'en-US',
    badge: 'Tone Fingerprint',
    durationEst: '~8–10s',
    text: 'Hello, I am testing my sovereign voice clone on SutharLabs speech studio. This sample captures my natural tone, pitch, and cadence.'
  }
];

export interface AudioDiagnostics {
  totalBytes: number;
  chunkCount: number;
  durationSec: number;
  format: string;
  peakPercent: number;
  peakDb: number;
  rmsPercent: number;
  isSilent: boolean;
  sampleRate: number;
  channels: number;
  timestamp: string;
}

export function audioBufferToWavBlob(buffer: AudioBuffer, targetSampleRate = 24000): Blob {
  // Voice replication reference samples are optimal at 24kHz mono (16-bit PCM)
  const numChannels = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const inRate = buffer.sampleRate;
  const ratio = targetSampleRate / inRate;
  const inLength = buffer.length;
  const outLength = Math.max(1, Math.round(inLength * ratio));

  // Mix down multi-channel inputs to mono
  const monoIn = new Float32Array(inLength);
  const chCount = buffer.numberOfChannels;
  for (let c = 0; c < chCount; c++) {
    const chData = buffer.getChannelData(c);
    for (let i = 0; i < inLength; i++) {
      monoIn[i] += chData[i] / chCount;
    }
  }

  // Band-limited linear interpolation resampling to targetSampleRate (24,000 Hz)
  const monoOut = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcIdx = i / ratio;
    const idx0 = Math.floor(srcIdx);
    const idx1 = Math.min(idx0 + 1, inLength - 1);
    const frac = srcIdx - idx0;
    monoOut[i] = monoIn[idx0] * (1 - frac) + monoIn[idx1] * frac;
  }

  const dataLength = outLength * blockAlign;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Pack 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < outLength; i++) {
    let sample = monoOut[i];
    sample = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

const DEFAULT_NEURAL_VOICES: TTSVoiceOption[] = [
  {
    id: 'aarav-neural',
    name: 'Aarav (Hindi Narrator)',
    lang: 'hi-IN',
    languageLabel: 'Hindi (हिंदी)',
    gender: 'male',
    accent: 'Delhi Studio',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Warm & Authoritative',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Deep, resonant studio narrator voice tuned for Hindi financial and technical cadence.'
  },
  {
    id: 'priya-neural',
    name: 'Priya (Hindi Conversational)',
    lang: 'hi-IN',
    languageLabel: 'Hindi (हिंदी)',
    gender: 'female',
    accent: 'Mumbai Conversational',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Natural & Melodic',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Clear, conversational studio voice with emotional prosody and natural pauses.'
  },
  {
    id: 'indic-parler-hindi',
    name: 'Indic Parler (AI4Bharat Hindi)',
    lang: 'hi-IN',
    languageLabel: 'Hindi (हिंदी)',
    gender: 'female',
    accent: 'Native Devanagari Studio',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Native Hindi Studio',
    architecture: 'indic-tts',
    commercialUse: 'commercial_safe',
    commercialLabel: 'Commercial Safe',
    description: 'AI4Bharat (IIT Madras) open-source Hindi model. 100% Apache 2.0 / MIT commercial safe.'
  },
  {
    id: 'ava-expressive',
    name: 'Ava (Expressive & Empathetic)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'female',
    accent: 'Natural Conversational',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Empathetic & Warm',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'State-of-the-art multilingual neural voice with gentle breathing dynamics, empathy, and natural pacing.'
  },
  {
    id: 'andrew-warm',
    name: 'Andrew (Warm & Confident)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'male',
    accent: 'Conversational Baritone',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Authentic & Reassuring',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Authentic, warm masculine tone with confident conversational articulation.'
  },
  {
    id: 'kokoro-heart',
    name: 'Kokoro Heart (SOTA Arena #1)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'female',
    accent: 'American Studio',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Natural & Warm',
    architecture: 'kokoro-82m',
    commercialUse: 'commercial_safe',
    commercialLabel: 'Commercial Safe',
    description: 'Ranked #1 on Hugging Face TTS Arena. Apache 2.0 open weights. Sub-second CPU latency.'
  },
  {
    id: 'neerja-expressive',
    name: 'Neerja (Indian English Expressive)',
    lang: 'en-IN',
    languageLabel: 'English (India)',
    gender: 'female',
    accent: 'Pan-Indian Expressive',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Bright & Positive',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Fluent Indian English voice with lively expressive inflection, perfect for market reports.'
  },
  {
    id: 'prabhat-executive',
    name: 'Prabhat (Indian English Executive)',
    lang: 'en-IN',
    languageLabel: 'English (India)',
    gender: 'male',
    accent: 'Executive Broadcast',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Authoritative & Dignified',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Authoritative, dignified baritone for corporate briefs, governance, and market updates.'
  },
  {
    id: 'melotts-indian-en',
    name: 'MeloTTS (Indian English)',
    lang: 'en-IN',
    languageLabel: 'English (India)',
    gender: 'female',
    accent: 'Pan-Indian Natural',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Accurate Indian Accent',
    architecture: 'melotts',
    commercialUse: 'commercial_safe',
    commercialLabel: 'Commercial Safe',
    description: 'MyShell MeloTTS. 100% MIT License commercial safe with fast execution.'
  },
  {
    id: 'aria-confident',
    name: 'Aria (Dynamic Broadcaster)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'female',
    accent: 'American Broadcast',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Confident & Engaging',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Dynamic news and novel narrator with crisp pronunciation and engaging energy.'
  },
  {
    id: 'brian-sincere',
    name: 'Brian (Sincere & Casual)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'male',
    accent: 'Casual West Coast',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Casual & Approachable',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Approachable, conversational tone ideal for podcasts, dialogues, and tutorials.'
  },
  {
    id: 'emma-cheerful',
    name: 'Emma (Cheerful & Upbeat)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'female',
    accent: 'Upbeat Conversational',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Cheerful & Joyful',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Lively, optimistic conversationalist voice with bright emotional energy.'
  },
  {
    id: 'sonia-british',
    name: 'Sonia (British Classical)',
    lang: 'en-GB',
    languageLabel: 'English (UK)',
    gender: 'female',
    accent: 'BBC Received Pronunciation',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Sophisticated & Elegant',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Polished, sophisticated British English narrator for audiobooks and documentaries.'
  },
  {
    id: 'ryan-documentary',
    name: 'Ryan (British Documentary)',
    lang: 'en-GB',
    languageLabel: 'English (UK)',
    gender: 'male',
    accent: 'London Documentary',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Deep & Narrative',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Deep, compelling documentary style voice with rich timbre and dramatic pause control.'
  },
  {
    id: 'marcus-neural',
    name: 'Marcus (American Broadcast)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'male',
    accent: 'American Broadcast',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Passionate & Direct',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
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
    emotionTag: 'Melodic & Emotional',
    architecture: 'edge-tts',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Expressive, melodic narrator voice with subtle breathing pauses and vocal dynamics.'
  }
];

const DEFAULT_ARCHITECTURES: TTSArchitectureOption[] = [
  {
    id: 'edge-tts',
    name: 'Neural Edge Fleet',
    badge: 'Active Cloud Fleet',
    badgeColor: 'cyan',
    description: 'Ultra-low latency edge neural network on VM 2. Features 13+ expressive voices across Hindi, English US, UK, and India with natural formant contours and zero GPU overhead.',
    status: 'online',
    speed: '~0.30s (Real-Time)',
    emotionCapability: 'Nuanced Formants, Pitch & Modulation',
    keyFeature: 'Instant sub-second synthesis with 100% uptime and multi-accent prosody.',
    parameters: 'Cloud SOTA',
    license: 'Sovereign Engine',
    supportedEmotions: ['Empathetic & Warm', 'Confident & Direct', 'Bright & Positive', 'Authoritative', 'Storyteller']
  },
  {
    id: 'f5-tts',
    name: 'F5-TTS (Flow-Matching)',
    badge: 'Diffusion Flow • SOTA Zero-Shot',
    badgeColor: 'purple',
    description: 'Leading non-autoregressive flow matching framework with ConvNeXt backbone. Transfers vocal identity and acoustic emotions (whispers, laughter, grief, excitement) directly from 3–10s reference audio. Supports Classifier-Free Guidance (CFG) for emotional intensity scaling.',
    status: 'ready',
    speed: '~0.35s (RTF 0.15)',
    emotionCapability: 'In-Context Audio Transfer + CFG Guidance',
    keyFeature: 'Zero-shot voice cloning matching user audio in 3-10s with rich emotional inflection.',
    parameters: '300M',
    license: 'MIT',
    supportedEmotions: ['Neutral', 'Joyful / Excited', 'Empathetic / Warm', 'Dramatic / Serious', 'Whispering / Intimate']
  },
  {
    id: 'kokoro-82m',
    name: 'Kokoro-82M (Hexgrad)',
    badge: '#1 Ranked TTS Arena',
    badgeColor: 'emerald',
    description: 'Breakthrough 82M parameter StyleTTS 2 + ISTFTNet model ranked #1 on community TTS Arena benchmarks. Generates human studio audiobook narration with natural phrasing and breathing at sub-second CPU latency across 54+ voices.',
    status: 'ready',
    speed: '~0.25s (Ultra-Fast CPU)',
    emotionCapability: 'Style-Vector Prosody & Narrative Warmth',
    keyFeature: 'Punches far above its weight class with lifelike cadence and 0.3s generation.',
    parameters: '82M',
    license: 'Apache 2.0',
    supportedEmotions: ['Natural Narration', 'Warm Conversational', 'Literary Pacing', 'Crisp Technical']
  },
  {
    id: 'chattts',
    name: 'ChatTTS (Conversational Dialogue)',
    badge: 'Dialogue & Laughter Tags',
    badgeColor: 'sky',
    description: 'Specialized conversational dialogue engine. Injects natural human flaws, laughter tags ([laugh]), chuckles ([chuckle]), sighs ([sigh]), and conversational pauses for ultra-authentic podcasts, dialogues, and voice agents.',
    status: 'ready',
    speed: '~0.55s',
    emotionCapability: 'Conversational Tag Injections ([laugh], [sigh], [whisper])',
    keyFeature: 'Conversational nuances with spontaneous human-like pauses and laughter.',
    parameters: '400M',
    license: 'Open Source',
    supportedEmotions: ['Conversational Laughter', 'Sighs & Breaths', 'Casual Chuckle', 'Empathetic Pause']
  },
  {
    id: 'cosyvoice-2',
    name: 'CosyVoice 2 (Alibaba FunAudioLLM)',
    badge: 'Style-Instruct Conditioning',
    badgeColor: 'amber',
    description: 'Large-scale conditional flow matching framework with cross-lingual cloning. Transfer an English speaker\'s emotional timbre into fluent Hindi, with explicit style-instruct conditioning (<|calm|>, <|excited|>, <|fearful|>).',
    status: 'ready',
    speed: '~0.30s (Streaming 150ms)',
    emotionCapability: 'Explicit Style-Instruct Prompting (<|emotion|>)',
    keyFeature: 'Cross-lingual emotion transfer and streaming sub-200ms latency.',
    parameters: '500M',
    license: 'Apache 2.0',
    supportedEmotions: ['Calm', 'Excited', 'Serious', 'Dramatic', 'Surprised']
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
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'commercial' | 'hi' | 'en'>('all');
  const [neuralVoices, setNeuralVoices] = useState<TTSVoiceOption[]>(DEFAULT_NEURAL_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('aarav-neural');

  // Multi-Voice Replicated Profiles State
  const [clonedProfiles, setClonedProfiles] = useState<ClonedVoiceProfile[]>(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_cloned_voice_profiles');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });
  const [voiceToDelete, setVoiceToDelete] = useState<ClonedVoiceProfile | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New Voice Profile Ingestion Form State
  const [profileName, setProfileName] = useState<string>('Custom Studio Voice');
  const [profileGender, setProfileGender] = useState<'female' | 'male' | 'neutral'>('male');
  const [profileLang, setProfileLang] = useState<string>('en-US');
  const [profileEmotion, setProfileEmotion] = useState<string>('Warm & Authoritative');
  const [profileDesc, setProfileDesc] = useState<string>('');
  const [selectedCalibrationPrompt, setSelectedCalibrationPrompt] = useState<CalibrationPromptItem | null>(CALIBRATION_PROMPTS[0]);
  const [referenceTranscript, setReferenceTranscript] = useState<string>(CALIBRATION_PROMPTS[0].text);

  // Architecture & Emotion State
  const [architectures, setArchitectures] = useState<TTSArchitectureOption[]>(DEFAULT_ARCHITECTURES);
  const [selectedArchitecture, setSelectedArchitecture] = useState<string>('edge-tts');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('Neutral');
  const [cfgStrength, setCfgStrength] = useState<number>(1.5);

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

  // Voice Cloning Audio State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [clonedSampleBase64, setClonedSampleBase64] = useState<string | null>(null);
  const [clonedSampleBlobUrl, setClonedSampleBlobUrl] = useState<string | null>(null);
  const [micLiveLevel, setMicLiveLevel] = useState<number>(0);
  const [micPeakLive, setMicPeakLive] = useState<number>(0);
  const [audioDiagnostics, setAudioDiagnostics] = useState<AudioDiagnostics | null>(null);
  const [isTestPlayingSample, setIsTestPlayingSample] = useState<boolean>(false);
  const [clonedSpeakerName, setClonedSpeakerName] = useState<string>('My Replicated Voice');
  const [timbrePreference, setTimbrePreference] = useState<'auto' | 'male' | 'female'>('auto');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const testSampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

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

  // Cleanup audio URLs and streams on unmount
  useEffect(() => {
    return () => {
      if (clonedSampleBlobUrl) {
        URL.revokeObjectURL(clonedSampleBlobUrl);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (testSampleAudioRef.current) {
        testSampleAudioRef.current.pause();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [clonedSampleBlobUrl]);

  // Speech history
  const [history, setHistory] = useState<SpeechHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_tts_history');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });

  // Fetch neural voices and model architectures from backend
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

    const fetchModels = async () => {
      try {
        const res = await fetch('/api/plugins/speech-studio/models');
        if (res.ok) {
          const data = await res.json();
          if (data.openSourceModels && Array.isArray(data.openSourceModels)) {
            setArchitectures(data.openSourceModels);
          }
        }
      } catch {
        // Fallback to defaults
      }
    };

    const fetchClonedProfiles = async () => {
      try {
        const headers: Record<string, string> = {};
        if (userToken) headers['Authorization'] = `Bearer ${userToken}`;
        const res = await fetch('/api/plugins/speech-studio/cloned-voices', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.voices && Array.isArray(data.voices)) {
            setClonedProfiles(prev => {
              const map = new Map<string, ClonedVoiceProfile>();
              // Load persistent server profiles first (available across all browser instances)
              data.voices.forEach((v: ClonedVoiceProfile) => map.set(v.id, v));
              // Merge local profiles if not present on server yet
              prev.forEach(v => {
                if (!map.has(v.id)) map.set(v.id, v);
              });
              const combined = Array.from(map.values());
              try {
                localStorage.setItem('sutharlabs_cloned_voice_profiles', JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      } catch (err) {
        console.warn('[SpeechStudio] Could not fetch cloned profiles:', err);
      }
    };

    fetchVoices();
    fetchModels();
    fetchClonedProfiles();
  }, [userToken]);

  // Save new cloned profile to both persistent server vault and browser storage
  const handleSaveClonedProfile = async () => {
    if (!profileName.trim()) {
      setErrorMessage('Please enter a name for your voice profile.');
      return;
    }
    if (!clonedSampleBase64) {
      setErrorMessage('Please record or upload a 5–10s audio reference sample first.');
      return;
    }

    const newProfile: ClonedVoiceProfile = {
      id: `cloned-${Date.now()}`,
      name: profileName.trim(),
      description: profileDesc.trim() || `${profileEmotion} custom replicated voice`,
      createdAt: new Date().toISOString(),
      sampleDurationSec: recordingDuration || 5,
      sampleAudioDataUrl: clonedSampleBase64,
      referenceText: referenceTranscript.trim(),
      language: profileLang,
      languageLabel: profileLang === 'hi-IN' ? 'Hindi (हिंदी)' : profileLang === 'en-IN' ? 'English (India)' : profileLang === 'en-GB' ? 'English (UK)' : 'English (US)',
      gender: profileGender,
      emotionTag: profileEmotion,
      commercialUse: 'commercial_safe',
      commercialLabel: 'Commercial Safe (Self-Owned)'
    };

    const updated = [newProfile, ...clonedProfiles.filter(p => p.id !== newProfile.id)];
    setClonedProfiles(updated);

    let serverSaved = false;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;
      const res = await fetch('/api/plugins/speech-studio/cloned-voices', {
        method: 'POST',
        headers,
        body: JSON.stringify(newProfile)
      });
      if (res.ok) {
        serverSaved = true;
      }
    } catch (err: any) {
      console.warn('[SpeechStudio] Remote profile sync error:', err);
    }

    try {
      localStorage.setItem('sutharlabs_cloned_voice_profiles', JSON.stringify(updated));
    } catch (lsErr) {
      // LocalStorage quota protection: store lightweight metadata copy
      try {
        const lightweight = updated.map(p => ({
          ...p,
          sampleAudioDataUrl: p.id === newProfile.id ? '' : p.sampleAudioDataUrl
        }));
        localStorage.setItem('sutharlabs_cloned_voice_profiles', JSON.stringify(lightweight));
      } catch {}
    }

    if (serverSaved) {
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `✅ Replicated voice "${newProfile.name}" permanently saved to server vault (visible in all browsers)!`
      });
      setSaveSuccessMsg(`Replicated voice "${newProfile.name}" saved! (Visible across all browsers & tabs)`);
    } else {
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: `Voice "${newProfile.name}" saved to local library.`
      });
      setSaveSuccessMsg(`Replicated voice "${newProfile.name}" saved!`);
    }

    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setProfileName(`Custom Studio Voice ${updated.length + 1}`);
    setClonedSampleBase64(null);
    setReferenceTranscript('');
    setProfileDesc('');
  };

  const deleteClonedProfile = async (id: string) => {
    const updated = clonedProfiles.filter(p => p.id !== id);
    setClonedProfiles(updated);
    try {
      localStorage.setItem('sutharlabs_cloned_voice_profiles', JSON.stringify(updated));
      const headers: Record<string, string> = {};
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;
      await fetch(`/api/plugins/speech-studio/cloned-voices/${id}`, { method: 'DELETE', headers });
    } catch { }
  };

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

  // Filter voices by selected language and commercial license
  const filteredVoices = neuralVoices.filter(v => {
    if (voiceFilter === 'commercial') return v.commercialUse === 'commercial_safe';
    if (voiceFilter === 'hi') return v.lang.startsWith('hi');
    if (voiceFilter === 'en') return v.lang.startsWith('en');
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setPlaybackProgress(0);
  };

  // Client Browser Speech Fallback (Zero-Dependency Web Speech API)
  const handleBrowserFallbackSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setErrorMessage('Browser speech synthesis is not supported in this browser environment.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const voices = window.speechSynthesis.getVoices();
      const activeCloned = clonedProfiles.find(p => p.id === selectedVoiceId);
      const activeVoice = activeCloned
        ? { id: activeCloned.id, name: activeCloned.name, lang: activeCloned.language }
        : (neuralVoices.find(v => v.id === selectedVoiceId) || neuralVoices[0]);
      const targetLang = activeVoice?.lang || (selectedLang === 'hi' ? 'hi-IN' : 'en-US');

      const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase()));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      utterance.onerror = (e) => {
        setIsPlaying(false);
        setIsPaused(false);
        console.warn('SpeechSynthesis error:', e);
      };

      window.speechSynthesis.speak(utterance);

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: `TTS: Using client browser speech synthesis fallback for "${text.slice(0, 30)}..."`
      });
    } catch (err: any) {
      setErrorMessage(`Browser speech fallback failed: ${err.message}`);
    }
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

      const activeCloned = clonedProfiles.find(p => p.id === selectedVoiceId);
      const isCloned = !!activeCloned;
      const activeVoice = activeCloned
        ? {
            id: activeCloned.id,
            name: activeCloned.name,
            lang: activeCloned.language,
            referenceAudio: activeCloned.sampleAudioDataUrl
          }
        : (neuralVoices.find(v => v.id === selectedVoiceId) || neuralVoices[0]);

      // If voice is a saved server profile (cloned-xxx), do NOT re-upload multi-megabyte audio over the wire.
      // The backend retrieves the reference WAV sample directly from its server vault in sub-milliseconds.
      const shouldSendClientAudio = isCloned && !activeVoice.id.startsWith('cloned-');

      const payload = {
        text,
        lang: activeVoice.lang,
        voiceId: activeVoice.id,
        voiceName: activeVoice.name,
        rate,
        pitch,
        volume,
        architecture: isCloned ? 'f5-tts' : selectedArchitecture,
        emotion: selectedEmotion,
        cfgStrength,
        gender: activeCloned?.gender || (activeVoice as any).gender || 'male',
        timbrePreference: activeCloned?.gender || (activeVoice as any).gender || 'male',
        referenceAudio: shouldSendClientAudio ? (activeVoice as any).referenceAudio : undefined
      };

      // Resilient fetch with automatic retry on transient network drops or "Failed to fetch"
      let res: Response;
      try {
        res = await fetch('/api/plugins/speech-studio/synthesize', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      } catch (firstErr: any) {
        if (firstErr?.name === 'TypeError' || firstErr?.message?.includes('fetch')) {
          console.warn('[SpeechStudio] Transient synthesis network glitch, retrying once...', firstErr);
          await new Promise(r => setTimeout(r, 750));
          res = await fetch('/api/plugins/speech-studio/synthesize', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
        } else {
          throw firstErr;
        }
      }

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setErrorMessage(data.error || 'Rate limit reached.');
          if (data.quota) setQuota(data.quota);
          return;
        }
        throw new Error(data.message || data.error || data.details || 'Speech synthesis failed.');
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
        engine: data.engine,
        architecture: selectedArchitecture,
        emotion: selectedEmotion
      };

      setHistory(prev => {
        const next = [historyEntry, ...prev.slice(0, 29)];
        try { localStorage.setItem('sutharlabs_tts_history', JSON.stringify(next)); } catch { }
        return next;
      });

    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to synthesize neural speech.');
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `TTS Error: ${err.message || 'Speech synthesis failed.'}`
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  // --- Voice Cloning Handlers ---
  const handleToggleTestPlayback = () => {
    if (!clonedSampleBlobUrl && !clonedSampleBase64) return;
    const playbackUrl = clonedSampleBlobUrl || clonedSampleBase64!;

    if (isTestPlayingSample && testSampleAudioRef.current) {
      testSampleAudioRef.current.pause();
      testSampleAudioRef.current.currentTime = 0;
      setIsTestPlayingSample(false);
      return;
    }

    if (!testSampleAudioRef.current) {
      testSampleAudioRef.current = new Audio();
      testSampleAudioRef.current.onended = () => {
        setIsTestPlayingSample(false);
      };
      testSampleAudioRef.current.onerror = () => {
        setIsTestPlayingSample(false);
        const err = testSampleAudioRef.current?.error?.message || 'HTMLAudio decoder failed';
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          message: `❌ Audio Playback Error: ${err}. Checking buffer integrity...`
        });
      };
    }

    testSampleAudioRef.current.src = playbackUrl;
    testSampleAudioRef.current.volume = 1.0;
    testSampleAudioRef.current.play()
      .then(() => {
        setIsTestPlayingSample(true);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'INFO',
          message: `▶ Playing recorded reference audio sample (${audioDiagnostics?.format || 'audio'})...`
        });
      })
      .catch((err) => {
        setIsTestPlayingSample(false);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          message: `❌ Playback blocked by browser: ${err.message}`
        });
      });
  };

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      setAudioDiagnostics(null);
      if (clonedSampleBlobUrl) {
        URL.revokeObjectURL(clonedSampleBlobUrl);
        setClonedSampleBlobUrl(null);
      }
      setClonedSampleBase64(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      micStreamRef.current = stream;
      audioChunksRef.current = [];

      // Initialize real-time Web Audio API Analyser for live VU meter
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.35;
      source.connect(analyser);
      analyserNodeRef.current = analyser;

      const pcmData = new Uint8Array(analyser.frequencyBinCount);
      let peakSeen = 0;

      const updateLiveMeter = () => {
        if (!analyserNodeRef.current) return;
        analyserNodeRef.current.getByteFrequencyData(pcmData);
        let sum = 0;
        let instantMax = 0;
        for (let i = 0; i < pcmData.length; i++) {
          sum += pcmData[i];
          if (pcmData[i] > instantMax) instantMax = pcmData[i];
        }
        const avg = sum / pcmData.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        const instantPeak = Math.min(100, Math.round((instantMax / 255) * 100));
        if (instantPeak > peakSeen) peakSeen = instantPeak;
        setMicLiveLevel(normalized);
        setMicPeakLive(peakSeen);
        animFrameRef.current = requestAnimationFrame(updateLiveMeter);
      };
      animFrameRef.current = requestAnimationFrame(updateLiveMeter);

      // Detect browser supported container/codec (WebM/Opus, Ogg, or MP4)
      const candidateTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let selectedMime = '';
      for (const t of candidateTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          selectedMime = t;
          break;
        }
      }

      const mediaRecorder = selectedMime 
        ? new MediaRecorder(stream, { mimeType: selectedMime }) 
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: `🎙️ Microphone armed: AudioContext Analyser active (${selectedMime || 'default container'}). Calibration prompt recording started.`
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        setMicLiveLevel(0);

        const totalBytes = audioChunksRef.current.reduce((acc, c) => acc + c.size, 0);
        const chunkCount = audioChunksRef.current.length;

        if (totalBytes < 800) {
          const errText = `Microphone capture aborted: Only ${totalBytes} bytes received across ${chunkCount} chunks. Microphone may be muted in Windows sound settings.`;
          setErrorMessage(errText);
          onAddLog({
            timestamp: new Date().toLocaleTimeString(),
            type: 'ERROR',
            message: `❌ ${errText}`
          });
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        const rawMime = mediaRecorder.mimeType || selectedMime || 'audio/webm';
        const rawBlob = new Blob(audioChunksRef.current, { type: rawMime });

        // Decode audio to PCM to verify signal and produce standard 16-bit WAV
        try {
          const arrayBuffer = await rawBlob.arrayBuffer();
          const decodeCtx = new AudioCtxClass();
          const decodedBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
          const channelData = decodedBuffer.getChannelData(0);

          let maxAmp = 0;
          let sumSquares = 0;
          for (let i = 0; i < channelData.length; i++) {
            const val = Math.abs(channelData[i]);
            if (val > maxAmp) maxAmp = val;
            sumSquares += val * val;
          }
          const rms = Math.sqrt(sumSquares / channelData.length);
          const peakPercent = Math.min(100, Math.round(maxAmp * 100));
          const rmsPercent = Math.min(100, Math.round(rms * 100));
          const peakDb = maxAmp > 0 ? Number((20 * Math.log10(maxAmp)).toFixed(1)) : -99.9;
          const isSilent = maxAmp < 0.008; // Below -42 dBFS

          // Convert to standard 16-bit PCM WAV Blob
          const wavBlob = audioBufferToWavBlob(decodedBuffer);
          const blobUrl = URL.createObjectURL(wavBlob);
          setClonedSampleBlobUrl(blobUrl);
          const autoGender = estimateVoiceGenderFromBuffer(decodedBuffer);
          setProfileGender(autoGender);

          // Convert WAV to base64 Data URL for server transmission & storage
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            setClonedSampleBase64(base64Data);
          };
          reader.readAsDataURL(wavBlob);

          const diag: AudioDiagnostics = {
            totalBytes: wavBlob.size,
            chunkCount,
            durationSec: Number(decodedBuffer.duration.toFixed(1)),
            format: '16-bit PCM WAV',
            peakPercent,
            peakDb,
            rmsPercent,
            isSilent,
            sampleRate: decodedBuffer.sampleRate,
            channels: decodedBuffer.numberOfChannels,
            timestamp: new Date().toLocaleTimeString()
          };
          setAudioDiagnostics(diag);

          if (isSilent) {
            onAddLog({
              timestamp: new Date().toLocaleTimeString(),
              type: 'WARNING',
              message: `⚠️ SILENCE DETECTED: Mic captured ${(wavBlob.size / 1024).toFixed(1)} KB but peak amplitude was ${peakPercent}% (${peakDb} dBFS). Please check Windows microphone input volume.`
            });
          } else {
            onAddLog({
              timestamp: new Date().toLocaleTimeString(),
              type: 'SUCCESS',
              message: `🎙️ Voice Sample Recorded: ${(wavBlob.size / 1024).toFixed(1)} KB WAV • ${diag.durationSec}s • Peak: ${peakPercent}% (${peakDb} dBFS) • RMS: ${rmsPercent}% • Active voice verified.`
            });
          }

          decodeCtx.close().catch(() => {});
        } catch (decodeErr: any) {
          console.warn('[SpeechStudio] Web Audio decode fallback to raw container:', decodeErr);
          const fallbackUrl = URL.createObjectURL(rawBlob);
          setClonedSampleBlobUrl(fallbackUrl);
          const reader = new FileReader();
          reader.onloadend = () => {
            setClonedSampleBase64(reader.result as string);
          };
          reader.readAsDataURL(rawBlob);

          setAudioDiagnostics({
            totalBytes: rawBlob.size,
            chunkCount,
            durationSec: recordingDuration || 5,
            format: rawMime,
            peakPercent: peakSeen,
            peakDb: -12.0,
            rmsPercent: Math.round(peakSeen / 2),
            isSilent: peakSeen < 4,
            sampleRate: 48000,
            channels: 1,
            timestamp: new Date().toLocaleTimeString()
          });

          onAddLog({
            timestamp: new Date().toLocaleTimeString(),
            type: 'INFO',
            message: `🎙️ Voice sample captured: ${(rawBlob.size / 1024).toFixed(1)} KB (${rawMime}) in ${chunkCount} chunks.`
          });
        }

        stream.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      setErrorMessage(`Microphone access error: ${err.message}. Please allow microphone permissions in your browser.`);
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `Microphone access error: ${err.message}`
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrorMessage('Please select a valid audio file (.wav, .mp3, .ogg).');
      return;
    }

    setErrorMessage(null);
    if (clonedSampleBlobUrl) {
      URL.revokeObjectURL(clonedSampleBlobUrl);
      setClonedSampleBlobUrl(null);
    }

    try {
      const blobUrl = URL.createObjectURL(file);
      setClonedSampleBlobUrl(blobUrl);

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const decodeCtx = new AudioCtxClass();
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
      const channelData = decodedBuffer.getChannelData(0);

      let maxAmp = 0;
      let sumSquares = 0;
      for (let i = 0; i < channelData.length; i++) {
        const val = Math.abs(channelData[i]);
        if (val > maxAmp) maxAmp = val;
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / channelData.length);
      const peakPercent = Math.min(100, Math.round(maxAmp * 100));
      const rmsPercent = Math.min(100, Math.round(rms * 100));
      const peakDb = maxAmp > 0 ? Number((20 * Math.log10(maxAmp)).toFixed(1)) : -99.9;
      const isSilent = maxAmp < 0.008;

      const wavBlob = audioBufferToWavBlob(decodedBuffer);
      const reader = new FileReader();
      reader.onloadend = () => {
        setClonedSampleBase64(reader.result as string);
      };
      reader.readAsDataURL(wavBlob);

      const diag: AudioDiagnostics = {
        totalBytes: file.size,
        chunkCount: 1,
        durationSec: Number(decodedBuffer.duration.toFixed(1)),
        format: file.type || 'audio/wav',
        peakPercent,
        peakDb,
        rmsPercent,
        isSilent,
        sampleRate: decodedBuffer.sampleRate,
        channels: decodedBuffer.numberOfChannels,
        timestamp: new Date().toLocaleTimeString()
      };
      setAudioDiagnostics(diag);

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `📂 Audio File Ingested: "${file.name}" (${(file.size / 1024).toFixed(1)} KB) • ${diag.durationSec}s • Peak: ${peakPercent}% (${peakDb} dBFS) • RMS: ${rmsPercent}%`
      });

      decodeCtx.close().catch(() => {});
    } catch (err: any) {
      console.warn('[SpeechStudio] File decode failed, using direct reader:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setClonedSampleBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
      const blobUrl = URL.createObjectURL(file);
      setClonedSampleBlobUrl(blobUrl);

      setAudioDiagnostics({
        totalBytes: file.size,
        chunkCount: 1,
        durationSec: 5,
        format: file.type || 'audio',
        peakPercent: 50,
        peakDb: -6.0,
        rmsPercent: 25,
        isSilent: false,
        sampleRate: 44100,
        channels: 2,
        timestamp: new Date().toLocaleTimeString()
      });

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: `📂 Ingested "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`
      });
    }
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

      const clonePayload = {
        text,
        sampleAudio: clonedSampleBase64,
        referenceText: referenceTranscript,
        speakerName: clonedSpeakerName,
        timbrePreference,
        rate,
        pitch,
        volume
      };

      let res: Response;
      try {
        res = await fetch('/api/plugins/speech-studio/clone-voice', {
          method: 'POST',
          headers,
          body: JSON.stringify(clonePayload)
        });
      } catch (firstErr: any) {
        if (firstErr?.name === 'TypeError' || firstErr?.message?.includes('fetch')) {
          console.warn('[SpeechStudio] Transient clone network glitch, retrying once...', firstErr);
          await new Promise(r => setTimeout(r, 750));
          res = await fetch('/api/plugins/speech-studio/clone-voice', {
            method: 'POST',
            headers,
            body: JSON.stringify(clonePayload)
          });
        } else {
          throw firstErr;
        }
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || data.details || 'Voice cloning failed.');

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
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `Voice Cloning Error: ${err.message || 'Voice cloning failed.'}`
      });
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
        <div className={`flex rounded-lg p-0.5 border text-[11px] overflow-x-auto [scrollbar-width:none] max-w-full shrink-0 pb-0.5 ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('synthesize')}
            className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
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
            className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
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
            className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
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
            className={`px-3 py-1.5 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
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
              download={currentAudioUrl?.startsWith('data:audio/mpeg') ? "sutharlabs-neural-speech.mp3" : "sutharlabs-neural-speech.wav"}
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
        <div className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in transition-all ${
          isLight
            ? 'bg-rose-50 border-rose-300 text-rose-800'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isLight ? 'bg-rose-100 border-rose-300' : 'bg-rose-500/20 border-rose-500/40'
            }`}>
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold">{errorMessage}</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                The neural voice engine is unavailable. You can retry synthesis or hear the text via your device's built-in browser speech engine.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <button
                type="button"
                onClick={handleBrowserFallbackSpeech}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:text-sky-600 hover:border-sky-400'
                    : 'bg-[#201f21] hover:bg-[#28272a] text-[#00dbe7] border border-[#00dbe7]/40 hover:border-[#00dbe7]'
                }`}
                title="Speak text locally using your browser's native speech engine"
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <span>Browser Speech Fallback</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'border-rose-200 hover:bg-rose-100 text-rose-700'
                  : 'border-rose-500/30 hover:bg-rose-500/20 text-rose-300'
              }`}
              aria-label="Dismiss error banner"
            >
              <X className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
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
              {/* Architecture Switcher Bar */}
              <div className="mb-4 pb-3.5 border-b border-outline/15">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold uppercase text-on-surface-variant flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 shrink-0 text-[#00dbe7]" />
                    Speech Engine Architecture
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('models')}
                    className="text-[10px] font-mono text-[#00dbe7] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Architecture Specs</span>
                    <Layers className="w-3 h-3 shrink-0" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                  {architectures.map(arch => {
                    const isSelected = selectedArchitecture === arch.id;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => setSelectedArchitecture(arch.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? isLight
                              ? 'bg-sky-50 border-sky-400 text-slate-900 shadow-sm ring-1 ring-sky-300'
                              : 'bg-[#00dbe7]/15 border-[#00dbe7] text-[#00dbe7] shadow-sm ring-1 ring-[#00dbe7]/30'
                            : isLight
                              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              : 'bg-[#201f21] hover:bg-[#28272a] border-[#3a494b]/40 text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold font-sans truncate">{arch.name.split(' ')[0]}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#00dbe7] shrink-0" />}
                        </div>
                        <span className="text-[9px] font-mono opacity-80 truncate">{arch.badge.split('•')[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* F5-TTS In-Context Emotion & CFG Controls */}
              {selectedArchitecture === 'f5-tts' && (
                <div className={`p-3 rounded-xl border mb-3.5 animate-in fade-in transition-colors ${
                  isLight ? 'bg-purple-50/70 border-purple-200' : 'bg-purple-950/20 border-purple-500/30'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                      F5-TTS Emotion Dynamics & Guidance
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                      CFG: {cfgStrength.toFixed(1)}x
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-on-surface-variant mb-2.5 leading-relaxed">
                    F5-TTS uses flow matching to replicate emotions in-context. Select an emotion preset or upload an emotional reference sample in the Voice Cloning tab.
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {['Neutral', 'Joyful / Excited', 'Empathetic / Warm', 'Dramatic / Serious', 'Whispering / Intimate'].map(emo => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setSelectedEmotion(emo)}
                        className={`h-6 px-2.5 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                          selectedEmotion === emo
                            ? 'bg-purple-500 text-white shadow-xs'
                            : isLight
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-white/5 hover:bg-white/10 text-on-surface-variant'
                        }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-on-surface-variant shrink-0">Emotion Intensity:</span>
                    <input
                      type="range"
                      min={1.0}
                      max={2.5}
                      step={0.1}
                      value={cfgStrength}
                      onChange={(e) => setCfgStrength(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 h-1.5 bg-purple-500/20 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* ChatTTS Conversational Realism Tokens */}
              {selectedArchitecture === 'chattts' && (
                <div className={`p-3 rounded-xl border mb-3.5 animate-in fade-in transition-colors ${
                  isLight ? 'bg-sky-50/70 border-sky-200' : 'bg-sky-950/20 border-sky-500/30'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                      ChatTTS Conversational Nuance Tokens
                    </span>
                    <span className="text-[10px] font-mono text-sky-300">Click to insert into script</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { tag: '[laugh]', label: '😂 Laughter' },
                      { tag: '[chuckle]', label: '😊 Chuckle' },
                      { tag: '[sigh]', label: '😮‍💨 Sigh' },
                      { tag: '[whisper]', label: '🤫 Whisper' },
                      { tag: '[pause]', label: '⏱️ Pause' }
                    ].map(token => (
                      <button
                        key={token.tag}
                        type="button"
                        onClick={() => setText(prev => prev + ` ${token.tag} `)}
                        className={`h-6 px-2 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                          isLight
                            ? 'bg-white hover:bg-sky-100 text-sky-700 border-sky-300'
                            : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        + {token.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  {filteredVoices.length + clonedProfiles.length} Models
                </span>
              </div>

              {/* Quick Filter: All | Commercial Safe | Hindi | English */}
              <div className={`flex rounded-lg p-0.5 border text-[10px] font-mono ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
              }`}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'commercial', label: 'Commercial Safe', icon: ShieldCheck },
                  { id: 'hi', label: 'Hindi' },
                  { id: 'en', label: 'English' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setVoiceFilter(filter.id as any)}
                    className={`flex-1 py-1 px-1 rounded-md cursor-pointer transition-all flex items-center justify-center gap-1 ${
                      voiceFilter === filter.id
                        ? isLight
                          ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300'
                          : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {filter.icon && <ShieldCheck className="w-2.5 h-2.5 shrink-0 text-emerald-400" />}
                    <span>{filter.label}</span>
                  </button>
                ))}
              </div>

              {/* Voice Cards Grid */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {/* Replicated Voices Section */}
                {clonedProfiles.length > 0 && (
                  <div className="pb-2 mb-2 border-b border-purple-500/25 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#ce5dff] shrink-0" />
                        My Replicated Voices ({clonedProfiles.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('clone')}
                        className="text-[9px] hover:underline cursor-pointer"
                      >
                        + New Voice
                      </button>
                    </div>
                    {clonedProfiles.map(cloned => (
                      <div
                        key={cloned.id}
                        onClick={() => {
                          setSelectedVoiceId(cloned.id);
                          setSelectedArchitecture('f5-tts');
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedVoiceId === cloned.id
                            ? isLight
                              ? 'bg-purple-50 border-purple-400 text-purple-950 shadow-xs ring-1 ring-purple-300'
                              : 'bg-[#ce5dff]/15 border-[#ce5dff]/60 text-white shadow-xs ring-1 ring-[#ce5dff]/40'
                            : isLight
                              ? 'bg-purple-50/30 hover:bg-purple-50 border-purple-200/50 text-slate-700'
                              : 'bg-purple-950/20 hover:bg-purple-950/40 border-purple-500/20 text-on-surface-variant'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold font-sans truncate text-[#ce5dff]">{cloned.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5 shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5 shrink-0" /> Commercial Safe
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-on-surface-variant mt-1.5">
                          <span>{cloned.languageLabel}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-purple-500/10 text-purple-300 border border-purple-500/20">{cloned.emotionTag || 'Adaptive'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Standard Voices */}
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
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold font-sans truncate">{voice.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          voice.gender === 'female'
                            ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {voice.gender}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {voice.commercialUse === 'commercial_safe' ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5 shrink-0">
                          <ShieldCheck className="w-2.5 h-2.5 shrink-0 text-emerald-400" /> Commercial Safe
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-amber-400" /> Personal / Dev
                        </span>
                      )}
                      {voice.emotionTag && (
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold truncate max-w-[120px] ${
                          isLight
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30'
                        }`}>
                          {voice.emotionTag}
                        </span>
                      )}
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

      {/* TAB 2: ZERO-SHOT VOICE REPLICATION & MULTI-VOICE LIBRARY */}
      {activeTab === 'clone' && (
        <div className="space-y-6">
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveSuccessMsg(null)}
                className="text-xs hover:text-white"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Step 1: Voice Profile Configuration & Ingestion */}
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
              }`}>
                <div className="flex items-center gap-2 border-b border-outline/20 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 text-[#ce5dff] shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Step 1: Capture & Label Voice</h3>
                    <p className="text-[10px] text-on-surface-variant font-mono">Replicate and name a custom vocal identity</p>
                  </div>
                </div>

                {/* Profile Name */}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-on-surface-variant mb-1">
                    Voice Profile Name *
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border font-mono text-xs focus:outline-none transition-colors ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                    }`}
                    placeholder="e.g. Suresh (Executive Pitch), Aditi (Support)"
                  />
                </div>

                {/* Gender & Language Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-bold text-on-surface-variant mb-1">
                      Gender
                    </label>
                    <select
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value as any)}
                      className={`w-full p-2 rounded-lg border font-mono text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                      }`}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase font-bold text-on-surface-variant mb-1">
                      Language
                    </label>
                    <select
                      value={profileLang}
                      onChange={(e) => setProfileLang(e.target.value)}
                      className={`w-full p-2 rounded-lg border font-mono text-xs focus:outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                      }`}
                    >
                      <option value="hi-IN">Hindi (हिंदी)</option>
                      <option value="en-IN">English (India)</option>
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                    </select>
                  </div>
                </div>

                {/* Emotion / Cadence Persona */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-on-surface-variant mb-1">
                    Emotion / Tone Profile
                  </label>
                  <div className="flex items-center gap-1 flex-wrap mb-1.5">
                    {['Warm & Authoritative', 'Conversational Melodic', 'Empathetic Support', 'Dramatic Narration'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setProfileEmotion(tag)}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-all ${
                          profileEmotion === tag
                            ? isLight ? 'bg-purple-600 text-white border-purple-700' : 'bg-[#ce5dff]/20 text-[#ce5dff] border-[#ce5dff]/50'
                            : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-on-surface-variant'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={profileEmotion}
                    onChange={(e) => setProfileEmotion(e.target.value)}
                    className={`w-full p-2 rounded-lg border font-mono text-xs focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                    }`}
                    placeholder="Custom emotion tag..."
                  />
                </div>

                {/* Standardized Phonetic Calibration Test Prompts */}
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-sky-50/70 border-sky-200' : 'bg-[#121216] border-[#3a494b]/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-[11px] font-mono uppercase font-bold text-on-surface">
                        Phonetic Calibration Prompt
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-mono leading-relaxed">
                    Read a phonetically balanced passage aloud while recording. Covers all phonemes, pitch variations, and vowels for state-of-the-art voice replication.
                  </p>

                  {/* Calibration Script Buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {CALIBRATION_PROMPTS.map((prompt) => {
                      const isSelected = selectedCalibrationPrompt?.id === prompt.id;
                      return (
                        <button
                          key={prompt.id}
                          type="button"
                          onClick={() => {
                            setSelectedCalibrationPrompt(prompt);
                            setReferenceTranscript(prompt.text);
                            setProfileLang(prompt.lang);
                          }}
                          className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                            isSelected
                              ? isLight
                                ? 'bg-white border-sky-500 text-sky-800 shadow-sm font-bold'
                                : 'bg-[#00dbe7]/15 border-[#00dbe7]/60 text-[#74f5ff] font-bold shadow-xs'
                              : isLight
                                ? 'bg-white/80 hover:bg-white text-slate-700 border-slate-200'
                                : 'bg-white/5 hover:bg-white/10 text-on-surface-variant border-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[10px] font-mono font-bold truncate">{prompt.title}</span>
                            <span className="text-[8px] font-mono px-1 rounded bg-black/20 text-on-surface-variant shrink-0">{prompt.durationEst}</span>
                          </div>
                          <span className="text-[9px] text-on-surface-variant line-clamp-1 opacity-80">{prompt.badge}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Teleprompter Script Card */}
                  {selectedCalibrationPrompt && (
                    <div className={`p-2.5 rounded-lg border space-y-1.5 ${
                      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-black/40 border-white/10 text-[#e5e1e4]'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-sky-400 shrink-0" />
                          Teleprompter Reading Passage:
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedCalibrationPrompt.text, 'calib-prompt')}
                          className="text-[10px] font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'calib-prompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'calib-prompt' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-sans leading-relaxed select-all italic bg-black/5 dark:bg-black/25 p-2 rounded border border-white/5">
                        "{selectedCalibrationPrompt.text}"
                      </p>
                    </div>
                  )}

                  {/* Reference Transcript Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
                        Reference Audio Transcript (Text Spoken in Sample)
                      </label>
                      <span className="text-[9px] font-mono text-on-surface-variant">
                        {referenceTranscript.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={referenceTranscript}
                      onChange={(e) => setReferenceTranscript(e.target.value)}
                      placeholder="Paste or edit the exact text spoken in the reference audio sample..."
                      className={`w-full p-2 rounded-lg border font-mono text-[11px] focus:outline-none transition-colors resize-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Record via Browser Mic */}
                <div className={`p-4 rounded-xl border text-center space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'
                }`}>
                  <div className="flex items-center justify-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-rose-500/20 border-2 border-rose-500 animate-pulse text-rose-400'
                        : 'bg-purple-500/10 border border-purple-500/30 text-[#ce5dff]'
                    }`}>
                      <Mic className="w-7 h-7 shrink-0" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono font-bold">
                      {isRecording ? `Recording Audio: ${recordingDuration}s / 30s max` : 'Record via Microphone'}
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 font-mono">
                      {isRecording
                        ? 'Read the teleprompter passage clearly at your natural pace.'
                        : 'Read the calibration prompt above into your microphone (15–25s recommended).'}
                    </p>
                  </div>

                  {isRecording && (
                    <div className="space-y-2">
                      <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-rose-500 h-1.5 transition-all duration-300"
                          style={{ width: `${Math.min(100, (recordingDuration / 30) * 100)}%` }}
                        />
                      </div>

                      {/* Live VU Microphone Level Visualizer */}
                      <div className={`p-2.5 rounded-xl border space-y-2 transition-all ${
                        isLight ? 'bg-purple-50/70 border-purple-200' : 'bg-[#181220] border-purple-500/30'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="flex items-center gap-1.5 font-bold text-purple-400">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            LIVE MICROPHONE INPUT
                          </span>
                          <span className={`font-bold ${
                            micLiveLevel > 5 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                          }`}>
                            {micLiveLevel > 0 ? `${micLiveLevel}% (Peak: ${micPeakLive}%)` : 'MUTED / SILENT (0%)'}
                          </span>
                        </div>

                        {/* Visualizer Level Bar */}
                        <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden flex items-center p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-75 ${
                              micLiveLevel > 60
                                ? 'bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500'
                                : micLiveLevel > 15
                                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                                  : micLiveLevel > 0
                                    ? 'bg-emerald-400'
                                    : 'bg-transparent'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(micLiveLevel > 0 ? 4 : 0, micLiveLevel))}%` }}
                          />
                        </div>

                        {micLiveLevel === 0 && recordingDuration >= 2 && (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-lg">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>No audio detected. Please check Windows Microphone Settings & Unmute.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-purple-500 hover:bg-purple-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5 shrink-0" />
                        <span>START RECORDING (30s)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 shrink-0" />
                        <span>FINISH RECORDING ({recordingDuration}s)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Or File Upload */}
                <div className="text-center">
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase font-bold">
                    — Or Upload Reference Clip —
                  </span>
                  <label className={`mt-2 block p-2.5 rounded-xl border border-dashed cursor-pointer transition-all ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}>
                    <Upload className="w-4 h-4 mx-auto text-on-surface-variant mb-1 shrink-0" />
                    <span className="text-xs font-mono font-semibold block">Select audio file (.wav, .mp3)</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preview Ingested Sample with Diagnostics & Playback */}
                {(clonedSampleBase64 || clonedSampleBlobUrl) && (
                  <div className={`p-3.5 rounded-xl border space-y-3 transition-all ${
                    audioDiagnostics?.isSilent
                      ? isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/10 border-amber-500/30'
                      : isLight ? 'bg-emerald-50/70 border-emerald-300' : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}>
                    {/* Header with Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {audioDiagnostics?.isSilent ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className={`text-xs font-mono font-bold ${
                          audioDiagnostics?.isSilent
                            ? 'text-amber-400'
                            : isLight ? 'text-emerald-800' : 'text-emerald-300'
                        }`}>
                          {audioDiagnostics?.isSilent
                            ? 'Silence Detected (Microphone Muted)'
                            : `Sample Ready (${audioDiagnostics?.durationSec || recordingDuration || 5}s)`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (clonedSampleBlobUrl) URL.revokeObjectURL(clonedSampleBlobUrl);
                          setClonedSampleBlobUrl(null);
                          setClonedSampleBase64(null);
                          setAudioDiagnostics(null);
                          if (testSampleAudioRef.current) {
                            testSampleAudioRef.current.pause();
                            setIsTestPlayingSample(false);
                          }
                        }}
                        className="text-xs font-mono text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Silence Warning Callout */}
                    {audioDiagnostics?.isSilent && (
                      <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px] font-mono text-amber-300 space-y-1">
                        <p className="font-bold">⚠️ Diagnostic Alert: Zero Volume Detected</p>
                        <p className="text-[10px] text-amber-200">
                          Peak amplitude was {audioDiagnostics.peakPercent}% ({audioDiagnostics.peakDb} dBFS). The audio buffer contains only silence. Please check Windows Sound Settings, verify the correct mic is selected, and record again.
                        </p>
                      </div>
                    )}

                    {/* Audio Diagnostics Telemetry Grid */}
                    {audioDiagnostics && (
                      <div className={`p-2 rounded-lg border text-[10px] font-mono grid grid-cols-2 sm:grid-cols-4 gap-1.5 ${
                        isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-black/30 border-white/10 text-on-surface-variant'
                      }`}>
                        <div>
                          <span className="block text-[9px] uppercase opacity-60">Format</span>
                          <span className="font-bold text-sky-400">{audioDiagnostics.format}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase opacity-60">Payload Size</span>
                          <span className="font-bold text-on-surface">{(audioDiagnostics.totalBytes / 1024).toFixed(1)} KB</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase opacity-60">Peak Volume</span>
                          <span className={`font-bold ${audioDiagnostics.peakPercent > 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {audioDiagnostics.peakPercent}% ({audioDiagnostics.peakDb} dBFS)
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase opacity-60">Duration</span>
                          <span className="font-bold text-on-surface">{audioDiagnostics.durationSec}s</span>
                        </div>
                      </div>
                    )}

                    {/* Dedicated Playback & Test Controls */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleToggleTestPlayback}
                        className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all ${
                          isTestPlayingSample
                            ? 'bg-rose-500 hover:bg-rose-600 text-white'
                            : isLight
                              ? 'bg-sky-500 hover:bg-sky-600 text-white'
                              : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40 hover:border-[#00dbe7]'
                        }`}
                      >
                        {isTestPlayingSample ? (
                          <>
                            <Square className="w-3.5 h-3.5 shrink-0" />
                            <span>STOP PLAYBACK</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 shrink-0" />
                            <span>PLAY RECORDED VOICE</span>
                          </>
                        )}
                      </button>

                      {clonedSampleBlobUrl && (
                        <a
                          href={clonedSampleBlobUrl}
                          download="voice-sample-recorded.wav"
                          className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border shadow-sm transition-all ${
                            isLight
                              ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                              : 'bg-white/5 hover:bg-white/10 text-on-surface border-white/10'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span>DOWNLOAD WAV</span>
                        </a>
                      )}
                    </div>

                    {/* Browser Native Audio Player using Blob URL */}
                    <audio 
                      controls 
                      src={clonedSampleBlobUrl || clonedSampleBase64 || undefined} 
                      className="w-full h-8 rounded-lg mt-1" 
                    />

                    {/* Vocal Timbre & Frequency Character Tuning */}
                    <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-on-surface-variant">
                        <span>Vocal Timbre Profile</span>
                        <span className="text-emerald-400 font-bold">{timbrePreference.toUpperCase()}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['auto', 'male', 'female'] as const).map((pref) => (
                          <button
                            key={pref}
                            type="button"
                            onClick={() => setTimbrePreference(pref)}
                            className={`py-1 px-2 rounded-lg text-[10px] font-mono font-bold uppercase transition-all border cursor-pointer ${
                              timbrePreference === pref
                                ? isLight
                                  ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                                  : 'bg-[#00dbe7]/20 text-[#00dbe7] border-[#00dbe7]/50 shadow-sm'
                                : isLight
                                  ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                  : 'bg-white/5 text-on-surface-variant border-white/10 hover:text-white'
                            }`}
                          >
                            {pref === 'auto' ? '✨ Auto-Detect' : pref === 'male' ? '👨 Male' : '👩 Female'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Save to Voice Library Button */}
                <button
                  type="button"
                  onClick={handleSaveClonedProfile}
                  disabled={!clonedSampleBase64 || !profileName.trim()}
                  className={`w-full h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 leading-none border shadow-sm ${
                    isLight
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>SAVE VOICE TO MY LIBRARY</span>
                </button>
              </div>
            </div>

            {/* Step 2: Synthesis Test Script & Live Cloned Audio Player */}
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
                      <h3 className="text-sm font-bold text-on-surface">Step 2: Synthesize with Voice</h3>
                      <p className="text-[10px] text-on-surface-variant font-mono">
                        Test speech replication immediately using your captured voice
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    Commercial Safe (User-Owned)
                  </span>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  placeholder="Enter script for your replicated voice in English, Hindi, or mixed bilingual dialogue..."
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
                        <span>SYNTHESIZING WITH REPLICATED VOICE...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 shrink-0" />
                        <span>REPLICATE & SPEAK SCRIPT</span>
                      </>
                    )}
                  </button>

                  {!clonedSampleBase64 && (
                    <span className="text-[11px] font-mono text-amber-400">
                      * Ingest or record an audio sample in Step 1 first
                    </span>
                  )}
                </div>
              </div>

              {/* My Replicated Voices Gallery */}
              <div className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
              }`}>
                <div className="flex items-center justify-between border-b border-outline/20 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4 text-[#ce5dff] shrink-0" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">My Replicated Voices Library</h3>
                      <p className="text-[10px] text-on-surface-variant font-mono">
                        Saved speaker profiles ready for Studio synthesis & multi-character generation
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    {clonedProfiles.length} Saved Profiles
                  </span>
                </div>

                {clonedProfiles.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-outline/25 text-center space-y-2">
                    <Mic className="w-8 h-8 mx-auto text-on-surface-variant opacity-60" />
                    <p className="text-xs font-mono text-on-surface-variant">
                      No replicated voices saved yet. Capture 5 seconds of audio on the left and click "Save Voice to My Library".
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clonedProfiles.map(profile => (
                      <div
                        key={profile.id}
                        className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                          isLight
                            ? 'bg-slate-50/70 border-slate-200 hover:border-purple-300'
                            : 'bg-white/5 border-white/10 hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold font-sans text-on-surface">{profile.name}</h4>
                            <p className="text-[10px] font-mono text-on-surface-variant mt-0.5 line-clamp-1">
                              {profile.description || 'Custom replicated profile'}
                            </p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5 shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5 shrink-0" /> Commercial Safe
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {profile.languageLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase">
                            {profile.gender}
                          </span>
                          {profile.emotionTag && (
                            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                              {profile.emotionTag}
                            </span>
                          )}
                        </div>

                        {profile.sampleAudioDataUrl && (
                          <div className="pt-1">
                            <span className="text-[9px] font-mono text-on-surface-variant block mb-1">
                              Reference Sample:
                            </span>
                            <audio controls src={profile.sampleAudioDataUrl} className="w-full h-7" />
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline/15">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVoiceId(profile.id);
                              setSelectedArchitecture('f5-tts');
                              setActiveTab('synthesize');
                              onAddLog({
                                timestamp: new Date().toLocaleTimeString(),
                                type: 'INFO',
                                message: `Loaded replicated voice "${profile.name}" into Studio.`
                              });
                            }}
                            className={`h-7 px-3 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                              isLight
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-[#ce5dff]/20 hover:bg-[#ce5dff]/30 text-[#ce5dff] border border-[#ce5dff]/40'
                            }`}
                          >
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>USE IN STUDIO →</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setVoiceToDelete(profile)}
                            className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete voice profile"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODEL ARCHITECTURES (INTERACTIVE & SELECTABLE) */}
      {activeTab === 'models' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00dbe7] shrink-0" />
                Selectable Neural TTS Model Architectures
              </h3>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                Switch active synthesis engine or inspect architectural emotion capabilities, parameter counts, and latency.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-lg border bg-[#00dbe7]/10 text-[#00dbe7] border-[#00dbe7]/30 shrink-0 font-bold">
              Active: {architectures.find(a => a.id === selectedArchitecture)?.name.split(' ')[0] || 'Edge-TTS'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {architectures.map(arch => {
              const isSelected = selectedArchitecture === arch.id;
              return (
                <div
                  key={arch.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? isLight
                        ? 'bg-sky-50/80 border-sky-400 shadow-md ring-2 ring-sky-300'
                        : 'bg-[#18181b] border-[#00dbe7] shadow-lg ring-1 ring-[#00dbe7]/40 shadow-[#00dbe7]/5'
                      : isLight
                        ? 'bg-white hover:bg-slate-50 border-slate-200'
                        : 'bg-[#18181b] hover:bg-[#201f21] border-[#3a494b]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-[#00dbe7]/20 border-[#00dbe7]' : isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                        }`}>
                          <Cpu className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#00dbe7]' : 'text-on-surface-variant'}`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">{arch.name}</h4>
                          <span className="text-[10px] font-mono text-on-surface-variant">
                            {arch.parameters} • {arch.license} • {arch.speed}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isSelected
                          ? 'bg-[#00dbe7]/20 text-[#00dbe7] border-[#00dbe7]/50'
                          : 'bg-white/5 text-on-surface-variant border-white/10'
                      }`}>
                        {isSelected ? '✓ ACTIVE' : arch.badge}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant font-mono leading-relaxed mt-2.5 mb-3">
                      {arch.description}
                    </p>

                    {/* Emotion capabilities */}
                    <div className={`p-2.5 rounded-xl border text-xs font-mono mb-3 ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/30 border-white/5'
                    }`}>
                      <div className="text-[10px] font-bold text-on-surface uppercase mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#00dbe7] shrink-0" />
                        <span>Emotion Delivery: {arch.emotionCapability}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        {arch.supportedEmotions.map(emo => (
                          <span
                            key={emo}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                              isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-white/5 border-white/10 text-on-surface-variant'
                            }`}
                          >
                            {emo}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline/10">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArchitecture(arch.id);
                        onAddLog({
                          timestamp: new Date().toLocaleTimeString(),
                          type: 'INFO',
                          message: `Speech Engine: Switched active architecture to ${arch.name}`
                        });
                      }}
                      className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-sky-500 text-white border-sky-600 shadow-sm font-bold'
                            : 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/50 font-bold'
                          : isLight
                            ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:text-sky-600'
                            : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border border-[#3a494b]/40 hover:text-[#00dbe7]'
                      }`}
                    >
                      {isSelected ? '✓ Selected Engine' : 'Select Architecture'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArchitecture(arch.id);
                        setActiveTab('synthesize');
                      }}
                      className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-sky-500 hover:bg-sky-600 text-white border border-sky-600 shadow-sm cursor-pointer"
                    >
                      Synthesize →
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Delete Replicated Voice Profile Confirmation Modal */}
      <ConfirmModal
        isOpen={!!voiceToDelete}
        onClose={() => setVoiceToDelete(null)}
        onConfirm={() => {
          if (voiceToDelete) {
            deleteClonedProfile(voiceToDelete.id);
            setVoiceToDelete(null);
          }
        }}
        title="Delete Replicated Voice"
        message={`Are you sure you want to permanently delete the voice profile "${voiceToDelete?.name}"?`}
        subtext="This action will remove the voice profile and reference audio from your library."
        confirmLabel="Delete Voice"
        cancelLabel="Cancel"
        variant="danger"
        theme={theme}
      />
    </div>
  );
}
