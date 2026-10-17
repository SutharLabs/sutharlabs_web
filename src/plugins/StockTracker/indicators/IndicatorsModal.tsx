import React, { useState, useMemo } from 'react';
import { Search, X, Check, Plus, Layers, Sliders, TrendingUp, BarChart2, Activity } from 'lucide-react';
import { INDICATOR_DEFINITIONS } from './indicatorEngine.js';
import type { IndicatorDefinition, IndicatorInstance, IndicatorType } from './types.js';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeIndicators: IndicatorInstance[];
  onAddIndicator: (type: IndicatorType) => void;
  onRemoveIndicator: (id: string) => void;
}

export default function IndicatorsModal({
  isOpen,
  onClose,
  activeIndicators,
  onAddIndicator,
  onRemoveIndicator
}: IndicatorsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'OVERLAY' | 'OSCILLATOR' | 'VOLUME'>('ALL');

  const filteredDefinitions = useMemo(() => {
    return INDICATOR_DEFINITIONS.filter(def => {
      // Category filter
      if (selectedCategory === 'OVERLAY' && def.category !== 'overlay') return false;
      if (selectedCategory === 'OSCILLATOR' && (def.category !== 'oscillator' || def.type === 'VOLUME' || def.type === 'OBV')) return false;
      if (selectedCategory === 'VOLUME' && def.type !== 'VOLUME' && def.type !== 'OBV' && def.type !== 'VWAP') return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        def.name.toLowerCase().includes(q) ||
        def.shortCode.toLowerCase().includes(q) ||
        def.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-outline/25 bg-surface-container-lowest/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline/10 bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00dbe7]/15 border border-[#00dbe7]/30 flex items-center justify-center text-[#00dbe7] shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface tracking-tight">Indicators &amp; Metrics</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                  {activeIndicators.length} Active
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Select technical studies, price envelopes, and momentum oscillators to plot on graph
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="p-4 border-b border-outline/10 space-y-3 bg-surface-container-lowest">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by indicator name (e.g. RSI, Supertrend, Bollinger, EMA)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-container/60 border border-outline/20 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-[#00dbe7] focus:ring-1 focus:ring-[#00dbe7] transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Indicators', icon: Layers },
              { id: 'OVERLAY', label: 'Overlays (Price)', icon: TrendingUp },
              { id: 'OSCILLATOR', label: 'Oscillators & Momentum', icon: Activity },
              { id: 'VOLUME', label: 'Volume & Volatility', icon: BarChart2 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 font-bold shadow-sm'
                      : 'bg-surface-container/40 text-on-surface-variant border border-transparent hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Indicator List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh] divide-y divide-outline/5">
          {filteredDefinitions.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant space-y-2">
              <Layers className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs font-mono">No indicators found matching "{searchQuery}"</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                className="text-xs text-[#00dbe7] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredDefinitions.map((def: IndicatorDefinition) => {
              const activeInstances = activeIndicators.filter(i => i.type === def.type);
              const isActive = activeInstances.length > 0;

              return (
                <div
                  key={def.type}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-surface-container/40 transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 border"
                      style={{
                        backgroundColor: `${def.defaultColor}15`,
                        borderColor: `${def.defaultColor}40`,
                        color: def.defaultColor
                      }}
                    >
                      {def.shortCode}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-on-surface group-hover:text-[#00dbe7] transition-colors truncate">
                          {def.name}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          def.category === 'overlay'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {def.category === 'overlay' ? 'Price Overlay' : 'Oscillator'}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00e476]/15 text-[#00e476] border border-[#00e476]/30 font-bold">
                            {activeInstances.length} on chart
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1 leading-relaxed">
                        {def.description}
                      </p>
                    </div>
                  </div>

                  {/* Add / Remove Action Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isActive ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onAddIndicator(def.type)}
                          title="Add another instance with different period"
                          className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold bg-surface-container border border-outline/20 text-on-surface hover:border-[#00dbe7] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-[#00dbe7]" />
                          <span>Add More</span>
                        </button>
                        <button
                          onClick={() => {
                            // Remove latest instance of this type
                            const target = activeInstances[activeInstances.length - 1];
                            if (target) onRemoveIndicator(target.id);
                          }}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddIndicator(def.type)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30 hover:bg-[#00dbe7]/25 hover:border-[#00dbe7]/50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-outline/10 bg-surface-container-low/50 text-xs">
          <span className="text-on-surface-variant font-mono">
            All active indicators can be customized or hidden from the chart legend.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
