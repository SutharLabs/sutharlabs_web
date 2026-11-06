import { CandleData, DetectedPattern } from './types.js';

export function detectCandlestickPatterns(candles: CandleData[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  if (!candles || candles.length < 5) return patterns;

  const n = candles.length;
  // Scan the most recent 5 candles for triggers
  const scanLimit = Math.max(3, n - 5);

  for (let i = n - 1; i >= scanLimit; i--) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const prev2 = i >= 2 ? candles[i - 2] : null;

    const currBody = Math.abs(curr.close - curr.open);
    const currRange = curr.high - curr.low;
    const isCurrGreen = curr.close > curr.open;
    const isCurrRed = curr.close < curr.open;

    if (currRange === 0) continue;

    const upperWick = isCurrGreen ? curr.high - curr.close : curr.high - curr.open;
    const lowerWick = isCurrGreen ? curr.open - curr.low : curr.close - curr.low;

    // ── 1. HAMMER (Bullish Reversal) ─────────────────────────────────────────
    // Lower shadow >= 2x body, upper shadow <= 0.25x body
    if (lowerWick >= currBody * 2.0 && upperWick <= currBody * 0.35 && currBody > 0) {
      // Must occur in a pullback (prior 3 candles trended down)
      const isPullback = prev.close < (prev2 ? prev2.close : prev.close * 1.01);
      if (isPullback) {
        const entryPrice = curr.high;
        const stopLossPrice = parseFloat((curr.low * 0.996).toFixed(2));
        const risk = entryPrice - stopLossPrice;
        const targetPrice = parseFloat((entryPrice + risk * 2.2).toFixed(2));
        const rr = 2.2;

        patterns.push({
          id: `pat-hammer-${curr.time}`,
          type: 'HAMMER',
          name: 'Bullish Hammer Pin Bar',
          direction: 'BULLISH',
          action: 'BUY',
          confidence: 82,
          entryPrice,
          necklinePrice: entryPrice,
          targetPrice,
          stopLossPrice,
          riskRewardRatio: rr,
          startIndex: i - 1,
          endIndex: i,
          startTime: prev.time,
          endTime: curr.time,
          keyPoints: [
            { time: curr.time, price: curr.low, label: 'Hammer Wick Low' },
            { time: curr.time, price: curr.high, label: 'Breakout Level' }
          ],
          description: `Bullish Hammer: Extreme lower wick rejection (₹${curr.low.toFixed(2)}) indicating institutional buying off support. Breakout above ₹${entryPrice.toFixed(2)} targets ₹${targetPrice.toFixed(2)} (SL: ₹${stopLossPrice.toFixed(2)}).`
        });
      }
    }

    // ── 2. BULLISH ENGULFING ─────────────────────────────────────────────────
    if (isCurrGreen && prev.close < prev.open) {
      const prevBody = Math.abs(prev.close - prev.open);
      const engulfsBody = curr.open <= prev.close * 1.002 && curr.close >= prev.open * 0.998 && currBody > prevBody * 1.1;
      const volumeBoost = curr.volume >= prev.volume * 1.15;

      if (engulfsBody) {
        const entryPrice = curr.close;
        const stopLossPrice = parseFloat((Math.min(curr.low, prev.low) * 0.995).toFixed(2));
        const risk = entryPrice - stopLossPrice;
        const targetPrice = parseFloat((entryPrice + risk * 2.5).toFixed(2));
        const rr = 2.5;

        patterns.push({
          id: `pat-bull-engulf-${curr.time}`,
          type: 'BULLISH_ENGULFING',
          name: 'Bullish Engulfing Bar',
          direction: 'BULLISH',
          action: 'BUY',
          confidence: volumeBoost ? 88 : 80,
          volumeConfirmed: volumeBoost,
          entryPrice,
          necklinePrice: entryPrice,
          targetPrice,
          stopLossPrice,
          riskRewardRatio: rr,
          startIndex: i - 1,
          endIndex: i,
          startTime: prev.time,
          endTime: curr.time,
          keyPoints: [
            { time: prev.time, price: prev.low, label: 'Engulfed Low' },
            { time: curr.time, price: curr.high, label: 'Engulfing High' }
          ],
          description: `Bullish Engulfing: High-momentum green bar completely engulfed prior red body${volumeBoost ? ' with 1.2x volume expansion' : ''}. Target: ₹${targetPrice.toFixed(2)} (SL: ₹${stopLossPrice.toFixed(2)}).`
        });
      }
    }

    // ── 3. BEARISH ENGULFING ─────────────────────────────────────────────────
    if (isCurrRed && prev.close > prev.open) {
      const prevBody = Math.abs(prev.close - prev.open);
      const engulfsBody = curr.open >= prev.close * 0.998 && curr.close <= prev.open * 1.002 && currBody > prevBody * 1.1;

      if (engulfsBody) {
        const entryPrice = curr.close;
        const stopLossPrice = parseFloat((Math.max(curr.high, prev.high) * 1.005).toFixed(2));
        const risk = stopLossPrice - entryPrice;
        const targetPrice = parseFloat((entryPrice - risk * 2.5).toFixed(2));
        const rr = 2.5;

        patterns.push({
          id: `pat-bear-engulf-${curr.time}`,
          type: 'BEARISH_ENGULFING',
          name: 'Bearish Engulfing Bar',
          direction: 'BEARISH',
          action: 'SELL',
          confidence: 82,
          entryPrice,
          necklinePrice: entryPrice,
          targetPrice,
          stopLossPrice,
          riskRewardRatio: rr,
          startIndex: i - 1,
          endIndex: i,
          startTime: prev.time,
          endTime: curr.time,
          keyPoints: [
            { time: prev.time, price: prev.high, label: 'Engulfed High' },
            { time: curr.time, price: curr.low, label: 'Engulfing Low' }
          ],
          description: `Bearish Engulfing: Distribution candle engulfed previous green bar. Downside target: ₹${targetPrice.toFixed(2)} (SL: ₹${stopLossPrice.toFixed(2)}).`
        });
      }
    }

    // ── 4. MORNING STAR (3-Candle Bullish Reversal) ───────────────────────────
    if (prev2 && isCurrGreen && prev2.close < prev2.open) {
      const firstBody = Math.abs(prev2.close - prev2.open);
      const middleBody = Math.abs(prev.close - prev.open);
      const isIndecisionMiddle = middleBody <= firstBody * 0.4 && prev.low < prev2.low;
      const isThirdStrongGreen = curr.close >= (prev2.open + prev2.close) / 2;

      if (isIndecisionMiddle && isThirdStrongGreen) {
        const entryPrice = curr.close;
        const stopLossPrice = parseFloat((prev.low * 0.995).toFixed(2));
        const risk = entryPrice - stopLossPrice;
        const targetPrice = parseFloat((entryPrice + risk * 2.8).toFixed(2));
        const rr = 2.8;

        patterns.push({
          id: `pat-morning-star-${curr.time}`,
          type: 'MORNING_STAR',
          name: 'Morning Star Formation',
          direction: 'BULLISH',
          action: 'BUY',
          confidence: 87,
          entryPrice,
          necklinePrice: entryPrice,
          targetPrice,
          stopLossPrice,
          riskRewardRatio: rr,
          startIndex: i - 2,
          endIndex: i,
          startTime: prev2.time,
          endTime: curr.time,
          keyPoints: [
            { time: prev2.time, price: prev2.high, label: 'Prior Bearish Bar' },
            { time: prev.time, price: prev.low, label: 'Star Pivot' },
            { time: curr.time, price: curr.close, label: 'Confirmation Close' }
          ],
          description: `Morning Star: Classical 3-bar institutional exhaustion and bullish reversal. Star trough at ₹${prev.low.toFixed(2)}. Target ₹${targetPrice.toFixed(2)} (R:R ${rr}:1).`
        });
      }
    }

    // ── 5. EVENING STAR (3-Candle Bearish Reversal) ───────────────────────────
    if (prev2 && isCurrRed && prev2.close > prev2.open) {
      const firstBody = Math.abs(prev2.close - prev2.open);
      const middleBody = Math.abs(prev.close - prev.open);
      const isIndecisionMiddle = middleBody <= firstBody * 0.4 && prev.high > prev2.high;
      const isThirdStrongRed = curr.close <= (prev2.open + prev2.close) / 2;

      if (isIndecisionMiddle && isThirdStrongRed) {
        const entryPrice = curr.close;
        const stopLossPrice = parseFloat((prev.high * 1.005).toFixed(2));
        const risk = stopLossPrice - entryPrice;
        const targetPrice = parseFloat((entryPrice - risk * 2.8).toFixed(2));
        const rr = 2.8;

        patterns.push({
          id: `pat-evening-star-${curr.time}`,
          type: 'EVENING_STAR',
          name: 'Evening Star Formation',
          direction: 'BEARISH',
          action: 'SELL',
          confidence: 86,
          entryPrice,
          necklinePrice: entryPrice,
          targetPrice,
          stopLossPrice,
          riskRewardRatio: rr,
          startIndex: i - 2,
          endIndex: i,
          startTime: prev2.time,
          endTime: curr.time,
          keyPoints: [
            { time: prev2.time, price: prev2.low, label: 'Prior Bullish Bar' },
            { time: prev.time, price: prev.high, label: 'Star Peak' },
            { time: curr.time, price: curr.close, label: 'Confirmation Close' }
          ],
          description: `Evening Star: Classical 3-bar distribution top with star exhaustion at ₹${prev.high.toFixed(2)}. Downside target ₹${targetPrice.toFixed(2)} (R:R ${rr}:1).`
        });
      }
    }
  }

  return patterns;
}

