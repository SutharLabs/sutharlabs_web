import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  current_price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  prev_close: number;
  change: number;
  change_percent: number;
  market_open: boolean;
}

interface Candle {
  time: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

interface Analysis {
  rsi: number | null;
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

interface NiftyStock {
  symbol: string;
  name: string;
}

const DEFAULT_SYMBOL = 'RELIANCE.NS';

export default function StockTrackerView({ logs, onAddLog, userEmail, userToken }: StockTrackerViewProps) {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL);
  const [niftyList, setNiftyList] = useState<NiftyStock[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [activePeriod, setActivePeriod] = useState<'1D' | '1W' | '1M' | '1Y'>('1W');
  const [activeTab, setActiveTab] = useState<'AGENT_LOGS' | 'OUTPUT' | 'DEBUG_CONSOLE'>('AGENT_LOGS');

  const [portfolio, setPortfolio] = useState<UserPortfolio>({ cash: 10000, shares: 0, buyPrice: 0 });
  const [selectedAction, setSelectedAction] = useState<'BUY' | 'SELL' | null>(null);
  const [actionQuantity, setActionQuantity] = useState<number>(1);
  const [notification, setNotification] = useState('');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const svgWidth = 600;
  const svgHeight = 220;

  // ── Fetch NIFTY 50 list on mount ───────────────────────────────────────────
  useEffect(() => {
    setApiOnline(true);

    fetch(`${STOCK_API}/nifty50`)
      .then(r => r.json())
      .then(data => setNiftyList(data))
      .catch(() => {});
  }, []);

  // ── Fetch portfolio ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/portfolio?email=${encodeURIComponent(userEmail)}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPortfolio(data); })
      .catch(() => {});
  }, [userEmail, userToken]);

