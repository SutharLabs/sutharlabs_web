import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  getQuote,
  getHistory,
  normalizeTicker,
  formatTickerDisplay,
  MARKET_UNIVERSES
} from "../../StockAnalyzer/index.js";
import { getStrategyById } from "../strategies/store.js";
import { PRESET_STRATEGIES } from "../strategies/presets.js";
import { evaluateStrategy } from "../strategies/engine.js";
import { calculateRegionalFriction, detectMarketRegion } from "../backtest/friction.js";
import {
  EODPosition,
  EODTradeExecution,
  EODTrailingStopUpdate,
  EODSimulationReport,
  EODSimulationOptions
} from "./types.js";

const SIMULATOR_DATA_DIR = path.join(process.cwd(), "data");
const EOD_PORTFOLIO_PATH = path.join(SIMULATOR_DATA_DIR, "eod_portfolio.json");
const EOD_HISTORY_PATH = path.join(SIMULATOR_DATA_DIR, "eod_simulation_history.json");

interface PersistedEODState {
  cash: number;
  initialCash: number;
  positions: EODPosition[];
  lastRunDate?: string;
  totalRealizedPnL: number;
}

function ensureSimulatorStore(): PersistedEODState {
  if (!fs.existsSync(SIMULATOR_DATA_DIR)) {
    fs.mkdirSync(SIMULATOR_DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(EOD_PORTFOLIO_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(EOD_PORTFOLIO_PATH, "utf8"));
      return data;
    } catch {
      // Fall through to initial state
    }
  }

  const initialState: PersistedEODState = {
    cash: 100000,
    initialCash: 100000,
    positions: [],
    lastRunDate: undefined,
    totalRealizedPnL: 0
  };
  fs.writeFileSync(EOD_PORTFOLIO_PATH, JSON.stringify(initialState, null, 2), "utf8");
  return initialState;
}

function saveSimulatorStore(state: PersistedEODState) {
  fs.writeFileSync(EOD_PORTFOLIO_PATH, JSON.stringify(state, null, 2), "utf8");
}

function appendHistoryReport(report: EODSimulationReport) {
  let history: EODSimulationReport[] = [];
  if (fs.existsSync(EOD_HISTORY_PATH)) {
    try {
      history = JSON.parse(fs.readFileSync(EOD_HISTORY_PATH, "utf8"));
    } catch {}
  }
  history.unshift(report);
  if (history.length > 50) history = history.slice(0, 50); // Keep last 50 runs
  fs.writeFileSync(EOD_HISTORY_PATH, JSON.stringify(history, null, 2), "utf8");
}

export function getEODHistory(): EODSimulationReport[] {
  if (fs.existsSync(EOD_HISTORY_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(EOD_HISTORY_PATH, "utf8"));
    } catch {}
  }
  return [];
}

export function getEODPortfolio(): PersistedEODState {
  return ensureSimulatorStore();
}

/**
 * Executes the Daily End-of-Day (EOD) Batch Simulation Run
 */
