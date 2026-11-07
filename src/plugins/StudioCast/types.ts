export type VirtualPreset = 'split' | 'grid' | 'spotlight_pip' | 'newsroom' | 'minimal_cyber';

export interface StudioCastParticipant {
  id: string;
  name: string;
  role: 'host' | 'co-host' | 'guest';
  hasAudio: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
  joinedAt: string;
  audioLevel: number; // 0 to 100
  stream?: MediaStream | null;
}

export interface StudioCastChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: 'host' | 'co-host' | 'guest';
  text: string;
  timestamp: string;
  isQuestion?: boolean;
}

export interface LowerThirdConfig {
  showTitle: string;
  subtitle: string;
  topicTicker: string;
  isVisible: boolean;
  accentColor: string;
}

export interface IsoRecordingTrack {
  id: string;
  title: string;
  participantName: string;
  type: 'raw_video' | 'raw_audio' | 'composed_virtual';
  format: 'webm' | 'mp4' | 'wav';
  durationSeconds: number;
  sizeBytes: number;
  blobUrl: string;
  createdAt: string;
}

export interface StudioCastRoom {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  preset: VirtualPreset;
  lowerThird: LowerThirdConfig;
  isRecording: boolean;
  createdAt: string;
  participants: StudioCastParticipant[];
}

export interface SignalMessage {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave' | 'preset_change';
  payload: any;
  timestamp: number;
}

