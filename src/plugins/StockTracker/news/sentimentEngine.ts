import { GoogleGenAI } from '@google/genai';
import {
  StockNewsArticle,
  StockSentimentReport,
  HeadlineSentimentAnalysis,
  NewsCatalystType,
  SentimentConfluenceImpact
} from './types.js';

interface SentimentCacheEntry {
  timestamp: number;
  report: StockSentimentReport;
}

const SENTIMENT_CACHE = new Map<string, SentimentCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Lexicon for Financial Sentiment Fallback Engine
const BULLISH_LEXICON = [
  { word: 'record profit', weight: 0.9 },
  { word: 'beats estimates', weight: 0.85 },
  { word: 'beat estimates', weight: 0.85 },
  { word: 'surge', weight: 0.75 },
  { word: 'surges', weight: 0.75 },
  { word: 'soars', weight: 0.8 },
  { word: 'rally', weight: 0.7 },
  { word: 'rallies', weight: 0.7 },
  { word: 'upgrade', weight: 0.75 },
  { word: 'upgraded', weight: 0.75 },
  { word: 'buy rating', weight: 0.7 },
  { word: 'outperform', weight: 0.75 },
  { word: 'contract win', weight: 0.8 },
  { word: 'partnership', weight: 0.6 },
  { word: 'expansion', weight: 0.6 },
  { word: 'dividend hike', weight: 0.75 },
  { word: 'breakout', weight: 0.65 },
  { word: 'bullish', weight: 0.7 },
  { word: 'growth', weight: 0.5 },
  { word: 'gain', weight: 0.5 },
  { word: 'gains', weight: 0.5 },
  { word: 'higher', weight: 0.35 }
];

const BEARISH_LEXICON = [
  { word: 'fraud', weight: 1.0, isCircuitBreaker: true },
  { word: 'probe', weight: 0.85, isCircuitBreaker: true },
  { word: 'investigation', weight: 0.85, isCircuitBreaker: true },
  { word: 'lawsuit', weight: 0.75 },
  { word: 'accounting irregularity', weight: 1.0, isCircuitBreaker: true },
  { word: 'bankruptcy', weight: 1.0, isCircuitBreaker: true },
  { word: 'default', weight: 0.9, isCircuitBreaker: true },
  { word: 'downgrade', weight: 0.8 },
  { word: 'downgraded', weight: 0.8 },
  { word: 'misses estimates', weight: 0.85 },
  { word: 'missed estimates', weight: 0.85 },
  { word: 'plunges', weight: 0.85 },
  { word: 'plunge', weight: 0.85 },
  { word: 'slumps', weight: 0.8 },
  { word: 'slump', weight: 0.8 },
  { word: 'crash', weight: 0.9 },
  { word: 'crashes', weight: 0.9 },
  { word: 'loss widens', weight: 0.85 },
  { word: 'sell rating', weight: 0.75 },
  { word: 'penalty', weight: 0.75 },
  { word: 'fine', weight: 0.65 },
  { word: 'layoffs', weight: 0.6 },
  { word: 'warning', weight: 0.6 },
  { word: 'weak', weight: 0.5 },
  { word: 'drop', weight: 0.5 },
  { word: 'falls', weight: 0.5 },
  { word: 'fall', weight: 0.5 }
];

function detectCatalyst(text: string): NewsCatalystType {
  const t = text.toLowerCase();
  if (/(earnings|revenue|quarterly|q1|q2|q3|q4|profit|eps|dividend|guidance|ebitda)/i.test(t)) {
    return 'EARNINGS';
  }
  if (/(probe|investigation|lawsuit|regulat|sebi|sec|court|antitrust|penalty|fine|fraud|legal)/i.test(t)) {
    return 'REGULATORY_LEGAL';
  }
  if (/(merger|acquisition|buyout|takeover|acquires|stake|deal|bid)/i.test(t)) {
    return 'MERGERS_ACQUISITIONS';
  }
  if (/(ceo|cfo|executive|board|resigns|appointed|ousted|leadership)/i.test(t)) {
    return 'MANAGEMENT';
  }
  if (/(fed|rbi|inflation|interest rate|treasury|macro|tariff|central bank|cpi)/i.test(t)) {
    return 'MACRO_RATES';
  }
  if (/(launch|patent|ai|product|breakthrough|approval|fda|chip|tech)/i.test(t)) {
    return 'PRODUCT_INNOVATION';
  }
  return 'GENERAL';
}

