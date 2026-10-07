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
import { readJsonData, writeJsonData } from "../storageUtils.js";
import {
  EODPosition,
  EODTradeExecution,
  EODTrailingStopUpdate,
  EODSimulationReport,
  EODSimulationOptions
} from "./types.js";

export interface PersistedEODState {
  cash: number;
  initialCash: number;
  positions: EODPosition[];
  closedTrades: EODTradeExecution[];
  lastRunDate?: string;
  totalRealizedPnL: number;
  totalFrictionPaid: number;
  winCount: number;
  lossCount: number;
  lastUpdated?: string;
}

const DEFAULT_INITIAL_STATE: PersistedEODState = {
  cash: 100000,
  initialCash: 100000,
  positions: [],
  closedTrades: [],
  lastRunDate: undefined,
  totalRealizedPnL: 0,
  totalFrictionPaid: 0,
  winCount: 0,
  lossCount: 0,
  lastUpdated: undefined
};

function ensureSimulatorStore(): PersistedEODState {
  const store = readJsonData<PersistedEODState>("eod_portfolio.json", DEFAULT_INITIAL_STATE);
  if (!store || typeof store.cash !== "number") {
    return { ...DEFAULT_INITIAL_STATE };
  }
  if (!Array.isArray(store.positions)) store.positions = [];
  if (!Array.isArray(store.closedTrades)) store.closedTrades = [];
  if (typeof store.totalRealizedPnL !== "number") store.totalRealizedPnL = 0;
  if (typeof store.totalFrictionPaid !== "number") store.totalFrictionPaid = 0;
  if (typeof store.winCount !== "number") store.winCount = 0;
  if (typeof store.lossCount !== "number") store.lossCount = 0;
  return store;
}

function saveSimulatorStore(state: PersistedEODState) {
  writeJsonData("eod_portfolio.json", state);
  try {
    const localDataDir = path.join(process.cwd(), "data");
    const localPortfolioPath = path.join(localDataDir, "eod_portfolio.json");
    if (fs.existsSync(localDataDir)) {
      fs.writeFileSync(localPortfolioPath, JSON.stringify(state, null, 2), "utf8");
    }
  } catch {}
}

function appendHistoryReport(report: EODSimulationReport) {
  let history = readJsonData<EODSimulationReport[]>("eod_simulation_history.json", []);
  if (!Array.isArray(history)) history = [];
  history.unshift(report);
  if (history.length > 100) history = history.slice(0, 100); // Keep last 100 runs
  writeJsonData("eod_simulation_history.json", history);

  try {
    const localDataDir = path.join(process.cwd(), "data");
    const localHistoryPath = path.join(localDataDir, "eod_simulation_history.json");
    if (fs.existsSync(localDataDir)) {
      fs.writeFileSync(localHistoryPath, JSON.stringify(history, null, 2), "utf8");
    }
  } catch {}
}

export function getEODHistory(): EODSimulationReport[] {
  const history = readJsonData<EODSimulationReport[]>("eod_simulation_history.json", []);
  return Array.isArray(history) ? history : [];
}

export function getEODPortfolio(): PersistedEODState {
  return ensureSimulatorStore();
}

/**
 * Manually closes an open paper trading position at current price.
 */
export async function closeEODPosition(positionId: string): Promise<{ success: boolean; closedTrade?: EODTradeExecution; portfolio: PersistedEODState }> {
  const store = ensureSimulatorStore();
  const posIdx = store.positions.findIndex(p => p.id === positionId);
  if (posIdx === -1) {
    return { success: false, portfolio: store };
  }

  const pos = store.positions[posIdx];
  const region = detectMarketRegion(pos.symbol);

  // Get current market exit price
  let exitPrice = pos.currentPrice;
  try {
    const quote = await getQuote(pos.symbol, region).catch(() => null);
    if (quote && quote.price && quote.price > 0) {
      exitPrice = quote.price;
    }
  } catch {}

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
  store.totalFrictionPaid += friction.totalFriction;
  if (realizedPnL >= 0) store.winCount += 1;
  else store.lossCount += 1;

  const nowIso = new Date().toISOString();
  const holdingDays = Math.max(1, Math.round((Date.now() - new Date(pos.entryTimestamp || pos.entryDate).getTime()) / (1000 * 3600 * 24)));

  const closedTrade: EODTradeExecution = {
    id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
    type: "MANUAL_CLOSE",
    symbol: pos.symbol,
    companyName: pos.name,
    shares: pos.shares,
    price: parseFloat(exitPrice.toFixed(2)),
    entryPrice: pos.entryPrice,
    entryDate: pos.entryDate,
    entryTimestamp: pos.entryTimestamp,
    exitPrice: parseFloat(exitPrice.toFixed(2)),
    exitDate: nowIso.slice(0, 10),
    exitTimestamp: nowIso,
    holdingDays,
    currency: pos.currency,
    currencySymbol: pos.currencySymbol,
    realizedPnL: parseFloat(realizedPnL.toFixed(2)),
    realizedPnLPct: parseFloat(realizedPnLPct.toFixed(2)),
    friction: parseFloat(friction.totalFriction.toFixed(2)),
    reason: `Manual Market Exit closed by trader at ${exitPrice.toFixed(2)}`,
    executedAt: nowIso
  };

  store.positions.splice(posIdx, 1);
  store.closedTrades.unshift(closedTrade);
  store.lastUpdated = nowIso;
  saveSimulatorStore(store);

  return { success: true, closedTrade, portfolio: store };
}

