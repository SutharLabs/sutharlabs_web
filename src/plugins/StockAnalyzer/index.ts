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

export const KNOWN_US_TICKERS = new Set([
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'AMD', 'NFLX',
  'BRK-B', 'BRK.B', 'BRK-A', 'JPM', 'V', 'MA', 'DIS', 'INTC', 'CSCO', 'ADBE',
  'CRM', 'ORCL', 'QCOM', 'TXN', 'AVGO', 'COST', 'WMT', 'PG', 'JNJ', 'UNH',
  'HD', 'BAC', 'XOM', 'CVX', 'LLY', 'NKE', 'KO', 'PEP', 'ABBV', 'MRK',
  'PFE', 'T', 'VZ', 'PYPL', 'UBER', 'ABNB', 'COIN', 'PLTR', 'SNOW', 'BABA',
  'ARM', 'SMCI', 'PANW', 'CRWD', 'NOW', 'SQ', 'SHOP', 'SE', 'PDD', 'BIDU'
]);

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
      { symbol: '^NSEI',         name: 'NIFTY 50 Index', sector: 'Benchmark Index' },
      { symbol: '^BSESN',        name: 'BSE SENSEX Index', sector: 'Benchmark Index' },
      { symbol: '^NSEBANK',      name: 'NIFTY Bank Index', sector: 'Sectoral Index' },
      { symbol: '^CNXIT',        name: 'NIFTY IT Index', sector: 'Sectoral Index' },
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
      { symbol: 'TMCV.NS',       name: 'Tata Motors Limited', sector: 'Automobile' },
      { symbol: 'MARUTI.NS',     name: 'Maruti Suzuki India', sector: 'Automobile' },
      { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'NBFC' },
      { symbol: 'ATHERENERG.NS', name: 'Ather Energy Limited', sector: 'Automobile / EV' },
      { symbol: 'ETERNAL.NS',     name: 'Eternal / Zomato', sector: 'Quick Commerce & Food Tech' }
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
      { symbol: '^GSPC',  name: 'S&P 500 Index', sector: 'Benchmark Index' },
      { symbol: '^IXIC',  name: 'NASDAQ Composite Index', sector: 'Benchmark Index' },
      { symbol: '^DJI',   name: 'Dow Jones Industrial Average', sector: 'Benchmark Index' },
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

export interface StockSearchResult {
  symbol: string;        // e.g. "ATHERENERG.NS"
  displaySymbol: string; // e.g. "ATHERENERG (NSE)"
  cleanSymbol: string;   // e.g. "ATHERENERG"
  name: string;          // e.g. "Ather Energy Limited"
  exchange: string;      // e.g. "NSE"
  sector?: string;
  quoteType?: string;
}

export const INDEX_TICKER_MAP: Record<string, { name: string; displaySymbol: string; cleanSymbol: string; exchange: string; sector: string }> = {
  '^NSEI':    { name: 'NIFTY 50', displaySymbol: 'NIFTY 50 (NSE Index)', cleanSymbol: 'NIFTY 50', exchange: 'NSE', sector: 'Benchmark Index' },
  '^BSESN':   { name: 'BSE SENSEX', displaySymbol: 'SENSEX (BSE Index)', cleanSymbol: 'SENSEX', exchange: 'BSE', sector: 'Benchmark Index' },
  '^NSEBANK': { name: 'NIFTY Bank', displaySymbol: 'BANK NIFTY (NSE Index)', cleanSymbol: 'BANK NIFTY', exchange: 'NSE', sector: 'Sectoral Index' },
  '^CNXIT':   { name: 'NIFTY IT', displaySymbol: 'NIFTY IT (NSE Index)', cleanSymbol: 'NIFTY IT', exchange: 'NSE', sector: 'Sectoral Index' },
  '^CNXAUTO': { name: 'NIFTY Auto', displaySymbol: 'NIFTY AUTO (NSE Index)', cleanSymbol: 'NIFTY AUTO', exchange: 'NSE', sector: 'Sectoral Index' },
  '^GSPC':    { name: 'S&P 500', displaySymbol: 'S&P 500 (US Index)', cleanSymbol: 'S&P 500', exchange: 'US', sector: 'Benchmark Index' },
  '^IXIC':    { name: 'NASDAQ Composite', displaySymbol: 'NASDAQ (US Index)', cleanSymbol: 'NASDAQ', exchange: 'US', sector: 'Benchmark Index' },
  '^DJI':     { name: 'Dow Jones Industrial Average', displaySymbol: 'DOW JONES (US Index)', cleanSymbol: 'DOW JONES', exchange: 'US', sector: 'Benchmark Index' },
  '^FTSE':    { name: 'FTSE 100', displaySymbol: 'FTSE 100 (LSE Index)', cleanSymbol: 'FTSE 100', exchange: 'LSE', sector: 'Benchmark Index' },
  '^GDAXI':   { name: 'DAX Performance Index', displaySymbol: 'DAX (XETRA Index)', cleanSymbol: 'DAX', exchange: 'XETRA', sector: 'Benchmark Index' },
  '^N225':    { name: 'Nikkei 225', displaySymbol: 'NIKKEI 225 (TSE Index)', cleanSymbol: 'NIKKEI 225', exchange: 'TSE', sector: 'Benchmark Index' },
  '^HSI':     { name: 'Hang Seng Index', displaySymbol: 'HANG SENG (HKEX Index)', cleanSymbol: 'HANG SENG', exchange: 'HKEX', sector: 'Benchmark Index' }
};

