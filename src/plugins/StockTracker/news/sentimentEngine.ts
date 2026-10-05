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

// Lexicon for Financial Sentiment Fallback Engine (Loughran-McDonald Domain Methodology)
const BULLISH_LEXICON = [
  { word: 'record profit', weight: 0.9 },
  { word: 'beats estimates', weight: 0.85 },
  { word: 'beat estimates', weight: 0.85 },
  { word: 'strong guidance', weight: 0.85 },
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
  { word: 'order win', weight: 0.8 },
  { word: 'promoter buying', weight: 0.75 },
  { word: 'target raised', weight: 0.75 },
  { word: 'fii buying', weight: 0.7 },
  { word: 'partnership', weight: 0.6 },
  { word: 'expansion', weight: 0.6 },
  { word: 'dividend hike', weight: 0.75 },
  { word: 'patent granted', weight: 0.75 },
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
  { word: 'sebi notice', weight: 0.9, isCircuitBreaker: true },
  { word: 'show cause notice', weight: 0.85, isCircuitBreaker: true },
  { word: 'sec charges', weight: 1.0, isCircuitBreaker: true },
  { word: 'accounting irregularity', weight: 1.0, isCircuitBreaker: true },
  { word: 'bankruptcy', weight: 1.0, isCircuitBreaker: true },
  { word: 'default', weight: 0.9, isCircuitBreaker: true },
  { word: 'tax evasion', weight: 0.9, isCircuitBreaker: true },
  { word: 'insider trading', weight: 0.9, isCircuitBreaker: true },
  { word: 'lawsuit', weight: 0.75 },
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
  if (/(probe|investigation|lawsuit|regulat|sebi|sec|court|antitrust|penalty|fine|fraud|legal|show cause|enforcement)/i.test(t)) {
    return 'REGULATORY_LEGAL';
  }
  if (/(merger|acquisition|buyout|takeover|acquires|stake|deal|bid|qip|block deal)/i.test(t)) {
    return 'MERGERS_ACQUISITIONS';
  }
  if (/(ceo|cfo|executive|board|resigns|appointed|ousted|leadership|promoter)/i.test(t)) {
    return 'MANAGEMENT';
  }
  if (/(fed|rbi|inflation|interest rate|treasury|macro|tariff|central bank|cpi|monetary)/i.test(t)) {
    return 'MACRO_RATES';
  }
  if (/(launch|patent|ai|product|breakthrough|approval|fda|chip|tech|expansion)/i.test(t)) {
    return 'PRODUCT_INNOVATION';
  }
  return 'GENERAL';
}

/**
 * Autonomous Rule-Based Financial Sentiment Analysis.
 * Runs 100% in Node.js CPU in <1ms without any external network calls or LLM token costs.
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
      keyPhrases: foundKeywords.slice(0, 3),
      url: art.url,
      publisher: art.publisher
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
 * Validates a user-supplied Google Gemini API Key with an ultra-lightweight ping.
 */
export async function testGeminiApiKey(apiKey: string): Promise<{
  success: boolean;
  model: string;
  latencyMs: number;
  message?: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    const key = (apiKey || '').trim();
    if (!key) {
      return { success: false, model: 'gemini-2.5-flash', latencyMs: 0, error: 'API key is required' };
    }
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping test for SutharLabs. Respond with one word: READY'
    });
    const latencyMs = Date.now() - start;
    const reply = (response.text || '').trim();
    return {
      success: true,
      model: 'gemini-2.5-flash',
      latencyMs,
      message: `Gemini 2.5 Flash connected successfully in ${latencyMs}ms (${reply})`
    };
  } catch (err: any) {
    return {
      success: false,
      model: 'gemini-2.5-flash',
      latencyMs: Date.now() - start,
      error: err.message || 'Gemini API authentication failed'
    };
  }
}

/**
 * Analyzes stock sentiment via Google Gemini AI (@google/genai) with autonomous fallback.
 */
