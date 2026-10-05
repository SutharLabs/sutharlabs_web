import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Sliders, Eye, EyeOff, Globe, TrendingUp, TrendingDown, RefreshCw, BarChart2, ShieldCheck, DollarSign } from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  UTCTimestamp
} from 'lightweight-charts';
import { TerminalLog, UserPortfolio } from '../types';

interface StockTrackerViewProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userEmail: string;
  userToken: string;
}

const STOCK_API = '/api/workspace/stock-analyzer';

interface Quote {
  symbol: string;
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

interface TimePoint {
  time: number;
  value: number;
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
  ema20Series?: TimePoint[];
  ema50Series?: TimePoint[];
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
      { symbol: 'TCS.NS',        name: 'Tata Consultancy Services', sector: 'IT Services' },
      { symbol: 'HDFCBANK.NS',   name: 'HDFC Bank', sector: 'Banking' },
      { symbol: 'INFY.NS',       name: 'Infosys', sector: 'IT Services' },
      { symbol: 'ICICIBANK.NS',  name: 'ICICI Bank', sector: 'Banking' },
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

const DEFAULT_SYMBOL = 'RELIANCE.NS';

export default function StockTrackerView({ logs, onAddLog, userEmail, userToken }: StockTrackerViewProps) {
  // Global Market Universes
  const [universes, setUniverses] = useState<Record<string, MarketUniverse>>(DEFAULT_UNIVERSES);
  const [activeMarketKey, setActiveMarketKey] = useState<string>('IN');

  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL);
  const [showDropdown, setShowDropdown] = useState(false);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<'1D' | '1W' | '1M' | '1Y'>('1W');

  // Chart Overlay Toggles
  const [showEma20, setShowEma20] = useState<boolean>(true);
  const [showEma50, setShowEma50] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);

  // Indicator Settings Drawer
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [rsiPeriod, setRsiPeriod] = useState<number>(14);
  const [bbPeriod, setBbPeriod] = useState<number>(20);
  const [bbStdDev, setBbStdDev] = useState<number>(2);

