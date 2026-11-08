import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisteredUser, TerminalLog } from '../types';
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
  RefreshCw,
  Bot,
  Layers,
  Server,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  Gauge,
  Radio,
  Sparkles
} from 'lucide-react';
import CollapsibleLogDrawer from './CollapsibleLogDrawer';

export interface NodeServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'standby' | 'warning';
  port?: number;
  details?: string;
}

export interface NodeTelemetry {
  id: string;
  name: string;
  role: string;
  host: string;
  publicIp: string;
  internalIp?: string;
  status: 'online' | 'warning' | 'offline';
  latencyMs: number;
  cpuPercent: number;
  loadAvg: [number, number, number];
  cores: number;
  memory: {
    totalMB: number;
    usedMB: number;
    freeMB: number;
    usagePercent: number;
    swapTotalMB?: number;
    swapUsedMB?: number;
  };
  processCount: {
    total: number;
    running?: number;
  };
  uptimeFormatted: string;
  uptimeSeconds: number;
  services: NodeServiceStatus[];
  disk?: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usagePercent: number;
  };
  lookbusy?: {
    active: boolean;
    targetPercent: number;
  };
  lastChecked: number;
  notes?: string;
}

export interface IncidentAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  nodeId: string;
  nodeName: string;
  title: string;
  message: string;
  timestamp: string;
}

export interface FleetTelemetry {
  fleetStatus: 'nominal' | 'degraded' | 'critical';
  summary: string;
  incidents: IncidentAlert[];
  nodes: {
    vm1: NodeTelemetry;
    vm2: NodeTelemetry;
    vm3: NodeTelemetry;
    vercel: NodeTelemetry;
  };
  timestamp: number;
}

interface SystemTelemetry {
  cpu: {
    usagePercent: number;
    model: string;
    cores: number;
    speed: string;
  };
  memory: {
    usagePercent: number;
    totalGB: number;
    usedGB: number;
    freeGB: number;
    heapUsedMB: number;
  };
  requests: {
    ratePerSec: number;
    avgLatencyMs: number;
    totalRequests: number;
  };
  system: {
    platform: string;
    arch: string;
    hostname: string;
    nodeVersion: string;
    uptimeSeconds: number;
    uptimeFormatted: string;
    isLocalhost: boolean;
    environment: string;
    database: string;
  };
}

interface AdminConsoleProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  currentUserEmail: string;
  userToken: string;
  theme?: 'light' | 'dark';
}

