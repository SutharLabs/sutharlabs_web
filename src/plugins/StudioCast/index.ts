import { manifest } from "./manifest.js";
import StudioCastView from "./components/StudioCastView.js";
import { registerRoutes } from "./routes.js";

export const StudioCastPlugin = {
  manifest,
  View: StudioCastView,
  registerRoutes
};

export default StudioCastPlugin;

