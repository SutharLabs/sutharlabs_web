import type { UTCTimestamp } from 'lightweight-charts';
import {
  SMA,
  EMA,
  WMA,
  BollingerBands,
  PSAR,
  RSI,
  MACD,
  Stochastic,
  ATR,
  ADX,
  CCI,
  WilliamsR,
  OBV
} from 'technicalindicators';
import type {
  IndicatorDefinition,
  IndicatorInstance,
  IndicatorType,
  MultiSeriesIndicatorData,
  IndicatorDataPoint
} from './types.js';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const INDICATOR_DEFINITIONS: IndicatorDefinition[] = [
  // ── Overlays (Price Scale) ────────────────────────────────────────────────
  {
    type: 'EMA',
    name: 'Exponential Moving Average',
    shortCode: 'EMA',
    category: 'overlay',
    description: 'Exponentially weighted moving average giving more weight to recent prices for responsive trend following.',
    defaultColor: '#00dbe7',
    defaultParams: { period: 20 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 1, max: 500, step: 1, default: 20 }
    ]
  },
  {
    type: 'SMA',
    name: 'Simple Moving Average',
    shortCode: 'SMA',
    category: 'overlay',
    description: 'Arithmetic mean of closing prices over a specified lookback period to smooth out market noise.',
    defaultColor: '#3b82f6',
    defaultParams: { period: 50 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 1, max: 500, step: 1, default: 50 }
    ]
  },
  {
    type: 'WMA',
    name: 'Weighted Moving Average',
    shortCode: 'WMA',
    category: 'overlay',
    description: 'Linearly weighted moving average emphasizing newest price action more than an SMA.',
    defaultColor: '#a855f7',
    defaultParams: { period: 20 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 1, max: 500, step: 1, default: 20 }
    ]
  },
  {
    type: 'VWAP',
    name: 'Volume Weighted Average Price',
    shortCode: 'VWAP',
    category: 'overlay',
    description: 'Institutional benchmark showing the ratio of value traded to total volume traded.',
    defaultColor: '#f97316',
    defaultParams: {},
    paramFields: []
  },
  {
    type: 'BOLLINGER',
    name: 'Bollinger Bands',
    shortCode: 'BB',
    category: 'overlay',
    description: 'Volatility envelope plotting Upper, Middle (SMA), and Lower bands at standard deviation multiples.',
    defaultColor: '#06b6d4', // Upper
    defaultColor2: '#ef4444', // Lower
    defaultColor3: '#f59e0b', // Middle
    defaultParams: { period: 20, stdDev: 2 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 2, max: 200, step: 1, default: 20 },
      { key: 'stdDev', label: 'StdDev Multiplier', type: 'number', min: 0.5, max: 5, step: 0.1, default: 2 }
    ]
  },
  {
    type: 'SUPERTREND',
    name: 'Supertrend Trend Following',
    shortCode: 'SUPERTREND',
    category: 'overlay',
    description: 'Dynamic ATR volatility stop-and-reverse band indicating bull (green) and bear (red) regimes.',
    defaultColor: '#00e476', // Bull
    defaultColor2: '#ef4444', // Bear
    defaultParams: { period: 10, multiplier: 3 },
    paramFields: [
      { key: 'period', label: 'ATR Period', type: 'number', min: 2, max: 100, step: 1, default: 10 },
      { key: 'multiplier', label: 'Multiplier', type: 'number', min: 0.5, max: 10, step: 0.1, default: 3 }
    ]
  },
  {
    type: 'PSAR',
    name: 'Parabolic SAR',
    shortCode: 'SAR',
    category: 'overlay',
    description: 'Price and time trailing stop system highlighting directional bias and trailing reversal points.',
    defaultColor: '#eab308',
    defaultParams: { step: 0.02, max: 0.2 },
    paramFields: [
      { key: 'step', label: 'Acceleration Step', type: 'number', min: 0.005, max: 0.1, step: 0.005, default: 0.02 },
      { key: 'max', label: 'Maximum Acceleration', type: 'number', min: 0.05, max: 0.5, step: 0.01, default: 0.2 }
    ]
  },
  {
    type: 'DONCHIAN',
    name: 'Donchian Channels',
    shortCode: 'DC',
    category: 'overlay',
    description: 'High-Low breakout channel formed by the highest high and lowest low of the past N bars.',
    defaultColor: '#6366f1',
    defaultColor2: '#a855f7',
    defaultColor3: '#818cf8',
    defaultParams: { period: 20 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 5, max: 200, step: 1, default: 20 }
    ]
  },
  {
    type: 'KELTNER',
    name: 'Keltner Channels',
    shortCode: 'KC',
    category: 'overlay',
    description: 'Volatility-based envelopes set above and below an exponential moving average via Average True Range.',
    defaultColor: '#10b981',
    defaultColor2: '#f43f5e',
    defaultColor3: '#14b8a6',
    defaultParams: { period: 20, multiplier: 2 },
    paramFields: [
      { key: 'period', label: 'EMA Period', type: 'number', min: 5, max: 200, step: 1, default: 20 },
      { key: 'multiplier', label: 'ATR Multiplier', type: 'number', min: 0.5, max: 5, step: 0.1, default: 2 }
    ]
  },

  // ── Oscillators & Volume (Sub-Pane Scales) ─────────────────────────────────
  {
    type: 'RSI',
    name: 'Relative Strength Index',
    shortCode: 'RSI',
    category: 'oscillator',
    description: 'Momentum oscillator measuring the speed and change of price movements between 0 and 100.',
    defaultColor: '#ec4899',
    defaultParams: { period: 14, overbought: 70, oversold: 30 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 2, max: 100, step: 1, default: 14 },
      { key: 'overbought', label: 'Overbought Level', type: 'number', min: 50, max: 95, step: 1, default: 70 },
      { key: 'oversold', label: 'Oversold Level', type: 'number', min: 5, max: 50, step: 1, default: 30 }
    ]
  },
  {
    type: 'MACD',
    name: 'Moving Average Convergence Divergence',
    shortCode: 'MACD',
    category: 'oscillator',
    description: 'Trend-following momentum indicator showing the relationship between two exponential moving averages.',
    defaultColor: '#00dbe7', // MACD line
    defaultColor2: '#f59e0b', // Signal line
    defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    paramFields: [
      { key: 'fastPeriod', label: 'Fast Length', type: 'number', min: 2, max: 100, step: 1, default: 12 },
      { key: 'slowPeriod', label: 'Slow Length', type: 'number', min: 5, max: 200, step: 1, default: 26 },
      { key: 'signalPeriod', label: 'Signal Smoothing', type: 'number', min: 1, max: 50, step: 1, default: 9 }
    ]
  },
  {
    type: 'STOCHASTIC',
    name: 'Stochastic Oscillator',
    shortCode: 'STOCH',
    category: 'oscillator',
    description: 'Compares a particular closing price to a range of its prices over a certain period of time (%K and %D).',
    defaultColor: '#06b6d4', // %K
    defaultColor2: '#f43f5e', // %D
    defaultParams: { period: 14, signalPeriod: 3 },
    paramFields: [
      { key: 'period', label: '%K Period', type: 'number', min: 3, max: 100, step: 1, default: 14 },
      { key: 'signalPeriod', label: '%D Smoothing', type: 'number', min: 1, max: 50, step: 1, default: 3 }
    ]
  },
  {
    type: 'ATR',
    name: 'Average True Range',
    shortCode: 'ATR',
    category: 'oscillator',
    description: 'Technical analysis volatility indicator measuring market volatility by decomposing the entire range of an asset price.',
    defaultColor: '#8b5cf6',
    defaultParams: { period: 14 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 2, max: 100, step: 1, default: 14 }
    ]
  },
  {
    type: 'ADX',
    name: 'Average Directional Index',
    shortCode: 'ADX',
    category: 'oscillator',
    description: 'Quantifies trend strength regardless of trend direction. Values above 25 indicate a strong trend.',
    defaultColor: '#14b8a6',
    defaultParams: { period: 14 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 2, max: 100, step: 1, default: 14 }
    ]
  },
  {
    type: 'CCI',
    name: 'Commodity Channel Index',
    shortCode: 'CCI',
    category: 'oscillator',
    description: 'Versatile momentum-based oscillator assessing directional strength and overbought/oversold extremes.',
    defaultColor: '#eab308',
    defaultParams: { period: 20 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 5, max: 100, step: 1, default: 20 }
    ]
  },
  {
    type: 'WILLIAMS_R',
    name: 'Williams %R',
    shortCode: '%R',
    category: 'oscillator',
    description: 'Momentum indicator that moves between 0 and -100 and measures overbought and oversold levels.',
    defaultColor: '#38bdf8',
    defaultParams: { period: 14 },
    paramFields: [
      { key: 'period', label: 'Period (Length)', type: 'number', min: 3, max: 100, step: 1, default: 14 }
    ]
  },
  {
    type: 'OBV',
    name: 'On-Balance Volume',
    shortCode: 'OBV',
    category: 'oscillator',
    description: 'Cumulative volume momentum indicator relating volume flow to price changes to predict institutional moves.',
    defaultColor: '#10b981',
    defaultParams: {},
    paramFields: []
  },
  {
    type: 'VOLUME',
    name: 'Volume Histogram',
    shortCode: 'VOL',
    category: 'oscillator',
    description: 'Shows trading volume per bar with bull (green) and bear (red) session color coding.',
    defaultColor: 'rgba(0, 228, 118, 0.4)',
    defaultColor2: 'rgba(255, 107, 107, 0.4)',
    defaultParams: {},
    paramFields: []
  }
];

