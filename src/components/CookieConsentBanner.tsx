import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  consentedAt: string;
}

const COOKIE_STORAGE_KEY = 'sutharlabs_cookie_consent';

export function getStoredCookiePreferences(): CookiePreferences | null {
  try {
    const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse cookie preferences:', e);
  }
  return null;
}

export function openCookiePreferencesModal() {
  window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
}

export default function CookieConsentBanner() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Preference toggles inside modal
  const [functionalConsent, setFunctionalConsent] = useState(true);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  useEffect(() => {
    const saved = getStoredCookiePreferences();
    if (!saved) {
      // Small delay for smooth entry animation
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpenModal = () => {
      const existing = getStoredCookiePreferences();
      if (existing) {
        setFunctionalConsent(existing.functional);
        setAnalyticsConsent(existing.analytics);
      }
      setIsModalOpen(true);
    };

    window.addEventListener('open-cookie-preferences', handleOpenModal);
    return () => window.removeEventListener('open-cookie-preferences', handleOpenModal);
  }, []);

  const savePreferences = (prefs: { functional: boolean; analytics: boolean }) => {
    const fullPrefs: CookiePreferences = {
      essential: true,
      functional: prefs.functional,
      analytics: prefs.analytics,
      consentedAt: new Date().toISOString()
    };
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(fullPrefs));
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleAcceptAll = () => {
    savePreferences({ functional: true, analytics: true });
  };

  const handleEssentialOnly = () => {
    savePreferences({ functional: false, analytics: false });
  };

  const handleSaveCustom = () => {
    savePreferences({ functional: functionalConsent, analytics: analyticsConsent });
  };

  return (
    <>
      {/* Floating Bottom Consent Banner */}
      {isVisible && !isModalOpen && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xl z-50 animate-fade-in"
        >
          <div className="p-5 sm:p-6 rounded-2xl border border-[#00dbe7]/40 bg-[#0c0c12]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-on-surface flex flex-col gap-4">
            
            {/* Header info */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 flex items-center justify-center shrink-0 text-[#00dbe7]">
                <span className="material-symbols-outlined text-2xl">cookie</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-on-surface tracking-tight">EU Cookie & Privacy Consent</h3>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase bg-[#00e476]/15 text-[#00e476] border border-[#00fb83]/30">
                    GDPR
                  </span>
                </div>
                <p className="text-xs text-[#b9cacb] leading-relaxed mt-1">
                  SutharLabs uses essential cookies for secure JWT sessions and sovereign state synchronization. With your permission, we also utilize functional memory and anonymized telemetry to optimize workspace tools.
                </p>
              </div>
            </div>

            {/* Links line */}
            <div className="flex items-center gap-4 text-[11px] font-mono text-[#849495] pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => navigate('/privacy')}
                className="hover:text-[#00dbe7] underline transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/copyright')}
                className="hover:text-[#00dbe7] underline transition-colors cursor-pointer"
              >
                Terms & Copyright
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="hover:text-[#00dbe7] underline transition-colors cursor-pointer"
              >
                Customize
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-outline/30 hover:border-outline/60 text-on-surface-variant hover:text-on-surface bg-surface-container-low/40 transition-all cursor-pointer"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-[#00dbe7]/30 text-[#00dbe7] hover:bg-[#00dbe7]/10 transition-all cursor-pointer"
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff] hover:shadow-lg hover:shadow-[#00dbe7]/20 transition-all cursor-pointer"
              >
                Accept All
              </button>
            </div>

          </div>
        </aside>
      )}

      {/* Detailed Cookie Preferences Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg rounded-3xl border border-outline/30 bg-[#0e0e14] shadow-2xl overflow-hidden p-6 text-on-surface space-y-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/30 flex items-center justify-center text-[#00dbe7]">
                  <span className="material-symbols-outlined text-2xl">shield</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Cookie & Privacy Preferences</h3>
                  <p className="text-xs text-on-surface-variant font-mono">Custom consent configuration for GDPR compliance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
              
              {/* Category 1: Strictly Necessary (Always On) */}
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline/15 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-on-surface">Strictly Essential Storage</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#00e476]/15 text-[#00e476] border border-[#00fb83]/30">
                      Always Active
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-[#00e476]">lock</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Required for user authentication (JWT credentials), session safety, CSRF verification, and database state integrity. Cannot be disabled.
                </p>
              </div>

              {/* Category 2: Functional & Preferences */}
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline/15 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-on-surface">Functional & Workspace State</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={functionalConsent}
                      onChange={e => setFunctionalConsent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00dbe7]"></div>
                  </label>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Preserves your theme mode (dark/light), default workspace tools, layout sidebar folds, and active plugin drawer positions.
                </p>
              </div>

              {/* Category 3: Performance & Telemetry */}
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline/15 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-on-surface">Performance & Sandboxed Telemetry</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsConsent}
                      onChange={e => setAnalyticsConsent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00dbe7]"></div>
                  </label>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Collects aggregated, non-identifying telemetry about API response latencies, WebSocket reconnection rates, and V8 worker crashes to improve platform reliability.
                </p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-outline/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-outline/30 hover:border-outline/50 text-on-surface-variant transition-all cursor-pointer"
              >
                Reject Non-Essential
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff] transition-all cursor-pointer"
                >
                  Save Choices
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
