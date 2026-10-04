import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_stock_analyzer",
  name: "Stock Tracker",
  version: "0.1.0",
  category: "Finance",
  type: "Native",
  iconSymbol: "monitoring",
  route: "/workspace/stock-tracker",
  description: "Real-time market analytics, Yahoo Finance quote streaming, historical candlestick charting, and algorithmic technical indicators (RSI, MACD, Bollinger Bands)."
};

export default manifest;
