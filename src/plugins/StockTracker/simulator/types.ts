export interface EODPosition {
  id: string;
  symbol: string;
  name: string;
  market: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  highestPriceSinceEntry: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  entryDate: string;
  status: 'OPEN' | 'CLOSED';
}

export interface EODTradeExecution {
  id: string;
  type: 'BUY_ENTRY' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP_EXIT';
  symbol: string;
  companyName: string;
  shares: number;
  price: number;
  realizedPnL: number;
  realizedPnLPct: number;
  friction: number;
  reason: string;
  executedAt: string;
}

export interface EODTrailingStopUpdate {
  symbol: string;
  oldStop: number;
  newStop: number;
  highPrice: number;
}

export interface EODSimulationReport {
  id: string;
  simulatedDate: string;
  executionTimestamp: string;
  strategyId: string;
  strategyName: string;
  startingCapital: number;
  endingCapital: number;
  netDailyPnL: number;
  netDailyPnLPct: number;
  totalOpenPositions: number;
  totalTradesExecuted: number;
  closedPositions: EODTradeExecution[];
  openedPositions: EODTradeExecution[];
  updatedTrailingStops: EODTrailingStopUpdate[];
  activePositions: EODPosition[];
  digest: string;
}

export interface EODSimulationOptions {
  userEmail?: string;
  strategyId?: string;
  universeKey?: string;
  watchlistSymbols?: string[];
  allocationPct?: number; // default 15% (0.15)
  capitalAllocationPct?: number; // alias
  trailingStopPct?: number; // default 3.5%
  forcedCapital?: number;
}

export interface EODPortfolioStore {
  cash: number;
  initialCash: number;
  positions: EODPosition[];
  lastRunDate: string;
  totalRealizedPnL: number;
}

