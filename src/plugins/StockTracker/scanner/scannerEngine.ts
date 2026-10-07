import crypto from "crypto";
import {
  getQuote,
  getHistory,
  formatTickerDisplay,
  normalizeTicker,
  MARKET_UNIVERSES
} from "../../StockAnalyzer/index.js";
import { getStrategyById } from "../strategies/store.js";
import { PRESET_STRATEGIES } from "../strategies/presets.js";
import { evaluateStrategy } from "../strategies/engine.js";
import { IStrategy } from "../strategies/types.js";
import { ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload } from "./types.js";
import { readJsonData } from "../storageUtils.js";

/**
 * Executes a concurrent technical scan across a selected market universe or watchlist.
 */
export async function runMarketScan(options: ScannerFilterOptions): Promise<ScannerReport> {
  const startTime = Date.now();
  const timeframe = options.timeframe || "1d";
  const universeKey = ((options as any).universe || options.universeKey || (options as any).market || "IN").toUpperCase();

  // 1. Resolve active strategy
  let strategy: IStrategy | undefined;
  if (options.strategyId) {
    strategy = getStrategyById(options.strategyId);
  }
  if (!strategy) {
    strategy = PRESET_STRATEGIES.find(p => p.id === "strat-ema-cross") || PRESET_STRATEGIES[0];
  }

  // 2. Resolve candidate symbols list
  interface TargetSymbolMeta {
    symbol: string;
    name?: string;
    market?: string;
    exchange?: string;
  }
  const targets: TargetSymbolMeta[] = [];

  if (options.customSymbols && options.customSymbols.length > 0) {
    options.customSymbols.forEach(s => targets.push({ symbol: s, market: universeKey }));
  } else if (options.watchlistId) {
    try {
      const watchlists = readJsonData<any[]>("watchlists.json", []);
      const matched = watchlists.find((w: any) => w.id === options.watchlistId);
      if (matched && matched.items && matched.items.length > 0) {
        matched.items.forEach((item: any) => {
          targets.push({
            symbol: item.symbol,
            name: item.name,
            market: item.market || universeKey,
            exchange: item.exchange
          });
        });
      }
    } catch (e) {
      console.warn("[Scanner] Failed reading watchlists:", e);
    }
  }

  // If no targets yet, fallback to Universe registry
  if (targets.length === 0) {
    const marketDef = (MARKET_UNIVERSES as Record<string, any>)[universeKey] || (MARKET_UNIVERSES as Record<string, any>)["IN"];
    if (marketDef && marketDef.stocks) {
      marketDef.stocks.forEach((s: any) => {
        targets.push({
          symbol: s.symbol,
          name: s.name,
          market: universeKey,
          exchange: marketDef.exchange
        });
      });
    }
  }

  // 3. Concurrently scan candidates in chunks of 4 to prevent API flooding
  const CHUNK_SIZE = 4;
  const candidates: ScannerCandidate[] = [];

  for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
    const chunk = targets.slice(i, i + CHUNK_SIZE);
    const chunkPromises = chunk.map(async (meta) => {
      try {
        const targetMarket = meta.market || universeKey;
        const normSym = normalizeTicker(meta.symbol, targetMarket);
        const fmt = formatTickerDisplay(normSym, meta.exchange);

        const scanInterval = ((options as any).interval || (options as any).timeframe || "1d").toLowerCase();
        const candlePeriod = scanInterval === "1m" ? "5d" : (scanInterval === "5m" || scanInterval === "15m") ? "1M" : "1Y";

        // Fetch quote and candles using selected timeframe
        const [quote, historyRes] = await Promise.all([
          getQuote(normSym, targetMarket).catch(() => null),
          getHistory(normSym, candlePeriod, scanInterval, targetMarket).catch(() => null)
        ]);
        const candles = (historyRes as any)?.candles || [];

        if (!candles || candles.length < 15) return null;

        const currentPrice = quote?.current_price ?? candles[candles.length - 1].close;
        const change24h = quote?.change ?? (candles[candles.length - 1].close - candles[candles.length - 2].close);
        const changePercent24h = quote?.change_percent ?? (change24h / (candles[candles.length - 2].close || 1)) * 100;
        const volume = quote?.volume ?? candles[candles.length - 1].volume ?? 0;

        // Calculate 20-day Average Volume & Volume Spike Ratio
        const last20Bars = candles.slice(-20);
        const avgVol = last20Bars.reduce((sum, b) => sum + (b.volume || 0), 0) / Math.max(1, last20Bars.length);
        const volSpike = avgVol > 0 ? parseFloat((volume / avgVol).toFixed(2)) : 1.0;

        // Evaluate Strategy
        const signal = evaluateStrategy(strategy!, candles, quote, options.paramOverrides || {});

        // Compute Simple EMA Trend (20 vs 50)
        let emaTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
        if (candles.length >= 50) {
          const cLast = candles[candles.length - 1].close;
          const cPrev = candles[candles.length - 20].close;
          if (cLast > cPrev && changePercent24h > 0) emaTrend = 'BULLISH';
          else if (cLast < cPrev && changePercent24h < 0) emaTrend = 'BEARISH';
        }

        // Calculate Risk / Reward
        let rrr: number | undefined;
        const tpVal = signal.targetPrice ?? (signal as any).takeProfit;
        if (signal.entryPrice && signal.stopLoss && tpVal) {
          const risk = Math.abs(signal.entryPrice - signal.stopLoss);
          const reward = Math.abs(tpVal - signal.entryPrice);
          if (risk > 0) rrr = parseFloat((reward / risk).toFixed(2));
        }

        const candidate: ScannerCandidate = {
          symbol: normSym,
          name: quote?.name || meta.name || fmt.cleanSymbol,
          cleanSymbol: fmt.cleanSymbol,
          displaySymbol: fmt.displaySymbol,
          market: targetMarket,
          exchange: meta.exchange || quote?.exchange || fmt.exchange || "GLOBAL",
          currency: (targetMarket === "IN" || normSym.endsWith(".NS") || normSym.endsWith(".BO")) ? "INR" : (quote?.currency || "USD"),
          currencySymbol: (targetMarket === "IN" || normSym.endsWith(".NS") || normSym.endsWith(".BO")) ? "₹" : (quote?.currency_symbol || (targetMarket === "EU" ? "€" : "$")),
          currentPrice: parseFloat(currentPrice.toFixed(2)),
          change24h: parseFloat(change24h.toFixed(2)),
          changePercent24h: parseFloat(changePercent24h.toFixed(2)),
          volume,
          avgVolume20d: Math.round(avgVol),
          volumeSpikeRatio: volSpike,
          signal: signal.action,
          confidence: parseFloat(signal.confidence.toFixed(2)),
          reason: (signal.reasoning && signal.reasoning.length > 0) ? signal.reasoning.join("; ") : "Quantitative condition criteria verified",
          stopLoss: signal.stopLoss ? parseFloat(signal.stopLoss.toFixed(2)) : undefined,
          takeProfit: tpVal ? parseFloat(Number(tpVal).toFixed(2)) : undefined,
          riskRewardRatio: rrr,
          emaTrend,
          scannedAt: new Date().toISOString()
        };

        return candidate;
      } catch (err) {
        console.warn(`[Scanner] Error scanning ${meta.symbol}:`, err);
        return null;
      }
    });

    const results = await Promise.all(chunkPromises);
    results.forEach(res => {
      if (res) candidates.push(res);
    });
  }

  // 4. Filter according to user criteria
  let filtered = [...candidates];
  if (options.signalFilter === 'BUY') {
    filtered = filtered.filter(c => c.signal === 'BUY');
  } else if (options.signalFilter === 'SELL') {
    filtered = filtered.filter(c => c.signal === 'SELL');
  } else if (options.signalFilter === 'HIGH_CONVICTION') {
    filtered = filtered.filter(c => c.signal === 'BUY' && c.confidence >= (options.minConfidence || 0.65));
  }

  if (options.minConfidence !== undefined) {
    filtered = filtered.filter(c => c.confidence >= options.minConfidence!);
  }
  if (options.minVolumeSpike !== undefined && options.minVolumeSpike > 1.0) {
    filtered = filtered.filter(c => c.volumeSpikeRatio >= options.minVolumeSpike!);
  }

  // Sort by Signal Priority (BUY > SELL > HOLD), then Confidence (descending), then 24h change %
  filtered.sort((a, b) => {
    const priority = { BUY: 3, SELL: 2, HOLD: 1 };
    const pDiff = (priority[b.signal] || 0) - (priority[a.signal] || 0);
    if (pDiff !== 0) return pDiff;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.changePercent24h - a.changePercent24h;
  });

  const buyCount = candidates.filter(c => c.signal === 'BUY').length;
  const sellCount = candidates.filter(c => c.signal === 'SELL').length;
  const holdCount = candidates.filter(c => c.signal === 'HOLD').length;
  const highConvictionCount = candidates.filter(c => c.signal === 'BUY' && c.confidence >= 0.70).length;
  const topPick = filtered.find(c => c.signal === 'BUY') || filtered[0];

  const report: ScannerReport = {
    id: `scan-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    strategyId: strategy.id,
    strategyName: strategy.name,
    universe: options.watchlistId ? `Watchlist (${options.watchlistId})` : `${universeKey} Universe`,
    scannedAt: new Date().toISOString(),
    executionTimeMs: Date.now() - startTime,
    summary: {
      totalScanned: candidates.length,
      buyCount,
      sellCount,
      holdCount,
      highConvictionCount,
      topPick
    },
    results: filtered
  };

  return report;
}

/**
 * Dispatches an automated real-time alert payload to a webhook URL (Discord / Telegram / Generic).
 */
export async function dispatchWebhookAlert(webhookUrl: string, candidate: ScannerCandidate, strategyName: string): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const payload: WebhookAlertPayload = {
      alertType: 'SCANNER_SIGNAL',
      symbol: candidate.symbol,
      companyName: candidate.name,
      action: candidate.signal,
      confidence: candidate.confidence,
      price: candidate.currentPrice,
      stopLoss: candidate.stopLoss,
      takeProfit: candidate.takeProfit,
      reason: candidate.reason,
      strategyName,
      timestamp: new Date().toISOString()
    };

    // Format for Discord webhook if applicable
    let body: any = payload;
    if (webhookUrl.includes("discord.com/api/webhooks")) {
      const color = candidate.signal === 'BUY' ? 0x00e476 : candidate.signal === 'SELL' ? 0xff6b6b : 0x00dbe7;
      body = {
        embeds: [{
          title: `🚨 ${candidate.signal} Alert: ${candidate.symbol} (${candidate.name})`,
          description: candidate.reason,
          color,
          fields: [
            { name: "Price", value: `${candidate.currencySymbol}${candidate.currentPrice.toLocaleString()}`, inline: true },
            { name: "Confidence", value: `${Math.round(candidate.confidence * 100)}%`, inline: true },
            { name: "Strategy", value: strategyName, inline: true },
            { name: "Stop Loss", value: candidate.stopLoss ? `${candidate.currencySymbol}${candidate.stopLoss}` : "N/A", inline: true },
            { name: "Take Profit", value: candidate.takeProfit ? `${candidate.currencySymbol}${candidate.takeProfit}` : "N/A", inline: true },
            { name: "Volume Spike", value: `${candidate.volumeSpikeRatio}x`, inline: true }
          ],
          footer: { text: "SutharLabs Algorithmic Trading Suite v1.0.0" },
          timestamp: new Date().toISOString()
        }]
      };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    return {
      success: response.ok,
      status: response.status,
      error: response.ok ? undefined : `HTTP error: ${response.statusText}`
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to reach webhook endpoint."
    };
  }
}
