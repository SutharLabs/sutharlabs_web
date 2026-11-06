import { manifest } from "./manifest.js";
import ToolsStudioView from "./components/ToolsStudioView.js";

export const ToolsStudioPlugin = {
  manifest,
  View: ToolsStudioView
};

export { manifest, ToolsStudioView as View };
export default ToolsStudioPlugin;

