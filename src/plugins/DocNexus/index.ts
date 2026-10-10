import { manifest } from "./manifest.js";
import DocNexusStudio from "./components/DocNexusStudio.js";

export const DocNexusPlugin = {
  manifest,
  View: DocNexusStudio
};

export { manifest, DocNexusStudio as View };
export default DocNexusPlugin;
