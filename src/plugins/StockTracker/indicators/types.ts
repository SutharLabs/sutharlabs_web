import type { UTCTimestamp } from 'lightweight-charts';

export type IndicatorCategory = 'overlay' | 'oscillator';

export type IndicatorType =
  | 'EMA'
  | 'SMA'
  | 'WMA'
  | 'VWAP'
  | 'BOLLINGER'
  | 'SUPERTREND'
  | 'PSAR'
  | 'DONCHIAN'
  | 'KELTNER'
  | 'RSI'
  | 'MACD'
  | 'STOCHASTIC'
  | 'ATR'
  | 'ADX'
  | 'CCI'
  | 'WILLIAMS_R'
  | 'OBV'
  | 'VOLUME';

export interface ParamFieldDef {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
  default: any;
}

export interface IndicatorDefinition {
  type: IndicatorType;
  name: string;
  shortCode: string;
  category: IndicatorCategory;
  description: string;
  defaultColor: string;
  defaultColor2?: string;
  defaultColor3?: string;
  defaultParams: Record<string, any>;
  paramFields: ParamFieldDef[];
}

export interface IndicatorInstance {
  id: string;
  type: IndicatorType;
  name: string;
  category: IndicatorCategory;
  visible: boolean;
  color: string;
  color2?: string;
  color3?: string;
  lineWidth: number;
  params: Record<string, any>;
}

export interface IndicatorDataPoint {
  time: UTCTimestamp;
  value: number;
  color?: string;
}

export interface MultiSeriesIndicatorData {
  primary: IndicatorDataPoint[];
  secondary?: IndicatorDataPoint[];
  tertiary?: IndicatorDataPoint[];
  histogram?: IndicatorDataPoint[];
}
