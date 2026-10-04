import React, { useState, useEffect } from 'react';
import { UserProfile, TerminalLog } from '../types';
import { openCookiePreferencesModal, getStoredCookiePreferences } from './CookieConsentBanner';

interface UserProfileViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  onLogout: () => void;
  onPluginsChange?: () => void;
  theme?: 'light' | 'dark';
}

interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  bio?: string | null;
  githubHandle?: string | null;
  company?: string | null;
  joinedAt: string;
  activityCount: number;
  portfolio?: {
    cash: number;
    shares: number;
    buyPrice: number;
  };
  stats?: {
    tradesCount: number;
    reviewsCount: number;
    installedCount: number;
  };
}

export default function UserProfileView({
  user,
  setUser,
  logs,
  onAddLog,
  onLogout,
  onPluginsChange,
  theme = 'dark'
}: UserProfileViewProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'alert' | 'error' } | null>(null);

  // Edit profile form state
  const [displayName, setDisplayName] = useState(user.name || '');
  const [bio, setBio] = useState('');
  const [githubHandle, setGithubHandle] = useState('');
  const [company, setCompany] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Deletion modal state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  const notify = (text: string, type: 'success' | 'alert' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data: ProfileData = await res.json();
        setProfile(data);
        setDisplayName(data.name || '');
        setBio(data.bio || '');
        setGithubHandle(data.githubHandle || '');
        setCompany(data.company || '');
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user.token]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      notify('Display name cannot be empty', 'alert');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name: displayName.trim(),
          bio: bio.trim(),
          githubHandle: githubHandle.trim(),
          company: company.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        notify('Profile details updated successfully', 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: `PROFILE: Updated display name to "${displayName}"`
        });

        // Update local session
        const updatedUser = { ...user, name: displayName.trim() };
        setUser(updatedUser);
        localStorage.setItem('sutharlabs_active_user', JSON.stringify(updatedUser));
        await fetchProfile();
      } else {
        const err = await res.json();
        notify(err.error || 'Failed to update profile', 'error');
      }
    } catch (e) {
      notify('Network error updating profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 5) {
      notify('New password must be at least 5 characters', 'alert');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify('New passwords do not match', 'alert');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (res.ok) {
        notify('Password updated successfully', 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: 'SECURITY: Password changed successfully'
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        notify(err.error || 'Failed to update password', 'error');
      }
    } catch (e) {
      notify('Network error changing password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Export Data
  const handleExportData = async () => {
    try {
      setActionLoadingKey('export');
      const res = await fetch('/api/user/export-data', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sutharlabs_export_${user.email.replace(/[@.]/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        notify('Personal data archive exported successfully', 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'DATA',
          message: `GDPR: Exported complete personal archive for ${user.email}`
        });
      } else {
        notify('Failed to export data', 'error');
      }
    } catch (e) {
      notify('Network error exporting data', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Handle Clear Trades
  const handleClearTrades = async () => {
    if (!window.confirm('Are you sure you want to delete all paper trading transactions? Your cash balance will be reset to $10,000.00.')) {
      return;
    }

    try {
      setActionLoadingKey('trades');
      const res = await fetch('/api/user/data/trades', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        notify(data.message || 'Trade records cleared', 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `DATA: Cleared ${data.count || 0} paper trade records`
        });
        await fetchProfile();
      } else {
        notify('Failed to clear trades', 'error');
      }
    } catch (e) {
      notify('Network error clearing trades', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Handle Clear Reviews
  const handleClearReviews = async () => {
    if (!window.confirm('Are you sure you want to delete all plugin reviews authored by your account?')) {
      return;
    }

    try {
      setActionLoadingKey('reviews');
      const res = await fetch('/api/user/data/reviews', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        notify(data.message || 'Reviews cleared', 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `DATA: Purged all authored plugin reviews`
        });
        await fetchProfile();
      } else {
        notify('Failed to clear reviews', 'error');
      }
    } catch (e) {
      notify('Network error clearing reviews', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Handle Reset Plugins
  const handleResetPlugins = async () => {
    if (!window.confirm('Reset your installed plugins list to the standard 4 native workspace tools?')) {
      return;
    }

    try {
      setActionLoadingKey('plugins');
      const res = await fetch('/api/user/data/plugins', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        notify('Workspace plugins reset to default core installation', 'success');
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `PLUGINS: Reset installed tools to default native bundle`
        });
        await fetchProfile();
        onPluginsChange?.();
      } else {
        notify('Failed to reset plugins', 'error');
      }
    } catch (e) {
      notify('Network error resetting plugins', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Handle Delete Account (Permanent)
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      notify('Please type DELETE to confirm account erasure', 'alert');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (res.ok) {
        alert('Your account and all associated data have been permanently erased. You will now be redirected.');
        onLogout();
      } else {
        const err = await res.json();
        notify(err.error || 'Failed to delete account', 'error');
        setIsDeletingAccount(false);
      }
    } catch (e) {
      notify('Network error deleting account', 'error');
      setIsDeletingAccount(false);
    }
  };

  const cookiePrefs = getStoredCookiePreferences();

  return (
    <div className="flex-grow flex flex-col gap-6 animate-fade-in p-2 sm:p-4 max-w-5xl mx-auto w-full">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border transition-all animate-bounce-subtle ${
            notification.type === 'success'
              ? 'bg-surface/95 dark:bg-[#002812]/95 border-emerald-500/40 text-emerald-800 dark:text-[#00fb83]'
              : notification.type === 'alert'
              ? 'bg-surface/95 dark:bg-[#320015]/95 border-amber-500/40 text-amber-800 dark:text-[#ffb4ab]'
              : 'bg-surface/95 dark:bg-[#3b0808]/95 border-red-500/40 text-red-700 dark:text-red-300'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {notification.type === 'success' ? 'verified' : notification.type === 'alert' ? 'info' : 'warning'}
          </span>
          <span className="text-xs font-mono font-medium">{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-75 transition-opacity text-sm font-mono text-on-surface-variant/70 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Profile Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-outline/25 bg-surface-container-lowest/90 backdrop-blur-2xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00dbe7]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-[#ce5dff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#00dbe7] via-[#ce5dff] to-[#00e476] p-0.5 shadow-xl shadow-[#00dbe7]/10">
                <div className="w-full h-full bg-surface dark:bg-[#0e0e14] rounded-[14px] flex items-center justify-center text-3xl font-extrabold text-primary dark:text-[#74f5ff] uppercase font-mono select-none">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00e476] border-2 border-surface dark:border-[#0e0e14]" title="Active Sovereign Session" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  {profile?.name || user.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                  {profile?.role || user.role || 'Developer'}
                </span>
              </div>
              <p className="font-mono text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                <span>{user.email}</span>
                {profile?.joinedAt && (
                  <>
                    <span>•</span>
                    <span>Member since {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportData}
              disabled={actionLoadingKey === 'export'}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-surface-container hover:bg-surface-container-high border border-outline/30 text-on-surface transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {actionLoadingKey === 'export' ? (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm text-[#00dbe7]">download</span>
              )}
              Export Data (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Profile Settings + Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Profile Info & Password */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Identity & Details Form */}
          <div className="rounded-3xl border border-outline/20 bg-surface-container-lowest/80 backdrop-blur-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#00dbe7]">badge</span>
                <h2 className="text-sm font-mono font-bold uppercase text-on-surface tracking-wider">
                  Profile Information
                </h2>
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant/70">Public within workspace</span>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  placeholder="e.g. Suthar Suresh"
                  className="w-full bg-surface-container-lowest border border-outline/30 focus:border-[#00dbe7] rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. SutharLabs"
                    className="w-full bg-surface-container-lowest border border-outline/30 focus:border-[#00dbe7] rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={githubHandle}
                    onChange={e => setGithubHandle(e.target.value)}
                    placeholder="e.g. sutharsuresh"
                    className="w-full bg-surface-container-lowest border border-outline/30 focus:border-[#00dbe7] rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                  Developer Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell your team about your architectural focus or algorithmic strategies..."
                  className="w-full bg-surface-container-lowest border border-outline/30 focus:border-[#00dbe7] rounded-xl px-3.5 py-2 text-xs font-sans text-on-surface outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff] hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Form */}
          <div className="rounded-3xl border border-outline/20 bg-surface-container-lowest/80 backdrop-blur-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#ce5dff]">lock_reset</span>
                <h2 className="text-sm font-mono font-bold uppercase text-on-surface tracking-wider">
                  Security &amp; Password
                </h2>
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant/70">Encrypted with SHA-256</span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-surface-container-lowest border border-outline/30 focus:border-[#00dbe7] rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 5 characters"
                    className="w-full bg-surface-container-lowest border border-outline/30 focus:border-[#00dbe7] rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full bg-surface-container-lowest border border-outline/30 focus:border-[#00dbe7] rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-surface-container hover:bg-surface-container-high border border-outline/30 text-on-surface transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: GDPR Data Governance & Self-Service Purge */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Data Footprint Summary Card */}
          <div className="rounded-3xl border border-outline/20 bg-surface-container-lowest/80 backdrop-blur-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#00e476]">database</span>
                <h2 className="text-sm font-mono font-bold uppercase text-on-surface tracking-wider">
                  Stored Data Footprint
                </h2>
              </div>
              <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-[#00e476]/15 text-[#00e476] border border-[#00fb83]/30">
                GDPR
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your personal data footprint persisted in Neon PostgreSQL. You have complete self-service dominion to inspect, export, or delete any category.
            </p>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 rounded-2xl bg-surface-container/50 border border-outline/10">
                <span className="text-[10px] text-on-surface-variant block">Paper Trades</span>
                <span className="text-lg font-bold text-on-surface">
                  {profile?.stats?.tradesCount ?? '—'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-container/50 border border-outline/10">
                <span className="text-[10px] text-on-surface-variant block">Plugin Reviews</span>
                <span className="text-lg font-bold text-on-surface">
                  {profile?.stats?.reviewsCount ?? '—'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-container/50 border border-outline/10">
                <span className="text-[10px] text-on-surface-variant block">Installed Plugins</span>
                <span className="text-lg font-bold text-on-surface">
                  {profile?.stats?.installedCount ?? '—'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-container/50 border border-outline/10">
                <span className="text-[10px] text-on-surface-variant block">Cash Balance</span>
                <span className="text-lg font-bold text-[#00e476]">
                  ${profile?.portfolio?.cash ? profile.portfolio.cash.toLocaleString() : '10,000'}
                </span>
              </div>
            </div>

            {/* Granular Deletion Controls */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-[10px] font-mono uppercase text-on-surface-variant tracking-wider font-bold">
                Self-Service Data Purge
              </h3>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container/40 border border-outline/10">
                <div>
                  <div className="text-xs font-semibold text-on-surface">Paper Trading Ledger</div>
                  <div className="text-[10px] text-on-surface-variant font-mono">Purge all trades &amp; reset cash balance</div>
                </div>
                <button
                  type="button"
                  disabled={actionLoadingKey === 'trades'}
                  onClick={handleClearTrades}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingKey === 'trades' ? 'Purging...' : 'Clear'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container/40 border border-outline/10">
                <div>
                  <div className="text-xs font-semibold text-on-surface">Authored Reviews</div>
                  <div className="text-[10px] text-on-surface-variant font-mono">Delete all submitted store reviews</div>
                </div>
                <button
                  type="button"
                  disabled={actionLoadingKey === 'reviews'}
                  onClick={handleClearReviews}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingKey === 'reviews' ? 'Purging...' : 'Clear'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container/40 border border-outline/10">
                <div>
                  <div className="text-xs font-semibold text-on-surface">Installed Plugins</div>
                  <div className="text-[10px] text-on-surface-variant font-mono">Reset to default 4 native tools</div>
                </div>
                <button
                  type="button"
                  disabled={actionLoadingKey === 'plugins'}
                  onClick={handleResetPlugins}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingKey === 'plugins' ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Cookies Status Card */}
          <div className="rounded-3xl border border-outline/20 bg-surface-container-lowest/80 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#00dbe7]">cookie</span>
                <h2 className="text-sm font-mono font-bold uppercase text-on-surface tracking-wider">
                  Cookie Preferences
                </h2>
              </div>
              <span className="material-symbols-outlined text-[#00e476] text-base">verified</span>
            </div>

            <div className="text-xs text-on-surface-variant space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span>Essential Storage:</span>
                <span className="text-[#00e476] font-bold">Enabled</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span>Functional State:</span>
                <span className={cookiePrefs?.functional ? 'text-[#00dbe7] font-bold' : 'text-gray-500'}>
                  {cookiePrefs?.functional ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span>Performance Telemetry:</span>
                <span className={cookiePrefs?.analytics ? 'text-[#00dbe7] font-bold' : 'text-gray-500'}>
                  {cookiePrefs?.analytics ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openCookiePreferencesModal}
              className="w-full py-2.5 rounded-xl text-xs font-mono font-semibold border border-[#00dbe7]/30 text-[#00dbe7] hover:bg-[#00dbe7]/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              <span>Reconfigure Cookie Consent</span>
            </button>
          </div>

          {/* Danger Zone: Account Erasure */}
          <div className="rounded-3xl border border-red-500/30 bg-red-950/10 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-red-500/20 text-red-400">
              <span className="material-symbols-outlined text-lg">warning</span>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider">
                Danger Zone
              </h2>
            </div>

            <p className="text-xs text-red-200/80 leading-relaxed">
              Permanently erase your user account, portfolio records, authored reviews, and settings from our database. This action is irreversible.
            </p>

            <button
              type="button"
              onClick={() => setShowDeleteAccountModal(true)}
              className="w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 transition-colors cursor-pointer"
            >
              Permanently Delete Account
            </button>
          </div>

        </div>

      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteAccountModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 dark:bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setShowDeleteAccountModal(false)}
        >
          <div 
            className="relative w-full max-w-md rounded-3xl border border-red-500/30 dark:border-red-500/40 bg-surface dark:bg-[#12070a] shadow-2xl p-6 text-on-surface space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">dangerous</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Permanently Delete Account</h3>
                <p className="text-xs text-red-600 dark:text-red-300 font-mono">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              This will permanently wipe your account ({user.email}), all trades, reviews, and portfolio history from Neon PostgreSQL.
            </p>

            <div>
              <label className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                Type <strong className="text-red-600 dark:text-red-400">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={e => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-surface-container-low dark:bg-[#1e0a0f] border border-red-500/40 rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText !== 'DELETE' || isDeletingAccount}
                onClick={handleDeleteAccount}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isDeletingAccount ? 'Erasing Account...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
