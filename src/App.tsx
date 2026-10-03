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
import ManageAppsView from './components/ManageAppsView';
import ManagePluginsView from './components/ManagePluginsView';
import ManagePortfoliosView from './components/ManagePortfoliosView';
import DocNexusView from './components/DocNexusView';
import WorkspacePluginStore from './components/WorkspacePluginStore';

const MANAGEMENT_TOOLS: { name: WorkspaceTab; icon: string; size: string }[] = [
  { name: 'Plugin Store', icon: 'extension', size: '3.1 KB' }
];

const INSTALLED_PLUGINS: { name: WorkspaceTab; icon: string; size: string }[] = [
  { name: 'Stock Tracker', icon: 'monitoring', size: '12.4 KB' },
  { name: 'Custom Flow', icon: 'account_tree', size: '4.8 KB' },
  { name: 'Accounting', icon: 'currency_exchange', size: '18.2 KB' },
  { name: 'Doc Nexus', icon: 'menu_book', size: '15.6 KB' }
];

const ALL_TABS = [...MANAGEMENT_TOOLS, ...INSTALLED_PLUGINS];


const ROUTE_MAP: Record<WorkspaceTab, string> = {
  'Stock Tracker': '/workspace/stock-tracker',
  'Custom Flow': '/workspace/flow',
  'Accounting': '/workspace/accounting',
  'Admin Console': '/admin',
'Doc Nexus': '/workspace/docnexus',
  'Manage Plugins': '/admin/manage-plugins',
  'Manage Apps': '/admin/manage-apps',
  'Manage Portfolios': '/admin/manage-portfolios',
  'Plugin Store': '/workspace/plugins',
  'README': '/workspace/readme'
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
      {user.isLoggedIn && user.mustChangePassword && (
        <PasswordResetModal user={user} setUser={setUser} userToken={user.token || ''} />
      )}
      <Routes>
        <Route path="/" element={
        user.isLoggedIn ? <Navigate to="/workspace/stock-tracker" /> : 
        <LandingPage user={user} onLaunch={handleLaunchWorkspace} onNavigateAuth={handleAuthNavigate} theme={theme} toggleTheme={toggleTheme} />
      } />
      <Route path="/auth" element={
        <AuthPage initialTab={authTab} onLoginSuccess={handleLoginSuccess} onBackToHome={() => navigate('/')} />
      } />
      <Route path="/admin/*" element={
        <WorkspaceLayout user={user} setUser={setUser} logs={logs} addLog={addLog} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      } />
      <Route path="/workspace/*" element={
        <WorkspaceLayout user={user} setUser={setUser} logs={logs} addLog={addLog} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      } />
    </Routes>
    </>
  );
}

