import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PdfToolsStudio, { TOOLS_LIST, ToolType } from '../plugins/DocNexus/components/PdfToolsStudio.js';
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  Sparkles, 
  Check, 
  X, 
  ChevronRight, 
  ExternalLink, 
  ArrowRight,
  ChevronDown,
  HelpCircle,
  FileCheck,
  Cpu,
  Layers,
  Bot,
  Workflow,
  TrendingUp,
  FolderLock
} from 'lucide-react';

interface PublicToolsHubViewProps {
  theme?: 'dark' | 'light';
  user?: any;
}

export default function PublicToolsHubView({ theme = 'dark', user }: PublicToolsHubViewProps) {
  const isLight = theme === 'light';
  const { toolId } = useParams<{ toolId?: string }>();
  const navigate = useNavigate();

  // Validate or fall back to default tool
  const currentToolId = (TOOLS_LIST.some(t => t.id === toolId) ? toolId : 'pdf-to-image') as ToolType;
  const currentToolMeta = TOOLS_LIST.find(t => t.id === currentToolId) || TOOLS_LIST[0];

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const FAQS = [
    {
      q: 'Are my PDF documents or images uploaded to any remote server?',
      a: 'No. Never. SutharLabs Tools utilize high-performance WebAssembly (WASM) and HTML5 Canvas to execute 100% of the conversions directly in your browser memory. Your sensitive financial, medical, or corporate files never touch our servers or any third-party cloud.'
    },
    {
      q: 'Is there a file size limit or daily quota?',
      a: 'No. Because all CPU processing is performed locally on your device, there are no arbitrary 10MB or 25MB file size limits, and no daily task quotas. You can convert, split, merge, and edit documents of any size as long as your device has sufficient RAM.'
    },
    {
      q: 'Can I use these tools for commercial business purposes?',
      a: 'Yes, 100%. All tools are free for personal, commercial, and enterprise workflows with zero royalty or license fees.'
    },
    {
      q: 'How does the PDF to Word (DOCX) conversion work without server uploads?',
      a: 'Our engine parses the underlying PDF vector stream and text coordinates in-browser, reconstructs paragraphs and headings into standard OpenXML structure, and compiles an authentic Microsoft Word (.docx) archive directly in client RAM.'
    },
    {
      q: 'Can I automate these document workflows programmatically?',
      a: 'Yes! SutharLabs provides Workflow Studio (an open-source n8n alternative) and AI Agent Studio on our platform to build fully autonomous, multi-step document pipelines connected to your private databases and APIs.'
    }
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0a0a0c] text-[#e5e1e4]'
    }`}>
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors ${
        isLight ? 'bg-white/80 border-slate-200 shadow-xs' : 'bg-[#101014]/80 border-[#3a494b]/30'
      }`}>
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00dbe7] to-[#74f5ff] flex items-center justify-center shadow-sm shadow-[#00dbe7]/20 group-hover:scale-105 transition-transform">
              <span className="text-[#002022] font-black text-sm tracking-tighter">SL</span>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight block leading-none">
                Suthar<span className="text-[#00dbe7]">Labs</span>
              </span>
              <span className="text-[10px] font-mono text-[#849495] tracking-widest uppercase block mt-0.5">
                Tools Hub
              </span>
            </div>
          </Link>

          {/* Quick tool pills on desktop */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-mono">
            {TOOLS_LIST.slice(0, 6).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/tools/${t.id}`)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  currentToolId === t.id
                    ? isLight ? 'bg-slate-200 text-slate-900 font-bold' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#849495] hover:text-[#e5e1e4]'
                }`}
              >
                {t.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/workspace"
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300' 
                : 'bg-[#1b1b1e] hover:bg-[#252428] text-[#e5e1e4] border border-[#3a494b]/40'
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">Workflow Studio</span>
          </Link>

          <Link
            to={user ? "/workspace" : "/auth"}
            className="h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm bg-sky-500 hover:bg-sky-600 text-white select-none transition-all"
          >
            <span>{user ? 'Open Workspace' : 'Sign In'}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`py-10 px-4 sm:px-8 border-b ${
        isLight ? 'bg-white border-slate-200' : 'bg-gradient-to-b from-[#121216] to-[#0a0a0c] border-[#3a494b]/30'
      }`}>
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border mx-auto bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>100% Client-Side • Zero Cloud Uploads • Zero File Size Limits</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Free Sovereign <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-[#00dbe7] to-emerald-400">Document & PDF Tools</span>
          </h1>

          <p className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#a4a2a6]'}`}>
            Convert, edit, sign, merge, split, and compress PDF documents and images entirely in your browser. 
            No sign-up required, no paywalls, and your files never leave your device.
          </p>
        </div>
      </section>

      {/* Main Interactive Studio Engine */}
      <main className="flex-1 w-full max-w-6xl mx-auto py-6 sm:py-8 px-3 sm:px-6">
        <PdfToolsStudio 
          initialTool={currentToolId}
          theme={theme}
          isStandalone={true}
        />
      </main>

      {/* Value Comparison Section: SutharLabs vs Traditional Online Converters */}
      <section className={`py-12 px-4 sm:px-8 border-t ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#101014] border-[#3a494b]/30'
      }`}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Why Professionals Choose <span className="text-[#00dbe7]">SutharLabs Sovereign Tools</span>
            </h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-500' : 'text-[#849495]'}`}>
              Built on local WebAssembly engines to protect privacy and eliminate arbitrary cloud limits.
            </p>
          </div>

          {/* Comparison Table */}
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141418] border-[#3a494b]/40'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b ${isLight ? 'bg-slate-100/70 border-slate-200 text-slate-700' : 'bg-white/5 border-[#3a494b]/40 text-[#c2c8c8]'}`}>
                    <th className="py-3 px-4 font-bold">Feature</th>
                    <th className="py-3 px-4 font-bold text-[#00dbe7]">SutharLabs Tools</th>
                    <th className="py-3 px-4 font-bold text-[#849495]">Traditional Web Converters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a494b]/20">
                  <tr>
                    <td className="py-3 px-4 font-semibold">File Upload to Cloud</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" /> Zero Uploads (100% In-Browser)
                    </td>
                    <td className="py-3 px-4 text-rose-400">Uploaded to third-party servers</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">File Size Limit</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">Unlimited (Device RAM)</td>
                    <td className="py-3 px-4 text-[#849495]">Strictly capped (10MB - 25MB)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Daily Usage Limits</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">100% Free & Unlimited</td>
                    <td className="py-3 px-4 text-[#849495]">2 - 3 tasks per day before paywall</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Advertisements & Trackers</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">Zero Ads, Zero Trackers</td>
                    <td className="py-3 px-4 text-rose-400">Heavy ad banners & tracking cookies</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Watermarks on Output</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">Never (Clean, Original Output)</td>
                    <td className="py-3 px-4 text-[#849495]">Often injects branding watermarks</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Enterprise Automation Callout */}
          <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isLight 
              ? 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200' 
              : 'bg-gradient-to-r from-[#00dbe7]/10 to-purple-500/10 border-[#00dbe7]/30'
          }`}>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm sm:text-base font-bold flex items-center justify-center sm:justify-start gap-2">
                <Workflow className="w-4 h-4 text-[#00dbe7] shrink-0" />
                <span>Automate Multi-Step Document Workflows at Scale</span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-[#a4a2a6]'}`}>
                Connect PDF processing, AI extraction, and database replication inside SutharLabs Workflow Studio.
              </p>
            </div>
            <Link
              to="/workspace"
              className="h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm bg-gradient-to-r from-[#00dbe7] to-sky-500 text-[#002022] font-black shrink-0 hover:opacity-95 select-none"
            >
              <span>Explore Workflow Studio</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-3 pt-6">
            <h3 className="text-base sm:text-lg font-bold text-center mb-4">
              Frequently Asked Questions
            </h3>
            {FAQS.map((faq, idx) => (
              <div 
                key={idx}
                className={`rounded-xl border transition-all ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180 text-[#00dbe7]' : 'text-[#849495]'}`} />
                </button>
                {openFaq === idx && (
                  <div className={`px-4 pb-4 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#a4a2a6]'}`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-6 px-4 sm:px-8 border-t text-xs font-mono text-center flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-[#0a0a0c] border-[#3a494b]/20 text-[#849495]'
      }`}>
        <p>&copy; {new Date().getFullYear()} SutharLabs Sovereign Engine. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link to="/copyright" className="hover:underline">Copyright</Link>
          <Link to="/workspace" className="hover:underline">Platform Console</Link>
        </div>
      </footer>
    </div>
  );
}

