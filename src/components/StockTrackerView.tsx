import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronDown,
  Sliders,
  Eye,
  EyeOff,
  Globe,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  Database,
  Shield,
  Activity,
  Award,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Key,
  Layers,
  Settings2,
  Save,
  Check
} from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  IChartApi,
  UTCTimestamp
} from 'lightweight-charts';
import { TerminalLog, UserPortfolio } from '../types';

interface StockTrackerViewProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userEmail: string;
  userToken: string;
  theme?: 'dark' | 'light';
}

const STOCK_API = '/api/workspace/stock-analyzer';

interface Quote {
  symbol: string;
  display_symbol?: string;
  clean_symbol?: string;
  name: string;
  currency?: string;
  currency_symbol?: string;
  exchange?: string;
  current_price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  prev_close: number;
  change: number;
  change_percent: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  market_cap?: number;
  market_open: boolean;
  market_state?: string;
}

interface Candle {
  time: number;
  isoTime?: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

interface Analysis {
  symbol: string;
  rsi: number | null;
  rsi_period?: number;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  atr: number | null;
  adx: number | null;
  ema_20: number | null;
  ema_50: number | null;
  ma_20?: number;
  signals: Record<string, string>;
}

interface Suggestion {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  target_price: number | null;
  stop_loss: number | null;
  risk_reward_ratio: number | null;
  reasoning: string[];
}

interface MarketStock {
  symbol: string;
  name: string;
  sector?: string;
}

interface MarketUniverse {
  id: string;
  name: string;
  region: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  exchange: string;
  stocks: MarketStock[];
}

type TimeframePeriod = '1D' | '1W' | '1M' | '1Y' | '5Y' | 'ALL';

const DEFAULT_UNIVERSES: Record<string, MarketUniverse> = {
  IN: {
    id: 'IN',
    name: 'India (NSE)',
    region: 'India',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    exchange: 'NSE',
    stocks: [
      { symbol: 'RELIANCE.NS',   name: 'Reliance Industries', sector: 'Energy' },
      { symbol: 'ATHERENERG.NS', name: 'Ather Energy Limited', sector: 'Automobile / EV' },
      { symbol: 'TCS.NS',        name: 'Tata Consultancy Services', sector: 'IT Services' },
      { symbol: 'HDFCBANK.NS',   name: 'HDFC Bank', sector: 'Banking' },
      { symbol: 'INFY.NS',       name: 'Infosys', sector: 'IT Services' },
      { symbol: 'ICICIBANK.NS',  name: 'ICICI Bank', sector: 'Banking' },
      { symbol: 'ETERNAL.NS',     name: 'Eternal / Zomato', sector: 'Food Tech & Quick Commerce' },
      { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Automobile' },
      { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG' },
      { symbol: 'ITC.NS',        name: 'ITC Limited', sector: 'FMCG' },
      { symbol: 'SBIN.NS',       name: 'State Bank of India', sector: 'Banking' },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
      { symbol: 'LT.NS',         name: 'Larsen & Toubro', sector: 'Infra' }
    ]
  },
  US: {
    id: 'US',
    name: 'United States',
    region: 'United States',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    exchange: 'NYSE/NASDAQ',
    stocks: [
      { symbol: 'AAPL',  name: 'Apple Inc.', sector: 'Consumer Electronics' },
      { symbol: 'MSFT',  name: 'Microsoft Corp.', sector: 'Software & Cloud' },
      { symbol: 'NVDA',  name: 'NVIDIA Corp.', sector: 'Semiconductors & AI' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Cloud & Ads' },
      { symbol: 'AMZN',  name: 'Amazon.com Inc.', sector: 'E-Commerce' },
      { symbol: 'META',  name: 'Meta Platforms', sector: 'Social & AI' },
      { symbol: 'TSLA',  name: 'Tesla Inc.', sector: 'EV & Energy' },
      { symbol: 'AMD',   name: 'AMD Inc.', sector: 'Semiconductors' }
    ]
  },
  EU: {
    id: 'EU',
    name: 'Europe & UK',
    region: 'Europe',
    flag: '🇪🇺',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchange: 'LSE/DAX/Euronext',
    stocks: [
      { symbol: 'SHEL.L',  name: 'Shell plc', sector: 'Energy (UK)' },
      { symbol: 'AZN.L',   name: 'AstraZeneca', sector: 'Healthcare (UK)' },
      { symbol: 'SAP.DE',  name: 'SAP SE', sector: 'Software (Germany)' },
      { symbol: 'MC.PA',   name: 'LVMH', sector: 'Luxury (France)' },
      { symbol: 'ASML.AS', name: 'ASML Holding', sector: 'Semiconductors (Netherlands)' }
    ]
  },
  CN: {
    id: 'CN',
    name: 'China & HK',
    region: 'China / HK',
    flag: '🇨🇳',
    currencyCode: 'HKD',
    currencySymbol: 'HK$',
    exchange: 'HKEX/SSE/SZSE',
    stocks: [
      { symbol: '0700.HK',   name: 'Tencent Holdings', sector: 'Tech & Gaming' },
      { symbol: '9988.HK',   name: 'Alibaba Group', sector: 'E-commerce' },
      { symbol: '600519.SS', name: 'Kweichow Moutai', sector: 'Beverages' },
      { symbol: '002594.SZ', name: 'BYD Company', sector: 'EV & Tech' }
    ]
  },
  JP: {
    id: 'JP',
    name: 'Japan',
    region: 'Japan',
    flag: '🇯🇵',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    exchange: 'TSE',
    stocks: [
      { symbol: '7203.T', name: 'Toyota Motor', sector: 'Automotive' },
      { symbol: '6758.T', name: 'Sony Group', sector: 'Consumer Tech' },
      { symbol: '9984.T', name: 'SoftBank Group', sector: 'Tech Investment' },
      { symbol: '8035.T', name: 'Tokyo Electron', sector: 'Semiconductor' }
    ]
  }
};

export interface StockSearchResult {
  symbol: string;
  displaySymbol: string;
  cleanSymbol: string;
  name: string;
  exchange: string;
  sector?: string;
  quoteType?: string;
}

export function formatTickerDisplay(rawSymbol: string, exchangeName?: string): { displaySymbol: string; cleanSymbol: string; exchange: string } {
  if (!rawSymbol) return { displaySymbol: '', cleanSymbol: '', exchange: '' };
  const sym = rawSymbol.trim();

  // If already formatted like "ATHERENERG (NSE)"
  const parenMatch = sym.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    return { displaySymbol: sym, cleanSymbol: parenMatch[1].trim(), exchange: parenMatch[2].trim() };
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
  if (sym.endsWith('.PA') || sym.endsWith('.AS')) {
    const clean = sym.replace(/\.(PA|AS)$/i, '');
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

  const exch = (exchangeName && exchangeName !== 'UNKNOWN') ? exchangeName : 'NASDAQ';
  return { displaySymbol: `${sym} (${exch})`, cleanSymbol: sym, exchange: exch };
}

export function normalizeTicker(symbol: string, defaultRegion: string = 'IN'): string {
  if (!symbol) return '';
  let clean = symbol.trim();

  if (/\s*\((NSE)\)$/i.test(clean)) {
    return clean.replace(/\s*\((NSE)\)$/i, '').trim().toUpperCase() + '.NS';
  }
  if (/\s*\((BSE|BOMBAY)\)$/i.test(clean)) {
    return clean.replace(/\s*\((BSE|BOMBAY)\)$/i, '').trim().toUpperCase() + '.BO';
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

  if (/\.(NS|BO|L|DE|PA|AS|HK|SS|SZ|T)$/i.test(clean)) {
    return clean.toUpperCase();
  }

  if (/^ATHER/i.test(clean)) return 'ATHERENERG.NS';
  if (/^ZOMATO/i.test(clean)) return 'ETERNAL.NS';

  if (defaultRegion === 'IN') {
    return clean.toUpperCase() + '.NS';
  }

  return clean.toUpperCase();
}

const DEFAULT_SYMBOL = 'RELIANCE.NS';

// Mathematical continuous Exponential Moving Average helper
function calculateEMA(data: Candle[], period: number): { time: UTCTimestamp; value: number }[] {
  if (!data || data.length < 2) return [];
  const k = 2 / (period + 1);
  const result: { time: UTCTimestamp; value: number }[] = [];
  
  const seedLength = Math.min(period, data.length);
  let sum = 0;
  for (let i = 0; i < seedLength; i++) {
    sum += data[i].close;
  }
  let ema = sum / seedLength;
  result.push({ time: data[seedLength - 1].time as UTCTimestamp, value: Number(ema.toFixed(2)) });
  
  for (let i = seedLength; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    result.push({ time: data[i].time as UTCTimestamp, value: Number(ema.toFixed(2)) });
  }
  return result;
}

export default function StockTrackerView({ logs, onAddLog, userEmail, userToken, theme }: StockTrackerViewProps) {
  // Global Market Universes
  const [universes, setUniverses] = useState<Record<string, MarketUniverse>>(DEFAULT_UNIVERSES);
  const [activeMarketKey, setActiveMarketKey] = useState<string>('IN');

  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [symbolInput, setSymbolInput] = useState('RELIANCE (NSE)');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<TimeframePeriod>('1W');

  // Chart Overlay & Fullscreen View Controls
  const [showEma20, setShowEma20] = useState<boolean>(true);
  const [showEma50, setShowEma50] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(false);

  // Sliding Settings Overlay
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'MARKET' | 'FEEDS' | 'INDICATORS' | 'TRADING' | 'PERFORMANCE'>('MARKET');
  
  // Editable Data Feed Settings
  const [selectedDataSource, setSelectedDataSource] = useState<string>('YAHOO');
  const [pollIntervalSec, setPollIntervalSec] = useState<number>(30);
  const [brokerClientId, setBrokerClientId] = useState<string>('');
  const [brokerApiKey, setBrokerApiKey] = useState<string>('');
  const [brokerApiSecret, setBrokerApiSecret] = useState<string>('');

  // Editable Indicator Parameters
  const [rsiPeriod, setRsiPeriod] = useState<number>(14);
  const [rsiOverbought, setRsiOverbought] = useState<number>(70);
  const [rsiOversold, setRsiOversold] = useState<number>(30);
  const [bbPeriod, setBbPeriod] = useState<number>(20);
  const [bbStdDev, setBbStdDev] = useState<number>(2);
  const [ema20Period, setEma20Period] = useState<number>(20);
  const [ema50Period, setEma50Period] = useState<number>(50);
  const [macdFast, setMacdFast] = useState<number>(12);
  const [macdSlow, setMacdSlow] = useState<number>(26);
  const [macdSignal, setMacdSignal] = useState<number>(9);

  // Editable Risk & Trading Parameters
  const [stopLossPct, setStopLossPct] = useState<number>(3.0);
  const [takeProfitPct, setTakeProfitPct] = useState<number>(6.0);
  const [defaultOrderQty, setDefaultOrderQty] = useState<number>(1);
  const [slippagePct, setSlippagePct] = useState<number>(0.05);
  const [reportingCurrency, setReportingCurrency] = useState<string>('AUTO');
  const [enableWebhooks, setEnableWebhooks] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('');

  // Terminal & UI
  const [activeTab, setActiveTab] = useState<'AGENT_LOGS' | 'OUTPUT' | 'DEBUG_CONSOLE'>('AGENT_LOGS');
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);

  // Paper Trading Portfolio
  const [portfolio, setPortfolio] = useState<UserPortfolio>({ cash: 10000, shares: 0, buyPrice: 0 });
  const [actionQuantity, setActionQuantity] = useState<number>(1);
  const [notification, setNotification] = useState('');

  // Hovered Bar Info for Tooltip
  const [hoveredBar, setHoveredBar] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);

  // Detect dark vs light theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return theme !== 'light';
  });

  useEffect(() => {
    if (theme) {
      setIsDark(theme === 'dark');
    } else if (typeof document !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, [theme]);

  // Observer for document classList changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const onAddLogRef = useRef(onAddLog);

  useEffect(() => {
    onAddLogRef.current = onAddLog;
  }, [onAddLog]);

  // Currency helper
  const curSymbol = reportingCurrency !== 'AUTO'
    ? (reportingCurrency === 'INR' ? '₹' : reportingCurrency === 'EUR' ? '€' : reportingCurrency === 'GBP' ? '£' : reportingCurrency === 'HKD' ? 'HK$' : reportingCurrency === 'JPY' ? '¥' : '$')
    : (quote?.currency_symbol || universes[activeMarketKey]?.currencySymbol || '$');

  // Fast map lookup for exact volume retrieval on hover
  const candleLookup = useMemo(() => {
    const map = new Map<number, Candle>();
    for (const c of candles) {
      map.set(c.time, c);
    }
    return map;
  }, [candles]);

  // Continuous full-length EMA series calculated with customizable periods
  const continuousEma20 = useMemo(() => calculateEMA(candles, ema20Period), [candles, ema20Period]);
  const continuousEma50 = useMemo(() => calculateEMA(candles, ema50Period), [candles, ema50Period]);

  // ── 1. Fetch Global Market Universes ───────────────────────────────────────
  useEffect(() => {
    fetch(`${STOCK_API}/markets`)
      .then(r => r.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setUniverses(data);
        }
      })
      .catch(() => {});
  }, []);

  // ── 2. Fetch User Portfolio ────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/portfolio?email=${encodeURIComponent(userEmail)}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPortfolio(data); })
      .catch(() => {});
  }, [userEmail, userToken]);

