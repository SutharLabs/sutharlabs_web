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
  AlertCircle
} from 'lucide-react';
import CollapsibleLogDrawer from './CollapsibleLogDrawer';

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

interface DatabaseStatusResponse {
  primary: DatabaseEndpointInfo;
  backup: DatabaseEndpointInfo;
  tableDiffs: Record<string, { primary: number; backup: number; inSync: boolean }>;
  overallInSync: boolean;
  lastSyncTimestamp: string | null;
  lastSyncStats: Record<string, number> | null;
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

  const handleTriggerSync = async () => {
    if (!confirm("Initiate live replication from Primary (Oracle Cloud VM) to Backup (Neon PostgreSQL)? Existing records in Neon will be updated with primary data.")) {
      return;
    }

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
        // Refresh statuses to reflect matching counts
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
        alert('Failed to generate snapshot');
      }
    } catch (e: any) {
      console.error(e);
      alert('Network error downloading snapshot.');
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline/20 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2.5 font-sans">
            <Database className="w-5 h-5 text-[#00dbe7]" />
            <span>Database Orchestration &amp; Disaster Recovery</span>
          </h2>
          <p className="text-xs text-on-surface-variant font-mono mt-1">
            Primary Oracle Cloud VM live routing, Neon cloud replica synchronization &amp; automated disaster recovery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-surface-container-high hover:bg-surface-container text-on-surface border-outline/30'
            } disabled:opacity-50`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00dbe7]' : ''}`} />
            <span>{loading ? 'Checking...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportDump}
            disabled={exporting}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
              isLight
                ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                : 'bg-[#ce5dff]/10 text-[#ebb2ff] border-[#ce5dff]/30 hover:bg-[#ce5dff]/20'
            } disabled:opacity-50`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export Snapshot'}</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={syncing || loading}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'bg-[#00e476] hover:bg-[#00fb83] text-black border-[#00e476] shadow-[0_0_12px_rgba(0,228,118,0.25)]'
            } disabled:opacity-50`}
          >
            <ArrowRightLeft className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Replicating...' : 'Trigger Sync to Neon'}</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast / Banner */}
      {syncFeedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
          syncFeedback.success 
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
        }`}>
          {syncFeedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <div className="font-bold text-sm font-sans">{syncFeedback.message}</div>
            {syncFeedback.syncedCounts && (
              <div className="text-[11px] font-mono text-on-surface-variant flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {Object.entries(syncFeedback.syncedCounts).map(([tbl, cnt]) => (
                  <span key={tbl}>
                    <code className="text-on-surface font-semibold">{tbl}</code>: {cnt}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => setSyncFeedback(null)}
            className="text-xs text-on-surface-variant hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dual Database Topology Cards (Primary vs Backup) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Primary Database (Oracle Cloud VM) */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-500/30 bg-surface-container-low/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-sans">
                  PRIMARY PRODUCTION NODE
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE (READ / WRITE)
              </span>
            </div>

            <h3 className="text-base font-bold text-on-surface font-sans mb-1 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              {data?.primary.provider || 'Oracle Cloud Always Free VM (PostgreSQL)'}
            </h3>
            <p className="text-[11px] text-on-surface-variant mb-4">
              All live client sessions, transaction mutations, and trade orders execute against this node.
            </p>

            <div className="space-y-2 bg-surface-container-high/40 p-3 rounded-lg border border-outline/10 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Host Endpoint:</span>
                <span className="font-bold text-on-surface select-all">{data?.primary.host || '137.23.61.191'}:{data?.primary.port || 5432}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Database Name:</span>
                <span className="font-bold text-on-surface">{data?.primary.database || 'sutharlabs_production'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Database User:</span>
                <span className="font-mono text-on-surface-variant">{data?.primary.user || 'sutharlabs_admin'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Prisma Adapter:</span>
                <span className="font-mono text-[#00dbe7] text-[10px]">{data?.primary.adapter || '@prisma/adapter-pg (Pool)'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ping Latency:</span>
              <span className="font-bold text-emerald-400">
                {data?.primary.latencyMs !== undefined && data.primary.latencyMs >= 0 ? `${data.primary.latencyMs}ms` : 'Connecting...'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${data?.primary.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="font-bold text-[11px] uppercase text-on-surface">{data?.primary.status || 'PROBING'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Secondary / Backup Database (Neon Cloud) */}
        <div className="glass-panel p-5 rounded-xl border border-sky-500/30 bg-surface-container-low/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 font-sans">
                  STANDBY REPLICA NODE
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">
                HOT BACKUP (DR READY)
              </span>
            </div>

            <h3 className="text-base font-bold text-on-surface font-sans mb-1 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" />
              {data?.backup.provider || 'Neon Serverless PostgreSQL (Cloud)'}
            </h3>
            <p className="text-[11px] text-on-surface-variant mb-4">
              Serverless cloud replica ready for instantaneous failover if the primary VPS undergoes maintenance.
            </p>

            <div className="space-y-2 bg-surface-container-high/40 p-3 rounded-lg border border-outline/10 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Cloud Host:</span>
                <span className="font-bold text-on-surface truncate max-w-[200px]" title={data?.backup.host}>{data?.backup.host || 'neon.tech'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Database Name:</span>
                <span className="font-bold text-on-surface">{data?.backup.database || 'neondb'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Database User:</span>
                <span className="font-mono text-on-surface-variant">{data?.backup.user || 'neondb_owner'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Prisma Adapter:</span>
                <span className="font-mono text-[#ce5dff] text-[10px]">{data?.backup.adapter || '@prisma/adapter-neon (WebSocket)'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Ping Latency:</span>
              <span className="font-bold text-sky-400">
                {data?.backup.latencyMs !== undefined && data.backup.latencyMs >= 0 ? `${data.backup.latencyMs}ms` : 'Connecting...'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${data?.backup.status === 'ONLINE' ? 'bg-sky-400' : 'bg-amber-400'}`} />
              <span className="font-bold text-[11px] uppercase text-on-surface">{data?.backup.status || 'PROBING'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sync Parity Matrix Section */}
      <div className="glass-panel p-5 rounded-xl border border-outline/15 bg-surface-container-low/20 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-outline/10">
          <div>
            <h3 className="font-sans font-bold text-sm text-on-surface flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00dbe7]" />
              Data Parity &amp; Replication Matrix
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Row-level comparison across core business models between Oracle Production and Neon Standby.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-on-surface-variant">Overall Health:</span>
              {data?.overallInSync ? (
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" /> IN SYNC
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> DIFF DETECTED
                </span>
              )}
            </div>

            {data?.lastSyncTimestamp && (
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <Clock className="w-3 h-3" />
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
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00dbe7]" />
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
                          <Check className="w-3 h-3" /> Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> {diff.primary - diff.backup > 0 ? `+${diff.primary - diff.backup} Unsynced` : `${diff.primary - diff.backup}`}
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

      {/* Failover & Recovery Guide Accordion */}
      <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/20">
        <button
          type="button"
          onClick={() => setShowFailoverGuide(!showFailoverGuide)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2 text-on-surface font-bold font-sans">
            <ShieldCheck className="w-4 h-4 text-[#ce5dff]" />
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

      {/* Terminal Audit Log Drawer */}
      <CollapsibleLogDrawer logs={logs} title="DATABASE &amp; REPLICATION AUDIT LOG" />
    </div>
  );
}

