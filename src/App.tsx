import React, { useState, useEffect } from 'react';
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
  { name: 'Admin Console', icon: 'security', size: '9.3 KB' },
  { name: 'Plugin Store', icon: 'extension', size: '3.1 KB' },
  { name: 'README', icon: 'description', size: '2.1 KB' }
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
  const [user, setUser] = useState<UserProfile>({
    email: 'developer@sutharlabs.com',
    name: 'Suthar Developer',
    isLoggedIn: false // starts false to showcase the premium Landing Page first, then can launch or authenticate!
  });

  useEffect(() => {
    const saved = localStorage.getItem('sutharlabs_active_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load saved session:', err);
      }
    }
  }, []);

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

  const addLog = (newLog: TerminalLog) => {
    setLogs((prev) => [...prev, newLog]);
  };

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
    <Routes>
      <Route path="/" element={
        user.isLoggedIn ? <Navigate to="/workspace/stock-tracker" /> : 
        <LandingPage user={user} onLaunch={handleLaunchWorkspace} onNavigateAuth={handleAuthNavigate} />
      } />
      <Route path="/auth" element={
        <AuthPage initialTab={authTab} onLoginSuccess={handleLoginSuccess} onBackToHome={() => navigate('/')} />
      } />
      <Route path="/admin/*" element={
        <WorkspaceLayout user={user} setUser={setUser} logs={logs} addLog={addLog} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />
      } />
      <Route path="/workspace/*" element={
        <WorkspaceLayout user={user} setUser={setUser} logs={logs} addLog={addLog} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />
      } />
    </Routes>
  );
}

function WorkspaceLayout({ user, setUser, logs, addLog, activeTab, setActiveTab, handleLogout }: any) {
  const [isManagementOpen, setIsManagementOpen] = React.useState(true);
  const [isPluginsOpen, setIsPluginsOpen] = React.useState(true);
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
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Hand Sidebar Explorer directory tree */}
        <aside className="w-64 bg-[#131315]/95 border-r border-[#3a494b]/10 flex flex-col justify-between select-none shrink-0 hidden md:flex">
          
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
                
                {[...MANAGEMENT_TOOLS, ...(user.role === 'Admin' ? [
                  { name: 'Manage Plugins', icon: 'bolt', size: '' },
                  { name: 'Manage Apps', icon: 'apps', size: '' },
                  { name: 'Manage Portfolios', icon: 'web', size: '' }
                ] : [])].map((file) => {

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
                onAddLog={addLog} 
                userToken={user.token || ''}
              />
            )}

            {activeTab === 'Accounting' && (
              <AccountingView 
                onAddLog={addLog} 
                userToken={user.token || ''}
              />
            )}

            {activeTab === 'Doc Nexus' && <DocNexusView onAddLog={addLog} userToken={user.token || ''} />}
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
                  <button
                    type="button"
                    onClick={() => {
                      setUser(prev => {
                        const next = { ...prev, role: 'Admin' as const };
                        localStorage.setItem('sutharlabs_active_user', JSON.stringify(next));
                        return next;
                      });
                      addLog({ timestamp: new Date().toLocaleTimeString(), type: 'SUCCESS', message: 'ADMIN: Session credential override activated.' });
                    }}
                    className="mt-2 px-6 py-2.5 rounded bg-red-900/40 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs font-mono font-bold uppercase transition-all hover:bg-red-900/60 cursor-pointer"
                  >
                    Bypass / Elevate to Administrator
                  </button>
                </div>
            )}
            
            {activeTab === 'Admin Console' && user.role === 'Admin' && (
              <AdminConsoleView logs={logs} onAddLog={addLog} currentUserEmail={user.email} userToken={user.token || ''} />
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
