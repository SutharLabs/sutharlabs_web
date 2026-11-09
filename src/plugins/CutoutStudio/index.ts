import { manifest } from "./manifest.js";
import CutoutStudioView from "./components/CutoutStudioView.js";

export const CutoutStudioPlugin = {
  manifest,
  View: CutoutStudioView
};

export default CutoutStudioPlugin;

