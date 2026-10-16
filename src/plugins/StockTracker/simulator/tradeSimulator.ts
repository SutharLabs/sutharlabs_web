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
import { readJsonData, writeJsonData, deleteJsonData } from "../storageUtils.js";
import { getPrismaClient } from "../../../../api/_utils.js";
import {
  EODPosition,
  EODTradeExecution,
  EODTrailingStopUpdate,
  EODSimulationReport,
  EODSimulationOptions,
  SimulationRegistryEntry
} from "./types.js";

// ── Institutional Market Session & Holiday Provider ──────────────────────────
export {
  getMarketSessionStatus,
  getExchangeHolidayName,
  isExchangeTradingDay,
  normalizeMarketKey,
  type MarketSessionStatus
} from "../calendar/exchangeCalendar.js";
import {
  getMarketSessionStatus,
  isExchangeTradingDay
} from "../calendar/exchangeCalendar.js";

export function getSessionExecutionTimestamp(market: string, candleTime?: number): string {
  if (candleTime && candleTime > 0) {
    const ms = candleTime > 1e11 ? candleTime : candleTime * 1000;
    return new Date(ms).toISOString();
  }
  const now = new Date();
  const session = getMarketSessionStatus(market);
  if (session.isOpen) {
    return now.toISOString();
  }

  const normMarket = market.toUpperCase();
  const dateStr = now.toISOString().slice(0, 10);
  if (normMarket === 'IN') {
    return new Date(`${dateStr}T10:00:00.000Z`).toISOString(); // 15:30 IST = 10:00 UTC
  } else if (normMarket === 'US') {
    return new Date(`${dateStr}T20:00:00.000Z`).toISOString(); // 16:00 ET = 20:00 UTC
  }
  return now.toISOString();
}

/**
 * Resolves an accurate, realistic market session execution timestamp for trades,
 * strictly preventing arbitrary 09:15 AM opening bell timestamps for historical and preset replays.
 */
export function resolveAccurateTradeTimestamp({
  dateStr,
  market,
  type,
  existingIso,
  intradayBars,
  priceTarget,
  isDaily = false
}: {
  dateStr: string;
  market: string;
  type: "BUY_ENTRY" | "TAKE_PROFIT" | "STOP_LOSS" | "TRAILING_STOP_EXIT" | "MANUAL_CLOSE";
  existingIso?: string;
  intradayBars?: Array<{ time?: number; isoTime?: string; high?: number; low?: number; close?: number; open?: number }>;
  priceTarget?: number;
  isDaily?: boolean;
}): string {
  const normMarket = (market || 'IN').toUpperCase();

  // 1. If an existing ISO timestamp is already provided (e.g. from live execution or candle bar)
  // preserve it directly without any artificial overrides!
  if (existingIso) {
    const d = new Date(existingIso);
    if (!isNaN(d.getTime())) {
      const timePart = existingIso.slice(11, 19);
      if (timePart && timePart !== '00:00:00') {
        return existingIso;
      }
    }
  }

  // 2. If intraday bars exist for this specific date, match exact trigger candle
  if (intradayBars && intradayBars.length > 0) {
    if (type === "TAKE_PROFIT" && priceTarget != null) {
      const matchBar = intradayBars.find(b => (b.high ?? 0) >= priceTarget);
      if (matchBar?.isoTime) return matchBar.isoTime;
    } else if ((type === "STOP_LOSS" || type === "TRAILING_STOP_EXIT") && priceTarget != null) {
      const matchBar = intradayBars.find(b => (b.low ?? Infinity) <= priceTarget);
      if (matchBar?.isoTime) return matchBar.isoTime;
    } else if (type === "BUY_ENTRY") {
      const matchBar = intradayBars[0];
      if (matchBar?.isoTime) return matchBar.isoTime;
    }
  }

  // 3. If existingIso was provided with ISO formatting, preserve it
  if (existingIso && existingIso.includes('T')) {
    return existingIso;
  }

  // 4. Default to authentic market session timestamps:
  // Market Open for Entry; Market Close for Exit
  if (normMarket === 'IN') {
    return type === "BUY_ENTRY"
      ? `${dateStr}T03:45:00.000Z` // 09:15:00 IST Market Open
      : `${dateStr}T10:00:00.000Z`; // 15:30:00 IST Market Close
  } else if (normMarket === 'US') {
    return type === "BUY_ENTRY"
      ? `${dateStr}T13:30:00.000Z` // 09:30:00 ET Market Open
      : `${dateStr}T20:00:00.000Z`; // 16:00:00 ET Market Close
  } else {
    return type === "BUY_ENTRY"
      ? `${dateStr}T08:00:00.000Z` // European Market Open
      : `${dateStr}T16:30:00.000Z`; // European Market Close
  }
}

// ── Storage Key Helpers ──────────────────────────────────────────────────────
// 'default' maps to legacy file names for backward-compatibility.
// Every other simulationId gets its own namespaced file.
const SIM_REGISTRY_KEY = "eod_simulations_registry.json";

function portfolioKey(simId: string): string {
  return simId === "default" ? "eod_portfolio.json" : `eod_portfolio_${simId}.json`;
}
function historyKey(simId: string): string {
  return simId === "default" ? "eod_simulation_history.json" : `eod_simulation_history_${simId}.json`;
}
function localPortfolioPath(simId: string): string {
  const dir = path.join(process.cwd(), "data");
  return path.join(dir, portfolioKey(simId));
}
function localHistoryPath(simId: string): string {
  const dir = path.join(process.cwd(), "data");
  return path.join(dir, historyKey(simId));
}

// ── Simulation Registry ───────────────────────────────────────────────────────
function readRegistry(): SimulationRegistryEntry[] {
  let reg = readJsonData<SimulationRegistryEntry[]>(SIM_REGISTRY_KEY, []);
  if (!Array.isArray(reg)) reg = [];

  const nowIso = new Date().toISOString();
  let modified = false;

  // Remove previously seeded hardcoded 'default' simulation from registry if present
  if (reg.some(r => r.id === "default")) {
    reg = reg.filter(r => r.id !== "default");
    modified = true;
  }

  if (!reg.some(r => r.id === "cron_live")) {
    reg.push({
      id: "cron_live",
      label: "Cloud Cron Live Trading (1m)",
      market: "IN",
      strategyId: "strat-ema-cross",
      strategyName: "EMA 9/21 Dynamic Trend Cross",
      timeframe: "1m",
      interval: "1m",
      capitalAllocationPct: 0.20,
      trailingStopPct: 3.0,
      createdAt: nowIso,
      lastRunAt: nowIso,
      totalRuns: 0,
      totalTradeRuns: 0,
      isPublic: true,
      owner: "mr.sutharsuresh@gmail.com"
    });
    modified = true;
  }

  // Ensure cron_live entry is explicitly public and assigned owner mr.sutharsuresh@gmail.com
  for (const item of reg) {
    if (item.id === "cron_live") {
      if (item.isPublic === undefined) { item.isPublic = true; modified = true; }
      if (!item.owner) { item.owner = "mr.sutharsuresh@gmail.com"; modified = true; }
    } else if (!item.owner) {
      if (item.id.includes("__")) {
        item.owner = item.id.split("__")[0];
        modified = true;
      }
    }
  }

  if (modified) {
    writeJsonData(SIM_REGISTRY_KEY, reg);
  }
  return reg;
}

