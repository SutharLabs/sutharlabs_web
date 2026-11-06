import { CandleData, DetectedPattern, KeyPivotPoint, SwingExtremum } from './types.js';

export function detectGeometricPatterns(
  candles: CandleData[],
  extrema: SwingExtremum[]
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  if (!candles || candles.length < 15 || extrema.length < 3) {
    return patterns;
  }

  const latestCandle = candles[candles.length - 1];
  const currentPrice = latestCandle.close;

  // ── 1. DOUBLE BOTTOM ("W") & DOUBLE TOP ("M") ──────────────────────────────
  for (let i = 0; i < extrema.length - 2; i++) {
    const p1 = extrema[i];
    const p2 = extrema[i + 1];
    const p3 = extrema[i + 2];

    // Double Bottom: LOW -> HIGH -> LOW
    if (p1.type === 'LOW' && p2.type === 'HIGH' && p3.type === 'LOW') {
      const troughParityPct = Math.abs(p1.price - p3.price) / p1.price * 100;
      const heightPct = (p2.price - Math.min(p1.price, p3.price)) / Math.min(p1.price, p3.price) * 100;

      // Parity within 3%, minimum height of 2.0%
      if (troughParityPct <= 3.0 && heightPct >= 2.0) {
        const neckline = p2.price;
        const lowestTrough = Math.min(p1.price, p3.price);
        const patternHeight = neckline - lowestTrough;
        const targetPrice = parseFloat((neckline + patternHeight).toFixed(2));
        const stopLossPrice = parseFloat((lowestTrough * 0.992).toFixed(2));
        const risk = neckline - stopLossPrice;
        const reward = targetPrice - neckline;
        const rr = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 2.0;

        // Is pattern recent (within last 35 bars)?
        const isRecent = (candles.length - 1 - p3.index) <= 35;
        const isBreakout = currentPrice >= neckline * 0.995;

        if (isRecent) {
          const confidence = Math.min(95, Math.round(75 + (3.0 - troughParityPct) * 4 + (isBreakout ? 10 : 0)));
          const keyPoints: KeyPivotPoint[] = [
            { time: p1.time, price: p1.price, label: 'Trough 1' },
            { time: p2.time, price: p2.price, label: 'Neckline Pivot' },
            { time: p3.time, price: p3.price, label: 'Trough 2' },
            { time: latestCandle.time, price: neckline, label: 'Breakout Level' }
          ];

          patterns.push({
            id: `pat-w-bottom-${p1.time}`,
            type: 'DOUBLE_BOTTOM',
            name: 'Double Bottom (W-Formation)',
            direction: 'BULLISH',
            action: isBreakout ? 'BUY' : 'WATCH_BREAKOUT',
            confidence,
            entryPrice: neckline,
            necklinePrice: neckline,
            targetPrice,
            stopLossPrice,
            riskRewardRatio: rr,
            startIndex: p1.index,
            endIndex: p3.index,
            startTime: p1.time,
            endTime: p3.time,
            keyPoints,
            description: `Classic W-Reversal: Two distinct troughs at ₹${p1.price.toFixed(2)} and ₹${p3.price.toFixed(2)} (parity ${troughParityPct.toFixed(1)}%). Neckline resistance at ₹${neckline.toFixed(2)}. Projected target ₹${targetPrice.toFixed(2)} with R:R ${rr}:1.`
          });
        }
      }
    }

    // Double Top: HIGH -> LOW -> HIGH
    if (p1.type === 'HIGH' && p2.type === 'LOW' && p3.type === 'HIGH') {
      const peakParityPct = Math.abs(p1.price - p3.price) / p1.price * 100;
      const heightPct = (Math.max(p1.price, p3.price) - p2.price) / p2.price * 100;

      if (peakParityPct <= 3.0 && heightPct >= 2.0) {
        const neckline = p2.price;
        const highestPeak = Math.max(p1.price, p3.price);
        const patternHeight = highestPeak - neckline;
        const targetPrice = parseFloat((neckline - patternHeight).toFixed(2));
        const stopLossPrice = parseFloat((highestPeak * 1.008).toFixed(2));
        const risk = stopLossPrice - neckline;
        const reward = neckline - targetPrice;
        const rr = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 2.0;

        const isRecent = (candles.length - 1 - p3.index) <= 35;
        const isBreakdown = currentPrice <= neckline * 1.005;

        if (isRecent) {
          const confidence = Math.min(95, Math.round(74 + (3.0 - peakParityPct) * 4 + (isBreakdown ? 10 : 0)));
          const keyPoints: KeyPivotPoint[] = [
            { time: p1.time, price: p1.price, label: 'Peak 1' },
            { time: p2.time, price: p2.price, label: 'Neckline Support' },
            { time: p3.time, price: p3.price, label: 'Peak 2' },
            { time: latestCandle.time, price: neckline, label: 'Breakdown Level' }
          ];

          patterns.push({
            id: `pat-m-top-${p1.time}`,
            type: 'DOUBLE_TOP',
            name: 'Double Top (M-Formation)',
            direction: 'BEARISH',
            action: isBreakdown ? 'SELL' : 'WATCH_BREAKOUT',
            confidence,
            entryPrice: neckline,
            necklinePrice: neckline,
            targetPrice,
            stopLossPrice,
            riskRewardRatio: rr,
            startIndex: p1.index,
            endIndex: p3.index,
            startTime: p1.time,
            endTime: p3.time,
            keyPoints,
            description: `Bearish M-Reversal: Twin peaks at ₹${p1.price.toFixed(2)} and ₹${p3.price.toFixed(2)} (parity ${peakParityPct.toFixed(1)}%). Neckline support at ₹${neckline.toFixed(2)}. Target target ₹${targetPrice.toFixed(2)} with R:R ${rr}:1.`
          });
        }
      }
    }
  }

  // ── 2. INVERSE HEAD & SHOULDERS & HEAD & SHOULDERS TOP ────────────────────
  for (let i = 0; i < extrema.length - 4; i++) {
    const p1 = extrema[i];     // L_Shoulder
    const p2 = extrema[i + 1]; // Neckline 1
    const p3 = extrema[i + 2]; // Head
    const p4 = extrema[i + 3]; // Neckline 2
    const p5 = extrema[i + 4]; // R_Shoulder

    // Inverse Head & Shoulders: LOW -> HIGH -> LOW -> HIGH -> LOW
    if (
      p1.type === 'LOW' && p2.type === 'HIGH' &&
      p3.type === 'LOW' && p4.type === 'HIGH' &&
      p5.type === 'LOW'
    ) {
      const headLowerThanLeft = p3.price < p1.price;
      const headLowerThanRight = p3.price < p5.price;
      const shoulderParityPct = Math.abs(p1.price - p5.price) / p1.price * 100;

      if (headLowerThanLeft && headLowerThanRight && shoulderParityPct <= 5.0) {
        const neckline = parseFloat(((p2.price + p4.price) / 2).toFixed(2));
        const headDepth = neckline - p3.price;
        const targetPrice = parseFloat((neckline + headDepth).toFixed(2));
        const stopLossPrice = parseFloat((p5.price * 0.99).toFixed(2));
        const risk = neckline - stopLossPrice;
        const reward = targetPrice - neckline;
        const rr = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 2.5;

        const isRecent = (candles.length - 1 - p5.index) <= 45;
        const isBreakout = currentPrice >= neckline * 0.995;

        if (isRecent) {
          const confidence = Math.min(95, Math.round(80 + (5.0 - shoulderParityPct) * 2 + (isBreakout ? 10 : 0)));
          const keyPoints: KeyPivotPoint[] = [
            { time: p1.time, price: p1.price, label: 'Left Shoulder' },
            { time: p2.time, price: p2.price, label: 'Neckline Pivot 1' },
            { time: p3.time, price: p3.price, label: 'Head (Trough)' },
            { time: p4.time, price: p4.price, label: 'Neckline Pivot 2' },
            { time: p5.time, price: p5.price, label: 'Right Shoulder' }
          ];

          patterns.push({
            id: `pat-inv-hs-${p3.time}`,
            type: 'INVERSE_HEAD_AND_SHOULDERS',
            name: 'Inverse Head & Shoulders',
            direction: 'BULLISH',
            action: isBreakout ? 'BUY' : 'WATCH_BREAKOUT',
            confidence,
            entryPrice: neckline,
            necklinePrice: neckline,
            targetPrice,
            stopLossPrice,
            riskRewardRatio: rr,
            startIndex: p1.index,
            endIndex: p5.index,
            startTime: p1.time,
            endTime: p5.time,
            keyPoints,
            description: `Major Bullish Reversal: Left Shoulder (₹${p1.price.toFixed(2)}), Deep Head (₹${p3.price.toFixed(2)}), Right Shoulder (₹${p5.price.toFixed(2)}). Breakout neckline at ₹${neckline.toFixed(2)}. Target ₹${targetPrice.toFixed(2)} with R:R ${rr}:1.`
          });
        }
      }
    }

    // Head & Shoulders Top: HIGH -> LOW -> HIGH -> LOW -> HIGH
    if (
      p1.type === 'HIGH' && p2.type === 'LOW' &&
      p3.type === 'HIGH' && p4.type === 'LOW' &&
      p5.type === 'HIGH'
    ) {
      const headHigherThanLeft = p3.price > p1.price;
      const headHigherThanRight = p3.price > p5.price;
      const shoulderParityPct = Math.abs(p1.price - p5.price) / p1.price * 100;

      if (headHigherThanLeft && headHigherThanRight && shoulderParityPct <= 5.0) {
        const neckline = parseFloat(((p2.price + p4.price) / 2).toFixed(2));
        const headHeight = p3.price - neckline;
        const targetPrice = parseFloat((neckline - headHeight).toFixed(2));
        const stopLossPrice = parseFloat((p5.price * 1.01).toFixed(2));
        const risk = stopLossPrice - neckline;
        const reward = neckline - targetPrice;
        const rr = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 2.5;

        const isRecent = (candles.length - 1 - p5.index) <= 45;
        const isBreakdown = currentPrice <= neckline * 1.005;

        if (isRecent) {
          const confidence = Math.min(95, Math.round(79 + (5.0 - shoulderParityPct) * 2 + (isBreakdown ? 10 : 0)));
          const keyPoints: KeyPivotPoint[] = [
            { time: p1.time, price: p1.price, label: 'Left Shoulder' },
            { time: p2.time, price: p2.price, label: 'Neckline Pivot 1' },
            { time: p3.time, price: p3.price, label: 'Head (Apex)' },
            { time: p4.time, price: p4.price, label: 'Neckline Pivot 2' },
            { time: p5.time, price: p5.price, label: 'Right Shoulder' }
          ];

          patterns.push({
            id: `pat-hs-top-${p3.time}`,
            type: 'HEAD_AND_SHOULDERS',
            name: 'Head & Shoulders Top',
            direction: 'BEARISH',
            action: isBreakdown ? 'SELL' : 'WATCH_BREAKOUT',
            confidence,
            entryPrice: neckline,
            necklinePrice: neckline,
            targetPrice,
            stopLossPrice,
            riskRewardRatio: rr,
            startIndex: p1.index,
            endIndex: p5.index,
            startTime: p1.time,
            endTime: p5.time,
            keyPoints,
            description: `Major Bearish Distribution: Left Shoulder (₹${p1.price.toFixed(2)}), Crown Head (₹${p3.price.toFixed(2)}), Right Shoulder (₹${p5.price.toFixed(2)}). Breakdown neckline at ₹${neckline.toFixed(2)}. Target ₹${targetPrice.toFixed(2)} with R:R ${rr}:1.`
          });
        }
      }
    }
  }

  // ── 3. ASCENDING & DESCENDING TRIANGLES ────────────────────────────────────
  if (extrema.length >= 4) {
    const recentHighs = extrema.filter(e => e.type === 'HIGH').slice(-4);
    const recentLows = extrema.filter(e => e.type === 'LOW').slice(-4);

    if (recentHighs.length >= 2 && recentLows.length >= 2) {
      const h1 = recentHighs[recentHighs.length - 2];
      const h2 = recentHighs[recentHighs.length - 1];
      const l1 = recentLows[recentLows.length - 2];
      const l2 = recentLows[recentLows.length - 1];

      const highParityPct = Math.abs(h1.price - h2.price) / h1.price * 100;
      const lowParityPct = Math.abs(l1.price - l2.price) / l1.price * 100;
      const lowsAscending = l2.price > l1.price * 1.01;
      const highsDescending = h2.price < h1.price * 0.99;

      // Ascending Triangle: Flat Highs + Rising Lows
      if (highParityPct <= 1.2 && lowsAscending) {
        const ceiling = Math.max(h1.price, h2.price);
        const triangleHeight = ceiling - l1.price;
        const targetPrice = parseFloat((ceiling + triangleHeight * 0.9).toFixed(2));
        const stopLossPrice = parseFloat((l2.price * 0.995).toFixed(2));
        const risk = ceiling - stopLossPrice;
        const reward = targetPrice - ceiling;
        const rr = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 2.2;
        const isBreakout = currentPrice >= ceiling * 0.998;

        patterns.push({
          id: `pat-asc-tri-${l1.time}`,
          type: 'ASCENDING_TRIANGLE',
          name: 'Ascending Triangle',
          direction: 'BULLISH',
          action: isBreakout ? 'BUY' : 'WATCH_BREAKOUT',
          confidence: Math.min(92, 78 + (isBreakout ? 12 : 0)),
          entryPrice: ceiling,
          necklinePrice: ceiling,
          targetPrice,
          stopLossPrice,
          riskRewardRatio: rr,
          startIndex: Math.min(h1.index, l1.index),
          endIndex: Math.max(h2.index, l2.index),
          startTime: Math.min(h1.time, l1.time),
          endTime: Math.max(h2.time, l2.time),
          keyPoints: [
            { time: h1.time, price: h1.price, label: 'Resistance 1' },
            { time: l1.time, price: l1.price, label: 'Higher Low 1' },
            { time: h2.time, price: h2.price, label: 'Resistance 2' },
            { time: l2.time, price: l2.price, label: 'Higher Low 2' }
          ],
          description: `Bullish Accumulation Triangle: Flat ceiling resistance at ₹${ceiling.toFixed(2)} with rising higher lows (₹${l1.price.toFixed(2)} $\\to$ ₹${l2.price.toFixed(2)}). Breakout target ₹${targetPrice.toFixed(2)}.`
        });
      }

      // Descending Triangle: Flat Lows + Declining Highs
      if (lowParityPct <= 1.2 && highsDescending) {
        const floor = Math.min(l1.price, l2.price);
        const triangleHeight = h1.price - floor;
        const targetPrice = parseFloat((floor - triangleHeight * 0.9).toFixed(2));
        const stopLossPrice = parseFloat((h2.price * 1.005).toFixed(2));
        const risk = stopLossPrice - floor;
        const reward = floor - targetPrice;
        const rr = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 2.2;
        const isBreakdown = currentPrice <= floor * 1.002;

        patterns.push({
          id: `pat-desc-tri-${h1.time}`,
          type: 'DESCENDING_TRIANGLE',
          name: 'Descending Triangle',
          direction: 'BEARISH',
          action: isBreakdown ? 'SELL' : 'WATCH_BREAKOUT',
          confidence: Math.min(92, 77 + (isBreakdown ? 12 : 0)),
          entryPrice: floor,
          necklinePrice: floor,
          targetPrice,
          stopLossPrice,
          riskRewardRatio: rr,
          startIndex: Math.min(h1.index, l1.index),
          endIndex: Math.max(h2.index, l2.index),
          startTime: Math.min(h1.time, l1.time),
          endTime: Math.max(h2.time, l2.time),
          keyPoints: [
            { time: h1.time, price: h1.price, label: 'Lower High 1' },
            { time: l1.time, price: l1.price, label: 'Support 1' },
            { time: h2.time, price: h2.price, label: 'Lower High 2' },
            { time: l2.time, price: l2.price, label: 'Support 2' }
          ],
          description: `Bearish Distribution Triangle: Flat support floor at ₹${floor.toFixed(2)} with descending lower highs (₹${h1.price.toFixed(2)} $\\to$ ₹${h2.price.toFixed(2)}). Breakdown target ₹${targetPrice.toFixed(2)}.`
        });
      }
    }
  }

  // ── 4. BULL FLAG & BEAR FLAG CONTINUATIONS ─────────────────────────────────
  if (candles.length >= 16) {
    const windowBars = 14;
    const windowSlice = candles.slice(-windowBars);

    // Look for pole: 4-5 consecutive candles with rapid gain
    for (let pStart = 0; pStart <= windowBars - 8; pStart++) {
      const poleStart = windowSlice[pStart];
      const poleEnd = windowSlice[pStart + 4];
      const poleGainPct = (poleEnd.close - poleStart.open) / poleStart.open * 100;

      // Bull Flag: Strong upward pole >= 3.0% followed by tight downward drift
      if (poleGainPct >= 3.0) {
        const flagSlice = windowSlice.slice(pStart + 4);
        const flagMax = Math.max(...flagSlice.map(c => c.high));
        const flagMin = Math.min(...flagSlice.map(c => c.low));
        const retracementPct = (poleEnd.close - flagMin) / (poleEnd.close - poleStart.open) * 100;

        // Healthy bull flag retraces between 20% and 55% of the pole
        if (retracementPct >= 20 && retracementPct <= 55) {
          const breakoutTrigger = flagMax;
          const poleHeight = poleEnd.close - poleStart.open;
          const targetPrice = parseFloat((breakoutTrigger + poleHeight * 0.85).toFixed(2));
          const stopLossPrice = parseFloat((flagMin * 0.995).toFixed(2));
          const risk = breakoutTrigger - stopLossPrice;
          const reward = targetPrice - breakoutTrigger;
          const rr = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 2.5;

          patterns.push({
            id: `pat-bull-flag-${poleStart.time}`,
            type: 'BULL_FLAG',
            name: 'Bull Flag (Momentum Continuation)',
            direction: 'BULLISH',
            action: currentPrice >= breakoutTrigger * 0.998 ? 'BUY' : 'WATCH_BREAKOUT',
            confidence: 84,
            entryPrice: breakoutTrigger,
            necklinePrice: breakoutTrigger,
            targetPrice,
            stopLossPrice,
            riskRewardRatio: rr,
            startIndex: candles.length - windowBars + pStart,
            endIndex: candles.length - 1,
            startTime: poleStart.time,
            endTime: latestCandle.time,
            keyPoints: [
              { time: poleStart.time, price: poleStart.open, label: 'Pole Origin' },
              { time: poleEnd.time, price: poleEnd.close, label: 'Pole Peak' },
              { time: latestCandle.time, price: flagMin, label: 'Flag Support' }
            ],
            description: `Bull Flag: Impulsive +${poleGainPct.toFixed(1)}% pole followed by tight consolidation channel. Breakout above ₹${breakoutTrigger.toFixed(2)} targets ₹${targetPrice.toFixed(2)}.`
          });
          break;
        }
      }
    }
  }

  return patterns;
}