export function formatTickerDisplay(rawSymbol: string, exchangeName?: string): { displaySymbol: string; cleanSymbol: string; exchange: string } {
  if (!rawSymbol) return { displaySymbol: '', cleanSymbol: '', exchange: '' };
  const sym = rawSymbol.trim();

  // Known index check
  const upper = sym.toUpperCase();
  if (INDEX_TICKER_MAP[upper]) {
    const idx = INDEX_TICKER_MAP[upper];
    return { displaySymbol: idx.displaySymbol, cleanSymbol: idx.cleanSymbol, exchange: idx.exchange };
  }

  // If already formatted like "ATHERENERG (NSE)" or "NIFTY 50 (NSE Index)"
  const parenMatch = sym.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    return { displaySymbol: sym, cleanSymbol: parenMatch[1].trim(), exchange: parenMatch[2].trim() };
  }

  // Any other index starting with ^
  if (sym.startsWith('^')) {
    const clean = sym.slice(1).toUpperCase();
    return { displaySymbol: `${clean} (INDEX)`, cleanSymbol: clean, exchange: 'INDEX' };
  }

  if (sym.endsWith('.NS')) {
    const clean = sym.replace(/\.NS$/i, '');
    return { displaySymbol: `${clean} (NSE)`, cleanSymbol: clean, exchange: 'NSE' };
  }
  if (sym.endsWith('.BO')) {
    const clean = sym.replace(/\.BO$/i, '');
    return { displaySymbol: `${clean} (BSE)`, cleanSymbol: clean, exchange: 'BSE' };
  }
  if (sym.endsWith('.L')) {
    const clean = sym.replace(/\.L$/i, '');
    return { displaySymbol: `${clean} (LSE)`, cleanSymbol: clean, exchange: 'LSE' };
  }
  if (sym.endsWith('.DE')) {
    const clean = sym.replace(/\.DE$/i, '');
    return { displaySymbol: `${clean} (XETRA)`, cleanSymbol: clean, exchange: 'XETRA' };
  }
  if (sym.endsWith('.PA')) {
    const clean = sym.replace(/\.PA$/i, '');
    return { displaySymbol: `${clean} (Euronext)`, cleanSymbol: clean, exchange: 'Euronext' };
  }
  if (sym.endsWith('.AS')) {
    const clean = sym.replace(/\.AS$/i, '');
    return { displaySymbol: `${clean} (Euronext)`, cleanSymbol: clean, exchange: 'Euronext' };
  }
  if (sym.endsWith('.HK')) {
    const clean = sym.replace(/\.HK$/i, '');
    return { displaySymbol: `${clean} (HKEX)`, cleanSymbol: clean, exchange: 'HKEX' };
  }
  if (sym.endsWith('.SS')) {
    const clean = sym.replace(/\.SS$/i, '');
    return { displaySymbol: `${clean} (SSE)`, cleanSymbol: clean, exchange: 'SSE' };
  }
  if (sym.endsWith('.SZ')) {
    const clean = sym.replace(/\.SZ$/i, '');
    return { displaySymbol: `${clean} (SZSE)`, cleanSymbol: clean, exchange: 'SZSE' };
  }
  if (sym.endsWith('.T')) {
    const clean = sym.replace(/\.T$/i, '');
    return { displaySymbol: `${clean} (TSE)`, cleanSymbol: clean, exchange: 'TSE' };
  }

  // Default e.g. US stocks like AAPL, MSFT, NVDA
  const exch = (exchangeName && exchangeName !== 'UNKNOWN') ? exchangeName : 'NASDAQ';
  return { displaySymbol: `${sym} (${exch})`, cleanSymbol: sym, exchange: exch };
}