export async function analyzeStockSentiment(params: {
  symbol: string;
  cleanSymbol?: string;
  articles: StockNewsArticle[];
  apiKey?: string;
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

  // Check supplied key, then process.env
  const apiKey = (params.apiKey && params.apiKey.trim()) || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

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

        const mappedHeadlines: HeadlineSentimentAnalysis[] = Array.isArray(parsed.headlines)
          ? parsed.headlines.map((h: any, idx: number) => {
              // Match headline to corresponding article to preserve direct link & publisher
              const rawH = String(h.title || '').toLowerCase();
              const matchedArticle =
                articles.find(a => a.title.toLowerCase().includes(rawH.slice(0, 25)) || rawH.includes(a.title.slice(0, 25).toLowerCase())) ||
                articles[idx];

              return {
                title: h.title || matchedArticle?.title || '',
                score: Number(h.score) || 0.0,
                verdict: ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(h.verdict) ? h.verdict : 'NEUTRAL',
                catalyst: h.catalyst || 'GENERAL',
                keyPhrases: [],
                url: matchedArticle?.url,
                publisher: matchedArticle?.publisher
              };
            })
          : [];

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
          headlines: mappedHeadlines
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

  // 1. Emergency Circuit Breaker Trigger
  if (sentiment.circuitBreakerRecommended) {
    return {
      originalSignal: strategyAction,
      originalConfidence: strategyConfidence,
      finalSignal: 'HOLD',
      finalConfidence: 0.2,
      sentimentScore: sentiment.score,
      sentimentVerdict: sentiment.verdict,
      confluenceEffect: 'CIRCUIT_BREAKER',
      explanation: `🚨 EMERGENCY CIRCUIT BREAKER: ${sentiment.circuitBreakerReason || 'Severe headline risk detected'}. Automatic BUY execution aborted to protect capital.`
    };
  }

  // 2. High Bullish Confluence (Both Technical Algorithm & News Sentiment are Positive)
  if (strategyAction === 'BUY' && sentiment.verdict === 'BULLISH' && sentiment.score >= 0.3) {
    const boost = Math.min(0.20, sentiment.score * 0.25);
    const boostedConfidence = Math.min(0.99, strategyConfidence + boost);
    return {
      originalSignal: 'BUY',
      originalConfidence: strategyConfidence,
      finalSignal: 'BUY',
      finalConfidence: Math.round(boostedConfidence * 100) / 100,
      sentimentScore: sentiment.score,
      sentimentVerdict: 'BULLISH',
      confluenceEffect: 'BOOST',
      explanation: `🚀 AI CONFLUENCE BOOST: Technical buy signal reinforced by bullish ${sentiment.primaryCatalyst.replace('_', ' ')} news catalysts (+${Math.round(boost * 100)}% confidence).`
    };
  }

  // 3. Adverse Sentiment Penalty (Technical Algorithm says BUY, but News is Bearish)
  if (strategyAction === 'BUY' && sentiment.verdict === 'BEARISH' && sentiment.score <= -0.35) {
    const penalty = Math.abs(sentiment.score) * 0.4;
    const penalizedConfidence = Math.max(0.1, strategyConfidence - penalty);
    const finalSignal = penalizedConfidence < 0.45 ? 'HOLD' : 'BUY';
    return {
      originalSignal: 'BUY',
      originalConfidence: strategyConfidence,
      finalSignal,
      finalConfidence: Math.round(penalizedConfidence * 100) / 100,
      sentimentScore: sentiment.score,
      sentimentVerdict: 'BEARISH',
      confluenceEffect: 'PENALTY',
      explanation: `⚠️ SENTIMENT ADVISORY PENALTY: Adverse ${sentiment.primaryCatalyst.replace('_', ' ')} headlines conflict with technical buy signal. Confidence reduced.`
    };
  }

  // 4. Short / Sell Confluence Boost
  if (strategyAction === 'SELL' && sentiment.verdict === 'BEARISH' && sentiment.score <= -0.3) {
    const boost = Math.min(0.20, Math.abs(sentiment.score) * 0.25);
    const boostedConfidence = Math.min(0.99, strategyConfidence + boost);
    return {
      originalSignal: 'SELL',
      originalConfidence: strategyConfidence,
      finalSignal: 'SELL',
      finalConfidence: Math.round(boostedConfidence * 100) / 100,
      sentimentScore: sentiment.score,
      sentimentVerdict: 'BEARISH',
      confluenceEffect: 'BOOST',
      explanation: `📉 SHORT CONFLUENCE BOOST: Technical sell signal reinforced by bearish headline flow.`
    };
  }

  // Neutral or aligned without strong amplification
  return {
    originalSignal: strategyAction,
    originalConfidence: strategyConfidence,
    finalSignal: strategyAction,
    finalConfidence: strategyConfidence,
    sentimentScore: sentiment.score,
    sentimentVerdict: sentiment.verdict,
    confluenceEffect: 'NEUTRAL',
    explanation: `Neutral alignment: News sentiment (${sentiment.verdict}) is consistent with normal market fluctuations.`
  };
}
