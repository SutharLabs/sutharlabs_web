import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_stock_analyzer",
  name: "Stock Tracker",
  version: "0.3.0",
  category: "Finance",
  type: "Native",
  iconSymbol: "monitoring",
  route: "/workspace/stock-tracker",
  description: "Professional quantitative trading suite: interactive TradingView charts, multi-market global universes (India, US, Europe, Asia), pluggable algorithmic strategy engine (IStrategy), 4 battle-tested quant presets, and visual condition builder."
};

export default manifest;

