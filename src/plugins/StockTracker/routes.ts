import { Router } from "express";
import {
  getQuote,
  getHistory,
  getAnalysis,
  getSuggestion,
  searchStocks,
  formatTickerDisplay,
  normalizeTicker,
  MARKET_UNIVERSES
} from "../StockAnalyzer/index.js";

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
}