export function normalizeTicker(symbol: string, defaultRegion: string = 'IN'): string {
  if (!symbol) return '';
  let clean = symbol.trim();

  // 0. Direct index symbol starting with ^
  if (clean.startsWith('^')) {
    return clean.toUpperCase();
  }

  // If formatted like "NIFTY 50 (NSE Index)" or "SENSEX (BSE Index)"
  if (/\s*\((.*?Index.*?)\)$/i.test(clean)) {
    const base = clean.replace(/\s*\((.*?Index.*?)\)$/i, '').trim().toUpperCase();
    if (/^(NIFTY\s*50|NIFTY50|NIFTY)$/i.test(base)) return '^NSEI';
    if (/^(SENSEX|BSE\s*SENSEX)$/i.test(base)) return '^BSESN';
    if (/^(BANK\s*NIFTY|BANKNIFTY|NIFTY\s*BANK)$/i.test(base)) return '^NSEBANK';
    if (/^(NIFTY\s*IT|CNXIT)$/i.test(base)) return '^CNXIT';
    if (/^(S&P\s*500|SP500|SPX)$/i.test(base)) return '^GSPC';
    if (/^(NASDAQ|NASDAQ\s*100|NDX|COMPOSITE)$/i.test(base)) return '^IXIC';
    if (/^(DOW|DOW\s*JONES|DJI)$/i.test(base)) return '^DJI';
    return `^${base}`;
  }

  // 1. If symbol ends with (NSE), (BSE), etc.
  if (/\s*\((NSE)\)$/i.test(clean)) {
    const base = clean.replace(/\s*\((NSE)\)$/i, '').trim().toUpperCase();
    if (/^(NIFTY\s*50|NIFTY50|NIFTY)$/i.test(base)) return '^NSEI';
    if (/^(BANK\s*NIFTY|BANKNIFTY|NIFTY\s*BANK)$/i.test(base)) return '^NSEBANK';
    return base + '.NS';
  }
  if (/\s*\((BSE|BOMBAY)\)$/i.test(clean)) {
    const base = clean.replace(/\s*\((BSE|BOMBAY)\)$/i, '').trim().toUpperCase();
    if (/^(SENSEX|BSE\s*SENSEX)$/i.test(base)) return '^BSESN';
    return base + '.BO';
  }
  if (/\s*\((LSE)\)$/i.test(clean)) {
    return clean.replace(/\s*\((LSE)\)$/i, '').trim().toUpperCase() + '.L';
  }
  if (/\s*\((XETRA|DAX)\)$/i.test(clean)) {
    return clean.replace(/\s*\((XETRA|DAX)\)$/i, '').trim().toUpperCase() + '.DE';
  }
  if (/\s*\((EURONEXT|PARIS)\)$/i.test(clean)) {
    return clean.replace(/\s*\((EURONEXT|PARIS)\)$/i, '').trim().toUpperCase() + '.PA';
  }
  if (/\s*\((HKEX)\)$/i.test(clean)) {
    return clean.replace(/\s*\((HKEX)\)$/i, '').trim().toUpperCase() + '.HK';
  }
  if (/\s*\((SSE)\)$/i.test(clean)) {
    return clean.replace(/\s*\((SSE)\)$/i, '').trim().toUpperCase() + '.SS';
  }
  if (/\s*\((SZSE)\)$/i.test(clean)) {
    return clean.replace(/\s*\((SZSE)\)$/i, '').trim().toUpperCase() + '.SZ';
  }
  if (/\s*\((TSE)\)$/i.test(clean)) {
    return clean.replace(/\s*\((TSE)\)$/i, '').trim().toUpperCase() + '.T';
  }
  if (/\s*\((NASDAQ|NYSE|NYSE\/NASDAQ|AMEX|OTC)\)$/i.test(clean)) {
    return clean.replace(/\s*\((NASDAQ|NYSE|NYSE\/NASDAQ|AMEX|OTC)\)$/i, '').trim().toUpperCase();
  }

  // 2. Known Index and Special Aliases
  if (/^(NIFTY\s*50|NIFTY50|NIFTY)$/i.test(clean)) return '^NSEI';
  if (/^(SENSEX|BSE\s*SENSEX)$/i.test(clean)) return '^BSESN';
  if (/^(BANK\s*NIFTY|BANKNIFTY|NIFTY\s*BANK)$/i.test(clean)) return '^NSEBANK';
  if (/^(NIFTY\s*IT|CNXIT)$/i.test(clean)) return '^CNXIT';
  if (/^(NIFTY\s*AUTO)$/i.test(clean)) return '^CNXAUTO';
  if (/^(S&P\s*500|SP500|SPX)$/i.test(clean)) return '^GSPC';
  if (/^(NASDAQ|NASDAQ\s*100|NDX|COMPOSITE)$/i.test(clean)) return '^IXIC';
  if (/^(DOW|DOW\s*JONES|DJI)$/i.test(clean)) return '^DJI';
  if (/^(FTSE|FTSE\s*100)$/i.test(clean)) return '^FTSE';
  if (/^(DAX|GDAXI)$/i.test(clean)) return '^GDAXI';
  if (/^(NIKKEI|NIKKEI\s*225)$/i.test(clean)) return '^N225';
  if (/^(HANG\s*SENG|HSI)$/i.test(clean)) return '^HSI';

  // Known special name aliases (must check before generic dot suffix)
  if (/^ATHER/i.test(clean)) return 'ATHERENERG.NS';
  if (/^ZOMATO/i.test(clean)) return 'ETERNAL.NS';
  if (/^TATAMOTORS(\.NS)?$/i.test(clean)) return 'TMCV.NS';

  // 3. Already has standard exchange dot suffix
  if (/\.(NS|BO|L|DE|PA|AS|HK|SS|SZ|T)$/i.test(clean)) {
    return clean.toUpperCase();
  }

  // 4. Known US tickers (do not append .NS)
  if (KNOWN_US_TICKERS.has(clean.toUpperCase())) {
    return clean.toUpperCase();
  }

  // 5. If defaultRegion is IN and no dot is present, append .NS
  if (defaultRegion === 'IN') {
    return clean.toUpperCase() + '.NS';
  }

  return clean.toUpperCase();
}

