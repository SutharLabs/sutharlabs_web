import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_flow_designer",
  name: "Custom Flow",
  version: "0.1.0",
  category: "Architecture",
  type: "Native",
  iconSymbol: "account_tree",
  route: "/workspace/flow",
  description: "Interactive visual node editor for architectural topologies, microservice workflows, and system graph design."
};

export default manifest;
