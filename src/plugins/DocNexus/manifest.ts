import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_doc_nexus",
  name: "Doc Nexus",
  version: "0.1.0",
  category: "Documentation",
  type: "Native",
  iconSymbol: "menu_book",
  route: "/workspace/docnexus",
  description: "Collaborative markdown documentation studio with live preview, syntax highlighting, sequence diagrams, and cloud persistence."
};

export default manifest;
