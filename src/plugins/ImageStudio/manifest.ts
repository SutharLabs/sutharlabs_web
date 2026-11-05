import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "image-studio",
  name: "Image Studio",
  version: "0.1.0",
  category: "AI & Multimedia",
  type: "tool",
  iconSymbol: "photo_filter",
  route: "/workspace/image-studio",
  description: "Dual-mode AI image upscaler and enhancement studio. Features free mathematical super-resolution (Real-ESRGAN) by default with optional generative 4K/8K Clarity upscaling."
};

