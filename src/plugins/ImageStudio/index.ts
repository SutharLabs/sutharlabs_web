import { manifest } from "./manifest.js";
import ImageStudioView from "./components/ImageStudioView.js";

export const ImageStudioPlugin = {
  manifest,
  View: ImageStudioView
};

export { manifest, ImageStudioView, ImageStudioView as View };
export default ImageStudioPlugin;

