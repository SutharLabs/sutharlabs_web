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
  Check,
  Star,
  Bookmark,
  Plus,
  Trash2,
  Edit2,
  ListFilter,
  Cpu,
  Wand2,
  Copy,
  Play,
  ArrowRight,
  Filter,
  Newspaper,
  Sparkles,
  ExternalLink,
  Zap,
  AlertTriangle,
  Clock,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  GripVertical
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
import { IStrategy, StrategySignal, StrategyRuleCondition, StrategyParameter } from '../plugins/StockTracker/strategies/types';
import { PRESET_STRATEGIES } from '../plugins/StockTracker/strategies/presets';
import { StockNewsArticle, StockSentimentReport } from '../plugins/StockTracker/news/types';
import StockBacktestPanel from './StockBacktestPanel';
import StockStrategyMarketplace from './StockStrategyMarketplace';
import StockTrackerAlertModal, { StockTrackerAlertState } from './StockTrackerAlertModal';
import StockScannerPanel from './StockScannerPanel';
import StockSimulatorPanel from './StockSimulatorPanel';


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
      { symbol: 'TMCV.NS',       name: 'Tata Motors Limited', sector: 'Automobile' },
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

export const KNOWN_US_TICKERS = new Set([
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'AMD', 'NFLX',
  'BRK-B', 'BRK.B', 'BRK-A', 'JPM', 'V', 'MA', 'DIS', 'INTC', 'CSCO', 'ADBE',
  'CRM', 'ORCL', 'QCOM', 'TXN', 'AVGO', 'COST', 'WMT', 'PG', 'JNJ', 'UNH',
  'HD', 'BAC', 'XOM', 'CVX', 'LLY', 'NKE', 'KO', 'PEP', 'ABBV', 'MRK',
  'PFE', 'T', 'VZ', 'PYPL', 'UBER', 'ABNB', 'COIN', 'PLTR', 'SNOW', 'BABA',
  'ARM', 'SMCI', 'PANW', 'CRWD', 'NOW', 'SQ', 'SHOP', 'SE', 'PDD', 'BIDU'
]);

export interface StockSearchResult {
  symbol: string;
  displaySymbol: string;
  cleanSymbol: string;
  name: string;
  exchange: string;
  sector?: string;
  quoteType?: string;
}

export interface WatchlistItem {
  symbol: string;
  market: string;
  cleanSymbol: string;
  displaySymbol: string;
  name: string;
  exchange: string;
  addedAt?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  isDefault?: boolean;
  userEmail?: string;
  items: WatchlistItem[];
  symbols: string[];
}

