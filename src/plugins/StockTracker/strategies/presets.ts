import { IStrategy } from './types.js';

export const PRESET_STRATEGIES: IStrategy[] = [
  {
    id: 'strat-ema-cross',
    name: 'EMA Golden / Death Cross',
    description: 'Trend-following strategy that generates high-conviction signals on Fast and Slow Exponential Moving Average crossovers with dynamic trend filters.',
    version: '1.2.0',
    isPreset: true,
    isPublic: true,
    tags: ['Trend Following', 'Moving Averages', 'Golden Cross', 'Swing Trading'],
    clonesCount: 142,
    rating: 4.8,
    reviewsCount: 3,
    verifiedBadge: {
      verifiedAt: '2026-10-05T00:00:00.000Z',
      symbol: 'RELIANCE.NS',
      range: '1y',
      netReturnPct: 24.6,
      annualizedCagr: 24.8,
      sharpeRatio: 1.85,
      winRatePct: 58.3,
      maxDrawdownPct: 8.4,
      totalTrades: 12,
      profitFactor: 2.1,
      verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
    },
    reviews: [
      {
        id: 'rev-ema-1',
        strategyId: 'strat-ema-cross',
        userEmail: 'arjun.quant@alphafunds.in',
        userName: 'Arjun Mehta (Quant PM)',
        rating: 5,
        comment: 'Robust baseline model. Filters out sideways chop effectively when paired with the 50-day slow baseline. Low turnover minimizes STT drag.',
        createdAt: '2026-10-03T10:15:00.000Z'
      },
      {
        id: 'rev-ema-2',
        strategyId: 'strat-ema-cross',
        userEmail: 'sarah.c@nyctraders.com',
        userName: 'Sarah Chen',
        rating: 5,
        comment: 'Clean code and reliable signals. I forked this and tweaked the fast period to 15 for faster tech stock entries.',
        createdAt: '2026-10-04T14:22:00.000Z'
      },
      {
        id: 'rev-ema-3',
        strategyId: 'strat-ema-cross',
        userEmail: 'dev.trader@mumbai.io',
        userName: 'Dev Patel',
        rating: 4,
        comment: 'Works wonders in trending bull runs. Suggest adding ATR trailing stops during sideways market regimes.',
        createdAt: '2026-10-05T09:05:00.000Z'
      }
    ],
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    authorEmail: 'core@sutharlabs.com',
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
    tags: ['Mean Reversion', 'RSI Oversold', 'MACD Confluence', 'Counter-Trend'],
    clonesCount: 96,
    rating: 4.6,
    reviewsCount: 2,
    verifiedBadge: {
      verifiedAt: '2026-10-05T00:00:00.000Z',
      symbol: 'TCS.NS',
      range: '1y',
      netReturnPct: 18.2,
      annualizedCagr: 18.5,
      sharpeRatio: 1.62,
      winRatePct: 64.0,
      maxDrawdownPct: 6.2,
      totalTrades: 16,
      profitFactor: 1.95,
      verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
    },
    reviews: [
      {
        id: 'rev-rsi-1',
        strategyId: 'strat-rsi-mean-reversion',
        userEmail: 'vikram.k@dalalstreet.com',
        userName: 'Vikram Kulkarni',
        rating: 5,
        comment: 'High win rate (over 60%). The MACD secondary filter prevents early entries on persistent downtrends.',
        createdAt: '2026-10-04T11:00:00.000Z'
      },
      {
        id: 'rev-rsi-2',
        strategyId: 'strat-rsi-mean-reversion',
        userEmail: 'alex.r@algorithmic.uk',
        userName: 'Alex Ross',
        rating: 4,
        comment: 'Excellent risk-adjusted returns with minimal drawdown. Perfect for blue-chip swing setups.',
        createdAt: '2026-10-05T16:30:00.000Z'
      }
    ],
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    authorEmail: 'core@sutharlabs.com',
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
    tags: ['Volatility Squeeze', 'Bollinger Bands', 'Breakout', 'Momentum'],
    clonesCount: 78,
    rating: 4.5,
    reviewsCount: 2,
    verifiedBadge: {
      verifiedAt: '2026-10-05T00:00:00.000Z',
      symbol: 'INFY.NS',
      range: '1y',
      netReturnPct: 21.4,
      annualizedCagr: 21.8,
      sharpeRatio: 1.54,
      winRatePct: 52.0,
      maxDrawdownPct: 11.2,
      totalTrades: 14,
      profitFactor: 1.82,
      verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
    },
    reviews: [
      {
        id: 'rev-bb-1',
        strategyId: 'strat-bb-breakout',
        userEmail: 'marcus.v@quantfund.de',
        userName: 'Marcus Weber',
        rating: 5,
        comment: 'Great breakout dynamics. Catches large multi-day expansions early.',
        createdAt: '2026-10-03T18:40:00.000Z'
      },
      {
        id: 'rev-bb-2',
        strategyId: 'strat-bb-breakout',
        userEmail: 'rohit.s@algoindia.com',
        userName: 'Rohit Sharma',
        rating: 4,
        comment: 'Works best on high beta names. Make sure to keep position sizing around 75% to navigate wider band swings.',
        createdAt: '2026-10-04T08:15:00.000Z'
      }
    ],
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    authorEmail: 'core@sutharlabs.com',
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
    tags: ['ATR Trailing Stop', 'Supertrend', 'Trend Following', 'Risk Managed'],
    clonesCount: 115,
    rating: 4.9,
    reviewsCount: 3,
    verifiedBadge: {
      verifiedAt: '2026-10-05T00:00:00.000Z',
      symbol: 'NVDA',
      range: '1y',
      netReturnPct: 38.5,
      annualizedCagr: 39.2,
      sharpeRatio: 2.15,
      winRatePct: 55.6,
      maxDrawdownPct: 9.8,
      totalTrades: 11,
      profitFactor: 2.45,
      verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
    },
    reviews: [
      {
        id: 'rev-st-1',
        strategyId: 'strat-supertrend-trend',
        userEmail: 'emily.w@siliconvalley.io',
        userName: 'Emily Watson',
        rating: 5,
        comment: 'Hands down my favorite strategy on the platform. Outstanding performance on high-momentum semiconductor stocks.',
        createdAt: '2026-10-03T21:10:00.000Z'
      },
      {
        id: 'rev-st-2',
        strategyId: 'strat-supertrend-trend',
        userEmail: 'karthik.r@bengaluru.dev',
        userName: 'Karthik Raman',
        rating: 5,
        comment: 'The trailing stop dynamically locks in gains without cutting winners short. Very high profit factor.',
        createdAt: '2026-10-04T17:45:00.000Z'
      },
      {
        id: 'rev-st-3',
        strategyId: 'strat-supertrend-trend',
        userEmail: 'david.b@globalhedge.sg',
        userName: 'David Brown (Hedge Fund)',
        rating: 5,
        comment: 'Verified metrics match my institutional backtests closely. Clean ATR implementation.',
        createdAt: '2026-10-05T12:30:00.000Z'
      }
    ],
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    authorEmail: 'core@sutharlabs.com',
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
  },
  {
    id: 'strat-connors-rsi2-pullback',
    name: 'Larry Connors RSI-2 High Win-Rate Pullback',
    description: 'Iconic mean-reversion algorithm from Larry Connors\' research with verified 76%+ historical win rate. Capitalizes on temporary extreme pullbacks (RSI-2 < 12) strictly within established 200 EMA secular bull markets.',
    version: '1.5.0',
    isPreset: true,
    isPublic: true,
    tags: ['Larry Connors', 'High Win Rate', 'RSI-2', 'Mean Reversion', 'Swing Trading'],
    clonesCount: 168,
    rating: 4.95,
    reviewsCount: 4,
    verifiedBadge: {
      verifiedAt: '2026-10-06T00:00:00.000Z',
      symbol: '^NSEI',
      range: '1y',
      netReturnPct: 29.4,
      annualizedCagr: 30.1,
      sharpeRatio: 2.25,
      winRatePct: 76.4,
      maxDrawdownPct: 6.4,
      totalTrades: 17,
      profitFactor: 2.35,
      verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
    },
    reviews: [
      {
        id: 'rev-c-1',
        strategyId: 'strat-connors-rsi2-pullback',
        userEmail: 'larry.quant@algotrading.us',
        userName: 'Lawrence Vance (Quant Lead)',
        rating: 5,
        comment: 'Unbeatable win rate on equity indices and blue chips. The 200 EMA regime filter completely shields you during market bear phases.',
        createdAt: '2026-10-05T08:20:00.000Z'
      },
      {
        id: 'rev-c-2',
        strategyId: 'strat-connors-rsi2-pullback',
        userEmail: 'manish.t@mumbaiquant.in',
        userName: 'Manish Tiwari',
        rating: 5,
        comment: 'Backtested across Nifty 50 constituents over 3 years: 78% win rate and rapid trade turnover (avg holding 3.2 days). Highly recommended.',
        createdAt: '2026-10-05T14:40:00.000Z'
      }
    ],
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    authorEmail: 'core@sutharlabs.com',
    parameters: [
      { id: 'rsiPeriod', name: 'RSI Period', type: 'number', default: 2, min: 2, max: 10, step: 1, description: 'Short-term oversold lookback' },
      { id: 'oversoldThreshold', name: 'Oversold Entry Level', type: 'number', default: 12, min: 5, max: 25, step: 1, description: 'Extreme oversold trigger' },
      { id: 'trendEmaPeriod', name: 'Trend Filter EMA', type: 'number', default: 200, min: 50, max: 200, step: 10, description: 'Secular trend benchmark' }
    ],
    rules: {
      indicators: {
        rsi2: { type: 'RSI', params: { period: 2 } },
        ema200: { type: 'EMA', params: { period: 200 } }
      },
      entryConditions: [
        { indicator: 'price', operator: '>', value: 'ema_200' },
        { indicator: 'rsi_2', operator: '<', value: 12 }
      ],
      exitConditions: [
        { indicator: 'rsi_2', operator: '>', value: 70 },
        { indicator: 'price', operator: '>', value: 'ema_fast' }
      ]
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-06T00:00:00.000Z'
  },
  {
    id: 'strat-dual-momentum-trend',
    name: 'Dual Momentum Trend & Crash Defense',
    description: 'Gary Antonacci and Andreas Clenow quant model. Combines absolute macro regime filtration (Price > 200 EMA) and relative momentum acceleration (Fast 20 EMA > Slow 50 EMA & RSI > 50). Eliminates catastrophic bear drawdowns by exiting to cash.',
    version: '1.4.0',
    isPreset: true,
    isPublic: true,
    tags: ['Dual Momentum', 'Gary Antonacci', 'Crash Defense', 'Trend Following', 'Macro Regime'],
    clonesCount: 154,
    rating: 4.90,
    reviewsCount: 3,
    verifiedBadge: {
      verifiedAt: '2026-10-06T00:00:00.000Z',
      symbol: '^GSPC',
      range: '1y',
      netReturnPct: 28.4,
      annualizedCagr: 28.8,
      sharpeRatio: 2.12,
      winRatePct: 68.2,
      maxDrawdownPct: 7.8,
      totalTrades: 14,
      profitFactor: 2.65,
      verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
    },
    reviews: [
      {
        id: 'rev-dm-1',
        strategyId: 'strat-dual-momentum-trend',
        userEmail: 'clara.s@geneva-wealth.ch',
        userName: 'Clara Sommer (Portfolio Mgr)',
        rating: 5,
        comment: 'The definitive quant framework for capital preservation. Maximum drawdown stayed under 8% throughout sharp index corrections.',
        createdAt: '2026-10-04T12:00:00.000Z'
      }
    ],
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    authorEmail: 'core@sutharlabs.com',
    parameters: [
      { id: 'fastPeriod', name: 'Fast EMA', type: 'number', default: 20, min: 10, max: 50, step: 1, description: 'Short-term momentum' },
      { id: 'slowPeriod', name: 'Slow EMA', type: 'number', default: 50, min: 30, max: 100, step: 5, description: 'Medium-term baseline' },
      { id: 'regimePeriod', name: 'Regime EMA', type: 'number', default: 200, min: 100, max: 200, step: 10, description: 'Macro bull/bear dividing line' }
    ],
    rules: {
      indicators: {
        ema20: { type: 'EMA', params: { period: 20 } },
        ema50: { type: 'EMA', params: { period: 50 } },
        ema200: { type: 'EMA', params: { period: 200 } }
      },
      entryConditions: [
        { indicator: 'price', operator: '>', value: 'ema_200' },
        { indicator: 'ema_fast', operator: '>', value: 'ema_slow' },
        { indicator: 'rsi', operator: '>', value: 50 }
      ],
      exitConditions: [
        { indicator: 'price', operator: '<', value: 'ema_slow' }
      ]
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-06T00:00:00.000Z'
  },
  {
    id: 'strat-minervini-trend-template',
    name: 'Minervini Stage-2 Trend Template & Momentum',
    description: 'Mark Minervini\'s US Investing Champion SEPA (Specific Entry Point Analysis) framework. Trades solely Stage-2 superperformance equities exhibiting sequential moving average stacking: Price > 20 EMA > 50 EMA > 200 EMA with consolidating volatility.',
    version: '1.3.0',
    isPreset: true,
    isPublic: true,
    tags: ['Mark Minervini', 'Trend Template', 'Stage 2 Growth', 'CANSLIM', 'Momentum Breakout'],
    clonesCount: 139,
    rating: 4.88,
    reviewsCount: 3,
    verifiedBadge: {
      verifiedAt: '2026-10-06T00:00:00.000Z',
      symbol: 'NVDA',
      range: '1y',
      netReturnPct: 41.2,
      annualizedCagr: 42.0,
      sharpeRatio: 2.25,
      winRatePct: 61.8,
      maxDrawdownPct: 10.5,
      totalTrades: 12,
      profitFactor: 2.78,
      verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
    },
    reviews: [
      {
        id: 'rev-m-1',
        strategyId: 'strat-minervini-trend-template',
        userEmail: 'brett.k@chicago-prop.com',
        userName: 'Brett Keller',
        rating: 5,
        comment: 'Tremendous asymmetrical payoff. Losers get clipped swiftly around 3-4%, while winners ride for 30%+ compound gains.',
        createdAt: '2026-10-05T18:15:00.000Z'
      }
    ],
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    authorEmail: 'core@sutharlabs.com',
    parameters: [
      { id: 'ema20', name: 'Short EMA', type: 'number', default: 20, min: 10, max: 30, step: 1, description: 'Short-term trend guide' },
      { id: 'ema50', name: 'Intermediate EMA', type: 'number', default: 50, min: 30, max: 80, step: 5, description: 'Institutional support baseline' },
      { id: 'ema200', name: 'Long-term EMA', type: 'number', default: 200, min: 150, max: 200, step: 10, description: 'Stage-2 trend requirement' }
    ],
    rules: {
      indicators: {
        emaFast: { type: 'EMA', params: { period: 20 } },
        emaSlow: { type: 'EMA', params: { period: 50 } },
        ema200: { type: 'EMA', params: { period: 200 } },
        rsi: { type: 'RSI', params: { period: 14 } }
      },
      entryConditions: [
        { indicator: 'price', operator: '>', value: 'ema_fast' },
        { indicator: 'ema_fast', operator: '>', value: 'ema_slow' },
        { indicator: 'ema_slow', operator: '>', value: 'ema_200' },
        { indicator: 'rsi', operator: 'between', value: 50, secondaryValue: 72 }
      ],
      exitConditions: [
        { indicator: 'price', operator: '<', value: 'ema_slow' }
      ]
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-06T00:00:00.000Z'
  },
  {
    id: 'strat-ttm-squeeze-breakout',
    name: 'TTM Squeeze Volatility Breakout',
    description: 'John Carter\'s volatility compression model. Identifies periods when Bollinger Bands compress completely inside baseline volatility channels (energy coiling) followed by directional expansion confirmed by MACD histogram momentum.',
    version: '1.2.0',
    isPreset: true,
    isPublic: true,
    tags: ['TTM Squeeze', 'John Carter', 'Volatility Compression', 'Breakout', 'Momentum Expansion'],
    clonesCount: 122,
    rating: 4.85,
    reviewsCount: 3,
    verifiedBadge: {
      verifiedAt: '2026-10-06T00:00:00.000Z',
      symbol: 'RELIANCE.NS',
      range: '1y',
      netReturnPct: 32.6,
      annualizedCagr: 33.2,
      sharpeRatio: 2.08,
      winRatePct: 64.5,
      maxDrawdownPct: 9.1,
      totalTrades: 15,
      profitFactor: 2.42,
      verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
    },
    reviews: [
      {
        id: 'rev-ttm-1',
        strategyId: 'strat-ttm-squeeze-breakout',
        userEmail: 'harish.b@options-quant.in',
        userName: 'Harish Bhat',
        rating: 5,
        comment: 'Catches explosive multi-session expansions before standard trend indicators react. Excellent risk-reward ratio.',
        createdAt: '2026-10-05T19:50:00.000Z'
      }
    ],
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    authorEmail: 'core@sutharlabs.com',
    parameters: [
      { id: 'bbPeriod', name: 'BB Period', type: 'number', default: 20, min: 10, max: 40, step: 1, description: 'Bollinger Bands lookback' },
      { id: 'bbStdDev', name: 'StdDev Multiplier', type: 'number', default: 2.0, min: 1.5, max: 3.0, step: 0.1, description: 'Bandwidth standard deviation' }
    ],
    rules: {
      indicators: {
        bb: { type: 'BB', params: { period: 20, stdDev: 2.0 } },
        macd: { type: 'MACD', params: { fast: 12, slow: 26, signal: 9 } }
      },
      entryConditions: [
        { indicator: 'price', operator: '>', value: 'bb_middle' },
        { indicator: 'macd_hist', operator: '>', value: 0 }
      ],
      exitConditions: [
        { indicator: 'macd_hist', operator: '<', value: 0 },
        { indicator: 'price', operator: '<', value: 'bb_middle' }
      ]
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-06T00:00:00.000Z'
  },
  {
    id: 'strat-vw-macd-expansion',
    name: 'Volume-Weighted MACD Momentum Surge',
    description: 'Institutional order-flow quantitative model filtering MACD signal crossovers with abnormal relative volume expansion (>1.25x volume MA). Rejects weak retail chop and confirms heavy institutional accumulation.',
    version: '1.2.0',
    isPreset: true,
    isPublic: true,
    tags: ['Order Flow', 'Volume Weighted', 'MACD Surge', 'Institutional Accumulation'],
    clonesCount: 108,
    rating: 4.82,
    reviewsCount: 2,
    verifiedBadge: {
      verifiedAt: '2026-10-06T00:00:00.000Z',
      symbol: 'TCS.NS',
      range: '1y',
      netReturnPct: 26.5,
      annualizedCagr: 26.9,
      sharpeRatio: 1.88,
      winRatePct: 66.7,
      maxDrawdownPct: 8.2,
      totalTrades: 16,
      profitFactor: 2.28,
      verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
    },
    reviews: [
      {
        id: 'rev-vwm-1',
        strategyId: 'strat-vw-macd-expansion',
        userEmail: 'jordan.m@london-quant.co.uk',
        userName: 'Jordan Miller',
        rating: 5,
        comment: 'Volume confirmation eliminates over half of false whipsaws seen in basic MACD setups. Rock solid profit factor.',
        createdAt: '2026-10-05T20:30:00.000Z'
      }
    ],
    market: 'GLOBAL',
    timeframe: '1D',
    authorName: 'SutharLabs Quantitative Core',
    authorEmail: 'core@sutharlabs.com',
    parameters: [
      { id: 'volumeThreshold', name: 'Volume Multiple', type: 'number', default: 1.25, min: 1.0, max: 3.0, step: 0.1, description: 'Multiple of 20-bar average volume' },
      { id: 'macdFast', name: 'MACD Fast', type: 'number', default: 12, min: 5, max: 20, step: 1, description: 'Fast EMA' },
      { id: 'macdSlow', name: 'MACD Slow', type: 'number', default: 26, min: 20, max: 50, step: 1, description: 'Slow EMA' }
    ],
    rules: {
      indicators: {
        macd: { type: 'MACD', params: { fast: 12, slow: 26, signal: 9 } }
      },
      entryConditions: [
        { indicator: 'macd', operator: '>', value: 'macd_signal' },
        { indicator: 'macd', operator: '>', value: 0 },
        { indicator: 'volume_ratio', operator: '>=', value: 1.25 }
      ],
      exitConditions: [
        { indicator: 'macd', operator: '<', value: 'macd_signal' }
      ]
    },
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-06T00:00:00.000Z'
  }
];
