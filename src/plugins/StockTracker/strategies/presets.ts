import { IStrategy } from './types.js';

export const PRESET_STRATEGIES: IStrategy[] = [
  {
    id: 'strat-ema-cross',
    name: 'EMA Golden / Death Cross',
    description: 'Trend-following strategy that generates high-conviction signals on Fast and Slow Exponential Moving Average crossovers with dynamic trend filters.',
    version: '1.2.0',
    isPreset: true,
    isPublic: true,
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    parameters: [
      { id: 'fastPeriod', name: 'Fast EMA Period', type: 'number', default: 20, min: 5, max: 100, step: 1, description: 'Short-term momentum EMA period' },
      { id: 'slowPeriod', name: 'Slow EMA Period', type: 'number', default: 50, min: 10, max: 200, step: 5, description: 'Long-term baseline trend EMA period' }
    ],
    rules: {
      indicators: {
        emaFast: { type: 'EMA', params: { period: 20 } },
        emaSlow: { type: 'EMA', params: { period: 50 } }
      },
      entryConditions: [
        { indicator: 'ema_fast', operator: 'crosses_above', value: 'ema_slow' },
        { indicator: 'price', operator: '>', value: 'ema_fast' }
      ],
      exitConditions: [
        { indicator: 'ema_fast', operator: 'crosses_below', value: 'ema_slow' }
      ]
    },
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z'
  },
  {
    id: 'strat-rsi-mean-reversion',
    name: 'RSI Mean Reversion with MACD Filter',
    description: 'Identifies statistically oversold and overbought assets with secondary MACD momentum confirmation to avoid catching falling knives.',
    version: '1.4.0',
    isPreset: true,
    isPublic: true,
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    parameters: [
      { id: 'rsiPeriod', name: 'RSI Calculation Period', type: 'number', default: 14, min: 2, max: 50, step: 1, description: 'RSI Lookback periods' },
      { id: 'oversold', name: 'Oversold Entry Level', type: 'number', default: 30, min: 10, max: 45, step: 1, description: 'RSI level to consider heavily oversold' },
      { id: 'overbought', name: 'Overbought Exit Level', type: 'number', default: 70, min: 55, max: 90, step: 1, description: 'RSI level to consider overbought' }
    ],
    rules: {
      indicators: {
        rsi: { type: 'RSI', params: { period: 14 } },
        macd: { type: 'MACD', params: { fast: 12, slow: 26, signal: 9 } }
      },
      entryConditions: [
        { indicator: 'rsi', operator: '<', value: 32 },
        { indicator: 'macd', operator: '>', value: 'macd_signal' }
      ],
      exitConditions: [
        { indicator: 'rsi', operator: '>', value: 68 }
      ]
    },
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z'
  },
  {
    id: 'strat-bb-breakout',
    name: 'Bollinger Bands Squeeze & Volatility Breakout',
    description: 'Detects periods of extreme volatility compression (squeeze) followed by expansion and directional breakouts outside envelope bands.',
    version: '1.1.0',
    isPreset: true,
    isPublic: true,
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    parameters: [
      { id: 'bbPeriod', name: 'Bollinger Period', type: 'number', default: 20, min: 10, max: 50, step: 1, description: 'Moving average lookback for bands' },
      { id: 'bbStdDev', name: 'Standard Deviation Multiplier', type: 'number', default: 2.0, min: 1.0, max: 3.5, step: 0.1, description: 'Width of bands in standard deviations' }
    ],
    rules: {
      indicators: {
        bb: { type: 'BB', params: { period: 20, stdDev: 2.0 } }
      },
      entryConditions: [
        { indicator: 'price', operator: 'crosses_above', value: 'bb_upper' }
      ],
      exitConditions: [
        { indicator: 'price', operator: '<', value: 'bb_lower' }
      ]
    },
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z'
  },
  {
    id: 'strat-supertrend-trend',
    name: 'Supertrend Trend-Following Engine',
    description: 'ATR-based adaptive trailing stop volatility model that captures multi-week trending runs while keeping drawdown strictly controlled.',
    version: '1.3.0',
    isPreset: true,
    isPublic: true,
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    parameters: [
      { id: 'atrPeriod', name: 'ATR Period', type: 'number', default: 10, min: 5, max: 30, step: 1, description: 'Average True Range volatility period' },
      { id: 'multiplier', name: 'ATR Multiplier', type: 'number', default: 3.0, min: 1.0, max: 6.0, step: 0.25, description: 'Band distance multiplier' }
    ],
    rules: {
      indicators: {
        supertrend: { type: 'SUPERTREND', params: { period: 10, multiplier: 3.0 } }
      },
      entryConditions: [
        { indicator: 'price', operator: '>', value: 'supertrend' }
      ],
      exitConditions: [
        { indicator: 'price', operator: '<', value: 'supertrend' }
      ]
    },
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z'
  }
];
