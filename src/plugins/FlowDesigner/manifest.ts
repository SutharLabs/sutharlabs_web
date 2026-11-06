import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_flow_designer",
  name: "Workflow",
  version: "0.2.0",
  category: "Architecture",
  type: "Native",
  iconSymbol: "account_tree",
  route: "/workspace/flow",
  description: "Interactive visual workflow and automation studio for n8n-style multi-tool orchestration, LLM reasoning pipelines, HTTP triggers, and database actions."
};

export default manifest;
