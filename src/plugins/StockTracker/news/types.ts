export type NewsCatalystType =
  | 'EARNINGS'
  | 'REGULATORY_LEGAL'
  | 'MERGERS_ACQUISITIONS'
  | 'MANAGEMENT'
  | 'MACRO_RATES'
  | 'PRODUCT_INNOVATION'
  | 'GENERAL';

export interface StockNewsArticle {
  id: string;
  title: string;
  summary: string;
  publisher: string;
  url: string;
  publishedAt: string; // ISO 8601 string
  source: 'YAHOO_FINANCE' | 'GOOGLE_NEWS';
  thumbnailUrl?: string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  catalyst?: NewsCatalystType;
}

export interface HeadlineSentimentAnalysis {
  title: string;
  score: number; // -1.0 to 1.0
  verdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  catalyst: NewsCatalystType;
  keyPhrases: string[];
  url?: string;
  publisher?: string;
}

export interface StockSentimentReport {
  symbol: string;
  cleanSymbol: string;
  score: number; // -1.0 to 1.0
  verdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number; // 0.0 to 1.0
  catalystSummary: string;
  primaryCatalyst: NewsCatalystType;
  circuitBreakerRecommended: boolean;
  circuitBreakerReason?: string;
  analyzedBy: 'GEMINI_AI' | 'AUTONOMOUS_RULE_ENGINE';
  analyzedAt: string;
  articleCount: number;
  headlines: HeadlineSentimentAnalysis[];
}

export interface SentimentConfluenceImpact {
  originalSignal: 'BUY' | 'SELL' | 'HOLD';
  originalConfidence: number;
  finalSignal: 'BUY' | 'SELL' | 'HOLD';
  finalConfidence: number;
  sentimentScore: number;
  sentimentVerdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confluenceEffect: 'BOOST' | 'PENALTY' | 'CIRCUIT_BREAKER' | 'NEUTRAL';
  explanation: string;
}
