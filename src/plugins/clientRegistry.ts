import { StockTrackerPlugin } from "./StockTracker/index.js";
import { FlowDesignerPlugin } from "./FlowDesigner/index.js";
import { DocNexusPlugin } from "./DocNexus/index.js";
import { AccountingPlugin } from "./Accounting/index.js";
import { SpeechStudioPlugin } from "./SpeechStudio/index.js";
import { ImageStudioPlugin } from "./ImageStudio/index.js";
import { ToolsStudioPlugin } from "./SovereignTools/index.js";
import { ResumeStudioPlugin } from "./ResumeStudio/index.js";
import { StudioCastPlugin } from "./StudioCast/index.js";
import { MotionStudioPlugin } from "./MotionStudio/index.js";
import { TranscribeStudioPlugin } from "./TranscribeStudio/index.js";
import { CutoutStudioPlugin } from "./CutoutStudio/index.js";
import { MockupStudioPlugin } from "./MockupStudio/index.js";
import { WorkspacePluginManifest, WorkspacePluginViewProps } from "./types.js";
import React from "react";

export interface ClientPluginEntry {
  manifest: WorkspacePluginManifest;
  View: React.ComponentType<WorkspacePluginViewProps>;
}

export const CLIENT_PLUGIN_REGISTRY: Record<string, ClientPluginEntry> = {
  [StockTrackerPlugin.manifest.id]: StockTrackerPlugin as any,
  [FlowDesignerPlugin.manifest.id]: FlowDesignerPlugin as any,
  [DocNexusPlugin.manifest.id]: DocNexusPlugin as any,
  [AccountingPlugin.manifest.id]: AccountingPlugin as any,
  [SpeechStudioPlugin.manifest.id]: SpeechStudioPlugin as any,
  [ImageStudioPlugin.manifest.id]: ImageStudioPlugin as any,
  [ToolsStudioPlugin.manifest.id]: ToolsStudioPlugin as any,
  [ResumeStudioPlugin.manifest.id]: ResumeStudioPlugin as any,
  [StudioCastPlugin.manifest.id]: StudioCastPlugin as any,
  [MotionStudioPlugin.manifest.id]: MotionStudioPlugin as any,
  [TranscribeStudioPlugin.manifest.id]: TranscribeStudioPlugin as any,
  [CutoutStudioPlugin.manifest.id]: CutoutStudioPlugin as any,
  [MockupStudioPlugin.manifest.id]: MockupStudioPlugin as any,
};

export function getAllClientPlugins(): ClientPluginEntry[] {
  return Object.values(CLIENT_PLUGIN_REGISTRY);
}

export function getClientPluginById(id: string): ClientPluginEntry | undefined {
  return CLIENT_PLUGIN_REGISTRY[id];
}

export function getClientPluginByRoute(route: string): ClientPluginEntry | undefined {
  return Object.values(CLIENT_PLUGIN_REGISTRY).find(p => p.manifest.route === route);
}

export function getClientPluginByName(name: string): ClientPluginEntry | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  return Object.values(CLIENT_PLUGIN_REGISTRY).find(p => {
    const pName = p.manifest.name.toLowerCase();
    const pId = p.manifest.id.toLowerCase();
    return pName === lower || 
           pId === lower || 
           pName.startsWith(lower) || 
           lower.startsWith(pName) ||
           (lower.includes('image') && pId === 'image-studio');
  });
}

export * from "./types.js";
