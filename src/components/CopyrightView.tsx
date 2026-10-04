import React from 'react';
import { useNavigate } from 'react-router-dom';
import { openCookiePreferencesModal } from './CookieConsentBanner';

export default function CopyrightView() {
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
            Terms &amp; Copyright
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
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#ce5dff]/15 text-[#ce5dff] border border-[#ce5dff]/30">
              Intellectual Property Notice
            </span>
            <span className="text-xs font-mono text-on-surface-variant">
              Effective Date: October 4, 2026
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Copyright &amp; Intellectual Property Terms
          </h1>
          <p className="text-sm sm:text-base text-[#b9cacb] leading-relaxed max-w-3xl">
            This document outlines the copyright ownership, licensing boundaries, acceptable use criteria, and DMCA procedures governing the SutharLabs Sovereign Engine and its modular extensions.
          </p>
        </div>

        {/* Section 1: Proprietary Rights */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00dbe7]">copyright</span>
            1. SutharLabs Platform Ownership
          </h2>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            All proprietary software, source code, visual design elements, glassmorphic interfaces, trademarks, service marks, logo artwork, documentation, and the underlying PluginEngine execution runtime comprising the SutharLabs developer platform are the exclusive intellectual property of:
          </p>
          <div className="p-4 rounded-xl bg-surface-container/40 border border-outline/10 font-mono text-xs text-white">
            &copy; 2026 SutharLabs Sovereign Systems. All rights reserved.<br />
            Authored &amp; Maintained by Suthar Suresh and SutharLabs Core Engineering.
          </div>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            Except as explicitly permitted under these terms, no portion of the platform code or visual assets may be reproduced, reverse-engineered, decompiled, or redistributed without prior written consent.
          </p>
        </section>

        {/* Section 2: User Content Ownership */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00e476]">verified</span>
            2. User Content &amp; Developer Sovereignty (You Own Your Code)
          </h2>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            We adhere to a strict developer-first ownership policy. You retain complete, unencumbered intellectual property ownership over:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-[#b9cacb] list-disc pl-5">
            <li><strong className="text-white">Custom Workspace Plugins:</strong> Any custom extensions, tools, or VSIX/ZIP archives developed and uploaded by you or your organization.</li>
            <li><strong className="text-white">Architecture Topologies:</strong> Visual microservices graphs and node schemas designed inside Flow Designer.</li>
            <li><strong className="text-white">Technical Documentation:</strong> Markdown articles, internal API specs, and notebooks authored inside Doc Nexus.</li>
            <li><strong className="text-white">Financial &amp; Ledger Records:</strong> Business invoices, accounting ledger sequences, and simulation parameters.</li>
          </ul>
        </section>

        {/* Section 3: Market Data Disclaimer */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-400">warning</span>
            3. Financial Market Simulation &amp; Data Disclaimer
          </h2>
          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs sm:text-sm text-amber-200/90 space-y-3 leading-relaxed">
            <p className="font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400">candlestick_chart</span>
              Educational &amp; Computational Research Only
            </p>
            <p>
              The market quote streams, historical ticker charts, and algorithmic indicators (RSI, MACD, Bollinger Bands) provided within the Stock Analyzer applet are derived from public market endpoints for research, demonstration, and algorithmic modeling purposes only.
            </p>
            <p>
              SutharLabs is not a registered financial advisor, broker-dealer, or investment management entity. Simulated trading balances, cash balances, and executed orders operate within a deterministic paper trading simulation and hold zero real-world monetary value.
            </p>
          </div>
        </section>

        {/* Section 4: DMCA & Takedown Notices */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ce5dff]">gavel</span>
            4. DMCA &amp; Copyright Infringement Claims
          </h2>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            SutharLabs respects the intellectual property rights of all content creators. In accordance with the Digital Millennium Copyright Act (17 U.S.C. &sect; 512), if you believe that any community plugin package, documentation file, or code asset hosted on our platform infringes your copyright, please dispatch a formal notice containing:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-[#b9cacb] list-disc pl-5">
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Specific URL or plugin identifier of the infringing material on SutharLabs.</li>
            <li>Your contact information including legal name, address, telephone number, and email.</li>
            <li>A statement of good faith belief that the contested use is unauthorized by the copyright owner.</li>
            <li>A statement under penalty of perjury that the information provided is accurate.</li>
          </ul>
          
          <div className="p-4 rounded-xl bg-surface-container/50 border border-outline/10 font-mono text-xs text-[#00dbe7] space-y-1">
            <div>Designated Copyright Agent: Suthar Suresh</div>
            <div>Email: <a href="mailto:dmca@sutharlabs.com" className="hover:underline">dmca@sutharlabs.com</a></div>
            <div>SutharLabs Sovereign Systems • Legal Compliance Division</div>
          </div>
        </section>

        {/* Section 5: Acceptable Use */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ffb4ab]">security</span>
            5. Platform Integrity &amp; Acceptable Use
          </h2>
          <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
            Users agree not to: (a) upload plugins containing malicious code, keyloggers, or unauthorized telemetry collectors; (b) deliberately bypass API rate limits or isolation workers; or (c) use the platform to stage attacks against external network targets. Violations result in immediate administrative revocation of workspace credentials.
          </p>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 sm:px-12 border-t border-outline/10 bg-[#0a0a0e] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-on-surface-variant/80">
        <div>&copy; 2026 SutharLabs Sovereign Systems. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
          <span>•</span>
          <button type="button" onClick={() => navigate('/copyright')} className="text-[#00dbe7] hover:underline cursor-pointer">Terms &amp; Copyright</button>
          <span>•</span>
          <button type="button" onClick={openCookiePreferencesModal} className="hover:text-white transition-colors cursor-pointer">Cookie Settings</button>
        </div>
      </footer>
    </div>
  );
}
