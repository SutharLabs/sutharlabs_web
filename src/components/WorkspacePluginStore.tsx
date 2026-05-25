import React, { useState, useEffect } from 'react';
import { TerminalLog } from '../types';

interface WorkspacePluginStoreProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userEmail: string;
  userToken: string;
}

interface WorkspacePlugin {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string;
  iconSymbol: string;
  version: string;
}

export default function WorkspacePluginStore({ logs, onAddLog, userEmail, userToken }: WorkspacePluginStoreProps) {
  const [plugins, setPlugins] = useState<WorkspacePlugin[]>([]);
  const [installed, setInstalled] = useState<WorkspacePlugin[]>([]);
  const [notification, setNotification] = useState('');

  const fetchPlugins = async () => {
    try {
      const res = await fetch('/api/workspace-plugins');
      if (res.ok) setPlugins(await res.json());

      const resInstalled = await fetch('/api/workspace-plugins/installed', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (resInstalled.ok) setInstalled(await resInstalled.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, [userToken]);

  const handleInstall = async (pluginId: string, name: string) => {
    try {
      const res = await fetch('/api/workspace-plugins/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ pluginId })
      });
      if (res.ok) {
        setNotification(`Successfully installed ${name}`);
        onAddLog({ timestamp: new Date().toLocaleTimeString(), type: 'SUCCESS', message: `Installed workspace plugin: ${name}` });
        fetchPlugins();
      } else {
        const data = await res.json();
        setNotification(data.error || 'Failed to install');
      }
    } catch (e) {
      setNotification('Network error installing plugin.');
    }
    setTimeout(() => setNotification(''), 4000);
  };

  const handleUninstall = async (pluginId: string, name: string) => {
    try {
      const res = await fetch(`/api/workspace-plugins/install/${pluginId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        setNotification(`Successfully uninstalled ${name}`);
        onAddLog({ timestamp: new Date().toLocaleTimeString(), type: 'ALERT', message: `Uninstalled workspace plugin: ${name}` });
        fetchPlugins();
      }
    } catch (e) {
      setNotification('Network error uninstalling plugin.');
    }
    setTimeout(() => setNotification(''), 4000);
  };

  const installedIds = new Set(installed.map(i => i.id));

  return (
    <div className="flex-grow flex flex-col gap-4 sm:gap-6 animate-fade-in p-2">
      {notification && (
        <div className="bg-[#00e476]/10 border border-[#00fb83]/30 text-[#00e476] p-3 rounded text-xs font-mono flex items-center gap-2">
          <span className="material-symbols-outlined text-sm select-none">check_circle</span>
          <span>{notification}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl font-sans font-bold text-[#e5e1e4]">Workspace Plugin Store</h2>
          <p className="text-xs text-[#849495] mt-1">Install native extensions directly into your workspace.</p>
        </div>
        <span className="material-symbols-outlined text-[#00dbe7] text-3xl sm:text-4xl">extension</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {plugins.map(p => {
          const isInstalled = installedIds.has(p.id);
          return (
            <div key={p.id} className="glass-panel p-5 rounded-lg flex flex-col gap-3 relative overflow-hidden group border border-[#3a494b]/30 hover:border-[#00dbe7]/50 transition-all">
              {isInstalled && <div className="absolute top-0 right-0 w-16 h-16 bg-[#00e476]/10 rounded-bl-full pointer-events-none" />}
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#0e0e10] border border-[#3a494b]/50 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#00dbe7] text-2xl">{p.iconSymbol}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#e5e1e4] group-hover:text-[#74f5ff] transition-colors">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-[#849495] uppercase px-2 py-0.5 bg-[#131315] rounded border border-[#3a494b]/30">{p.category}</span>
                    <span className="text-[10px] font-mono text-[#849495]">v{p.version}</span>
                    <span className="text-[10px] font-mono text-[#00e476]">{p.type}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-[#b9cacb] leading-relaxed mt-2 line-clamp-3">{p.description}</p>
              
              <div className="mt-auto pt-4 flex gap-3">
                {isInstalled ? (
                  <button onClick={() => handleUninstall(p.id, p.name)} className="flex-1 py-2 rounded text-xs font-mono font-bold uppercase border border-[#ffb4ab]/30 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors">
                    Uninstall
                  </button>
                ) : (
                  <button onClick={() => handleInstall(p.id, p.name)} className="flex-1 py-2 rounded text-xs font-mono font-bold uppercase bg-[#00dbe7] text-[#002022] hover:brightness-110 transition-all">
                    Install Plugin
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