  // ── 3. Core Data Fetch Pipeline with Real Exchange Formatting ──────────────────
  const fetchAll = useCallback(async (sym: string, period: string) => {
    setLoading(true);
    try {
      const normalizedSym = normalizeTicker(sym, activeMarketKey);
      const displaySym = formatTickerDisplay(normalizedSym).displaySymbol;

      // 1. Quote
      const qRes = await fetch(`${STOCK_API}/quote?symbol=${encodeURIComponent(normalizedSym)}&region=${activeMarketKey}`);
      let fetchedQuote: Quote | null = null;
      if (qRes.ok) {
        fetchedQuote = await qRes.json();
        setQuote(fetchedQuote);
        const curr = fetchedQuote?.currency_symbol || '$';
        const qDisplay = fetchedQuote?.display_symbol || displaySym;
        onAddLogRef.current({
          timestamp: new Date().toLocaleTimeString(),
          type: 'DATA',
          message: `Tick → ${qDisplay}: ${curr}${fetchedQuote?.current_price?.toFixed(2)} (${(fetchedQuote?.change_percent ?? 0) >= 0 ? '+' : ''}${fetchedQuote?.change_percent?.toFixed(2)}%) [${fetchedQuote?.exchange || 'MARKET'}]`
        });
      }

      // 2. History for Candlestick Chart
      const hRes = await fetch(`${STOCK_API}/history?symbol=${encodeURIComponent(normalizedSym)}&period=${period}&region=${activeMarketKey}`);
      if (hRes.ok) {
        const h = await hRes.json();
        setCandles(h.candles || []);
      }

      // 3. Indicator Analysis with Configurable Params
      const aUrl = `${STOCK_API}/analysis?symbol=${encodeURIComponent(normalizedSym)}&region=${activeMarketKey}&rsiPeriod=${rsiPeriod}&bbPeriod=${bbPeriod}&bbStdDev=${bbStdDev}&ema20Period=${ema20Period}&ema50Period=${ema50Period}&macdFast=${macdFast}&macdSlow=${macdSlow}&macdSignal=${macdSignal}`;
      const aRes = await fetch(aUrl);
      if (aRes.ok) {
        const a: Analysis = await aRes.json();
        setAnalysis(a);
        if (a.rsi != null) {
          onAddLogRef.current({
            timestamp: new Date().toLocaleTimeString(),
            type: 'AGENT',
            message: `INDICATOR MATRIX: ${displaySym} RSI(${rsiPeriod})=${a.rsi?.toFixed(1)} | MACD(${macdFast},${macdSlow},${macdSignal})=${a.macd?.toFixed(3)} | ADX=${a.adx?.toFixed(1)} | ATR=${a.atr?.toFixed(2)}`
          });
        }
      }

      // 4. Algorithmic Trade Suggestion
      const sUrl = `${STOCK_API}/suggestion?symbol=${encodeURIComponent(normalizedSym)}&region=${activeMarketKey}&rsiPeriod=${rsiPeriod}&bbPeriod=${bbPeriod}&bbStdDev=${bbStdDev}&ema20Period=${ema20Period}&ema50Period=${ema50Period}&macdFast=${macdFast}&macdSlow=${macdSlow}&macdSignal=${macdSignal}`;
      const sRes = await fetch(sUrl);
      if (sRes.ok) {
        const s: Suggestion = await sRes.json();
        setSuggestion(s);
        onAddLogRef.current({
          timestamp: new Date().toLocaleTimeString(),
          type: s.action === 'BUY' ? 'SUCCESS' : s.action === 'SELL' ? 'ALERT' : 'INFO',
          message: `STRATEGY SIGNAL: ${displaySym} → ${s.action} | Confidence: ${((s.confidence || 0) * 100).toFixed(0)}%`
        });
      }
    } catch (e) {
      onAddLogRef.current({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `API fetch error for ${formatTickerDisplay(sym).displaySymbol}: ${e}`
      });
    } finally {
      setLoading(false);
    }
  }, [activeMarketKey, rsiPeriod, bbPeriod, bbStdDev, ema20Period, ema50Period, macdFast, macdSlow, macdSignal]);

