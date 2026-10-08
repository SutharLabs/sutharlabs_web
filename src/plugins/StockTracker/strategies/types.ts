export interface StrategyParameter {
  id: string;
  name: string;
  type: 'number' | 'select' | 'boolean';
  default: number | string | boolean;
  value?: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description: string;
}

export type StrategyIndicatorType =
  | 'rsi'
  | 'rsi_2'
  | 'macd'
  | 'macd_signal'
  | 'macd_hist'
  | 'ema_fast'
  | 'ema_slow'
  | 'ema_200'
  | 'price'
  | 'bb_upper'
  | 'bb_middle'
  | 'bb_lower'
  | 'supertrend'
  | 'volume'
  | 'volume_ma'
  | 'volume_ratio'
  | (string & {});

export interface StrategyRuleCondition {
  id?: string;
  indicator: StrategyIndicatorType;
  operator: '>' | '<' | '>=' | '<=' | 'crosses_above' | 'crosses_below' | '==' | 'between';
  value: number | string;
  secondaryValue?: number;
}

export interface StrategySignal {
  strategyId: string;
  strategyName: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0.0 to 1.0
  entryPrice?: number;
  targetPrice?: number | null;
  stopLoss?: number | null;
  riskRewardRatio?: number | null;
  timestamp: string;
  reasoning: string[];
  metrics?: Record<string, number | string | boolean | undefined>;
  sentimentConfluence?: {
    originalSignal: 'BUY' | 'SELL' | 'HOLD';
    originalConfidence: number;
    finalSignal: 'BUY' | 'SELL' | 'HOLD';
    finalConfidence: number;
    sentimentScore: number;
    sentimentVerdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confluenceEffect: 'BOOST' | 'PENALTY' | 'CIRCUIT_BREAKER' | 'NEUTRAL';
    explanation: string;
  };
  sentimentReport?: {
    score: number;
    verdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    catalystSummary: string;
    primaryCatalyst: string;
    circuitBreakerRecommended: boolean;
    analyzedBy: 'GEMINI_AI' | 'AUTONOMOUS_RULE_ENGINE';
  };
}

export interface StrategyReview {
  id: string;
  strategyId: string;
  userEmail: string;
  userName: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
}

export interface VerifiedBacktestBadge {
  verifiedAt: string;
  symbol: string;
  range: string;
  netReturnPct: number;
  annualizedCagr: number;
  sharpeRatio: number;
  winRatePct: number;
  maxDrawdownPct: number;
  totalTrades: number;
  profitFactor: number;
  verifiedBy: string;
}

export interface IStrategy {
  id: string;
  name: string;
  description: string;
  authorEmail?: string;
  authorName?: string;
  version: string;
  isPreset: boolean;
  isPublic: boolean;
  tags?: string[];
  clonesCount?: number;
  rating?: number;
  reviewsCount?: number;
  reviews?: StrategyReview[];
  verifiedBadge?: VerifiedBacktestBadge;
  forkedFrom?: {
    id: string;
    name: string;
    authorName?: string;
  };
  market: 'IN' | 'US' | 'BOTH' | 'GLOBAL';
  timeframe: '5m' | '15m' | '1h' | '1D';
  parameters: StrategyParameter[];
  rules: {
    indicators: Record<string, { type: string; params: Record<string, any> }>;
    entryConditions: StrategyRuleCondition[];
    exitConditions: StrategyRuleCondition[];
  };
  createdAt: string;
  updatedAt: string;
}