/**
 * Executes Trade Simulation:
 * Supports both Single-Step (Live / Latest EOD snapshot)
 * and Historical Replay (iterating chronologically through historical date bars from startDate to endDate).
 */
export async function runEODSimulation(options: EODSimulationOptions = {}): Promise<EODSimulationReport> {
  const store = ensureSimulatorStore();
  if (options.forcedCapital && options.forcedCapital > 0) {
    store.cash = options.forcedCapital;
    store.initialCash = options.forcedCapital;
  }

  const allocationPct = options.allocationPct || options.capitalAllocationPct || 0.15; // default 15% per trade
  const trailingStopPct = options.trailingStopPct || 3.0; // default 3.0% trailing stop

  // 1. Resolve active strategy
  let strategy = options.strategyId ? getStrategyById(options.strategyId) : undefined;
  if (!strategy) {
    strategy = PRESET_STRATEGIES.find(p => p.id === "strat-ema-cross") || PRESET_STRATEGIES[0];
  }

  // 2. Resolve tracked assets for Simulation based on selected market
  const trackedSymbols: Array<{ symbol: string; market: string }> = [];
  const targetMarket = ((options as any).market || (options as any).marketRegion || "IN").toUpperCase();

  if (options.watchlistSymbols && options.watchlistSymbols.length > 0) {
    options.watchlistSymbols.forEach(s => trackedSymbols.push({ symbol: s, market: detectMarketRegion(s) }));
  } else {
    const marketUniverse = (MARKET_UNIVERSES as any)[targetMarket]?.stocks || [];
    if (marketUniverse.length > 0) {
      marketUniverse.forEach((s: any) => trackedSymbols.push({ symbol: s.symbol, market: targetMarket }));
    } else {
      const universeIN = (MARKET_UNIVERSES as any)["IN"]?.stocks || [];
      universeIN.forEach((s: any) => trackedSymbols.push({ symbol: s.symbol, market: "IN" }));
    }
  }

  // Pre-fetch 1Y Daily Candles for all tracked symbols
  const candlesMap = new Map<string, any[]>();
  const quotesMap = new Map<string, any>();

  await Promise.all(
    trackedSymbols.map(async item => {
      try {
        const normSym = normalizeTicker(item.symbol, item.market);
        const [q, historyRes] = await Promise.all([
          getQuote(normSym, item.market).catch(() => null),
          getHistory(normSym, "1Y", "1d", item.market).catch(() => null)
        ]);
        const candles = (historyRes as any)?.candles || [];
        if (candles.length > 0) {
          candlesMap.set(normSym, candles);
          candlesMap.set(item.symbol, candles);
        }
        if (q) {
          quotesMap.set(normSym, q);
          quotesMap.set(item.symbol, q);
        }
      } catch (err) {
        console.warn(`[Simulator] Error loading history for ${item.symbol}:`, err);
      }
    })
  );

  const isReplayMode = options.mode === "HISTORICAL_REPLAY" || Boolean(options.startDate);

  // If in Historical Replay Mode, determine the date range to replay
  if (isReplayMode) {
    // Collect all chronological dates across candle datasets
    const allDatesSet = new Set<string>();
    candlesMap.forEach(candles => {
      candles.forEach(c => {
        const d = (c.isoTime || "").slice(0, 10);
        if (d) allDatesSet.add(d);
      });
    });

    const sortedDates = Array.from(allDatesSet).sort();

    let startDate = options.startDate;
    let endDate = options.endDate || sortedDates[sortedDates.length - 1];

    if (!startDate) {
      const daysBack = options.replayDays || 30;
      const targetTime = Date.now() - (daysBack * 86400000);
      const targetIso = new Date(targetTime).toISOString().slice(0, 10);
      startDate = sortedDates.find(d => d >= targetIso) || sortedDates[0];
    }

    const replayDates = sortedDates.filter(d => d >= startDate! && d <= endDate!);
    const validReplayDates = replayDates.length > 0 ? replayDates : sortedDates.slice(-30);

    const startingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
    const closedTradesAll: EODTradeExecution[] = [];
    const openedTradesAll: EODTradeExecution[] = [];
    const updatedTrailingStopsAll: EODTrailingStopUpdate[] = [];

    // Chronologically step through each trading day
    for (const simDate of validReplayDates) {
      // Step A: Evaluate Open Positions against this day's candle
      const remainingPositions: EODPosition[] = [];

      for (const pos of store.positions) {
        const candles = candlesMap.get(pos.symbol) || [];
        const candleIndex = candles.findIndex(c => (c.isoTime || "").slice(0, 10) === simDate);
        if (candleIndex === -1) {
          remainingPositions.push(pos);
          continue;
        }

        const candle = candles[candleIndex];
        const { high, low, close } = candle;
        pos.currentPrice = close;
        pos.currentValue = pos.shares * close;
        pos.daysHeld = Math.max(1, Math.round((new Date(simDate).getTime() - new Date(pos.entryDate).getTime()) / (1000 * 3600 * 24)));

        let closed = false;
        let exitPrice = close;
        let exitReason = "";
        let exitType: EODTradeExecution["type"] = "TAKE_PROFIT";

        if (high >= pos.takeProfit) {
          closed = true;
          exitPrice = pos.takeProfit;
          exitReason = `Take-Profit limit target hit at ${exitPrice.toFixed(2)} (High: ${high.toFixed(2)})`;
          exitType = "TAKE_PROFIT";
        } else if (low <= pos.stopLoss) {
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
          store.totalFrictionPaid += friction.totalFriction;
          if (realizedPnL >= 0) store.winCount += 1;
          else store.lossCount += 1;

          const tradeExecution: EODTradeExecution = {
            id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
            type: exitType,
            symbol: pos.symbol,
            companyName: pos.name,
            shares: pos.shares,
            price: parseFloat(exitPrice.toFixed(2)),
            entryPrice: pos.entryPrice,
            entryDate: pos.entryDate,
            entryTimestamp: pos.entryTimestamp,
            exitPrice: parseFloat(exitPrice.toFixed(2)),
            exitDate: simDate,
            exitTimestamp: candle.isoTime || `${simDate}T15:30:00.000Z`,
            holdingDays: pos.daysHeld,
            currency: pos.currency,
            currencySymbol: pos.currencySymbol,
            realizedPnL: parseFloat(realizedPnL.toFixed(2)),
            realizedPnLPct: parseFloat(realizedPnLPct.toFixed(2)),
            friction: parseFloat(friction.totalFriction.toFixed(2)),
            reason: exitReason,
            executedAt: candle.isoTime || `${simDate}T15:30:00.000Z`
          };

          closedTradesAll.push(tradeExecution);
          store.closedTrades.unshift(tradeExecution);
        } else {
          // Check Trailing Stop Ratchet
          if (close > pos.highestPriceSinceEntry) {
            const oldStop = pos.stopLoss;
            const newStop = Math.max(oldStop, parseFloat((close * (1 - trailingStopPct / 100)).toFixed(2)));
            if (newStop > oldStop) {
              pos.stopLoss = newStop;
              pos.highestPriceSinceEntry = close;
              updatedTrailingStopsAll.push({
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
      }
      store.positions = remainingPositions;

      // Step B: Scan Universe for New Entries on this day's candle
      for (const item of trackedSymbols) {
        if (store.positions.some(p => p.symbol === item.symbol)) continue;

        const candles = candlesMap.get(item.symbol) || [];
        const candleIndex = candles.findIndex(c => (c.isoTime || "").slice(0, 10) === simDate);
        if (candleIndex < 20) continue; // Need at least 20 historical bars for indicators

        const candlesUpToDate = candles.slice(0, candleIndex + 1);
        const candle = candles[candleIndex];
        const entryPrice = candle.close;

        const quote = quotesMap.get(item.symbol) || { price: entryPrice };
        const signal = evaluateStrategy(strategy, candlesUpToDate, quote, {});

        if (signal.action === "BUY" && signal.confidence >= 0.55) {
          const maxCapitalForTrade = store.cash * allocationPct;
          const shares = Math.floor(maxCapitalForTrade / entryPrice);

          if (shares > 0 && maxCapitalForTrade >= entryPrice) {
            const region = detectMarketRegion(item.symbol);
            const friction = calculateRegionalFriction({
              region,
              side: "BUY",
              price: entryPrice,
              quantity: shares
            });

            const totalCost = (shares * entryPrice) + friction.totalFriction;
            if (store.cash >= totalCost) {
              store.cash -= totalCost;
              store.totalFrictionPaid += friction.totalFriction;

              const stopLoss = signal.stopLoss || parseFloat((entryPrice * 0.95).toFixed(2));
              const takeProfit = signal.targetPrice || (signal as any).takeProfit || parseFloat((entryPrice * 1.10).toFixed(2));

              const isIndian = item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO') || item.market === 'IN';
              const isEU = item.symbol.endsWith('.L') || item.symbol.endsWith('.DE') || item.symbol.endsWith('.PA') || item.market === 'EU';
              const posCurr = isIndian ? 'INR' : (isEU ? 'EUR' : 'USD');
              const posCurrSym = isIndian ? '₹' : (isEU ? '€' : '$');
              const entryIso = candle.isoTime || `${simDate}T09:30:00.000Z`;

              const newPos: EODPosition = {
                id: `pos-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
                symbol: item.symbol,
                name: quote?.name || formatTickerDisplay(item.symbol).cleanSymbol,
                market: item.market,
                currency: posCurr,
                currencySymbol: posCurrSym,
                shares,
                entryPrice: parseFloat(entryPrice.toFixed(2)),
                currentPrice: parseFloat(entryPrice.toFixed(2)),
                stopLoss,
                takeProfit,
                highestPriceSinceEntry: entryPrice,
                unrealizedPnL: 0,
                unrealizedPnLPct: 0,
                entryDate: simDate,
                entryTimestamp: entryIso,
                totalCost: parseFloat(totalCost.toFixed(2)),
                currentValue: parseFloat((shares * entryPrice).toFixed(2)),
                daysHeld: 0,
                status: "OPEN"
              };

              store.positions.push(newPos);

              openedTradesAll.push({
                id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
                type: "BUY_ENTRY",
                symbol: item.symbol,
                companyName: newPos.name,
                shares,
                price: parseFloat(entryPrice.toFixed(2)),
                entryPrice: parseFloat(entryPrice.toFixed(2)),
                entryDate: simDate,
                entryTimestamp: entryIso,
                currency: posCurr,
                currencySymbol: posCurrSym,
                realizedPnL: 0,
                realizedPnLPct: 0,
                friction: parseFloat(friction.totalFriction.toFixed(2)),
                reason: (signal.reasoning && signal.reasoning.length > 0) ? signal.reasoning.join("; ") : `Automated Replay Entry based on ${strategy.name}`,
                executedAt: entryIso
              });
            }
          }
        }
      }
    }

    const lastReplayDate = validReplayDates[validReplayDates.length - 1];
    store.lastRunDate = lastReplayDate;
    store.lastUpdated = new Date().toISOString();
    saveSimulatorStore(store);

    const endingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
    const netTotalPnL = endingCapital - startingCapital;
    const netTotalPnLPct = startingCapital > 0 ? (netTotalPnL / startingCapital) * 100 : 0;

    const digest = `Historical Replay completed from ${validReplayDates[0]} to ${lastReplayDate} (${validReplayDates.length} trading days). Positions Closed: ${closedTradesAll.length}, New Positions Initiated: ${openedTradesAll.length}, Active Holding: ${store.positions.length}. Total Return: ${netTotalPnL >= 0 ? '+' : ''}${netTotalPnL.toFixed(2)} (${netTotalPnLPct.toFixed(2)}%). Ending Equity: ${endingCapital.toFixed(2)}.`;

    const report: EODSimulationReport = {
      id: `eod-replay-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      simulatedDate: lastReplayDate,
      executionTimestamp: new Date().toISOString(),
      strategyId: strategy.id,
      strategyName: strategy.name,
      startingCapital: parseFloat(startingCapital.toFixed(2)),
      endingCapital: parseFloat(endingCapital.toFixed(2)),
      netDailyPnL: parseFloat(netTotalPnL.toFixed(2)),
      netDailyPnLPct: parseFloat(netTotalPnLPct.toFixed(2)),
      totalOpenPositions: store.positions.length,
      totalTradesExecuted: closedTradesAll.length + openedTradesAll.length,
      closedPositions: closedTradesAll,
      openedPositions: openedTradesAll,
      updatedTrailingStops: updatedTrailingStopsAll,
      activePositions: store.positions,
      digest,
      replayMode: "HISTORICAL_REPLAY",
      replayedDaysCount: validReplayDates.length
    };

    appendHistoryReport(report);
    return report;
  }

  // ── Mode B: Single Step (Current Daily EOD Session) ───────────────────────────
  const closedTrades: EODTradeExecution[] = [];
  const openedTrades: EODTradeExecution[] = [];
  const updatedTrailingStops: EODTrailingStopUpdate[] = [];

  const startingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
  const nowIso = new Date().toISOString();
  const simDate = nowIso.slice(0, 10);

  // 3. Step A: Manage Existing Open Positions against Daily Candle High/Low
  const remainingPositions: EODPosition[] = [];

  for (const pos of store.positions) {
    try {
      let candles = candlesMap.get(pos.symbol) || [];
      if (!candles || candles.length === 0) {
        const region = detectMarketRegion(pos.symbol);
        const historyRes = await getHistory(pos.symbol, "1Y", "1d", region).catch(() => null);
        candles = (historyRes as any)?.candles || [];
      }

      if (!candles || candles.length === 0) {
        remainingPositions.push(pos);
        continue;
      }

      const lastCandle = candles[candles.length - 1];
      const { high, low, close } = lastCandle;
      pos.currentPrice = close;
      pos.currentValue = pos.shares * close;
      pos.daysHeld = Math.max(1, Math.round((Date.now() - new Date(pos.entryTimestamp || pos.entryDate).getTime()) / (1000 * 3600 * 24)));

      let closed = false;
      let exitPrice = close;
      let exitReason = "";
      let exitType: EODTradeExecution["type"] = "TAKE_PROFIT";

      // Check Take Profit Hit
      if (high >= pos.takeProfit) {
        closed = true;
        exitPrice = pos.takeProfit;
        exitReason = `Take-Profit limit target reached at ${exitPrice.toFixed(2)} (High: ${high.toFixed(2)})`;
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
        store.totalFrictionPaid += friction.totalFriction;
        if (realizedPnL >= 0) store.winCount += 1;
        else store.lossCount += 1;

        const tradeExecution: EODTradeExecution = {
          id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
          type: exitType,
          symbol: pos.symbol,
          companyName: pos.name,
          shares: pos.shares,
          price: parseFloat(exitPrice.toFixed(2)),
          entryPrice: pos.entryPrice,
          entryDate: pos.entryDate,
          entryTimestamp: pos.entryTimestamp,
          exitPrice: parseFloat(exitPrice.toFixed(2)),
          exitDate: simDate,
          exitTimestamp: nowIso,
          holdingDays: pos.daysHeld,
          currency: pos.currency,
          currencySymbol: pos.currencySymbol,
          realizedPnL: parseFloat(realizedPnL.toFixed(2)),
          realizedPnLPct: parseFloat(realizedPnLPct.toFixed(2)),
          friction: parseFloat(friction.totalFriction.toFixed(2)),
          reason: exitReason,
          executedAt: nowIso
        };

        closedTrades.push(tradeExecution);
        store.closedTrades.unshift(tradeExecution);
      } else {
        // Trailing Stop Check
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
    if (store.positions.some(p => p.symbol === item.symbol)) continue;

    try {
      const normSym = normalizeTicker(item.symbol, item.market);
      const candles = candlesMap.get(normSym) || candlesMap.get(item.symbol) || [];
      const quote = quotesMap.get(normSym) || quotesMap.get(item.symbol) || null;

      if (!candles || candles.length < 20) continue;

      const signal = evaluateStrategy(strategy, candles, quote, {});
      if (signal.action === "BUY" && signal.confidence >= 0.55) {
        const lastCandle = candles[candles.length - 1];
        const entryPrice = lastCandle.close;

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
            store.totalFrictionPaid += friction.totalFriction;

            const stopLoss = signal.stopLoss || parseFloat((entryPrice * 0.95).toFixed(2));
            const takeProfit = signal.targetPrice || (signal as any).takeProfit || parseFloat((entryPrice * 1.10).toFixed(2));

            const isIndian = normSym.endsWith('.NS') || normSym.endsWith('.BO') || item.market === 'IN';
            const isEU = normSym.endsWith('.L') || normSym.endsWith('.DE') || normSym.endsWith('.PA') || item.market === 'EU';
            const posCurr = isIndian ? 'INR' : (isEU ? 'EUR' : 'USD');
            const posCurrSym = isIndian ? '₹' : (isEU ? '€' : '$');

            const newPos: EODPosition = {
              id: `pos-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
              symbol: normSym,
              name: quote?.name || formatTickerDisplay(normSym).cleanSymbol,
              market: item.market,
              currency: posCurr,
              currencySymbol: posCurrSym,
              shares,
              entryPrice: parseFloat(entryPrice.toFixed(2)),
              currentPrice: parseFloat(entryPrice.toFixed(2)),
              stopLoss,
              takeProfit,
              highestPriceSinceEntry: entryPrice,
              unrealizedPnL: 0,
              unrealizedPnLPct: 0,
              entryDate: simDate,
              entryTimestamp: nowIso,
              totalCost: parseFloat(totalCost.toFixed(2)),
              currentValue: parseFloat((shares * entryPrice).toFixed(2)),
              daysHeld: 0,
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
              entryPrice: parseFloat(entryPrice.toFixed(2)),
              entryDate: simDate,
              entryTimestamp: nowIso,
              currency: posCurr,
              currencySymbol: posCurrSym,
              realizedPnL: 0,
              realizedPnLPct: 0,
              friction: parseFloat(friction.totalFriction.toFixed(2)),
              reason: (signal.reasoning && signal.reasoning.length > 0) ? signal.reasoning.join("; ") : `Automated EOD Entry based on ${strategy.name}`,
              executedAt: nowIso
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
  store.lastUpdated = nowIso;
  saveSimulatorStore(store);

  const endingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
  const netDailyPnL = endingCapital - startingCapital;
  const netDailyPnLPct = startingCapital > 0 ? (netDailyPnL / startingCapital) * 100 : 0;

  const digest = `EOD Batch Simulation completed for ${simDate}. Positions closed: ${closedTrades.length}, New positions: ${openedTrades.length}, Trailing stops raised: ${updatedTrailingStops.length}. Daily PnL: ${netDailyPnL >= 0 ? '+' : ''}${netDailyPnL.toFixed(2)} (${netDailyPnLPct.toFixed(2)}%). Total Equity: ${endingCapital.toFixed(2)}.`;

  const report: EODSimulationReport = {
    id: `eod-run-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    simulatedDate: simDate,
    executionTimestamp: nowIso,
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
    digest,
    replayMode: "SINGLE_STEP"
  };

  appendHistoryReport(report);
  return report;
}

/**
 * Resets the Trade Simulator virtual portfolio state and clears history.
 */
export function resetSimulator(initialCash: number = 100000, marketRegion: string = "IN"): PersistedEODState {
  const freshState: PersistedEODState = {
    cash: initialCash,
    initialCash: initialCash,
    positions: [],
    closedTrades: [],
    lastRunDate: undefined,
    totalRealizedPnL: 0,
    totalFrictionPaid: 0,
    winCount: 0,
    lossCount: 0,
    lastUpdated: new Date().toISOString()
  };
  saveSimulatorStore(freshState);
  writeJsonData("eod_simulation_history.json", []);

  // Also clear local development data directory files if writable
  try {
    const localDataDir = path.join(process.cwd(), "data");
    const localHistoryPath = path.join(localDataDir, "eod_simulation_history.json");
    const localPortfolioPath = path.join(localDataDir, "eod_portfolio.json");
    if (fs.existsSync(localHistoryPath)) {
      fs.writeFileSync(localHistoryPath, "[]\n", "utf8");
    }
    if (fs.existsSync(localPortfolioPath)) {
      fs.writeFileSync(localPortfolioPath, JSON.stringify(freshState, null, 2), "utf8");
    }
  } catch {}

  return freshState;
}
