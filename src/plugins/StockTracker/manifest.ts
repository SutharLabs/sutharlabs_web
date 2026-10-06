import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_stock_analyzer",
  name: "Stock Tracker",
  version: "1.0.0",
  category: "Finance",
  type: "Native",
  iconSymbol: "monitoring",
  route: "/workspace/stock-tracker",
  description: "Enterprise quantitative trading suite (v1.0.0 Production): interactive TradingView charts, drag-resizable split-pane workspace, multi-market global universes (India, US, Europe, Asia), pluggable algorithmic strategy engine (IStrategy), visual condition builder, real-time news & dual AI sentiment analysis, high-performance backtesting engine with localized friction modeling, Community Algorithm Marketplace with 1-click cloning & 5-star reviews, Global Multi-Market Screener & Scanner Hub, Autonomous End-of-Day (EOD) Batch Trade Simulator, and Discord/Telegram Webhook Alerts."
};

export default manifest;
