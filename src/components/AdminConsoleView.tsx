import React, { useState, useEffect } from 'react';
import { RegisteredUser, TerminalLog, StorePlugin } from '../types';
import { 
  Users, 
  Activity, 
  Database, 
  Globe, 
  Trash2, 
  UserPlus, 
  ShieldAlert, 
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Cpu,
  Zap,
  HardDrive,
  PlusCircle,
  Tag,
  Layers,
  Server
} from 'lucide-react';

interface AdminConsoleProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  currentUserEmail: string;
  userToken: string;
}

export default function AdminConsoleView({ logs, onAddLog, currentUserEmail, userToken }: AdminConsoleProps) {
  // Load or initialize registered users from localStorage
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Developer' as const });
  const [activeAdminTab, setActiveAdminTab] = useState<'DASHBOARD' | 'APP_STORE' | 'WORKSPACE_PLUGINS' | 'PORTFOLIOS'>('DASHBOARD');
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [workspacePlugins, setWorkspacePlugins] = useState<any[]>([]);

  // Store management states
  const [plugins, setPlugins] = useState<StorePlugin[]>([]);
  const [newPlugin, setNewPlugin] = useState({
    name: '',
    category: 'MCP',
    type: 'Free' as 'Free' | 'Premium' | 'Trial',
    downloads: '1.2k',
    rating: 4.8,
    description: '',
    iconSymbol: 'smart_toy',
    tagsString: 'MCP, Developer'
  });
  const [pluginError, setPluginError] = useState('');
  const [pluginSuccess, setPluginSuccess] = useState('');

  // Load store plugins from real backend REST API
  const fetchPlugins = async () => {
    try {
      const response = await fetch('/api/plugins');
      if (response.ok) {
        const data = await response.json();
        setPlugins(data);
      }
    } catch (err) {
      console.error('Error fetching registry plugins in Admin:', err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const pRes = await fetch('/api/admin/portfolios', { headers: { 'Authorization': `Bearer ${userToken}` } });
      if (pRes.ok) setPortfolios(await pRes.json());
      const wpRes = await fetch('/api/workspace-plugins');
      if (wpRes.ok) setWorkspacePlugins(await wpRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPlugins();
    fetchAdminData();
    const interval = setInterval(() => {
      fetchPlugins();
      fetchAdminData();
    }, 5000);
    return () => clearInterval(interval);
  }, [userToken]);

  const handleAddPluginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPluginError('');
    setPluginSuccess('');

    if (!newPlugin.name.trim() || !newPlugin.description.trim()) {
      setPluginError('Name and Description are required parameters.');
      return;
    }

    try {
      const response = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          name: newPlugin.name,
          category: newPlugin.category,
          type: newPlugin.type,
          downloads: newPlugin.downloads || '0k',
          rating: Number(newPlugin.rating) || 5.0,
          description: newPlugin.description,
          iconSymbol: newPlugin.iconSymbol,
          tags: newPlugin.tagsString.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setPluginError(errData.error || 'Failed to publish plugin on server backend.');
        return;
      }

      const created = await response.json();
      setPlugins(prev => [...prev, created]);
      setNewPlugin({
        name: '',
        category: 'MCP',
        type: 'Free',
        downloads: '1.2k',
        rating: 4.8,
        description: '',
        iconSymbol: 'smart_toy',
        tagsString: 'MCP, Developer'
      });
      setPluginSuccess(`Plugin ${created.name} published successfully!`);

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `ADMIN: Published new MCP storefront plugin to backend database: "${created.name}" [category: ${created.category}, type: ${created.type}].`
      });
    } catch (err) {
      setPluginError('Failed to publish plugin due to server connection error.');
    }
  };

  const handleDeletePlugin = async (id: string, name: string) => {
    if (confirm(`Unpublish and purge the plugin listing for "${name}"?`)) {
      try {
        const response = await fetch(`/api/plugins/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${userToken}` }
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(errData.error || 'Failed to delete plugin.');
          return;
        }

        setPlugins(prev => prev.filter(p => p.id !== id));
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          message: `ADMIN: Purged and unpublished MCP plugin listings index on backend for: "${name}".`
        });
      } catch (err) {
        console.error('Failed to delete plugin:', err);
      }
    }
  };
  const [systemActive, setSystemActive] = useState(true);
  const [cpuUsage, setCpuUsage] = useState(38);
  const [memoryUsage, setMemoryUsage] = useState(54);
  const [requestRate, setRequestRate] = useState(128);
  const [syncStatus, setSyncStatus] = useState<'Synchronous' | 'De-synced'>('Synchronous');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Simulation state
  const [multiplier, setMultiplier] = useState(1);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch corporate users registry:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, [userToken]);

  // Telemetry fluctuation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => {
        const delta = (Math.random() - 0.5) * 8 * multiplier;
        return Math.max(12, Math.min(98, Math.round(prev + delta)));
      });
      setMemoryUsage((prev) => {
        const delta = (Math.random() - 0.5) * 4 * multiplier;
        return Math.max(25, Math.min(95, Math.round(prev + delta)));
      });
      setRequestRate((prev) => {
        const delta = (Math.random() - 0.5) * 20 * multiplier;
        return Math.max(40, Math.round(prev + delta));
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [multiplier]);

  // Handle User Registration manually inside admin cockpit
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newUser.name.trim() || !newUser.email.trim()) {
      setErrorMsg('Name and Email are required parameters.');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to provision account.');
        return;
      }

      setUsers(prev => [...prev, data]);
      setNewUser({ name: '', email: '', role: 'Developer' });
      setSuccessMsg(`User ${data.name} provisioned successfully!`);

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `ADMIN: Manual account initialization completed for ${data.email} under role ${data.role}.`
      });
    } catch (err) {
      setErrorMsg('Server database connection error.');
    }
  };

  // Change user authorization rank/role
  const handleRoleChange = async (userId: string, targetRole: 'Admin' | 'Developer' | 'Banned') => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser.email === currentUserEmail) {
      alert("Self-modification of administrative status is locked.");
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ role: targetRole })
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Failed to update role.');
        return;
      }

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: targetRole } : u));
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ALERT',
        message: `ADMIN: User role for ${targetUser.email} mutated to [${targetRole}].`
      });
    } catch (err) {
      console.error('Failed to change user role:', err);
    }
  };

  // Purge User record from memory store
  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser.email === currentUserEmail) {
      alert("Self-deletion of active workspace controller is locked.");
      return;
    }

    if (confirm(`Are you sure you want to permanently delete user record for ${targetUser.name}?`)) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${userToken}` }
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(errData.error || 'Failed to purge user.');
          return;
        }

        setUsers(prev => prev.filter(u => u.id !== userId));
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          message: `ADMIN: User index permanently deleted: ${targetUser.email}. Security tokens cleared.`
        });
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  // Execute stress testing
  const initiateUsageSpike = () => {
    setMultiplier(4);
    setCpuUsage(89);
    setRequestRate(445);
    setMemoryUsage(78);
    
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'ALERT',
      message: 'ALERT: Initiating simulated stress payload! High incoming WebSocket queries from 3Edge Servers.'
    });

    setTimeout(() => {
      setMultiplier(1);
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: 'SUCCESS: Stress payload throttled. Auto-balancing load profiles re-stabilized servers.'
      });
    }, 6000);
  };

  // Toggle Maintenance Mode
  const toggleMaintenance = () => {
    setSystemActive(!systemActive);
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'ALERT',
      message: `ADMIN: Maintenance toggle activated. System-wide user portal state set to ${!systemActive ? 'ACTIVE' : 'MAINTENANCE_LOCKED'}.`
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#3a494b]/20 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#e5e1e4] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ce5dff] animate-ping"></span>
            Admin Command Center
          </h2>
          <p className="text-xs text-[#b9cacb]/80 font-mono mt-1">
            System coordinates, server orchestration, and secure credentials management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMaintenance}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
              systemActive 
                ? 'bg-[#1a2f21] text-[#00e476] border-[#00e476]/30' 
                : 'bg-[#3b1219] text-[#ffb4ab] border-[#ffb4ab]/30'
            }`}
          >
            {systemActive ? (
              <>
                <ToggleRight className="text-[#00e476] w-4 h-4" />
                System Active
              </>
            ) : (
              <>
                <ToggleLeft className="text-[#ffb4ab] w-4 h-4" />
                Maint. Locked
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={initiateUsageSpike}
            className="px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border bg-[#1a2c31] text-[#74f5ff] border-[#00dbe7]/30 hover:bg-[#00dbe7]/20 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">{systemActive ? 'CheckCircle' : 'ShieldAlert'}</span>
            {systemActive ? 'ACTIVE' : 'MAINTENANCE'}
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-[#3a494b]/20 pb-0">
        {(['DASHBOARD', 'APP_STORE', 'WORKSPACE_PLUGINS', 'PORTFOLIOS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveAdminTab(tab)}
            className={`px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider transition-all border-b-2 ${
              activeAdminTab === tab 
                ? 'text-[#00dbe7] border-[#00dbe7]' 
                : 'text-[#849495] border-transparent hover:text-[#b9cacb]'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {activeAdminTab === 'DASHBOARD' && (
        <>
          {/* Aggregate Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Core CPU Utilization */}
            <div className="glass-panel p-4 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40">
              <div className="flex items-center justify-between mb-3 text-xs text-[#b9cacb] font-mono">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Cpu className="w-4 h-4 text-[#00e476]" />
                  Edge CPU Usage
                </span>
                <span className={`${cpuUsage > 80 ? 'text-[#ffb4ab] font-bold' : 'text-[#00e476]'}`}>{cpuUsage}%</span>
              </div>
              <div className="w-full bg-[#1b1b1f] h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${cpuUsage}%` }} 
                  className={`h-full transition-all duration-700 ${
                    cpuUsage > 80 ? 'bg-[#ffb4ab]' : cpuUsage > 60 ? 'bg-[#ce5dff]' : 'bg-[#00e476]'
                  }`}
                ></div>
              </div>
              <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">Allocated: 12 Cores / Xeon E-2388</span>
            </div>

            {/* JVM/Memory Pool */}
            <div className="glass-panel p-4 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40">
              <div className="flex items-center justify-between mb-3 text-xs text-[#b9cacb] font-mono">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <HardDrive className="w-4 h-4 text-[#74f5ff]" />
                  Memory Pool (RAM)
                </span>
                <span className="text-[#00dbe7]">{memoryUsage}%</span>
              </div>
              <div className="w-full bg-[#1b1b1f] h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${memoryUsage}%` }} 
                  className="h-full bg-[#00dbe7] transition-all duration-700"
                ></div>
              </div>
              <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">Used: {(16 * memoryUsage / 100).toFixed(1)} GB / 16.0 GB</span>
            </div>

            {/* Global Request Rate */}
            <div className="glass-panel p-4 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40">
              <div className="flex items-center justify-between mb-3 text-xs text-[#b9cacb] font-mono">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <TrendingUp className="w-4 h-4 text-[#ce5dff]" />
                  API Requests/s
                </span>
                <span className="text-[#ce5dff] font-bold">{requestRate} r/s</span>
              </div>
              <div className="w-full bg-[#1b1b1f] h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${Math.min(100, (requestRate / 500) * 100)}%` }} 
                  className="h-full bg-[#ce5dff] transition-all duration-700"
                ></div>
              </div>
              <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">Avg Response Latency: 12.8ms</span>
            </div>

            {/* WebSocket Sync Nodes */}
            <div className="glass-panel p-4 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40">
              <div className="flex items-center justify-between mb-3 text-xs text-[#b9cacb] font-mono">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Globe className="w-4 h-4 text-amber-400" />
                  Gateway Peers
                </span>
                <span className="text-[#ebb2ff]">99.99%</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-[#e5e1e4]">24 Active</span>
                <span className="px-1.5 py-0.5 rounded bg-[#00e476]/10 text-[#00e476] border border-[#00e476]/25 text-[9px] font-mono">GMT TLS</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono mt-1.5 block">Data Replication Target: US-East-H</span>
            </div>
          </div>

          {/* Main Panel Content (Split User List + Add User Form) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* User Management List Directory Block */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-[#3a494b]/15 bg-[#131315]/20 flex flex-col space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#3a494b]/10">
                <h3 className="font-sans font-bold text-sm text-[#e5e1e4] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00dbe7]" />
                  Authorized Corporate Accounts ({users.length})
                </h3>
                <span className="text-[10px] font-mono text-gray-500 bg-[#1b1b1f] px-2 py-0.5 rounded border border-[#3a494b]/20">
                  Local DB Indexed
                </span>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto min-w-full">
                <table className="w-full text-left font-mono text-xs text-[#b9cacb]">
                  <thead>
                    <tr className="border-b border-[#3a494b]/10 text-gray-500 select-none pb-2 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 font-semibold">User Details</th>
                      <th className="py-2.5 font-semibold">Access Privilege</th>
                      <th className="py-2.5 font-semibold hidden md:table-cell">Usage Track</th>
                      <th className="py-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3a494b]/10 text-[11px]">
                    {users.map((item) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-white/[0.01] transition-all ${
                          item.role === 'Banned' ? 'opacity-50 line-through bg-red-950/5' : ''
                        }`}
                      >
                        <td className="py-3">
                          <div className="font-sans font-bold text-[#e5e1e4] text-xs">{item.name}</div>
                          <div className="text-[10px] text-gray-400 select-all">{item.email}</div>
                          <div className="text-[9px] text-gray-500 mt-0.5">Joined: {new Date(item.joinedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3">
                          <select
                            aria-label="Access privilege role selection"
                            value={item.role}
                            onChange={(e) => handleRoleChange(item.id, e.target.value as any)}
                            disabled={item.email === currentUserEmail}
                            className={`bg-[#201f21] border text-xs rounded px-2 py-1 font-mono transition-all outline-none cursor-pointer focus:ring-1 focus:ring-[#00dbe7] ${
                              item.role === 'Admin' 
                                ? 'border-[#ce5dff]/50 text-[#ebb2ff] font-bold' 
                                : item.role === 'Banned' 
                                ? 'border-red-900 text-red-400' 
                                : 'border-[#3a494b]/40 text-[#00dbe7]'
                            }`}
                          >
                            <option value="Admin">Administrator</option>
                            <option value="Developer">Developer</option>
                            <option value="Banned">Banned</option>
                          </select>
                        </td>
                        <td className="py-3 hidden md:table-cell">
                          <div className="text-[12px] font-bold text-white">{item.activityCount + (item.role !== 'Banned' ? Math.round(multiplier * Math.random() * 4) : 0)} syncs</div>
                          <span className="text-[9px] text-gray-500">API Gateway Calls</span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(item.id)}
                            disabled={item.email === currentUserEmail}
                            className="p-1.5 hover:bg-[#ffb4ab]/10 text-gray-400 hover:text-[#ffb4ab] rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="Delete User Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add New User Account Column Panel */}
            <div className="glass-panel p-5 rounded-xl border border-[#3a494b]/15 bg-[#131315]/30 flex flex-col space-y-4">
              <div className="pb-2 border-b border-[#3a494b]/10">
                <h3 className="font-sans font-bold text-sm text-[#e5e1e4] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#ebb2ff]" />
                  Provision Account
                </h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Initialize developer workspace permissions manual override.</p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-900 text-[#ffb4ab] text-[10px] font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-green-950/40 border border-green-900 text-[#61ff97] text-[10px] font-mono flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddUserSubmit} className="space-y-4 font-mono text-xs">
                <div>
                  <label htmlFor="fullname" className="block text-gray-400 mb-1">Corporate Full Name</label>
                  <input
                    id="fullname"
                    type="text"
                    placeholder="e.g. Satoshi Nakamoto"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2.5 text-[#e5e1e4] placeholder-gray-600 focus:outline-none focus:border-[#ce5dff] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-400 mb-1">Authorizing Email Coordinate</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="developer@sutharlabs.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2.5 text-[#e5e1e4] placeholder-gray-600 focus:outline-none focus:border-[#ce5dff] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="authgroup" className="block text-gray-400 mb-1">User Authorization Group</label>
                  <select
                    id="authgroup"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2.5 text-[#e5e1e4] focus:outline-none focus:border-[#ce5dff] transition-colors"
                  >
                    <option value="Developer">Developer Profile</option>
                    <option value="Admin">System Administrator</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-[#ce5dff] text-black font-semibold hover:brightness-110 tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  PROVISION CREDENTIALS
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {activeAdminTab === 'APP_STORE' && (
        <div className="glass-panel p-6 rounded-lg border border-[#3a494b]/20 bg-[#131315]/20 space-y-4">
          <div className="pb-2 border-b border-[#3a494b]/10">
            <h3 className="font-sans font-bold text-sm text-[#e5e1e4] flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#74f5ff]" />
              Publish SutharLabs Plugin / MCP
            </h3>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Registers new endpoints instantly synced with core landing page.</p>
          </div>

          {pluginError && (
            <div className="p-3 rounded bg-red-950/40 border border-red-900 text-[#ffb4ab] text-[10px] font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{pluginError}</span>
            </div>
          )}

          {pluginSuccess && (
            <div className="p-3 rounded bg-green-950/40 border border-green-900 text-[#61ff97] text-[10px] font-mono flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{pluginSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddPluginSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label htmlFor="pluginName" className="block text-gray-400 mb-1">Plugin Name</label>
              <input
                id="pluginName"
                type="text"
                placeholder="e.g. JIRA MCP Server"
                value={newPlugin.name}
                onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2 text-[#e5e1e4] placeholder-gray-600 focus:outline-none focus:border-[#74f5ff] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="pluginCategory" className="block text-gray-400 mb-1">Category</label>
                <input
                  id="pluginCategory"
                  type="text"
                  placeholder="e.g. Productivity"
                  value={newPlugin.category}
                  onChange={(e) => setNewPlugin({ ...newPlugin, category: e.target.value })}
                  className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2 text-[#e5e1e4] placeholder-gray-600 focus:outline-none focus:border-[#74f5ff] transition-colors"
                />
              </div>
              <div>
                <label htmlFor="pluginType" className="block text-gray-400 mb-1">Licensing Model</label>
                <select
                  id="pluginType"
                  value={newPlugin.type}
                  onChange={(e) => setNewPlugin({ ...newPlugin, type: e.target.value as any })}
                  className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2 text-[#e5e1e4] focus:outline-none focus:border-[#74f5ff] transition-colors"
                >
                  <option value="Free">Free</option>
                  <option value="Premium">Premium</option>
                  <option value="Trial">Trial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="pluginDownloads" className="block text-gray-400 mb-1">Downloads</label>
                <input
                  id="pluginDownloads"
                  type="text"
                  placeholder="e.g. 1.2k"
                  value={newPlugin.downloads}
                  onChange={(e) => setNewPlugin({ ...newPlugin, downloads: e.target.value })}
                  className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2 text-[#e5e1e4] focus:outline-none focus:border-[#74f5ff] transition-colors"
                />
              </div>
              <div>
                <label htmlFor="pluginRating" className="block text-gray-400 mb-1">Mock Rating (1-5)</label>
                <input
                  id="pluginRating"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={newPlugin.rating}
                  onChange={(e) => setNewPlugin({ ...newPlugin, rating: Number(e.target.value) })}
                  className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2 text-[#e5e1e4] focus:outline-none focus:border-[#74f5ff] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pluginIcon" className="block text-gray-400 mb-1">Material Icon Symbol</label>
              <select
                id="pluginIcon"
                value={newPlugin.iconSymbol}
                onChange={(e) => setNewPlugin({ ...newPlugin, iconSymbol: e.target.value })}
                className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2 text-[#e5e1e4] focus:outline-none focus:border-[#74f5ff]"
              >
                <option value="smart_toy">smart_toy (AI Robot)</option>
                <option value="database">database (Database Vector)</option>
                <option value="account_balance">account_balance (Financial Node)</option>
                <option value="terminal">terminal (Command Console)</option>
                <option value="security">security (Crypto Firewall)</option>
                <option value="cloud">cloud (Orchestrator)</option>
              </select>
            </div>

            <div>
              <label htmlFor="pluginTags" className="block text-gray-400 mb-1">Tags (comma-separated)</label>
              <input
                id="pluginTags"
                type="text"
                placeholder="e.g. JIRA, Atlassian, MCP, Productivity"
                value={newPlugin.tagsString}
                onChange={(e) => setNewPlugin({ ...newPlugin, tagsString: e.target.value })}
                className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2 text-[#e5e1e4] placeholder-gray-600 focus:outline-none focus:border-[#74f5ff] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="pluginDesc" className="block text-gray-400 mb-1">Description / Utility Scope</label>
              <textarea
                id="pluginDesc"
                rows={2}
                placeholder="Describe what the Model Context Protocol or plugin module does..."
                value={newPlugin.description}
                onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
                className="w-full bg-[#1b1b1f] border border-[#3a494b]/40 rounded p-2 text-[#e5e1e4] placeholder-gray-600 focus:outline-none focus:border-[#74f5ff] transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-[#74f5ff] text-black font-semibold hover:brightness-110 tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              PUBLISH OUTWARD MARKETPLACE
            </button>
          </form>
        </div>
      )}

      {activeAdminTab === 'WORKSPACE_PLUGINS' && (
        <div className="glass-panel p-6 rounded-lg border border-[#3a494b]/20 flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-[#3a494b]/20 pb-3">
            <span className="material-symbols-outlined text-[#00dbe7] text-2xl">extension</span>
            <div>
              <h3 className="text-[#e5e1e4] font-bold">Workspace Plugins Inventory</h3>
              <p className="text-[10px] font-mono text-[#849495]">Manage internal workspace extensions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workspacePlugins.map(wp => (
              <div key={wp.id} className="p-4 bg-[#131315] border border-[#3a494b]/30 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-[#00dbe7]">{wp.iconSymbol}</span>
                    <div>
                      <div className="text-[#e5e1e4] font-bold text-sm">{wp.name}</div>
                      <div className="text-[#849495] font-mono text-[9px]">v{wp.version} | {wp.category}</div>
                    </div>
                  </div>
                  <button className="text-[#ffb4ab] hover:bg-[#ffb4ab]/10 p-1 rounded transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
                <p className="text-xs text-[#b9cacb] mt-2 line-clamp-2">{wp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === 'PORTFOLIOS' && (
        <div className="glass-panel p-6 rounded-lg border border-[#3a494b]/20 flex flex-col gap-4">
           <div className="flex items-center gap-3 border-b border-[#3a494b]/20 pb-3">
            <span className="material-symbols-outlined text-[#ce5dff] text-2xl">account_balance_wallet</span>
            <div>
              <h3 className="text-[#e5e1e4] font-bold">User Portfolios</h3>
              <p className="text-[10px] font-mono text-[#849495]">View all active user trading portfolios</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[#849495] uppercase tracking-wider border-b border-[#3a494b]/20 bg-[#131315]">
                <tr>
                  <th className="py-2 px-3">User</th>
                  <th className="py-2 px-3">Cash Balance</th>
                  <th className="py-2 px-3">Positions</th>
                  <th className="py-2 px-3">Avg Buy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a494b]/10">
                {portfolios.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3">
                      <div className="text-[#e5e1e4]">{p.user?.name}</div>
                      <div className="text-[9px] text-[#849495]">{p.userEmail}</div>
                    </td>
                    <td className="py-3 px-3 text-[#00e476]">${p.cash.toFixed(2)}</td>
                    <td className="py-3 px-3 text-[#ebb2ff]">{p.shares} shares</td>
                    <td className="py-3 px-3 text-[#b9cacb]">${p.buyPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System simulation logs drawer */}
      <div className="glass-panel p-4 rounded-xl border border-[#3a494b]/15 bg-black/40 overflow-hidden flex flex-col h-48">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2 select-none border-b border-[#3a494b]/10 pb-1.5 flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#ce5dff]" />
          ADMIN PRIVILEGED TELEMETRY AUDIT
        </span>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-[#b9cacb] space-y-1 custom-scrollbar">
          {logs.filter(l => l.message.includes('ADMIN') || l.message.includes('ALERT') || l.message.includes('SUCCESS')).slice(-12).reverse().map((log, index) => (
            <div key={index} className="flex gap-2 p-1 rounded hover:bg-white/[0.02]">
              <span className="text-gray-500 text-[9px]">{log.timestamp}</span>
              <span className={`font-bold ${
                log.type === 'SUCCESS' ? 'text-[#00e476]' : log.type === 'ERROR' ? 'text-[#ffb4ab]' : log.type === 'ALERT' ? 'text-amber-400' : 'text-[#74f5ff]'
              }`}>[{log.type}]</span>
              <span className="text-[#e5e1e4]">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