export async function searchStocks(query: string, region: string = 'IN'): Promise<StockSearchResult[]> {
  const qClean = (query || '').trim();
  if (!qClean) return [];

  const results: StockSearchResult[] = [];
  const seenSymbols = new Set<string>();
  const qLower = qClean.toLowerCase();
  const fuzzyQ = qLower.length > 4 ? qLower.slice(0, -1) : qLower;

  // 0. Instant benchmark index lookup
  for (const [sym, info] of Object.entries(INDEX_TICKER_MAP)) {
    const symMatch = sym.toLowerCase().includes(qLower) || sym.slice(1).toLowerCase().includes(qLower);
    const nameMatch = info.name.toLowerCase().includes(qLower);
    const cleanMatch = info.cleanSymbol.toLowerCase().includes(qLower);
    if (symMatch || nameMatch || cleanMatch) {
      results.push({
        symbol: sym,
        displaySymbol: info.displaySymbol,
        cleanSymbol: info.cleanSymbol,
        name: info.name,
        exchange: info.exchange,
        sector: info.sector,
        quoteType: 'INDEX'
      });
      seenSymbols.add(sym);
    }
  }

  // 1. Instant local index lookup
  const allUniverseStocks = Object.values(MARKET_UNIVERSES).flatMap(u => u.stocks);

  for (const s of allUniverseStocks) {
    if (seenSymbols.has(s.symbol)) continue;
    const sSymClean = s.symbol.replace(/\.(NS|BO|L|DE|PA|AS|HK|SS|SZ|T)$/i, '').replace(/^\^/, '').toLowerCase();
    const sNameLower = s.name.toLowerCase();

    if (
      sSymClean.includes(qLower) || sNameLower.includes(qLower) ||
      sSymClean.includes(fuzzyQ) || sNameLower.includes(fuzzyQ)
    ) {
      const formatted = formatTickerDisplay(s.symbol);
      results.push({
        symbol: s.symbol,
        displaySymbol: formatted.displaySymbol,
        cleanSymbol: formatted.cleanSymbol,
        name: s.name,
        exchange: formatted.exchange,
        sector: s.sector
      });
      seenSymbols.add(s.symbol);
    }
  }

  // 2. Live search from Yahoo Finance Search API
  try {
    const fetchYahoo = async (term: string) => {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(term)}&quotesCount=15&newsCount=0`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) return [];
      const json: any = await res.json();
      return json.quotes || [];
    };

    let quotes = await fetchYahoo(qClean);

    // If no quotes and query is > 4 chars, try fuzzy search (e.g. "Athere" -> "Ather")
    if (quotes.length === 0 && qClean.length > 4) {
      quotes = await fetchYahoo(qClean.slice(0, -1));
    }

    for (const item of quotes) {
      if (!item.symbol || seenSymbols.has(item.symbol)) continue;

      const formatted = formatTickerDisplay(item.symbol, item.exchDisp || item.exchange);
      const name = item.longname || item.shortname || formatted.cleanSymbol;

      results.push({
        symbol: item.symbol,
        displaySymbol: formatted.displaySymbol,
        cleanSymbol: formatted.cleanSymbol,
        name,
        exchange: formatted.exchange,
        sector: item.sectorDisp || item.sector || item.industryDisp || 'Equity',
        quoteType: item.quoteType
      });
      seenSymbols.add(item.symbol);
    }
  } catch (err) {
    console.error('Yahoo search lookup error:', err);
  }

  // 3. Priority Sort:
  // If region === 'IN', rank NSE/BSE first;
  // If region === 'US', rank NASDAQ/NYSE first.
  results.sort((a, b) => {
    if (region === 'IN') {
      const aIsIndian = a.exchange === 'NSE' || a.exchange === 'BSE';
      const bIsIndian = b.exchange === 'NSE' || b.exchange === 'BSE';
      if (aIsIndian && !bIsIndian) return -1;
      if (!aIsIndian && bIsIndian) return 1;
    }
    const aStarts = a.name.toLowerCase().startsWith(qLower) || a.cleanSymbol.toLowerCase().startsWith(qLower);
    const bStarts = b.name.toLowerCase().startsWith(qLower) || b.cleanSymbol.toLowerCase().startsWith(qLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });

  return results.slice(0, 15);
}

export function getCurrencySymbol(symbol: string, currencyCode?: string): string {
  const code = (currencyCode || '').toUpperCase();
  if (code === 'INR' || symbol.startsWith('^NSE') || symbol.startsWith('^BSE') || symbol.startsWith('^CNX') || symbol.endsWith('.NS') || symbol.endsWith('.BO')) return '₹';
  if (code === 'GBP' || code === 'GBp' || symbol.endsWith('.L') || symbol === '^FTSE') return '£';
  if (code === 'EUR' || symbol.endsWith('.DE') || symbol.endsWith('.PA') || symbol.endsWith('.AS') || symbol.endsWith('.BR') || symbol === '^GDAXI') return '€';
  if (code === 'HKD' || symbol.endsWith('.HK') || symbol === '^HSI') return 'HK$';
  if (code === 'CNY' || symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return '¥';
  if (code === 'JPY' || symbol.endsWith('.T') || symbol === '^N225') return '¥';
  if (code === 'USD') return '$';
  return '$';
}

export async function getQuote(symbol: string, defaultRegion: string = 'IN') {
  let normalizedSymbol = normalizeTicker(symbol, defaultRegion);
  try {
    let quote: any;
    try {
      quote = await yahooFinance.quote(normalizedSymbol);
    } catch (primaryErr) {
      // Smart cross-market recovery:
      // 1. If normalizedSymbol ends with .NS but failed, try without .NS (e.g. US or international stock)
      if (normalizedSymbol.endsWith('.NS')) {
        const cleanSym = normalizedSymbol.replace(/\.NS$/i, '');
        try {
          quote = await yahooFinance.quote(cleanSym);
          if (quote) normalizedSymbol = cleanSym;
        } catch {}
      }
      // 2. If normalizedSymbol had no dot and failed, try with .NS
      else if (!normalizedSymbol.includes('.')) {
        try {
          const withNs = `${normalizedSymbol}.NS`;
          quote = await yahooFinance.quote(withNs);
          if (quote) normalizedSymbol = withNs;
        } catch {}
      }

      if (!quote) throw primaryErr;
    }

    if (!quote) {
      throw new Error(`Quote not available for ${normalizedSymbol}`);
    }

    const currency = quote.currency || (normalizedSymbol.endsWith('.NS') ? 'INR' : 'USD');
    const currencySymbol = getCurrencySymbol(normalizedSymbol, currency);
    const formatted = formatTickerDisplay(normalizedSymbol, quote.exchange || quote.fullExchangeName);

    const currentPrice = quote.regularMarketPrice ?? quote.price ?? quote.ask ?? quote.bid ?? quote.regularMarketPreviousClose ?? 0;
    const prevClose = quote.regularMarketPreviousClose ?? quote.previousClose ?? currentPrice;
    const high = quote.regularMarketDayHigh ?? quote.dayHigh ?? quote.high ?? Math.max(currentPrice, prevClose);
    const low = quote.regularMarketDayLow ?? quote.dayLow ?? quote.low ?? Math.min(currentPrice, prevClose);
    const open = quote.regularMarketOpen ?? quote.open ?? prevClose;
    const change = quote.regularMarketChange ?? (currentPrice - prevClose);
    const changePercent = quote.regularMarketChangePercent ?? (prevClose > 0 ? ((change / prevClose) * 100) : 0);

    return {
      symbol: normalizedSymbol,
      display_symbol: formatted.displaySymbol,
      clean_symbol: formatted.cleanSymbol,
      name: quote.longName || quote.shortName || formatted.cleanSymbol,
      currency,
      currency_symbol: currencySymbol,
      exchange: formatted.exchange,
      current_price: currentPrice,
      open,
      high,
      low,
      volume: quote.regularMarketVolume ?? quote.volume ?? 0,
      prev_close: prevClose,
      change,
      change_percent: changePercent,
      fifty_two_week_high: quote.fiftyTwoWeekHigh ?? high,
      fifty_two_week_low: quote.fiftyTwoWeekLow ?? low,
      market_cap: quote.marketCap ?? 0,
      market_open: quote.marketState === 'REGULAR',
      market_state: quote.marketState || 'CLOSED',
    };
  } catch (e) {
    throw new Error(`Failed to fetch quote for ${normalizedSymbol}: ${e}`);
  }
}

export async function getHistory(
  symbol: string,
  period: string = '5d',
  interval: any = '15m',
  defaultRegion: string = 'IN'
) {
  const normalizedSymbol = normalizeTicker(symbol, defaultRegion);
  try {
    const rawInterval = (interval || '').toString().toLowerCase();
    const is4h = rawInterval === '4h';
    // For 4h, request 1h candles from Yahoo and aggregate them
    const yahooInterval = is4h ? '1h' : (rawInterval || '15m');

    // Yahoo Finance timeframe limits:
    // 1m: max 7 days
    // 5m, 15m, 30m: max 60 days
    // 1h (60m): max 730 days
    // 1d, 1wk, 1mo: multi-year
    let period1: Date;
    if (yahooInterval === '1m') {
      period1 = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    } else if (['2m', '5m', '15m', '30m', '90m'].includes(yahooInterval)) {
      period1 = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    } else if (['1h', '60m'].includes(yahooInterval)) {
      period1 = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    } else {
      const pMap: Record<string, number> = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        '5Y': 5 * 365,
        'ALL': 25 * 365,
        'MAX': 25 * 365
      };
      const days = pMap[period] || (yahooInterval === '1d' ? 365 : 7);
      period1 = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    const queryOpts: any = {
      period1,
      interval: yahooInterval
    };

    const result: any = await yahooFinance.chart(normalizedSymbol, queryOpts);
    let rawCandles = (result.quotes || [])
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

    // If 4h interval requested, aggregate 1h candles into 4-hour OHLCV buckets
    if (is4h && rawCandles.length > 0) {
      const aggregated4h: any[] = [];
      const bucketSec = 4 * 3600; // 4 hours in seconds
      let currentBucketStart = Math.floor(rawCandles[0].time / bucketSec) * bucketSec;
      let bucketGroup: any[] = [];

      for (const c of rawCandles) {
        const bucketStart = Math.floor(c.time / bucketSec) * bucketSec;
        if (bucketStart === currentBucketStart) {
          bucketGroup.push(c);
        } else {
          if (bucketGroup.length > 0) {
            aggregated4h.push({
              time: currentBucketStart,
              isoTime: new Date(currentBucketStart * 1000).toISOString(),
              open: bucketGroup[0].open,
              high: Math.max(...bucketGroup.map((b: any) => b.high)),
              low: Math.min(...bucketGroup.map((b: any) => b.low)),
              close: bucketGroup[bucketGroup.length - 1].close,
              volume: bucketGroup.reduce((acc: number, b: any) => acc + (b.volume || 0), 0)
            });
          }
          currentBucketStart = bucketStart;
          bucketGroup = [c];
        }
      }
      if (bucketGroup.length > 0) {
        aggregated4h.push({
          time: currentBucketStart,
          isoTime: new Date(currentBucketStart * 1000).toISOString(),
          open: bucketGroup[0].open,
          high: Math.max(...bucketGroup.map((b: any) => b.high)),
          low: Math.min(...bucketGroup.map((b: any) => b.low)),
          close: bucketGroup[bucketGroup.length - 1].close,
          volume: bucketGroup.reduce((acc: number, b: any) => acc + (b.volume || 0), 0)
        });
      }
      rawCandles = aggregated4h;
    }

    // Deduplicate timestamps to guarantee strictly increasing chronological series for Lightweight Charts
    const candles: any[] = [];
    const seenTimes = new Set<number>();
    for (const c of rawCandles) {
      if (!seenTimes.has(c.time)) {
        seenTimes.add(c.time);
        candles.push(c);
      }
    }

    const formatted = formatTickerDisplay(normalizedSymbol);
    return { symbol: normalizedSymbol, display_symbol: formatted.displaySymbol, period, interval: rawInterval || '15m', candles };
  } catch (e) {
    throw new Error(`Failed to fetch history for ${normalizedSymbol}: ${e}`);
  }
}

export interface AnalysisOptions {
  region?: string;
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
  const normalizedSymbol = normalizeTicker(symbol, options.region || 'IN');
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

    const result: any = await yahooFinance.chart(normalizedSymbol, {
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

    const formatted = formatTickerDisplay(normalizedSymbol);
    return {
      symbol: normalizedSymbol,
      display_symbol: formatted.displaySymbol,
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
    throw new Error(`Failed to run analysis for ${normalizedSymbol}: ${e}`);
  }
}

export async function getSuggestion(symbol: string, options: AnalysisOptions = {}) {
  const normalizedSymbol = normalizeTicker(symbol, options.region || 'IN');
  try {
    const quote = await getQuote(normalizedSymbol, options.region || 'IN');
    const analysis = await getAnalysis(normalizedSymbol, options);
    
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

    const formatted = formatTickerDisplay(normalizedSymbol);
    return {
      symbol: normalizedSymbol,
      display_symbol: formatted.displaySymbol,
      action: confidence > 0.3 ? action : 'HOLD',
      confidence: Math.min(confidence, 1.0),
      target_price: target,
      stop_loss: stop,
      risk_reward_ratio: rr,
      reasoning
    };
  } catch (e) {
    throw new Error(`Failed to get suggestion for ${normalizedSymbol}: ${e}`);
  }
}
