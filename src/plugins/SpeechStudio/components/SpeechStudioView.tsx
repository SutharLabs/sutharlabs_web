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
  FileText,
  Scale,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Music
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
    label: 'Hindi AI Assistant (हिंदी)',
    lang: 'hi-IN',
    text: 'नमस्ते! मैं सुथारलैब्स का न्यूरल स्पीच असिस्टेंट हूँ। मैं हिंदी और अंग्रेजी दोनों भाषाओं में स्वाभाविक रूप से संवाद करने में सक्षम हूँ।'
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
  const numChannels = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const inRate = buffer.sampleRate;
  const ratio = targetSampleRate / inRate;
  const inLength = buffer.length;
  const outLength = Math.max(1, Math.round(inLength * ratio));

  const monoIn = new Float32Array(inLength);
  const chCount = buffer.numberOfChannels;
  for (let c = 0; c < chCount; c++) {
    const chData = buffer.getChannelData(c);
    for (let i = 0; i < inLength; i++) {
      monoIn[i] += chData[i] / chCount;
    }
  }

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

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

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
    usageTag: 'Financial & News Narration',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~280ms',
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
    usageTag: 'Conversational Dialogue',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~300ms',
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
    usageTag: 'Native Hindi Audiobooks',
    architecture: 'indic-tts',
    sampleRate: '24,000 Hz',
    latency: '~350ms',
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
    usageTag: 'Storytelling & Empathy',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~270ms',
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
    usageTag: 'Podcasts & Explainer Videos',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~290ms',
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
    usageTag: 'Studio Narration & Audiobooks',
    architecture: 'kokoro-82m',
    sampleRate: '24,000 Hz',
    latency: '~250ms',
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
    usageTag: 'Broadcast & Corporate Reports',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~300ms',
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
    usageTag: 'Executive & Governance',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~320ms',
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
    usageTag: 'E-learning & Tech Tutorials',
    architecture: 'melotts',
    sampleRate: '24,000 Hz',
    latency: '~280ms',
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
    usageTag: 'Documentary & Fast Pacing',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~290ms',
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
    usageTag: 'Conversational Dialogue',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~310ms',
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
    usageTag: 'Customer Support & Greeting',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~300ms',
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
    usageTag: 'Audiobook & Period Narration',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~320ms',
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
    usageTag: 'Historical Documentaries',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~310ms',
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
    usageTag: 'Tech Reviews & Announcements',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~280ms',
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
    usageTag: 'Novel Reading & Podcasts',
    architecture: 'edge-tts',
    sampleRate: '24,000 Hz',
    latency: '~330ms',
    commercialUse: 'personal_non_commercial',
    commercialLabel: 'Personal / Staging',
    description: 'Expressive, melodic narrator voice with subtle breathing pauses and vocal dynamics.'
  },
  // Authentic Hush Studio In-Context Acoustic Reference Voices (VoxCPM 0.5B Model)
  {
    id: 'vox-aria',
    name: 'Aria (LJ Speech)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'female',
    accent: 'American Narrator',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Audiobook Narrator',
    usageTag: 'Classic Audiobooks & Literature',
    architecture: 'voxcpm',
    sampleRate: '22,050 Hz',
    latency: '~350ms',
    commercialUse: 'commercial_safe',
    commercialLabel: 'Public Domain (100% Free)',
    description: 'Linda Johnson / LibriVox recording from LJ Speech 1.1. In-context acoustic reference clip from Hush Studio.',
    previewSample: '/voices/aria.wav',
    referenceAudioUrl: '/voices/aria.wav',
    referenceTranscript: 'Trustworthy evidence is forthcoming to the effect that these high figures were constantly maintained for many months at a time.',
    datasetName: 'LJ Speech Dataset 1.1',
    datasetUrl: 'https://keithito.com/LJ-Speech-Dataset/',
    licenseName: 'Public Domain',
    licenseDetails: 'Public Domain (LJ Speech, Keith Ito; read by Linda Johnson for LibriVox). Free for commercial and non-commercial use with zero restrictions.',
    credits: 'Recorded by Linda Johnson for LibriVox; curated by Keith Ito (LJ Speech 1.1, lj-002-0017.wav).',
    approach: 'hush_reference'
  },
  {
    id: 'vox-jenny',
    name: 'Jenny (Dioco)',
    lang: 'en-US',
    languageLabel: 'English (US / Neutral)',
    gender: 'female',
    accent: 'Natural Conversational',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Expressive & Melodic',
    usageTag: 'Conversational Dialogue & Agents',
    architecture: 'voxcpm',
    sampleRate: '24,000 Hz',
    latency: '~340ms',
    commercialUse: 'commercial_safe',
    commercialLabel: 'Commercial Safe (Attributed)',
    description: 'Jenny TTS studio recording by Dioco. Natural, expressive conversational cadence with gentle prosody.',
    previewSample: '/voices/jenny.wav',
    referenceAudioUrl: '/voices/jenny.wav',
    referenceTranscript: 'How funny... She did not finish her speech, for Belle shook her head at her and broke in, saying kindly...',
    datasetName: 'Jenny TTS Dataset',
    datasetUrl: 'https://github.com/dioco-group/jenny-tts-dataset',
    licenseName: 'CC BY-SA 4.0 (Dioco)',
    licenseDetails: "Jenny TTS dataset by Dioco. Commercial use permitted; voice model and audio must be attributed as 'Jenny (Dioco)'.",
    credits: 'Dioco Group; recorded in Dublin studio (jenny/10092).',
    approach: 'hush_reference'
  },
  {
    id: 'vox-maya',
    name: 'Maya (Hi-Fi TTS)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'female',
    accent: 'American Studio',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Articulate & Engaging',
    usageTag: 'Hi-Fi Studio Narration',
    architecture: 'voxcpm',
    sampleRate: '44,100 Hz',
    latency: '~360ms',
    commercialUse: 'commercial_safe',
    commercialLabel: 'CC BY 4.0 Safe',
    description: 'NVIDIA Hi-Fi TTS multi-speaker dataset (Speaker 92). Clean acoustic audio recorded with high-fidelity studio microphones.',
    previewSample: '/voices/maya.wav',
    referenceAudioUrl: '/voices/maya.wav',
    referenceTranscript: 'They\'ve only to get somebody for the job who does not know you carry enough stuff in your pocket to blow yourself and everything within sixty yards of you to pieces.',
    datasetName: 'Hi-Fi Multi-Speaker English TTS Dataset',
    datasetUrl: 'https://openslr.org/109/',
    licenseName: 'CC BY 4.0 (NVIDIA)',
    licenseDetails: 'Hi-Fi Multi-Speaker English TTS Dataset (NVIDIA, E. Bakhturina, V. Lavrukhin, B. Ginsburg, Y. Zhang 2021). Licensed under Creative Commons Attribution 4.0.',
    credits: 'NVIDIA Corp. & LibriVox public domain sources; Hi-Fi TTS speaker 92 (10425/secretagent_04_conrad_0178.flac).',
    approach: 'hush_reference'
  },
  {
    id: 'vox-ethan',
    name: 'Ethan (Hi-Fi TTS)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'male',
    accent: 'American Baritone',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Warm & Authoritative',
    usageTag: 'Deep Baritone Audiobooks',
    architecture: 'voxcpm',
    sampleRate: '44,100 Hz',
    latency: '~350ms',
    commercialUse: 'commercial_safe',
    commercialLabel: 'CC BY 4.0 Safe',
    description: 'NVIDIA Hi-Fi TTS multi-speaker dataset (Speaker 6097). Deep, warm baritone voice suited for audiobooks and educational explainers.',
    previewSample: '/voices/ethan.wav',
    referenceAudioUrl: '/voices/ethan.wav',
    referenceTranscript: 'The late Mr. Leslie, who died in eighteen seventy-four, tells it in his book',
    datasetName: 'Hi-Fi Multi-Speaker English TTS Dataset',
    datasetUrl: 'https://openslr.org/109/',
    licenseName: 'CC BY 4.0 (NVIDIA)',
    licenseDetails: 'Hi-Fi Multi-Speaker English TTS Dataset (NVIDIA, E. Bakhturina et al. 2021). Licensed under CC BY 4.0.',
    credits: 'NVIDIA Corp. & LibriVox; Hi-Fi TTS speaker 6097 (14411/nada_lily_00_haggard_0201.flac).',
    approach: 'hush_reference'
  },
  {
    id: 'vox-cole',
    name: 'Cole (Hi-Fi TTS)',
    lang: 'en-US',
    languageLabel: 'English (US)',
    gender: 'male',
    accent: 'Documentary Narrator',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Calm & Measured',
    usageTag: 'Measured Technical Explainers',
    architecture: 'voxcpm',
    sampleRate: '44,100 Hz',
    latency: '~360ms',
    commercialUse: 'commercial_safe',
    commercialLabel: 'CC BY 4.0 Safe',
    description: 'NVIDIA Hi-Fi TTS multi-speaker dataset (Speaker 9017). Calm, measured cadence ideal for historical documentaries, long-form scripts, and technical manuals.',
    previewSample: '/voices/cole.wav',
    referenceAudioUrl: '/voices/cole.wav',
    referenceTranscript: 'The royal ordinance of eighteen sixty-six resulted, which was to regulate the cutting on settled lands and in such new settlements as were thereafter allowed.',
    datasetName: 'Hi-Fi Multi-Speaker English TTS Dataset',
    datasetUrl: 'https://openslr.org/109/',
    licenseName: 'CC BY 4.0 (NVIDIA)',
    licenseDetails: 'Hi-Fi Multi-Speaker English TTS Dataset (NVIDIA, E. Bakhturina et al. 2021). Licensed under CC BY 4.0.',
    credits: 'NVIDIA Corp. & LibriVox; Hi-Fi TTS speaker 9017 (13089/historyofforestry_15_fernow_0129.flac).',
    approach: 'hush_reference'
  },
  {
    id: 'vox-priya',
    name: 'Priya (VCTK Indian English)',
    lang: 'en-IN',
    languageLabel: 'Indian English (IN)',
    gender: 'female',
    accent: 'Indian Professional',
    isNeural: true,
    engine: 'neural',
    emotionTag: 'Clear & Measured',
    usageTag: 'Indian English Corporate & EdTech',
    architecture: 'voxcpm',
    sampleRate: '48,000 Hz',
    latency: '~370ms',
    commercialUse: 'commercial_safe',
    commercialLabel: 'CC BY 4.0 Safe',
    description: 'CSTR VCTK Corpus (Speaker p248). Clear, articulate Indian English voice recorded by the University of Edinburgh Centre for Speech Technology Research.',
    previewSample: '/voices/priya.wav',
    referenceAudioUrl: '/voices/priya.wav',
    referenceTranscript: 'The main concern is that it could interfere with air traffic. Because it\'s a waste of time for both sides.',
    datasetName: 'CSTR VCTK Corpus 0.92',
    datasetUrl: 'https://datashare.ed.ac.uk/handle/10283/3443',
    licenseName: 'CC BY 4.0 (Edinburgh)',
    licenseDetails: 'CSTR VCTK Corpus 0.92, Centre for Speech Technology Research, University of Edinburgh. Licensed under CC BY 4.0.',
    credits: 'University of Edinburgh CSTR; speaker p248 (p248_029_mic1 + p248_031_mic1).',
    approach: 'hush_reference'
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
    id: 'voxcpm',
    name: 'VoxCPM (In-Context Reference)',
    badge: 'Acoustic Reference • Hush Studio',
    badgeColor: 'emerald',
    description: 'Offline in-context acoustic reference matching engine pioneered in Hush Studio. Synthesizes speech by conditioning on a 5–10s reference WAV sample and exact transcript alignment. Zero model retraining required.',
    status: 'online',
    speed: '~0.35s (Acoustic Conditioning)',
    emotionCapability: 'In-Context Timbre & Prosody Transfer',
    keyFeature: 'Conditions directly on reference audio + transcript prompt for authentic voice replication without retraining.',
    parameters: '0.5B Q4',
    license: 'Apache 2.0',
    supportedEmotions: ['Audiobook Narrator', 'Natural Conversational', 'Documentary Pacing', 'Clear Professional']
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
    id: 'indic-tts',
    name: 'Indic Parler (AI4Bharat)',
    badge: 'IIT Madras Indic SOTA',
    badgeColor: 'amber',
    description: 'Leading open-source neural synthesizer for Indic languages developed by AI4Bharat (IIT Madras). Native Devanagari script processing with authentic Indian regional prosody and emotional warmth.',
    status: 'ready',
    speed: '~0.35s',
    emotionCapability: 'Native Regional Prosody & Dialect Nuance',
    keyFeature: '100% Apache 2.0 commercial safe native Hindi/Indian language synthesizer.',
    parameters: '600M',
    license: 'Apache 2.0',
    supportedEmotions: ['Native Hindi Studio', 'Conversational Hindi', 'Formal Broadcast', 'Dramatic']
  },
  {
    id: 'melotts',
    name: 'MeloTTS (MyShell)',
    badge: 'Fast Multi-Accent TTS',
    badgeColor: 'sky',
    description: 'High-speed multi-lingual and multi-accent speech synthesis library developed by MyShell.ai. Exceptional real-time factor (RTF < 0.1) with robust pronunciation across Indian English, US, UK, and Australian accents.',
    status: 'ready',
    speed: '~0.28s (RTF 0.08)',
    emotionCapability: 'Accurate Multi-Accent Pronunciation',
    keyFeature: 'Ultra-fast inference on CPU with high naturalness and MIT license.',
    parameters: '120M',
    license: 'MIT',
    supportedEmotions: ['Accurate Indian Accent', 'Clear Neutral', 'Expressive', 'Technical']
  },
  {
    id: 'f5-tts',
    name: 'F5-TTS (Flow-Matching Zero-Shot)',
    badge: 'Diffusion Flow • Zero-Shot Voice Cloning',
    badgeColor: 'purple',
    description: 'Leading non-autoregressive flow matching framework with ConvNeXt backbone. Transfers vocal identity and acoustic emotions directly from 3–10s reference audio. Powers high-fidelity voice replication.',
    status: 'ready',
    speed: '~0.35s (RTF 0.15)',
    emotionCapability: 'In-Context Audio Transfer + CFG Guidance',
    keyFeature: 'Zero-shot voice cloning matching user audio in 3-10s with rich emotional inflection.',
    parameters: '300M',
    license: 'MIT',
    supportedEmotions: ['Neutral', 'Joyful / Excited', 'Empathetic / Warm', 'Dramatic / Serious', 'Whispering']
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

  // Sub-tabs: synthesize (Studio Voices) | clone (Replicate My Voice) | models (Architectures) | history
  const [activeTab, setActiveTab] = useState<'synthesize' | 'clone' | 'models' | 'history'>('synthesize');

  // Input text and voice parameters for Studio synthesis
  const [text, setText] = useState<string>(SAMPLE_PROMPTS[0].text);
  const [selectedLang, setSelectedLang] = useState<'all' | 'en' | 'hi'>('all');
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'commercial' | 'hi' | 'en' | 'cloned'>('all');
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

  // Modulation sliders
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);

  // Studio Audio Playback State
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Architecture Specs / License Info Modal State (User Request 3: Click to learn about architecture)
  const [voiceForInfo, setVoiceForInfo] = useState<TTSVoiceOption | null>(null);
  const [infoSamplePlaying, setInfoSamplePlaying] = useState<boolean>(false);
  const infoSampleRef = useRef<HTMLAudioElement | null>(null);

  // Previewing samples in the voice list
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);
  const listPreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- REPLICATE MY VOICE STATE (User Request 4) ---
  const [replicateVoiceName, setReplicateVoiceName] = useState<string>('My Sovereign Voice');
  const [replicateGender, setReplicateGender] = useState<'male' | 'female' | 'neutral'>('male');
  const [replicateArchitecture, setReplicateArchitecture] = useState<'voxcpm' | 'styletts2' | 'edge'>('voxcpm');
  const [replicateSourceMode, setReplicateSourceMode] = useState<'mic' | 'upload'>('mic');
  const [selectedCalibrationPrompt, setSelectedCalibrationPrompt] = useState<CalibrationPromptItem | null>(CALIBRATION_PROMPTS[0]);
  const [referenceTranscript, setReferenceTranscript] = useState<string>(CALIBRATION_PROMPTS[0].text);

  // Voice recording & sample state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [clonedSampleBase64, setClonedSampleBase64] = useState<string | null>(null);
  const [clonedSampleBlobUrl, setClonedSampleBlobUrl] = useState<string | null>(null);
  const [micLiveLevel, setMicLiveLevel] = useState<number>(0);
  const [micPeakLive, setMicPeakLive] = useState<number>(0);
  const [audioDiagnostics, setAudioDiagnostics] = useState<AudioDiagnostics | null>(null);
  const [isTestPlayingSample, setIsTestPlayingSample] = useState<boolean>(false);

  // Verification & Approval State (User Request 4)
  const [replicateTestScript, setReplicateTestScript] = useState<string>(
    'Hello! This is a live verification sample synthesized with my replicated voice on SutharLabs sovereign engine.'
  );
  const [isReplicating, setIsReplicating] = useState<boolean>(false);
  const [verificationAudioUrl, setVerificationAudioUrl] = useState<string | null>(null);
  const [isVerificationPlaying, setIsVerificationPlaying] = useState<boolean>(false);
  const [verificationTelemetry, setVerificationTelemetry] = useState<any | null>(null);
  const verificationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Hardware references
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

  const [architectures, setArchitectures] = useState<TTSArchitectureOption[]>(DEFAULT_ARCHITECTURES);
  const [isVercelFallback, setIsVercelFallback] = useState<boolean>(false);
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

  const copyToClipboard = (content: string, key: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const estimateVoiceGenderFromBuffer = (buffer: AudioBuffer): 'male' | 'female' => {
    try {
      const data = buffer.getChannelData(0);
      let zeroCrossings = 0;
      for (let i = 1; i < data.length; i++) {
        if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
          zeroCrossings++;
        }
      }
      const approxFreq = (zeroCrossings * buffer.sampleRate) / (2 * data.length);
      return approxFreq > 165 ? 'female' : 'male';
    } catch {
      return 'male';
    }
  };

  // Comprehensive hardware mic cleanup on unmount
  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (testSampleAudioRef.current) {
        testSampleAudioRef.current.pause();
      }
      if (verificationAudioRef.current) {
        verificationAudioRef.current.pause();
      }
      if (infoSampleRef.current) {
        infoSampleRef.current.pause();
      }
      if (listPreviewAudioRef.current) {
        listPreviewAudioRef.current.pause();
      }
      if (clonedSampleBlobUrl) {
        URL.revokeObjectURL(clonedSampleBlobUrl);
      }
    };
  }, [clonedSampleBlobUrl]);

  // Fetch initial voices, models, and cloned profiles
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const providerHeader = healthRes.headers.get('x-backend-provider');
          const fallbackHeader = healthRes.headers.get('x-backend-fallback');
          const hData = await healthRes.json().catch(() => ({}));
          if (fallbackHeader === 'true' || providerHeader === 'vercel-serverless' || hData.isFallback === true || hData.provider === 'vercel-serverless') {
            setIsVercelFallback(true);
          }
        }
      } catch {}

      try {
        const res = await fetch('/api/plugins/speech-studio/voices');
        if (res.ok) {
          const data = await res.json();
          if (data.voices && Array.isArray(data.voices)) {
            setNeuralVoices(data.voices);
          }
        }
      } catch {}
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
      } catch {}
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
              data.voices.forEach((v: ClonedVoiceProfile) => map.set(v.id, v));
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
        console.warn('[SpeechStudio] Cloned profiles fetch error:', err);
      }
    };

    fetchVoices();
    fetchModels();
    fetchClonedProfiles();
  }, [userToken]);

  // Fetch Quota
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

  // HTML5 Audio Event Listeners for main studio playback
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

  // Filter voices cleanly for main view
  const filteredVoices = neuralVoices.filter(v => {
    if (selectedLang !== 'all') {
      if (selectedLang === 'hi' && !v.lang.startsWith('hi')) return false;
      if (selectedLang === 'en' && !v.lang.startsWith('en')) return false;
    }
    if (voiceFilter === 'commercial') return v.commercialUse === 'commercial_safe';
    if (voiceFilter === 'hi') return v.lang.startsWith('hi');
    if (voiceFilter === 'en') return v.lang.startsWith('en');
    if (voiceFilter === 'cloned') return false; // Handled separately
    return true;
  });

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
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
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

  // Main Studio Synthesis
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

      const payload = {
        text,
        lang: activeVoice.lang,
        voiceId: activeVoice.id,
        voiceName: activeVoice.name,
        rate,
        pitch,
        volume,
        architecture: isCloned ? (activeCloned.architecture || 'voxcpm') : (activeVoice as any).architecture || 'edge-tts',
        gender: activeCloned?.gender || (activeVoice as any).gender || 'male',
        timbrePreference: activeCloned?.gender || (activeVoice as any).gender || 'male',
        referenceAudio: isCloned ? (activeVoice as any).referenceAudio : undefined
      };

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
        message: `TTS: Synthesized "${text.slice(0, 30)}..." via ${activeVoice.name} (${data.engine || 'neural'})`
      });

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
        architecture: (activeVoice as any).architecture || 'edge-tts'
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

  // Toggle quick audio preview on list item
  const handleToggleListPreview = (voice: TTSVoiceOption) => {
    const audioUrl = voice.previewSample || voice.referenceAudioUrl;
    if (!audioUrl) return;

    if (previewPlayingId === voice.id) {
      if (listPreviewAudioRef.current) {
        listPreviewAudioRef.current.pause();
      }
      setPreviewPlayingId(null);
    } else {
      if (listPreviewAudioRef.current) {
        listPreviewAudioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      listPreviewAudioRef.current = audio;
      audio.onended = () => setPreviewPlayingId(null);
      audio.onerror = () => setPreviewPlayingId(null);
      audio.play().catch(() => setPreviewPlayingId(null));
      setPreviewPlayingId(voice.id);
    }
  };

  // --- REPLICATE VOICE RECORDING HANDLERS ---
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
          const errText = 'Microphone capture stopped with insufficient audio data. Please ensure your microphone is enabled.';
          setErrorMessage(errText);
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        const rawMime = mediaRecorder.mimeType || selectedMime || 'audio/webm';
        const rawBlob = new Blob(audioChunksRef.current, { type: rawMime });

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
          const isSilent = maxAmp < 0.008;

          const wavBlob = audioBufferToWavBlob(decodedBuffer);
          const blobUrl = URL.createObjectURL(wavBlob);
          setClonedSampleBlobUrl(blobUrl);

          const reader = new FileReader();
          reader.onloadend = () => {
            setClonedSampleBase64(reader.result as string);
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
          decodeCtx.close().catch(() => {});
        } catch {
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
      setErrorMessage(`Microphone access error: ${err.message}. Please allow microphone permissions.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
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
      const wavBlob = audioBufferToWavBlob(decodedBuffer);

      const reader = new FileReader();
      reader.onloadend = () => {
        setClonedSampleBase64(reader.result as string);
      };
      reader.readAsDataURL(wavBlob);


      setAudioDiagnostics({
        totalBytes: file.size,
        chunkCount: 1,
        durationSec: Number(decodedBuffer.duration.toFixed(1)),
        format: file.type || 'audio/wav',
        peakPercent: 85,
        peakDb: -3.0,
        rmsPercent: 40,
        isSilent: false,
        sampleRate: decodedBuffer.sampleRate,
        channels: decodedBuffer.numberOfChannels,
        timestamp: new Date().toLocaleTimeString()
      });

      decodeCtx.close().catch(() => {});
    } catch {
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
        channels: 1,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  const handleToggleTestPlayback = () => {
    const playbackUrl = clonedSampleBlobUrl || clonedSampleBase64;
    if (!playbackUrl) return;

    if (isTestPlayingSample && testSampleAudioRef.current) {
      testSampleAudioRef.current.pause();
      testSampleAudioRef.current.currentTime = 0;
      setIsTestPlayingSample(false);
      return;
    }

    if (!testSampleAudioRef.current) {
      testSampleAudioRef.current = new Audio();
      testSampleAudioRef.current.onended = () => setIsTestPlayingSample(false);
      testSampleAudioRef.current.onerror = () => setIsTestPlayingSample(false);
    }

    testSampleAudioRef.current.src = playbackUrl;
    testSampleAudioRef.current.play()
      .then(() => setIsTestPlayingSample(true))
      .catch(() => setIsTestPlayingSample(false));
  };

  // --- SYNTHESIS WITH REPLICATED VOICE (User Request 4) ---
  const handleSynthesizeReplicatedVoice = async () => {
    if (!replicateTestScript.trim()) {
      setErrorMessage('Please enter the test script for your replicated voice.');
      return;
    }
    if (!clonedSampleBase64) {
      setErrorMessage('Please record or upload an audio voice sample first.');
      return;
    }

    setErrorMessage(null);
    setIsReplicating(true);
    setVerificationAudioUrl(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

      const clonePayload = {
        text: replicateTestScript.trim(),
        sampleAudio: clonedSampleBase64,
        referenceText: referenceTranscript,
        speakerName: replicateVoiceName,
        timbrePreference: replicateGender,
        gender: replicateGender,
        architecture: replicateArchitecture,
        rate,
        pitch,
        volume
      };

      let res: Response;
      try {
        res = await fetch('/api/plugins/speech-studio/clone-voice', {
          method: 'POST',
          headers,
          body: JSON.stringify(clonePayload),
          signal: AbortSignal.timeout(52000)
        });
      } catch (firstErr: any) {
        if (firstErr?.name === 'TimeoutError' || firstErr?.name === 'AbortError') {
          throw new Error('Neural voice synthesis exceeded the 50s cloud execution window. Please try a shorter test sentence (5-10 words) or select Edge Neural Acoustic Matcher for instant generation.');
        }
        throw firstErr;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || data.details || 'Voice cloning synthesis failed.');

      if (data.quota) setQuota(data.quota);
      if (data.telemetry) setVerificationTelemetry(data.telemetry);

      if (data.audioUrl) {
        setVerificationAudioUrl(data.audioUrl);
        if (verificationAudioRef.current) {
          verificationAudioRef.current.src = data.audioUrl;
          verificationAudioRef.current.play().then(() => {
            setIsVerificationPlaying(true);
          }).catch(() => {});
        }
      }

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `Voice Replicated: Generated test speech via ${
          replicateArchitecture === 'voxcpm' ? 'Hush Studio VoxCPM' : replicateArchitecture === 'styletts2' ? 'StyleTTS 2 Neural Vocoder' : 'Edge Acoustic Matcher'
        }.`
      });

    } catch (err: any) {
      setErrorMessage(err.message || 'Voice cloning synthesis failed.');
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `Voice Cloning Error: ${err.message || 'Voice cloning failed.'}`
      });
    } finally {
      setIsReplicating(false);
    }
  };

  const handleToggleVerificationPlay = () => {
    if (!verificationAudioUrl) return;
    const audio = verificationAudioRef.current;
    if (!audio) return;

    if (isVerificationPlaying) {
      audio.pause();
      setIsVerificationPlaying(false);
    } else {
      audio.play().then(() => {
        setIsVerificationPlaying(true);
      }).catch(() => {
        setIsVerificationPlaying(false);
      });
    }
  };

  // --- APPROVE & ADD VOICE TO LIBRARY (User Request 4) ---
  const handleApproveAndSaveVoice = async () => {
    if (!replicateVoiceName.trim()) {
      setErrorMessage('Please enter a name for your voice profile.');
      return;
    }
    if (!clonedSampleBase64) {
      setErrorMessage('No voice sample found. Please capture or upload audio first.');
      return;
    }

    const archLabel = replicateArchitecture === 'voxcpm'
      ? 'Hush Studio VoxCPM'
      : replicateArchitecture === 'styletts2'
        ? 'StyleTTS 2 Neural'
        : 'Edge Neural Acoustic';

    const newProfile: ClonedVoiceProfile = {
      id: `cloned-${Date.now()}`,
      name: replicateVoiceName.trim(),
      description: `Replicated ${replicateGender} voice (${archLabel})`,
      createdAt: new Date().toISOString(),
      sampleDurationSec: audioDiagnostics?.durationSec || recordingDuration || 5,
      sampleAudioDataUrl: clonedSampleBase64,
      verifiedAudioUrl: verificationAudioUrl || undefined,
      architecture: archLabel,
      usageTag: 'Personal Voice Replicate',
      referenceText: referenceTranscript.trim(),
      language: selectedCalibrationPrompt?.lang || 'en-US',
      languageLabel: selectedCalibrationPrompt?.title.split(' ')[0] || 'English (US)',
      gender: replicateGender,
      emotionTag: 'Warm & Natural',
      commercialUse: 'commercial_safe',
      commercialLabel: 'Commercial Safe (Self-Owned)'
    };

    const updated = [newProfile, ...clonedProfiles.filter(p => p.id !== newProfile.id)];
    setClonedProfiles(updated);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;
      await fetch('/api/plugins/speech-studio/cloned-voices', {
        method: 'POST',
        headers,
        body: JSON.stringify(newProfile)
      });
    } catch (err) {
      console.warn('[SpeechStudio] Server profile sync warning:', err);
    }

    try {
      localStorage.setItem('sutharlabs_cloned_voice_profiles', JSON.stringify(updated));
    } catch {}

    setSaveSuccessMsg(`Voice "${newProfile.name}" approved and added to your Voice Library!`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);

    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `Voice "${newProfile.name}" approved with architecture ${archLabel} and gender ${replicateGender}.`
    });
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

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('sutharlabs_tts_history'); } catch { }
    setConfirmClearHistory(false);
  };

  const handleCopyHistory = (content: string, key: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Hidden Audio Elements */}
      <audio ref={audioPlayerRef} preload="auto" />
      <audio
        ref={verificationAudioRef}
        onEnded={() => setIsVerificationPlaying(false)}
        onError={() => setIsVerificationPlaying(false)}
        preload="auto"
      />

      {/* 1. Header with Container Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline/20 pb-4 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Volume2 className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                Neural Speech Studio & Voice Replication
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">
                VOICE-FIRST ARCHITECTURE
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              High-fidelity neural speech synthesis, voice replication, and open-source models with zero latency.
            </p>
          </div>
        </div>

        {/* Quota Badge */}
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
            <span>Architectures & Engines</span>
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
                The neural voice engine is unavailable. You can retry synthesis or use client browser speech fallback.
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
            >
              <X className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Vercel Serverless Edge Fallback Notice */}
      {isVercelFallback && (
        <div className={`p-3 sm:p-3.5 rounded-xl border flex items-start justify-between gap-3 shadow-md animate-in fade-in transition-colors ${
          isLight
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            </div>
            <div className="text-xs">
              <span className="font-bold font-mono tracking-tight text-amber-500 uppercase text-[11px]">
                Vercel Serverless Fallback Active
              </span>
              <p className={`mt-0.5 text-[11px] leading-relaxed font-sans ${isLight ? 'text-amber-900/90' : 'text-amber-200/80'}`}>
                The remote VM 2 neural synthesizer daemon is currently unreachable. Speech studio has enabled in-context reference voice playback and native browser speech fallback.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: STUDIO VOICES (REDESIGNED: VOICE-FIRST & CLEAN, USER REQUEST 3) */}
      {activeTab === 'synthesize' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Script Input & Modulation */}
          <div className="lg:col-span-7 space-y-4">
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center justify-between border-b border-outline/15 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Script Input & Voice Synthesis</h3>
                    <p className="text-[10px] text-on-surface-variant font-mono">
                      Selected Voice: <span className="text-[#00dbe7] font-bold">
                        {clonedProfiles.find(p => p.id === selectedVoiceId)?.name || neuralVoices.find(v => v.id === selectedVoiceId)?.name || 'Aarav'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Language Focus Filter */}
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

              {/* Textarea */}
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
              <div>
                <div className="text-[10px] font-mono text-on-surface-variant uppercase font-bold mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#00dbe7] shrink-0" />
                  <span>Preset Prompts:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setText(sample.text)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
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

              {/* Compact Voice Modulation Controls */}
              <div className={`p-3 rounded-xl border space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/5'
              }`}>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-on-surface">
                  <span className="flex items-center gap-1.5 uppercase">
                    <Sliders className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                    Vocal Modulation
                  </span>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    Speed: <strong className="text-[#00dbe7]">{rate.toFixed(2)}x</strong> • Pitch: <strong className="text-[#00dbe7]">{pitch.toFixed(2)}x</strong> • Volume: <strong className="text-[#00dbe7]">{Math.round(volume * 100)}%</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-on-surface-variant uppercase block mb-1">
                      Speed: {rate.toFixed(2)}x
                    </label>
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
                    <label className="text-[10px] font-mono text-on-surface-variant uppercase block mb-1">
                      Pitch: {pitch.toFixed(2)}x
                    </label>
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
                    <label className="text-[10px] font-mono text-on-surface-variant uppercase block mb-1">
                      Volume: {Math.round(volume * 100)}%
                    </label>
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

              {/* Action Toolbar */}
              <div className="pt-2 border-t border-outline/20 flex items-center justify-between gap-3 flex-wrap">
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
                        <span>SYNTHESIZE SPEECH</span>
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

          {/* Right Column (5 cols): Voice-First Voice Selector with Usage Tags & Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
            }`}>
              <div className="flex items-center justify-between border-b border-outline/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  <span className="text-xs font-mono font-bold uppercase text-on-surface">
                    Available Voices
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#00dbe7] font-semibold bg-[#00dbe7]/10 px-2 py-0.5 rounded border border-[#00dbe7]/20">
                  {filteredVoices.length + clonedProfiles.length} Voices
                </span>
              </div>

              {/* Clean Filter Tabs */}
              <div className={`flex rounded-lg p-0.5 border text-[10px] font-mono overflow-x-auto [scrollbar-width:none] ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
              }`}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'commercial', label: 'Commercial Safe' },
                  { id: 'hi', label: 'Hindi' },
                  { id: 'en', label: 'English' },
                  { id: 'cloned', label: `My Replicated (${clonedProfiles.length})` }
                ].map(filter => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setVoiceFilter(filter.id as any)}
                    className={`flex-1 py-1 px-2 rounded-md cursor-pointer transition-all whitespace-nowrap text-center ${
                      voiceFilter === filter.id
                        ? isLight
                          ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300'
                          : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Scrollable Voice Cards List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {/* 1. Replicated User Voices (if any and filter matches) */}
                {(voiceFilter === 'all' || voiceFilter === 'cloned') && clonedProfiles.length > 0 && (
                  <div className="pb-2 mb-2 border-b border-purple-500/25 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#ce5dff] shrink-0" />
                        My Replicated Voices ({clonedProfiles.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('clone')}
                        className="text-[9px] text-[#ce5dff] hover:underline cursor-pointer"
                      >
                        + Replicate Voice
                      </button>
                    </div>

                    {clonedProfiles.map(cloned => (
                      <div
                        key={cloned.id}
                        onClick={() => setSelectedVoiceId(cloned.id)}
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
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold font-sans truncate text-[#ce5dff]">{cloned.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              {cloned.gender}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Commercial Safe
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono text-on-surface-variant mt-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {cloned.architecture || 'VoxCPM In-Context'}
                          </span>
                          <span>{cloned.languageLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Standard Available Voices */}
                {voiceFilter !== 'cloned' && filteredVoices.map(voice => {
                  const isSelected = selectedVoiceId === voice.id;
                  const archBadge = voice.architecture === 'voxcpm'
                    ? 'Hush VoxCPM'
                    : voice.architecture === 'kokoro-82m'
                      ? 'Kokoro-82M'
                      : voice.architecture === 'indic-tts'
                        ? 'Indic Parler'
                        : voice.architecture === 'melotts'
                          ? 'MeloTTS'
                          : 'Neural Edge';

                  return (
                    <div
                      key={voice.id}
                      onClick={() => setSelectedVoiceId(voice.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? isLight
                            ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-xs ring-1 ring-sky-300'
                            : 'bg-[#00dbe7]/10 border-[#00dbe7]/50 text-white shadow-xs ring-1 ring-[#00dbe7]/30'
                          : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-white/5 hover:bg-white/10 border-white/5 text-on-surface-variant'
                      }`}
                    >
                      {/* Top Row: Name, Gender & Actions */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold font-sans truncate">{voice.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase shrink-0 ${
                            voice.gender === 'female'
                              ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {voice.gender}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Quick Sample Preview Button */}
                          {(voice.previewSample || voice.referenceAudioUrl) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleListPreview(voice);
                              }}
                              className={`p-1 px-1.5 rounded-md border text-[9px] flex items-center gap-1 transition-all cursor-pointer ${
                                previewPlayingId === voice.id
                                  ? 'bg-emerald-500 text-white border-emerald-600'
                                  : isLight
                                    ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:text-emerald-600'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-emerald-400 border-white/10'
                              }`}
                              title="Listen to voice preview sample"
                            >
                              {previewPlayingId === voice.id ? <Pause className="w-2.5 h-2.5 shrink-0" /> : <Play className="w-2.5 h-2.5 shrink-0" />}
                              <span className="font-mono text-[8px] uppercase">
                                {previewPlayingId === voice.id ? 'Pause' : 'Sample'}
                              </span>
                            </button>
                          )}

                          {/* Architecture & License Info Trigger (User Request 3) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVoiceForInfo(voice);
                            }}
                            className={`p-1 px-1.5 rounded-md border text-[9px] flex items-center gap-1 transition-all cursor-pointer ${
                              isLight
                                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:text-sky-600'
                                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#00dbe7] border-white/10'
                            }`}
                            title="Inspect Architecture, Engine Specs & License"
                          >
                            <Info className="w-3 h-3 text-[#00dbe7] shrink-0" />
                            <span className="font-mono uppercase font-bold text-[8px]">Specs</span>
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Usage Tag & Engine Source Badges (User Request 3) */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {/* Usage Tag */}
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold truncate max-w-[170px] ${
                          isLight
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30'
                        }`}>
                          {voice.usageTag || voice.emotionTag || 'General Studio'}
                        </span>

                        {/* Engine Source Badge */}
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-white/5 text-on-surface-variant border border-outline/20">
                          {archBadge}
                        </span>

                        {/* Commercial License Pill */}
                        {voice.commercialUse === 'commercial_safe' ? (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5 shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5 shrink-0 text-emerald-400" /> Commercial
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                            Personal
                          </span>
                        )}
                      </div>

                      {/* Bottom Accent / Description */}
                      <p className="text-[10px] text-on-surface-variant mt-1 leading-tight font-mono line-clamp-1">
                        {voice.description || voice.accent || voice.languageLabel}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPLICATE MY VOICE (REDESIGNED: SPLIT COCKPIT & VERIFICATION, USER REQUEST 4) */}
      {activeTab === 'clone' && (
        <div className="space-y-5">
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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

          {/* Screen-Maximizing Dual-Pane Cockpit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Pane (5 cols): Voice Capture & Architecture Config */}
            <div className="lg:col-span-5 space-y-4">
              <div className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
              }`}>
                <div className="flex items-center gap-2.5 border-b border-outline/20 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 text-[#ce5dff] shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Step 1: Voice Identity & Capture</h3>
                    <p className="text-[10px] text-on-surface-variant font-mono">
                      Capture sample and select replication architecture
                    </p>
                  </div>
                </div>

                {/* Voice Profile Name */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-on-surface-variant mb-1">
                    Voice Profile Name *
                  </label>
                  <input
                    type="text"
                    value={replicateVoiceName}
                    onChange={(e) => setReplicateVoiceName(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border font-mono text-xs focus:outline-none transition-colors ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                    }`}
                    placeholder="e.g. Suresh Sovereign Voice"
                  />
                </div>

                {/* Gender Selection */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-on-surface-variant mb-1">
                    Vocal Gender Target
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['male', 'female', 'neutral'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setReplicateGender(g)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold capitalize transition-all border cursor-pointer ${
                          replicateGender === g
                            ? isLight
                              ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                              : 'bg-[#ce5dff]/20 text-[#ce5dff] border-[#ce5dff]/50 shadow-sm'
                            : isLight
                              ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              : 'bg-white/5 text-on-surface-variant border-white/10 hover:text-white'
                        }`}
                      >
                        {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '✨ Neutral'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Replication Architecture Picker (User Request 4) */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-on-surface-variant mb-1">
                    Replication Architecture
                  </label>
                  <div className="space-y-1.5">
                    {[
                      {
                        id: 'voxcpm',
                        name: 'Hush Studio VoxCPM',
                        tag: 'Deep Neural • ~20s',
                        desc: 'Faithful zero-shot autoregressive flow matching on CPU. Turnaround ~18–25s.'
                      },
                      {
                        id: 'styletts2',
                        name: 'StyleTTS 2 Neural Vocoder',
                        tag: 'Style Latents • ~20s',
                        desc: 'Neural vocoder formant synthesis with expressive emotional prosody (~20s).'
                      },
                      {
                        id: 'edge',
                        name: 'Edge Neural Acoustic Matcher',
                        tag: 'Instant • ~1.5s',
                        desc: 'Instant cloud acoustic mapping calibrated to gender and formant pitch characteristics.'
                      }
                    ].map(arch => {
                      const isSelected = replicateArchitecture === arch.id;
                      return (
                        <div
                          key={arch.id}
                          onClick={() => setReplicateArchitecture(arch.id as any)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? isLight
                                ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-xs ring-1 ring-purple-300'
                                : 'bg-[#ce5dff]/15 border-[#ce5dff]/60 text-white shadow-xs ring-1 ring-[#ce5dff]/40'
                              : isLight
                                ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                : 'bg-white/5 hover:bg-white/10 border-white/5 text-on-surface-variant'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold font-sans">{arch.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {arch.tag}
                            </span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5 leading-tight">
                            {arch.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Source Mode Switcher: Mic vs Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
                      Audio Ingestion Source
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setReplicateSourceMode('mic')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                          replicateSourceMode === 'mic'
                            ? isLight ? 'bg-purple-600 text-white' : 'bg-[#ce5dff] text-black font-extrabold'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        🎙️ Microphone
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplicateSourceMode('upload')}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                          replicateSourceMode === 'upload'
                            ? isLight ? 'bg-purple-600 text-white' : 'bg-[#ce5dff] text-black font-extrabold'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        📂 Upload
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Microphone Capture */}
                  {replicateSourceMode === 'mic' && (
                    <div className="space-y-2.5">
                      {/* Teleprompter Reading Passage */}
                      <div className={`p-2.5 rounded-lg border space-y-1 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-sky-400 shrink-0" />
                            Read Aloud (10–20s):
                          </span>
                          <span className="text-[8px] px-1 rounded bg-black/20 text-on-surface-variant">
                            {selectedCalibrationPrompt?.durationEst}
                          </span>
                        </div>
                        <p className="text-xs font-sans italic leading-relaxed select-all">
                          "{selectedCalibrationPrompt?.text}"
                        </p>
                      </div>

                      {/* Microphone Arm / Record Box */}
                      <div className={`p-3 rounded-xl border text-center space-y-2 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'
                      }`}>
                        {isRecording && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                                RECORDING ({recordingDuration}s / 30s)
                              </span>
                              <span className="text-emerald-400 font-bold font-mono">
                                Level: {micLiveLevel}% (Peak: {micPeakLive}%)
                              </span>
                            </div>

                            {/* Live VU Bar */}
                            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden flex items-center p-0.5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75"
                                style={{ width: `${Math.min(100, Math.max(micLiveLevel > 0 ? 5 : 0, micLiveLevel))}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-2">
                          {!isRecording ? (
                            <button
                              type="button"
                              onClick={startRecording}
                              className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
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
                    </div>
                  )}

                  {/* Mode B: File Upload */}
                  {replicateSourceMode === 'upload' && (
                    <label className={`block p-3 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                      isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}>
                      <Upload className="w-4 h-4 mx-auto text-on-surface-variant mb-1 shrink-0" />
                      <span className="text-xs font-mono font-semibold block">Select audio file (.wav, .mp3)</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">5–30s clear speech</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Sample Diagnostics & Playback Preview */}
                {(clonedSampleBase64 || clonedSampleBlobUrl) && (
                  <div className={`p-3 rounded-xl border space-y-2 ${
                    isLight ? 'bg-emerald-50/70 border-emerald-300' : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        Audio Sample Ready ({audioDiagnostics?.durationSec || recordingDuration || 5}s)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (clonedSampleBlobUrl) URL.revokeObjectURL(clonedSampleBlobUrl);
                          setClonedSampleBlobUrl(null);
                          setClonedSampleBase64(null);
                          setAudioDiagnostics(null);
                        }}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleToggleTestPlayback}
                        className={`h-7 px-3 rounded-lg text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isTestPlayingSample
                            ? 'bg-rose-500 text-white'
                            : isLight ? 'bg-sky-500 text-white' : 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/40'
                        }`}
                      >
                        {isTestPlayingSample ? <Square className="w-3 h-3 shrink-0" /> : <Play className="w-3 h-3 shrink-0" />}
                        <span>{isTestPlayingSample ? 'Stop' : 'Play Sample'}</span>
                      </button>

                      {clonedSampleBlobUrl && (
                        <a
                          href={clonedSampleBlobUrl}
                          download="recorded-voice-sample.wav"
                          className="h-7 px-2.5 rounded-lg text-[10px] font-mono border flex items-center gap-1"
                        >
                          <Download className="w-3 h-3 shrink-0" />
                          <span>WAV</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane (7 cols): Test Script, Synthesis & Approval (User Request 4) */}
            <div className="lg:col-span-7 space-y-4">
              <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-[#3a494b]/40'
              }`}>
                <div className="flex items-center justify-between border-b border-outline/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[#00dbe7] shrink-0" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">Step 2: Synthesize, Verify &amp; Approve</h3>
                      <p className="text-[10px] text-on-surface-variant font-mono">
                        Listen to the synthesized output, verify fidelity, and approve addition to library
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    {replicateArchitecture === 'voxcpm' ? 'VoxCPM SOTA' : replicateArchitecture === 'styletts2' ? 'StyleTTS 2' : 'Edge Matcher'}
                  </span>
                </div>

                {/* Test Textarea */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-on-surface-variant mb-1">
                    Test Script to Speak
                  </label>
                  <textarea
                    value={replicateTestScript}
                    onChange={(e) => setReplicateTestScript(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Enter what you want your replicated voice to say..."
                    className={`w-full p-3 rounded-xl border font-sans text-sm focus:outline-none transition-colors resize-y leading-relaxed ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-purple-500'
                        : 'bg-[#121215] border-[#3a494b]/50 text-white focus:border-[#ce5dff]'
                    }`}
                  />
                </div>

                {/* Quick Test Phrases */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    'Welcome to SutharLabs. Our high-frequency algorithms are monitoring market telemetry.',
                    'This is my sovereign voice replicated using state-of-the-art neural acoustic modeling.',
                    'नमस्ते! यह सुथारलैब्स स्पीच स्टूडियो में मेरी आवाज का न्यूरल क्लोन है।'
                  ].map((phrase, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReplicateTestScript(phrase)}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-all cursor-pointer truncate max-w-xs ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10 text-on-surface-variant'
                      }`}
                    >
                      {phrase.slice(0, 45)}...
                    </button>
                  ))}
                </div>

                {/* Synthesis Trigger Button */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSynthesizeReplicatedVoice}
                    disabled={isReplicating || !replicateTestScript.trim() || !clonedSampleBase64}
                    className={`h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 leading-none border shadow-sm ${
                      isLight
                        ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700'
                        : 'bg-[#ce5dff]/20 hover:bg-[#ce5dff]/30 text-[#ce5dff] hover:text-white border-[#ce5dff]/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isReplicating ? (
                      <>
                        <Zap className="w-4 h-4 animate-spin shrink-0 text-amber-300" />
                        <span>SYNTHESIZING WITH REPLICATED VOICE (~20s)...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 shrink-0" />
                        <span>SYNTHESIZE &amp; TEST VOICE</span>
                      </>
                    )}
                  </button>

                  {isReplicating ? (
                    <span className="text-[10px] font-mono text-purple-400 animate-pulse flex items-center gap-1">
                      <Cpu className="w-3 h-3 shrink-0" /> Neural zero-shot flow matching on Cloud CPU (turnaround ~18–25s)...
                    </span>
                  ) : !clonedSampleBase64 ? (
                    <span className="text-[10px] font-mono text-amber-400">
                      * Record or upload audio in Step 1 first
                    </span>
                  ) : null}
                </div>

                {/* VERIFICATION AUDIO PLAYER & APPROVAL (User Request 4) */}
                {verificationAudioUrl && (
                  <div className={`p-4 rounded-xl border space-y-3 animate-in fade-in transition-all ${
                    isLight ? 'bg-emerald-50/80 border-emerald-400' : 'bg-emerald-950/20 border-emerald-500/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold font-sans text-on-surface">
                            Synthesized Voice Output Verified
                          </h4>
                          <span className="text-[10px] font-mono text-on-surface-variant">
                            Architecture: {replicateArchitecture.toUpperCase()} • Gender: {replicateGender} • Status: Ready for Library
                          </span>
                        </div>
                      </div>

                      <a
                        href={verificationAudioUrl}
                        download={`${replicateVoiceName.toLowerCase().replace(/\s+/g, '-')}-verified.wav`}
                        className="p-1 px-2 rounded text-[10px] font-mono border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3 shrink-0" />
                        <span>Download</span>
                      </a>
                    </div>

                    {/* Verification Audio Player Controls */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleToggleVerificationPlay}
                        className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                          isVerificationPlaying
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isVerificationPlaying ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
                        <span>{isVerificationPlaying ? 'Pause Verification Audio' : 'Play Synthesized Audio'}</span>
                      </button>
                    </div>

                    {/* APPROVE ACTION BUTTON (User Request 4) */}
                    <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-3">
                      <p className="text-[11px] font-mono text-on-surface-variant">
                        Listen to the synthesized output. If satisfied with fidelity, approve to add to your library.
                      </p>

                      <button
                        type="button"
                        onClick={handleApproveAndSaveVoice}
                        className="h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>APPROVE &amp; ADD VOICE TO LIBRARY</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section: My Replicated Voices Library */}
          <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4 ${
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
                    Approved voice profiles showing architecture, gender tags, and management controls
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/30">
                {clonedProfiles.length} Approved Voices
              </span>
            </div>

            {clonedProfiles.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-outline/25 text-center space-y-2">
                <Mic className="w-8 h-8 mx-auto text-on-surface-variant opacity-60" />
                <p className="text-xs font-mono text-on-surface-variant">
                  No replicated voices saved yet. Capture audio above, synthesize a test sample, and click "Approve &amp; Add Voice to Library".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                          {profile.description || 'Approved replicated voice'}
                        </p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Commercial Safe
                      </span>
                    </div>

                    {/* Architecture and Gender Badges (User Request 4) */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                        {profile.architecture || 'Hush Studio VoxCPM'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase font-bold">
                        {profile.gender}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant border border-white/10">
                        {profile.languageLabel}
                      </span>
                    </div>

                    {/* Audio Player if verified sample exists */}
                    {(profile.verifiedAudioUrl || profile.sampleAudioDataUrl) && (
                      <div className="pt-1">
                        <audio
                          controls
                          src={profile.verifiedAudioUrl || profile.sampleAudioDataUrl}
                          className="w-full h-7"
                        />
                      </div>
                    )}

                    {/* Management Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline/15">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVoiceId(profile.id);
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
                        <span>USE IN TTS STUDIO →</span>
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
      )}

      {/* TAB 3: ARCHITECTURES & ENGINES (WITH APPLICABLE VOICES, USER REQUEST 3) */}
      {activeTab === 'models' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#00dbe7] shrink-0" />
                Selectable Neural TTS Model Architectures
              </h3>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                Inspect architecture parameter counts, latency, and select voices powered by each architecture.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {architectures.map(arch => {
              // Find all voices that belong to this architecture (User Request 3)
              const applicableVoices = neuralVoices.filter(v => {
                if (arch.id === 'edge-tts') return v.architecture === 'edge-tts';
                if (arch.id === 'voxcpm') return v.architecture === 'voxcpm' || v.approach === 'hush_reference';
                if (arch.id === 'kokoro-82m') return v.architecture === 'kokoro-82m';
                if (arch.id === 'indic-tts') return v.architecture === 'indic-tts';
                if (arch.id === 'melotts') return v.architecture === 'melotts';
                return v.architecture === arch.id;
              });

              return (
                <div
                  key={arch.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-200'
                      : 'bg-[#18181b] hover:bg-[#201f21] border-[#3a494b]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-white/5 border-white/10">
                          <Cpu className="w-4 h-4 shrink-0 text-[#00dbe7]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">{arch.name}</h4>
                          <span className="text-[10px] font-mono text-on-surface-variant">
                            {arch.parameters} • {arch.license} • {arch.speed}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-white/5 text-on-surface-variant border-white/10">
                        {arch.badge}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant font-mono leading-relaxed mt-2 mb-3">
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
                      <div className="flex items-center gap-1 flex-wrap mt-1">
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

                    {/* APPLICABLE VOICES SECTION (User Request 3) */}
                    <div className="space-y-1.5 pt-2 border-t border-outline/10">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                        <span>Voices Powered by this Architecture:</span>
                        <span className="text-[#00dbe7]">{applicableVoices.length} Voices</span>
                      </div>

                      {applicableVoices.length === 0 ? (
                        <p className="text-[11px] font-mono text-on-surface-variant opacity-70 italic">
                          Used for dynamic zero-shot voice replication and custom user profiles.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {applicableVoices.slice(0, 6).map(v => (
                            <div
                              key={v.id}
                              onClick={() => {
                                setSelectedVoiceId(v.id);
                                setActiveTab('synthesize');
                              }}
                              className={`p-1.5 px-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                                selectedVoiceId === v.id
                                  ? isLight ? 'bg-sky-100 border-sky-400 font-bold' : 'bg-[#00dbe7]/20 border-[#00dbe7] text-[#00dbe7] font-bold'
                                  : isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-white/5 hover:bg-white/10 border-white/5'
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="text-xs truncate block">{v.name.split('(')[0].trim()}</span>
                                <span className="text-[9px] font-mono text-on-surface-variant truncate block">
                                  {v.usageTag || v.gender}
                                </span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
              No speech history yet. Synthesize or replicate a voice to populate audio records.
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
                      onClick={() => handleCopyHistory(item.text, item.id)}
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

      {/* ARCHITECTURE & SPECS MODAL (USER REQUEST 3: LEARN ABOUT ARCHITECTURE ON VOICE CLICK) */}
      {voiceForInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (infoSampleRef.current) infoSampleRef.current.pause();
            setInfoSamplePlaying(false);
            setVoiceForInfo(null);
          }}
        >
          <div
            className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-150 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Single-Tone Accent Bar */}
            <div className="h-1 w-full bg-[#00dbe7]" />

            <div className="p-5 sm:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
                    <Cpu className="w-5 h-5 text-[#00dbe7] shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-on-surface font-sans">
                      {voiceForInfo.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                      Architecture Specifications &amp; Commercial Provenance
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (infoSampleRef.current) infoSampleRef.current.pause();
                    setInfoSamplePlaying(false);
                    setVoiceForInfo(null);
                  }}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isLight
                      ? 'border-slate-300 hover:bg-slate-100 text-slate-600'
                      : 'border-[#3a494b]/40 hover:bg-white/10 text-on-surface-variant'
                  }`}
                  aria-label="Close architecture specs dialog"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
              </div>

              {/* Status & Engine Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Engine: {voiceForInfo.architecture || 'Neural Edge'}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase border ${
                  voiceForInfo.commercialUse === 'commercial_safe'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {voiceForInfo.commercialLabel || (voiceForInfo.commercialUse === 'commercial_safe' ? 'Commercial Safe' : 'Personal / Staging')}
                </span>
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] uppercase bg-surface-container-low text-on-surface-variant border border-outline/20">
                  {voiceForInfo.gender} • {voiceForInfo.languageLabel}
                </span>
              </div>

              {/* Architecture Technical Specs Card */}
              <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c]/70 border-[#3a494b]/40'
              }`}>
                <div className="flex items-center justify-between text-on-surface font-bold text-[11px] pb-1 border-b border-outline/10">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                    Model Architecture Profile
                  </span>
                  <span className="text-[#00dbe7]">
                    {voiceForInfo.architecture === 'voxcpm' ? 'VoxCPM 0.5B Q4' : voiceForInfo.architecture === 'kokoro-82m' ? 'Hexgrad 82M' : 'Sovereign Cloud Edge'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-on-surface-variant block">Sample Rate:</span>
                    <strong className="text-on-surface">{voiceForInfo.sampleRate || '24,000 Hz'}</strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Latency:</span>
                    <strong className="text-emerald-400">{voiceForInfo.latency || '<300ms'}</strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Usage Category:</span>
                    <strong className="text-on-surface">{voiceForInfo.usageTag || 'Studio Narration'}</strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">License:</span>
                    <strong className="text-on-surface">{voiceForInfo.licenseName || 'Open Source'}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-on-surface-variant leading-relaxed pt-1">
                  {voiceForInfo.description}
                </p>
              </div>

              {/* Original Reference Audio Preview (if available) */}
              {(voiceForInfo.referenceAudioUrl || voiceForInfo.previewSample) && (
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-emerald-50/70 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-on-surface flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Original Studio Reference Sample
                    </span>
                    <span className="text-[10px] font-mono text-on-surface-variant">
                      Acoustic baseline audio
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const url = voiceForInfo.referenceAudioUrl || voiceForInfo.previewSample!;
                        if (infoSamplePlaying) {
                          if (infoSampleRef.current) infoSampleRef.current.pause();
                          setInfoSamplePlaying(false);
                        } else {
                          const audio = new Audio(url);
                          infoSampleRef.current = audio;
                          audio.onended = () => setInfoSamplePlaying(false);
                          audio.onerror = () => setInfoSamplePlaying(false);
                          audio.play().then(() => setInfoSamplePlaying(true)).catch(() => setInfoSamplePlaying(false));
                        }
                      }}
                      className="h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {infoSamplePlaying ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
                      <span>{infoSamplePlaying ? 'Pause Sample' : 'Play Reference Audio'}</span>
                    </button>

                    <a
                      href={voiceForInfo.referenceAudioUrl || voiceForInfo.previewSample}
                      download={`${voiceForInfo.id}-reference.wav`}
                      className="h-8 px-2.5 rounded-lg text-xs font-mono border flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>Download WAV</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Legal and Dataset Details */}
              {voiceForInfo.credits && (
                <div>
                  <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    Attribution &amp; Source
                  </span>
                  <p className={`p-2 rounded-lg border font-mono text-[10px] leading-relaxed ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-black/30 border-white/5 text-gray-300'
                  }`}>
                    {voiceForInfo.credits}
                  </p>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline/15 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (infoSampleRef.current) infoSampleRef.current.pause();
                    setInfoSamplePlaying(false);
                    setVoiceForInfo(null);
                  }}
                  className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVoiceId(voiceForInfo.id);
                    if (infoSampleRef.current) infoSampleRef.current.pause();
                    setInfoSamplePlaying(false);
                    setVoiceForInfo(null);
                  }}
                  className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-sky-500 hover:bg-sky-600 text-white border border-sky-600 shadow-sm cursor-pointer"
                >
                  Use This Voice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}