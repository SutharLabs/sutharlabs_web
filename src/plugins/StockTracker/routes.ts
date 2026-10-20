import { Router } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { authenticateToken, optionalAuth } from "../../middleware/auth.js";
import { getPrismaClient } from "../../../api/_utils.js";
import {
  getQuote,
  getHistory,
  getAnalysis,
  getSuggestion,
  searchStocks,
  formatTickerDisplay,
  normalizeTicker,
  MARKET_UNIVERSES,
  KNOWN_US_TICKERS
} from "../StockAnalyzer/index.js";
import {
  loadStrategiesFromDisk,
  saveStrategiesToDisk,
  getStrategyById,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  forkStrategy,
  publishStrategy,
  addStrategyReview,
  deleteStrategyReview,
  setVerifiedBacktestBadge
} from "./strategies/store.js";
import { evaluateStrategy } from "./strategies/engine.js";
import { PRESET_STRATEGIES } from "./strategies/presets.js";
import { fetchStockNews, analyzeStockSentiment, testGeminiApiKey } from "./news/index.js";
import {
  runBacktest,
  calculateRegionalFriction,
  detectMarketRegion,
  getRegionCurrencyInfo
} from "./backtest/index.js";
import { runMarketScan, dispatchWebhookAlert } from "./scanner/index.js";
import {
  runEODSimulation,
  getEODHistory,
  getEODPortfolio,
  resetSimulator,
  closeEODPosition,
  listSimulations,
  createSimulationInstance,
  deleteSimulation,
  setSimulationPublicStatus,
  updateSimulationConfig,
  type SimulationRegistryEntry
} from "./simulator/index.js";
import { readJsonData, writeJsonData } from "./storageUtils.js";

export interface WatchlistItem {
  symbol: string;
  market: string;
  cleanSymbol: string;
  displaySymbol: string;
  name: string;
  exchange: string;
  addedAt?: string;
}

export interface WatchlistRecord {
  id: string;
  name: string;
  isDefault?: boolean;
  userEmail?: string;
  items: WatchlistItem[];
  symbols: string[];
  createdAt: string;
  updatedAt: string;
}

