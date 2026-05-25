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

export default function ManagePluginsView({ logs, onAddLog, userToken }: ManageProps) {
  const [workspacePlugins, setWorkspacePlugins] = useState<any[]>([]);
  const [selectedPluginFile, setSelectedPluginFile] = useState<File | null>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('pluginFile', file);
    try {
      const res = await fetch('/api/plugins/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      return res.ok;
    } catch(e) { return false; }
  };

  useEffect(() => {
    // Mock fetch workspace plugins
    setWorkspacePlugins([
      { id: '1', name: 'Stock Tracker', version: '1.2.0', category: 'Finance', iconSymbol: 'monitoring', description: 'Real-time market tracking' },
      { id: '2', name: 'Custom Flow', version: '0.9.4', category: 'Architecture', iconSymbol: 'account_tree', description: 'Node editor' }
    ]);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="glass-panel p-4 sm:p-6 rounded-lg border border-[#3a494b]/20 flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center gap-3 border-b border-[#3a494b]/20 pb-3">
          <span className="material-symbols-outlined text-[#00dbe7] text-2xl">extension</span>
          <div>
            <h3 className="text-[#e5e1e4] font-bold">Workspace Plugins</h3>
            <p className="text-[10px] font-mono text-[#849495]">Manage internal IDE extensions</p>
          </div>
        </div>

        <div className="bg-[#131315]/50 border border-[#3a494b]/30 p-4 rounded mb-2">
          <h4 className="text-sm font-bold text-[#e5e1e4] mb-3 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[#00dbe7]" /> Install Workspace Plugin
          </h4>
          <div className="flex flex-col gap-3">
            <input type="file" accept=".zip,.vsix" onChange={(e) => setSelectedPluginFile(e.target.files ? e.target.files[0] : null)} className="text-xs text-[#e5e1e4]" />
            <button onClick={async () => {
                if (selectedPluginFile && await uploadFile(selectedPluginFile)) {
                  setSelectedPluginFile(null);
                  onAddLog({ timestamp: new Date().toLocaleTimeString(), type: 'SUCCESS', message: `ADMIN: Installed new workspace plugin ${selectedPluginFile.name}` });
                }
              }} 
              disabled={!selectedPluginFile}
              className="py-1.5 px-3 rounded bg-[#00dbe7] text-black font-semibold text-xs disabled:opacity-50">
              Upload & Install Plugin
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
          {workspacePlugins.map(wp => (
            <div key={wp.id} className="p-4 bg-[#131315] border border-[#3a494b]/30 rounded">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-[#00dbe7]">{wp.iconSymbol}</span>
                  <div><div className="text-[#e5e1e4] font-bold text-sm">{wp.name}</div><div className="text-[#849495] font-mono text-[9px]">v{wp.version}</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
