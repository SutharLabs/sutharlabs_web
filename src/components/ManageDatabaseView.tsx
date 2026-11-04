import React, { useState, useEffect, useCallback } from 'react';
import { TerminalLog } from '../types';
import { 
  Database, 
  Server, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ArrowRightLeft, 
  ShieldCheck, 
  Layers, 
  HardDrive, 
  Clock, 
  ExternalLink,
  Info,
  Check,
  AlertCircle,
  Copy,
  Zap,
  History
} from 'lucide-react';
import CollapsibleLogDrawer from './CollapsibleLogDrawer';
import ConfirmModal, { ModalVariant } from './ConfirmModal';

interface ManageDatabaseProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
  theme?: 'light' | 'dark';
}

interface DatabaseEndpointInfo {
  role: 'primary' | 'backup';
  provider: string;
  host: string;
  port: number;
  database: string;
  user: string;
  status: string;
  latencyMs: number;
  adapter: string;
  stats: Record<string, number>;
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  trigger: 'CRON_JOB' | 'MANUAL_ADMIN';
  status: 'SUCCESS' | 'FAILED';
  durationMs: number;
  totalRecordsSynced: number;
  syncedCounts: Record<string, number>;
  sourceDatabase: string;
  targetDatabase: string;
  errorMessage?: string;
  initiatedBy?: string;
}

export interface SyncHistorySummary {
  history: SyncHistoryEntry[];
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastCronTimestamp: string | null;
  lastManualTimestamp: string | null;
}

interface DatabaseStatusResponse {
  primary: DatabaseEndpointInfo;
  backup: DatabaseEndpointInfo;
  tableDiffs: Record<string, { primary: number; backup: number; inSync: boolean }>;
  overallInSync: boolean;
  lastSyncTimestamp: string | null;
  lastSyncStats: Record<string, number> | null;
  syncHistorySummary?: SyncHistorySummary;
}