  // ── Core data fetch ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (sym: string, period: string) => {
    setLoading(true);
    try {
      // Quote (fast)
      const qRes = await fetch(`${STOCK_API}/quote?symbol=${sym}`);
      if (qRes.ok) {
        const q: Quote = await qRes.json();
        setQuote(q);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'DATA',
          message: `Tick → ${q.symbol}: ₹${q.current_price?.toFixed(2)} (${q.change_percent >= 0 ? '+' : ''}${q.change_percent?.toFixed(2)}%)`
        });
      }

      // History for chart
      const hRes = await fetch(`${STOCK_API}/history?symbol=${sym}&period=${period}`);
      if (hRes.ok) {
        const h = await hRes.json();
        setCandles(h.candles || []);
      }

      // Analysis (slower — runs monthly data through indicator engine)
      const aRes = await fetch(`${STOCK_API}/analysis?symbol=${sym}`);
      if (aRes.ok) {
        const a: Analysis = await aRes.json();
        setAnalysis(a);
        if (a.rsi != null) {
          onAddLog({
            timestamp: new Date().toLocaleTimeString(),
            type: 'AGENT',
            message: `AGENT: ${sym} RSI=${a.rsi?.toFixed(1)} | MACD=${a.macd?.toFixed(3)} | ADX=${a.adx?.toFixed(1)}`
          });
        }
      }

      // Suggestion
      const sRes = await fetch(`${STOCK_API}/suggestion?symbol=${sym}`);
      if (sRes.ok) {
        const s: Suggestion = await sRes.json();
        setSuggestion(s);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: s.action === 'BUY' ? 'SUCCESS' : s.action === 'SELL' ? 'ALERT' : 'INFO',
          message: `SIGNAL: ${sym} → ${s.action} | Confidence: ${((s.confidence || 0) * 100).toFixed(0)}%`
        });
      }
    } catch (e) {
      onAddLog({ timestamp: new Date().toLocaleTimeString(), type: 'ERROR', message: `API error: ${e}` });
    } finally {
      setLoading(false);
    }
  }, [onAddLog]);

  // ── Initial fetch + period change ──────────────────────────────────────────
  useEffect(() => {
    fetchAll(symbol, activePeriod);
  }, [symbol, activePeriod, fetchAll]);

  // ── Auto-refresh quote every 30s ───────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      fetch(`${STOCK_API}/quote?symbol=${symbol}`)
        .then(r => r.ok ? r.json() : null)
        .then(q => {
          if (!q) return;
          setQuote(q);
          onAddLog({
            timestamp: new Date().toLocaleTimeString(),
            type: 'DATA',
            message: `Tick → ${q.symbol}: ₹${q.current_price?.toFixed(2)} (${q.change_percent >= 0 ? '+' : ''}${q.change_percent?.toFixed(2)}%)`
          });
        }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [symbol, onAddLog]);

  // ── Terminal scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, activeTab]);

  // ── Chart SVG path ─────────────────────────────────────────────────────────
  const closes = candles.map(c => c.close).filter(Boolean);
  const minClose = closes.length > 0 ? Math.min(...closes) * 0.998 : 0;
  const maxClose = closes.length > 0 ? Math.max(...closes) * 1.002 : 1;
  const pRange = maxClose - minClose || 1;

  const getCoords = () =>
    closes.map((price, idx) => ({
      x: (idx / Math.max(closes.length - 1, 1)) * (svgWidth - 40) + 10,
      y: svgHeight - ((price - minClose) / pRange) * (svgHeight - 40) - 20,
    }));

  const coords = getCoords();
  const polylineStr = coords.map(p => `${p.x},${p.y}`).join(' ');
  const polygonStr = `${coords[0]?.x ?? 0},${svgHeight} ${polylineStr} ${coords[coords.length - 1]?.x ?? svgWidth},${svgHeight}`;

  // ── Suggestion colour ──────────────────────────────────────────────────────
  const actionColor = suggestion?.action === 'BUY'
    ? { text: 'text-[#00e476]', bg: 'bg-[#00e476]/10', border: 'border-[#00e476]/40' }
    : suggestion?.action === 'SELL'
    ? { text: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/10', border: 'border-[#ff6b6b]/40' }
    : { text: 'text-[#74f5ff]', bg: 'bg-[#00dbe7]/10', border: 'border-[#00dbe7]/30' };

  // ── RSI colour ─────────────────────────────────────────────────────────────
  const rsiColor = analysis?.rsi == null ? 'text-gray-500'
    : analysis.rsi > 70 ? 'text-[#ff6b6b]'
    : analysis.rsi < 30 ? 'text-[#00e476]'
    : 'text-[#74f5ff]';

  const rsiLabel = analysis?.rsi == null ? '—'
    : analysis.rsi > 70 ? 'Overbought'
    : analysis.rsi < 30 ? 'Oversold'
    : 'Neutral';

  // ── Trade execution ────────────────────────────────────────────────────────
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
        message: `${action}: ${actionQuantity} × ${symbol} @ ₹${quote.current_price?.toFixed(2)}`
      });
      setNotification(`${action} order executed — ${actionQuantity} × ${quote.name || symbol}`);
      setSelectedAction(null);
      setTimeout(() => setNotification(''), 4000);
    } catch { setNotification('Server error. Try again.'); }
  };

  const filteredStocks = niftyList.filter(s =>
    s.symbol.toLowerCase().includes(symbolInput.toLowerCase()) ||
    s.name.toLowerCase().includes(symbolInput.toLowerCase())
  ).slice(0, 8);

  const isPositive = (quote?.change_percent ?? 0) >= 0;

  return (
    <div className="flex-grow flex flex-col gap-4">

      {/* API offline banner */}
      {apiOnline === false && (
        <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-[#ff6b6b] p-3 rounded text-xs font-mono flex items-center gap-2">
          <span className="material-symbols-outlined text-sm select-none">warning</span>
          Stock API offline — start it with: <code className="bg-black/30 px-1 rounded">python stock_api.py</code> in the SME directory
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="bg-[#00e476]/10 border border-[#00fb83]/30 text-[#00e476] p-3 rounded text-xs font-mono flex items-center gap-2">
          <span className="material-symbols-outlined text-sm select-none">check_circle</span>
          {notification}
        </div>
      )}

      {/* ── Symbol Selector ─────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center border border-[#3a494b]/20">
        <span className="font-mono text-[10px] text-[#849495] uppercase tracking-widest whitespace-nowrap">NSE/BSE Symbol</span>
        <div className="relative flex-grow max-w-xs">
          <input
            value={symbolInput}
            onChange={e => { setSymbolInput(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="e.g. RELIANCE.NS"
            className="w-full bg-[#0c0c0e] border border-[#3a494b]/30 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00dbe7] uppercase"
          />
          {showDropdown && filteredStocks.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#131315] border border-[#3a494b]/30 rounded shadow-2xl z-50 overflow-hidden">
              {filteredStocks.map(s => (
                <button
                  key={s.symbol}
                  onMouseDown={() => { setSymbol(s.symbol); setSymbolInput(s.symbol); setShowDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#00dbe7]/10 transition-colors flex justify-between items-center gap-2 border-none bg-transparent cursor-pointer"
                >
                  <span className="text-[#00dbe7]">{s.symbol}</span>
                  <span className="text-[#849495] truncate text-right">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => { setSymbol(symbolInput.toUpperCase()); setShowDropdown(false); }}
          className="px-4 py-2 bg-[#00dbe7] text-[#002022] text-xs font-mono font-bold uppercase rounded hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
        >
          Load
        </button>
        {quote?.market_open != null && (
          <span className={`flex items-center gap-1.5 text-[10px] font-mono ${quote.market_open ? 'text-[#00e476]' : 'text-[#849495]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${quote.market_open ? 'bg-[#00e476] animate-pulse' : 'bg-[#849495]'}`} />
            {quote.market_open ? 'MARKET OPEN' : 'MARKET CLOSED'}
          </span>
        )}
      </div>

      {/* ── Quote + Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Main price card */}
        <div className="lg:col-span-8 glass-panel rounded-lg p-6 flex flex-col justify-between neon-border-active relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00dbe7]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-sans font-bold tracking-tight text-[#e5e1e4]">
                  {quote?.symbol?.replace('.NS', '').replace('.BO', '') ?? symbol.replace('.NS', '')}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/40 leading-none">NSE</span>
                {loading && <span className="text-[10px] font-mono text-[#849495] animate-pulse">Loading...</span>}
              </div>
              <p className="text-xs text-[#b9cacb] mt-1.5 font-light">{quote?.name ?? '—'}</p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-sans font-bold text-[#00e476]">
                ₹{quote?.current_price?.toFixed(2) ?? '—'}
              </div>
              <div className={`flex items-center justify-end gap-1 font-mono text-xs mt-1 ${isPositive ? 'text-[#00e476]' : 'text-[#ff6b6b]'}`}>
                <span className="material-symbols-outlined text-sm select-none">
                  {isPositive ? 'arrow_upward' : 'arrow_downward'}
                </span>
                <span>{isPositive ? '+' : ''}{quote?.change?.toFixed(2) ?? '0'} ({isPositive ? '+' : ''}{quote?.change_percent?.toFixed(2) ?? '0'}%)</span>
              </div>
            </div>
          </div>

          {/* AI Suggestion badge */}
          {suggestion && (
            <div className={`mt-4 p-3 rounded border ${actionColor.bg} ${actionColor.border} flex items-center gap-3`}>
              <span className={`text-xl font-mono font-black ${actionColor.text}`}>{suggestion.action}</span>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <div className="flex-grow bg-[#0c0c0e] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${suggestion.action === 'BUY' ? 'bg-[#00e476]' : suggestion.action === 'SELL' ? 'bg-[#ff6b6b]' : 'bg-[#00dbe7]'}`}
                      style={{ width: `${(suggestion.confidence ?? 0) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#849495] whitespace-nowrap">
                    {((suggestion.confidence ?? 0) * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-[9px] font-mono text-[#849495]">
                  {suggestion.target_price && <span>Target: <span className="text-[#00e476]">₹{suggestion.target_price.toFixed(2)}</span></span>}
                  {suggestion.stop_loss && <span>Stop: <span className="text-[#ff6b6b]">₹{suggestion.stop_loss.toFixed(2)}</span></span>}
                  {suggestion.risk_reward_ratio && <span>R/R: <span className="text-[#74f5ff]">{suggestion.risk_reward_ratio.toFixed(2)}</span></span>}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-4 z-10">
            <button
              onClick={() => setSelectedAction('BUY')}
              className="flex-1 bg-[#00dbe7] text-[#002022] font-mono text-xs py-3 rounded font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_12px_rgba(0,219,231,0.5)] transition-all cursor-pointer"
            >
              BUY {quote?.symbol?.replace('.NS', '') ?? symbol}
            </button>
            <button
              onClick={() => setSelectedAction('SELL')}
              className="flex-1 border border-[#3a494b] text-[#e5e1e4] font-mono text-xs py-3 rounded uppercase tracking-wider hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              SELL {quote?.symbol?.replace('.NS', '') ?? symbol}
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          {/* Volume */}
          <div className="glass-panel rounded-lg p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-[#849495] tracking-widest mb-1.5">Volume</span>
            <span className="font-mono text-sm text-[#e5e1e4] font-semibold">
              {quote?.volume != null ? (quote.volume > 1e6 ? `${(quote.volume / 1e6).toFixed(1)}M` : quote.volume.toLocaleString()) : '—'}
            </span>
          </div>
          {/* Day range */}
          <div className="glass-panel rounded-lg p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-[#849495] tracking-widest mb-1.5">Day Range</span>
            <span className="font-mono text-xs text-[#e5e1e4] font-semibold">
              {quote?.low != null ? `₹${quote.low.toFixed(1)}` : '—'} – {quote?.high != null ? `₹${quote.high.toFixed(1)}` : '—'}
            </span>
          </div>
          {/* RSI */}
          <div className="glass-panel rounded-lg p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-[#849495] tracking-widest mb-1.5">RSI (14)</span>
            <span className={`font-mono text-sm font-semibold ${rsiColor}`}>
              {analysis?.rsi != null ? analysis.rsi.toFixed(1) : '—'} <span className="text-[9px]">{rsiLabel}</span>
            </span>
          </div>
          {/* Market status */}
          <div className="glass-panel rounded-lg p-4 flex flex-col justify-center border-b-2 border-[#00e476]">
            <span className="font-mono text-[10px] uppercase text-[#849495] tracking-widest mb-1.5">ADX</span>
            <span className="font-mono text-xs text-[#00e476] font-semibold">
              {analysis?.adx != null ? `${analysis.adx.toFixed(1)} (${analysis.adx > 25 ? 'Trending' : 'Ranging'})` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Technical Indicators Row ────────────────────────────────────── */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-panel rounded-lg p-4 space-y-1">
            <span className="font-mono text-[10px] text-[#849495] uppercase tracking-widest">MACD</span>
            <div className="text-xs font-mono">
              <span className={analysis.macd != null && analysis.macd_signal != null && analysis.macd > analysis.macd_signal ? 'text-[#00e476]' : 'text-[#ff6b6b]'}>
                {analysis.macd?.toFixed(3) ?? '—'}
              </span>
              <span className="text-[#849495]"> / {analysis.macd_signal?.toFixed(3) ?? '—'}</span>
            </div>
            <div className="text-[9px] font-mono text-[#849495]">
              {analysis.macd != null && analysis.macd_signal != null
                ? analysis.macd > analysis.macd_signal ? '▲ Bullish crossover' : '▼ Bearish crossover'
                : 'No data'}
            </div>
          </div>
          <div className="glass-panel rounded-lg p-4 space-y-1">
            <span className="font-mono text-[10px] text-[#849495] uppercase tracking-widest">Bollinger Bands</span>
            <div className="text-xs font-mono text-[#74f5ff]">{analysis.bb_upper?.toFixed(1) ?? '—'}</div>
            <div className="text-[9px] font-mono text-[#849495]">
              Mid: {analysis.bb_middle?.toFixed(1) ?? '—'} | Low: {analysis.bb_lower?.toFixed(1) ?? '—'}
            </div>
          </div>
          <div className="glass-panel rounded-lg p-4 space-y-1">
            <span className="font-mono text-[10px] text-[#849495] uppercase tracking-widest">EMA Trend</span>
            <div className="text-xs font-mono">
              <span className={analysis.ema_20 != null && analysis.ema_50 != null && analysis.ema_20 > analysis.ema_50 ? 'text-[#00e476]' : 'text-[#ff6b6b]'}>
                EMA20: {analysis.ema_20?.toFixed(1) ?? '—'}
              </span>
            </div>
            <div className="text-[9px] font-mono text-[#849495]">EMA50: {analysis.ema_50?.toFixed(1) ?? '—'}</div>
          </div>
          <div className="glass-panel rounded-lg p-4 space-y-1">
            <span className="font-mono text-[10px] text-[#849495] uppercase tracking-widest">ATR (Volatility)</span>
            <div className="text-xs font-mono text-[#74f5ff]">{analysis.atr?.toFixed(2) ?? '—'}</div>
            <div className="text-[9px] font-mono text-[#849495]">
              {analysis.atr != null && quote?.current_price
                ? `${((analysis.atr / quote.current_price) * 100).toFixed(2)}% of price`
                : 'Avg True Range'}
            </div>
          </div>
        </div>
      )}

      {/* ── Order Drawer ────────────────────────────────────────────────── */}
      {selectedAction && (
        <div className="glass-panel rounded-lg p-5 border border-[#00dbe7]/40 bg-[#131315] animate-fade-in">
          <div className="flex justify-between items-center border-b border-[#3a494b]/20 pb-3 mb-4">
            <h4 className="font-sans font-bold text-sm text-[#74f5ff] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00dbe7] text-base select-none">bolt</span>
              Order Terminal — {selectedAction} {quote?.symbol?.replace('.NS', '') ?? symbol}
            </h4>
            <button onClick={() => setSelectedAction(null)} className="text-[#b9cacb] hover:text-white rounded-full p-0.5 cursor-pointer flex">
              <span className="material-symbols-outlined text-sm select-none">close</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="bg-[#0e0e10]/80 p-3 rounded border border-[#3a494b]/30">
              <span className="block font-mono text-[10px] text-[#849495] uppercase">Market Price</span>
              <span className="font-mono text-sm text-[#e5e1e4] font-bold block mt-1">₹{quote?.current_price?.toFixed(2) ?? '—'}</span>
            </div>
            <div className="bg-[#0e0e10]/80 p-3 rounded border border-[#3a494b]/30">
              <span className="block font-mono text-[10px] text-[#849495] uppercase">Available Cash</span>
              <span className="font-mono text-sm text-[#74f5ff] font-bold block mt-1">₹{portfolio.cash?.toFixed(2)}</span>
            </div>
            <div className="bg-[#0e0e10]/80 p-3 rounded border border-[#3a494b]/30">
              <span className="block font-mono text-[10px] text-[#849495] uppercase">Positions</span>
              <span className="font-mono text-sm text-[#e2ffe3] font-bold block mt-1">{portfolio.shares} shares @ ₹{portfolio.buyPrice}</span>
            </div>
            <div className="flex gap-2">
              <div className="bg-[#0e0e10]/80 p-3 rounded border border-[#3a494b]/30 flex-grow flex flex-col justify-center">
                <span className="block font-mono text-[9px] text-[#849495] uppercase leading-none">QTY</span>
                <input
                  type="number" min="1" max="10000"
                  value={actionQuantity}
                  onChange={e => setActionQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-transparent border-none focus:outline-none text-sm font-mono text-white p-0 mt-1 block w-full"
                />
              </div>
              <button
                onClick={() => executeTrade(selectedAction)}
                className={`px-6 rounded font-mono text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  selectedAction === 'BUY'
                    ? 'bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff]'
                    : 'bg-[#ff6b6b] text-white hover:bg-[#ff8888]'
                }`}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Price Chart ─────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg flex-1 min-h-[320px] flex flex-col p-1">
        <div className="flex justify-between items-center p-3 border-b border-[#3a494b]/10 bg-[#1c1b1d]/40">
          <div className="flex gap-1">
            {(['1D', '1W', '1M', '1Y'] as const).map(p => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                  activePeriod === p
                    ? 'bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/30'
                    : 'bg-[#201f21] text-[#b9cacb] hover:text-[#e5e1e4]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="font-mono text-[9px] text-[#849495]">
            {candles.length > 0 ? `${candles.length} candles` : 'Loading chart...'}
          </span>
        </div>

        <div className="flex-grow relative chart-grid m-2 rounded overflow-hidden bg-[#131315]/40 flex min-h-[200px]">
          {closes.length > 1 ? (
            <>
              <div className="flex-grow h-full relative z-0 pr-14 pb-6">
                <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="neonGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? '#00dbe7' : '#ff6b6b'} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={isPositive ? '#00dbe7' : '#ff6b6b'} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <polygon fill="url(#neonGradient)" points={polygonStr} />
                  <polyline
                    fill="none" points={polylineStr}
                    stroke={isPositive ? '#00dbe7' : '#ff6b6b'}
                    strokeWidth="2"
                    className="drop-shadow-[0_0_6px_rgba(0,219,231,0.8)]"
                  />
                  {coords.length > 0 && (
                    <circle
                      cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y}
                      r="4" fill="#ffffff" stroke={isPositive ? '#00dbe7' : '#ff6b6b'} strokeWidth="2"
                      className="drop-shadow-[0_0_8px_rgba(0,219,231,1)]"
                    />
                  )}
                  {coords.length > 0 && (
                    <line
                      opacity="0.25" stroke={isPositive ? '#00dbe7' : '#ff6b6b'}
                      strokeDasharray="4 4" strokeWidth="1"
                      x1="0" x2={svgWidth}
                      y1={coords[coords.length - 1].y} y2={coords[coords.length - 1].y}
                    />
                  )}
                </svg>
              </div>
              {/* Y axis */}
              <div className="absolute right-0 top-0 bottom-6 w-14 flex flex-col justify-between py-4 text-[9px] font-mono text-[#849495] bg-[#131315]/90 backdrop-blur pl-2 border-l border-[#3a494b]/20 z-10 select-none">
                <span>₹{maxClose.toFixed(0)}</span>
                <span>₹{((maxClose + minClose) / 2).toFixed(0)}</span>
                <span>₹{minClose.toFixed(0)}</span>
              </div>
              {/* X axis */}
              <div className="absolute bottom-0 left-0 right-14 h-6 flex justify-between px-4 text-[9px] font-mono text-[#849495] bg-[#131315]/90 backdrop-blur items-center border-t border-[#3a494b]/20 z-10 select-none">
                {candles.length > 0 && [0, Math.floor(candles.length * 0.25), Math.floor(candles.length * 0.5), Math.floor(candles.length * 0.75), candles.length - 1].map(i => (
                  <span key={i}>{candles[i]?.time?.slice(0, 10) ?? ''}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-[#849495] text-xs font-mono">
              {loading ? 'Fetching chart data from NSE...' : 'No chart data available'}
            </div>
          )}
        </div>
      </div>

      {/* ── Terminal ─────────────────────────────────────────────────────── */}
      <div className="h-44 border border-[#3a494b]/20 bg-[#0e0e10]/90 rounded-lg flex flex-col overflow-hidden">
        <div className="flex items-center px-4 py-1.5 border-b border-[#3a494b]/10 bg-[#201f21]/80 select-none">
          <span className="font-mono text-[9px] font-bold text-[#b9cacb] uppercase tracking-widest leading-none">TERMINAL</span>
          <div className="flex gap-4 ml-6 font-mono text-[10px]">
            {(['AGENT_LOGS', 'OUTPUT', 'DEBUG_CONSOLE'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-0.5 cursor-pointer transition-all ${activeTab === tab ? 'text-[#74f5ff] border-b border-[#00dbe7]' : 'text-[#849495] hover:text-[#e5e1e4]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-3 font-mono text-xs overflow-y-auto custom-scrollbar bg-[#050505]">
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
                    <span className="text-[#849495]">[{log.timestamp}]</span>
                    <span>{log.message}</span>
                  </div>
                );
              })}
              <div className="text-[#b9cacb]/80 flex gap-2">
                <span className="text-[#849495]">[{new Date().toLocaleTimeString()}]</span>
                <span className="animate-pulse">_</span>
              </div>
              <div ref={terminalEndRef} />
            </div>
          )}

          {activeTab === 'OUTPUT' && (
            <div className="text-[#849495] space-y-0.5">
              <div>&gt; SutharLabs Stock Analyzer v1.0 connected</div>
              <div>&gt; Data source: Yahoo Finance (NSE/BSE)</div>
              <div>&gt; Indicators: RSI, MACD, Bollinger, EMA, ADX, ATR</div>
              <div>&gt; Signal engine: TradingSuggestions v1.0 active</div>
              <div>&gt; Polling interval: 30s quote refresh</div>
              <div className="text-[#00e476]">Status: Stock API bridge running on port 5001</div>
              <div ref={terminalEndRef} />
            </div>
          )}

          {activeTab === 'DEBUG_CONSOLE' && (
            <div className="text-[#74f5ff] space-y-0.5">
              {suggestion?.reasoning?.map((r, i) => (
                <div key={i}>[SIGNAL] {r}</div>
              )) ?? <div>[SIGNAL] No analysis loaded</div>}
              {analysis && <div>[INDICATORS] RSI={analysis.rsi?.toFixed(1)} | MACD={analysis.macd?.toFixed(3)} | ADX={analysis.adx?.toFixed(1)}</div>}
              {quote && <div>[QUOTE] Open={quote.open?.toFixed(2)} High={quote.high?.toFixed(2)} Low={quote.low?.toFixed(2)}</div>}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
