import { manifest } from "./manifest.js";
import FlowDesignerView from "../../components/FlowDesignerView";

export const FlowDesignerPlugin = {
  manifest,
  View: FlowDesignerView
};

export { manifest, FlowDesignerView as View };
export default FlowDesignerPlugin;