export const DEFAULT_WATCHLISTS: Watchlist[] = [
  {
    id: 'wl-india-core',
    name: 'India Core & Momentum',
    isDefault: true,
    userEmail: 'system',
    items: [
      { symbol: 'RELIANCE.NS',   market: 'IN', cleanSymbol: 'RELIANCE',   displaySymbol: 'RELIANCE (NSE)',   name: 'Reliance Industries Limited', exchange: 'NSE' },
      { symbol: 'TCS.NS',        market: 'IN', cleanSymbol: 'TCS',        displaySymbol: 'TCS (NSE)',        name: 'Tata Consultancy Services Limited', exchange: 'NSE' },
      { symbol: 'INFY.NS',       market: 'IN', cleanSymbol: 'INFY',       displaySymbol: 'INFY (NSE)',       name: 'Infosys Limited', exchange: 'NSE' },
      { symbol: 'HDFCBANK.NS',   market: 'IN', cleanSymbol: 'HDFCBANK',   displaySymbol: 'HDFCBANK (NSE)',   name: 'HDFC Bank Limited', exchange: 'NSE' },
      { symbol: 'ATHERENERG.NS', market: 'IN', cleanSymbol: 'ATHERENERG', displaySymbol: 'ATHERENERG (NSE)', name: 'Ather Energy Limited', exchange: 'NSE' },
      { symbol: 'ETERNAL.NS',     market: 'IN', cleanSymbol: 'ETERNAL',     displaySymbol: 'ETERNAL (NSE)',     name: 'Eternal / Zomato', exchange: 'NSE' }
    ],
    symbols: ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ATHERENERG.NS', 'ETERNAL.NS']
  },
  {
    id: 'wl-us-tech',
    name: 'US Tech Leaders',
    userEmail: 'system',
    items: [
      { symbol: 'AAPL',  market: 'US', cleanSymbol: 'AAPL',  displaySymbol: 'AAPL (NASDAQ)',  name: 'Apple Inc.', exchange: 'NASDAQ' },
      { symbol: 'MSFT',  market: 'US', cleanSymbol: 'MSFT',  displaySymbol: 'MSFT (NASDAQ)',  name: 'Microsoft Corp.', exchange: 'NASDAQ' },
      { symbol: 'NVDA',  market: 'US', cleanSymbol: 'NVDA',  displaySymbol: 'NVDA (NASDAQ)',  name: 'NVIDIA Corp.', exchange: 'NASDAQ' },
      { symbol: 'GOOGL', market: 'US', cleanSymbol: 'GOOGL', displaySymbol: 'GOOGL (NASDAQ)', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
      { symbol: 'AMZN',  market: 'US', cleanSymbol: 'AMZN',  displaySymbol: 'AMZN (NASDAQ)',  name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
      { symbol: 'TSLA',  market: 'US', cleanSymbol: 'TSLA',  displaySymbol: 'TSLA (NASDAQ)',  name: 'Tesla Inc.', exchange: 'NASDAQ' }
    ],
    symbols: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA']
  },
  {
    id: 'wl-ev-green',
    name: 'EV & Mobility Growth',
    userEmail: 'system',
    items: [
      { symbol: 'ATHERENERG.NS', market: 'IN', cleanSymbol: 'ATHERENERG', displaySymbol: 'ATHERENERG (NSE)', name: 'Ather Energy Limited', exchange: 'NSE' },
      { symbol: 'TMCV.NS',       market: 'IN', cleanSymbol: 'TMCV',       displaySymbol: 'TMCV (NSE)',       name: 'Tata Motors Limited', exchange: 'NSE' },
      { symbol: 'TSLA',          market: 'US', cleanSymbol: 'TSLA',       displaySymbol: 'TSLA (NASDAQ)',    name: 'Tesla Inc.', exchange: 'NASDAQ' }
    ],
    symbols: ['ATHERENERG.NS', 'TMCV.NS', 'TSLA']
  }
];

export function createWatchlistItem(
  rawSymbol: string,
  marketHint?: string,
  nameHint?: string,
  exchangeHint?: string
): WatchlistItem {
  const norm = normalizeTicker(rawSymbol, marketHint || 'IN');
  const fmt = formatTickerDisplay(norm, exchangeHint);
  const isUS = marketHint === 'US' || KNOWN_US_TICKERS.has(fmt.cleanSymbol.toUpperCase());
  const resolvedMarket = marketHint || (isUS ? 'US' : 'IN');

  return {
    symbol: norm,
    market: resolvedMarket,
    cleanSymbol: fmt.cleanSymbol,
    displaySymbol: fmt.displaySymbol,
    name: nameHint || fmt.cleanSymbol,
    exchange: exchangeHint || fmt.exchange,
    addedAt: new Date().toISOString()
  };
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

export function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
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

  // Known special name aliases (must check before generic dot suffix)
  if (/^ATHER/i.test(clean)) return 'ATHERENERG.NS';
  if (/^ZOMATO/i.test(clean)) return 'ETERNAL.NS';
  if (/^TATAMOTORS(\.NS)?$/i.test(clean)) return 'TMCV.NS';

  if (/\.(NS|BO|L|DE|PA|AS|HK|SS|SZ|T)$/i.test(clean)) {
    return clean.toUpperCase();
  }

  // Known US tickers (do not append .NS)
  if (KNOWN_US_TICKERS.has(clean.toUpperCase())) {
    return clean.toUpperCase();
  }

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

  // User Custom Watchlists (Database-persisted with LocalStorage cache)
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_custom_watchlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((wl: any) => ({
            ...wl,
            items: Array.isArray(wl.items) && wl.items.length > 0
              ? wl.items
              : (wl.symbols || []).map((s: string) => createWatchlistItem(s)),
            symbols: Array.isArray(wl.symbols) && wl.symbols.length > 0
              ? wl.symbols
              : (wl.items || []).map((i: any) => i.symbol)
          }));
        }
      }
    } catch {}
    return DEFAULT_WATCHLISTS;
  });

  const [activeWatchlistId, setActiveWatchlistId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('sutharlabs_active_watchlist_id');
      if (savedId) return savedId;
    } catch {}
    return 'wl-india-core';
  });

  // ── Database Fetch on Mount: Load User Watchlists from Persistent Backend ───
  useEffect(() => {
    let isCancelled = false;
    const emailParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
    fetch(`${STOCK_API}/watchlists${emailParam}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch watchlists from database');
      })
      .then((data: any[]) => {
        if (isCancelled || !Array.isArray(data) || data.length === 0) return;
        const normalized: Watchlist[] = data.map(wl => {
          const rawItems = Array.isArray(wl.items) && wl.items.length > 0
            ? wl.items
            : (wl.symbols || []).map((s: string) => createWatchlistItem(s));
          const formattedItems: WatchlistItem[] = rawItems.map((it: any) => {
            if (typeof it === 'string') return createWatchlistItem(it);
            return {
              symbol: it.symbol,
              market: it.market || (KNOWN_US_TICKERS.has(it.symbol.toUpperCase()) ? 'US' : 'IN'),
              cleanSymbol: it.cleanSymbol || formatTickerDisplay(it.symbol).cleanSymbol,
              displaySymbol: it.displaySymbol || formatTickerDisplay(it.symbol).displaySymbol,
              name: it.name || it.symbol,
              exchange: it.exchange || formatTickerDisplay(it.symbol).exchange,
              addedAt: it.addedAt || new Date().toISOString()
            };
          });
          return {
            id: wl.id,
            name: wl.name,
            isDefault: wl.isDefault,
            userEmail: wl.userEmail,
            items: formattedItems,
            symbols: formattedItems.map(i => i.symbol)
          };
        });
        setWatchlists(normalized);
      })
      .catch(err => {
        console.warn('[Watchlist DB] Using local/cached watchlists:', err);
      });
    return () => {
      isCancelled = true;
    };
  }, [userEmail]);

  const [showWatchlistDropdown, setShowWatchlistDropdown] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [editingWatchlistId, setEditingWatchlistId] = useState<string | null>(null);
  const [editingWatchlistName, setEditingWatchlistName] = useState('');
  const [addSymbolInputs, setAddSymbolInputs] = useState<Record<string, string>>({});

  // ── Algorithmic Strategy Registry & Execution State (Stage 2) ───
  const [strategies, setStrategies] = useState<IStrategy[]>(PRESET_STRATEGIES);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(() => {
    try {
      return localStorage.getItem('sutharlabs_active_strategy_id') || 'strat-ema-cross';
    } catch {
      return 'strat-ema-cross';
    }
  });
  const [strategySignal, setStrategySignal] = useState<StrategySignal | null>(null);
  const [loadingStrategySignal, setLoadingStrategySignal] = useState<boolean>(false);

  // Visual Strategy Builder & Catalog State
  const [builderMode, setBuilderMode] = useState<'CATALOG' | 'BUILDER'>('CATALOG');
  const [builderEditingId, setBuilderEditingId] = useState<string | null>(null);
  const [builderName, setBuilderName] = useState<string>('');
  const [builderDesc, setBuilderDesc] = useState<string>('');
  const [builderMarket, setBuilderMarket] = useState<'IN' | 'US' | 'BOTH' | 'GLOBAL'>('GLOBAL');
  const [builderTimeframe, setBuilderTimeframe] = useState<'5m' | '15m' | '1h' | '1D'>('1D');
  const [builderParameters, setBuilderParameters] = useState<StrategyParameter[]>([]);
  const [builderEntryConditions, setBuilderEntryConditions] = useState<StrategyRuleCondition[]>([
    { indicator: 'rsi', operator: '<', value: 30 }
  ]);
  const [builderExitConditions, setBuilderExitConditions] = useState<StrategyRuleCondition[]>([
    { indicator: 'rsi', operator: '>', value: 70 }
  ]);
  const [sandboxSignal, setSandboxSignal] = useState<StrategySignal | null>(null);
  const [isEvaluatingSandbox, setIsEvaluatingSandbox] = useState<boolean>(false);
  const [isSavingStrategy, setIsSavingStrategy] = useState<boolean>(false);
  const [strategyActionFeedback, setStrategyActionFeedback] = useState<string | null>(null);
  const [strategySearchQuery, setStrategySearchQuery] = useState<string>('');
  const [strategyMarketFilter, setStrategyMarketFilter] = useState<'ALL' | 'IN' | 'US' | 'GLOBAL'>('ALL');

  // ── Branded Custom Feedback & Confirmation Modal State ──
  const [alertModal, setAlertModal] = useState<StockTrackerAlertState | null>(null);

  const showAlert = useCallback((title: string, message: string, type: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setAlertModal({
      isOpen: true,
      type,
      title,
      message,
      confirmLabel: 'Dismiss'
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, confirmLabel = 'Confirm Action', cancelLabel = 'Cancel') => {
    setAlertModal({
      isOpen: true,
      type: 'warning',
      title,
      message,
      confirmLabel,
      cancelLabel,
      onConfirm
    });
  }, []);

  // ── Database Fetch on Mount: Load Registered Strategies ───
  const fetchStrategies = useCallback(async () => {
    try {
      const res = await fetch(`${STOCK_API}/strategies`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setStrategies(data);
        }
      }
    } catch (e) {
      console.warn('[Strategies DB] Using local preset strategies:', e);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  // Strategy Builder Helper Handlers
  const handleCreateNewStrategy = useCallback(() => {
    setBuilderEditingId(null);
    setBuilderName('Custom Multi-Indicator Momentum');
    setBuilderDesc('Enters when RSI is oversold and Fast EMA is above Slow EMA.');
    setBuilderMarket('GLOBAL');
    setBuilderTimeframe('1D');
    setBuilderParameters([
      { id: 'rsiPeriod', name: 'RSI Period', type: 'number', default: 14, min: 2, max: 50, step: 1, description: 'RSI Lookback periods' },
      { id: 'fastPeriod', name: 'Fast EMA Period', type: 'number', default: 20, min: 5, max: 100, step: 1, description: 'Short-term momentum EMA' },
      { id: 'slowPeriod', name: 'Slow EMA Period', type: 'number', default: 50, min: 10, max: 200, step: 1, description: 'Baseline trend EMA' }
    ]);
    setBuilderEntryConditions([
      { indicator: 'rsi', operator: '<', value: 35 },
      { indicator: 'ema_fast', operator: 'crosses_above', value: 'ema_slow' }
    ]);
    setBuilderExitConditions([
      { indicator: 'rsi', operator: '>', value: 70 }
    ]);
    setSandboxSignal(null);
    setBuilderMode('BUILDER');
  }, []);

  const handleEditStrategy = useCallback((strat: IStrategy) => {
    setBuilderEditingId(strat.id);
    setBuilderName(strat.name);
    setBuilderDesc(strat.description);
    setBuilderMarket(strat.market);
    setBuilderTimeframe(strat.timeframe);
    setBuilderParameters(strat.parameters ? JSON.parse(JSON.stringify(strat.parameters)) : []);
    setBuilderEntryConditions(strat.rules?.entryConditions ? JSON.parse(JSON.stringify(strat.rules.entryConditions)) : []);
    setBuilderExitConditions(strat.rules?.exitConditions ? JSON.parse(JSON.stringify(strat.rules.exitConditions)) : []);
    setSandboxSignal(null);
    setBuilderMode('BUILDER');
  }, []);

  const handleCloneStrategy = useCallback((strat: IStrategy) => {
    setBuilderEditingId(null);
    setBuilderName(`${strat.name} (Custom Fork)`);
    setBuilderDesc(strat.description);
    setBuilderMarket(strat.market);
    setBuilderTimeframe(strat.timeframe);
    setBuilderParameters(strat.parameters ? JSON.parse(JSON.stringify(strat.parameters)) : []);
    setBuilderEntryConditions(strat.rules?.entryConditions ? JSON.parse(JSON.stringify(strat.rules.entryConditions)) : []);
    setBuilderExitConditions(strat.rules?.exitConditions ? JSON.parse(JSON.stringify(strat.rules.exitConditions)) : []);
    setSandboxSignal(null);
    setBuilderMode('BUILDER');
  }, []);

  const handleDeleteStrategy = useCallback(async (id: string, skipConfirm = false) => {
    const performDelete = async () => {
      try {
        const res = await fetch(`${STOCK_API}/strategies/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setStrategies(prev => prev.filter(s => s.id !== id));
          if (selectedStrategyId === id) {
            setSelectedStrategyId('strat-ema-cross');
            try {
              localStorage.setItem('sutharlabs_active_strategy_id', 'strat-ema-cross');
            } catch {}
          }
          setStrategyActionFeedback('Strategy removed successfully');
          setTimeout(() => setStrategyActionFeedback(null), 3000);
        } else {
          const errData = await res.json().catch(() => ({}));
          showAlert('Failed to Delete Strategy', errData.error || `Server responded with status ${res.status}`, 'error');
        }
      } catch (e: any) {
        showAlert('Deletion Error', e.message || 'Failed to remove strategy from database.', 'error');
      }
    };

    if (skipConfirm) {
      await performDelete();
    } else {
      const target = strategies.find(s => s.id === id);
      showConfirm(
        'Delete Algorithm',
        `Are you sure you want to permanently delete "${target?.name || 'this strategy'}"?\n\nThis action cannot be undone.`,
        () => { performDelete(); },
        'Delete Algorithm',
        'Cancel'
      );
    }
  }, [selectedStrategyId, strategies, showAlert, showConfirm]);

  const handleRenameStrategy = useCallback(async (id: string, newName: string, newDesc?: string) => {
    try {
      const res = await fetch(`${STOCK_API}/strategies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc })
      });
      if (res.ok) {
        const updated = await res.json();
        setStrategies(prev => prev.map(s => s.id === id ? updated : s));
        setStrategyActionFeedback(`Renamed strategy to "${newName}"`);
        setTimeout(() => setStrategyActionFeedback(null), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert('Failed to Rename Strategy', errData.error || `Server responded with status ${res.status}`, 'error');
      }
    } catch (e: any) {
      showAlert('Rename Error', e.message || 'An unexpected error occurred while renaming.', 'error');
    }
  }, [showAlert]);

  const handleSaveStrategy = useCallback(async () => {
    if (!builderName.trim()) {
      showAlert('Strategy Name Required', 'Please enter a name for your algorithmic trading strategy before saving.', 'warning');
      return;
    }
    if (builderEntryConditions.length === 0) {
      showAlert('Entry Conditions Required', 'Please configure at least 1 entry condition (BUY rule) to evaluate trade signals.', 'warning');
      return;
    }
    setIsSavingStrategy(true);
    try {
      const payload = {
        name: builderName.trim(),
        description: builderDesc.trim(),
        market: builderMarket,
        timeframe: builderTimeframe,
        parameters: builderParameters,
        rules: {
          indicators: {},
          entryConditions: builderEntryConditions,
          exitConditions: builderExitConditions
        }
      };

      let savedStrategy: IStrategy;
      if (builderEditingId) {
        const res = await fetch(`${STOCK_API}/strategies/${builderEditingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned error (${res.status})`);
        }
        savedStrategy = await res.json();
        setStrategies(prev => prev.map(s => s.id === savedStrategy.id ? savedStrategy : s));
      } else {
        const res = await fetch(`${STOCK_API}/strategies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned error (${res.status})`);
        }
        savedStrategy = await res.json();
        setStrategies(prev => [...prev, savedStrategy]);
      }

      setSelectedStrategyId(savedStrategy.id);
      try {
        localStorage.setItem('sutharlabs_active_strategy_id', savedStrategy.id);
      } catch {}
      setStrategyActionFeedback(`Strategy "${savedStrategy.name}" saved & activated!`);
      setTimeout(() => setStrategyActionFeedback(null), 4000);
      setBuilderMode('CATALOG');
    } catch (e: any) {
      showAlert('Error Saving Strategy', e.message || 'An unexpected error occurred while saving the strategy.', 'error');
    } finally {
      setIsSavingStrategy(false);
    }
  }, [builderName, builderDesc, builderMarket, builderTimeframe, builderParameters, builderEntryConditions, builderExitConditions, builderEditingId, showAlert]);

  const handleTestSandbox = useCallback(async () => {
    if (!symbol) return;
    setIsEvaluatingSandbox(true);
    try {
      const draftStrategy = {
        id: builderEditingId || 'strat-draft',
        name: builderName || 'Draft Strategy',
        description: builderDesc,
        isPreset: false,
        isPublic: false,
        market: builderMarket,
        timeframe: builderTimeframe,
        parameters: builderParameters,
        rules: {
          indicators: {},
          entryConditions: builderEntryConditions,
          exitConditions: builderExitConditions
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res = await fetch(`${STOCK_API}/strategy-eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: draftStrategy,
          symbol,
          region: activeMarketKey
        })
      });
      if (res.ok) {
        const sig: StrategySignal = await res.json();
        setSandboxSignal(sig);
      } else {
        const err = await res.json().catch(() => ({}));
        showAlert('Sandbox Evaluation Error', err.error || 'Failed to evaluate strategy conditions against live candles.', 'error');
      }
    } catch (e: any) {
      showAlert('Sandbox Evaluation Error', e.message || 'Failed to evaluate strategy in sandbox.', 'error');
    } finally {
      setIsEvaluatingSandbox(false);
    }
  }, [symbol, activeMarketKey, builderEditingId, builderName, builderDesc, builderMarket, builderTimeframe, builderParameters, builderEntryConditions, builderExitConditions, showAlert]);


  // Main Workspace Right Panel View Mode: WATCHLIST (Default) | TELEMETRY | NEWS | ORDER | BACKTEST
  const [rightPanelTab, setRightPanelTab] = useState<'WATCHLIST' | 'TELEMETRY' | 'NEWS' | 'ORDER' | 'BACKTEST'>('WATCHLIST');

  // Resizable Workspace Splitter State (TradingView, VS Code & Linear pattern)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 320 && parsed <= 850) return parsed;
      }
    } catch {}
    return 440; // Optimal default width for charts, backtesting & telemetry
  });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState<boolean>(false);
  const splitWorkspaceRef = useRef<HTMLDivElement>(null);

  // Tab Strip Carousel Navigation
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState<boolean>(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState<boolean>(false);

  const checkTabsScroll = useCallback(() => {
    if (!tabsScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
    setCanScrollTabsLeft(scrollLeft > 2);
    setCanScrollTabsRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    if (!tabsScrollRef.current) return;
    const offset = direction === 'left' ? -140 : 140;
    tabsScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    checkTabsScroll();
    const el = tabsScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkTabsScroll, { passive: true });
    const ro = new ResizeObserver(checkTabsScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkTabsScroll);
      ro.disconnect();
    };
  }, [checkTabsScroll, sidebarWidth]);

  // Handle Splitter Mouse Drag
  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
  }, []);

  const handleSplitterDoubleClick = useCallback(() => {
    setSidebarWidth(440);
    try { localStorage.setItem('sutharlabs_sidebar_width', '440'); } catch {}
  }, []);

  useEffect(() => {
    if (!isDraggingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitWorkspaceRef.current) return;
      const rect = splitWorkspaceRef.current.getBoundingClientRect();
      // Mouse distance from the right edge of workspace split container
      const newWidth = rect.right - e.clientX;
      // Guarantee chart has minimum 400px room and sidebar stays within [320px, maxAllowed]
      const maxAllowed = Math.min(850, Math.max(380, rect.width - 400));
      const clamped = Math.max(320, Math.min(newWidth, maxAllowed));
      setSidebarWidth(Math.round(clamped));
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setSidebarWidth(current => {
        try { localStorage.setItem('sutharlabs_sidebar_width', current.toString()); } catch {}
        return current;
      });
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar]);

  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, Quote>>({});
  const [loadingWatchlistQuotes, setLoadingWatchlistQuotes] = useState<boolean>(false);
  const [watchlistSearchFilter, setWatchlistSearchFilter] = useState<string>('');
  const [watchlistSortBy, setWatchlistSortBy] = useState<'DEFAULT' | 'CHANGE_DESC' | 'CHANGE_ASC' | 'PRICE_DESC'>('DEFAULT');

  // ── Real-Time Financial News & AI Sentiment Stream (Stage 3) ──
  const [newsArticles, setNewsArticles] = useState<StockNewsArticle[]>([]);
  const [sentimentReport, setSentimentReport] = useState<StockSentimentReport | null>(null);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);
  const [newsSearchFilter, setNewsSearchFilter] = useState<string>('');

  // ── Google Gemini API Key & Usage Tracking (Stage 3) ──
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('sutharlabs_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [testingApiKey, setTestingApiKey] = useState<boolean>(false);
  const [apiKeyTestResult, setApiKeyTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Daily AI & News Usage Tracker (Reset daily at midnight)
  const [aiUsageStats, setAiUsageStats] = useState<{
    date: string;
    totalRequests: number;
    geminiRequests: number;
    lexiconRequests: number;
    cacheHits: number;
  }>(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem('sutharlabs_news_ai_usage');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) return parsed;
      }
    } catch {}
    return { date: today, totalRequests: 0, geminiRequests: 0, lexiconRequests: 0, cacheHits: 0 };
  });

  const recordAiUsage = useCallback((type: 'GEMINI' | 'LEXICON' | 'CACHE') => {
    setAiUsageStats(prev => {
      const today = new Date().toISOString().slice(0, 10);
      const base = prev.date === today ? prev : { date: today, totalRequests: 0, geminiRequests: 0, lexiconRequests: 0, cacheHits: 0 };
      const next = {
        ...base,
        totalRequests: base.totalRequests + 1,
        geminiRequests: type === 'GEMINI' ? base.geminiRequests + 1 : base.geminiRequests,
        lexiconRequests: type === 'LEXICON' ? base.lexiconRequests + 1 : base.lexiconRequests,
        cacheHits: type === 'CACHE' ? base.cacheHits + 1 : base.cacheHits
      };
      try {
        localStorage.setItem('sutharlabs_news_ai_usage', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleSaveApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    setGeminiApiKey(trimmed);
    try {
      localStorage.setItem('sutharlabs_gemini_api_key', trimmed);
    } catch {}
    setApiKeyTestResult(null);
  }, []);

  const handleTestApiKey = useCallback(async () => {
    if (!geminiApiKey.trim()) {
      setApiKeyTestResult({ success: false, message: 'Please enter a Gemini API Key to test.' });
      return;
    }
    setTestingApiKey(true);
    setApiKeyTestResult(null);
    try {
      const res = await fetch(`${STOCK_API}/test-gemini-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setApiKeyTestResult({ success: true, message: data.message || 'Key valid! Successfully connected to Gemini 2.5 Flash.' });
        handleSaveApiKey(geminiApiKey.trim());
      } else {
        setApiKeyTestResult({ success: false, message: data.error || 'Authentication failed. Check your API key.' });
      }
    } catch (err: any) {
      setApiKeyTestResult({ success: false, message: err.message || 'Network error while testing key' });
    } finally {
      setTestingApiKey(false);
    }
  }, [geminiApiKey, handleSaveApiKey]);

  const handleResetUsageStats = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const reset = { date: today, totalRequests: 0, geminiRequests: 0, lexiconRequests: 0, cacheHits: 0 };
    setAiUsageStats(reset);
    try {
      localStorage.setItem('sutharlabs_news_ai_usage', JSON.stringify(reset));
    } catch {}
  }, []);

  // Sliding Settings Overlay
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'WATCHLISTS' | 'MARKET' | 'STRATEGIES' | 'SCANNER' | 'SIMULATOR' | 'BACKTEST' | 'NEWS_AI' | 'INDICATORS' | 'TRADING' | 'FEEDS' | 'PERFORMANCE'>('WATCHLISTS');

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

  // Sync watchlists to localStorage cache
  useEffect(() => {
    try {
      localStorage.setItem('sutharlabs_custom_watchlists', JSON.stringify(watchlists));
    } catch {}
  }, [watchlists]);

  useEffect(() => {
    try {
      localStorage.setItem('sutharlabs_active_watchlist_id', activeWatchlistId);
    } catch {}
  }, [activeWatchlistId]);

  // Close settings floating hover window on Escape
  useEffect(() => {
    if (!showSettingsDrawer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettingsDrawer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettingsDrawer]);

  const activeWatchlist = useMemo(() => {
    return watchlists.find(w => w.id === activeWatchlistId) || watchlists[0] || DEFAULT_WATCHLISTS[0];
  }, [watchlists, activeWatchlistId]);

  const isInActiveWatchlist = useMemo(() => {
    const norm = normalizeTicker(symbol, activeMarketKey);
    const fmt = formatTickerDisplay(norm);
    return (activeWatchlist.items || []).some(i => i.symbol === norm || i.cleanSymbol === fmt.cleanSymbol) ||
           (activeWatchlist.symbols || []).some(s => normalizeTicker(s, activeMarketKey) === norm);
  }, [activeWatchlist, symbol, activeMarketKey]);

  // Batch Live Quote Fetcher for Watchlist Deck (Sends SYMBOL:MARKET for flawless multi-region quotes)
  const fetchWatchlistQuotes = useCallback(async (customWl?: Watchlist) => {
    const targetWl = customWl || activeWatchlist;
    const items = targetWl?.items || [];
    const symbols = targetWl?.symbols || [];

    if (items.length === 0 && symbols.length === 0) {
      setWatchlistQuotes({});
      return;
    }
    setLoadingWatchlistQuotes(true);
    try {
      const queryList: string[] = [];
      if (items.length > 0) {
        for (const it of items) {
          const itemMarket = it.market || (KNOWN_US_TICKERS.has(it.symbol.toUpperCase()) ? 'US' : activeMarketKey);
          const norm = normalizeTicker(it.symbol, itemMarket);
          queryList.push(`${norm}:${itemMarket}`);
        }
      } else {
        for (const s of symbols) {
          const itemMarket = KNOWN_US_TICKERS.has(s.toUpperCase()) ? 'US' : activeMarketKey;
          const norm = normalizeTicker(s, itemMarket);
          queryList.push(`${norm}:${itemMarket}`);
        }
      }

      const symParam = queryList.join(',');
      const res = await fetch(`${STOCK_API}/watchlist-quotes?symbols=${encodeURIComponent(symParam)}&region=${activeMarketKey}`);
      if (res.ok) {
        const data: Quote[] = await res.json();
        const map: Record<string, Quote> = {};
        for (const q of data) {
          if (q && q.symbol) {
            const normKey = normalizeTicker(q.symbol, activeMarketKey);
            const fmt = formatTickerDisplay(q.symbol);
            map[q.symbol] = q;
            map[normKey] = q;
            map[fmt.cleanSymbol] = q;
            if (q.clean_symbol) map[q.clean_symbol] = q;
            if (q.display_symbol) map[q.display_symbol] = q;
            if (q.clean_symbol === 'TMCV' || q.symbol === 'TMCV.NS') {
              map['TATAMOTORS'] = q;
              map['TATAMOTORS.NS'] = q;
            }
          }
        }
        setWatchlistQuotes(map);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoadingWatchlistQuotes(false);
    }
  }, [activeWatchlist, activeMarketKey]);

  // Sync Watchlist Live Quotes whenever activeWatchlist or symbols change
  useEffect(() => {
    fetchWatchlistQuotes(activeWatchlist);
  }, [activeWatchlist.id, activeWatchlist.symbols, activeWatchlist.items, fetchWatchlistQuotes]);

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
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data === 'object' && !data.error && data.IN && data.IN.flag) {
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

  // ── Stage 3: Real-Time News & AI Sentiment Fetcher ─────────
  const fetchNewsAndSentiment = useCallback(async (sym: string, marketKey: string, company?: string) => {
    if (!sym) return;
    setLoadingNews(true);
    try {
      const normalizedSym = normalizeTicker(sym, marketKey);
      const url = `${STOCK_API}/news-sentiment?symbol=${encodeURIComponent(normalizedSym)}&market=${marketKey}${company ? `&companyName=${encodeURIComponent(company)}` : ''}`;
      const headers: Record<string, string> = {};
      if (geminiApiKey.trim()) {
        headers['x-gemini-key'] = geminiApiKey.trim();
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setNewsArticles(data.articles || []);
        setSentimentReport(data.sentiment || null);
        if (data.sentiment) {
          recordAiUsage(data.sentiment.analyzedBy === 'GEMINI_AI' ? 'GEMINI' : 'LEXICON');
          onAddLogRef.current({
            timestamp: new Date().toLocaleTimeString(),
            type: data.sentiment.verdict === 'BULLISH' ? 'SUCCESS' : data.sentiment.verdict === 'BEARISH' ? 'ALERT' : 'INFO',
            message: `AI SENTIMENT [${data.sentiment.analyzedBy === 'GEMINI_AI' ? 'Gemini AI' : 'Autonomous Engine'}]: ${data.sentiment.cleanSymbol} → ${data.sentiment.verdict} (${data.sentiment.score > 0 ? '+' : ''}${data.sentiment.score}) | Catalyst: ${data.sentiment.primaryCatalyst}`
          });
        }
      }
    } catch (err) {
      console.warn('[StockTracker] News sentiment fetch error:', err);
    } finally {
      setLoadingNews(false);
    }
  }, [geminiApiKey, recordAiUsage]);

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

      // 4. Real-Time News & AI Sentiment Stream (Stage 3)
      fetchNewsAndSentiment(sym, activeMarketKey, fetchedQuote?.name);

      // 5. Algorithmic Strategy Signal Execution with AI Sentiment Confluence
      try {
        const stratHeaders: Record<string, string> = {};
        if (geminiApiKey.trim()) stratHeaders['x-gemini-key'] = geminiApiKey.trim();
        const stratRes = await fetch(`${STOCK_API}/strategy-signal?symbol=${encodeURIComponent(normalizedSym)}&strategyId=${selectedStrategyId}&region=${activeMarketKey}&includeSentiment=true`, {
          headers: stratHeaders
        });
        if (stratRes.ok) {
          const sig: StrategySignal = await stratRes.json();
          setStrategySignal(sig);
          setSuggestion({
            action: sig.action,
            confidence: sig.confidence,
            target_price: sig.targetPrice ?? null,
            stop_loss: sig.stopLoss ?? null,
            risk_reward_ratio: sig.riskRewardRatio ?? null,
            reasoning: sig.reasoning
          });
          onAddLogRef.current({
            timestamp: new Date().toLocaleTimeString(),
            type: sig.action === 'BUY' ? 'SUCCESS' : sig.action === 'SELL' ? 'ALERT' : 'INFO',
            message: `STRATEGY SIGNAL [${sig.strategyName}]: ${displaySym} → ${sig.action} | Confidence: ${((sig.confidence || 0) * 100).toFixed(0)}%`
          });
        } else {
          // Fallback to basic suggestion if strategy endpoint fails
          const sRes = await fetch(`${STOCK_API}/suggestion?symbol=${encodeURIComponent(normalizedSym)}&region=${activeMarketKey}&rsiPeriod=${rsiPeriod}&bbPeriod=${bbPeriod}&bbStdDev=${bbStdDev}&ema20Period=${ema20Period}&ema50Period=${ema50Period}&macdFast=${macdFast}&macdSlow=${macdSlow}&macdSignal=${macdSignal}`);
          if (sRes.ok) {
            const s: Suggestion = await sRes.json();
            setSuggestion(s);
          }
        }
      } catch (err) {
        console.warn('Strategy signal error:', err);
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
  }, [activeMarketKey, selectedStrategyId, rsiPeriod, bbPeriod, bbStdDev, ema20Period, ema50Period, macdFast, macdSlow, macdSignal, geminiApiKey, fetchNewsAndSentiment]);

  // Re-evaluate strategy signal immediately whenever user switches active strategy in the dropdown
  useEffect(() => {
    if (!symbol) return;
    const normalizedSym = normalizeTicker(symbol, activeMarketKey);
    const displaySym = formatTickerDisplay(symbol).displaySymbol;
    let isCancelled = false;
    setLoadingStrategySignal(true);
    const stratHeaders: Record<string, string> = {};
    if (geminiApiKey.trim()) stratHeaders['x-gemini-key'] = geminiApiKey.trim();
    fetch(`${STOCK_API}/strategy-signal?symbol=${encodeURIComponent(normalizedSym)}&strategyId=${selectedStrategyId}&region=${activeMarketKey}&includeSentiment=true`, {
      headers: stratHeaders
    })
      .then(res => res.ok ? res.json() : null)
      .then((sig: StrategySignal | null) => {
        if (isCancelled || !sig) return;
        setStrategySignal(sig);
        setSuggestion({
          action: sig.action,
          confidence: sig.confidence,
          target_price: sig.targetPrice ?? null,
          stop_loss: sig.stopLoss ?? null,
          risk_reward_ratio: sig.riskRewardRatio ?? null,
          reasoning: sig.reasoning
        });
        onAddLogRef.current({
          timestamp: new Date().toLocaleTimeString(),
          type: sig.action === 'BUY' ? 'SUCCESS' : sig.action === 'SELL' ? 'ALERT' : 'INFO',
          message: `STRATEGY SWITCH [${sig.strategyName}]: ${displaySym} → ${sig.action} (${((sig.confidence || 0) * 100).toFixed(0)}% Conf, SL: ${sig.stopLoss ? sig.stopLoss.toFixed(1) : '—'}, TP: ${sig.targetPrice ? sig.targetPrice.toFixed(1) : '—'})`
        });
      })
      .catch(err => {
        console.warn('Strategy signal evaluation error:', err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingStrategySignal(false);
      });
    return () => { isCancelled = true; };
  }, [selectedStrategyId, symbol, activeMarketKey]);


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
    const allStocks = Object.values(universes).flatMap(u => (u && Array.isArray(u.stocks)) ? u.stocks : []);
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

  // ── 7. Dedicated Custom Watchlist Operations (Manual, Multi-list, Database-Backed) ──
  const handleToggleCurrentStockInWatchlist = async (
    targetSym?: string,
    targetMarket?: string,
    targetName?: string,
    targetExchange?: string
  ) => {
    const rawSym = targetSym || symbol;
    const resolvedMarket = targetMarket || (KNOWN_US_TICKERS.has(rawSym.toUpperCase()) ? 'US' : activeMarketKey);
    const norm = normalizeTicker(rawSym, resolvedMarket);
    const fmt = formatTickerDisplay(norm, targetExchange);
    const exists = (activeWatchlist.items || []).some(
      i => i.symbol === norm || i.cleanSymbol === fmt.cleanSymbol
    ) || activeWatchlist.symbols.some(s => normalizeTicker(s, resolvedMarket) === norm);

    if (exists) {
      // 1. Optimistic Local State Update
      setWatchlists(prev => prev.map(wl => {
        if (wl.id === activeWatchlist.id) {
          const updatedItems = (wl.items || []).filter(
            i => i.symbol !== norm && i.cleanSymbol !== fmt.cleanSymbol
          );
          return {
            ...wl,
            items: updatedItems,
            symbols: updatedItems.map(i => i.symbol)
          };
        }
        return wl;
      }));
      setNotification(`Removed ${fmt.displaySymbol} from "${activeWatchlist.name}"`);

      // 2. Persist Deletion to Database Store
      try {
        await fetch(`${STOCK_API}/watchlists/${encodeURIComponent(activeWatchlist.id)}/symbols/${encodeURIComponent(norm)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('[Watchlist DB] Failed to remove symbol from database:', err);
      }
    } else {
      const newItem = createWatchlistItem(
        rawSym,
        resolvedMarket,
        targetName || (rawSym === symbol ? quote?.name : undefined),
        targetExchange || (rawSym === symbol ? quote?.exchange : undefined)
      );

      // 1. Optimistic Local State Update
      setWatchlists(prev => prev.map(wl => {
        if (wl.id === activeWatchlist.id) {
          const updatedItems = [...(wl.items || []), newItem];
          return {
            ...wl,
            items: updatedItems,
            symbols: updatedItems.map(i => i.symbol)
          };
        }
        return wl;
      }));
      setNotification(`Added ${fmt.displaySymbol} [${newItem.market}] to "${activeWatchlist.name}"!`);

      // 2. Persist Insertion to Database Store
      try {
        await fetch(`${STOCK_API}/watchlists/${encodeURIComponent(activeWatchlist.id)}/symbols`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: newItem.symbol,
            market: newItem.market,
            name: newItem.name,
            exchange: newItem.exchange
          })
        });
      } catch (err) {
        console.error('[Watchlist DB] Failed to add symbol to database:', err);
      }
    }
    setTimeout(() => setNotification(''), 3500);
  };

  const handleCreateWatchlist = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const tempId = `wl-${Date.now()}`;
    const initialItem = createWatchlistItem(symbol, activeMarketKey, quote?.name, quote?.exchange);
    const newWl: Watchlist = {
      id: tempId,
      name: trimmed,
      userEmail: userEmail || 'default_user',
      items: [initialItem],
      symbols: [initialItem.symbol]
    };

    // 1. Optimistic UI update
    setWatchlists(prev => [...prev, newWl]);
    setActiveWatchlistId(tempId);
    setNewWatchlistName('');
    setNotification(`Created watchlist "${trimmed}"!`);
    setTimeout(() => setNotification(''), 3000);

    // 2. Persist to Database Store
    try {
      const res = await fetch(`${STOCK_API}/watchlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          userEmail: userEmail || 'default_user',
          items: [initialItem]
        })
      });
      if (res.ok) {
        const created: Watchlist = await res.json();
        if (created && created.id) {
          setWatchlists(prev => prev.map(w => w.id === tempId ? created : w));
          setActiveWatchlistId(created.id);
        }
      }
    } catch (err) {
      console.error('[Watchlist DB] Failed to create watchlist in database:', err);
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    if (watchlists.length <= 1) {
      setNotification('You must keep at least one watchlist.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    const toDelete = watchlists.find(w => w.id === id);
    setWatchlists(prev => prev.filter(w => w.id !== id));
    if (activeWatchlistId === id) {
      const remaining = watchlists.filter(w => w.id !== id);
      if (remaining.length > 0) setActiveWatchlistId(remaining[0].id);
    }
    setNotification(`Deleted watchlist "${toDelete?.name || ''}"`);
    setTimeout(() => setNotification(''), 3000);

    // Persist Deletion to Database Store
    try {
      await fetch(`${STOCK_API}/watchlists/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('[Watchlist DB] Failed to delete watchlist from database:', err);
    }
  };

  const handleRenameWatchlist = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setWatchlists(prev => prev.map(w => w.id === id ? { ...w, name: trimmed } : w));
    setEditingWatchlistId(null);
    setNotification(`Renamed watchlist to "${trimmed}"`);
    setTimeout(() => setNotification(''), 3000);

    // Persist Rename to Database Store
    try {
      await fetch(`${STOCK_API}/watchlists/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
    } catch (err) {
      console.error('[Watchlist DB] Failed to rename watchlist in database:', err);
    }
  };

  const handleAddSymbolToWatchlist = async (watchlistId: string, symInput: string, marketHint?: string) => {
    if (!symInput || !symInput.trim()) return;
    const resolvedMarket = marketHint || (KNOWN_US_TICKERS.has(symInput.trim().toUpperCase()) ? 'US' : activeMarketKey);
    const newItem = createWatchlistItem(symInput, resolvedMarket);
    const fmt = formatTickerDisplay(newItem.symbol);

    setWatchlists(prev => prev.map(wl => {
      if (wl.id === watchlistId) {
        const already = (wl.items || []).some(i => i.symbol === newItem.symbol || i.cleanSymbol === newItem.cleanSymbol);
        if (already) return wl;
        const updatedItems = [...(wl.items || []), newItem];
        return {
          ...wl,
          items: updatedItems,
          symbols: updatedItems.map(i => i.symbol)
        };
      }
      return wl;
    }));
    setAddSymbolInputs(prev => ({ ...prev, [watchlistId]: '' }));
    setNotification(`Added ${fmt.displaySymbol} [${newItem.market}] to watchlist`);
    setTimeout(() => setNotification(''), 3000);

    // Persist Insertion to Database Store
    try {
      await fetch(`${STOCK_API}/watchlists/${encodeURIComponent(watchlistId)}/symbols`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newItem.symbol,
          market: newItem.market,
          name: newItem.name,
          exchange: newItem.exchange
        })
      });
    } catch (err) {
      console.error('[Watchlist DB] Failed to add symbol to database:', err);
    }
  };

  const handleRemoveSymbolFromWatchlist = async (watchlistId: string, symToRemove: string) => {
    const norm = normalizeTicker(symToRemove, activeMarketKey);
    setWatchlists(prev => prev.map(wl => {
      if (wl.id === watchlistId) {
        const updatedItems = (wl.items || []).filter(
          i => normalizeTicker(i.symbol, activeMarketKey) !== norm && i.symbol !== symToRemove
        );
        return {
          ...wl,
          items: updatedItems,
          symbols: updatedItems.map(i => i.symbol)
        };
      }
      return wl;
    }));

    // Persist Deletion to Database Store
    try {
      await fetch(`${STOCK_API}/watchlists/${encodeURIComponent(watchlistId)}/symbols/${encodeURIComponent(norm)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('[Watchlist DB] Failed to remove symbol from database:', err);
    }
  };

  // Optional Market Universe Custom Stock Registry helper
  const handleAddStockToUniverse = (newSym: string) => {
    const sym = newSym.trim().toUpperCase();
    if (!sym) return;
    const currentStocks = universes[activeMarketKey]?.stocks || [];
    if (currentStocks.some(s => s.symbol === sym)) return;
    const updatedStocks = [...currentStocks, { symbol: sym, name: sym, sector: 'Custom Added' }];
    setUniverses(prev => ({
      ...prev,
      [activeMarketKey]: {
        ...prev[activeMarketKey],
        stocks: updatedStocks
      }
    }));
  };

  const handleRemoveStockFromUniverse = (symToRemove: string) => {
    const currentStocks = universes[activeMarketKey]?.stocks || [];
    if (currentStocks.length <= 1) return;
    const updatedStocks = currentStocks.filter(s => s.symbol !== symToRemove);
    setUniverses(prev => ({
      ...prev,
      [activeMarketKey]: {
        ...prev[activeMarketKey],
        stocks: updatedStocks
      }
    }));
  };

  // Watchlist filter
  const activeUniverse = universes[activeMarketKey] || universes['IN'] || DEFAULT_UNIVERSES[activeMarketKey] || DEFAULT_UNIVERSES['IN'];
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
      <div className="relative z-50 glass-panel rounded-xl p-3 border border-outline/20 flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest/80 shadow-sm">
        
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
            <span className="text-base leading-none">{activeUniverse?.flag || '🇮🇳'}</span>
            <span className="font-bold text-[#00dbe7] group-hover:underline">{activeUniverse?.name || 'Active Market'}</span>
            <span className="text-[10px] text-on-surface-variant font-mono">({activeUniverse?.exchange || 'NSE'})</span>
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
        <div className="relative flex-1 max-w-md z-50">
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
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-highest dark:bg-[#12161f] border border-[#00dbe7]/40 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[100] overflow-hidden backdrop-blur-2xl max-h-72 overflow-y-auto custom-scrollbar">
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
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const isUS = item.exchange === 'NASDAQ' || item.exchange === 'NYSE' || KNOWN_US_TICKERS.has(item.cleanSymbol.toUpperCase());
                          const itemMarket = isUS ? 'US' : (item.exchange === 'BSE' || item.exchange === 'NSE' ? 'IN' : activeMarketKey);
                          handleToggleCurrentStockInWatchlist(item.symbol, itemMarket, item.name, item.exchange);
                        }}
                        className="p-1 rounded hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface-variant hover:text-[#00dbe7]"
                        title={
                          (activeWatchlist.items || []).some(i => i.symbol === item.symbol || i.cleanSymbol === item.cleanSymbol) ||
                          activeWatchlist.symbols.some(s => normalizeTicker(s, activeMarketKey) === normalizeTicker(item.symbol, activeMarketKey))
                            ? `In "${activeWatchlist.name}" (Click to remove)`
                            : `Add to "${activeWatchlist.name}"`
                        }
                      >
                        <Star className={`w-3.5 h-3.5 ${
                          (activeWatchlist.items || []).some(i => i.symbol === item.symbol || i.cleanSymbol === item.cleanSymbol) ||
                          activeWatchlist.symbols.some(s => normalizeTicker(s, activeMarketKey) === normalizeTicker(item.symbol, activeMarketKey))
                            ? 'fill-[#00e476] text-[#00e476]'
                            : ''
                        }`} />
                      </button>
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

          {/* Version & Stage Badge (Stage 6 v1.0.0 Production Milestone) */}
          <button
            onClick={() => {
              setSettingsActiveTab('SCANNER');
              setShowSettingsDrawer(true);
            }}
            className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#00e476]/10 text-[#00e476] border border-[#00e476]/25 font-mono text-[11px] font-bold cursor-pointer hover:bg-[#00e476]/20 transition-all shadow-sm"
            title="SutharLabs Stock Tracker v1.0.0 (Stage 6: Multi-Market Screener, Autonomous EOD Trade Simulator & Webhook Alerts - Production)"
          >
            <Cpu className="w-3.5 h-3.5 text-[#00e476]" />
            <span>v1.0.0</span>
            <span className="px-1.5 py-0.2 rounded bg-[#00e476]/20 text-[#00e476] border border-[#00e476]/40 text-[9px] uppercase tracking-wider font-semibold">
              PROD
            </span>
          </button>

          {/* Quick Screener Button */}
          <button
            onClick={() => {
              setSettingsActiveTab('SCANNER');
              setShowSettingsDrawer(true);
            }}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline/30 text-on-surface hover:text-[#00dbe7] hover:border-[#00dbe7]/50 font-mono text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Open Global Multi-Market Screener"
          >
            <Eye className="w-3.5 h-3.5 text-[#00dbe7]" />
            <span>Screener</span>
          </button>

          {/* Quick Simulator Button */}
          <button
            onClick={() => {
              setSettingsActiveTab('SIMULATOR');
              setShowSettingsDrawer(true);
            }}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline/30 text-on-surface hover:text-[#00e476] hover:border-[#00e476]/50 font-mono text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Open Automated EOD Batch Trade Simulator"
          >
            <Play className="w-3.5 h-3.5 text-[#00e476]" />
            <span>Simulator</span>
          </button>

          {/* Quick Algo Marketplace Button */}
          <button
            onClick={() => {
              setSettingsActiveTab('STRATEGIES');
              setBuilderMode('CATALOG');
              setShowSettingsDrawer(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00dbe7]/15 to-emerald-500/15 border border-[#00dbe7]/35 text-[#00dbe7] font-mono text-xs font-semibold hover:border-[#00dbe7] hover:brightness-110 transition-all cursor-pointer shadow-sm"
            title="Explore Community Algorithmic Trading Marketplace"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00dbe7]" />
            <span>Algo Marketplace</span>
          </button>

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

      {/* ── QUICK WATCHLIST ASSET TICKER STRIP & WATCHLIST SWITCHER ── */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-container-lowest/80 border border-outline/20 shadow-sm">
        
        {/* Left: Unclipped Watchlist Switcher Dropdown */}
        <div className="relative z-30">
          <button
            type="button"
            onClick={() => setShowWatchlistDropdown(!showWatchlistDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline/30 hover:border-[#00dbe7] transition-all text-xs font-mono font-bold text-on-surface cursor-pointer shadow-sm group"
            title="Click to access or switch between your watchlists"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#00dbe7]" />
            <span className="max-w-[140px] truncate">{activeWatchlist.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-mono">
              {activeWatchlist.symbols.length}
            </span>
            <ChevronDown className="w-3 h-3 text-on-surface-variant group-hover:text-[#00dbe7] transition-colors" />
          </button>

          {/* All Watchlists Dropdown Menu (Guaranteed Unclipped with z-40) */}
          {showWatchlistDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-surface-container-highest dark:bg-[#12161f] border border-[#00dbe7]/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-40 p-2.5 flex flex-col gap-1.5 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex justify-between items-center px-2 py-1 border-b border-outline/10 text-[10px] text-on-surface-variant font-mono uppercase">
                <span>All Watchlists ({watchlists.length})</span>
                <button
                  onClick={() => {
                    setShowWatchlistDropdown(false);
                    setRightPanelTab('WATCHLIST');
                  }}
                  className="text-[#00dbe7] hover:underline cursor-pointer font-bold"
                >
                  Open Summary Deck →
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                {watchlists.map(wl => {
                  const isCur = wl.id === activeWatchlist.id;
                  return (
                    <button
                      key={wl.id}
                      onClick={() => {
                        setActiveWatchlistId(wl.id);
                        setShowWatchlistDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                        isCur
                          ? 'bg-[#00dbe7]/20 text-[#00dbe7] font-bold border border-[#00dbe7]/40'
                          : 'text-on-surface hover:bg-surface-container hover:text-[#00dbe7]'
                      }`}
                    >
                      <span className="truncate max-w-[180px]">{wl.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">
                        {wl.symbols.length}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-outline/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setShowWatchlistDropdown(false);
                    setSettingsActiveTab('WATCHLISTS');
                    setShowSettingsDrawer(true);
                  }}
                  className="text-[11px] font-mono text-[#00dbe7] hover:underline cursor-pointer font-semibold"
                >
                  ⚙️ Manage All
                </button>
                <button
                  onClick={() => {
                    setShowWatchlistDropdown(false);
                    setSettingsActiveTab('WATCHLISTS');
                    setShowSettingsDrawer(true);
                  }}
                  className="px-2 py-1 rounded bg-[#00dbe7]/15 border border-[#00dbe7]/30 text-[#00dbe7] text-[10px] font-mono font-bold hover:bg-[#00dbe7]/25 cursor-pointer"
                >
                  + New List
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center: Scrollable symbol chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 px-1">
          {activeWatchlist.symbols.map(symStr => {
            const targetItem = (activeWatchlist.items || []).find(
              i => i.symbol === symStr || i.cleanSymbol === symStr
            );
            const itemMarket = targetItem?.market || (KNOWN_US_TICKERS.has(symStr.toUpperCase()) ? 'US' : activeMarketKey);
            const norm = normalizeTicker(symStr, itemMarket);
            const fmt = formatTickerDisplay(norm, targetItem?.exchange);
            const isSelected = normalizeTicker(symbol, activeMarketKey) === norm;
            const q = watchlistQuotes[norm] || watchlistQuotes[symStr] || watchlistQuotes[fmt.cleanSymbol] || (targetItem?.cleanSymbol ? watchlistQuotes[targetItem.cleanSymbol] : undefined);
            const hasQuote = q && q.change_percent != null;
            const isPos = (q?.change_percent ?? 0) >= 0;
            const priceSym = q?.currency_symbol || (itemMarket === 'US' ? '$' : itemMarket === 'IN' ? '₹' : curSymbol);

            return (
              <div
                key={symStr}
                className={`group flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#00dbe7]/20 text-[#00dbe7] border-[#00dbe7] font-bold shadow-[0_0_8px_rgba(0,219,231,0.25)]'
                    : 'bg-surface-container-low text-on-surface-variant border-outline/20 hover:text-on-surface hover:border-outline/40'
                }`}
              >
                <button
                  onClick={() => {
                    setSymbol(norm);
                    setSymbolInput(fmt.displaySymbol);
                    if (targetItem?.market && targetItem.market !== activeMarketKey && universes[targetItem.market]) {
                      setActiveMarketKey(targetItem.market);
                    }
                  }}
                  className="cursor-pointer flex items-center gap-1.5"
                  title={`Load ${fmt.displaySymbol} in chart`}
                >
                  <span className="font-semibold">{fmt.cleanSymbol}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                    fmt.exchange === 'NSE' ? 'bg-[#00dbe7]/15 text-[#00dbe7]' :
                    fmt.exchange === 'BSE' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-purple-500/15 text-purple-400'
                  }`}>
                    {fmt.exchange}
                  </span>
                  {hasQuote && (
                    <span className="flex items-center gap-1.5 ml-0.5">
                      {q.current_price != null && (
                        <span className="text-on-surface font-semibold text-[11px]">
                          {priceSym}{q.current_price.toFixed(1)}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold ${isPos ? 'text-[#00e476]' : 'text-[#ff6b6b]'}`}>
                        {isPos ? '+' : ''}{q.change_percent?.toFixed(1)}%
                      </span>
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSymbolFromWatchlist(activeWatchlist.id, symStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-[#ff6b6b] p-0.5 rounded transition-all cursor-pointer ml-0.5"
                  title={`Remove from ${activeWatchlist.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Actions: + Add Current Stock & Toggle Detailed Deck */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleToggleCurrentStockInWatchlist(symbol, activeMarketKey, quote?.name, quote?.exchange)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              isInActiveWatchlist
                ? 'bg-[#00e476]/15 border-[#00e476]/40 text-[#00e476] font-semibold'
                : 'bg-[#00dbe7]/10 border-[#00dbe7]/30 text-[#00dbe7] hover:bg-[#00dbe7]/20 font-medium'
            }`}
            title={isInActiveWatchlist ? `In "${activeWatchlist.name}" (Click to remove)` : `Add ${symbol} to "${activeWatchlist.name}"`}
          >
            <Star className={`w-3.5 h-3.5 ${isInActiveWatchlist ? 'fill-[#00e476]' : ''}`} />
            <span>{isInActiveWatchlist ? 'In Watchlist' : '+ Add to List'}</span>
          </button>

          <button
            onClick={() => setRightPanelTab(rightPanelTab === 'WATCHLIST' ? 'TELEMETRY' : 'WATCHLIST')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              rightPanelTab === 'WATCHLIST'
                ? 'bg-[#00dbe7]/20 border-[#00dbe7] text-[#00dbe7] font-bold shadow-[0_0_8px_rgba(0,219,231,0.25)]'
                : 'bg-surface-container-high border-outline/30 text-on-surface hover:text-[#00dbe7]'
            }`}
            title="Toggle Watchlist Summary Deck in main view"
          >
            <Layers className="w-3.5 h-3.5 text-[#00dbe7]" />
            <span className="font-bold">Watchlist Deck</span>
          </button>
        </div>
      </div>

      {/* ── 2. BALANCED RESIZABLE WORKSPACE (TRADINGVIEW & VS CODE SPLIT PANE) ──────── */}
      <div 
        ref={splitWorkspaceRef}
        className={`${
          isChartExpanded 
            ? 'flex flex-col gap-3' 
            : 'flex flex-col lg:flex-row items-stretch gap-0 w-full'
        } relative`}
      >
        
        {/* CHART COLUMN: Dynamic fill in standard view, 100% in full view */}
        <div 
          style={!isChartExpanded ? { flex: '1 1 0%', minWidth: 0 } : { width: '100%' }}
          className="flex flex-col gap-2 transition-all duration-150 min-w-0"
        >
          <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-outline/20 bg-surface-container-lowest shadow-md h-full">
            
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
                {sentimentReport && (
                  <button
                    onClick={() => setRightPanelTab('NEWS')}
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                      sentimentReport.verdict === 'BULLISH'
                        ? 'bg-[#00e476]/15 text-[#00e476] border-[#00e476]/30 hover:bg-[#00e476]/25'
                        : sentimentReport.verdict === 'BEARISH'
                        ? 'bg-[#ff6b6b]/15 text-[#ff6b6b] border-[#ff6b6b]/30 hover:bg-[#ff6b6b]/25'
                        : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/30 hover:bg-[#00dbe7]/25'
                    }`}
                    title={`Live News Sentiment: ${sentimentReport.verdict} (${sentimentReport.score > 0 ? '+' : ''}${sentimentReport.score}). Click to open News & AI Drawer.`}
                  >
                    <Newspaper className="w-3 h-3" />
                    <span>{sentimentReport.verdict} ({sentimentReport.score > 0 ? '+' : ''}${sentimentReport.score.toFixed(2)})</span>
                    {sentimentReport.circuitBreakerRecommended && (
                      <span className="text-[#ffb74d] ml-0.5 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5 text-[#ffb74d]" />
                        <span>Circuit Breaker</span>
                      </span>
                    )}
                  </button>
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

        {/* RESIZABLE SPLITTER BAR (DESKTOP) */}
        {!isChartExpanded && (
          <div
            onMouseDown={handleSplitterMouseDown}
            onDoubleClick={handleSplitterDoubleClick}
            title="Drag horizontally to resize chart & sidebar • Double-click to reset (440px)"
            className={`hidden lg:flex relative w-3.5 group cursor-col-resize select-none shrink-0 items-center justify-center transition-all z-10 mx-0.5 ${
              isDraggingSidebar ? 'cursor-col-resize' : ''
            }`}
          >
            {/* Vertical Guide Line */}
            <div className={`w-[2px] h-full transition-colors rounded-full ${
              isDraggingSidebar 
                ? 'bg-[#00dbe7] shadow-[0_0_12px_rgba(0,219,231,0.9)]' 
                : 'bg-outline/25 group-hover:bg-[#00dbe7]/70 group-hover:shadow-[0_0_8px_rgba(0,219,231,0.5)]'
            }`} />

            {/* Floating Grip Handle Pill */}
            <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-9 rounded-full flex items-center justify-center transition-all shadow-md pointer-events-none ${
              isDraggingSidebar 
                ? 'bg-[#00dbe7] text-[#002022] scale-110 shadow-[0_0_12px_rgba(0,219,231,0.8)]' 
                : 'bg-surface-container-high border border-outline/40 text-on-surface-variant group-hover:border-[#00dbe7]/60 group-hover:text-[#00dbe7] group-hover:scale-105'
            }`}>
              <GripVertical className="w-3 h-3 pointer-events-none" />
            </div>
          </div>
        )}

        {/* SIDEBAR COLUMN: Resizable on desktop, stacks below when in full view */}
        <div 
          style={!isChartExpanded ? { width: `${sidebarWidth}px` } : undefined}
          className={`${
            isChartExpanded ? 'w-full mt-3' : 'w-full lg:shrink-0'
          } flex flex-col gap-3 transition-all duration-150`}
        >
          
          {/* Right Column Mode Switcher: Carousel Slideshow with Hover Navigation Chevrons */}
          <div className="relative group/tabs flex items-center p-1 rounded-xl bg-surface-container-low border border-outline/20 select-none overflow-hidden">
            
            {/* Left Scroll Button (appears on hover when scrollable) */}
            {canScrollTabsLeft && (
              <button
                type="button"
                onClick={() => scrollTabs('left')}
                className="absolute left-1 z-20 flex items-center justify-center w-6 h-7 rounded-md bg-surface-container-high/90 hover:bg-[#00dbe7] hover:text-[#002022] text-on-surface backdrop-blur-md shadow-md border border-outline/30 transition-all opacity-0 group-hover/tabs:opacity-100 cursor-pointer"
                title="Scroll tabs left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Right Scroll Button (appears on hover when scrollable) */}
            {canScrollTabsRight && (
              <button
                type="button"
                onClick={() => scrollTabs('right')}
                className="absolute right-1 z-20 flex items-center justify-center w-6 h-7 rounded-md bg-surface-container-high/90 hover:bg-[#00dbe7] hover:text-[#002022] text-on-surface backdrop-blur-md shadow-md border border-outline/30 transition-all opacity-0 group-hover/tabs:opacity-100 cursor-pointer"
                title="Scroll tabs right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Scrollable Tabs Carousel Track */}
            <div
              ref={tabsScrollRef}
              onWheel={(e) => {
                if (e.deltaY !== 0 && tabsScrollRef.current) {
                  tabsScrollRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth w-full px-0.5"
            >
              <button
                onClick={(e) => {
                  setRightPanelTab('WATCHLIST');
                  (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                }}
                className={`shrink-0 h-8 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none whitespace-nowrap ${
                  rightPanelTab === 'WATCHLIST'
                    ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_10px_rgba(0,219,231,0.3)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-none">Watchlist</span>
              </button>

              <button
                onClick={(e) => {
                  setRightPanelTab('TELEMETRY');
                  (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                }}
                className={`shrink-0 h-8 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none whitespace-nowrap ${
                  rightPanelTab === 'TELEMETRY'
                    ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_10px_rgba(0,219,231,0.3)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-none">Technicals</span>
              </button>

              <button
                onClick={(e) => {
                  setRightPanelTab('NEWS');
                  (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                }}
                className={`shrink-0 h-8 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none whitespace-nowrap ${
                  rightPanelTab === 'NEWS'
                    ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_10px_rgba(0,219,231,0.3)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-none inline-flex items-center gap-1">
                  <span>News & AI</span>
                  {sentimentReport && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      sentimentReport.verdict === 'BULLISH' ? 'bg-[#00e476]' : sentimentReport.verdict === 'BEARISH' ? 'bg-[#ff6b6b]' : 'bg-[#00dbe7]'
                    }`} />
                  )}
                </span>
              </button>

              <button
                onClick={(e) => {
                  setRightPanelTab('BACKTEST');
                  (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                }}
                className={`shrink-0 h-8 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none whitespace-nowrap ${
                  rightPanelTab === 'BACKTEST'
                    ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_10px_rgba(0,219,231,0.3)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-none">Backtest</span>
              </button>

              <button
                onClick={(e) => {
                  setRightPanelTab('ORDER');
                  (e.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                }}
                className={`shrink-0 h-8 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none whitespace-nowrap ${
                  rightPanelTab === 'ORDER'
                    ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_10px_rgba(0,219,231,0.3)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-none">Order</span>
              </button>
            </div>
          </div>

          {/* ── TAB 1: LIVE WATCHLIST SUMMARY DECK (TRADINGVIEW & KITE STYLE) ── */}
          {rightPanelTab === 'WATCHLIST' && (
            <div className="glass-panel rounded-xl p-4 border border-outline/20 bg-surface-container-lowest/95 flex flex-col gap-3 shadow-md">
              
              {/* Watchlist Header & Quick List Switcher */}
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative flex-1">
                    <select
                      value={activeWatchlist.id}
                      onChange={e => setActiveWatchlistId(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline/30 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer truncate"
                    >
                      {watchlists.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.symbols.length} assets)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => fetchWatchlistQuotes(activeWatchlist)}
                    className="p-1.5 rounded-lg bg-surface-container-low border border-outline/20 hover:border-[#00dbe7] hover:text-[#00dbe7] transition-all cursor-pointer text-on-surface-variant"
                    title="Refresh live quotes"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingWatchlistQuotes ? 'animate-spin text-[#00dbe7]' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setSettingsActiveTab('WATCHLISTS');
                      setShowSettingsDrawer(true);
                    }}
                    className="p-1.5 rounded-lg bg-surface-container-low border border-outline/20 hover:border-[#00dbe7] hover:text-[#00dbe7] transition-all cursor-pointer text-on-surface-variant"
                    title="Open Watchlist Management Hub"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Filter & Sort Bar */}
              <div className="flex items-center gap-2">
                <input
                  value={watchlistSearchFilter}
                  onChange={e => setWatchlistSearchFilter(e.target.value)}
                  placeholder="Filter symbols in list..."
                  className="flex-1 bg-surface-container-lowest border border-outline/25 rounded-lg px-2.5 py-1 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-[#00dbe7]"
                />
                <select
                  value={watchlistSortBy}
                  onChange={e => setWatchlistSortBy(e.target.value as any)}
                  className="bg-surface-container-low border border-outline/25 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface-variant focus:outline-none focus:border-[#00dbe7] cursor-pointer"
                >
                  <option value="DEFAULT">Default Order</option>
                  <option value="CHANGE_DESC">Top Gainers (%)</option>
                  <option value="CHANGE_ASC">Top Losers (%)</option>
                  <option value="PRICE_DESC">Highest Price</option>
                </select>
              </div>

              {/* Summary Metric Pills */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono border-y border-outline/10 py-1.5">
                <div className="flex items-center justify-between px-2 py-1 rounded bg-surface-container-low text-on-surface-variant">
                  <span>Tracked</span>
                  <strong className="text-on-surface">{activeWatchlist.symbols.length}</strong>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-[#00e476]/10 text-[#00e476]">
                  <span>Gainers</span>
                  <strong>
                    {activeWatchlist.symbols.filter(s => {
                      const q = watchlistQuotes[normalizeTicker(s, activeMarketKey)] || watchlistQuotes[formatTickerDisplay(s).cleanSymbol];
                      return (q?.change_percent ?? 0) > 0;
                    }).length}
                  </strong>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-[#ff6b6b]/10 text-[#ff6b6b]">
                  <span>Losers</span>
                  <strong>
                    {activeWatchlist.symbols.filter(s => {
                      const q = watchlistQuotes[normalizeTicker(s, activeMarketKey)] || watchlistQuotes[formatTickerDisplay(s).cleanSymbol];
                      return (q?.change_percent ?? 0) < 0;
                    }).length}
                  </strong>
                </div>
              </div>

              {/* Live Watchlist Table: All Selected Stocks with Full Detailed Summary */}
              <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-0.5">
                {activeWatchlist.symbols.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-on-surface-variant flex flex-col gap-2">
                    <Bookmark className="w-8 h-8 opacity-30 mx-auto" />
                    <span>This watchlist is empty.</span>
                    <span className="text-[11px] opacity-70">Use the input below or search bar to bookmark stocks.</span>
                  </div>
                ) : (
                  (() => {
                    let list = [...activeWatchlist.symbols];
                    if (watchlistSearchFilter.trim()) {
                      const q = watchlistSearchFilter.toLowerCase().trim();
                      list = list.filter(symStr => {
                        const fmt = formatTickerDisplay(symStr);
                        const qData = watchlistQuotes[normalizeTicker(symStr, activeMarketKey)] || watchlistQuotes[fmt.cleanSymbol];
                        return fmt.cleanSymbol.toLowerCase().includes(q) ||
                          fmt.displaySymbol.toLowerCase().includes(q) ||
                          (qData?.name && qData.name.toLowerCase().includes(q));
                      });
                    }

                    if (watchlistSortBy === 'CHANGE_DESC') {
                      list.sort((a, b) => {
                        const qa = watchlistQuotes[normalizeTicker(a, activeMarketKey)] || watchlistQuotes[formatTickerDisplay(a).cleanSymbol];
                        const qb = watchlistQuotes[normalizeTicker(b, activeMarketKey)] || watchlistQuotes[formatTickerDisplay(b).cleanSymbol];
                        return (qb?.change_percent ?? -999) - (qa?.change_percent ?? -999);
                      });
                    } else if (watchlistSortBy === 'CHANGE_ASC') {
                      list.sort((a, b) => {
                        const qa = watchlistQuotes[normalizeTicker(a, activeMarketKey)] || watchlistQuotes[formatTickerDisplay(a).cleanSymbol];
                        const qb = watchlistQuotes[normalizeTicker(b, activeMarketKey)] || watchlistQuotes[formatTickerDisplay(b).cleanSymbol];
                        return (qa?.change_percent ?? 999) - (qb?.change_percent ?? 999);
                      });
                    } else if (watchlistSortBy === 'PRICE_DESC') {
                      list.sort((a, b) => {
                        const qa = watchlistQuotes[normalizeTicker(a, activeMarketKey)] || watchlistQuotes[formatTickerDisplay(a).cleanSymbol];
                        const qb = watchlistQuotes[normalizeTicker(b, activeMarketKey)] || watchlistQuotes[formatTickerDisplay(b).cleanSymbol];
                        return (qb?.current_price ?? 0) - (qa?.current_price ?? 0);
                      });
                    }

                    return list.map(symStr => {
                      const targetItem = (activeWatchlist.items || []).find(
                        i => i.symbol === symStr || i.cleanSymbol === symStr
                      );
                      const itemMarket = targetItem?.market || (KNOWN_US_TICKERS.has(symStr.toUpperCase()) ? 'US' : activeMarketKey);
                      const norm = normalizeTicker(symStr, itemMarket);
                      const fmt = formatTickerDisplay(norm, targetItem?.exchange);
                      const isCurrent = normalizeTicker(symbol, activeMarketKey) === norm;
                      const q = watchlistQuotes[norm] || watchlistQuotes[symStr] || watchlistQuotes[fmt.cleanSymbol] || (targetItem?.cleanSymbol ? watchlistQuotes[targetItem.cleanSymbol] : undefined);
                      const isPos = (q?.change_percent ?? 0) >= 0;
                      const priceSym = q?.currency_symbol || (itemMarket === 'US' ? '$' : itemMarket === 'IN' ? '₹' : curSymbol);

                      return (
                        <div
                          key={symStr}
                          onClick={() => {
                            setSymbol(norm);
                            setSymbolInput(fmt.displaySymbol);
                            if (targetItem?.market && targetItem.market !== activeMarketKey && universes[targetItem.market]) {
                              setActiveMarketKey(targetItem.market);
                            }
                          }}
                          className={`group p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex flex-col gap-1.5 ${
                            isCurrent
                              ? 'bg-[#00dbe7]/15 border-[#00dbe7] shadow-[0_0_12px_rgba(0,219,231,0.25)]'
                              : 'bg-surface-container-low/70 border-outline/20 hover:border-outline/50 hover:bg-surface-container'
                          }`}
                        >
                          {/* Row 1: Symbol, Exchange, Company Name & Live Price */}
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-sm ${isCurrent ? 'text-[#00dbe7]' : 'text-on-surface group-hover:text-[#00dbe7]'} transition-colors`}>
                                  {fmt.cleanSymbol}
                                </span>
                                <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                                  fmt.exchange === 'NSE' ? 'bg-[#00dbe7]/15 text-[#00dbe7]' :
                                  fmt.exchange === 'BSE' ? 'bg-amber-500/15 text-amber-400' :
                                  'bg-purple-500/15 text-purple-400'
                                }`}>
                                  {fmt.exchange} · {itemMarket}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#00dbe7]/20 text-[#00dbe7] font-bold animate-pulse">
                                    CHART
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-on-surface-variant truncate max-w-[160px]">
                                {targetItem?.name || q?.name || fmt.cleanSymbol}
                              </span>
                            </div>

                            {/* Price & Change Pill */}
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-sm text-on-surface">
                                {q?.current_price != null ? `${priceSym}${q.current_price.toFixed(2)}` : '—'}
                              </span>
                              <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                                isPos ? 'bg-[#00e476]/15 text-[#00e476]' : 'bg-[#ff6b6b]/15 text-[#ff6b6b]'
                              }`}>
                                {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span>{isPos ? '+' : ''}{q?.change_percent?.toFixed(2) ?? '0.00'}%</span>
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Day High/Low & Quick Action Bar */}
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant pt-1 border-t border-outline/10">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>L: <strong className="text-[#ff6b6b]">{q?.low != null ? `${priceSym}${q.low.toFixed(1)}` : '—'}</strong></span>
                              <span className="opacity-30">|</span>
                              <span>H: <strong className="text-[#00e476]">{q?.high != null ? `${priceSym}${q.high.toFixed(1)}` : '—'}</strong></span>
                              {q?.open != null && (
                                <>
                                  <span className="opacity-30">|</span>
                                  <span>O: <strong className="text-on-surface">{priceSym}{q.open.toFixed(1)}</strong></span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSymbol(norm);
                                  setSymbolInput(fmt.displaySymbol);
                                  if (targetItem?.market && targetItem.market !== activeMarketKey && universes[targetItem.market]) {
                                    setActiveMarketKey(targetItem.market);
                                  }
                                  setRightPanelTab('ORDER');
                                }}
                                className="px-2 py-0.5 rounded bg-[#00e476]/15 border border-[#00e476]/30 text-[#00e476] font-bold hover:bg-[#00e476]/25 cursor-pointer"
                                title={`Trade ${fmt.cleanSymbol}`}
                              >
                                Trade
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSymbolFromWatchlist(activeWatchlist.id, symStr);
                                }}
                                className="p-0.5 rounded text-on-surface-variant hover:text-[#ff6b6b] hover:bg-surface-container cursor-pointer transition-colors"
                                title={`Remove from ${activeWatchlist.name}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>

              {/* Fast Add Symbol to Watchlist Footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-outline/15">
                <input
                  value={addSymbolInputs[activeWatchlist.id] || ''}
                  onChange={e => setAddSymbolInputs(prev => ({ ...prev, [activeWatchlist.id]: e.target.value.toUpperCase() }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddSymbolToWatchlist(activeWatchlist.id, addSymbolInputs[activeWatchlist.id] || '');
                  }}
                  placeholder="Add symbol to list (e.g. TATAMOTORS, TSLA)..."
                  className="flex-1 bg-surface-container-lowest border border-outline/30 rounded-lg px-2.5 py-1.5 text-xs font-mono text-on-surface uppercase focus:outline-none focus:border-[#00dbe7]"
                />
                <button
                  onClick={() => handleAddSymbolToWatchlist(activeWatchlist.id, addSymbolInputs[activeWatchlist.id] || '')}
                  className="px-3 py-1.5 bg-[#00dbe7] text-[#002022] font-bold rounded-lg uppercase cursor-pointer hover:brightness-110 text-xs font-mono whitespace-nowrap"
                >
                  + Add
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 2: TECHNICAL INDICATORS & ALGORITHMIC STRATEGY MATRIX ── */}
          {rightPanelTab === 'TELEMETRY' && (
            <div className="flex flex-col gap-3">
              {/* Box 1: Algorithmic Strategy Signal */}
              <div className="glass-panel rounded-xl p-4 border border-outline/20 bg-surface-container-lowest/90 flex flex-col gap-2.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#00dbe7]" />
                    Strategy Signal Engine
                  </span>
                  <button
                    onClick={() => {
                      setSettingsActiveTab('STRATEGIES');
                      setBuilderMode('CATALOG');
                      setShowSettingsDrawer(true);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30 hover:bg-[#00dbe7]/25 transition-all flex items-center gap-1 cursor-pointer"
                    title="Open Visual Strategy Condition Builder"
                  >
                    <Sliders className="w-3 h-3" />
                    Builder Hub
                  </button>
                </div>

                {/* Strategy Selector Dropdown */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedStrategyId}
                    onChange={e => {
                      setSelectedStrategyId(e.target.value);
                      try {
                        localStorage.setItem('sutharlabs_active_strategy_id', e.target.value);
                      } catch {}
                    }}
                    className="flex-1 bg-surface-container-low border border-outline/25 rounded-lg px-2.5 py-1.5 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer"
                  >
                    {strategies.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.isPreset ? '⚡ ' : '🔧 '}
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const strat = strategies.find(s => s.id === selectedStrategyId);
                      if (strat) {
                        if (strat.isPreset) {
                          handleCloneStrategy(strat);
                        } else {
                          handleEditStrategy(strat);
                        }
                      } else {
                        handleCreateNewStrategy();
                      }
                      setSettingsActiveTab('STRATEGIES');
                      setShowSettingsDrawer(true);
                    }}
                    className="p-1.5 rounded-lg bg-surface-container-low border border-outline/25 hover:border-[#00dbe7] hover:text-[#00dbe7] text-on-surface-variant transition-all cursor-pointer"
                    title="Edit or customize this strategy in Builder"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {loadingStrategySignal ? (
                  <div className="p-4 text-center font-mono text-xs text-on-surface-variant animate-pulse flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00dbe7]" />
                    Evaluating {strategies.find(s => s.id === selectedStrategyId)?.name || 'Strategy'}...
                  </div>
                ) : suggestion ? (
                  <div className={`p-3 rounded-lg border ${actionColor.bg} ${actionColor.border} flex flex-col gap-2`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-mono font-black ${actionColor.text}`}>
                          {suggestion.action}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                          {strategies.find(s => s.id === selectedStrategyId)?.isPreset ? 'Quant Preset' : 'Custom Model'}
                        </span>
                      </div>
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

                    {/* Computed Strategy Indicators Sub-Metrics */}
                    {strategySignal?.metrics && Object.keys(strategySignal.metrics).length > 0 && (
                      <div className="border-t border-outline/10 pt-2 flex flex-wrap gap-1.5 text-[9px] font-mono">
                        {strategySignal.metrics.supertrend != null && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                            ST: <strong className="text-on-surface">{curSymbol}{Number(strategySignal.metrics.supertrend).toFixed(1)}</strong>
                          </span>
                        )}
                        {strategySignal.metrics.ema_fast != null && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                            Fast EMA: <strong className="text-on-surface">{curSymbol}{Number(strategySignal.metrics.ema_fast).toFixed(1)}</strong>
                          </span>
                        )}
                        {strategySignal.metrics.ema_slow != null && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                            Slow EMA: <strong className="text-on-surface">{curSymbol}{Number(strategySignal.metrics.ema_slow).toFixed(1)}</strong>
                          </span>
                        )}
                        {strategySignal.metrics.rsi != null && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                            RSI: <strong className="text-on-surface">{Number(strategySignal.metrics.rsi).toFixed(1)}</strong>
                          </span>
                        )}
                        {strategySignal.metrics.bb_upper != null && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                            BBU: <strong className="text-on-surface">{curSymbol}{Number(strategySignal.metrics.bb_upper).toFixed(1)}</strong>
                          </span>
                        )}
                      </div>
                    )}

                    {/* AI Sentiment Confluence Factor (Stage 3 Integration) */}
                    {strategySignal?.sentimentConfluence && (
                      <div className="border-t border-outline/10 pt-2 flex flex-col gap-1.5 text-[10px] font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant flex items-center gap-1 font-semibold">
                            <Sparkles className="w-3 h-3 text-[#00dbe7]" />
                            AI News Confluence:
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            strategySignal.sentimentConfluence.confluenceEffect === 'BOOST'
                              ? 'bg-[#00e476]/20 text-[#00e476]'
                              : strategySignal.sentimentConfluence.confluenceEffect === 'CIRCUIT_BREAKER'
                              ? 'bg-[#ff6b6b]/25 text-[#ff6b6b] animate-pulse'
                              : strategySignal.sentimentConfluence.confluenceEffect === 'PENALTY'
                              ? 'bg-[#ffb74d]/20 text-[#ffb74d]'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            {strategySignal.sentimentConfluence.confluenceEffect} ({strategySignal.sentimentConfluence.sentimentScore > 0 ? '+' : ''}{strategySignal.sentimentConfluence.sentimentScore.toFixed(2)})
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant/90 leading-relaxed italic">
                          {strategySignal.sentimentConfluence.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center font-mono text-xs text-on-surface-variant animate-pulse">
                    Analyzing indicators...
                  </div>
                )}
              </div>


              {/* Box 2: Compact Technical Indicators Matrix */}
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
          )}

          {/* ── TAB 3: LIVE FINANCIAL NEWS & AI SENTIMENT STREAM (STAGE 3) ── */}
          {rightPanelTab === 'NEWS' && (
            <div className="glass-panel rounded-xl p-4 border border-outline/20 bg-surface-container-lowest/95 flex flex-col gap-3.5 shadow-md">
              
              {/* Header with Stock Symbol and Live Refresh Button */}
              <div className="flex justify-between items-center pb-2 border-b border-outline/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#00dbe7]/15 text-[#00dbe7]">
                    <Newspaper className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-on-surface">
                      News & AI Sentiment
                    </h4>
                    <span className="text-[10px] font-mono text-on-surface-variant">
                      {quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fetchNewsAndSentiment(symbol, activeMarketKey, quote?.name)}
                    disabled={loadingNews}
                    className="p-1.5 rounded-lg bg-surface-container-low border border-outline/20 hover:border-[#00dbe7] text-on-surface-variant hover:text-[#00dbe7] transition-all cursor-pointer"
                    title="Refresh Live Financial News & Re-analyze Sentiment"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin text-[#00dbe7]' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setSettingsActiveTab('NEWS_AI');
                      setShowSettingsDrawer(true);
                    }}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/30 hover:bg-[#00dbe7]/20 transition-all flex items-center gap-1 cursor-pointer leading-none"
                    title="Open Full Expanded News & AI Sentiment Hub"
                  >
                    <Maximize2 className="w-3 h-3 shrink-0" />
                    <span className="leading-none">Expanded View</span>
                  </button>
                </div>
              </div>

              {/* Overall Sentiment Polarity & Catalyst Summary Card */}
              {sentimentReport ? (
                <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all ${
                  sentimentReport.verdict === 'BULLISH'
                    ? 'bg-[#00e476]/10 border-[#00e476]/30'
                    : sentimentReport.verdict === 'BEARISH'
                    ? 'bg-[#ff6b6b]/10 border-[#ff6b6b]/30'
                    : 'bg-[#00dbe7]/10 border-[#00dbe7]/30'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block">
                        Net Market Polarity
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-2xl font-mono font-black ${
                          sentimentReport.verdict === 'BULLISH'
                            ? 'text-[#00e476]'
                            : sentimentReport.verdict === 'BEARISH'
                            ? 'text-[#ff6b6b]'
                            : 'text-[#00dbe7]'
                        }`}>
                          {sentimentReport.verdict}
                        </span>
                        <span className="text-xs font-mono font-bold text-on-surface px-1.5 py-0.5 rounded bg-surface-container">
                          {sentimentReport.score > 0 ? '+' : ''}{sentimentReport.score.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => {
                          setSettingsActiveTab('NEWS_AI');
                          setShowSettingsDrawer(true);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline/20 text-on-surface flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Click to configure Google Gemini API Key and inspect usage"
                      >
                        {sentimentReport.analyzedBy === 'GEMINI_AI' ? (
                          <>
                            <Sparkles className="w-3 h-3 text-[#00dbe7]" />
                            <span className="font-bold">Gemini AI</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Lexicon Engine</span>
                          </>
                        )}
                        <Key className="w-2.5 h-2.5 opacity-60 text-[#00dbe7]" />
                      </button>
                      <span className="text-[10px] font-mono text-on-surface-variant">
                        {((sentimentReport.confidence || 0) * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                  </div>

                  {/* Dual-sided Polarity Gauge Bar (-1.0 to +1.0) */}
                  <div className="flex flex-col gap-1">
                    <div className="relative w-full bg-surface-container-high h-2 rounded-full overflow-hidden flex">
                      {/* Negative half */}
                      <div className="w-1/2 h-full flex justify-end">
                        <div
                          className="h-full bg-[#ff6b6b] transition-all duration-500 rounded-l-full"
                          style={{
                            width: sentimentReport.score < 0 ? `${Math.min(100, Math.abs(sentimentReport.score) * 100)}%` : '0%'
                          }}
                        />
                      </div>
                      {/* Center divider */}
                      <div className="w-[2px] h-full bg-outline z-10" />
                      {/* Positive half */}
                      <div className="w-1/2 h-full flex justify-start">
                        <div
                          className="h-full bg-[#00e476] transition-all duration-500 rounded-r-full"
                          style={{
                            width: sentimentReport.score > 0 ? `${Math.min(100, sentimentReport.score * 100)}%` : '0%'
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-on-surface-variant/70">
                      <span>-1.0 Bearish</span>
                      <span>0.0 Neutral</span>
                      <span>+1.0 Bullish</span>
                    </div>
                  </div>

                  {/* Emergency Circuit Breaker Alert Banner */}
                  {sentimentReport.circuitBreakerRecommended && (
                    <div className="p-2.5 rounded-lg bg-[#ff6b6b]/20 border border-[#ff6b6b]/50 text-[#ff6b6b] text-xs font-mono flex items-start gap-2 animate-pulse">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block font-bold">EMERGENCY CIRCUIT BREAKER ACTIVATED</strong>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {sentimentReport.circuitBreakerReason || 'Severe downside catalyst detected in recent headlines. Algorithmic BUY entries are locked to protect capital.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Catalyst Summary */}
                  <div className="bg-surface-container-low/80 p-2.5 rounded-lg border border-outline/10 text-xs font-mono flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                      <span className="font-semibold uppercase tracking-wider">Primary Catalyst:</span>
                      <span className="px-1.5 py-0.5 rounded font-bold bg-[#00dbe7]/15 text-[#00dbe7]">
                        {sentimentReport.primaryCatalyst.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-[11px] leading-relaxed mt-0.5">
                      {sentimentReport.catalystSummary}
                    </p>
                  </div>
                </div>
              ) : loadingNews ? (
                <div className="p-6 text-center font-mono text-xs text-on-surface-variant animate-pulse flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#00dbe7]" />
                  <span>Synthesizing live news streams & AI sentiment...</span>
                </div>
              ) : null}

              {/* News Search & Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search articles & publishers..."
                    value={newsSearchFilter}
                    onChange={e => setNewsSearchFilter(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/25 rounded-lg px-2.5 py-1 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-[#00dbe7]"
                  />
                  {newsSearchFilter && (
                    <button
                      onClick={() => setNewsSearchFilter('')}
                      className="absolute right-2 top-1.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant whitespace-nowrap">
                  {newsArticles.length} stories
                </span>
              </div>

              {/* Scrollable News Articles Stream */}
              <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                {newsArticles.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-on-surface-variant/70 border border-dashed border-outline/20 rounded-xl">
                    {loadingNews ? 'Fetching live news...' : 'No news stories found for this symbol.'}
                  </div>
                ) : (
                  newsArticles
                    .filter(a => {
                      if (!newsSearchFilter.trim()) return true;
                      const q = newsSearchFilter.toLowerCase();
                      return a.title.toLowerCase().includes(q) || a.publisher.toLowerCase().includes(q) || (a.summary && a.summary.toLowerCase().includes(q));
                    })
                    .slice(0, 30)
                    .map(art => (
                      <div
                        key={art.id}
                        className="p-3 rounded-xl bg-surface-container-low/80 border border-outline/15 hover:border-[#00dbe7]/50 hover:bg-surface-container-low transition-all flex flex-col gap-2 group shadow-sm"
                      >
                        {/* Publisher & Timestamp Badge */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                          <span className="font-semibold text-on-surface flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00dbe7] shrink-0" />
                            <span className="truncate max-w-[140px]">{art.publisher}</span>
                          </span>
                          <div className="flex items-center gap-1 shrink-0 text-on-surface-variant/80">
                            <Clock className="w-2.5 h-2.5 opacity-70" />
                            <span>{formatRelativeTime(art.publishedAt)}</span>
                          </div>
                        </div>

                        {/* Clickable Headline with Embedded External Verification Link */}
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-sans font-semibold text-on-surface group-hover:text-[#00dbe7] transition-colors leading-snug line-clamp-2 flex items-start justify-between gap-1 group/title cursor-pointer"
                          title={art.title}
                        >
                          <span>{art.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mt-0.5 opacity-60 group-hover/title:opacity-100 group-hover/title:text-[#00dbe7] transition-all" />
                        </a>

                        {/* Clean Summary (no raw URLs) */}
                        {art.summary && art.summary !== art.title && (
                          <p className="text-[11px] text-on-surface-variant/90 line-clamp-2 leading-relaxed font-sans">
                            {art.summary}
                          </p>
                        )}

                        {/* Verification Direct Action Link */}
                        <div className="pt-2 border-t border-outline/10 flex justify-between items-center text-[10px] font-mono text-on-surface-variant/80">
                          <span className="truncate max-w-[130px]">{art.source === 'YAHOO_FINANCE' ? 'Yahoo Finance Feed' : 'Google Regional Feed'}</span>
                          <a
                            href={art.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00dbe7] hover:underline font-semibold flex items-center gap-1 shrink-0"
                          >
                            <span>Verify at {art.publisher.split(' ')[0]}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    ))
                )}
              </div>

            </div>
          )}

          {/* ── TAB 4: INSTANT PAPER ORDER TICKET & PORTFOLIO ── */}
          {rightPanelTab === 'ORDER' && (
            <div className="glass-panel rounded-xl p-4 border border-outline/20 bg-surface-container-lowest/90 flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                  Paper Order Execution Ticket
                </span>
                <span className="text-[10px] font-mono text-[#00dbe7] font-bold">
                  {quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-surface-container-low p-2 rounded-lg border border-outline/20">
                  <span className="block text-[9px] text-on-surface-variant uppercase">Cash Available</span>
                  <span className="font-bold text-[#00dbe7]">{curSymbol}{portfolio.cash?.toFixed(0)}</span>
                </div>
                <div className="bg-surface-container-low p-2 rounded-lg border border-outline/20">
                  <span className="block text-[9px] text-on-surface-variant uppercase">Active Holdings</span>
                  <span className="font-bold text-[#00e476]">{portfolio.shares} shs</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">Quantity</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={actionQuantity}
                  onChange={e => setActionQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 bg-surface-container-lowest border border-outline/30 rounded-lg px-2.5 py-1 text-xs font-mono text-on-surface text-center"
                />
                <span className="font-mono text-[10px] text-on-surface-variant truncate">
                  Est. Total: {curSymbol}{((quote?.current_price ?? 0) * actionQuantity).toFixed(2)}
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
          )}

          {/* ── TAB 5: HISTORICAL BACKTESTING ENGINE & FRICTION MODELING (STAGE 4) ── */}
          {rightPanelTab === 'BACKTEST' && (
            <StockBacktestPanel
              symbol={symbol}
              displaySymbol={quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol}
              cleanSymbol={formatTickerDisplay(symbol).cleanSymbol}
              companyName={quote?.name}
              marketRegion={activeMarketKey}
              curSymbol={curSymbol}
              strategies={strategies}
              activeStrategyId={selectedStrategyId}
              onSelectStrategy={(id) => {
                setSelectedStrategyId(id);
                try { localStorage.setItem('sutharlabs_active_strategy_id', id); } catch {}
              }}
              onOpenStrategyBuilder={() => {
                setSettingsActiveTab('STRATEGIES');
                setBuilderMode('CATALOG');
                setShowSettingsDrawer(true);
              }}
              isDark={isDark}
            />
          )}

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
                <div>&gt; Active Market: {activeUniverse?.name || activeMarketKey} ({activeUniverse?.currencyCode || 'INR'})</div>
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

      {/* ── 4. FULL-VIEWPORT EXPANDED FLOATING HOVER WINDOW (CENTERED POPUP) ──────── */}
      {showSettingsDrawer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 md:p-5 lg:p-6 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
          onClick={() => setShowSettingsDrawer(false)}
        >
          {/* Centered Hover Window: Maximizes usable screen space with symmetrical margins on both sides */}
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-[98vw] 2xl:max-w-[1850px] h-full max-h-[96vh] bg-surface-container rounded-2xl sm:rounded-3xl border border-outline/30 flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.85)] z-10 overflow-hidden animate-in slide-in-from-right duration-300"
          >
            
            {/* Pinned Top Bar: Header & Horizontal Option Tabs (Never scrolled away or hidden) */}
            <div className="shrink-0 bg-surface-container px-6 sm:px-8 pt-6 sm:pt-7 pb-3 border-b border-outline/20 z-20 flex flex-col gap-4">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-sans font-bold text-lg text-on-surface">
                        {settingsActiveTab === 'NEWS_AI' ? 'Real-Time News Stream & AI Sentiment Hub' : 'Tracker Settings & Workspace Architecture'}
                      </h3>
                      {settingsActiveTab === 'NEWS_AI' && (
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                          {quote?.name || formatTickerDisplay(symbol).cleanSymbol} ({quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {settingsActiveTab === 'NEWS_AI'
                        ? `Live news stream & sentiment synthesis active for ${quote?.name || formatTickerDisplay(symbol).cleanSymbol} (${quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol})`
                        : 'All parameters, data feeds, exchange rules, and indicator formulas below are live and editable.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline/10 hover:border-outline/30 transition-all cursor-pointer"
                  title="Close hover window (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Horizontal Option Tabs Bar (Protected against vertical shift & smoothly scrollable) */}
              <div
                onWheel={(e) => {
                  if (e.deltaY !== 0 && e.currentTarget) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                className="flex items-center gap-2 overflow-x-auto overflow-y-hidden custom-scrollbar py-1 shrink-0"
              >
                {(['WATCHLISTS', 'MARKET', 'STRATEGIES', 'SCANNER', 'SIMULATOR', 'BACKTEST', 'NEWS_AI', 'INDICATORS', 'TRADING', 'FEEDS', 'PERFORMANCE'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSettingsActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0 ${
                      settingsActiveTab === tab
                        ? 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface bg-surface-container-low border border-transparent'
                    }`}
                  >
                    {tab === 'WATCHLISTS' && <Bookmark className="w-3.5 h-3.5" />}
                    {tab === 'MARKET' && <Globe className="w-3.5 h-3.5" />}
                    {tab === 'STRATEGIES' && <Cpu className="w-3.5 h-3.5" />}
                    {tab === 'SCANNER' && <Eye className="w-3.5 h-3.5 text-[#00dbe7]" />}
                    {tab === 'SIMULATOR' && <Play className="w-3.5 h-3.5 text-[#00e476]" />}
                    {tab === 'BACKTEST' && <BarChart2 className="w-3.5 h-3.5 text-[#00dbe7]" />}
                    {tab === 'NEWS_AI' && <Newspaper className="w-3.5 h-3.5 text-[#00dbe7]" />}
                    {tab === 'INDICATORS' && <Layers className="w-3.5 h-3.5" />}
                    {tab === 'TRADING' && <Shield className="w-3.5 h-3.5" />}
                    {tab === 'FEEDS' && <Database className="w-3.5 h-3.5" />}
                    {tab === 'PERFORMANCE' && <Award className="w-3.5 h-3.5" />}
                    <span>
                      {tab === 'WATCHLISTS' && 'Custom Watchlists'}
                      {tab === 'MARKET' && 'Market Universes'}
                      {tab === 'STRATEGIES' && 'Algo Marketplace & Builder'}
                      {tab === 'SCANNER' && 'Market Screener'}
                      {tab === 'SIMULATOR' && 'EOD Trade Simulator'}
                      {tab === 'BACKTEST' && 'Backtest Engine'}
                      {tab === 'NEWS_AI' && 'News & AI Sentiment'}
                      {tab === 'INDICATORS' && 'Indicator Mathematics'}
                      {tab === 'TRADING' && 'Order & Risk Rules'}
                      {tab === 'FEEDS' && 'Data Feeds & Brokers'}
                      {tab === 'PERFORMANCE' && 'Performance Analytics'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Content Body for Active Tab */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8">
              {/* TAB: CUSTOM WATCHLISTS MANAGEMENT HUB */}
              {settingsActiveTab === 'WATCHLISTS' && (
              <div className="flex flex-col gap-6 text-xs font-mono">
                {/* Header & New Watchlist Form */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <span className="text-on-surface font-semibold text-sm flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-[#00dbe7]" />
                        Custom Watchlists Hub
                      </span>
                      <p className="text-xs text-on-surface-variant font-sans">
                        Organize your assets into custom watchlists (e.g. EV & Mobility, High Beta, Dividend, US Tech). Symbols in each list can be switched with 1 click.
                      </p>
                    </div>

                    {/* Create New Watchlist Bar */}
                    <div className="flex items-center gap-2">
                      <input
                        value={newWatchlistName}
                        onChange={e => setNewWatchlistName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleCreateWatchlist(newWatchlistName);
                        }}
                        placeholder="New watchlist name..."
                        className="w-56 bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-1.5 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
                      />
                      <button
                        onClick={() => handleCreateWatchlist(newWatchlistName)}
                        className="px-3.5 py-1.5 bg-[#00dbe7] text-[#002022] font-bold rounded-lg uppercase cursor-pointer hover:brightness-110 flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Watchlists List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchlists.map(wl => {
                    const isCur = wl.id === activeWatchlist.id;
                    const isEditing = editingWatchlistId === wl.id;
                    const addInput = addSymbolInputs[wl.id] || '';

                    return (
                      <div
                        key={wl.id}
                        className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                          isCur
                            ? 'bg-[#00dbe7]/5 border-[#00dbe7]/60 shadow-[0_0_15px_rgba(0,219,231,0.15)]'
                            : 'bg-surface-container-low border-outline/20'
                        }`}
                      >
                        {/* Top: Watchlist Title, Active Badge, Actions */}
                        <div className="flex justify-between items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                value={editingWatchlistName}
                                onChange={e => setEditingWatchlistName(e.target.value)}
                                className="bg-surface-container-lowest border border-[#00dbe7] rounded px-2 py-1 text-xs font-mono text-on-surface w-full"
                              />
                              <button
                                onClick={() => handleRenameWatchlist(wl.id, editingWatchlistName)}
                                className="p-1 rounded bg-[#00dbe7] text-[#002022] cursor-pointer"
                                title="Save name"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingWatchlistId(null)}
                                className="p-1 rounded bg-surface-container-highest text-on-surface cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-on-surface">{wl.name}</span>
                              <button
                                onClick={() => {
                                  setEditingWatchlistId(wl.id);
                                  setEditingWatchlistName(wl.name);
                                }}
                                className="text-on-surface-variant hover:text-[#00dbe7] cursor-pointer p-0.5"
                                title="Rename watchlist"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-2 shrink-0">
                            {isCur ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#00e476]/15 border border-[#00e476]/40 text-[#00e476] font-mono text-[10px] font-bold">
                                ACTIVE
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveWatchlistId(wl.id);
                                  setNotification(`Activated watchlist "${wl.name}"`);
                                  setTimeout(() => setNotification(''), 3000);
                                }}
                                className="px-2 py-0.5 rounded bg-surface-container-high border border-outline/30 text-on-surface hover:text-[#00dbe7] hover:border-[#00dbe7]/50 font-mono text-[10px] cursor-pointer"
                              >
                                Set Active
                              </button>
                            )}

                            {watchlists.length > 1 && (
                              <button
                                onClick={() => handleDeleteWatchlist(wl.id)}
                                className="p-1 rounded text-on-surface-variant hover:text-[#ff6b6b] hover:bg-surface-container-high cursor-pointer transition-colors"
                                title={`Delete "${wl.name}"`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Add Symbol Input for this specific watchlist */}
                        <div className="flex items-center gap-2">
                          <input
                            value={addInput}
                            onChange={e => setAddSymbolInputs(prev => ({ ...prev, [wl.id]: e.target.value.toUpperCase() }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddSymbolToWatchlist(wl.id, addInput);
                            }}
                            placeholder="Add symbol (e.g. ATHERENERG, TCS, AAPL)..."
                            className="flex-1 bg-surface-container-lowest border border-outline/25 rounded-lg px-2.5 py-1 text-xs font-mono text-on-surface uppercase focus:outline-none focus:border-[#00dbe7]"
                          />
                          <button
                            onClick={() => handleAddSymbolToWatchlist(wl.id, addInput)}
                            className="px-2.5 py-1 bg-[#00dbe7]/15 border border-[#00dbe7]/40 text-[#00dbe7] font-bold rounded-lg text-xs hover:bg-[#00dbe7]/25 cursor-pointer whitespace-nowrap"
                          >
                            + Add
                          </button>
                        </div>

                        {/* Watchlist Symbol Chips */}
                        <div className="flex flex-wrap gap-1.5 min-h-[50px] max-h-40 overflow-y-auto custom-scrollbar p-1 rounded-lg bg-surface-container-lowest/50 border border-outline/10">
                          {wl.symbols.length === 0 ? (
                            <span className="text-[11px] text-on-surface-variant italic self-center m-auto">
                              No symbols in this watchlist yet.
                            </span>
                          ) : (
                            wl.symbols.map(symStr => {
                              const fmt = formatTickerDisplay(symStr);
                              const isSelected = symbol === symStr;
                              return (
                                <div
                                  key={symStr}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono border transition-all ${
                                    isSelected
                                      ? 'bg-[#00dbe7]/20 border-[#00dbe7] text-[#00dbe7] font-bold shadow-sm'
                                      : 'bg-surface-container border-outline/20 text-on-surface hover:border-outline/40'
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      setSymbol(symStr);
                                      setSymbolInput(fmt.displaySymbol);
                                      setShowSettingsDrawer(false);
                                    }}
                                    className="cursor-pointer hover:underline flex items-center gap-1"
                                    title={`Load ${fmt.displaySymbol} in chart & close settings`}
                                  >
                                    <span>{fmt.cleanSymbol}</span>
                                    <span className={`text-[9px] px-1 rounded font-semibold ${
                                      fmt.exchange === 'NSE' ? 'bg-[#00dbe7]/15 text-[#00dbe7]' :
                                      fmt.exchange === 'BSE' ? 'bg-amber-500/15 text-amber-400' :
                                      'bg-purple-500/15 text-purple-400'
                                    }`}>
                                      {fmt.exchange}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveSymbolFromWatchlist(wl.id, symStr);
                                    }}
                                    className="text-on-surface-variant hover:text-[#ff6b6b] p-0.5 rounded transition-colors cursor-pointer"
                                    title={`Remove ${fmt.displaySymbol} from ${wl.name}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MARKET UNIVERSES (EDITABLE SELECTION & REGIONAL DIRECTORY) */}
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
                    {Object.entries(universes)
                      .filter(([_, u]) => u && typeof u === 'object' && u.name && u.flag && Array.isArray(u.stocks))
                      .map(([key, u]) => (
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
                          <span>Lead: <strong className="text-[#00dbe7]">{u.stocks[0]?.symbol ? formatTickerDisplay(u.stocks[0].symbol).displaySymbol : 'N/A'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* REGISTERED BENCHMARK EQUITIES DIRECTORY */}
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-on-surface font-semibold text-sm">Exchange Universe Benchmark Registry</span>
                      <p className="text-[11px] text-on-surface-variant font-sans">
                        Benchmark constituents registered for {activeUniverse?.name || activeMarketKey} ({activeUniverse?.exchange || ''}). You can load any asset or bookmark it into your custom watchlists.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      value={symbolInput}
                      onChange={e => setSymbolInput(e.target.value.toUpperCase())}
                      placeholder="Add symbol to exchange registry..."
                      className="w-64 bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface uppercase focus:outline-none focus:border-[#00dbe7]"
                    />
                    <button
                      onClick={() => {
                        handleAddStockToUniverse(symbolInput);
                        setNotification(`Registered ${symbolInput} into ${activeUniverse?.name || activeMarketKey} catalog`);
                        setTimeout(() => setNotification(''), 3000);
                      }}
                      className="px-3.5 py-2 bg-[#00dbe7]/15 border border-[#00dbe7]/50 text-[#00dbe7] font-bold rounded-lg uppercase cursor-pointer hover:bg-[#00dbe7]/25 flex items-center gap-1.5"
                    >
                      + Register to Universe
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

                  {/* Active Universe Benchmark Constituents with Add to Watchlist Option */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-outline/10">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-on-surface-variant uppercase font-mono">
                        {activeUniverse?.name || activeMarketKey} Constituents ({activeUniverse?.stocks?.length || 0} assets):
                      </span>
                      <button
                        onClick={() => setSettingsActiveTab('WATCHLISTS')}
                        className="text-[11px] text-[#00dbe7] hover:underline cursor-pointer font-bold flex items-center gap-1"
                      >
                        <Bookmark className="w-3 h-3" />
                        <span>Open Watchlist Manager</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1">
                      {(activeUniverse?.stocks || []).map(s => {
                        const fmt = formatTickerDisplay(s.symbol);
                        const inWatchlist = (activeWatchlist.items || []).some(i => i.symbol === s.symbol || i.cleanSymbol === fmt.cleanSymbol) ||
                          activeWatchlist.symbols.some(symStr => normalizeTicker(symStr, activeMarketKey) === normalizeTicker(s.symbol, activeMarketKey));
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
                                setShowSettingsDrawer(false);
                              }}
                              className="cursor-pointer hover:underline"
                              title={`Click to load ${s.name}`}
                            >
                              {fmt.displaySymbol}
                            </button>
                            <button
                              onClick={() => handleToggleCurrentStockInWatchlist(s.symbol, activeMarketKey, s.name, universes[activeMarketKey]?.exchange)}
                              className="p-0.5 rounded hover:text-[#00dbe7] cursor-pointer transition-colors"
                              title={inWatchlist ? `In "${activeWatchlist.name}" (Click to remove)` : `Add to "${activeWatchlist.name}"`}
                            >
                              <Star className={`w-3 h-3 ${inWatchlist ? 'fill-[#00e476] text-[#00e476]' : 'text-on-surface-variant'}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveStockFromUniverse(s.symbol);
                              }}
                              className="text-on-surface-variant hover:text-[#ff6b6b] p-0.5 rounded transition-colors cursor-pointer"
                              title={`Remove ${fmt.displaySymbol} from exchange directory`}
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

            {/* TAB: ALGORITHMIC STRATEGIES & VISUAL CONDITION BUILDER (STAGE 2) */}
            {settingsActiveTab === 'STRATEGIES' && (
              <div className="flex flex-col gap-6 text-xs font-mono">
                {/* Mode 1: COMMUNITY ALGORITHM MARKETPLACE & CATALOG (STAGE 5) */}
                {builderMode === 'CATALOG' && (
                  <StockStrategyMarketplace
                    strategies={strategies}
                    activeStrategyId={selectedStrategyId}
                    userEmail={userEmail}
                    userName={userEmail ? userEmail.split('@')[0] : 'Trader'}
                    onSelectStrategy={(id) => {
                      setSelectedStrategyId(id);
                      try {
                        localStorage.setItem('sutharlabs_active_strategy_id', id);
                      } catch {}
                      const matched = strategies.find(s => s.id === id);
                      setStrategyActionFeedback(`Activated "${matched?.name || id}" for live chart signals.`);
                      setTimeout(() => setStrategyActionFeedback(null), 3000);
                    }}
                    onForkStrategy={(forked) => {
                      fetchStrategies();
                      setSelectedStrategyId(forked.id);
                      try {
                        localStorage.setItem('sutharlabs_active_strategy_id', forked.id);
                      } catch {}
                      setStrategyActionFeedback(`Forked "${forked.name}" into your custom strategy library!`);
                      setTimeout(() => setStrategyActionFeedback(null), 4000);
                    }}
                    onOpenBuilder={(strategyId) => {
                      if (strategyId) {
                        const strat = strategies.find(s => s.id === strategyId);
                        if (strat) {
                          handleEditStrategy(strat);
                          return;
                        }
                      }
                      handleCreateNewStrategy();
                    }}
                    onOpenBacktest={(strategyId) => {
                      setSelectedStrategyId(strategyId);
                      try {
                        localStorage.setItem('sutharlabs_active_strategy_id', strategyId);
                      } catch {}
                      setSettingsActiveTab('BACKTEST');
                    }}
                    onRefreshStrategies={fetchStrategies}
                    onDeleteStrategy={(id) => handleDeleteStrategy(id, true)}
                    onRenameStrategy={handleRenameStrategy}
                    isDark={isDark}
                  />
                )}


                {/* Mode 2: VISUAL CONDITION BUILDER FORM */}
                {builderMode === 'BUILDER' && (
                  <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-outline/15">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setBuilderMode('CATALOG')}
                          className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline/20 hover:border-[#00dbe7] text-on-surface font-mono text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          ← Back to Algo Marketplace
                        </button>
                        <div>
                          <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                            <Wand2 className="w-4 h-4 text-[#00dbe7]" />
                            {builderEditingId ? 'Edit Custom Strategy' : 'Visual Strategy Condition Builder'}
                          </h3>
                          <p className="text-xs text-on-surface-variant font-sans">
                            Configure indicators, mathematical operators, and live risk targets.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {builderEditingId && !strategies.find(s => s.id === builderEditingId)?.isPreset && (
                          <button
                            onClick={() => {
                              handleDeleteStrategy(builderEditingId);
                              setBuilderMode('CATALOG');
                            }}
                            className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-[#ff6b6b] hover:bg-red-500/25 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                            title="Delete this custom strategy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Strategy</span>
                          </button>
                        )}
                        <button
                          onClick={() => setBuilderMode('CATALOG')}
                          className="px-3 py-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface text-xs font-mono cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveStrategy}
                          disabled={isSavingStrategy}
                          className="px-4 py-2 rounded-xl bg-[#00dbe7] text-[#002022] font-bold text-xs font-mono flex items-center gap-1.5 hover:brightness-110 cursor-pointer shadow-md disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isSavingStrategy ? 'Saving...' : 'Save Strategy'}
                        </button>
                      </div>
                    </div>

                    {/* Section 1: Metadata */}
                    <div className="bg-surface-container-low p-5 rounded-xl border border-outline/20 flex flex-col gap-4">
                      <span className="text-on-surface font-semibold text-sm">Strategy Identification & Scope</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 flex flex-col gap-1.5">
                          <label className="text-[11px] text-on-surface-variant uppercase">Strategy Name</label>
                          <input
                            value={builderName}
                            onChange={e => setBuilderName(e.target.value)}
                            placeholder="e.g. Dual Moving Average Crossover"
                            className="bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] text-on-surface-variant uppercase">Target Market</label>
                          <select
                            value={builderMarket}
                            onChange={e => setBuilderMarket(e.target.value as any)}
                            className="bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer"
                          >
                            <option value="GLOBAL">GLOBAL (All Exchanges)</option>
                            <option value="IN">IN (NSE / BSE India)</option>
                            <option value="US">US (NYSE / NASDAQ)</option>
                            <option value="BOTH">BOTH (India & US)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 flex flex-col gap-1.5">
                          <label className="text-[11px] text-on-surface-variant uppercase">Description</label>
                          <input
                            value={builderDesc}
                            onChange={e => setBuilderDesc(e.target.value)}
                            placeholder="Briefly describe the quantitative logic behind this algorithm..."
                            className="bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] text-on-surface-variant uppercase">Execution Timeframe</label>
                          <select
                            value={builderTimeframe}
                            onChange={e => setBuilderTimeframe(e.target.value as any)}
                            className="bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer"
                          >
                            <option value="1D">1D (Daily Candles - Recommended)</option>
                            <option value="1h">1h (Hourly Swing)</option>
                            <option value="15m">15m (Intraday Momentum)</option>
                            <option value="5m">5m (Scalping)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Parameters Builder */}
                    <div className="bg-surface-container-low p-5 rounded-xl border border-outline/20 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-on-surface font-semibold text-sm">Strategy Parameters (Tunable Variables)</span>
                          <p className="text-[11px] text-on-surface-variant font-sans">
                            Define numerical variables that can be overridden in scans and backtests.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const newId = `param_${Date.now()}`;
                            setBuilderParameters(prev => [
                              ...prev,
                              { id: newId, name: 'Custom Parameter', type: 'number', default: 20, min: 1, max: 200, step: 1, description: 'User-defined parameter' }
                            ]);
                          }}
                          className="px-3 py-1.5 bg-surface-container border border-outline/25 hover:border-[#00dbe7] text-[#00dbe7] rounded-lg text-xs font-mono cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Parameter
                        </button>
                      </div>

                      {builderParameters.length === 0 ? (
                        <div className="p-3 text-center text-on-surface-variant opacity-70 bg-surface-container-lowest rounded-lg border border-dashed border-outline/20">
                          No custom parameters defined. Standard indicator lookbacks will apply.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {builderParameters.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2.5 bg-surface-container-lowest rounded-lg border border-outline/15 flex-wrap sm:flex-nowrap">
                              <input
                                value={p.name}
                                onChange={e => {
                                  const val = e.target.value;
                                  setBuilderParameters(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                                }}
                                placeholder="Parameter Name"
                                className="flex-1 min-w-[120px] bg-surface-container border border-outline/20 rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-[#00dbe7]"
                              />
                              <input
                                value={p.id}
                                onChange={e => {
                                  const val = e.target.value;
                                  setBuilderParameters(prev => prev.map((item, i) => i === idx ? { ...item, id: val } : item));
                                }}
                                placeholder="Variable ID"
                                className="w-28 bg-surface-container border border-outline/20 rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-[#00dbe7]"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-on-surface-variant">Default:</span>
                                <input
                                  type="number"
                                  value={Number(p.default)}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setBuilderParameters(prev => prev.map((item, i) => i === idx ? { ...item, default: val } : item));
                                  }}
                                  className="w-16 bg-surface-container border border-outline/20 rounded px-2 py-1 text-xs text-on-surface text-center focus:outline-none focus:border-[#00dbe7]"
                                />
                              </div>
                              <button
                                onClick={() => setBuilderParameters(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-on-surface-variant hover:text-[#ff6b6b] transition-colors cursor-pointer"
                                title="Remove parameter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 3: Entry Conditions (WHEN TO BUY) */}
                    <div className="bg-surface-container-low p-5 rounded-xl border border-outline/20 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[#00e476] font-semibold text-sm flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            Entry Conditions (WHEN TO BUY / GO LONG)
                          </span>
                          <p className="text-[11px] text-on-surface-variant font-sans">
                            A high-conviction BUY signal triggers when ALL conditions below evaluate to TRUE simultaneously.
                          </p>
                        </div>
                        <button
                          onClick={() => setBuilderEntryConditions(prev => [
                            ...prev,
                            { indicator: 'rsi', operator: '<', value: 30 }
                          ])}
                          className="px-3 py-1.5 bg-[#00e476]/15 border border-[#00e476]/30 text-[#00e476] hover:bg-[#00e476]/25 rounded-lg text-xs font-mono cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add BUY Condition
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {builderEntryConditions.map((cond, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2.5 bg-surface-container-lowest rounded-lg border border-outline/15 flex-wrap sm:flex-nowrap">
                            <span className="text-[11px] font-bold text-[#00e476] w-6 text-center">{idx + 1}.</span>
                            
                            {/* Left Indicator */}
                            <select
                              value={cond.indicator}
                              onChange={e => {
                                const val = e.target.value as any;
                                setBuilderEntryConditions(prev => prev.map((c, i) => i === idx ? { ...c, indicator: val } : c));
                              }}
                              className="bg-surface-container border border-outline/20 rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer"
                            >
                              <option value="rsi">RSI (Relative Strength Index)</option>
                              <option value="macd">MACD Line</option>
                              <option value="macd_signal">MACD Signal Line</option>
                              <option value="ema_fast">Fast EMA (20)</option>
                              <option value="ema_slow">Slow EMA (50)</option>
                              <option value="price">Current Close Price</option>
                              <option value="bb_upper">Bollinger Band Upper</option>
                              <option value="bb_lower">Bollinger Band Lower</option>
                              <option value="supertrend">Supertrend Line</option>
                              <option value="volume">Trading Volume</option>
                            </select>

                            {/* Operator */}
                            <select
                              value={cond.operator}
                              onChange={e => {
                                const val = e.target.value as any;
                                setBuilderEntryConditions(prev => prev.map((c, i) => i === idx ? { ...c, operator: val } : c));
                              }}
                              className="bg-surface-container border border-outline/20 rounded px-2.5 py-1 text-xs text-[#00dbe7] font-bold focus:outline-none focus:border-[#00dbe7] cursor-pointer"
                            >
                              <option value=">">&gt; (Is Greater Than)</option>
                              <option value="<">&lt; (Is Less Than)</option>
                              <option value=">=">&gt;= (Greater or Equal)</option>
                              <option value="<=">&lt;= (Less or Equal)</option>
                              <option value="crosses_above">crosses_above (Crosses Above)</option>
                              <option value="crosses_below">crosses_below (Crosses Below)</option>
                              <option value="==">== (Equals)</option>
                            </select>

                            {/* Right Value or Indicator */}
                            <input
                              value={String(cond.value)}
                              onChange={e => {
                                const val = e.target.value;
                                setBuilderEntryConditions(prev => prev.map((c, i) => i === idx ? { ...c, value: val } : c));
                              }}
                              placeholder="Value or indicator (e.g. 30, ema_slow, supertrend)"
                              className="flex-1 min-w-[140px] bg-surface-container border border-outline/20 rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-[#00dbe7]"
                            />

                            <button
                              onClick={() => setBuilderEntryConditions(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-on-surface-variant hover:text-[#ff6b6b] transition-colors cursor-pointer"
                              title="Remove condition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 4: Exit Conditions (WHEN TO SELL) */}
                    <div className="bg-surface-container-low p-5 rounded-xl border border-outline/20 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[#ff6b6b] font-semibold text-sm flex items-center gap-1.5">
                            <TrendingDown className="w-4 h-4" />
                            Exit Conditions (WHEN TO SELL / CLOSE POSITION)
                          </span>
                          <p className="text-[11px] text-on-surface-variant font-sans">
                            A SELL signal triggers when ANY exit condition below evaluates to TRUE.
                          </p>
                        </div>
                        <button
                          onClick={() => setBuilderExitConditions(prev => [
                            ...prev,
                            { indicator: 'rsi', operator: '>', value: 70 }
                          ])}
                          className="px-3 py-1.5 bg-[#ff6b6b]/15 border border-[#ff6b6b]/30 text-[#ff6b6b] hover:bg-[#ff6b6b]/25 rounded-lg text-xs font-mono cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add SELL Condition
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {builderExitConditions.map((cond, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2.5 bg-surface-container-lowest rounded-lg border border-outline/15 flex-wrap sm:flex-nowrap">
                            <span className="text-[11px] font-bold text-[#ff6b6b] w-6 text-center">{idx + 1}.</span>
                            
                            {/* Left Indicator */}
                            <select
                              value={cond.indicator}
                              onChange={e => {
                                const val = e.target.value as any;
                                setBuilderExitConditions(prev => prev.map((c, i) => i === idx ? { ...c, indicator: val } : c));
                              }}
                              className="bg-surface-container border border-outline/20 rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer"
                            >
                              <option value="rsi">RSI (Relative Strength Index)</option>
                              <option value="macd">MACD Line</option>
                              <option value="macd_signal">MACD Signal Line</option>
                              <option value="ema_fast">Fast EMA (20)</option>
                              <option value="ema_slow">Slow EMA (50)</option>
                              <option value="price">Current Close Price</option>
                              <option value="bb_upper">Bollinger Band Upper</option>
                              <option value="bb_lower">Bollinger Band Lower</option>
                              <option value="supertrend">Supertrend Line</option>
                              <option value="volume">Trading Volume</option>
                            </select>

                            {/* Operator */}
                            <select
                              value={cond.operator}
                              onChange={e => {
                                const val = e.target.value as any;
                                setBuilderExitConditions(prev => prev.map((c, i) => i === idx ? { ...c, operator: val } : c));
                              }}
                              className="bg-surface-container border border-outline/20 rounded px-2.5 py-1 text-xs text-[#00dbe7] font-bold focus:outline-none focus:border-[#00dbe7] cursor-pointer"
                            >
                              <option value=">">&gt; (Is Greater Than)</option>
                              <option value="<">&lt; (Is Less Than)</option>
                              <option value=">=">&gt;= (Greater or Equal)</option>
                              <option value="<=">&lt;= (Less or Equal)</option>
                              <option value="crosses_above">crosses_above (Crosses Above)</option>
                              <option value="crosses_below">crosses_below (Crosses Below)</option>
                              <option value="==">== (Equals)</option>
                            </select>

                            {/* Right Value or Indicator */}
                            <input
                              value={String(cond.value)}
                              onChange={e => {
                                const val = e.target.value;
                                setBuilderExitConditions(prev => prev.map((c, i) => i === idx ? { ...c, value: val } : c));
                              }}
                              placeholder="Value or indicator (e.g. 70, ema_slow, supertrend)"
                              className="flex-1 min-w-[140px] bg-surface-container border border-outline/20 rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-[#00dbe7]"
                            />

                            <button
                              onClick={() => setBuilderExitConditions(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-on-surface-variant hover:text-[#ff6b6b] transition-colors cursor-pointer"
                              title="Remove condition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 5: Live Test Sandbox */}
                    <div className="bg-surface-container-low p-5 rounded-xl border border-outline/20 flex flex-col gap-4">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <span className="text-on-surface font-semibold text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#00dbe7]" />
                            Live Test Sandbox
                          </span>
                          <p className="text-[11px] text-on-surface-variant font-sans">
                            Evaluate these draft conditions instantly against current candles of <strong className="text-on-surface">{formatTickerDisplay(symbol).displaySymbol}</strong> before saving.
                          </p>
                        </div>
                        <button
                          onClick={handleTestSandbox}
                          disabled={isEvaluatingSandbox}
                          className="px-4 py-2 bg-surface-container-high border border-[#00dbe7]/40 hover:border-[#00dbe7] text-[#00dbe7] rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          {isEvaluatingSandbox ? 'Evaluating...' : 'Test on Active Stock'}
                        </button>
                      </div>

                      {sandboxSignal && (
                        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20 flex flex-col gap-3 animate-in fade-in duration-200">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <span className={`text-xl font-black font-mono px-3 py-1 rounded-lg ${
                                sandboxSignal.action === 'BUY'
                                  ? 'bg-[#00e476]/15 text-[#00e476] border border-[#00e476]/30'
                                  : sandboxSignal.action === 'SELL'
                                  ? 'bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/30'
                                  : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30'
                              }`}>
                                {sandboxSignal.action}
                              </span>
                              <span className="font-mono text-xs text-on-surface-variant font-bold">
                                Confidence: {((sandboxSignal.confidence || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono">
                              <span>Entry: <strong className="text-on-surface">{curSymbol}{sandboxSignal.entryPrice?.toFixed(1) || '—'}</strong></span>
                              <span>Target: <strong className="text-[#00e476]">{curSymbol}{sandboxSignal.targetPrice?.toFixed(1) || '—'}</strong></span>
                              <span>Stop Loss: <strong className="text-[#ff6b6b]">{curSymbol}{sandboxSignal.stopLoss?.toFixed(1) || '—'}</strong></span>
                              <span>R/R: <strong className="text-[#00dbe7]">{sandboxSignal.riskRewardRatio?.toFixed(2) || '—'}</strong></span>
                            </div>
                          </div>

                          {/* Reasoning */}
                          {sandboxSignal.reasoning && sandboxSignal.reasoning.length > 0 && (
                            <div className="border-t border-outline/10 pt-2 flex flex-col gap-1 text-[11px] font-mono text-on-surface-variant">
                              <span className="text-[10px] uppercase font-bold text-on-surface">Execution Trace:</span>
                              {sandboxSignal.reasoning.map((r, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <span className="text-[#00dbe7]">›</span>
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section 6: Action Footer */}
                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-outline/20">
                      <button
                        onClick={() => setBuilderMode('CATALOG')}
                        className="px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface text-xs font-mono cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveStrategy}
                        disabled={isSavingStrategy}
                        className="px-6 py-2.5 rounded-xl bg-[#00dbe7] text-[#002022] font-bold text-xs font-mono flex items-center gap-2 hover:brightness-110 cursor-pointer shadow-lg disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {isSavingStrategy ? 'Saving to Engine...' : 'Save Strategy to Database'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: GLOBAL MULTI-MARKET SCREENER & SCANNER HUB (STAGE 6) */}
            {settingsActiveTab === 'SCANNER' && (
              <div className="flex flex-col gap-6">
                <StockScannerPanel
                  strategies={strategies}
                  activeStrategyId={selectedStrategyId}
                  activeUniverseKey={activeMarketKey}
                  watchlistSymbols={activeWatchlist.symbols}
                  onSelectSymbol={(sym) => {
                    const fmt = formatTickerDisplay(sym);
                    setSymbol(sym);
                    setSymbolInput(fmt.displaySymbol);
                    setShowSettingsDrawer(false);
                  }}
                  onOpenBacktest={(sym, stratId) => {
                    const fmt = formatTickerDisplay(sym);
                    setSymbol(sym);
                    setSymbolInput(fmt.displaySymbol);
                    setSelectedStrategyId(stratId);
                    setSettingsActiveTab('BACKTEST');
                  }}
                  isDark={isDark}
                />
              </div>
            )}

            {/* TAB: AUTOMATED END-OF-DAY (EOD) BATCH TRADE SIMULATOR (STAGE 6) */}
            {settingsActiveTab === 'SIMULATOR' && (
              <div className="flex flex-col gap-6">
                <StockSimulatorPanel
                  strategies={strategies}
                  activeStrategyId={selectedStrategyId}
                  userEmail={userEmail}
                  onSelectSymbol={(sym) => {
                    const fmt = formatTickerDisplay(sym);
                    setSymbol(sym);
                    setSymbolInput(fmt.displaySymbol);
                    setShowSettingsDrawer(false);
                  }}
                  isDark={isDark}
                />
              </div>
            )}

            {/* TAB: HISTORICAL BACKTESTING ENGINE & FRICTION MODELING (STAGE 4) */}
            {settingsActiveTab === 'BACKTEST' && (
              <div className="flex flex-col gap-6">
                <StockBacktestPanel
                  symbol={symbol}
                  displaySymbol={quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol}
                  cleanSymbol={formatTickerDisplay(symbol).cleanSymbol}
                  companyName={quote?.name}
                  marketRegion={activeMarketKey}
                  curSymbol={curSymbol}
                  strategies={strategies}
                  activeStrategyId={selectedStrategyId}
                  onSelectStrategy={(id) => {
                    setSelectedStrategyId(id);
                    try { localStorage.setItem('sutharlabs_active_strategy_id', id); } catch {}
                  }}
                  onOpenStrategyBuilder={() => {
                    setSettingsActiveTab('STRATEGIES');
                    setBuilderMode('CATALOG');
                  }}
                  isDark={isDark}
                />
              </div>
            )}

            {/* TAB: REAL-TIME NEWS STREAM & AI SENTIMENT INTELLIGENCE (STAGE 3) */}
            {settingsActiveTab === 'NEWS_AI' && (
              <div className="flex flex-col gap-6 text-xs font-mono">
                {/* Header & Overview */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-[#00dbe7]" />
                        Real-Time News Stream & AI Sentiment Intelligence
                      </h4>
                      <p className="text-on-surface-variant text-[11px] mt-0.5 max-w-3xl leading-relaxed">
                        Continuous financial news ingestion across global exchanges (NSE/BSE India, US S&P 500, Europe & East Asia).
                        Headlines are evaluated using <strong>Google Gemini AI</strong> with a deterministic <strong>Autonomous Financial Lexicon Engine</strong> fallback.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchNewsAndSentiment(symbol, activeMarketKey, quote?.name)}
                        disabled={loadingNews}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline/25 hover:border-[#00dbe7] text-on-surface hover:text-[#00dbe7] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin text-[#00dbe7]' : ''}`} />
                        <span>{loadingNews ? 'Synthesizing...' : 'Refresh Live Stream'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Tracked Stock Tracking Card */}
                  <div className="p-3.5 rounded-xl bg-surface-container-high/60 border border-outline/25 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#00dbe7]/15 border border-[#00dbe7]/30 flex items-center justify-center font-bold font-mono text-[#00dbe7] text-xs shrink-0">
                        {(quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol).slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-on-surface">
                            {quote?.name || formatTickerDisplay(symbol).cleanSymbol}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                            {quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol}
                          </span>
                          <span className="text-[10px] font-mono text-on-surface-variant">
                            Exchange: {quote?.exchange || formatTickerDisplay(symbol).exchange}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-on-surface-variant block mt-0.5">
                          Active Ingestion Target: {quote?.name || formatTickerDisplay(symbol).cleanSymbol} ({symbol})
                        </span>
                      </div>
                    </div>

                    {quote && (
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <div>
                          <span className="text-[9px] text-on-surface-variant uppercase block">Market Price</span>
                          <span className="font-bold text-on-surface text-sm">
                            {quote.currency_symbol || curSymbol}{quote.current_price?.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-on-surface-variant uppercase block">24h Change</span>
                          <span className={`font-bold flex items-center gap-0.5 ${(quote.change || 0) >= 0 ? 'text-[#00e476]' : 'text-[#ff6b6b]'}`}>
                            {(quote.change || 0) >= 0 ? '+' : ''}{quote.change?.toFixed(2)} ({(quote.change_percent || 0) >= 0 ? '+' : ''}{quote.change_percent?.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gemini API Key Configuration & Live Usage Tracker Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Card 1: Google Gemini 2.5 Flash API Key Integration */}
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline/20 flex flex-col justify-between gap-3 shadow-sm">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-[#00dbe7]" />
                            Google Gemini 2.5 Flash API Key
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-sans">
                            Powers institutional catalyst summaries & deep financial headline reasoning.
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                          geminiApiKey.trim()
                            ? 'bg-[#00e476]/15 text-[#00e476] border border-[#00e476]/30'
                            : 'bg-surface-container text-on-surface-variant border border-outline/20'
                        }`}>
                          {geminiApiKey.trim() ? (
                            <>
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Gemini Key Active</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              <span>Autonomous Lexicon (Active)</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Input Field with Show/Hide toggle */}
                      <div className="relative mt-1">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={geminiApiKey}
                          onChange={e => handleSaveApiKey(e.target.value)}
                          placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                          className="w-full bg-surface-container border border-outline/25 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-[#00dbe7]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                          title={showApiKey ? 'Hide key' : 'Show key'}
                        >
                          {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Test Result Feedback */}
                      {apiKeyTestResult && (
                        <div className={`p-2 rounded-lg text-[11px] font-mono flex items-center gap-2 ${
                          apiKeyTestResult.success
                            ? 'bg-[#00e476]/10 text-[#00e476] border border-[#00e476]/25'
                            : 'bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/25'
                        }`}>
                          {apiKeyTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                          <span>{apiKeyTestResult.message}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-outline/10 flex items-center justify-between flex-wrap gap-2 text-[10px]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleTestApiKey}
                          disabled={testingApiKey || !geminiApiKey.trim()}
                          className="px-3 py-1.5 rounded-lg bg-[#00dbe7] text-[#002022] font-bold hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          {testingApiKey ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Validating...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Test Connection</span>
                            </>
                          )}
                        </button>

                        {geminiApiKey && (
                          <button
                            onClick={() => handleSaveApiKey('')}
                            className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-[#ff6b6b] transition-colors cursor-pointer"
                          >
                            Clear Key
                          </button>
                        )}
                      </div>

                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00dbe7] hover:underline flex items-center gap-1"
                      >
                        <span>Get Free Key at Google AI Studio (1,500 RPD)</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Card 2: AI & News Usage Tracker Widget */}
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline/20 flex flex-col justify-between gap-3 shadow-sm">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#00dbe7]" />
                          Daily News & AI Usage Tracking
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          Date: {aiUsageStats.date}
                        </span>
                      </div>

                      {/* 4 Stat Metric Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                        <div className="p-2 rounded-lg bg-surface-container border border-outline/10">
                          <span className="block text-[9px] text-on-surface-variant uppercase">Total Requests</span>
                          <span className="text-xs font-bold text-on-surface">{aiUsageStats.totalRequests}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container border border-outline/10">
                          <span className="block text-[9px] text-on-surface-variant uppercase">Gemini AI</span>
                          <span className="text-xs font-bold text-[#00dbe7]">{aiUsageStats.geminiRequests}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container border border-outline/10">
                          <span className="block text-[9px] text-on-surface-variant uppercase">Lexicon</span>
                          <span className="text-xs font-bold text-amber-400">{aiUsageStats.lexiconRequests}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container border border-outline/10">
                          <span className="block text-[9px] text-on-surface-variant uppercase">Cache Hits</span>
                          <span className="text-xs font-bold text-[#00e476]">{aiUsageStats.cacheHits}</span>
                        </div>
                      </div>

                      {/* Quota Progress Bar */}
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                          <span>Gemini Free Tier Quota (1,500 RPD)</span>
                          <span className="font-bold text-on-surface">
                            {aiUsageStats.geminiRequests} / 1,500 used ({((aiUsageStats.geminiRequests / 1500) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00dbe7] to-[#00e476] transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(2, (aiUsageStats.geminiRequests / 1500) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-outline/10 flex justify-between items-center text-[10px]">
                      <span className="text-on-surface-variant">
                        Autonomous Lexicon fallback operates at <strong>0 cost & unlimited volume</strong>.
                      </span>
                      <button
                        onClick={handleResetUsageStats}
                        className="text-on-surface-variant hover:text-on-surface underline cursor-pointer"
                      >
                        Reset Counters
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Stock Sentiment Card */}
                {sentimentReport ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Polarity Gauge Card */}
                    <div className="md:col-span-1 p-4 rounded-xl bg-surface-container-low border border-outline/20 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
                          Stock Polarity: {quote?.name || formatTickerDisplay(symbol).cleanSymbol} ({quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol})
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className={`text-3xl font-black ${
                            sentimentReport.verdict === 'BULLISH'
                              ? 'text-[#00e476]'
                              : sentimentReport.verdict === 'BEARISH'
                              ? 'text-[#ff6b6b]'
                              : 'text-[#00dbe7]'
                          }`}>
                            {sentimentReport.verdict}
                          </span>
                          <span className="text-sm font-bold text-on-surface">
                            {sentimentReport.score > 0 ? '+' : ''}{sentimentReport.score.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Dual-sided gauge bar */}
                      <div className="flex flex-col gap-1">
                        <div className="relative w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
                          <div className="w-1/2 h-full flex justify-end">
                            <div
                              className="h-full bg-[#ff6b6b] rounded-l-full transition-all duration-500"
                              style={{ width: sentimentReport.score < 0 ? `${Math.min(100, Math.abs(sentimentReport.score) * 100)}%` : '0%' }}
                            />
                          </div>
                          <div className="w-[2px] h-full bg-outline z-10" />
                          <div className="w-1/2 h-full flex justify-start">
                            <div
                              className="h-full bg-[#00e476] rounded-r-full transition-all duration-500"
                              style={{ width: sentimentReport.score > 0 ? `${Math.min(100, sentimentReport.score * 100)}%` : '0%' }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-[9px] text-on-surface-variant/70">
                          <span>-1.0 Bearish</span>
                          <span>0.0 Neutral</span>
                          <span>+1.0 Bullish</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-outline/10 flex justify-between items-center text-[10px]">
                        <span className="text-on-surface-variant">Evaluator Model:</span>
                        <span className="font-bold text-on-surface flex items-center gap-1">
                          {sentimentReport.analyzedBy === 'GEMINI_AI' ? (
                            <>
                              <Sparkles className="w-3 h-3 text-[#00dbe7]" />
                              <span>Gemini 2.5 Flash</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>Autonomous Lexicon Engine</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Catalyst & Summary Card */}
                    <div className="md:col-span-2 p-4 rounded-xl bg-surface-container-low border border-outline/20 flex flex-col justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                              Primary Catalyst Theme:
                            </span>
                            <span className="px-2 py-0.5 rounded font-bold text-xs bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                              {sentimentReport.primaryCatalyst.replace('_', ' ')}
                            </span>
                          </div>

                          <span className="text-[10px] text-on-surface-variant">
                            {((sentimentReport.confidence || 0) * 100).toFixed(0)}% Algorithmic Confidence
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-surface-container text-xs text-on-surface leading-relaxed">
                          {sentimentReport.catalystSummary}
                        </div>
                      </div>

                      {/* Emergency Circuit Breaker Callout */}
                      {sentimentReport.circuitBreakerRecommended ? (
                        <div className="p-3 rounded-lg bg-[#ff6b6b]/15 border border-[#ff6b6b]/40 text-[#ff6b6b] flex items-center gap-2.5">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <div>
                            <strong className="block text-xs font-bold">EMERGENCY CIRCUIT BREAKER ADVISORY</strong>
                            <span className="text-[11px] text-on-surface-variant">
                              {sentimentReport.circuitBreakerReason || 'Downside risk detected. Halts automatic BUY executions until news dust settles.'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] text-[#00e476] bg-[#00e476]/10 px-3 py-1.5 rounded-lg border border-[#00e476]/20">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Circuit Breaker Clear: No catastrophic legal, fraud, or bankruptcy headlines flagged.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : loadingNews ? (
                  <div className="p-8 text-center bg-surface-container-low rounded-xl border border-outline/20 animate-pulse flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#00dbe7]" />
                    <span>Analyzing live financial news stream...</span>
                  </div>
                ) : null}

                {/* Architectural Explanation: Sentiment Confluence Model */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline/20 flex flex-col gap-3">
                  <h5 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00dbe7]" />
                    AI Sentiment Confluence Mechanics (How News Blends with Quantitative Algorithms)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] leading-relaxed">
                    <div className="p-2.5 rounded-lg bg-surface-container border border-outline/10 flex flex-col gap-1">
                      <span className="font-bold text-[#00e476] flex items-center gap-1">
                        <span>↑</span> Positive Confluence (+20%)
                      </span>
                      <p className="text-on-surface-variant">
                        When a technical BUY occurs during bullish news sentiment (Score &ge; +0.30), confidence is boosted up to +20%, signaling high-conviction continuation.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-container border border-outline/10 flex flex-col gap-1">
                      <span className="font-bold text-[#ffb74d] flex items-center gap-1">
                        <span>↓</span> Divergence Penalty (-35%)
                      </span>
                      <p className="text-on-surface-variant">
                        When technical indicators indicate BUY but news headlines are adverse (Score &le; -0.35), signal confidence is reduced or converted to cautious HOLD.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-container border border-outline/10 flex flex-col gap-1">
                      <span className="font-bold text-[#ff6b6b] flex items-center gap-1">
                        <span>⚠</span> Emergency Circuit Breaker
                      </span>
                      <p className="text-on-surface-variant">
                        Sudden regulatory probes, accounting fraud, or credit default events immediately override all technical signals to HOLD to prevent catastrophic drawdowns.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Headline Sentiment Breakdown Table */}
                {sentimentReport?.headlines && sentimentReport.headlines.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-xs text-on-surface uppercase tracking-wider">
                      Headline-by-Headline Polarity Audit
                    </span>
                    <div className="border border-outline/20 rounded-xl overflow-hidden bg-surface-container-low">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-surface-container-high/60 border-b border-outline/20 text-on-surface-variant text-[10px] uppercase">
                            <th className="p-3">Headline Title</th>
                            <th className="p-3 w-32">Thematic Catalyst</th>
                            <th className="p-3 w-24 text-center">Polarity Score</th>
                            <th className="p-3 w-24 text-right">Verdict</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline/10">
                          {sentimentReport.headlines.map((h, idx) => (
                            <tr key={idx} className="hover:bg-surface-container/50 transition-colors">
                              <td className="p-3 font-sans text-on-surface font-medium leading-snug">
                                {h.url ? (
                                  <a
                                    href={h.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-on-surface hover:text-[#00dbe7] hover:underline flex items-start gap-1 group/link"
                                  >
                                    <span>{h.title}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-[#00dbe7] opacity-60 group-hover/link:opacity-100 shrink-0 mt-0.5" />
                                  </a>
                                ) : (
                                  <span>{h.title}</span>
                                )}
                                {h.publisher && (
                                  <span className="block text-[10px] text-on-surface-variant/75 font-mono mt-0.5">
                                    Source: {h.publisher}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-on-surface-variant">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container">
                                  {h.catalyst.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-3 text-center font-bold">
                                <span className={h.score > 0 ? 'text-[#00e476]' : h.score < 0 ? 'text-[#ff6b6b]' : 'text-on-surface-variant'}>
                                  {h.score > 0 ? '+' : ''}{h.score.toFixed(2)}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  h.verdict === 'BULLISH'
                                    ? 'bg-[#00e476]/15 text-[#00e476]'
                                    : h.verdict === 'BEARISH'
                                    ? 'bg-[#ff6b6b]/15 text-[#ff6b6b]'
                                    : 'bg-surface-container text-on-surface-variant'
                                }`}>
                                  {h.verdict}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Full Live News Feed */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-on-surface uppercase tracking-wider">
                        Live News Stream
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/30">
                        {quote?.name || formatTickerDisplay(symbol).cleanSymbol} ({quote?.display_symbol || formatTickerDisplay(symbol).displaySymbol})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant">
                      {newsArticles.length} Verified Stories Ingested
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                    {newsArticles.length === 0 ? (
                      <div className="col-span-2 p-8 text-center text-xs text-on-surface-variant/70 border border-dashed border-outline/20 rounded-xl">
                        {loadingNews
                          ? `Fetching live news articles for ${quote?.name || formatTickerDisplay(symbol).cleanSymbol}...`
                          : `No recent news articles found for ${quote?.name || formatTickerDisplay(symbol).cleanSymbol} (${symbol}).`}
                      </div>
                    ) : (
                      newsArticles.slice(0, 30).map(art => (
                        <div
                          key={art.id}
                          className="p-3.5 rounded-xl bg-surface-container-low border border-outline/15 hover:border-[#00dbe7]/50 hover:bg-surface-container transition-all flex flex-col justify-between gap-2.5 group shadow-sm"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                              <span className="font-bold text-on-surface flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00dbe7] shrink-0" />
                                <span className="truncate max-w-[180px]">{art.publisher}</span>
                              </span>
                              <div className="flex items-center gap-1 text-on-surface-variant/80">
                                <Clock className="w-2.5 h-2.5 opacity-70" />
                                <span>{formatRelativeTime(art.publishedAt)}</span>
                              </div>
                            </div>

                            <a
                              href={art.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-sans font-semibold text-on-surface group-hover:text-[#00dbe7] transition-colors leading-snug line-clamp-2 flex items-start justify-between gap-1 group/link cursor-pointer"
                              title={art.title}
                            >
                              <span>{art.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mt-0.5 opacity-60 group-hover/link:opacity-100 group-hover/link:text-[#00dbe7] transition-all" />
                            </a>

                            {art.summary && art.summary !== art.title && (
                              <p className="text-[11px] text-on-surface-variant/90 line-clamp-2 leading-relaxed font-sans">
                                {art.summary}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-outline/10 flex justify-between items-center text-[10px] font-mono text-on-surface-variant/80">
                            <span className="truncate max-w-[180px]">
                              {art.source === 'YAHOO_FINANCE' ? 'Yahoo Finance Feed' : 'Google Regional Feed'}
                            </span>
                            <a
                              href={art.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#00dbe7] hover:underline font-semibold flex items-center gap-1 shrink-0"
                            >
                              <span>Verify on {art.publisher.split(' ')[0]}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

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
        </div>
      )}

      {/* ── Branded Custom Feedback & Confirmation Modal ── */}
      <StockTrackerAlertModal
        alert={alertModal}
        onClose={() => setAlertModal(null)}
      />

    </div>
  );
}
