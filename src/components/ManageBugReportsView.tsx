import React, { useState, useEffect } from 'react';
import { TerminalLog } from '../types';
import { 
  Bug, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Trash2, 
  ShieldAlert, 
  ExternalLink, 
  ChevronRight, 
  Activity, 
  User, 
  Mail, 
  Monitor, 
  Terminal, 
  Copy, 
  Check, 
  Tag, 
  CheckCircle,
  FileCode,
  Layers,
  ArrowUpDown,
  Send,
  MessageSquare
} from 'lucide-react';
import CollapsibleLogDrawer from './CollapsibleLogDrawer';

interface BugReportItem {
  id: string;
  trackingId: string;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  module: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Investigating' | 'In Progress' | 'Resolved' | 'Closed';
  environment: {
    browser?: string;
    os?: string;
    screen?: string;
    viewport?: string;
    route?: string;
    userAgent?: string;
    theme?: string;
    [key: string]: any;
  };
  capturedLogs: Array<{
    id?: string;
    timestamp: string;
    timeFormatted?: string;
    level: string;
    scope: string;
    message: string;
    data?: any;
    error?: any;
    [key: string]: any;
  }>;
  expectedBehavior?: string | null;
  actualBehavior?: string | null;
  adminNotes?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BugReportsStats {
  total: number;
  newCount: number;
  investigatingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  criticalCount: number;
}

interface ManageBugReportsProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
  theme?: 'light' | 'dark';
}

const STATUS_OPTIONS: BugReportItem['status'][] = [
  'New',
  'Investigating',
  'In Progress',
  'Resolved',
  'Closed'
];

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/30' },
  High: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
  Medium: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
  Low: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  New: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  Investigating: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  'In Progress': { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  Resolved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  Closed: { bg: 'bg-slate-500/15', text: 'text-slate-400' }
};

