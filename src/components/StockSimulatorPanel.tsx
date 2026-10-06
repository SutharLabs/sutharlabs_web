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
  Receipt
} from 'lucide-react';
import { IStrategy } from '../plugins/StockTracker/strategies/types';
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
  userEmail?: string;
  onSelectSymbol: (symbol: string) => void;
  isDark?: boolean;
}

const STOCK_API = '/api/workspace/stock-analyzer';

export default function StockSimulatorPanel({
  strategies,
  activeStrategyId,
  userEmail,
  onSelectSymbol,
  isDark = true
}: StockSimulatorPanelProps) {
  // Strategy & Simulation Config
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(activeStrategyId || 'strat-ema-cross');
  const [allocationPct, setAllocationPct] = useState<number>(0.20);
  const [trailingStopPct, setTrailingStopPct] = useState<number>(3.0);
  const [enableTrailingStop, setEnableTrailingStop] = useState<boolean>(true);

  // Live Portfolio & History State
  const [portfolio, setPortfolio] = useState<EODPortfolioStore | null>(null);
  const [historyRuns, setHistoryRuns] = useState<EODSimulationReport[]>([]);
  const [latestReport, setLatestReport] = useState<EODSimulationReport | null>(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState<boolean>(false);
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);
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

      if (portRes && portRes.ok) {
        const portData = await portRes.json();
        setPortfolio(portData);
      }

      if (histRes && histRes.ok) {
        const histData = await histRes.json();
        if (Array.isArray(histData)) {
          setHistoryRuns(histData);
          if (histData.length > 0 && !latestReport) {
            setLatestReport(histData[0]);
            setExpandedRunId(histData[0].id);
          }
        }
      }
    } catch (err: any) {
      console.warn('[EOD Simulator] Error loading portfolio/history:', err);
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, [userEmail, latestReport]);

  useEffect(() => {
    fetchPortfolioAndHistory();
  }, [fetchPortfolioAndHistory]);

  // Execute EOD Simulation Run
  const handleRunSimulation = async () => {
    setIsRunningSim(true);
    setErrorMessage(null);

    try {
      const payload: EODSimulationOptions = {
        strategyId: selectedStrategyId,
        capitalAllocationPct: allocationPct,
        trailingStopPct: enableTrailingStop ? trailingStopPct : undefined,
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
      setErrorMessage(err.message || 'Failed to execute EOD daily simulation.');
    } finally {
      setIsRunningSim(false);
    }
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
    return strategies.find(s => s.id === selectedStrategyId) || strategies[0];
  }, [strategies, selectedStrategyId]);

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
                  Automated End-of-Day (EOD) Batch Trade Simulator
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00e476]/20 text-[#00e476] font-mono font-bold">
                    Stage 6 Production
                  </span>
                </h2>
                <p className="text-xs text-on-surface-variant font-sans mt-0.5">
                  Simulate daily closing candle trade triggers, auto-manage SL/TP & trailing stops, with realistic transaction fees.
                </p>
              </div>
            </div>
          </div>

          {/* Trigger Simulation Button */}
          <button
            onClick={handleRunSimulation}
            disabled={isRunningSim}
            className="px-6 py-2.5 bg-[#00e476] text-[#002022] font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap self-stretch md:self-auto justify-center"
          >
            <Play className={`w-4 h-4 fill-current ${isRunningSim ? 'animate-pulse' : ''}`} />
            <span>{isRunningSim ? 'Simulating EOD Trading Session...' : 'Run EOD Daily Simulation'}</span>
          </button>
        </div>

        {/* Configuration Options Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-outline/10">
          {/* Strategy Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#00dbe7]" />
              Simulation Strategy
            </label>
            <select
              value={selectedStrategyId}
              onChange={e => setSelectedStrategyId(e.target.value)}
              disabled={isRunningSim}
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00e476]"
            >
              {strategies.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.market})
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
              ${portfolioMetrics.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              ${portfolioMetrics.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant mt-1">
            Allocated: ${portfolioMetrics.positionsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Realized PnL */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/20 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-on-surface-variant uppercase font-mono">Realized PnL (Closed)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold font-mono ${portfolioMetrics.realizedPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
              {portfolioMetrics.realizedPnL >= 0 ? '+' : ''}${portfolioMetrics.realizedPnL.toFixed(2)}
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
              ({portfolioMetrics.totalUnrealizedPnL >= 0 ? '+' : ''}${portfolioMetrics.totalUnrealizedPnL.toFixed(2)} float)
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
                Daily PnL: {latestReport.netDailyPnL >= 0 ? '+' : ''}${latestReport.netDailyPnL.toFixed(2)} ({latestReport.netDailyPnLPct.toFixed(2)}%)
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
              Click &quot;Run EOD Daily Simulation&quot; above to scan your watchlist assets for new entry signals.
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
                        ${pos.entryPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-on-surface">
                        ${pos.currentPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold text-[10px]">
                          ${pos.stopLoss.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#00e476]/15 text-[#00e476] font-bold text-[10px]">
                          ${pos.takeProfit.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className={`font-bold ${isProfit ? 'text-[#00e476]' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
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
                        {isPositive ? '+' : ''}${run.netDailyPnL.toFixed(2)} ({run.netDailyPnLPct.toFixed(2)}%)
                      </div>
                      <div className="text-[10px] text-on-surface-variant">
                        Cap: ${run.endingCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                            {run.closedPositions.map(t => (
                              <div
                                key={t.id}
                                className="p-2 rounded-lg bg-surface-container-low border border-outline/10 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-on-surface">{t.symbol}</span>
                                  <span className="text-[10px] text-on-surface-variant ml-2">
                                    {t.shares} shares @ ${t.price} ({t.reason})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className={`font-bold ${t.realizedPnL >= 0 ? 'text-[#00e476]' : 'text-rose-400'}`}>
                                    {t.realizedPnL >= 0 ? '+' : ''}${t.realizedPnL.toFixed(2)} ({t.realizedPnLPct.toFixed(2)}%)
                                  </span>
                                  <span className="text-[9px] text-on-surface-variant ml-2">
                                    Friction: ${t.friction.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
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
                            {run.openedPositions.map(t => (
                              <div
                                key={t.id}
                                className="p-2 rounded-lg bg-surface-container-low border border-outline/10 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-[#00e476]">{t.symbol}</span>
                                  <span className="text-[10px] text-on-surface-variant ml-2">
                                    Bought {t.shares} shares @ ${t.price}
                                  </span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant">
                                  {t.reason}
                                </span>
                              </div>
                            ))}
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
