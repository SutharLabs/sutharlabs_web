import { manifest } from "./manifest.js";
import MockupStudioView from "./components/MockupStudioView.js";

export const MockupStudioPlugin = {
  manifest,
  View: MockupStudioView
};

export default MockupStudioPlugin;

