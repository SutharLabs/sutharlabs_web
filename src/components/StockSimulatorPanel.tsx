import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Shield,
  Layers,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Briefcase,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Zap,
  Sliders,
  Scale,
  Receipt,
  Globe
} from 'lucide-react';
import { IStrategy } from '../plugins/StockTracker/strategies/types';
import { PRESET_STRATEGIES } from '../plugins/StockTracker/strategies/presets';
import {
  EODPosition,
  EODSimulationReport,
  EODSimulationOptions,
  EODPortfolioStore,
  EODTradeExecution
} from '../plugins/StockTracker/simulator/types';

export interface StockSimulatorPanelProps {
  strategies: IStrategy[];
  activeStrategyId: string;
  activeMarketKey?: string;
  currencySymbol?: string;
  currencyCode?: string;
  userEmail?: string;
  onSelectSymbol: (symbol: string) => void;
  isDark?: boolean;
}

const STOCK_API = '/api/workspace/stock-analyzer';

export default function StockSimulatorPanel({
  strategies,
  activeStrategyId,
  activeMarketKey = 'IN',
  currencySymbol,
  currencyCode,
  userEmail,
  onSelectSymbol,
  isDark = true
}: StockSimulatorPanelProps) {
  // Target Market State (IN = India ₹, US = United States $, EU = Europe €)
  const [selectedMarket, setSelectedMarket] = useState<string>(activeMarketKey || 'IN');

  useEffect(() => {
    if (activeMarketKey) {
      setSelectedMarket(activeMarketKey);
    }
  }, [activeMarketKey]);

  const effectiveMarket = selectedMarket || activeMarketKey || 'IN';
  const currencySign = currencySymbol || (effectiveMarket === 'IN' ? '₹' : effectiveMarket === 'EU' ? '€' : '$');

  /**
   * Deterministic per-asset currency symbol resolver.
   * Ensures US stocks (AAPL, MSFT, TSLA, NVDA) ALWAYS display '$' regardless of the active market setting.
   */
  const getAssetCurrencySymbol = useCallback((symbol?: string, market?: string, explicitSymbol?: string) => {
    if (explicitSymbol) return explicitSymbol;
    if (!symbol) return currencySign;
    const s = symbol.toUpperCase().trim();
    if (s.endsWith('.NS') || s.endsWith('.BO') || market === 'IN') {
      return '₹';
    }
    if (s.endsWith('.L') || s.endsWith('.DE') || s.endsWith('.PA') || market === 'EU') {
      return '€';
    }
    // US or Global default tickers
    return '$';
  }, [currencySign]);

  // Strategy & Simulation Config
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(activeStrategyId || 'strat-ema-cross');
  const [allocationPct, setAllocationPct] = useState<number>(0.20);
  const [trailingStopPct, setTrailingStopPct] = useState<number>(3.0);
  const [enableTrailingStop, setEnableTrailingStop] = useState<boolean>(true);

  // Complete Catalog of Strategies (Presets + Custom + Community)
  const [allStrategies, setAllStrategies] = useState<IStrategy[]>(() => {
    const map = new Map<string, IStrategy>();
    PRESET_STRATEGIES.forEach(s => map.set(s.id, s));
    try {
      const rawCustom = localStorage.getItem('sutharlabs_custom_strategies');
      if (rawCustom) {
        const parsed = JSON.parse(rawCustom);
        if (Array.isArray(parsed)) parsed.forEach((s: IStrategy) => map.set(s.id, s));
      }
    } catch {}
    if (strategies && strategies.length > 0) strategies.forEach(s => map.set(s.id, s));
    return Array.from(map.values());
  });

  useEffect(() => {
    const loadFullStrategies = async () => {
      try {
        const res = await fetch(`${STOCK_API}/strategies`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const map = new Map<string, IStrategy>();
            PRESET_STRATEGIES.forEach(s => map.set(s.id, s));
            data.forEach(s => map.set(s.id, s));
            try {
              const rawCustom = localStorage.getItem('sutharlabs_custom_strategies');
              if (rawCustom) {
                const parsed = JSON.parse(rawCustom);
                if (Array.isArray(parsed)) parsed.forEach((s: IStrategy) => map.set(s.id, s));
              }
            } catch {}
            if (strategies) strategies.forEach(s => map.set(s.id, s));
            setAllStrategies(Array.from(map.values()));
            return;
          }
        }
      } catch (e) {
        console.warn('[Simulator] Error fetching strategies list:', e);
      }
      if (strategies && strategies.length > 0) {
        const map = new Map<string, IStrategy>();
        PRESET_STRATEGIES.forEach(s => map.set(s.id, s));
        try {
          const rawCustom = localStorage.getItem('sutharlabs_custom_strategies');
          if (rawCustom) {
            const parsed = JSON.parse(rawCustom);
            if (Array.isArray(parsed)) parsed.forEach((s: IStrategy) => map.set(s.id, s));
          }
        } catch {}
        strategies.forEach(s => map.set(s.id, s));
        setAllStrategies(Array.from(map.values()));
      }
    };
    loadFullStrategies();
  }, [strategies]);

  // Live Portfolio & History State
  const [portfolio, setPortfolio] = useState<EODPortfolioStore | null>(null);
  const [historyRuns, setHistoryRuns] = useState<EODSimulationReport[]>([]);
  const [latestReport, setLatestReport] = useState<EODSimulationReport | null>(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState<boolean>(false);
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);
  const [isResettingSim, setIsResettingSim] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  // Fetch Current Portfolio & Simulation History
  const fetchPortfolioAndHistory = useCallback(async () => {
    setIsLoadingPortfolio(true);
    try {
      const emailQuery = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
      const [portRes, histRes] = await Promise.all([
        fetch(`${STOCK_API}/simulator/portfolio${emailQuery}`).catch(() => null),
        fetch(`${STOCK_API}/simulator/history${emailQuery}`).catch(() => null)
      ]);

      const resetAtStr = typeof window !== 'undefined' ? localStorage.getItem('sutharlabs_simulator_reset_at') : null;
      const resetAt = resetAtStr ? parseInt(resetAtStr, 10) : 0;

      if (portRes && portRes.ok) {
        const portData = await portRes.json();
        // If a reset occurred and positions were opened before resetAt, sanitize them
        if (resetAt && Array.isArray(portData.positions)) {
          const validPositions = portData.positions.filter((p: any) => {
            const entryTs = p.entryDate ? new Date(p.entryDate).getTime() : 0;
            return entryTs >= resetAt;
          });
          portData.positions = validPositions;
        }
        setPortfolio(portData);
      }

      if (histRes && histRes.ok) {
        const histData = await histRes.json();
        if (Array.isArray(histData)) {
          const validRuns = resetAt
            ? histData.filter((r: any) => new Date(r.executionTimestamp || 0).getTime() >= resetAt)
            : histData;
          setHistoryRuns(validRuns);
          if (validRuns.length > 0) {
            setLatestReport(prev => {
              if (prev && validRuns.some(r => r.id === prev.id)) return prev;
              return validRuns[0];
            });
            setExpandedRunId(prev => {
              if (prev && validRuns.some(r => r.id === prev)) return prev;
              return validRuns[0].id;
            });
          } else {
            setLatestReport(null);
            setExpandedRunId(null);
          }
        }
      }
    } catch (err: any) {
      console.warn('[Trade Simulator] Error loading portfolio/history:', err);
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchPortfolioAndHistory();
  }, [fetchPortfolioAndHistory]);

  // Execute Trade Simulation Run
  const handleRunSimulation = async () => {
    setIsRunningSim(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        strategyId: selectedStrategyId,
        capitalAllocationPct: allocationPct,
        trailingStopPct: enableTrailingStop ? trailingStopPct : undefined,
        market: effectiveMarket,
        marketRegion: effectiveMarket,
        userEmail
      };

      const res = await fetch(`${STOCK_API}/simulator/run-eod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Simulation failed with status ${res.status}`);
      }

      const report: EODSimulationReport = await res.json();
      setLatestReport(report);
      setExpandedRunId(report.id);
      await fetchPortfolioAndHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to execute trade simulation.');
    } finally {
      setIsRunningSim(false);
    }
  };

  // Reset Trade Simulator Portfolio & History with resilient multi-endpoint fallback
  const handleResetSimulator = async () => {
    setIsResettingSim(true);
    setErrorMessage(null);
    let resetSucceeded = false;
    let newPortfolioState: any = null;

    const endpoints = [
      `${STOCK_API}/simulator/reset`,
      '/api/workspace/stock-analyzer/simulator/reset',
      '/api/plugins/wp_stock_analyzer/simulator/reset',
      '/api/simulator/reset'
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initialCapital: 100000,
            marketRegion: effectiveMarket
          })
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          newPortfolioState = data.portfolio;
          resetSucceeded = true;
          break;
        }
      } catch (err) {
        console.warn(`[Trade Simulator] Reset failed on ${url}:`, err);
      }
    }

    // Try GET fallback if POST had proxy rewrite issue
    if (!resetSucceeded) {
      for (const url of endpoints) {
        try {
          const res = await fetch(`${url}?initialCapital=100000&marketRegion=${encodeURIComponent(effectiveMarket)}`, {
            method: 'GET'
          });
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            newPortfolioState = data.portfolio;
            resetSucceeded = true;
            break;
          }
        } catch (err) {
          console.warn(`[Trade Simulator] Reset GET failed on ${url}:`, err);
        }
      }
    }

    // Mark reset timestamp in localStorage so stale history and trades are permanently fenced
    const nowTs = Date.now();
    try {
      localStorage.setItem('sutharlabs_simulator_reset_at', String(nowTs));
    } catch {}

    // Fresh reset state
    const defaultReset = {
      cash: 100000,
      initialCash: 100000,
      positions: [],
      totalRealizedPnL: 0,
      totalFrictionPaid: 0,
      winCount: 0,
      lossCount: 0,
      lastUpdated: new Date().toISOString()
    };

    setPortfolio(newPortfolioState || defaultReset);
    setLatestReport(null);
    setHistoryRuns([]);
    setShowResetConfirm(false);
    setIsResettingSim(false);
  };

  // Compute Live Portfolio Financial Metrics
  const portfolioMetrics = useMemo(() => {
    const cash = portfolio?.cash ?? 100000;
    const initialCash = portfolio?.initialCash ?? 100000;
    const positions = portfolio?.positions ?? [];

    let positionsValue = 0;
    let totalUnrealizedPnL = 0;

    positions.forEach(p => {
      const val = p.shares * p.currentPrice;
      positionsValue += val;
      totalUnrealizedPnL += p.unrealizedPnL;
    });

    const totalEquity = cash + positionsValue;
    const totalReturnDollars = totalEquity - initialCash;
    const totalReturnPct = initialCash > 0 ? (totalReturnDollars / initialCash) * 100 : 0;

    return {
      cash,
      positionsValue,
      totalEquity,
      totalReturnDollars,
      totalReturnPct,
      totalUnrealizedPnL,
      openPositionsCount: positions.length,
      realizedPnL: portfolio?.totalRealizedPnL ?? 0
    };
  }, [portfolio]);

  const selectedStrategy = useMemo(() => {
    return allStrategies.find(s => s.id === selectedStrategyId) || allStrategies[0];
  }, [allStrategies, selectedStrategyId]);

  return (
    <div className="flex flex-col gap-6 text-xs font-mono">
      {/* ── Control Header & Virtual Account Status ── */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline/20 flex flex-col gap-4 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#00e476]/15 text-[#00e476] border border-[#00e476]/30">
                <Briefcase className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-on-surface font-sans flex items-center gap-2">
                  Automated Trade Simulator
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00e476]/20 text-[#00e476] font-mono font-bold">
                    Stage 6 Production
                  </span>
                </h2>
                <p className="text-xs text-on-surface-variant font-sans mt-0.5">
                  Simulate algorithmic trade triggers, auto-manage SL/TP & trailing stops, with realistic transaction fees.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Reset & Run */}
          <div className="flex items-center gap-2.5 self-stretch md:self-auto flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowResetConfirm(true);
              }}
              disabled={isRunningSim || isResettingSim}
              className="px-4 py-2.5 bg-surface-container-high hover:bg-rose-500/20 text-on-surface hover:text-rose-400 border border-outline/30 rounded-xl font-bold cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50 text-xs"
              title="Reset virtual portfolio cash, open positions, and trade history"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResettingSim ? 'animate-spin' : ''}`} />
              <span>{isResettingSim ? 'Resetting...' : 'Reset Simulator'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRunSimulation();
              }}
              disabled={isRunningSim || isResettingSim}
              className="px-6 py-2.5 bg-[#00e476] text-[#002022] font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap justify-center text-xs"
            >
              <Play className={`w-4 h-4 fill-current ${isRunningSim ? 'animate-pulse' : ''}`} />
              <span>{isRunningSim ? 'Running Trade Simulation...' : 'Run Trade Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Reset Confirmation Banner */}
        {showResetConfirm && (
          <div className="p-3.5 rounded-xl bg-surface-container-high border border-outline/30 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-on-surface">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs">
                Reset Trade Simulator to initial capital ({currencySign}100,000) and clear all open positions & history?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1 rounded-lg bg-surface-container border border-outline/20 text-on-surface-variant hover:text-on-surface cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleResetSimulator();
                }}
                disabled={isResettingSim}
                className="px-3.5 py-1 rounded-lg bg-rose-500 text-white font-bold hover:brightness-110 cursor-pointer text-xs flex items-center gap-1.5"
              >
                {isResettingSim ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        )}

        {/* Configuration Options Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-outline/10">
          {/* Target Market Universe Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#00e476]" />
              Simulation Market ({effectiveMarket})
            </label>
            <select
              value={selectedMarket}
              onChange={e => setSelectedMarket(e.target.value)}
              disabled={isRunningSim}
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00e476]"
            >
              <option value="IN">🇮🇳 India (NSE/BSE - ₹ INR)</option>
              <option value="US">🇺🇸 United States (NYSE/NASDAQ - $ USD)</option>
              <option value="EU">🇪🇺 Europe (LSE/DAX - € EUR)</option>
            </select>
          </div>

          {/* Strategy Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#00dbe7]" />
              Simulation Strategy ({allStrategies.length} Available)
            </label>
            <select
              value={selectedStrategyId}
              onChange={e => setSelectedStrategyId(e.target.value)}
              disabled={isRunningSim}
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00e476]"
            >
              {allStrategies.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.market || 'GLOBAL'})
                </option>
              ))}
            </select>
          </div>

          {/* Position Sizing / Allocation Slider */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Scale className="w-3 h-3 text-[#00e476]" />
                Max Capital Per Trade
              </span>
              <span className="text-[#00e476] font-bold">{(allocationPct * 100).toFixed(0)}% of Cash</span>
            </label>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.05"
              value={allocationPct}
              onChange={e => setAllocationPct(parseFloat(e.target.value))}
              disabled={isRunningSim}
              className="w-full accent-[#00e476] cursor-pointer mt-2"
            />
          </div>

          {/* Trailing Stop Feature */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#00dbe7]" />
                Trailing Stop Protection
              </label>
              <input
                type="checkbox"
                checked={enableTrailingStop}
                onChange={e => setEnableTrailingStop(e.target.checked)}
                className="accent-[#00e476] cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1.0"
                max="10.0"
                step="0.5"
                disabled={!enableTrailingStop || isRunningSim}
                value={trailingStopPct}
                onChange={e => setTrailingStopPct(parseFloat(e.target.value) || 3.0)}
                className="w-24 bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-1.5 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00e476] disabled:opacity-50"
              />
              <span className="text-[11px] text-on-surface-variant font-sans">
                % below highest recorded peak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Simulation Error: </span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={handleRunSimulation}
            className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Virtual Paper Portfolio Status Banner ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Equity */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/20 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Total Portfolio Equity</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-on-surface">
              {currencySign}{portfolioMetrics.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${portfolioMetrics.totalReturnPct >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
            {portfolioMetrics.totalReturnPct >= 0 ? '+' : ''}{portfolioMetrics.totalReturnPct.toFixed(2)}% Overall Return
          </div>
        </div>

        {/* Available Cash */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/20 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Available Cash</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-[#00dbe7]">
              {currencySign}{portfolioMetrics.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1">
            Allocated: {currencySign}{portfolioMetrics.positionsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Realized PnL */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/20 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Realized PnL (Closed)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold font-mono ${portfolioMetrics.realizedPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
              {portfolioMetrics.realizedPnL >= 0 ? '+' : ''}{currencySign}{portfolioMetrics.realizedPnL.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1">
            Banked closed trade profits
          </span>
        </div>

        {/* Open Positions Count & Floating PnL */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/20 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Active Open Positions</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-on-surface">
              {portfolioMetrics.openPositionsCount}
            </span>
            <span className={`text-xs font-bold ${portfolioMetrics.totalUnrealizedPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
              ({portfolioMetrics.totalUnrealizedPnL >= 0 ? '+' : ''}{currencySign}{portfolioMetrics.totalUnrealizedPnL.toFixed(2)} float)
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1">
            Last run: {portfolio?.lastRunDate || 'Pending'}
          </span>
        </div>
      </div>

      {/* ── Latest Simulation Digest Banner (If available) ── */}
      {latestReport && (
        <div className="p-4 rounded-2xl bg-surface-container-low border border-[#00e476]/30 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00e476]" />
              <span className="font-bold text-on-surface text-xs font-sans">
                Simulation Run Completed: {latestReport.simulatedDate} ({latestReport.strategyName})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${latestReport.netDailyPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
                Daily PnL: {latestReport.netDailyPnL >= 0 ? '+' : ''}{currencySign}{latestReport.netDailyPnL.toFixed(2)} ({latestReport.netDailyPnLPct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant font-sans leading-relaxed">
            {latestReport.digest}
          </p>
        </div>
      )}

      {/* ── Open Positions Table ── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline/20 overflow-hidden shadow-md flex flex-col">
        <div className="p-4 border-b border-outline/10 flex justify-between items-center">
          <h3 className="font-bold text-on-surface text-sm font-sans flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#00e476]" />
            Active Open Positions ({portfolio?.positions?.length || 0})
          </h3>
          <span className="text-[10px] text-on-surface-variant">
            Evaluated on daily close candles against Stop Loss and Take Profit
          </span>
        </div>

        {(!portfolio?.positions || portfolio.positions.length === 0) ? (
          <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
            <Briefcase className="w-8 h-8 opacity-40 text-[#00e476]" />
            <p className="font-sans">No open positions currently in virtual simulator portfolio.</p>
            <p className="text-xs">
              Click &quot;Run Trade Simulation&quot; above to scan your selected market assets for new entry signals.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/80 text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline/10">
                  <th className="py-3 px-4 font-bold">Asset</th>
                  <th className="py-3 px-3 font-bold text-right">Shares</th>
                  <th className="py-3 px-3 font-bold text-right">Entry Price</th>
                  <th className="py-3 px-3 font-bold text-right">Current Price</th>
                  <th className="py-3 px-3 font-bold text-center">Stop Loss / Trailing</th>
                  <th className="py-3 px-3 font-bold text-center">Take Profit</th>
                  <th className="py-3 px-3 font-bold text-right">Floating PnL</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10 text-xs font-mono">
                {portfolio.positions.map(pos => {
                  const isProfit = pos.unrealizedPnL >= 0;
                  const posSign = getAssetCurrencySymbol(pos.symbol, (pos as any).market, (pos as any).currencySymbol);
                  return (
                    <tr
                      key={pos.id}
                      className="hover:bg-surface-container/50 transition-colors cursor-pointer"
                      onClick={() => onSelectSymbol(pos.symbol)}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSymbol(pos.symbol);
                          }}
                          className="font-bold text-on-surface hover:text-[#00e476] underline decoration-dotted text-left"
                        >
                          {pos.symbol}
                        </button>
                        <div className="text-[10px] text-on-surface-variant truncate max-w-[140px]">
                          {pos.name} • {pos.entryDate}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-on-surface">
                        {pos.shares}
                      </td>

                      <td className="py-3 px-3 text-right text-on-surface">
                        {posSign}{pos.entryPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-on-surface">
                        {posSign}{pos.currentPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold text-[10px]">
                          {posSign}{pos.stopLoss.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#00e476]/15 text-[#00e476] font-bold text-[10px]">
                          {posSign}{pos.takeProfit.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className={`font-bold ${isProfit ? 'text-[#00e476]' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{posSign}{pos.unrealizedPnL.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${isProfit ? 'text-[#00e476]' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{pos.unrealizedPnLPct.toFixed(2)}%
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectSymbol(pos.symbol)}
                          className="p-1.5 rounded-lg bg-surface-container hover:bg-[#00e476]/20 text-on-surface hover:text-[#00e476] transition-colors cursor-pointer"
                          title="Inspect Live Chart"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Historical Simulation Runs Ledger ── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline/20 overflow-hidden shadow-md flex flex-col">
        <div className="p-4 border-b border-outline/10 flex justify-between items-center">
          <h3 className="font-bold text-on-surface text-sm font-sans flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00dbe7]" />
            Simulation Execution Ledger ({historyRuns.length} Daily Sessions)
          </h3>
          <span className="text-[10px] text-on-surface-variant">
            Persistent audit record with friction and tax modeling
          </span>
        </div>

        {historyRuns.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">
            No historical simulation runs recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-outline/10">
            {historyRuns.map(run => {
              const isExpanded = expandedRunId === run.id;
              const isPositive = run.netDailyPnL >= 0;
              const runSign = ((run as any).market === 'US' || (run as any).marketRegion === 'US')
                ? '$'
                : ((run as any).market === 'EU' || (run as any).marketRegion === 'EU')
                ? '€'
                : currencySign;

              return (
                <div key={run.id} className="flex flex-col">
                  {/* Row Header */}
                  <div
                    onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                    className="p-4 flex items-center justify-between hover:bg-surface-container/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-on-surface-variant">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface text-xs">{run.simulatedDate}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                            {run.strategyName}
                          </span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5">
                          Open: {run.totalOpenPositions} positions • Closed: {run.closedPositions?.length || 0} • New Entries: {run.openedPositions?.length || 0}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-bold text-xs ${isPositive ? 'text-[#00e476]' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{runSign}{run.netDailyPnL.toFixed(2)} ({run.netDailyPnLPct.toFixed(2)}%)
                      </div>
                      <div className="text-[10px] text-on-surface-variant">
                        Cap: {runSign}{run.endingCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Run Execution Breakdown */}
                  {isExpanded && (
                    <div className="p-4 bg-surface-container-lowest/60 border-t border-outline/10 flex flex-col gap-3">
                      <p className="text-xs text-on-surface-variant font-sans">
                        {run.digest}
                      </p>

                      {/* Closed Trades in this run */}
                      {run.closedPositions && run.closedPositions.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                            Positions Closed / Realized:
                          </span>
                          <div className="space-y-1">
                            {run.closedPositions.map(t => {
                              const tradeSign = getAssetCurrencySymbol(t.symbol, undefined, (t as any).currencySymbol);
                              return (
                                <div
                                  key={t.id}
                                  className="p-2 rounded-lg bg-surface-container-low border border-outline/10 flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-bold text-on-surface">{t.symbol}</span>
                                    <span className="text-[10px] text-on-surface-variant ml-2">
                                      {t.shares} shares @ {tradeSign}{t.price} ({t.reason})
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-bold ${t.realizedPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
                                      {t.realizedPnL >= 0 ? '+' : ''}{tradeSign}{t.realizedPnL.toFixed(2)} ({t.realizedPnLPct.toFixed(2)}%)
                                    </span>
                                    <span className="text-[9px] text-on-surface-variant ml-2">
                                      Friction: {tradeSign}{t.friction.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Opened Trades in this run */}
                      {run.openedPositions && run.openedPositions.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                            New Positions Initiated:
                          </span>
                          <div className="space-y-1">
                            {run.openedPositions.map(t => {
                              const tradeSign = getAssetCurrencySymbol(t.symbol, undefined, (t as any).currencySymbol);
                              return (
                                <div
                                  key={t.id}
                                  className="p-2 rounded-lg bg-surface-container-low border border-outline/10 flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-bold text-[#00e476]">{t.symbol}</span>
                                    <span className="text-[10px] text-on-surface-variant ml-2">
                                      Bought {t.shares} shares @ {tradeSign}{t.price}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-on-surface-variant">
                                    {t.reason}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
