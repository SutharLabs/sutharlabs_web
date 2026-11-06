export type PatternDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type PatternAction = 'BUY' | 'SELL' | 'WATCH_BREAKOUT';

export type PatternType =
  // Macro Geometric Formations
  | 'DOUBLE_BOTTOM'
  | 'DOUBLE_TOP'
  | 'INVERSE_HEAD_AND_SHOULDERS'
  | 'HEAD_AND_SHOULDERS'
  | 'ASCENDING_TRIANGLE'
  | 'DESCENDING_TRIANGLE'
  | 'SYMMETRICAL_TRIANGLE'
  | 'BULL_FLAG'
  | 'BEAR_FLAG'
  | 'FALLING_WEDGE'
  | 'RISING_WEDGE'
  // Micro Candlestick Triggers
  | 'HAMMER'
  | 'INVERTED_HAMMER'
  | 'BULLISH_ENGULFING'
  | 'BEARISH_ENGULFING'
  | 'MORNING_STAR'
  | 'EVENING_STAR';

export interface KeyPivotPoint {
  time: number;
  price: number;
  label: string; // e.g. "Head", "L_Shoulder", "R_Shoulder", "Trough_1", "Neckline", "Breakout"
}

export interface DetectedPattern {
  id: string;
  type: PatternType;
  name: string;
  direction: PatternDirection;
  action: PatternAction;
  confidence: number; // 0 - 100
  entryPrice: number;
  necklinePrice: number;
  targetPrice: number;
  stopLossPrice: number;
  riskRewardRatio: number;
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  keyPoints: KeyPivotPoint[];
  description: string;
  volumeConfirmed?: boolean;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SwingExtremum {
  index: number;
  time: number;
  price: number;
  type: 'HIGH' | 'LOW';
}

