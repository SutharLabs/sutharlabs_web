import crypto from 'crypto';
import { StockNewsArticle } from './types.js';

interface CacheEntry {
  timestamp: number;
  articles: StockNewsArticle[];
}

const NEWS_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function stripHtmlTags(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Robustly sanitizes raw RSS text by resolving entities, CDATA blocks, and HTML tags.
 */
function cleanRssText(raw: string): string {
  if (!raw) return '';
  // 1. Unpack CDATA wrappers if present
  let text = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  // 2. Decode HTML entities (so &lt;a href...&gt; becomes <a href...>)
  text = decodeHtmlEntities(text);
  // 3. Strip any HTML markup
  text = stripHtmlTags(text);
  // 4. Decode any remaining entities and collapse extra spaces
  return decodeHtmlEntities(text).replace(/\s+/g, ' ').trim();
}

/**
 * Parses Google News RSS XML string without heavy external XML libraries.
 */
function parseGoogleNewsRss(xmlText: string): StockNewsArticle[] {
  const articles: StockNewsArticle[] = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);

    let rawTitle = titleMatch ? titleMatch[1] : '';
    let publisher = sourceMatch ? cleanRssText(sourceMatch[1]) : '';

    // First sanitize raw title text
    let cleanTitle = cleanRssText(rawTitle);

    // Google News titles format as: "Headline Text - Publisher Name"
    if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ');
      const candidatePub = parts.pop()?.trim();
      if (!publisher && candidatePub) {
        publisher = candidatePub;
      }
      cleanTitle = parts.join(' - ').trim();
    }

    const url = linkMatch ? linkMatch[1].trim() : '';
    const rawDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    let publishedAt = new Date().toISOString();
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
      }
    }

    // Google News RSS description often embeds raw <a href="...">Headline</a> with font tags.
    // Clean it completely to prevent showing raw link markup to users.
    const rawDesc = descMatch ? descMatch[1] : '';
    let cleanSummary = cleanRssText(rawDesc);

    // If description is identical to title, or only contains title and publisher, provide a clean context note
    if (!cleanSummary || cleanSummary === cleanTitle || cleanSummary.startsWith(cleanTitle)) {
      cleanSummary = `Financial report published by ${publisher || 'Verified Financial Media'}. Click headline to verify full source coverage.`;
    } else if (cleanSummary.length > 280) {
      cleanSummary = cleanSummary.slice(0, 277) + '...';
    }

    if (cleanTitle && url) {
      const id = `gn-${crypto.createHash('md5').update(url + cleanTitle).digest('hex').slice(0, 12)}`;
      articles.push({
        id,
        title: cleanTitle,
        summary: cleanSummary,
        publisher: publisher || 'Financial News',
        url,
        publishedAt,
        source: 'GOOGLE_NEWS'
      });
    }
  }

  return articles;
}

/**
 * Fetches news from Yahoo Finance Search API
 */
