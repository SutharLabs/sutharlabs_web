import React, { useState } from 'react';
import { UserProfile } from '../types';

interface AuthPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
  initialTab?: 'signin' | 'signup';
  onBackToHome: () => void;
}

export default function AuthPage({ onLoginSuccess, initialTab = 'signin', onBackToHome }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [fullname, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please specify a valid email address.');
      return;
    }
    if (activeTab === 'signup' && !fullname) {
      setErrorMsg('Full name is required to initialize workspace.');
      return;
    }
    if (password.length < 5) {
      setErrorMsg('Password should be at least 5 characters to ensure encryption.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const body = activeTab === 'signup' 
        ? { email, name: fullname, password } 
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to authenticate.');
        return;
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg('Failed to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (platform: 'GitHub' | 'Google') => {
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to authenticate via OAuth.');
        return;
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg('Failed to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto flex items-center justify-center relative bg-[#050505] p-4 font-sans chart-grid">
      {/* Glow Ambient Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00dbe7]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#ce5dff]/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Auth Card Center container */}
      <div className="w-full max-w-[480px] z-10 relative my-8">
        
        {/* Back to Home Logo Header */}
        <div className="text-center mb-8 cursor-pointer" onClick={onBackToHome}>
          <h1 className="text-4xl font-bold text-[#74f5ff] tracking-tight neon-text-glow select-none">SutharLabs</h1>
          <p className="font-mono text-xs text-[#b9cacb] tracking-widest mt-2 uppercase">Identity &amp; Access Control</p>
        </div>

        {/* Auth Panel card */}
        <div className="glass-panel rounded-xl shadow-[0_12px_45px_rgba(0,0,0,0.55)] overflow-hidden border border-[#3a494b]/20">
          
          {/* Tabs header toggle */}
          <div className="flex border-b border-[#3a494b]/30 bg-[#0e0e10]/40">
            <button 
              type="button"
              className={`flex-1 py-4 font-mono text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'signin' 
                  ? 'text-[#00dbe7] border-b-2 border-[#00dbe7] bg-white/[0.03]' 
                  : 'text-[#b9cacb] hover:text-[#e5e1e4] hover:bg-white/[0.01]'
              }`}
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg('');
              }}
            >
              Sign In
            </button>
            <button 
              type="button"
              className={`flex-1 py-4 font-mono text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'signup' 
                  ? 'text-[#ce5dff] border-b-2 border-[#ce5dff] bg-white/[0.03]' 
                  : 'text-[#b9cacb] hover:text-[#e5e1e4] hover:bg-white/[0.01]'
              }`}
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg('');
              }}
            >
              Create Account
            </button>
          </div>

          <div className="p-6 md:p-8">
            {errorMsg && (
              <div className="p-3 mb-5 rounded bg-[#93000a]/30 border border-[#ffb4ab]/30 text-xs text-[#ffdad6] font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-sm select-none">warning</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Dynamic Interactive Input forms */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {activeTab === 'signup' && (
                <div className="rounded bg-[#2a2a2c]/40 border border-[#3a494b]/20 p-3 block focus-within:border-[#ce5dff] focus-within:shadow-[0_0_8px_rgba(206,93,255,0.2)] transition-all">
                  <label className="block font-mono text-[10px] text-[#b9cacb] uppercase mb-1 tracking-wider">Full Name</label>
                  <input 
                    className="w-full bg-transparent border-none p-0 focus:ring-0 font-mono text-sm text-[#e5e1e4] placeholder-[#849495]/50 outline-none" 
                    placeholder="John Doe" 
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                  />
                </div>
              )}

              <div className="rounded bg-[#2a2a2c]/40 border border-[#3a494b]/20 p-3 block focus-within:border-[#00dbe7] focus-within:shadow-[0_0_8px_rgba(0,219,231,0.2)] transition-all">
                <label className="block font-mono text-[10px] text-[#b9cacb] uppercase mb-1 tracking-wider">Email Address</label>
                <input 
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-mono text-sm text-[#e5e1e4] placeholder-[#849495]/50 outline-none" 
                  placeholder="user@domain.com" 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="rounded bg-[#2a2a2c]/40 border border-[#3a494b]/20 p-3 block focus-within:border-[#00dbe7] focus-within:shadow-[0_0_8px_rgba(0,219,231,0.2)] transition-all">
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">Password</label>
                  <span className="font-mono text-[10px] text-[#00dbe7] hover:text-[#74f5ff] transition-colors cursor-pointer">Forgot?</span>
                </div>
                <input 
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-mono text-sm text-[#e5e1e4] placeholder-none outline-none" 
                  placeholder="••••••••" 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {activeTab === 'signin' ? (
                <button 
                  type="submit"
                  className="w-full py-3 bg-[#00dbe7] text-[#002022] font-mono text-xs font-bold uppercase tracking-widest rounded hover:brightness-110 shadow-[0_3px_15px_rgba(0,219,231,0.18)] hover:shadow-[0_0_20px_rgba(0,219,231,0.4)] transition-all cursor-pointer mt-2"
                >
                  Initialize Session
                </button>
              ) : (
                <button 
                  type="submit"
                  className="w-full py-3 bg-[#ce5dff] text-[#480064] font-mono text-xs font-bold uppercase tracking-widest rounded hover:brightness-110 shadow-[0_3px_15px_rgba(206,93,255,0.18)] hover:shadow-[0_0_20px_rgba(206,93,255,0.4)] transition-all cursor-pointer mt-2"
                >
                  Create Workspace
                </button>
              )}

            </form>

            {/* Divider lines */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-[#3a494b]/30"></div>
              <span className="px-4 font-mono text-[9px] text-[#b9cacb]/80 uppercase tracking-widest">or connect with</span>
              <div className="flex-grow border-t border-[#3a494b]/30"></div>
            </div>

            {/* Social Authentication Widgets */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleSocialLogin('GitHub')}
                className="glow-button-secondary flex items-center justify-center gap-2 py-3 rounded bg-[#1c1b1d]/80 font-mono text-xs text-[#e5e1e4] hover:bg-white/[0.04] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] select-none text-[#ebb2ff]">code</span>
                GitHub
              </button>

              <button 
                onClick={() => handleSocialLogin('Google')}
                className="glow-button-secondary flex items-center justify-center gap-2 py-3 rounded bg-[#1c1b1d]/80 font-mono text-xs text-[#e5e1e4] hover:bg-white/[0.04] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] select-none text-[#74f5ff]">mail</span>
                Google
              </button>
            </div>

          </div>
        </div>

        {/* Home option & details */}
        <div className="mt-8 text-center flex justify-between items-center px-4">
          <button 
            onClick={onBackToHome}
            className="font-mono text-xs text-[#b9cacb] hover:text-[#74f5ff] transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined text-sm select-none">arrow_back</span>
            Back to Home
          </button>
          
          <div className="flex gap-4">
            <span className="text-xs text-[#b9cacb]/60 hover:text-[#b9cacb] transition-colors cursor-pointer">Terms</span>
            <span className="text-xs text-[#b9cacb]/60 hover:text-[#b9cacb] transition-colors cursor-pointer">Privacy</span>
          </div>
        </div>

      </div>
    </div>
  );
}
