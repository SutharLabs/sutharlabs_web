import React, { useState } from 'react';
import { TerminalLog } from '../types';
import { Database, Terminal, ChevronDown } from 'lucide-react';

interface CollapsibleLogDrawerProps {
  logs: TerminalLog[];
  title?: string;
  defaultExpanded?: boolean;
}

export default function CollapsibleLogDrawer({
  logs = [],
  title = 'TELEMETRY AUDIT LOG',
  defaultExpanded = false
}: CollapsibleLogDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`mt-4 rounded-xl border border-outline/20 bg-surface-container-low/80 backdrop-blur-sm transition-all duration-300 overflow-hidden flex flex-col shrink-0 ${
      isExpanded ? 'h-48' : 'h-10'
    }`}>
      {/* Drawer Toggle Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2 flex items-center justify-between cursor-pointer select-none bg-surface-container/60 hover:bg-surface-container transition-colors border-b border-outline/10"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-[10px] font-bold text-on-surface uppercase tracking-wider">
            {title}
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-semibold bg-surface-container-high text-on-surface-variant border border-outline/20">
            {logs.length}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-1 font-mono text-[10px] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Logs Body */}
      {isExpanded && (
        <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar bg-surface-container-lowest/50">
          {logs.length === 0 ? (
            <div className="text-on-surface-variant/70 italic text-center py-4">
              No telemetry events recorded yet.
            </div>
          ) : (
            logs.slice(-30).reverse().map((log, index) => (
              <div key={index} className="flex gap-2 p-1 rounded hover:bg-surface-container-high/40 transition-colors">
                <span className="text-on-surface-variant/70 text-[9px] shrink-0">[{log.timestamp}]</span>
                <span className={`font-bold shrink-0 ${
                  log.type === 'SUCCESS' ? 'text-emerald-500' :
                  log.type === 'ERROR' ? 'text-rose-500' :
                  log.type === 'ALERT' ? 'text-amber-500' :
                  log.type === 'AGENT' ? 'text-cyan-500' :
                  'text-primary'
                }`}>
                  [{log.type}]
                </span>
                <span className="text-on-surface break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
