import { Router } from "express";
import { getQuote, getHistory, getAnalysis, getSuggestion } from "../StockAnalyzer/index.js";

export function registerRoutes(router: Router) {
  router.get("/quote", async (req: any, res: any) => {
    try {
      const data = await getQuote(req.query.symbol as string);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/history", async (req: any, res: any) => {
    try {
      const data = await getHistory(
        req.query.symbol as string,
        req.query.period as string,
        req.query.interval as string
      );
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/analysis", async (req: any, res: any) => {
    try {
      const data = await getAnalysis(req.query.symbol as string);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/suggestion", async (req: any, res: any) => {
    try {
      const data = await getSuggestion(req.query.symbol as string);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/nifty50", (_req: any, res: any) => {
    res.json([
      { symbol: "RELIANCE.NS",   name: "Reliance Industries" },
      { symbol: "TCS.NS",        name: "Tata Consultancy Services" },
      { symbol: "HDFCBANK.NS",   name: "HDFC Bank" },
      { symbol: "INFY.NS",       name: "Infosys" },
      { symbol: "ICICIBANK.NS",  name: "ICICI Bank" },
      { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever" },
      { symbol: "ITC.NS",        name: "ITC Limited" },
      { symbol: "SBIN.NS",       name: "State Bank of India" },
      { symbol: "BHARTIARTL.NS", name: "Bharti Airtel" },
      { symbol: "KOTAKBANK.NS",  name: "Kotak Mahindra Bank" },
      { symbol: "LT.NS",         name: "Larsen & Toubro" },
      { symbol: "AXISBANK.NS",   name: "Axis Bank" }
    ]);
  });
}