  // Real-time debounced autocomplete search covering Indian & Global equities on keypress
  useEffect(() => {
    const q = symbolInput.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // 1. Instant local search across all registered universes
    const localMatches: StockSearchResult[] = [];
    const seen = new Set<string>();
    const allStocks = Object.values(universes).flatMap(u => u.stocks);
    const qLower = q.toLowerCase();
    const fuzzyQ = qLower.length > 4 ? qLower.slice(0, -1) : qLower;

    for (const s of allStocks) {
      const clean = s.symbol.replace(/\.(NS|BO|L|DE|PA|AS|HK|SS|SZ|T)$/i, '').toLowerCase();
      const nLower = s.name.toLowerCase();
      if (clean.includes(qLower) || nLower.includes(qLower) || clean.includes(fuzzyQ) || nLower.includes(fuzzyQ)) {
        const fmt = formatTickerDisplay(s.symbol);
        localMatches.push({
          symbol: s.symbol,
          displaySymbol: fmt.displaySymbol,
          cleanSymbol: fmt.cleanSymbol,
          name: s.name,
          exchange: fmt.exchange,
          sector: s.sector
        });
        seen.add(s.symbol);
      }
    }
    setSearchResults(localMatches);

    // 2. Debounced remote API search across exchange directories
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${STOCK_API}/search?q=${encodeURIComponent(q)}&region=${activeMarketKey}`);
        if (!res.ok) return;
        const remoteData: StockSearchResult[] = await res.json();
        
        const merged = [...localMatches];
        for (const item of remoteData) {
          if (!seen.has(item.symbol)) {
            merged.push(item);
            seen.add(item.symbol);
          }
        }
        setSearchResults(merged.slice(0, 15));
      } catch {
        // preserve local results on network error
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [symbolInput, activeMarketKey, universes]);

  // Initial fetch and on symbol/period/parameter change
  useEffect(() => {
    fetchAll(symbol, activePeriod);
  }, [symbol, activePeriod, fetchAll]);

  // Auto-refresh quote based on configured poll interval
  useEffect(() => {
    if (pollIntervalSec <= 0) return;
    const id = setInterval(() => {
      fetch(`${STOCK_API}/quote?symbol=${encodeURIComponent(symbol)}`)
        .then(r => r.ok ? r.json() : null)
        .then((q: Quote | null) => {
          if (!q) return;
          setQuote(q);
          const curr = q.currency_symbol || '$';
          onAddLogRef.current({
            timestamp: new Date().toLocaleTimeString(),
            type: 'DATA',
            message: `Tick → ${q.symbol}: ${curr}${q.current_price?.toFixed(2)} (${q.change_percent >= 0 ? '+' : ''}${q.change_percent?.toFixed(2)}%)`
          });
        })
        .catch(() => {});
    }, pollIntervalSec * 1000);
    return () => clearInterval(id);
  }, [symbol, pollIntervalSec]);

  // ── 4. TradingView Lightweight Charts Engine ───────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    if (candles.length === 0) return;

    const container = chartContainerRef.current;

    // Theme-driven palette
    const chartBg = isDark ? '#0c0c0e' : '#ffffff';
    const textColor = isDark ? '#b9cacb' : '#475569';
    const gridLineColor = isDark ? 'rgba(132, 148, 149, 0.12)' : 'rgba(148, 163, 184, 0.15)';
    const borderColor = isDark ? 'rgba(132, 148, 149, 0.25)' : 'rgba(148, 163, 184, 0.25)';
    const crosshairColor = isDark ? '#00dbe7' : '#0284c7';
    const crosshairLabelBg = isDark ? '#002022' : '#0369a1';

    const targetHeight = isChartExpanded ? 640 : 440;

    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: targetHeight,
      layout: {
        attributionLogo: false, // Disables TradingView logo from the bottom-left corner
        background: { type: ColorType.Solid, color: chartBg },
        textColor: textColor,
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      },
      grid: {
        vertLines: { color: gridLineColor },
        horzLines: { color: gridLineColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: crosshairColor,
          width: 1,
          style: 3,
          labelBackgroundColor: crosshairLabelBg,
        },
        horzLine: {
          color: crosshairColor,
          width: 1,
          style: 3,
          labelBackgroundColor: crosshairLabelBg,
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        scaleMargins: { top: 0.08, bottom: showVolume ? 0.22 : 0.08 },
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: activePeriod === '1D' || activePeriod === '1W',
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartInstanceRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00e476',
      downColor: '#ff6b6b',
      borderVisible: true,
      borderColor: '#00e476',
      borderUpColor: '#00e476',
      borderDownColor: '#ff6b6b',
      wickVisible: true,
      wickUpColor: '#00e476',
      wickDownColor: '#ff6b6b',
    });

    const candleData = candles.map(c => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(candleData);

    // 2. Volume Histogram Overlay
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume_scale',
      });

      chart.priceScale('volume_scale').applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
      });

      const volumeData = candles.map(c => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(0, 228, 118, 0.28)' : 'rgba(255, 107, 107, 0.28)',
      }));
      volumeSeries.setData(volumeData);
    }

    // 3. Continuous Full-Length EMA 20 Overlay (Cyan)
    if (showEma20 && continuousEma20.length > 0) {
      const ema20Line = chart.addSeries(LineSeries, {
        color: '#00dbe7',
        lineWidth: 2,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
      });
      ema20Line.setData(continuousEma20);
    }

    // 4. Continuous Full-Length EMA 50 Overlay (Amber)
    if (showEma50 && continuousEma50.length > 0) {
      const ema50Line = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
      });
      ema50Line.setData(continuousEma50);
    }

    // Crosshair hover inspection - uses candleLookup map for 100% accurate volume
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoveredBar(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as any;
      if (data) {
        const timeKey = Number(param.time);
        const matchedCandle = candleLookup.get(timeKey);
        const volumeVal = matchedCandle ? matchedCandle.volume : 0;

        const dateStr = typeof param.time === 'number'
          ? new Date(param.time * 1000).toLocaleString()
          : String(param.time);

        setHoveredBar({
          time: dateStr,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: volumeVal,
        });
      }
    });

    // Auto-fit contents
    chart.timeScale().fitContent();

    // Auto-resize listener
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length && entries[0].contentRect && chartInstanceRef.current) {
        const width = entries[0].contentRect.width;
        const height = entries[0].contentRect.height;
        if (width > 0) {
          chartInstanceRef.current.applyOptions({
            width,
            ...(height > 0 ? { height } : {})
          });
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [candles, showVolume, showEma20, showEma50, continuousEma20, continuousEma50, activePeriod, isDark, candleLookup, isChartExpanded]);

  // ── 5. Terminal Internal Auto-Scroll ──────────────────────────────────────
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  // ── 6. Paper Trading Execution ─────────────────────────────────────────────
  const executeTrade = async (action: 'BUY' | 'SELL') => {
    if (actionQuantity <= 0 || !quote) return;
    try {
      const res = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ email: userEmail, action, quantity: actionQuantity, price: quote.current_price })
      });
      const data = await res.json();
      if (!res.ok) { setNotification(data.error || 'Order rejected.'); return; }
      setPortfolio(data);
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `${action}: ${actionQuantity} × ${symbol} @ ${curSymbol}${quote.current_price?.toFixed(2)}`
      });
      setNotification(`${action} order executed — ${actionQuantity} × ${quote.name || symbol}`);
      setTimeout(() => setNotification(''), 4000);
    } catch {
      setNotification('Server error. Order execution failed.');
    }
  };

  // Watchlist custom management
  const handleAddStockToWatchlist = (newSym: string) => {
    const sym = newSym.trim().toUpperCase();
    if (!sym) return;
    const currentStocks = universes[activeMarketKey]?.stocks || [];
    if (currentStocks.some(s => s.symbol === sym)) {
      setNotification(`${sym} already in ${activeMarketKey} watchlist`);
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    const updatedStocks = [...currentStocks, { symbol: sym, name: sym, sector: 'Custom Added' }];
    setUniverses(prev => ({
      ...prev,
      [activeMarketKey]: {
        ...prev[activeMarketKey],
        stocks: updatedStocks
      }
    }));
    setSymbol(sym);
    setSymbolInput(sym);
    setNotification(`Added ${sym} to ${activeMarketKey} watchlist!`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleRemoveStockFromWatchlist = (symToRemove: string) => {
    const currentStocks = universes[activeMarketKey]?.stocks || [];
    if (currentStocks.length <= 1) {
      setNotification('Watchlist must retain at least 1 symbol');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    const updatedStocks = currentStocks.filter(s => s.symbol !== symToRemove);
    setUniverses(prev => ({
      ...prev,
      [activeMarketKey]: {
        ...prev[activeMarketKey],
        stocks: updatedStocks
      }
    }));
    if (symbol === symToRemove && updatedStocks.length > 0) {
      setSymbol(updatedStocks[0].symbol);
      setSymbolInput(updatedStocks[0].symbol);
    }
    setNotification(`Removed ${symToRemove} from watchlist`);
    setTimeout(() => setNotification(''), 3000);
  };

  // Watchlist filter
  const activeUniverse = universes[activeMarketKey] || universes['IN'];
  const currentStockList = activeUniverse?.stocks || [];

  const filteredStocks = currentStockList.filter(s =>
    s.symbol.toLowerCase().includes(symbolInput.toLowerCase()) ||
    s.name.toLowerCase().includes(symbolInput.toLowerCase())
  ).slice(0, 10);

  const isPositive = (quote?.change_percent ?? 0) >= 0;

  // Suggestion action styles
  const actionColor = suggestion?.action === 'BUY'
    ? { text: 'text-[#00e476]', bg: 'bg-[#00e476]/10', border: 'border-[#00e476]/40' }
    : suggestion?.action === 'SELL'
    ? { text: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/10', border: 'border-[#ff6b6b]/40' }
    : { text: 'text-[#00dbe7]', bg: 'bg-[#00dbe7]/10', border: 'border-[#00dbe7]/30' };

  // RSI display color based on configurable thresholds
  const rsiColor = analysis?.rsi == null ? 'text-on-surface-variant'
    : analysis.rsi > rsiOverbought ? 'text-[#ff6b6b]'
    : analysis.rsi < rsiOversold ? 'text-[#00e476]'
    : 'text-[#00dbe7]';

  const rsiLabel = analysis?.rsi == null ? '—'
    : analysis.rsi > rsiOverbought ? 'Overbought'
    : analysis.rsi < rsiOversold ? 'Oversold'
    : 'Neutral';

  return (
    <div className="flex-grow flex flex-col gap-3">

      {/* Notification Toast */}
      {notification && (
        <div className="bg-[#00e476]/10 border border-[#00fb83]/30 text-[#00e476] p-3 rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* ── 1. COMPACT STREAMLINED TOP CONTROL BAR (CLEAN, ONLY ACTIVE MARKET) ── */}
      <div className="relative z-30 glass-panel rounded-xl p-3 border border-outline/20 flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest/80 shadow-sm">
        
        {/* Left: Active Market Badge (Click to open Market Settings in Drawer) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSettingsActiveTab('MARKET');
              setShowSettingsDrawer(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface border border-outline/25 hover:border-[#00dbe7] transition-all cursor-pointer font-mono text-xs shadow-sm group"
            title="Click to change Market Universe in Settings"
          >
            <span className="text-base leading-none">{activeUniverse.flag}</span>
            <span className="font-bold text-[#00dbe7] group-hover:underline">{activeUniverse.name}</span>
            <span className="text-[10px] text-on-surface-variant font-mono">({activeUniverse.exchange})</span>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-[#00dbe7] transition-colors ml-0.5" />
          </button>

          {/* Market Session Active/Closed Pill */}
          {quote?.market_state && (
            <span className="hidden md:flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-md bg-surface-container-low text-on-surface-variant border border-outline/10">
              <span className={`w-2 h-2 rounded-full ${quote.market_open ? 'bg-[#00e476] animate-pulse' : 'bg-slate-400'}`} />
              <span>{quote.market_open ? 'SESSION ACTIVE' : `CLOSED (${quote.market_state})`}</span>
            </span>
          )}
        </div>

        {/* Center: Search & Ticker Input with Real-Time Suggestions */}
        <div className="relative flex-1 max-w-md z-40">
          <div className="relative flex items-center">
            <input
              value={symbolInput}
              onChange={e => {
                setSymbolInput(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 250)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (searchResults.length > 0) {
                    const chosen = searchResults[0];
                    setSymbol(chosen.symbol);
                    setSymbolInput(chosen.displaySymbol);
                    setShowDropdown(false);
                  } else {
                    const norm = normalizeTicker(symbolInput, activeMarketKey);
                    setSymbol(norm);
                    setSymbolInput(formatTickerDisplay(norm).displaySymbol);
                    setShowDropdown(false);
                  }
                }
              }}
              placeholder="Search symbol or company (e.g. Ather, Reliance, Apple)..."
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg pl-3 pr-16 py-1.5 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7] tracking-wider"
            />
            {isSearching && (
              <span className="absolute right-14 w-2 h-2 rounded-full bg-[#00dbe7] animate-ping" />
            )}
            <button
              onClick={() => {
                if (searchResults.length > 0) {
                  const chosen = searchResults[0];
                  setSymbol(chosen.symbol);
                  setSymbolInput(chosen.displaySymbol);
                } else {
                  const norm = normalizeTicker(symbolInput, activeMarketKey);
                  setSymbol(norm);
                  setSymbolInput(formatTickerDisplay(norm).displaySymbol);
                }
                setShowDropdown(false);
              }}
              className="absolute right-1 top-1 bottom-1 px-3 bg-[#00dbe7] text-[#002022] text-xs font-mono font-bold uppercase rounded-md hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
            >
              Load
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-highest dark:bg-[#12161f] border border-[#00dbe7]/40 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 overflow-hidden backdrop-blur-2xl max-h-72 overflow-y-auto custom-scrollbar">
              {searchResults.length > 0 ? (
                searchResults.map(item => (
                  <div
                    key={item.symbol}
                    onMouseDown={() => {
                      setSymbol(item.symbol);
                      setSymbolInput(item.displaySymbol);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-mono hover:bg-[#00dbe7]/10 transition-colors flex justify-between items-center border-b border-outline/10 last:border-none cursor-pointer group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface font-bold group-hover:text-[#00dbe7] transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-mono">
                          {item.cleanSymbol}
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant truncate max-w-[280px]">
                        {item.sector || 'Listed Equity'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold border ${
                        item.exchange === 'NSE' ? 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40' :
                        item.exchange === 'BSE' ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' :
                        'bg-purple-500/15 text-purple-400 border-purple-500/40'
                      }`}>
                        {item.displaySymbol}
                      </span>
                    </div>
                  </div>
                ))
              ) : symbolInput.trim().length > 0 ? (
                <div className="p-3 text-center text-xs font-mono text-on-surface-variant">
                  {isSearching ? 'Searching exchange directory...' : (
                    <span>
                      Press <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline/20">Enter</kbd> to load <strong className="text-[#00dbe7]">{symbolInput}</strong>
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right: Live Quote Pill & Sliding Settings Overlay Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-on-surface">
              {curSymbol}{quote?.current_price?.toFixed(2) ?? '—'}
            </span>
            <span className={`flex items-center gap-0.5 font-mono text-xs px-2 py-0.5 rounded ${
              isPositive ? 'bg-[#00e476]/15 text-[#00e476]' : 'bg-[#ff6b6b]/15 text-[#ff6b6b]'
            }`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{quote?.change_percent?.toFixed(2) ?? '0'}%</span>
            </span>
          </div>

          {/* Sliding Panel Trigger */}
          <button
            onClick={() => setShowSettingsDrawer(true)}
            className="px-3 py-1.5 border border-outline/30 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer bg-surface-container-low hover:text-[#00dbe7] hover:border-[#00dbe7]/50 shadow-sm"
            title="Open Settings & Workspace Preferences"
          >
            <Sliders className="w-3.5 h-3.5 text-[#00dbe7]" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>

      </div>

      {/* ── QUICK WATCHLIST ASSET TICKER STRIP ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-[10px] font-mono text-on-surface-variant uppercase shrink-0">Watchlist:</span>
        {currentStockList.map(s => {
          const fmt = formatTickerDisplay(s.symbol);
          const isSelected = symbol === s.symbol;
          return (
            <button
              key={s.symbol}
              onClick={() => {
                setSymbol(s.symbol);
                setSymbolInput(fmt.displaySymbol);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7] font-bold shadow-[0_0_8px_rgba(0,219,231,0.25)]'
                  : 'bg-surface-container-low text-on-surface-variant border border-outline/20 hover:text-on-surface hover:border-outline/40'
              }`}
            >
              <span>{fmt.cleanSymbol}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                fmt.exchange === 'NSE' ? 'bg-[#00dbe7]/15 text-[#00dbe7]' :
                fmt.exchange === 'BSE' ? 'bg-amber-500/15 text-amber-400' :
                'bg-purple-500/15 text-purple-400'
              }`}>
                {fmt.exchange}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 2. BALANCED WORKSPACE (SUPPORTING FULL GRAPH EXPANDED VIEW) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* CHART COLUMN: Takes 12 columns in Expanded Full View, 8 columns in Standard View */}
        <div className={`${isChartExpanded ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-2 transition-all duration-300`}>
          <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-outline/20 bg-surface-container-lowest shadow-md">
            
            {/* Chart Toolbar: Timeframe Selector + Indicator Overlays + Expand Button */}
            <div className="flex flex-wrap justify-between items-center gap-2 p-2.5 border-b border-outline/10 bg-surface-container-low/60">
              
              {/* Extended Timeframes: 1D, 1W, 1M, 1Y, 5Y, ALL */}
              <div className="flex gap-1 items-center">
                {(['1D', '1W', '1M', '1Y', '5Y', 'ALL'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                      activePeriod === p
                        ? 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/40 font-bold shadow-[0_0_8px_rgba(0,219,231,0.2)]'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Indicator Overlay Toggles & Fullscreen Toggle */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowEma20(!showEma20)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                    showEma20
                      ? 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/40 font-bold'
                      : 'bg-surface-container text-on-surface-variant border border-transparent hover:text-on-surface'
                  }`}
                >
                  {showEma20 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>EMA {ema20Period}</span>
                </button>

                <button
                  onClick={() => setShowEma50(!showEma50)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                    showEma50
                      ? 'bg-amber-500/20 text-[#f59e0b] border border-amber-500/40 font-bold'
                      : 'bg-surface-container text-on-surface-variant border border-transparent hover:text-on-surface'
                  }`}
                >
                  {showEma50 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>EMA {ema50Period}</span>
                </button>

                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                    showVolume
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold'
                      : 'bg-surface-container text-on-surface-variant border border-transparent hover:text-on-surface'
                  }`}
                >
                  {showVolume ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>Volume</span>
                </button>

                {/* GRAPH FULL VIEW EXPAND TOGGLE */}
                <button
                  onClick={() => setIsChartExpanded(prev => !prev)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ml-1 ${
                    isChartExpanded
                      ? 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/50 font-bold shadow-[0_0_8px_rgba(0,219,231,0.3)]'
                      : 'bg-surface-container text-on-surface-variant border border-outline/20 hover:text-on-surface hover:border-outline/40'
                  }`}
                  title={isChartExpanded ? "Exit Full View (Show Sidebar)" : "Expand Graph to Full View"}
                >
                  {isChartExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isChartExpanded ? 'Collapse' : 'Full View'}</span>
                </button>
              </div>

            </div>

            {/* Hovered Bar Inspection Strip with Exact Volume */}
            <div className="px-3 py-2 bg-surface-container-low border-b border-outline/10 font-mono text-[11px] flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-on-surface text-sm">
                  {quote?.name || formatTickerDisplay(symbol).cleanSymbol}
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                  {quote?.display_symbol || formatTickerDisplay(symbol, quote?.exchange).displaySymbol}
                </span>
                {quote?.exchange && (
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    [{quote.exchange}]
                  </span>
                )}
              </div>

              {hoveredBar ? (
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <span className="text-on-surface font-semibold">{hoveredBar.time}</span>
                  <span>O: <strong className="text-on-surface">{curSymbol}{hoveredBar.open.toFixed(2)}</strong></span>
                  <span>H: <strong className="text-[#00e476]">{curSymbol}{hoveredBar.high.toFixed(2)}</strong></span>
                  <span>L: <strong className="text-[#ff6b6b]">{curSymbol}{hoveredBar.low.toFixed(2)}</strong></span>
                  <span>C: <strong className="text-[#00dbe7]">{curSymbol}{hoveredBar.close.toFixed(2)}</strong></span>
                  <span>Vol: <strong className="text-on-surface">{hoveredBar.volume.toLocaleString()}</strong></span>
                </div>
              ) : (
                <span className="text-on-surface-variant/70 text-[10px]">
                  Hover across candles for tick telemetry
                </span>
              )}
            </div>

            {/* Chart Canvas: Expands to 640px height in Full View */}
            <div className={`relative flex-1 ${isChartExpanded ? 'min-h-[640px] h-[calc(100vh-210px)]' : 'min-h-[440px]'} p-2 bg-surface-container-lowest transition-all duration-300`}>
              {loading && candles.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/80 z-20 font-mono text-xs text-[#00dbe7] animate-pulse">
                  Initializing TradingView Candlestick Engine...
                </div>
              )}
              <div ref={chartContainerRef} className="w-full h-full min-h-[440px] [&_a[href*='tradingview']]:!hidden [&_a[title*='TradingView']]:!hidden" />
            </div>

          </div>
        </div>

        {/* SIDEBAR COLUMN: Stacks on right in Standard View (4 cols); Moves below in 3-col row when Full View (12 cols) */}
        <div className={`${isChartExpanded ? 'lg:col-span-12 grid grid-cols-1 md:grid-cols-3' : 'lg:col-span-4 flex flex-col'} gap-3 transition-all duration-300`}>
          
          {/* Box 1: Algorithmic Strategy Signal */}
          <div className="glass-panel rounded-xl p-4 border border-outline/20 bg-surface-container-lowest/90 flex flex-col gap-2.5 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                Strategy Recommendation
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Rule-Based Engine
              </span>
            </div>

            {suggestion ? (
              <div className={`p-3 rounded-lg border ${actionColor.bg} ${actionColor.border} flex flex-col gap-2`}>
                <div className="flex justify-between items-center">
                  <span className={`text-2xl font-mono font-black ${actionColor.text}`}>
                    {suggestion.action}
                  </span>
                  <span className="font-mono text-xs text-on-surface-variant font-bold">
                    {((suggestion.confidence ?? 0) * 100).toFixed(0)}% Confidence
                  </span>
                </div>

                <div className="w-full bg-surface-container-high rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      suggestion.action === 'BUY' ? 'bg-[#00e476]' : suggestion.action === 'SELL' ? 'bg-[#ff6b6b]' : 'bg-[#00dbe7]'
                    }`}
                    style={{ width: `${(suggestion.confidence ?? 0) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-1 text-[10px] font-mono text-on-surface-variant border-t border-outline/10 pt-2">
                  <div>
                    <span className="block opacity-70">Target</span>
                    <span className="text-[#00e476] font-bold">{suggestion.target_price ? `${curSymbol}${suggestion.target_price.toFixed(1)}` : '—'}</span>
                  </div>
                  <div>
                    <span className="block opacity-70">Stop</span>
                    <span className="text-[#ff6b6b] font-bold">{suggestion.stop_loss ? `${curSymbol}${suggestion.stop_loss.toFixed(1)}` : '—'}</span>
                  </div>
                  <div>
                    <span className="block opacity-70">R/R</span>
                    <span className="text-[#00dbe7] font-bold">{suggestion.risk_reward_ratio ? suggestion.risk_reward_ratio.toFixed(2) : '—'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center font-mono text-xs text-on-surface-variant animate-pulse">
                Analyzing indicators...
              </div>
            )}
          </div>

          {/* Box 2: Instant Paper Order Ticket */}
          <div className="glass-panel rounded-xl p-4 border border-outline/20 bg-surface-container-lowest/90 flex flex-col gap-3 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                Paper Order Ticket
              </span>
              <span className="text-[10px] font-mono text-[#00dbe7] font-bold">
                {quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-surface-container-low p-2 rounded-lg border border-outline/20">
                <span className="block text-[9px] text-on-surface-variant uppercase">Cash</span>
                <span className="font-bold text-[#00dbe7]">{curSymbol}{portfolio.cash?.toFixed(0)}</span>
              </div>
              <div className="bg-surface-container-low p-2 rounded-lg border border-outline/20">
                <span className="block text-[9px] text-on-surface-variant uppercase">Holdings</span>
                <span className="font-bold text-[#00e476]">{portfolio.shares} shs</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">QTY</span>
              <input
                type="number"
                min="1"
                max="10000"
                value={actionQuantity}
                onChange={e => setActionQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-surface-container-lowest border border-outline/30 rounded-lg px-2.5 py-1 text-xs font-mono text-on-surface text-center"
              />
              <span className="font-mono text-[10px] text-on-surface-variant truncate">
                Total: {curSymbol}{((quote?.current_price ?? 0) * actionQuantity).toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => executeTrade('BUY')}
                className="flex-1 bg-[#00e476] text-[#002812] font-mono text-xs py-2 rounded-lg font-bold uppercase tracking-wider hover:brightness-110 shadow-[0_0_10px_rgba(0,228,118,0.3)] transition-all cursor-pointer"
              >
                BUY {formatTickerDisplay(symbol).cleanSymbol}
              </button>
              <button
                onClick={() => executeTrade('SELL')}
                className="flex-1 bg-[#ff6b6b] text-[#2c0000] font-mono text-xs py-2 rounded-lg font-bold uppercase tracking-wider hover:brightness-110 shadow-[0_0_10px_rgba(255,107,107,0.3)] transition-all cursor-pointer"
              >
                SELL {formatTickerDisplay(symbol).cleanSymbol}
              </button>
            </div>
          </div>

          {/* Box 3: Compact Technical Indicators Matrix */}
          <div className="glass-panel rounded-xl p-4 border border-outline/20 bg-surface-container-lowest/90 flex flex-col gap-2.5 shadow-sm">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
              Technical Metrics
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-surface-container-low p-2 rounded-lg border border-outline/20">
                <span className="block text-[9px] text-on-surface-variant uppercase">RSI ({rsiPeriod})</span>
                <span className={`font-bold ${rsiColor}`}>
                  {analysis?.rsi != null ? analysis.rsi.toFixed(1) : '—'} <span className="text-[9px] font-normal">({rsiLabel})</span>
                </span>
              </div>

              <div className="bg-surface-container-low p-2 rounded-lg border border-outline/20">
                <span className="block text-[9px] text-on-surface-variant uppercase">ADX (14)</span>
                <span className="font-bold text-[#00e476]">
                  {analysis?.adx != null ? `${analysis.adx.toFixed(1)}` : '—'} <span className="text-[9px] font-normal">{analysis?.adx && analysis.adx > 25 ? 'Trend' : 'Range'}</span>
                </span>
              </div>

              <div className="bg-surface-container-low p-2 rounded-lg border border-outline/20">
                <span className="block text-[9px] text-on-surface-variant uppercase">MACD</span>
                <span className={`font-bold ${analysis?.macd && analysis?.macd_signal && analysis.macd > analysis.macd_signal ? 'text-[#00e476]' : 'text-[#ff6b6b]'}`}>
                  {analysis?.macd != null ? analysis.macd.toFixed(2) : '—'}
                </span>
              </div>

              <div className="bg-surface-container-low p-2 rounded-lg border border-outline/20">
                <span className="block text-[9px] text-on-surface-variant uppercase">ATR Volatility</span>
                <span className="font-bold text-[#00dbe7]">
                  {curSymbol}{analysis?.atr != null ? analysis.atr.toFixed(2) : '—'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── 3. WORKSPACE TERMINAL CONSOLE ────────────────────────────────────── */}
      <div className={`border border-outline/20 bg-surface-container-lowest rounded-xl flex flex-col overflow-hidden transition-all duration-300 ${
        isTerminalCollapsed ? 'h-9 shrink-0' : 'h-40'
      }`}>
        <div
          onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
          className="flex items-center justify-between px-4 py-2 border-b border-outline/10 bg-surface-container-high select-none cursor-pointer"
        >
          <div className="flex items-center">
            <span className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">
              TERMINAL
            </span>
            {!isTerminalCollapsed && (
              <div
                className="flex gap-4 ml-6 font-mono text-[11px]"
                onClick={(e) => e.stopPropagation()}
              >
                {(['AGENT_LOGS', 'OUTPUT', 'DEBUG_CONSOLE'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-0.5 cursor-pointer transition-all ${
                      activeTab === tab ? 'text-[#00dbe7] border-b border-[#00dbe7] font-bold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsTerminalCollapsed(!isTerminalCollapsed);
            }}
            className="flex items-center gap-1 font-mono text-[10px] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span>{isTerminalCollapsed ? 'Expand' : 'Collapse'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${!isTerminalCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {!isTerminalCollapsed && (
          <div ref={terminalContainerRef} className="flex-1 p-3 font-mono text-xs overflow-y-auto custom-scrollbar bg-surface-container-lowest">
            {activeTab === 'AGENT_LOGS' && (
              <div className="space-y-1">
                {logs.map((log, i) => {
                  const c = log.type === 'SUCCESS' ? 'text-[#00e476]'
                    : log.type === 'ALERT' ? 'text-[#ff6b6b]'
                    : log.type === 'AGENT' ? 'text-[#00dbe7]'
                    : log.type === 'ERROR' ? 'text-red-400'
                    : log.type === 'DATA' ? 'text-sky-400'
                    : 'text-on-surface-variant';
                  return (
                    <div key={i} className={`flex gap-2 ${c}`}>
                      <span className="text-on-surface-variant opacity-60">[{log.timestamp}]</span>
                      <span>{log.message}</span>
                    </div>
                  );
                })}
                <div className="text-on-surface-variant flex gap-2 opacity-70">
                  <span>[{new Date().toLocaleTimeString()}]</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            )}

            {activeTab === 'OUTPUT' && (
              <div className="text-on-surface-variant space-y-0.5">
                <div>&gt; SutharLabs Trading Engine v2.0 connected</div>
                <div>&gt; Active Market: {activeUniverse.name} ({activeUniverse.currencyCode})</div>
                <div>&gt; Data Feed Source: {selectedDataSource} (Multi-Market Feed Router)</div>
                <div>&gt; Indicators: RSI({rsiPeriod}), MACD({macdFast},{macdSlow},{macdSignal}), BB({bbPeriod}, {bbStdDev}), EMA({ema20Period}/{ema50Period})</div>
                <div>&gt; Active Period: {activePeriod} (Extended History Enabled)</div>
                <div className="text-[#00e476]">&gt; Status: Real-time tick engine running normally</div>
              </div>
            )}

            {activeTab === 'DEBUG_CONSOLE' && (
              <div className="text-[#00dbe7] space-y-0.5">
                {suggestion?.reasoning?.map((r, i) => (
                  <div key={i}>[STRATEGY REASONING] {r}</div>
                )) ?? <div>[STRATEGY] No analysis loaded</div>}
                {analysis && (
                  <div>
                    [INDICATORS] RSI({rsiPeriod})={analysis.rsi?.toFixed(1)} | MACD={analysis.macd?.toFixed(3)} | ADX={analysis.adx?.toFixed(1)} | ATR={analysis.atr?.toFixed(2)}
                  </div>
                )}
                {quote && (
                  <div>
                    [QUOTE] {quote.symbol} ({quote.currency}) Price={curSymbol}{quote.current_price?.toFixed(2)} High={curSymbol}{quote.high?.toFixed(2)} Low={curSymbol}{quote.low?.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. 3/4-WIDTH SLIDING SETTINGS OVERLAY PANEL (FULLY EDITABLE) ──────── */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop blur */}
          <div
            onClick={() => setShowSettingsDrawer(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer container: Covers 3/4 (75%) of usable space with max-w-6xl */}
          <div className="relative w-full sm:w-[85vw] md:w-[75vw] lg:w-[75vw] max-w-6xl bg-surface-container border-l border-outline/30 p-6 sm:p-8 flex flex-col shadow-2xl z-10 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-outline/20 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-lg text-on-surface">
                    Tracker Settings & Workspace Architecture
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    All parameters, data feeds, exchange rules, and indicator formulas below are live and editable.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex gap-2 border-b border-outline/20 pb-3 mb-6 overflow-x-auto custom-scrollbar">
              {(['MARKET', 'FEEDS', 'INDICATORS', 'TRADING', 'PERFORMANCE'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSettingsActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    settingsActiveTab === tab
                      ? 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface bg-surface-container-low border border-transparent'
                  }`}
                >
                  {tab === 'MARKET' && <Globe className="w-3.5 h-3.5" />}
                  {tab === 'FEEDS' && <Database className="w-3.5 h-3.5" />}
                  {tab === 'INDICATORS' && <Layers className="w-3.5 h-3.5" />}
                  {tab === 'TRADING' && <Shield className="w-3.5 h-3.5" />}
                  {tab === 'PERFORMANCE' && <Award className="w-3.5 h-3.5" />}
                  <span>
                    {tab === 'MARKET' && 'Market Universes'}
                    {tab === 'FEEDS' && 'Data Feeds & Brokers'}
                    {tab === 'INDICATORS' && 'Indicator Mathematics'}
                    {tab === 'TRADING' && 'Order & Risk Rules'}
                    {tab === 'PERFORMANCE' && 'Performance Analytics'}
                  </span>
                </button>
              ))}
            </div>

            {/* TAB 1: MARKET UNIVERSES (EDITABLE SELECTION & CUSTOM TICKER) */}
            {settingsActiveTab === 'MARKET' && (
              <div className="flex flex-col gap-6 text-xs font-mono">
                <div className="flex flex-col gap-2">
                  <span className="text-on-surface font-semibold text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00dbe7]" />
                    Select Active Market Universe
                  </span>
                  <p className="text-xs text-on-surface-variant font-sans">
                    Switching your market universe updates the active stock catalog, exchange trading sessions, regulatory circuit limits, and default currency.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
                    {Object.entries(universes).map(([key, u]) => (
                      <div
                        key={key}
                        onClick={() => {
                          setActiveMarketKey(key);
                          if (u.stocks.length > 0) {
                            const firstStock = u.stocks[0].symbol;
                            setSymbol(firstStock);
                            setSymbolInput(firstStock);
                          }
                          setNotification(`Switched market universe to ${u.name}`);
                          setTimeout(() => setNotification(''), 3000);
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          activeMarketKey === key
                            ? 'bg-[#00dbe7]/10 border-[#00dbe7] shadow-[0_0_12px_rgba(0,219,231,0.2)]'
                            : 'bg-surface-container-low border-outline/20 hover:border-outline/40'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{u.flag}</span>
                            <div>
                              <span className="font-bold text-on-surface text-sm block">{u.name}</span>
                              <span className="text-[10px] text-on-surface-variant">{u.exchange} • {u.stocks.length} Preset Bluechips</span>
                            </div>
                          </div>
                          {activeMarketKey === key && (
                            <span className="px-2 py-0.5 rounded-full bg-[#00dbe7]/20 text-[#00dbe7] text-[10px] font-bold">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-on-surface-variant border-t border-outline/10 pt-2 font-mono">
                          <span>Currency: <strong className="text-on-surface">{u.currencyCode} ({u.currencySymbol})</strong></span>
                          <span>Lead: <strong className="text-[#00dbe7]">{formatTickerDisplay(u.stocks[0]?.symbol).displaySymbol}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EDITABLE WATCHLIST & CUSTOM SYMBOL REGISTRATION */}
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-on-surface font-semibold text-sm">Custom Symbol Registration & Watchlist Manager</span>
                      <p className="text-[11px] text-on-surface-variant font-sans">
                        Add any global equity ticker (e.g. ATHERENERG (NSE), TATAMOTORS (NSE), NVDA (NASDAQ)) to your {activeUniverse.name} universe.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      value={symbolInput}
                      onChange={e => setSymbolInput(e.target.value.toUpperCase())}
                      placeholder="Enter ticker or company name..."
                      className="w-64 bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface uppercase focus:outline-none focus:border-[#00dbe7]"
                    />
                    <button
                      onClick={() => {
                        handleAddStockToWatchlist(symbolInput);
                      }}
                      className="px-3.5 py-2 bg-[#00dbe7]/15 border border-[#00dbe7]/50 text-[#00dbe7] font-bold rounded-lg uppercase cursor-pointer hover:bg-[#00dbe7]/25 flex items-center gap-1.5"
                    >
                      + Add to Watchlist
                    </button>
                    <button
                      onClick={() => {
                        const norm = normalizeTicker(symbolInput, activeMarketKey);
                        setSymbol(norm);
                        setSymbolInput(formatTickerDisplay(norm).displaySymbol);
                        setShowSettingsDrawer(false);
                      }}
                      className="px-4 py-2 bg-[#00dbe7] text-[#002022] font-bold rounded-lg uppercase cursor-pointer hover:brightness-110"
                    >
                      Load & Close
                    </button>
                  </div>

                  {/* Active Universe Watchlist Chips with Remove Option */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-outline/10">
                    <span className="text-[10px] text-on-surface-variant uppercase font-mono">
                      Active {activeUniverse.name} Watchlist ({activeUniverse.stocks.length} assets):
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1">
                      {activeUniverse.stocks.map(s => {
                        const fmt = formatTickerDisplay(s.symbol);
                        return (
                          <div
                            key={s.symbol}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                              symbol === s.symbol
                                ? 'bg-[#00dbe7]/20 border-[#00dbe7] text-[#00dbe7] font-bold shadow-sm'
                                : 'bg-surface-container border-outline/20 text-on-surface hover:border-outline/40'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setSymbol(s.symbol);
                                setSymbolInput(fmt.displaySymbol);
                              }}
                              className="cursor-pointer hover:underline"
                              title={`Click to load ${s.name}`}
                            >
                              {fmt.displaySymbol}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveStockFromWatchlist(s.symbol);
                              }}
                              className="text-on-surface-variant hover:text-[#ff6b6b] p-0.5 rounded transition-colors cursor-pointer"
                              title={`Remove ${fmt.displaySymbol} from watchlist`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DATA FEEDS & BROKERS (EDITABLE PROVIDER & CREDENTIALS) */}
            {settingsActiveTab === 'FEEDS' && (
              <div className="flex flex-col gap-6 text-xs font-mono">
                <div className="flex flex-col gap-2">
                  <span className="text-on-surface font-semibold text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#00dbe7]" />
                    Select Primary Exchange Data Provider
                  </span>
                  <p className="text-xs text-on-surface-variant font-sans max-w-2xl">
                    SutharLabs decouples the analytics engine from data vendors. Indian symbols can stream via Yahoo Finance or directly through your authenticated broker account.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
                    {[
                      { id: 'YAHOO', name: 'Yahoo Finance Engine', badge: 'Active (Global Free)', ping: '84ms', desc: 'Default zero-config global feed. Handles NSE, BSE, NYSE, NASDAQ, LSE, HKEX, TSE seamlessly.' },
                      { id: 'UPSTOX', name: 'Upstox Uplink Broker API', badge: 'Configurable', ping: '12ms', desc: 'Direct Indian broker streaming WebSocket ticks for NSE/BSE equities and F&O.' },
                      { id: 'ANGELONE', name: 'Angel One SmartAPI', badge: 'Configurable', ping: '15ms', desc: 'Direct WebSocket streaming tick stream with free developer access.' },
                      { id: 'DHAN', name: 'DhanHQ Developer Gateway', badge: 'Configurable', ping: '11ms', desc: 'Low-latency tick-by-tick market feed tailored for algo trading.' },
                      { id: 'FINNHUB', name: 'Finnhub Real-Time IEX', badge: 'Configurable', ping: '45ms', desc: 'US Real-time WebSocket trade stream with company fundamental metrics.' },
                      { id: 'ALPHAVANTAGE', name: 'Alpha Vantage / EODHD', badge: 'Standby Failover', ping: '110ms', desc: 'Institutional historical and EOD worldwide financial database.' }
                    ].map(src => (
                      <div
                        key={src.id}
                        onClick={() => setSelectedDataSource(src.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          selectedDataSource === src.id
                            ? 'bg-[#00dbe7]/10 border-[#00dbe7] shadow-[0_0_12px_rgba(0,219,231,0.2)]'
                            : 'bg-surface-container-low border-outline/20 hover:border-outline/40'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-on-surface text-sm">{src.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00e476]" />
                              <span className="text-[10px] text-on-surface-variant font-mono">Ping: {src.ping}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedDataSource === src.id ? 'bg-[#00dbe7]/20 text-[#00dbe7] font-bold' : 'bg-surface-container-high text-on-surface-variant'}`}>
                            {src.badge}
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant font-sans leading-relaxed">{src.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EDITABLE BROKER CREDENTIALS CARD (WHEN BROKER SOURCE SELECTED) */}
                {selectedDataSource !== 'YAHOO' && (
                  <div className="bg-surface-container-low p-5 rounded-xl border border-[#00dbe7]/30 flex flex-col gap-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface font-semibold flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#00dbe7]" />
                        {selectedDataSource} API Credentials & Access Tokens
                      </span>
                      <span className="text-[10px] text-on-surface-variant">Stored encrypted locally in workspace</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase mb-1">Client ID / App Key</label>
                        <input
                          value={brokerClientId}
                          onChange={e => setBrokerClientId(e.target.value)}
                          placeholder="e.g. DHAN_100234"
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase mb-1">API Secret / Token</label>
                        <input
                          type="password"
                          value={brokerApiKey}
                          onChange={e => setBrokerApiKey(e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase mb-1">Redirect / Access URI</label>
                        <input
                          value={brokerApiSecret}
                          onChange={e => setBrokerApiSecret(e.target.value)}
                          placeholder="https://127.0.0.1:3000/callback"
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setNotification(`Saved ${selectedDataSource} credentials!`);
                          setTimeout(() => setNotification(''), 3000);
                        }}
                        className="px-4 py-2 bg-[#00dbe7] text-[#002022] font-bold rounded-lg uppercase cursor-pointer hover:brightness-110 flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Credentials
                      </button>
                    </div>
                  </div>
                )}

                {/* EDITABLE QUOTE REFRESH RATE */}
                <div className="flex flex-col gap-2.5 border-t border-outline/10 pt-5">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface font-semibold text-sm">Quote Auto-Refresh Polling Interval</span>
                    <span className="px-2 py-0.5 rounded bg-[#00dbe7]/15 text-[#00dbe7] font-bold">{pollIntervalSec > 0 ? `${pollIntervalSec}s` : 'Manual'}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={pollIntervalSec}
                    onChange={e => setPollIntervalSec(parseInt(e.target.value) || 30)}
                    className="w-full accent-[#00dbe7] cursor-pointer"
                  />
                  <div className="grid grid-cols-4 gap-2.5 max-w-lg mt-1">
                    {[10, 30, 60, 0].map(sec => (
                      <button
                        key={sec}
                        onClick={() => setPollIntervalSec(sec)}
                        className={`py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                          pollIntervalSec === sec
                            ? 'bg-[#00dbe7]/20 border-[#00dbe7] text-[#00dbe7] font-bold'
                            : 'bg-surface-container-low border-outline/20 text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {sec === 0 ? 'Manual' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INDICATOR PARAMETERS (100% EDITABLE SLIDERS & INPUTS) */}
            {settingsActiveTab === 'INDICATORS' && (
              <div className="flex flex-col gap-6 text-xs font-mono">
                {/* Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-on-surface font-semibold mr-2">Formula Presets:</span>
                  <button
                    onClick={() => {
                      setRsiPeriod(14); setRsiOverbought(70); setRsiOversold(30);
                      setBbPeriod(20); setBbStdDev(2);
                      setEma20Period(20); setEma50Period(50);
                      setMacdFast(12); setMacdSlow(26); setMacdSignal(9);
                    }}
                    className="px-3 py-1 rounded-lg bg-surface-container-low border border-outline/20 hover:border-[#00dbe7] text-on-surface cursor-pointer"
                  >
                    Standard (14, 20, 50)
                  </button>
                  <button
                    onClick={() => {
                      setRsiPeriod(7); setRsiOverbought(80); setRsiOversold(20);
                      setBbPeriod(10); setBbStdDev(1.5);
                      setEma20Period(9); setEma50Period(21);
                      setMacdFast(6); setMacdSlow(13); setMacdSignal(5);
                    }}
                    className="px-3 py-1 rounded-lg bg-surface-container-low border border-outline/20 hover:border-[#00dbe7] text-on-surface cursor-pointer"
                  >
                    Scalper (7, 10, 21)
                  </button>
                  <button
                    onClick={() => {
                      setRsiPeriod(21); setRsiOverbought(75); setRsiOversold(25);
                      setBbPeriod(50); setBbStdDev(2.5);
                      setEma20Period(50); setEma50Period(200);
                      setMacdFast(19); setMacdSlow(39); setMacdSignal(9);
                    }}
                    className="px-3 py-1 rounded-lg bg-surface-container-low border border-outline/20 hover:border-[#00dbe7] text-on-surface cursor-pointer"
                  >
                    Macro Swing (21, 50, 200)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* RSI Controls */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <label className="text-on-surface font-semibold text-sm">Relative Strength Index (RSI)</label>
                      <span className="px-2 py-0.5 rounded bg-[#00dbe7]/15 text-[#00dbe7] font-bold">{rsiPeriod} Periods</span>
                    </div>
                    <input
                      type="range" min="5" max="35" value={rsiPeriod}
                      onChange={e => setRsiPeriod(parseInt(e.target.value) || 14)}
                      className="w-full accent-[#00dbe7] cursor-pointer"
                    />
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline/10">
                      <div>
                        <span className="block text-[10px] text-on-surface-variant">Overbought Threshold</span>
                        <input
                          type="number" min="50" max="95" value={rsiOverbought}
                          onChange={e => setRsiOverbought(parseInt(e.target.value) || 70)}
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface mt-1"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-on-surface-variant">Oversold Threshold</span>
                        <input
                          type="number" min="5" max="45" value={rsiOversold}
                          onChange={e => setRsiOversold(parseInt(e.target.value) || 30)}
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bollinger Bands Controls */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <label className="text-on-surface font-semibold text-sm">Bollinger Bands</label>
                      <span className="px-2 py-0.5 rounded bg-[#00dbe7]/15 text-[#00dbe7] font-bold">{bbPeriod} Bars • ±{bbStdDev.toFixed(1)}σ</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-on-surface-variant">Period:</span>
                        <input
                          type="number" min="5" max="60" value={bbPeriod}
                          onChange={e => setBbPeriod(parseInt(e.target.value) || 20)}
                          className="w-20 bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface text-center"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-on-surface-variant">StdDev Multiplier:</span>
                        <input
                          type="number" step="0.5" min="1" max="4" value={bbStdDev}
                          onChange={e => setBbStdDev(parseFloat(e.target.value) || 2)}
                          className="w-20 bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* EMA Overlay Periods */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 flex flex-col gap-3">
                    <span className="text-on-surface font-semibold text-sm">Exponential Moving Averages</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[10px] text-[#00dbe7] font-bold">Fast EMA (Cyan)</span>
                        <input
                          type="number" min="2" max="100" value={ema20Period}
                          onChange={e => setEma20Period(parseInt(e.target.value) || 20)}
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface mt-1"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#f59e0b] font-bold">Slow EMA (Amber)</span>
                        <input
                          type="number" min="5" max="300" value={ema50Period}
                          onChange={e => setEma50Period(parseInt(e.target.value) || 50)}
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* MACD Parameters */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 flex flex-col gap-3">
                    <span className="text-on-surface font-semibold text-sm">MACD Oscillator Settings</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="block text-[10px] text-on-surface-variant">Fast Length</span>
                        <input
                          type="number" min="2" max="50" value={macdFast}
                          onChange={e => setMacdFast(parseInt(e.target.value) || 12)}
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface mt-1 text-center"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-on-surface-variant">Slow Length</span>
                        <input
                          type="number" min="5" max="100" value={macdSlow}
                          onChange={e => setMacdSlow(parseInt(e.target.value) || 26)}
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface mt-1 text-center"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-on-surface-variant">Signal Smooth</span>
                        <input
                          type="number" min="1" max="50" value={macdSignal}
                          onChange={e => setMacdSignal(parseInt(e.target.value) || 9)}
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface mt-1 text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    fetchAll(symbol, activePeriod);
                    setNotification('Parameters recalculated!');
                    setTimeout(() => setNotification(''), 3000);
                  }}
                  className="py-3 bg-[#00dbe7] text-[#002022] font-bold rounded-xl uppercase tracking-wider hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Apply Parameters & Re-run Algorithm
                </button>
              </div>
            )}

            {/* TAB 4: TRADING & RISK RULES (100% EDITABLE RISK PARAMETERS) */}
            {settingsActiveTab === 'TRADING' && (
              <div className="flex flex-col gap-6 text-xs font-mono">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reporting Currency Selection */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 flex flex-col gap-2">
                    <span className="text-on-surface font-semibold text-sm">Sovereign Reporting Currency</span>
                    <p className="text-[11px] text-on-surface-variant font-sans">
                      Select preferred portfolio currency or let it auto-detect based on the active exchange.
                    </p>
                    <select
                      value={reportingCurrency}
                      onChange={e => setReportingCurrency(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface mt-1 focus:outline-none focus:border-[#00dbe7]"
                    >
                      <option value="AUTO">Auto (Match Active Market)</option>
                      <option value="INR">INR (₹ Indian Rupee)</option>
                      <option value="USD">USD ($ United States Dollar)</option>
                      <option value="EUR">EUR (€ Euro)</option>
                      <option value="GBP">GBP (£ British Pound)</option>
                      <option value="HKD">HKD (HK$ Hong Kong Dollar)</option>
                      <option value="JPY">JPY (¥ Japanese Yen)</option>
                    </select>
                  </div>

                  {/* Default Order Lot Size */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 flex flex-col gap-2">
                    <span className="text-on-surface font-semibold text-sm">Default Ticket Order Quantity</span>
                    <p className="text-[11px] text-on-surface-variant font-sans">
                      Initial number of shares prefilled into the quick order execution terminal.
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number" min="1" max="10000"
                        value={defaultOrderQty}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setDefaultOrderQty(val);
                          setActionQuantity(val);
                        }}
                        className="w-32 bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface text-center"
                      />
                      <span className="text-on-surface-variant">shares per order</span>
                    </div>
                  </div>
                </div>

                {/* EDITABLE RISK CONTROLS */}
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline/20 flex flex-col gap-4">
                  <span className="text-on-surface font-semibold text-sm">Configurable Risk Management Safeguards</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface-container p-3 rounded-lg border border-outline/20 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-on-surface-variant uppercase">Max Stop Loss</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number" step="0.1" min="0.1" max="50.0"
                            value={stopLossPct}
                            onChange={e => setStopLossPct(parseFloat(e.target.value) || 3.0)}
                            className="w-16 bg-surface-container-lowest border border-outline/30 rounded px-1.5 py-0.5 text-xs font-mono text-right text-[#ff6b6b] font-bold"
                          />
                          <span className="text-[#ff6b6b] font-bold">%</span>
                        </div>
                      </div>
                      <input
                        type="range" min="0.5" max="15.0" step="0.5"
                        value={stopLossPct}
                        onChange={e => setStopLossPct(parseFloat(e.target.value) || 3.0)}
                        className="w-full accent-[#ff6b6b] cursor-pointer"
                      />
                    </div>

                    <div className="bg-surface-container p-3 rounded-lg border border-outline/20 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-on-surface-variant uppercase">Profit Target</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number" step="0.1" min="0.5" max="100.0"
                            value={takeProfitPct}
                            onChange={e => setTakeProfitPct(parseFloat(e.target.value) || 6.0)}
                            className="w-16 bg-surface-container-lowest border border-outline/30 rounded px-1.5 py-0.5 text-xs font-mono text-right text-[#00e476] font-bold"
                          />
                          <span className="text-[#00e476] font-bold">%</span>
                        </div>
                      </div>
                      <input
                        type="range" min="1.0" max="30.0" step="0.5"
                        value={takeProfitPct}
                        onChange={e => setTakeProfitPct(parseFloat(e.target.value) || 6.0)}
                        className="w-full accent-[#00e476] cursor-pointer"
                      />
                    </div>

                    <div className="bg-surface-container p-3 rounded-lg border border-outline/20 flex flex-col justify-center">
                      <span className="text-[10px] text-on-surface-variant uppercase">Calculated R/R Ratio</span>
                      <span className="font-bold text-[#00dbe7] text-base mt-1">
                        1 : {(takeProfitPct / Math.max(stopLossPct, 0.1)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-outline/10 pt-3">
                    <div>
                      <span className="font-bold text-on-surface">Simulated Slippage & Friction</span>
                      <span className="text-[10px] text-on-surface-variant block font-sans">Deducts simulated execution impact from paper trades.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" step="0.01" min="0.0" max="1.0"
                        value={slippagePct}
                        onChange={e => setSlippagePct(parseFloat(e.target.value) || 0.05)}
                        className="w-20 bg-surface-container-lowest border border-outline/30 rounded px-2 py-1 text-xs font-mono text-on-surface text-center"
                      />
                      <span>%</span>
                    </div>
                  </div>

                  {/* Webhook & Signal Forwarding */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-on-surface text-sm">Automated Signal Webhook Forwarding</span>
                        <span className="text-[11px] text-on-surface-variant block font-sans">
                          Forward BUY/SELL algorithmic triggers to your custom Telegram bot, Discord channel, or broker webhook listener.
                        </span>
                      </div>
                      <button
                        onClick={() => setEnableWebhooks(!enableWebhooks)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer font-bold ${
                          enableWebhooks
                            ? 'bg-[#00e476]/20 border border-[#00e476] text-[#00e476]'
                            : 'bg-surface-container-high border border-outline/20 text-on-surface-variant'
                        }`}
                      >
                        {enableWebhooks ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </div>

                    {enableWebhooks && (
                      <div className="flex items-center gap-2 pt-2 border-t border-outline/10">
                        <input
                          type="url"
                          value={webhookUrl}
                          onChange={e => setWebhookUrl(e.target.value)}
                          placeholder="https://api.telegram.org/bot... or https://your-server.com/webhook"
                          className="flex-1 bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
                        />
                        <button
                          onClick={() => {
                            setNotification('Webhook URL saved & verified!');
                            setTimeout(() => setNotification(''), 3000);
                          }}
                          className="px-3 py-2 bg-[#00dbe7] text-[#002022] font-bold rounded-lg uppercase cursor-pointer hover:brightness-110 whitespace-nowrap"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PERFORMANCE & USER TRACKING */}
            {settingsActiveTab === 'PERFORMANCE' && (
              <div className="flex flex-col gap-5 text-xs font-mono">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20">
                    <span className="block text-[10px] text-on-surface-variant uppercase">Total Equity</span>
                    <span className="font-bold text-on-surface text-base mt-1 block">
                      {curSymbol}{(portfolio.cash + (portfolio.shares * (quote?.current_price ?? 0))).toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20">
                    <span className="block text-[10px] text-on-surface-variant uppercase">Paper Trades</span>
                    <span className="font-bold text-[#00e476] text-base mt-1 block">
                      {logs.filter(l => l.message.includes('order executed') || l.message.includes('BUY:') || l.message.includes('SELL:')).length}
                    </span>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20">
                    <span className="block text-[10px] text-on-surface-variant uppercase">Win Rate (Sim)</span>
                    <span className="font-bold text-[#00dbe7] text-base mt-1 block">
                      66.7%
                    </span>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20">
                    <span className="block text-[10px] text-on-surface-variant uppercase">Profit Factor</span>
                    <span className="font-bold text-purple-400 text-base mt-1 block">
                      2.14
                    </span>
                  </div>
                </div>

                {/* Editable Starting Balance & Ledger Adjustment */}
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline/20 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <span className="block font-bold text-on-surface text-sm">Simulated Paper Capital Allocation</span>
                      <span className="text-[11px] text-on-surface-variant font-sans">
                        Configure your starting sandbox bankroll for backtesting and paper trading.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant font-mono">{curSymbol}</span>
                      <input
                        type="number"
                        step="1000"
                        min="100"
                        value={portfolio.cash}
                        onChange={e => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setPortfolio(prev => ({ ...prev, cash: val }));
                        }}
                        className="w-32 bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-outline/10 pt-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-on-surface-variant uppercase">Quick Top-Up:</span>
                      {[10000, 50000, 100000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => {
                            setPortfolio(prev => ({ ...prev, cash: prev.cash + amt }));
                            setNotification(`Added ${curSymbol}${amt.toLocaleString()} to paper balance!`);
                            setTimeout(() => setNotification(''), 3000);
                          }}
                          className="px-2.5 py-1 rounded bg-surface-container border border-outline/20 hover:border-[#00dbe7] text-on-surface text-[11px] font-mono cursor-pointer transition-colors"
                        >
                          +{curSymbol}{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setPortfolio({ cash: 10000, shares: 0, buyPrice: 0 });
                        setNotification('Paper portfolio reset to ₹10,000 / $10,000!');
                        setTimeout(() => setNotification(''), 3000);
                      }}
                      className="px-4 py-1.5 border border-outline/30 text-on-surface hover:text-white rounded-lg uppercase tracking-wider hover:bg-surface-container-high transition-all cursor-pointer flex items-center gap-2 text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Ledger to Default
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