function WorkspaceLayout({ user, setUser, logs, addLog, activeTab, setActiveTab, handleLogout, theme, toggleTheme }: any) {
  const [isManagementOpen, setIsManagementOpen] = React.useState(true);
  const [isPluginsOpen, setIsPluginsOpen] = React.useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const navigate = useNavigate();
  
  if (!user.isLoggedIn) return <Navigate to="/auth" />;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e1e4] flex flex-col font-sans overflow-hidden">
      {/* SutharLabs App Workspace Top Navigation Header */}
      <header className="h-14 bg-[#131315] border-b border-[#3a494b]/10 px-6 flex items-center justify-between z-10 select-none">
        <div className="flex items-center gap-4">
          {/* Logo brand home return */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <svg className="w-5.5 h-5.5 transition-transform duration-300 group-hover:rotate-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sutharGlowWorkNav" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00dbe7" />
                  <stop offset="50%" stopColor="#ce5dff" />
                  <stop offset="100%" stopColor="#00e476" />
                </linearGradient>
              </defs>
              <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z" stroke="url(#sutharGlowWorkNav)" strokeWidth="6" strokeLinejoin="round" fill="none" />
              <path d="M65 32 C65 25, 35 25, 35 37 C35 49, 65 51, 65 63 C65 75, 35 75, 35 68" stroke="url(#sutharGlowWorkNav)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="text-lg font-bold text-[#74f5ff] tracking-tight neon-text-glow">
              SutharLabs
            </span>
          </div>
          <div className="h-4 w-[1px] bg-[#3a494b]/30"></div>
          {/* WorkPath Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-[#b9cacb]/80">
            <span className="hover:text-white transition-all cursor-pointer">sutharlabs-core</span>
            <span className="text-[#849495] select-none">/</span>
            <span className="hover:text-white transition-all cursor-pointer">app-workspace</span>
            <span className="text-[#849495] select-none">/</span>
            <span className="text-[#00dbe7] font-semibold">{activeTab}</span>
          </div>
        </div>

        {/* Action Widgets & controls */}
        <div className="flex items-center gap-4 font-mono text-[11px] text-[#b9cacb]">
          <div className="hidden md:flex items-center gap-3">
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
          
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="py-1 px-2 bg-[#201f21] border border-[#3a494b]/30 rounded text-[#e5e1e4] hover:text-[#00dbe7] hover:border-[#00dbe7]/50 transition-all flex items-center justify-center cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            <span className="material-symbols-outlined text-sm select-none leading-none">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          <button 
            type="button"
            onClick={handleLogout}
            className="py-1 px-3 bg-[#201f21] border border-[#3a494b]/30 rounded text-[#e5e1e4] hover:text-[#ffb4ab] hover:border-[#ffb4ab]/50 transition-all font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer"
          >
            Leave Workspace
          </button>
        </div>
      </header>

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
        <aside className={`${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none border-r-0'} transition-all duration-300 ease-in-out bg-[#131315]/95 border-r border-[#3a494b]/10 flex flex-col justify-between select-none shrink-0 hidden md:flex overflow-hidden`}>
          <div className="w-64 flex flex-col h-full justify-between shrink-0">
            {/* Main folder tree structure */}
            <div className="flex-1 py-4 flex flex-col overflow-y-auto custom-scrollbar">
            
            {/* MANAGEMENT SECTION */}
            <div 
              className="flex items-center px-4 mt-2 mb-2 text-[10px] font-mono text-[#849495] tracking-widest uppercase justify-between cursor-pointer hover:text-white transition-colors group select-none"
              onClick={() => setIsManagementOpen(!isManagementOpen)}
            >
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isManagementOpen ? 'rotate-90' : ''}`}>chevron_right</span>
                <span>MANAGEMENT</span>
              </div>
              <span className="material-symbols-outlined text-sm text-gray-500 group-hover:text-[#74f5ff]">admin_panel_settings</span>
            </div>
            
            {isManagementOpen && (
              <div className="space-y-[2px] px-2 mb-6">
                
                {[
                  ...(user.role === 'Admin' ? [{ name: 'Admin Console' as const, icon: 'security', size: '9.3 KB' }] : []),
                  ...MANAGEMENT_TOOLS,
                  ...(user.role === 'Admin' ? [
                    { name: 'Manage Plugins' as const, icon: 'bolt', size: '' },
                    { name: 'Manage Apps' as const, icon: 'apps', size: '' },
                    { name: 'Manage Portfolios' as const, icon: 'web', size: '' }
                  ] : [])
                ].map((file) => {

                  const isSelected = activeTab === file.name;
                  return (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => setActiveTab(file.name)}
                      className={`w-full flex items-center justify-between p-2.5 rounded font-mono text-xs text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20 font-bold shadow-[inset_0_0_8px_rgba(0,219,231,0.05)]' 
                          : 'text-[#b9cacb]/95 hover:text-[#e5e1e4] hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`material-symbols-outlined text-base ${isSelected ? 'text-[#00dbe7]' : 'text-gray-500'}`}>
                          {file.icon}
                        </span>
                        <span className="truncate">{file.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* PLUGINS SECTION */}
            <div 
              className="flex items-center px-4 mb-2 text-[10px] font-mono text-[#849495] tracking-widest uppercase justify-between cursor-pointer hover:text-white transition-colors group select-none"
              onClick={() => setIsPluginsOpen(!isPluginsOpen)}
            >
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${isPluginsOpen ? 'rotate-90' : ''}`}>chevron_right</span>
                <span>INSTALLED PLUGINS</span>
              </div>
              <span className="material-symbols-outlined text-sm text-gray-500 group-hover:text-[#74f5ff]">extension</span>
            </div>
            
            {isPluginsOpen && (
              <div className="space-y-[2px] px-2 flex-grow">
                {INSTALLED_PLUGINS.map((file) => {
                  const isSelected = activeTab === file.name;
                  return (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => setActiveTab(file.name)}
                      className={`w-full flex items-center justify-between p-2.5 rounded font-mono text-xs text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/20 font-bold shadow-[inset_0_0_8px_rgba(0,219,231,0.05)]' 
                          : 'text-[#b9cacb]/95 hover:text-[#e5e1e4] hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`material-symbols-outlined text-base ${isSelected ? 'text-[#00dbe7]' : 'text-gray-500'}`}>
                          {file.icon}
                        </span>
                        <span className="truncate">{file.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User authenticated credentials footer card */}
          <div className="p-4 border-t border-[#3a494b]/10 bg-[#0e0e10]/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#ce5dff]/10 border border-[#ce5dff]/40 flex items-center justify-center text-xs font-bold text-[#ebb2ff] uppercase select-none">
              {user.name.charAt(0)}
            </div>
            <div className="flex-grow min-w-0">
              <span className="font-sans text-xs font-bold text-[#e5e1e4] block truncate">{user.name}</span>
              <span className="font-mono text-[9px] text-[#849495] block truncate">{user.email}</span>
            </div>
          </div>
        </div>

        </aside>

        {/* Right main dynamic Workspace display screen */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#050505] p-4 md:p-6 pb-12">
          
          {/* Top responsive filename tabs drawer for touch/mobile devices */}
          <div className="flex md:hidden gap-1 mb-4 overflow-x-auto scrollbar-hide shrink-0">
            {ALL_TABS.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => setActiveTab(file.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs shrink-0 cursor-pointer ${
                  activeTab === file.name
                    ? 'bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/30'
                    : 'bg-[#131315] text-[#b9cacb]'
                }`}
              >
                <span className="material-symbols-outlined text-sm select-none leading-none">
                  {file.icon}
                </span>
                <span>{file.name}</span>
              </button>
            ))}
          </div>

          {/* Render Active Component File Workspace Panel */}
          <div className="flex-grow flex flex-col">
            
            {activeTab === 'Stock Tracker' && (
              <StockTrackerView 
                logs={logs} 
                onAddLog={addLog} 
                userEmail={user.email}
                userToken={user.token || ''}
              />
            )}

            {activeTab === 'Custom Flow' && (
              <FlowDesignerView 
                logs={logs}
                onAddLog={addLog} 
                userToken={user.token || ''}
              />
            )}

            {activeTab === 'Accounting' && (
              <AccountingView 
                logs={logs}
                onAddLog={addLog} 
                userToken={user.token || ''}
              />
            )}

            {activeTab === 'Doc Nexus' && <DocNexusView logs={logs} onAddLog={addLog} userToken={user.token || ''} theme={theme} />}
            {activeTab === 'Plugin Store' && <WorkspacePluginStore logs={logs} onAddLog={addLog} userEmail={user.email} userToken={user.token || ''} />}

            {(activeTab === 'Admin Console' || activeTab === 'Manage Plugins' || activeTab === 'Manage Apps' || activeTab === 'Manage Portfolios') && user.role !== 'Admin' && (
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
              <MutedMarkdownView />
            )}

          </div>

        </div>

      </div>

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
