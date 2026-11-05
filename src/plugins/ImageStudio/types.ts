export type UpscaleEngineType = 'free' | 'clarity-4k';
export type ImageGenModel = 'flux-schnell' | 'flux-realism' | 'sd-3.5' | 'sdxl-turbo' | 'flux-anime' | 'flux-3d';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';
export type StylePreset = 'photorealistic' | 'cinematic' | 'digital-art' | 'anime' | '3d-render' | 'none';

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

export interface ImageGeneratePayload {
  prompt: string;
  negativePrompt?: string;
  model?: ImageGenModel;
  aspectRatio?: AspectRatio;
  stylePreset?: StylePreset;
  seed?: number;
  apiKey?: string;
}

export interface ImageGenerateResult {
  success: boolean;
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio: AspectRatio;
  dimensions: { width: number; height: number };
  executionTimeMs: number;
  provider: string;
  error?: string;
}

export interface ImageHistoryItem {
  id: string;
  timestamp: string;
  type: 'generate' | 'upscale';
  originalUrl?: string;
  resultUrl: string;
  prompt?: string;
  model?: string;
  scale?: number;
  cost: string;
  durationMs: number;
}
