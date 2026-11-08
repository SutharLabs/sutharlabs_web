import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { UserProfile, WorkspaceTab, TerminalLog } from './types';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import StockTrackerView from './components/StockTrackerView';
import FlowDesignerView from './components/FlowDesignerView';
import AccountingView from './components/AccountingView';
import MutedMarkdownView from './components/MutedMarkdownView';
import AdminConsoleView from './components/AdminConsoleView';
import ManageDatabaseView from './components/ManageDatabaseView';
import StorageVaultView from './components/StorageVaultView';
import AdminAIChatView from './components/AdminAIChatView';
import ManageAppsView from './components/ManageAppsView';
import ManagePluginsView from './components/ManagePluginsView';
import ManagePortfoliosView from './components/ManagePortfoliosView';
import ManageContactInquiriesView from './components/ManageContactInquiriesView';
import ManageBugReportsView from './components/ManageBugReportsView';
import BugReportModal from './components/BugReportModal';
import { telemetryLogger } from './services/telemetryLogger';
import WorkspacePluginStore from './components/WorkspacePluginStore';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsentBanner from './components/CookieConsentBanner';
import PrivacyPolicyView from './components/PrivacyPolicyView';
import CopyrightView from './components/CopyrightView';
import UserProfileView from './components/UserProfileView';
import PublicToolsHubView from './components/PublicToolsHubView.js';
import { getClientPluginByName, getClientPluginByRoute, getClientPluginById } from './plugins/clientRegistry.js';
import { Menu, X, AlertTriangle, CloudOff, CheckCircle, Info, ChevronRight, Activity } from 'lucide-react';


const STORE_TOOLS: { name: WorkspaceTab; icon: string; size: string }[] = [
  { name: 'Plugin Store', icon: 'storefront', size: '' }
];

const INSTALLED_PLUGINS: { name: WorkspaceTab; icon: string; size: string }[] = [
  { name: 'Stock Tracker', icon: 'monitoring', size: '12.4 KB' },
  { name: 'Workflow', icon: 'account_tree', size: '4.8 KB' },
  { name: 'Accounting', icon: 'currency_exchange', size: '18.2 KB' },
  { name: 'Tools Studio', icon: 'build', size: '24.2 KB' },
  { name: 'Resume Studio', icon: 'description', size: '28.4 KB' },
  { name: 'Doc Nexus', icon: 'menu_book', size: '15.6 KB' },
  { name: 'Speech Studio', icon: 'record_voice_over', size: '14.8 KB' },
  { name: 'Image Studio', icon: 'photo_filter', size: '16.5 KB' },
  { name: 'StudioCast', icon: 'podcasts', size: '32.1 KB' }
];

const ADMIN_TOOLS: { name: WorkspaceTab; icon: string; size: string }[] = [
  { name: 'Admin Console', icon: 'security', size: '' },
  { name: 'AI Agent Studio', icon: 'smart_toy', size: '' },
  { name: 'Manage Database', icon: 'database', size: '' },
  { name: 'Storage Vault', icon: 'lock', size: '' },
  { name: 'Reported Bugs', icon: 'bug_report', size: '' },
  { name: 'Contact Inquiries', icon: 'mark_email_unread', size: '' },
  { name: 'Manage Plugins', icon: 'bolt', size: '' },
  { name: 'Manage Apps', icon: 'apps', size: '' },
  { name: 'Manage Portfolios', icon: 'web', size: '' }
];

const ALL_TABS: { name: WorkspaceTab; icon: string; size: string }[] = [
  ...STORE_TOOLS, 
  ...INSTALLED_PLUGINS,
  { name: 'Profile & Settings', icon: 'manage_accounts', size: '' }
];


const ROUTE_MAP: Record<string, string> = {
  'Stock Tracker': '/workspace/stock-tracker',
  'Workflow': '/workspace/flow',
  'Custom Flow': '/workspace/flow',
  'Accounting': '/workspace/accounting',
  'Tools Studio': '/workspace/tools',
  'Resume Studio': '/workspace/resume',
  'Admin Console': '/admin',
  'Manage Database': '/admin/database',
  'Cloud Drive': '/admin/storage',
  'Storage Vault': '/admin/storage',
  'AI Agent Studio': '/admin/ai-studio',
  'Reported Bugs': '/admin/bug-reports',
  'Contact Inquiries': '/admin/contact-inquiries',
  'Doc Nexus': '/workspace/docnexus',
  'Speech Studio': '/workspace/speech-studio',
  'Image Studio': '/workspace/image-studio',
  'Image Studio & 4K Upscaler': '/workspace/image-studio',
  'StudioCast': '/workspace/podcast',
  'Manage Plugins': '/admin/manage-plugins',
  'Manage Apps': '/admin/manage-apps',
  'Manage Portfolios': '/admin/manage-portfolios',
  'Plugin Store': '/workspace/plugins',
  'README': '/workspace/readme',
  'Profile & Settings': '/workspace/profile'
};

