import { MarketRegion, FrictionBreakdown } from './types.js';

export interface RegionalFrictionParams {
  region: MarketRegion;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  isDelivery?: boolean;
  slippagePct?: number; // e.g. 0.05 for 0.05%
}

export function detectMarketRegion(symbol: string): MarketRegion {
  const s = symbol.toUpperCase().trim();
  if (s.endsWith('.NS') || s.endsWith('.BO')) return 'IN';
  if (s.endsWith('.L')) return 'UK';
  if (s.endsWith('.PA') || s.endsWith('.AS') || s.endsWith('.DE') || s.endsWith('.MI')) return 'EU';
  if (s.endsWith('.SS') || s.endsWith('.SZ')) return 'CN';
  if (s.endsWith('.HK')) return 'HK';
  if (s.endsWith('.T')) return 'JP';
  return 'US';
}

export function getRegionCurrencyInfo(region: MarketRegion): { symbol: string; code: string; defaultCapital: number } {
  switch (region) {
    case 'IN': return { symbol: '₹', code: 'INR', defaultCapital: 100000 };
    case 'US': return { symbol: '$', code: 'USD', defaultCapital: 10000 };
    case 'UK': return { symbol: '£', code: 'GBP', defaultCapital: 10000 };
    case 'EU': return { symbol: '€', code: 'EUR', defaultCapital: 10000 };
    case 'CN': return { symbol: '¥', code: 'CNY', defaultCapital: 100000 };
    case 'HK': return { symbol: 'HK$', code: 'HKD', defaultCapital: 100000 };
    case 'JP': return { symbol: '¥', code: 'JPY', defaultCapital: 1000000 };
    default:   return { symbol: '$', code: 'USD', defaultCapital: 10000 };
  }
}

