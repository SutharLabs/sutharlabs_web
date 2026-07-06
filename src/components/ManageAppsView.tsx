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

export default function ManageAppsView({ logs, onAddLog, userToken }: ManageProps) {
  const [plugins, setPlugins] = useState<StorePlugin[]>([]);
  const [newPlugin, setNewPlugin] = useState({
    name: '', category: 'Productivity', type: 'Free' as const, description: '', iconSymbol: 'smart_toy', tagsString: '', rating: 5.0
  });
  const [selectedAppFile, setSelectedAppFile] = useState<File | null>(null);

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

  const handlePublishPlugin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlugin.name) return;

    if (selectedAppFile) {
      await uploadFile(selectedAppFile);
      setSelectedAppFile(null);
    }

    try {
      const response = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
          name: newPlugin.name, category: newPlugin.category, type: newPlugin.type, description: newPlugin.description,
          iconSymbol: newPlugin.iconSymbol, tags: newPlugin.tagsString.split(',').map(t => t.trim()).filter(Boolean),
          rating: newPlugin.rating, downloads: '0'
        })
      });
      
      if (!response.ok) throw new Error('Failed to publish');
      const created = await response.json();
      setPlugins(prev => [...prev, created]);
      setNewPlugin({ name: '', category: 'Productivity', type: 'Free', description: '', iconSymbol: 'smart_toy', tagsString: '', rating: 5.0 });
      onAddLog({ timestamp: new Date().toLocaleTimeString(), type: 'SUCCESS', message: `ADMIN: Published new app to store.` });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlugin = async (id: string, name: string) => {
    if (confirm(`Unpublish app "${name}"?`)) {
      try {
        const response = await fetch(`/api/plugins/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${userToken}` } });
        if (response.ok) setPlugins(prev => prev.filter(p => p.id !== id));
      } catch (err) { console.error(err); }
    }
  };

  useEffect(() => {
    fetch('/api/plugins').then(r => r.json()).then(data => setPlugins(data)).catch(console.error);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="glass-panel p-4 sm:p-6 rounded-lg border border-outline/20 flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center gap-3 border-b border-outline/20 pb-3">
          <span className="material-symbols-outlined text-tertiary text-2xl">storefront</span>
          <div>
            <h3 className="text-on-surface font-bold">App Store Control</h3>
            <p className="text-[10px] font-mono text-on-surface-variant">Manage public app catalog</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-on-surface">Live Store Inventory</h4>
            <div className="space-y-2">
              {plugins.map(p => (
                <div key={p.id} className="p-3 bg-surface-container-low border border-outline/30 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">{p.iconSymbol}</span>
                    <div><div className="text-sm font-bold text-on-surface">{p.name}</div><div className="text-[10px] text-on-surface-variant">{p.category} | {p.type}</div></div>
                  </div>
                  <button onClick={() => handleDeletePlugin(p.id, p.name)} className="text-error hover:opacity-80 p-1 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-on-surface mb-3">Publish New App</h4>
            <form onSubmit={handlePublishPlugin} className="space-y-4 bg-surface border border-outline/30 p-4 rounded">
              <div>
                <label className="block text-on-surface-variant mb-1 text-xs">App Package (.zip)</label>
                <input type="file" accept=".zip,.vsix" onChange={(e) => setSelectedAppFile(e.target.files ? e.target.files[0] : null)} className="w-full text-xs text-on-surface" />
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1 text-xs">Display Name</label>
                <input type="text" value={newPlugin.name} onChange={e => setNewPlugin({...newPlugin, name: e.target.value})} className="w-full bg-surface-container-high border border-outline/40 rounded p-2 text-xs text-on-surface outline-none focus:border-primary transition-all" />
              </div>
               <div>
                <label className="block text-on-surface-variant mb-1 text-xs">Category</label>
                <input type="text" value={newPlugin.category} onChange={e => setNewPlugin({...newPlugin, category: e.target.value})} className="w-full bg-surface-container-high border border-outline/40 rounded p-2 text-xs text-on-surface outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1 text-xs">Material Icon</label>
                <input type="text" value={newPlugin.iconSymbol} onChange={e => setNewPlugin({...newPlugin, iconSymbol: e.target.value})} className="w-full bg-surface-container-high border border-outline/40 rounded p-2 text-xs text-on-surface outline-none focus:border-primary transition-all" />
              </div>
              <button type="submit" className="w-full py-2 bg-primary text-on-primary text-xs font-bold rounded hover:opacity-90 transition-opacity">PUBLISH APP</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
