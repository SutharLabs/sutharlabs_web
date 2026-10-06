import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Shield,
  Layers,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  Info,
  Calendar,
  Scale,
  Percent,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { IStrategy } from '../plugins/StockTracker/strategies/types';
import {
  BacktestReport,
  BacktestRequest,
  TradeLog,
  BacktestEquityPoint,
  MarketRegion,
  FrictionBreakdown
} from '../plugins/StockTracker/backtest/types';

export interface StockBacktestPanelProps {
  symbol: string;
  displaySymbol?: string;
  cleanSymbol?: string;
  companyName?: string;
  marketRegion?: string;
  curSymbol: string;
  strategies: IStrategy[];
  activeStrategyId: string;
  onSelectStrategy?: (strategyId: string) => void;
  onOpenStrategyBuilder?: () => void;
  isDark?: boolean;
}

const STOCK_API = '/api/workspace/stock-analyzer';

export default function StockBacktestPanel({
  symbol,
  displaySymbol,
  cleanSymbol,
  companyName,
  marketRegion = 'IN',
  curSymbol,
  strategies,
  activeStrategyId,
  onSelectStrategy,
  onOpenStrategyBuilder,
  isDark = true
}: StockBacktestPanelProps) {
  // Backtest Parameters State
  const [selectedStratId, setSelectedStratId] = useState<string>(activeStrategyId || 'strat-ema-cross');
  const [range, setRange] = useState<'1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max'>('1y');
  const [initialCapital, setInitialCapital] = useState<number>(() => {
    return curSymbol === '₹' ? 100000 : 10000;
  });
  const [includeFriction, setIncludeFriction] = useState<boolean>(true);
  const [slippagePct, setSlippagePct] = useState<number>(0.05);
  const [positionSizingPct, setPositionSizingPct] = useState<number>(95);

  // Execution & Results State
  const [report, setReport] = useState<BacktestReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sub-tab view: 'EQUITY' | 'TRADES' | 'FRICTION'
  const [viewTab, setViewTab] = useState<'EQUITY' | 'TRADES' | 'FRICTION'>('EQUITY');

  // Trade Log Filter: 'ALL' | 'WINNERS' | 'LOSERS'
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WINNERS' | 'LOSERS'>('ALL');

  // Interactive SVG hover
  const [hoveredPoint, setHoveredPoint] = useState<BacktestEquityPoint | null>(null);

  // Localized Friction Preview
  const [frictionPreview, setFrictionPreview] = useState<FrictionBreakdown | null>(null);
  const [loadingFriction, setLoadingFriction] = useState<boolean>(false);

  // KPI Cards Slideshow / Carousel Scroll
  const kpiScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollKpiLeft, setCanScrollKpiLeft] = useState(false);
  const [canScrollKpiRight, setCanScrollKpiRight] = useState(false);

  const updateKpiScroll = useCallback(() => {
    if (!kpiScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = kpiScrollRef.current;
    setCanScrollKpiLeft(scrollLeft > 4);
    setCanScrollKpiRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateKpiScroll();
    const el = kpiScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateKpiScroll);
    window.addEventListener('resize', updateKpiScroll);
    return () => {
      el.removeEventListener('scroll', updateKpiScroll);
      window.removeEventListener('resize', updateKpiScroll);
    };
  }, [updateKpiScroll, report]);

  const scrollKpi = (dir: 'left' | 'right') => {
    if (!kpiScrollRef.current) return;
    const amount = 220;
    kpiScrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  // Sync selected strategy when parent activeStrategy changes
  useEffect(() => {
    if (activeStrategyId) {
      setSelectedStratId(activeStrategyId);
    }
  }, [activeStrategyId]);

  // Adjust default capital if currency changes
  useEffect(() => {
    if (curSymbol === '₹' && initialCapital === 10000) {
      setInitialCapital(100000);
    } else if (curSymbol !== '₹' && initialCapital === 100000) {
      setInitialCapital(10000);
    }
  }, [curSymbol]);

  // Fetch Localized Friction Preview
  const fetchFrictionPreview = useCallback(async () => {
    if (!symbol) return;
    setLoadingFriction(true);
    try {
      const res = await fetch(
        `${STOCK_API}/backtest-friction-preview?symbol=${encodeURIComponent(symbol)}&side=BUY&price=100&quantity=100&slippagePct=${slippagePct}`
      );
      if (res.ok) {
        const data = await res.json();
        setFrictionPreview(data);
      }
    } catch {
      // Ignore preview errors
    } finally {
      setLoadingFriction(false);
    }
  }, [symbol, slippagePct]);

  useEffect(() => {
    fetchFrictionPreview();
  }, [fetchFrictionPreview]);

  // Execute Historical Backtest
  const handleRunBacktest = useCallback(async () => {
    if (!symbol) return;
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const payload: BacktestRequest = {
        strategyId: selectedStratId,
        symbol,
        range,
        timeframe: '1d',
        initialCapital,
        includeFriction,
        slippagePct,
        positionSizingPct
      };

      const res = await fetch(`${STOCK_API}/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const reportData: BacktestReport = await res.json();
      setReport(reportData);
    } catch (err: any) {
      console.error('[Backtest UI] Execution failed:', err);
      setErrorMsg(err.message || 'Failed to complete historical backtest.');
    } finally {
      setIsRunning(false);
    }
  }, [symbol, selectedStratId, range, initialCapital, includeFriction, slippagePct, positionSizingPct]);

  // Auto-run on mount or stock change if no report exists
  useEffect(() => {
    handleRunBacktest();
  }, [symbol, selectedStratId, range]);

  // Filtered Trades
  const filteredTrades = useMemo(() => {
    if (!report?.trades) return [];
    if (tradeFilter === 'WINNERS') return report.trades.filter(t => t.isWinner);
    if (tradeFilter === 'LOSERS') return report.trades.filter(t => !t.isWinner);
    return report.trades;
  }, [report, tradeFilter]);

  // Export Trades to CSV
  const handleExportCsv = useCallback(() => {
    if (!report?.trades || report.trades.length === 0) return;
    const headers = [
      'Trade #',
      'Symbol',
      'Side',
      'Entry Date',
      'Entry Price',
      'Exit Date',
      'Exit Price',
      'Exit Reason',
      'Quantity',
      'Holding Days',
      'Gross PnL',
      'Total Friction',
      'Net PnL',
      'Net Return %'
    ];

    const rows = report.trades.map(t => [
      t.tradeNumber,
      t.symbol,
      t.side,
      t.entryDate,
      t.entryPrice,
      t.exitDate,
      t.exitPrice,
      t.exitReason,
      t.quantity,
      t.holdingDays,
      t.grossPnL,
      t.totalFriction,
      t.netPnL,
      t.netPnLPct
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `backtest_${symbol}_${report.strategyId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [report, symbol]);

  // SVG Equity Curve Calculation
  const svgDimensions = { width: 700, height: 220, padding: 30 };
  const equityPoints = report?.equityCurve || [];

  const { strategyPath, benchmarkPath, areaPath, minVal, maxVal, minBenchmark, maxBenchmark } = useMemo(() => {
    if (equityPoints.length < 2) {
      return { strategyPath: '', benchmarkPath: '', areaPath: '', minVal: 0, maxVal: 1, minBenchmark: 0, maxBenchmark: 1 };
    }

    const stratVals = equityPoints.map(p => p.equity);
    const benchVals = equityPoints.map(p => p.benchmarkEquity);

    const allVals = [...stratVals, ...benchVals];
    let min = Math.min(...allVals);
    let max = Math.max(...allVals);

    // Give 5% breathing room
    const paddingVal = (max - min) * 0.05 || 10;
    min -= paddingVal;
    max += paddingVal;

    const { width, height, padding } = svgDimensions;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const getX = (idx: number) => padding + (idx / (equityPoints.length - 1)) * chartW;
    const getY = (val: number) => padding + chartH - ((val - min) / (max - min)) * chartH;

    let sPath = '';
    let bPath = '';
    let aPath = '';

    equityPoints.forEach((p, idx) => {
      const x = getX(idx);
      const yStrat = getY(p.equity);
      const yBench = getY(p.benchmarkEquity);

      if (idx === 0) {
        sPath += `M ${x.toFixed(1)} ${yStrat.toFixed(1)}`;
        bPath += `M ${x.toFixed(1)} ${yBench.toFixed(1)}`;
        aPath += `M ${x.toFixed(1)} ${chartH + padding} L ${x.toFixed(1)} ${yStrat.toFixed(1)}`;
      } else {
        sPath += ` L ${x.toFixed(1)} ${yStrat.toFixed(1)}`;
        bPath += ` L ${x.toFixed(1)} ${yBench.toFixed(1)}`;
        aPath += ` L ${x.toFixed(1)} ${yStrat.toFixed(1)}`;
      }
    });

    const lastX = getX(equityPoints.length - 1);
    aPath += ` L ${lastX.toFixed(1)} ${chartH + padding} Z`;

    return {
      strategyPath: sPath,
      benchmarkPath: bPath,
      areaPath: aPath,
      minVal: min,
      maxVal: max,
      minBenchmark: Math.min(...benchVals),
      maxBenchmark: Math.max(...benchVals)
    };
  }, [equityPoints]);

  const activeStrategy = strategies.find(s => s.id === selectedStratId);

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-5 border border-outline/20 bg-surface-container-lowest/95 flex flex-col gap-4 shadow-md font-sans">
      
      {/* ── 1. HEADER: Active Stock, Strategy Selector & Backtest Controls ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-outline/15">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-on-surface">
              Historical Backtesting & Institutional Engine
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
            Simulate quantitative algorithmic rules with realistic localized market friction (STT, SEC, GST, SDRT, slippage) on <strong className="text-on-surface">{cleanSymbol || symbol}</strong>
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleRunBacktest}
            disabled={isRunning}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-[#00dbe7] to-[#00b4d8] text-[#002022] font-mono text-xs font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,219,231,0.3)] cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Backtest</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. CONFIGURATION CONTROL BAR ── */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 p-3 rounded-xl bg-surface-container-low/80 border border-outline/20 text-xs font-mono">
        
        {/* Strategy Dropdown */}
        <div className="flex flex-col gap-1 min-w-[180px] flex-1">
          <label className="text-[10px] text-on-surface-variant uppercase font-semibold flex items-center justify-between">
            <span>Algorithm Preset / Model</span>
            {onOpenStrategyBuilder && (
              <button
                onClick={onOpenStrategyBuilder}
                className="text-[#00dbe7] hover:underline cursor-pointer lowercase text-[10px]"
              >
                marketplace & builder
              </button>
            )}
          </label>
          <select
            value={selectedStratId}
            onChange={e => {
              setSelectedStratId(e.target.value);
              if (onSelectStrategy) onSelectStrategy(e.target.value);
            }}
            className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer"
          >
            {strategies.map(s => (
              <option key={s.id} value={s.id}>
                {s.verifiedBadge ? '🛡️ ' : s.isPreset ? '⚡ ' : '🔧 '}
                {s.name} {s.rating ? `(★${s.rating.toFixed(1)})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Historical Range Picker - Flexible Wrap Group */}
        <div className="flex flex-col gap-1 min-w-[210px] flex-1">
          <label className="text-[10px] text-on-surface-variant uppercase font-semibold">
            Historical Replay Window
          </label>
          <div className="flex flex-wrap items-center gap-1">
            {(['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  range === r
                    ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_8px_rgba(0,219,231,0.3)]'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline/20'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Initial Capital & Position Size */}
        <div className="flex flex-col gap-1 min-w-[160px] flex-1">
          <label className="text-[10px] text-on-surface-variant uppercase font-semibold flex items-center justify-between">
            <span>Initial Portfolio Capital</span>
            <span className="text-[#00dbe7]">{curSymbol}</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="1000"
              step="1000"
              value={initialCapital}
              onChange={e => setInitialCapital(Math.max(100, Number(e.target.value) || 1000))}
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-[#00dbe7]"
            />
            <span className="text-[10px] text-on-surface-variant/80 shrink-0">
              {positionSizingPct}%/pos
            </span>
          </div>
        </div>

        {/* Friction Toggle & Slippage */}
        <div className="flex flex-col gap-1 min-w-[190px] flex-1 justify-center">
          <label className="text-[10px] text-on-surface-variant uppercase font-semibold flex items-center justify-between">
            <span>Market Friction & Tax Model</span>
            <span className={includeFriction ? 'text-[#00e476]' : 'text-on-surface-variant'}>
              {includeFriction ? 'Active' : 'Off'}
            </span>
          </label>
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-surface-container-lowest border border-outline/20">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeFriction}
                onChange={e => setIncludeFriction(e.target.checked)}
                className="rounded accent-[#00dbe7] cursor-pointer"
              />
              <span className="text-[11px] text-on-surface">Include STT / Taxes</span>
            </label>
            <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
              <span>Slip:</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={slippagePct}
                onChange={e => setSlippagePct(Math.max(0, Number(e.target.value) || 0))}
                className="w-12 bg-surface-container-low border border-outline/30 rounded px-1 py-0.5 text-center text-on-surface text-[10px]"
              />
              <span>%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-[#ff6b6b]/15 border border-[#ff6b6b]/40 text-[#ff6b6b] text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 3. INSTITUTIONAL PERFORMANCE KPI MATRIX (SLIDESHOW CAROUSEL WITH HOVER NAV) ── */}
      {report && (
        <div className="relative group/kpi">
          {/* Left Slide Arrow Button */}
          {canScrollKpiLeft && (
            <button
              onClick={() => scrollKpi('left')}
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-surface-container-high/95 hover:bg-[#00dbe7] text-[#00dbe7] hover:text-[#002022] border border-outline/30 flex items-center justify-center transition-all shadow-lg cursor-pointer opacity-90 group-hover/kpi:opacity-100"
              title="Slide metrics left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Right Slide Arrow Button */}
          {canScrollKpiRight && (
            <button
              onClick={() => scrollKpi('right')}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-surface-container-high/95 hover:bg-[#00dbe7] text-[#00dbe7] hover:text-[#002022] border border-outline/30 flex items-center justify-center transition-all shadow-lg cursor-pointer opacity-90 group-hover/kpi:opacity-100"
              title="Slide metrics right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <div
            ref={kpiScrollRef}
            onWheel={(e) => {
              if (e.deltaY !== 0 && kpiScrollRef.current) {
                kpiScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="flex items-stretch gap-2.5 font-mono overflow-x-auto no-scrollbar scroll-smooth py-1"
          >
            {/* Card 1: Net Return & Alpha */}
            <div className="min-w-[175px] flex-1 shrink-0 p-3 rounded-xl bg-surface-container-low/90 border border-outline/20 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Net PnL / Alpha</span>
              <div className="my-1">
                <span className={`text-base sm:text-lg font-bold ${
                  report.metrics.netProfit >= 0 ? 'text-[#00e476]' : 'text-[#ff6b6b]'
                }`}>
                  {report.metrics.netProfit >= 0 ? '+' : ''}{report.metrics.netProfitPct.toFixed(2)}%
                </span>
                <span className="block text-[11px] text-on-surface-variant">
                  {curSymbol}{report.metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[10px] text-[#00dbe7] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Alpha: {report.metrics.alphaPct >= 0 ? '+' : ''}{report.metrics.alphaPct.toFixed(1)}% vs B&H
              </span>
            </div>

            {/* Card 2: Win Rate & Profit Factor */}
            <div className="min-w-[175px] flex-1 shrink-0 p-3 rounded-xl bg-surface-container-low/90 border border-outline/20 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Win Rate & Factor</span>
              <div className="my-1">
                <span className="text-base sm:text-lg font-bold text-on-surface">
                  {report.metrics.winRatePct.toFixed(1)}%
                </span>
                <span className="block text-[11px] text-on-surface-variant">
                  {report.metrics.winningTrades}W / {report.metrics.losingTrades}L ({report.metrics.totalTrades} Trades)
                </span>
              </div>
              <span className="text-[10px] text-amber-400">
                Profit Factor: {report.metrics.profitFactor > 50 ? '∞' : report.metrics.profitFactor.toFixed(2)}
              </span>
            </div>

            {/* Card 3: Compounded Annual Growth (CAGR) */}
            <div className="min-w-[175px] flex-1 shrink-0 p-3 rounded-xl bg-surface-container-low/90 border border-outline/20 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Annualized CAGR</span>
              <div className="my-1">
                <span className={`text-base sm:text-lg font-bold ${
                  report.metrics.cagrPct >= 0 ? 'text-[#00e476]' : 'text-[#ff6b6b]'
                }`}>
                  {report.metrics.cagrPct >= 0 ? '+' : ''}{report.metrics.cagrPct.toFixed(2)}%
                </span>
                <span className="block text-[11px] text-on-surface-variant">
                  CAGR Rate (252d basis)
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant/80">
                Replay: {report.startDate} &rarr; {report.endDate}
              </span>
            </div>

            {/* Card 4: Sharpe & Sortino Ratios */}
            <div className="min-w-[175px] flex-1 shrink-0 p-3 rounded-xl bg-surface-container-low/90 border border-outline/20 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Risk Ratios (Sharpe)</span>
              <div className="my-1">
                <span className="text-base sm:text-lg font-bold text-on-surface">
                  {report.metrics.sharpeRatio.toFixed(2)}
                </span>
                <span className="block text-[11px] text-on-surface-variant">
                  Sortino: {report.metrics.sortinoRatio.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant/80">
                Risk-Free Benchmark: 6.5%
              </span>
            </div>

            {/* Card 5: Maximum Drawdown */}
            <div className="min-w-[175px] flex-1 shrink-0 p-3 rounded-xl bg-surface-container-low/90 border border-outline/20 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Max Drawdown</span>
              <div className="my-1">
                <span className="text-base sm:text-lg font-bold text-[#ff6b6b]">
                  -{report.metrics.maxDrawdownPct.toFixed(2)}%
                </span>
                <span className="block text-[11px] text-on-surface-variant">
                  Duration: {report.metrics.maxDrawdownDurationDays} bars
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant/80">
                In-Market Exposure: {report.metrics.exposureTimePct.toFixed(0)}%
              </span>
            </div>

            {/* Card 6: Friction & Taxes Paid */}
            <div className="min-w-[175px] flex-1 shrink-0 p-3 rounded-xl bg-surface-container-low/90 border border-outline/20 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Friction & Taxes Paid</span>
              <div className="my-1">
                <span className="text-base sm:text-lg font-bold text-amber-400">
                  {curSymbol}{report.metrics.totalFrictionPaid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="block text-[11px] text-on-surface-variant">
                  Taxes: {curSymbol}{report.metrics.totalTaxesPaid.toFixed(0)} | Broker: {curSymbol}{report.metrics.totalBrokeragePaid.toFixed(0)}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant/80">
                Slippage Drag: {curSymbol}{report.metrics.totalSlippagePaid.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. VIEW TABS: EQUITY CURVE | TRADE LOG | FRICTION BREAKDOWN ── */}
      <div className="flex items-center justify-between gap-2 border-b border-outline/20 pb-2">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setViewTab('EQUITY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewTab === 'EQUITY'
                ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_8px_rgba(0,219,231,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Equity Curve</span>
          </button>

          <button
            onClick={() => setViewTab('TRADES')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewTab === 'TRADES'
                ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_8px_rgba(0,219,231,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Trade Log ({report?.trades.length || 0})</span>
          </button>

          <button
            onClick={() => setViewTab('FRICTION')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewTab === 'FRICTION'
                ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_8px_rgba(0,219,231,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Friction & Taxes</span>
          </button>
        </div>

        {/* Right side controls per tab */}
        {viewTab === 'TRADES' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg text-[10px] font-mono">
              {(['ALL', 'WINNERS', 'LOSERS'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTradeFilter(f)}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    tradeFilter === f
                      ? 'bg-[#00dbe7] text-[#002022]'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={handleExportCsv}
              className="p-1 rounded-lg text-on-surface-variant hover:text-[#00dbe7] hover:bg-surface-container-low transition-colors cursor-pointer"
              title="Export Trades to CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── TAB CONTENT 1: INTERACTIVE EQUITY CURVE SVG ── */}
      {viewTab === 'EQUITY' && report && (
        <div className="flex flex-col gap-2">
          {/* Legend and Hover Telemetry Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#00dbe7] rounded-full inline-block shadow-[0_0_6px_#00dbe7]" />
                <span className="text-on-surface font-bold">{report.strategyName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-[#a855f7] inline-block" />
                <span className="text-on-surface-variant">Buy & Hold Benchmark</span>
              </span>
            </div>

            {/* Hovered point value */}
            {hoveredPoint ? (
              <div className="flex items-center gap-3 text-[11px] bg-surface-container-low px-2.5 py-0.5 rounded-lg border border-outline/20">
                <span className="text-on-surface font-semibold">{hoveredPoint.date}</span>
                <span>Strategy: <strong className="text-[#00dbe7]">{curSymbol}{hoveredPoint.equity.toLocaleString()}</strong></span>
                <span>B&H: <strong className="text-[#a855f7]">{curSymbol}{hoveredPoint.benchmarkEquity.toLocaleString()}</strong></span>
                <span>DD: <strong className="text-[#ff6b6b]">-{hoveredPoint.drawdownPct}%</strong></span>
              </div>
            ) : (
              <span className="text-on-surface-variant/70 text-[10px]">
                Hover across equity curve to inspect historical capital & drawdown
              </span>
            )}
          </div>

          {/* SVG Canvas Chart */}
          <div className="relative w-full h-[220px] bg-surface-container-lowest rounded-xl border border-outline/20 overflow-hidden">
            <svg
              viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
              className="w-full h-full"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredPoint(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, mouseX / rect.width));
                const index = Math.round(pct * (equityPoints.length - 1));
                if (equityPoints[index]) {
                  setHoveredPoint(equityPoints[index]);
                }
              }}
            >
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00dbe7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00dbe7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map(ratio => {
                const y = svgDimensions.padding + ratio * (svgDimensions.height - svgDimensions.padding * 2);
                return (
                  <line
                    key={ratio}
                    x1={svgDimensions.padding}
                    y1={y}
                    x2={svgDimensions.width - svgDimensions.padding}
                    y2={y}
                    stroke={isDark ? 'rgba(132, 148, 149, 0.12)' : 'rgba(148, 163, 184, 0.15)'}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Gradient Area fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#equityGrad)" />
              )}

              {/* Benchmark Buy & Hold Dashed Line */}
              {benchmarkPath && (
                <path
                  d={benchmarkPath}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.75"
                />
              )}

              {/* Strategy Equity Line */}
              {strategyPath && (
                <path
                  d={strategyPath}
                  fill="none"
                  stroke="#00dbe7"
                  strokeWidth="2.5"
                />
              )}

              {/* Hover vertical crosshair */}
              {hoveredPoint && (
                (() => {
                  const idx = equityPoints.findIndex(p => p.time === hoveredPoint.time);
                  if (idx >= 0) {
                    const x = svgDimensions.padding + (idx / (equityPoints.length - 1)) * (svgDimensions.width - svgDimensions.padding * 2);
                    return (
                      <line
                        x1={x}
                        y1={svgDimensions.padding}
                        x2={x}
                        y2={svgDimensions.height - svgDimensions.padding}
                        stroke="#00dbe7"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    );
                  }
                  return null;
                })()
              )}
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant/70">
            <span>Start: {report.startDate} ({curSymbol}{report.metrics.initialCapital.toLocaleString()})</span>
            <span>Final: {report.endDate} ({curSymbol}{report.metrics.finalCapital.toLocaleString()})</span>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: COMPLETE TRADE LOG TABLE ── */}
      {viewTab === 'TRADES' && report && (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto max-h-[380px] rounded-xl border border-outline/20 custom-scrollbar">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-surface-container-low text-[10px] text-on-surface-variant uppercase tracking-wider sticky top-0 z-10 border-b border-outline/20">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Entry Date & Price</th>
                  <th className="p-2.5">Exit Date & Price</th>
                  <th className="p-2.5">Trigger</th>
                  <th className="p-2.5">Hold</th>
                  <th className="p-2.5">Gross PnL</th>
                  <th className="p-2.5">Friction</th>
                  <th className="p-2.5 text-right">Net Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10 bg-surface-container-lowest/80 text-[11px]">
                {filteredTrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-on-surface-variant">
                      No trades match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredTrades.map(trade => (
                    <tr key={trade.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="p-2.5 font-bold text-on-surface-variant">
                        {trade.tradeNumber}
                      </td>
                      <td className="p-2.5">
                        <span className="block text-on-surface font-semibold">{trade.entryDate}</span>
                        <span className="text-[10px] text-on-surface-variant">{curSymbol}{trade.entryPrice.toFixed(2)} &bull; {trade.quantity} shs</span>
                      </td>
                      <td className="p-2.5">
                        <span className="block text-on-surface font-semibold">{trade.exitDate}</span>
                        <span className="text-[10px] text-on-surface-variant">{curSymbol}{trade.exitPrice.toFixed(2)}</span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          trade.exitReason === 'TAKE_PROFIT'
                            ? 'bg-[#00e476]/15 text-[#00e476] border border-[#00e476]/30'
                            : trade.exitReason === 'STOP_LOSS'
                            ? 'bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/30'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {trade.exitReason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-2.5 text-on-surface-variant">
                        {trade.holdingDays}d
                      </td>
                      <td className="p-2.5">
                        <span className={trade.grossPnL >= 0 ? 'text-[#00e476]' : 'text-[#ff6b6b]'}>
                          {curSymbol}{trade.grossPnL.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-2.5 text-amber-400">
                        -{curSymbol}{trade.totalFriction.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          trade.netPnL >= 0
                            ? 'bg-[#00e476]/15 text-[#00e476]'
                            : 'bg-[#ff6b6b]/15 text-[#ff6b6b]'
                        }`}>
                          {trade.netPnL >= 0 ? '+' : ''}{trade.netPnLPct.toFixed(2)}%
                        </span>
                        <span className="block text-[10px] text-on-surface-variant mt-0.5">
                          {curSymbol}{trade.netPnL.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: LOCALIZED REGIONAL FRICTION & TAX BLUEPRINT ── */}
      {viewTab === 'FRICTION' && (
        <div className="flex flex-col gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline/20 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00dbe7]" />
                <span>Localized Regulatory Friction Profile: {marketRegion.toUpperCase()}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                {symbol}
              </span>
            </div>
            
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Unlike generic backtesters that simulate zero-friction fantasy returns, the SutharLabs Trading Suite incorporates statutory exchange duties, turnover levies, slippage, and transaction taxes tailored to each sovereignty.
            </p>

            {frictionPreview && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-outline/10 text-[11px]">
                <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline/15">
                  <span className="block text-[9px] text-on-surface-variant uppercase">Brokerage Fee</span>
                  <span className="font-bold text-on-surface">{curSymbol}{frictionPreview.brokerage.toFixed(2)}</span>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline/15">
                  <span className="block text-[9px] text-on-surface-variant uppercase">STT / Stamp Duty</span>
                  <span className="font-bold text-amber-400">{curSymbol}{frictionPreview.sttOrStampDuty.toFixed(2)}</span>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline/15">
                  <span className="block text-[9px] text-on-surface-variant uppercase">GST / Regulatory Fees</span>
                  <span className="font-bold text-on-surface">{curSymbol}{(frictionPreview.gstOrVat + frictionPreview.sebiOrSecFee).toFixed(2)}</span>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline/15">
                  <span className="block text-[9px] text-on-surface-variant uppercase">Effective Friction Rate</span>
                  <span className="font-bold text-[#00dbe7]">{frictionPreview.effectiveRatePct.toFixed(3)}%</span>
                </div>
              </div>
            )}

            {frictionPreview?.notes && frictionPreview.notes.length > 0 && (
              <div className="pt-2 text-[10px] text-on-surface-variant space-y-1">
                {frictionPreview.notes.map((note, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00dbe7]" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
