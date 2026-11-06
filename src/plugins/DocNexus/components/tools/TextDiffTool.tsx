import React, { useState } from 'react';
import { SubToolProps } from './types.js';
import { GitCompare, ArrowLeftRight, Check, Copy, Sparkles } from 'lucide-react';

export default function TextDiffTool({ isLight, isProcessing, setIsProcessing, setStatus, setError, addLog }: SubToolProps) {
  const [originalText, setOriginalText] = useState(`function calculateYield(principal, rate) {
  const interest = principal * rate;
  return principal + interest;
}`);
  const [modifiedText, setModifiedText] = useState(`function calculateYield(principal, rate, tenureYears = 1) {
  // Enhanced compound yield calculation
  const total = principal * Math.pow(1 + rate, tenureYears);
  return total;
}`);

  // Simple line-by-line diff algorithm
  const computeDiff = () => {
    const origLines = originalText.split('\n');
    const modLines = modifiedText.split('\n');
    const maxLen = Math.max(origLines.length, modLines.length);

    const diffRows: { orig?: string; mod?: string; status: 'same' | 'added' | 'removed' | 'changed' }[] = [];

    for (let i = 0; i < maxLen; i++) {
      const o = origLines[i];
      const m = modLines[i];

      if (o === undefined) {
        diffRows.push({ mod: m, status: 'added' });
      } else if (m === undefined) {
        diffRows.push({ orig: o, status: 'removed' });
      } else if (o === m) {
        diffRows.push({ orig: o, mod: m, status: 'same' });
      } else {
        diffRows.push({ orig: o, mod: m, status: 'changed' });
      }
    }

    return diffRows;
  };

  const diffRows = computeDiff();
  const addedCount = diffRows.filter(r => r.status === 'added' || r.status === 'changed').length;
  const removedCount = diffRows.filter(r => r.status === 'removed' || r.status === 'changed').length;

  const handleSwap = () => {
    const temp = originalText;
    setOriginalText(modifiedText);
    setModifiedText(temp);
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/40'
    }`}>
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3a494b]/20">
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-emerald-400 font-bold">+{addedCount} additions</span>
          <span className="text-[#849495]">•</span>
          <span className="text-rose-400 font-bold">-{removedCount} deletions</span>
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border ${
            isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
          <span>Swap Left/Right</span>
        </button>
      </div>

      {/* Input Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
            Original (Before):
          </label>
          <textarea
            value={originalText}
            onChange={e => setOriginalText(e.target.value)}
            rows={8}
            className={`w-full p-3 rounded-xl border text-xs font-mono resize-y leading-relaxed scrollbar-thin ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
            }`}
          />
        </div>

        <div className="space-y-1.5">
          <label className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-[#c2c8c8]'}`}>
            Modified (After):
          </label>
          <textarea
            value={modifiedText}
            onChange={e => setModifiedText(e.target.value)}
            rows={8}
            className={`w-full p-3 rounded-xl border text-xs font-mono resize-y leading-relaxed scrollbar-thin ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#1b1b1e] border-[#3a494b]/40 text-[#e5e1e4]'
            }`}
          />
        </div>
      </div>

      {/* Visual Line-by-Line Diff Output */}
      <div className="space-y-2 pt-2 border-t border-[#3a494b]/20">
        <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-[#e5e1e4]'}`}>
          Diff Comparison Output
        </h4>
        <div className={`p-3 rounded-xl border font-mono text-xs overflow-x-auto space-y-1 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0a0c] border-[#3a494b]/30'
        }`}>
          {diffRows.map((row, idx) => (
            <div key={idx} className="flex items-start text-xs font-mono">
              <span className="w-8 text-[10px] text-[#849495] select-none text-right pr-2">
                {idx + 1}
              </span>
              {row.status === 'same' && (
                <div className={`px-2 py-0.5 w-full ${isLight ? 'text-slate-600' : 'text-[#a4a2a6]'}`}>
                  <span className="select-none text-[#849495] mr-2"> </span>
                  <span>{row.orig}</span>
                </div>
              )}
              {row.status === 'removed' && (
                <div className="px-2 py-0.5 w-full bg-rose-500/10 text-rose-400 border-l-2 border-rose-500">
                  <span className="select-none text-rose-500 font-bold mr-2">-</span>
                  <span>{row.orig}</span>
                </div>
              )}
              {row.status === 'added' && (
                <div className="px-2 py-0.5 w-full bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500">
                  <span className="select-none text-emerald-400 font-bold mr-2">+</span>
                  <span>{row.mod}</span>
                </div>
              )}
              {row.status === 'changed' && (
                <div className="w-full space-y-0.5">
                  <div className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border-l-2 border-rose-500">
                    <span className="select-none text-rose-500 font-bold mr-2">-</span>
                    <span>{row.orig}</span>
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500">
                    <span className="select-none text-emerald-400 font-bold mr-2">+</span>
                    <span>{row.mod}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

