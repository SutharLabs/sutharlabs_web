import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Sliders,
  Send,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  BarChart2,
  ArrowUpRight,
  Shield,
  Layers,
  Activity,
  Globe,
  Bell,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  Search
} from 'lucide-react';
import { IStrategy } from '../plugins/StockTracker/strategies/types';
import { ScannerCandidate, ScannerReport } from '../plugins/StockTracker/scanner/types';

export interface StockScannerPanelProps {
  strategies: IStrategy[];
  activeStrategyId: string;
  activeUniverseKey: string;
  watchlistSymbols?: string[];
  onSelectSymbol: (symbol: string) => void;
  onOpenBacktest?: (symbol: string, strategyId: string) => void;
  isDark?: boolean;
}

const STOCK_API = '/api/workspace/stock-analyzer';

const UNIVERSE_OPTIONS = [
  { key: 'IN', label: 'India Equities (NSE/BSE)', flag: '🇮🇳' },
  { key: 'US', label: 'US Equities (NYSE/NASDAQ)', flag: '🇺🇸' },
  { key: 'EU', label: 'Europe (LSE/DAX/EURONEXT)', flag: '🇪🇺' },
  { key: 'ASIA', label: 'Asia (Nikkei/HKEX/SSE)', flag: '🇯🇵' },
  { key: 'WATCHLIST', label: 'Active Watchlist Assets', flag: '⭐' }
];

