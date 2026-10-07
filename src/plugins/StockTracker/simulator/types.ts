export interface EODPosition {
  id: string;
  symbol: string;
  name: string;
  market: string;
  currency?: string;
  currencySymbol?: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  highestPriceSinceEntry: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  entryDate: string; // 'YYYY-MM-DD'
  entryTimestamp: string; // ISO string 'YYYY-MM-DDTHH:mm:ss.sssZ'
  totalCost?: number;
  currentValue?: number;
  daysHeld?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface EODTradeExecution {
  id: string;
  type: 'BUY_ENTRY' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP_EXIT' | 'MANUAL_CLOSE';
  symbol: string;
  companyName: string;
  shares: number;
  price: number;
  entryPrice?: number;
  entryDate?: string;
  entryTimestamp?: string;
  exitPrice?: number;
  exitDate?: string;
  exitTimestamp?: string;
  holdingDays?: number;
  currency?: string;
  currencySymbol?: string;
  realizedPnL: number;
  realizedPnLPct: number;
  friction: number;
  reason: string;
  executedAt: string; // ISO string
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
  replayMode?: 'SINGLE_STEP' | 'HISTORICAL_REPLAY';
  replayedDaysCount?: number;
}

export interface EODSimulationOptions {
  userEmail?: string;
  strategyId?: string;
  universeKey?: string;
  market?: string;
  marketRegion?: string;
  watchlistSymbols?: string[];
  allocationPct?: number; // e.g. 0.15 (15%)
  capitalAllocationPct?: number; // alias
  trailingStopPct?: number; // default 3.0%
  forcedCapital?: number;
  mode?: 'SINGLE_STEP' | 'HISTORICAL_REPLAY';
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
  replayDays?: number; // e.g. 30, 60, 90, 180
}

export interface EODPortfolioStore {
  cash: number;
  initialCash: number;
  positions: EODPosition[];
  closedTrades?: EODTradeExecution[];
  lastRunDate?: string;
  totalRealizedPnL: number;
  totalFrictionPaid?: number;
  winCount?: number;
  lossCount?: number;
  lastUpdated?: string;
}