export function getIndicatorDefinition(type: IndicatorType): IndicatorDefinition | undefined {
  return INDICATOR_DEFINITIONS.find(d => d.type === type);
}

export function createIndicatorInstance(type: IndicatorType, overrides: Partial<IndicatorInstance> = {}): IndicatorInstance {
  const def = getIndicatorDefinition(type);
  if (!def) {
    throw new Error(`Unknown indicator type: ${type}`);
  }
  const id = overrides.id || `${type.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    type,
    name: def.name,
    category: def.category,
    visible: true,
    color: overrides.color || def.defaultColor,
    color2: overrides.color2 || def.defaultColor2,
    color3: overrides.color3 || def.defaultColor3,
    lineWidth: overrides.lineWidth ?? 2,
    params: { ...def.defaultParams, ...(overrides.params || {}) },
    ...overrides
  };
}

// ── Supertrend Implementation ────────────────────────────────────────────────
function calculateSupertrend(candles: Candle[], period: number, multiplier: number): MultiSeriesIndicatorData {
  if (candles.length < period + 1) return { primary: [] };

  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);

  const atrValues = ATR.calculate({ period, high: highs, low: lows, close: closes });
  const offset = candles.length - atrValues.length;

  const points: IndicatorDataPoint[] = [];
  let prevUpper = 0;
  let prevLower = 0;
  let prevTrend = 1; // 1 for bull, -1 for bear

  for (let i = 0; i < atrValues.length; i++) {
    const candleIdx = i + offset;
    const c = candles[candleIdx];
    const prevC = candles[candleIdx - 1] || c;
    const atr = atrValues[i];

    const basicUpper = (c.high + c.low) / 2 + multiplier * atr;
    const basicLower = (c.high + c.low) / 2 - multiplier * atr;

    let finalUpper = basicUpper;
    if (i > 0 && (basicUpper < prevUpper || prevC.close > prevUpper)) {
      finalUpper = basicUpper;
    } else if (i > 0) {
      finalUpper = prevUpper;
    }

    let finalLower = basicLower;
    if (i > 0 && (basicLower > prevLower || prevC.close < prevLower)) {
      finalLower = basicLower;
    } else if (i > 0) {
      finalLower = prevLower;
    }

    let trend = prevTrend;
    if (prevTrend === -1 && c.close > prevUpper) {
      trend = 1;
    } else if (prevTrend === 1 && c.close < prevLower) {
      trend = -1;
    }

    const stVal = trend === 1 ? finalLower : finalUpper;
    const color = trend === 1 ? '#00e476' : '#ef4444';

    points.push({
      time: c.time as UTCTimestamp,
      value: Number(stVal.toFixed(2)),
      color
    });

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevTrend = trend;
  }

  return { primary: points };
}

// ── VWAP Implementation ──────────────────────────────────────────────────────
function calculateVWAP(candles: Candle[]): IndicatorDataPoint[] {
  if (candles.length === 0) return [];
  const points: IndicatorDataPoint[] = [];
  let cumTypicalVol = 0;
  let cumVol = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 1;

    cumTypicalVol += typicalPrice * vol;
    cumVol += vol;

    const vwap = cumVol > 0 ? cumTypicalVol / cumVol : typicalPrice;
    points.push({
      time: c.time as UTCTimestamp,
      value: Number(vwap.toFixed(2))
    });
  }
  return points;
}

// ── Donchian Channels ────────────────────────────────────────────────────────
function calculateDonchian(candles: Candle[], period: number): MultiSeriesIndicatorData {
  if (candles.length < period) return { primary: [], secondary: [], tertiary: [] };

  const upper: IndicatorDataPoint[] = [];
  const lower: IndicatorDataPoint[] = [];
  const middle: IndicatorDataPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > highest) highest = candles[j].high;
      if (candles[j].low < lowest) lowest = candles[j].low;
    }
    const time = candles[i].time as UTCTimestamp;
    const mid = (highest + lowest) / 2;

    upper.push({ time, value: Number(highest.toFixed(2)) });
    lower.push({ time, value: Number(lowest.toFixed(2)) });
    middle.push({ time, value: Number(mid.toFixed(2)) });
  }

  return { primary: upper, secondary: lower, tertiary: middle };
}

// ── Keltner Channels ─────────────────────────────────────────────────────────
function calculateKeltner(candles: Candle[], period: number, multiplier: number): MultiSeriesIndicatorData {
  if (candles.length < period + 2) return { primary: [], secondary: [], tertiary: [] };

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  const emaVals = EMA.calculate({ period, values: closes });
  const atrVals = ATR.calculate({ period: 10, high: highs, low: lows, close: closes });

  const emaOffset = candles.length - emaVals.length;
  const atrOffset = candles.length - atrVals.length;
  const startIdx = Math.max(emaOffset, atrOffset);

  const upper: IndicatorDataPoint[] = [];
  const lower: IndicatorDataPoint[] = [];
  const middle: IndicatorDataPoint[] = [];

  for (let i = startIdx; i < candles.length; i++) {
    const ema = emaVals[i - emaOffset];
    const atr = atrVals[i - atrOffset];
    const time = candles[i].time as UTCTimestamp;

    middle.push({ time, value: Number(ema.toFixed(2)) });
    upper.push({ time, value: Number((ema + multiplier * atr).toFixed(2)) });
    lower.push({ time, value: Number((ema - multiplier * atr).toFixed(2)) });
  }

  return { primary: upper, secondary: lower, tertiary: middle };
}

// ── Main Calculation Dispatcher ──────────────────────────────────────────────
export function calculateIndicatorData(instance: IndicatorInstance, candles: Candle[]): MultiSeriesIndicatorData {
  if (!candles || candles.length < 2) {
    return { primary: [] };
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  try {
    switch (instance.type) {
      case 'EMA': {
        const period = Number(instance.params.period) || 20;
        const vals = EMA.calculate({ period, values: closes });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.toFixed(2))
        }));
        return { primary };
      }

      case 'SMA': {
        const period = Number(instance.params.period) || 50;
        const vals = SMA.calculate({ period, values: closes });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.toFixed(2))
        }));
        return { primary };
      }

      case 'WMA': {
        const period = Number(instance.params.period) || 20;
        const vals = WMA.calculate({ period, values: closes });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.toFixed(2))
        }));
        return { primary };
      }

      case 'VWAP': {
        const primary = calculateVWAP(candles);
        return { primary };
      }

      case 'BOLLINGER': {
        const period = Number(instance.params.period) || 20;
        const stdDev = Number(instance.params.stdDev) || 2;
        const vals = BollingerBands.calculate({ period, stdDev, values: closes });
        const offset = candles.length - vals.length;
        const upper: IndicatorDataPoint[] = [];
        const lower: IndicatorDataPoint[] = [];
        const middle: IndicatorDataPoint[] = [];

        vals.forEach((v, i) => {
          const time = candles[i + offset].time as UTCTimestamp;
          upper.push({ time, value: Number(v.upper.toFixed(2)) });
          lower.push({ time, value: Number(v.lower.toFixed(2)) });
          middle.push({ time, value: Number(v.middle.toFixed(2)) });
        });
        return { primary: upper, secondary: lower, tertiary: middle };
      }

      case 'SUPERTREND': {
        const period = Number(instance.params.period) || 10;
        const multiplier = Number(instance.params.multiplier) || 3;
        return calculateSupertrend(candles, period, multiplier);
      }

      case 'PSAR': {
        const step = Number(instance.params.step) || 0.02;
        const max = Number(instance.params.max) || 0.2;
        const vals = PSAR.calculate({ step, max, high: highs, low: lows });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.toFixed(2))
        }));
        return { primary };
      }

      case 'DONCHIAN': {
        const period = Number(instance.params.period) || 20;
        return calculateDonchian(candles, period);
      }

      case 'KELTNER': {
        const period = Number(instance.params.period) || 20;
        const multiplier = Number(instance.params.multiplier) || 2;
        return calculateKeltner(candles, period, multiplier);
      }

      case 'RSI': {
        const period = Number(instance.params.period) || 14;
        const vals = RSI.calculate({ period, values: closes });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.toFixed(2))
        }));
        return { primary };
      }

      case 'MACD': {
        const fastPeriod = Number(instance.params.fastPeriod) || 12;
        const slowPeriod = Number(instance.params.slowPeriod) || 26;
        const signalPeriod = Number(instance.params.signalPeriod) || 9;
        const vals = MACD.calculate({
          fastPeriod,
          slowPeriod,
          signalPeriod,
          SimpleMAOscillator: false,
          SimpleMASignal: false,
          values: closes
        });
        const offset = candles.length - vals.length;

        const primary: IndicatorDataPoint[] = []; // MACD line
        const secondary: IndicatorDataPoint[] = []; // Signal line
        const histogram: IndicatorDataPoint[] = []; // Histogram

        vals.forEach((v, i) => {
          const time = candles[i + offset].time as UTCTimestamp;
          if (v.MACD !== undefined) {
            primary.push({ time, value: Number(v.MACD.toFixed(3)) });
          }
          if (v.signal !== undefined) {
            secondary.push({ time, value: Number(v.signal.toFixed(3)) });
          }
          if (v.histogram !== undefined) {
            histogram.push({
              time,
              value: Number(v.histogram.toFixed(3)),
              color: v.histogram >= 0 ? '#00e476' : '#ef4444'
            });
          }
        });
        return { primary, secondary, histogram };
      }

      case 'STOCHASTIC': {
        const period = Number(instance.params.period) || 14;
        const signalPeriod = Number(instance.params.signalPeriod) || 3;
        const vals = Stochastic.calculate({ period, signalPeriod, high: highs, low: lows, close: closes });
        const offset = candles.length - vals.length;

        const primary: IndicatorDataPoint[] = []; // %K
        const secondary: IndicatorDataPoint[] = []; // %D

        vals.forEach((v, i) => {
          const time = candles[i + offset].time as UTCTimestamp;
          if (v.k !== undefined) primary.push({ time, value: Number(v.k.toFixed(2)) });
          if (v.d !== undefined) secondary.push({ time, value: Number(v.d.toFixed(2)) });
        });
        return { primary, secondary };
      }

      case 'ATR': {
        const period = Number(instance.params.period) || 14;
        const vals = ATR.calculate({ period, high: highs, low: lows, close: closes });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.toFixed(2))
        }));
        return { primary };
      }

      case 'ADX': {
        const period = Number(instance.params.period) || 14;
        const vals = ADX.calculate({ period, high: highs, low: lows, close: closes });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.adx.toFixed(2))
        }));
        return { primary };
      }

      case 'CCI': {
        const period = Number(instance.params.period) || 20;
        const vals = CCI.calculate({ period, high: highs, low: lows, close: closes });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.toFixed(2))
        }));
        return { primary };
      }

      case 'WILLIAMS_R': {
        const period = Number(instance.params.period) || 14;
        const vals = WilliamsR.calculate({ period, high: highs, low: lows, close: closes });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.toFixed(2))
        }));
        return { primary };
      }

      case 'OBV': {
        const vals = OBV.calculate({ close: closes, volume: volumes });
        const offset = candles.length - vals.length;
        const primary = vals.map((v, i) => ({
          time: candles[i + offset].time as UTCTimestamp,
          value: Number(v.toFixed(0))
        }));
        return { primary };
      }

      case 'VOLUME': {
        const primary = candles.map(c => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(0, 228, 118, 0.35)' : 'rgba(255, 107, 107, 0.35)'
        }));
        return { primary };
      }

      default:
        return { primary: [] };
    }
  } catch (err) {
    console.warn(`[IndicatorEngine] Calculation error for ${instance.type}:`, err);
    return { primary: [] };
  }
}

/** Formats indicator values for display in the chart legend at a specific time */
export function formatLegendValue(instance: IndicatorInstance, data: MultiSeriesIndicatorData, targetTime?: number): string {
  if (!data || !data.primary || data.primary.length === 0) return '—';

  const findVal = (list?: IndicatorDataPoint[]) => {
    if (!list || list.length === 0) return undefined;
    if (targetTime) {
      const match = list.find(p => p.time === targetTime);
      if (match) return match.value;
    }
    return list[list.length - 1]?.value;
  };

  const pVal = findVal(data.primary);
  const sVal = findVal(data.secondary);
  const tVal = findVal(data.tertiary);
  const hVal = findVal(data.histogram);

  if (pVal === undefined) return '—';

  switch (instance.type) {
    case 'BOLLINGER':
    case 'DONCHIAN':
    case 'KELTNER':
      return `${pVal.toLocaleString()} / ${tVal !== undefined ? tVal.toLocaleString() : '—'} / ${sVal !== undefined ? sVal.toLocaleString() : '—'}`;
    case 'MACD':
      return `MACD: ${pVal.toFixed(2)} | Sig: ${sVal !== undefined ? sVal.toFixed(2) : '—'} | Hist: ${hVal !== undefined ? hVal.toFixed(2) : '—'}`;
    case 'STOCHASTIC':
      return `%K: ${pVal.toFixed(1)} | %D: ${sVal !== undefined ? sVal.toFixed(1) : '—'}`;
    case 'SUPERTREND':
      return `${pVal.toLocaleString()}`;
    case 'VOLUME':
    case 'OBV':
      return Math.round(pVal).toLocaleString();
    default:
      return pVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