export async function runEODSimulation(options: EODSimulationOptions = {}): Promise<EODSimulationReport> {
  const store = ensureSimulatorStore();
  if (options.forcedCapital && options.forcedCapital > 0) {
    store.cash = options.forcedCapital;
    store.initialCash = options.forcedCapital;
  }

  const allocationPct = options.allocationPct || 0.15; // 15% per trade default
  const trailingStopPct = options.trailingStopPct || 3.5; // 3.5% trailing stop default

  // 1. Resolve active strategy
  let strategy = options.strategyId ? getStrategyById(options.strategyId) : undefined;
  if (!strategy) {
    strategy = PRESET_STRATEGIES.find(p => p.id === "strat-ema-cross") || PRESET_STRATEGIES[0];
  }

  // 2. Resolve tracked watchlist assets for EOD evaluation
  const trackedSymbols: Array<{ symbol: string; market: string }> = [];
  if (options.watchlistSymbols && options.watchlistSymbols.length > 0) {
    options.watchlistSymbols.forEach(s => trackedSymbols.push({ symbol: s, market: detectMarketRegion(s) }));
  } else {
    // Default to Indian NIFTY benchmarks + US Top Tech leaders
    const universeIN = (MARKET_UNIVERSES as any)["IN"]?.stocks || [];
    const universeUS = (MARKET_UNIVERSES as any)["US"]?.stocks || [];
    universeIN.slice(0, 8).forEach((s: any) => trackedSymbols.push({ symbol: s.symbol, market: "IN" }));
    universeUS.slice(0, 6).forEach((s: any) => trackedSymbols.push({ symbol: s.symbol, market: "US" }));
  }

  const closedTrades: EODTradeExecution[] = [];
  const openedTrades: EODTradeExecution[] = [];
  const updatedTrailingStops: EODTrailingStopUpdate[] = [];

  const startingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
  const simDate = new Date().toISOString().slice(0, 10);

  // 3. Step A: Manage Existing Open Positions against Daily Candle High/Low
  const remainingPositions: EODPosition[] = [];

  for (const pos of store.positions) {
    try {
      const region = detectMarketRegion(pos.symbol);
      const historyRes = await getHistory(pos.symbol, "1Y", "1d", region).catch(() => null);
      const candles = (historyRes as any)?.candles || [];
      if (!candles || candles.length === 0) {
        remainingPositions.push(pos);
        continue;
      }

      const lastCandle = candles[candles.length - 1];
      const { high, low, close } = lastCandle;
      pos.currentPrice = close;

      let closed = false;
      let exitPrice = close;
      let exitReason = "";
      let exitType: EODTradeExecution["type"] = "TAKE_PROFIT";

      // Check Take Profit Hit
      if (high >= pos.takeProfit) {
        closed = true;
        exitPrice = pos.takeProfit;
        exitReason = `Take-Profit target hit at ${exitPrice.toFixed(2)} (High: ${high.toFixed(2)})`;
        exitType = "TAKE_PROFIT";
      }
      // Check Stop Loss Hit
      else if (low <= pos.stopLoss) {
        closed = true;
        exitPrice = pos.stopLoss;
        exitReason = `Stop-Loss triggered at ${exitPrice.toFixed(2)} (Low: ${low.toFixed(2)})`;
        exitType = "STOP_LOSS";
      }

      if (closed) {
        const region = detectMarketRegion(pos.symbol);
        const friction = calculateRegionalFriction({
          region,
          side: "SELL",
          price: exitPrice,
          quantity: pos.shares
        });

        const grossProceeds = pos.shares * exitPrice;
        const netProceeds = grossProceeds - friction.totalFriction;
        const costBasis = pos.shares * pos.entryPrice;
        const realizedPnL = netProceeds - costBasis;
        const realizedPnLPct = costBasis > 0 ? (realizedPnL / costBasis) * 100 : 0;

        store.cash += netProceeds;
        store.totalRealizedPnL += realizedPnL;

        closedTrades.push({
          id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
          type: exitType,
          symbol: pos.symbol,
          companyName: pos.name,
          shares: pos.shares,
          price: parseFloat(exitPrice.toFixed(2)),
          realizedPnL: parseFloat(realizedPnL.toFixed(2)),
          realizedPnLPct: parseFloat(realizedPnLPct.toFixed(2)),
          friction: parseFloat(friction.totalFriction.toFixed(2)),
          reason: exitReason,
          executedAt: new Date().toISOString()
        });
      } else {
        // Position remains open: Check Trailing Stop Ratchet
        if (close > pos.highestPriceSinceEntry) {
          const oldStop = pos.stopLoss;
          const newStop = Math.max(oldStop, parseFloat((close * (1 - trailingStopPct / 100)).toFixed(2)));
          if (newStop > oldStop) {
            pos.stopLoss = newStop;
            pos.highestPriceSinceEntry = close;
            updatedTrailingStops.push({
              symbol: pos.symbol,
              oldStop,
              newStop,
              highPrice: close
            });
          }
        }
        pos.unrealizedPnL = parseFloat(((pos.currentPrice - pos.entryPrice) * pos.shares).toFixed(2));
        pos.unrealizedPnLPct = pos.entryPrice > 0 ? parseFloat((((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2)) : 0;
        remainingPositions.push(pos);
      }
    } catch (err) {
      console.warn(`[EOD Simulator] Error evaluating open position ${pos.symbol}:`, err);
      remainingPositions.push(pos);
    }
  }

  store.positions = remainingPositions;

  // 4. Step B: Scan Tracked Watchlist Assets for New EOD Entries
  for (const item of trackedSymbols) {
    // Avoid double entries in the same symbol
    if (store.positions.some(p => p.symbol === item.symbol)) continue;

    try {
      const normSym = normalizeTicker(item.symbol, item.market);
      const [quote, historyRes] = await Promise.all([
        getQuote(normSym, item.market).catch(() => null),
        getHistory(normSym, "1Y", "1d", item.market).catch(() => null)
      ]);
      const candles = (historyRes as any)?.candles || [];

      if (!candles || candles.length < 20) continue;

      const signal = evaluateStrategy(strategy, candles, quote, {});
      if (signal.action === "BUY" && signal.confidence >= 0.55) {
        const lastCandle = candles[candles.length - 1];
        const entryPrice = lastCandle.close;

        // Position sizing: allocate allocationPct of available cash
        const maxCapitalForTrade = store.cash * allocationPct;
        const shares = Math.floor(maxCapitalForTrade / entryPrice);

        if (shares > 0 && maxCapitalForTrade >= entryPrice) {
          const region = detectMarketRegion(normSym);
          const friction = calculateRegionalFriction({
            region,
            side: "BUY",
            price: entryPrice,
            quantity: shares
          });

          const totalCost = (shares * entryPrice) + friction.totalFriction;
          if (store.cash >= totalCost) {
            store.cash -= totalCost;

            const stopLoss = signal.stopLoss || parseFloat((entryPrice * 0.95).toFixed(2));
            const takeProfit = signal.targetPrice || (signal as any).takeProfit || parseFloat((entryPrice * 1.10).toFixed(2));

            const newPos: EODPosition = {
              id: `pos-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
              symbol: normSym,
              name: quote?.name || formatTickerDisplay(normSym).cleanSymbol,
              market: item.market,
              shares,
              entryPrice: parseFloat(entryPrice.toFixed(2)),
              currentPrice: parseFloat(entryPrice.toFixed(2)),
              stopLoss,
              takeProfit,
              highestPriceSinceEntry: entryPrice,
              unrealizedPnL: 0,
              unrealizedPnLPct: 0,
              entryDate: simDate,
              status: "OPEN"
            };

            store.positions.push(newPos);

            openedTrades.push({
              id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
              type: "BUY_ENTRY",
              symbol: normSym,
              companyName: newPos.name,
              shares,
              price: parseFloat(entryPrice.toFixed(2)),
              realizedPnL: 0,
              realizedPnLPct: 0,
              friction: parseFloat(friction.totalFriction.toFixed(2)),
              reason: (signal.reasoning && signal.reasoning.length > 0) ? signal.reasoning.join("; ") : `Automated EOD Entry based on ${strategy.name}`,
              executedAt: new Date().toISOString()
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[EOD Simulator] Error evaluating entry on ${item.symbol}:`, err);
    }
  }

  // 5. Finalize EOD Metrics & Ledger
  store.lastRunDate = simDate;
  saveSimulatorStore(store);

  const endingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
  const netDailyPnL = endingCapital - startingCapital;
  const netDailyPnLPct = startingCapital > 0 ? (netDailyPnL / startingCapital) * 100 : 0;

  const digest = `EOD Batch Simulation completed for ${simDate}. Positions closed: ${closedTrades.length}, New positions: ${openedTrades.length}, Trailing stops raised: ${updatedTrailingStops.length}. Daily PnL: ${netDailyPnL >= 0 ? '+' : ''}${netDailyPnL.toFixed(2)} (${netDailyPnLPct.toFixed(2)}%). Total Equity: ${endingCapital.toFixed(2)}.`;

  const report: EODSimulationReport = {
    id: `eod-run-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    simulatedDate: simDate,
    executionTimestamp: new Date().toISOString(),
    strategyId: strategy.id,
    strategyName: strategy.name,
    startingCapital: parseFloat(startingCapital.toFixed(2)),
    endingCapital: parseFloat(endingCapital.toFixed(2)),
    netDailyPnL: parseFloat(netDailyPnL.toFixed(2)),
    netDailyPnLPct: parseFloat(netDailyPnLPct.toFixed(2)),
    totalOpenPositions: store.positions.length,
    totalTradesExecuted: closedTrades.length + openedTrades.length,
    closedPositions: closedTrades,
    openedPositions: openedTrades,
    updatedTrailingStops,
    activePositions: store.positions,
    digest
  };

  appendHistoryReport(report);
  return report;
}
