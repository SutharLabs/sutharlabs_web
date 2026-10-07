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
  Globe,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  History,
  BarChart3,
  PieChart,
  Check,
  FastForward
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

  // Simulation Replay Controls (Point 5: Historical Replay from an old date)
  const [simulationMode, setSimulationMode] = useState<'SINGLE_STEP' | 'HISTORICAL_REPLAY'>('SINGLE_STEP');
  const [replayPresetDays, setReplayPresetDays] = useState<number>(30);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // UI Active Sub-tab inside Simulator
  const [simulatorTab, setSimulatorTab] = useState<'POSITIONS' | 'CLOSED_TRADES' | 'LEDGER' | 'ANALYTICS'>('POSITIONS');

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
  const [closingPositionId, setClosingPositionId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  // Fetch Current Portfolio & Simulation History from server
  const fetchPortfolioAndHistory = useCallback(async () => {
    setIsLoadingPortfolio(true);
    try {
      const emailQuery = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
      const [portRes, histRes] = await Promise.all([
        fetch(`${STOCK_API}/simulator/portfolio${emailQuery}`).catch(() => null),
        fetch(`${STOCK_API}/simulator/history${emailQuery}`).catch(() => null)
      ]);

      if (portRes && portRes.ok) {
        const portData = await portRes.json();
        setPortfolio(portData);
      }

      if (histRes && histRes.ok) {
        const histData = await histRes.json();
        if (Array.isArray(histData)) {
          setHistoryRuns(histData);
          if (histData.length > 0) {
            setLatestReport(prev => {
              if (prev && histData.some(r => r.id === prev.id)) return prev;
              return histData[0];
            });
            setExpandedRunId(prev => {
              if (prev && histData.some(r => r.id === prev)) return prev;
              return histData[0].id;
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

  // Execute Trade Simulation Run (Single Step or Historical Replay)
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
        mode: simulationMode,
        startDate: simulationMode === 'HISTORICAL_REPLAY' ? customStartDate : undefined,
        endDate: simulationMode === 'HISTORICAL_REPLAY' ? customEndDate : undefined,
        replayDays: simulationMode === 'HISTORICAL_REPLAY' ? replayPresetDays : undefined,
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

  // Manual Market Position Close
  const handleClosePosition = async (positionId: string) => {
    setClosingPositionId(positionId);
    setErrorMessage(null);

    try {
      const res = await fetch(`${STOCK_API}/simulator/close-position`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to close position (${res.status})`);
      }

      const result = await res.json();
      if (result.portfolio) {
        setPortfolio(result.portfolio);
      } else {
        await fetchPortfolioAndHistory();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error closing open position.');
    } finally {
      setClosingPositionId(null);
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

    // Fresh reset state
    const defaultReset: EODPortfolioStore = {
      cash: 100000,
      initialCash: 100000,
      positions: [],
      closedTrades: [],
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
    const closedTrades = portfolio?.closedTrades ?? [];

    let positionsValue = 0;
    let totalUnrealizedPnL = 0;
    let totalCostBasis = 0;

    positions.forEach(p => {
      const val = p.shares * p.currentPrice;
      const cost = p.shares * p.entryPrice;
      positionsValue += val;
      totalCostBasis += cost;
      totalUnrealizedPnL += p.unrealizedPnL;
    });

    const totalEquity = cash + positionsValue;
    const totalReturn = totalEquity - initialCash;
    const totalReturnPct = initialCash > 0 ? (totalReturn / initialCash) * 100 : 0;
    const realizedPnL = portfolio?.totalRealizedPnL ?? 0;

    const totalClosedTradesCount = closedTrades.length;
    const winningTrades = closedTrades.filter(t => t.realizedPnL > 0);
    const losingTrades = closedTrades.filter(t => t.realizedPnL < 0);
    const winRatePct = totalClosedTradesCount > 0 ? (winningTrades.length / totalClosedTradesCount) * 100 : 0;

    const grossProfit = winningTrades.reduce((acc, t) => acc + t.realizedPnL, 0);
    const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.realizedPnL, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 1.0;

    return {
      cash,
      initialCash,
      positionsValue,
      totalCostBasis,
      totalEquity,
      totalReturn,
      totalReturnPct,
      realizedPnL,
      totalUnrealizedPnL,
      openPositionsCount: positions.length,
      closedTradesCount: totalClosedTradesCount,
      winRatePct,
      profitFactor
    };
  }, [portfolio]);

  // Format timestamp helper
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-xs font-mono">
      {/* ── Top Control & Setup Card ── */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline/20 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#00e476]" />
              Trade Simulator & Portfolio Engine
            </h2>
            <p className="text-xs text-on-surface-variant font-sans mt-0.5">
              Simulate algorithmic trade execution with realistic slippage, STT/SEC friction, trailing stops, and multi-day historical bar replay.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowResetConfirm(true);
              }}
              disabled={isRunningSim || isResettingSim}
              className="px-3.5 py-2 bg-surface-container-high hover:bg-rose-500/20 text-on-surface hover:text-rose-400 border border-outline/30 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50 text-xs"
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
              className="px-5 py-2 bg-[#00e476] text-[#002022] font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap justify-center text-xs"
            >
              <Play className={`w-4 h-4 fill-current ${isRunningSim ? 'animate-pulse' : ''}`} />
              <span>
                {isRunningSim
                  ? (simulationMode === 'HISTORICAL_REPLAY' ? 'Replaying Historical Days...' : 'Running Trade Simulation...')
                  : (simulationMode === 'HISTORICAL_REPLAY' ? 'Run Historical Replay' : 'Run Trade Simulation')}
              </span>
            </button>
          </div>
        </div>

        {/* Reset Confirmation Banner */}
        {showResetConfirm && (
          <div className="p-3.5 rounded-xl bg-surface-container-high border border-outline/30 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-on-surface">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs">
                Reset Trade Simulator to initial capital ({currencySign}100,000) and clear all open positions & trade history?
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

        {/* Configuration Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-outline/10">
          {/* Target Market Universe Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#00e476]" />
              Simulation Market ({effectiveMarket})
            </label>
            <select
              value={effectiveMarket}
              onChange={e => setSelectedMarket(e.target.value)}
              disabled={isRunningSim}
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00e476] cursor-pointer"
            >
              <option value="IN">Indian Equities (NSE NIFTY 50 • ₹ INR)</option>
              <option value="US">US Equities (NYSE / NASDAQ • $ USD)</option>
              <option value="EU">European Equities (Euronext • € EUR)</option>
            </select>
          </div>

          {/* Strategy Model Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-[#00dbe7]" />
              Algorithmic Strategy
            </label>
            <select
              value={selectedStrategyId}
              onChange={e => setSelectedStrategyId(e.target.value)}
              disabled={isRunningSim}
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer"
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
                className="w-20 bg-surface-container-lowest border border-outline/30 rounded-xl px-2.5 py-1 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00e476] disabled:opacity-50"
              />
              <span className="text-[11px] text-on-surface-variant font-sans">
                % ratchet below peak
              </span>
            </div>
          </div>
        </div>

        {/* ── Mode 5: Historical Replay & Date Range Selection Bar ── */}
        <div className="p-3.5 rounded-xl bg-surface-container border border-outline/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-bold text-on-surface uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#00dbe7]" />
              Simulation Mode:
            </span>
            <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline/20">
              <button
                type="button"
                onClick={() => setSimulationMode('SINGLE_STEP')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  simulationMode === 'SINGLE_STEP'
                    ? 'bg-[#00e476] text-[#002022] shadow'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Current Day Step
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode('HISTORICAL_REPLAY')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  simulationMode === 'HISTORICAL_REPLAY'
                    ? 'bg-[#00dbe7] text-[#002022] shadow'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <FastForward className="w-3 h-3" />
                Historical Replay
              </button>
            </div>
          </div>

          {simulationMode === 'HISTORICAL_REPLAY' && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[10px] uppercase text-on-surface-variant font-bold">Replay Range:</span>
              <div className="flex items-center gap-1">
                {[30, 60, 90, 180].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setReplayPresetDays(days);
                      const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
                      setCustomStartDate(start);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                      replayPresetDays === days
                        ? 'bg-[#00dbe7]/20 border-[#00dbe7] text-[#00dbe7]'
                        : 'bg-surface-container-lowest border-outline/20 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => {
                    setCustomStartDate(e.target.value);
                    setReplayPresetDays(0);
                  }}
                  className="bg-surface-container-lowest border border-outline/30 rounded px-2 py-0.5 text-xs text-on-surface font-mono"
                  title="Historical Replay Start Date"
                />
                <span className="text-on-surface-variant">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-surface-container-lowest border border-outline/30 rounded px-2 py-0.5 text-xs text-on-surface font-mono"
                  title="Historical Replay End Date"
                />
              </div>
            </div>
          )}
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
            type="button"
            onClick={handleRunSimulation}
            className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Portfolio Health & Capital Allocation KPI Banner ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Equity */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/20 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Total Account Equity</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-on-surface">
              {currencySign}{portfolioMetrics.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${portfolioMetrics.totalReturn >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
            {portfolioMetrics.totalReturn >= 0 ? '+' : ''}{currencySign}{portfolioMetrics.totalReturn.toFixed(2)} ({portfolioMetrics.totalReturnPct.toFixed(2)}%)
          </div>
        </div>

        {/* Available Cash & Capital Allocation */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/20 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Available Cash</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-[#00dbe7]">
              {currencySign}{portfolioMetrics.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-on-surface-variant mt-1 flex justify-between">
            <span>In Trades:</span>
            <span className="font-bold text-on-surface">{currencySign}{portfolioMetrics.positionsValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Realized Banked Profits */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/20 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Realized PnL (Closed)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold font-mono ${portfolioMetrics.realizedPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
              {portfolioMetrics.realizedPnL >= 0 ? '+' : ''}{currencySign}{portfolioMetrics.realizedPnL.toFixed(2)}
            </span>
          </div>
          <div className="text-[10px] text-on-surface-variant mt-1 flex justify-between">
            <span>Closed Trades:</span>
            <span className="font-bold">{portfolioMetrics.closedTradesCount}</span>
          </div>
        </div>

        {/* Active Open Positions & Floating PnL */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/20 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Active Positions Float</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-xl font-bold font-mono ${portfolioMetrics.totalUnrealizedPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
              {portfolioMetrics.totalUnrealizedPnL >= 0 ? '+' : ''}{currencySign}{portfolioMetrics.totalUnrealizedPnL.toFixed(2)}
            </span>
          </div>
          <div className="text-[10px] text-on-surface-variant mt-1 flex justify-between">
            <span>Open:</span>
            <span className="font-bold text-[#00e476]">{portfolioMetrics.openPositionsCount} positions</span>
          </div>
        </div>
      </div>

      {/* Capital Allocation Visual Progress Bar */}
      <div className="bg-surface-container-low p-3 rounded-xl border border-outline/15 flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase">
          <span>Capital Allocation Breakdown</span>
          <span>
            {((portfolioMetrics.cash / portfolioMetrics.totalEquity) * 100).toFixed(1)}% Liquid Cash •{' '}
            {((portfolioMetrics.positionsValue / portfolioMetrics.totalEquity) * 100).toFixed(1)}% In Active Trades
          </span>
        </div>
        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden flex">
          <div
            style={{ width: `${Math.min(100, (portfolioMetrics.cash / (portfolioMetrics.totalEquity || 1)) * 100)}%` }}
            className="h-full bg-[#00dbe7] transition-all"
            title="Available Liquid Cash"
          />
          <div
            style={{ width: `${Math.min(100, (portfolioMetrics.positionsValue / (portfolioMetrics.totalEquity || 1)) * 100)}%` }}
            className="h-full bg-[#00e476] transition-all"
            title="Capital Invested in Open Positions"
          />
        </div>
      </div>

      {/* ── Latest Simulation Digest Banner (If available) ── */}
      {latestReport && (
        <div className="p-4 rounded-2xl bg-surface-container-low border border-[#00e476]/30 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00e476]" />
              <span className="font-bold text-on-surface text-xs font-sans">
                {latestReport.replayMode === 'HISTORICAL_REPLAY' ? 'Historical Replay Completed' : 'Session Completed'}:{' '}
                {latestReport.simulatedDate} ({latestReport.strategyName})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-on-surface-variant">
                Executed: {formatDateTime(latestReport.executionTimestamp)}
              </span>
              <span className={`text-xs font-bold ${latestReport.netDailyPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
                Net PnL: {latestReport.netDailyPnL >= 0 ? '+' : ''}{currencySign}{latestReport.netDailyPnL.toFixed(2)} ({latestReport.netDailyPnLPct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant font-sans leading-relaxed">
            {latestReport.digest}
          </p>
        </div>
      )}

      {/* ── Tabbed View: Open Positions, Closed Trades, Ledger, Analytics ── */}
      <div className="bg-surface-container-low rounded-2xl border border-outline/20 overflow-hidden shadow-md flex flex-col">
        {/* Sub-Tabs Header */}
        <div className="flex items-center border-b border-outline/15 bg-surface-container-lowest/50 px-3 pt-2 gap-1 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setSimulatorTab('POSITIONS')}
            className={`px-4 py-2 text-xs font-bold font-mono rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              simulatorTab === 'POSITIONS'
                ? 'border-[#00e476] text-[#00e476] bg-surface-container-low'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Active Open Positions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#00e476]/15 text-[#00e476]">
              {portfolio?.positions?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSimulatorTab('CLOSED_TRADES')}
            className={`px-4 py-2 text-xs font-bold font-mono rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              simulatorTab === 'CLOSED_TRADES'
                ? 'border-[#00dbe7] text-[#00dbe7] bg-surface-container-low'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Completed Trades Ledger</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#00dbe7]/15 text-[#00dbe7]">
              {portfolio?.closedTrades?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSimulatorTab('LEDGER')}
            className={`px-4 py-2 text-xs font-bold font-mono rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              simulatorTab === 'LEDGER'
                ? 'border-amber-400 text-amber-400 bg-surface-container-low'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Simulation Execution Log</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/15 text-amber-400">
              {historyRuns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSimulatorTab('ANALYTICS')}
            className={`px-4 py-2 text-xs font-bold font-mono rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              simulatorTab === 'ANALYTICS'
                ? 'border-purple-400 text-purple-400 bg-surface-container-low'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Performance & Risk Analytics</span>
          </button>
        </div>

        {/* ── TAB 1: ACTIVE OPEN POSITIONS ── */}
        {simulatorTab === 'POSITIONS' && (
          <div>
            {(!portfolio?.positions || portfolio.positions.length === 0) ? (
              <div className="p-10 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                <Briefcase className="w-8 h-8 opacity-40 text-[#00e476]" />
                <p className="font-sans font-bold text-sm">No open positions currently in virtual simulator portfolio.</p>
                <p className="text-xs text-on-surface-variant max-w-md">
                  Click &quot;Run Trade Simulation&quot; above to scan for new entries or use &quot;Historical Replay&quot; to test performance over past market regimes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest/80 text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline/10">
                      <th className="py-3 px-4 font-bold">Asset</th>
                      <th className="py-3 px-3 font-bold">Entry Date & Time</th>
                      <th className="py-3 px-3 font-bold text-right">Shares</th>
                      <th className="py-3 px-3 font-bold text-right">Entry Price</th>
                      <th className="py-3 px-3 font-bold text-right">Current Price</th>
                      <th className="py-3 px-3 font-bold text-right">Cost vs Value</th>
                      <th className="py-3 px-3 font-bold text-center">Stop Loss</th>
                      <th className="py-3 px-3 font-bold text-center">Take Profit</th>
                      <th className="py-3 px-3 font-bold text-right">Floating PnL</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10 text-xs font-mono">
                    {portfolio.positions.map(pos => {
                      const isProfit = pos.unrealizedPnL >= 0;
                      const posSign = getAssetCurrencySymbol(pos.symbol, (pos as any).market, (pos as any).currencySymbol);
                      const cost = pos.shares * pos.entryPrice;
                      const val = pos.shares * pos.currentPrice;
                      const stopDistancePct = pos.entryPrice > 0 ? ((pos.stopLoss - pos.currentPrice) / pos.currentPrice) * 100 : 0;
                      const targetDistancePct = pos.entryPrice > 0 ? ((pos.takeProfit - pos.currentPrice) / pos.currentPrice) * 100 : 0;
                      const isClosing = closingPositionId === pos.id;

                      return (
                        <tr
                          key={pos.id}
                          className="hover:bg-surface-container/50 transition-colors cursor-pointer"
                          onClick={() => onSelectSymbol(pos.symbol)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-on-surface hover:text-[#00e476]">{pos.symbol}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-surface-container-high text-on-surface-variant">
                                {pos.market || 'EQ'}
                              </span>
                            </div>
                            <div className="text-[10px] text-on-surface-variant truncate max-w-[130px]">
                              {pos.name}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-on-surface">{pos.entryDate}</div>
                            <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                              <span>{pos.daysHeld ?? 0}d held</span>
                              {pos.entryTimestamp && (
                                <span>• {new Date(pos.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              )}
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

                          <td className="py-3 px-3 text-right">
                            <div className="font-bold text-on-surface">{posSign}{val.toFixed(2)}</div>
                            <div className="text-[10px] text-on-surface-variant">Cost: {posSign}{cost.toFixed(2)}</div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold text-[10px] block">
                              {posSign}{pos.stopLoss.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-rose-400/80 mt-0.5 block">
                              {stopDistancePct.toFixed(1)}%
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-[#00e476]/15 text-[#00e476] font-bold text-[10px] block">
                              {posSign}{pos.takeProfit.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-[#00e476]/80 mt-0.5 block">
                              +{targetDistancePct.toFixed(1)}%
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClosePosition(pos.id);
                                }}
                                disabled={isClosing}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white transition-all text-[11px] font-bold cursor-pointer disabled:opacity-50"
                                title="Exit this trade at current market price"
                              >
                                {isClosing ? 'Closing...' : 'Close'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectSymbol(pos.symbol);
                                }}
                                className="p-1 rounded-lg bg-surface-container hover:bg-[#00e476]/20 text-on-surface hover:text-[#00e476] transition-colors cursor-pointer"
                                title="Inspect Live Chart"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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
        )}

        {/* ── TAB 2: COMPLETED TRADES LEDGER ── */}
        {simulatorTab === 'CLOSED_TRADES' && (
          <div>
            {(!portfolio?.closedTrades || portfolio.closedTrades.length === 0) ? (
              <div className="p-10 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                <History className="w-8 h-8 opacity-40 text-[#00dbe7]" />
                <p className="font-sans font-bold text-sm">No completed trades recorded yet.</p>
                <p className="text-xs text-on-surface-variant max-w-md">
                  Trades will appear here as soon as positions reach their Take-Profit targets, Stop-Loss triggers, or are manually closed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest/80 text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline/10">
                      <th className="py-3 px-4 font-bold">Trade & Asset</th>
                      <th className="py-3 px-3 font-bold">Entry Date & Time</th>
                      <th className="py-3 px-3 font-bold">Exit Date & Time</th>
                      <th className="py-3 px-3 font-bold text-center">Holding Period</th>
                      <th className="py-3 px-3 font-bold text-right">Shares</th>
                      <th className="py-3 px-3 font-bold text-right">Entry Price</th>
                      <th className="py-3 px-3 font-bold text-right">Exit Price</th>
                      <th className="py-3 px-3 font-bold text-right">Realized PnL</th>
                      <th className="py-3 px-4 font-bold text-center">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10 text-xs font-mono">
                    {portfolio.closedTrades.map(trade => {
                      const isProfit = trade.realizedPnL >= 0;
                      const tradeSign = getAssetCurrencySymbol(trade.symbol, undefined, (trade as any).currencySymbol);

                      return (
                        <tr key={trade.id} className="hover:bg-surface-container/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-on-surface">{trade.symbol}</span>
                            <div className="text-[10px] text-on-surface-variant truncate max-w-[130px]">
                              {trade.companyName}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-on-surface">{trade.entryDate || formatDateTime(trade.entryTimestamp)}</div>
                            <div className="text-[10px] text-on-surface-variant">
                              {trade.entryTimestamp ? new Date(trade.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:30'}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-on-surface">{trade.exitDate || formatDateTime(trade.exitTimestamp || trade.executedAt)}</div>
                            <div className="text-[10px] text-on-surface-variant">
                              {trade.exitTimestamp ? new Date(trade.exitTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '15:30'}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-bold text-[10px]">
                              {trade.holdingDays ? `${trade.holdingDays}d` : '1d'}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-on-surface">
                            {trade.shares}
                          </td>

                          <td className="py-3 px-3 text-right text-on-surface">
                            {tradeSign}{trade.entryPrice ? trade.entryPrice.toFixed(2) : '—'}
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-on-surface">
                            {tradeSign}{trade.price.toFixed(2)}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className={`font-bold ${isProfit ? 'text-[#00e476]' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}{tradeSign}{trade.realizedPnL.toFixed(2)}
                            </div>
                            <div className={`text-[10px] ${isProfit ? 'text-[#00e476]' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}{trade.realizedPnLPct.toFixed(2)}%
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block max-w-[180px] truncate ${
                                trade.type === 'TAKE_PROFIT'
                                  ? 'bg-[#00e476]/15 text-[#00e476]'
                                  : trade.type === 'STOP_LOSS'
                                  ? 'bg-rose-500/15 text-rose-400'
                                  : trade.type === 'TRAILING_STOP_EXIT'
                                  ? 'bg-[#00dbe7]/15 text-[#00dbe7]'
                                  : 'bg-purple-500/15 text-purple-400'
                              }`}
                              title={trade.reason}
                            >
                              {trade.type.replace('_', ' ')}
                            </span>
                            <div className="text-[9px] text-on-surface-variant truncate max-w-[180px] mt-0.5">
                              {trade.reason}
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
        )}

        {/* ── TAB 3: SIMULATION EXECUTION LOG & HISTORY ── */}
        {simulatorTab === 'LEDGER' && (
          <div>
            {historyRuns.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                <Clock className="w-8 h-8 opacity-40 text-amber-400" />
                <p className="font-sans font-bold text-sm">No historical simulation runs recorded yet.</p>
                <p className="text-xs text-on-surface-variant max-w-md">
                  Run a trade simulation or historical replay to start building an audit trail.
                </p>
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-on-surface text-xs">{run.simulatedDate}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-bold">
                                {run.strategyName}
                              </span>
                              {run.replayMode === 'HISTORICAL_REPLAY' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00dbe7]/15 text-[#00dbe7] font-bold">
                                  {run.replayedDaysCount ? `${run.replayedDaysCount} Days Replayed` : 'Historical Replay'}
                                </span>
                              )}
                              <span className="text-[10px] text-on-surface-variant font-sans">
                                (Executed: {formatDateTime(run.executionTimestamp)})
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
                            Equity: {runSign}{run.endingCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                              <span className="text-[10px] font-bold uppercase text-on-surface-variant flex items-center gap-1">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                                Positions Closed / Realized ({run.closedPositions.length}):
                              </span>
                              <div className="space-y-1.5">
                                {run.closedPositions.map(t => {
                                  const tradeSign = getAssetCurrencySymbol(t.symbol, undefined, (t as any).currencySymbol);
                                  return (
                                    <div
                                      key={t.id}
                                      className="p-2.5 rounded-xl bg-surface-container-low border border-outline/10 flex items-center justify-between flex-wrap gap-2"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-on-surface">{t.symbol}</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container font-bold text-on-surface-variant">
                                            {t.type}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-on-surface-variant mt-0.5">
                                          {t.shares} shares @ {tradeSign}{t.price} • {formatDateTime(t.executedAt)}
                                        </div>
                                        <div className="text-[10px] text-on-surface-variant/80 font-sans italic">
                                          {t.reason}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className={`font-bold ${t.realizedPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
                                          {t.realizedPnL >= 0 ? '+' : ''}{tradeSign}{t.realizedPnL.toFixed(2)} ({t.realizedPnLPct.toFixed(2)}%)
                                        </span>
                                        <div className="text-[9px] text-on-surface-variant">
                                          Friction: {tradeSign}{t.friction.toFixed(2)}
                                        </div>
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
                              <span className="text-[10px] font-bold uppercase text-on-surface-variant flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-[#00e476]" />
                                New Positions Initiated ({run.openedPositions.length}):
                              </span>
                              <div className="space-y-1.5">
                                {run.openedPositions.map(t => {
                                  const tradeSign = getAssetCurrencySymbol(t.symbol, undefined, (t as any).currencySymbol);
                                  return (
                                    <div
                                      key={t.id}
                                      className="p-2.5 rounded-xl bg-surface-container-low border border-outline/10 flex items-center justify-between flex-wrap gap-2"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-[#00e476]">{t.symbol}</span>
                                          <span className="text-[10px] text-on-surface-variant">
                                            Bought {t.shares} shares @ {tradeSign}{t.price}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-on-surface-variant mt-0.5">
                                          {formatDateTime(t.executedAt)}
                                        </div>
                                        <div className="text-[10px] text-on-surface-variant/80 font-sans italic">
                                          {t.reason}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[10px] font-bold text-on-surface">
                                          Total Cost: {tradeSign}{(t.shares * t.price).toFixed(2)}
                                        </span>
                                      </div>
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
        )}

        {/* ── TAB 4: PERFORMANCE & RISK ANALYTICS ── */}
        {simulatorTab === 'ANALYTICS' && (
          <div className="p-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Win Rate</span>
                <div className="text-2xl font-bold font-mono text-[#00e476] mt-1">
                  {portfolioMetrics.winRatePct.toFixed(1)}%
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  Across {portfolioMetrics.closedTradesCount} completed trades
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Profit Factor</span>
                <div className="text-2xl font-bold font-mono text-[#00dbe7] mt-1">
                  {portfolioMetrics.profitFactor.toFixed(2)}
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  Gross Profit / Gross Loss Ratio
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Total Friction & Taxes Paid</span>
                <div className="text-2xl font-bold font-mono text-on-surface mt-1">
                  {currencySign}{(portfolio?.totalFrictionPaid || 0).toFixed(2)}
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  STT, Exchange turnover fee, Stamp duty
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Active Margin In Play</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {((portfolioMetrics.positionsValue / (portfolioMetrics.totalEquity || 1)) * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  {currencySign}{portfolioMetrics.positionsValue.toFixed(2)} allocated
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container border border-outline/15 text-xs text-on-surface-variant leading-relaxed">
              <span className="font-bold text-on-surface flex items-center gap-1.5 mb-1">
                <Award className="w-4 h-4 text-[#00e476]" />
                Institutional Paper Trading Framework (Inspired by QuantConnect LEAN)
              </span>
              Our execution pipeline runs strict bar-by-bar simulations with zero lookahead bias.
              Positions are verified against daily candle highs and lows for limit order fills, trailing ratchets, and regional transaction cost modeling.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