const URL_TO_TAB: Record<string, WorkspaceTab> = Object.entries(ROUTE_MAP).reduce((acc, [tab, url]) => {
  acc[url] = tab as WorkspaceTab;
  return acc;
}, {} as Record<string, WorkspaceTab>);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('sutharlabs_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) return parsed;
      } catch (err) {
        console.error('Failed to load saved session:', err);
      }
    }
    return {
      email: '',
      name: '',
      isLoggedIn: false
    };
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sutharlabs_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('sutharlabs_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    telemetryLogger.setUserContext(user.isLoggedIn ? { email: user.email, role: user.role } : null);
    if (user.isLoggedIn) {
      telemetryLogger.scope('main:session').info(`Active user session bound: ${user.email} (${user.role || 'Developer'})`);
    }
  }, [user]);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const activeTab = URL_TO_TAB[location.pathname] || 'Stock Tracker';
  const setActiveTab = (tab: WorkspaceTab) => navigate(ROUTE_MAP[tab]);

  // Shared application-wide telemetry logging logs index
  const [logs, setLogs] = useState<TerminalLog[]>([
    { timestamp: '14:32:01', type: 'INFO', message: 'Initializing market data stream...' },
    { timestamp: '14:32:02', type: 'SUCCESS', message: 'Connected to WebSocket wss://data.sutharlabs.com/market' },
    { timestamp: '14:32:05', type: 'AGENT', message: 'AGENT: Loaded models for predictive analytics.' }
  ]);

  const addLog = useCallback((newLog: TerminalLog) => {
    setLogs((prev) => [...prev.slice(-100), newLog]);
  }, []);

  // Dynamic user workspace plugins with instant localStorage hydration
  const [installedPlugins, setInstalledPlugins] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_installed_plugins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const fetchInstalledPlugins = useCallback(async () => {
    if (!user.token) return;
    try {
      const res = await fetch('/api/workspace-plugins/installed', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setInstalledPlugins(data);
          try {
            localStorage.setItem('sutharlabs_installed_plugins', JSON.stringify(data));
          } catch {}
        }
      }
    } catch (e) {
      console.error("Failed to fetch installed plugins:", e);
    }
  }, [user.token]);

  useEffect(() => {
    fetchInstalledPlugins();
  }, [fetchInstalledPlugins]);

  const activeInstalledPlugins = installedPlugins.length > 0
    ? installedPlugins.map(p => ({
        name: p.name as WorkspaceTab,
        icon: p.iconSymbol || 'extension',
        size: 'Native',
        version: p.version,
        isBeta: !p.version || parseInt(p.version.replace(/^v/i, '').split('.')[0], 10) < 1
      }))
    : INSTALLED_PLUGINS.map(p => ({
        ...p,
        isBeta: true
      }));

  const handleLaunchWorkspace = () => {
    if (user.isLoggedIn) {
      navigate('/workspace/stock-tracker');
    } else {
      setAuthTab('signin');
      navigate('/auth');
    }
  };

  const handleAuthNavigate = (tab: 'signin' | 'signup') => {
    setAuthTab(tab);
    navigate('/auth');
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('sutharlabs_active_user', JSON.stringify(profile));
    navigate('/workspace/stock-tracker');
    addLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `SUCCESS: Session initialized for user ${profile.name}. authorized workspace contexts.`
    });
  };

  const handleLogout = () => {
    setUser({ email: '', name: '', isLoggedIn: false });
    localStorage.removeItem('sutharlabs_active_user');
    addLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'ALERT',
      message: 'ALERT: Session cleared. Authorization tokens revoked successfully.'
    });
  };

  // Application Top Level Routes
  return (
    <>
      <CookieConsentBanner />
      {user.isLoggedIn && user.mustChangePassword && (
        <PasswordResetModal user={user} setUser={setUser} userToken={user.token || ''} />
      )}
      <Routes>
        <Route path="/" element={
          user.isLoggedIn ? <Navigate to="/workspace/stock-tracker" replace /> : 
          <LandingPage user={user} onLaunch={handleLaunchWorkspace} onNavigateAuth={handleAuthNavigate} theme={theme} toggleTheme={toggleTheme} />
        } />
        <Route path="/portfolio" element={
          <LandingPage user={user} onLaunch={handleLaunchWorkspace} onNavigateAuth={handleAuthNavigate} theme={theme} toggleTheme={toggleTheme} />
        } />
        <Route path="/store" element={
          <LandingPage user={user} onLaunch={handleLaunchWorkspace} onNavigateAuth={handleAuthNavigate} theme={theme} toggleTheme={toggleTheme} />
        } />
        <Route path="/contact" element={
          <LandingPage user={user} onLaunch={handleLaunchWorkspace} onNavigateAuth={handleAuthNavigate} theme={theme} toggleTheme={toggleTheme} />
        } />
        <Route path="/tools" element={<PublicToolsHubView theme={theme} user={user} toggleTheme={toggleTheme} />} />
        <Route path="/tools/:toolId" element={<PublicToolsHubView theme={theme} user={user} toggleTheme={toggleTheme} />} />
        <Route path="/privacy" element={<PrivacyPolicyView />} />
        <Route path="/copyright" element={<CopyrightView />} />
        <Route path="/auth" element={
          <AuthPage initialTab={authTab} onLoginSuccess={handleLoginSuccess} onBackToHome={() => navigate('/')} />
        } />
        <Route path="/admin" element={
          <WorkspaceLayout user={user} setUser={setUser} logs={logs} addLog={addLog} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} activeInstalledPlugins={activeInstalledPlugins} fetchInstalledPlugins={fetchInstalledPlugins} />
        } />
        <Route path="/admin/*" element={
          <WorkspaceLayout user={user} setUser={setUser} logs={logs} addLog={addLog} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} activeInstalledPlugins={activeInstalledPlugins} fetchInstalledPlugins={fetchInstalledPlugins} />
        } />
        <Route path="/workspace" element={
          <WorkspaceLayout user={user} setUser={setUser} logs={logs} addLog={addLog} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} activeInstalledPlugins={activeInstalledPlugins} fetchInstalledPlugins={fetchInstalledPlugins} />
        } />
        <Route path="/workspace/*" element={
          <WorkspaceLayout user={user} setUser={setUser} logs={logs} addLog={addLog} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} activeInstalledPlugins={activeInstalledPlugins} fetchInstalledPlugins={fetchInstalledPlugins} />
        } />
        <Route path="/dashboard" element={
          <Navigate to="/workspace/stock-tracker" replace />
        } />
        <Route path="/dashboard/*" element={
          <Navigate to="/workspace/stock-tracker" replace />
        } />
        <Route path="*" element={
          <Navigate to={user.isLoggedIn ? "/workspace/stock-tracker" : "/"} replace />
        } />
      </Routes>
    </>
  );
}

