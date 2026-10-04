import React from "react";
import { TerminalLog } from "../types.js";

export interface WorkspacePluginManifest {
  id: string;
  name: string;
  version: string;
  category: string;
  type: string;
  iconSymbol: string;
  route: string;
  description: string;
}

export interface WorkspacePluginViewProps {
  logs?: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userEmail?: string;
  userToken: string;
  theme?: 'dark' | 'light';
}

export interface WorkspacePluginModule {
  manifest: WorkspacePluginManifest;
  registerRoutes?: (router: any) => void;
  View: React.ComponentType<WorkspacePluginViewProps>;
}
