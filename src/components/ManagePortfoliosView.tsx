import React, { useState, useEffect } from 'react';
import { RegisteredUser, TerminalLog, StorePlugin } from '../types';
import { 
  Users, Activity, Database, Globe, Trash2, UserPlus, ShieldAlert, CheckCircle,
  ToggleLeft, ToggleRight, TrendingUp, Cpu, Zap, HardDrive, PlusCircle, Tag, Layers, Server
} from 'lucide-react';

interface ManageProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
}

export default function ManagePortfoliosView({ logs, onAddLog, userToken }: ManageProps) {
  const [portfolios, setPortfolios] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/portfolios', { headers: { 'Authorization': `Bearer ${userToken}` } })
      .then(r => r.json()).then(data => setPortfolios(Array.isArray(data) ? data : [])).catch(console.error);
  }, [userToken]);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="glass-panel p-6 rounded-lg border border-[#3a494b]/20 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-[#3a494b]/20 pb-3">
          <span className="material-symbols-outlined text-[#ce5dff] text-2xl">account_balance_wallet</span>
          <div>
            <h3 className="text-[#e5e1e4] font-bold">User Portfolios</h3>
            <p className="text-[10px] font-mono text-[#849495]">View active trading portfolios</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-[#849495] bg-[#131315]">
              <tr><th className="py-2 px-3">User</th><th className="py-2 px-3">Cash</th><th className="py-2 px-3">Positions</th></tr>
            </thead>
            <tbody className="divide-y divide-[#3a494b]/10">
              {portfolios.map(p => (
                <tr key={p.id} className="border-b border-[#3a494b]/10"><td className="py-3 px-3"><div className="text-[#e5e1e4]">{p.user?.name}</div><div className="text-[9px] text-gray-500">{p.userEmail}</div></td><td className="py-3 px-3 text-[#00e476]">${p.cash}</td><td className="py-3 px-3 text-[#ebb2ff]">{p.shares}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