function WorkspaceLayout({ user, setUser, logs, addLog, activeTab, setActiveTab, handleLogout, theme, toggleTheme, activeInstalledPlugins = INSTALLED_PLUGINS, fetchInstalledPlugins }: any) {
  const [isStoreOpen, setIsStoreOpen] = React.useState(true);
  const [isPluginsOpen, setIsPluginsOpen] = React.useState(true);
  const [isAdminOpen, setIsAdminOpen] = React.useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-close mobile drawer when navigation tab changes
  React.useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [activeTab, location.pathname]);

  // Fallback detection state for Vercel Serverless vs Dedicated Oracle VM
  const [fallbackStatus, setFallbackStatus] = React.useState<{
    isFallback: boolean;
    provider: string;
    reason?: string;
    dismissed?: boolean;
    degradedPlugins?: { id: string; name: string; reason: string }[];
  } | null>(null);

  // Probe backend health to detect Vercel serverless edge fallback vs Oracle VM
  React.useEffect(() => {
    let isMounted = true;
    const probeHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (!isMounted) return;
        const providerHeader = res.headers.get('x-backend-provider');
        const fallbackHeader = res.headers.get('x-backend-fallback');
        const fallbackReason = res.headers.get('x-backend-fallback-reason');

        let data: any = {};
        try { data = await res.json(); } catch {}

        const isFallback = fallbackHeader === 'true' || 
          providerHeader === 'vercel-serverless' || 
          data.isFallback === true || 
          data.provider === 'vercel-serverless';

        if (isFallback) {
          setFallbackStatus({
            isFallback: true,
            provider: 'vercel-serverless',
            reason: fallbackReason || data.fallbackReason || 'Oracle VM proxy unavailable',
            degradedPlugins: data.degradedPlugins || [
              {
                id: 'speech-studio',
                name: 'Speech Studio',
                reason: 'Remote VM2 Neural Synthesizer offline. Using Browser Web Speech & In-Context reference clips.'
              },
              {
                id: 'wp_flow_designer',
                name: 'Flow Designer',
                reason: 'Persistent automation daemon workers require dedicated VM compute.'
              }
            ]
          });
        }
      } catch {
        // Network or fetch error
      }
    };
    probeHealth();
    return () => { isMounted = false; };
  }, []);
  
  if (!user.isLoggedIn) return <Navigate to="/auth" />;

  return (
    <div className={`min-h-screen flex flex-col font-sans overflow-hidden transition-colors ${
      theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-[#050505] text-[#e5e1e4]'
    }`}>
      {/* SutharLabs App Workspace Top Navigation Header */}
      <header className={`h-14 border-b px-3 sm:px-6 flex items-center justify-between z-20 select-none relative transition-colors ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-800 backdrop-blur-md shadow-xs'
          : 'bg-[#131315]/95 border-[#3a494b]/20 text-[#e5e1e4] backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`md:hidden w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#74f5ff] border-[#00dbe7]/30'
            }`}
            aria-label="Open mobile navigation menu"
            title="Open Menu"
          >
            <Menu className="w-4 h-4 shrink-0" />
          </button>

          {/* Logo brand home return */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group shrink-0"
            title="Return to Home"
          >
            <img 
              src="/sutharlabs-logo-sm.png?v=20261107-v3s" 
              alt="SutharLabs Logo" 
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain transition-transform duration-300 group-hover:scale-105 shrink-0 drop-shadow-[0_0_6px_rgba(0,219,231,0.4)]" 
            />
            <span className="text-base sm:text-lg font-bold text-[#74f5ff] tracking-tight neon-text-glow truncate">
              SutharLabs
            </span>
          </div>

          <div className="hidden md:block h-4 w-[1px] bg-[#3a494b]/30"></div>
          {/* WorkPath Breadcrumbs (shown on tablet/desktop to preserve space for header controls) */}
          <div className="hidden md:flex items-center gap-1.5 font-mono text-[10px] text-[#b9cacb]/80">
            <span className="hover:text-white transition-all cursor-pointer">sutharlabs</span>
            <span className="text-[#849495] select-none">/</span>
            <span className="hover:text-white transition-all cursor-pointer">workspace</span>
            <span className="text-[#849495] select-none">/</span>
            <span className="text-[#00dbe7] font-semibold">{activeTab}</span>
          </div>
        </div>

        {/* Action Widgets & controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 font-mono text-[11px] shrink-0">
          <div className="hidden lg:flex items-center gap-3 text-[#b9cacb] mr-2">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Node Speed:</span>
              <span className="text-[#00e476] font-bold">14ms</span>
            </div>
            <div className="w-[1px] h-3 bg-[#3a494b]/30"></div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">DB Status:</span>
              <span className="text-[#ce5dff] font-bold">Syncing</span>
            </div>
          </div>

          {/* Admin Rank Badge (visible on tablet/desktop) */}
          {user.role === 'Admin' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <span className="material-symbols-outlined text-xs leading-none">admin_panel_settings</span>
              <span>ADMIN</span>
            </span>
          )}

          {/* User Profile Button */}
          <button
            type="button"
            onClick={() => setActiveTab('Profile & Settings')}
            className={`h-8 px-2 sm:px-2.5 rounded-lg border transition-all flex items-center gap-1.5 font-mono text-[10px] cursor-pointer ${
              activeTab === 'Profile & Settings'
                ? 'bg-[#00dbe7]/15 border-[#00dbe7]/50 text-[#00dbe7] font-bold shadow-sm shadow-[#00dbe7]/10'
                : theme === 'light'
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-[#201f21] hover:bg-[#28272a] border-[#3a494b]/30 text-[#e5e1e4] hover:text-[#00dbe7]'
            }`}
            title="Profile, Data Governance & Security Settings"
          >
            <span className="material-symbols-outlined text-sm select-none leading-none">person</span>
            <span className="hidden md:inline">Profile</span>
          </button>

          {/* Quick Bug Report & Live Telemetry Trigger */}
          <button
            type="button"
            onClick={() => setIsBugReportOpen(true)}
            className="hidden sm:flex h-8 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all items-center gap-1.5 font-mono text-[10px] cursor-pointer"
            title="Report an issue or submit live telemetry diagnostics"
          >
            <span className="material-symbols-outlined text-sm select-none leading-none">bug_report</span>
            <span className="hidden md:inline">Report Issue</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer shrink-0 ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:text-sky-600'
                : 'bg-[#201f21] hover:bg-[#28272a] border-[#3a494b]/30 text-[#e5e1e4] hover:text-[#00dbe7]'
            }`}
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            aria-label="Toggle visual theme"
          >
            <span className="material-symbols-outlined text-sm select-none leading-none">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Leave Workspace Button */}
          <button 
            type="button"
            onClick={handleLogout}
            className={`h-8 px-2 sm:px-3 rounded-lg border transition-all font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1 shrink-0 ${
              theme === 'light'
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}
            title="Leave Workspace & Log out"
          >
            <span className="material-symbols-outlined text-sm select-none leading-none">logout</span>
            <span className="hidden md:inline">Leave Workspace</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Slide-Over Drawer */}
      {isMobileDrawerOpen && (
        <div 
          className="fixed inset-0 z-[999] md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-200 z-[999]"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className={`relative w-80 max-w-[85vw] flex flex-col h-full shadow-2xl z-[1000] border-r animate-in slide-in-from-left duration-200 select-none ${
            theme === 'light'
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#131315] border-[#3a494b]/30 text-[#e5e1e4]'
          }`}>
            {/* Drawer Header */}
            <div className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
              theme === 'light' ? 'border-slate-200 bg-slate-50/80' : 'border-[#3a494b]/20 bg-[#0e0e10]/80'
            }`}>
              <div 
                onClick={() => { navigate('/'); setIsMobileDrawerOpen(false); }}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <img 
                  src="/sutharlabs-logo-sm.png?v=20261107-v3s" 
                  alt="SutharLabs Logo" 
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain transition-transform duration-300 group-hover:scale-105 shrink-0 drop-shadow-[0_0_6px_rgba(0,219,231,0.4)]" 
                />
                <span className="text-base font-bold text-[#74f5ff] tracking-tight neon-text-glow">
                  SutharLabs
                </span>
                {user.role === 'Admin' ? (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    ADMIN
                  </span>
                ) : (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    DEV
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  theme === 'light'
                    ? 'border-slate-300 hover:bg-slate-200 text-slate-700'
                    : 'border-[#3a494b]/40 hover:bg-white/5 text-[#b9cacb]'
                }`}
                aria-label="Close menu"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Drawer Scrollable Navigation Tree */}
            <div className="flex-1 py-3 px-2.5 overflow-y-auto custom-scrollbar space-y-4">
              
              {/* SECTION 1: PLUGIN STORE */}
              <div>
                <div 
                  className="flex items-center px-2 mb-1.5 text-[10px] font-mono text-[#849495] tracking-widest uppercase justify-between cursor-pointer select-none"
                  onClick={() => setIsStoreOpen(!isStoreOpen)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isStoreOpen ? 'rotate-90' : ''}`}>chevron_right</span>
                    <span>PLUGIN STORE</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-gray-500">storefront</span>
                </div>
                {isStoreOpen && (
                  <div className="space-y-1">
                    {STORE_TOOLS.map((file) => {
                      const isSelected = activeTab === file.name;
                      return (
                        <button
                          key={file.name}
                          type="button"
                          onClick={() => { setActiveTab(file.name); setIsMobileDrawerOpen(false); }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg font-mono text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30 font-bold shadow-sm'
                              : theme === 'light'
                                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                : 'text-[#b9cacb] hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base shrink-0 ${isSelected ? 'text-[#00dbe7]' : 'text-gray-500'}`}>
                              {file.icon}
                            </span>
                            <span className="truncate">{file.name}</span>
                          </div>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20">
                            Explore
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: INSTALLED PLUGINS */}
              <div>
                <div 
                  className="flex items-center px-2 mb-1.5 text-[10px] font-mono text-[#849495] tracking-widest uppercase justify-between cursor-pointer select-none"
                  onClick={() => setIsPluginsOpen(!isPluginsOpen)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isPluginsOpen ? 'rotate-90' : ''}`}>chevron_right</span>
                    <span>INSTALLED PLUGINS</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-container-low text-on-surface-variant border border-outline/30">
                    {activeInstalledPlugins.length}
                  </span>
                </div>
                {isPluginsOpen && (
                  <div className="space-y-1">
                    {activeInstalledPlugins.map((file) => {
                      const isSelected = activeTab === file.name;
                      return (
                        <button
                          key={file.name}
                          type="button"
                          onClick={() => { setActiveTab(file.name); setIsMobileDrawerOpen(false); }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg font-mono text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30 font-bold shadow-sm'
                              : theme === 'light'
                                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                : 'text-[#b9cacb] hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className={`material-symbols-outlined text-base shrink-0 ${isSelected ? 'text-[#00dbe7]' : 'text-gray-500'}`}>
                              {file.icon}
                            </span>
                            <span className="truncate">{file.name}</span>
                          </div>
                          {(file as any).isBeta && (
                            <span className="text-[8px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-amber-400/15 text-amber-500 border border-amber-400/30 shrink-0">
                              Beta
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 3: ADMINISTRATION (VISIBLE IF USER IS ADMIN) */}
              {user.role === 'Admin' && (
                <div className="pt-2 border-t border-outline/10">
                  <div 
                    className="flex items-center px-2 mb-1.5 text-[10px] font-mono text-[#ffb4ab] tracking-widest uppercase justify-between cursor-pointer select-none"
                    onClick={() => setIsAdminOpen(!isAdminOpen)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isAdminOpen ? 'rotate-90' : ''}`}>chevron_right</span>
                      <span className="font-bold">ADMINISTRATION</span>
                    </div>
                    <span className="material-symbols-outlined text-sm text-[#ffb4ab]">admin_panel_settings</span>
                  </div>
                  {isAdminOpen && (
                    <div className="space-y-1">
                      {ADMIN_TOOLS.map((file) => {
                        const isSelected = activeTab === file.name;
                        return (
                          <button
                            key={file.name}
                            type="button"
                            onClick={() => { setActiveTab(file.name); setIsMobileDrawerOpen(false); }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg font-mono text-xs text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/40 font-bold shadow-sm'
                                : theme === 'light'
                                  ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                  : 'text-[#b9cacb] hover:text-white hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className={`material-symbols-outlined text-base shrink-0 ${isSelected ? 'text-[#ffb4ab]' : 'text-gray-500'}`}>
                                {file.icon}
                              </span>
                              <span className="truncate">{file.name}</span>
                            </div>
                            {file.name === 'Manage Plugins' && (
                              <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20 shrink-0">
                                Upload
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions & Utilities */}
              <div className="pt-2 border-t border-outline/10 space-y-1">
                <button
                  type="button"
                  onClick={() => { setIsBugReportOpen(true); setIsMobileDrawerOpen(false); }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg font-mono text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base shrink-0">bug_report</span>
                  <span>Report Issue / Diagnostics</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer (User Card & Logout) */}
            <div className={`p-3 border-t shrink-0 flex flex-col gap-2.5 ${
              theme === 'light' ? 'border-slate-200 bg-slate-50/80' : 'border-[#3a494b]/20 bg-[#0e0e10]/80'
            }`}>
              <div 
                onClick={() => { setActiveTab('Profile & Settings'); setIsMobileDrawerOpen(false); }}
                className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  activeTab === 'Profile & Settings'
                    ? 'bg-[#00dbe7]/15 border-[#00dbe7]/40 text-[#00dbe7]'
                    : theme === 'light'
                      ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                      : 'bg-[#18181b] border-[#3a494b]/30 hover:bg-[#222228] text-[#e5e1e4]'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#ce5dff]/15 border border-[#ce5dff]/40 flex items-center justify-center text-xs font-bold text-[#ebb2ff] uppercase select-none shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-grow min-w-0">
                  <span className="font-sans text-xs font-bold block truncate">{user.name}</span>
                  <span className="font-mono text-[9px] text-[#849495] block truncate">{user.email}</span>
                </div>
                <span className="material-symbols-outlined text-base text-[#849495] shrink-0">settings</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm leading-none">logout</span>
                <span>Leave Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main split dashboard panel layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Center Fold/Expand Tab Button on left side panel border */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className={`hidden md:flex fixed top-1/2 -translate-y-1/2 z-40 items-center justify-center w-5 h-12 transition-all duration-300 ease-in-out cursor-pointer group shadow-lg ${
            isSidebarOpen 
              ? 'left-64 -translate-x-1/2 rounded-full' 
              : 'left-0 translate-x-0 rounded-r-md border-l-0'
          } ${
            theme === 'light'
              ? 'bg-white border border-slate-300 text-slate-700 hover:text-sky-600 hover:border-sky-500 hover:bg-slate-50 shadow-slate-300/60'
              : 'bg-[#18181b] border border-[#3a494b]/50 text-[#b9cacb] hover:text-[#00dbe7] hover:border-[#00dbe7]/60 hover:bg-[#222228] shadow-black/80'
          }`}
        >
          <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'} group-hover:scale-110`}>
            chevron_left
          </span>
        </button>

        {/* Left Hand Sidebar Explorer directory tree */}
        <aside className={`${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none border-r-0'} transition-all duration-300 ease-in-out border-r flex flex-col justify-between select-none shrink-0 hidden md:flex overflow-hidden ${
          theme === 'light' ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#131315]/95 border-[#3a494b]/10 text-[#e5e1e4]'
        }`}>
          <div className="w-64 flex flex-col h-full justify-between shrink-0">
            {/* Main folder tree structure */}
            <div className="flex-1 py-4 flex flex-col overflow-y-auto custom-scrollbar">
            
            {/* SECTION 1: PLUGIN STORE & DISCOVER (FOR ALL USERS) */}
            <div 
              className="flex items-center px-4 mt-2 mb-2 text-[10px] font-mono text-[#849495] tracking-widest uppercase justify-between cursor-pointer hover:text-white transition-colors group select-none"
              onClick={() => setIsStoreOpen(!isStoreOpen)}
            >
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isStoreOpen ? 'rotate-90' : ''}`}>chevron_right</span>
                <span>PLUGIN STORE</span>
              </div>
              <span className="material-symbols-outlined text-sm text-gray-500 group-hover:text-[#74f5ff]">storefront</span>
            </div>
            
            {isStoreOpen && (
              <div className="space-y-[2px] px-2 mb-5">
                {STORE_TOOLS.map((file) => {
                  const isSelected = activeTab === file.name;
                  return (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => setActiveTab(file.name)}
                      className={`w-full flex items-center justify-between p-2.5 rounded font-mono text-xs text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20 font-bold shadow-[inset_0_0_8px_rgba(0,219,231,0.05)]' 
                          : theme === 'light'
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            : 'text-[#b9cacb]/95 hover:text-[#e5e1e4] hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`material-symbols-outlined text-base ${isSelected ? 'text-[#00dbe7]' : 'text-gray-500'}`}>
                          {file.icon}
                        </span>
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20">
                        Explore
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* SECTION 2: INSTALLED PLUGINS (FOR ALL USERS) */}
            <div 
              className="flex items-center px-4 mb-2 text-[10px] font-mono text-[#849495] tracking-widest uppercase justify-between cursor-pointer hover:text-white transition-colors group select-none"
              onClick={() => setIsPluginsOpen(!isPluginsOpen)}
            >
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isPluginsOpen ? 'rotate-90' : ''}`}>chevron_right</span>
                <span>INSTALLED PLUGINS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-container-low text-on-surface-variant border border-outline/30">
                  {activeInstalledPlugins.length}
                </span>
                <span className="material-symbols-outlined text-sm text-gray-500 group-hover:text-[#74f5ff]">extension</span>
              </div>
            </div>
            
            {isPluginsOpen && (
              <div className="space-y-[2px] px-2 mb-5">
                {activeInstalledPlugins.map((file) => {
                  const isSelected = activeTab === file.name;
                  return (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => setActiveTab(file.name)}
                      className={`w-full flex items-center justify-between p-2.5 rounded font-mono text-xs text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20 font-bold shadow-[inset_0_0_8px_rgba(0,219,231,0.05)]' 
                          : theme === 'light'
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            : 'text-[#b9cacb]/95 hover:text-[#e5e1e4] hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`material-symbols-outlined text-base ${isSelected ? 'text-[#00dbe7]' : 'text-gray-500'}`}>
                          {file.icon}
                        </span>
                        <span className="truncate">{file.name}</span>
                        {(file as any).isBeta && (
                          <span className="text-[8px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-amber-400/15 text-amber-500 dark:text-amber-300 border border-amber-400/30">
                            Beta
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* SECTION 3: ADMINISTRATION (ADMIN USERS ONLY) */}
            {user.role === 'Admin' && (
              <div className="mt-2 pt-3 border-t border-outline/10 flex-grow">
                <div 
                  className="flex items-center px-4 mb-2 text-[10px] font-mono text-[#849495] tracking-widest uppercase justify-between cursor-pointer hover:text-white transition-colors group select-none"
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isAdminOpen ? 'rotate-90' : ''}`}>chevron_right</span>
                    <span>ADMINISTRATION</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-[#ffb4ab]/80 group-hover:text-[#ffb4ab]">admin_panel_settings</span>
                </div>

                {isAdminOpen && (
                  <div className="space-y-[2px] px-2 mb-4">
                    {ADMIN_TOOLS.map((file) => {
                      const isSelected = activeTab === file.name;
                      return (
                        <button
                          key={file.name}
                          type="button"
                          onClick={() => setActiveTab(file.name)}
                          className={`w-full flex items-center justify-between p-2.5 rounded font-mono text-xs text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30 font-bold shadow-[inset_0_0_8px_rgba(255,180,171,0.05)]' 
                              : theme === 'light'
                                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                : 'text-[#b9cacb]/95 hover:text-[#e5e1e4] hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-base ${isSelected ? 'text-[#ffb4ab]' : 'text-gray-500'}`}>
                              {file.icon}
                            </span>
                            <span className="truncate">{file.name}</span>
                          </div>
                          {file.name === 'Manage Plugins' && (
                            <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20">
                              Upload
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User authenticated credentials footer card */}
          <div 
            onClick={() => setActiveTab('Profile & Settings')}
            className={`p-3.5 border-t flex items-center gap-3 cursor-pointer transition-colors ${
              activeTab === 'Profile & Settings'
                ? 'bg-[#00dbe7]/10 border-l-2 border-l-[#00dbe7]'
                : theme === 'light'
                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  : 'bg-[#0e0e10]/80 border-[#3a494b]/10 hover:bg-[#1a191d]'
            }`}
            title="Manage Profile, Sovereign Data, & Settings"
          >
            <div className="w-8 h-8 rounded-full bg-[#ce5dff]/10 border border-[#ce5dff]/40 flex items-center justify-center text-xs font-bold text-[#ebb2ff] uppercase select-none shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-grow min-w-0">
              <span className="font-sans text-xs font-bold text-on-surface block truncate">{user.name}</span>
              <span className="font-mono text-[9px] text-[#849495] block truncate">{user.email}</span>
            </div>
            <span className={`material-symbols-outlined text-sm transition-transform ${
              activeTab === 'Profile & Settings' ? 'text-[#00dbe7] rotate-45' : 'text-[#849495] hover:text-white'
            }`}>
              settings
            </span>
          </div>
        </div>

        </aside>

        {/* Right main dynamic Workspace display screen */}
        <div className={`flex-1 flex flex-col overflow-y-auto custom-scrollbar p-2.5 sm:p-4 md:p-6 pb-16 transition-colors ${
          theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-[#050505] text-[#e5e1e4]'
        }`}>
          
          {/* Fallback Banner: Displayed when Vercel Serverless Edge Fallback is active */}
          {fallbackStatus?.isFallback && !fallbackStatus.dismissed && (
            <div className={`mb-4 p-3 sm:p-3.5 rounded-xl border flex items-start justify-between gap-3 shadow-md animate-in fade-in duration-200 transition-colors shrink-0 ${
              theme === 'light'
                ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-500/5'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200 shadow-amber-500/10'
            }`}>
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <div className="min-w-0 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold font-mono tracking-tight text-amber-500 uppercase text-[11px]">
                      Vercel Serverless Edge Fallback Active
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                      VM Unreachable
                    </span>
                  </div>
                  <p className={`mt-0.5 text-[11px] leading-relaxed font-sans ${theme === 'light' ? 'text-amber-900/90' : 'text-amber-200/80'}`}>
                    The primary Oracle Cloud VM is temporarily unreachable. The platform has automatically failed over to the Vercel Serverless Edge network. Neon PostgreSQL, client-side tools, and sovereign document suites remain 100% operational.
                  </p>
                  <div className="mt-2 flex items-center gap-2.5 sm:gap-4 text-[10px] font-mono flex-wrap">
                    <span className="flex items-center gap-1 text-rose-500 font-semibold">
                      <CloudOff className="w-3 h-3 shrink-0" />
                      Speech Studio VM2 Daemon: Degraded (Using Browser Web Speech &amp; Voice Clips)
                    </span>
                    <span className="flex items-center gap-1 text-rose-500 font-semibold">
                      <CloudOff className="w-3 h-3 shrink-0" />
                      Flow Designer Daemon: Paused
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                      <CheckCircle className="w-3 h-3 shrink-0" />
                      Sovereign Tools, Resume Studio &amp; DB: Online
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFallbackStatus(prev => prev ? { ...prev, dismissed: true } : null)}
                className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-amber-500 transition-colors shrink-0 cursor-pointer"
                title="Dismiss fallback banner"
                aria-label="Dismiss fallback notice"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}

          {/* Render Active Component File Workspace Panel */}
          <div className="flex-grow flex flex-col">
            <ErrorBoundary fallbackTitle="Active View Encountered An Error">
              {/* Dynamic In-Tree Modular Plugin Views */}
              {(() => {
                const activePlugin = getClientPluginByName(activeTab) || 
                                     getClientPluginByRoute(location.pathname) || 
                                     (activeTab === 'Image Studio' ? getClientPluginById('image-studio') : undefined);
                if (activePlugin) {
                  const Component = activePlugin.View;
                  return (
                    <Component 
                      logs={logs} 
                      onAddLog={addLog} 
                      userEmail={user.email} 
                      userToken={user.token || ''} 
                      theme={theme}
                      userRole={user.role}
                    />
                  );
                }
                return null;
              })()}

              {activeTab === 'Plugin Store' && (
                <WorkspacePluginStore 
                  logs={logs} 
                  onAddLog={addLog} 
                  userEmail={user.email} 
                  userToken={user.token || ''} 
                  onPluginsChange={fetchInstalledPlugins}
                  theme={theme}
                />
              )}

              {activeTab === 'Profile & Settings' && (
                <UserProfileView
                  user={user}
                  setUser={setUser}
                  logs={logs}
                  onAddLog={addLog}
                  onLogout={handleLogout}
                  onPluginsChange={fetchInstalledPlugins}
                  theme={theme}
                />
              )}

              {(activeTab === 'Admin Console' || activeTab === 'AI Agent Studio' || activeTab === 'Manage Database' || activeTab === 'Storage Vault' || activeTab === 'Reported Bugs' || activeTab === 'Contact Inquiries' || activeTab === 'Manage Plugins' || activeTab === 'Manage Apps' || activeTab === 'Manage Portfolios') && user.role !== 'Admin' && (
                  <div className="glass-panel p-8 rounded-xl border border-red-900/20 bg-red-950/5 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-900 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-3xl text-[#ffb4ab]">security</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">Administrative Lockdown</h3>
                    <p className="text-xs text-[#b9cacb] leading-relaxed">
                      This module is restricted to Administrator access. Your current account role is flagged as <code className="bg-[#1c1b1d] px-1.5 py-0.5 rounded text-[#00dbe7] font-mono">{user.role || 'Developer'}</code>.
                    </p>
                  </div>
              )}
              
              {activeTab === 'Admin Console' && user.role === 'Admin' && (
                <AdminConsoleView logs={logs} onAddLog={addLog} currentUserEmail={user.email} userToken={user.token || ''} theme={theme} />
              )}
              {activeTab === 'AI Agent Studio' && user.role === 'Admin' && (
                <AdminAIChatView logs={logs} onAddLog={addLog} userToken={user.token || ''} theme={theme} />
              )}
              {activeTab === 'Manage Database' && user.role === 'Admin' && (
                <ManageDatabaseView logs={logs} onAddLog={addLog} userToken={user.token || ''} theme={theme} />
              )}
              {activeTab === 'Storage Vault' && user.role === 'Admin' && (
                <StorageVaultView logs={logs} onAddLog={addLog} userToken={user.token || ''} theme={theme} />
              )}
              {activeTab === 'Reported Bugs' && user.role === 'Admin' && (
                <ManageBugReportsView logs={logs} onAddLog={addLog} userToken={user.token || ''} theme={theme} />
              )}
              {activeTab === 'Contact Inquiries' && user.role === 'Admin' && (
                <ManageContactInquiriesView logs={logs} onAddLog={addLog} userToken={user.token || ''} />
              )}
              {activeTab === 'Manage Apps' && user.role === 'Admin' && (
                <ManageAppsView logs={logs} onAddLog={addLog} userToken={user.token || ''} />
              )}
              {activeTab === 'Manage Plugins' && user.role === 'Admin' && (
                <ManagePluginsView logs={logs} onAddLog={addLog} userToken={user.token || ''} />
              )}
              {activeTab === 'Manage Portfolios' && user.role === 'Admin' && (
                <ManagePortfoliosView logs={logs} onAddLog={addLog} userToken={user.token || ''} />
              )}

              {activeTab === 'README' && (
                <MutedMarkdownView theme={theme} />
              )}

              {![
                'Stock Tracker',
                'Workflow',
                'Custom Flow',
                'Accounting',
                'Tools Studio',
                'Resume Studio',
                'Doc Nexus',
                'Speech Studio',
                'Image Studio',
                'Image Studio & 4K Upscaler',
                'Plugin Store',
                'Profile & Settings',
                'Admin Console',
                'AI Agent Studio',
                'Manage Database',
                'Storage Vault',
                'Reported Bugs',
                'Contact Inquiries',
                'Manage Apps',
                'Manage Plugins',
                'Manage Portfolios',
                'README'
              ].includes(activeTab) && !getClientPluginByName(activeTab) && !getClientPluginByRoute(location.pathname) && (
                <StockTrackerView 
                  logs={logs} 
                  onAddLog={addLog} 
                  userEmail={user.email} 
                  userToken={user.token || ''} 
                  userRole={user.role} 
                />
              )}
            </ErrorBoundary>
          </div>

        </div>

      </div>

      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
        currentUser={user}
        theme={theme}
      />
    </div>
  );
}

function PasswordResetModal({ user, setUser, userToken }: { user: UserProfile, setUser: any, userToken: string }) {
  const [newPassword, setNewPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 5) {
      setErrorMsg('Password must be at least 5 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update password');
        return;
      }
      
      const updatedUser = { ...user, mustChangePassword: false };
      setUser(updatedUser);
      localStorage.setItem('sutharlabs_active_user', JSON.stringify(updatedUser));
    } catch (err) {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-[fadeInScale_0.2s_ease-out]"
        style={{
          background: 'var(--surface-color)',
          border: '1px solid var(--error-color)',
        }}
      >
        <div className="bg-gradient-to-r from-red-500 to-amber-500 h-1.5 w-full" />
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 mb-2 border border-red-500/20">
              <span className="material-symbols-outlined text-[28px]">lock_reset</span>
            </div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--on-surface-color)' }}>Update Required</h3>
            <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant-color)' }}>
              For security, you must replace your temporary password before accessing the workspace.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg text-xs font-mono flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded p-3 text-sm focus:outline-none transition-colors"
                style={{
                  background: 'var(--surface-container-color)',
                  border: '1px solid var(--outline-variant-color)',
                  color: 'var(--on-surface-color)',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--secondary-color)')}
                onBlur={e => (e.target.style.borderColor = 'var(--outline-variant-color)')}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'var(--secondary-color)',
                color: 'var(--on-secondary-color)'
              }}
            >
              {loading ? 'SAVING...' : 'SECURE ACCOUNT'}
              {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
