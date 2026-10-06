import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_stock_analyzer",
  name: "Stock Tracker",
  version: "0.6.0",
  category: "Finance",
  type: "Native",
  iconSymbol: "monitoring",
  route: "/workspace/stock-tracker",
  description: "Professional quantitative trading suite: interactive TradingView charts, drag-resizable split-pane workspace, multi-market global universes (India, US, Europe, Asia), pluggable algorithmic strategy engine (IStrategy), visual condition builder, real-time news & dual AI sentiment analysis, high-performance backtesting engine with localized friction modeling, and Stage 5 Community Algorithm Marketplace with 1-click cloning/forking, interactive 5-star reviews, and verified performance proofs."
};

export default manifest;
