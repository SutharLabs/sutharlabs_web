export interface TTSVoiceOption {
  id: string;
  name: string;
  lang: string;
  languageLabel: string;
  gender: 'female' | 'male' | 'neutral';
  accent?: string;
  isNeural?: boolean;
  engine?: 'neural' | 'cloned' | 'browser';
  description?: string;
  previewSample?: string;
}

export interface ClonedVoiceProfile {
  id: string;
  name: string;
  createdAt: string;
  sampleDurationSec: number;
  sampleAudioDataUrl?: string;
}

export interface TTSQuotaStatus {
  role: string;
  isUnlimited: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetInSeconds: number;
}

export interface TTSSynthesizePayload {
  text: string;
  lang: string;
  voiceId?: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  engine?: 'neural' | 'cloned' | 'browser';
  referenceAudio?: string; // Base64 audio for voice cloning
}

export interface SpeechHistoryItem {
  id: string;
  text: string;
  language: string;
  voiceName: string;
  charCount: number;
  timestamp: string;
  durationEstimateSec: number;
  audioUrl?: string;
  engine?: string;
}


