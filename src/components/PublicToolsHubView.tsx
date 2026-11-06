import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PdfToolsStudio, { TOOLS_LIST, ToolType, ToolMeta } from '../plugins/DocNexus/components/PdfToolsStudio.js';
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
  FolderLock,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  FileCode,
  Languages,
  FileSpreadsheet,
  Contact,
  Sliders,
  QrCode,
  Hash,
  KeyRound,
  GitCompare,
  Binary,
  PenTool,
  Scissors,
  Minimize2,
  FileDown,
  Menu
} from 'lucide-react';

interface PublicToolsHubViewProps {
  theme?: 'dark' | 'light';
  user?: any;
  toggleTheme?: () => void;
}

type ToolCategory = 'ALL' | 'PDF' | 'IMAGE' | 'OCR' | 'DEV';

export default function PublicToolsHubView({ theme = 'dark', user, toggleTheme }: PublicToolsHubViewProps) {
  const isLight = theme === 'light';
  const { toolId } = useParams<{ toolId?: string }>();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('ALL');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Determine if specific tool is loaded
  const isSpecificTool = Boolean(toolId && TOOLS_LIST.some(t => t.id === toolId));
  const currentToolId = (isSpecificTool ? toolId : 'pdf-to-image') as ToolType;
  const currentToolMeta = TOOLS_LIST.find(t => t.id === currentToolId) || TOOLS_LIST[0];

  // Tool categorization mapping
  const getToolCategory = (id: ToolType): 'PDF' | 'IMAGE' | 'OCR' | 'DEV' => {
    if (['pdf-to-image', 'image-to-pdf', 'merge-pdf', 'split-pdf', 'pdf-editor', 'pdf-to-word', 'ocr-pdf'].includes(id)) {
      return 'PDF';
    }
    if (['compress-image', 'qr-generator', 'base64-tool', 'app-icon-generator'].includes(id)) {
      return 'IMAGE';
    }
    if (['multilingual-ocr', 'receipt-to-csv', 'business-card-scanner'].includes(id)) {
      return 'OCR';
    }
    return 'DEV';
  };

  // Filtered tools based on category and search
  const filteredTools = useMemo(() => {
    return TOOLS_LIST.filter(tool => {
      const cat = getToolCategory(tool.id);
      const matchesCategory = selectedCategory === 'ALL' || cat === selectedCategory;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term || 
        tool.title.toLowerCase().includes(term) ||
        tool.tagline.toLowerCase().includes(term) ||
        tool.badge.toLowerCase().includes(term) ||
        tool.id.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Related tools for the active tool view
  const relatedTools = useMemo(() => {
    const currentCat = getToolCategory(currentToolId);
    return TOOLS_LIST.filter(t => t.id !== currentToolId && getToolCategory(t.id) === currentCat).slice(0, 4);
  }, [currentToolId]);

  const CATEGORIES: { key: ToolCategory; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Tools', count: TOOLS_LIST.length },
    { key: 'PDF', label: 'PDF Suite', count: TOOLS_LIST.filter(t => getToolCategory(t.id) === 'PDF').length },
    { key: 'IMAGE', label: 'Image & Visual', count: TOOLS_LIST.filter(t => getToolCategory(t.id) === 'IMAGE').length },
    { key: 'OCR', label: 'OCR & Scanners', count: TOOLS_LIST.filter(t => getToolCategory(t.id) === 'OCR').length },
    { key: 'DEV', label: 'Developer & Security', count: TOOLS_LIST.filter(t => getToolCategory(t.id) === 'DEV').length },
  ];

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
      q: 'How does the bilingual Hindi & English OCR work?',
      a: 'The OCR engine embeds neural Tesseract WebAssembly language packs for Devanagari script and Latin characters, reading receipts, printed bills, and signage entirely on-device with optional camera snap.'
    },
    {
      q: 'Can I automate these document workflows programmatically?',
      a: 'Yes! SutharLabs provides Workflow Studio (an open-source n8n alternative) and AI Agent Studio on our platform to build fully autonomous, multi-step document pipelines connected to your private databases and APIs.'
    }
  ];

  // Schema.org Structured Data
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://www.sutharlabs.com/tools#webapp',
        'name': 'SutharLabs Sovereign Document & PDF Tools Hub',
        'url': 'https://www.sutharlabs.com/tools',
        'description': 'Free client-side WebAssembly document and PDF tools: PDF to Word DOCX, Image to PDF, Merge, Split, Bilingual Hindi OCR, and Image Compression with zero server uploads.',
        'applicationCategory': 'BusinessApplication, DeveloperApplication, UtilityApplication',
        'operatingSystem': 'All (Web Browser, Chrome, Firefox, Safari, Edge)',
        'browserRequirements': 'HTML5 Canvas & WebAssembly support',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'featureList': [
          '100% Client-Side In-Browser Processing',
          'PDF to Word DOCX Reconstruction',
          'Lossless PDF to Image Converter',
          'Bilingual Hindi Devanagari & English OCR',
          'Receipt to Excel CSV Extractor',
          'Client-Side PDF Merger and Splitter',
          'Zero Cloud Uploads Privacy Guarantee'
        ]
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://www.sutharlabs.com/tools#faq',
        'mainEntity': FAQS.map(faq => ({
          '@type': 'Question',
          'name': faq.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.a
          }
        }))
      }
    ]
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0a0a0c] text-[#e5e1e4]'
    }`}>
      {/* Schema.org Structured Data Injection for SEO */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} 
      />

      {/* Uniform Responsive Floating Top Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-3 backdrop-blur-xl rounded-full mt-4 mx-auto w-[92%] sm:w-[95%] max-w-7xl border shadow-[0_0_15px_rgba(0,219,231,0.08)] transition-all duration-300 ease-out ${
        isLight 
          ? 'bg-white/85 border-slate-200 text-slate-800' 
          : 'bg-[#101014]/85 border-outline/10 text-[#e5e1e4]'
      }`}>
        <Link 
          to="/" 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img 
            src="/sutharlabs-logo-sm.png" 
            alt="SutharLabs Emblem" 
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform duration-300 group-hover:scale-105 shrink-0 drop-shadow-[0_0_8px_rgba(0,219,231,0.4)]" 
          />
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#74f5ff] tracking-tight neon-text-glow">
            SutharLabs
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-4 sm:gap-6 xl:gap-8 font-mono text-xs">
          <Link 
            to="/#features" 
            className="text-on-surface-variant hover:text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer bg-transparent border-none"
          >
            Features
          </Link>
          <Link 
            to="/#services" 
            className="text-on-surface-variant hover:text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer bg-transparent border-none"
          >
            Services offered
          </Link>
          <Link 
            to="/#portfolio" 
            className="text-on-surface-variant hover:text-tertiary hover:bg-tertiary/5 px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer bg-transparent border-none"
          >
            Our Portfolio
          </Link>
          <Link 
            to="/#store" 
            className="text-on-surface-variant hover:text-secondary hover:bg-secondary/5 px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer bg-transparent border-none"
          >
            App Store
          </Link>
          <Link 
            to="/tools"
            className="text-primary bg-primary/10 font-bold px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer border-none flex items-center gap-1"
          >
            <span>Free Tools</span>
          </Link>
          <Link 
            to="/#contact" 
            className="text-on-surface-variant hover:text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer bg-transparent border-none"
          >
            Contact Us
          </Link>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Theme Toggle */}
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 bg-white/5 border border-white/10 rounded-full text-on-surface hover:text-[#00dbe7] hover:border-[#00dbe7]/50 transition-all flex items-center justify-center cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            >
              {isLight ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          )}

          {/* Launch Workspace */}
          <Link
            to={user ? "/workspace" : "/auth"}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-mono font-bold text-xs bg-gradient-to-r from-[#00dbe7] to-[#74f5ff] text-[#002022] hover:opacity-95 shadow-md shadow-[#00dbe7]/20 transition-all uppercase tracking-wider"
          >
            <span>{user ? 'Open Workspace' : 'Launch Workspace'}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-on-surface hover:text-primary transition-all cursor-pointer"
            aria-label="Open navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Sliding Drawer Panel */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="fixed right-0 top-0 bottom-0 h-full w-[85%] max-w-[320px] bg-[#0c0c0e] border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between font-mono z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <img src="/sutharlabs-logo-sm.png" alt="SutharLabs" className="w-6 h-6 object-contain" />
                  <span className="text-sm font-bold text-[#74f5ff] uppercase tracking-wider">SutharLabs</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-on-surface-variant hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3 text-sm">
                <Link to="/#features" onClick={() => setIsMobileMenuOpen(false)} className="text-on-surface-variant hover:text-primary py-1.5">
                  Features
                </Link>
                <Link to="/#services" onClick={() => setIsMobileMenuOpen(false)} className="text-on-surface-variant hover:text-primary py-1.5">
                  Services
                </Link>
                <Link to="/#portfolio" onClick={() => setIsMobileMenuOpen(false)} className="text-on-surface-variant hover:text-tertiary py-1.5">
                  Our Portfolio
                </Link>
                <Link to="/#store" onClick={() => setIsMobileMenuOpen(false)} className="text-on-surface-variant hover:text-secondary py-1.5">
                  App Store
                </Link>
                <Link to="/tools" onClick={() => setIsMobileMenuOpen(false)} className="text-primary font-bold py-1.5">
                  Free Tools
                </Link>
                <Link to="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-on-surface-variant hover:text-primary py-1.5">
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <Link
                to={user ? "/workspace" : "/auth"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full h-10 rounded-xl font-mono font-bold text-xs bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>{user ? 'Open Workspace' : 'Launch Workspace'}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header Section */}
      <section className={`pt-28 pb-10 sm:pt-36 sm:pb-14 px-4 sm:px-8 border-b ${
        isLight ? 'bg-white border-slate-200' : 'bg-gradient-to-b from-[#121216] to-[#0a0a0c] border-[#3a494b]/30'
      }`}>
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border mx-auto bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>100% Sovereign Client-Side • Zero Cloud Storage • Unlimited File Size</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Free Sovereign <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-[#00dbe7] to-emerald-400">Document, PDF &amp; OCR Tools</span>
          </h1>

          <p className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#a4a2a6]'}`}>
            Convert, sign, merge, split, compress, and extract text from PDFs, images, and receipts entirely inside your web browser. 
            No cloud uploads, no daily task limits, and your files never leave your device.
          </p>

          {/* Search Box on Catalog Hub View */}
          {!isSpecificTool && (
            <div className="pt-2 max-w-xl mx-auto">
              <div className={`relative flex items-center rounded-xl border shadow-sm transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20' 
                  : 'bg-[#141418] border-[#3a494b]/50 focus-within:border-[#00dbe7] focus-within:ring-2 focus-within:ring-[#00dbe7]/20'
              }`}>
                <Search className="w-4 h-4 ml-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search sovereign tools: icon generator, word, merge, split, ocr, qr, vcard, compress..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full py-2.5 px-3 text-xs font-mono outline-none bg-transparent ${
                    isLight ? 'text-slate-800 placeholder-slate-400' : 'text-[#e5e1e4] placeholder-gray-500'
                  }`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="p-2 mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* VIEWPORT: Specific Tool Engine OR Full Categorized Directory */}
      {isSpecificTool ? (
        /* INDIVIDUAL TOOL VIEW */
        <div className="flex-1 w-full max-w-6xl mx-auto py-6 sm:py-8 px-3 sm:px-6 space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Link to="/tools" className="hover:underline flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Tools Hub</span>
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="font-bold text-on-surface">{currentToolMeta.title}</span>
          </div>

          {/* Main Interactive Studio Engine */}
          <main className="w-full">
            <PdfToolsStudio 
              initialTool={currentToolId}
              theme={theme}
              isStandalone={true}
              user={user}
            />
          </main>

          {/* Related Tools Cross-Links */}
          {relatedTools.length > 0 && (
            <div className={`p-5 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-[#3a494b]/30'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Related Sovereign Tools</span>
                </h3>
                <Link to="/tools" className="text-xs font-mono text-[#00dbe7] hover:underline">
                  View All Tools &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {relatedTools.map(t => {
                  const ToolIcon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => navigate(`/tools/${t.id}`)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                        isLight 
                          ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-sky-400' 
                          : 'bg-[#18181c] hover:bg-[#202026] border-[#3a494b]/30 hover:border-[#00dbe7]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${t.accentColor}15`,
                            borderColor: `${t.accentColor}30`,
                            color: t.accentColor
                          }}
                        >
                          <ToolIcon className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold truncate text-on-surface group-hover:text-sky-500 transition-colors">
                            {t.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">{t.badge}</span>
                        </div>
                      </div>
                      <p className={`text-[11px] line-clamp-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                        {t.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MASTER CATALOG HUB VIEW */
        <main className="flex-1 w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer select-none ${
                  selectedCategory === cat.key
                    ? isLight
                      ? 'bg-sky-500 text-white shadow-sm border border-sky-600'
                      : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/50 shadow-sm'
                    : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      : 'bg-[#18181c] hover:bg-[#222228] text-slate-300 border border-[#3a494b]/40'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  selectedCategory === cat.key
                    ? isLight ? 'bg-white/20 text-white' : 'bg-[#00dbe7]/20 text-[#00dbe7]'
                    : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-gray-400'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTools.map(tool => {
              const ToolIcon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => navigate(`/tools/${tool.id}`)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:shadow-lg hover:-translate-y-0.5 duration-200 ${
                    isLight 
                      ? 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-sky-400' 
                      : 'bg-[#131316] hover:bg-[#18181d] border-[#3a494b]/30 hover:border-[#00dbe7]/40 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs"
                        style={{
                          backgroundColor: `${tool.accentColor}18`,
                          borderColor: `${tool.accentColor}35`,
                          color: tool.accentColor
                        }}
                      >
                        <ToolIcon className="w-5 h-5 shrink-0" />
                      </div>
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border"
                        style={{
                          backgroundColor: `${tool.accentColor}12`,
                          borderColor: `${tool.accentColor}30`,
                          color: tool.accentColor
                        }}
                      >
                        {tool.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-on-surface group-hover:text-sky-500 dark:group-hover:text-[#00dbe7] transition-colors flex items-center gap-1.5">
                        <span>{tool.title}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-sky-500 dark:text-[#00dbe7] shrink-0" />
                      </h3>
                      <p className={`text-xs mt-1.5 leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                        {tool.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                      100% In-Browser
                    </span>
                    <span className="text-sky-500 dark:text-[#00dbe7] font-bold group-hover:underline flex items-center gap-1">
                      <span>Launch</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTools.length === 0 && (
            <div className={`p-10 rounded-2xl border text-center space-y-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#131316] border-[#3a494b]/30'
            }`}>
              <Search className="w-8 h-8 mx-auto text-slate-400" />
              <h3 className="text-sm font-bold">No matching sovereign tools found</h3>
              <p className="text-xs text-slate-500 font-mono">
                Try searching for different keywords or select "All Tools".
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                }}
                className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-sky-500 text-white cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          )}

          {/* 3-Step "How It Works" Visual Guide */}
          <section className={`p-6 sm:p-8 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#121216] border-[#3a494b]/30'
          }`}>
            <div className="text-center space-y-2 mb-8">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-sky-500/10 text-sky-500 border border-sky-500/20 font-bold">
                Zero Cloud Latency
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                How SutharLabs Sovereign Processing Works
              </h2>
              <p className={`text-xs max-w-xl mx-auto ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                Unlike legacy online PDF converters that send your files across remote clouds, our engine compiles high-performance C++ &amp; Rust WebAssembly binaries directly onto your device.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              <div className={`p-5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
              }`}>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-500 flex items-center justify-center font-mono font-black text-sm">
                    01
                  </div>
                  <h3 className="text-sm font-bold">Upload, Drag, or Snap</h3>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    Select local PDF documents, images, or snap physical bills using your device camera. Files are loaded solely into local browser sandbox RAM.
                  </p>
                </div>
              </div>

              <div className={`p-5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
              }`}>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-mono font-black text-sm">
                    02
                  </div>
                  <h3 className="text-sm font-bold">In-Browser WASM Execution</h3>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    Local WebAssembly threads parse PDF vector streams, compress image buffers, or execute Tesseract OCR glyph transcription with 0 network latency.
                  </p>
                </div>
              </div>

              <div className={`p-5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
              }`}>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-sm">
                    03
                  </div>
                  <h3 className="text-sm font-bold">Instant Asset Download</h3>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    Export clean, formatted Microsoft Word documents, image ZIPs, or CSV tables directly to your disk. Zero watermarks, zero tracking cookies.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

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
                    <td className="py-3 px-4 text-emerald-400 font-bold">100% Free &amp; Unlimited</td>
                    <td className="py-3 px-4 text-[#849495]">2 - 3 tasks per day before paywall</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Advertisements &amp; Trackers</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">Zero Ads, Zero Trackers</td>
                    <td className="py-3 px-4 text-rose-400">Heavy ad banners &amp; tracking cookies</td>
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
