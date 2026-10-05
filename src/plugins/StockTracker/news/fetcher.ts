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
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function stripHtmlTags(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
    let publisher = sourceMatch ? sourceMatch[1].trim() : '';

    // Google news titles often end with " - Publisher Name"
    if (!publisher && rawTitle.includes(' - ')) {
      const parts = rawTitle.split(' - ');
      publisher = parts.pop() || '';
      rawTitle = parts.join(' - ');
    }

    const title = decodeHtmlEntities(stripHtmlTags(rawTitle));
    const url = linkMatch ? linkMatch[1].trim() : '';
    const rawDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    let publishedAt = new Date().toISOString();
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
      }
    }

    const summary = descMatch ? decodeHtmlEntities(stripHtmlTags(descMatch[1])) : '';

    if (title && url) {
      const id = `gn-${crypto.createHash('md5').update(url + title).digest('hex').slice(0, 12)}`;
      articles.push({
        id,
        title,
        summary: summary && summary !== title ? summary.slice(0, 300) : `${title} - Published by ${publisher || 'Financial Media'}`,
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

      articles.push({
        id: item.uuid || `yf-${crypto.createHash('md5').update(item.link).digest('hex').slice(0, 12)}`,
        title: decodeHtmlEntities(item.title),
        summary: item.summary ? decodeHtmlEntities(item.summary) : item.title,
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
 * Fetches news from Google News RSS Search
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

  // Determine optimal search terms
  const searchQueries: string[] = [];
  if (companyName) {
    searchQueries.push(`${companyName} share`);
  }
  searchQueries.push(`${clean} stock news`);
  if (market === 'IN' || symbol.endsWith('.NS')) {
    searchQueries.push(`${clean} share price NSE`);
  }

  // Fetch concurrently from Yahoo & Google News
  const [yahooArticles, googleArticles] = await Promise.all([
    fetchYahooNews(symbol),
    fetchGoogleNews(searchQueries[0], market)
  ]);

  // Combine and deduplicate by clean title and link
  const combined: StockNewsArticle[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  const addArticle = (art: StockNewsArticle) => {
    const normUrl = art.url.split('?')[0].toLowerCase();
    const normTitle = art.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (seenUrls.has(normUrl) || seenTitles.has(normTitle)) return;
    seenUrls.add(normUrl);
    seenTitles.add(normTitle);
    combined.push(art);
  };

  // Prioritize Yahoo Finance direct articles, then Google News
  for (const art of yahooArticles) addArticle(art);
  for (const art of googleArticles) addArticle(art);

  // If still fewer than 5 articles and we have a second query, try fetching more
  if (combined.length < 5 && searchQueries[1]) {
    const extraGoogle = await fetchGoogleNews(searchQueries[1], market);
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