/**
 * Autonomous Rule-Based Sentiment Analysis when Gemini AI is not available.
 */
function analyzeAutonomousFallback(symbol: string, cleanSymbol: string, articles: StockNewsArticle[]): StockSentimentReport {
  if (articles.length === 0) {
    return {
      symbol,
      cleanSymbol,
      score: 0.0,
      verdict: 'NEUTRAL',
      confidence: 0.5,
      catalystSummary: `No recent news articles detected for ${cleanSymbol}. Market sentiment is currently assumed neutral.`,
      primaryCatalyst: 'GENERAL',
      circuitBreakerRecommended: false,
      analyzedBy: 'AUTONOMOUS_RULE_ENGINE',
      analyzedAt: new Date().toISOString(),
      articleCount: 0,
      headlines: []
    };
  }

  let totalScore = 0;
  let circuitBreakerTriggered = false;
  let circuitBreakerReason: string | undefined;
  const catalystCounts: Record<NewsCatalystType, number> = {
    EARNINGS: 0,
    REGULATORY_LEGAL: 0,
    MERGERS_ACQUISITIONS: 0,
    MANAGEMENT: 0,
    MACRO_RATES: 0,
    PRODUCT_INNOVATION: 0,
    GENERAL: 0
  };

  const headlines: HeadlineSentimentAnalysis[] = [];

  for (const art of articles.slice(0, 10)) {
    const text = `${art.title} ${art.summary}`.toLowerCase();
    const catalyst = detectCatalyst(text);
    catalystCounts[catalyst] = (catalystCounts[catalyst] || 0) + 1;

    let itemScore = 0;
    const foundKeywords: string[] = [];

    for (const b of BULLISH_LEXICON) {
      if (text.includes(b.word)) {
        itemScore += b.weight;
        foundKeywords.push(b.word);
      }
    }

    for (const b of BEARISH_LEXICON) {
      if (text.includes(b.word)) {
        itemScore -= b.weight;
        foundKeywords.push(b.word);
        if (b.isCircuitBreaker) {
          circuitBreakerTriggered = true;
          circuitBreakerReason = `High-risk regulatory/legal headline detected: "${art.title}" (${b.word})`;
        }
      }
    }

    // Clamp item score to [-1, 1]
    itemScore = Math.max(-1.0, Math.min(1.0, itemScore));
    totalScore += itemScore;

    const verdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
      itemScore >= 0.25 ? 'BULLISH' : itemScore <= -0.25 ? 'BEARISH' : 'NEUTRAL';

    headlines.push({
      title: art.title,
      score: Math.round(itemScore * 100) / 100,
      verdict,
      catalyst,
      keyPhrases: foundKeywords.slice(0, 3)
    });
  }

  const avgScore = articles.length > 0 ? totalScore / Math.min(articles.length, 10) : 0;
  const normalizedScore = Math.max(-1.0, Math.min(1.0, Math.round(avgScore * 100) / 100));

  let verdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (normalizedScore >= 0.2) verdict = 'BULLISH';
  else if (normalizedScore <= -0.2) verdict = 'BEARISH';

  // Determine primary catalyst
  let primaryCatalyst: NewsCatalystType = 'GENERAL';
  let maxCatCount = 0;
  for (const [cat, cnt] of Object.entries(catalystCounts)) {
    if (cnt > maxCatCount && cat !== 'GENERAL') {
      maxCatCount = cnt;
      primaryCatalyst = cat as NewsCatalystType;
    }
  }

  // Generate executive catalyst summary
  let summary = `Analyzed ${headlines.length} news items. Overall sentiment is ${verdict.toLowerCase()} (${normalizedScore > 0 ? '+' : ''}${normalizedScore}).`;
  if (primaryCatalyst !== 'GENERAL') {
    summary += ` Major thematic catalyst is ${primaryCatalyst.replace('_', ' ')}.`;
  }
  if (circuitBreakerTriggered) {
    summary += ` ⚠️ EMERGENCY CAUTION: Critical downside risk catalyst flagged.`;
  }

  return {
    symbol,
    cleanSymbol,
    score: normalizedScore,
    verdict,
    confidence: Math.min(0.95, 0.5 + Math.abs(normalizedScore) * 0.4),
    catalystSummary: summary,
    primaryCatalyst,
    circuitBreakerRecommended: circuitBreakerTriggered,
    circuitBreakerReason,
    analyzedBy: 'AUTONOMOUS_RULE_ENGINE',
    analyzedAt: new Date().toISOString(),
    articleCount: articles.length,
    headlines
  };
}

