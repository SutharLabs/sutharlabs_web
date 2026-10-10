import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  X, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Monitor, 
  Clock, 
  FileCode,
  Layers,
  Terminal
} from 'lucide-react';
import { telemetryLogger, TelemetryPackage, TelemetryLog } from '../services/telemetryLogger';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name?: string;
    email?: string;
  };
  initialModule?: string;
  initialError?: Error | string;
  theme?: 'light' | 'dark';
}

const MODULE_OPTIONS = [
  'Main Website & Navigation',
  'Doc Nexus (Creative Docs & PDF)',
  'Stock Tracker & Market Engine',
  'Enterprise Accounting & GST',
  'System Architecture Flow Canvas',
  'Workspace Plugin Store',
  'User Profile & Security',
  'Other / API Backend'
];

const SEVERITY_LEVELS: { id: 'Low' | 'Medium' | 'High' | 'Critical'; label: string; desc: string; color: string }[] = [
  { id: 'Low', label: 'Low', desc: 'Cosmetic or minor UI glitch', color: 'border-slate-300 text-slate-600 dark:border-white/10 dark:text-slate-400' },
  { id: 'Medium', label: 'Medium', desc: 'Feature works with inconvenience', color: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5' },
  { id: 'High', label: 'High', desc: 'Core functionality broken', color: 'border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-500/5' },
  { id: 'Critical', label: 'Critical', desc: 'App crash or data loss', color: 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10' }
];

export default function BugReportModal({
  isOpen,
  onClose,
  currentUser,
  initialModule = 'Main Website & Navigation',
  initialError,
  theme = 'dark'
}: BugReportModalProps) {
  const isLight = theme === 'light';

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState(initialModule);
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [includeLogs, setIncludeLogs] = useState(true);

  // Diagnostics preview state
  const [telemetryPackage, setTelemetryPackage] = useState<TelemetryPackage | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null); // trackingId
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Capture telemetry package on open
  useEffect(() => {
    if (isOpen) {
      const pkg = telemetryLogger.exportTelemetryPackage(60);
      setTelemetryPackage(pkg);
      setSubmitSuccess(null);
      setSubmitError(null);

      if (initialError) {
        const errorText = initialError instanceof Error ? `${initialError.name}: ${initialError.message}` : String(initialError);
        setTitle(prev => prev || `Crash encountered: ${errorText.substring(0, 60)}`);
        setActualBehavior(prev => prev || (initialError instanceof Error && initialError.stack ? initialError.stack : errorText));
        setSeverity('High');
      }
    }
  }, [isOpen, initialError]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setSubmitError('Please provide both a summary title and detailed description.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const email = currentUser?.email || 'anonymous@sutharlabs.com';
      const name = currentUser?.name || 'Anonymous User';

      const payload = {
        userEmail: email,
        userName: name,
        title: title.trim(),
        description: description.trim(),
        module,
        severity,
        expectedBehavior: expectedBehavior.trim() || undefined,
        actualBehavior: actualBehavior.trim() || undefined,
        environment: includeLogs && telemetryPackage ? telemetryPackage.environment : {},
        capturedLogs: includeLogs && telemetryPackage ? telemetryPackage.breadcrumbs : []
      };

      const res = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit bug report');
      }

      setSubmitSuccess(data.trackingId);
      telemetryLogger.scope('main:telemetry').info('User bug report submitted successfully', {
        trackingId: data.trackingId,
        module,
        severity
      });
    } catch (err: any) {
      console.error('Bug submission error:', err);
      setSubmitError(err.message || 'Network error submitting report. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTrackingId = () => {
    if (!submitSuccess) return;
    navigator.clipboard.writeText(submitSuccess);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f0f14] border-white/10 text-white'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isLight 
                ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs' 
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Report An Issue / Submit Diagnostics
              </h2>
              <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Direct telemetry link to SutharLabs Core Engineering
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {submitSuccess ? (
            /* Success State */
            <div className="py-8 px-4 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Bug Report Received!
                </h3>
                <p className={`text-xs mt-1 max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Thank you for helping us maintain sovereign software excellence. Your diagnostic report and live execution trace have been dispatched to our engineering squad.
                </p>
              </div>

              {/* Tracking ID Badge */}
              <div className={`p-4 rounded-xl border max-w-sm mx-auto flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
              }`}>
                <div className="text-left font-mono">
                  <span className={`text-[10px] block uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Incident Tracking ID
                  </span>
                  <span className={`text-base font-bold ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`}>
                    {submitSuccess}
                  </span>
                </div>

                <button
                  onClick={handleCopyTrackingId}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 cursor-pointer border transition-all ${
                    copiedId
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  }`}
                >
                  {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium text-xs shadow-md cursor-pointer hover:opacity-95 transition-all"
                >
                  Done & Return to Workspace
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Title & Module Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1.5">
                  <label className={`block font-mono text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Issue Summary <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. PDF page renders corrupted text after document upload"
                    required
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white' 
                        : 'bg-white/5 border-white/10 text-white focus:border-cyan-400 focus:bg-white/[0.08]'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`block font-mono text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Affected Module
                  </label>
                  <select
                    value={module}
                    onChange={e => setModule(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors cursor-pointer ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500' 
                        : 'bg-[#15151c] border-white/10 text-white focus:border-cyan-400'
                    }`}
                  >
                    {MODULE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Severity Level Selector */}
              <div className="space-y-1.5">
                <label className={`block font-mono text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Severity Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SEVERITY_LEVELS.map(lvl => {
                    const isSelected = severity === lvl.id;
                    return (
                      <button
                        type="button"
                        key={lvl.id}
                        onClick={() => setSeverity(lvl.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                              : 'border-cyan-400 bg-cyan-500/15 text-white'
                            : isLight
                              ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-xs font-bold ${
                            isSelected 
                              ? isLight ? 'text-indigo-700' : 'text-cyan-300' 
                              : isLight ? 'text-slate-800' : 'text-slate-300'
                          }`}>
                            {lvl.label}
                          </span>
                        </div>
                        <span className={`text-[10px] block mt-0.5 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {lvl.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <label className={`block font-mono text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Description & Steps to Reproduce <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="1. Navigated to Doc Nexus&#10;2. Clicked Browse Document and selected sample.pdf&#10;3. Observed rendered text contained garbled characters instead of original content"
                  required
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none transition-colors font-mono resize-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white' 
                      : 'bg-white/5 border-white/10 text-white focus:border-cyan-400 focus:bg-white/[0.08]'
                  }`}
                />
              </div>

              {/* Expected vs Actual (Optional Accordion / Row) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`block font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Expected Behavior (Optional)
                  </label>
                  <input
                    type="text"
                    value={expectedBehavior}
                    onChange={e => setExpectedBehavior(e.target.value)}
                    placeholder="Document should display original legible pages"
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`block font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Actual Behavior (Optional)
                  </label>
                  <input
                    type="text"
                    value={actualBehavior}
                    onChange={e => setActualBehavior(e.target.value)}
                    placeholder="Gibberish symbols or error popup appeared"
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Live Telemetry Log Capture Section */}
              <div className={`rounded-xl border p-3.5 transition-all ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/[0.02] border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="include_logs"
                      checked={includeLogs}
                      onChange={e => setIncludeLogs(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="include_logs" className={`font-mono text-xs font-semibold cursor-pointer select-none flex items-center gap-1.5 ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}>
                      <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      <span>Attach Live Diagnostics & Breadcrumbs</span>
                    </label>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {telemetryPackage?.breadcrumbs.length || 0} Events Captured
                    </span>
                  </div>

                  {includeLogs && (
                    <button
                      type="button"
                      onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                      className={`text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                        isLight ? 'text-indigo-600 hover:text-indigo-800' : 'text-cyan-400 hover:text-cyan-300'
                      }`}
                    >
                      <span>{isPreviewExpanded ? 'Hide Details' : 'Inspect Captured Logs'}</span>
                      {isPreviewExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {includeLogs && isPreviewExpanded && telemetryPackage && (
                  <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-white/10 space-y-2 animate-in fade-in">
                    {/* Environment Quick Specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                      <div className={`p-2 rounded border ${isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'}`}>
                        <span className="opacity-60 block">Browser / OS:</span>
                        <span className="font-semibold block truncate">{telemetryPackage.environment.browser} on {telemetryPackage.environment.os}</span>
                      </div>
                      <div className={`p-2 rounded border ${isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'}`}>
                        <span className="opacity-60 block">Screen:</span>
                        <span className="font-semibold block truncate">{telemetryPackage.environment.screenResolution}</span>
                      </div>
                      <div className={`p-2 rounded border ${isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'}`}>
                        <span className="opacity-60 block">Active Path:</span>
                        <span className="font-semibold block truncate">{telemetryPackage.environment.activeRoute}</span>
                      </div>
                      <div className={`p-2 rounded border ${isLight ? 'bg-white border-slate-200' : 'bg-black/30 border-white/5'}`}>
                        <span className="opacity-60 block">Session ID:</span>
                        <span className="font-semibold block truncate">{telemetryPackage.sessionId}</span>
                      </div>
                    </div>

                    {/* Captured Breadcrumbs Stream Viewer */}
                    <div className={`max-h-40 overflow-y-auto p-2 rounded-lg font-mono text-[10px] space-y-1 custom-scrollbar ${
                      isLight ? 'bg-slate-900 text-slate-200' : 'bg-black/70 text-slate-300'
                    }`}>
                      {telemetryPackage.breadcrumbs.length === 0 ? (
                        <div className="text-center py-2 opacity-50">No recent logs recorded.</div>
                      ) : (
                        telemetryPackage.breadcrumbs.slice(-25).map((log, i) => (
                          <div key={i} className="flex gap-2 leading-relaxed">
                            <span className="text-slate-500 shrink-0">[{log.timeFormatted}]</span>
                            <span className={`font-semibold shrink-0 ${
                              log.level === 'ERROR' ? 'text-rose-400' :
                              log.level === 'WARN' ? 'text-amber-400' :
                              log.level === 'DEBUG' ? 'text-slate-400' : 'text-cyan-400'
                            }`}>
                              [{log.level}]
                            </span>
                            <span className="text-indigo-300 shrink-0">[{log.scope}]</span>
                            <span className="truncate">{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className={`pt-3 border-t flex items-center justify-between ${
                isLight ? 'border-slate-200' : 'border-white/10'
              }`}>
                <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Reporting as: <strong className={isLight ? 'text-slate-800' : 'text-white'}>{currentUser?.email || 'Anonymous'}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-medium cursor-pointer transition-colors ${
                      isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-slate-400'
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-md flex items-center gap-2 cursor-pointer hover:opacity-95 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Transmitting Report...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Bug Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
