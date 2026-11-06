import React from 'react';
import { TerminalLog } from '../../../types.js';
import { FileText, Shield, Sparkles, Layers, Zap } from 'lucide-react';
import ResumeEngine from './ResumeEngine.js';

interface ResumeStudioViewProps {
  logs?: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken?: string;
  userEmail?: string;
  theme?: 'light' | 'dark';
}

export default function ResumeStudioView({
  logs = [],
  onAddLog,
  userToken,
  userEmail,
  theme
}: ResumeStudioViewProps) {
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
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-[#818cf8]/10 border-[#818cf8]/30 text-[#818cf8]'
          }`}>
            <FileText className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight font-sans">
                Resume Studio
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-[#00e476] border-emerald-500/25'
              }`}>
                Multi-Input Sovereign Engine
              </span>
            </div>
            <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              Enterprise sovereign CV builder with multi-format ingestion (DOCX, PDF, LaTeX, Markdown, Text, JSON) and ATS vector export.
            </p>
          </div>
        </div>

        {/* Feature Badges */}
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
            <span>4-Format Export</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Studio Engine */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <ResumeEngine
            isLight={isLight}
            theme={effectiveTheme}
            onAddLog={onAddLog}
            checkDownloadAccess={() => true}
          />
        </div>
      </div>
    </div>
  );
}

