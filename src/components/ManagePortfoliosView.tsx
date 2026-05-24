import React, { useState, useEffect } from 'react';
import { TerminalLog } from '../types';
import { Globe, ExternalLink, Code2 } from 'lucide-react';

interface ManageProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
}

export default function ManagePortfoliosView({ logs, onAddLog, userToken }: ManageProps) {
  const [portfolios, setPortfolios] = useState([
    { id: '1', name: 'Driven Enterprise', domain: 'drivenenterprise.com', techStack: 'React, Tailwind, Node.js', status: 'Live' },
    { id: '2', name: 'Aradhana Dharmika Trust', domain: 'aradhanatrust.org', techStack: 'Next.js, TypeScript, Prisma', status: 'Live' },
    { id: '3', name: 'Go Toxin free with Tina', domain: 'gotoxinfree.com', techStack: 'Shopify, Liquid, Vue.js', status: 'Maintenance' },
    { id: '4', name: 'SutharLabs Platform', domain: 'sutharlabs.com', techStack: 'React, Vite, Node API', status: 'Active Development' }
  ]);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="glass-panel p-6 rounded-lg border border-[#3a494b]/20 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-[#3a494b]/20 pb-3">
          <span className="material-symbols-outlined text-[#ce5dff] text-2xl">web</span>
          <div>
            <h3 className="text-[#e5e1e4] font-bold">Development Portfolio</h3>
            <p className="text-[10px] font-mono text-[#849495]">Manage SutharLabs service credibility projects</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolios.map(p => (
            <div key={p.id} className="p-5 bg-[#131315] border border-[#3a494b]/30 rounded-xl hover:border-[#ce5dff]/50 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#ce5dff]" />
                  <h4 className="text-[#e5e1e4] font-bold text-sm">{p.name}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                  p.status === 'Live' ? 'bg-[#00e476]/10 text-[#00e476] border-[#00e476]/30' :
                  p.status === 'Maintenance' ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' :
                  'bg-[#00dbe7]/10 text-[#00dbe7] border-[#00dbe7]/30'
                }`}>
                  {p.status}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#849495]">Domain</span>
                  <a href={`https://${p.domain}`} target="_blank" rel="noreferrer" className="text-[#ce5dff] hover:underline flex items-center gap-1">
                    {p.domain} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#3a494b]/10">
                  <span className="text-[#849495] flex items-center gap-1"><Code2 className="w-3 h-3"/> Stack</span>
                  <span className="text-gray-300 font-mono text-[10px]">{p.techStack}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