function upsertRegistry(
  simId: string,
  patch: Partial<SimulationRegistryEntry>
): void {
  const reg = readRegistry();
  const nowIso = new Date().toISOString();
  const idx = reg.findIndex(r => r.id === simId);
  if (idx >= 0) {
    reg[idx] = { ...reg[idx], ...patch, lastRunAt: patch.lastRunAt ?? nowIso };
  } else {
    reg.push({
      id: simId,
      label: patch.label || simId,
      createdAt: nowIso,
      lastRunAt: nowIso,
      totalRuns: 0,
      totalTradeRuns: 0,
      ...patch
    });
  }
  writeJsonData(SIM_REGISTRY_KEY, reg);
}

export function listSimulations(): SimulationRegistryEntry[] {
  return readRegistry();
}

export function setSimulationPublicStatus(simId: string, isPublic: boolean): SimulationRegistryEntry {
  const reg = readRegistry();
  const idx = reg.findIndex(r => r.id === simId);
  if (idx < 0) {
    throw new Error(`Simulation "${simId}" not found in registry.`);
  }
  reg[idx] = { ...reg[idx], isPublic };
  writeJsonData(SIM_REGISTRY_KEY, reg);
  return reg[idx];
}

export function updateSimulationConfig(
  simId: string,
  config: Partial<SimulationRegistryEntry>
): SimulationRegistryEntry {
  const reg = readRegistry();
  const existing = reg.find(r => r.id === simId);
  if (!existing) {
    throw new Error(`Simulation "${simId}" not found in registry.`);
  }

  let stratName = config.strategyName;
  if (config.strategyId && !stratName) {
    const s = getStrategyById(config.strategyId);
    if (s) stratName = s.name;
  }

  const patch: Partial<SimulationRegistryEntry> = {
    ...config,
    label: config.label || existing.label,
    strategyId: config.strategyId || existing.strategyId,
    strategyName: stratName || existing.strategyName,
    market: config.market ? config.market.toUpperCase() : existing.market,
    timeframe: (config.timeframe || (config as any).interval || existing.timeframe || "1d") as any,
    interval: (config.timeframe || (config as any).interval || existing.interval || existing.timeframe || "1d") as string,
    capitalAllocationPct: config.capitalAllocationPct !== undefined ? config.capitalAllocationPct : (config.allocationPct !== undefined ? config.allocationPct : existing.capitalAllocationPct),
    allocationPct: config.capitalAllocationPct !== undefined ? config.capitalAllocationPct : (config.allocationPct !== undefined ? config.allocationPct : existing.capitalAllocationPct),
    trailingStopPct: config.trailingStopPct !== undefined ? config.trailingStopPct : existing.trailingStopPct
  };

  upsertRegistry(simId, patch);
  const updatedReg = readRegistry();
  return updatedReg.find(r => r.id === simId) || { ...existing, ...patch };
}

export async function deleteSimulation(simId: string): Promise<void> {
  if (simId === "cron_live") {
    throw new Error(`Cannot delete protected simulation "${simId}".`);
  }
  const safeSimId = simId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const reg = readRegistry().filter(r => r.id !== simId);
  writeJsonData(SIM_REGISTRY_KEY, reg);

  // Evict from memoryCache and disk
  deleteJsonData(portfolioKey(safeSimId));
  deleteJsonData(historyKey(safeSimId));
  try {
    const pPath = localPortfolioPath(safeSimId);
    if (fs.existsSync(pPath)) fs.unlinkSync(pPath);
  } catch {}
  try {
    const hPath = localHistoryPath(safeSimId);
    if (fs.existsSync(hPath)) fs.unlinkSync(hPath);
  } catch {}

  // Delete from Neon PostgreSQL database
  try {
    const prisma = getPrismaClient();
    await prisma.simulationStore.delete({
      where: { simId: safeSimId }
    });
  } catch {}
}

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

export function createInitialSimulatorState(initialCash: number = 100000): PersistedEODState {
  return {
    cash: initialCash,
    initialCash,
    positions: [],
    closedTrades: [],
    lastRunDate: undefined,
    totalRealizedPnL: 0,
    totalFrictionPaid: 0,
    winCount: 0,
    lossCount: 0,
    lastUpdated: undefined
  };
}

export async function ensureSimulatorStore(simId: string): Promise<PersistedEODState> {
  const safeSimId = (simId || "default").replace(/[^a-zA-Z0-9_-]/g, "_");

  // 1. Query Neon PostgreSQL database
  try {
    const prisma = getPrismaClient();
    const row = await prisma.simulationStore.findUnique({
      where: { simId: safeSimId }
    });

    if (row) {
      if (row.owner) {
        upsertRegistry(safeSimId, { owner: row.owner });
      }
      let positions: EODPosition[] = [];
      let closedTrades: EODTradeExecution[] = [];
      try { positions = JSON.parse(row.positions || '[]'); } catch {}
      try { closedTrades = JSON.parse(row.closedTrades || '[]'); } catch {}

      // Strict instance segregation: sanitize positions and trades so foreign entries never bleed
      const cleanPositions: EODPosition[] = (Array.isArray(positions) ? positions : []).filter(p => {
        if (!p.simulationId) {
          p.simulationId = safeSimId;
          return true;
        }
        return p.simulationId === safeSimId;
      });

      const cleanClosedTrades: EODTradeExecution[] = (Array.isArray(closedTrades) ? closedTrades : []).filter(t => {
        if (!t.simulationId) {
          t.simulationId = safeSimId;
          return true;
        }
        return t.simulationId === safeSimId;
      });

      const store: PersistedEODState = {
        initialCash: row.initialCash ?? 100000,
        cash: row.cash ?? 100000,
        positions: cleanPositions,
        closedTrades: cleanClosedTrades,
        lastRunDate: row.lastRunDate || undefined,
        totalRealizedPnL: row.totalRealizedPnL ?? 0,
        totalFrictionPaid: row.totalFrictionPaid ?? 0,
        winCount: row.winCount ?? 0,
        lossCount: row.lossCount ?? 0,
        lastUpdated: row.lastUpdated || undefined
      };

      // Deduplicate open positions by normalized symbol so 1-minute crons keep only 1 instance
      if (store.positions.length > 1) {
        const seen = new Set<string>();
        const uniquePositions: EODPosition[] = [];
        for (const pos of store.positions) {
          const norm = normalizeTicker(pos.symbol, pos.market);
          if (!seen.has(norm)) {
            seen.add(norm);
            uniquePositions.push(pos);
          }
        }
        if (uniquePositions.length !== store.positions.length) {
          store.positions = uniquePositions;
          await saveSimulatorStore(store, safeSimId);
        }
      }

      writeJsonData(portfolioKey(safeSimId), store);
      return store;
    }
  } catch (err) {
    console.warn(`[Simulator DB] Error loading store for ${safeSimId} from DB:`, err);
  }

  // 2. Fallback to local disk / memory cache / default initial (always fresh isolated state object)
  const store = readJsonData<PersistedEODState>(portfolioKey(safeSimId), createInitialSimulatorState());
  if (!store || typeof store.cash !== "number") {
    const fresh = createInitialSimulatorState();
    await saveSimulatorStore(fresh, safeSimId);
    return fresh;
  }
  if (!Array.isArray(store.positions)) store.positions = [];
  if (!Array.isArray(store.closedTrades)) store.closedTrades = [];

  // Strict instance segregation: sanitize positions and trades
  store.positions = store.positions.filter(p => {
    if (!p.simulationId) {
      p.simulationId = safeSimId;
      return true;
    }
    return p.simulationId === safeSimId;
  });
  store.closedTrades = store.closedTrades.filter(t => {
    if (!t.simulationId) {
      t.simulationId = safeSimId;
      return true;
    }
    return t.simulationId === safeSimId;
  });

  // Deduplicate open positions
  if (store.positions.length > 1) {
    const seen = new Set<string>();
    const uniquePositions: EODPosition[] = [];
    for (const pos of store.positions) {
      const norm = normalizeTicker(pos.symbol, pos.market);
      if (!seen.has(norm)) {
        seen.add(norm);
        uniquePositions.push(pos);
      }
    }
    store.positions = uniquePositions;
  }

  // Sync back to DB
  await saveSimulatorStore(store, safeSimId);
  return store;
}

