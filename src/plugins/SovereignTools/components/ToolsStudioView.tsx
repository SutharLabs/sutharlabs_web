import React from 'react';
import PdfToolsStudio from '../../DocNexus/components/PdfToolsStudio.js';
import { TerminalLog } from '../../../types.js';
import { Wrench, Shield, Zap, Sparkles } from 'lucide-react';

interface ToolsStudioViewProps {
  logs?: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken?: string;
  userEmail?: string;
  theme?: 'light' | 'dark';
}

export default function ToolsStudioView({
  logs = [],
  onAddLog,
  userToken,
  userEmail,
  theme
}: ToolsStudioViewProps) {
  const effectiveTheme: 'light' | 'dark' = theme || (
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const isLight = effectiveTheme === 'light';

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto transition-colors ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0a0a0c] text-[#e5e1e4]'
    }`}>
      {/* Sovereign Top Header Banner */}
      <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
            isLight
              ? 'bg-sky-50 border-sky-200 text-sky-600'
              : 'bg-[#00dbe7]/10 border-[#00dbe7]/30 text-[#00dbe7]'
          }`}>
            <Wrench className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight font-sans">
                Tools Studio &amp; Utilities
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-[#00e476] border-emerald-500/25'
              }`}>
                100% Client-Side WASM
              </span>
            </div>
            <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              High-performance browser-native document manipulation, image conversion, OCR, and developer utilities. Zero server uploads.
            </p>
          </div>
        </div>

        {/* Feature Highlights Badges */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#18181c] border-[#3a494b]/30 text-gray-300'
          }`}>
            <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Zero Remote Storage</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#18181c] border-[#3a494b]/30 text-gray-300'
          }`}>
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Unlimited Quota</span>
          </div>
        </div>
      </div>

      {/* Main Suite Component in Standalone Mode */}
      <div className="flex-1 min-h-0">
        <PdfToolsStudio
          theme={effectiveTheme}
          onAddLog={onAddLog}
          isStandalone={true}
          user={{ email: userEmail, token: userToken, isLoggedIn: true }}
        />
      </div>
    </div>
  );
}

