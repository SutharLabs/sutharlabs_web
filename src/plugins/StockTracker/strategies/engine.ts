import { RSI, MACD, BollingerBands, ATR, EMA, SMA } from 'technicalindicators';
import { IStrategy, StrategySignal, StrategyRuleCondition } from './types.js';
import { StockSentimentReport } from '../news/types.js';
import { calculateSentimentConfluence } from '../news/sentimentEngine.js';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuoteData {
  symbol: string;
  current_price: number;
  open?: number;
  high?: number;
  low?: number;
  prev_close?: number;
  change?: number;
  change_percent?: number;
  name?: string;
  exchange?: string;
}

// Technical calculation for Supertrend
function calculateSupertrend(highs: number[], lows: number[], closes: number[], period: number = 10, multiplier: number = 3.0) {
  if (closes.length < period + 1) return { supertrend: closes[closes.length - 1], direction: 'UP' as const };
  const atr = ATR.calculate({ high: highs, low: lows, close: closes, period });
  const offset = closes.length - atr.length;

  let upperBand = (highs[offset] + lows[offset]) / 2 + multiplier * atr[0];
  let lowerBand = (highs[offset] + lows[offset]) / 2 - multiplier * atr[0];
  let inUptrend = true;
  let supertrendValue = lowerBand;

  for (let i = 1; i < atr.length; i++) {
    const idx = i + offset;
    const basicUpper = (highs[idx] + lows[idx]) / 2 + multiplier * atr[i];
    const basicLower = (highs[idx] + lows[idx]) / 2 - multiplier * atr[i];

    if (basicUpper < upperBand || closes[idx - 1] > upperBand) upperBand = basicUpper;
    if (basicLower > lowerBand || closes[idx - 1] < lowerBand) lowerBand = basicLower;

    if (inUptrend && closes[idx] < lowerBand) {
      inUptrend = false;
    } else if (!inUptrend && closes[idx] > upperBand) {
      inUptrend = true;
    }

    supertrendValue = inUptrend ? lowerBand : upperBand;
  }

  return {
    supertrend: Number(supertrendValue.toFixed(2)),
    direction: inUptrend ? ('UP' as const) : ('DOWN' as const)
  };
}

