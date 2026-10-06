import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TerminalLog } from '../types';
import CollapsibleLogDrawer from './CollapsibleLogDrawer';

interface WorkspacePluginStoreProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userEmail: string;
  userToken: string;
  onPluginsChange?: () => void;
}

export interface WorkspacePluginReview {
  id: string;
  pluginId: string;
  userEmail: string;
  userName: string;
  rating: number;
  feedback?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkspacePluginVersion {
  id: string;
  pluginId: string;
  version: string;
  stage?: string;
  changelog?: string | null;
  packageUrl?: string | null;
  checksumSha256?: string | null;
  minEngineVersion?: string | null;
  publishedBy?: string | null;
  publishedAt: string;
}

export interface WorkspacePlugin {
  id: string;
  name: string;
  category: string;
  type: string;
  stage?: string;
  description: string;
  iconSymbol: string;
  version: string;
  installsCount?: number;
  rating?: number;
  reviewsCount?: number;
  reviews?: WorkspacePluginReview[];
  versions?: WorkspacePluginVersion[];
}

export interface InstalledPlugin extends WorkspacePlugin {
  installedVersion?: string;
}

export function isBetaVersion(version?: string): boolean {
  if (!version) return true;
  const major = parseInt(version.replace(/^v/i, '').split('.')[0], 10);
  return isNaN(major) || major < 1;
}

export function compareSemverDesc(v1?: string, v2?: string): number {
  const p1 = (v1 || '0.0.0').replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = (v2 || '0.0.0').replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const diff = (p2[i] || 0) - (p1[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Enriched technical attributes (tags, features, permissions) for top-tier store fidelity
const PLUGIN_METADATA_REGISTRY: Record<string, {
  publisher: string;
  tags: string[];
  highlights: string[];
  features: string[];
  permissions: { name: string; description: string; granted: boolean }[];
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}> = {
  wp_stock_analyzer: {
    publisher: 'SutharLabs Quantitative Systems',
    tags: ['TradingView Charts', 'Global Equities', 'Quant Algorithms', 'Condition Builder', 'Neon DB'],
    highlights: [
      'Multi-Market TradingView Live Charts (NSE, BSE, US, EU)',
      'Pluggable Strategy Engine & Visual Condition Builder',
      'Historical Backtesting with Statutory Tax Modeling',
      'Multi-Market Screener & Automated EOD Trade Simulator'
    ],
    features: [
      'Interactive TradingView Lightweight Charts with zoom, pan, crosshair, and volume histogram',
      'Multi-Market Global Universes supporting India (NSE/BSE), US, Europe (LSE/DAX), China/HK, and Japan',
      'Pluggable Strategy Engine (IStrategy) with quantitative presets, Visual Condition Builder, and live test sandbox',
      'High-Performance Historical Backtesting Engine with multi-country statutory tax & friction modeling (STT, SEC, GST, SDRT)',
      'Community Algorithm Marketplace with 1-click cloning/forking, interactive 5-star reviews, and verified performance proofs'
    ],
    permissions: [
      { name: 'External Network', description: 'Streams global market quotes and candle feeds via Yahoo Finance APIs', granted: true },
      { name: 'Database Persistence', description: 'Persists custom watchlists, trading rules, and portfolio transactions to Neon PostgreSQL', granted: true },
      { name: 'Terminal IPC', description: 'Dispatches real-time algorithmic telemetry to the developer console drawer', granted: true }
    ],
    accentColor: '#00dbe7',
    accentBg: 'rgba(0, 219, 231, 0.1)',
    accentBorder: 'rgba(0, 219, 231, 0.3)'
  },

  wp_flow_designer: {
    publisher: 'SutharLabs Architecture Group',
    tags: ['Visual Canvas', 'Topology Nodes', 'Microservices', 'JSON Export'],
    highlights: [
      'Interactive Drag-and-Drop Node Architecture Canvas',
      'Dynamic Spline Curvature & Port Snapping Routing',
      'Live State Inspection & Pipeline Processor Triggers',
      'Full Architectural JSON State Import / Export'
    ],
    features: [
      'Interactive drag-and-drop node graph canvas for system architecture',
      'Bi-directional connection ports with dynamic spline curvature',
      'Live node status monitoring, file attachments, and processor triggers',
      'Export and import complete architectural states as formatted JSON'
    ],
    permissions: [
      { name: 'Canvas Storage', description: 'Persists active node diagrams to local workspace state', granted: true },
      { name: 'Workflow Engine', description: 'Executes simulated pipeline steps in a sandbox', granted: true },
      { name: 'Workspace Event Bus', description: 'Listens for topology change notifications', granted: true }
    ],
    accentColor: '#ce5dff',
    accentBg: 'rgba(206, 93, 255, 0.1)',
    accentBorder: 'rgba(206, 93, 255, 0.3)'
  },
  wp_doc_nexus: {
    publisher: 'SutharLabs Knowledge Core',
    tags: ['Markdown Studio', 'Syntax Highlighting', 'Live Preview', 'Cloud Sync'],
    highlights: [
      'Split-Pane Markdown Studio with Instant Live Render',
      'GitHub Flavored Tables, Fences & Alert Blocks',
      'Automated Background Cloud Sync & Conflict Guard',
      'Collaborative Document Locks & Version Timestamping'
    ],
    features: [
      'Split-pane markdown documentation editor with instant live render',
      'GitHub Flavored Markdown support including tables, alerts, and code fences',
      'Automated background cloud synchronization with optimistic UI state',
      'Document version timestamping and collaborative editing lock support'
    ],
    permissions: [
      { name: 'Cloud Document Store', description: 'Stores and retrieves markdown documents via Prisma', granted: true },
      { name: 'Clipboard Access', description: 'Allows instant copying of raw markdown or rendered HTML', granted: true },
      { name: 'Auto-Save Hooks', description: 'Triggers non-blocking autosave cycles every 3 seconds', granted: true }
    ],
    accentColor: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.1)',
    accentBorder: 'rgba(245, 158, 11, 0.3)'
  },
  wp_accounting: {
    publisher: 'SutharLabs Enterprise Suite',
    tags: ['Ledger', 'Double-Entry', 'Invoicing', 'Tax Audit'],
    highlights: [
      'Deterministic Double-Entry Ledger Engine',
      'Automated Invoicing & Status Reconciliation',
      'Exportable Audit Trails with CSV Exporter',
      'Cryptographic Admin Role Verification'
    ],
    features: [
      'Double-entry transaction sequences with deterministic balance auditing',
      'Automated invoice generation and payment status tracking',
      'Daily financial ledger reconciliations with exportable CSV audit trails',
      'Role-based permissions limiting balance modifications to authorized admins'
    ],
    permissions: [
      { name: 'Ledger Storage', description: 'Securely records financial entries with tamper-proof hashing', granted: true },
      { name: 'Financial Audit Bus', description: 'Broadcasts invoice settlements to the workspace log', granted: true },
      { name: 'Admin Verification', description: 'Enforces cryptographic role checks on sensitive settlements', granted: true }
    ],
    accentColor: '#00dbe7',
    accentBg: 'rgba(0, 219, 231, 0.1)',
    accentBorder: 'rgba(0, 219, 231, 0.3)'
  }
};

const DEFAULT_METADATA = {
  publisher: 'Verified Extension Publisher',
  tags: ['Sandboxed Extension', 'V8 Runtime', 'Zero-Latency', 'Isolated'],
  highlights: [
    'Sandboxed isolated runtime with zero-latency event bus',
    'Automated state persistence with cloud sync',
    'Real-time developer telemetry & audit logging'
  ],
  features: [
    'Fully sandboxed execution within isolated workspace runtime',
    'Integrated with SutharLabs event bus and live telemetry',
    'Automatic state persistence and zero-configuration boot'
  ],
  permissions: [
    { name: 'Isolated Worker', description: 'Runs in a sandboxed Web Worker environment', granted: true },
    { name: 'Workspace Telemetry', description: 'Reports health status to the central event log', granted: true }
  ],
  accentColor: '#00dbe7',
  accentBg: 'rgba(0, 219, 231, 0.1)',
  accentBorder: 'rgba(0, 219, 231, 0.3)'
};

export default function WorkspacePluginStore({
  logs,
  onAddLog,
  userEmail,
  userToken,
  onPluginsChange
}: WorkspacePluginStoreProps) {
  const [plugins, setPlugins] = useState<WorkspacePlugin[]>([]);
  const [installed, setInstalled] = useState<InstalledPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'alert' | 'error' } | null>(null);

  // Search, Category and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'name' | 'newest'>('popular');

  // Detail Modal state
  const [activeModalPlugin, setActiveModalPlugin] = useState<WorkspacePlugin | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'features' | 'permissions' | 'releases' | 'reviews' | 'specs'>('overview');

  // Review submission state inside modal
  const [userRatingInput, setUserRatingInput] = useState<number>(5);
  const [userFeedbackInput, setUserFeedbackInput] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Action loading tracker (stores pluginId currently being installed/uninstalled)
  const [loadingPluginId, setLoadingPluginId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchPlugins = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/workspace-plugins');
      if (res.ok) {
        const data: WorkspacePlugin[] = await res.json();
        setPlugins(data);
        // If modal is open, keep its active plugin updated with fresh reviews
        setActiveModalPlugin(prev => {
          if (!prev) return null;
          return data.find(p => p.id === prev.id) || prev;
        });
      }

      const resInstalled = await fetch('/api/workspace-plugins/installed', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (resInstalled.ok) setInstalled(await resInstalled.json());
    } catch (e) {
      console.error('Failed to fetch workspace plugins:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, [userToken]);

  // When opening modal, prefill the current user's existing review if any
  useEffect(() => {
    if (activeModalPlugin && activeModalPlugin.reviews) {
      const existing = activeModalPlugin.reviews.find(r => r.userEmail === userEmail);
      if (existing) {
        setUserRatingInput(existing.rating);
        setUserFeedbackInput(existing.feedback || '');
      } else {
        setUserRatingInput(5);
        setUserFeedbackInput('');
      }
    }
  }, [activeModalPlugin, userEmail]);

  // Keyboard shortcut listener: "/" to focus search, "Escape" to clear/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (activeModalPlugin) {
          setActiveModalPlugin(null);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalPlugin, searchQuery]);

  const notify = (text: string, type: 'success' | 'alert' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleInstall = async (pluginId: string, name: string) => {
    setLoadingPluginId(pluginId);
    try {
      const res = await fetch('/api/workspace-plugins/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ pluginId })
      });
      if (res.ok) {
        notify(`Successfully installed ${name} to your workspace`, 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: `Installed workspace plugin: ${name}`
        });
        await fetchPlugins();
        onPluginsChange?.();
      } else {
        const data = await res.json();
        notify(data.error || 'Failed to install plugin', 'error');
      }
    } catch (e) {
      notify('Network error installing plugin.', 'error');
    } finally {
      setLoadingPluginId(null);
    }
  };

  const handleUninstall = async (pluginId: string, name: string) => {
    setLoadingPluginId(pluginId);
    try {
      const res = await fetch(`/api/workspace-plugins/install/${pluginId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        notify(`Uninstalled ${name} from your workspace`, 'alert');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `Uninstalled workspace plugin: ${name}`
        });
        await fetchPlugins();
        onPluginsChange?.();
      } else {
        notify('Failed to uninstall plugin', 'error');
      }
    } catch (e) {
      notify('Network error uninstalling plugin.', 'error');
    } finally {
      setLoadingPluginId(null);
    }
  };

  const handleSubmitReview = async (pluginId: string, name: string) => {
    if (!userRatingInput || userRatingInput < 1 || userRatingInput > 5) {
      notify('Please select a star rating between 1 and 5.', 'alert');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/workspace-plugins/${pluginId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
          rating: userRatingInput,
          feedback: userFeedbackInput
        })
      });

      if (res.ok) {
        notify(`Your rating for ${name} has been published!`, 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'DATA',
          message: `Submitted ${userRatingInput}-star rating for ${name}`
        });
        await fetchPlugins();
      } else {
        const err = await res.json();
        notify(err.error || 'Failed to submit review.', 'error');
      }
    } catch (e) {
      notify('Network error submitting review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const reviewFormRef = useRef<HTMLDivElement>(null);

  const handleDeleteReview = async (pluginId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete your review and rating for ${name}?`)) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/workspace-plugins/${pluginId}/reviews`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      if (res.ok) {
        notify(`Deleted your review for ${name}`, 'alert');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `Deleted review for workspace plugin: ${name}`
        });
        setUserRatingInput(5);
        setUserFeedbackInput('');
        await fetchPlugins();
      } else {
        const err = await res.json();
        notify(err.error || 'Failed to delete review.', 'error');
      }
    } catch (e) {
      notify('Network error deleting review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleStartEditReview = (rating: number, feedback?: string | null) => {
    setUserRatingInput(rating);
    setUserFeedbackInput(feedback || '');
    reviewFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const installedIds = useMemo(() => new Set(installed.map(i => i.id)), [installed]);

  // Extract all categories dynamically from catalog
  const categories = useMemo(() => {
    const cats = Array.from(new Set(plugins.map(p => p.category).filter(Boolean)));
    return ['All', ...cats, 'Installed'];
  }, [plugins]);

  // Filter & Sort Plugins
  const filteredPlugins = useMemo(() => {
    return plugins
      .filter(p => {
        // Category filter
        if (selectedCategory === 'Installed') {
          if (!installedIds.has(p.id)) return false;
        } else if (selectedCategory !== 'All') {
          if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        }

        // Search query filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const meta = PLUGIN_METADATA_REGISTRY[p.id] || DEFAULT_METADATA;
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          meta.tags.some(t => t.toLowerCase().includes(q)) ||
          p.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'newest') {
          return compareSemverDesc(b.version, a.version);
        }
        // default: popular (sort by real installs count, then review count)
        const installsA = a.installsCount || 0;
        const installsB = b.installsCount || 0;
        if (installsB !== installsA) return installsB - installsA;
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      });
  }, [plugins, selectedCategory, searchQuery, sortBy, installedIds]);

  // Spotlight Featured Plugin (e.g. Stock Tracker or first in list)
  const spotlightPlugin = useMemo(() => {
    return plugins.find(p => p.id === 'wp_stock_analyzer') || plugins[0] || null;
  }, [plugins]);

  const getPluginMeta = (id: string) => {
    return PLUGIN_METADATA_REGISTRY[id] || DEFAULT_METADATA;
  };

  return (
    <div className="flex-grow flex flex-col gap-6 animate-fade-in p-2 sm:p-4 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border transition-all animate-bounce-subtle ${
            notification.type === 'success'
              ? 'bg-[#002812]/95 border-[#00fb83]/40 text-[#00fb83]'
              : notification.type === 'alert'
              ? 'bg-[#320015]/95 border-[#ffb4ab]/40 text-[#ffb4ab]'
              : 'bg-[#3b0808]/95 border-red-500/40 text-red-300'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {notification.type === 'success' ? 'verified' : notification.type === 'alert' ? 'info' : 'warning'}
          </span>
          <span className="text-xs font-mono font-medium">{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-75 transition-opacity text-sm font-mono text-white/60"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Header & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00dbe7] animate-pulse" />
              Sovereign Ecosystem Registry
            </span>
            <span className="text-xs text-on-surface-variant font-mono">v3.4.0 Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-sans font-extrabold text-on-surface tracking-tight flex items-center gap-3">
            Plugin Store
            <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-md bg-surface-container-high border border-outline/30 text-on-surface-variant">
              {plugins.length} Extensions
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
            Discover, install, and manage sandboxed extensions, algorithmic tools, and native workspace interfaces. Built with cryptographic sandboxing, zero-latency IPC, and community ratings.
          </p>
        </div>

        {/* Quick Trust Stat Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low border border-outline/20 text-xs">
            <span className="material-symbols-outlined text-sm text-[#00e476]">verified_user</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-on-surface-variant leading-none">Security</span>
              <span className="font-bold text-on-surface text-xs leading-tight">100% Sandboxed</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low border border-outline/20 text-xs">
            <span className="material-symbols-outlined text-sm text-[#74f5ff]">bolt</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-on-surface-variant leading-none">Active</span>
              <span className="font-bold text-on-surface text-xs leading-tight">{installed.length} Installed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spotlight Extension Banner - Compact & Focused on Key Selling Points */}
      {spotlightPlugin && (
        <div className="relative overflow-hidden rounded-2xl border border-[#00dbe7]/30 bg-gradient-to-br from-cyan-500/10 via-surface-container-low/90 to-purple-500/10 dark:from-[#002022]/80 dark:via-[#0e1420]/90 dark:to-[#1e1035]/60 p-4 sm:p-5 shadow-xl backdrop-blur-xl group hover:border-[#00dbe7]/60 transition-all duration-300">
          {/* Ambient background glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00dbe7]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-[#00dbe7]/15 transition-all" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-[#ce5dff]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
            <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#00dbe7]/15 to-[#ce5dff]/15 dark:from-[#00363a] dark:to-[#001416] border-2 border-[#00dbe7]/50 flex items-center justify-center shrink-0 shadow-md shadow-[#00dbe7]/20 group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-[#00838f] dark:text-[#74f5ff] text-2xl sm:text-3xl">
                  {spotlightPlugin.iconSymbol}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00e476]/15 dark:bg-[#00fb83]/20 text-[#008744] dark:text-[#00fb83] border border-[#00e476]/40 dark:border-[#00fb83]/40 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">star</span>
                    Spotlight Featured
                  </span>
                  <span className="text-[11px] font-mono text-[#00838f] dark:text-[#00dbe7] bg-[#00dbe7]/10 px-2 py-0.5 rounded border border-[#00dbe7]/30 font-semibold">
                    {spotlightPlugin.category}
                  </span>
                  <span className="text-xs font-mono text-on-surface-variant font-medium">v{spotlightPlugin.version}</span>
                  {isBetaVersion(spotlightPlugin.version) && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-400/15 text-amber-500 dark:text-amber-300 border border-amber-400/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      Beta
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-on-surface group-hover:text-[#00838f] dark:group-hover:text-[#74f5ff] transition-colors mt-1 leading-tight">
                  {spotlightPlugin.name}
                </h2>

                <p className="text-xs text-on-surface-variant dark:text-[#b9cacb] mt-0.5 line-clamp-1 max-w-3xl leading-relaxed">
                  {spotlightPlugin.description}
                </p>

                {/* Key Selling Points / Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 max-w-2xl">
                  {getPluginMeta(spotlightPlugin.id).highlights.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-xs font-mono text-on-surface dark:text-[#d3e5e6]"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#00e476] shrink-0">check_circle</span>
                      <span className="truncate">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Spotlight CTA */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-outline/10 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-mono">
                {spotlightPlugin.rating && spotlightPlugin.rating > 0 ? (
                  <>
                    <span className="text-amber-400 font-bold">★ {spotlightPlugin.rating}</span>
                    <span>({spotlightPlugin.reviewsCount} {spotlightPlugin.reviewsCount === 1 ? 'review' : 'reviews'})</span>
                  </>
                ) : (
                  <span className="text-on-surface-variant/70">No reviews yet</span>
                )}
                <span className="mx-1">•</span>
                <span className="text-[#00e476]">
                  {spotlightPlugin.installsCount || 0} {spotlightPlugin.installsCount === 1 ? 'install' : 'installs'}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalPlugin(spotlightPlugin);
                    setModalTab('overview');
                  }}
                  className="h-9 px-3.5 rounded-xl text-xs font-mono font-semibold border border-outline/30 hover:border-[#00dbe7] text-on-surface hover:text-[#00dbe7] transition-all bg-surface-container-low/60 hover:bg-surface-container flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px] leading-none text-on-surface-variant">info</span>
                  <span>Details</span>
                </button>

                {installedIds.has(spotlightPlugin.id) ? (() => {
                  const inst = installed.find(i => i.id === spotlightPlugin.id);
                  const hasSpotlightUpdate = inst?.installedVersion && inst.installedVersion !== spotlightPlugin.version;

                  return (
                    <div className="flex items-center gap-2">
                      {hasSpotlightUpdate ? (
                        <button
                          type="button"
                          disabled={loadingPluginId === spotlightPlugin.id}
                          onClick={() => handleInstall(spotlightPlugin.id, spotlightPlugin.name)}
                          className="h-9 px-3.5 rounded-xl text-xs font-mono font-semibold bg-gradient-to-r from-[#00dbe7] to-[#00f2fe] text-[#002022] hover:brightness-105 shadow-md shadow-[#00dbe7]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title={`Upgrade from v${inst?.installedVersion} to v${spotlightPlugin.version}`}
                        >
                          {loadingPluginId === spotlightPlugin.id ? (
                            <span className="material-symbols-outlined text-[16px] leading-none animate-spin">progress_activity</span>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[16px] leading-none">upgrade</span>
                              <span>Update to v{spotlightPlugin.version}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="h-9 px-3.5 rounded-xl text-xs font-mono font-semibold bg-[#00e476]/10 border border-[#00e476]/30 text-[#008744] dark:text-[#00fb83] flex items-center justify-center gap-1.5 select-none shadow-sm">
                          <span className="material-symbols-outlined text-[16px] leading-none text-[#00a854] dark:text-[#00fb83]">check_circle</span>
                          <span>Installed</span>
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={loadingPluginId === spotlightPlugin.id}
                        onClick={() => handleUninstall(spotlightPlugin.id, spotlightPlugin.name)}
                        className="h-9 px-3 rounded-xl text-xs font-mono font-semibold border border-red-500/25 dark:border-red-400/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loadingPluginId === spotlightPlugin.id ? (
                          <span className="material-symbols-outlined text-[16px] leading-none animate-spin">progress_activity</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px] leading-none">delete_outline</span>
                            <span>Uninstall</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })() : (
                  <button
                    type="button"
                    disabled={loadingPluginId === spotlightPlugin.id}
                    onClick={() => handleInstall(spotlightPlugin.id, spotlightPlugin.name)}
                    className="h-9 px-4 rounded-xl text-xs font-mono font-semibold bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff] hover:shadow-lg hover:shadow-[#00dbe7]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loadingPluginId === spotlightPlugin.id ? (
                      <span className="material-symbols-outlined text-[16px] leading-none animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px] leading-none">download</span>
                    )}
                    <span>Install to Workspace</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Search Input, Category Tabs & Sort */}
      <div className="flex flex-col gap-3.5 glass-panel p-3.5 sm:p-4 rounded-2xl border border-outline/30">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box with Hotkey Indicator */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search extensions by name, category, or capability... (Press '/' to focus)"
              className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-surface-container-lowest border border-outline/30 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-[#00dbe7] focus:ring-1 focus:ring-[#00dbe7] transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-on-surface-variant hover:text-on-surface px-1.5 py-0.5 rounded bg-surface-container"
              >
                Clear
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-on-surface-variant px-1.5 py-0.5 rounded border border-outline/30 bg-surface-container pointer-events-none">
                /
              </span>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-[11px] font-mono text-on-surface-variant">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline/30 text-xs font-mono text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name (A-Z)</option>
              <option value="newest">Latest Version</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'All'
                ? plugins.length
                : cat === 'Installed'
                ? installed.length
                : plugins.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#00dbe7] text-[#002022] font-bold shadow-md shadow-[#00dbe7]/20'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline/20 hover:border-outline/40'
                }`}
              >
                {cat === 'Installed' && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-[#002022]' : 'bg-[#00e476]'
                    }`}
                  />
                )}
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-[#002022]/20 text-[#002022]' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Extensions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map(idx => (
            <div
              key={idx}
              className="glass-panel p-6 rounded-2xl border border-outline/20 animate-pulse flex flex-col gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-surface-container-high" />
                <div className="flex-1 space-y-2">
                  <div className="w-2/3 h-4 bg-surface-container-high rounded" />
                  <div className="w-1/3 h-3 bg-surface-container-high rounded" />
                </div>
              </div>
              <div className="w-full h-12 bg-surface-container-high rounded mt-2" />
              <div className="w-full h-9 bg-surface-container-high rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-outline/30 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface">No extensions found</h3>
          <p className="text-xs text-on-surface-variant max-w-md">
            No plugins match your current search "{searchQuery}" in category "{selectedCategory}". Try refining your query or resetting filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/30 hover:bg-[#00dbe7]/20 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPlugins.map(p => {
            const isInstalled = installedIds.has(p.id);
            const userInstalled = installed.find(i => i.id === p.id);
            const hasUpdate = isInstalled && userInstalled?.installedVersion && userInstalled.installedVersion !== p.version;
            const meta = getPluginMeta(p.id);
            const isActing = loadingPluginId === p.id;
            const hasReviews = p.reviewsCount && p.reviewsCount > 0;

            return (
              <div
                key={p.id}
                className="group relative flex flex-col rounded-2xl border border-outline/30 bg-surface-container-lowest/80 backdrop-blur-xl p-4 sm:p-5 transition-all duration-300 hover:border-[#00dbe7]/60 hover:shadow-xl hover:shadow-[#00dbe7]/5 hover:-translate-y-1 overflow-hidden"
              >
                {/* Top Row: Icon, Title & Meta + Vertically Aligned Status Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      style={{
                        background: meta.accentBg,
                        borderColor: meta.accentBorder,
                        color: meta.accentColor
                      }}
                      className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105"
                    >
                      <span className="material-symbols-outlined text-[22px] leading-none select-none flex items-center justify-center">
                        {p.iconSymbol}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-on-surface group-hover:text-[#74f5ff] transition-colors leading-tight truncate">
                          {p.name}
                        </h3>
                        <span
                          className="material-symbols-outlined text-xs text-[#00dbe7] shrink-0"
                          title="Verified SutharLabs Native Extension"
                        >
                          verified
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container border border-outline/20 text-on-surface-variant font-medium">
                          {p.category}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">v{p.version}</span>
                        {isBetaVersion(p.version) && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase bg-amber-400/15 text-amber-500 dark:text-amber-300 border border-amber-400/30">
                            Beta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge: Vertically aligned with plugin title */}
                  <div className="shrink-0 flex items-center pt-0.5">
                    {isInstalled ? (
                      hasUpdate ? (
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00dbe7]/15 border border-[#00dbe7]/40 text-[#00838f] dark:text-[#00dbe7] text-[10px] font-mono font-bold shadow-sm animate-pulse">
                          <span className="material-symbols-outlined text-xs leading-none">upgrade</span>
                          <span>Update</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00e476]/15 border border-[#00e476]/30 text-[#008744] dark:text-[#00fb83] text-[10px] font-mono font-bold shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00e476]" />
                          <span>Installed</span>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high/60 border border-outline/20 text-on-surface-variant text-[10px] font-mono font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline/50" />
                        <span>Available</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Real Ratings & Real Installs bar */}
                <div className="flex items-center gap-3 mt-3.5 pt-3 border-t border-outline/10 text-xs font-mono text-on-surface-variant">
                  <div className="flex items-center gap-1 text-amber-400">
                    <span className="material-symbols-outlined text-sm">star</span>
                    {hasReviews ? (
                      <>
                        <span className="font-bold text-on-surface text-[11px]">{p.rating}</span>
                        <span className="text-on-surface-variant/70 text-[10px]">({p.reviewsCount})</span>
                      </>
                    ) : (
                      <span className="text-on-surface-variant/70 text-[10px]">Unrated</span>
                    )}
                  </div>
                  <span className="text-outline/40">•</span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="material-symbols-outlined text-xs text-on-surface-variant">download</span>
                    <span>{p.installsCount || 0} {p.installsCount === 1 ? 'install' : 'installs'}</span>
                  </div>
                  <span className="text-outline/40">•</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#00dbe7] font-semibold">
                    {p.type}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-on-surface-variant dark:text-[#b9cacb] leading-relaxed mt-3 line-clamp-3">
                  {p.description}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-1.5 mt-3.5 flex-wrap">
                  {meta.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-container-high/60 text-on-surface-variant border border-outline/10"
                    >
                      {tag}
                    </span>
                  ))}
                  {meta.tags.length > 3 && (
                    <span className="text-[10px] font-mono text-on-surface-variant/60">
                      +{meta.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Card Actions: Uniformly sized buttons across all states */}
                <div className="mt-auto pt-5 flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalPlugin(p);
                      setModalTab('overview');
                    }}
                    className="h-9 px-3 rounded-xl text-xs font-mono font-semibold border border-outline/30 hover:border-[#00dbe7] text-on-surface hover:text-[#00dbe7] bg-surface-container-low/50 hover:bg-surface-container transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                    title={`View full details for ${p.name}`}
                  >
                    <span className="material-symbols-outlined text-[15px] leading-none text-on-surface-variant">info</span>
                    <span>Details</span>
                  </button>

                  {isInstalled ? (
                    <>
                      {hasUpdate ? (
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleInstall(p.id, p.name)}
                          className="flex-1 min-w-0 h-9 px-2.5 rounded-xl text-xs font-mono font-semibold bg-gradient-to-r from-[#00dbe7] to-[#00f2fe] text-[#002022] hover:brightness-105 shadow-sm shadow-[#00dbe7]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title={`Upgrade from v${userInstalled?.installedVersion} to v${p.version}`}
                        >
                          {isActing ? (
                            <span className="material-symbols-outlined text-[15px] leading-none animate-spin">progress_activity</span>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[15px] leading-none">upgrade</span>
                              <span>Update</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex-1 min-w-0 h-9 px-2.5 rounded-xl text-xs font-mono font-semibold bg-[#00e476]/10 border border-[#00e476]/30 text-[#008744] dark:text-[#00fb83] flex items-center justify-center gap-1.5 select-none shadow-sm">
                          <span className="material-symbols-outlined text-[15px] leading-none text-[#00a854] dark:text-[#00fb83]">check_circle</span>
                          <span>Installed</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleUninstall(p.id, p.name)}
                        title={`Uninstall ${p.name} from workspace`}
                        className="h-9 px-2.5 rounded-xl text-xs font-mono font-semibold border border-red-500/25 dark:border-red-400/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {isActing ? (
                          <span className="material-symbols-outlined text-[15px] leading-none animate-spin">progress_activity</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[15px] leading-none">delete_outline</span>
                            <span>Uninstall</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleInstall(p.id, p.name)}
                      className="flex-1 min-w-0 h-9 px-4 rounded-xl text-xs font-mono font-semibold bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff] hover:shadow-md hover:shadow-[#00dbe7]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isActing ? (
                        <>
                          <span className="material-symbols-outlined text-[15px] leading-none animate-spin">progress_activity</span>
                          <span>Installing...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[15px] leading-none">download</span>
                          <span>Install</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extension Detail Modal */}
      {activeModalPlugin && (() => {
        const meta = getPluginMeta(activeModalPlugin.id);
        const isInstalled = installedIds.has(activeModalPlugin.id);
        const userInstalled = installed.find(i => i.id === activeModalPlugin.id);
        const hasUpdate = isInstalled && userInstalled?.installedVersion && userInstalled.installedVersion !== activeModalPlugin.version;
        const isActing = loadingPluginId === activeModalPlugin.id;
        const reviews = activeModalPlugin.reviews || [];
        const hasReviews = (activeModalPlugin.reviewsCount || 0) > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div
              className="relative w-full max-w-4xl xl:max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border border-outline/40 bg-surface-container-lowest/95 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-outline/20 relative bg-surface-container-low/50">
                <button
                  onClick={() => setActiveModalPlugin(null)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  ✕
                </button>

                <div className="flex items-start gap-4 sm:gap-5 pr-8">
                  <div
                    style={{
                      background: meta.accentBg,
                      borderColor: meta.accentBorder,
                      color: meta.accentColor
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-4xl">{activeModalPlugin.iconSymbol}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/30 font-semibold">
                        {activeModalPlugin.category}
                      </span>
                      <span className="text-xs font-mono text-on-surface-variant">v{activeModalPlugin.version}</span>
                      {isBetaVersion(activeModalPlugin.version) && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-400/15 text-amber-500 dark:text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Beta Stage
                        </span>
                      )}
                      <span className="text-xs font-mono text-[#00e476]">{activeModalPlugin.type}</span>
                    </div>

                    <h2 className="text-2xl font-bold text-on-surface mt-1 flex items-center gap-2">
                      {activeModalPlugin.name}
                      <span className="material-symbols-outlined text-[#00dbe7] text-lg">verified</span>
                    </h2>

                    <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                      Published by <span className="text-[#00dbe7]">{meta.publisher}</span>
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                      {hasReviews ? (
                        <>
                          <span className="text-amber-400 font-bold">★ {activeModalPlugin.rating}</span>
                          <span className="text-on-surface-variant">
                            ({activeModalPlugin.reviewsCount} verified {activeModalPlugin.reviewsCount === 1 ? 'review' : 'reviews'})
                          </span>
                        </>
                      ) : (
                        <span className="text-on-surface-variant">No reviews yet</span>
                      )}
                      <span className="text-outline/40">•</span>
                      <span className="text-[#00e476] font-semibold">
                        {activeModalPlugin.installsCount || 0} active {activeModalPlugin.installsCount === 1 ? 'install' : 'installs'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button in Modal Header: Installed / Uninstall */}
                <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-outline/10">
                  <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-[#00e476]">lock</span>
                    <span>Sovereign Sandboxed Engine</span>
                  </div>

                  {isInstalled ? (
                    <div className="flex items-center gap-2">
                      {hasUpdate && (
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleInstall(activeModalPlugin.id, activeModalPlugin.name)}
                          className="h-9 px-3.5 rounded-xl text-xs font-mono font-semibold bg-gradient-to-r from-[#00dbe7] to-[#00f2fe] text-[#002022] hover:brightness-105 shadow-sm shadow-[#00dbe7]/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title={`Upgrade from v${userInstalled?.installedVersion} to v${activeModalPlugin.version}`}
                        >
                          <span className="material-symbols-outlined text-[15px] leading-none">upgrade</span>
                          {isActing ? 'Updating...' : `Update to v${activeModalPlugin.version}`}
                        </button>
                      )}
                      <span className="h-9 px-3 rounded-xl bg-[#00e476]/10 text-[#008744] dark:text-[#00fb83] border border-[#00e476]/30 text-xs font-mono font-semibold flex items-center gap-1.5 select-none shadow-sm">
                        <span className="material-symbols-outlined text-[15px] leading-none text-[#00a854] dark:text-[#00fb83]">check_circle</span>
                        Installed {userInstalled?.installedVersion ? `(v${userInstalled.installedVersion})` : ''}
                      </span>
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleUninstall(activeModalPlugin.id, activeModalPlugin.name)}
                        className="h-9 px-3 rounded-xl text-xs font-mono font-semibold border border-red-500/25 dark:border-red-400/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[15px] leading-none">delete_outline</span>
                        {isActing ? 'Uninstalling...' : 'Uninstall'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleInstall(activeModalPlugin.id, activeModalPlugin.name)}
                      className="h-9 px-5 rounded-xl text-xs font-mono font-semibold bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff] hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isActing ? (
                        <>
                          <span className="material-symbols-outlined text-[15px] leading-none animate-spin">progress_activity</span>
                          Installing...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[15px] leading-none">download</span>
                          Install to Workspace
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="flex items-center gap-1 px-6 border-b border-outline/20 bg-surface-container-lowest overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
                {(['overview', 'features', 'permissions', 'releases', 'reviews', 'specs'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setModalTab(tab)}
                    className={`px-4 py-3 text-xs font-mono capitalize transition-all border-b-2 font-medium shrink-0 flex items-center gap-1.5 -mb-px ${
                      modalTab === tab
                        ? 'border-[#00dbe7] text-[#00dbe7] font-bold'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>
                      {tab === 'reviews' ? 'Reviews & Ratings' : tab === 'releases' ? 'Releases & Changelog' : tab}
                    </span>
                    {tab === 'reviews' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container text-on-surface-variant font-bold leading-none">
                        {reviews.length}
                      </span>
                    )}
                    {tab === 'releases' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container text-on-surface-variant font-bold leading-none">
                        {(activeModalPlugin.versions || []).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar space-y-4">
                {modalTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase text-on-surface-variant tracking-wider mb-1.5">
                        Overview
                      </h4>
                      <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                        {activeModalPlugin.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase text-on-surface-variant tracking-wider mb-2">
                        Tags & Capabilities
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {meta.tags.map(t => (
                          <span
                            key={t}
                            className="text-xs font-mono px-2.5 py-1 rounded-lg bg-surface-container border border-outline/20 text-[#74f5ff]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container border border-outline/20">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-on-surface mb-1">
                        <span className="material-symbols-outlined text-sm text-[#00dbe7]">shield</span>
                        Zero-Trust Security Guarantee
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        This plugin executes inside an isolated V8 container. It can only interact with external services and database tables that have been explicitly declared in its manifest.
                      </p>
                    </div>
                  </div>
                )}

                {modalTab === 'features' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-on-surface-variant tracking-wider mb-2">
                      Key Highlights & Functional Abilities
                    </h4>
                    <ul className="space-y-2.5">
                      {meta.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-surface-container/50 border border-outline/10 text-xs">
                          <span className="material-symbols-outlined text-[#00e476] text-sm shrink-0 mt-0.5">check_circle</span>
                          <span className="text-on-surface leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {modalTab === 'permissions' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-on-surface-variant tracking-wider mb-2">
                      Declared Sandbox Permissions
                    </h4>
                    <div className="space-y-2">
                      {meta.permissions.map((perm, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-3 p-3 rounded-xl bg-surface-container/60 border border-outline/10"
                        >
                          <div>
                            <div className="text-xs font-mono font-bold text-on-surface">{perm.name}</div>
                            <div className="text-xs text-on-surface-variant mt-0.5">{perm.description}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#00e476]/15 text-[#00e476] border border-[#00fb83]/30 shrink-0">
                            Granted
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Releases & Changelog History Tab */}
                {modalTab === 'releases' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-outline/10">
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase text-on-surface-variant tracking-wider">
                          Release History & Changelog
                        </h4>
                        <p className="text-[11px] text-on-surface-variant/80 font-mono mt-0.5">
                          Immutable release versions with cryptographically verified checksums
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        Latest: <span className="text-[#00dbe7] font-bold">v{activeModalPlugin.version}</span>
                      </span>
                    </div>

                    {(!activeModalPlugin.versions || activeModalPlugin.versions.length === 0) ? (
                      <div className="p-8 rounded-2xl border border-outline/20 text-center text-xs text-on-surface-variant bg-surface-container/30">
                        <span className="material-symbols-outlined text-3xl mb-2 text-on-surface-variant/60 block">history_toggle_off</span>
                        No historical release logs recorded. Current version is v{activeModalPlugin.version}.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {[...(activeModalPlugin.versions || [])]
                          .sort((a, b) => {
                            const sDiff = compareSemverDesc(a.version, b.version);
                            if (sDiff !== 0) return sDiff;
                            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                          })
                          .map((ver, idx) => {
                          const isLatest = idx === 0;
                          const isUserInstalled = userInstalled?.installedVersion === ver.version;

                          return (
                            <div
                              key={ver.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                isLatest
                                  ? 'bg-surface-container/60 border-[#00dbe7]/40 shadow-md shadow-[#00dbe7]/5'
                                  : 'bg-surface-container/30 border-outline/15'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40">
                                    v{ver.version}
                                  </span>
                                  {isBetaVersion(ver.version) && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-400/10 text-amber-400 border border-amber-400/30">
                                      Beta
                                    </span>
                                  )}
                                  {isLatest && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#00e476]/15 text-[#00e476] border border-[#00fb83]/30">
                                      Latest Release
                                    </span>
                                  )}
                                  {isUserInstalled && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30">
                                      Installed in Workspace
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] font-mono text-on-surface-variant flex items-center gap-2">
                                  {ver.publishedBy && <span>by {ver.publishedBy}</span>}
                                  <span>•</span>
                                  <span>{new Date(ver.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                              </div>

                              {ver.changelog ? (
                                <div className="text-xs text-on-surface dark:text-[#d3e5e6] leading-relaxed whitespace-pre-line bg-surface-container-lowest/70 p-3.5 rounded-xl border border-outline/10 font-sans my-2.5">
                                  {ver.changelog}
                                </div>
                              ) : (
                                <div className="text-xs italic text-on-surface-variant/70 my-2">
                                  Standard stability maintenance and runtime optimizations.
                                </div>
                              )}

                              {/* Integrity & Archive Metadata */}
                              <div className="mt-3 pt-2.5 border-t border-outline/10 flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono text-on-surface-variant">
                                {ver.checksumSha256 ? (
                                  <div className="flex items-center gap-1.5 truncate max-w-sm sm:max-w-md">
                                    <span className="text-[#00dbe7] font-semibold">SHA-256:</span>
                                    <span className="truncate opacity-80" title={ver.checksumSha256}>{ver.checksumSha256}</span>
                                  </div>
                                ) : (
                                  <span className="opacity-70">Core Engine Native Bundle</span>
                                )}

                                {ver.packageUrl && (
                                  <a
                                    href={ver.packageUrl}
                                    download
                                    className="inline-flex items-center gap-1 text-[#00dbe7] hover:underline font-semibold"
                                  >
                                    <span className="material-symbols-outlined text-xs">download</span>
                                    Download Archive Package (.zip)
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Real Reviews & Feedback Tab */}
                {modalTab === 'reviews' && (
                  <div className="space-y-5">
                    {/* Rating Overview Card */}
                    <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-3xl font-extrabold text-on-surface font-mono flex items-center gap-2">
                          <span className="text-amber-400">★</span>
                          <span>{hasReviews ? activeModalPlugin.rating : '—'}</span>
                          <span className="text-sm font-normal text-on-surface-variant">/ 5.0</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 font-mono">
                          Based on {reviews.length} authentic {reviews.length === 1 ? 'user rating' : 'user ratings'} in Neon Postgres
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => {
                          const activeRating = activeModalPlugin.rating || 0;
                          return (
                            <span
                              key={star}
                              className={`material-symbols-outlined text-2xl ${
                                star <= Math.round(activeRating) ? 'text-amber-400' : 'text-outline/30'
                              }`}
                            >
                              star
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* User Review Status / Edit Banner */}
                    {(() => {
                      const userExistingReview = reviews.find(r => r.userEmail === userEmail);
                      return (
                        <>
                          {userExistingReview && (
                            <div className="p-3.5 rounded-2xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs font-mono text-[#00dbe7]">
                                <span className="material-symbols-outlined text-base">edit_note</span>
                                <span>You rated this plugin <strong>{userExistingReview.rating} ★</strong>. Modify your rating or feedback below to update your review.</span>
                              </div>
                              <button
                                type="button"
                                disabled={isSubmittingReview}
                                onClick={() => handleDeleteReview(activeModalPlugin.id, activeModalPlugin.name)}
                                className="px-3 py-1.5 rounded-xl text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors border border-red-400/30 shrink-0 flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                                Delete Review
                              </button>
                            </div>
                          )}

                          {/* Interactive Review Form */}
                          <div ref={reviewFormRef} className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline/30 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                                {userExistingReview ? (
                                  <>
                                    <span className="material-symbols-outlined text-sm text-[#00dbe7]">edit</span>
                                    Edit Your Review & Rating
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-sm text-[#00dbe7]">rate_review</span>
                                    Rate & Review this Plugin
                                  </>
                                )}
                              </h4>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setUserRatingInput(star)}
                                    className="focus:outline-none transition-transform hover:scale-125"
                                  >
                                    <span
                                      className={`material-symbols-outlined text-xl ${
                                        star <= userRatingInput ? 'text-amber-400' : 'text-outline/30'
                                      }`}
                                    >
                                      star
                                    </span>
                                  </button>
                                ))}
                                <span className="text-xs font-mono font-bold text-amber-400 ml-1">
                                  {userRatingInput}.0
                                </span>
                              </div>
                            </div>

                            <textarea
                              value={userFeedbackInput}
                              onChange={e => setUserFeedbackInput(e.target.value)}
                              placeholder="Share your real feedback, performance thoughts, or feature requests..."
                              rows={2}
                              className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline/30 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-[#00dbe7] transition-all resize-none"
                            />

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-mono text-on-surface-variant">
                                Posting as <span className="text-[#00dbe7]">{userEmail}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                {userExistingReview && (
                                  <button
                                    type="button"
                                    disabled={isSubmittingReview}
                                    onClick={() => handleDeleteReview(activeModalPlugin.id, activeModalPlugin.name)}
                                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    Delete
                                  </button>
                                )}
                                <button
                                  disabled={isSubmittingReview}
                                  onClick={() => handleSubmitReview(activeModalPlugin.id, activeModalPlugin.name)}
                                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff] transition-all disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {isSubmittingReview ? (
                                    <>
                                      <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                                      Saving...
                                    </>
                                  ) : userExistingReview ? (
                                    'Update Review'
                                  ) : (
                                    'Submit Review'
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Real Reviews List */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-mono font-bold uppercase text-on-surface-variant tracking-wider">
                              Community Reviews ({reviews.length})
                            </h4>

                            {reviews.length === 0 ? (
                              <div className="p-6 rounded-xl border border-outline/20 text-center text-xs text-on-surface-variant">
                                No reviews submitted yet. Rate this extension above to share your feedback!
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {reviews.map(r => {
                                  const isUserReview = r.userEmail === userEmail;
                                  const isEdited = r.updatedAt && new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 1000;

                                  return (
                                    <div
                                      key={r.id}
                                      className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                                        isUserReview
                                          ? 'bg-[#00dbe7]/5 border-[#00dbe7]/30 ring-1 ring-[#00dbe7]/20'
                                          : 'bg-surface-container/50 border border-outline/10'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-on-surface font-mono">
                                            {r.userName}
                                          </span>
                                          {isUserReview && (
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                                              You
                                            </span>
                                          )}
                                          <span className="text-[10px] font-mono text-on-surface-variant">
                                            {r.userEmail}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-0.5 text-amber-400">
                                            {[1, 2, 3, 4, 5].map(s => (
                                              <span
                                                key={s}
                                                className={`material-symbols-outlined text-sm ${
                                                  s <= r.rating ? 'text-amber-400' : 'text-outline/20'
                                                }`}
                                              >
                                                star
                                              </span>
                                            ))}
                                          </div>

                                          {isUserReview && (
                                            <div className="flex items-center gap-1 ml-2">
                                              <button
                                                type="button"
                                                onClick={() => handleStartEditReview(r.rating, r.feedback)}
                                                className="p-1 rounded text-on-surface-variant hover:text-[#00dbe7] hover:bg-surface-container transition-colors"
                                                title="Edit your review"
                                              >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteReview(activeModalPlugin.id, activeModalPlugin.name)}
                                                className="p-1 rounded text-on-surface-variant hover:text-red-400 hover:bg-surface-container transition-colors"
                                                title="Delete your review"
                                              >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {r.feedback && (
                                        <p className="text-xs text-on-surface-variant dark:text-[#b9cacb] leading-relaxed mt-0.5">
                                          "{r.feedback}"
                                        </p>
                                      )}

                                      <div className="text-[10px] font-mono text-on-surface-variant/60 mt-1 flex items-center gap-2">
                                        <span>
                                          {new Date(r.createdAt).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                          })}
                                        </span>
                                        {isEdited && (
                                          <span className="text-[9px] text-on-surface-variant/70 italic">
                                            (edited)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {modalTab === 'specs' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-on-surface-variant tracking-wider mb-2">
                      Technical Specifications & Manifest
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-surface-container/50 border border-outline/10">
                        <span className="text-[10px] text-on-surface-variant block">Manifest Identifier</span>
                        <span className="text-on-surface font-bold break-all">{activeModalPlugin.id}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container/50 border border-outline/10">
                        <span className="text-[10px] text-on-surface-variant block">Semantic Version & Stage</span>
                        <span className="text-on-surface font-bold flex items-center gap-1.5 mt-0.5">
                          v{activeModalPlugin.version}
                          {isBetaVersion(activeModalPlugin.version) && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-500 dark:text-amber-300 border border-amber-400/30 uppercase font-mono font-semibold">
                              Beta
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container/50 border border-outline/10">
                        <span className="text-[10px] text-on-surface-variant block">Runtime Environment</span>
                        <span className="text-on-surface font-bold">V8 Worker Sandbox</span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container/50 border border-outline/10">
                        <span className="text-[10px] text-on-surface-variant block">Package Standard</span>
                        <span className="text-on-surface font-bold">VSIX / Zip Bundled</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-outline/20 bg-surface-container-low/50 flex items-center justify-end">
                <button
                  onClick={() => setActiveModalPlugin(null)}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-medium bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Collapsible Terminal Log Drawer */}
      <CollapsibleLogDrawer
        title="PLUGIN STORE EVENT LOG"
        logs={logs}
        defaultExpanded={false}
      />
    </div>
  );
}
