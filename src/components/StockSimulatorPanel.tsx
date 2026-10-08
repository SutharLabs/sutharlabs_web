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
  FastForward,
  Copy,
  Plus,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { IStrategy } from '../plugins/StockTracker/strategies/types';
import { PRESET_STRATEGIES } from '../plugins/StockTracker/strategies/presets';
import {
  EODPosition,
  EODSimulationReport,
  EODSimulationOptions,
  EODPortfolioStore,
  EODTradeExecution,
  SimulationRegistryEntry
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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1d');
  const [tradeLedgerFilter, setTradeLedgerFilter] = useState<'ALL' | 'EXITS' | 'ENTRIES'>('ALL');

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

  // ── Multi-Simulation Instances & Active Selection State ──────────────
  const [simulationsList, setSimulationsList] = useState<SimulationRegistryEntry[]>([]);
  const [selectedSimulationId, setSelectedSimulationId] = useState<string>(() => {
    try {
      return localStorage.getItem('sutharlabs_active_simulation_id') || 'default';
    } catch {
      return 'default';
    }
  });
  const [showNewSimModal, setShowNewSimModal] = useState<boolean>(false);
  const [newSimId, setNewSimId] = useState<string>('');
  const [newSimLabel, setNewSimLabel] = useState<string>('');
  const [newSimStrategyId, setNewSimStrategyId] = useState<string>('strat-ema-cross');
  const [newSimMarket, setNewSimMarket] = useState<string>('IN');
  const [newSimInitialCash, setNewSimInitialCash] = useState<number>(100000);
  const [newSimAllocation, setNewSimAllocation] = useState<number>(0.20);
  const [isCreatingSim, setIsCreatingSim] = useState<boolean>(false);
  const [copiedCronUrl, setCopiedCronUrl] = useState<boolean>(false);

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

  // Fetch all registered simulations from the backend
  const fetchSimulationsList = useCallback(async () => {
    try {
      const res = await fetch(`${STOCK_API}/simulator/simulations`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const list = [...data];
          if (!list.some(s => s.id === 'default')) {
            list.unshift({
              id: 'default',
              label: 'Default Paper Portfolio',
              market: 'IN',
              createdAt: new Date().toISOString(),
              totalRuns: 0,
              totalTradeRuns: 0
            });
          }
          setSimulationsList(list);
        }
      }
    } catch (err) {
      console.warn('[Simulator] Error fetching simulations list:', err);
    }
  }, []);

  useEffect(() => {
    fetchSimulationsList();
  }, [fetchSimulationsList]);

  // Fetch Current Portfolio & Simulation History from server for selectedSimulationId
  const fetchPortfolioAndHistory = useCallback(async (targetSimId?: string, silent: boolean = false) => {
    const simIdToFetch = targetSimId || selectedSimulationId || 'default';
    if (!silent) setIsLoadingPortfolio(true);
    try {
      const emailQuery = userEmail ? `&email=${encodeURIComponent(userEmail)}` : '';
      const [portRes, histRes] = await Promise.all([
        fetch(`${STOCK_API}/simulator/portfolio?simulationId=${encodeURIComponent(simIdToFetch)}${emailQuery}`).catch(() => null),
        fetch(`${STOCK_API}/simulator/history?simulationId=${encodeURIComponent(simIdToFetch)}${emailQuery}`).catch(() => null)
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
      if (!silent) setIsLoadingPortfolio(false);
    }
  }, [userEmail, selectedSimulationId]);

  useEffect(() => {
    fetchPortfolioAndHistory(selectedSimulationId);
  }, [fetchPortfolioAndHistory, selectedSimulationId]);

  // Periodic Auto-Sync: Automatically polls in the background every 30 seconds
  // so external Cron-Job.org trade executions reflect on the screen without needing manual clicks!
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPortfolioAndHistory(selectedSimulationId, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPortfolioAndHistory, selectedSimulationId]);

  const handleSelectSimulation = (simId: string) => {
    setSelectedSimulationId(simId);
    try {
      localStorage.setItem('sutharlabs_active_simulation_id', simId);
    } catch {}
    fetchPortfolioAndHistory(simId);
  };

  // Execute Trade Simulation Run (Single Step or Historical Replay)
  const handleRunSimulation = async () => {
    setIsRunningSim(true);
    setErrorMessage(null);

    try {
      const activeEntry = simulationsList.find(s => s.id === selectedSimulationId);
      const payload: any = {
        simulationId: selectedSimulationId,
        simulationLabel: activeEntry?.label || selectedSimulationId,
        strategyId: selectedStrategyId,
        capitalAllocationPct: allocationPct,
        trailingStopPct: enableTrailingStop ? trailingStopPct : undefined,
        market: effectiveMarket,
        marketRegion: effectiveMarket,
        timeframe: selectedTimeframe,
        interval: selectedTimeframe,
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
      await Promise.all([fetchSimulationsList(), fetchPortfolioAndHistory(selectedSimulationId)]);
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
        body: JSON.stringify({ positionId, simulationId: selectedSimulationId })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to close position (${res.status})`);
      }

      const result = await res.json();
      if (result.portfolio) {
        setPortfolio(result.portfolio);
      } else {
        await fetchPortfolioAndHistory(selectedSimulationId);
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
            marketRegion: effectiveMarket,
            simulationId: selectedSimulationId
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
          const res = await fetch(`${url}?initialCapital=100000&marketRegion=${encodeURIComponent(effectiveMarket)}&simulationId=${encodeURIComponent(selectedSimulationId)}`, {
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
    fetchSimulationsList();
  };

  // Create a brand new independent simulation instance
  const handleCreateSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSimId.trim()) return;
    const cleanId = newSimId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    setIsCreatingSim(true);
    setErrorMessage(null);
    try {
      const payload = {
        simulationId: cleanId,
        simulationLabel: newSimLabel.trim() || cleanId,
        strategyId: newSimStrategyId,
        market: newSimMarket,
        forcedCapital: newSimInitialCash || 100000,
        capitalAllocationPct: newSimAllocation || 0.20,
        userEmail
      };
      const res = await fetch(`${STOCK_API}/simulator/run-eod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to initialize simulation instance');
      }
      setSelectedSimulationId(cleanId);
      try {
        localStorage.setItem('sutharlabs_active_simulation_id', cleanId);
      } catch {}
      setShowNewSimModal(false);
      setNewSimId('');
      setNewSimLabel('');
      await fetchSimulationsList();
      await fetchPortfolioAndHistory(cleanId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create simulation.');
    } finally {
      setIsCreatingSim(false);
    }
  };

  // Delete custom simulation
  const handleDeleteSimulation = async (simId: string) => {
    if (simId === 'default') return;
    if (!window.confirm(`Delete simulation instance "${simId}"? This will remove its registry entry.`)) return;
    try {
      const res = await fetch(`${STOCK_API}/simulator/simulations/${simId}`, { method: 'DELETE' });
      if (res.ok) {
        handleSelectSimulation('default');
        await fetchSimulationsList();
      }
    } catch (err) {
      console.warn('Failed to delete simulation:', err);
    }
  };

  // Copy full Cron-Job.org URL
  const handleCopyCronUrl = (simId: string) => {
    let origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.sutharlabs.com';
    if (origin.includes('sutharlabs.com') && !origin.includes('www.')) {
      origin = origin.replace('sutharlabs.com', 'www.sutharlabs.com');
    }
    const cronUrl = `${origin}${STOCK_API}/simulator/run-eod?simulationId=${encodeURIComponent(simId)}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cronUrl).then(() => {
        setCopiedCronUrl(true);
        setTimeout(() => setCopiedCronUrl(false), 2500);
      });
    }
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

    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 1.0;

    let kellyPct = 0;
    if (totalClosedTradesCount >= 3 && winLossRatio > 0) {
      const w = winRatePct / 100;
      const k = w - ((1 - w) / winLossRatio);
      kellyPct = Math.max(0, k * 100);
    }

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
      profitFactor,
      winLossRatio,
      kellyPct,
      avgWin,
      avgLoss
    };
  }, [portfolio]);

  // Market Session State (Checking live trading hours for NSE/BSE, US, EU)
  const marketSession = useMemo(() => {
    const norm = (effectiveMarket || 'IN').toUpperCase();
    const now = new Date();
    if (norm === 'IN') {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        weekday: 'short'
      });
      const parts = formatter.formatToParts(now);
      const weekday = parts.find(p => p.type === 'weekday')?.value;
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      const totalMinutes = hour * 60 + minute;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} IST`;
      if (weekday === 'Sat' || weekday === 'Sun') {
        return { isOpen: false, name: 'NSE/BSE (India)', status: 'Weekend Closed', hours: '09:15 - 15:30 IST', timeStr };
      }
      if (totalMinutes < 9 * 60 + 15) {
        return { isOpen: false, name: 'NSE/BSE (India)', status: 'Pre-Market (Opens 09:15)', hours: '09:15 - 15:30 IST', timeStr };
      }
      if (totalMinutes >= 15 * 60 + 30) {
        return { isOpen: false, name: 'NSE/BSE (India)', status: 'Market Closed (Closed at 15:30)', hours: '09:15 - 15:30 IST', timeStr };
      }
      return { isOpen: true, name: 'NSE/BSE (India)', status: 'Live Session Open', hours: '09:15 - 15:30 IST', timeStr };
    }
    if (norm === 'US') {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        weekday: 'short'
      });
      const parts = formatter.formatToParts(now);
      const weekday = parts.find(p => p.type === 'weekday')?.value;
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      const totalMinutes = hour * 60 + minute;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ET`;
      if (weekday === 'Sat' || weekday === 'Sun') {
        return { isOpen: false, name: 'NYSE/NASDAQ (US)', status: 'Weekend Closed', hours: '09:30 - 16:00 ET', timeStr };
      }
      if (totalMinutes < 9 * 60 + 30) {
        return { isOpen: false, name: 'NYSE/NASDAQ (US)', status: 'Pre-Market (Opens 09:30)', hours: '09:30 - 16:00 ET', timeStr };
      }
      if (totalMinutes >= 16 * 60) {
        return { isOpen: false, name: 'NYSE/NASDAQ (US)', status: 'Market Closed (Closed at 16:00)', hours: '09:30 - 16:00 ET', timeStr };
      }
      return { isOpen: true, name: 'NYSE/NASDAQ (US)', status: 'Live Session Open', hours: '09:30 - 16:00 ET', timeStr };
    }
    return { isOpen: true, name: 'Global Market', status: 'Session Active', hours: '24/7', timeStr: '' };
  }, [effectiveMarket]);

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

  const formatTimeWithSeconds = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Unified Executed & Completed Trades Ledger with strict single-instance deduplication
  const allLedgerTrades = useMemo(() => {
    const closedMap = new Map<string, any>();
    const buyEntriesMap = new Map<string, any>();

    // 1. All explicitly closed trades in portfolio
    (portfolio?.closedTrades || []).forEach(t => {
      if (t?.id) closedMap.set(t.id, t);
    });

    // 2. Closed trades reported in historical/cron simulation runs
    (historyRuns || []).forEach(run => {
      (run.closedPositions || []).forEach(t => {
        if (t?.id && !closedMap.has(t.id)) closedMap.set(t.id, t);
      });
      // Buy entries from runs - deduplicate by symbol so 1-minute crons keep only 1 instance
      (run.openedPositions || []).forEach(t => {
        if (t?.symbol && !buyEntriesMap.has(t.symbol)) {
          buyEntriesMap.set(t.symbol, t);
        }
      });
    });

    // 3. For any current live open positions in portfolio,
    // ensure their entry fill record is recorded (single instance per symbol)
    (portfolio?.positions || []).forEach(pos => {
      if (!buyEntriesMap.has(pos.symbol)) {
        buyEntriesMap.set(pos.symbol, {
          id: `entry-${pos.id}`,
          type: 'BUY_ENTRY',
          symbol: pos.symbol,
          companyName: pos.name,
          shares: pos.shares,
          price: pos.entryPrice,
          entryPrice: pos.entryPrice,
          entryDate: pos.entryDate,
          entryTimestamp: pos.entryTimestamp,
          currency: pos.currency,
          currencySymbol: pos.currencySymbol,
          realizedPnL: 0,
          realizedPnLPct: 0,
          friction: 0,
          reason: 'Live Position Entry Fill',
          executedAt: pos.entryTimestamp || pos.entryDate,
          isOpen: true
        });
      }
    });

    // Combine unique closed trades and unique buy entries
    const combined = [...Array.from(closedMap.values()), ...Array.from(buyEntriesMap.values())];

    const list = combined.sort((a, b) => {
      const timeA = new Date(a.exitTimestamp || a.executedAt || a.entryTimestamp || 0).getTime();
      const timeB = new Date(b.exitTimestamp || b.executedAt || b.entryTimestamp || 0).getTime();
      return timeB - timeA;
    });

    return list;
  }, [portfolio?.closedTrades, portfolio?.positions, historyRuns]);

  const filteredLedgerTrades = useMemo(() => {
    if (tradeLedgerFilter === 'EXITS') {
      return allLedgerTrades.filter(t => t.type !== 'BUY_ENTRY');
    }
    if (tradeLedgerFilter === 'ENTRIES') {
      return allLedgerTrades.filter(t => t.type === 'BUY_ENTRY');
    }
    return allLedgerTrades;
  }, [allLedgerTrades, tradeLedgerFilter]);

  return (
    <div className="flex flex-col gap-6 text-xs font-mono">
      {/* ── Top Control & Setup Card ── */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline/20 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#00e476]" />
                Trade Simulator & Portfolio Engine
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00e476]/10 text-[#00e476] text-[10px] font-bold border border-[#00e476]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e476] animate-pulse"></span>
                Live Auto-Sync (30s)
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                marketSession.isOpen
                  ? 'bg-[#00e476]/10 text-[#00e476] border-[#00e476]/30'
                  : 'bg-amber-400/10 text-amber-400 border-amber-400/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${marketSession.isOpen ? 'bg-[#00e476] animate-pulse' : 'bg-amber-400'}`}></span>
                {marketSession.name}: {marketSession.status}
              </span>
            </div>
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
                fetchPortfolioAndHistory(selectedSimulationId, false);
              }}
              disabled={isLoadingPortfolio}
              className="px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline/30 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 transition-all text-xs"
              title="Refresh simulator data now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPortfolio ? 'animate-spin text-[#00e476]' : 'text-on-surface-variant'}`} />
              <span>{isLoadingPortfolio ? 'Syncing...' : 'Sync Now'}</span>
            </button>

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

        {/* ── Active Simulation Instance Switcher & Manager Bar ── */}
        <div className="p-3.5 rounded-xl bg-surface-container border border-outline/20 flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00e476]" />
                Simulation Instance:
              </span>
              <select
                value={selectedSimulationId}
                onChange={(e) => handleSelectSimulation(e.target.value)}
                disabled={isRunningSim || isLoadingPortfolio}
                className="bg-surface-container-lowest border border-outline/30 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-on-surface focus:outline-none focus:border-[#00e476] cursor-pointer"
              >
                {simulationsList.map((sim) => (
                  <option key={sim.id} value={sim.id}>
                    {sim.label} [{sim.id}] • {sim.market || 'IN'} ({sim.totalRuns ?? 0} runs)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowNewSimModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-[#00e476]/15 hover:bg-[#00e476]/25 text-[#00e476] border border-[#00e476]/30 text-xs font-bold cursor-pointer flex items-center gap-1 transition-all"
                title="Create a new simultaneous simulation instance with independent inputs and portfolio"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Simulation</span>
              </button>

              {selectedSimulationId !== 'default' && (
                <button
                  type="button"
                  onClick={() => handleDeleteSimulation(selectedSimulationId)}
                  className="px-2 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold cursor-pointer flex items-center gap-1 transition-all"
                  title="Delete this simulation from tracking"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyCronUrl(selectedSimulationId)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-[#00dbe7]/20 border border-outline/30 text-xs font-mono text-on-surface hover:text-[#00dbe7] cursor-pointer flex items-center gap-1.5 transition-all"
                title="Copy the exact URL to paste into Cron-Job.org to ping this specific simulation every minute"
              >
                {copiedCronUrl ? <CheckCheck className="w-3.5 h-3.5 text-[#00e476]" /> : <Copy className="w-3.5 h-3.5 text-[#00dbe7]" />}
                <span>{copiedCronUrl ? 'Cron URL Copied!' : 'Copy Cron-Job URL'}</span>
              </button>
            </div>
          </div>

          {!marketSession.isOpen && simulationMode === 'SINGLE_STEP' && (
            <div className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] flex items-center gap-2 font-sans">
              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              <span>
                <strong>Market Closed ({marketSession.timeStr || marketSession.hours}):</strong> Live positions and trailing stops are actively tracked & retained in database. Algorithmic entries are strictly paused until market open ({marketSession.hours}).
              </span>
            </div>
          )}
        </div>

        {/* ── Inline Creation Panel for New Simulation ── */}
        {showNewSimModal && (
          <form
            onSubmit={handleCreateSimulation}
            className="p-4 rounded-xl bg-surface-container-high border border-[#00e476]/30 flex flex-col gap-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#00e476] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Create New Simultaneous Simulation Instance
              </span>
              <button
                type="button"
                onClick={() => setShowNewSimModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer text-xs"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                  Simulation ID (alphanumeric slug)
                </label>
                <input
                  type="text"
                  placeholder="e.g. breakout_us_fast"
                  required
                  value={newSimId}
                  onChange={(e) => setNewSimId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-2.5 py-1.5 font-mono text-on-surface focus:outline-none focus:border-[#00e476]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                  Display Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. US Tech Breakout"
                  value={newSimLabel}
                  onChange={(e) => setNewSimLabel(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-[#00e476]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                  Market Universe
                </label>
                <select
                  value={newSimMarket}
                  onChange={(e) => setNewSimMarket(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-2.5 py-1.5 font-mono text-on-surface focus:outline-none focus:border-[#00e476] cursor-pointer"
                >
                  <option value="IN">Indian Equities (NSE ₹)</option>
                  <option value="US">US Equities ($)</option>
                  <option value="EU">European Equities (€)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                  Initial Cash
                </label>
                <input
                  type="number"
                  min="5000"
                  step="5000"
                  value={newSimInitialCash}
                  onChange={(e) => setNewSimInitialCash(parseFloat(e.target.value) || 100000)}
                  className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-2.5 py-1.5 font-mono text-on-surface focus:outline-none focus:border-[#00e476]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline/10">
              <button
                type="button"
                onClick={() => setShowNewSimModal(false)}
                className="px-3 py-1 rounded-lg bg-surface-container border border-outline/20 text-on-surface-variant hover:text-on-surface cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingSim || !newSimId.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#00e476] text-[#002022] font-bold hover:brightness-110 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCreatingSim ? 'Initializing...' : 'Create & Activate'}
              </button>
            </div>
          </form>
        )}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-outline/10">
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

          {/* Candle Timeframe Selector (1m, 5m, 15m, 1h, 4h, 1d) */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#00e476]" />
              Candle Timeframe
            </label>
            <select
              value={selectedTimeframe}
              onChange={e => setSelectedTimeframe(e.target.value as any)}
              disabled={isRunningSim}
              className="w-full bg-surface-container-lowest border border-outline/30 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00e476] cursor-pointer"
            >
              <option value="1d">1 Day (EOD Daily • Default)</option>
              <option value="4h">4 Hours (Intraday Swing)</option>
              <option value="1h">1 Hour (Intraday Trend)</option>
              <option value="15m">15 Minutes (Momentum)</option>
              <option value="5m">5 Minutes (Intraday Scalp)</option>
              <option value="1m">1 Minute (Ultra Fast Live)</option>
            </select>
          </div>

          {/* Position Sizing / Allocation Slider */}
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Scale className="w-3 h-3 text-[#00e476]" />
                Capital / Trade
              </span>
              <span className="text-[#00e476] font-bold">{(allocationPct * 100).toFixed(0)}%</span>
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
                Trailing Stop
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
              <span className="text-[10px] text-on-surface-variant font-sans">
                % below peak
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
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Replay Range:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { label: '⚡ Today (Intraday)', days: 0 },
                    { label: '1D', days: 1 },
                    { label: '7D', days: 7 },
                    { label: '30D', days: 30 },
                    { label: '60D', days: 60 },
                    { label: '90D', days: 90 },
                    { label: '180D', days: 180 }
                  ].map(p => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => {
                        setReplayPresetDays(p.days);
                        const today = new Date().toISOString().slice(0, 10);
                        if (p.days === 0) {
                          setCustomStartDate(today);
                          setCustomEndDate(today);
                          if (selectedTimeframe === '1d') setSelectedTimeframe('15m');
                        } else {
                          const start = new Date(Date.now() - p.days * 86400000).toISOString().slice(0, 10);
                          setCustomStartDate(start);
                          setCustomEndDate(today);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                        replayPresetDays === p.days
                          ? 'bg-[#00dbe7]/20 border-[#00dbe7] text-[#00dbe7]'
                          : 'bg-surface-container-lowest border-outline/20 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 ml-1">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => {
                      setCustomStartDate(e.target.value);
                      setReplayPresetDays(-1);
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

              {(replayPresetDays === 0 || customStartDate === customEndDate) && (
                <div className="text-[11px] text-[#00dbe7] font-sans flex items-center gap-1.5 bg-[#00dbe7]/10 px-2.5 py-1 rounded-lg border border-[#00dbe7]/20 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00dbe7] animate-pulse" />
                  <span>
                    Intraday Replay Active: Simulates {customStartDate || 'today'} bar-by-bar from market opening (09:15 IST) up to current execution time (or session close if executed after-hours).
                  </span>
                </div>
              )}
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
            <span>Completed & Executed Trades Ledger</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#00dbe7]/15 text-[#00dbe7]">
              {allLedgerTrades.length}
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
                                <span>• {formatTimeWithSeconds(pos.entryTimestamp)}</span>
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

        {/* ── TAB 2: COMPLETED & EXECUTED TRADES LEDGER ── */}
        {simulatorTab === 'CLOSED_TRADES' && (
          <div>
            {/* Filter Toolbar */}
            <div className="p-3 bg-surface-container-lowest border-b border-outline/10 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-lg border border-outline/15 text-xs">
                <button
                  type="button"
                  onClick={() => setTradeLedgerFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    tradeLedgerFilter === 'ALL'
                      ? 'bg-[#00dbe7] text-[#002022] shadow'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All Activity ({allLedgerTrades.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTradeLedgerFilter('EXITS')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    tradeLedgerFilter === 'EXITS'
                      ? 'bg-[#00e476] text-[#002022] shadow'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Closed Exits ({allLedgerTrades.filter(t => t.type !== 'BUY_ENTRY').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTradeLedgerFilter('ENTRIES')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    tradeLedgerFilter === 'ENTRIES'
                      ? 'bg-purple-400 text-[#002022] shadow'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Buy Fills ({allLedgerTrades.filter(t => t.type === 'BUY_ENTRY').length})
                </button>
              </div>

              <span className="text-[11px] text-on-surface-variant">
                Showing {filteredLedgerTrades.length} of {allLedgerTrades.length} trade records
              </span>
            </div>

            {filteredLedgerTrades.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                <History className="w-8 h-8 opacity-40 text-[#00dbe7]" />
                <p className="font-sans font-bold text-sm">No trades matching this filter.</p>
                <p className="text-xs text-on-surface-variant max-w-md">
                  Trades will appear here as soon as positions are purchased, hit Take-Profit targets, hit Stop-Loss triggers, or are closed manually.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest/80 text-[10px] text-on-surface-variant uppercase tracking-wider border-b border-outline/10">
                      <th className="py-3 px-4 font-bold">Trade & Asset</th>
                      <th className="py-3 px-3 font-bold">Type / Order</th>
                      <th className="py-3 px-3 font-bold">Entry Date & Time</th>
                      <th className="py-3 px-3 font-bold">Exit Date & Time</th>
                      <th className="py-3 px-3 font-bold text-center">Holding Period</th>
                      <th className="py-3 px-3 font-bold text-right">Shares</th>
                      <th className="py-3 px-3 font-bold text-right">Entry Price</th>
                      <th className="py-3 px-3 font-bold text-right">Exit / LTP Price</th>
                      <th className="py-3 px-3 font-bold text-right">Realized PnL</th>
                      <th className="py-3 px-4 font-bold text-center">Strategy / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10 text-xs font-mono">
                    {filteredLedgerTrades.map(trade => {
                      const isBuy = trade.type === 'BUY_ENTRY';
                      const isProfit = trade.realizedPnL >= 0;
                      const tradeSign = getAssetCurrencySymbol(trade.symbol, undefined, (trade as any).currencySymbol);

                      return (
                        <tr key={trade.id} className="hover:bg-surface-container/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-on-surface">{trade.symbol}</span>
                            <div className="text-[10px] text-on-surface-variant truncate max-w-[130px]">
                              {trade.companyName || trade.symbol}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block max-w-[150px] truncate ${
                                trade.type === 'BUY_ENTRY'
                                  ? 'bg-[#00dbe7]/15 text-[#00dbe7]'
                                  : trade.type === 'TAKE_PROFIT'
                                  ? 'bg-[#00e476]/15 text-[#00e476]'
                                  : trade.type === 'STOP_LOSS'
                                  ? 'bg-rose-500/15 text-rose-400'
                                  : trade.type === 'TRAILING_STOP_EXIT'
                                  ? 'bg-amber-400/15 text-amber-300'
                                  : 'bg-purple-500/15 text-purple-400'
                              }`}
                              title={trade.reason}
                            >
                              {trade.type === 'BUY_ENTRY' ? 'BUY ORDER FILL' : trade.type.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-on-surface">
                              {trade.entryDate || formatDateTime(trade.entryTimestamp || trade.executedAt)}
                            </div>
                            <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                              <Clock className="w-3 h-3 opacity-60" />
                              <span>{formatTimeWithSeconds(trade.entryTimestamp || trade.executedAt)}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {isBuy ? (
                              <span className="text-[11px] text-[#00e476] font-sans font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00e476] animate-pulse" />
                                Active in Portfolio
                              </span>
                            ) : (
                              <>
                                <div className="font-bold text-on-surface">
                                  {trade.exitDate || formatDateTime(trade.exitTimestamp || trade.executedAt)}
                                </div>
                                <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                  <Clock className="w-3 h-3 opacity-60" />
                                  <span>{formatTimeWithSeconds(trade.exitTimestamp || trade.executedAt)}</span>
                                </div>
                              </>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-bold text-[10px]">
                              {isBuy ? 'Holding' : (trade.holdingDays ? `${trade.holdingDays}d` : '1d')}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-on-surface">
                            {trade.shares}
                          </td>

                          <td className="py-3 px-3 text-right text-on-surface">
                            {tradeSign}{trade.entryPrice ? trade.entryPrice.toFixed(2) : (trade.price ? trade.price.toFixed(2) : '—')}
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-on-surface">
                            {isBuy ? '—' : `${tradeSign}${(trade.exitPrice || trade.price || 0).toFixed(2)}`}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {isBuy ? (
                              <span className="text-[11px] text-on-surface-variant italic font-sans">
                                Floating / Open
                              </span>
                            ) : (
                              <>
                                <div className={`font-bold ${isProfit ? 'text-[#00e476]' : 'text-rose-400'}`}>
                                  {isProfit ? '+' : ''}{tradeSign}{trade.realizedPnL.toFixed(2)}
                                </div>
                                <div className={`text-[10px] ${isProfit ? 'text-[#00e476]' : 'text-rose-400'}`}>
                                  {isProfit ? '+' : ''}{trade.realizedPnLPct.toFixed(2)}%
                                </div>
                              </>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="text-[10px] text-on-surface max-w-[200px] truncate mx-auto" title={trade.reason}>
                              {trade.reason || 'Trade Execution'}
                            </div>
                            {trade.friction > 0 && (
                              <div className="text-[9px] text-on-surface-variant mt-0.5">
                                Friction/STT: {tradeSign}{trade.friction.toFixed(2)}
                              </div>
                            )}
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
                              {run.hadTrades ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00e476]/15 text-[#00e476] font-bold">
                                  Trade Executed ({run.totalTradesExecuted})
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-medium">
                                  Equity Snapshot
                                </span>
                              )}
                              {run.simulationId && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono">
                                  sim: {run.simulationId}
                                </span>
                              )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Win Rate</span>
                <div className="text-xl font-bold font-mono text-[#00e476] mt-1">
                  {portfolioMetrics.winRatePct.toFixed(1)}%
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  {portfolioMetrics.closedTradesCount} closed trades
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Profit Factor</span>
                <div className="text-xl font-bold font-mono text-[#00dbe7] mt-1">
                  {portfolioMetrics.profitFactor.toFixed(2)}
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  Gross Profit / Loss
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Win / Loss Ratio</span>
                <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                  {portfolioMetrics.winLossRatio.toFixed(2)}x
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  Avg Win vs Avg Loss
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Kelly Optimal Risk</span>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {portfolioMetrics.kellyPct.toFixed(1)}%
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  Kelly leverage fraction
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Taxes & Frictions</span>
                <div className="text-xl font-bold font-mono text-on-surface mt-1">
                  {currencySign}{(portfolio?.totalFrictionPaid || 0).toFixed(2)}
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  STT, GST, Exchange fees
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline/20">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold">Capital In Play</span>
                <div className="text-xl font-bold font-mono text-[#00e476] mt-1">
                  {((portfolioMetrics.positionsValue / (portfolioMetrics.totalEquity || 1)) * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  {currencySign}{portfolioMetrics.positionsValue.toFixed(0)} invested
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
