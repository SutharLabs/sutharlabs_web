import { IStrategy, StrategyRuleCondition } from '../strategies/types.js';

export type MarketRegion = 'IN' | 'US' | 'UK' | 'EU' | 'CN' | 'HK' | 'JP';

export interface FrictionBreakdown {
  region: MarketRegion;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  grossAmount: number;
  brokerage: number;
  sttOrStampDuty: number;
  exchangeTurnover: number;
  sebiOrSecFee: number;
  gstOrVat: number;
  slippage: number;
  totalFriction: number;
  netAmount: number;
  effectiveRatePct: number;
  currencySymbol: string;
  notes: string[];
}

export type ExecutionFillModel = 'NEXT_BAR_OPEN' | 'SAME_BAR_CLOSE';
export type PositionSizingModel = 'CASH_PERCENT' | 'EQUITY_PERCENT' | 'RISK_BASED' | 'VOLATILITY_ADJUSTED';

export interface BacktestRequest {
  strategyId: string;
  customStrategy?: Partial<IStrategy>;
  customRules?: {
    entryConditions?: StrategyRuleCondition[];
    exitConditions?: StrategyRuleCondition[];
  };
  parameterOverrides?: Record<string, number | string | boolean>;
  symbol: string;
  marketRegion?: MarketRegion;
  timeframe?: '1d' | '1wk' | '1h';
  range?: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max';
  startDate?: string;
  endDate?: string;
  initialCapital?: number;
  includeFriction?: boolean;
  slippagePct?: number;
  positionSizingPct?: number; // e.g. 95% of equity per position
  positionSizingModel?: PositionSizingModel; // 'CASH_PERCENT' | 'EQUITY_PERCENT' | 'RISK_BASED'
  riskPerTradePct?: number;    // e.g. 1.0% of portfolio equity risked at stop loss
  executionFillModel?: ExecutionFillModel; // 'NEXT_BAR_OPEN' (Standard) | 'SAME_BAR_CLOSE'
  stopLossPct?: number;       // e.g. 5% override
  takeProfitPct?: number;     // e.g. 15% override
  riskFreeRatePct?: number;   // e.g. 6.5% for IN, 4.5% for US
}

export interface TradeLog {
  id: string;
  tradeNumber: number;
  symbol: string;
  side: 'BUY';
  entryDate: string;
  entryTime: number;
  entryPrice: number;
  entryReason: string;
  exitDate: string;
  exitTime: number;
  exitPrice: number;
  exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'SIGNAL_EXIT' | 'TRAILING_STOP' | 'END_OF_DATA';
  quantity: number;
  holdingDays: number;
  grossPnL: number;
  grossPnLPct: number;
  entryFriction: number;
  exitFriction: number;
  totalFriction: number;
  netPnL: number;
  netPnLPct: number;
  isWinner: boolean;
  cumulativeCapital: number;
}

export interface BacktestEquityPoint {
  date: string;
  time: number;
  equity: number;
  cash: number;
  drawdownPct: number;
  benchmarkPrice: number;
  benchmarkEquity: number;
  inPosition: boolean;
}

export interface BacktestMetrics {
  initialCapital: number;
  finalCapital: number;
  netProfit: number;
  netProfitPct: number;
  benchmarkReturnPct: number;
  alphaPct: number;
  cagrPct: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  kellyCriterionPct: number;
  var95Pct: number;
  cvar95Pct: number;
  winLossRatio: number;
  recoveryFactor: number;
  maxDrawdownPct: number;
  maxDrawdownDurationDays: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  profitFactor: number;
  avgTradePnLPct: number;
  avgWinPnLPct: number;
  avgLossPnLPct: number;
  riskRewardRatio: number;
  totalFrictionPaid: number;
  totalBrokeragePaid: number;
  totalTaxesPaid: number;
  totalSlippagePaid: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  exposureTimePct: number;
}

export interface BacktestReport {
  id: string;
  strategyId: string;
  strategyName: string;
  strategyDescription?: string;
  symbol: string;
  marketRegion: MarketRegion;
  currencySymbol: string;
  currencyCode: string;
  range: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  totalBars: number;
  metrics: BacktestMetrics;
  equityCurve: BacktestEquityPoint[];
  trades: TradeLog[];
  frictionSettings: {
    region: MarketRegion;
    includeFriction: boolean;
    slippagePct: number;
    tPlus1RuleApplied: boolean;
    executionFillModel: ExecutionFillModel;
  };
  generatedAt: string;
}
