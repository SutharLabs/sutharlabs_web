import React, { useState, useEffect } from 'react';
import { UserProfile, StorePlugin } from '../types';
import { 
  Code, 
  Smartphone, 
  Brain, 
  Cpu, 
  Layers, 
  Database, 
  X, 
  ChevronRight, 
  Star, 
  CheckCircle, 
  Menu,
  ShieldCheck,
  Zap,
  DollarSign
} from 'lucide-react';

interface LandingPageProps {
  user: UserProfile;
  onLaunch: () => void;
  onNavigateAuth: (tab: 'signin' | 'signup') => void;
}

interface PortfolioProject {
  id: string;
  title: string;
  segment: 'Web Dev' | 'Mobile Apps' | 'AI & Analytics';
  description: string;
  detailedCase: string;
  stat: string;
  statLabel: string;
  techs: string[];
  client: string;
  clientTitle: string;
  blueprintSymbol: string;
  imageSrc: string;
}

export default function LandingPage({ user, onLaunch, onNavigateAuth }: LandingPageProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Web Dev' | 'Mobile Apps' | 'AI & Analytics'>('All');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [plugins, setPlugins] = useState<StorePlugin[]>([]);

  // Load store plugins from real backend REST API routes
  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const response = await fetch('/api/plugins');
        if (response.ok) {
          const data = await response.json();
          setPlugins(data);
        }
      } catch (err) {
        console.error('Error fetching registry plugins from backend server:', err);
      }
    };

    fetchPlugins();

    // Periodically sync with backend database list for reliable administration updates
    const interval = setInterval(fetchPlugins, 3000);
    return () => clearInterval(interval);
  }, []);

  // Portfolio items presenting credibility for custom web & mobile apps
  const portfolioProjects: PortfolioProject[] = [
    {
      id: 'proj_1',
      title: 'Driven Enterprise',
      segment: 'Web Dev',
      description: 'A comprehensive digital marketing and corporate services hub showcasing global product portfolios.',
      detailedCase: 'Engineered a highly aesthetic marketing website featuring seamless page interactions, tailored visual showcases, and custom search optimization layouts. Built to provide reliable product discovery. Officially verified operating at https://drivenenterprise.in/',
      stat: 'Live at drivenenterprise.in',
      statLabel: 'Corporate marketing platform',
      techs: ['React 18', 'Vite', 'Tailwind CSS', 'Framer Motion', 'SEO Optimized'],
      client: 'Driven Enterprise',
      clientTitle: 'Director of Digital Brand',
      blueprintSymbol: 'globe',
      imageSrc: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'proj_2',
      title: 'Aradhana Dharmika Trust',
      segment: 'Web Dev',
      description: 'Spiritual community and administrative temple trust platform handling daily activities and dynamic notices.',
      detailedCase: 'Designed a high-integrity, completely responsive portal for the Temple and Educational Trust. Streamlines daily calendar logs, community activities, and announcement boards with lightweight state synchronization. Officially verified operating at https://aradhanadharmikatrust.org/',
      stat: 'Live at aradhanadharmikatrust.org',
      statLabel: 'Temple & Educational Trust Hub',
      techs: ['React', 'TypeScript', 'Tailwind CSS', 'Dignified Theme', 'Responsive Grid'],
      client: 'Trust Board',
      clientTitle: 'Lead Trustee, Aradhana Trust',
      blueprintSymbol: 'account_balance',
      imageSrc: 'https://images.unsplash.com/photo-1602631985686-2bb0f0a8696e?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'proj_3',
      title: 'GoToxinFree With Tina',
      segment: 'Web Dev',
      description: 'Vibrant personal blogging, travels storyteller, and medical/health opinion exchange portal.',
      detailedCase: 'Developed an elegant bespoke personal blog and content syndicate system with high contrast reading panels and local user bookmarks. Completely mobile optimized with zero latency reading transitions. Officially verified operating at https://gotoxinfreewithtina.com/',
      stat: 'Live at gotoxinfreewithtina.com',
      statLabel: 'Travel Storytelling & Health Blog',
      techs: ['React 19', 'Tailwind UI', 'Markdown Reader', 'Bespoke Layouts', 'RSS Sync'],
      client: 'Tina Maria',
      clientTitle: 'Creator & Lead Author',
      blueprintSymbol: 'article',
      imageSrc: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'proj_4',
      title: 'SutharLabs Sovereign Engine',
      segment: 'AI & Analytics',
      description: 'Dense dashboard playground mapping live index telemetry trackers, visual node flows, and accounting modules.',
      detailedCase: 'Created this entire workspace development block to prove complete interactive UI capability. Fully localizes mock state engines, reactive flow graphs, financial ledger balancers, and full real-time simulation logic.',
      stat: 'Workspace Suite',
      statLabel: 'Active SutharLabs Showcase Core',
      techs: ['React 18', 'TypeScript', 'D3.js', 'Recharts', 'Tailwind CSS', 'Node APIs'],
      client: 'Internal Systems',
      clientTitle: 'Founder, SutharLabs',
      blueprintSymbol: 'deployed_code',
      imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const filteredProjects = activeFilter === 'All' 
    ? portfolioProjects 
    : portfolioProjects.filter(p => p.segment === activeFilter);

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-[#050505] text-[#e5e1e4]">
      
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00f2ff]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#ce5dff]/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Responsive Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-3 bg-[#131315]/80 backdrop-blur-xl rounded-full mt-4 mx-auto w-[92%] sm:w-[95%] max-w-7xl border border-[#3a494b]/10 shadow-[0_0_15px_rgba(0,219,231,0.08)] transition-all duration-300 ease-out">
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:rotate-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sutharGlowNav" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00dbe7" />
                <stop offset="50%" stopColor="#ce5dff" />
                <stop offset="100%" stopColor="#00e476" />
              </linearGradient>
            </defs>
            <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z" stroke="url(#sutharGlowNav)" strokeWidth="6" strokeLinejoin="round" fill="none" />
            <path d="M65 32 C65 25, 35 25, 35 37 C35 49, 65 51, 65 63 C65 75, 35 75, 35 68" stroke="url(#sutharGlowNav)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="font-sans text-xl sm:text-2xl font-bold text-[#74f5ff] tracking-tight neon-text-glow">
            SutharLabs
          </span>
        </div>

        {/* Desktop Navigation links */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8 font-mono text-xs">
          <a className="text-[#b9cacb] hover:text-[#74f5ff] hover:bg-white/5 px-2.5 py-1.5 rounded transition-all duration-200" href="#features">Features</a>
          <a className="text-[#b9cacb] hover:text-[#74f5ff] hover:bg-white/5 px-2.5 py-1.5 rounded transition-all duration-200" href="#services">Services offered</a>
          <a className="text-[#b9cacb] hover:text-[#74f5ff] hover:bg-white/5 px-2.5 py-1.5 rounded transition-all duration-200" href="#portfolio">Our Portfolio</a>
          <a className="text-[#b9cacb] hover:text-[#74f5ff] hover:bg-white/5 px-2.5 py-1.5 rounded transition-all duration-200" href="#store">MCP Store</a>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {user.isLoggedIn ? (
            <button 
              onClick={onLaunch}
              className="bg-[#00dbe7] text-[#002022] px-4 sm:px-5 py-2 rounded-full font-mono text-[11px] sm:text-[12px] font-bold uppercase hover:brightness-110 tracking-wider shadow-[0_0_15px_rgba(0,219,231,0.25)] hover:shadow-[0_0_20px_rgba(0,219,231,0.45)] transition-all cursor-pointer whitespace-nowrap"
            >
              Workspace
            </button>
          ) : (
            <button 
              onClick={() => onNavigateAuth('signin')}
              className="bg-[#00dbe7] text-[#002022] px-4 sm:px-5 py-2 rounded-full font-mono text-[11px] sm:text-[12px] font-bold uppercase hover:brightness-110 tracking-wider shadow-[0_0_15px_rgba(0,219,231,0.25)] hover:shadow-[0_0_20px_rgba(0,219,231,0.45)] transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Hamburger Mobile Menu Trigger Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-[#b9cacb] hover:text-[#74f5ff] transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Floating Mobile Navigation Menu overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Dimmed backdrop filter */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          />

          {/* Right Sliding Drawer Panel */}
          <div className="fixed right-0 top-0 bottom-0 z-50 h-full w-[85%] max-w-[340px] bg-[#0c0c0e] border-l border-[#3a494b]/20 shadow-[0_0_50px_rgba(0,0,0,0.85)] lg:hidden p-6 flex flex-col justify-between font-mono animate-[slideInRight_0.3s_ease-out] select-none">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-6 border-b border-[#3a494b]/15 mb-8">
                <div className="flex items-center gap-2">
                  <svg className="w-5.5 h-5.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="sutharGlowMobiNav" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00dbe7" />
                        <stop offset="50%" stopColor="#ce5dff" />
                        <stop offset="100%" stopColor="#00e476" />
                      </linearGradient>
                    </defs>
                    <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z" stroke="url(#sutharGlowMobiNav)" strokeWidth="6" strokeLinejoin="round" fill="none" />
                    <path d="M65 32 C65 25, 35 25, 35 37 C35 49, 65 51, 65 63 C65 75, 35 75, 35 68" stroke="url(#sutharGlowMobiNav)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span className="text-sm font-bold text-[#74f5ff] uppercase tracking-wider">SutharLabs</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-full text-[#b9cacb] hover:text-[#ce5dff] transition-all cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stack of navigation page anchors */}
              <div className="flex flex-col gap-4 text-sm mt-4">
                <a 
                  className="text-[#b9cacb] hover:text-[#74f5ff] hover:bg-white/5 px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2" 
                  href="#features"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-[#ce5dff] text-xs">◆</span> Features
                </a>
                <a 
                  className="text-[#b9cacb] hover:text-[#74f5ff] hover:bg-white/5 px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2" 
                  href="#services"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-[#00e476] text-xs">◆</span> Services Offered
                </a>
                <a 
                  className="text-[#b9cacb] hover:text-[#74f5ff] hover:bg-white/5 px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2" 
                  href="#portfolio"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-[#00dbe7] text-xs">◆</span> Our Portfolio
                </a>
                <a 
                  className="text-[#b9cacb] hover:text-[#74f5ff] hover:bg-white/5 px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2" 
                  href="#store"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-[#ebb2ff] text-xs">◆</span> MCP Store
                </a>
              </div>
            </div>

            {/* Launcher button at bottom */}
            <div className="pt-6 border-t border-[#3a494b]/15 space-y-3">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLaunch();
                }}
                className="w-full py-3 bg-[#00dbe7] text-[#002022] font-mono text-[11px] font-bold uppercase rounded-lg hover:brightness-110 tracking-wider shadow-[0_0_15px_rgba(0,219,231,0.25)] hover:shadow-[0_0_20px_rgba(0,219,231,0.45)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined select-none text-sm leading-none animate-pulse">rocket_launch</span>
                LAUNCH WORKSPACE
              </button>
              <p className="text-[9px] text-[#b9cacb]/40 text-center uppercase tracking-widest">SutharLabs Enterprise</p>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-grow z-10 pt-28 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-20 sm:gap-24 pb-24">
        
        {/* Hero Section */}
        <section id="features" className="flex flex-col items-center justify-center text-center py-10 sm:py-16 relative">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ce5dff]/10 border border-[#ce5dff]/30 text-[#ebb2ff] font-mono text-[10px] uppercase tracking-widest leading-none mb-2">
              <Star className="w-3 h-3 text-[#ebb2ff]" />
              SutharLabs Solutions
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-[#e5e1e4] neon-text-primary px-2">
              SutharLabs: Deploy Next-Gen Web, Agents &amp; Modular Workflows.
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[#b9cacb] max-w-2xl mx-auto font-sans font-light">
              A high-performance command center for modern developers. Build, scale, and orchestrate complex AI integrations, fluid cross-platform designs, and microservices with uncompromising speed and precision.
            </p>
            <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button 
                onClick={onLaunch}
                className="w-full sm:w-auto glass-panel px-8 py-4 rounded-xl font-mono text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-[#74f5ff] border border-[#00dbe7]/30 shadow-[0_0_20px_rgba(0,219,231,0.15)] hover:bg-[#00dbe7]/10 hover:shadow-[0_0_30px_rgba(0,219,231,0.35)] hover:border-[#00dbe7]/70 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined select-none animate-pulse">rocket_launch</span>
                {user.isLoggedIn ? 'Go to App Workspace' : 'Login to Workspace'}
              </button>
              
              <a 
                href="#portfolio"
                className="w-full sm:w-auto px-8 py-4 font-mono text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-[#b9cacb] hover:text-white transition-all text-center"
              >
                View Credibility Portfolio
              </a>
            </div>
          </div>

          {/* Glowing Console fluid Image Panel */}
          <div className="w-full mt-14 sm:mt-20 relative rounded-2xl overflow-hidden glass-panel border border-[#3a494b]/20 shadow-[0_15px_40px_rgba(0,0,0,0.6)] aspect-video md:h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#131315]/90 z-10"></div>
            <div className="w-full h-full bg-[#1c1b1d] flex items-center justify-center relative">
              <img 
                alt="SutharLabs Custom Solutions Monitor &amp; Real-time Dashboards" 
                className="fluid-img w-full h-full object-cover opacity-65 transition-transform duration-1000 hover:scale-[1.02]" 
                referrerPolicy="no-referrer"
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
              />
              <div className="absolute inset-0 border border-[#00dbe7]/15 rounded-2xl"></div>
            </div>
          </div>
        </section>

        {/* Services Offered Section */}
        <section id="services" className="space-y-8 scroll-mt-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#3a494b]/20 pb-4 gap-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ce5dff] text-2xl sm:text-3xl select-none">home_repair_service</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e5e1e4]">Services Offered</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#b9cacb]/80 font-mono">Precision coding &amp; architecture packages.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Service Package 1: Custom Web Development */}
            <div className="glass-panel p-6 sm:p-8 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 hover:border-[#00dbe7]/50 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#201f21] flex items-center justify-center border border-[#3a494b]/20 group-hover:border-[#00dbe7]/50 transition-all">
                  <Code className="text-[#00dbe7] w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#e5e1e4]">Custom Web Dev</h3>
                <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
                  Tailored React, Vite, and Next.js frontends engineered with strict compliance, layout consistency, and sub-millisecond edge load speeds.
                </p>
                <ul className="space-y-2 mt-4 text-[11px] sm:text-xs font-mono text-[#b9cacb]/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#00dbe7]" />
                    Fluid responsive CSS designs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#00dbe7]" />
                    Optimized lighthouse profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#00dbe7]" />
                    State sync &amp; Secure edge API integration
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-[#3a494b]/10 flex justify-between items-center text-xs">
                <span className="font-mono text-gray-500">Pricing Model</span>
                <span className="font-mono text-[#00dbe7] font-bold">Custom quote based on scope</span>
              </div>
            </div>

            {/* Service Package 2: Mobile App Development */}
            <div className="glass-panel p-6 sm:p-8 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 hover:border-[#ce5dff]/50 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#201f21] flex items-center justify-center border border-[#3a494b]/20 group-hover:border-[#ce5dff]/50 transition-all">
                  <Smartphone className="text-[#ce5dff] w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#e5e1e4]">Mobile App Dev</h3>
                <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
                  High-fidelity React Native applications designed with fluent navigation, responsive gestures, and reliable local SQLite storage vaults.
                </p>
                <ul className="space-y-2 mt-4 text-[11px] sm:text-xs font-mono text-[#b9cacb]/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#ce5dff]" />
                    iOS and Android unified targets
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#ce5dff]" />
                    Local encryption and biometrics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#ce5dff]" />
                    Dynamic background socket services
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-[#3a494b]/10 flex justify-between items-center text-xs">
                <span className="font-mono text-gray-500">Pricing Model</span>
                <span className="font-mono text-[#ce5dff] font-bold">Custom quote based on scope</span>
              </div>
            </div>

            {/* Service Package 3: Intelligent Agent Systems */}
            <div className="glass-panel p-6 sm:p-8 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 hover:border-[#ebb2ff]/50 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#201f21] flex items-center justify-center border border-[#3a494b]/20 group-hover:border-[#ebb2ff]/50 transition-all">
                  <Brain className="text-[#ebb2ff] w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#e5e1e4]">Agent &amp; AI Setup</h3>
                <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
                  Structured Model Context Protocol (MCP) bridges and pipelines syncing databases with secure local AI intelligence.
                </p>
                <ul className="space-y-2 mt-4 text-[11px] sm:text-xs font-mono text-[#b9cacb]/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#ebb2ff]" />
                    Custom MCP server configurations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#ebb2ff]" />
                    Gemini Pro parameter calibration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#ebb2ff]" />
                    Vector-backed context indexing
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-[#3a494b]/10 flex justify-between items-center text-xs">
                <span className="font-mono text-gray-500">Pricing Model</span>
                <span className="font-mono text-[#ebb2ff] font-bold">Custom quote based on scope</span>
              </div>
            </div>

          </div>
        </section>

        {/* Portfolio Showcase Grid Section */}
        <section id="portfolio" className="space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#3a494b]/20 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#00e476] text-2xl sm:text-3xl select-none">cases</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e5e1e4]">Our Portfolio</h2>
            </div>
            
            {/* Filter segments selectors */}
            <div className="flex flex-wrap gap-1 bg-[#131315] p-1 rounded-lg border border-[#3a494b]/20 font-mono text-[10px]">
              {(['All', 'Web Dev', 'Mobile Apps', 'AI & Analytics'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded transition-all cursor-pointer ${
                    activeFilter === filter 
                      ? 'bg-[#00e476]/10 text-[#00e476] font-bold border border-[#00e476]/25 shadow-sm'
                      : 'text-[#b9cacb] hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => setSelectedProject(proj)}
                className="group glass-panel rounded-xl border border-[#3a494b]/15 hover:border-[#00e476]/50 bg-[#131315]/30 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_4px_30px_rgba(0,228,118,0.08)] flex flex-col justify-between"
              >
                <div>
                  {/* Decorative glowing project banner */}
                  <div className="h-40 bg-zinc-900 flex items-center justify-center relative select-none">
                    <img 
                      alt={proj.title} 
                      className="fluid-img w-full h-full object-cover mix-blend-luminosity opacity-20 filter saturate-150 transition-all duration-500 group-hover:scale-102 group-hover:opacity-40"
                      referrerPolicy="no-referrer"
                      src={proj.imageSrc}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131315]/90 via-transparent to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur border border-white/5 rounded px-2.5 py-0.5 text-[9px] font-mono text-[#00e476]">
                      {proj.segment}
                    </div>
                    
                    {/* Floating architectural wireframe icon */}
                    <div className="absolute bottom-4 left-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1c1b1d] border border-[#3a494b]/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#74f5ff] text-sm">{proj.blueprintSymbol}</span>
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#ebb2ff]">{proj.id}</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="font-sans font-bold text-lg text-white group-hover:text-[#00e476] transition-colors">{proj.title}</h3>
                    <p className="text-xs text-[#b9cacb] leading-relaxed">{proj.description}</p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-[#3a494b]/10 text-[10px] font-mono">
                  <div className="flex flex-wrap gap-1.5 max-w-[70%]">
                    {proj.techs.slice(0, 3).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-[#201f21] text-[#849495]">{t}</span>
                    ))}
                  </div>
                  <span className="text-[#00e476] flex items-center group-hover:translate-x-1 transition-transform">
                    Spec Sheet <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic Project Spec Sheet Overlay Drawer/Modal */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel border border-[#00e476]/30 max-w-2xl w-full rounded-2xl bg-[#131315]/95 shadow-[0_15px_50px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col justify-between">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#3a494b]/20 flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#00e476]/10 text-[#00e476] border border-[#00e476]/25 text-[10px] font-mono">
                      {selectedProject.segment}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500 uppercase">{selectedProject.id}</span>
                  </div>
                  <h3 className="text-xl font-bold font-sans text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#74f5ff]">{selectedProject.blueprintSymbol}</span>
                    {selectedProject.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Case Details Body */}
              <div className="p-6 space-y-6">
                
                {/* Visual case stats board */}
                <div className="p-4 rounded-xl border border-dashed border-[#00e476]/25 bg-[#0e0e10]/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#ebb2ff] tracking-widest block mb-1">Impact Telemetry Metric</span>
                    <span className="text-xl font-bold font-mono text-[#00e476] block tracking-wide">{selectedProject.stat}</span>
                    <span className="text-[10px] text-gray-500 font-mono block">{selectedProject.statLabel}</span>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#131315] rounded border border-white/5 text-[10px] font-mono max-w-xs text-right hidden sm:block">
                    <span className="text-gray-500 block truncate">AUTHORIZED GATEWAY ID</span>
                    <span className="text-[#ce5dff] font-bold block truncate">GW_SECURE_{selectedProject.id.toUpperCase()}</span>
                  </div>
                </div>

                {/* Problem & Refinement text */}
                <div className="space-y-2">
                  <h4 className="font-mono text-xs uppercase text-gray-500 tracking-wider">Solution Implementation Details</h4>
                  <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed select-text font-light">
                    {selectedProject.detailedCase}
                  </p>
                </div>

                {/* Technologies Grid */}
                <div className="space-y-2">
                  <h4 className="font-mono text-xs uppercase text-gray-500 tracking-wider">Project Tech Stack Specifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.techs.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded bg-[#201f21] border border-[#3a494b]/30 text-xs text-[#b9cacb] font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Corporate Partner Feedback */}
                <div className="p-4 rounded-xl border border-[#3a494b]/15 bg-[#1a191b]/50 relative italic font-light text-xs text-[#b9cacb] leading-relaxed">
                  <span className="absolute top-2 left-3 font-sans text-xl font-bold text-gray-700 select-none leading-none">“</span>
                  <p className="pl-4 pr-2">
                    SutharLabs transformed our execution framework. The responsive mechanics of this platform are flawless on every mobile tablet and desktop screen size we deployed to.
                  </p>
                  <div className="mt-2 pl-4 text-[10px] font-mono not-italic text-[#ebb2ff] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ce5dff]"></span>
                    <span>{selectedProject.client}, <span className="text-gray-500 font-normal">{selectedProject.clientTitle}</span></span>
                  </div>
                </div>

              </div>

              {/* Specs Footer Drawer Actions */}
              <div className="p-4 border-t border-[#3a494b]/20 bg-[#161618] flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                  Credentials Authenticated
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject(null);
                    onLaunch();
                  }}
                  className="px-5 py-2 rounded bg-white text-black font-semibold hover:bg-white/90 text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  Inspect Platform Infrastructure <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Interactive Workspace Store Catalog Section */}
        <section id="store" className="space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#3a494b]/20 pb-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ebb2ff] text-2xl sm:text-3xl select-none">storefront</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e5e1e4]">Agent &amp; MCP Store</h2>
              </div>
              {!user.isLoggedIn && (
                <div className="flex items-center gap-2 text-xs text-[#b9cacb]">
                  <span>Need to download or deploy?</span>
                  <button 
                    onClick={() => onNavigateAuth('signup')} 
                    className="text-[#74f5ff] hover:underline hover:text-[#00dbe7] transition-all cursor-pointer bg-transparent border-none p-0 inline-flex"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={onLaunch}
              className="text-[#00dbe7] hover:text-[#74f5ff] text-[12px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              Launch catalog <span className="material-symbols-outlined text-sm select-none">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plugins.map((plugin) => (
              <div 
                key={plugin.id} 
                className="glass-panel p-6 rounded-xl border border-[#3a494b]/15 flex flex-col h-full bg-[#131315]/60 hover:border-[#00dbe7]/40 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#00f2ff]/10 flex items-center justify-center border border-[#00dbe7]/30">
                      <span className="material-symbols-outlined text-[#00dbe7] select-none text-base">{plugin.iconSymbol || 'smart_toy'}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#e5e1e4]">{plugin.name}</h4>
                      <div className="flex items-center gap-1 text-[#00dbe7] text-[10px] font-mono leading-none mt-0.5">
                        <span className="material-symbols-outlined text-[10px] select-none text-[#00dbe7]">star</span>
                        <span>{plugin.rating} ({plugin.downloads} downloads)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-[#ce5dff]/20 border border-[#ce5dff]/30 text-[#ebb2ff]">{plugin.category}</span>
                    <span className={plugin.type === 'Free' ? 'text-[#00e476]' : plugin.type === 'Premium' ? 'text-[#ce5dff]' : 'text-[#74f5ff]'}>{plugin.type}</span>
                  </div>
                </div>
                <p className="text-xs text-[#b9cacb] leading-relaxed flex-grow mb-6">
                  {plugin.description}
                </p>
                <div className="flex flex-wrap gap-1 md:gap-1.5 mb-6">
                  {(plugin.tags || []).map(t => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-[#201f21] text-[#74f5ff] text-[9px] font-mono border border-white/5">#{t}</span>
                  ))}
                </div>
                <button 
                  onClick={onLaunch}
                  className="w-full py-2.5 rounded bg-[#201f21] border border-[#3a494b]/50 text-xs font-mono font-bold tracking-widest text-[#e5e1e4] hover:bg-[#00dbe7]/10 hover:border-[#00e476]/50 hover:text-[#00e476] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm select-none">download</span> Install Plugin
                </button>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#131315] border-t border-[#3a494b]/10 z-10 mt-auto">
        <div className="text-md font-bold text-[#74f5ff] tracking-tight hover:brightness-110">
          SutharLabs
        </div>
        <div className="text-xs text-[#b9cacb]/80 text-center sm:text-left">
          &copy; 2026 SutharLabs Corp. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-xs text-[#b9cacb] font-mono">
          <a className="hover:text-[#74f5ff] transition-colors" href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a className="hover:text-[#ce5dff] transition-colors" href="https://google.com" target="_blank" rel="noopener noreferrer">Google</a>
        </div>
      </footer>
    </div>
  );
}
