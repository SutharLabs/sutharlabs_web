import { manifest } from "./manifest.js";
import ResumeStudioView from "./components/ResumeStudioView.js";

export const ResumeStudioPlugin = {
  manifest,
  View: ResumeStudioView
};

export { manifest, ResumeStudioView as View };
export default ResumeStudioPlugin;
