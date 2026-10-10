import { Router } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { authenticateToken, optionalAuth } from "../../middleware/auth.js";
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
  deleteSimulation
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

  // Market-Aware Batch Quotes for Watchlist Deck (e.g. "NVDA:US,RELIANCE.NS:IN,TSLA:US")
  router.get("/watchlist-quotes", async (req: any, res: any) => {
    try {
      const rawSymbols = (req.query.symbols as string || '').split(',').map(s => s.trim()).filter(Boolean);
      const defaultRegion = (req.query.region as string || 'IN').toUpperCase();
      if (rawSymbols.length === 0) {
        return res.json([]);
      }

      const results = await Promise.allSettled(
        rawSymbols.map(entry => {
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
          return getQuote(sym, market);
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

  // List simulations accessible to the requesting user
  router.get("/simulator/simulations", optionalAuth, (req: any, res: any) => {
    try {
      const all = listSimulations();
      const tenant = getSimulatorTenantScope(req);
      if (tenant === 'guest') {
        const publicOnly = all.filter(s => s.id === 'default' || s.id === 'cron_live' || !s.id.includes('__'));
        return res.json(publicOnly);
      }
      const tenantPrefix = `${tenant}__`;
      const accessible = all.filter(s => s.id.startsWith(tenantPrefix) || s.id === 'default' || s.id === 'cron_live');
      res.json(accessible);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete a simulation from registry (Owner-verified only)
  router.delete("/simulator/simulations/:simId", authenticateToken, (req: any, res: any) => {
    try {
      const { simId } = req.params;
      const tenant = getSimulatorTenantScope(req);
      const tenantPrefix = `${tenant}__`;

      if (!simId.startsWith(tenantPrefix) && req.user?.role !== 'Admin') {
        return res.status(403).json({ error: "Forbidden: You cannot delete another user's simulation session." });
      }

      deleteSimulation(simId);
      res.json({ success: true, message: `Simulation ${simId} removed.` });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Automated EOD Simulation Run (Supports both user paper runs and verified system background crons)
  router.all(["/simulator/run-eod", "/simulator/run-eod/"], optionalAuth, async (req: any, res: any) => {
    try {
      const payload = req.method === "GET" ? req.query : (req.body || {});
      const isCron = isAuthorizedSystemCron(req);
      const rawSimId = (payload.simulationId || payload.simId || "default") as string;
      let targetSimId: string;

      if (isCron) {
        targetSimId = rawSimId === "default" ? "system_eod_cron" : `system__${rawSimId}`;
      } else if (req.user?.email) {
        const tenant = getSimulatorTenantScope(req);
        targetSimId = `${tenant}__${rawSimId}`;
      } else {
        return res.status(401).json({
          error: "Unauthorized: Execution requires authenticated user session or verified CRON_SECRET header.",
          code: "SIMULATOR_AUTH_REQUIRED"
        });
      }

      const report = await runEODSimulation({ ...payload, simulationId: targetSimId });
      res.json(report);
    } catch (e: any) {
      console.error("[EOD Simulator] Simulation run failure:", e);
      res.status(500).json({ error: e.message || "Failed to execute EOD batch simulation." });
    }
  });

  router.get("/simulator/history", optionalAuth, async (req: any, res: any) => {
    try {
      const rawSimId = (req.query.simulationId || req.query.simId || "default") as string;
      const tenant = getSimulatorTenantScope(req);
      const targetSimId = `${tenant}__${rawSimId}`;
      const history = await getEODHistory(targetSimId);
      res.json(history);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/simulator/portfolio", optionalAuth, async (req: any, res: any) => {
    try {
      const rawSimId = (req.query.simulationId || req.query.simId || "default") as string;
      const tenant = getSimulatorTenantScope(req);
      const targetSimId = `${tenant}__${rawSimId}`;
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
      const rawSimId = simulationId || simId || "default";
      const tenant = getSimulatorTenantScope(req);
      const targetSimId = `${tenant}__${rawSimId}`;
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
      const rawSimId = simulationId || simId || "default";
      const tenant = getSimulatorTenantScope(req);
      const targetSimId = `${tenant}__${rawSimId}`;
      const resetState = await resetSimulator(Number(initialCapital) || 100000, marketRegion || "IN", targetSimId);
      res.json({ success: true, message: `Trade Simulator (${targetSimId}) reset successfully.`, portfolio: resetState });
    } catch (e: any) {
      console.error("[Trade Simulator] Reset error:", e);
      res.status(500).json({ error: e.message || "Failed to reset simulator." });
    }
  });
}

