import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "speech-studio",
  name: "Speech Studio (Production Enterprise Edition)",
  version: "1.0.0",
  category: "AI & Multimedia",
  type: "tool",
  iconSymbol: "record_voice_over",
  route: "/workspace/speech-studio",
  description: "Production-grade Neural Text-to-Speech & Zero-Shot Voice Cloning engine. Features Kokoro-82M SOTA voices, Piper ultra-low latency models, F5-TTS flow matching, and voice blending."
};
