import React, { useState } from 'react';
import { 
  Laptop, 
  Smartphone, 
  Shirt, 
  Layers, 
  Sparkles, 
  Palette, 
  ShieldCheck, 
  CheckCircle2, 
  Zap,
  Download
} from 'lucide-react';
import { WorkspacePluginViewProps } from '../../types.js';
import MockupStudioTool from '../../DocNexus/components/tools/MockupStudioTool.js';
import CollapsibleLogDrawer from '../../../components/CollapsibleLogDrawer.js';

export default function MockupStudioView({
  logs = [],
  onAddLog,
  userEmail,
  userToken,
  theme = 'dark',
  userRole
}: WorkspacePluginViewProps) {
  const isLight = theme === 'light';
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addLocalLog = (message: string, type: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' = 'INFO') => {
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: type === 'WARN' ? 'ALERT' : type === 'INFO' ? 'DATA' : type,
      message
    });
  };

  return (
    <div className={`flex flex-col h-full overflow-y-auto custom-scrollbar select-none ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0b0b0e] text-[#e5e1e4]'
    }`}>
      {/* Top Standard View Header with Contained Icon Badge (Rule 1.A) */}
      <header className={`px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20 backdrop-blur-md transition-colors ${
        isLight 
          ? 'bg-white/95 border-slate-200 shadow-xs' 
          : 'bg-[#121216]/95 border-[#3a494b]/40 shadow-md'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Laptop className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-on-surface font-sans">
                Mockup Studio
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                isLight 
                  ? 'bg-sky-50 text-sky-700 border-sky-200' 
                  : 'bg-[#00dbe7]/10 text-[#00dbe7] border-[#00dbe7]/30'
              }`}>
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              High-Fidelity 3D Isometric Device Frames (MacBook, iPhone) & Apparel Merch Customizer
            </p>
          </div>
        </div>

        {/* Header Telemetry Badges */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
          }`}>
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold">HTML5 2D Canvas Compositor</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">Client-Side High-Res PNG</span>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Quick Capabilities Banner */}
        <div className={`p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#131316] border-[#3a494b]/40'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
            <div>
              <span className="block text-[10px] text-on-surface-variant uppercase">Hardware</span>
              <span className="font-bold text-on-surface">MacBook Pro M-Series</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <div>
              <span className="block text-[10px] text-on-surface-variant uppercase">Mobile</span>
              <span className="font-bold text-on-surface">iPhone 16 Pro Titanium</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center shrink-0">
              <Shirt className="w-4 h-4 text-purple-400 shrink-0" />
            </div>
            <div>
              <span className="block text-[10px] text-on-surface-variant uppercase">Apparel</span>
              <span className="font-bold text-on-surface">T-Shirts & Hoodies</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
            <div>
              <span className="block text-[10px] text-on-surface-variant uppercase">Effects</span>
              <span className="font-bold text-on-surface">Specular Glare & Glow</span>
            </div>
          </div>
        </div>

        {/* Embedded Core Tool */}
        <MockupStudioTool
          isLight={isLight}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          setStatus={setStatusMessage}
          setError={setErrorMessage}
          addLog={(msg, type) => addLocalLog(msg, type as any)}
          checkDownloadAccess={() => true}
        />
      </main>

      {/* Audit Log Drawer */}
      <CollapsibleLogDrawer
        title="MOCKUP STUDIO TELEMETRY LOG"
        logs={logs}
        defaultExpanded={false}
      />
    </div>
  );
}

