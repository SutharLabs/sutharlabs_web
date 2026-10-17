import React, { useState } from 'react';
import { Eye, EyeOff, Settings2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatLegendValue } from './indicatorEngine.js';
import type { IndicatorInstance, MultiSeriesIndicatorData } from './types.js';

interface HoveredBarData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeEpoch?: number;
}

interface ChartLegendProps {
  symbolDisplay: string;
  interval: string;
  currencySymbol: string;
  hoveredBar: HoveredBarData | null;
  activeIndicators: IndicatorInstance[];
  indicatorDataMap: Map<string, MultiSeriesIndicatorData>;
  onToggleVisibility: (id: string) => void;
  onOpenSettings: (indicator: IndicatorInstance) => void;
  onRemoveIndicator: (id: string) => void;
  onOpenIndicatorsModal: () => void;
}

export default function ChartLegend({
  symbolDisplay,
  interval,
  currencySymbol,
  hoveredBar,
  activeIndicators,
  indicatorDataMap,
  onToggleVisibility,
  onOpenSettings,
  onRemoveIndicator,
  onOpenIndicatorsModal
}: ChartLegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Price change calculation
  const change = hoveredBar ? hoveredBar.close - hoveredBar.open : 0;
  const changePct = hoveredBar && hoveredBar.open > 0 ? (change / hoveredBar.open) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div className="absolute top-2 left-3 z-20 pointer-events-auto max-w-[90%] sm:max-w-md select-none font-mono">
      {/* ── Main OHLCV Bar ── */}
      {hoveredBar && (
        <div className="flex items-center gap-2 flex-wrap text-[11px] bg-surface-container-lowest/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-outline/10 text-on-surface shadow-sm mb-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-[#00dbe7]">{symbolDisplay}</span>
            <span className="text-on-surface-variant text-[10px]">· {interval}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant overflow-x-auto">
            <span>O: <strong className="text-on-surface">{currencySymbol}{hoveredBar.open.toLocaleString()}</strong></span>
            <span>H: <strong className="text-on-surface">{currencySymbol}{hoveredBar.high.toLocaleString()}</strong></span>
            <span>L: <strong className="text-on-surface">{currencySymbol}{hoveredBar.low.toLocaleString()}</strong></span>
            <span>C: <strong className="text-on-surface">{currencySymbol}{hoveredBar.close.toLocaleString()}</strong></span>
            <span className={isUp ? 'text-[#00e476] font-bold' : 'text-[#ff6b6b] font-bold'}>
              {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
            {hoveredBar.volume > 0 && (
              <span>V: <strong className="text-on-surface">{Math.round(hoveredBar.volume).toLocaleString()}</strong></span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto text-on-surface-variant hover:text-on-surface p-0.5 rounded transition-colors"
            title={isCollapsed ? 'Expand indicator list' : 'Collapse indicator list'}
          >
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* ── Active Indicators Stack (TradingView Legend) ── */}
      {!isCollapsed && activeIndicators.length > 0 && (
        <div className="space-y-1">
          {activeIndicators.map(ind => {
            const data = indicatorDataMap.get(ind.id);
            const valStr = data ? formatLegendValue(ind, data, hoveredBar?.timeEpoch) : '—';

            // Parameter summary string
            const paramSummary = Object.entries(ind.params)
              .map(([_, v]) => v)
              .join(', ');

            return (
              <div
                key={ind.id}
                className="group flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-surface-container-lowest/80 backdrop-blur-md border border-outline/10 text-[10px] text-on-surface hover:bg-surface-container/70 transition-all shadow-sm w-fit max-w-full"
              >
                {/* Indicator Color Dot */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ind.visible ? ind.color : 'gray' }}
                />

                {/* Name & Parameter */}
                <span className={`font-semibold shrink-0 ${!ind.visible ? 'line-through opacity-50' : ''}`}>
                  {ind.type} {paramSummary ? `(${paramSummary})` : ''}
                </span>

                {/* Calculated Live Value */}
                {ind.visible && (
                  <span 
                    className="font-bold shrink-0 truncate max-w-[200px]"
                    style={{ color: ind.color }}
                  >
                    {valStr}
                  </span>
                )}

                {/* Action Toolbar on Hover */}
                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                  <button
                    onClick={() => onToggleVisibility(ind.id)}
                    className="p-0.5 hover:text-[#00dbe7] text-on-surface-variant rounded transition-colors cursor-pointer"
                    title={ind.visible ? 'Hide indicator' : 'Show indicator'}
                  >
                    {ind.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-on-surface-variant/50" />}
                  </button>

                  <button
                    onClick={() => onOpenSettings(ind)}
                    className="p-0.5 hover:text-[#00dbe7] text-on-surface-variant rounded transition-colors cursor-pointer"
                    title="Settings"
                  >
                    <Settings2 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onRemoveIndicator(ind.id)}
                    className="p-0.5 hover:text-rose-400 text-on-surface-variant rounded transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
