import { manifest } from "./manifest.js";
import SpeechStudioView from "./components/SpeechStudioView.js";
import { registerRoutes } from "./routes.js";
import { WorkspacePluginModule } from "../types.js";

export const SpeechStudioPlugin: WorkspacePluginModule = {
  manifest,
  registerRoutes,
  View: SpeechStudioView
};

export { manifest, SpeechStudioView, registerRoutes };