  // Terminal & UI
  const [activeTab, setActiveTab] = useState<'AGENT_LOGS' | 'OUTPUT' | 'DEBUG_CONSOLE'>('AGENT_LOGS');
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);

  // Paper Trading Portfolio
  const [portfolio, setPortfolio] = useState<UserPortfolio>({ cash: 10000, shares: 0, buyPrice: 0 });
  const [selectedAction, setSelectedAction] = useState<'BUY' | 'SELL' | null>(null);
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

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const onAddLogRef = useRef(onAddLog);

  useEffect(() => {
    onAddLogRef.current = onAddLog;
  }, [onAddLog]);

  // Currency helper
  const curSymbol = quote?.currency_symbol || universes[activeMarketKey]?.currencySymbol || '$';

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

  // ── 3. Core Data Fetch Pipeline ───────────────────────────────────────────
  const fetchAll = useCallback(async (sym: string, period: string) => {
    setLoading(true);
    try {
      // 1. Quote
      const qRes = await fetch(`${STOCK_API}/quote?symbol=${encodeURIComponent(sym)}`);
      let fetchedQuote: Quote | null = null;
      if (qRes.ok) {
        fetchedQuote = await qRes.json();
        setQuote(fetchedQuote);
        const curr = fetchedQuote?.currency_symbol || '$';
        onAddLogRef.current({
          timestamp: new Date().toLocaleTimeString(),
          type: 'DATA',
          message: `Tick → ${fetchedQuote?.symbol}: ${curr}${fetchedQuote?.current_price?.toFixed(2)} (${(fetchedQuote?.change_percent ?? 0) >= 0 ? '+' : ''}${fetchedQuote?.change_percent?.toFixed(2)}%) [${fetchedQuote?.exchange || 'MARKET'}]`
        });
      }

      // 2. History for Candlestick Chart
      const hRes = await fetch(`${STOCK_API}/history?symbol=${encodeURIComponent(sym)}&period=${period}`);
      if (hRes.ok) {
        const h = await hRes.json();
        setCandles(h.candles || []);
      }

      // 3. Indicator Analysis with Configurable Params
      const aUrl = `${STOCK_API}/analysis?symbol=${encodeURIComponent(sym)}&rsiPeriod=${rsiPeriod}&bbPeriod=${bbPeriod}&bbStdDev=${bbStdDev}`;
      const aRes = await fetch(aUrl);
      if (aRes.ok) {
        const a: Analysis = await aRes.json();
        setAnalysis(a);
        if (a.rsi != null) {
          onAddLogRef.current({
            timestamp: new Date().toLocaleTimeString(),
            type: 'AGENT',
            message: `INDICATOR MATRIX: ${sym} RSI(${rsiPeriod})=${a.rsi?.toFixed(1)} | MACD=${a.macd?.toFixed(3)} | ADX=${a.adx?.toFixed(1)} | ATR=${a.atr?.toFixed(2)}`
          });
        }
      }

      // 4. Algorithmic Trade Suggestion
      const sUrl = `${STOCK_API}/suggestion?symbol=${encodeURIComponent(sym)}&rsiPeriod=${rsiPeriod}&bbPeriod=${bbPeriod}&bbStdDev=${bbStdDev}`;
      const sRes = await fetch(sUrl);
      if (sRes.ok) {
        const s: Suggestion = await sRes.json();
        setSuggestion(s);
        onAddLogRef.current({
          timestamp: new Date().toLocaleTimeString(),
          type: s.action === 'BUY' ? 'SUCCESS' : s.action === 'SELL' ? 'ALERT' : 'INFO',
          message: `STRATEGY SIGNAL: ${sym} → ${s.action} | Confidence: ${((s.confidence || 0) * 100).toFixed(0)}%`
        });
      }
    } catch (e) {
      onAddLogRef.current({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `API fetch error for ${sym}: ${e}`
      });
    } finally {
      setLoading(false);
    }
  }, [rsiPeriod, bbPeriod, bbStdDev]);

  // Initial fetch and on symbol/period/parameter change
  useEffect(() => {
    fetchAll(symbol, activePeriod);
  }, [symbol, activePeriod, fetchAll]);

  // Auto-refresh quote every 30s
  useEffect(() => {
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
    }, 30000);
    return () => clearInterval(id);
  }, [symbol]);

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
    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#00dbe7',
          width: 1,
          style: 3,
          labelBackgroundColor: '#002022',
        },
        horzLine: {
          color: '#00dbe7',
          width: 1,
          style: 3,
          labelBackgroundColor: '#002022',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(51, 65, 85, 0.6)',
        scaleMargins: { top: 0.08, bottom: showVolume ? 0.22 : 0.08 },
      },
      timeScale: {
        borderColor: 'rgba(51, 65, 85, 0.6)',
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

    // 3. EMA 20 Overlay Line (Cyan)
    if (showEma20 && analysis?.ema20Series && analysis.ema20Series.length > 0) {
      const candleTimes = new Set(candles.map(c => c.time));
      const validEma20 = analysis.ema20Series
        .filter(p => candleTimes.has(p.time))
        .map(p => ({
          time: p.time as UTCTimestamp,
          value: p.value
        }));

      if (validEma20.length > 0) {
        const ema20Line = chart.addSeries(LineSeries, {
          color: '#00dbe7',
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: true,
        });
        ema20Line.setData(validEma20);
      }
    }

    // 4. EMA 50 Overlay Line (Amber)
    if (showEma50 && analysis?.ema50Series && analysis.ema50Series.length > 0) {
      const candleTimes = new Set(candles.map(c => c.time));
      const validEma50 = analysis.ema50Series
        .filter(p => candleTimes.has(p.time))
        .map(p => ({
          time: p.time as UTCTimestamp,
          value: p.value
        }));

      if (validEma50.length > 0) {
        const ema50Line = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: true,
        });
        ema50Line.setData(validEma50);
      }
    }

    // Crosshair hover inspection
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoveredBar(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as any;
      if (data) {
        const dateStr = typeof param.time === 'number'
          ? new Date(param.time * 1000).toLocaleString()
          : String(param.time);
        setHoveredBar({
          time: dateStr,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.volume || 0,
        });
      }
    });

    // Auto-fit contents
    chart.timeScale().fitContent();

    // Auto-resize listener
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length && entries[0].contentRect && chartInstanceRef.current) {
        const width = entries[0].contentRect.width;
        if (width > 0) {
          chartInstanceRef.current.applyOptions({ width });
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [candles, showVolume, showEma20, showEma50, analysis, activePeriod]);

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
      setSelectedAction(null);
      setTimeout(() => setNotification(''), 4000);
    } catch {
      setNotification('Server error. Order execution failed.');
    }
  };

  // Current market watchlist
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
    : { text: 'text-[#74f5ff]', bg: 'bg-[#00dbe7]/10', border: 'border-[#00dbe7]/30' };

  // RSI display color
  const rsiColor = analysis?.rsi == null ? 'text-on-surface-variant'
    : analysis.rsi > 70 ? 'text-[#ff6b6b]'
    : analysis.rsi < 30 ? 'text-[#00e476]'
    : 'text-[#74f5ff]';

  const rsiLabel = analysis?.rsi == null ? '—'
    : analysis.rsi > 70 ? 'Overbought'
    : analysis.rsi < 30 ? 'Oversold'
    : 'Neutral';

  return (
    <div className="flex-grow flex flex-col gap-4">

      {/* Notification Toast */}
      {notification && (
        <div className="bg-[#00e476]/10 border border-[#00fb83]/30 text-[#00e476] p-3 rounded-lg text-xs font-mono flex items-center gap-2 shadow-lg">
          <span className="material-symbols-outlined text-sm select-none">check_circle</span>
          {notification}
        </div>
      )}

      {/* ── 1. GLOBAL MARKET UNIVERSE SELECTOR ───────────────────────────────── */}
      <div className="glass-panel rounded-xl p-3 border border-outline/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-surface-container-lowest">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#00dbe7]" />
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
            Market Universe:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(universes).map(([key, u]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveMarketKey(key);
                  if (u.stocks.length > 0) {
                    const firstStock = u.stocks[0].symbol;
                    setSymbol(firstStock);
                    setSymbolInput(firstStock);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMarketKey === key
                    ? 'bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/50 font-bold shadow-[0_0_10px_rgba(0,219,231,0.2)]'
                    : 'bg-[#18181b]/80 text-[#94a3b8] hover:text-white border border-outline/10 hover:border-outline/30'
                }`}
              >
                <span>{u.flag}</span>
                <span>{u.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Market State Badge */}
        {quote?.market_state && (
          <div className="flex items-center gap-2 font-mono text-[11px] self-end md:self-auto">
            <span className={`w-2 h-2 rounded-full ${quote.market_open ? 'bg-[#00e476] animate-pulse' : 'bg-slate-500'}`} />
            <span className={quote.market_open ? 'text-[#00e476] font-bold' : 'text-slate-400'}>
              {quote.exchange || 'EXCHANGE'} • {quote.market_open ? 'SESSION ACTIVE' : `CLOSED (${quote.market_state})`}
            </span>
          </div>
        )}
      </div>

      {/* ── 2. TICKER SEARCH & CONTROLS BAR ─────────────────────────────────── */}
      <div className="glass-panel rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center border border-outline/20">
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
          Active Instrument
        </span>
        <div className="relative flex-grow max-w-sm">
          <input
            value={symbolInput}
            onChange={e => { setSymbolInput(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setSymbol(symbolInput.trim().toUpperCase());
                setShowDropdown(false);
              }
            }}
            placeholder="e.g. RELIANCE.NS, AAPL, SHEL.L"
            className="w-full bg-[#0c0c0e] border border-outline/30 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00dbe7] uppercase tracking-wider"
          />
          {showDropdown && filteredStocks.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#10141e] border border-outline/40 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-xl max-h-64 overflow-y-auto custom-scrollbar">
              {filteredStocks.map(s => (
                <button
                  key={s.symbol}
                  onMouseDown={() => {
                    setSymbol(s.symbol);
                    setSymbolInput(s.symbol);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-mono hover:bg-[#00dbe7]/15 transition-colors flex justify-between items-center border-b border-outline/10 last:border-none bg-transparent cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-[#00dbe7] font-bold">{s.symbol}</span>
                    <span className="text-[10px] text-slate-400">{s.name}</span>
                  </div>
                  {s.sector && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-slate-300">
                      {s.sector}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => { setSymbol(symbolInput.trim().toUpperCase()); setShowDropdown(false); }}
          className="px-4 py-2 bg-[#00dbe7] text-[#002022] text-xs font-mono font-bold uppercase rounded-lg hover:brightness-110 transition-all cursor-pointer whitespace-nowrap shadow-[0_0_12px_rgba(0,219,231,0.3)]"
        >
          Load Chart
        </button>

        {/* Quick Indicator Settings Toggle */}
        <button
          onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
          className={`px-3 py-2 border rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ml-auto ${
            showSettingsDrawer
              ? 'bg-[#00dbe7]/20 border-[#00dbe7] text-[#74f5ff]'
              : 'border-outline/30 text-slate-300 hover:text-white bg-surface-container-low'
          }`}
          title="Configure Indicator Parameters"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Indicator Settings</span>
        </button>
      </div>

      {/* ── 2.1 INDICATOR CONFIGURATION DRAWER (COLLAPSIBLE) ────────────────── */}
      {showSettingsDrawer && (
        <div className="glass-panel rounded-xl p-4 border border-[#00dbe7]/30 bg-[#090e17]/95 animate-fade-in flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300">RSI Period:</span>
            <input
              type="number"
              min="5"
              max="50"
              value={rsiPeriod}
              onChange={e => setRsiPeriod(parseInt(e.target.value) || 14)}
              className="w-16 bg-[#0c0c0e] border border-outline/30 rounded px-2 py-1 text-xs font-mono text-white text-center"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300">BB Period:</span>
            <input
              type="number"
              min="10"
              max="50"
              value={bbPeriod}
              onChange={e => setBbPeriod(parseInt(e.target.value) || 20)}
              className="w-16 bg-[#0c0c0e] border border-outline/30 rounded px-2 py-1 text-xs font-mono text-white text-center"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300">BB StdDev:</span>
            <input
              type="number"
              step="0.5"
              min="1"
              max="4"
              value={bbStdDev}
              onChange={e => setBbStdDev(parseFloat(e.target.value) || 2)}
              className="w-16 bg-[#0c0c0e] border border-outline/30 rounded px-2 py-1 text-xs font-mono text-white text-center"
            />
          </div>
          <button
            onClick={() => fetchAll(symbol, activePeriod)}
            className="px-3 py-1 bg-[#00dbe7]/20 border border-[#00dbe7]/40 text-[#74f5ff] text-xs font-mono rounded hover:bg-[#00dbe7]/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Apply Parameters
          </button>
        </div>
      )}

      {/* ── 3. QUOTE HEADER & STATS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Main Price & Strategy Card */}
        <div className="lg:col-span-8 glass-panel rounded-xl p-5 flex flex-col justify-between neon-border-active relative overflow-hidden bg-gradient-to-br from-surface-container-lowest to-[#0e1420]">
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-sans font-bold tracking-tight text-on-surface">
                  {quote?.symbol ?? symbol}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/40 leading-none">
                  {quote?.exchange || activeUniverse?.exchange || 'MARKET'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 leading-none">
                  {quote?.currency || activeUniverse?.currencyCode || 'USD'}
                </span>
                {loading && <span className="text-[10px] font-mono text-on-surface-variant animate-pulse">Syncing...</span>}
              </div>
              <p className="text-xs text-[#b9cacb] mt-1.5 font-light">{quote?.name ?? '—'}</p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-sans font-bold text-[#00e476]">
                {curSymbol}{quote?.current_price?.toFixed(2) ?? '—'}
              </div>
              <div className={`flex items-center justify-end gap-1 font-mono text-xs mt-1 ${isPositive ? 'text-[#00e476]' : 'text-[#ff6b6b]'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>
                  {isPositive ? '+' : ''}{quote?.change?.toFixed(2) ?? '0'} ({isPositive ? '+' : ''}{quote?.change_percent?.toFixed(2) ?? '0'}%)
                </span>
              </div>
            </div>
          </div>

          {/* Strategy Signal Banner */}
          {suggestion && (
            <div className={`mt-4 p-3 rounded-lg border ${actionColor.bg} ${actionColor.border} flex items-center gap-3`}>
              <span className={`text-xl font-mono font-black ${actionColor.text}`}>{suggestion.action}</span>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <div className="flex-grow bg-[#0c0c0e] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${suggestion.action === 'BUY' ? 'bg-[#00e476]' : suggestion.action === 'SELL' ? 'bg-[#ff6b6b]' : 'bg-[#00dbe7]'}`}
                      style={{ width: `${(suggestion.confidence ?? 0) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant whitespace-nowrap">
                    {((suggestion.confidence ?? 0) * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-[10px] font-mono text-on-surface-variant">
                  {suggestion.target_price && (
                    <span>Target: <span className="text-[#00e476]">{curSymbol}{suggestion.target_price.toFixed(2)}</span></span>
                  )}
                  {suggestion.stop_loss && (
                    <span>Stop: <span className="text-[#ff6b6b]">{curSymbol}{suggestion.stop_loss.toFixed(2)}</span></span>
                  )}
                  {suggestion.risk_reward_ratio && (
                    <span>R/R: <span className="text-[#74f5ff]">{suggestion.risk_reward_ratio.toFixed(2)}</span></span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trade Actions */}
          <div className="flex gap-3 mt-4 z-10">
            <button
              onClick={() => setSelectedAction('BUY')}
              className="flex-1 bg-[#00e476] text-[#002812] font-mono text-xs py-2.5 rounded-lg font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_12px_rgba(0,228,118,0.4)] transition-all cursor-pointer"
            >
              BUY {quote?.symbol ?? symbol}
            </button>
            <button
              onClick={() => setSelectedAction('SELL')}
              className="flex-1 bg-[#ff6b6b] text-[#2c0000] font-mono text-xs py-2.5 rounded-lg font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_12px_rgba(255,107,107,0.4)] transition-all cursor-pointer"
            >
              SELL {quote?.symbol ?? symbol}
            </button>
          </div>
        </div>

        {/* Micro Stats Grid */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          <div className="glass-panel rounded-xl p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-widest mb-1">Volume</span>
            <span className="font-mono text-sm text-on-surface font-semibold">
              {quote?.volume != null ? (quote.volume > 1e6 ? `${(quote.volume / 1e6).toFixed(2)}M` : quote.volume.toLocaleString()) : '—'}
            </span>
          </div>

          <div className="glass-panel rounded-xl p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-widest mb-1">Day Range</span>
            <span className="font-mono text-xs text-on-surface font-semibold truncate">
              {quote?.low != null ? `${curSymbol}${quote.low.toFixed(1)}` : '—'} – {quote?.high != null ? `${curSymbol}${quote.high.toFixed(1)}` : '—'}
            </span>
          </div>

          <div className="glass-panel rounded-xl p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-widest mb-1">RSI ({rsiPeriod})</span>
            <span className={`font-mono text-sm font-semibold ${rsiColor}`}>
              {analysis?.rsi != null ? analysis.rsi.toFixed(1) : '—'} <span className="text-[9px] uppercase font-normal">{rsiLabel}</span>
            </span>
          </div>

          <div className="glass-panel rounded-xl p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-widest mb-1">ADX (14)</span>
            <span className="font-mono text-xs text-[#00e476] font-semibold">
              {analysis?.adx != null ? `${analysis.adx.toFixed(1)} (${analysis.adx > 25 ? 'Strong' : 'Ranging'})` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. TECHNICAL INDICATORS MATRIX ───────────────────────────────────── */}
      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-panel rounded-xl p-3.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">MACD (12, 26, 9)</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${analysis.macd != null && analysis.macd_signal != null && analysis.macd > analysis.macd_signal ? 'bg-[#00e476]/20 text-[#00e476]' : 'bg-[#ff6b6b]/20 text-[#ff6b6b]'}`}>
                {analysis.signals.macd || 'Neutral'}
              </span>
            </div>
            <div className="text-xs font-mono">
              <span className={analysis.macd != null && analysis.macd_signal != null && analysis.macd > analysis.macd_signal ? 'text-[#00e476]' : 'text-[#ff6b6b]'}>
                {analysis.macd?.toFixed(3) ?? '—'}
              </span>
              <span className="text-on-surface-variant"> / {analysis.macd_signal?.toFixed(3) ?? '—'}</span>
            </div>
            <div className="text-[10px] font-mono text-on-surface-variant">
              Hist: {analysis.macd_histogram?.toFixed(3) ?? '—'}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-3.5 space-y-1">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Bollinger Bands ({bbPeriod}, {bbStdDev})</span>
            <div className="text-xs font-mono text-[#74f5ff]">
              Upper: {curSymbol}{analysis.bb_upper?.toFixed(1) ?? '—'}
            </div>
            <div className="text-[10px] font-mono text-on-surface-variant">
              Mid: {curSymbol}{analysis.bb_middle?.toFixed(1) ?? '—'} | Low: {curSymbol}{analysis.bb_lower?.toFixed(1) ?? '—'}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-3.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">EMA Trend (20/50)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                {analysis.signals.trend || 'Trend'}
              </span>
            </div>
            <div className="text-xs font-mono">
              <span className="text-[#00dbe7]">EMA20: {curSymbol}{analysis.ema_20?.toFixed(1) ?? '—'}</span>
            </div>
            <div className="text-[10px] font-mono text-[#f59e0b]">
              EMA50: {curSymbol}{analysis.ema_50?.toFixed(1) ?? '—'}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-3.5 space-y-1">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">ATR Volatility (14)</span>
            <div className="text-xs font-mono text-[#74f5ff]">
              {curSymbol}{analysis.atr?.toFixed(2) ?? '—'}
            </div>
            <div className="text-[10px] font-mono text-on-surface-variant">
              {analysis.atr != null && quote?.current_price
                ? `${((analysis.atr / quote.current_price) * 100).toFixed(2)}% average true range`
                : 'Volatility Index'}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. ORDER EXECUTION TERMINAL DRAWER ────────────────────────────────── */}
      {selectedAction && (
        <div className="glass-panel rounded-xl p-5 border border-[#00dbe7]/40 bg-surface-container-low animate-fade-in shadow-2xl">
          <div className="flex justify-between items-center border-b border-outline/20 pb-3 mb-4">
            <h4 className="font-sans font-bold text-sm text-[#74f5ff] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00dbe7] text-base select-none">bolt</span>
              Order Terminal — {selectedAction} {quote?.symbol ?? symbol}
            </h4>
            <button
              onClick={() => setSelectedAction(null)}
              className="text-[#b9cacb] hover:text-white rounded-full p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm select-none">close</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div className="bg-[#0e0e10]/80 p-3 rounded-lg border border-outline/30">
              <span className="block font-mono text-[10px] text-on-surface-variant uppercase">Execution Price</span>
              <span className="font-mono text-sm text-on-surface font-bold block mt-1">
                {curSymbol}{quote?.current_price?.toFixed(2) ?? '—'}
              </span>
            </div>
            <div className="bg-[#0e0e10]/80 p-3 rounded-lg border border-outline/30">
              <span className="block font-mono text-[10px] text-on-surface-variant uppercase">Available Cash</span>
              <span className="font-mono text-sm text-[#74f5ff] font-bold block mt-1">
                {curSymbol}{portfolio.cash?.toFixed(2)}
              </span>
            </div>
            <div className="bg-[#0e0e10]/80 p-3 rounded-lg border border-outline/30">
              <span className="block font-mono text-[10px] text-on-surface-variant uppercase">Current Holdings</span>
              <span className="font-mono text-sm text-[#e2ffe3] font-bold block mt-1">
                {portfolio.shares} shares @ {curSymbol}{portfolio.buyPrice}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="bg-[#0e0e10]/80 p-3 rounded-lg border border-outline/30 flex-grow flex flex-col justify-center">
                <span className="block font-mono text-[9px] text-on-surface-variant uppercase leading-none">QTY</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={actionQuantity}
                  onChange={e => setActionQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-transparent border-none focus:outline-none text-sm font-mono text-white p-0 mt-1 block w-full"
                />
              </div>
              <button
                onClick={() => executeTrade(selectedAction)}
                className={`px-6 rounded-lg font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  selectedAction === 'BUY'
                    ? 'bg-[#00e476] text-[#002812] hover:brightness-110 shadow-[0_0_12px_rgba(0,228,118,0.4)]'
                    : 'bg-[#ff6b6b] text-[#2c0000] hover:brightness-110 shadow-[0_0_12px_rgba(255,107,107,0.4)]'
                }`}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. TRADINGVIEW LIGHTWEIGHT CANDLESTICK CHART ───────────────────────── */}
      <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden border border-outline/20 bg-[#090d16]">
        {/* Chart Header Bar: Timeframes + Overlay Toggles */}
        <div className="flex flex-wrap justify-between items-center gap-3 p-3 border-b border-outline/10 bg-[#0c121e]/80">
          {/* Timeframe Selectors */}
          <div className="flex gap-1.5 items-center">
            {(['1D', '1W', '1M', '1Y'] as const).map(p => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  activePeriod === p
                    ? 'bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/40 font-bold shadow-[0_0_8px_rgba(0,219,231,0.2)]'
                    : 'bg-[#181f2c] text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Interactive Chart Overlays */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowEma20(!showEma20)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                showEma20
                  ? 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/40'
                  : 'bg-[#181f2c] text-slate-500 border border-transparent'
              }`}
            >
              {showEma20 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>EMA 20</span>
            </button>

            <button
              onClick={() => setShowEma50(!showEma50)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                showEma50
                  ? 'bg-amber-500/20 text-[#f59e0b] border border-amber-500/40'
                  : 'bg-[#181f2c] text-slate-500 border border-transparent'
              }`}
            >
              {showEma50 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>EMA 50</span>
            </button>

            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                showVolume
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-[#181f2c] text-slate-500 border border-transparent'
              }`}
            >
              {showVolume ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Volume</span>
            </button>
          </div>
        </div>

        {/* Hovered Bar Inspection Pill */}
        {hoveredBar && (
          <div className="px-4 py-1.5 bg-[#0d1422] border-b border-outline/10 font-mono text-[11px] flex flex-wrap gap-4 text-slate-300">
            <span className="text-slate-400">{hoveredBar.time}</span>
            <span>O: <span className="text-white font-bold">{curSymbol}{hoveredBar.open.toFixed(2)}</span></span>
            <span>H: <span className="text-[#00e476] font-bold">{curSymbol}{hoveredBar.high.toFixed(2)}</span></span>
            <span>L: <span className="text-[#ff6b6b] font-bold">{curSymbol}{hoveredBar.low.toFixed(2)}</span></span>
            <span>C: <span className="text-[#74f5ff] font-bold">{curSymbol}{hoveredBar.close.toFixed(2)}</span></span>
          </div>
        )}

        {/* Chart Canvas Container */}
        <div className="relative flex-1 min-h-[380px] p-2 bg-[#090d16]">
          {loading && candles.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#090d16]/80 z-20 font-mono text-xs text-[#00dbe7] animate-pulse">
              Initializing TradingView Candlestick Engine...
            </div>
          )}
          <div ref={chartContainerRef} className="w-full h-full min-h-[380px]" />
        </div>
      </div>

      {/* ── 7. WORKSPACE TERMINAL CONSOLE ────────────────────────────────────── */}
      <div className={`border border-outline/20 bg-[#0e0e10]/95 rounded-xl flex flex-col overflow-hidden transition-all duration-300 ${
        isTerminalCollapsed ? 'h-9 shrink-0' : 'h-48'
      }`}>
        <div
          onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
          className="flex items-center justify-between px-4 py-2 border-b border-outline/10 bg-[#161a24] select-none cursor-pointer"
        >
          <div className="flex items-center">
            <span className="font-mono text-[10px] font-bold text-[#b9cacb] uppercase tracking-widest leading-none">
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
                      activeTab === tab ? 'text-[#74f5ff] border-b border-[#00dbe7] font-bold' : 'text-on-surface-variant hover:text-on-surface'
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
          <div ref={terminalContainerRef} className="flex-1 p-3 font-mono text-xs overflow-y-auto custom-scrollbar bg-[#050505]">
            {activeTab === 'AGENT_LOGS' && (
              <div className="space-y-1">
                {logs.map((log, i) => {
                  const c = log.type === 'SUCCESS' ? 'text-[#00e476]'
                    : log.type === 'ALERT' ? 'text-[#ff6b6b]'
                    : log.type === 'AGENT' ? 'text-[#00dbe7]'
                    : log.type === 'ERROR' ? 'text-[#ffb4ab]'
                    : log.type === 'DATA' ? 'text-[#74f5ff]'
                    : 'text-[#b9cacb]/80';
                  return (
                    <div key={i} className={`flex gap-2 ${c}`}>
                      <span className="text-on-surface-variant">[{log.timestamp}]</span>
                      <span>{log.message}</span>
                    </div>
                  );
                })}
                <div className="text-[#b9cacb]/80 flex gap-2">
                  <span className="text-on-surface-variant">[{new Date().toLocaleTimeString()}]</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            )}

            {activeTab === 'OUTPUT' && (
              <div className="text-on-surface-variant space-y-0.5">
                <div>&gt; SutharLabs Trading Engine v2.0 (Lightweight Charts Edition) connected</div>
                <div>&gt; Multi-Market Universes active: India (NSE), US (NYSE/NASDAQ), Europe (LSE/DAX), China/HK, Japan (TSE)</div>
                <div>&gt; Technical Indicator Engine: RSI, MACD, Bollinger Bands, ATR, ADX, EMA (20/50 overlays)</div>
                <div>&gt; Signal Engine: Pluggable Multi-Strategy Condition Matrix</div>
                <div className="text-[#00e476]">&gt; Status: All global market feed adapters online</div>
              </div>
            )}

            {activeTab === 'DEBUG_CONSOLE' && (
              <div className="text-[#74f5ff] space-y-0.5">
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

    </div>
  );
}