export default function ManageBugReportsView({
  logs,
  onAddLog,
  userToken,
  theme = 'dark'
}: ManageBugReportsProps) {
  const isLight = theme === 'light';

  const [reports, setReports] = useState<BugReportItem[]>([]);
  const [stats, setStats] = useState<BugReportsStats>({
    total: 0,
    newCount: 0,
    investigatingCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    closedCount: 0,
    criticalCount: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedModule, setSelectedModule] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<BugReportItem | null>(null);

  // Admin note and updates
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [logFilterLevel, setLogFilterLevel] = useState<string>('All');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (selectedSeverity !== 'All') params.set('severity', selectedSeverity);
      if (selectedModule !== 'All') params.set('module', selectedModule);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/admin/bug-reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        if (data.stats) setStats(data.stats);

        // Keep current selected report synced
        if (selectedReport) {
          const updated = (data.reports || []).find((r: BugReportItem) => r.id === selectedReport.id);
          if (updated) {
            setSelectedReport(updated);
            setAdminNotesDraft(updated.adminNotes || '');
          }
        } else if (data.reports && data.reports.length > 0) {
          setSelectedReport(data.reports[0]);
          setAdminNotesDraft(data.reports[0].adminNotes || '');
        }
      } else {
        notify('Failed to load bug reports', 'error');
      }
    } catch (err) {
      console.error('Error fetching bug reports:', err);
      notify('Network error fetching bug reports', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStatus, selectedSeverity, selectedModule]);

  const handleSelectReport = (report: BugReportItem) => {
    setSelectedReport(report);
    setAdminNotesDraft(report.adminNotes || '');
  };

  const handleUpdateStatus = async (status: BugReportItem['status']) => {
    if (!selectedReport) return;
    try {
      const res = await fetch(`/api/admin/bug-reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedReport(updated);
        setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
        notify(`Status changed to ${status}`);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'INFO',
          message: `ADMIN: Bug report ${updated.trackingId} marked as ${status}.`
        });
        fetchReports();
      }
    } catch (err) {
      notify('Failed to update status', 'error');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReport) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/bug-reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ adminNotes: adminNotesDraft })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedReport(updated);
        setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
        notify('Resolution notes updated successfully');
      }
    } catch (err) {
      notify('Failed to save notes', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this bug report?')) return;
    try {
      const res = await fetch(`/api/admin/bug-reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
        if (selectedReport?.id === id) {
          setSelectedReport(null);
        }
        notify('Bug report deleted');
        fetchReports();
      }
    } catch (err) {
      notify('Failed to delete bug report', 'error');
    }
  };

  const handleCopyLogs = () => {
    if (!selectedReport) return;
    const text = JSON.stringify({
      trackingId: selectedReport.trackingId,
      title: selectedReport.title,
      environment: selectedReport.environment,
      capturedLogs: selectedReport.capturedLogs
    }, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  // Filter captured logs for current selected report
  const filteredCapturedLogs = selectedReport?.capturedLogs?.filter(l => {
    const matchesLevel = logFilterLevel === 'All' || l.level === logFilterLevel;
    const matchesSearch = !logSearchQuery.trim() || 
      l.message.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.scope.toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  }) || [];

  return (
    <div className="flex-1 flex flex-col space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl border shadow-xl flex items-center gap-2 text-xs font-mono animate-in slide-in-from-top-2 ${
          notification.type === 'error'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 backdrop-blur-md'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 backdrop-blur-md'
        }`}>
          {notification.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isLight ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold font-sans tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Reported Bugs & Telemetry Diagnostics
              </h1>
              <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Investigate user crashes, inspection traces, and multi-user live breadcrumbs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            disabled={isLoading}
            className={`px-3 py-2 rounded-xl font-mono text-xs flex items-center gap-1.5 cursor-pointer border transition-all ${
              isLight 
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-surface-container-low/40 border-outline/20'
        }`}>
          <span className={`text-[10px] uppercase block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Reports</span>
          <span className={`text-2xl font-bold block mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stats.total}</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-blue-50/60 border-blue-200 shadow-xs' : 'bg-blue-500/10 border-blue-500/30'
        }`}>
          <span className="text-[10px] text-blue-500 uppercase block">New / Triage</span>
          <span className="text-2xl font-bold block mt-1 text-blue-500">{stats.newCount}</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-purple-50/60 border-purple-200 shadow-xs' : 'bg-purple-500/10 border-purple-500/30'
        }`}>
          <span className="text-[10px] text-purple-500 uppercase block">Investigating</span>
          <span className="text-2xl font-bold block mt-1 text-purple-500">{stats.investigatingCount}</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-amber-50/60 border-amber-200 shadow-xs' : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <span className="text-[10px] text-amber-500 uppercase block">In Progress</span>
          <span className="text-2xl font-bold block mt-1 text-amber-500">{stats.inProgressCount}</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-rose-50/60 border-rose-200 shadow-xs' : 'bg-rose-500/10 border-rose-500/30'
        }`}>
          <span className="text-[10px] text-rose-500 uppercase block">Critical Bugs</span>
          <span className="text-2xl font-bold block mt-1 text-rose-500">{stats.criticalCount}</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-emerald-50/60 border-emerald-200 shadow-xs' : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <span className="text-[10px] text-emerald-500 uppercase block">Resolved</span>
          <span className="text-2xl font-bold block mt-1 text-emerald-500">{stats.resolvedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-3 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-surface-container-low/40 border-outline/20'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchReports()}
            placeholder="Search bugs by tracking ID, summary, user email, or keyword..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white' 
                : 'bg-white/5 border-white/10 text-white focus:border-cyan-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#15151c] border-white/10 text-white'
              }`}
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1">
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Severity:</span>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#15151c] border-white/10 text-white'
              }`}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left List + Right Diagnostics Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start min-h-[550px]">
        
        {/* Left Column: Bug Reports List (5 columns) */}
        <div className={`lg:col-span-5 rounded-2xl border flex flex-col max-h-[750px] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-surface-container-low/40 border-outline/20'
        }`}>
          <div className={`p-3.5 border-b flex items-center justify-between text-xs font-mono font-semibold ${
            isLight ? 'border-slate-200 bg-slate-50/70 text-slate-700' : 'border-outline/10 text-slate-300'
          }`}>
            <span>REPORTED INCIDENTS</span>
            <span className="opacity-60">{reports.length} Records</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {isLoading && reports.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                <span>Loading bug reports and live telemetry...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/60" />
                <span>Zero unresolved bug reports found in this view.</span>
              </div>
            ) : (
              reports.map(report => {
                const isSelected = selectedReport?.id === report.id;
                const sevCfg = SEVERITY_COLORS[report.severity] || SEVERITY_COLORS.Medium;
                const statCfg = STATUS_COLORS[report.status] || STATUS_COLORS.New;

                return (
                  <div
                    key={report.id}
                    onClick={() => handleSelectReport(report)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? isLight
                          ? 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                          : 'bg-cyan-500/10 border-cyan-400/50 shadow-[inset_0_0_12px_rgba(0,219,231,0.08)]'
                        : isLight
                          ? 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-bold border ${sevCfg.bg} ${sevCfg.text} ${sevCfg.border}`}>
                          {report.severity}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-medium ${statCfg.bg} ${statCfg.text}`}>
                          {report.status}
                        </span>
                        <span className="font-semibold text-slate-400">
                          {report.trackingId}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className={`text-xs font-bold font-sans mt-2 line-clamp-2 ${
                      isSelected
                        ? isLight ? 'text-indigo-950' : 'text-white'
                        : isLight ? 'text-slate-900' : 'text-slate-200'
                    }`}>
                      {report.title}
                    </h3>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/50 dark:border-white/5 text-[10px] font-mono">
                      <span className={`truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {report.userEmail}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded shrink-0 ${
                        isLight ? 'bg-slate-200/70 text-slate-700' : 'bg-white/5 text-slate-300'
                      }`}>
                        {report.module}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Diagnostics & Telemetry Inspector (7 columns) */}
        <div className={`lg:col-span-7 rounded-2xl border flex flex-col max-h-[750px] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-surface-container-low/40 border-outline/20'
        }`}>
          {selectedReport ? (
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
              {/* Incident Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className={`px-2 py-0.5 rounded font-bold border ${
                      SEVERITY_COLORS[selectedReport.severity]?.bg} ${SEVERITY_COLORS[selectedReport.severity]?.text} ${SEVERITY_COLORS[selectedReport.severity]?.border}
                    `}>
                      {selectedReport.severity} Severity
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-cyan-400">
                      {selectedReport.trackingId}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400">
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h2 className={`text-base font-bold font-sans mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedReport.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono pt-1 text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{selectedReport.userName}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <a href={`mailto:${selectedReport.userEmail}`} className="hover:underline text-indigo-600 dark:text-cyan-400">
                        {selectedReport.userEmail}
                      </a>
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{selectedReport.module}</span>
                    </span>
                  </div>
                </div>

                {/* Status Toggle & Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={selectedReport.status}
                    onChange={e => handleUpdateStatus(e.target.value as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border cursor-pointer ${
                      isLight 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                        : 'bg-[#15151c] border-cyan-400/30 text-cyan-300'
                    }`}
                  >
                    {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>

                  <button
                    onClick={() => handleDeleteReport(selectedReport.id)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-rose-500 ${
                      isLight ? 'hover:bg-rose-50 border-rose-200' : 'hover:bg-rose-500/10 border-rose-500/30'
                    }`}
                    title="Delete Bug Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* User Description & Observed Behavior */}
              <div className="space-y-3 font-sans">
                <div>
                  <h4 className={`text-xs font-mono uppercase font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    User Description & Reproduction Steps
                  </h4>
                  <div className={`mt-1.5 p-3.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap font-mono border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/30 border-white/5 text-slate-200'
                  }`}>
                    {selectedReport.description}
                  </div>
                </div>

                {(selectedReport.expectedBehavior || selectedReport.actualBehavior) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    {selectedReport.expectedBehavior && (
                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' : 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'}`}>
                        <span className="text-emerald-500 font-bold block text-[10px] uppercase">Expected Behavior:</span>
                        <p className="mt-1">{selectedReport.expectedBehavior}</p>
                      </div>
                    )}
                    {selectedReport.actualBehavior && (
                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-rose-50/50 border-rose-200 text-slate-800' : 'bg-rose-500/5 border-rose-500/20 text-slate-200'}`}>
                        <span className="text-rose-500 font-bold block text-[10px] uppercase">Actual Behavior:</span>
                        <p className="mt-1">{selectedReport.actualBehavior}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Environment Snapshot */}
              <div>
                <h4 className={`text-xs font-mono uppercase font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Client Execution Environment</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-[10px] font-mono">
                  <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
                    <span className="opacity-60 block">Browser / OS:</span>
                    <span className="font-semibold block truncate">{selectedReport.environment.browser || 'Unknown'} / {selectedReport.environment.os || 'Unknown'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
                    <span className="opacity-60 block">Screen Resolution:</span>
                    <span className="font-semibold block truncate">{selectedReport.environment.screenResolution || selectedReport.environment.screen || 'N/A'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
                    <span className="opacity-60 block">Route at Issue:</span>
                    <span className="font-semibold block truncate">{selectedReport.environment.activeRoute || selectedReport.environment.route || '/'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
                    <span className="opacity-60 block">IP / Origin:</span>
                    <span className="font-semibold block truncate">{selectedReport.ipAddress || 'Internal/Client'}</span>
                  </div>
                </div>
              </div>

              {/* Live Telemetry Timeline / Log Inspector */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className={`text-xs font-mono uppercase font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Captured Live Breadcrumbs & Error Traces ({selectedReport.capturedLogs.length})</span>
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyLogs}
                      className={`text-[10px] font-mono px-2 py-1 rounded border flex items-center gap-1 transition-colors cursor-pointer ${
                        copiedLogs 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                          : isLight 
                            ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' 
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      }`}
                    >
                      {copiedLogs ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLogs ? 'Copied' : 'Copy All Logs'}</span>
                    </button>
                  </div>
                </div>

                {/* Log Search and Filter Header */}
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={e => setLogSearchQuery(e.target.value)}
                    placeholder="Filter inside captured logs..."
                    className={`flex-1 px-2.5 py-1 rounded-lg border text-[11px] focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/40 border-white/10 text-white'
                    }`}
                  />

                  <select
                    value={logFilterLevel}
                    onChange={e => setLogFilterLevel(e.target.value)}
                    className={`px-2 py-1 rounded-lg border cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#15151c] border-white/10 text-white'
                    }`}
                  >
                    <option value="All">All Levels</option>
                    <option value="ERROR">Errors Only</option>
                    <option value="WARN">Warnings</option>
                    <option value="INFO">Info</option>
                    <option value="DEBUG">Debug</option>
                  </select>
                </div>

                {/* Timeline Box */}
                <div className={`max-h-56 overflow-y-auto p-3 rounded-xl font-mono text-[10px] space-y-1.5 custom-scrollbar ${
                  isLight ? 'bg-slate-900 text-slate-200' : 'bg-black/80 text-slate-300'
                }`}>
                  {filteredCapturedLogs.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      No matching log events found in this session capture.
                    </div>
                  ) : (
                    filteredCapturedLogs.map((log, idx) => (
                      <div key={idx} className="p-1.5 rounded hover:bg-white/[0.04] transition-colors leading-relaxed">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 shrink-0">
                            [{log.timeFormatted || (log.timestamp ? new Date(log.timestamp).toTimeString().split(' ')[0] : '00:00:00')}]
                          </span>
                          <span className={`font-bold shrink-0 ${
                            log.level === 'ERROR' ? 'text-rose-400' :
                            log.level === 'WARN' ? 'text-amber-400' :
                            log.level === 'DEBUG' ? 'text-slate-400' : 'text-cyan-400'
                          }`}>
                            [{log.level}]
                          </span>
                          <span className="text-indigo-300 shrink-0">[{log.scope}]</span>
                          <span className="font-medium text-slate-100 break-all">{log.message}</span>
                        </div>

                        {/* Error stack if present */}
                        {log.error && (log.error.stack || log.error.message) && (
                          <div className="mt-1 p-2 rounded bg-rose-950/40 border border-rose-900/30 text-rose-300 whitespace-pre-wrap font-mono text-[9px] overflow-x-auto">
                            {log.error.stack || log.error.message}
                          </div>
                        )}

                        {/* Additional JSON metadata if present */}
                        {log.data && Object.keys(log.data).length > 0 && (
                          <div className="mt-1 text-[9px] text-slate-400 pl-4 opacity-75 font-mono">
                            Payload: {JSON.stringify(log.data)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Admin Follow-Up / Resolution Notes */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-mono uppercase font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Internal Engineering Notes & Resolution Comments</span>
                  </h4>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-3 py-1 rounded-lg text-xs font-mono bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
                <textarea
                  value={adminNotesDraft}
                  onChange={e => setAdminNotesDraft(e.target.value)}
                  rows={3}
                  placeholder="Record root cause analysis, pull request references (e.g. PR #42), or reply commentary for this incident..."
                  className={`w-full p-3 rounded-xl text-xs font-mono border focus:outline-none resize-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500' 
                      : 'bg-white/5 border-white/10 text-white focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-3 font-mono">
              <div className="w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-400">
                <Bug className="w-6 h-6" />
              </div>
              <p className="text-xs">Select a bug report from the left column to inspect its live logs and reproduction telemetry.</p>
            </div>
          )}
        </div>

      </div>

      {/* Telemetry Audit Log Drawer at the bottom */}
      <CollapsibleLogDrawer logs={logs} title="ADMINISTRATIVE AUDIT TELEMETRY" />
    </div>
  );
}
