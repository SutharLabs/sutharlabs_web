import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_transcribe_studio",
  name: "Transcribe Studio",
  version: "1.0.0",
  category: "AI & Multimedia",
  type: "Native",
  description: "Studio-grade AI Audio Transcriber & Subtitle Generator. Converts audio & video recordings into timestamped text, generates SRT & WebVTT subtitle tracks, and supports synced playback.",
  iconSymbol: "subtitles",
  route: "/workspace/transcribe"
};