export async function saveSimulatorStore(state: PersistedEODState, simId: string, owner?: string): Promise<void> {
  const safeSimId = (simId || "default").replace(/[^a-zA-Z0-9_-]/g, "_");

  // 1. Write memory cache and local JSON file
  writeJsonData(portfolioKey(safeSimId), state);
  try {
    const localPath = localPortfolioPath(safeSimId);
    const dir = path.dirname(localPath);
    if (fs.existsSync(dir)) {
      fs.writeFileSync(localPath, JSON.stringify(state, null, 2), "utf8");
    }
  } catch {}

  // 2. Persist to Neon PostgreSQL database
  try {
    const prisma = getPrismaClient();
    const updateData: any = {
      initialCash: state.initialCash,
      cash: state.cash,
      positions: JSON.stringify(state.positions || []),
      closedTrades: JSON.stringify(state.closedTrades || []),
      lastRunDate: state.lastRunDate || null,
      totalRealizedPnL: state.totalRealizedPnL ?? 0,
      totalFrictionPaid: state.totalFrictionPaid ?? 0,
      winCount: state.winCount ?? 0,
      lossCount: state.lossCount ?? 0,
      lastUpdated: state.lastUpdated || new Date().toISOString()
    };
    if (owner) updateData.owner = owner;

    const createData: any = {
      simId: safeSimId,
      owner: owner || (safeSimId === 'cron_live' ? 'mr.sutharsuresh@gmail.com' : (safeSimId.includes('__') ? safeSimId.split('__')[0] : null)),
      initialCash: state.initialCash,
      cash: state.cash,
      positions: JSON.stringify(state.positions || []),
      closedTrades: JSON.stringify(state.closedTrades || []),
      history: '[]',
      lastRunDate: state.lastRunDate || null,
      totalRealizedPnL: state.totalRealizedPnL ?? 0,
      totalFrictionPaid: state.totalFrictionPaid ?? 0,
      winCount: state.winCount ?? 0,
      lossCount: state.lossCount ?? 0,
      lastUpdated: state.lastUpdated || new Date().toISOString()
    };

    await prisma.simulationStore.upsert({
      where: { simId: safeSimId },
      update: updateData,
      create: createData
    });
  } catch (dbErr) {
    console.error(`[Simulator DB] Error saving simulation store ${safeSimId} to DB:`, dbErr);
  }
}

/**
 * Append a full report to history — called ONLY when trades occurred.
 */
async function appendHistoryReport(report: EODSimulationReport, simId: string): Promise<void> {
  const safeSimId = (simId || "default").replace(/[^a-zA-Z0-9_-]/g, "_");
  let history: EODSimulationReport[] = [];

  // Try DB first
  try {
    const prisma = getPrismaClient();
    const row = await prisma.simulationStore.findUnique({ where: { simId: safeSimId } });
    if (row && row.history) {
      try { history = JSON.parse(row.history); } catch {}
    }
  } catch {}

  if (!Array.isArray(history) || history.length === 0) {
    history = readJsonData<EODSimulationReport[]>(historyKey(safeSimId), []);
  }
  if (!Array.isArray(history)) history = [];

  history.unshift(report);
  if (history.length > 100) history = history.slice(0, 100); // Keep last 100 runs

  writeJsonData(historyKey(safeSimId), history);

  try {
    const localPath = localHistoryPath(safeSimId);
    const dir = path.dirname(localPath);
    if (fs.existsSync(dir)) {
      fs.writeFileSync(localPath, JSON.stringify(history, null, 2), "utf8");
    }
  } catch {}

  // Persist history to DB
  try {
    const prisma = getPrismaClient();
    await prisma.simulationStore.upsert({
      where: { simId: safeSimId },
      update: { history: JSON.stringify(history) },
      create: {
        simId: safeSimId,
        initialCash: report.startingCapital || 100000,
        cash: report.endingCapital || 100000,
        positions: JSON.stringify(report.activePositions || []),
        closedTrades: JSON.stringify(report.closedPositions || []),
        history: JSON.stringify(history)
      }
    });
  } catch (err) {
    console.warn(`[Simulator DB] Failed to save history for ${safeSimId}:`, err);
  }
}

/**
 * For no-trade runs: silently update the latest history entry's portfolio snapshot
 * (endingCapital, activePositions, netDailyPnL) instead of adding a new row.
 */
async function updateHistoryPortfolioSnapshot(
  report: EODSimulationReport,
  simId: string
): Promise<void> {
  const safeSimId = (simId || "default").replace(/[^a-zA-Z0-9_-]/g, "_");
  let history: EODSimulationReport[] = [];

  try {
    const prisma = getPrismaClient();
    const row = await prisma.simulationStore.findUnique({ where: { simId: safeSimId } });
    if (row && row.history) {
      try { history = JSON.parse(row.history); } catch {}
    }
  } catch {}

  if (!Array.isArray(history) || history.length === 0) {
    history = readJsonData<EODSimulationReport[]>(historyKey(safeSimId), []);
  }
  if (!Array.isArray(history)) history = [];

  if (history.length > 0) {
    // Patch the most-recent entry's equity snapshot
    history[0] = {
      ...history[0],
      endingCapital: report.endingCapital,
      netDailyPnL: report.netDailyPnL,
      netDailyPnLPct: report.netDailyPnLPct,
      totalOpenPositions: report.totalOpenPositions,
      activePositions: report.activePositions,
      updatedTrailingStops: report.updatedTrailingStops,
      executionTimestamp: report.executionTimestamp,
      digest: report.digest
    };
    writeJsonData(historyKey(safeSimId), history);
    try {
      const localPath = localHistoryPath(safeSimId);
      const dir = path.dirname(localPath);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(localPath, JSON.stringify(history, null, 2), "utf8");
      }
    } catch {}

    try {
      const prisma = getPrismaClient();
      await prisma.simulationStore.update({
        where: { simId: safeSimId },
        data: { history: JSON.stringify(history) }
      });
    } catch {}
  } else {
    // No existing entries at all — write the first one even without trades
    await appendHistoryReport(report, safeSimId);
  }
}

