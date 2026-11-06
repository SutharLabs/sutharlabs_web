import { CandleData, SwingExtremum } from './types.js';

/**
 * Extracts alternating Swing Highs and Swing Lows (ZigZag pivots) from candlestick data.
 * @param candles Array of historical candles
 * @param window Number of bars on left and right to qualify as an extremum (default 3)
 * @param minDeviationPct Minimum percentage deviation between swing points to eliminate noise (default 1.0%)
 */
export function extractSwingExtrema(
  candles: CandleData[],
  window: number = 3,
  minDeviationPct: number = 1.0
): SwingExtremum[] {
  if (!candles || candles.length < window * 2 + 1) {
    return [];
  }

  const rawExtrema: SwingExtremum[] = [];

  // Step 1: Detect local peaks and troughs
  for (let i = window; i < candles.length - window; i++) {
    const current = candles[i];
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= window; j++) {
      if (candles[i - j].high >= current.high || candles[i + j].high > current.high) {
        isHigh = false;
      }
      if (candles[i - j].low <= current.low || candles[i + j].low < current.low) {
        isLow = false;
      }
    }

    if (isHigh && !isLow) {
      rawExtrema.push({
        index: i,
        time: current.time,
        price: current.high,
        type: 'HIGH'
      });
    } else if (isLow && !isHigh) {
      rawExtrema.push({
        index: i,
        time: current.time,
        price: current.low,
        type: 'LOW'
      });
    }
  }

  if (rawExtrema.length === 0) return [];

  // Step 2: Ensure strictly alternating sequence (HIGH -> LOW -> HIGH -> LOW)
  const alternating: SwingExtremum[] = [];
  let currentExtremum = rawExtrema[0];

  for (let i = 1; i < rawExtrema.length; i++) {
    const next = rawExtrema[i];

    if (next.type === currentExtremum.type) {
      // If two consecutive Highs, keep the higher one
      if (next.type === 'HIGH' && next.price > currentExtremum.price) {
        currentExtremum = next;
      }
      // If two consecutive Lows, keep the lower one
      else if (next.type === 'LOW' && next.price < currentExtremum.price) {
        currentExtremum = next;
      }
    } else {
      // Deviation filter: check if difference meets minDeviationPct
      const diffPct = Math.abs(next.price - currentExtremum.price) / currentExtremum.price * 100;
      if (diffPct >= minDeviationPct) {
        alternating.push(currentExtremum);
        currentExtremum = next;
      }
    }
  }
  alternating.push(currentExtremum);

  return alternating;
}

