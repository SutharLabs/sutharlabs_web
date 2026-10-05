import { Router } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
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
  deleteStrategy
} from "./strategies/store.js";
import { evaluateStrategy } from "./strategies/engine.js";
import { PRESET_STRATEGIES } from "./strategies/presets.js";
import { fetchStockNews, analyzeStockSentiment, testGeminiApiKey } from "./news/index.js";

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

const WATCHLISTS_DATA_PATH = path.join(process.cwd(), "data", "watchlists.json");

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

function ensureDataDirectory() {
  const dir = path.dirname(WATCHLISTS_DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadWatchlistsFromDisk(): WatchlistRecord[] {
  ensureDataDirectory();
  try {
    if (fs.existsSync(WATCHLISTS_DATA_PATH)) {
      const content = fs.readFileSync(WATCHLISTS_DATA_PATH, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[Watchlist DB] Error reading watchlists.json:", err);
  }
  // Initialize with seed defaults
  saveWatchlistsToDisk(SEED_WATCHLISTS);
  return SEED_WATCHLISTS;
}

function saveWatchlistsToDisk(watchlists: WatchlistRecord[]): void {
  ensureDataDirectory();
  try {
    fs.writeFileSync(WATCHLISTS_DATA_PATH, JSON.stringify(watchlists, null, 2), "utf8");
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

  // ── Database Watchlists Endpoints (Full CRUD with Market Metadata) ─────────
  // GET /watchlists
  router.get("/watchlists", (req: any, res: any) => {
    try {
      const userEmail = (req.query.email as string || '').toLowerCase().trim();
      const all = loadWatchlistsFromDisk();
      if (!userEmail) {
        return res.json(all);
      }
      const filtered = all.filter(w => !w.userEmail || w.userEmail === 'system' || w.userEmail === userEmail);
      res.json(filtered.length > 0 ? filtered : all);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /watchlists (Create new list)
  router.post("/watchlists", (req: any, res: any) => {
    try {
      const { name, userEmail, items = [] } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Watchlist name is required" });
      }

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
        userEmail: userEmail ? userEmail.toLowerCase().trim() : "default_user",
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
  router.put("/watchlists/:id", (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { name, items, isDefault } = req.body;
      const all = loadWatchlistsFromDisk();
      const idx = all.findIndex(w => w.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Watchlist not found" });
      }

      const existing = all[idx];
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
  router.delete("/watchlists/:id", (req: any, res: any) => {
    try {
      const { id } = req.params;
      let all = loadWatchlistsFromDisk();
      const initialLen = all.length;
      all = all.filter(w => w.id !== id);
      if (all.length === initialLen) {
        return res.status(404).json({ error: "Watchlist not found" });
      }
      saveWatchlistsToDisk(all);
      res.json({ success: true, removedId: id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /watchlists/:id/symbols (Add stock with market info to watchlist)
  router.post("/watchlists/:id/symbols", (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { symbol, market, name, exchange } = req.body;
      if (!symbol) {
        return res.status(400).json({ error: "Stock symbol is required" });
      }

      const all = loadWatchlistsFromDisk();
      const target = all.find(w => w.id === id);
      if (!target) {
        return res.status(404).json({ error: "Watchlist not found" });
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
  router.delete("/watchlists/:id/symbols/:symbol", (req: any, res: any) => {
    try {
      const { id, symbol } = req.params;
      const all = loadWatchlistsFromDisk();
      const target = all.find(w => w.id === id);
      if (!target) {
        return res.status(404).json({ error: "Watchlist not found" });
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

  // PUT /watchlists/sync (Batch sync all watchlists)
  router.put("/watchlists/sync", (req: any, res: any) => {
    try {
      const { watchlists } = req.body;
      if (!Array.isArray(watchlists)) {
        return res.status(400).json({ error: "Watchlists array is required" });
      }
      saveWatchlistsToDisk(watchlists);
      res.json({ success: true, count: watchlists.length });
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
}

