import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_resume_studio",
  name: "Resume Studio",
  version: "1.0.0",
  category: "Productivity & Career",
  type: "Native",
  description: "Enterprise sovereign Resume & CV Studio supporting multi-format ingestion (DOCX Word, PDF, LaTeX, Markdown, Text, JSON) and 4-format vector export (PDF, Word DOCX, LaTeX .tex, Plain Text, JSON). Zero server uploads, 100% private.",
  iconSymbol: "description",
  route: "/workspace/resume"
};

