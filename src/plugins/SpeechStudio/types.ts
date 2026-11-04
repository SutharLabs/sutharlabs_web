export interface TTSVoiceOption {
  id: string;
  name: string;
  lang: string;
  languageLabel: string;
  gender: 'female' | 'male' | 'neutral';
  accent?: string;
  isNeural?: boolean;
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
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface SpeechHistoryItem {
  id: string;
  text: string;
  language: string;
  voiceName: string;
  charCount: number;
  timestamp: string;
  durationEstimateSec: number;
}

