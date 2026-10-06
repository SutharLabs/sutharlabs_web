import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_stock_analyzer",
  name: "Stock Tracker",
  version: "0.5.0",
  category: "Finance",
  type: "Native",
  iconSymbol: "monitoring",
  route: "/workspace/stock-tracker",
  description: "Professional quantitative trading suite: interactive TradingView charts, drag-resizable split-pane workspace, multi-market global universes (India, US, Europe, Asia), pluggable algorithmic strategy engine (IStrategy), visual condition builder, real-time news & dual AI sentiment analysis, and high-performance quantitative backtesting engine with localized friction & statutory tax modeling (STT, SEC, GST, SDRT, slippage)."
};

export default manifest;

