import { StockTrackerPlugin } from "./StockTracker/index.js";
import { FlowDesignerPlugin } from "./FlowDesigner/index.js";
import { DocNexusPlugin } from "./DocNexus/index.js";
import { AccountingPlugin } from "./Accounting/index.js";
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
  return Object.values(CLIENT_PLUGIN_REGISTRY).find(p => p.manifest.name === name);
}

export * from "./types.js";