/**
 * Analyzes stock sentiment via Google Gemini AI (@google/genai) with autonomous fallback.
 */
export async function analyzeStockSentiment(params: {
  symbol: string;
  cleanSymbol?: string;
  articles: StockNewsArticle[];
}): Promise<StockSentimentReport> {
  const { symbol, cleanSymbol = symbol.replace(/\.(NS|BO|L|DE|PA|AS|HK|SS|SZ|T)$/i, ''), articles } = params;
  const cacheKey = symbol.toUpperCase();

  // Check cache
  const cached = SENTIMENT_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.report;
  }

  // If no articles found, return neutral fallback
  if (articles.length === 0) {
    const fallback = analyzeAutonomousFallback(symbol, cleanSymbol, []);
    SENTIMENT_CACHE.set(cacheKey, { timestamp: now, report: fallback });
    return fallback;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const headlineSummaries = articles.slice(0, 7).map((a, i) =>
        `${i + 1}. Title: "${a.title}" | Publisher: ${a.publisher} | Summary: "${a.summary.slice(0, 150)}"`
      ).join('\n');

      const prompt = `You are an elite quantitative financial analyst and news sentiment engine for SutharLabs.
Analyze the following recent news headlines for stock ticker "${cleanSymbol}" (${symbol}):

${headlineSummaries}

Analyze the qualitative catalysts and financial polarity. Respond ONLY with a valid JSON object matching this exact schema:
{
  "score": number between -1.0 (most bearish) and 1.0 (most bullish),
  "verdict": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": number between 0.0 and 1.0,
  "primaryCatalyst": "EARNINGS" | "REGULATORY_LEGAL" | "MERGERS_ACQUISITIONS" | "MANAGEMENT" | "MACRO_RATES" | "PRODUCT_INNOVATION" | "GENERAL",
  "catalystSummary": "1 to 2 concise sentences summarizing the key catalyst and market drivers",
  "circuitBreakerRecommended": boolean (true if severe legal probe, fraud, bankruptcy, or critical sudden risk is detected),
  "circuitBreakerReason": "reason string or empty if false",
  "headlines": [
    {
      "title": "exact title",
      "score": number between -1.0 and 1.0,
      "verdict": "BULLISH" | "BEARISH" | "NEUTRAL",
      "catalyst": "EARNINGS" | "REGULATORY_LEGAL" | "MERGERS_ACQUISITIONS" | "MANAGEMENT" | "MACRO_RATES" | "PRODUCT_INNOVATION" | "GENERAL"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const responseText = response.text || '';
      const cleanJsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (cleanJsonMatch) {
        const parsed = JSON.parse(cleanJsonMatch[0]);

        const report: StockSentimentReport = {
          symbol,
          cleanSymbol,
          score: Math.max(-1.0, Math.min(1.0, Number(parsed.score) || 0.0)),
          verdict: ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(parsed.verdict) ? parsed.verdict : 'NEUTRAL',
          confidence: Math.max(0.1, Math.min(1.0, Number(parsed.confidence) || 0.8)),
          catalystSummary: parsed.catalystSummary || `AI sentiment evaluation for ${cleanSymbol}.`,
          primaryCatalyst: parsed.primaryCatalyst || 'GENERAL',
          circuitBreakerRecommended: Boolean(parsed.circuitBreakerRecommended),
          circuitBreakerReason: parsed.circuitBreakerReason || undefined,
          analyzedBy: 'GEMINI_AI',
          analyzedAt: new Date().toISOString(),
          articleCount: articles.length,
          headlines: Array.isArray(parsed.headlines)
            ? parsed.headlines.map((h: any) => ({
                title: h.title || '',
                score: Number(h.score) || 0.0,
                verdict: h.verdict || 'NEUTRAL',
                catalyst: h.catalyst || 'GENERAL',
                keyPhrases: []
              }))
            : []
        };

        SENTIMENT_CACHE.set(cacheKey, { timestamp: now, report });
        return report;
      }
    } catch (err) {
      console.warn(`[Sentiment Engine] Gemini AI analysis failed, falling back to autonomous engine:`, err);
    }
  }

  // Fallback to autonomous rule engine
  const report = analyzeAutonomousFallback(symbol, cleanSymbol, articles);
  SENTIMENT_CACHE.set(cacheKey, { timestamp: now, report });
  return report;
}

/**
 * Calculates confluence impact between algorithmic strategy signal and news sentiment.
 */
export function calculateSentimentConfluence(
  strategyAction: 'BUY' | 'SELL' | 'HOLD',
  strategyConfidence: number,
  sentiment?: StockSentimentReport
): SentimentConfluenceImpact {
  if (!sentiment) {
    return {
      originalSignal: strategyAction,
      originalConfidence: strategyConfidence,
      finalSignal: strategyAction,
      finalConfidence: strategyConfidence,
      sentimentScore: 0.0,
      sentimentVerdict: 'NEUTRAL',
      confluenceEffect: 'NEUTRAL',
      explanation: 'No news sentiment data available; relying purely on quantitative technical indicators.'
    };
  }

  const { score, verdict, circuitBreakerRecommended, circuitBreakerReason } = sentiment;

  // 1. Emergency Circuit Breaker check
  if (circuitBreakerRecommended && strategyAction === 'BUY') {
    return {
      originalSignal: strategyAction,
      originalConfidence: strategyConfidence,
      finalSignal: 'HOLD',
      finalConfidence: 0.85,
      sentimentScore: score,
      sentimentVerdict: verdict,
      confluenceEffect: 'CIRCUIT_BREAKER',
      explanation: `⚠️ AI Circuit Breaker Activated: Technical BUY signal overridden to HOLD due to high-risk news event (${circuitBreakerReason || 'Severe downside catalyst'}).`
    };
  }

  // 2. Strong Positive Confluence (BUY + Bullish Sentiment)
  if (strategyAction === 'BUY' && score >= 0.3) {
    const boost = Math.min(0.2, score * 0.25);
    const finalConfidence = Math.min(0.99, strategyConfidence + boost);
    return {
      originalSignal: strategyAction,
      originalConfidence: strategyConfidence,
      finalSignal: 'BUY',
      finalConfidence: Math.round(finalConfidence * 100) / 100,
      sentimentScore: score,
      sentimentVerdict: verdict,
      confluenceEffect: 'BOOST',
      explanation: `Positive Confluence: Technical momentum aligned with strong bullish news sentiment (${sentiment.catalystSummary}).`
    };
  }

  // 3. Positive Confluence on Short/Exit (SELL + Bearish Sentiment)
  if (strategyAction === 'SELL' && score <= -0.3) {
    const boost = Math.min(0.2, Math.abs(score) * 0.25);
    const finalConfidence = Math.min(0.99, strategyConfidence + boost);
    return {
      originalSignal: strategyAction,
      originalConfidence: strategyConfidence,
      finalSignal: 'SELL',
      finalConfidence: Math.round(finalConfidence * 100) / 100,
      sentimentScore: score,
      sentimentVerdict: verdict,
      confluenceEffect: 'BOOST',
      explanation: `Negative Confluence: Technical breakdown confirmed by bearish news headwinds (${sentiment.catalystSummary}).`
    };
  }

  // 4. Headwind / Divergence (BUY with Bearish Sentiment)
  if (strategyAction === 'BUY' && score <= -0.35) {
    const penalty = Math.abs(score) * 0.35;
    const finalConfidence = Math.max(0.3, strategyConfidence - penalty);
    // If sentiment is strongly negative, convert to cautious HOLD
    const finalSignal = score <= -0.6 ? 'HOLD' : 'BUY';
    return {
      originalSignal: strategyAction,
      originalConfidence: strategyConfidence,
      finalSignal,
      finalConfidence: Math.round(finalConfidence * 100) / 100,
      sentimentScore: score,
      sentimentVerdict: verdict,
      confluenceEffect: 'PENALTY',
      explanation: finalSignal === 'HOLD'
        ? `Cautious Hold: Technical BUY signal neutralized to HOLD due to conflicting adverse news catalysts (${sentiment.catalystSummary}).`
        : `Divergence Warning: Technical BUY signal weakened by negative news sentiment headwinds.`
    };
  }

  // 5. Default Neutral Confluence
  return {
    originalSignal: strategyAction,
    originalConfidence: strategyConfidence,
    finalSignal: strategyAction,
    finalConfidence: strategyConfidence,
    sentimentScore: score,
    sentimentVerdict: verdict,
    confluenceEffect: 'NEUTRAL',
    explanation: 'News sentiment is moderate or neutral; technical algorithmic rule evaluation prevails.'
  };
}