export function evaluateStrategy(
  strategy: IStrategy,
  candles: CandleData[],
  quote: QuoteData,
  paramOverrides: Record<string, any> = {},
  sentimentReport?: StockSentimentReport
): StrategySignal {
  const currentPrice = quote.current_price || candles[candles.length - 1]?.close || 100;
  const timestamp = new Date().toISOString();

  // Combine default parameters with overrides
  const params: Record<string, any> = {};
  for (const p of strategy.parameters || []) {
    params[p.id] = paramOverrides[p.id] !== undefined ? paramOverrides[p.id] : p.default;
  }

  const validCandles = (candles || []).filter(c => c && c.close != null && c.high != null && c.low != null);
  const closes = validCandles.map(c => Number(c.close));
  const highs = validCandles.map(c => Number(c.high));
  const lows = validCandles.map(c => Number(c.low));

  if (closes.length < 20) {
    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      action: 'HOLD',
      confidence: 0.1,
      entryPrice: currentPrice,
      timestamp,
      reasoning: ['Insufficient historical bars for algorithmic evaluation (minimum 20 bars needed).']
    };
  }

  // Calculate standard indicator suite
  const fastPeriod = Number(params.fastPeriod || 20);
  const slowPeriod = Number(params.slowPeriod || 50);
  const rsiPeriod = Number(params.rsiPeriod || 14);
  const bbPeriod = Number(params.bbPeriod || 20);
  const bbStdDev = Number(params.bbStdDev || 2.0);
  const atrPeriod = Number(params.atrPeriod || 10);
  const atrMultiplier = Number(params.multiplier || 3.0);

  const emaFastSeries = EMA.calculate({ values: closes, period: Math.min(fastPeriod, closes.length) });
  const emaSlowSeries = closes.length >= slowPeriod ? EMA.calculate({ values: closes, period: slowPeriod }) : [];
  const rsiSeries = RSI.calculate({ values: closes, period: Math.min(rsiPeriod, closes.length - 1) });
  const macdSeries = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
  const bbSeries = BollingerBands.calculate({ values: closes, period: Math.min(bbPeriod, closes.length), stdDev: bbStdDev });
  const atrSeries = ATR.calculate({ high: highs, low: lows, close: closes, period: Math.min(atrPeriod, closes.length - 1) });
  const supertrendResult = calculateSupertrend(highs, lows, closes, atrPeriod, atrMultiplier);

  const latestEmaFast = emaFastSeries[emaFastSeries.length - 1] ?? currentPrice;
  const prevEmaFast = emaFastSeries[emaFastSeries.length - 2] ?? latestEmaFast;
  const latestEmaSlow = emaSlowSeries[emaSlowSeries.length - 1] ?? latestEmaFast;
  const prevEmaSlow = emaSlowSeries[emaSlowSeries.length - 2] ?? latestEmaSlow;

  const ema200Series = EMA.calculate({ values: closes, period: Math.min(200, closes.length) });
  const latestEma200 = ema200Series[ema200Series.length - 1] ?? latestEmaSlow;

  const latestRsi = rsiSeries[rsiSeries.length - 1] ?? 50;
  const prevRsi = rsiSeries[rsiSeries.length - 2] ?? latestRsi;

  const rsi2Series = RSI.calculate({ values: closes, period: Math.min(2, Math.max(2, closes.length - 1)) });
  const latestRsi2 = rsi2Series[rsi2Series.length - 1] ?? latestRsi;

  const latestMacd = macdSeries[macdSeries.length - 1];
  const prevMacd = macdSeries[macdSeries.length - 2];
  const latestMacdHist = Number(((latestMacd?.MACD ?? 0) - (latestMacd?.signal ?? 0)).toFixed(2));
  const prevMacdHist = Number(((prevMacd?.MACD ?? 0) - (prevMacd?.signal ?? 0)).toFixed(2));

  const latestBb = bbSeries[bbSeries.length - 1];
  const latestAtr = atrSeries[atrSeries.length - 1] ?? (currentPrice * 0.02);

  // Volume Moving Average (20-bar)
  const last20Vols = validCandles.slice(-20).map(c => Number(c.volume || 0));
  const volumeMa = last20Vols.length > 0 ? (last20Vols.reduce((a, b) => a + b, 0) / last20Vols.length) : 1;
  const latestVol = Number(validCandles[validCandles.length - 1]?.volume || 0);
  const volumeRatio = volumeMa > 0 ? Number((latestVol / volumeMa).toFixed(2)) : 1.0;

  const indicatorsMap: Record<string, number> = {
    price: currentPrice,
    rsi: Number(latestRsi.toFixed(2)),
    rsi_2: Number(latestRsi2.toFixed(2)),
    ema_fast: Number(latestEmaFast.toFixed(2)),
    ema_slow: Number(latestEmaSlow.toFixed(2)),
    ema_200: Number(latestEma200.toFixed(2)),
    macd: latestMacd?.MACD ? Number(latestMacd.MACD.toFixed(2)) : 0,
    macd_signal: latestMacd?.signal ? Number(latestMacd.signal.toFixed(2)) : 0,
    macd_hist: latestMacdHist,
    bb_upper: latestBb?.upper ? Number(latestBb.upper.toFixed(2)) : currentPrice * 1.05,
    bb_middle: latestBb?.middle ? Number(latestBb.middle.toFixed(2)) : currentPrice,
    bb_lower: latestBb?.lower ? Number(latestBb.lower.toFixed(2)) : currentPrice * 0.95,
    supertrend: Number(supertrendResult.supertrend.toFixed(2)),
    volume: latestVol,
    volume_ma: Math.round(volumeMa),
    volume_ratio: volumeRatio
  };

  const reasoning: string[] = [];
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 0.5;

  // 1. SPECIFIC PRESET STRATEGY MATHEMATICS
  if (strategy.id === 'strat-ema-cross') {
    const isGoldenCross = prevEmaFast <= prevEmaSlow && latestEmaFast > latestEmaSlow;
    const isDeathCross = prevEmaFast >= prevEmaSlow && latestEmaFast < latestEmaSlow;
    const isBullishSpread = latestEmaFast > latestEmaSlow;

    if (isGoldenCross) {
      action = 'BUY';
      confidence = 0.92;
      reasoning.push(`Golden Cross Triggered: Fast EMA (${fastPeriod}) crossed above Slow EMA (${slowPeriod}).`);
      reasoning.push(`Strong bullish trend reversal signal.`);
    } else if (isDeathCross) {
      action = 'SELL';
      confidence = 0.90;
      reasoning.push(`Death Cross Triggered: Fast EMA (${fastPeriod}) crossed below Slow EMA (${slowPeriod}).`);
      reasoning.push(`Confirmed bearish breakdown signal.`);
    } else if (isBullishSpread && currentPrice > latestEmaFast) {
      action = 'BUY';
      confidence = 0.72;
      reasoning.push(`Active Uptrend: Price is above both Fast EMA (${latestEmaFast.toFixed(2)}) and Slow EMA (${latestEmaSlow.toFixed(2)}).`);
    } else if (!isBullishSpread && currentPrice < latestEmaFast) {
      action = 'SELL';
      confidence = 0.74;
      reasoning.push(`Active Downtrend: Price is below Fast EMA (${latestEmaFast.toFixed(2)}) and Slow EMA (${latestEmaSlow.toFixed(2)}).`);
    } else {
      action = 'HOLD';
      confidence = 0.50;
      reasoning.push(`Trend consolidation: Fast EMA (${latestEmaFast.toFixed(2)}) and Slow EMA (${latestEmaSlow.toFixed(2)}) converging without breakout.`);
    }
  } else if (strategy.id === 'strat-rsi-mean-reversion') {
    const oversold = Number(params.oversold || 30);
    const overbought = Number(params.overbought || 70);
    const macdBullish = (latestMacd?.MACD ?? 0) > (latestMacd?.signal ?? 0);

    if (latestRsi < oversold) {
      action = 'BUY';
      confidence = macdBullish ? 0.88 : 0.75;
      reasoning.push(`RSI (${latestRsi.toFixed(1)}) is deeply oversold (< ${oversold}). High mean-reversion probability.`);
      if (macdBullish) reasoning.push(`MACD histogram confirmed bullish momentum turnaround.`);
    } else if (latestRsi > overbought) {
      action = 'SELL';
      confidence = !macdBullish ? 0.88 : 0.76;
      reasoning.push(`RSI (${latestRsi.toFixed(1)}) is stretched overbought (> ${overbought}). Vulnerable to mean-reversion selloff.`);
      if (!macdBullish) reasoning.push(`MACD crossed below signal, confirming downward momentum.`);
    } else {
      action = 'HOLD';
      confidence = 0.45;
      reasoning.push(`RSI (${latestRsi.toFixed(1)}) is inside neutral boundaries (${oversold} - ${overbought}).`);
    }
  } else if (strategy.id === 'strat-bb-breakout') {
    const upper = indicatorsMap.bb_upper;
    const lower = indicatorsMap.bb_lower;
    const middle = indicatorsMap.bb_middle;
    const bandwidth = middle > 0 ? (upper - lower) / middle : 0.1;

    if (currentPrice > upper) {
      action = 'BUY';
      confidence = 0.85;
      reasoning.push(`Volatility Breakout: Price (${currentPrice}) surged above the Upper Bollinger Band (${upper}).`);
      reasoning.push(`Bandwidth expansion: ${(bandwidth * 100).toFixed(1)}% indicates high volatility momentum.`);
    } else if (currentPrice < lower) {
      action = 'SELL';
      confidence = 0.86;
      reasoning.push(`Band Breakdown: Price (${currentPrice}) dropped below the Lower Bollinger Band (${lower}).`);
    } else {
      action = 'HOLD';
      confidence = 0.40;
      reasoning.push(`Inside Envelope: Price (${currentPrice}) is contained between Lower (${lower}) and Upper (${upper}) bands.`);
    }
  } else if (strategy.id === 'strat-supertrend-trend') {
    const trend = supertrendResult.direction;
    const stVal = supertrendResult.supertrend;

    if (trend === 'UP') {
      action = 'BUY';
      confidence = 0.82;
      reasoning.push(`Supertrend is Bullish (Green). Trailing stop support at ${stVal}.`);
      reasoning.push(`Price (${currentPrice}) maintains a +${(((currentPrice - stVal) / stVal) * 100).toFixed(1)}% buffer above trailing floor.`);
    } else {
      action = 'SELL';
      confidence = 0.82;
      reasoning.push(`Supertrend is Bearish (Red). Trailing resistance ceiling at ${stVal}.`);
      reasoning.push(`Asset is in active corrective regime below trendline.`);
    }
  } else if (strategy.id === 'strat-connors-rsi2-pullback') {
    // Larry Connors RSI-2 High Win Rate Pullback Model
    const oversoldLvl = Number(params.oversoldThreshold || 12);
    const inBullRegime = currentPrice > latestEma200;

    if (inBullRegime && latestRsi2 < oversoldLvl) {
      action = 'BUY';
      confidence = 0.94;
      reasoning.push(`Larry Connors Setup Fired: RSI(2) collapsed to extreme oversold (${latestRsi2.toFixed(1)} < ${oversoldLvl}).`);
      reasoning.push(`Secular Trend Confirmed: Price is strictly above 200 EMA (${latestEma200.toFixed(2)}). Mean-reversion edge active.`);
    } else if (latestRsi2 > 70 || currentPrice > latestEmaFast) {
      action = 'SELL';
      confidence = 0.86;
      reasoning.push(`Mean Reversion Target Achieved: RSI(2) normalized (${latestRsi2.toFixed(1)} > 70) or tagged Fast EMA.`);
    } else {
      action = 'HOLD';
      confidence = 0.45;
      reasoning.push(`Waiting for deep RSI(2) pullback < ${oversoldLvl} in secular bull trend.`);
    }
  } else if (strategy.id === 'strat-dual-momentum-trend') {
    // Gary Antonacci / Andreas Clenow Dual Momentum & Crash Defense
    const isAbove200 = currentPrice > latestEma200;
    const isFastAboveSlow = latestEmaFast > latestEmaSlow;
    const isMomentumPositive = latestRsi > 50;

    if (isAbove200 && isFastAboveSlow && isMomentumPositive) {
      action = 'BUY';
      confidence = 0.91;
      reasoning.push(`Dual Momentum Confirmed: Asset in macro bull regime (Price > 200 EMA ${latestEma200.toFixed(2)}).`);
      reasoning.push(`Relative Momentum Surge: Fast EMA (${latestEmaFast.toFixed(2)}) > Slow EMA (${latestEmaSlow.toFixed(2)}) with RSI > 50.`);
    } else if (!isAbove200 || !isFastAboveSlow) {
      action = 'SELL';
      confidence = 0.88;
      reasoning.push(`Macro Regime Exit: Asset fell below 200 EMA or experienced negative trend deceleration.`);
      reasoning.push(`Capital preservation cash preservation trigger active.`);
    } else {
      action = 'HOLD';
      confidence = 0.48;
      reasoning.push(`Dual momentum metrics consolidated.`);
    }
  } else if (strategy.id === 'strat-minervini-trend-template') {
    // Mark Minervini SEPA Stage-2 Trend Template
    const isStage2 = currentPrice > latestEmaFast && latestEmaFast > latestEmaSlow && latestEmaSlow > latestEma200;
    const isConsolidating = latestRsi >= 50 && latestRsi <= 72;

    if (isStage2 && isConsolidating) {
      action = 'BUY';
      confidence = 0.93;
      reasoning.push(`Minervini Stage-2 Alignment: Sequential moving average hierarchy confirmed.`);
      reasoning.push(`Price (${currentPrice}) > EMA20 (${latestEmaFast.toFixed(2)}) > EMA50 (${latestEmaSlow.toFixed(2)}) > EMA200 (${latestEma200.toFixed(2)}).`);
      reasoning.push(`RSI (${latestRsi.toFixed(1)}) demonstrates non-exhausted leadership momentum.`);
    } else if (currentPrice < latestEmaSlow) {
      action = 'SELL';
      confidence = 0.87;
      reasoning.push(`Trend Breakdown: Price slipped below 50 EMA institutional support floor.`);
    } else {
      action = 'HOLD';
      confidence = 0.46;
      reasoning.push(`Awaiting clean Stage-2 moving average alignment.`);
    }
  } else if (strategy.id === 'strat-ttm-squeeze-breakout') {
    // John Carter TTM Squeeze Volatility Breakout
    const isMomentumUp = latestMacdHist > 0 && latestMacdHist >= prevMacdHist;
    const isAboveMid = currentPrice > indicatorsMap.bb_middle;

    if (isMomentumUp && isAboveMid) {
      action = 'BUY';
      confidence = 0.89;
      reasoning.push(`TTM Squeeze Firing Long: MACD histogram expansion (+${latestMacdHist.toFixed(2)}) above zero line.`);
      reasoning.push(`Price (${currentPrice}) breaking out above midline volatility channel.`);
    } else if (latestMacdHist < 0 || currentPrice < indicatorsMap.bb_middle) {
      action = 'SELL';
      confidence = 0.84;
      reasoning.push(`Squeeze Momentum Breakdown: MACD histogram entered negative territory (${latestMacdHist.toFixed(2)}).`);
    } else {
      action = 'HOLD';
      confidence = 0.42;
      reasoning.push(`Volatility energy compression in progress inside channels.`);
    }
  } else if (strategy.id === 'strat-vw-macd-expansion') {
    // Volume-Weighted MACD Momentum Surge (Institutional Order Flow)
    const isMacdCrossUp = prevMacd && (prevMacd.MACD ?? 0) <= (prevMacd.signal ?? 0) && (latestMacd?.MACD ?? 0) > (latestMacd?.signal ?? 0);
    const isMacdPositive = (latestMacd?.MACD ?? 0) > 0;
    const hasVolumeExpansion = volumeRatio >= 1.25;

    if ((isMacdCrossUp || (isMacdPositive && latestMacdHist > prevMacdHist)) && hasVolumeExpansion) {
      action = 'BUY';
      confidence = 0.90;
      reasoning.push(`Institutional Accumulation Surge: Volume is ${volumeRatio}x above 20-bar average.`);
      reasoning.push(`MACD signal line crossover confirmed with heavy positive order flow.`);
    } else if ((latestMacd?.MACD ?? 0) < (latestMacd?.signal ?? 0) || latestRsi > 78) {
      action = 'SELL';
      confidence = 0.86;
      reasoning.push(`Order flow momentum divergence or MACD signal line breakdown.`);
    } else {
      action = 'HOLD';
      confidence = 0.45;
      reasoning.push(`Awaiting institutional volume expansion on MACD crossover.`);
    }
  } else {
    // 2. DYNAMIC RULE EVALUATION FOR CUSTOM STRATEGIES
    const evaluateCondition = (cond: StrategyRuleCondition): boolean => {
      const leftVal = indicatorsMap[cond.indicator] ?? 0;
      const rightVal = typeof cond.value === 'string' && indicatorsMap[cond.value] !== undefined
        ? indicatorsMap[cond.value]
        : Number(cond.value);

      switch (cond.operator) {
        case '>': return leftVal > rightVal;
        case '<': return leftVal < rightVal;
        case '>=': return leftVal >= rightVal;
        case '<=': return leftVal <= rightVal;
        case '==': return Math.abs(leftVal - rightVal) < 0.01;
        case 'crosses_above': return leftVal > rightVal;
        case 'crosses_below': return leftVal < rightVal;
        case 'between': {
          const sec = cond.secondaryValue !== undefined ? cond.secondaryValue : rightVal * 1.05;
          return leftVal >= rightVal && leftVal <= sec;
        }
        default: return false;
      }
    };

    const entryConditions = strategy.rules?.entryConditions || [];
    const exitConditions = strategy.rules?.exitConditions || [];

    const entryPassed = entryConditions.length > 0 && entryConditions.every(evaluateCondition);
    const exitPassed = exitConditions.length > 0 && exitConditions.every(evaluateCondition);

    if (entryPassed && !exitPassed) {
      action = 'BUY';
      confidence = 0.80;
      reasoning.push(`All ${entryConditions.length} entry conditions met for ${strategy.name}.`);
      for (const cond of entryConditions) {
        reasoning.push(`Condition matched: ${cond.indicator.toUpperCase()} ${cond.operator} ${cond.value}`);
      }
    } else if (exitPassed) {
      action = 'SELL';
      confidence = 0.78;
      reasoning.push(`Exit condition triggered for ${strategy.name}.`);
      for (const cond of exitConditions) {
        reasoning.push(`Exit triggered: ${cond.indicator.toUpperCase()} ${cond.operator} ${cond.value}`);
      }
    } else {
      action = 'HOLD';
      confidence = 0.50;
      reasoning.push(`Strategy conditions not satisfied for entry or exit.`);
    }
  }

  // AI Sentiment Confluence Factor (Stage 3 Integration)
  let sentimentConfluence;
  if (sentimentReport) {
    sentimentConfluence = calculateSentimentConfluence(action, confidence, sentimentReport);
    action = sentimentConfluence.finalSignal;
    confidence = sentimentConfluence.finalConfidence;
    reasoning.push(`AI Sentiment Confluence (${sentimentReport.analyzedBy === 'GEMINI_AI' ? 'Gemini AI' : 'Autonomous Engine'}): ${sentimentConfluence.explanation}`);
  }

  // Derive risk management levels
  let targetPrice: number | null = null;
  let stopLoss: number | null = null;
  let riskRewardRatio: number | null = null;

  if (action === 'BUY') {
    targetPrice = Number((currentPrice + latestAtr * 2.5).toFixed(2));
    stopLoss = Number((currentPrice - latestAtr * 1.5).toFixed(2));
  } else if (action === 'SELL') {
    targetPrice = Number((currentPrice - latestAtr * 2.5).toFixed(2));
    stopLoss = Number((currentPrice + latestAtr * 1.5).toFixed(2));
  }

  if (targetPrice && stopLoss) {
    const risk = Math.abs(currentPrice - stopLoss);
    const reward = Math.abs(targetPrice - currentPrice);
    if (risk > 0) {
      riskRewardRatio = Number((reward / risk).toFixed(2));
    }
  }

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    action,
    confidence: Number(confidence.toFixed(2)),
    entryPrice: currentPrice,
    targetPrice,
    stopLoss,
    riskRewardRatio,
    timestamp,
    reasoning,
    metrics: indicatorsMap,
    sentimentConfluence,
    sentimentReport: sentimentReport ? {
      score: sentimentReport.score,
      verdict: sentimentReport.verdict,
      catalystSummary: sentimentReport.catalystSummary,
      primaryCatalyst: sentimentReport.primaryCatalyst,
      circuitBreakerRecommended: sentimentReport.circuitBreakerRecommended,
      analyzedBy: sentimentReport.analyzedBy
    } : undefined
  };
}