export default function ManageDatabaseView({ logs, onAddLog, userToken, theme = 'dark' }: ManageDatabaseProps) {
  const isLight = theme === 'light';
  const [data, setData] = useState<DatabaseStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    success: boolean;
    message: string;
    durationMs?: number;
    syncedCounts?: Record<string, number>;
  } | null>(null);
  const [showFailoverGuide, setShowFailoverGuide] = useState<boolean>(false);
  const [historyTab, setHistoryTab] = useState<'history' | 'cron_setup'>('history');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Custom Modal State (replaces native window.alert and window.confirm)
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subtext?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ModalVariant;
    isAlert?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/admin/database/status', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'DATA',
          message: `DATABASE: Status refreshed. Primary (${json.primary?.status || 'N/A'}), Backup (${json.backup?.status || 'N/A'}).`
        });
      } else {
        const err = await res.json();
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          message: `DATABASE: Status probe failed: ${err.error || 'Server error'}`
        });
      }
    } catch (e: any) {
      console.error(e);
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        message: `DATABASE: Network error connecting to database admin API.`
      });
    } finally {
      setLoading(false);
    }
  }, [userToken, onAddLog]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Request sync confirmation via custom modal
  const promptTriggerSync = () => {
    setModalConfig({
      isOpen: true,
      title: 'Database Replication Confirmation',
      message: 'Initiate live replication from Primary (Oracle Cloud VM) to Backup (Neon PostgreSQL)?',
      subtext: 'Existing records in Neon standby will be synchronized with primary tables. Primary write traffic remains completely active during this batch synchronization.',
      confirmLabel: 'Confirm & Replicate',
      cancelLabel: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        setModalConfig(null);
        executeTriggerSync();
      }
    });
  };

  const executeTriggerSync = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'ALERT',
      message: 'DATABASE: Manual replication sequence initiated (Oracle VM -> Neon Backup)...'
    });

    try {
      const res = await fetch('/api/admin/database/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await res.json();
      if (res.ok) {
        setSyncFeedback({
          success: true,
          message: result.message,
          durationMs: result.durationMs,
          syncedCounts: result.syncedCounts
        });
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: `DATABASE: Replication completed successfully in ${result.durationMs}ms.`
        });
        await fetchStatus();
      } else {
        setSyncFeedback({
          success: false,
          message: result.error || 'Database sync encountered an unexpected error.'
        });
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          message: `DATABASE: Replication failed: ${result.error || 'Unknown error'}`
        });
        await fetchStatus();
      }
    } catch (err: any) {
      setSyncFeedback({
        success: false,
        message: err.message || 'Network error executing database sync.'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportDump = async () => {
    setExporting(true);
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'INFO',
      message: 'DATABASE: Generating raw JSON offline snapshot...'
    });
    try {
      const res = await fetch('/api/admin/database/export', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const dump = await res.json();
        const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sutharlabs-db-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: 'DATABASE: Offline JSON snapshot downloaded successfully.'
        });
      } else {
        setModalConfig({
          isOpen: true,
          title: 'Export Snapshot Failed',
          message: 'Failed to generate offline database snapshot.',
          subtext: 'The server encountered an issue while generating table records. Check database connectivity.',
          confirmLabel: 'Dismiss',
          isAlert: true,
          variant: 'danger',
          onConfirm: () => setModalConfig(null)
        });
      }
    } catch (e: any) {
      console.error(e);
      setModalConfig({
        isOpen: true,
        title: 'Network Error',
        message: 'Could not connect to database export endpoint.',
        subtext: 'Please check your network connection and authorization credentials.',
        confirmLabel: 'Dismiss',
        isAlert: true,
        variant: 'danger',
        onConfirm: () => setModalConfig(null)
      });
    } finally {
      setExporting(false);
    }
  };

  const TABLE_LABELS: Record<string, string> = {
    users: 'Corporate Accounts (User)',
    portfolios: 'Trading Portfolios (Portfolio)',
    simulations: 'Paper Trading Simulations',
    invoices: 'Financial Invoices (Invoice)',
    flowNodes: 'Visual Architecture Nodes',
    documents: 'DocNexus Documents',
    bugReports: 'Reported Diagnostics (BugReport)',
    contactInquiries: 'Enterprise Leads (ContactInquiry)',
    plugins: 'Storefront Plugins (Plugin)',
    trades: 'Auditable Trades (Trade)'
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto custom-scrollbar font-mono text-xs">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-outline/15 pb-4 gap-4">
        {/* Title & Unified Icon Container */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 flex items-center justify-center shrink-0 shadow-sm">
            <Database className="w-5 h-5 text-[#00dbe7]" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans flex items-center gap-2">
              <span>Database Orchestration &amp; Disaster Recovery</span>
            </h2>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Primary Oracle Cloud VM live routing, Neon cloud replica synchronization &amp; automated disaster recovery.
            </p>
          </div>
        </div>

        {/* Action Buttons: Unified with Theme Selector styling */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          {/* Probe Health Button */}
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600 hover:border-sky-400'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7] hover:border-[#00dbe7]/50'
            }`}
            title="Probe real-time connection status and latency for both database instances"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin text-[#00dbe7]' : ''}`} />
            <span>Probe Health</span>
          </button>

          {/* Export Snapshot Button */}
          <button
            type="button"
            onClick={handleExportDump}
            disabled={exporting || loading}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600 hover:border-sky-400'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7] hover:border-[#00dbe7]/50'
            }`}
            title="Download full JSON snapshot backup of primary database"
          >
            <Download className={`w-3.5 h-3.5 shrink-0 ${exporting ? 'animate-bounce text-[#00dbe7]' : ''}`} />
            <span>Export Snapshot</span>
          </button>

          {/* Trigger Sync Now (Primary Action Button) */}
          <button
            type="button"
            onClick={promptTriggerSync}
            disabled={syncing || loading}
            className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 select-none ${
              isLight
                ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sky-500/20'
                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 hover:border-[#00dbe7] shadow-[#00dbe7]/10'
            }`}
            title="Trigger manual batch synchronization from Oracle VM to Neon standby"
          >
            <ArrowRightLeft className={`w-3.5 h-3.5 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Replicating...' : 'Trigger Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Sync Banner Feedback */}
      {syncFeedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
          syncFeedback.success 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {syncFeedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <p className="font-bold font-sans">{syncFeedback.message}</p>
            {syncFeedback.syncedCounts && (
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono">
                {Object.entries(syncFeedback.syncedCounts).map(([tbl, cnt]) => (
                  <span key={tbl} className="bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-200">
                    {tbl}: {cnt}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Database Topology Grid (Primary vs Standby) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Primary DB Card */}
        <div className="glass-panel p-5 rounded-2xl border border-outline/20 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE PRIMARY
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                data?.primary?.status === 'ONLINE' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {data?.primary?.status || 'PROBING...'}
              </span>
              {data?.primary?.latencyMs !== undefined && data.primary.latencyMs >= 0 && (
                <span className="text-[10px] text-on-surface-variant font-mono flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#00dbe7] shrink-0" />
                  {data.primary.latencyMs}ms
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface font-sans">
                {data?.primary?.provider || 'Oracle Cloud Always Free VM'}
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Main PostgreSQL operational engine powering high-frequency transactions, WebSocket feeds &amp; user state.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-outline/10 space-y-2 text-[11px]">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Endpoint Host:</span>
              <span className="font-mono text-on-surface font-semibold bg-surface-container-high px-2 py-0.5 rounded border border-outline/20">
                {data?.primary?.host || '137.23.61.191'}
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Database &amp; Port:</span>
              <span className="font-mono text-on-surface">
                {data?.primary?.database || 'postgres'}:{data?.primary?.port || 5432}
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Prisma Driver Adapter:</span>
              <span className="font-mono text-emerald-400">
                {data?.primary?.adapter || '@prisma/adapter-pg (TCP Pool)'}
              </span>
            </div>
          </div>
        </div>

        {/* Standby / Backup DB Card */}
        <div className="glass-panel p-5 rounded-2xl border border-outline/20 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                STANDBY REPLICA
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                data?.backup?.status === 'ONLINE' 
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {data?.backup?.status || 'PROBING...'}
              </span>
              {data?.backup?.latencyMs !== undefined && data.backup.latencyMs >= 0 && (
                <span className="text-[10px] text-on-surface-variant font-mono flex items-center gap-1">
                  <Activity className="w-3 h-3 text-sky-400 shrink-0" />
                  {data.backup.latencyMs}ms
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface font-sans">
                {data?.backup?.provider || 'Neon Serverless Cloud'}
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Serverless PostgreSQL with instant scale-to-zero, hot-standby failover and branchable test environments.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-outline/10 space-y-2 text-[11px]">
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Endpoint Host:</span>
              <span className="font-mono text-on-surface font-semibold bg-surface-container-high px-2 py-0.5 rounded border border-outline/20 truncate max-w-[200px]" title={data?.backup?.host}>
                {data?.backup?.host || 'neon.tech'}
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Database &amp; Port:</span>
              <span className="font-mono text-on-surface">
                {data?.backup?.database || 'neondb'}:{data?.backup?.port || 5432}
              </span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant">
              <span>Prisma Driver Adapter:</span>
              <span className="font-mono text-sky-400">
                {data?.backup?.adapter || '@prisma/adapter-neon (WebSocket)'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Data Parity Matrix Section */}
      <div className="glass-panel p-5 rounded-2xl border border-outline/15 bg-surface-container-low/30 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-outline/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00dbe7]/10 border border-[#00dbe7]/20 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-[#00dbe7] shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface font-sans">
                Data Parity &amp; Replication Matrix
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Row-level comparison across core business models between Oracle Production and Neon Standby.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-on-surface-variant">Overall Health:</span>
              {data?.overallInSync ? (
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3 shrink-0" /> IN SYNC
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> DIFF DETECTED
                </span>
              )}
            </div>

            {data?.lastSyncTimestamp && (
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                Last Synced: {new Date(data.lastSyncTimestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Parity Table */}
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-outline/10 text-on-surface-variant text-[10px] uppercase tracking-wider">
                <th className="py-2.5 font-semibold">Entity Model</th>
                <th className="py-2.5 font-semibold text-center">Oracle VM (Primary)</th>
                <th className="py-2.5 font-semibold text-center">Neon (Backup)</th>
                <th className="py-2.5 font-semibold text-right">Parity State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10 text-[11px]">
              {data && Object.keys(data.tableDiffs || {}).map((tableKey) => {
                const diff = data.tableDiffs[tableKey];
                const label = TABLE_LABELS[tableKey] || tableKey;
                return (
                  <tr key={tableKey} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 text-on-surface font-semibold flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00dbe7] shrink-0" />
                      <span>{label}</span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-on-surface">
                      {diff.primary}
                    </td>
                    <td className="py-2.5 text-center font-bold text-on-surface">
                      {diff.backup}
                    </td>
                    <td className="py-2.5 text-right">
                      {diff.inSync ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Check className="w-3 h-3 shrink-0" /> Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {diff.primary - diff.backup > 0 ? `+${diff.primary - diff.backup} Unsynced` : `${diff.primary - diff.backup}`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Replication Scheduler & Execution History */}
      <div className="glass-panel p-5 rounded-2xl border border-outline/15 bg-surface-container-low/20 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-outline/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00dbe7]/10 border border-[#00dbe7]/20 flex items-center justify-center shrink-0">
              <History className="w-4 h-4 text-[#00dbe7] shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface font-sans">
                Cron Scheduler &amp; Replication History
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Persistent execution audit trail of automated cron synchronizations and administrative manual runs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex rounded-lg p-0.5 border text-[11px] ${
              isLight 
                ? 'bg-slate-100 border-slate-300' 
                : 'bg-[#201f21] border-[#3a494b]/40'
            }`}>
              <button
                type="button"
                onClick={() => setHistoryTab('history')}
                className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  historyTab === 'history'
                    ? isLight
                      ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                      : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sync History ({data?.syncHistorySummary?.totalRuns || 0})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('cron_setup')}
                className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  historyTab === 'cron_setup'
                    ? isLight
                      ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                      : 'bg-[#ce5dff]/15 text-[#ce5dff] font-bold border border-[#ce5dff]/30'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Cron Setup Guide
              </button>
            </div>
          </div>
        </div>

        {/* History Metrics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-outline/15 bg-surface-container-high/30">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Last Cron Sync</span>
            <span className="text-xs font-bold text-on-surface mt-1 block font-mono">
              {data?.syncHistorySummary?.lastCronTimestamp
                ? new Date(data.syncHistorySummary.lastCronTimestamp).toLocaleString()
                : 'Not executed yet'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-outline/15 bg-surface-container-high/30">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Last Manual Sync</span>
            <span className="text-xs font-bold text-on-surface mt-1 block font-mono">
              {data?.syncHistorySummary?.lastManualTimestamp
                ? new Date(data.syncHistorySummary.lastManualTimestamp).toLocaleString()
                : 'Not executed yet'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-outline/15 bg-surface-container-high/30">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Total Recorded Runs</span>
            <span className="text-xs font-bold text-on-surface mt-1 block font-mono">
              {data?.syncHistorySummary?.totalRuns || 0} runs
            </span>
          </div>

          <div className="p-3 rounded-xl border border-outline/15 bg-surface-container-high/30">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Replication Health</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 block font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {data?.syncHistorySummary?.totalRuns
                ? `${Math.round(((data.syncHistorySummary.successfulRuns) / data.syncHistorySummary.totalRuns) * 100)}% Success`
                : '100% Ready'}
            </span>
          </div>
        </div>

        {/* Tab 1: Execution History Table */}
        {historyTab === 'history' && (
          <div className="overflow-x-auto min-w-full">
            {(!data?.syncHistorySummary?.history || data.syncHistorySummary.history.length === 0) ? (
              <div className="text-center py-8 text-on-surface-variant border border-dashed border-outline/20 rounded-xl bg-surface-container-low/10">
                <Clock className="w-6 h-6 mx-auto mb-2 text-on-surface-variant/50 shrink-0" />
                <p className="text-xs font-semibold">No synchronization logs recorded yet</p>
                <p className="text-[11px] text-on-surface-variant/70 mt-1">
                  Trigger a manual sync above or run the cron job script to see execution history timestamps.
                </p>
              </div>
            ) : (
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-outline/10 text-on-surface-variant text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 font-semibold">Timestamp</th>
                    <th className="py-2.5 font-semibold text-center">Trigger Mode</th>
                    <th className="py-2.5 font-semibold text-center">Outcome</th>
                    <th className="py-2.5 font-semibold text-center">Duration</th>
                    <th className="py-2.5 font-semibold text-center">Records Synced</th>
                    <th className="py-2.5 font-semibold text-right">Initiator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10 text-[11px]">
                  {data.syncHistorySummary.history.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 text-on-surface font-mono">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-center">
                        {entry.trigger === 'CRON_JOB' ? (
                          <span className="inline-flex items-center gap-1 text-[#00dbe7] font-bold text-[10px] bg-[#00dbe7]/10 px-2 py-0.5 rounded border border-[#00dbe7]/30">
                            <Clock className="w-3 h-3 shrink-0" /> CRON JOB
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#ce5dff] font-bold text-[10px] bg-[#ce5dff]/10 px-2 py-0.5 rounded border border-[#ce5dff]/30">
                            <Zap className="w-3 h-3 shrink-0" /> MANUAL ADMIN
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">
                        {entry.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            <Check className="w-3 h-3 shrink-0" /> SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30" title={entry.errorMessage}>
                            <AlertCircle className="w-3 h-3 shrink-0" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-center text-on-surface-variant font-mono">
                        {entry.durationMs}ms
                      </td>
                      <td className="py-2.5 text-center font-bold text-on-surface">
                        {entry.totalRecordsSynced} records
                      </td>
                      <td className="py-2.5 text-right text-on-surface-variant text-[10px] font-mono truncate max-w-[150px]" title={entry.initiatedBy}>
                        {entry.initiatedBy || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Cron Scheduler Setup Instructions */}
        {historyTab === 'cron_setup' && (
          <div className="space-y-4 animate-fade-in text-[11px] font-sans leading-relaxed">
            <p className="text-on-surface-variant">
              You can trigger automated replications from Oracle VM to Neon standby using any of the 3 standard options below whenever you are ready to activate scheduling:
            </p>

            {/* Option 1: Vercel Cron */}
            <div className="p-3.5 rounded-xl border border-outline/15 bg-surface-container-high/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface flex items-center gap-2 font-sans">
                  <span className="w-2 h-2 rounded-full bg-[#00dbe7] shrink-0" />
                  <span>Option 1: Vercel Scheduled Cron (Active in <code className="font-mono text-[#00dbe7]">vercel.json</code>)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Pre-configured
                </span>
              </div>
              <p className="text-on-surface-variant">
                If your frontend/API is deployed on Vercel, the cron is automatically registered in <code className="font-mono text-on-surface">vercel.json</code> to fire daily at 20:30 UTC (02:00 AM IST) targeting <code className="font-mono text-on-surface">/api/cron/database-sync</code>.
              </p>
            </div>

            {/* Option 2: External Webhook / Cron-job.org */}
            <div className="p-3.5 rounded-xl border border-outline/15 bg-surface-container-high/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface flex items-center gap-2 font-sans">
                  <span className="w-2 h-2 rounded-full bg-[#ce5dff] shrink-0" />
                  <span>Option 2: External HTTP Webhook (Cron-Job.org / Uptime Robot / GitHub Actions)</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/cron/database-sync?key=sutharlabs-cron-vault-2026`, 'webhook')}
                  className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                  }`}
                >
                  {copiedKey === 'webhook' ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                  <span>{copiedKey === 'webhook' ? 'Copied URL!' : 'Copy Webhook URL'}</span>
                </button>
              </div>
              <p className="text-on-surface-variant">
                Configure a recurring webhook monitor on <a href="https://cron-job.org" target="_blank" rel="noreferrer" className="text-[#00dbe7] underline">cron-job.org</a> or any ping service:
              </p>
              <div className="bg-black/40 p-2.5 rounded-lg border border-outline/15 font-mono text-[10px] text-sky-300 break-all select-all">
                POST {typeof window !== 'undefined' ? window.location.origin : 'https://sutharlabs.com'}/api/cron/database-sync?key=sutharlabs-cron-vault-2026
              </div>
              <p className="text-[10px] text-on-surface-variant/80">
                Supports <code className="font-mono text-on-surface">Authorization: Bearer &lt;CRON_SECRET&gt;</code> or query parameter <code className="font-mono text-on-surface">?key=&lt;CRON_SECRET&gt;</code>.
              </p>
            </div>

            {/* Option 3: Oracle VM Native Crontab */}
            <div className="p-3.5 rounded-xl border border-outline/15 bg-surface-container-high/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface flex items-center gap-2 font-sans">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>Option 3: Oracle VM System Crontab (Zero Cloud Dependency)</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('30 20 * * * cd /home/ubuntu/website && npm run db:cron-sync >> /var/log/db-sync.log 2>&1', 'crontab')}
                  className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                  }`}
                >
                  {copiedKey === 'crontab' ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                  <span>{copiedKey === 'crontab' ? 'Copied Command!' : 'Copy Crontab Command'}</span>
                </button>
              </div>
              <p className="text-on-surface-variant">
                Run directly on your Oracle Cloud VM without relying on web requests. On the VM terminal, execute <code className="font-mono text-on-surface">crontab -e</code> and append:
              </p>
              <div className="bg-black/40 p-2.5 rounded-lg border border-outline/15 font-mono text-[10px] text-emerald-300 select-all">
                30 20 * * * cd /home/ubuntu/website &amp;&amp; npm run db:cron-sync &gt;&gt; /var/log/db-sync.log 2&gt;&amp;1
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Failover & Recovery Guide Accordion */}
      <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/20">
        <button
          type="button"
          onClick={() => setShowFailoverGuide(!showFailoverGuide)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 text-on-surface font-bold font-sans">
            <div className="w-8 h-8 rounded-lg bg-[#ce5dff]/10 border border-[#ce5dff]/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#ce5dff] shrink-0" />
            </div>
            <span>Instant Failover &amp; Disaster Recovery Runbook</span>
          </div>
          <span className="text-[11px] text-[#00dbe7] group-hover:underline">
            {showFailoverGuide ? 'Hide Runbook ▲' : 'View Runbook ▼'}
          </span>
        </button>

        {showFailoverGuide && (
          <div className="mt-4 pt-3 border-t border-outline/10 space-y-3 text-[11px] text-on-surface-variant font-sans leading-relaxed animate-fade-in">
            <p>
              If the Oracle Cloud VM (<code className="text-emerald-400 font-mono">137.23.61.191</code>) ever undergoes maintenance, network updates, or an unexpected OS reboot, failover to the Neon Backup can be completed in under <strong>30 seconds</strong>:
            </p>
            <ol className="list-decimal pl-5 space-y-2 font-mono text-[11px]">
              <li>
                <strong>Trigger Instant Failover in Vercel:</strong> Open Vercel Project Settings &rarr; Environment Variables &rarr; set <code className="text-[#00dbe7]">DATABASE_URL</code> to your <code className="text-sky-300">BACKUP_DATABASE_URL</code> connection string.
              </li>
              <li>
                <strong>Trigger Local/VPS Failover:</strong> In your <code className="text-on-surface font-mono">.env</code>, set <code className="text-[#00dbe7]">DATABASE_URL</code> to the Neon URI and restart the process.
              </li>
              <li>
                <strong>Automated Driver Adaptation:</strong> [`api/_utils.ts`](file:///d:/Code/SutharLabs/website/api/_utils.ts) automatically detects <code className="text-sky-300">neon.tech</code> and swaps from <code className="text-on-surface font-mono">@prisma/adapter-pg</code> to <code className="text-on-surface font-mono">@prisma/adapter-neon</code> dynamically.
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Custom Themed Confirmation / Alert Modal (Zero Native Alerts) */}
      {modalConfig && (
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          subtext={modalConfig.subtext}
          confirmLabel={modalConfig.confirmLabel}
          cancelLabel={modalConfig.cancelLabel}
          variant={modalConfig.variant}
          isAlert={modalConfig.isAlert}
          theme={theme}
        />
      )}

      {/* Terminal Audit Log Drawer */}
      <CollapsibleLogDrawer logs={logs} title="DATABASE &amp; REPLICATION AUDIT LOG" />
    </div>
  );
}
