import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "speech-studio",
  name: "Speech Studio",
  version: "0.3.3",
  category: "AI & Multimedia",
  type: "tool",
  iconSymbol: "record_voice_over",
  route: "/workspace/speech-studio",
  description: "Studio-grade Neural Text-to-Speech & Zero-Shot Voice Cloning engine. Supports replicating user voices, human narrator voices, Hindi and English synthesis, and audio downloads."
};
