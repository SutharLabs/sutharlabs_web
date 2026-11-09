import { manifest } from "./manifest.js";
import MotionStudioView from "./components/MotionStudioView.js";

export const MotionStudioPlugin = {
  manifest,
  View: MotionStudioView
};

export default MotionStudioPlugin;