async function fetchYahooNews(query: string): Promise<StockNewsArticle[]> {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=1&newsCount=10`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) return [];
    const data: any = await res.json();
    const rawNews = data?.news || [];

    const articles: StockNewsArticle[] = [];
    for (const item of rawNews) {
      if (!item.title || !item.link) continue;

      let publishedAt = new Date().toISOString();
      if (item.providerPublishTime) {
        publishedAt = new Date(item.providerPublishTime * 1000).toISOString();
      }

      let thumbUrl: string | undefined;
      if (item.thumbnail?.resolutions && item.thumbnail.resolutions.length > 0) {
        thumbUrl = item.thumbnail.resolutions[0].url;
      }

      const cleanTitle = cleanRssText(item.title);
      const cleanSummary = item.summary ? cleanRssText(item.summary) : cleanTitle;

      articles.push({
        id: item.uuid || `yf-${crypto.createHash('md5').update(item.link).digest('hex').slice(0, 12)}`,
        title: cleanTitle,
        summary: cleanSummary,
        publisher: item.publisher || 'Yahoo Finance',
        url: item.link,
        publishedAt,
        source: 'YAHOO_FINANCE',
        thumbnailUrl: thumbUrl
      });
    }

    return articles;
  } catch (err) {
    console.warn(`[News Fetcher] Yahoo news fetch failed for ${query}:`, err);
    return [];
  }
}

/**
 * Fetches news from Google News RSS Search with regional locale parameters
 */
async function fetchGoogleNews(searchTerm: string, market: string = 'GLOBAL'): Promise<StockNewsArticle[]> {
  try {
    let hl = 'en-US';
    let gl = 'US';
    let ceid = 'US:en';

    if (market === 'IN' || searchTerm.endsWith('.NS') || searchTerm.endsWith('.BO')) {
      hl = 'en-IN';
      gl = 'IN';
      ceid = 'IN:en';
    } else if (market === 'UK' || searchTerm.endsWith('.L')) {
      hl = 'en-GB';
      gl = 'GB';
      ceid = 'GB:en';
    }

    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchTerm)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) return [];
    const xmlText = await res.text();
    return parseGoogleNewsRss(xmlText);
  } catch (err) {
    console.warn(`[News Fetcher] Google News fetch failed for ${searchTerm}:`, err);
    return [];
  }
}

/**
 * Builds regional high-trust news search queries targeting institutional outlets:
 * - India: Moneycontrol, The Economic Times, Livemint, Business Standard, SEBI, NDTV Profit
 * - US: MarketWatch, CNBC, Bloomberg, Reuters, SEC Edgar
 * - UK / Europe: Reuters, Financial Times, London Stock Exchange, FCA
 */
function buildRegionalQueries(params: {
  clean: string;
  companyName?: string;
  market: string;
  symbol: string;
}): string[] {
  const { clean, companyName, market, symbol } = params;
  const queries: string[] = [];
  const subject = companyName ? `"${companyName}"` : clean;

  if (market === 'IN' || symbol.endsWith('.NS') || symbol.endsWith('.BO')) {
    // 1. India Top Tier Financial Outlets
    queries.push(`${subject} (site:moneycontrol.com OR site:economictimes.indiatimes.com OR site:livemint.com OR site:business-standard.com OR site:ndtvprofit.com)`);
    // 2. Regulatory & Corporate Governance (SEBI / Stock Exchange / Insider / Results)
    queries.push(`${clean} (SEBI OR site:sebi.gov.in OR "quarterly results" OR "board meeting" OR "block deal")`);
    // 3. Broader Indian Market Query
    queries.push(`${clean} share price NSE`);
  } else if (market === 'US' || !symbol.includes('.')) {
    // 1. US Top Tier Financial Outlets
    queries.push(`${subject} (site:marketwatch.com OR site:cnbc.com OR site:reuters.com OR site:bloomberg.com)`);
    // 2. US Regulatory & Filings (SEC / 10-K / 10-Q / Earnings)
    queries.push(`${clean} (SEC OR site:sec.gov OR "quarterly results" OR "earnings beat" OR "guidance")`);
    // 3. Broader US Query
    queries.push(`${clean} stock news`);
  } else if (market === 'UK' || symbol.endsWith('.L')) {
    // 1. UK Top Tier Outlets
    queries.push(`${subject} (site:reuters.com OR site:ft.com OR site:londonstockexchange.com)`);
    queries.push(`${clean} (FCA OR "London Stock Exchange" OR "regulatory news service")`);
  } else {
    // Global fallback
    queries.push(`${subject} financial stock news`);
  }

  return queries;
}

/**
 * Aggregates and deduplicates real-time news for a ticker across global sources.
 */
export async function fetchStockNews(params: {
  symbol: string;
  cleanSymbol?: string;
  companyName?: string;
  market?: string;
}): Promise<StockNewsArticle[]> {
  const { symbol, cleanSymbol, companyName, market = 'GLOBAL' } = params;
  const clean = (cleanSymbol || symbol.replace(/\.(NS|BO|L|DE|PA|AS|HK|SS|SZ|T)$/i, '')).trim();
  const cacheKey = `${symbol.toUpperCase()}-${market.toUpperCase()}`;

  // Check cache
  const cached = NEWS_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.articles;
  }

  const queries = buildRegionalQueries({ clean, companyName, market, symbol });

  // Fetch concurrently from Yahoo & regional Google News feeds
  const fetchPromises: Promise<StockNewsArticle[]>[] = [
    fetchYahooNews(symbol),
    fetchGoogleNews(queries[0], market)
  ];

  // If a secondary regulatory/governance query exists, fetch it concurrently as well
  if (queries[1]) {
    fetchPromises.push(fetchGoogleNews(queries[1], market));
  }

  const results = await Promise.all(fetchPromises);

  // Combine and deduplicate by clean title and link
  const combined: StockNewsArticle[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  const addArticle = (art: StockNewsArticle) => {
    // Strip query tracking parameters from URL
    const normUrl = art.url.split('?')[0].toLowerCase();
    const normTitle = art.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (seenUrls.has(normUrl) || seenTitles.has(normTitle)) return;
    seenUrls.add(normUrl);
    seenTitles.add(normTitle);
    combined.push(art);
  };

  // 1. Add regional targeted articles (Economic Times, Moneycontrol, Livemint, SEBI, MarketWatch, etc.)
  if (results[1]) {
    for (const art of results[1]) addArticle(art);
  }
  // 2. Add regulatory filings & governance articles
  if (results[2]) {
    for (const art of results[2]) addArticle(art);
  }
  // 3. Add Yahoo Finance ticker feed
  if (results[0]) {
    for (const art of results[0]) addArticle(art);
  }

  // If still fewer than 5 stories and we have a 3rd fallback query, fetch more
  if (combined.length < 5 && queries[2]) {
    const extraGoogle = await fetchGoogleNews(queries[2], market);
    for (const art of extraGoogle) addArticle(art);
  }

  // Sort by publishedAt descending (newest first)
  combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Store in cache
  NEWS_CACHE.set(cacheKey, {
    timestamp: now,
    articles: combined
  });

  return combined;
}
