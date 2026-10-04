import { manifest } from "./manifest.js";
import StockTrackerView from "../../components/StockTrackerView";

export const StockTrackerPlugin = {
  manifest,
  View: StockTrackerView
};

export { manifest, StockTrackerView as View };
export default StockTrackerPlugin;
