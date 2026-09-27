import yahooFinance from 'yahoo-finance2';
import { RSI, MACD, BollingerBands, ATR, ADX, SMA, EMA } from 'technicalindicators';

export async function getQuote(symbol: string) {
  try {
    const quote: any = await yahooFinance.quote(symbol);
    return {
      symbol,
      name: quote.longName || quote.shortName || symbol,
      current_price: quote.regularMarketPrice,
      open: quote.regularMarketOpen,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      prev_close: quote.regularMarketPreviousClose,
      change: quote.regularMarketChange,
      change_percent: quote.regularMarketChangePercent,
      market_open: quote.marketState === 'REGULAR',
    };
  } catch (e) {
    throw new Error(`Failed to fetch quote for ${symbol}: ${e}`);
  }
}

export async function getHistory(symbol: string, period: string = '5d', interval: any = '15m') {
  try {
    const pMap: any = {
      '1D': { period1: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), interval: '5m' },
      '1W': { period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), interval: '15m' },
      '1M': { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), interval: '1h' },
      '1Y': { period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), interval: '1d' },
    };
    
    const queryOpts = pMap[period] || pMap['1W'];
    
    const result: any = await yahooFinance.chart(symbol, queryOpts);
    const candles = result.quotes.map(q => ({
      time: q.date.toISOString(),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume
    })).filter(c => c.close != null);
    
    return { symbol, period, candles };
  } catch (e) {
    throw new Error(`Failed to fetch history for ${symbol}: ${e}`);
  }
}

export async function getAnalysis(symbol: string) {
  try {
    const result: any = await yahooFinance.chart(symbol, {
      period1: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      interval: '1d'
    });
    
    const closes = result.quotes.map(q => q.close).filter(Boolean) as number[];
    const highs = result.quotes.map(q => q.high).filter(Boolean) as number[];
    const lows = result.quotes.map(q => q.low).filter(Boolean) as number[];
    
    if (closes.length < 50) throw new Error("Not enough data for analysis");

    const rsi = RSI.calculate({ values: closes, period: 14 });
    const macd = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
    const bb = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 });
    const atr = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const adx = ADX.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const ema20 = EMA.calculate({ values: closes, period: 20 });
    const ema50 = EMA.calculate({ values: closes, period: 50 });
    const ma20 = SMA.calculate({ values: closes, period: 20 });
    
    const latestRsi = rsi[rsi.length - 1];
    const latestMacd = macd[macd.length - 1];
    const latestBb = bb[bb.length - 1];
    const latestAtr = atr[atr.length - 1];
    const latestAdx = adx[adx.length - 1];

    const signals: any = {};
    if (latestRsi > 70) signals.rsi = 'Overbought';
    else if (latestRsi < 30) signals.rsi = 'Oversold';
    else signals.rsi = 'Neutral';

    if (latestMacd?.MACD && latestMacd?.signal) {
      signals.macd = latestMacd.MACD > latestMacd.signal ? 'Bullish' : 'Bearish';
    }

    return {
      symbol,
      rsi: latestRsi,
      macd: latestMacd?.MACD,
      macd_signal: latestMacd?.signal,
      macd_histogram: latestMacd?.histogram,
      bb_upper: latestBb?.upper,
      bb_middle: latestBb?.middle,
      bb_lower: latestBb?.lower,
      atr: latestAtr,
      adx: latestAdx?.adx,
      ema_20: ema20[ema20.length - 1],
      ema_50: ema50[ema50.length - 1],
      ma_20: ma20[ma20.length - 1],
      signals
    };
  } catch (e) {
    throw new Error(`Failed to run analysis for ${symbol}: ${e}`);
  }
}

export async function getSuggestion(symbol: string) {
  try {
    const quote = await getQuote(symbol);
    const analysis = await getAnalysis(symbol);
    
    let score = 0;
    let strength = 0;
    
    // Trend
    if (analysis.ema_20 && analysis.ema_50) {
      if (analysis.ema_20 > analysis.ema_50) { score += 0.3; strength += 0.3; }
      else { score -= 0.3; strength += 0.3; }
    }
    
    if (analysis.macd && analysis.macd_signal) {
      if (analysis.macd > analysis.macd_signal) { score += 0.2; strength += 0.2; }
      else { score -= 0.2; strength += 0.2; }
    }
    
    // Momentum
    if (analysis.rsi) {
      if (analysis.rsi < 30) { score += 0.4; strength += 0.4; }
      else if (analysis.rsi > 70) { score -= 0.4; strength += 0.4; }
    }
    
    const combinedScore = Math.max(-1, Math.min(1, score));
    const combinedStrength = Math.min(1, strength);
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (combinedScore > 0.1) action = 'BUY';
    else if (combinedScore < -0.1) action = 'SELL';
    
    const confidence = Math.min(Math.abs(combinedScore) * combinedStrength, 1.0) * 1.5; // Boost confidence for display

    let target = null;
    let stop = null;
    
    if (action === 'BUY') {
      target = analysis.bb_upper || (quote.current_price! * 1.05);
      stop = Math.max(analysis.bb_lower || 0, quote.current_price! * 0.97);
    } else if (action === 'SELL') {
      target = analysis.bb_lower || (quote.current_price! * 0.95);
      stop = Math.min(analysis.bb_upper || Infinity, quote.current_price! * 1.03);
    }

    let rr = null;
    if (target && stop && quote.current_price) {
      const risk = action === 'BUY' ? quote.current_price - stop : stop - quote.current_price;
      const reward = action === 'BUY' ? target - quote.current_price : quote.current_price - target;
      if (risk > 0) rr = reward / risk;
    }

    const reasoning = [];
    reasoning.push(`Overall signal: ${action} (Confidence: ${confidence.toFixed(2)})`);
    if (analysis.rsi && analysis.rsi < 30) reasoning.push(`RSI (${analysis.rsi.toFixed(1)}) indicates oversold conditions`);
    if (analysis.rsi && analysis.rsi > 70) reasoning.push(`RSI (${analysis.rsi.toFixed(1)}) indicates overbought conditions`);
    if (analysis.macd && analysis.macd_signal) {
      reasoning.push(analysis.macd > analysis.macd_signal ? "MACD line above signal line (bullish)" : "MACD line below signal line (bearish)");
    }

    return {
      symbol,
      action: confidence > 0.3 ? action : 'HOLD',
      confidence: Math.min(confidence, 1.0),
      target_price: target,
      stop_loss: stop,
      risk_reward_ratio: rr,
      reasoning
    };
  } catch (e) {
    throw new Error(`Failed to get suggestion for ${symbol}: ${e}`);
  }
}
