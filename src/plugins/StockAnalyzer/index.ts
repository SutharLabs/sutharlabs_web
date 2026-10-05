import YahooFinance from 'yahoo-finance2';
import { RSI, MACD, BollingerBands, ATR, ADX, SMA, EMA } from 'technicalindicators';

// Instantiate YahooFinance client (compatible with yahoo-finance2 v3+)
const yahooFinance = new (YahooFinance as any)({ suppressNotices: ['yahooSurvey'] });

export interface MarketStock {
  symbol: string;
  name: string;
  sector?: string;
}

export interface MarketUniverse {
  id: string;
  name: string;
  region: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  exchange: string;
  stocks: MarketStock[];
}

export const MARKET_UNIVERSES: Record<string, MarketUniverse> = {
  IN: {
    id: 'IN',
    name: 'India (NSE NIFTY 50)',
    region: 'India',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    exchange: 'NSE',
    stocks: [
      { symbol: 'RELIANCE.NS',   name: 'Reliance Industries', sector: 'Energy / Conglomerate' },
      { symbol: 'TCS.NS',        name: 'Tata Consultancy Services', sector: 'IT Services' },
      { symbol: 'HDFCBANK.NS',   name: 'HDFC Bank', sector: 'Banking' },
      { symbol: 'INFY.NS',       name: 'Infosys', sector: 'IT Services' },
      { symbol: 'ICICIBANK.NS',  name: 'ICICI Bank', sector: 'Banking' },
      { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG' },
      { symbol: 'ITC.NS',        name: 'ITC Limited', sector: 'FMCG / Tobacco' },
      { symbol: 'SBIN.NS',       name: 'State Bank of India', sector: 'Public Banking' },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
      { symbol: 'KOTAKBANK.NS',  name: 'Kotak Mahindra Bank', sector: 'Banking' },
      { symbol: 'LT.NS',         name: 'Larsen & Toubro', sector: 'Engineering & Infra' },
      { symbol: 'AXISBANK.NS',   name: 'Axis Bank', sector: 'Banking' },
      { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Automobile' },
      { symbol: 'MARUTI.NS',     name: 'Maruti Suzuki India', sector: 'Automobile' },
      { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'NBFC' }
    ]
  },
  US: {
    id: 'US',
    name: 'United States (S&P 500 / Tech Titans)',
    region: 'United States',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    exchange: 'NYSE/NASDAQ',
    stocks: [
      { symbol: 'AAPL',  name: 'Apple Inc.', sector: 'Consumer Electronics' },
      { symbol: 'MSFT',  name: 'Microsoft Corp.', sector: 'Enterprise Software & Cloud' },
      { symbol: 'NVDA',  name: 'NVIDIA Corp.', sector: 'Semiconductors & AI' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Internet & Cloud' },
      { symbol: 'AMZN',  name: 'Amazon.com Inc.', sector: 'E-commerce & Cloud' },
      { symbol: 'META',  name: 'Meta Platforms Inc.', sector: 'Social Media & AI' },
      { symbol: 'TSLA',  name: 'Tesla Inc.', sector: 'EV & Clean Energy' },
      { symbol: 'AMD',   name: 'Advanced Micro Devices', sector: 'Semiconductors' },
      { symbol: 'NFLX',  name: 'Netflix Inc.', sector: 'Streaming & Media' },
      { symbol: 'BRK-B', name: 'Berkshire Hathaway', sector: 'Conglomerate' },
      { symbol: 'JPM',   name: 'JPMorgan Chase & Co.', sector: 'Banking' },
      { symbol: 'V',     name: 'Visa Inc.', sector: 'Payment Processing' }
    ]
  },
  EU: {
    id: 'EU',
    name: 'Europe & UK (FTSE / DAX / Euronext)',
    region: 'Europe',
    flag: '🇪🇺',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchange: 'LSE/DAX/Euronext',
    stocks: [
      { symbol: 'SHEL.L',  name: 'Shell plc', sector: 'Oil & Gas (UK)' },
      { symbol: 'AZN.L',   name: 'AstraZeneca plc', sector: 'Biopharma (UK)' },
      { symbol: 'HSBA.L',  name: 'HSBC Holdings', sector: 'Global Banking (UK)' },
      { symbol: 'SAP.DE',  name: 'SAP SE', sector: 'Enterprise Software (Germany)' },
      { symbol: 'MC.PA',   name: 'LVMH Moët Hennessy', sector: 'Luxury Goods (France)' },
      { symbol: 'ASML.AS', name: 'ASML Holding NV', sector: 'Lithography Equipment (Netherlands)' },
      { symbol: 'SIE.DE',  name: 'Siemens AG', sector: 'Industrial Automation (Germany)' }
    ]
  },
  CN: {
    id: 'CN',
    name: 'China & Hong Kong (CSI 300 & Hang Seng)',
    region: 'China / HK',
    flag: '🇨🇳',
    currencyCode: 'HKD',
    currencySymbol: 'HK$',
    exchange: 'HKEX/SSE/SZSE',
    stocks: [
      { symbol: '0700.HK',    name: 'Tencent Holdings', sector: 'Internet & Gaming (HK)' },
      { symbol: '9988.HK',    name: 'Alibaba Group', sector: 'E-commerce & Cloud (HK)' },
      { symbol: '600519.SS',  name: 'Kweichow Moutai', sector: 'Beverages (China SSE)' },
      { symbol: '002594.SZ',  name: 'BYD Company', sector: 'EV & Batteries (China SZSE)' },
      { symbol: '3690.HK',    name: 'Meituan', sector: 'Consumer Services (HK)' },
      { symbol: '1211.HK',    name: 'BYD Company (HK)', sector: 'Automobile (HK)' }
    ]
  },
  JP: {
    id: 'JP',
    name: 'Japan (Tokyo Nikkei 225)',
    region: 'Japan',
    flag: '🇯🇵',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    exchange: 'TSE',
    stocks: [
      { symbol: '7203.T', name: 'Toyota Motor Corp.', sector: 'Automotive' },
      { symbol: '6758.T', name: 'Sony Group Corp.', sector: 'Consumer Tech & Entertainment' },
      { symbol: '9984.T', name: 'SoftBank Group Corp.', sector: 'Tech Investment' },
      { symbol: '8035.T', name: 'Tokyo Electron Ltd.', sector: 'Semiconductor Equipment' },
      { symbol: '6861.T', name: 'Keyence Corp.', sector: 'Sensors & Automation' }
    ]
  }
};

export function getCurrencySymbol(symbol: string, currencyCode?: string): string {
  const code = (currencyCode || '').toUpperCase();
  if (code === 'INR' || symbol.endsWith('.NS') || symbol.endsWith('.BO')) return '₹';
  if (code === 'GBP' || code === 'GBp' || symbol.endsWith('.L')) return '£';
  if (code === 'EUR' || symbol.endsWith('.DE') || symbol.endsWith('.PA') || symbol.endsWith('.AS') || symbol.endsWith('.BR')) return '€';
  if (code === 'HKD' || symbol.endsWith('.HK')) return 'HK$';
  if (code === 'CNY' || symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return '¥';
  if (code === 'JPY' || symbol.endsWith('.T')) return '¥';
  if (code === 'USD') return '$';
  return '$';
}

export async function getQuote(symbol: string) {
  try {
    const quote: any = await yahooFinance.quote(symbol);
    const currency = quote.currency || (symbol.endsWith('.NS') ? 'INR' : 'USD');
    const currencySymbol = getCurrencySymbol(symbol, currency);

    return {
      symbol,
      name: quote.longName || quote.shortName || symbol,
      currency,
      currency_symbol: currencySymbol,
      exchange: quote.exchange || quote.fullExchangeName || 'UNKNOWN',
      current_price: quote.regularMarketPrice,
      open: quote.regularMarketOpen,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      prev_close: quote.regularMarketPreviousClose,
      change: quote.regularMarketChange,
      change_percent: quote.regularMarketChangePercent,
      fifty_two_week_high: quote.fiftyTwoWeekHigh,
      fifty_two_week_low: quote.fiftyTwoWeekLow,
      market_cap: quote.marketCap,
      market_open: quote.marketState === 'REGULAR',
      market_state: quote.marketState || 'CLOSED',
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
    const rawCandles = (result.quotes || [])
      .filter((q: any) => q.close != null && q.open != null && q.high != null && q.low != null)
      .map((q: any) => {
        const timeSec = Math.floor(new Date(q.date).getTime() / 1000);
        return {
          time: timeSec, // Unix timestamp in seconds required by TradingView Lightweight Charts
          isoTime: q.date instanceof Date ? q.date.toISOString() : new Date(q.date).toISOString(),
          open: Number(Number(q.open).toFixed(2)),
          high: Number(Number(q.high).toFixed(2)),
          low: Number(Number(q.low).toFixed(2)),
          close: Number(Number(q.close).toFixed(2)),
          volume: Number(q.volume || 0)
        };
      })
      .sort((a: any, b: any) => a.time - b.time);
    
    // Deduplicate timestamps to guarantee strictly increasing chronological series for Lightweight Charts
    const candles: any[] = [];
    const seenTimes = new Set<number>();
    for (const c of rawCandles) {
      if (!seenTimes.has(c.time)) {
        seenTimes.add(c.time);
        candles.push(c);
      }
    }
    
    return { symbol, period, candles };
  } catch (e) {
    throw new Error(`Failed to fetch history for ${symbol}: ${e}`);
  }
}

export interface AnalysisOptions {
  rsiPeriod?: number;
  macdFast?: number;
  macdSlow?: number;
  macdSignal?: number;
  bbPeriod?: number;
  bbStdDev?: number;
  ema20Period?: number;
  ema50Period?: number;
}

export async function getAnalysis(symbol: string, options: AnalysisOptions = {}) {
  try {
    const {
      rsiPeriod = 14,
      macdFast = 12,
      macdSlow = 26,
      macdSignal = 9,
      bbPeriod = 20,
      bbStdDev = 2,
      ema20Period = 20,
      ema50Period = 50
    } = options;

    const result: any = await yahooFinance.chart(symbol, {
      period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // ~6 months (125+ trading sessions)
      interval: '1d'
    });
    
    const validQuotes = (result.quotes || []).filter((q: any) => q.close != null && q.high != null && q.low != null);
    const closes = validQuotes.map((q: any) => Number(q.close));
    const highs = validQuotes.map((q: any) => Number(q.high));
    const lows = validQuotes.map((q: any) => Number(q.low));
    const timestamps = validQuotes.map((q: any) => Math.floor(new Date(q.date).getTime() / 1000));
    
    if (closes.length < 30) throw new Error("Not enough data for analysis (minimum 30 trading sessions required)");

    const rsi = RSI.calculate({ values: closes, period: rsiPeriod });
    const macd = MACD.calculate({ values: closes, fastPeriod: macdFast, slowPeriod: macdSlow, signalPeriod: macdSignal, SimpleMAOscillator: false, SimpleMASignal: false });
    const bb = BollingerBands.calculate({ values: closes, period: bbPeriod, stdDev: bbStdDev });
    const atr = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const adx = ADX.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const ema20 = EMA.calculate({ values: closes, period: ema20Period });
    const ema50 = closes.length >= ema50Period ? EMA.calculate({ values: closes, period: ema50Period }) : [];
    const ma20 = SMA.calculate({ values: closes, period: 20 });
    
    const latestRsi = rsi[rsi.length - 1];
    const latestMacd = macd[macd.length - 1];
    const latestBb = bb[bb.length - 1];
    const latestAtr = atr[atr.length - 1];
    const latestAdx = adx[adx.length - 1];

    // Compute overlay time-series arrays for chart overlay
    // Align EMA 20 with timestamps
    const ema20Offset = closes.length - ema20.length;
    const ema20Series = ema20.map((val, idx) => ({
      time: timestamps[idx + ema20Offset],
      value: Number(val.toFixed(2))
    }));

    // Align EMA 50 with timestamps
    const ema50Offset = closes.length - ema50.length;
    const ema50Series = ema50.map((val, idx) => ({
      time: timestamps[idx + ema50Offset],
      value: Number(val.toFixed(2))
    }));

    const signals: Record<string, string> = {};
    if (latestRsi > 70) signals.rsi = 'Overbought';
    else if (latestRsi < 30) signals.rsi = 'Oversold';
    else signals.rsi = 'Neutral';

    if (latestMacd?.MACD && latestMacd?.signal) {
      signals.macd = latestMacd.MACD > latestMacd.signal ? 'Bullish' : 'Bearish';
    }

    if (ema20.length > 0 && ema50.length > 0) {
      const lastEma20 = ema20[ema20.length - 1];
      const lastEma50 = ema50[ema50.length - 1];
      signals.trend = lastEma20 > lastEma50 ? 'Bullish Uptrend' : 'Bearish Downtrend';
    }

    return {
      symbol,
      rsi: latestRsi,
      rsi_period: rsiPeriod,
      macd: latestMacd?.MACD,
      macd_signal: latestMacd?.signal,
      macd_histogram: latestMacd?.histogram,
      bb_upper: latestBb?.upper,
      bb_middle: latestBb?.middle,
      bb_lower: latestBb?.lower,
      atr: latestAtr,
      adx: latestAdx?.adx,
      ema_20: ema20[ema20.length - 1],
      ema_50: ema50.length > 0 ? ema50[ema50.length - 1] : undefined,
      ma_20: ma20[ma20.length - 1],
      signals,
      ema20Series,
      ema50Series
    };
  } catch (e) {
    throw new Error(`Failed to run analysis for ${symbol}: ${e}`);
  }
}

export async function getSuggestion(symbol: string, options: AnalysisOptions = {}) {
  try {
    const quote = await getQuote(symbol);
    const analysis = await getAnalysis(symbol, options);
    
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
      reasoning.push(analysis.macd > analysis.macd_signal ? "MACD line above signal line (bullish momentum)" : "MACD line below signal line (bearish momentum)");
    }
    if (analysis.signals.trend) {
      reasoning.push(`EMA 20/50 indicates ${analysis.signals.trend}`);
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
