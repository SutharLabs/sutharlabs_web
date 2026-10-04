import React from 'react';
import { useNavigate } from 'react-router-dom';
import { openCookiePreferencesModal } from './CookieConsentBanner';

export default function PrivacyPolicyView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07070a] text-[#e5e1e4] flex flex-col font-sans select-text">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-[#101014]/90 backdrop-blur-xl border-b border-outline/15 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00dbe7] via-[#ce5dff] to-[#00e476] p-0.5 shadow-md group-hover:rotate-12 transition-transform">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[6px] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#74f5ff] text-lg">terminal</span>
            </div>
          </div>
          <span className="font-bold text-base tracking-tight text-white group-hover:text-[#00dbe7] transition-colors">
            SutharLabs
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-on-surface-variant/60 uppercase tracking-widest pl-2 border-l border-outline/20">
            Legal &amp; Privacy
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 rounded-xl border border-outline/20 hover:border-[#00dbe7]/50 text-xs font-mono text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/workspace/stock-tracker')}
            className="px-4 py-1.5 rounded-xl bg-[#00dbe7] text-[#002022] font-mono font-bold text-xs hover:brightness-110 shadow-md shadow-[#00dbe7]/20 transition-all cursor-pointer"
          >
            Launch Workspace
          </button>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 sm:px-8 py-10 sm:py-16 space-y-12">
        
        {/* Document Header */}
        <div className="space-y-4 border-b border-outline/15 pb-8">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
              Official Policy
            </span>
            <span className="text-xs font-mono text-on-surface-variant">
              Last Updated: October 4, 2026
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            SutharLabs Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-[#b9cacb] leading-relaxed max-w-3xl">
            This Privacy Policy describes how SutharLabs Sovereign Systems ("SutharLabs", "we", "us", or "our") collects, uses, protects, and handles personal data when you interact with our developer platform, workspace applets, and plugin marketplace.
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00dbe7]">shield_person</span>
            1. Core Principles &amp; Commitment to Sovereignty
          </h2>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            At SutharLabs, user sovereignty and minimal data collection are foundational engineering tenets. We do not sell, rent, or monetize your personal information to third parties, advertising exchanges, or data aggregators. Data collected is strictly utilized to provide reliable execution of your workspace sessions, preserve application preferences, and protect the cryptographic integrity of the platform.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ce5dff]">database</span>
            2. Categories of Information Collected
          </h2>
          
          <div className="space-y-3 text-xs sm:text-sm text-[#b9cacb]">
            <div className="p-4 rounded-xl bg-surface-container/40 border border-outline/10 space-y-1.5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00dbe7]"></span>
                Account &amp; Identity Credentials
              </h3>
              <p className="leading-relaxed">
                When you register or sign in, we collect your display name, email address, password hash (encrypted via SHA-256), account role (Administrator, Developer), and timestamp of registration. If you authenticate via Google OAuth, we receive your email and verification status.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container/40 border border-outline/10 space-y-1.5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ce5dff]"></span>
                Workspace Telemetry &amp; Simulation Data
              </h3>
              <p className="leading-relaxed">
                Actions performed inside simulated tools (such as paper trade executions, portfolio balances in Stock Analyzer, architectural graph node layouts in Flow Designer, markdown notes in Doc Nexus, and invoice sequences in Accounting) are stored in your private Neon PostgreSQL ledger.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container/40 border border-outline/10 space-y-1.5">
              <h3 className="font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e476]"></span>
                Marketplace &amp; Review Contributions
              </h3>
              <p className="leading-relaxed">
                When you author a review, submit a rating, or deploy an extension package (.zip or .vsix), we store your feedback, rating value, associated plugin identifier, package checksum (SHA-256), and publication timestamp.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Third Party Providers */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00e476]">hub</span>
            3. Third-Party Integrations &amp; Data Transfers
          </h2>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            SutharLabs integrates with select infrastructure providers to facilitate platform operation:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-[#b9cacb] list-disc pl-5">
            <li><strong className="text-white">Neon PostgreSQL:</strong> Encrypted relational database hosting our persistent data models with TLS encryption in transit and at rest.</li>
            <li><strong className="text-white">Yahoo Finance Public APIs:</strong> Streaming market ticker quotes and financial metrics. No user personal identifiers are dispatched during quote lookups.</li>
            <li><strong className="text-white">Google Identity Services:</strong> Optional OAuth single sign-on provider. We only access your basic email and public profile name.</li>
          </ul>
        </section>

        {/* Section 4: Cookies & Local Storage */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00dbe7]">cookie</span>
            4. Cookies &amp; Local Storage Disclosure (GDPR Compliance)
          </h2>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            In compliance with the EU ePrivacy Directive and GDPR Article 6, we delineate the client storage tokens employed by SutharLabs:
          </p>

          <div className="overflow-x-auto rounded-xl border border-outline/20">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface-container-high/60 text-on-surface border-b border-outline/20">
                <tr>
                  <th className="p-3">Storage Key</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10 text-on-surface-variant">
                <tr>
                  <td className="p-3 text-white font-bold">sutharlabs_active_user</td>
                  <td className="p-3">LocalStorage</td>
                  <td className="p-3 text-[#00e476]">Essential</td>
                  <td className="p-3 font-sans">Maintains signed JWT authentication tokens for active session</td>
                </tr>
                <tr>
                  <td className="p-3 text-white font-bold">sutharlabs_theme</td>
                  <td className="p-3">LocalStorage</td>
                  <td className="p-3 text-[#00dbe7]">Functional</td>
                  <td className="p-3 font-sans">Persists user interface theme mode (dark vs light)</td>
                </tr>
                <tr>
                  <td className="p-3 text-white font-bold">sutharlabs_cookie_consent</td>
                  <td className="p-3">LocalStorage</td>
                  <td className="p-3 text-[#00e476]">Essential</td>
                  <td className="p-3 font-sans">Records your granular cookie and privacy preferences</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={openCookiePreferencesModal}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#00dbe7]/10 text-[#00dbe7] border border-[#00dbe7]/30 hover:bg-[#00dbe7]/20 transition-colors cursor-pointer"
            >
              Reopen Cookie Consent Preferences
            </button>
          </div>
        </section>

        {/* Section 5: User Rights & Data Deletion */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ffb4ab]">delete_forever</span>
            5. User Rights, Data Portability &amp; Right to Erasure
          </h2>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            Under GDPR (Articles 15 through 22) and the California Consumer Privacy Act (CCPA), you maintain complete dominion over your personal data:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-[#b9cacb] list-disc pl-5">
            <li><strong className="text-white">Right to Rectification:</strong> You can edit your display name, bio, company, and credentials directly inside the <span className="text-[#00dbe7] cursor-pointer hover:underline" onClick={() => navigate('/workspace/profile')}>User Profile section</span>.</li>
            <li><strong className="text-white">Right to Data Portability:</strong> You can download an immutable JSON export of your complete account records, simulated trades, reviews, and portfolio balances at any time via the User Profile exporter.</li>
            <li><strong className="text-white">Right to Erasure ("Right to be Forgotten"):</strong> Self-service deletion controls allow you to granularly wipe trade history, purge submitted plugin reviews, or permanently delete your entire account with immediate database cascade.</li>
          </ul>
        </section>

        {/* Section 6: Security Safeguards */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00dbe7]">lock</span>
            6. Cryptographic &amp; Infrastructure Security
          </h2>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            All passwords are cryptographically hashed using industry-standard digests prior to storage. Network traffic is protected by TLS 1.3 protocol standards. Community extensions run inside sandboxed execution workers to insulate user data from arbitrary execution vulnerabilities.
          </p>
        </section>

        {/* Section 7: Contact */}
        <section className="p-6 rounded-2xl bg-surface-container/50 border border-outline/15 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00dbe7]">mail</span>
            7. Data Protection Inquiries
          </h3>
          <p className="text-xs text-[#b9cacb] leading-relaxed">
            For questions concerning this Privacy Policy, data subject access requests, or regulatory compliance disclosures, please contact SutharLabs Engineering:
          </p>
          <div className="font-mono text-xs text-[#00dbe7] space-y-1">
            <div>Email: <a href="mailto:privacy@sutharlabs.com" className="hover:underline">privacy@sutharlabs.com</a></div>
            <div>Engineering Lead: Suthar Suresh</div>
            <div>SutharLabs Sovereign Systems • Global Developer Operations</div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 sm:px-12 border-t border-outline/10 bg-[#0a0a0e] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-on-surface-variant/80">
        <div>&copy; 2026 SutharLabs Sovereign Systems. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/privacy')} className="text-[#00dbe7] hover:underline cursor-pointer">Privacy Policy</button>
          <span>•</span>
          <button type="button" onClick={() => navigate('/copyright')} className="hover:text-white transition-colors cursor-pointer">Terms &amp; Copyright</button>
          <span>•</span>
          <button type="button" onClick={openCookiePreferencesModal} className="hover:text-white transition-colors cursor-pointer">Cookie Settings</button>
        </div>
      </footer>
    </div>
  );
}
