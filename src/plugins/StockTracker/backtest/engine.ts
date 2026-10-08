import YahooFinance from 'yahoo-finance2';
import crypto from 'crypto';
import { IStrategy, StrategyRuleCondition } from '../strategies/types.js';
import { PRESET_STRATEGIES } from '../strategies/presets.js';
import { getStrategyById } from '../strategies/store.js';
import { evaluateStrategy, CandleData } from '../strategies/engine.js';
import {
  BacktestRequest,
  BacktestReport,
  TradeLog,
  BacktestEquityPoint,
  BacktestMetrics,
  MarketRegion
} from './types.js';
import {
  detectMarketRegion,
  getRegionCurrencyInfo,
  calculateRegionalFriction
} from './friction.js';
import { normalizeTicker, formatTickerDisplay } from '../../StockAnalyzer/index.js';

// YahooFinance client instance
const yf = new (YahooFinance as any)({ suppressNotices: ['yahooSurvey'] });

export async function fetchHistoricalBacktestBars(
  symbol: string,
  range: string = '1y',
  interval: any = '1d',
  startDate?: string,
  endDate?: string
): Promise<{ symbol: string; candles: CandleData[] }> {
  let period1: Date;
  let period2: Date = endDate ? new Date(endDate) : new Date();

  if (startDate) {
    period1 = new Date(startDate);
  } else {
    const now = Date.now();
    switch (range) {
      case '1mo': period1 = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
      case '3mo': period1 = new Date(now - 90 * 24 * 60 * 60 * 1000); break;
      case '6mo': period1 = new Date(now - 180 * 24 * 60 * 60 * 1000); break;
      case '1y':  period1 = new Date(now - 365 * 24 * 60 * 60 * 1000); break;
      case '2y':  period1 = new Date(now - 730 * 24 * 60 * 60 * 1000); break;
      case '5y':  period1 = new Date(now - 1825 * 24 * 60 * 60 * 1000); break;
      case 'max': period1 = new Date(now - 20 * 365 * 24 * 60 * 60 * 1000); break;
      default:    period1 = new Date(now - 365 * 24 * 60 * 60 * 1000); break;
    }
  }

  const queryOpts = {
    period1,
    period2,
    interval: interval || '1d'
  };

  const chartRes: any = await yf.chart(symbol, queryOpts);
  const rawQuotes = chartRes.quotes || [];

  const rawCandles: CandleData[] = rawQuotes
    .filter((q: any) => q.close != null && q.open != null && q.high != null && q.low != null)
    .map((q: any) => {
      const timeSec = Math.floor(new Date(q.date).getTime() / 1000);
      return {
        time: timeSec,
        open: Number(Number(q.open).toFixed(2)),
        high: Number(Number(q.high).toFixed(2)),
        low: Number(Number(q.low).toFixed(2)),
        close: Number(Number(q.close).toFixed(2)),
        volume: Number(q.volume || 0)
      };
    })
    .sort((a: CandleData, b: CandleData) => a.time - b.time);

  // Deduplicate timestamps
  const candles: CandleData[] = [];
  const seenTimes = new Set<number>();
  for (const c of rawCandles) {
    if (!seenTimes.has(c.time)) {
      seenTimes.add(c.time);
      candles.push(c);
    }
  }

  return { symbol, candles };
}

