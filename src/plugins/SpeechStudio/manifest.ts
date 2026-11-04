import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "speech-studio",
  name: "Speech Studio",
  version: "1.0.0",
  category: "AI & Multimedia",
  type: "tool",
  iconSymbol: "record_voice_over",
  route: "/workspace/speech-studio",
  description: "Multilingual Neural Text-to-Speech synthesizer supporting Hindi (हिंदी) and English with voice modulation, waveform telemetry, and tiered rate-limiting."
};

