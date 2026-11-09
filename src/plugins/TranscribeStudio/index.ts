import { manifest } from "./manifest.js";
import TranscribeStudioView from "./components/TranscribeStudioView.js";

export const TranscribeStudioPlugin = {
  manifest,
  View: TranscribeStudioView
};

export default TranscribeStudioPlugin;