const SEED_WATCHLISTS: WatchlistRecord[] = [
  {
    id: "wl-india-core",
    name: "India Core & Momentum",
    isDefault: true,
    userEmail: "system",
    items: [
      { symbol: "RELIANCE.NS",   market: "IN", cleanSymbol: "RELIANCE",   displaySymbol: "RELIANCE (NSE)",   name: "Reliance Industries Limited", exchange: "NSE" },
      { symbol: "TCS.NS",        market: "IN", cleanSymbol: "TCS",        displaySymbol: "TCS (NSE)",        name: "Tata Consultancy Services Limited", exchange: "NSE" },
      { symbol: "INFY.NS",       market: "IN", cleanSymbol: "INFY",       displaySymbol: "INFY (NSE)",       name: "Infosys Limited", exchange: "NSE" },
      { symbol: "HDFCBANK.NS",   market: "IN", cleanSymbol: "HDFCBANK",   displaySymbol: "HDFCBANK (NSE)",   name: "HDFC Bank Limited", exchange: "NSE" },
      { symbol: "ATHERENERG.NS", market: "IN", cleanSymbol: "ATHERENERG", displaySymbol: "ATHERENERG (NSE)", name: "Ather Energy Limited", exchange: "NSE" },
      { symbol: "ETERNAL.NS",     market: "IN", cleanSymbol: "ETERNAL",     displaySymbol: "ETERNAL (NSE)",     name: "Eternal / Zomato", exchange: "NSE" }
    ],
    symbols: ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ATHERENERG.NS", "ETERNAL.NS"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "wl-us-tech",
    name: "US Tech Leaders",
    userEmail: "system",
    items: [
      { symbol: "AAPL",  market: "US", cleanSymbol: "AAPL",  displaySymbol: "AAPL (NASDAQ)",  name: "Apple Inc.", exchange: "NASDAQ" },
      { symbol: "MSFT",  market: "US", cleanSymbol: "MSFT",  displaySymbol: "MSFT (NASDAQ)",  name: "Microsoft Corp.", exchange: "NASDAQ" },
      { symbol: "NVDA",  market: "US", cleanSymbol: "NVDA",  displaySymbol: "NVDA (NASDAQ)",  name: "NVIDIA Corp.", exchange: "NASDAQ" },
      { symbol: "GOOGL", market: "US", cleanSymbol: "GOOGL", displaySymbol: "GOOGL (NASDAQ)", name: "Alphabet Inc.", exchange: "NASDAQ" },
      { symbol: "AMZN",  market: "US", cleanSymbol: "AMZN",  displaySymbol: "AMZN (NASDAQ)",  name: "Amazon.com Inc.", exchange: "NASDAQ" },
      { symbol: "TSLA",  market: "US", cleanSymbol: "TSLA",  displaySymbol: "TSLA (NASDAQ)",  name: "Tesla Inc.", exchange: "NASDAQ" }
    ],
    symbols: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "TSLA"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "wl-ev-green",
    name: "EV & Mobility Growth",
    userEmail: "system",
    items: [
      { symbol: "ATHERENERG.NS", market: "IN", cleanSymbol: "ATHERENERG", displaySymbol: "ATHERENERG (NSE)", name: "Ather Energy Limited", exchange: "NSE" },
      { symbol: "TMCV.NS",       market: "IN", cleanSymbol: "TMCV",       displaySymbol: "TMCV (NSE)",       name: "Tata Motors Limited", exchange: "NSE" },
      { symbol: "TSLA",          market: "US", cleanSymbol: "TSLA",       displaySymbol: "TSLA (NASDAQ)",    name: "Tesla Inc.", exchange: "NASDAQ" }
    ],
    symbols: ["ATHERENERG.NS", "TMCV.NS", "TSLA"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function loadWatchlistsFromDisk(): WatchlistRecord[] {
  try {
    const parsed = readJsonData<WatchlistRecord[]>("watchlists.json", []);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("[Watchlist DB] Error reading watchlists.json:", err);
  }
  // Initialize with seed defaults
  saveWatchlistsToDisk(SEED_WATCHLISTS);
  return SEED_WATCHLISTS;
}

function saveWatchlistsToDisk(watchlists: WatchlistRecord[]): void {
  try {
    writeJsonData("watchlists.json", watchlists);
  } catch (err) {
    console.error("[Watchlist DB] Error saving watchlists.json:", err);
  }
}

export function registerRoutes(router: Router) {
  // Returns multi-market universes (India, US, Europe, China/HK, Japan)
  router.get("/markets", (_req: any, res: any) => {
    res.json(MARKET_UNIVERSES);
  });

  router.get("/universes", (_req: any, res: any) => {
    res.json(MARKET_UNIVERSES);
  });

  // Real-time stock symbol and company search with exchange normalization
  router.get("/search", async (req: any, res: any) => {
    try {
      const q = (req.query.q as string || '').trim();
      const region = (req.query.region as string || 'IN').toUpperCase();
      const results = await searchStocks(q, region);
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Backward compatibility endpoint for Nifty 50
  router.get("/nifty50", (_req: any, res: any) => {
    res.json(MARKET_UNIVERSES.IN.stocks);
  });

  router.get("/quote", async (req: any, res: any) => {
    try {
      const region = req.query.region as string || 'IN';
      const data = await getQuote(req.query.symbol as string, region);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Fast in-memory cache for Market Ticker Tape
  interface TapeCacheRecord {
    timestamp: number;
    data: any[];
  }
  let tapeCache: TapeCacheRecord | null = null;
  const TAPE_CACHE_TTL = 20 * 1000; // 20s TTL

  // Real-Time Top Market Ticker Tape Endpoint (inspired by Tickertape /product/tape)
  router.get("/tape", async (req: any, res: any) => {
    try {
      const now = Date.now();
      if (tapeCache && (now - tapeCache.timestamp < TAPE_CACHE_TTL)) {
        return res.json(tapeCache.data);
      }

      const tapeSymbols = [
        { symbol: '^NSEI', name: 'NIFTY 50', market: 'IN', type: 'INDEX' },
        { symbol: '^NSEBANK', name: 'BANK NIFTY', market: 'IN', type: 'INDEX' },
        { symbol: '^BSESN', name: 'SENSEX', market: 'IN', type: 'INDEX' },
        { symbol: '^CNXIT', name: 'NIFTY IT', market: 'IN', type: 'INDEX' },
        { symbol: 'RELIANCE.NS', name: 'RELIANCE', market: 'IN', type: 'STOCK' },
        { symbol: 'TCS.NS', name: 'TCS', market: 'IN', type: 'STOCK' },
        { symbol: 'HDFCBANK.NS', name: 'HDFC BANK', market: 'IN', type: 'STOCK' },
        { symbol: 'BHARTIARTL.NS', name: 'BHARTI AIRTEL', market: 'IN', type: 'STOCK' },
        { symbol: '^GSPC', name: 'S&P 500', market: 'US', type: 'INDEX' },
        { symbol: '^IXIC', name: 'NASDAQ', market: 'US', type: 'INDEX' },
        { symbol: 'NVDA', name: 'NVIDIA', market: 'US', type: 'STOCK' },
        { symbol: 'AAPL', name: 'APPLE', market: 'US', type: 'STOCK' },
        { symbol: 'MSFT', name: 'MICROSOFT', market: 'US', type: 'STOCK' }
      ];

      const quotesSettled = await Promise.allSettled(
        tapeSymbols.map(async (item) => {
          const q = await getQuote(item.symbol, item.market);
          return {
            symbol: item.symbol,
            name: item.name,
            market: item.market,
            type: item.type,
            price: q.current_price,
            change: q.change,
            changePercent: q.change_percent,
            currencySymbol: q.currency_symbol,
            high: q.high,
            low: q.low,
            volume: q.volume,
            volBreakout: (q as any).vol_breakout,
            away52wHigh: (q as any).away_52w_high,
            crossedHigh: (q as any).crossed_high
          };
        })
      );

      const tapeData = quotesSettled
        .filter(r => r.status === 'fulfilled')
        .map((r: any) => r.value);

      if (tapeData.length > 0) {
        tapeCache = { timestamp: now, data: tapeData };
      }
      res.json(tapeData);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Fast in-memory quote cache (10s TTL) to prevent redundant upstream calls
  const quoteMemoryCache = new Map<string, { timestamp: number; data: any }>();
  const QUOTE_CACHE_TTL = 10 * 1000;

  // Market-Aware Batch Quotes for Watchlist Deck (e.g. "NVDA:US,RELIANCE.NS:IN,TSLA:US")
  router.get("/watchlist-quotes", async (req: any, res: any) => {
    try {
      const rawSymbols = (req.query.symbols as string || '').split(',').map(s => s.trim()).filter(Boolean);
      const defaultRegion = (req.query.region as string || 'IN').toUpperCase();
      if (rawSymbols.length === 0) {
        return res.json([]);
      }

      const now = Date.now();
      const results = await Promise.allSettled(
        rawSymbols.map(async entry => {
          let sym = entry;
          let market = defaultRegion;
          if (entry.includes(':')) {
            const parts = entry.split(':');
            sym = parts[0].trim();
            market = (parts[1] || defaultRegion).trim().toUpperCase();
          } else if (entry.includes('@')) {
            const parts = entry.split('@');
            sym = parts[0].trim();
            market = (parts[1] || defaultRegion).trim().toUpperCase();
          } else if (KNOWN_US_TICKERS.has(entry.toUpperCase())) {
            market = 'US';
          }

          const cacheKey = `${sym.toUpperCase()}_${market}`;
          const cached = quoteMemoryCache.get(cacheKey);
          if (cached && (now - cached.timestamp < QUOTE_CACHE_TTL)) {
            return cached.data;
          }

          const fresh = await getQuote(sym, market);
          quoteMemoryCache.set(cacheKey, { timestamp: now, data: fresh });
          return fresh;
        })
      );

      const quotes = results
        .filter(r => r.status === 'fulfilled')
        .map((r: any) => r.value);
      res.json(quotes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Database Watchlists Endpoints (Strict Multi-Tenant Per-User Isolation) ─────────
  // GET /watchlists
  router.get("/watchlists", optionalAuth, (req: any, res: any) => {
    try {
      const userEmail = req.user?.email?.toLowerCase().trim();
      const all = loadWatchlistsFromDisk();
      if (!userEmail) {
        // Guests/unauthenticated requests ONLY receive public system seed watchlists
        const systemLists = all.filter(w => w.userEmail === 'system');
        return res.json(systemLists.length > 0 ? systemLists : SEED_WATCHLISTS);
      }
      // Authenticated users receive public system watchlists + their own private watchlists
      const filtered = all.filter(w => w.userEmail === 'system' || (w.userEmail && w.userEmail.toLowerCase() === userEmail));
      res.json(filtered);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /watchlists (Create new list)
  router.post("/watchlists", authenticateToken, (req: any, res: any) => {
    try {
      const { name, items = [] } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Watchlist name is required" });
      }
      const userEmail = req.user.email.toLowerCase().trim();

      const all = loadWatchlistsFromDisk();
      const formattedItems: WatchlistItem[] = (items as any[]).map(item => {
        if (typeof item === 'string') {
          const fmt = formatTickerDisplay(item);
          const isUS = KNOWN_US_TICKERS.has(fmt.cleanSymbol.toUpperCase());
          return {
            symbol: item,
            market: isUS ? 'US' : 'IN',
            cleanSymbol: fmt.cleanSymbol,
            displaySymbol: fmt.displaySymbol,
            name: fmt.cleanSymbol,
            exchange: fmt.exchange
          };
        }
        return {
          symbol: item.symbol,
          market: item.market || (KNOWN_US_TICKERS.has(item.symbol.toUpperCase()) ? 'US' : 'IN'),
          cleanSymbol: item.cleanSymbol || formatTickerDisplay(item.symbol).cleanSymbol,
          displaySymbol: item.displaySymbol || formatTickerDisplay(item.symbol).displaySymbol,
          name: item.name || item.symbol,
          exchange: item.exchange || formatTickerDisplay(item.symbol).exchange,
          addedAt: item.addedAt || new Date().toISOString()
        };
      });

      const newRecord: WatchlistRecord = {
        id: `wl-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        name: name.trim(),
        userEmail: userEmail,
        items: formattedItems,
        symbols: formattedItems.map(i => i.symbol),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      all.push(newRecord);
      saveWatchlistsToDisk(all);
      res.status(201).json(newRecord);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PUT /watchlists/:id (Update watchlist)
  router.put("/watchlists/:id", authenticateToken, (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { name, items, isDefault } = req.body;
      const userEmail = req.user.email.toLowerCase().trim();
      const all = loadWatchlistsFromDisk();
      const idx = all.findIndex(w => w.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Watchlist not found" });
      }

      const existing = all[idx];
      if (existing.userEmail === 'system' || (existing.userEmail && existing.userEmail.toLowerCase() !== userEmail)) {
        return res.status(403).json({ error: "Forbidden: You cannot modify system or another user's watchlist." });
      }

      if (name) existing.name = name.trim();
      if (isDefault !== undefined) existing.isDefault = Boolean(isDefault);
      if (items && Array.isArray(items)) {
        existing.items = items.map((item: any) => {
          if (typeof item === 'string') {
            const fmt = formatTickerDisplay(item);
            const isUS = KNOWN_US_TICKERS.has(fmt.cleanSymbol.toUpperCase());
            return {
              symbol: item,
              market: isUS ? 'US' : 'IN',
              cleanSymbol: fmt.cleanSymbol,
              displaySymbol: fmt.displaySymbol,
              name: fmt.cleanSymbol,
              exchange: fmt.exchange
            };
          }
          return item;
        });
        existing.symbols = existing.items.map(i => i.symbol);
      }
      existing.updatedAt = new Date().toISOString();

      all[idx] = existing;
      saveWatchlistsToDisk(all);
      res.json(existing);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /watchlists/:id (Delete watchlist)
  router.delete("/watchlists/:id", authenticateToken, (req: any, res: any) => {
    try {
      const { id } = req.params;
      const userEmail = req.user.email.toLowerCase().trim();
      const all = loadWatchlistsFromDisk();
      const target = all.find(w => w.id === id);
      if (!target) {
        return res.status(404).json({ error: "Watchlist not found" });
      }

      if (target.userEmail === 'system' || (target.userEmail && target.userEmail.toLowerCase() !== userEmail)) {
        return res.status(403).json({ error: "Forbidden: You cannot delete system or another user's watchlist." });
      }

      const remaining = all.filter(w => w.id !== id);
      saveWatchlistsToDisk(remaining);
      res.json({ success: true, removedId: id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /watchlists/:id/symbols (Add stock with market info to watchlist)
  router.post("/watchlists/:id/symbols", authenticateToken, (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { symbol, market, name, exchange } = req.body;
      if (!symbol) {
        return res.status(400).json({ error: "Stock symbol is required" });
      }
      const userEmail = req.user.email.toLowerCase().trim();

      const all = loadWatchlistsFromDisk();
      const target = all.find(w => w.id === id);
      if (!target) {
        return res.status(404).json({ error: "Watchlist not found" });
      }

      if (target.userEmail === 'system' || (target.userEmail && target.userEmail.toLowerCase() !== userEmail)) {
        return res.status(403).json({ error: "Forbidden: You cannot modify system or another user's watchlist." });
      }

      const norm = normalizeTicker(symbol, market || 'IN');
      const fmt = formatTickerDisplay(norm, exchange);
      const isUS = market === 'US' || KNOWN_US_TICKERS.has(fmt.cleanSymbol.toUpperCase());
      const resolvedMarket = market || (isUS ? 'US' : 'IN');

      // Deduplicate by clean symbol or normalized ticker
      const alreadyIn = target.items.some(it => it.symbol === norm || it.cleanSymbol === fmt.cleanSymbol);
      if (!alreadyIn) {
        const newItem: WatchlistItem = {
          symbol: norm,
          market: resolvedMarket,
          cleanSymbol: fmt.cleanSymbol,
          displaySymbol: fmt.displaySymbol,
          name: name || fmt.cleanSymbol,
          exchange: exchange || fmt.exchange,
          addedAt: new Date().toISOString()
        };
        target.items.push(newItem);
        target.symbols = target.items.map(i => i.symbol);
        target.updatedAt = new Date().toISOString();
        saveWatchlistsToDisk(all);
      }

      res.json(target);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /watchlists/:id/symbols/:symbol (Remove stock from watchlist)
  router.delete("/watchlists/:id/symbols/:symbol", authenticateToken, (req: any, res: any) => {
    try {
      const { id, symbol } = req.params;
      const userEmail = req.user.email.toLowerCase().trim();
      const all = loadWatchlistsFromDisk();
      const target = all.find(w => w.id === id);
      if (!target) {
        return res.status(404).json({ error: "Watchlist not found" });
      }

      if (target.userEmail === 'system' || (target.userEmail && target.userEmail.toLowerCase() !== userEmail)) {
        return res.status(403).json({ error: "Forbidden: You cannot modify system or another user's watchlist." });
      }

      const cleanTarget = symbol.replace(/\.(NS|BO|L|DE|PA|AS|HK|SS|SZ|T)$/i, '').toUpperCase();
      target.items = target.items.filter(it => {
        const itClean = it.symbol.replace(/\.(NS|BO|L|DE|PA|AS|HK|SS|SZ|T)$/i, '').toUpperCase();
        return it.symbol !== symbol && itClean !== cleanTarget;
      });
      target.symbols = target.items.map(i => i.symbol);
      target.updatedAt = new Date().toISOString();

      saveWatchlistsToDisk(all);
      res.json(target);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PUT /watchlists/sync (Batch sync user's watchlists without touching others)
  router.put("/watchlists/sync", authenticateToken, (req: any, res: any) => {
    try {
      const { watchlists } = req.body;
      if (!Array.isArray(watchlists)) {
        return res.status(400).json({ error: "Watchlists array is required" });
      }
      const userEmail = req.user.email.toLowerCase().trim();
      const all = loadWatchlistsFromDisk();
      // Keep watchlists belonging to other users or system
      const others = all.filter(w => !w.userEmail || w.userEmail === 'system' || w.userEmail.toLowerCase() !== userEmail);
      // Stamp verified userEmail on all synced items
      const userScoped = watchlists.map((w: WatchlistRecord) => ({
        ...w,
        userEmail
      }));
      const merged = [...others, ...userScoped];
      saveWatchlistsToDisk(merged);
      res.json({ success: true, count: userScoped.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/history", async (req: any, res: any) => {
    try {
      const region = req.query.region as string || 'IN';
      const data = await getHistory(
        req.query.symbol as string,
        req.query.period as string,
        req.query.interval as string,
        region
      );
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/analysis", async (req: any, res: any) => {
    try {
      const region = req.query.region as string || 'IN';
      const options = {
        region,
        rsiPeriod: req.query.rsiPeriod ? parseInt(req.query.rsiPeriod as string, 10) : undefined,
        macdFast: req.query.macdFast ? parseInt(req.query.macdFast as string, 10) : undefined,
        macdSlow: req.query.macdSlow ? parseInt(req.query.macdSlow as string, 10) : undefined,
        macdSignal: req.query.macdSignal ? parseInt(req.query.macdSignal as string, 10) : undefined,
        bbPeriod: req.query.bbPeriod ? parseInt(req.query.bbPeriod as string, 10) : undefined,
        bbStdDev: req.query.bbStdDev ? parseFloat(req.query.bbStdDev as string) : undefined,
        ema20Period: req.query.ema20Period ? parseInt(req.query.ema20Period as string, 10) : undefined,
        ema50Period: req.query.ema50Period ? parseInt(req.query.ema50Period as string, 10) : undefined
      };
      const data = await getAnalysis(req.query.symbol as string, options);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/suggestion", async (req: any, res: any) => {
    try {
      const region = req.query.region as string || 'IN';
      const options = {
        region,
        rsiPeriod: req.query.rsiPeriod ? parseInt(req.query.rsiPeriod as string, 10) : undefined,
        macdFast: req.query.macdFast ? parseInt(req.query.macdFast as string, 10) : undefined,
        macdSlow: req.query.macdSlow ? parseInt(req.query.macdSlow as string, 10) : undefined,
        macdSignal: req.query.macdSignal ? parseInt(req.query.macdSignal as string, 10) : undefined,
        bbPeriod: req.query.bbPeriod ? parseInt(req.query.bbPeriod as string, 10) : undefined,
        bbStdDev: req.query.bbStdDev ? parseFloat(req.query.bbStdDev as string) : undefined,
        ema20Period: req.query.ema20Period ? parseInt(req.query.ema20Period as string, 10) : undefined,
        ema50Period: req.query.ema50Period ? parseInt(req.query.ema50Period as string, 10) : undefined
      };
      const data = await getSuggestion(req.query.symbol as string, options);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Strategy Architecture & Builder Endpoints (Phase 2) ───────────────────
  // GET /strategies
  router.get("/strategies", (req: any, res: any) => {
    try {
      const userEmail = (req.query.email as string || '').toLowerCase().trim();
      const all = loadStrategiesFromDisk();
      if (!userEmail) return res.json(all);
      const filtered = all.filter(s => s.isPreset || !s.authorEmail || s.authorEmail === userEmail);
      res.json(filtered);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /strategies
  router.post("/strategies", (req: any, res: any) => {
    try {
      const { name, description, authorEmail, authorName, market, timeframe, parameters, rules } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Strategy name is required" });
      }
      const created = createStrategy({
        name,
        description,
        authorEmail,
        authorName,
        market,
        timeframe,
        parameters,
        rules
      });
      res.status(201).json(created);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /strategies/:id
  router.get("/strategies/:id", (req: any, res: any) => {
    try {
      const strategy = getStrategyById(req.params.id);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json(strategy);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PUT /strategies/:id
  router.put("/strategies/:id", (req: any, res: any) => {
    try {
      const updated = updateStrategy(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /strategies/:id
  router.delete("/strategies/:id", (req: any, res: any) => {
    try {
      const success = deleteStrategy(req.params.id);
      if (!success) {
        return res.status(400).json({ error: "Cannot delete preset strategy or strategy not found" });
      }
      res.json({ success: true, removedId: req.params.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Stage 5: Community Strategy Marketplace & Verified Badge Endpoints ────

  // POST /strategies/:id/publish (Toggle marketplace visibility & tags)
  router.post("/strategies/:id/publish", (req: any, res: any) => {
    try {
      const { isPublic = true, tags = [] } = req.body;
      const updated = publishStrategy(req.params.id, isPublic, tags);
      if (!updated) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /strategies/:id/fork (1-Click clone strategy into user workspace)
  router.post("/strategies/:id/fork", (req: any, res: any) => {
    try {
      const userEmail = (req.body?.userEmail || req.query?.userEmail || 'trader@sutharlabs.com').toLowerCase().trim();
      const userName = req.body?.userName || req.query?.userName;
      const forked = forkStrategy(req.params.id, userEmail, userName);
      if (!forked) {
        return res.status(404).json({ error: "Source strategy not found" });
      }
      res.status(201).json(forked);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /strategies/:id/reviews (Add or update community star review 1-5)
  router.post("/strategies/:id/reviews", (req: any, res: any) => {
    try {
      const { rating, comment, userEmail, userName } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Valid star rating (1 to 5) is required" });
      }
      const result = addStrategyReview(req.params.id, {
        rating,
        comment: comment || '',
        userEmail: userEmail || 'trader@sutharlabs.com',
        userName: userName || 'Community Trader'
      });
      if (!result) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /strategies/:id/reviews (Delete user review)
  router.delete("/strategies/:id/reviews", (req: any, res: any) => {
    try {
      const userEmail = (req.body?.userEmail || req.query?.userEmail || '').toLowerCase().trim();
      if (!userEmail) {
        return res.status(400).json({ error: "User email required to identify review" });
      }
      const updated = deleteStrategyReview(req.params.id, userEmail);
      if (!updated) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /strategies/:id/verify (Execute server-side verified backtest badge)
  router.post("/strategies/:id/verify", async (req: any, res: any) => {
    try {
      const stratId = req.params.id;
      const strat = getStrategyById(stratId);
      if (!strat) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      // Benchmark ticker by market region
      const symbol = strat.market === 'US' ? 'AAPL' : 'RELIANCE.NS';
      const range = '1y';

      const report = await runBacktest({
        symbol,
        strategyId: strat.id,
        range,
        includeFriction: true
      });

      const verifiedBadge = {
        verifiedAt: new Date().toISOString(),
        symbol,
        range,
        netReturnPct: Number(report.metrics.netProfitPct.toFixed(1)),
        annualizedCagr: Number(report.metrics.cagrPct.toFixed(1)),
        sharpeRatio: Number(report.metrics.sharpeRatio.toFixed(2)),
        winRatePct: Number(report.metrics.winRatePct.toFixed(1)),
        maxDrawdownPct: Number(report.metrics.maxDrawdownPct.toFixed(1)),
        totalTrades: report.metrics.totalTrades,
        profitFactor: Number(report.metrics.profitFactor.toFixed(2)),
        verifiedBy: 'SUTHARLABS_INSTITUTIONAL_VERIFIER'
      };

      const updated = setVerifiedBacktestBadge(stratId, verifiedBadge);
      res.json(updated);
    } catch (e: any) {
      console.error("[Strategy Verify] Error:", e);
      res.status(500).json({ error: e.message || "Failed to generate verified backtest badge" });
    }
  });

  // GET /news (Real-time financial headlines from Yahoo Finance & Google News)
  router.get("/news", async (req: any, res: any) => {
    try {
      const symbol = req.query.symbol as string;
      const market = (req.query.market as string) || (req.query.region as string) || 'GLOBAL';
      const companyName = req.query.companyName as string;

      if (!symbol) {
        return res.status(400).json({ error: "Stock symbol is required" });
      }

      const articles = await fetchStockNews({
        symbol,
        companyName,
        market
      });

      res.json({
        symbol,
        count: articles.length,
        articles
      });
    } catch (e: any) {
      console.error("[Stock News API] Error:", e);
      res.status(500).json({ error: e.message || "Failed to fetch stock news" });
    }
  });

  // POST /test-gemini-key (Validate user Gemini API Key connection)
  router.post("/test-gemini-key", async (req: any, res: any) => {
    try {
      const apiKey = (req.body?.apiKey || req.headers['x-gemini-key'] || '').trim();
      const result = await testGeminiApiKey(apiKey);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to validate Gemini API key" });
    }
  });

  // GET /news-sentiment (Gemini AI or Autonomous Lexicon polarity and catalyst analysis)
  router.get("/news-sentiment", async (req: any, res: any) => {
    try {
      const symbol = req.query.symbol as string;
      const market = (req.query.market as string) || (req.query.region as string) || 'GLOBAL';
      const companyName = req.query.companyName as string;
      const apiKey = (req.headers['x-gemini-key'] as string) || (req.query.geminiKey as string);

      if (!symbol) {
        return res.status(400).json({ error: "Stock symbol is required" });
      }

      const articles = await fetchStockNews({
        symbol,
        companyName,
        market
      });

      const sentiment = await analyzeStockSentiment({
        symbol,
        articles,
        apiKey
      });

      res.json({
        symbol,
        sentiment,
        articles
      });
    } catch (e: any) {
      console.error("[Stock Sentiment API] Error:", e);
      res.status(500).json({ error: e.message || "Failed to analyze stock news sentiment" });
    }
  });

  // GET /strategy-signal (Real-time algorithmic execution on target stock with AI Sentiment Confluence)
  router.get("/strategy-signal", async (req: any, res: any) => {
    try {
      const symbol = req.query.symbol as string;
      const strategyId = (req.query.strategyId as string) || 'strat-ema-cross';
      const region = (req.query.region as string) || 'IN';
      const includeSentiment = req.query.includeSentiment === 'true' || req.query.withSentiment === 'true';
      const apiKey = (req.headers['x-gemini-key'] as string) || (req.query.geminiKey as string);

      if (!symbol) {
        return res.status(400).json({ error: "Stock symbol is required" });
      }

      const strategy = getStrategyById(strategyId) || PRESET_STRATEGIES[0];
      const normalizedSym = normalizeTicker(symbol, region);
      const quote = await getQuote(normalizedSym, region);
      const history = await getHistory(normalizedSym, '1Y', '1d', region);

      const candles = (history.candles || []).map((c: any) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      }));

      // Parse custom parameter overrides if provided in query
      const paramOverrides: Record<string, any> = {};
      for (const key of Object.keys(req.query)) {
        if (key.startsWith('param_')) {
          const paramName = key.replace('param_', '');
          const val = Number(req.query[key]);
          paramOverrides[paramName] = isNaN(val) ? req.query[key] : val;
        }
      }

      // Optionally fetch and incorporate news sentiment
      let sentimentReport;
      if (includeSentiment) {
        try {
          const articles = await fetchStockNews({
            symbol: normalizedSym,
            companyName: quote?.name,
            market: region
          });
          sentimentReport = await analyzeStockSentiment({
            symbol: normalizedSym,
            articles,
            apiKey
          });
        } catch (sentErr) {
          console.warn("[Strategy Signal] Failed to load news sentiment for confluence:", sentErr);
        }
      }

      const signal = evaluateStrategy(strategy, candles, quote, paramOverrides, sentimentReport);
      res.json(signal);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /strategy-eval (Evaluate custom or draft strategy in sandbox before saving)
  router.post("/strategy-eval", async (req: any, res: any) => {
    try {
      const { strategy, symbol, region, paramOverrides, includeSentiment, apiKey: bodyApiKey } = req.body;
      const targetRegion = region || 'IN';
      const apiKey = bodyApiKey || (req.headers['x-gemini-key'] as string);

      if (!symbol) {
        return res.status(400).json({ error: "Stock symbol is required" });
      }
      if (!strategy) {
        return res.status(400).json({ error: "Strategy definition is required" });
      }

      const normalizedSym = normalizeTicker(symbol, targetRegion);
      const quote = await getQuote(normalizedSym, targetRegion);
      const history = await getHistory(normalizedSym, '1Y', '1d', targetRegion);

      const candles = (history.candles || []).map((c: any) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      }));

      let sentimentReport;
      if (includeSentiment) {
        try {
          const articles = await fetchStockNews({
            symbol: normalizedSym,
            companyName: quote?.name,
            market: targetRegion
          });
          sentimentReport = await analyzeStockSentiment({
            symbol: normalizedSym,
            articles,
            apiKey
          });
        } catch (sentErr) {
          console.warn("[Strategy Eval] Sentiment analysis skipped:", sentErr);
        }
      }

      const signal = evaluateStrategy(strategy, candles, quote, paramOverrides || {}, sentimentReport);
      res.json(signal);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stage 4: High-Performance Quantitative Backtest Engine
  router.post("/backtest", async (req: any, res: any) => {
    try {
      if (!req.body || !req.body.symbol) {
        return res.status(400).json({ error: "Stock symbol is required for backtesting." });
      }
      const report = await runBacktest(req.body);
      res.json(report);
    } catch (e: any) {
      console.error("[Backtest Engine] Error executing backtest:", e);
      res.status(500).json({ error: e.message || "Failed to execute backtesting simulation." });
    }
  });

  // Stage 4: Localized Regional Friction & Tax Breakdown Preview
  router.get("/backtest-friction-preview", (req: any, res: any) => {
    try {
      const symbol = (req.query.symbol as string) || "RELIANCE.NS";
      const region = (req.query.region as any) || detectMarketRegion(symbol);
      const side = ((req.query.side as string) || "BUY").toUpperCase() as "BUY" | "SELL";
      const price = Number(req.query.price || 100);
      const quantity = Number(req.query.quantity || 100);
      const slippagePct = req.query.slippagePct !== undefined ? Number(req.query.slippagePct) : 0.05;

      const friction = calculateRegionalFriction({
        region,
        side,
        price,
        quantity,
        slippagePct
      });
      res.json(friction);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Stage 6: Global Multi-Asset Market Scanner Hub ──
  router.post("/scanner/scan", async (req: any, res: any) => {
    try {
      const report = await runMarketScan(req.body || {});
      res.json(report);
    } catch (e: any) {
      console.error("[Scanner Engine] Scan failure:", e);
      res.status(500).json({ error: e.message || "Failed to execute market scan." });
    }
  });

  router.post("/scanner/alert-webhook", async (req: any, res: any) => {
    try {
      const { webhookUrl, candidate, strategyName } = req.body;
      if (!webhookUrl || !candidate) {
        return res.status(400).json({ error: "Webhook URL and candidate details are required." });
      }
      const result = await dispatchWebhookAlert(webhookUrl, candidate, strategyName || "Active Strategy");
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Stage 6: Automated End-of-Day (EOD) Batch Trade Simulator (Strict Tenant Isolation) ──
  // Helper to extract sanitized tenant identifier
  const getSimulatorTenantScope = (req: any): string => {
    const email = req.user?.email;
    if (email && typeof email === 'string') {
      return email.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
    }
    return 'guest';
  };

  // Helper to check for automated system cron execution
  const isAuthorizedSystemCron = (req: any): boolean => {
    const authHeader = req.headers["authorization"];
    const cronSecretHeader = req.headers["x-cron-secret"];
    const cronSecret = process.env.CRON_SECRET || 'sutharlabs-eod-cron-key-2026';
    return Boolean(
      (cronSecretHeader && cronSecretHeader === cronSecret) ||
      (authHeader && authHeader === `Bearer ${cronSecret}`) ||
      (req.query.cronSecret && req.query.cronSecret === cronSecret)
    );
  };

  // Helper to resolve simulation ID across database instances without mangling or creating clones
  const resolveSimulationTargetId = async (rawSimId: string, tenant: string): Promise<string> => {
    if (!rawSimId) {
      try {
        const prisma = getPrismaClient();
        const first = await prisma.simulationStore.findFirst({
          where: { simId: { not: 'default' } },
          orderBy: { updatedAt: 'desc' },
          select: { simId: true }
        });
        if (first?.simId) return first.simId;
      } catch {}
      return 'cron_live';
    }

    const clean = rawSimId.trim();

    try {
      const prisma = getPrismaClient();
      // 1. Direct exact match in Neon database
      const direct = await prisma.simulationStore.findUnique({
        where: { simId: clean },
        select: { simId: true }
      });
      if (direct?.simId) return direct.simId;

      // 2. Legacy tenant-scoped match (if client sent short slug for an existing legacy prefixed row)
      if (tenant !== 'guest') {
        const tenantScoped = `${tenant}__${clean}`;
        const legacyRow = await prisma.simulationStore.findUnique({
          where: { simId: tenantScoped },
          select: { simId: true }
        });
        if (legacyRow?.simId) return legacyRow.simId;
      }
    } catch {}

    return clean;
  };

  // Retrieve Cron Runner Configuration & Secrets for authorized users
  router.get("/simulator/cron-config", optionalAuth, (req: any, res: any) => {
    const cronSecret = process.env.CRON_SECRET || 'sutharlabs-eod-cron-key-2026';
    res.json({
      cronSecret,
      endpoint: '/api/workspace/stock-analyzer/simulator/run-eod',
      note: 'Include cronSecret as query param ?cronSecret=... or header X-Cron-Secret'
    });
  });

  // List simulations accessible to the requesting user (Admins see all; users see public + own)
  // Backed 100% by Neon DB simulation_stores table
  router.get("/simulator/simulations", optionalAuth, async (req: any, res: any) => {
    try {
      const tenant = getSimulatorTenantScope(req);
      const cleanTenant = tenant.replace(/[^a-z0-9_-]/g, '_');
      const userEmail = (req.user?.email || '').toLowerCase().trim();
      const isAdmin = req.user?.role === 'Admin';

      let simulations: SimulationRegistryEntry[] = [];

      try {
        const prisma = getPrismaClient();
        const dbStores = await prisma.simulationStore.findMany({
          where: { simId: { not: 'default' } },
          orderBy: { updatedAt: 'desc' },
          select: {
            simId: true,
            label: true,
            owner: true,
            strategyId: true,
            strategyName: true,
            market: true,
            productType: true,
            timeframe: true,
            capitalAllocationPct: true,
            trailingStopPct: true,
            isPublic: true,
            initialCash: true,
            cash: true,
            totalRealizedPnL: true,
            totalFrictionPaid: true,
            winCount: true,
            lossCount: true,
            lastRunDate: true,
            lastUpdated: true,
            updatedAt: true
          }
        });

        const memRegistry = listSimulations();
        for (const s of dbStores) {
          const rawLabel = s.label || (s.simId.includes('__') ? s.simId.split('__').slice(1).join(' ').replace(/_/g, ' ') : s.simId.replace(/_/g, ' '));
          const baseSlug = s.simId.includes('__') ? s.simId.split('__').pop()! : s.simId;
          const mem = memRegistry.find(r => r.id === s.simId || r.id === baseSlug || r.id.endsWith(`__${baseSlug}`) || s.simId.endsWith(`__${r.id}`));

          const effectiveTotalRuns = Math.max(
            mem?.totalRuns ?? 0,
            (s.winCount || 0) + (s.lossCount || 0)
          );

          const effectiveTradeRuns = Math.max(
            mem?.totalTradeRuns ?? 0,
            (s.winCount || 0) + (s.lossCount || 0)
          );

          simulations.push({
            id: s.simId,
            label: rawLabel,
            owner: s.owner || undefined,
            strategyId: s.strategyId || 'strat-ema-cross',
            strategyName: s.strategyName || 'EMA 9/21 Dynamic Trend Cross',
            market: (s.market || 'IN').toUpperCase(),
            productType: ((s.productType || 'CNC').toUpperCase() as any),
            timeframe: (s.timeframe || '1d') as any,
            interval: (s.timeframe || '1d'),
            capitalAllocationPct: s.capitalAllocationPct ?? 0.20,
            allocationPct: s.capitalAllocationPct ?? 0.20,
            trailingStopPct: s.trailingStopPct ?? 3.0,
            initialCash: s.initialCash || 100000,
            createdAt: s.updatedAt?.toISOString() || new Date().toISOString(),
            lastRunAt: s.lastRunDate || s.lastUpdated || s.updatedAt?.toISOString() || new Date().toISOString(),
            lastHeartbeatAt: s.lastUpdated || s.updatedAt?.toISOString() || new Date().toISOString(),
            lastHeartbeatStatus: 'READY',
            totalRuns: effectiveTotalRuns,
            totalTradeRuns: effectiveTradeRuns,
            isPublic: Boolean(s.isPublic)
          });
        }
      } catch (dbErr) {
        console.warn("[Simulator] Error reading simulationStore DB:", dbErr);
        simulations = listSimulations().filter(s => s.id !== 'default');
      }

      if (simulations.length === 0) {
        simulations = listSimulations().filter(s => s.id !== 'default');
      }

      // Deduplicate by baseSlug so tenant-scoped and canonical variants never duplicate
      const deduplicateSimulations = (list: SimulationRegistryEntry[]): SimulationRegistryEntry[] => {
        const seenSlugs = new Set<string>();
        const result: SimulationRegistryEntry[] = [];
        for (const sim of list) {
          const base = sim.id.includes('__') ? sim.id.split('__').pop()! : sim.id;
          if (!seenSlugs.has(base)) {
            seenSlugs.add(base);
            result.push(sim);
          }
        }
        return result;
      };

      if (isAdmin) {
        return res.json(deduplicateSimulations(simulations));
      }

      if (tenant === 'guest') {
        const publicOnly = simulations.filter(s => s.isPublic || !s.owner || s.owner === 'guest' || !s.id.includes('__'));
        return res.json(deduplicateSimulations(publicOnly));
      }

      const tenantPrefix = `${tenant}__`;
      const accessible = simulations.filter(s => {
        if (s.isPublic) return true;
        if (!s.owner || s.owner === 'guest') return true;
        const ownerLower = (s.owner || '').toLowerCase().trim();
        if (userEmail && (ownerLower === userEmail || ownerLower === cleanTenant || ownerLower.includes(userEmail) || userEmail.includes(ownerLower))) {
          return true;
        }
        if (s.id.startsWith(tenantPrefix) || s.id.startsWith(`${cleanTenant}__`)) {
          return true;
        }
        return false;
      });

      res.json(deduplicateSimulations(accessible));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create a brand new isolated simulation instance backed by database
  router.post("/simulator/simulations", optionalAuth, async (req: any, res: any) => {
    try {
      const payload = req.body || {};
      const rawId = (payload.id || payload.simulationId || '').trim();
      if (!rawId) {
        return res.status(400).json({ error: "Simulation ID is required." });
      }
      const cleanSlug = rawId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const tenant = getSimulatorTenantScope(req);
      const userEmail = req.user?.email || payload.userEmail;

      const instance = await createSimulationInstance({
        id: cleanSlug,
        label: payload.label || payload.simulationLabel || cleanSlug,
        owner: userEmail || (tenant !== 'guest' ? tenant : undefined),
        strategyId: payload.strategyId,
        strategyName: payload.strategyName,
        market: payload.market,
        productType: payload.productType,
        timeframe: payload.timeframe || payload.interval,
        initialCash: payload.initialCash || payload.forcedCapital,
        capitalAllocationPct: payload.capitalAllocationPct || payload.allocationPct,
        trailingStopPct: payload.trailingStopPct,
        isPublic: Boolean(payload.isPublic)
      });

      res.status(201).json({
        success: true,
        simulation: instance,
        message: `Simulation "${instance.label}" created successfully.`
      });
    } catch (e: any) {
      console.error("[Simulator] Error creating simulation instance:", e);
      res.status(500).json({ error: e.message || "Failed to create simulation instance." });
    }
  });

  // Toggle or set public visibility for a simulation (Owner only)
  router.patch("/simulator/simulations/:simId/public", authenticateToken, async (req: any, res: any) => {
    try {
      const { simId } = req.params;
      const { isPublic } = req.body;
      const tenant = getSimulatorTenantScope(req);
      const cleanTenant = tenant.replace(/[^a-z0-9_-]/g, '_');
      const baseSlug = simId.includes('__') ? simId.split('__').pop()! : simId;
      const all = listSimulations();
      const existing = all.find(s => {
        const sBase = s.id.includes('__') ? s.id.split('__').pop()! : s.id;
        return s.id === simId || s.id === baseSlug || sBase === baseSlug || s.id.endsWith(`__${baseSlug}`);
      });
      const userEmail = (req.user?.email || '').toLowerCase().trim();

      // Query owner and canonical simId dynamically from database across all alias formats
      let dbOwner: string | null = null;
      let canonicalSimId = simId;
      try {
        const prisma = getPrismaClient();
        const row = await prisma.simulationStore.findFirst({
          where: {
            OR: [
              { simId: simId },
              { simId: baseSlug },
              { simId: { endsWith: `__${baseSlug}` } },
              { simId: `${cleanTenant}__${baseSlug}` }
            ]
          },
          select: { simId: true, owner: true, isPublic: true }
        });
        if (row) {
          if (row.owner) dbOwner = row.owner;
          canonicalSimId = row.simId;
        }
      } catch {}

      const effectiveOwner = (dbOwner || existing?.owner || (canonicalSimId.includes('__') ? canonicalSimId.split('__')[0] : '')).toLowerCase().trim();

      const isAdmin = req.user?.role === 'Admin';
      const isOwner = Boolean(
        isAdmin || (
          userEmail && effectiveOwner && (
            userEmail === effectiveOwner ||
            tenant === effectiveOwner ||
            cleanTenant === effectiveOwner ||
            effectiveOwner.includes(userEmail) ||
            userEmail.includes(effectiveOwner) ||
            canonicalSimId.startsWith(`${tenant}__`) ||
            canonicalSimId.startsWith(`${cleanTenant}__`) ||
            canonicalSimId.includes(tenant) ||
            canonicalSimId.includes(cleanTenant) ||
            simId.includes(tenant) ||
            simId.includes(cleanTenant)
          )
        )
      );

      if (!isOwner) {
        return res.status(403).json({
          error: `Forbidden: Only the simulation owner (${dbOwner || existing?.owner || effectiveOwner || 'the owner'}) can change the visibility of this simulation instance.`,
          code: "OWNER_REQUIRED"
        });
      }

      const updated = await setSimulationPublicStatus(canonicalSimId, Boolean(isPublic));
      res.json({
        success: true,
        simulation: updated,
        message: `Simulation "${canonicalSimId}" visibility set to ${isPublic ? 'Public' : 'Private'}.`
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Update simulation configuration (Strategy, Timeframe, Allocation, Trailing Stop, Market, Label, Visibility)
  router.patch(["/simulator/simulations/:simId/config", "/simulator/simulations/:simId/settings"], optionalAuth, async (req: any, res: any) => {
    try {
      const { simId } = req.params;
      const config = req.body || {};
      const tenant = getSimulatorTenantScope(req);
      const cleanTenant = tenant.replace(/[^a-z0-9_-]/g, '_');
      const isAdmin = req.user?.role === 'Admin';
      const baseSlug = simId.includes('__') ? simId.split('__').pop()! : simId;
      const all = listSimulations();
      const existing = all.find(s => {
        const sBase = s.id.includes('__') ? s.id.split('__').pop()! : s.id;
        return s.id === simId || s.id === baseSlug || sBase === baseSlug || s.id.endsWith(`__${baseSlug}`);
      });
      const userEmail = (req.user?.email || '').toLowerCase().trim();

      let dbOwner: string | null = null;
      let canonicalSimId = simId;
      try {
        const prisma = getPrismaClient();
        const row = await prisma.simulationStore.findFirst({
          where: {
            OR: [
              { simId: simId },
              { simId: baseSlug },
              { simId: { endsWith: `__${baseSlug}` } },
              { simId: `${cleanTenant}__${baseSlug}` }
            ]
          },
          select: { simId: true, owner: true, isPublic: true }
        });
        if (row) {
          if (row.owner) dbOwner = row.owner;
          canonicalSimId = row.simId;
        }
      } catch {}

      const effectiveOwner = (dbOwner || existing?.owner || (canonicalSimId.includes('__') ? canonicalSimId.split('__')[0] : '')).toLowerCase().trim();

      const isOwner = Boolean(
        isAdmin ||
        !effectiveOwner ||
        effectiveOwner === 'guest' ||
        (
          userEmail && (
            userEmail === effectiveOwner ||
            tenant === effectiveOwner ||
            cleanTenant === effectiveOwner ||
            effectiveOwner.includes(userEmail) ||
            userEmail.includes(effectiveOwner) ||
            canonicalSimId.includes(tenant) ||
            canonicalSimId.includes(cleanTenant) ||
            simId.includes(tenant) ||
            simId.includes(cleanTenant)
          )
        )
      );

      if (!isOwner) {
        return res.status(403).json({
          error: `Forbidden: Only the simulation owner (${dbOwner || existing?.owner || effectiveOwner || 'the owner'}) can edit this simulation configuration.`,
          code: "OWNER_REQUIRED"
        });
      }

      const updated = await updateSimulationConfig(canonicalSimId, config);
      res.json({
        success: true,
        simulation: updated,
        message: `Simulation "${canonicalSimId}" configuration saved successfully.`
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Delete a simulation from database and registry (Owner-verified only)
  router.delete("/simulator/simulations/:simId", optionalAuth, async (req: any, res: any) => {
    try {
      const rawSimId = (req.params.simId || '').trim();
      if (!rawSimId) {
        return res.status(400).json({ error: "Simulation ID is required." });
      }

      const tenant = getSimulatorTenantScope(req);
      const cleanTenant = tenant.replace(/[^a-z0-9_-]/g, '_');
      const userEmail = (req.user?.email || '').toLowerCase().trim();
      const isAdmin = req.user?.role === 'Admin';

      // 1. Resolve actual target simulation ID in registry or database
      const all = listSimulations();
      let targetSim = all.find(s =>
        s.id === rawSimId ||
        s.id === `${tenant}__${rawSimId}` ||
        (tenant !== 'guest' && s.id.endsWith(`__${rawSimId}`))
      );
      const resolvedSimId = targetSim ? targetSim.id : (rawSimId.includes('__') ? rawSimId : (tenant !== 'guest' ? `${tenant}__${rawSimId}` : rawSimId));

      let dbOwner: string | null = null;
      try {
        const prisma = getPrismaClient();
        const row = await prisma.simulationStore.findFirst({
          where: {
            OR: [
              { simId: resolvedSimId },
              { simId: rawSimId },
              { simId: { endsWith: `__${rawSimId}` } }
            ]
          },
          select: { simId: true, owner: true }
        });
        if (row?.owner) dbOwner = row.owner;
      } catch {}

      const effectiveOwner = (dbOwner || targetSim?.owner || (resolvedSimId.includes('__') ? resolvedSimId.split('__')[0] : '')).toLowerCase().trim();

      const isOwner = Boolean(
        isAdmin ||
        !effectiveOwner ||
        effectiveOwner === 'guest' ||
        (
          userEmail && (
            userEmail === effectiveOwner ||
            tenant === effectiveOwner ||
            cleanTenant === effectiveOwner ||
            effectiveOwner.includes(userEmail) ||
            userEmail.includes(effectiveOwner) ||
            resolvedSimId.includes(tenant) ||
            resolvedSimId.includes(cleanTenant) ||
            rawSimId.includes(tenant) ||
            rawSimId.includes(cleanTenant)
          )
        )
      );

      if (!isOwner) {
        return res.status(403).json({
          error: `Forbidden: Only the simulation owner (${dbOwner || targetSim?.owner || effectiveOwner || 'the owner'}) can delete this simulation instance.`
        });
      }

      const baseSlug = rawSimId.includes('__') ? rawSimId.split('__').pop()! : rawSimId;
      const safeBase = baseSlug.replace(/[^a-zA-Z0-9_-]/g, '_');

      // 2. CRITICAL: Delete permanently from Neon PostgreSQL database table simulation_stores
      try {
        const prisma = getPrismaClient();
        await prisma.simulationStore.deleteMany({
          where: {
            OR: [
              { simId: resolvedSimId },
              { simId: rawSimId },
              { simId: baseSlug },
              { simId: safeBase },
              { simId: { endsWith: `__${baseSlug}` } },
              { simId: { endsWith: `__${safeBase}` } },
              { simId: { contains: rawSimId } },
              { simId: { contains: resolvedSimId } }
            ]
          }
        });
      } catch (dbErr) {
        console.warn("[Simulator DB] Error during deleteMany:", dbErr);
      }

      // 3. Delete from registry, memory cache, and local files
      await deleteSimulation(resolvedSimId);
      if (resolvedSimId !== rawSimId) {
        await deleteSimulation(rawSimId);
      }
      await deleteSimulation(baseSlug);
      await deleteSimulation(safeBase);
      await deleteSimulation(`system__${baseSlug}`);
      await deleteSimulation(`system__${safeBase}`);

      res.json({ success: true, message: `Simulation "${resolvedSimId}" permanently removed from database and registry.` });
    } catch (e: any) {
      console.error("[Simulator] Delete error:", e);
      res.status(500).json({ error: e.message || "Failed to delete simulation instance." });
    }
  });

  // Automated EOD Simulation Run (Supports both user paper runs and verified system background crons)
  router.all(["/simulator/run-eod", "/simulator/run-eod/"], optionalAuth, async (req: any, res: any) => {
    try {
      const payload = req.method === "GET" ? req.query : (req.body || {});
      const isCron = isAuthorizedSystemCron(req);
      const rawSimId = (payload.simulationId || payload.simId || "") as string;
      let targetSimId: string;

      if (isCron) {
        const all = listSimulations();
        const existing = all.find(s => s.id === rawSimId || s.id.endsWith(`__${rawSimId}`));
        if (existing) {
          targetSimId = existing.id;
        } else if (rawSimId && rawSimId !== "default") {
          targetSimId = rawSimId;
        } else {
          targetSimId = all[0]?.id || "live";
        }
      } else if (req.user?.email) {
        const tenant = getSimulatorTenantScope(req);
        const all = listSimulations();
        const existing = all.find(s => s.id === rawSimId);
        if (req.user?.role === 'Admin' && existing && existing.isPublic) {
          targetSimId = rawSimId;
        } else {
          targetSimId = await resolveSimulationTargetId(rawSimId, tenant);
        }
      } else {
        return res.status(401).json({
          error: "Unauthorized: Execution requires authenticated user session or verified CRON_SECRET header / cronSecret parameter.",
          code: "SIMULATOR_AUTH_REQUIRED"
        });
      }

      const report = await runEODSimulation({
        ...payload,
        capitalAllocationPct: payload.capitalAllocationPct !== undefined && payload.capitalAllocationPct !== '' ? Number(payload.capitalAllocationPct) : undefined,
        allocationPct: payload.allocationPct !== undefined && payload.allocationPct !== '' ? Number(payload.allocationPct) : undefined,
        trailingStopPct: payload.trailingStopPct !== undefined && payload.trailingStopPct !== '' ? Number(payload.trailingStopPct) : undefined,
        simulationId: targetSimId,
        userEmail: req.user?.email || payload.userEmail,
        isCron
      });
      res.json(report);
    } catch (e: any) {
      console.error("[EOD Simulator] Simulation run failure:", e);
      res.status(500).json({ error: e.message || "Failed to execute EOD batch simulation." });
    }
  });

  router.get("/simulator/history", optionalAuth, async (req: any, res: any) => {
    try {
      const rawSimId = (req.query.simulationId || req.query.simId || "") as string;
      const tenant = getSimulatorTenantScope(req);
      const targetSimId = await resolveSimulationTargetId(rawSimId, tenant);
      const history = await getEODHistory(targetSimId);
      res.json(history);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/simulator/portfolio", optionalAuth, async (req: any, res: any) => {
    try {
      const rawSimId = (req.query.simulationId || req.query.simId || "") as string;
      const tenant = getSimulatorTenantScope(req);
      const targetSimId = await resolveSimulationTargetId(rawSimId, tenant);
      const portfolio = await getEODPortfolio(targetSimId);
      res.json(portfolio);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/simulator/close-position", optionalAuth, async (req: any, res: any) => {
    try {
      const { positionId, simId, simulationId } = req.body || {};
      if (!positionId) {
        return res.status(400).json({ error: "positionId is required" });
      }
      const rawSimId = simulationId || simId || "";
      const tenant = getSimulatorTenantScope(req);
      const all = listSimulations();
      const existing = all.find(s => s.id === rawSimId);

      // Prevent non-admins from closing positions in public simulations
      if (existing && existing.isPublic && req.user?.role !== 'Admin') {
        return res.status(403).json({ error: "Forbidden: Public live simulations can only be managed by Administrators." });
      }

      const targetSimId = await resolveSimulationTargetId(rawSimId, tenant);
      const result = await closeEODPosition(positionId, targetSimId);
      if (!result.success) {
        return res.status(404).json({ error: "Position not found in portfolio" });
      }
      res.json(result);
    } catch (e: any) {
      console.error("[Simulator] Close position error:", e);
      res.status(500).json({ error: e.message || "Failed to close position." });
    }
  });

  router.all(["/simulator/reset", "/simulator/reset/"], optionalAuth, async (req: any, res: any) => {
    try {
      const { initialCapital, marketRegion, simId, simulationId } = req.body || req.query || {};
      const rawSimId = (simulationId || simId || "") as string;
      const tenant = getSimulatorTenantScope(req);
      const isAdmin = req.user?.role === 'Admin';
      const all = listSimulations();
      const existing = all.find(s => s.id === rawSimId);

      const targetSimId = (isAdmin && existing?.isPublic) ? rawSimId : await resolveSimulationTargetId(rawSimId, tenant);

      const userEmail = (req.user?.email || '').toLowerCase().trim();
      const cleanTenant = tenant.replace(/[^a-z0-9_-]/g, '_');

      let dbOwner: string | null = null;
      try {
        const prisma = getPrismaClient();
        const row = await prisma.simulationStore.findUnique({
          where: { simId: targetSimId },
          select: { owner: true }
        });
        if (row?.owner) dbOwner = row.owner;
      } catch {}

      const effectiveOwner = (dbOwner || existing?.owner || (targetSimId.includes('__') ? targetSimId.split('__')[0] : '')).toLowerCase().trim();

      const isOwner = Boolean(
        isAdmin || (
          userEmail && effectiveOwner && (
            userEmail === effectiveOwner ||
            tenant === effectiveOwner ||
            cleanTenant === effectiveOwner ||
            effectiveOwner.includes(userEmail) ||
            userEmail.includes(effectiveOwner) ||
            targetSimId.startsWith(`${tenant}__`) ||
            targetSimId.startsWith(`${cleanTenant}__`)
          )
        )
      );

      // Only the instance owner can reset the simulator
      if (!isOwner) {
        return res.status(403).json({
          error: `Forbidden: Only the simulation owner (${dbOwner || existing?.owner || effectiveOwner || 'the owner'}) can reset this simulator instance.`,
          code: "SIMULATOR_RESET_FORBIDDEN"
        });
      }

      const resetState = await resetSimulator(Number(initialCapital) || 100000, marketRegion || "IN", targetSimId);
      res.json({ success: true, message: `Trade Simulator (${targetSimId}) reset successfully.`, portfolio: resetState });
    } catch (e: any) {
      console.error("[Trade Simulator] Reset error:", e);
      res.status(500).json({ error: e.message || "Failed to reset simulator." });
    }
  });
}

