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
  emotionTag?: string;
  communityGrade?: string; // e.g. "Grade A (Top Rated)", "Grade A−", "Grade B−", "Grade C+"
  blendWeight?: number; // 0.0 to 1.0 for vector interpolation blending
  usageTag?: string; // e.g. "Conversational & Podcast", "Narrative & Audiobooks", "Customer Support"
  architecture?: string;
  sampleRate?: string; // e.g. "24,000 Hz", "48,000 Hz"
  latency?: string; // e.g. "~250ms"
  commercialUse?: 'commercial_safe' | 'personal_non_commercial' | 'conditional';
  commercialLabel?: string;
  referenceAudioUrl?: string;
  referenceTranscript?: string;
  datasetName?: string;
  datasetUrl?: string;
  licenseName?: string;
  licenseText?: string;
  licenseDetails?: string;
  credits?: string;
  approach?: 'hush_reference' | 'neural_cloud' | 'flow_matching' | 'web_speech';
}

export interface TTSArchitectureOption {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  status: 'online' | 'ready' | 'experimental';
  speed: string;
  emotionCapability: string;
  keyFeature: string;
  parameters: string;
  license: string;
  supportedEmotions: string[];
}

export interface ClonedVoiceProfile {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  sampleDurationSec: number;
  sampleAudioDataUrl?: string;
  verifiedAudioUrl?: string; // Verified synthesized sample audio
  architecture?: string; // e.g. "Hush Studio VoxCPM", "StyleTTS 2 Neural", "Edge Acoustic Matcher"
  usageTag?: string; // e.g. "Personal Voice", "Podcast Co-Host"
  referenceText?: string;
  language: string;
  languageLabel: string;
  gender: 'female' | 'male' | 'neutral';
  emotionTag?: string;
  commercialUse?: 'commercial_safe' | 'personal_non_commercial';
  commercialLabel?: string;
  referenceTranscript?: string;
  approach?: 'hush_reference' | 'neural_zero_shot';
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
  architecture?: string;
  emotion?: string;
  cfgStrength?: number;
  referenceAudio?: string; // Base64 audio for voice cloning
  approach?: 'hush_reference' | 'neural_cloud' | 'flow_matching' | 'web_speech';
  referenceTranscript?: string;
  referenceAudioUrl?: string;
}

export interface SpeechHistoryItem {
  id: string;
  text: string;
  language: string;
  voiceId?: string;
  voiceName: string;
  charCount: number;
  timestamp: string;
  durationEstimateSec: number;
  audioUrl?: string;
  engine?: string;
  architecture?: string;
  emotion?: string;
}


