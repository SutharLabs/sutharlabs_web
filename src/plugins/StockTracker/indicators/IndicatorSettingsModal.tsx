import React, { useState } from 'react';
import { X, Sliders, Palette, RotateCcw } from 'lucide-react';
import { getIndicatorDefinition } from './indicatorEngine.js';
import type { IndicatorInstance } from './types.js';

interface IndicatorSettingsModalProps {
  indicator: IndicatorInstance | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: IndicatorInstance) => void;
}

export default function IndicatorSettingsModal({
  indicator,
  isOpen,
  onClose,
  onSave
}: IndicatorSettingsModalProps) {
  if (!isOpen || !indicator) return null;

  const def = getIndicatorDefinition(indicator.type);
  const [params, setParams] = useState<Record<string, any>>({ ...indicator.params });
  const [color, setColor] = useState(indicator.color);
  const [color2, setColor2] = useState(indicator.color2 || '#f59e0b');
  const [lineWidth, setLineWidth] = useState(indicator.lineWidth || 2);
  const [activeTab, setActiveTab] = useState<'INPUTS' | 'STYLE'>('INPUTS');

  const handleReset = () => {
    if (def) {
      setParams({ ...def.defaultParams });
      setColor(def.defaultColor);
      setColor2(def.defaultColor2 || '#f59e0b');
      setLineWidth(2);
    }
  };

  const handleSave = () => {
    onSave({
      ...indicator,
      color,
      color2,
      lineWidth,
      params
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md flex flex-col rounded-3xl border border-outline/25 bg-surface-container-lowest/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline/10 bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-3.5 h-3.5 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm font-bold text-on-surface">
              {indicator.name} <span className="font-mono text-xs text-on-surface-variant font-normal">Settings</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-5 pt-3 border-b border-outline/10 gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('INPUTS')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'INPUTS'
                ? 'border-[#00dbe7] text-[#00dbe7] font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inputs</span>
          </button>
          <button
            onClick={() => setActiveTab('STYLE')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'STYLE'
                ? 'border-[#00dbe7] text-[#00dbe7] font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Style</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto font-mono text-xs">
          {activeTab === 'INPUTS' && (
            <div className="space-y-3.5">
              {def?.paramFields && def.paramFields.length > 0 ? (
                def.paramFields.map(field => {
                  const val = params[field.key] ?? field.default;
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-on-surface font-semibold">
                          {field.label}
                        </label>
                        <span className="text-xs text-[#00dbe7] font-bold">
                          {val}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={field.min ?? 1}
                        max={field.max ?? 100}
                        step={field.step ?? 1}
                        value={val}
                        onChange={e => setParams(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                        className="w-full accent-[#00dbe7] cursor-pointer"
                      />
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-on-surface-variant">
                  No configurable inputs for this indicator (uses native volume / session bars).
                </div>
              )}
            </div>
          )}

          {activeTab === 'STYLE' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-on-surface font-semibold">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-container border border-outline/20 text-xs font-mono text-on-surface"
                  />
                </div>
              </div>

              {def?.defaultColor2 && (
                <div className="space-y-2">
                  <label className="text-xs text-on-surface font-semibold">Secondary / Signal Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color2}
                      onChange={e => setColor2(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={color2}
                      onChange={e => setColor2(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-surface-container border border-outline/20 text-xs font-mono text-on-surface"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-on-surface font-semibold">Line Thickness</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setLineWidth(w)}
                      className={`py-2 rounded-xl text-xs font-mono flex items-center justify-center transition-all cursor-pointer ${
                        lineWidth === w
                          ? 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7] font-bold'
                          : 'bg-surface-container text-on-surface-variant border border-outline/10 hover:text-on-surface'
                      }`}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-outline/10 bg-surface-container-low/50">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-mono text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#00dbe7] text-[#002022] hover:brightness-105 transition-all cursor-pointer shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