export default function StockScannerPanel({
  strategies,
  activeStrategyId,
  activeUniverseKey,
  watchlistSymbols = [],
  onSelectSymbol,
  onOpenBacktest,
  isDark = true
}: StockScannerPanelProps) {
  // Scanner Criteria State
  const [selectedUniverse, setSelectedUniverse] = useState<string>(activeUniverseKey || 'IN');
  const [selectedStrategy, setSelectedStrategy] = useState<string>(activeStrategyId || 'strat-ema-cross');
  const [minConfidence, setMinConfidence] = useState<number>(0.60);
  const [minVolumeSpike, setMinVolumeSpike] = useState<number>(1.0);
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'HIGH_CONVICTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize universe with active market whenever changed
  useEffect(() => {
    if (activeUniverseKey) {
      setSelectedUniverse(activeUniverseKey);
    }
  }, [activeUniverseKey]);

  // Execution & Results State
  const [report, setReport] = useState<ScannerReport | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'CONFIDENCE' | 'SPIKE' | 'CHANGE' | 'NAME'>('CONFIDENCE');

  // Webhook Alert Dispatch Modal State
  const [alertCandidate, setAlertCandidate] = useState<ScannerCandidate | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('sutharlabs_scanner_webhook_url') || '';
    } catch {
      return '';
    }
  });
  const [channelType, setChannelType] = useState<'DISCORD' | 'TELEGRAM' | 'GENERIC'>('DISCORD');
  const [isDispatchingAlert, setIsDispatchingAlert] = useState<boolean>(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertFail, setAlertFail] = useState<string | null>(null);

  // Trigger Market Scan
  const handleRunScan = useCallback(async () => {
    setIsScanning(true);
    setScanError(null);

    try {
      const payload: any = {
        strategyId: selectedStrategy,
        minConfidence,
        minVolumeSpike,
        signalFilter
      };

      if (selectedUniverse === 'WATCHLIST') {
        if (watchlistSymbols.length > 0) {
          payload.customSymbols = watchlistSymbols;
        } else {
          payload.universe = activeUniverseKey || 'IN';
          payload.universeKey = activeUniverseKey || 'IN';
          payload.market = activeUniverseKey || 'IN';
        }
      } else {
        payload.universe = selectedUniverse;
        payload.universeKey = selectedUniverse;
        payload.market = selectedUniverse;
      }

      const res = await fetch(`${STOCK_API}/scanner/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data: ScannerReport = await res.json();
      setReport(data);
    } catch (err: any) {
      setScanError(err.message || 'Market scanner failed to complete scan.');
    } finally {
      setIsScanning(false);
    }
  }, [selectedUniverse, selectedStrategy, minConfidence, minVolumeSpike, signalFilter, watchlistSymbols]);

  // Initial Auto-Scan on First Mount if no report exists
  useEffect(() => {
    if (!report && !isScanning) {
      handleRunScan();
    }
  }, []);

  // Filter & Sort Candidates
  const processedCandidates = useMemo(() => {
    if (!report?.results) return [];
    let list = [...report.results];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.cleanSymbol.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'CONFIDENCE') return b.confidence - a.confidence;
      if (sortBy === 'SPIKE') return b.volumeSpikeRatio - a.volumeSpikeRatio;
      if (sortBy === 'CHANGE') return b.changePercent24h - a.changePercent24h;
      if (sortBy === 'NAME') return a.symbol.localeCompare(b.symbol);
      return 0;
    });

    return list;
  }, [report, searchQuery, sortBy]);

  // Dispatch Webhook Alert Handler
  const handleDispatchWebhook = async () => {
    if (!alertCandidate || !webhookUrl.trim()) return;
    setIsDispatchingAlert(true);
    setAlertSuccess(null);
    setAlertFail(null);

    try {
      try {
        localStorage.setItem('sutharlabs_scanner_webhook_url', webhookUrl.trim());
      } catch {}

      const res = await fetch(`${STOCK_API}/scanner/alert-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          channel: channelType,
          candidate: alertCandidate
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertSuccess(`Alert sent to ${channelType} successfully!`);
        setTimeout(() => {
          setAlertSuccess(null);
          setAlertCandidate(null);
        }, 2500);
      } else {
        setAlertFail(data.error || 'Failed to dispatch webhook alert.');
      }
    } catch (err: any) {
      setAlertFail(err.message || 'Network error dispatching alert.');
    } finally {
      setIsDispatchingAlert(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-xs font-mono">
      {/* ── Control Header: Screener Config Bar ── */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline/20 flex flex-col gap-4 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                <Eye className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-on-surface font-sans flex items-center gap-2">
                  Autonomous Multi-Market Screener & Scanner Hub
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00dbe7]/20 text-[#00dbe7] font-mono font-bold">
                    Stage 6 Production
                  </span>
                </h2>
                <p className="text-xs text-on-surface-variant font-sans mt-0.5">
                  Scan global markets in parallel to find real-time breakout setups, volume surges, and algorithmic triggers.
                </p>
              </div>
            </div>
          </div>

          {/* Trigger Scan Button */}
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-6 py-2.5 bg-[#00dbe7] text-[#002022] font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap self-stretch md:self-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Universe...' : 'Scan Market Universe'}</span>
          </button>
        </div>

        {/* Filters and Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-outline/10">
          {/* 1. Market Universe Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#00dbe7]" />
              Market Universe
            </label>
            <select
              value={selectedUniverse}
              onChange={e => setSelectedUniverse(e.target.value)}
              disabled={isScanning}
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
            >
              {UNIVERSE_OPTIONS.map(u => (
                <option key={u.key} value={u.key}>
                  {u.flag} {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Strategy Engine Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#00e476]" />
              Algorithm Strategy
            </label>
            <select
              value={selectedStrategy}
              onChange={e => setSelectedStrategy(e.target.value)}
              disabled={isScanning}
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
            >
              {strategies.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.market})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Minimum Confidence Threshold */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#00dbe7]" />
                Min Confidence
              </span>
              <span className="text-[#00dbe7] font-bold">{(minConfidence * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.40"
              max="0.85"
              step="0.05"
              value={minConfidence}
              onChange={e => setMinConfidence(parseFloat(e.target.value))}
              disabled={isScanning}
              className="w-full accent-[#00dbe7] cursor-pointer mt-2"
            />
          </div>

          {/* 4. Minimum Volume Spike Ratio */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                Min Volume Spike
              </span>
              <span className="text-amber-400 font-bold">{minVolumeSpike}x</span>
            </label>
            <div className="flex gap-1.5 mt-1">
              {[1.0, 1.2, 1.5, 2.0].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setMinVolumeSpike(ratio)}
                  className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    minVolumeSpike === ratio
                      ? 'bg-amber-400/20 border-amber-400 text-amber-400'
                      : 'bg-surface-container-lowest border-outline/20 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {ratio === 1.0 ? 'All' : `≥${ratio}x`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Filter & Search Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Signal Filter Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-on-surface-variant mr-1">Signal:</span>
            {[
              { id: 'ALL', label: 'All Signals' },
              { id: 'BUY', label: 'Buy Only' },
              { id: 'SELL', label: 'Sell Only' },
              { id: 'HIGH_CONVICTION', label: 'Conviction ≥70%' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setSignalFilter(pill.id as any)}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                  signalFilter === pill.id
                    ? 'bg-[#00dbe7]/20 border border-[#00dbe7] text-[#00dbe7] font-bold'
                    : 'bg-surface-container-lowest border border-outline/20 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search Candidate Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter results..."
                className="pl-8 pr-3 py-1 bg-surface-container-lowest border border-outline/20 rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7] w-36 sm:w-44"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-surface-container-lowest border border-outline/20 rounded-lg px-2.5 py-1 text-[11px] font-mono text-on-surface focus:outline-none"
            >
              <option value="CONFIDENCE">Sort: Highest Confidence</option>
              <option value="SPIKE">Sort: Highest Volume Spike</option>
              <option value="CHANGE">Sort: 24h Gainers</option>
              <option value="NAME">Sort: Symbol Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Error Banner if any ── */}
      {scanError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Scan Execution Failed: </span>
            <span>{scanError}</span>
          </div>
          <button
            onClick={handleRunScan}
            className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Summary Metrics Strip ── */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline/20 flex flex-col justify-between">
            <span className="text-[10px] text-on-surface-variant uppercase font-mono">Universe Assets Scanned</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-on-surface">{report.summary.totalScanned}</span>
              <span className="text-[10px] text-on-surface-variant">in {report.executionTimeMs}ms</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-[#00e476]/30 flex flex-col justify-between">
            <span className="text-[10px] text-[#00e476] uppercase font-mono font-bold">Buy Opportunities</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-[#00e476]">{report.summary.buyCount}</span>
              <span className="text-[10px] text-on-surface-variant">assets</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-rose-500/30 flex flex-col justify-between">
            <span className="text-[10px] text-rose-400 uppercase font-mono font-bold">Sell / Bearish Setups</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-rose-400">{report.summary.sellCount}</span>
              <span className="text-[10px] text-on-surface-variant">assets</span>
            </div>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-[#00dbe7]/30 flex flex-col justify-between">
            <span className="text-[10px] text-[#00dbe7] uppercase font-mono font-bold">High Conviction (≥70%)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-[#00dbe7]">{report.summary.highConvictionCount}</span>
              <span className="text-[10px] text-on-surface-variant">prime setups</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-surface-container-low p-3.5 rounded-xl border border-outline/20 flex flex-col justify-between">
            <span className="text-[10px] text-on-surface-variant uppercase font-mono">Strategy Used</span>
            <div className="text-xs font-bold text-on-surface truncate mt-1" title={report.strategyName}>
              {report.strategyName}
            </div>
          </div>
        </div>
      )}

      {/* ── Top Pick Spotlight Banner (If Available) ── */}
      {report?.summary?.topPick && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00dbe7]/15 via-surface-container to-surface-container-low border border-[#00dbe7]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/40">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase px-2 py-0.5 rounded font-bold bg-[#00e476]/20 text-[#00e476]">
                  Top Algorithmic Pick
                </span>
                <span className="text-sm font-bold text-on-surface font-sans">
                  {report.summary.topPick.cleanSymbol}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {report.summary.topPick.name}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-sans mt-0.5">
                {report.summary.topPick.reason} • Spike: <span className="text-amber-400 font-bold">{report.summary.topPick.volumeSpikeRatio}x Vol</span> • Confidence: <span className="text-[#00e476] font-bold">{(report.summary.topPick.confidence * 100).toFixed(0)}%</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => onSelectSymbol(report.summary.topPick!.symbol)}
              className="px-3.5 py-1.5 rounded-xl bg-[#00dbe7] text-[#002022] font-bold hover:brightness-110 cursor-pointer flex items-center gap-1.5 shadow"
            >
              <span>Inspect Chart</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            {onOpenBacktest && (
              <button
                onClick={() => onOpenBacktest(report.summary.topPick!.symbol, selectedStrategy)}
                className="px-3.5 py-1.5 rounded-xl bg-surface-container-high border border-outline/30 text-on-surface hover:text-[#00dbe7] cursor-pointer flex items-center gap-1.5"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Backtest</span>
              </button>
            )}
            <button
              onClick={() => setAlertCandidate(report.summary.topPick!)}
              className="p-1.5 rounded-xl bg-surface-container-high border border-outline/30 text-on-surface-variant hover:text-[#00dbe7] cursor-pointer"
              title="Dispatch Webhook Alert"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Candidates Table / Grid View ── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline/20 overflow-hidden shadow-md flex flex-col">
        <div className="p-4 border-b border-outline/10 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-on-surface text-sm font-sans">
              Screened Assets ({processedCandidates.length} Matching Criteria)
            </h3>
          </div>
          <span className="text-[10px] text-on-surface-variant">
            Click any row or button to load live TradingView chart
          </span>
        </div>

        {processedCandidates.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Search className="w-8 h-8 opacity-40 text-[#00dbe7]" />
            <p className="text-sm font-sans">No assets matched the current screener filters.</p>
            <p className="text-xs max-w-md">
              Try lowering the minimum confidence threshold, reducing the volume spike ratio, or switching to a broader market universe.
            </p>
            <button
              onClick={() => {
                setMinConfidence(0.50);
                setMinVolumeSpike(1.0);
                setSignalFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-1.5 rounded-xl bg-surface-container-high border border-outline/30 text-[#00dbe7] font-bold hover:brightness-110 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/80 text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline/10">
                  <th className="py-3 px-4 font-bold">Asset / Exchange</th>
                  <th className="py-3 px-3 font-bold text-right">Price</th>
                  <th className="py-3 px-3 font-bold text-right">24h Change</th>
                  <th className="py-3 px-3 font-bold text-right">Vol & Surge</th>
                  <th className="py-3 px-3 font-bold text-center">Signal & Conviction</th>
                  <th className="py-3 px-3 font-bold text-center">Risk / Reward</th>
                  <th className="py-3 px-4 font-bold">Trigger Logic</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10 text-xs font-mono">
                {processedCandidates.map(cand => {
                  const isBuy = cand.signal === 'BUY';
                  const isSell = cand.signal === 'SELL';

                  return (
                    <tr
                      key={cand.symbol}
                      className="hover:bg-surface-container/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectSymbol(cand.symbol)}
                    >
                      {/* Asset & Exchange */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSymbol(cand.symbol);
                            }}
                            className="font-bold text-on-surface hover:text-[#00dbe7] text-left underline decoration-dotted"
                          >
                            {cand.cleanSymbol}
                          </button>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-bold">
                            {cand.exchange}
                          </span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant truncate max-w-[160px]" title={cand.name}>
                          {cand.name}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-bold text-on-surface">
                        {cand.currencySymbol}{cand.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3 px-3 text-right">
                        <div className={`font-bold flex items-center justify-end gap-0.5 ${cand.changePercent24h >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
                          {cand.changePercent24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{cand.changePercent24h >= 0 ? '+' : ''}{cand.changePercent24h.toFixed(2)}%</span>
                        </div>
                      </td>

                      {/* Volume & Surge Spike */}
                      <td className="py-3 px-3 text-right">
                        <div className="text-on-surface font-mono">
                          {cand.volume >= 1e6 ? `${(cand.volume / 1e6).toFixed(1)}M` : `${(cand.volume / 1e3).toFixed(0)}k`}
                        </div>
                        <div className="mt-0.5">
                          {cand.volumeSpikeRatio >= 1.5 ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-400/20 text-amber-400 inline-flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" />
                              {cand.volumeSpikeRatio}x
                            </span>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant">
                              {cand.volumeSpikeRatio}x avg
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Signal & Conviction */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isBuy ? 'bg-[#00e476]/20 text-[#00e476] border border-[#00e476]/30' :
                            isSell ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            {cand.signal}
                          </span>
                          <div className="w-16 bg-surface-container-highest rounded-full h-1 mt-1 overflow-hidden">
                            <div
                              className={`h-full ${isBuy ? 'bg-[#00e476]' : isSell ? 'bg-rose-500' : 'bg-gray-400'}`}
                              style={{ width: `${Math.round(cand.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-on-surface-variant mt-0.5">
                            {(cand.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      {/* Risk / Reward */}
                      <td className="py-3 px-3 text-center">
                        {cand.riskRewardRatio ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-1.5 py-0.5 rounded bg-[#00dbe7]/15 text-[#00dbe7] font-bold text-[10px]">
                              1:{cand.riskRewardRatio}
                            </span>
                            <span className="text-[9px] text-on-surface-variant mt-0.5">
                              TP: {cand.takeProfit ? `${cand.currencySymbol}${cand.takeProfit}` : '-'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant text-[10px]">-</span>
                        )}
                      </td>

                      {/* Trigger Logic / Reason */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-[11px] text-on-surface-variant font-sans line-clamp-2" title={cand.reason}>
                          {cand.reason}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectSymbol(cand.symbol)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-[#00dbe7]/20 text-on-surface hover:text-[#00dbe7] transition-colors cursor-pointer"
                            title="Load Chart"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {onOpenBacktest && (
                            <button
                              onClick={() => onOpenBacktest(cand.symbol, selectedStrategy)}
                              className="p-1.5 rounded-lg bg-surface-container hover:bg-[#00dbe7]/20 text-on-surface hover:text-[#00dbe7] transition-colors cursor-pointer"
                              title="Backtest Strategy"
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setAlertCandidate(cand)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-[#00dbe7]/20 text-on-surface hover:text-[#00dbe7] transition-colors cursor-pointer"
                            title="Send Webhook Notification"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Webhook Dispatcher Modal ── */}
      {alertCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-low border border-[#00dbe7]/30 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-on-surface font-sans flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#00dbe7]" />
                  Dispatch Webhook Alert
                </h3>
                <p className="text-xs text-on-surface-variant font-sans mt-0.5">
                  Send immediate algorithmic alert for {alertCandidate.cleanSymbol} to your team.
                </p>
              </div>
              <button
                onClick={() => setAlertCandidate(null)}
                className="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Channel Selector */}
            <div className="flex gap-2">
              {(['DISCORD', 'TELEGRAM', 'GENERIC'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => setChannelType(ch)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    channelType === ch
                      ? 'bg-[#00dbe7]/20 border-[#00dbe7] text-[#00dbe7]'
                      : 'bg-surface-container-lowest border-outline/20 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Webhook URL Input */}
            <div>
              <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                {channelType === 'DISCORD' ? 'Discord Webhook URL' : channelType === 'TELEGRAM' ? 'Telegram Bot Webhook / Endpoint' : 'Custom JSON Webhook Endpoint'}
              </label>
              <input
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder={channelType === 'DISCORD' ? 'https://discord.com/api/webhooks/...' : 'https://api.telegram.org/...'}
                className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7]"
              />
            </div>

            {/* Payload Preview */}
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline/10 text-[11px] font-mono flex flex-col gap-1">
              <span className="text-on-surface-variant text-[10px] uppercase font-bold">Signal Payload Summary:</span>
              <div className="flex justify-between">
                <span>Symbol:</span>
                <span className="font-bold text-on-surface">{alertCandidate.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Signal:</span>
                <span className={`font-bold ${alertCandidate.signal === 'BUY' ? 'text-[#00e476]' : 'text-rose-400'}`}>
                  {alertCandidate.signal} ({(alertCandidate.confidence * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Price:</span>
                <span className="text-on-surface font-bold">{alertCandidate.currencySymbol}{alertCandidate.currentPrice}</span>
              </div>
              {alertCandidate.takeProfit && (
                <div className="flex justify-between">
                  <span>Take Profit:</span>
                  <span className="text-[#00e476] font-bold">{alertCandidate.currencySymbol}{alertCandidate.takeProfit}</span>
                </div>
              )}
            </div>

            {alertSuccess && (
              <div className="p-2.5 rounded-lg bg-[#00e476]/15 text-[#00e476] text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{alertSuccess}</span>
              </div>
            )}

            {alertFail && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{alertFail}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAlertCandidate(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface hover:brightness-110 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchWebhook}
                disabled={isDispatchingAlert || !webhookUrl.trim()}
                className="px-5 py-2 rounded-xl bg-[#00dbe7] text-[#002022] font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDispatchingAlert ? 'Sending...' : 'Send Alert Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
