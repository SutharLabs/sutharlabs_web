import { CandleData, DetectedPattern } from './types.js';
import { extractSwingExtrema } from './zigzag.js';
import { detectGeometricPatterns } from './geometricDetector.js';
import { detectCandlestickPatterns } from './candlestickDetector.js';

/**
 * Scans a candlestick series for both macro geometric and micro candlestick patterns.
 * Deduplicates and sorts by confidence and recency.
 */
export function scanChartPatterns(candles: CandleData[]): DetectedPattern[] {
  if (!candles || candles.length < 10) return [];

  // 1. Extract Zigzag extrema for geometric structures
  const extrema = extractSwingExtrema(candles, 3, 0.8);

  // 2. Detect geometric macro patterns (Double Top/Bottom, H&S, Triangles, Flags)
  const geometric = detectGeometricPatterns(candles, extrema);

  // 3. Detect candlestick trigger patterns (Hammer, Engulfing, Morning/Evening Star)
  const candlestick = detectCandlestickPatterns(candles);

  // 4. Merge and deduplicate by time proximity
  const all = [...geometric, ...candlestick];

  // Sort by recency (endIndex descending) and then confidence
  all.sort((a, b) => {
    if (b.endIndex !== a.endIndex) {
      return b.endIndex - a.endIndex;
    }
    return b.confidence - a.confidence;
  });

  // Keep top 6 most actionable active patterns to keep the chart clean
  const uniquePatterns: DetectedPattern[] = [];
  const seenTypesAtTime = new Set<string>();

  for (const p of all) {
    const key = `${p.type}-${p.endTime}`;
    if (!seenTypesAtTime.has(key)) {
      seenTypesAtTime.add(key);
      uniquePatterns.push(p);
      if (uniquePatterns.length >= 8) break;
    }
  }

  return uniquePatterns;
}

export function getPatternColor(pattern: DetectedPattern, theme: 'light' | 'dark' = 'dark'): string {
  if (pattern.direction === 'BULLISH') {
    return theme === 'light' ? '#059669' : '#00e476';
  }
  if (pattern.direction === 'BEARISH') {
    return theme === 'light' ? '#dc2626' : '#ff5252';
  }
  return theme === 'light' ? '#0284c7' : '#00dbe7';
}
