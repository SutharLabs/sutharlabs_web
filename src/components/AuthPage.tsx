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
    <div className="min-h-screen w-full overflow-y-auto flex items-center justify-center relative bg-background p-4 font-sans chart-grid">
      {/* Glow Ambient Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Auth Card Center container */}
      <div className="w-full max-w-[480px] z-10 relative my-8">
        
        {/* Back to Home Logo Header */}
        <div className="text-center mb-8 cursor-pointer" onClick={onBackToHome}>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight neon-text-glow select-none">SutharLabs</h1>
          <p className="font-mono text-xs text-on-surface-variant tracking-widest mt-2 uppercase">Identity &amp; Access Control</p>
        </div>

        {/* Auth Panel card */}
        <div className="glass-panel rounded-xl shadow-[0_12px_45px_rgba(0,0,0,0.55)] overflow-hidden border border-outline/20">
          
          {/* Tabs header toggle */}
          <div className="flex border-b border-outline/30 bg-surface-container-low">
            <button 
              type="button"
              className={`flex-1 py-4 font-mono text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'signin' 
                  ? 'text-primary border-b-2 border-primary bg-primary/5' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5'
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
                  ? 'text-secondary border-b-2 border-secondary bg-secondary/5' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5'
              }`}
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg('');
              }}
            >
              Create Account
            </button>
          </div>

          <div className="p-4 sm:p-6 md:p-4 sm:p-8 bg-surface">
            {errorMsg && (
              <div className="p-3 mb-5 rounded bg-error/20 border border-error/30 text-error font-mono flex items-center gap-2 text-xs">
                <span className="material-symbols-outlined text-sm select-none">warning</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Dynamic Interactive Input forms */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {activeTab === 'signup' && (
                <div className="rounded bg-surface-container-high border border-outline/20 p-3 block focus-within:border-secondary focus-within:shadow-[0_0_8px_rgba(206,93,255,0.2)] transition-all">
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1 tracking-wider">Full Name</label>
                  <input 
                    className="w-full bg-transparent border-none p-0 focus:ring-0 font-mono text-sm text-on-surface placeholder-on-surface-variant/50 outline-none transition-all" 
                    placeholder="John Doe" 
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                  />
                </div>
              )}

              <div className="rounded bg-surface-container-high border border-outline/20 p-3 block focus-within:border-primary focus-within:shadow-[0_0_8px_rgba(0,219,231,0.2)] transition-all">
                <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1 tracking-wider">Email Address</label>
                <input 
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-mono text-sm text-on-surface placeholder-on-surface-variant/50 outline-none transition-all" 
                  placeholder="user@domain.com" 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="rounded bg-surface-container-high border border-outline/20 p-3 block focus-within:border-primary focus-within:shadow-[0_0_8px_rgba(0,219,231,0.2)] transition-all">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-1">
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Password</label>
                  <span className="font-mono text-[10px] text-primary hover:brightness-110 transition-colors cursor-pointer">Forgot?</span>
                </div>
                <input 
                  className="w-full bg-transparent border-none p-0 focus:ring-0 font-mono text-sm text-on-surface outline-none transition-all" 
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
                  className="w-full py-3 bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-widest rounded hover:brightness-110 shadow-[0_3px_15px_rgba(0,219,231,0.18)] hover:shadow-[0_0_20px_rgba(0,219,231,0.4)] transition-all cursor-pointer mt-2"
                >
                  Initialize Session
                </button>
              ) : (
                <button 
                  type="submit"
                  className="w-full py-3 bg-secondary text-on-secondary font-mono text-xs font-bold uppercase tracking-widest rounded hover:brightness-110 shadow-[0_3px_15px_rgba(206,93,255,0.18)] hover:shadow-[0_0_20px_rgba(206,93,255,0.4)] transition-all cursor-pointer mt-2"
                >
                  Create Workspace
                </button>
              )}

            </form>

            {/* Divider lines */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-outline/30"></div>
              <span className="px-4 font-mono text-[9px] text-on-surface-variant/80 uppercase tracking-widest">or connect with</span>
              <div className="flex-grow border-t border-outline/30"></div>
            </div>

            {/* Social Authentication Widgets */}
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleSocialLogin('Google')}
                className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-surface border border-outline/25 dark:border-outline/10 font-sans text-sm font-medium text-on-surface hover:bg-on-surface/5 transition-all duration-200 cursor-pointer w-full shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.354 0-6.077-2.723-6.077-6.077 0-3.354 2.723-6.077 6.077-6.077 1.488 0 2.843.541 3.896 1.436l3.057-3.057C17.202 2.062 14.867 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.208 0 11.24-5.032 11.24-11.24 0-.79-.09-1.554-.26-2.285h-10.98z"/>
                  <path fill="#FBBC05" d="M1 12.24c0-1.898.472-3.682 1.3-5.253l-3.057-3.057A11.16 11.16 0 0 0 0 12.24c0 2.213.645 4.277 1.757 6.012l3.057-3.057A7.16 7.16 0 0 1 1 12.24z" transform="translate(0, 0)"/>
                  <path fill="#34A853" d="M12.24 23.48c3.284 0 6.275-1.077 8.59-2.915l-3.057-3.057c-1.442.97-3.29 1.553-5.533 1.553-4.184 0-7.728-2.827-8.991-6.634L1.757 18.252a11.21 11.21 0 0 0 10.483 6.228z" transform="translate(0, 0)"/>
                  <path fill="#4285F4" d="M23.23 10.285H12.24v4.115h6.887c-.288 1.074-.91 1.986-1.745 2.684l3.057 3.057c2.355-2.17 3.738-5.362 3.738-9.57 0-.79-.09-1.554-.26-2.286z" transform="translate(0, 0)"/>
                </svg>
                <span className="font-sans font-medium">Continue with Google</span>
              </button>
            </div>

          </div>
        </div>

        {/* Home option & details */}
        <div className="mt-8 text-center flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 px-4">
          <button 
            onClick={onBackToHome}
            className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined text-sm select-none">arrow_back</span>
            Back to Home
          </button>
          
          <div className="flex gap-4">
            <span className="text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors cursor-pointer">Terms</span>
            <span className="text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors cursor-pointer">Privacy</span>
          </div>
        </div>

      </div>
    </div>
  );
}
