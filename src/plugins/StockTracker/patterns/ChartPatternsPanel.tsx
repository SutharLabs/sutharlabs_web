import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  Percent, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';
import { DetectedPattern } from './types.js';

interface ChartPatternsPanelProps {
  patterns: DetectedPattern[];
  selectedPatternId: string | null;
  onSelectPattern: (pattern: DetectedPattern) => void;
  theme?: 'light' | 'dark';
  symbol: string;
}

export const ChartPatternsPanel: React.FC<ChartPatternsPanelProps> = ({
  patterns,
  selectedPatternId,
  onSelectPattern,
  theme = 'dark',
  symbol
}) => {
  const isLight = theme === 'light';

  if (!patterns || patterns.length === 0) {
    return (
      <div className={`p-4 rounded-xl border text-center font-mono text-xs ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-surface-container-low/40 border-outline/15 text-on-surface-variant'
      }`}>
        <div className="flex items-center justify-center gap-1.5 font-bold mb-1">
          <Layers className="w-4 h-4 text-on-surface-variant/60" />
          <span>No Structural Patterns Detected</span>
        </div>
        <p className="text-[11px] max-w-xs mx-auto">
          No classical geometric or candlestick formations found on the current candle window for {symbol}. Try switching timeframes (1D $\leftrightarrow$ 1H).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-on-surface">
          <Sparkles className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
          <span>Active Chart Patterns ({patterns.length})</span>
        </div>
        <span className="text-[10px] font-mono text-on-surface-variant">
          Auto-detected on OHLCV
        </span>
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
        {patterns.map((pat) => {
          const isSelected = selectedPatternId === pat.id;
          const isBull = pat.direction === 'BULLISH';

          return (
            <div
              key={pat.id}
              onClick={() => onSelectPattern(pat)}
              className={`p-3 rounded-xl border transition-all cursor-pointer font-mono select-none ${
                isSelected
                  ? isLight
                    ? 'bg-sky-50/80 border-sky-400 shadow-sm'
                    : 'bg-[#00dbe7]/10 border-[#00dbe7]/50 shadow-sm'
                  : isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                    : 'bg-surface-container-low/50 hover:bg-surface-container-low border-outline/15 hover:border-outline/30'
              }`}
            >
              {/* Top Row: Name + Direction & Action Badges */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isBull ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-on-surface truncate">
                    {pat.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    isBull
                      ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {pat.action}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-[#00dbe7]'
                  }`}>
                    {pat.confidence}% Conf.
                  </span>
                </div>
              </div>

              {/* Metrics Grid: Entry, Target, SL, R:R */}
              <div className={`grid grid-cols-4 gap-1 p-2 rounded-lg text-[10px] mb-2 ${
                isLight ? 'bg-slate-100/70 border border-slate-200' : 'bg-black/20 border border-white/5'
              }`}>
                <div>
                  <div className="text-on-surface-variant/70 text-[9px] uppercase">Entry</div>
                  <div className="font-bold text-on-surface">₹{pat.entryPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-emerald-500 text-[9px] uppercase flex items-center gap-0.5">
                    <Target className="w-2.5 h-2.5" /> Target
                  </div>
                  <div className="font-bold text-emerald-400">₹{pat.targetPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-rose-500 text-[9px] uppercase flex items-center gap-0.5">
                    <ShieldAlert className="w-2.5 h-2.5" /> Stop
                  </div>
                  <div className="font-bold text-rose-400">₹{pat.stopLossPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[#00dbe7] text-[9px] uppercase">R:R</div>
                  <div className="font-bold text-on-surface">{pat.riskRewardRatio}:1</div>
                </div>
              </div>

              {/* Narrative description */}
              <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                {pat.description}
              </p>

              {/* Action Toolbar */}
              <div className="mt-2 pt-1.5 border-t border-outline/10 flex items-center justify-between text-[10px]">
                <span className="text-on-surface-variant/60">
                  {pat.keyPoints.length} Pivot Nodes
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPattern(pat);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? isLight ? 'bg-sky-500 text-white' : 'bg-[#00dbe7] text-[#002022]'
                      : isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/20 text-[#00dbe7]'
                  }`}
                >
                  <Eye className="w-3 h-3 shrink-0" />
                  <span>{isSelected ? 'Focused on Chart' : 'Inspect on Chart'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartPatternsPanel;