export async function runBacktest(req: BacktestRequest): Promise<BacktestReport> {
  const symbol = normalizeTicker(req.symbol);
  const region = req.marketRegion || detectMarketRegion(symbol);
  const currencyInfo = getRegionCurrencyInfo(region);
  const initialCapital = req.initialCapital || currencyInfo.defaultCapital;
  const includeFriction = req.includeFriction !== false;
  const slippagePct = req.slippagePct !== undefined ? req.slippagePct : 0.05;
  const positionSizingPct = req.positionSizingPct ? Math.min(100, Math.max(10, req.positionSizingPct)) : 95;
  const positionSizingModel = req.positionSizingModel || 'CASH_PERCENT';
  const riskPerTradePct = req.riskPerTradePct !== undefined ? req.riskPerTradePct : 1.5;
  const executionFillModel = req.executionFillModel || 'NEXT_BAR_OPEN';
  const riskFreeRatePct = req.riskFreeRatePct !== undefined
    ? req.riskFreeRatePct
    : (region === 'IN' ? 6.5 : (region === 'US' ? 4.5 : 3.5));

  // Resolve Strategy
  let strategy: IStrategy | undefined;
  if (req.customStrategy) {
    strategy = {
      id: req.customStrategy.id || 'custom-sandbox',
      name: req.customStrategy.name || 'Visual Condition Strategy',
      description: req.customStrategy.description || 'User-designed strategy configuration',
      version: '1.0.0',
      isPreset: false,
      isPublic: false,
      market: (req.customStrategy.market as any) || 'GLOBAL',
      timeframe: (req.customStrategy.timeframe as any) || '1D',
      parameters: req.customStrategy.parameters || [],
      rules: req.customStrategy.rules || {
        indicators: {},
        entryConditions: req.customRules?.entryConditions || [],
        exitConditions: req.customRules?.exitConditions || []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } else if (req.strategyId) {
    strategy = getStrategyById(req.strategyId) || PRESET_STRATEGIES.find(p => p.id === req.strategyId);
  }

  if (!strategy) {
    // Default fallback to EMA Golden Cross
    strategy = PRESET_STRATEGIES[0];
  }

  // Fetch historical candle bars
  const { candles } = await fetchHistoricalBacktestBars(
    symbol,
    req.range || '1y',
    req.timeframe || '1d',
    req.startDate,
    req.endDate
  );

  if (candles.length < 25) {
    throw new Error(`Insufficient historical bars for backtesting ${symbol}. Received ${candles.length} bars (minimum 25 bars required).`);
  }

  // State Machine Variables
  let cash = initialCapital;
  let inPosition = false;
  let currentPosition: {
    entryBarIndex: number;
    entryDate: string;
    entryTime: number;
    entryPrice: number;
    entryReason: string;
    quantity: number;
    entryFriction: number;
    stopLoss: number;
    takeProfit: number;
  } | null = null;

  // Pending order queued at bar close for execution at next bar open (QuantConnect LEAN style)
  let pendingBuyOrder: {
    signalBarIndex: number;
    signalDate: string;
    calculatedSL: number;
    calculatedTP: number;
    reason: string;
  } | null = null;

  const trades: TradeLog[] = [];
  const equityCurve: BacktestEquityPoint[] = [];

  let peakEquity = initialCapital;
  let maxDrawdownPct = 0;
  let maxDrawdownDurationBars = 0;
  let currentDrawdownDurationBars = 0;

  const benchmarkStartPrice = candles[0].close;
  const paramOverrides = req.parameterOverrides || {};

  let totalFrictionPaid = 0;
  let totalBrokeragePaid = 0;
  let totalTaxesPaid = 0;
  let totalSlippagePaid = 0;
  let exposureBars = 0;

  // Bar-by-bar progression
  for (let i = 0; i < candles.length; i++) {
    const bar = candles[i];
    const barDateStr = new Date(bar.time * 1000).toISOString().split('T')[0];

    // Current bar closing price & benchmark
    const benchmarkEquity = Number(((initialCapital / benchmarkStartPrice) * bar.close).toFixed(2));

    // 0. EXECUTE PENDING NEXT-BAR OPEN ORDER (If queued from previous bar's signal)
    if (pendingBuyOrder && !inPosition) {
      const fillPrice = bar.open * (1 + (slippagePct / 100)); // Buy fill at Open + Slippage

      // Calculate quantity according to selected sizing model
      let targetCash = cash * (positionSizingPct / 100);
      let calculatedQuantity = Math.floor(targetCash / fillPrice);

      if (positionSizingModel === 'RISK_BASED') {
        const totalEquityNow = cash;
        const dollarRiskAllowed = totalEquityNow * (riskPerTradePct / 100);
        const perShareRisk = Math.max(0.01, fillPrice - pendingBuyOrder.calculatedSL);
        const riskQty = Math.floor(dollarRiskAllowed / perShareRisk);
        const maxCashQty = Math.floor(cash / fillPrice);
        calculatedQuantity = Math.min(riskQty, maxCashQty);
      } else if (positionSizingModel === 'EQUITY_PERCENT') {
        const allocatedEquity = cash * (positionSizingPct / 100);
        calculatedQuantity = Math.floor(allocatedEquity / fillPrice);
      }

      // Board Lot Rounding for HK / Japan
      let quantity = calculatedQuantity;
      if (region === 'HK' || region === 'JP') {
        quantity = Math.floor(calculatedQuantity / 100) * 100;
      }

      if (quantity > 0) {
        const entryFrictionBreakdown = includeFriction
          ? calculateRegionalFriction({
              region,
              side: 'BUY',
              price: fillPrice,
              quantity,
              slippagePct
            })
          : {
              brokerage: 0,
              sttOrStampDuty: 0,
              exchangeTurnover: 0,
              sebiOrSecFee: 0,
              gstOrVat: 0,
              slippage: 0,
              totalFriction: 0
            };

        const entryFriction = entryFrictionBreakdown.totalFriction;
        const grossCost = fillPrice * quantity;
        const totalOutflow = grossCost + entryFriction;

        if (cash >= totalOutflow) {
          cash -= totalOutflow;
          totalFrictionPaid += entryFriction;
          totalBrokeragePaid += (entryFrictionBreakdown.brokerage || 0);
          totalTaxesPaid += ((entryFrictionBreakdown.sttOrStampDuty || 0) + (entryFrictionBreakdown.gstOrVat || 0) + (entryFrictionBreakdown.sebiOrSecFee || 0));
          totalSlippagePaid += (entryFrictionBreakdown.slippage || 0);

          currentPosition = {
            entryBarIndex: i,
            entryDate: barDateStr,
            entryTime: bar.time,
            entryPrice: Number(fillPrice.toFixed(2)),
            entryReason: pendingBuyOrder.reason,
            quantity,
            entryFriction,
            stopLoss: Number(pendingBuyOrder.calculatedSL.toFixed(2)),
            takeProfit: Number(pendingBuyOrder.calculatedTP.toFixed(2))
          };
          inPosition = true;
        }
      }
      pendingBuyOrder = null;
    }

    // 1. POSITION MANAGEMENT & EXIT EVALUATION
    if (inPosition && currentPosition) {
      exposureBars++;
      let shouldExit = false;
      let exitPrice = bar.close;
      let exitReason: TradeLog['exitReason'] = 'SIGNAL_EXIT';

      // China T+1 Rule Check
      const isChinaTPlus1Locked = region === 'CN' && i === currentPosition.entryBarIndex;

      // Realistic Gap & Collision Handling:
      const hitStop = bar.low <= currentPosition.stopLoss;
      const hitTarget = bar.high >= currentPosition.takeProfit;

      // When both Stop Loss and Take Profit are breached in the same bar:
      // Conservative institutional standard: assume Stop Loss was hit first
      if (hitStop && hitTarget && !isChinaTPlus1Locked) {
        shouldExit = true;
        exitPrice = bar.open < currentPosition.stopLoss ? bar.open : currentPosition.stopLoss;
        exitReason = 'STOP_LOSS';
      }
      // A. Stop Loss Hit
      else if (hitStop && !isChinaTPlus1Locked) {
        shouldExit = true;
        // If opened with a gap down below stop loss, fill at open (realistic slippage)
        exitPrice = bar.open < currentPosition.stopLoss ? bar.open : currentPosition.stopLoss;
        exitReason = 'STOP_LOSS';
      }
      // B. Take Profit Hit
      else if (hitTarget && !isChinaTPlus1Locked) {
        shouldExit = true;
        // If opened with a gap up above target, fill at open
        exitPrice = bar.open > currentPosition.takeProfit ? bar.open : currentPosition.takeProfit;
        exitReason = 'TAKE_PROFIT';
      }
      // C. Strategy Rule Exit Signal (Evaluated on candles up to this bar)
      else if (i >= 20 && !isChinaTPlus1Locked) {
        const slice = candles.slice(0, i + 1);
        const signal = evaluateStrategy(strategy, slice, { symbol, current_price: bar.close }, paramOverrides);
        if (signal.action === 'SELL') {
          shouldExit = true;
          exitPrice = bar.close;
          exitReason = 'SIGNAL_EXIT';
        }
      }
      // D. Final Bar Force Close
      if (i === candles.length - 1 && !shouldExit) {
        shouldExit = true;
        exitPrice = bar.close;
        exitReason = 'END_OF_DATA';
      }

      if (shouldExit) {
        // Calculate exit friction with directional slippage
        const effectiveExitPrice = exitPrice * (1 - (slippagePct / 100));
        const exitFrictionBreakdown = includeFriction
          ? calculateRegionalFriction({
              region,
              side: 'SELL',
              price: effectiveExitPrice,
              quantity: currentPosition.quantity,
              slippagePct
            })
          : {
              brokerage: 0,
              sttOrStampDuty: 0,
              exchangeTurnover: 0,
              sebiOrSecFee: 0,
              gstOrVat: 0,
              slippage: 0,
              totalFriction: 0
            };

        const exitFriction = exitFrictionBreakdown.totalFriction;
        const grossProceeds = effectiveExitPrice * currentPosition.quantity;
        const netProceeds = grossProceeds - exitFriction;

        cash += netProceeds;

        // Trade economics
        const grossEntryAmount = currentPosition.entryPrice * currentPosition.quantity;
        const grossPnL = grossProceeds - grossEntryAmount;
        const grossPnLPct = grossEntryAmount > 0 ? (grossPnL / grossEntryAmount) * 100 : 0;

        const totalTradeFriction = currentPosition.entryFriction + exitFriction;
        const netPnL = grossPnL - totalTradeFriction;
        const netPnLPct = grossEntryAmount > 0 ? (netPnL / grossEntryAmount) * 100 : 0;

        totalFrictionPaid += totalTradeFriction;
        totalBrokeragePaid += (exitFrictionBreakdown.brokerage || 0);
        totalTaxesPaid += ((exitFrictionBreakdown.sttOrStampDuty || 0) + (exitFrictionBreakdown.gstOrVat || 0) + (exitFrictionBreakdown.sebiOrSecFee || 0));
        totalSlippagePaid += (exitFrictionBreakdown.slippage || 0);

        const holdingDays = Math.max(1, Math.round((bar.time - currentPosition.entryTime) / (24 * 3600)));

        trades.push({
          id: `tr-${trades.length + 1}-${crypto.randomBytes(3).toString('hex')}`,
          tradeNumber: trades.length + 1,
          symbol,
          side: 'BUY',
          entryDate: currentPosition.entryDate,
          entryTime: currentPosition.entryTime,
          entryPrice: currentPosition.entryPrice,
          entryReason: currentPosition.entryReason,
          exitDate: barDateStr,
          exitTime: bar.time,
          exitPrice: Number(effectiveExitPrice.toFixed(2)),
          exitReason,
          quantity: currentPosition.quantity,
          holdingDays,
          grossPnL: Number(grossPnL.toFixed(2)),
          grossPnLPct: Number(grossPnLPct.toFixed(2)),
          entryFriction: Number(currentPosition.entryFriction.toFixed(2)),
          exitFriction: Number(exitFriction.toFixed(2)),
          totalFriction: Number(totalTradeFriction.toFixed(2)),
          netPnL: Number(netPnL.toFixed(2)),
          netPnLPct: Number(netPnLPct.toFixed(2)),
          isWinner: netPnL > 0,
          cumulativeCapital: Number(cash.toFixed(2))
        });

        inPosition = false;
        currentPosition = null;
      }
    }

    // 2. ENTRY EVALUATION (Only if not already in position and past warm-up period)
    if (!inPosition && !pendingBuyOrder && i >= 20 && i < candles.length - 1) {
      const slice = candles.slice(0, i + 1);
      const signal = evaluateStrategy(strategy, slice, { symbol, current_price: bar.close }, paramOverrides);

      if (signal.action === 'BUY' && signal.confidence >= 0.60) {
        const slMultiplier = req.stopLossPct ? (req.stopLossPct / 100) : 0.05;
        const tpMultiplier = req.takeProfitPct ? (req.takeProfitPct / 100) : 0.12;
        const calculatedSL = signal.stopLoss || (bar.close * (1 - slMultiplier));
        const calculatedTP = signal.targetPrice || (bar.close * (1 + tpMultiplier));
        const reason = signal.reasoning[0] || `${strategy.name} entry signal`;

        if (executionFillModel === 'NEXT_BAR_OPEN') {
          // Queue order for next bar open (eliminates same-bar close lookahead bias)
          pendingBuyOrder = {
            signalBarIndex: i,
            signalDate: barDateStr,
            calculatedSL,
            calculatedTP,
            reason
          };
        } else {
          // SAME_BAR_CLOSE mode
          const fillPrice = bar.close * (1 + (slippagePct / 100));
          let targetCash = cash * (positionSizingPct / 100);
          let calculatedQuantity = Math.floor(targetCash / fillPrice);

          if (positionSizingModel === 'RISK_BASED') {
            const dollarRisk = cash * (riskPerTradePct / 100);
            const perShareRisk = Math.max(0.01, fillPrice - calculatedSL);
            calculatedQuantity = Math.min(Math.floor(dollarRisk / perShareRisk), Math.floor(cash / fillPrice));
          }

          let quantity = calculatedQuantity;
          if (region === 'HK' || region === 'JP') {
            quantity = Math.floor(calculatedQuantity / 100) * 100;
          }

          if (quantity > 0) {
            const entryFrictionBreakdown = includeFriction
              ? calculateRegionalFriction({
                  region,
                  side: 'BUY',
                  price: fillPrice,
                  quantity,
                  slippagePct
                })
              : {
                  brokerage: 0,
                  sttOrStampDuty: 0,
                  exchangeTurnover: 0,
                  sebiOrSecFee: 0,
                  gstOrVat: 0,
                  slippage: 0,
                  totalFriction: 0
                };

            const entryFriction = entryFrictionBreakdown.totalFriction;
            const grossBuyCost = fillPrice * quantity;
            const totalOutflow = grossBuyCost + entryFriction;

            if (cash >= totalOutflow) {
              cash -= totalOutflow;
              totalFrictionPaid += entryFriction;
              totalBrokeragePaid += (entryFrictionBreakdown.brokerage || 0);
              totalTaxesPaid += ((entryFrictionBreakdown.sttOrStampDuty || 0) + (entryFrictionBreakdown.gstOrVat || 0) + (entryFrictionBreakdown.sebiOrSecFee || 0));
              totalSlippagePaid += (entryFrictionBreakdown.slippage || 0);

              currentPosition = {
                entryBarIndex: i,
                entryDate: barDateStr,
                entryTime: bar.time,
                entryPrice: Number(fillPrice.toFixed(2)),
                entryReason: reason,
                quantity,
                entryFriction,
                stopLoss: Number(calculatedSL.toFixed(2)),
                takeProfit: Number(calculatedTP.toFixed(2))
              };
              inPosition = true;
            }
          }
        }
      }
    }

    // 3. DAILY / BAR EQUITY SNAPSHOT
    const positionValue = inPosition && currentPosition ? currentPosition.quantity * bar.close : 0;
    const currentEquity = Number((cash + positionValue).toFixed(2));

    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
      currentDrawdownDurationBars = 0;
    } else {
      currentDrawdownDurationBars++;
      if (currentDrawdownDurationBars > maxDrawdownDurationBars) {
        maxDrawdownDurationBars = currentDrawdownDurationBars;
      }
    }

    const currentDrawdownPct = peakEquity > 0
      ? Number((((peakEquity - currentEquity) / peakEquity) * 100).toFixed(2))
      : 0;

    if (currentDrawdownPct > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdownPct;
    }

    equityCurve.push({
      date: barDateStr,
      time: bar.time,
      equity: currentEquity,
      cash: Number(cash.toFixed(2)),
      drawdownPct: currentDrawdownPct,
      benchmarkPrice: bar.close,
      benchmarkEquity,
      inPosition
    });
  }

  // 4. STATISTICAL & INSTITUTIONAL METRICS CALCULATION
  const finalCapital = equityCurve[equityCurve.length - 1]?.equity || cash;
  const netProfit = finalCapital - initialCapital;
  const netProfitPct = initialCapital > 0 ? (netProfit / initialCapital) * 100 : 0;

  const benchmarkFinalPrice = candles[candles.length - 1]?.close || benchmarkStartPrice;
  const benchmarkReturnPct = benchmarkStartPrice > 0
    ? ((benchmarkFinalPrice - benchmarkStartPrice) / benchmarkStartPrice) * 100
    : 0;

  const alphaPct = netProfitPct - benchmarkReturnPct;

  // Trading Duration in Days
  const startTime = candles[0].time;
  const endTime = candles[candles.length - 1].time;
  const totalDays = Math.max(1, (endTime - startTime) / (24 * 3600));
  const years = totalDays / 365.25;

  // Compounded Annual Growth Rate (CAGR)
  let cagrPct = 0;
  if (years > 0 && finalCapital > 0 && initialCapital > 0) {
    cagrPct = (Math.pow(finalCapital / initialCapital, 1 / years) - 1) * 100;
  }

  // Daily Returns Series
  const dailyReturns: number[] = [];
  for (let k = 1; k < equityCurve.length; k++) {
    const prev = equityCurve[k - 1].equity;
    const curr = equityCurve[k].equity;
    if (prev > 0) {
      dailyReturns.push((curr - prev) / prev);
    }
  }

  // Sharpe and Sortino Ratios
  let sharpeRatio = 0;
  let sortinoRatio = 0;

  if (dailyReturns.length > 5) {
    const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const dailyRf = (riskFreeRatePct / 100) / 252;

    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 0) {
      sharpeRatio = ((meanReturn - dailyRf) / stdDev) * Math.sqrt(252);
    }

    // Downside Deviation (only negative returns below risk-free)
    const downsideDiffs = dailyReturns.filter(r => r < dailyRf).map(r => Math.pow(r - dailyRf, 2));
    const downsideVariance = downsideDiffs.length > 0
      ? downsideDiffs.reduce((sum, d) => sum + d, 0) / dailyReturns.length
      : 0;
    const downsideStdDev = Math.sqrt(downsideVariance);

    if (downsideStdDev > 0) {
      sortinoRatio = ((meanReturn - dailyRf) / downsideStdDev) * Math.sqrt(252);
    }
  }

  // Trade Win/Loss Analytics
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.isWinner).length;
  const losingTrades = totalTrades - winningTrades;
  const winRatePct = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const grossWins = trades.filter(t => t.grossPnL > 0).reduce((sum, t) => sum + t.grossPnL, 0);
  const grossLosses = Math.abs(trades.filter(t => t.grossPnL < 0).reduce((sum, t) => sum + t.grossPnL, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : (grossWins > 0 ? 99.9 : 0);

  const avgTradePnLPct = totalTrades > 0 ? trades.reduce((sum, t) => sum + t.netPnLPct, 0) / totalTrades : 0;
  const winTrades = trades.filter(t => t.netPnLPct > 0);
  const lossTrades = trades.filter(t => t.netPnLPct < 0);
  const avgWinPnLPct = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + t.netPnLPct, 0) / winTrades.length : 0;
  const avgLossPnLPct = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, t) => sum + t.netPnLPct, 0) / lossTrades.length) : 0;
  const riskRewardRatio = avgLossPnLPct > 0 ? avgWinPnLPct / avgLossPnLPct : avgWinPnLPct;

  // Streak calculations
  let maxConsecWins = 0;
  let maxConsecLosses = 0;
  let currWins = 0;
  let currLosses = 0;

  for (const t of trades) {
    if (t.isWinner) {
      currWins++;
      currLosses = 0;
      if (currWins > maxConsecWins) maxConsecWins = currWins;
    } else {
      currLosses++;
      currWins = 0;
      if (currLosses > maxConsecLosses) maxConsecLosses = currLosses;
    }
  }

  const exposureTimePct = candles.length > 0 ? (exposureBars / candles.length) * 100 : 0;

  // Institutional Quantitative Metrics
  // Calmar Ratio: CAGR / Max Drawdown
  const calmarRatio = maxDrawdownPct > 0
    ? Number((Math.max(0, cagrPct) / maxDrawdownPct).toFixed(2))
    : (cagrPct > 0 ? 99.9 : 0);

  // Win/Loss Ratio
  const winLossRatio = avgLossPnLPct > 0
    ? Number((avgWinPnLPct / avgLossPnLPct).toFixed(2))
    : (avgWinPnLPct > 0 ? Number(avgWinPnLPct.toFixed(2)) : 1.0);

  // Kelly Criterion Optimal Leverage: K = W - (1 - W) / R
  let kellyCriterionPct = 0;
  if (totalTrades >= 5 && winLossRatio > 0) {
    const w = winRatePct / 100;
    const r = winLossRatio;
    const k = w - ((1 - w) / r);
    kellyCriterionPct = Number((Math.max(0, k) * 100).toFixed(2));
  }

  // Value at Risk (VaR 95%) and Conditional VaR (Expected Shortfall)
  let var95Pct = 0;
  let cvar95Pct = 0;
  if (dailyReturns.length >= 10) {
    const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
    const idx5 = Math.floor(sortedReturns.length * 0.05);
    const worst5Pct = sortedReturns.slice(0, idx5 + 1);
    var95Pct = Number((Math.abs(sortedReturns[idx5]) * 100).toFixed(2));
    const cvarMean = worst5Pct.reduce((acc, v) => acc + v, 0) / Math.max(1, worst5Pct.length);
    cvar95Pct = Number((Math.abs(cvarMean) * 100).toFixed(2));
  }

  // Recovery Factor: Net Profit / Max Drawdown in Currency
  const maxDollarDrawdown = peakEquity * (maxDrawdownPct / 100);
  const recoveryFactor = maxDollarDrawdown > 0
    ? Number((netProfit / maxDollarDrawdown).toFixed(2))
    : (netProfit > 0 ? 99.9 : 0);

  const metrics: BacktestMetrics = {
    initialCapital: Number(initialCapital.toFixed(2)),
    finalCapital: Number(finalCapital.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    netProfitPct: Number(netProfitPct.toFixed(2)),
    benchmarkReturnPct: Number(benchmarkReturnPct.toFixed(2)),
    alphaPct: Number(alphaPct.toFixed(2)),
    cagrPct: Number(cagrPct.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    sortinoRatio: Number(sortinoRatio.toFixed(2)),
    calmarRatio,
    kellyCriterionPct,
    var95Pct,
    cvar95Pct,
    winLossRatio,
    recoveryFactor,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    maxDrawdownDurationDays: maxDrawdownDurationBars,
    totalTrades,
    winningTrades,
    losingTrades,
    winRatePct: Number(winRatePct.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    avgTradePnLPct: Number(avgTradePnLPct.toFixed(2)),
    avgWinPnLPct: Number(avgWinPnLPct.toFixed(2)),
    avgLossPnLPct: Number(avgLossPnLPct.toFixed(2)),
    riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
    totalFrictionPaid: Number(totalFrictionPaid.toFixed(2)),
    totalBrokeragePaid: Number(totalBrokeragePaid.toFixed(2)),
    totalTaxesPaid: Number(totalTaxesPaid.toFixed(2)),
    totalSlippagePaid: Number(totalSlippagePaid.toFixed(2)),
    maxConsecutiveWins: maxConsecWins,
    maxConsecutiveLosses: maxConsecLosses,
    exposureTimePct: Number(exposureTimePct.toFixed(2))
  };

  const formattedDisplay = formatTickerDisplay(symbol);

  return {
    id: `bt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    strategyId: strategy.id,
    strategyName: strategy.name,
    strategyDescription: strategy.description,
    symbol: formattedDisplay.displaySymbol || symbol,
    marketRegion: region,
    currencySymbol: currencyInfo.symbol,
    currencyCode: currencyInfo.code,
    range: req.range || '1y',
    timeframe: req.timeframe || '1d',
    startDate: new Date(candles[0].time * 1000).toISOString().split('T')[0],
    endDate: new Date(candles[candles.length - 1].time * 1000).toISOString().split('T')[0],
    totalBars: candles.length,
    metrics,
    equityCurve,
    trades,
    frictionSettings: {
      region,
      includeFriction,
      slippagePct,
      tPlus1RuleApplied: region === 'CN',
      executionFillModel
    },
    generatedAt: new Date().toISOString()
  };
}
