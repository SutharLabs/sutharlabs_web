import { StrategySignal } from "../strategies/types.js";

export interface ScannerCandidate {
  symbol: string;
  name: string;
  cleanSymbol: string;
  displaySymbol: string;
  market: string;
  exchange: string;
  currency: string;
  currencySymbol: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  volume: number;
  avgVolume20d: number;
  volumeSpikeRatio: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0.0 to 1.0
  reason: string;
  rsi?: number;
  macdHistogram?: number;
  emaTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  stopLoss?: number;
  takeProfit?: number;
  riskRewardRatio?: number;
  scannedAt: string;
}

export interface ScannerFilterOptions {
  universeKey?: string;
  watchlistId?: string;
  customSymbols?: string[];
  strategyId?: string;
  timeframe?: string;
  signalFilter?: 'ALL' | 'BUY' | 'SELL' | 'HIGH_CONVICTION';
  minConfidence?: number;
  minVolumeSpike?: number;
  paramOverrides?: Record<string, any>;
}

export interface ScannerReport {
  id: string;
  strategyId: string;
  strategyName: string;
  universe: string;
  scannedAt: string;
  executionTimeMs: number;
  summary: {
    totalScanned: number;
    buyCount: number;
    sellCount: number;
    holdCount: number;
    highConvictionCount: number;
    topPick?: ScannerCandidate;
  };
  results: ScannerCandidate[];
}

export interface WebhookAlertPayload {
  alertType: 'SCANNER_SIGNAL' | 'EOD_TRADE_EXECUTION';
  symbol: string;
  companyName: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
  strategyName: string;
  timestamp: string;
}
