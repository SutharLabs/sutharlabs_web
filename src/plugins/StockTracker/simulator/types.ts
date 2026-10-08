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
  atr?: number;
  potentialSplitDetected?: boolean;
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
  simulationId: string;          // which simulation instance produced this report
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
  hadTrades: boolean;             // true = trades occurred; false = no-trade portfolio update
  isHoliday?: boolean;
  holidayName?: string;
  marketSessionType?: string;
  calmarRatio?: number;
  winRatePct?: number;
  profitFactor?: number;
}

export interface EODSimulationOptions {
  simulationId?: string;         // unique id for this simulation instance (default: "default")
  simulationLabel?: string;      // human-readable name shown in the UI
  userEmail?: string;
  strategyId?: string;
  universeKey?: string;
  market?: string;
  marketRegion?: string;
  watchlistSymbols?: string[];
  allocationPct?: number; // e.g. 0.15 (15%)
  capitalAllocationPct?: number; // alias
  positionSizingModel?: 'CASH_PERCENT' | 'EQUITY_PERCENT' | 'RISK_BASED';
  riskPerTradePct?: number; // e.g. 1.0% or 1.5%
  maxConcurrentPositions?: number; // e.g. 5 or 10
  trailingStopPct?: number; // default 3.0%
  forcedCapital?: number;
  mode?: 'SINGLE_STEP' | 'HISTORICAL_REPLAY';
  timeframe?: '1m' | '5m' | '15m' | '1h' | '1d'; // candle interval
  interval?: '1m' | '5m' | '15m' | '1h' | '1d';  // alias
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
  replayDays?: number; // e.g. 30, 60, 90, 180
  allowAfterHours?: boolean;
}

/** Registry entry tracking every active simulation instance. */
export interface SimulationRegistryEntry {
  id: string;                    // simulationId key
  label: string;                 // human-readable name
  strategyId?: string;
  strategyName?: string;
  market?: string;
  initialCash?: number;
  createdAt: string;             // ISO timestamp
  lastRunAt?: string;            // ISO timestamp of most recent run
  lastTradeAt?: string;          // ISO timestamp of most recent run with actual trades
  totalRuns: number;
  totalTradeRuns: number;        // runs that produced at least one trade
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
