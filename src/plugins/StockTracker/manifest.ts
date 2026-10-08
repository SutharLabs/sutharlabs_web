import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_stock_analyzer",
  name: "Stock Tracker",
  version: "1.1.2",
  category: "Finance",
  type: "Native",
  iconSymbol: "monitoring",
  route: "/workspace/stock-tracker",
  description: "Enterprise multi-market quantitative trading suite featuring live TradingView charts, algorithmic strategies, visual condition builder, institutional backtesting, and automated trade simulation."
};

export default manifest;