export default function AdminConsoleView({ logs, onAddLog, currentUserEmail, userToken, theme = 'dark' }: AdminConsoleProps) {
  const isLight = theme === 'light';
  const navigate = useNavigate();
  // Load or initialize registered users from localStorage
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Developer' as const });

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
  const [systemActive, setSystemActive] = useState(() => {
    try {
      return localStorage.getItem('sutharlabs_admin_maintenance_mode') !== 'true';
    } catch {
      return true;
    }
  });
  const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState(false);
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    cpu: { usagePercent: 14, model: 'Host Processor', cores: 4, speed: '' },
    memory: { usagePercent: 55, totalGB: 16, usedGB: 8.8, freeGB: 7.2, heapUsedMB: 35 },
    requests: { ratePerSec: 0, avgLatencyMs: 0, totalRequests: 0 },
    system: {
      platform: 'Windows',
      arch: 'x64',
      hostname: 'Localhost',
      nodeVersion: 'v22',
      uptimeSeconds: 0,
      uptimeFormatted: '0m',
      isLocalhost: true,
      environment: 'Development',
      database: 'Neon Serverless PG'
    }
  });

  const [fleetTelemetry, setFleetTelemetry] = useState<FleetTelemetry>({
    fleetStatus: 'nominal',
    summary: 'All 4 infrastructure tiers operational. Sub-millisecond internal VCN line rate active.',
    incidents: [],
    nodes: {
      vm1: {
        id: 'vm1',
        name: 'VM 1 (sutharlabs-db-store)',
        role: 'Database & Persistent Storage Vault',
        host: 'sutharlabs-db-store',
        publicIp: '137.23.61.191',
        internalIp: '10.0.0.169',
        status: 'online',
        latencyMs: 1,
        cpuPercent: 26,
        loadAvg: [0.74, 0.73, 0.71],
        cores: 1,
        memory: { totalMB: 952, usedMB: 315, freeMB: 637, usagePercent: 33, swapTotalMB: 2048, swapUsedMB: 52 },
        processCount: { total: 300, running: 2 },
        uptimeSeconds: 316000,
        uptimeFormatted: '3d 15h',
        services: [
          { name: 'PostgreSQL 16 DB', status: 'online', port: 5432, details: 'Primary database cluster' },
          { name: 'Sovereign Storage Vault', status: 'online', port: 80, details: 'Self-hosted file vault daemon' },
          { name: 'Docker Engine', status: 'online', details: 'Containers: vault & postgres' }
        ],
        disk: { totalGB: 50.8, usedGB: 5.4, freeGB: 45.4, usagePercent: 11 },
        lastChecked: Date.now()
      },
      vm2: {
        id: 'vm2',
        name: 'VM 2 (sutharlabs-prod)',
        role: 'AI & Neural Voice Synthesizer (Ampere ARM A1)',
        host: 'sutharlabs-prod',
        publicIp: '132.226.190.125',
        internalIp: '10.0.0.188',
        status: 'online',
        latencyMs: 1,
        cpuPercent: 22.4,
        loadAvg: [0.64, 0.47, 0.46],
        cores: 2,
        memory: { totalMB: 11925, usedMB: 4843, freeMB: 7082, usagePercent: 40.6, swapTotalMB: 4096, swapUsedMB: 17 },
        processCount: { total: 344, running: 2 },
        uptimeSeconds: 367800,
        uptimeFormatted: '4d 6h',
        services: [
          { name: 'Neural XTTS-v2 Engine', status: 'online', port: 5050, details: 'FastAPI & PyTorch XTTS active' },
          { name: 'Ollama LLM Engine', status: 'online', port: 11434, details: 'Qwen 2.5 7B & Gemma 2 2B' },
          { name: 'OpenCode IDE Engine', status: 'online', port: 4096, details: 'Web IDE background daemon' },
          { name: 'Lookbusy Idle Protection', status: 'online', details: 'Maintaining ~22% CPU to prevent Oracle reclamation' }
        ],
        lookbusy: { active: true, targetPercent: 22 },
        lastChecked: Date.now()
      },
      vm3: {
        id: 'vm3',
        name: 'VM 3 (sutharlabs-backend)',
        role: 'Web Application & API Gateway Core',
        host: 'sutharlabs-backend',
        publicIp: '130.210.37.199',
        status: 'online',
        latencyMs: 1,
        cpuPercent: 14,
        loadAvg: [0.63, 0.81, 0.83],
        cores: 1,
        memory: { totalMB: 974, usedMB: 497, freeMB: 477, usagePercent: 51, swapTotalMB: 2097, swapUsedMB: 97 },
        processCount: { total: 242, running: 3 },
        uptimeSeconds: 303000,
        uptimeFormatted: '3d 12h',
        services: [
          { name: 'Express API Gateway', status: 'online', port: 3000, details: 'PM2 cluster backend active' },
          { name: 'Nginx Reverse Proxy', status: 'online', port: 80, details: 'SSL & line-rate routing' },
          { name: 'Stock Engine Cron', status: 'online', details: 'Automated NSE simulator active' },
          { name: 'VCN Private Line', status: 'online', details: '10 Gbps Oracle Private Subnet' }
        ],
        lastChecked: Date.now()
      },
      vercel: {
        id: 'vercel',
        name: 'Vercel Edge Network',
        role: 'Global Edge CDN & Serverless Proxy Gateway',
        host: 'www.sutharlabs.com',
        publicIp: '76.76.21.21',
        status: 'online',
        latencyMs: 18,
        cpuPercent: 5,
        loadAvg: [0.1, 0.05, 0.05],
        cores: 32,
        memory: { totalMB: 1024, usedMB: 128, freeMB: 896, usagePercent: 12 },
        processCount: { total: 128, running: 12 },
        uptimeSeconds: 2592000,
        uptimeFormatted: '30d+',
        services: [
          { name: 'Smart Proxy Switch', status: 'online', details: 'Direct upstream routing to VM 3 (130.210.37.199)' },
          { name: 'Global Edge CDN', status: 'online', details: 'Region: bom1 (Mumbai Edge)' },
          { name: 'Edge SSL Termination', status: 'online', details: 'Automated wildcard TLS 1.3' }
        ],
        lastChecked: Date.now()
      }
    },
    timestamp: Date.now()
  });

  const [selectedFleetFilter, setSelectedFleetFilter] = useState<'all' | 'vms' | 'vercel' | 'incidents'>('all');
  const [isFleetLoading, setIsFleetLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Public Tools Asset Download Access Policy State
  const [toolsDownloadPolicy, setToolsDownloadPolicy] = useState<'direct' | 'login_required'>('direct');
  const [isUpdatingPolicy, setIsUpdatingPolicy] = useState(false);
  const [policyUpdateSuccess, setPolicyUpdateSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/public/config')
      .then(res => res.json())
      .then(data => {
        if (data.toolsDownloadPolicy) {
          setToolsDownloadPolicy(data.toolsDownloadPolicy);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateToolsPolicy = async (newPolicy: 'direct' | 'login_required') => {
    setIsUpdatingPolicy(true);
    setPolicyUpdateSuccess(false);
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ toolsDownloadPolicy: newPolicy })
      });
      if (res.ok) {
        setToolsDownloadPolicy(newPolicy);
        setPolicyUpdateSuccess(true);
        setTimeout(() => setPolicyUpdateSuccess(false), 3000);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: `ADMIN: Public Tools download policy updated to [${newPolicy.toUpperCase()}]`
        });
      } else {
        throw new Error('Failed to update tools download policy');
      }
    } catch (err: any) {
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `ADMIN: Error updating tools download policy: ${err.message}`
      });
    } finally {
      setIsUpdatingPolicy(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setUsers(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch corporate users registry:', err);
    }
  };

  const fetchTelemetry = async () => {
    try {
      const response = await fetch('/api/admin/telemetry', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') {
          setTelemetry(prev => ({
            cpu: { ...prev.cpu, ...(data.cpu || {}) },
            memory: { ...prev.memory, ...(data.memory || {}) },
            requests: { ...prev.requests, ...(data.requests || {}) },
            system: { ...prev.system, ...(data.system || {}) }
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch host telemetry:', err);
    }
  };

  const fetchFleetTelemetry = async () => {
    try {
      const response = await fetch('/api/admin/fleet-telemetry', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.nodes) {
          setFleetTelemetry(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch fleet telemetry:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTelemetry();
    fetchFleetTelemetry();
    const interval = setInterval(() => {
      fetchUsers();
      fetchTelemetry();
      fetchFleetTelemetry();
    }, 3000);
    return () => clearInterval(interval);
  }, [userToken]);

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
            setErrorMsg(errData.error || 'Failed to purge user.');
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

  // Execute real host diagnostics sweep
  const runDiagnostics = async () => {
    setIsRefreshingTelemetry(true);
    await Promise.all([fetchTelemetry(), fetchFleetTelemetry()]);
    setTimeout(() => setIsRefreshingTelemetry(false), 600);
    const cpuInfo = telemetry?.cpu || { cores: 1, model: 'Host Processor', usagePercent: 0 };
    const memInfo = telemetry?.memory || { usedGB: 0, totalGB: 0 };
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `ADMIN: Diagnostic sweep complete on host fleet [VM 1, VM 2, VM 3, Vercel Edge]. CPU: ${cpuInfo.usagePercent}%, RAM: ${memInfo.usedGB}GB / ${memInfo.totalGB}GB.`
    });
  };

  // Toggle Maintenance Mode
  const toggleMaintenance = () => {
    const nextActive = !systemActive;
    setSystemActive(nextActive);
    try {
      localStorage.setItem('sutharlabs_admin_maintenance_mode', nextActive ? 'false' : 'true');
    } catch {}
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'ALERT',
      message: `ADMIN: Maintenance toggle activated. System-wide user portal state set to ${nextActive ? 'ACTIVE' : 'MAINTENANCE_LOCKED'}.`
    });
  };

  // Safe fallbacks for telemetry metrics to prevent runtime render crashes
  const cpu = telemetry?.cpu || { usagePercent: 0, model: 'Host Processor', cores: 1, speed: '' };
  const memory = telemetry?.memory || { usagePercent: 0, totalGB: 0, usedGB: 0, freeGB: 0, heapUsedMB: 0 };
  const requests = telemetry?.requests || { ratePerSec: 0, avgLatencyMs: 0, totalRequests: 0 };
  const system = telemetry?.system || {
    platform: 'Host',
    arch: 'x64',
    hostname: 'Localhost',
    nodeVersion: 'v22',
    uptimeSeconds: 0,
    uptimeFormatted: '0m',
    isLocalhost: true,
    environment: 'Development',
    database: 'PostgreSQL'
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
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center shrink-0 shadow-sm relative">
            <Bot className="w-5 h-5 text-purple-400 shrink-0" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5" title="Admin Session Live • Real-time Telemetry Connected">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ce5dff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ce5dff]"></span>
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
              Admin Command Center
            </h2>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              System coordinates, server orchestration, and secure credentials management.
            </p>
          </div>
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
            onClick={runDiagnostics}
            disabled={isRefreshingTelemetry}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
              isLight
                ? 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 shadow-sm disabled:opacity-50'
                : 'bg-[#1a2c31] text-[#74f5ff] border-[#00dbe7]/30 hover:bg-[#00dbe7]/20 shadow-sm disabled:opacity-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshingTelemetry ? 'animate-spin' : ''} ${isLight ? 'text-sky-700' : 'text-[#00dbe7]'}`} />
            {isRefreshingTelemetry ? 'REFRESHING...' : 'RUN DIAGNOSTICS'}
          </button>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* 1. FIRST SECTION: VM & VERCEL INFRASTRUCTURE FLEET MONITORING (REAL-TIME) */}
      {/* ========================================================================= */}
      <div className={`p-4 sm:p-5 rounded-xl border flex flex-col space-y-4 transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-outline/20 bg-surface-container-low/30'
      }`}>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-outline/10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-xs ${
              isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-[#00dbe7]/10 border-[#00dbe7]/25 text-[#00dbe7]'
            }`}>
              <Server className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-sans font-bold text-sm sm:text-base text-on-surface">
                  VM &amp; Vercel Infrastructure Fleet Monitoring
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border shadow-xs ${
                  fleetTelemetry.fleetStatus === 'nominal'
                    ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : fleetTelemetry.fleetStatus === 'degraded'
                    ? isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    fleetTelemetry.fleetStatus === 'nominal' ? 'bg-emerald-500 animate-pulse' : fleetTelemetry.fleetStatus === 'degraded' ? 'bg-amber-500' : 'bg-rose-500 animate-ping'
                  }`} />
                  {fleetTelemetry.fleetStatus === 'nominal' ? '4 / 4 NODES NOMINAL' : fleetTelemetry.fleetStatus === 'degraded' ? 'FLEET DEGRADED' : 'CRITICAL INCIDENT'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                Real-time CPU, RAM, Process Count, and automated failure diagnostics across Oracle Always Free fleet &amp; Vercel Edge.
              </p>
            </div>
          </div>

          {/* Sub-tab Switcher Filter */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <div className={`flex rounded-lg p-0.5 border text-[11px] ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedFleetFilter('all')}
                className={`px-2.5 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  selectedFleetFilter === 'all'
                    ? isLight
                      ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                      : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All Nodes (4)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFleetFilter('vms')}
                className={`px-2.5 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  selectedFleetFilter === 'vms'
                    ? isLight
                      ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                      : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Oracle VMs (3)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFleetFilter('vercel')}
                className={`px-2.5 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  selectedFleetFilter === 'vercel'
                    ? isLight
                      ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                      : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Vercel Edge
              </button>
              {fleetTelemetry.incidents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFleetFilter('incidents')}
                  className={`px-2.5 py-1 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1 ${
                    selectedFleetFilter === 'incidents'
                      ? isLight
                        ? 'bg-rose-50 text-rose-800 font-bold shadow-sm border border-rose-300'
                        : 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40'
                      : 'text-rose-400 hover:text-rose-300 font-semibold'
                  }`}
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Incidents ({fleetTelemetry.incidents.length})</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={runDiagnostics}
              disabled={isRefreshingTelemetry}
              className={`h-7 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 shadow-xs select-none ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                  : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
              }`}
              title="Trigger instant multi-node diagnostic sweep"
            >
              <RefreshCw className={`w-3 h-3 shrink-0 ${isRefreshingTelemetry ? 'animate-spin' : ''}`} />
              <span>{isRefreshingTelemetry ? 'Sweeping...' : 'Probe Fleet'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Fleet Incident / Diagnostic Root-Cause Box ("What is happening and what went wrong") */}
        {fleetTelemetry.incidents.length === 0 ? (
          <div className={`p-3.5 rounded-xl border flex items-start sm:items-center justify-between gap-3 transition-all ${
            isLight ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
          }`}>
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}>
                <ShieldCheck className="w-4 h-4 shrink-0" />
              </div>
              <div className="text-xs font-mono">
                <div className="font-bold flex items-center gap-2">
                  <span>ALL 4 INFRASTRUCTURE TIERS SYNCHRONIZED &amp; NOMINAL</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-normal opacity-80 border border-emerald-500/30">
                    0 Active Incidents
                  </span>
                </div>
                <div className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
                  VM 1 (PostgreSQL &amp; Storage Vault), VM 2 (AI &amp; Neural Voice), VM 3 (Web Gateway), and Vercel Edge are responsive. 
                  Lookbusy daemon actively burns ~22% CPU on VM 2 to safeguard Oracle Always Free ARM compute against idle VM reclamation.
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold shrink-0 hidden lg:inline-block px-2 py-1 rounded border border-emerald-500/30">
              10Gbps VCN Active
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {fleetTelemetry.incidents.map((incident) => (
              <div
                key={incident.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                  incident.severity === 'critical'
                    ? isLight ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  incident.severity === 'critical'
                    ? isLight ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : isLight ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                </div>
                <div className="flex-1 text-xs font-mono">
                  <div className="flex items-center gap-2 flex-wrap font-bold">
                    <span className="uppercase px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      incident.severity === 'critical'
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-amber-500 text-slate-900 border-amber-600'
                    }">
                      {incident.severity.toUpperCase()}
                    </span>
                    <span className="text-on-surface font-sans">{incident.title}</span>
                    <span className="opacity-70 text-[10px]">• Node: {incident.nodeName} • {incident.timestamp}</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                    <strong>Diagnosis &amp; Root Cause:</strong> {incident.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4 Interactive Node Telemetry Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          
          {/* ========================================================================= */}
          {/* NODE 1: VM 1 (sutharlabs-db-store: Database & Storage Vault) */}
          {/* ========================================================================= */}
          {(selectedFleetFilter === 'all' || selectedFleetFilter === 'vms') && (
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3.5 transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-outline/15 bg-surface-container-low/40'
            }`}>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center shrink-0 shadow-xs">
                    <Database className="w-4 h-4 text-purple-400 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-sans font-bold text-sm text-on-surface">
                        VM 1 (sutharlabs-db-store)
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold bg-purple-500/10 text-purple-400 border-purple-500/25">
                        AMD Always Free
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant mt-0.5">
                      <span className="select-all">137.23.61.191</span>
                      <span>•</span>
                      <span className="text-purple-400 font-semibold select-all">VCN: 10.0.0.169</span>
                      <span>•</span>
                      <span>Up: {fleetTelemetry.nodes.vm1.uptimeFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 shadow-xs ${
                    fleetTelemetry.nodes.vm1.status === 'online'
                      ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${fleetTelemetry.nodes.vm1.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {fleetTelemetry.nodes.vm1.status === 'online' ? `${fleetTelemetry.nodes.vm1.latencyMs}ms ONLINE` : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {/* 4 Metric Boxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                {/* CPU */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-purple-400 shrink-0" /> CPU
                    </span>
                    <span className="font-bold text-on-surface">{fleetTelemetry.nodes.vm1.cpuPercent}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, Math.max(5, fleetTelemetry.nodes.vm1.cpuPercent))}%` }} 
                      className={`h-full transition-all duration-500 ${isLight ? 'bg-purple-500' : 'bg-[#c084fc]'}`}
                    />
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-1 truncate">
                    Load: {fleetTelemetry.nodes.vm1.loadAvg[0].toFixed(2)}
                  </div>
                </div>

                {/* Memory Pool */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-sky-400 shrink-0" /> RAM
                    </span>
                    <span className="font-bold text-on-surface">{fleetTelemetry.nodes.vm1.memory.usagePercent}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, Math.max(5, fleetTelemetry.nodes.vm1.memory.usagePercent))}%` }} 
                      className={`h-full transition-all duration-500 ${isLight ? 'bg-sky-500' : 'bg-[#00dbe7]'}`}
                    />
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-1 truncate">
                    {fleetTelemetry.nodes.vm1.memory.usedMB}M / {fleetTelemetry.nodes.vm1.memory.totalMB}M
                  </div>
                </div>

                {/* Process Count */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400 shrink-0" /> Processes
                  </div>
                  <div className="text-base font-bold text-on-surface">
                    {fleetTelemetry.nodes.vm1.processCount.total}
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5">
                    {fleetTelemetry.nodes.vm1.processCount.running ?? 2} active threads
                  </div>
                </div>

                {/* Storage Vault Disk SSD */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-purple-400 shrink-0" /> Vault Disk
                  </div>
                  <div className="text-base font-bold text-purple-400">
                    {fleetTelemetry.nodes.vm1.disk?.usagePercent ?? 11}%
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5 truncate">
                    {fleetTelemetry.nodes.vm1.disk?.freeGB ?? 45.4}GB free SSD
                  </div>
                </div>
              </div>

              {/* Active Services List */}
              <div className="pt-2 border-t border-outline/10 flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {fleetTelemetry.nodes.vm1.services.map((svc, i) => (
                    <span 
                      key={i} 
                      className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        svc.status === 'online'
                          ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                      title={svc.details}
                    >
                      <span className={`w-1 h-1 rounded-full ${svc.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {svc.name}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/storage')}
                  className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Open Vault</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* NODE 2: VM 2 (sutharlabs-prod: AI & Neural Voice Synthesizer) */}
          {/* ========================================================================= */}
          {(selectedFleetFilter === 'all' || selectedFleetFilter === 'vms') && (
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3.5 transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-outline/15 bg-surface-container-low/40'
            }`}>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00dbe7]/10 border border-[#00dbe7]/25 flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-sans font-bold text-sm text-on-surface">
                        VM 2 (sutharlabs-prod)
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold bg-[#00dbe7]/10 text-[#00dbe7] border-[#00dbe7]/25">
                        Ampere ARM64 12GB
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant mt-0.5">
                      <span className="select-all">132.226.190.125</span>
                      <span>•</span>
                      <span className="text-[#00dbe7] font-semibold select-all">VCN: 10.0.0.188</span>
                      <span>•</span>
                      <span>Up: {fleetTelemetry.nodes.vm2.uptimeFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 shadow-xs ${
                    fleetTelemetry.nodes.vm2.status === 'online'
                      ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${fleetTelemetry.nodes.vm2.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {fleetTelemetry.nodes.vm2.status === 'online' ? `${fleetTelemetry.nodes.vm2.latencyMs}ms ONLINE` : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {/* 4 Metric Boxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                {/* CPU with Lookbusy Indicator */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-[#00dbe7] shrink-0" /> CPU
                    </span>
                    <span className="font-bold text-[#00dbe7]">{fleetTelemetry.nodes.vm2.cpuPercent}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, Math.max(5, fleetTelemetry.nodes.vm2.cpuPercent))}%` }} 
                      className={`h-full transition-all duration-500 ${isLight ? 'bg-sky-500' : 'bg-[#00dbe7]'}`}
                    />
                  </div>
                  <div className="text-[9px] text-emerald-400 mt-1 truncate font-bold" title="Lookbusy actively burning ~22% CPU to prevent Oracle idle reclaim">
                    🛡️ Lookbusy Safe (&gt;20%)
                  </div>
                </div>

                {/* Memory Pool (12 GB RAM) */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-sky-400 shrink-0" /> RAM
                    </span>
                    <span className="font-bold text-on-surface">{fleetTelemetry.nodes.vm2.memory.usagePercent}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, Math.max(5, fleetTelemetry.nodes.vm2.memory.usagePercent))}%` }} 
                      className={`h-full transition-all duration-500 ${isLight ? 'bg-sky-500' : 'bg-[#00dbe7]'}`}
                    />
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-1 truncate">
                    {(fleetTelemetry.nodes.vm2.memory.usedMB / 1024).toFixed(1)}GB / {(fleetTelemetry.nodes.vm2.memory.totalMB / 1024).toFixed(1)}GB
                  </div>
                </div>

                {/* Process Count */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400 shrink-0" /> Processes
                  </div>
                  <div className="text-base font-bold text-on-surface">
                    {fleetTelemetry.nodes.vm2.processCount.total}
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5">
                    {fleetTelemetry.nodes.vm2.processCount.running ?? 2} active threads
                  </div>
                </div>

                {/* AI & XTTS Engine Status */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-[#00dbe7] shrink-0" /> AI Synthesizer
                  </div>
                  <div className="text-base font-bold text-[#00dbe7]">
                    ONLINE
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5 truncate">
                    XTTS-v2 &amp; Ollama active
                  </div>
                </div>
              </div>

              {/* Active Services List */}
              <div className="pt-2 border-t border-outline/10 flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {fleetTelemetry.nodes.vm2.services.map((svc, i) => (
                    <span 
                      key={i} 
                      className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        svc.status === 'online'
                          ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : svc.status === 'standby'
                          ? isLight ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                      title={svc.details}
                    >
                      <span className={`w-1 h-1 rounded-full ${svc.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {svc.name}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/ai-studio')}
                  className="text-[#00dbe7] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>AI Studio</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* NODE 3: VM 3 (sutharlabs-backend: Web Gateway & Express Backend) */}
          {/* ========================================================================= */}
          {(selectedFleetFilter === 'all' || selectedFleetFilter === 'vms') && (
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3.5 transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-outline/15 bg-surface-container-low/40'
            }`}>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-xs">
                    <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-sans font-bold text-sm text-on-surface">
                        VM 3 (sutharlabs-backend)
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                        Core Gateway
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant mt-0.5">
                      <span className="select-all">130.210.37.199</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">Local Line: 1ms</span>
                      <span>•</span>
                      <span>Up: {fleetTelemetry.nodes.vm3.uptimeFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 shadow-xs ${
                    fleetTelemetry.nodes.vm3.status === 'online'
                      ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>

              {/* 4 Metric Boxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                {/* CPU */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-emerald-400 shrink-0" /> CPU
                    </span>
                    <span className="font-bold text-on-surface">{fleetTelemetry.nodes.vm3.cpuPercent}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, Math.max(5, fleetTelemetry.nodes.vm3.cpuPercent))}%` }} 
                      className={`h-full transition-all duration-500 ${isLight ? 'bg-emerald-500' : 'bg-[#00e476]'}`}
                    />
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-1 truncate">
                    Load: {fleetTelemetry.nodes.vm3.loadAvg[0].toFixed(2)}
                  </div>
                </div>

                {/* Memory Pool */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-sky-400 shrink-0" /> RAM
                    </span>
                    <span className="font-bold text-on-surface">{fleetTelemetry.nodes.vm3.memory.usagePercent}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, Math.max(5, fleetTelemetry.nodes.vm3.memory.usagePercent))}%` }} 
                      className={`h-full transition-all duration-500 ${isLight ? 'bg-sky-500' : 'bg-[#00dbe7]'}`}
                    />
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-1 truncate">
                    {fleetTelemetry.nodes.vm3.memory.usedMB}M / {fleetTelemetry.nodes.vm3.memory.totalMB}M
                  </div>
                </div>

                {/* Process Count */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400 shrink-0" /> Processes
                  </div>
                  <div className="text-base font-bold text-on-surface">
                    {fleetTelemetry.nodes.vm3.processCount.total}
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5">
                    {fleetTelemetry.nodes.vm3.processCount.running ?? 3} active threads
                  </div>
                </div>

                {/* Gateway Network Line Rate */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400 shrink-0" /> Gateway Line
                  </div>
                  <div className="text-base font-bold text-emerald-400">
                    10 Gbps
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5 truncate">
                    Nginx &amp; VCN Active
                  </div>
                </div>
              </div>

              {/* Active Services List */}
              <div className="pt-2 border-t border-outline/10 flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {fleetTelemetry.nodes.vm3.services.map((svc, i) => (
                    <span 
                      key={i} 
                      className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                      title={svc.details}
                    >
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      {svc.name}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant">
                  PM2 Cluster Online
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* NODE 4: VERCEL EDGE NETWORK GATEWAY */}
          {/* ========================================================================= */}
          {(selectedFleetFilter === 'all' || selectedFleetFilter === 'vercel') && (
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3.5 transition-all ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-outline/15 bg-surface-container-low/40'
            }`}>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0 shadow-xs">
                    <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-sans font-bold text-sm text-on-surface">
                        Vercel Edge Network
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold bg-sky-500/10 text-sky-400 border-sky-500/25">
                        bom1 (Mumbai Edge)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant mt-0.5">
                      <span className="select-all">www.sutharlabs.com</span>
                      <span>•</span>
                      <span className="text-sky-400 font-semibold">Global CDN</span>
                      <span>•</span>
                      <span>TLS 1.3 Wildcard</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 shadow-xs ${
                    isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {fleetTelemetry.nodes.vercel.latencyMs}ms EDGE
                  </span>
                </div>
              </div>

              {/* 4 Metric Boxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                {/* Edge Round-Trip Latency */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-sky-400 shrink-0" /> Edge Latency
                  </div>
                  <div className="text-base font-bold text-sky-400">
                    {fleetTelemetry.nodes.vercel.latencyMs}ms
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5 truncate">
                    Sub-25ms Mumbai
                  </div>
                </div>

                {/* Edge Memory */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-sky-400 shrink-0" /> Edge RAM
                    </span>
                    <span className="font-bold text-on-surface">{fleetTelemetry.nodes.vercel.memory.usagePercent}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, Math.max(5, fleetTelemetry.nodes.vercel.memory.usagePercent))}%` }} 
                      className={`h-full transition-all duration-500 ${isLight ? 'bg-sky-500' : 'bg-[#00dbe7]'}`}
                    />
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-1 truncate">
                    {fleetTelemetry.nodes.vercel.memory.usedMB}M / {fleetTelemetry.nodes.vercel.memory.totalMB}M
                  </div>
                </div>

                {/* Invocations / Procs */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400 shrink-0" /> Invocations
                  </div>
                  <div className="text-base font-bold text-on-surface">
                    {fleetTelemetry.nodes.vercel.processCount.total}
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5">
                    {fleetTelemetry.nodes.vercel.processCount.running ?? 12} concurrent edge
                  </div>
                </div>

                {/* Routing Switch */}
                <div className={`p-2.5 rounded-lg border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-high/40 border-outline/10'
                }`}>
                  <div className="text-[10px] text-on-surface-variant mb-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-sky-400 shrink-0" /> Smart Switch
                  </div>
                  <div className="text-base font-bold text-emerald-400">
                    VM 3
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5 truncate" title="Proxying directly to Oracle VM 3">
                    Direct Upstream
                  </div>
                </div>
              </div>

              {/* Active Services List */}
              <div className="pt-2 border-t border-outline/10 flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {fleetTelemetry.nodes.vercel.services.map((svc, i) => (
                    <span 
                      key={i} 
                      className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        isLight ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}
                      title={svc.details}
                    >
                      <span className="w-1 h-1 rounded-full bg-sky-400" />
                      {svc.name}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-sky-400 font-bold">
                  Wildcard SSL TLS 1.3
                </span>
              </div>
            </div>
          )}

        </div>
      </div>


      <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00dbe7]/10 border border-[#00dbe7]/25 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-[#00dbe7]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-on-surface font-sans">Multi-Tier Database Architecture</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PRIMARY: ORACLE CLOUD VM (137.23.61.191)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">
                BACKUP: NEON SERVERLESS
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              Zero-quota-throttling production database on Oracle Always Free VM with hot disaster recovery replica on Neon AWS Singapore.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/database')}
          className="px-3.5 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer bg-[#00dbe7]/10 hover:bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/30 flex items-center gap-2 shrink-0 shadow-sm"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Manage &amp; Sync Database</span>
        </button>
      </div>

      {/* Oracle Cloud Storage Vault Cockpit Widget */}
      <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ce5dff]/10 border border-[#ce5dff]/25 flex items-center justify-center shrink-0 shadow-sm">
            <HardDrive className="w-5 h-5 text-[#c084fc] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-on-surface font-sans">Persistent Storage Vault</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30">
                ORACLE VM: 137.23.61.191 (50 GB SSD)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                &lt; 60 MB RAM OVERHEAD
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              Secure self-hosted file vault on sutharlabs-db-store for private database dumps, backups, credentials, and encrypted assets.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/storage')}
          className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer bg-[#ce5dff]/10 hover:bg-[#ce5dff]/20 text-[#c084fc] border border-[#ce5dff]/30 flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <HardDrive className="w-3.5 h-3.5 shrink-0" />
          <span>Open Storage Vault</span>
        </button>
      </div>

      {/* Public Tools & Asset Download Policy Cockpit Widget */}
      <div className={`p-4 sm:p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-outline/15 bg-surface-container-low/30'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
            isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-[#00dbe7]/10 border-[#00dbe7]/25 text-[#00dbe7]'
          }`}>
            <Layers className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-on-surface font-sans">Public Tools &amp; Asset Download Policy</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                toolsDownloadPolicy === 'direct'
                  ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isLight ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-[#00dbe7]/10 text-[#00dbe7] border-[#00dbe7]/30'
              }`}>
                {toolsDownloadPolicy === 'direct' ? 'DIRECT GUEST DOWNLOAD (OPEN)' : 'REQUIRE FREE ACCOUNT LOGIN'}
              </span>
              {policyUpdateSuccess && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle className="w-3 h-3 shrink-0" /> Policy Saved &amp; Live!
                </span>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono mt-0.5 max-w-2xl">
              Controls download access for visitors on <code className={`px-1 py-0.5 rounded text-[10px] font-mono border ${isLight ? 'bg-slate-100 text-slate-800 border-slate-300 font-medium' : 'bg-white/5 text-on-surface border-white/10'}`}>/tools</code>. In <strong>Direct</strong> mode, guests can immediately download converted PDFs, images, and documents. In <strong>Require Login</strong> mode, users are prompted to sign in with a free account before downloading.
            </p>
          </div>
        </div>

        {/* Policy Switcher Toggle */}
        <div className={`flex items-center gap-1.5 p-1 rounded-lg border shrink-0 font-mono text-xs select-none ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
        }`}>
          <button
            type="button"
            onClick={() => handleUpdateToolsPolicy('direct')}
            disabled={isUpdatingPolicy}
            className={`h-8 px-3 rounded-md font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              toolsDownloadPolicy === 'direct'
                ? isLight
                  ? 'bg-white text-emerald-800 border border-slate-300 shadow-sm'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Direct (Guest)</span>
          </button>

          <button
            type="button"
            onClick={() => handleUpdateToolsPolicy('login_required')}
            disabled={isUpdatingPolicy}
            className={`h-8 px-3 rounded-md font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              toolsDownloadPolicy === 'login_required'
                ? isLight
                  ? 'bg-white text-sky-800 border border-slate-300 shadow-sm'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 shadow-sm'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Require Login</span>
          </button>
        </div>
      </div>

      {/* Autonomous AI Agent Studio Cockpit Widget */}
      <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/25 flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-on-surface font-sans">Autonomous AI Agent Studio</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">
                PROD VM: 132.226.190.125 (ARM64 12GB + 4GB SWAP)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                QWEN 2.5 7B &amp; GEMMA 2 2B
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              Open-source Claude-style multi-agent aggregator with split-pane interactive Artifacts Studio drawer, token streaming telemetry, and system personas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/ai-studio')}
          className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm ${
            isLight
              ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300'
              : 'bg-[#00dbe7]/10 hover:bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/30'
          }`}
        >
          <Bot className="w-3.5 h-3.5 shrink-0" />
          <span>Launch AI Studio</span>
        </button>
      </div>

      {/* Aggregate Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Core CPU Utilization */}
        <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
          <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant font-mono">
            <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
              <Cpu className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-[#00e476]'}`} />
              Host CPU Usage
            </span>
            <span className={`${(cpu.usagePercent ?? 0) > 80 ? 'text-[#ffb4ab] font-bold' : isLight ? 'text-emerald-700 font-semibold' : 'text-[#00e476]'}`}>
              {cpu.usagePercent ?? 0}%
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, Math.max(0, cpu.usagePercent ?? 0))}%` }} 
              className={`h-full transition-all duration-700 ${
                (cpu.usagePercent ?? 0) > 80 ? 'bg-[#ffb4ab]' : (cpu.usagePercent ?? 0) > 60 ? 'bg-[#ce5dff]' : isLight ? 'bg-emerald-500' : 'bg-[#00e476]'
              }`}
            ></div>
          </div>
          <span 
            className="text-[10px] text-on-surface-variant font-mono mt-1.5 block truncate"
            title={`${cpu.cores ?? 1} Cores / ${cpu.model || 'Host Processor'}`}
          >
            Allocated: {cpu.cores ?? 1} Cores / {cpu.model || 'Host Processor'}
          </span>
        </div>

        {/* JVM/Memory Pool */}
        <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
          <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant font-mono">
            <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
              <HardDrive className={`w-4 h-4 shrink-0 ${isLight ? 'text-sky-600' : 'text-[#74f5ff]'}`} />
              Memory Pool (RAM)
            </span>
            <span className={isLight ? 'text-sky-700 font-semibold' : 'text-[#00dbe7]'}>
              {memory.usagePercent ?? 0}%
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, Math.max(0, memory.usagePercent ?? 0))}%` }} 
              className={`h-full transition-all duration-700 ${isLight ? 'bg-sky-500' : 'bg-[#00dbe7]'}`}
            ></div>
          </div>
          <span className="text-[10px] text-on-surface-variant font-mono mt-1.5 block truncate">
            Used: {memory.usedGB ?? 0} GB / {memory.totalGB ?? 0} GB
          </span>
        </div>

        {/* Global Request Rate */}
        <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
          <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant font-mono">
            <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
              <TrendingUp className={`w-4 h-4 shrink-0 ${isLight ? 'text-purple-600' : 'text-[#ce5dff]'}`} />
              API Requests/s
            </span>
            <span className={`${isLight ? 'text-purple-700' : 'text-[#ce5dff]'} font-bold`}>
              {requests.ratePerSec ?? 0} r/s
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, Math.max(5, ((requests.ratePerSec ?? 0) / 50) * 100))}%` }} 
              className={`h-full transition-all duration-700 ${isLight ? 'bg-purple-500' : 'bg-[#ce5dff]'}`}
            ></div>
          </div>
          <span className="text-[10px] text-on-surface-variant font-mono mt-1.5 block truncate">
            Avg Latency: {(requests.avgLatencyMs ?? 0) > 0 ? `${requests.avgLatencyMs}ms` : '<1ms'} • Total: {requests.totalRequests ?? 0}
          </span>
        </div>

        {/* Host Gateway Node */}
        <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
          <div className="flex items-center justify-between mb-3 text-xs text-on-surface-variant font-mono">
            <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
              <Globe className={`w-4 h-4 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              Host Gateway Node
            </span>
            <span className={isLight ? 'text-emerald-700 font-semibold' : 'text-[#00e476]'}>
              {systemActive ? 'ONLINE' : 'MAINT'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-on-surface">
              {system.platform || 'Host'} {system.arch || 'x64'}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-[#00e476]/10 text-[#00e476] border-[#00e476]/25'}`}>
              Node {system.nodeVersion || 'v22'}
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant font-mono mt-1.5 block truncate">
            {system.database || 'Database'} • Uptime: {system.uptimeFormatted || '0m'}
          </span>
        </div>
      </div>

          {/* Main Panel Content (Split User List + Add User Form) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
            
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
                          <div className="text-[12px] font-bold text-on-surface">{(item.activityCount ?? 0)} syncs</div>
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

      {/* Privileged Telemetry Audit Log (Collapsible) */}
      <CollapsibleLogDrawer
        title="ADMIN PRIVILEGED TELEMETRY AUDIT"
        logs={(logs || []).filter(l => l && typeof l.message === 'string' && (l.message.includes('ADMIN') || l.message.includes('ALERT') || l.message.includes('SUCCESS')))}
        defaultExpanded={false}
      />
    </div>
  );
}