export async function getEODHistory(simId: string = "default"): Promise<EODSimulationReport[]> {
  const safeSimId = (simId || "default").replace(/[^a-zA-Z0-9_-]/g, "_");
  try {
    const prisma = getPrismaClient();
    const row = await prisma.simulationStore.findUnique({ where: { simId: safeSimId } });
    if (row && row.history !== null && row.history !== undefined) {
      try {
        const parsed = JSON.parse(row.history);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
  } catch {}

  const history = readJsonData<EODSimulationReport[]>(historyKey(safeSimId), []);
  return Array.isArray(history) ? history : [];
}

export async function getEODPortfolio(simId: string = "default"): Promise<PersistedEODState> {
  return ensureSimulatorStore(simId);
}

/**
 * Manually closes an open paper trading position at current price.
 */
export async function closeEODPosition(
  positionId: string,
  simId: string = "default"
): Promise<{ success: boolean; closedTrade?: EODTradeExecution; portfolio: PersistedEODState }> {
  const safeSimId = (simId || "default").replace(/[^a-zA-Z0-9_-]/g, "_");
  const store = await ensureSimulatorStore(safeSimId);
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
    simulationId: safeSimId,
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
  await saveSimulatorStore(store, safeSimId);

  return { success: true, closedTrade, portfolio: store };
}

/**
 * Executes Trade Simulation:
 * Supports both Single-Step (Live / Latest EOD snapshot)
 * and Historical Replay (iterating chronologically through historical date bars from startDate to endDate).
 */
export async function runEODSimulation(options: EODSimulationOptions = {}): Promise<EODSimulationReport> {
  // ── Resolve simulation instance ─────────────────────────────────────────────
  const simId = (options.simulationId || (options as any).simId || "default").replace(/[^a-zA-Z0-9_-]/g, "_");
  const nowIsoStart = new Date().toISOString();

  const store = await ensureSimulatorStore(simId);
  if (options.forcedCapital && options.forcedCapital > 0) {
    store.cash = options.forcedCapital;
    store.initialCash = options.forcedCapital;
  }

  // Register / update this simulation in the shared registry (upsert)
  const reg = readRegistry();
  const existingEntry = reg.find(r => r.id === simId);

  const allocationPct = options.allocationPct || options.capitalAllocationPct || existingEntry?.capitalAllocationPct || existingEntry?.allocationPct || 0.15;
  const trailingStopPct = options.trailingStopPct !== undefined ? options.trailingStopPct : (existingEntry?.trailingStopPct ?? 3.0);

  // 1. Resolve active strategy
  const stratId = options.strategyId || existingEntry?.strategyId;
  let strategy = stratId ? getStrategyById(stratId) : undefined;
  if (!strategy) {
    strategy = PRESET_STRATEGIES.find(p => p.id === "strat-ema-cross") || PRESET_STRATEGIES[0];
  }

  // Resolve timeframe interval ('1m' | '5m' | '15m' | '1h' | '4h' | '1d')
  const resolvedTimeframe = options.timeframe || (options as any).interval || existingEntry?.timeframe || existingEntry?.interval || (options.mode === "HISTORICAL_REPLAY" ? "15m" : (simId === "cron_live" ? "1m" : "1d"));

  const isPublicResolved = options.isPublic !== undefined
    ? options.isPublic
    : (existingEntry?.isPublic ?? (simId === "cron_live"));

  upsertRegistry(simId, {
    label: options.simulationLabel || existingEntry?.label || simId,
    strategyId: strategy.id,
    strategyName: strategy.name,
    market: (options.market || options.marketRegion || existingEntry?.market || "IN").toUpperCase(),
    initialCash: options.forcedCapital || existingEntry?.initialCash || store.initialCash,
    timeframe: resolvedTimeframe as any,
    interval: resolvedTimeframe,
    capitalAllocationPct: allocationPct,
    allocationPct: allocationPct,
    trailingStopPct: trailingStopPct,
    lastRunAt: nowIsoStart,
    lastHeartbeatAt: nowIsoStart,
    lastHeartbeatStatus: 'RUNNING',
    totalRuns: (existingEntry?.totalRuns ?? 0) + 1,
    totalTradeRuns: existingEntry?.totalTradeRuns ?? 0, // updated after we know if trades happened
    isPublic: isPublicResolved,
    owner: options.userEmail || existingEntry?.owner || (simId === "cron_live" ? "mr.sutharsuresh@gmail.com" : (simId.includes("__") ? simId.split("__")[0] : undefined))
  });

  // 2. Resolve tracked assets for Simulation based on selected market
  const trackedSymbols: Array<{ symbol: string; market: string }> = [];
  const targetMarket = ((options as any).market || (options as any).marketRegion || existingEntry?.market || "IN").toUpperCase();

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

  // Resolve timeframe interval ('1m' | '5m' | '15m' | '1h' | '4h' | '1d')
  const targetInterval = resolvedTimeframe;
  let replayDaysNeeded = options.replayDays !== undefined ? options.replayDays : 30;
  if (options.startDate) {
    const diffDays = Math.ceil((Date.now() - new Date(options.startDate).getTime()) / (1000 * 3600 * 24));
    if (diffDays > 0) replayDaysNeeded = Math.max(replayDaysNeeded, diffDays);
  }
  const candlePeriod = (targetInterval === '1m')
    ? '5D'
    : (replayDaysNeeded <= 30 ? '1M' : (replayDaysNeeded <= 60 ? '2M' : (replayDaysNeeded <= 90 ? '3M' : (replayDaysNeeded <= 180 ? '6M' : '1Y'))));

  // Pre-fetch candles for all tracked symbols using the selected timeframe
  const candlesMap = new Map<string, any[]>();
  const quotesMap = new Map<string, any>();

  await Promise.all(
    trackedSymbols.map(async item => {
      try {
        const normSym = normalizeTicker(item.symbol, item.market);
        const [q, historyRes] = await Promise.all([
          getQuote(normSym, item.market).catch(() => null),
          getHistory(normSym, candlePeriod, targetInterval, item.market).catch(() => null)
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

  const isReplayMode = options.mode === "HISTORICAL_REPLAY";

  // If in Historical Replay Mode, determine the date range to replay
  if (isReplayMode) {
    const isIntraday = targetInterval !== '1d';

    // Collect all unique dates and bar timestamps across candle datasets
    const allDatesSet = new Set<string>();
    const allBarTimesSet = new Set<string>();

    // Build O(1) fast lookup index maps per symbol
    const symbolBarMap = new Map<string, Map<string, { candle: any; index: number }>>();
    const symbolDateBarsMap = new Map<string, Map<string, { candle: any; index: number }[]>>();

    candlesMap.forEach((candles, sym) => {
      const barMap = new Map<string, { candle: any; index: number }>();
      const dateMap = new Map<string, { candle: any; index: number }[]>();

      candles.forEach((c, idx) => {
        if (c.isoTime) {
          barMap.set(c.isoTime, { candle: c, index: idx });
          allBarTimesSet.add(c.isoTime);

          const d = c.isoTime.slice(0, 10);
          allDatesSet.add(d);
          if (!dateMap.has(d)) dateMap.set(d, []);
          dateMap.get(d)!.push({ candle: c, index: idx });
        }
      });

      symbolBarMap.set(sym, barMap);
      symbolDateBarsMap.set(sym, dateMap);
    });

    const sortedDates = Array.from(allDatesSet).sort();

    let startDate = options.startDate;
    let endDate = options.endDate || sortedDates[sortedDates.length - 1];

    if (!startDate) {
      const daysBack = options.replayDays !== undefined ? options.replayDays : 30;
      if (daysBack === 0) {
        // Intraday Today mode
        startDate = sortedDates[sortedDates.length - 1];
        endDate = startDate;
      } else {
        const targetTime = Date.now() - (daysBack * 86400000);
        const targetIso = new Date(targetTime).toISOString().slice(0, 10);
        startDate = sortedDates.find(d => d >= targetIso) || sortedDates[0];
      }
    }

    const isSingleDayOrToday = options.replayDays === 0 || (startDate && endDate && startDate === endDate);
    const replayDates = sortedDates.filter(d => d >= startDate! && d <= endDate! && isExchangeTradingDay(targetMarket, d));
    let validReplayDates = replayDates.length > 0 
      ? replayDates 
      : (isSingleDayOrToday 
          ? sortedDates.filter(d => isExchangeTradingDay(targetMarket, d)).slice(-1)
          : sortedDates.filter(d => isExchangeTradingDay(targetMarket, d)).slice(-30));

    // Build chronological sequence of replay steps:
    // If Intraday (15m, 5m, 1m, 1h, 4h), step bar-by-bar across every intraday candle
    // If Daily ('1d'), step day-by-day
    let replaySteps: { stepIso: string; dateStr: string }[] = [];

    if (isIntraday) {
      const sortedBarTimes = Array.from(allBarTimesSet).sort();
      const nowIso = new Date().toISOString();
      const todayStr = nowIso.slice(0, 10);
      const sessionStatus = getMarketSessionStatus(targetMarket);

      const validBars = sortedBarTimes.filter(bt => {
        const d = bt.slice(0, 10);
        if (d < startDate! || d > endDate!) return false;
        if (!isExchangeTradingDay(targetMarket, d)) return false;

        // If simulating today's live session and market is currently active/open:
        // Replay up to the current time of execution (nowIso)!
        // If executed later on (after market close): replay all bars through the end of the stock trading session.
        if (d === todayStr && sessionStatus.isOpen && bt > nowIso) {
          return false;
        }

        return true;
      });

      // Fallback: if user picked today but today's session has 0 bars yet (e.g. weekend or pre-market),
      // fallback to the most recent completed trading session's intraday bars
      const effectiveBars = (validBars.length === 0 && sortedBarTimes.length > 0)
        ? sortedBarTimes.filter(bt => bt.slice(0, 10) === sortedDates[sortedDates.length - 1])
        : validBars;

      replaySteps = effectiveBars.map(bt => ({
        stepIso: bt,
        dateStr: bt.slice(0, 10)
      }));

      // Reflect the actual dates processed in validReplayDates
      if (replaySteps.length > 0) {
        const steppedDates = Array.from(new Set(replaySteps.map(s => s.dateStr))).sort();
        if (steppedDates.length > 0) {
          validReplayDates = steppedDates;
        }
      }
    } else {
      replaySteps = validReplayDates.map(d => {
        const stepIso = targetMarket === 'IN' 
          ? `${d}T03:45:00.000Z` // 09:15:00 IST Market Session Open
          : (targetMarket === 'US' ? `${d}T13:30:00.000Z` : `${d}T08:00:00.000Z`);
        return {
          stepIso,
          dateStr: d
        };
      });
    }

    const startingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
    const closedTradesAll: EODTradeExecution[] = [];
    const openedTradesAll: EODTradeExecution[] = [];
    const updatedTrailingStopsAll: EODTrailingStopUpdate[] = [];

    // Chronologically step through each bar / trading session
    for (const step of replaySteps) {
      const { stepIso, dateStr } = step;
      const simDate = dateStr;
      // Step A: Evaluate Open Positions against this day's candle
      const remainingPositions: EODPosition[] = [];

      for (const pos of store.positions) {
        const barEntry = isIntraday
          ? symbolBarMap.get(pos.symbol)?.get(stepIso)
          : (symbolBarMap.get(pos.symbol)?.get(stepIso) || symbolDateBarsMap.get(pos.symbol)?.get(dateStr)?.[0]);

        if (!barEntry) {
          remainingPositions.push(pos);
          continue;
        }

        const candle = barEntry.candle;
        const { high, low, close } = candle;
        pos.currentPrice = close;
        pos.currentValue = pos.shares * close;
        pos.daysHeld = Math.max(1, Math.round((new Date(dateStr).getTime() - new Date(pos.entryDate).getTime()) / (1000 * 3600 * 24)));

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
          if (pos.stopLoss > pos.entryPrice) {
            exitType = "TRAILING_STOP_EXIT";
            exitReason = `Trailing Stop profit protection triggered at ${exitPrice.toFixed(2)} (Locked in gain above entry ${pos.entryPrice.toFixed(2)})`;
          } else {
            exitType = "STOP_LOSS";
            exitReason = `Stop-Loss triggered at ${exitPrice.toFixed(2)} (Low: ${low.toFixed(2)})`;
          }
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

          if (exitType === "TAKE_PROFIT" && realizedPnL < 0) {
            exitReason += ` (Net loss of ${realizedPnL.toFixed(2)} due to ${friction.totalFriction.toFixed(2)} friction/STT fees)`;
          }

          const exitIso = resolveAccurateTradeTimestamp({
            dateStr,
            market: targetMarket,
            type: exitType,
            existingIso: candle.isoTime || stepIso,
            intradayBars: symbolDateBarsMap.get(pos.symbol)?.get(dateStr)?.map(b => b.candle),
            priceTarget: exitPrice,
            isDaily: !isIntraday
          });

          const accurateEntryIso = resolveAccurateTradeTimestamp({
            dateStr: pos.entryDate,
            market: targetMarket,
            type: "BUY_ENTRY",
            existingIso: pos.entryTimestamp,
            priceTarget: pos.entryPrice,
            isDaily: !isIntraday
          });

          const tradeExecution: EODTradeExecution = {
            id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
            simulationId: simId,
            type: exitType,
            symbol: pos.symbol,
            companyName: pos.name,
            shares: pos.shares,
            price: parseFloat(exitPrice.toFixed(2)),
            entryPrice: pos.entryPrice,
            entryDate: pos.entryDate,
            entryTimestamp: accurateEntryIso,
            exitPrice: parseFloat(exitPrice.toFixed(2)),
            exitDate: dateStr,
            exitTimestamp: exitIso,
            holdingDays: pos.daysHeld,
            currency: pos.currency,
            currencySymbol: pos.currencySymbol,
            realizedPnL: parseFloat(realizedPnL.toFixed(2)),
            realizedPnLPct: parseFloat(realizedPnLPct.toFixed(2)),
            friction: parseFloat(friction.totalFriction.toFixed(2)),
            reason: exitReason,
            executedAt: exitIso
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

      // Step B: Scan Universe for New Entries on this bar
      for (const item of trackedSymbols) {
        if (store.positions.some(p => p.symbol === item.symbol)) continue;

        const barEntry = isIntraday
          ? symbolBarMap.get(item.symbol)?.get(stepIso)
          : (symbolBarMap.get(item.symbol)?.get(stepIso) || symbolDateBarsMap.get(item.symbol)?.get(dateStr)?.[0]);

        if (!barEntry || barEntry.index < 20) continue; // Need at least 20 historical bars for indicators

        const candles = candlesMap.get(item.symbol) || [];
        const candlesUpToDate = candles.slice(0, barEntry.index + 1);
        const candle = barEntry.candle;
        const entryPrice = candle.close;

        const quote = {
          symbol: item.symbol,
          current_price: entryPrice,
          price: entryPrice,
          name: quotesMap.get(item.symbol)?.name || formatTickerDisplay(item.symbol).cleanSymbol
        };
        const signal = evaluateStrategy(strategy, candlesUpToDate, quote as any, {});

        if (signal.action === "BUY" && signal.confidence >= 0.55) {
          if (store.positions.length >= (options.maxConcurrentPositions || 10)) {
            continue;
          }

          // Strictly ensure Take Profit > Entry Price and Stop Loss < Entry Price
          const rawTP = signal.targetPrice || (signal as any).takeProfit;
          const takeProfit = (rawTP && rawTP > entryPrice * 1.01)
            ? parseFloat(rawTP.toFixed(2))
            : parseFloat((entryPrice * 1.10).toFixed(2));

          const rawSL = signal.stopLoss;
          const stopLoss = (rawSL && rawSL < entryPrice * 0.99)
            ? parseFloat(rawSL.toFixed(2))
            : parseFloat((entryPrice * 0.95).toFixed(2));

          let shares = Math.floor((store.cash * allocationPct) / entryPrice);
          if (options.positionSizingModel === 'RISK_BASED') {
            const totalEquity = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
            const riskPct = options.riskPerTradePct || 1.5;
            const dollarRisk = totalEquity * (riskPct / 100);
            const perShareRisk = Math.max(0.01, entryPrice - stopLoss);
            const riskShares = Math.floor(dollarRisk / perShareRisk);
            const maxCashShares = Math.floor((store.cash * (allocationPct || 0.20)) / entryPrice);
            shares = Math.min(riskShares, maxCashShares);
          }

          if (shares > 0 && store.cash >= entryPrice) {
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

              const isIndian = item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO') || item.market === 'IN';
              const isEU = item.symbol.endsWith('.L') || item.symbol.endsWith('.DE') || item.symbol.endsWith('.PA') || item.market === 'EU';
              const posCurr = isIndian ? 'INR' : (isEU ? 'EUR' : 'USD');
              const posCurrSym = isIndian ? '₹' : (isEU ? '€' : '$');
              const entryIso = resolveAccurateTradeTimestamp({
                dateStr,
                market: item.market || targetMarket,
                type: "BUY_ENTRY",
                existingIso: candle.isoTime || stepIso,
                intradayBars: symbolDateBarsMap.get(item.symbol)?.get(dateStr)?.map(b => b.candle),
                priceTarget: entryPrice,
                isDaily: !isIntraday
              });

              const newPos: EODPosition = {
                id: `pos-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
                simulationId: simId,
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
                entryDate: dateStr,
                entryTimestamp: entryIso,
                totalCost: parseFloat(totalCost.toFixed(2)),
                currentValue: parseFloat((shares * entryPrice).toFixed(2)),
                daysHeld: 0,
                status: "OPEN"
              };

              store.positions.push(newPos);

              openedTradesAll.push({
                id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
                simulationId: simId,
                type: "BUY_ENTRY",
                symbol: item.symbol,
                companyName: newPos.name,
                shares,
                price: parseFloat(entryPrice.toFixed(2)),
                entryPrice: parseFloat(entryPrice.toFixed(2)),
                entryDate: dateStr,
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
    await saveSimulatorStore(store, simId);

    const endingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
    const netTotalPnL = endingCapital - startingCapital;
    const netTotalPnLPct = startingCapital > 0 ? (netTotalPnL / startingCapital) * 100 : 0;
    const replayTradesCount = closedTradesAll.length + openedTradesAll.length;
    const hadTrades = replayTradesCount > 0;
    const hadActions = hadTrades || updatedTrailingStopsAll.length > 0;

    const digest = isIntraday
      ? `Historical Intraday Replay (${simId}) completed for ${validReplayDates[0]}${validReplayDates.length > 1 ? ` to ${lastReplayDate}` : ''} (${replaySteps.length} intraday bars from market open). Positions Closed: ${closedTradesAll.length}, New Positions Initiated: ${openedTradesAll.length}, Active Holding: ${store.positions.length}. Total Return: ${netTotalPnL >= 0 ? '+' : ''}${netTotalPnL.toFixed(2)} (${netTotalPnLPct.toFixed(2)}%). Ending Equity: ${endingCapital.toFixed(2)}.`
      : `Historical Replay (${simId}) completed from ${validReplayDates[0]} to ${lastReplayDate} (${validReplayDates.length} trading days). Positions Closed: ${closedTradesAll.length}, New Positions Initiated: ${openedTradesAll.length}, Active Holding: ${store.positions.length}. Total Return: ${netTotalPnL >= 0 ? '+' : ''}${netTotalPnL.toFixed(2)} (${netTotalPnLPct.toFixed(2)}%). Ending Equity: ${endingCapital.toFixed(2)}.`;

    const report: EODSimulationReport = {
      id: `eod-replay-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      simulationId: simId,
      simulatedDate: lastReplayDate,
      executionTimestamp: new Date().toISOString(),
      strategyId: strategy.id,
      strategyName: strategy.name,
      startingCapital: parseFloat(startingCapital.toFixed(2)),
      endingCapital: parseFloat(endingCapital.toFixed(2)),
      netDailyPnL: parseFloat(netTotalPnL.toFixed(2)),
      netDailyPnLPct: parseFloat(netTotalPnLPct.toFixed(2)),
      totalOpenPositions: store.positions.length,
      totalTradesExecuted: replayTradesCount,
      closedPositions: closedTradesAll,
      openedPositions: openedTradesAll,
      updatedTrailingStops: updatedTrailingStopsAll,
      activePositions: store.positions,
      digest,
      replayMode: "HISTORICAL_REPLAY",
      replayedDaysCount: validReplayDates.length,
      hadTrades,
      hadActions
    };

    if (hadActions) {
      await appendHistoryReport(report, simId);
      const reg = readRegistry();
      const cur = reg.find(r => r.id === simId);
      if (cur) {
        upsertRegistry(simId, {
          totalTradeRuns: (cur.totalTradeRuns ?? 0) + (hadTrades ? 1 : 0),
          lastTradeAt: hadTrades ? new Date().toISOString() : cur.lastTradeAt,
          lastHeartbeatAt: new Date().toISOString(),
          lastHeartbeatStatus: 'REPLAY_COMPLETED'
        });
      }
    } else {
      await updateHistoryPortfolioSnapshot(report, simId);
    }
    return report;
  }

  // ── Mode B: Single Step (Current Daily EOD Session) ───────────────────────────
  const closedTrades: EODTradeExecution[] = [];
  const openedTrades: EODTradeExecution[] = [];
  const updatedTrailingStops: EODTrailingStopUpdate[] = [];

  const startingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
  const nowIso = new Date().toISOString();
  const simDate = nowIso.slice(0, 10);
  const sessionStatus = getMarketSessionStatus(targetMarket);

  // 3. Step A: Manage Existing Open Positions against Daily Candle High/Low
  const remainingPositions: EODPosition[] = [];

  for (const pos of store.positions) {
    try {
      let candles = candlesMap.get(pos.symbol) || [];
      if (!candles || candles.length === 0) {
        const region = detectMarketRegion(pos.symbol);
        const historyRes = await getHistory(pos.symbol, candlePeriod, targetInterval, region).catch(() => null);
        candles = (historyRes as any)?.candles || [];
      }

      if (!candles || candles.length === 0) {
        remainingPositions.push(pos);
        continue;
      }

      const lastCandle = candles[candles.length - 1];
      const { high, low, close } = lastCandle;

      // Determine latest live market price: check live quote first (LTP / post-market price), fallback to candle close
      let livePrice = close;
      try {
        const quote = quotesMap.get(pos.symbol) || await getQuote(pos.symbol, detectMarketRegion(pos.symbol)).catch(() => null);
        if (quote && typeof quote.price === "number" && quote.price > 0) {
          livePrice = quote.price;
        }
      } catch {}

      pos.currentPrice = parseFloat(livePrice.toFixed(2));
      pos.currentValue = parseFloat((pos.shares * pos.currentPrice).toFixed(2));
      pos.daysHeld = Math.max(1, Math.round((Date.now() - new Date(pos.entryTimestamp || pos.entryDate).getTime()) / (1000 * 3600 * 24)));
      pos.unrealizedPnL = parseFloat(((pos.currentPrice - pos.entryPrice) * pos.shares).toFixed(2));
      pos.unrealizedPnLPct = pos.entryPrice > 0 ? parseFloat((((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2)) : 0;

      let closed = false;
      let exitPrice = pos.currentPrice;
      let exitReason = "";
      let exitType: EODTradeExecution["type"] = "TAKE_PROFIT";

      // Check Take Profit Hit against candle high or current live price
      if (high >= pos.takeProfit || pos.currentPrice >= pos.takeProfit) {
        closed = true;
        exitPrice = pos.takeProfit;
        exitReason = `Take-Profit limit target reached at ${exitPrice.toFixed(2)} (High: ${high.toFixed(2)}, Current: ${pos.currentPrice.toFixed(2)})`;
        exitType = "TAKE_PROFIT";
      }
      // Check Stop Loss / Trailing Stop Hit against candle low or current live price
      else if (low <= pos.stopLoss || pos.currentPrice <= pos.stopLoss) {
        closed = true;
        exitPrice = pos.stopLoss;
        if (pos.stopLoss > pos.entryPrice) {
          exitType = "TRAILING_STOP_EXIT";
          exitReason = `Trailing Stop profit protection triggered at ${exitPrice.toFixed(2)} (Locked in gain above entry ${pos.entryPrice.toFixed(2)})`;
        } else {
          exitType = "STOP_LOSS";
          exitReason = `Stop-Loss triggered at ${exitPrice.toFixed(2)} (Low: ${low.toFixed(2)}, Current: ${pos.currentPrice.toFixed(2)})`;
        }
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

        if (exitType === "TAKE_PROFIT" && realizedPnL < 0) {
          exitReason += ` (Net loss of ${realizedPnL.toFixed(2)} due to ${friction.totalFriction.toFixed(2)} friction/STT fees)`;
        }

        // Exact execution timestamp of exit
        const accurateExitIso = nowIso;
        const accurateEntryIso = pos.entryTimestamp || nowIso;

        const tradeExecution: EODTradeExecution = {
          id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
          simulationId: simId,
          type: exitType,
          symbol: pos.symbol,
          companyName: pos.name,
          shares: pos.shares,
          price: parseFloat(exitPrice.toFixed(2)),
          entryPrice: pos.entryPrice,
          entryDate: pos.entryDate,
          entryTimestamp: accurateEntryIso,
          exitPrice: parseFloat(exitPrice.toFixed(2)),
          exitDate: simDate,
          exitTimestamp: accurateExitIso,
          holdingDays: pos.daysHeld,
          currency: pos.currency,
          currencySymbol: pos.currencySymbol,
          realizedPnL: parseFloat(realizedPnL.toFixed(2)),
          realizedPnLPct: parseFloat(realizedPnLPct.toFixed(2)),
          friction: parseFloat(friction.totalFriction.toFixed(2)),
          reason: exitReason,
          executedAt: accurateExitIso
        };

        closedTrades.push(tradeExecution);
        store.closedTrades.unshift(tradeExecution);
      } else {
        // Trailing Stop Check: evaluate against highest of candle close and current price
        const highestRecent = Math.max(close, pos.currentPrice);
        if (highestRecent > pos.highestPriceSinceEntry) {
          const oldStop = pos.stopLoss;
          const newStop = Math.max(oldStop, parseFloat((highestRecent * (1 - trailingStopPct / 100)).toFixed(2)));
          if (newStop > oldStop) {
            pos.stopLoss = newStop;
            pos.highestPriceSinceEntry = highestRecent;
            updatedTrailingStops.push({
              symbol: pos.symbol,
              oldStop,
              newStop,
              highPrice: highestRecent
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

  // 4. Step B: Scan Tracked Watchlist Assets for New Entries
  // Market Session Gatekeeper: If market is closed, new trade entries are strictly blocked.
  const allowNewEntries = sessionStatus.isOpen || Boolean((options as any).allowAfterHours);

  if (!allowNewEntries) {
    console.log(`[Simulator] Market is closed for ${targetMarket} (${sessionStatus.reason}). New trade entries are paused.`);
  } else {
    for (const item of trackedSymbols) {
      if (store.positions.length >= (options.maxConcurrentPositions || 10)) {
        break;
      }

      const normSym = normalizeTicker(item.symbol, item.market);
      // Strictly prevent duplicate positions for the same stock asset:
      const alreadyOpen = store.positions.some(p => {
        const pNorm = normalizeTicker(p.symbol, p.market || item.market);
        return pNorm === normSym || p.symbol === normSym || p.symbol === item.symbol;
      });
      if (alreadyOpen) continue;

      try {
        const candles = candlesMap.get(normSym) || candlesMap.get(item.symbol) || [];
        const quote = quotesMap.get(normSym) || quotesMap.get(item.symbol) || null;

        if (!candles || candles.length < 20) continue;

        const signal = evaluateStrategy(strategy, candles, quote, {});
        if (signal.action === "BUY" && signal.confidence >= 0.55) {
          const lastCandle = candles[candles.length - 1];
          // Prefer live market quote LTP for real-time entry; fallback to candle close
          const liveEntry = (quote && typeof quote.price === "number" && quote.price > 0)
            ? quote.price
            : lastCandle.close;
          const entryPrice = parseFloat(liveEntry.toFixed(2));

          // Strictly ensure Take Profit > Entry Price and Stop Loss < Entry Price
          const rawTP = signal.targetPrice || (signal as any).takeProfit;
          const takeProfit = (rawTP && rawTP > entryPrice * 1.01)
            ? parseFloat(rawTP.toFixed(2))
            : parseFloat((entryPrice * 1.10).toFixed(2));

          const rawSL = signal.stopLoss;
          const stopLoss = (rawSL && rawSL < entryPrice * 0.99)
            ? parseFloat(rawSL.toFixed(2))
            : parseFloat((entryPrice * 0.95).toFixed(2));

          let shares = Math.floor((store.cash * allocationPct) / entryPrice);
          if (options.positionSizingModel === 'RISK_BASED') {
            const totalEquity = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
            const riskPct = options.riskPerTradePct || 1.5;
            const dollarRisk = totalEquity * (riskPct / 100);
            const perShareRisk = Math.max(0.01, entryPrice - stopLoss);
            const riskShares = Math.floor(dollarRisk / perShareRisk);
            const maxCashShares = Math.floor((store.cash * (allocationPct || 0.20)) / entryPrice);
            shares = Math.min(riskShares, maxCashShares);
          }

          if (shares > 0 && store.cash >= entryPrice) {
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

              const isIndian = normSym.endsWith('.NS') || normSym.endsWith('.BO') || item.market === 'IN';
              const isEU = normSym.endsWith('.L') || normSym.endsWith('.DE') || normSym.endsWith('.PA') || item.market === 'EU';
              const posCurr = isIndian ? 'INR' : (isEU ? 'EUR' : 'USD');
              const posCurrSym = isIndian ? '₹' : (isEU ? '€' : '$');

              // Exact execution timestamp of entry
              const entryIso = nowIso;

              const newPos: EODPosition = {
                id: `pos-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
                simulationId: simId,
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
                entryTimestamp: entryIso,
                totalCost: parseFloat(totalCost.toFixed(2)),
                currentValue: parseFloat((shares * entryPrice).toFixed(2)),
                daysHeld: 0,
                status: "OPEN"
              };

              store.positions.push(newPos);

              openedTrades.push({
                id: `eod-trade-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
                simulationId: simId,
                type: "BUY_ENTRY",
                symbol: normSym,
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
                reason: (signal.reasoning && signal.reasoning.length > 0) ? signal.reasoning.join("; ") : `Automated Entry based on ${strategy.name}`,
                executedAt: entryIso
              });
            }
          }
        }
      } catch (err) {
        console.warn(`[EOD Simulator] Error evaluating entry on ${item.symbol}:`, err);
      }
    }
  }

  // 5. Finalize EOD Metrics & Ledger
  store.lastRunDate = simDate;
  store.lastUpdated = nowIso;
  await saveSimulatorStore(store, simId);

  const endingCapital = store.cash + store.positions.reduce((acc, p) => acc + (p.shares * p.currentPrice), 0);
  const netDailyPnL = endingCapital - startingCapital;
  const netDailyPnLPct = startingCapital > 0 ? (netDailyPnL / startingCapital) * 100 : 0;
  const tradesCount = closedTrades.length + openedTrades.length;
  const trailingStopsCount = updatedTrailingStops.length;
  const hadTrades = tradesCount > 0;
  const hadActions = hadTrades || trailingStopsCount > 0;

  let sessionNote = '';
  if (!sessionStatus.isOpen) {
    sessionNote = ` [Market Session: ${sessionStatus.reason} • New entries paused]`;
  }

  const digest = `EOD Batch Simulation (${simId}) completed for ${simDate}.${sessionNote} Positions closed: ${closedTrades.length}, New positions: ${openedTrades.length}, Trailing stops raised: ${updatedTrailingStops.length}. Daily PnL: ${netDailyPnL >= 0 ? '+' : ''}${netDailyPnL.toFixed(2)} (${netDailyPnLPct.toFixed(2)}%). Total Equity: ${endingCapital.toFixed(2)}.`;

  const report: EODSimulationReport = {
    id: `eod-run-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    simulationId: simId,
    simulatedDate: simDate,
    executionTimestamp: nowIso,
    strategyId: strategy.id,
    strategyName: strategy.name,
    startingCapital: parseFloat(startingCapital.toFixed(2)),
    endingCapital: parseFloat(endingCapital.toFixed(2)),
    netDailyPnL: parseFloat(netDailyPnL.toFixed(2)),
    netDailyPnLPct: parseFloat(netDailyPnLPct.toFixed(2)),
    totalOpenPositions: store.positions.length,
    totalTradesExecuted: tradesCount,
    closedPositions: closedTrades,
    openedPositions: openedTrades,
    updatedTrailingStops,
    activePositions: store.positions,
    digest,
    replayMode: "SINGLE_STEP",
    hadTrades,
    hadActions,
    isHoliday: sessionStatus.isHoliday,
    holidayName: sessionStatus.holidayName,
    marketSessionType: sessionStatus.sessionType
  };

  // Only append a new log entry when actionable events (trades executed or trailing stops raised) occurred!
  // If no trades or stops changed, only update the existing latest equity snapshot in-place to prevent log bloat on 1-minute crons.
  if (hadActions) {
    await appendHistoryReport(report, simId);
    const reg = readRegistry();
    const cur = reg.find(r => r.id === simId);
    if (cur) {
      upsertRegistry(simId, {
        totalTradeRuns: (cur.totalTradeRuns ?? 0) + (hadTrades ? 1 : 0),
        lastTradeAt: hadTrades ? nowIso : cur.lastTradeAt,
        lastHeartbeatAt: nowIso,
        lastHeartbeatStatus: sessionStatus.isOpen ? 'ACTIVE_MARKET_OPEN' : `IDLE_${sessionStatus.sessionType || 'MARKET_CLOSED'}`
      });
    }
  } else {
    await updateHistoryPortfolioSnapshot(report, simId);
    const reg = readRegistry();
    const cur = reg.find(r => r.id === simId);
    if (cur) {
      upsertRegistry(simId, {
        lastHeartbeatAt: nowIso,
        lastHeartbeatStatus: sessionStatus.isOpen ? 'ACTIVE_MARKET_OPEN' : `IDLE_${sessionStatus.sessionType || 'MARKET_CLOSED'}`
      });
    }
  }

  return report;
}

/**
 * Resets the Trade Simulator virtual portfolio state and clears history for a given simulationId.
 */
export async function resetSimulator(
  initialCash: number = 100000,
  marketRegion: string = "IN",
  simId: string = "default"
): Promise<PersistedEODState> {
  const safeSimId = (simId || "default").replace(/[^a-zA-Z0-9_-]/g, "_");
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

  // Identify all potential ID aliases (e.g. cron_live and system__cron_live) so all layers are purged
  const relatedSimIds = Array.from(new Set([
    safeSimId,
    simId,
    `system__${safeSimId}`,
    safeSimId.replace(/^system__/, '')
  ]));

  // 1. Wipe local memory cache and JSON files across all related IDs
  for (const id of relatedSimIds) {
    writeJsonData(portfolioKey(id), freshState);
    writeJsonData(historyKey(id), []);
    try {
      const histPath = localHistoryPath(id);
      const portPath = localPortfolioPath(id);
      if (fs.existsSync(histPath)) fs.writeFileSync(histPath, "[]\n", "utf8");
      if (fs.existsSync(portPath)) fs.writeFileSync(portPath, JSON.stringify(freshState, null, 2), "utf8");
    } catch {}
  }

  // 2. Wipe and overwrite rows in Neon PostgreSQL DB
  try {
    const prisma = getPrismaClient();
    for (const id of relatedSimIds) {
      await prisma.simulationStore.upsert({
        where: { simId: id },
        update: {
          initialCash,
          cash: initialCash,
          positions: "[]",
          closedTrades: "[]",
          history: "[]",
          totalRealizedPnL: 0,
          totalFrictionPaid: 0,
          winCount: 0,
          lossCount: 0,
          lastRunDate: null,
          lastUpdated: new Date().toISOString()
        },
        create: {
          simId: id,
          initialCash,
          cash: initialCash,
          positions: "[]",
          closedTrades: "[]",
          history: "[]",
          totalRealizedPnL: 0,
          totalFrictionPaid: 0,
          winCount: 0,
          lossCount: 0,
          lastRunDate: null,
          lastUpdated: new Date().toISOString()
        }
      });
    }
  } catch (dbErr) {
    console.warn(`[Simulator DB] Warning while purging simulation store in DB for ${safeSimId}:`, dbErr);
  }

  // 3. Update registry metrics on reset
  upsertRegistry(safeSimId, {
    initialCash,
    totalRuns: 0,
    totalTradeRuns: 0,
    lastRunAt: new Date().toISOString(),
    lastTradeAt: undefined
  });

  return freshState;
}
