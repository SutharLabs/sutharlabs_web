import { manifest } from "./manifest.js";
import DocNexusView from "../../components/DocNexusView";

export const DocNexusPlugin = {
  manifest,
  View: DocNexusView
};

export { manifest, DocNexusView as View };
export default DocNexusPlugin;
