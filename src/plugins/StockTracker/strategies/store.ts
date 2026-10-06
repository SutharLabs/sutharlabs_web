import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStrategy, StrategyReview, VerifiedBacktestBadge } from './types.js';
import { PRESET_STRATEGIES } from './presets.js';

const STRATEGIES_DATA_PATH = path.join(process.cwd(), 'data', 'strategies.json');

function ensureDataDirectory() {
  const dir = path.dirname(STRATEGIES_DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadStrategiesFromDisk(): IStrategy[] {
  ensureDataDirectory();
  try {
    if (fs.existsSync(STRATEGIES_DATA_PATH)) {
      const content = fs.readFileSync(STRATEGIES_DATA_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge preset definitions while keeping custom strategies
        const customOnly = parsed.filter((s: IStrategy) => !s.isPreset);
        return [...PRESET_STRATEGIES, ...customOnly];
      }
    }
  } catch (err) {
    console.error('[Strategies DB] Error reading strategies.json:', err);
  }

  // Initialize with preset defaults
  saveStrategiesToDisk(PRESET_STRATEGIES);
  return PRESET_STRATEGIES;
}

export function saveStrategiesToDisk(strategies: IStrategy[]): void {
  ensureDataDirectory();
  try {
    fs.writeFileSync(STRATEGIES_DATA_PATH, JSON.stringify(strategies, null, 2), 'utf8');
  } catch (err) {
    console.error('[Strategies DB] Error saving strategies.json:', err);
  }
}

export function getStrategyById(id: string): IStrategy | undefined {
  const all = loadStrategiesFromDisk();
  return all.find(s => s.id === id);
}

export function createStrategy(params: {
  name: string;
  description: string;
  authorEmail?: string;
  authorName?: string;
  market?: 'IN' | 'US' | 'BOTH' | 'GLOBAL';
  timeframe?: '5m' | '15m' | '1h' | '1D';
  parameters?: any[];
  rules?: any;
  tags?: string[];
  isPublic?: boolean;
}): IStrategy {
  const all = loadStrategiesFromDisk();
  const id = `strat-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  
  const newStrategy: IStrategy = {
    id,
    name: params.name.trim(),
    description: params.description?.trim() || 'Custom user-defined trading algorithm',
    authorEmail: params.authorEmail ? params.authorEmail.toLowerCase().trim() : 'trader@sutharlabs.com',
    authorName: params.authorName || 'Algorithmic Trader',
    version: '1.0.0',
    isPreset: false,
    isPublic: params.isPublic !== undefined ? params.isPublic : true,
    tags: params.tags && params.tags.length > 0 ? params.tags : ['Custom Algorithm', 'Technical Rules'],
    clonesCount: 0,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    market: params.market || 'GLOBAL',
    timeframe: params.timeframe || '1D',
    parameters: params.parameters || [],
    rules: params.rules || {
      indicators: {},
      entryConditions: [],
      exitConditions: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  all.push(newStrategy);
  saveStrategiesToDisk(all);
  return newStrategy;
}

export function updateStrategy(id: string, updates: Partial<IStrategy>): IStrategy | null {
  const all = loadStrategiesFromDisk();
  const idx = all.findIndex(s => s.id === id);
  if (idx === -1) return null;

  // Protect built-in presets from being overwritten completely
  const existing = all[idx];
  const updated: IStrategy = {
    ...existing,
    ...updates,
    id: existing.id,
    isPreset: existing.isPreset,
    updatedAt: new Date().toISOString()
  };

  all[idx] = updated;
  saveStrategiesToDisk(all);
  return updated;
}

export function deleteStrategy(id: string): boolean {
  const all = loadStrategiesFromDisk();
  const target = all.find(s => s.id === id);
  if (!target || target.isPreset) {
    return false; // Cannot delete preset strategies
  }

  const filtered = all.filter(s => s.id !== id);
  saveStrategiesToDisk(filtered);
  return true;
}

// ── Stage 5 Community Marketplace Operations ──────────────────────────────────

/**
 * 1-Click Fork / Clone a strategy into user's private workspace
 */
export function forkStrategy(sourceId: string, userEmail: string, userName?: string): IStrategy | null {
  const all = loadStrategiesFromDisk();
  const source = all.find(s => s.id === sourceId);
  if (!source) return null;

  // Increment clones count on source strategy
  source.clonesCount = (source.clonesCount || 0) + 1;

  const cloneId = `strat-fork-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const forkedStrategy: IStrategy = {
    ...JSON.parse(JSON.stringify(source)),
    id: cloneId,
    name: `${source.name} (Fork)`,
    authorEmail: (userEmail || 'trader@sutharlabs.com').toLowerCase().trim(),
    authorName: userName || 'Community Trader',
    version: '1.0.0',
    isPreset: false,
    isPublic: false, // Default private for forks until user chooses to publish
    clonesCount: 0,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    verifiedBadge: undefined, // Badges must be re-verified on forks
    forkedFrom: {
      id: source.id,
      name: source.name,
      authorName: source.authorName
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  all.push(forkedStrategy);
  saveStrategiesToDisk(all);
  return forkedStrategy;
}

/**
 * Toggle public community catalog publishing with tags
 */
export function publishStrategy(id: string, isPublic: boolean, tags?: string[]): IStrategy | null {
  const all = loadStrategiesFromDisk();
  const target = all.find(s => s.id === id);
  if (!target) return null;

  target.isPublic = isPublic;
  if (tags && tags.length > 0) {
    target.tags = tags;
  }
  target.updatedAt = new Date().toISOString();

  saveStrategiesToDisk(all);
  return target;
}

/**
 * Add or update a community star review (1-5 stars)
 */
export function addStrategyReview(strategyId: string, reviewParams: {
  userEmail: string;
  userName: string;
  rating: number;
  comment: string;
}): { strategy: IStrategy; review: StrategyReview } | null {
  const all = loadStrategiesFromDisk();
  const target = all.find(s => s.id === strategyId);
  if (!target) return null;

  const email = (reviewParams.userEmail || 'trader@sutharlabs.com').toLowerCase().trim();
  const cleanRating = Math.max(1, Math.min(5, Math.round(reviewParams.rating || 5)));
  const cleanComment = (reviewParams.comment || '').trim();

  target.reviews = target.reviews || [];

  // Check if user already reviewed
  const existingIdx = target.reviews.findIndex(r => r.userEmail === email);
  let review: StrategyReview;

  if (existingIdx !== -1) {
    target.reviews[existingIdx] = {
      ...target.reviews[existingIdx],
      rating: cleanRating,
      comment: cleanComment,
      userName: reviewParams.userName || target.reviews[existingIdx].userName,
      createdAt: new Date().toISOString()
    };
    review = target.reviews[existingIdx];
  } else {
    review = {
      id: `rev-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      strategyId,
      userEmail: email,
      userName: reviewParams.userName || 'Community Trader',
      rating: cleanRating,
      comment: cleanComment,
      createdAt: new Date().toISOString()
    };
    target.reviews.unshift(review);
  }

  // Recalculate average rating & reviewsCount
  target.reviewsCount = target.reviews.length;
  const sumRatings = target.reviews.reduce((acc, r) => acc + r.rating, 0);
  target.rating = Number((sumRatings / target.reviews.length).toFixed(1));
  target.updatedAt = new Date().toISOString();

  saveStrategiesToDisk(all);
  return { strategy: target, review };
}

/**
 * Delete a user review from a strategy
 */
export function deleteStrategyReview(strategyId: string, userEmail: string): IStrategy | null {
  const all = loadStrategiesFromDisk();
  const target = all.find(s => s.id === strategyId);
  if (!target || !target.reviews) return null;

  const email = userEmail.toLowerCase().trim();
  target.reviews = target.reviews.filter(r => r.userEmail !== email);
  target.reviewsCount = target.reviews.length;

  if (target.reviews.length > 0) {
    const sumRatings = target.reviews.reduce((acc, r) => acc + r.rating, 0);
    target.rating = Number((sumRatings / target.reviews.length).toFixed(1));
  } else {
    target.rating = 0;
  }

  target.updatedAt = new Date().toISOString();
  saveStrategiesToDisk(all);
  return target;
}

/**
 * Set tamper-proof verified backtest badge
 */
export function setVerifiedBacktestBadge(strategyId: string, badge: VerifiedBacktestBadge): IStrategy | null {
  const all = loadStrategiesFromDisk();
  const target = all.find(s => s.id === strategyId);
  if (!target) return null;

  target.verifiedBadge = badge;
  target.updatedAt = new Date().toISOString();

  saveStrategiesToDisk(all);
  return target;
}
