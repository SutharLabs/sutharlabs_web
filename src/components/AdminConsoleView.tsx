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
  theme?: 'light' | 'dark';
}

export default function AdminConsoleView({ logs, onAddLog, currentUserEmail, userToken, theme = 'dark' }: AdminConsoleProps) {
  const isLight = theme === 'light';
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

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    subtext?: string;
    icon: 'delete' | 'warning';
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    icon: 'delete',
    onConfirm: () => {}
  });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, open: false }));

  // Credential reveal modal (shown once after provisioning)
  const [credentialModal, setCredentialModal] = useState<{
    open: boolean;
    name: string;
    email: string;
    password: string;
    copied: boolean;
  }>({
    open: false,
    name: '',
    email: '',
    password: '',
    copied: false
  });

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
    setConfirmModal({
      open: true,
      title: 'Unpublish Plugin',
      message: `Purge "${name}" from the plugin registry?`,
      subtext: 'This will permanently remove the plugin listing from the store. Installed instances will not be affected.',
      icon: 'warning',
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const response = await fetch(`/api/plugins/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${userToken}` }
          });

          if (!response.ok) {
            const errData = await response.json();
            setPluginError(errData.error || 'Failed to delete plugin.');
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
    });
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

      // Show one-time credential reveal modal
      setCredentialModal({
        open: true,
        name: data.name,
        email: data.email,
        password: data.temporaryPassword,
        copied: false
      });

      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `ADMIN: Manual account initialization completed for ${data.email} under role ${data.role}. Temporary credentials issued.`
      });
    } catch (err) {
      setErrorMsg('Server database connection error.');
    }
  };

  // Change user authorization rank/role
  const handleRoleChange = async (userId: string, targetRole: 'Admin' | 'Developer' | 'Banned' | 'Pending') => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser.email === currentUserEmail) {
      setConfirmModal({
        open: true,
        title: 'Action Blocked',
        message: 'Self-role modification is locked.',
        subtext: 'You cannot change your own administrator role while logged in.',
        icon: 'warning',
        onConfirm: closeConfirmModal
      });
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
        setConfirmModal({
          open: true,
          title: 'Role Update Failed',
          message: errData.error || 'Failed to update role.',
          icon: 'warning',
          onConfirm: closeConfirmModal
        });
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
      setConfirmModal({
        open: true,
        title: 'Action Blocked',
        message: 'Self-deletion is locked.',
        subtext: 'The active workspace administrator account cannot be deleted while logged in.',
        icon: 'warning',
        onConfirm: closeConfirmModal
      });
      return;
    }

    setConfirmModal({
      open: true,
      title: 'Delete User Record',
      message: `Permanently delete "${targetUser.name}"?`,
      subtext: `This will purge ${targetUser.email} from the registry along with their portfolio and workspace data. This action cannot be undone.`,
      icon: 'delete',
      onConfirm: async () => {
        closeConfirmModal();
        try {
          const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${userToken}` }
          });

          if (!response.ok) {
            const errData = await response.json();
            setPluginError(errData.error || 'Failed to purge user.');
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
    });
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

      {/* ===== CREDENTIAL REVEAL MODAL ===== */}
      {credentialModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-[fadeInScale_0.2s_ease-out]"
            style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--secondary-color)',
            }}
          >
            <div className="bg-gradient-to-r from-purple-500 to-fuchsia-400 h-1.5 w-full" />
            <div className="p-6">
              <div className="flex flex-col items-center text-center space-y-3 mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400 mb-2 border border-purple-500/30">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--on-surface-color)' }}>Account Provisioned</h3>
                <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant-color)' }}>
                  A temporary access key has been generated for {credentialModal.email}
                </p>
                <div className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  This credential will only be shown once.
                </div>
              </div>

              <div 
                className="bg-black/20 p-4 rounded-xl border border-dashed border-purple-500/40 relative group cursor-pointer hover:bg-black/30 transition-all flex items-center justify-between"
                onClick={() => {
                  navigator.clipboard.writeText(credentialModal.password);
                  setCredentialModal(p => ({ ...p, copied: true }));
                }}
              >
                <div className="font-mono text-lg tracking-wider text-[#ce5dff] font-bold select-all">
                  {credentialModal.password}
                </div>
                <div className="flex flex-col items-center text-[10px] text-on-surface-variant font-mono">
                  {credentialModal.copied ? <CheckCircle className="w-4 h-4 text-green-400 mb-1" /> : <ShieldAlert className="w-4 h-4 mb-1" />}
                  {credentialModal.copied ? 'COPIED' : 'COPY'}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setCredentialModal(p => ({ ...p, open: false }))}
                  className="w-full py-2.5 rounded-lg font-bold text-sm transition-all"
                  style={{
                    background: 'var(--secondary-color)',
                    color: 'var(--on-secondary-color)'
                  }}
                >
                  ACKNOWLEDGE & CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CUSTOM CONFIRMATION MODAL ===== */}
      {confirmModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeConfirmModal(); }}
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[fadeInScale_0.18s_ease-out]"
            style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--outline-variant-color)',
            }}
          >
            {/* Coloured accent top bar */}
            <div className={`h-1 w-full ${confirmModal.icon === 'delete' ? 'bg-gradient-to-r from-red-500 to-red-300' : 'bg-gradient-to-r from-amber-500 to-yellow-300'}`} />

            <div className="p-6">
              {/* Icon + title */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: confirmModal.icon === 'delete' ? 'var(--error-container-color)' : 'color-mix(in srgb, #f59e0b 15%, var(--surface-container-color))',
                    border: `1px solid ${confirmModal.icon === 'delete' ? 'var(--error-color)' : '#f59e0b'}`,
                    opacity: 0.9
                  }}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: confirmModal.icon === 'delete' ? 'var(--error-color)' : '#d97706' }}
                  >
                    {confirmModal.icon === 'delete' ? 'delete_forever' : 'warning'}
                  </span>
                </div>
                <div>
                  <h3
                    className="text-[15px] font-bold tracking-tight"
                    style={{ color: 'var(--on-surface-color)' }}
                  >
                    {confirmModal.title}
                  </h3>
                  <p
                    className="text-[13px] mt-0.5 font-medium"
                    style={{ color: 'var(--on-surface-color)' }}
                  >
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              {/* Subtext */}
              {confirmModal.subtext && (
                <p
                  className="text-[12px] leading-relaxed mb-5 pl-[60px] -mt-1"
                  style={{ color: 'var(--on-surface-variant-color)' }}
                >
                  {confirmModal.subtext}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer hover:opacity-80"
                  style={{
                    color: 'var(--on-surface-variant-color)',
                    background: 'var(--surface-container-color)',
                    border: '1px solid var(--outline-variant-color)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer hover:opacity-80"
                  style={confirmModal.icon === 'delete' ? {
                    color: 'var(--on-error-color)',
                    background: 'var(--error-color)',
                    border: '1px solid var(--error-color)',
                  } : {
                    color: '#ffffff',
                    background: '#d97706',
                    border: '1px solid #d97706',
                  }}
                >
                  {confirmModal.icon === 'delete' ? 'Delete' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline/20 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ce5dff] animate-ping"></span>
            Admin Command Center
          </h2>
          <p className="text-xs text-on-surface-variant font-mono mt-1">
            System coordinates, server orchestration, and secure credentials management.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
          <button
            type="button"
            onClick={toggleMaintenance}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
              systemActive 
                ? isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-sm' 
                  : 'bg-[#1a2f21] text-[#00e476] border-[#00e476]/30 hover:bg-[#1a2f21]/80 shadow-sm'
                : isLight
                  ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 shadow-sm'
                  : 'bg-[#3b1219] text-[#ffb4ab] border-[#ffb4ab]/30 hover:bg-[#3b1219]/80 shadow-sm'
            }`}
          >
            {systemActive ? (
              <>
                <ToggleRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-700' : 'text-[#00e476]'}`} />
                System Active
              </>
            ) : (
              <>
                <ToggleLeft className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-700' : 'text-[#ffb4ab]'}`} />
                Maint. Locked
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={initiateUsageSpike}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
              systemActive
                ? isLight
                  ? 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 shadow-sm'
                  : 'bg-[#1a2c31] text-[#74f5ff] border-[#00dbe7]/30 hover:bg-[#00dbe7]/20 shadow-sm'
                : isLight
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-sm'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-950/60 shadow-sm'
            }`}
          >
            {systemActive ? (
              <CheckCircle className={`w-4 h-4 shrink-0 ${isLight ? 'text-sky-700' : 'text-[#00dbe7]'}`} />
            ) : (
              <ShieldAlert className={`w-4 h-4 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
            )}
            {systemActive ? 'ACTIVE' : 'MAINTENANCE'}
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex overflow-x-auto whitespace-nowrap gap-2 border-b border-outline/20 pb-0 w-full snap-x">
        {(['DASHBOARD', 'APP_STORE', 'WORKSPACE_PLUGINS', 'PORTFOLIOS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveAdminTab(tab)}
            className={`px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider transition-all border-b-2 shrink-0 snap-start ${
              activeAdminTab === tab 
                ? 'text-[#00dbe7] border-[#00dbe7]' 
                : 'text-on-surface-variant border-transparent hover:text-[#b9cacb]'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {activeAdminTab === 'DASHBOARD' && (
        <>
          {/* Aggregate Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Core CPU Utilization */}
            <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
              <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant font-mono">
                <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                  <Cpu className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-[#00e476]'}`} />
                  Edge CPU Usage
                </span>
                <span className={`${cpuUsage > 80 ? 'text-[#ffb4ab] font-bold' : isLight ? 'text-emerald-700 font-semibold' : 'text-[#00e476]'}`}>{cpuUsage}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${cpuUsage}%` }} 
                  className={`h-full transition-all duration-700 ${
                    cpuUsage > 80 ? 'bg-[#ffb4ab]' : cpuUsage > 60 ? 'bg-[#ce5dff]' : isLight ? 'bg-emerald-500' : 'bg-[#00e476]'
                  }`}
                ></div>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono mt-1.5 block">Allocated: 12 Cores / Xeon E-2388</span>
            </div>

            {/* JVM/Memory Pool */}
            <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
              <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant font-mono">
                <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                  <HardDrive className={`w-4 h-4 shrink-0 ${isLight ? 'text-sky-600' : 'text-[#74f5ff]'}`} />
                  Memory Pool (RAM)
                </span>
                <span className={isLight ? 'text-sky-700 font-semibold' : 'text-[#00dbe7]'}>{memoryUsage}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${memoryUsage}%` }} 
                  className={`h-full transition-all duration-700 ${isLight ? 'bg-sky-500' : 'bg-[#00dbe7]'}`}
                ></div>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono mt-1.5 block">Used: {(16 * memoryUsage / 100).toFixed(1)} GB / 16.0 GB</span>
            </div>

            {/* Global Request Rate */}
            <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
              <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant font-mono">
                <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                  <TrendingUp className={`w-4 h-4 shrink-0 ${isLight ? 'text-purple-600' : 'text-[#ce5dff]'}`} />
                  API Requests/s
                </span>
                <span className={`${isLight ? 'text-purple-700' : 'text-[#ce5dff]'} font-bold`}>{requestRate} r/s</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${Math.min(100, (requestRate / 500) * 100)}%` }} 
                  className={`h-full transition-all duration-700 ${isLight ? 'bg-purple-500' : 'bg-[#ce5dff]'}`}
                ></div>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono mt-1.5 block">Avg Response Latency: 12.8ms</span>
            </div>

            {/* WebSocket Sync Nodes */}
            <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
              <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant font-mono">
                <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                  <Globe className={`w-4 h-4 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  Gateway Peers
                </span>
                <span className={isLight ? 'text-purple-700 font-semibold' : 'text-[#ebb2ff]'}>99.99%</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-on-surface">24 Active</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-[#00e476]/10 text-[#00e476] border-[#00e476]/25'}`}>GMT TLS</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono mt-1.5 block">Data Replication Target: US-East-H</span>
            </div>
          </div>

          {/* Main Panel Content (Split User List + Add User Form) */}
          <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">
            
            {/* User Management List Directory Block */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-outline/15 bg-surface-container-low/20 flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 pb-2 border-b border-outline/10">
                <h3 className="font-sans font-bold text-sm text-on-surface flex items-center gap-2">
                  <Users className={`w-4 h-4 shrink-0 ${isLight ? 'text-sky-600' : 'text-[#00dbe7]'}`} />
                  Authorized Corporate Accounts ({users.length})
                </h3>
                <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline/20">
                  Local DB Indexed
                </span>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto min-w-full">
                <table className="w-full text-left font-mono text-xs text-[#b9cacb]">
                  <thead>
                    <tr className="border-b border-outline/10 text-on-surface-variant select-none pb-2 text-[10px] uppercase tracking-wider">
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
                          <div className="font-sans font-bold text-on-surface text-xs">{item.name}</div>
                          <div className="text-[10px] text-on-surface-variant select-all">{item.email}</div>
                          <div className="text-[9px] text-on-surface-variant mt-0.5">Joined: {new Date(item.joinedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3">
                          <select
                            aria-label="Access privilege role selection"
                            value={item.role}
                            onChange={(e) => handleRoleChange(item.id, e.target.value as any)}
                            disabled={item.email === currentUserEmail}
                            className={`bg-surface border text-xs rounded px-2 py-1 font-mono transition-all outline-none cursor-pointer focus:ring-1 focus:ring-[#00dbe7] ${
                              item.role === 'Admin' 
                                ? 'border-[#ce5dff]/50 text-[#ebb2ff] font-bold' 
                                : item.role === 'Banned' 
                                ? 'border-red-900 text-red-400' 
                                : item.role === 'Pending'
                                ? 'border-amber-500/50 text-amber-500 font-bold'
                                : 'border-outline/40 text-[#00dbe7]'
                            }`}
                          >
                            <option value="Admin">Administrator</option>
                            <option value="Developer">Developer</option>
                            <option value="Pending">Pending Approval</option>
                            <option value="Banned">Banned</option>
                          </select>
                        </td>
                        <td className="py-3 hidden md:table-cell">
                          <div className="text-[12px] font-bold text-on-surface">{item.activityCount + (item.role !== 'Banned' ? Math.round(multiplier * Math.random() * 4) : 0)} syncs</div>
                          <span className="text-[9px] text-on-surface-variant">API Gateway Calls</span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(item.id)}
                            disabled={item.email === currentUserEmail}
                            className={`p-1.5 rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer ${
                              isLight ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600' : 'hover:bg-[#ffb4ab]/10 text-on-surface-variant hover:text-[#ffb4ab]'
                            }`}
                            title="Delete User Record"
                          >
                            <Trash2 className="w-4 h-4 shrink-0" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Provision Account Panel */}
            <div
              className="rounded-xl flex flex-col space-y-4 p-5"
              style={{
                background: 'var(--surface-container-low-color)',
                border: '1px solid var(--outline-variant-color)'
              }}
            >
              <div
                className="pb-3 mb-1"
                style={{ borderBottom: '1px solid var(--outline-variant-color)' }}
              >
                <h3
                  className="font-sans font-bold text-sm flex items-center gap-2"
                  style={{ color: 'var(--on-surface-color)' }}
                >
                  <UserPlus className="w-4 h-4" style={{ color: 'var(--secondary-color)' }} />
                  Provision Account
                </h3>
                <p
                  className="text-[10px] font-mono mt-0.5"
                  style={{ color: 'var(--on-surface-variant-color)' }}
                >
                  Initialize developer workspace permissions manual override.
                </p>
              </div>

              {errorMsg && (
                <div
                  className="p-3 rounded-lg text-[10px] font-mono flex items-center gap-2"
                  style={{
                    background: 'var(--error-container-color)',
                    border: '1px solid var(--error-color)',
                    color: 'var(--on-error-container-color)'
                  }}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  className="p-3 rounded-lg text-[10px] font-mono flex items-center gap-2"
                  style={{
                    background: 'var(--tertiary-container-color)',
                    border: '1px solid var(--tertiary-color)',
                    color: 'var(--on-tertiary-container-color)'
                  }}
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddUserSubmit} className="space-y-4 font-mono text-xs">
                <div>
                  <label
                    htmlFor="fullname"
                    className="block mb-1.5 text-[11px] font-semibold"
                    style={{ color: 'var(--on-surface-variant-color)' }}
                  >
                    Corporate Full Name
                  </label>
                  <input
                    id="fullname"
                    type="text"
                    placeholder="e.g. Satoshi Nakamoto"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full rounded p-2.5 focus:outline-none transition-colors"
                    style={{
                      background: 'var(--surface-color)',
                      border: '1px solid var(--outline-variant-color)',
                      color: 'var(--on-surface-color)',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--secondary-color)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--outline-variant-color)')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block mb-1.5 text-[11px] font-semibold"
                    style={{ color: 'var(--on-surface-variant-color)' }}
                  >
                    Authorizing Email Coordinate
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="developer@sutharlabs.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full rounded p-2.5 focus:outline-none transition-colors"
                    style={{
                      background: 'var(--surface-color)',
                      border: '1px solid var(--outline-variant-color)',
                      color: 'var(--on-surface-color)',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--secondary-color)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--outline-variant-color)')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="authgroup"
                    className="block mb-1.5 text-[11px] font-semibold"
                    style={{ color: 'var(--on-surface-variant-color)' }}
                  >
                    User Authorization Group
                  </label>
                  <select
                    id="authgroup"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full rounded p-2.5 focus:outline-none transition-colors"
                    style={{
                      background: 'var(--surface-color)',
                      border: '1px solid var(--outline-variant-color)',
                      color: 'var(--on-surface-color)',
                    }}
                  >
                    <option value="Developer">Developer Profile</option>
                    <option value="Admin">System Administrator</option>
                    <option value="Pending">Pending Approval</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded font-semibold hover:opacity-90 tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                  style={{
                    background: 'var(--secondary-color)',
                    color: 'var(--on-secondary-color)'
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                  PROVISION CREDENTIALS
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* System simulation logs drawer */}
      <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-black/40 overflow-hidden flex flex-col h-48">
        <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest block mb-2 select-none border-b border-outline/10 pb-1.5 flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#ce5dff]" />
          ADMIN PRIVILEGED TELEMETRY AUDIT
        </span>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-[#b9cacb] space-y-1 custom-scrollbar">
          {logs.filter(l => l.message.includes('ADMIN') || l.message.includes('ALERT') || l.message.includes('SUCCESS')).slice(-12).reverse().map((log, index) => (
            <div key={index} className="flex gap-2 p-1 rounded hover:bg-white/[0.02]">
              <span className="text-on-surface-variant text-[9px]">{log.timestamp}</span>
              <span className={`font-bold ${
                log.type === 'SUCCESS' ? 'text-[#00e476]' : log.type === 'ERROR' ? 'text-[#ffb4ab]' : log.type === 'ALERT' ? 'text-amber-400' : 'text-[#74f5ff]'
              }`}>[{log.type}]</span>
              <span className="text-on-surface">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
