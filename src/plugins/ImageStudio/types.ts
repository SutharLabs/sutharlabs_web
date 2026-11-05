export type UpscaleEngineType = 'free' | 'clarity-4k';

export interface ImageUpscalePayload {
  image: string; // Base64 or Data URL
  scale?: 2 | 4;
  engine?: UpscaleEngineType;
  prompt?: string;
}

export interface ImageUpscaleResult {
  success: boolean;
  upscaledImageUrl: string;
  engine: string;
  scale: number;
  cost: string;
  executionTimeMs: number;
  originalDimensions?: { width: number; height: number };
  upscaledDimensions?: { width: number; height: number };
  error?: string;
}

export interface ImageHistoryItem {
  id: string;
  timestamp: string;
  originalUrl: string;
  upscaledUrl: string;
  scale: number;
  engine: string;
  cost: string;
  durationMs: number;
}

