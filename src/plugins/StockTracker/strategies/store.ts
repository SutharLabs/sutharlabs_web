import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStrategy } from './types.js';
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
        // Ensure all built-in presets exist
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
    isPublic: true,
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