export function calculateRegionalFriction(params: RegionalFrictionParams): FrictionBreakdown {
  const { region, side, price, quantity, slippagePct = 0.05 } = params;
  const grossAmount = price * quantity;
  const notes: string[] = [];

  let brokerage = 0;
  let sttOrStampDuty = 0;
  let exchangeTurnover = 0;
  let sebiOrSecFee = 0;
  let gstOrVat = 0;
  const slippage = grossAmount * (slippagePct / 100);

  const currencyInfo = getRegionCurrencyInfo(region);

  switch (region) {
    case 'IN': {
      // India NSE/BSE Equity Delivery Friction
      // Brokerage: Flat ₹20 or 0.03% (whichever is lower, Zerodha/Groww standard)
      brokerage = Math.min(20, grossAmount * 0.0003);
      // STT: 0.1% on delivery (both Buy & Sell)
      sttOrStampDuty = grossAmount * 0.001;
      // Exchange turnover fee: 0.00345%
      exchangeTurnover = grossAmount * 0.0000345;
      // SEBI Turnover fee: 0.0001% (₹10 per crore)
      sebiOrSecFee = grossAmount * 0.000001;
      // Stamp Duty: 0.015% on Buy only
      if (side === 'BUY') {
        const stampDuty = grossAmount * 0.00015;
        sttOrStampDuty += stampDuty;
      }
      // GST: 18% on (Brokerage + Exchange + SEBI fees)
      gstOrVat = (brokerage + exchangeTurnover + sebiOrSecFee) * 0.18;

      notes.push(`STT (0.1%): ${currencyInfo.symbol}${sttOrStampDuty.toFixed(2)}`);
      notes.push(`Brokerage: ${currencyInfo.symbol}${brokerage.toFixed(2)}`);
      notes.push(`GST (18% on services): ${currencyInfo.symbol}${gstOrVat.toFixed(2)}`);
      break;
    }

    case 'US': {
      // US NYSE/NASDAQ Zero-Commission Model
      brokerage = 0;
      exchangeTurnover = 0;
      if (side === 'SELL') {
        // SEC Section 31 Fee: $0.0000278 * sell value
        const secFee = grossAmount * 0.0000278;
        // FINRA TAF: $0.000166 per share, max $8.30
        const finraTaf = Math.min(8.30, quantity * 0.000166);
        sebiOrSecFee = secFee + finraTaf;
        notes.push(`SEC Section 31 & FINRA TAF fees: $${sebiOrSecFee.toFixed(3)}`);
      }
      break;
    }

    case 'UK': {
      // UK London Stock Exchange
      brokerage = Math.max(5, grossAmount * 0.0005); // 0.05% or £5 min
      if (side === 'BUY') {
        // SDRT (Stamp Duty Reserve Tax): 0.50% on all stock purchases
        sttOrStampDuty = grossAmount * 0.005;
        notes.push(`UK SDRT Stamp Duty (0.50%): £${sttOrStampDuty.toFixed(2)}`);
      }
      exchangeTurnover = grossAmount * 0.0001;
      break;
    }

    case 'EU': {
      // Euronext / XETRA
      brokerage = Math.max(4, grossAmount * 0.0005); // 0.05% or €4 min
      if (side === 'BUY') {
        // French/Italian Financial Transaction Tax (0.3% large cap standard)
        sttOrStampDuty = grossAmount * 0.003;
        notes.push(`European FTT (0.30%): €${sttOrStampDuty.toFixed(2)}`);
      }
      exchangeTurnover = grossAmount * 0.0001;
      break;
    }

    case 'CN': {
      // Greater China (SSE/SZSE)
      brokerage = Math.max(5, grossAmount * 0.00025); // 0.025% or ¥5 min
      if (side === 'SELL') {
        // Stamp Duty: 0.05% on sell
        sttOrStampDuty = grossAmount * 0.0005;
        notes.push(`China Stamp Duty (0.05% on Sell): ¥${sttOrStampDuty.toFixed(2)}`);
      }
      exchangeTurnover = grossAmount * 0.00001; // CSDC transfer fee 0.001%
      notes.push(`T+1 settlement rule applies (intraday sell locked)`);
      break;
    }

    case 'HK': {
      // Hong Kong HKEX
      brokerage = Math.max(15, grossAmount * 0.0005); // 0.05% or HK$15 min
      // Stamp Duty: 0.10% on both Buy and Sell
      sttOrStampDuty = grossAmount * 0.001;
      // SFC Transaction Levy (0.0027%) + HKEX Trading Fee (0.00565%)
      sebiOrSecFee = grossAmount * 0.000027;
      exchangeTurnover = grossAmount * 0.0000565;
      notes.push(`HKEX Stamp Duty (0.10%): HK$${sttOrStampDuty.toFixed(2)}`);
      break;
    }

    case 'JP': {
      // Tokyo Stock Exchange (TSE)
      brokerage = Math.max(200, grossAmount * 0.0005);
      exchangeTurnover = grossAmount * 0.00004;
      notes.push(`TSE exchange & clearing fees: ¥${exchangeTurnover.toFixed(0)}`);
      break;
    }
  }

  const totalFriction = brokerage + sttOrStampDuty + exchangeTurnover + sebiOrSecFee + gstOrVat + slippage;
  const effectiveRatePct = grossAmount > 0 ? (totalFriction / grossAmount) * 100 : 0;

  // On BUY: total cost is grossAmount + friction
  // On SELL: net received is grossAmount - friction
  const netAmount = side === 'BUY' ? grossAmount + totalFriction : Math.max(0, grossAmount - totalFriction);

  return {
    region,
    side,
    price,
    quantity,
    grossAmount: Number(grossAmount.toFixed(2)),
    brokerage: Number(brokerage.toFixed(2)),
    sttOrStampDuty: Number(sttOrStampDuty.toFixed(2)),
    exchangeTurnover: Number(exchangeTurnover.toFixed(2)),
    sebiOrSecFee: Number(sebiOrSecFee.toFixed(3)),
    gstOrVat: Number(gstOrVat.toFixed(2)),
    slippage: Number(slippage.toFixed(2)),
    totalFriction: Number(totalFriction.toFixed(2)),
    netAmount: Number(netAmount.toFixed(2)),
    effectiveRatePct: Number(effectiveRatePct.toFixed(3)),
    currencySymbol: currencyInfo.symbol,
    notes
  };
}
