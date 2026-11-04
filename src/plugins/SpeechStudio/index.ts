import { manifest } from "./manifest.js";
import SpeechStudioView from "./components/SpeechStudioView.js";

export const SpeechStudioPlugin = {
  manifest,
  View: SpeechStudioView
};

export { manifest, SpeechStudioView, SpeechStudioView as View };
export default SpeechStudioPlugin;

