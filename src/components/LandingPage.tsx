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
  DollarSign,
  ExternalLink
} from 'lucide-react';
import HeroStudioConsole from './HeroStudioConsole';
import ProjectBrowserMockup, { getProjectLiveUrl } from './ProjectBrowserMockup';

interface LandingPageProps {
  user: UserProfile;
  onLaunch: () => void;
  onNavigateAuth: (tab: 'signin' | 'signup') => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

export interface PortfolioProject {
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
  liveUrl?: string;
  feedback?: string;
}

interface ProjectFeedbackData {
  quote: string;
  author: string;
  authorTitle: string;
}

const getProjectFeedbackDetails = (project: PortfolioProject): ProjectFeedbackData => {
  const id = (project.id || '').toLowerCase();
  const title = (project.title || '').toLowerCase();

  // 1. Driven Enterprise: Feedback from director regarding look & feel and ease of adding products/services
  if (id.includes('proj_1') || title.includes('driven')) {
    return {
      quote: project.feedback || "The new website captures the exact premium look and feel we envisioned for Driven Enterprise. Beyond the sleek modern aesthetics, what truly stands out is how effortless it is for our team to add new products, update industrial specs, and publish service offerings on the fly without any technical friction.",
      author: "Director",
      authorTitle: "Director, Driven Enterprise"
    };
  }

  // 2. Aradhana Dharmika Trust: Feedback from trustee Santhosh regarding reflecting soul of trust, deeply rooted theme, modularity & future proofing
  if (id.includes('proj_2') || title.includes('aradhana')) {
    return {
      quote: project.feedback || "The website truly reflects the sacred soul and values of our trust with its deeply rooted, dignified theme. The modularity and future-proofing allow us to seamlessly expand community seva programs, annadana notices, and educational trust updates.",
      author: "Santhosh",
      authorTitle: "Trustee, Aradhana Dharmika Trust"
    };
  }

  // 3. GoToxinFree With Tina: Feedback from blog author Dr. Supriti Pramanik (Ph.D.) regarding simplicity and ease of blogging with the framework and continuous support by the team
  if (id.includes('proj_3') || title.includes('toxin') || title.includes('tina')) {
    return {
      quote: project.feedback || "Blogging with this framework is an absolute delight. The workflow is pure simplicity—publishing new health articles, research notes, and stories takes minutes with zero formatting headaches. Most importantly, the continuous support and responsiveness from the SutharLabs team have been exceptional.",
      author: "Dr. Supriti Pramanik (Ph.D.)",
      authorTitle: "Blog Author & Creator, Go Toxin Free"
    };
  }

  return {
    quote: project.feedback || project.detailedCase || "Building sovereign agentic execution environments requires unmatched real-time responsiveness. This architecture proves full-stack resilience across high-frequency telemetry and reactive node networks.",
    author: project.client || "Suresh Suthar",
    authorTitle: project.clientTitle || "Founder & Principal Architect, SutharLabs"
  };
};

export default function LandingPage({ user, onLaunch, onNavigateAuth, theme = 'light', toggleTheme }: LandingPageProps) {
  const [currentView, _setCurrentView] = useState<'HOME' | 'STORE' | 'PORTFOLIO' | 'CONTACT'>(() => {
    if (typeof window === 'undefined') return 'HOME';
    const path = window.location.pathname;
    if (path === '/store') return 'STORE';
    if (path === '/portfolio') return 'PORTFOLIO';
    if (path === '/contact') return 'CONTACT';
    return 'HOME';
  });
  const setCurrentView = (view: 'HOME' | 'STORE' | 'PORTFOLIO' | 'CONTACT') => {
    _setCurrentView(view);
    const path = view === 'HOME' ? '/' : `/${view.toLowerCase()}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/store') _setCurrentView('STORE');
      else if (path === '/portfolio') _setCurrentView('PORTFOLIO');
      else if (path === '/contact') _setCurrentView('CONTACT');
      else _setCurrentView('HOME');
    };
    window.addEventListener('popstate', handlePopState);
    handlePopState();
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [activeFilter, setActiveFilter] = useState<'All' | 'Web Dev' | 'Mobile Apps' | 'AI & Analytics'>('All');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  // Prevent background scroll and add Escape key listener when modal is open
  useEffect(() => {
    if (!selectedProject) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProject]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [plugins, setPlugins] = useState<StorePlugin[]>([]);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Carousels active indexes
  const [activePluginIndex, setActivePluginIndex] = useState(0);
  const [activePortfolioIndex, setActivePortfolioIndex] = useState(0);

  // Store View search and filter
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeActiveCategory, setStoreActiveCategory] = useState<'All' | 'DevOps' | 'Productivity' | 'AI' | 'Finance' | 'Plugin'>('All');

  const getVisiblePlugins = () => {
    if (plugins.length === 0) return [];
    const items: StorePlugin[] = [];
    const count = Math.min(4, plugins.length);
    for (let i = 0; i < count; i++) {
      const targetIdx = (activePluginIndex + i) % plugins.length;
      if (!items.some(item => item.id === plugins[targetIdx].id)) {
        items.push(plugins[targetIdx]);
      }
    }
    return items;
  };

  // Load plugins and portfolio from Vercel serverless API (backed by Neon database)
  useEffect(() => {
    fetch('/api/plugins')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setPlugins(data))
      .catch(err => console.error('Failed to load plugins:', err));

    fetch('/api/portfolios')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setPortfolioProjects(data))
      .catch(err => console.error('Failed to load portfolios:', err));
  }, []);


  // Portfolio items presenting credibility for custom web & mobile apps
  

  const filteredProjects = activeFilter === 'All' 
    ? portfolioProjects 
    : portfolioProjects.filter(p => p.segment === activeFilter);

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-[#050505] text-on-surface">
      
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00f2ff]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#ce5dff]/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Responsive Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-3 bg-surface-container-low/80 backdrop-blur-xl rounded-full mt-4 mx-auto w-[92%] sm:w-[95%] max-w-7xl border border-outline/10 shadow-[0_0_15px_rgba(0,219,231,0.08)] transition-all duration-300 ease-out">
        <div 
          onClick={() => {
            setCurrentView('HOME');
            window.scrollTo({ top: 0, behavior: "smooth" });
          }} 
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
        <div className="hidden lg:flex items-center gap-4 sm:gap-6 xl:gap-4 sm:gap-8 font-mono text-xs">
          <button 
            onClick={() => {
              setCurrentView('HOME');
              setTimeout(() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className={`px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer ${
              currentView === 'HOME' ? 'text-primary bg-primary/10 font-bold border-none' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 bg-transparent'
            }`}
          >
            Features
          </button>
          <button 
            onClick={() => {
              setCurrentView('HOME');
              setTimeout(() => {
                const el = document.getElementById('services');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            className="text-on-surface-variant hover:text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer bg-transparent border-none"
          >
            Services offered
          </button>
          <button 
            onClick={() => {
              setCurrentView('PORTFOLIO');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer ${
              currentView === 'PORTFOLIO' ? 'text-tertiary bg-tertiary/10 font-bold border-none' : 'text-on-surface-variant hover:text-tertiary hover:bg-tertiary/5 bg-transparent border-none'
            }`}
          >
            Our Portfolio
          </button>
          <button 
            onClick={() => {
              setCurrentView('STORE');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer ${
              currentView === 'STORE' ? 'text-secondary bg-secondary/10 font-bold border-none' : 'text-on-surface-variant hover:text-secondary hover:bg-secondary/5 bg-transparent border-none'
            }`}
          >
            App Store
          </button>
          <button 
            onClick={() => {
              setCurrentView('CONTACT');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-2.5 py-1.5 rounded transition-all duration-200 cursor-pointer ${
              currentView === 'CONTACT' ? 'text-primary bg-primary/10 font-bold border-none' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 bg-transparent border-none'
            }`}
          >
            Contact Us
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 bg-white/5 border border-white/10 rounded-full text-on-surface hover:text-[#00dbe7] hover:border-[#00dbe7]/50 transition-all flex items-center justify-center cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            {theme === 'light' ? (
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
          <div className="fixed right-0 top-0 bottom-0 z-50 h-full w-[85%] max-w-[340px] bg-[#0c0c0e] border-l border-outline/20 shadow-[0_0_50px_rgba(0,0,0,0.85)] lg:hidden p-4 sm:p-6 flex flex-col justify-between font-mono animate-[slideInRight_0.3s_ease-out] select-none">
            <div>
              {/* Header inside drawer */}
              <div className="flex items-center justify-between pb-6 border-b border-outline/15 mb-8">
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
                <button 
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2 border-none cursor-pointer font-mono ${
                    currentView === 'HOME' ? 'text-primary bg-primary/10 font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 bg-transparent'
                  }`} 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('HOME');
                    setTimeout(() => {
                      const el = document.getElementById('features');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                >
                  <span className="text-[#ce5dff] text-xs">◆</span> Features
                </button>
                <button 
                  className="w-full text-left text-on-surface-variant hover:text-primary hover:bg-primary/5 px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2 bg-transparent border-none cursor-pointer font-mono" 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('HOME');
                    setTimeout(() => {
                      const el = document.getElementById('services');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                >
                  <span className="text-[#00e476] text-xs">◆</span> Services Offered
                </button>
                <button 
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2 border-none cursor-pointer font-mono ${
                    currentView === 'PORTFOLIO' ? 'text-tertiary bg-tertiary/10 font-bold' : 'text-on-surface-variant hover:text-tertiary hover:bg-tertiary/5 bg-transparent'
                  }`} 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('PORTFOLIO');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span className="text-[#00dbe7] text-xs">◆</span> Our Portfolio
                </button>
                <button 
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2 border-none cursor-pointer font-mono ${
                    currentView === 'STORE' ? 'text-secondary bg-secondary/10 font-bold' : 'text-on-surface-variant hover:text-secondary hover:bg-secondary/5 bg-transparent'
                  }`} 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('STORE');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span className="text-[#ebb2ff] text-xs">◆</span> App Store
                </button>
                <button 
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2 border-none cursor-pointer font-mono ${
                    currentView === 'CONTACT' ? 'text-primary bg-primary/10 font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 bg-transparent'
                  }`} 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('CONTACT');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span className="text-[#00dbe7] text-xs">◆</span> Contact Us
                </button>
              </div>
            </div>

            {/* Launcher button at bottom */}
            <div className="pt-6 border-t border-outline/15 space-y-3">
              {/* Theme Toggle in Mobile Drawer */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  toggleTheme?.();
                }}
                className="w-full py-2.5 bg-white/5 border border-white/10 rounded-lg text-on-surface hover:text-[#00dbe7] hover:border-[#00dbe7]/50 transition-all font-mono text-[11px] font-bold uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                {theme === 'light' ? (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    DARK THEME
                  </>
                ) : (
                  <>
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
                    LIGHT THEME
                  </>
                )}
              </button>

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
        
      {/* VIEW 1: HOME PANEL */}
      {currentView === 'HOME' && (
        <div className="flex flex-col gap-20 sm:gap-24 animate-[fadeIn_0.3s_ease-out]">

          {/* Hero Section */}
          <section id="features" className="flex flex-col items-center justify-center text-center py-6 sm:py-10 sm:py-16 relative">
            <div className="max-w-4xl space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00dbe7]/10 border border-[#00dbe7]/30 text-[#74f5ff] font-mono text-[10px] uppercase tracking-widest leading-none mb-2 select-none">
                R&amp;D Lab &amp; Engineering Studio
              </div>
              <h1 className="text-3xl sm:text-3xl sm:text-4xl md:text-3xl md:text-5xl lg:text-4xl md:text-6xl font-bold tracking-tight leading-tight text-on-surface neon-text-primary px-2">
                Synthesizing Next-Gen Tooling &amp; High-Performance Engineering.
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-[#b9cacb] max-w-3xl mx-auto font-sans font-light leading-relaxed">
                We are a hybrid software R&amp;D lab and engineering studio. We build freemium developer tools, MCP servers, and agentic workflows for the community, while partnering with organizations to engineer reliable web applications, mobile systems, and data pipelines.</p>
              <div className="pt-6 sm:pt-8 flex flex-wrap gap-4 items-center justify-center font-mono">
                <button 
                  onClick={onLaunch}
                  className="w-full sm:w-auto glass-panel px-6 py-3.5 rounded-xl text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-[#74f5ff] border border-[#00dbe7]/30 shadow-[0_0_20px_rgba(0,219,231,0.15)] hover:bg-[#00dbe7]/10 hover:shadow-[0_0_30px_rgba(0,219,231,0.35)] hover:border-[#00dbe7]/70 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined select-none animate-pulse">rocket_launch</span>
                  {user.isLoggedIn ? 'Launch App Workspace' : 'Sign In to Workspace'}
                </button>
                
                <button 
                  onClick={() => {
                    setCurrentView('STORE');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#ce5dff]/30 bg-[#ce5dff]/5 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-[#ebb2ff] hover:bg-[#ce5dff]/15 hover:border-[#ce5dff]/60 transition-all duration-300 cursor-pointer"
                >
                  Browse App Store
                </button>
              </div>
            </div>

            {/* Rendered Interactive Studio Console & Capability Carousel */}
            <HeroStudioConsole theme={theme} onLaunch={onLaunch} />
          </section>
          
          {/* Services Offered Section */}
          <section id="services" className="space-y-8 scroll-mt-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-outline/20 pb-4 gap-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ce5dff] text-2xl sm:text-3xl select-none">home_repair_service</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Services Offered</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#b9cacb]/80 font-mono">Precision coding &amp; architecture packages.</p>
            </div>

            <div className="flex overflow-x-auto gap-4 py-2 pb-6 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:gap-6 md:py-0 md:pb-0 md:overflow-visible">
              
              {/* Service Package 1: Custom Web Development */}
              <div className="glass-panel p-6 rounded-xl border border-outline/10 bg-surface dark:bg-surface/40 hover:border-primary/50 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] flex flex-col justify-between group w-[280px] sm:w-[320px] aspect-square shrink-0 snap-start md:w-auto md:aspect-auto">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-all">
                    <Code className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-on-surface">Custom Web Dev</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    Tailored React, Vite, and Next.js frontends engineered with strict compliance, layout consistency, and sub-millisecond edge load speeds.
                  </p>
                  <ul className="space-y-2 mt-4 text-[11px] sm:text-xs font-mono text-on-surface-variant/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      Fluid responsive CSS designs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      Optimized lighthouse profiles
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      State sync &amp; Secure edge API integration
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-outline/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 text-xs text-on-surface-variant">
                  <span className="font-mono text-on-surface-variant/60">Pricing Model</span>
                  <span className="font-mono text-primary font-bold">Custom quote based on scope</span>
                </div>
              </div>

              {/* Service Package 2: Mobile App Development */}
              <div className="glass-panel p-6 rounded-xl border border-outline/10 bg-surface dark:bg-surface/40 hover:border-secondary/50 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] flex flex-col justify-between group w-[280px] sm:w-[320px] aspect-square shrink-0 snap-start md:w-auto md:aspect-auto">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center border border-secondary/20 group-hover:border-secondary/50 transition-all">
                    <Smartphone className="text-secondary w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-on-surface">Mobile App Dev</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    High-fidelity React Native applications designed with fluent navigation, responsive gestures, and reliable local SQLite storage vaults.
                  </p>
                  <ul className="space-y-2 mt-4 text-[11px] sm:text-xs font-mono text-on-surface-variant/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-secondary" />
                      iOS and Android unified targets
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-secondary" />
                      Local encryption and biometrics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-secondary" />
                      Dynamic background socket services
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-outline/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 text-xs text-on-surface-variant">
                  <span className="font-mono text-on-surface-variant/60">Pricing Model</span>
                  <span className="font-mono text-secondary font-bold">Custom quote based on scope</span>
                </div>
              </div>

              {/* Service Package 3: Intelligent Agent Systems */}
              <div className="glass-panel p-6 rounded-xl border border-outline/10 bg-surface dark:bg-surface/40 hover:border-tertiary/50 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] flex flex-col justify-between group w-[280px] sm:w-[320px] aspect-square shrink-0 snap-start md:w-auto md:aspect-auto">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-tertiary/10 dark:bg-tertiary/20 flex items-center justify-center border border-tertiary/20 group-hover:border-tertiary/50 transition-all">
                    <Brain className="text-tertiary w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-on-surface">Agent &amp; AI Setup</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    Structured Model Context Protocol (MCP) bridges and pipelines syncing databases with secure local AI intelligence.
                  </p>
                  <ul className="space-y-2 mt-4 text-[11px] sm:text-xs font-mono text-on-surface-variant/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-tertiary" />
                      Custom MCP server configurations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-tertiary" />
                      Gemini Pro parameter calibration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-tertiary" />
                      Vector-backed context indexing
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-outline/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 text-xs text-on-surface-variant">
                  <span className="font-mono text-on-surface-variant/60">Pricing Model</span>
                  <span className="font-mono text-tertiary font-bold">Custom quote based on scope</span>
                </div>
              </div>

            </div>
          </section>

          {/* Featured Plugins Slider Section */}
          <section className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline/20 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00dbe7] text-2xl sm:text-3xl select-none">dynamic_feed</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Popular Tools &amp; Plugins</h2>
              </div>
              
              <button 
                onClick={() => {
                  setCurrentView('STORE');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[#00dbe7] hover:text-[#74f5ff] text-[12px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                Browse Full Store <span className="material-symbols-outlined text-sm select-none">arrow_forward</span>
              </button>
            </div>

            <div className="relative glass-panel p-4 sm:p-6 sm:p-8 rounded-xl border border-outline/10 bg-surface-container-low/40 overflow-hidden">
              
              {/* Render Active Slide */}
              {plugins.length > 0 ? (
                <div className="flex overflow-x-auto gap-5 py-2 pb-6 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-4 lg:gap-5 lg:pb-0 lg:overflow-visible">
                  {getVisiblePlugins().map((plugin) => (
                    <div 
                      key={plugin.id} 
                      className="glass-panel p-5 rounded-xl border border-outline/10 flex flex-col justify-between group bg-surface dark:bg-surface/50 hover:border-primary/50 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] w-[250px] sm:w-[280px] aspect-square shrink-0 snap-start lg:w-auto lg:aspect-auto"
                    >
                      <div className="space-y-3 flex-grow">
                         <div className="flex justify-between items-start">
                           <div className="w-9 h-9 rounded bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-all select-none">
                             <span className="material-symbols-outlined text-primary select-none text-base">{plugin.iconSymbol || 'smart_toy'}</span>
                           </div>
                           <div className="flex flex-col items-end gap-0.5 font-mono text-[8px]">
                             <span className="px-1.5 py-0.5 rounded bg-primary/10 dark:bg-primary/20 border border-primary/20 text-primary">{plugin.category}</span>
                             <span className={plugin.type === 'Free' ? 'text-tertiary font-bold' : plugin.type === 'Premium' ? 'text-primary font-bold' : 'text-secondary font-bold'}>{plugin.type}</span>
                           </div>
                         </div>
                         
                         <div>
                           <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{plugin.name}</h4>
                           <div className="flex items-center gap-1 text-primary text-[9px] font-mono leading-none mt-1">
                             <span className="material-symbols-outlined text-[10px] select-none text-primary">star</span>
                             <span>{plugin.rating} ({plugin.downloads})</span>
                           </div>
                         </div>
                         
                         <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                           {plugin.description}
                         </p>
                       </div>
 
                       <div className="pt-4 border-t border-outline/10 mt-4 flex items-center justify-between">
                         <div className="flex flex-wrap gap-1 max-w-[70%]">
                           {(plugin.tags || []).slice(0, 2).map(t => (
                             <span key={t} className="px-1.5 py-0.5 rounded bg-surface-container-low text-primary text-[8px] font-mono border border-outline/10 truncate">#{t}</span>
                           ))}
                         </div>
                         <button 
                           onClick={onLaunch}
                           className="p-2 rounded bg-primary/10 hover:bg-primary/25 border border-primary/25 text-primary hover:text-white transition-all cursor-pointer border-none flex items-center justify-center"
                           title="Install Plugin"
                         >
                           <span className="material-symbols-outlined text-sm select-none">download</span>
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
              ) : (
                <div className="text-center py-6 sm:py-10 font-mono text-xs italic text-on-surface-variant">Loading products registry...</div>
              )}

              {/* Slider Dots & Arrow Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mt-8 pt-4 border-t border-outline/10 select-none">
                <div className="flex gap-1">
                  {plugins.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePluginIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer border-none ${
                        activePluginIndex === idx ? 'bg-[#00dbe7] w-6' : 'bg-[#3a494b]/40 hover:bg-gray-600'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActivePluginIndex((prev) => (prev === 0 ? plugins.length - 1 : prev - 1))}
                    className="w-8 h-8 rounded-full border border-outline/30 bg-transparent hover:border-[#00dbe7]/50 hover:bg-[#00dbe7]/10 text-white flex items-center justify-center transition-all cursor-pointer animate-[press_0.2s_ease]"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                  </button>
                  <button
                    onClick={() => setActivePluginIndex((prev) => (prev === plugins.length - 1 ? 0 : prev + 1))}
                    className="w-8 h-8 rounded-full border border-outline/30 bg-transparent hover:border-[#00dbe7]/50 hover:bg-[#00dbe7]/10 text-white flex items-center justify-center transition-all cursor-pointer animate-[press_0.2s_ease]"
                  >
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Portfolio Slider Section */}
          <section id="portfolio" className="space-y-8 scroll-mt-24 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline/20 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00e476] text-2xl sm:text-3xl select-none">cases</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Featured Development Cases</h2>
              </div>
              
              <button 
                onClick={() => {
                  setCurrentView('PORTFOLIO');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[#00e476] hover:text-[#a8ffcc] text-[12px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                Explore Complete Portfolio <span className="material-symbols-outlined text-sm select-none">arrow_forward</span>
              </button>
            </div>

            <div className="relative glass-panel rounded-xl border border-outline/10 bg-surface dark:bg-surface-container-low/30 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              
              {portfolioProjects.length > 0 ? (
                (() => {
                  const proj = portfolioProjects[activePortfolioIndex % portfolioProjects.length];
                  if (!proj) return null;
                  const liveUrl = getProjectLiveUrl(proj);
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center">
                      {/* Project Visual block in Browser Frame */}
                      <div className="lg:col-span-6 p-4 sm:p-6">
                        <ProjectBrowserMockup
                          project={proj}
                          aspectRatio="card"
                          className="w-full shadow-2xl"
                          onOpenModal={() => setSelectedProject(proj)}
                        />
                      </div>

                      {/* Project Metadata block */}
                      <div className="lg:col-span-6 p-4 sm:p-6 sm:p-8 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[10px] font-mono text-secondary uppercase tracking-wider">{proj.segment}</span>
                              <h3 className="text-2xl font-bold text-on-surface mt-0.5">{proj.title}</h3>
                            </div>
                            <span className="font-mono text-[9px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-outline/10">{proj.id}</span>
                          </div>

                          <p className="text-sm text-on-surface-variant leading-relaxed">
                            {proj.description}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {proj.techs.slice(0, 4).map(t => (
                              <span key={t} className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[10px] font-mono border border-secondary/20">{t}</span>
                            ))}
                          </div>
                        </div>

                        {/* Project actions and indicators */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 border-t border-outline/10 gap-4">
                          <div>
                            <span className="text-[9px] font-mono text-on-surface-variant/60 block uppercase">Telemetry Target</span>
                            <span className="text-xs font-mono text-tertiary font-bold block">{proj.stat}</span>
                          </div>

                          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            {liveUrl && (
                              <a
                                href={liveUrl}
                                target={liveUrl.startsWith('/') ? '_self' : '_blank'}
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-4 py-2 rounded bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-[#00e476] hover:bg-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <span>Visit Live Site</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => setSelectedProject(proj)}
                              className="w-full sm:w-auto px-4 py-2 rounded bg-tertiary/10 border border-tertiary/30 text-xs font-mono font-bold uppercase tracking-wider text-tertiary hover:bg-tertiary/20 transition-all cursor-pointer"
                            >
                              Inspect Spec Sheet
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()
              ) : null}

              {/* Slider Dots & Arrow Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 px-6 sm:px-8 py-4 border-t border-outline/10 select-none bg-surface-container-low/60 dark:bg-[#0c0c0e]/30">
                <div className="flex gap-1">
                  {portfolioProjects.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePortfolioIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer border-none ${
                        activePortfolioIndex === idx ? 'bg-tertiary w-6' : 'bg-outline/30 hover:bg-outline/60'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActivePortfolioIndex((prev) => (prev === 0 ? portfolioProjects.length - 1 : prev - 1))}
                    className="w-8 h-8 rounded-full border border-outline/30 bg-transparent hover:border-tertiary/50 hover:bg-tertiary/10 text-on-surface flex items-center justify-center transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                  </button>
                  <button
                    onClick={() => setActivePortfolioIndex((prev) => (prev === portfolioProjects.length - 1 ? 0 : prev + 1))}
                    className="w-8 h-8 rounded-full border border-outline/30 bg-transparent hover:border-tertiary/50 hover:bg-tertiary/10 text-on-surface flex items-center justify-center transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* VIEW 2: DEDICATED STORE PANEL */}
      {currentView === 'STORE' && (
        <div className="space-y-10 py-4 animate-[fadeIn_0.3s_ease-out]">
          
          {/* Header Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant select-none">
            <button onClick={() => setCurrentView('HOME')} className="hover:text-primary transition-all bg-transparent border-none cursor-pointer">HOME</button>
            <span>/</span>
            <span className="text-primary">APP STORE</span>
          </div>

          {/* Header copy */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl sm:text-4xl">storefront</span>
              SutharLabs App Store
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-3xl font-sans font-light leading-relaxed">
              Explore our catalog of developer tools, intelligent workspaces, agentic plugins, and advanced engineering integrations. Built on a freemium model, these apps give developers and AI agents the ultimate toolbox to automate workflows out of the box.
            </p>
          </div>

          {/* Filter Panel & Search bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-surface-container p-4 rounded-xl border border-outline/15 shadow-sm">
            {/* Search input */}
            <div className="flex-grow max-w-md relative flex items-center bg-surface border border-outline/20 rounded-lg px-3 py-2 text-xs">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-sm select-none">search</span>
              <input 
                type="text" 
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                placeholder="Search plugins by name, tags, or description..."
                className="bg-transparent border-none focus:outline-none w-full text-xs text-on-surface font-mono placeholder:text-on-surface-variant/40"
              />
              {storeSearchQuery && (
                <button onClick={() => setStoreSearchQuery('')} className="p-0.5 hover:bg-on-surface/5 rounded-full text-on-surface-variant hover:text-on-surface transition-all bg-transparent border-none cursor-pointer flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-1 bg-surface p-1 rounded-lg border border-outline/10 font-mono text-[10px] items-center">
              {(['All', 'DevOps', 'Productivity', 'AI', 'Finance', 'Plugin'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setStoreActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer border font-mono ${
                    storeActiveCategory === cat 
                      ? 'bg-primary/10 text-primary font-bold border-primary/25 shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface bg-transparent border-transparent hover:bg-on-surface/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Full-Page Catalog Grid */}
          {(() => {
            const searchedPlugins = plugins.filter(plugin => {
              const query = storeSearchQuery.toLowerCase();
              const nameMatch = plugin.name.toLowerCase().includes(query);
              const descMatch = plugin.description.toLowerCase().includes(query);
              const tagsMatch = (plugin.tags || []).some(t => t.toLowerCase().includes(query));
              const categoryMatch = plugin.category.toLowerCase().includes(query);

              const matchesSearch = storeSearchQuery === '' || nameMatch || descMatch || tagsMatch || categoryMatch;
              const matchesCategory = storeActiveCategory === 'All' || plugin.category === storeActiveCategory;
              
              return matchesSearch && matchesCategory;
            });

            if (searchedPlugins.length === 0) {
              return (
                <div className="text-center py-20 rounded-xl border border-outline/15 bg-surface-container font-mono">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl text-on-surface-variant/40 mb-2 select-none">search_off</span>
                  <p className="text-xs text-on-surface-variant/60 italic">No plugins found matching search criteria or category filter.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchedPlugins.map((plugin) => (
                  <div 
                    key={plugin.id} 
                    className="group bg-surface border border-outline/15 rounded-2xl p-4 flex flex-col aspect-square hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-default"
                  >
                    {/* Tile Header: icon + badges */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 select-none group-hover:bg-primary/15 transition-colors">
                        <span className="material-symbols-outlined text-primary select-none text-lg">{plugin.iconSymbol || 'smart_toy'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1 font-mono text-[9px]">
                        <span className="px-1.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/25 text-secondary">{plugin.category}</span>
                        <span className={plugin.type === 'Free' ? 'text-tertiary font-bold' : plugin.type === 'Premium' ? 'text-secondary font-bold' : 'text-primary font-bold'}>{plugin.type}</span>
                      </div>
                    </div>

                    {/* Plugin name + rating */}
                    <div className="mb-2">
                      <h4 className="text-sm font-bold text-on-surface leading-tight">{plugin.name}</h4>
                      <div className="flex items-center gap-1 text-primary text-[9px] font-mono mt-0.5">
                        <span className="material-symbols-outlined text-[10px] select-none">star</span>
                        <span>{plugin.rating} · {plugin.downloads} installs</span>
                      </div>
                    </div>

                    {/* Description — clamps to fill remaining space */}
                    <p className="text-[10px] text-on-surface-variant leading-relaxed flex-grow line-clamp-3 mb-3">
                      {plugin.description}
                    </p>

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(plugin.tags || []).slice(0, 2).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded-full bg-primary/8 text-primary text-[8px] font-mono border border-primary/15">#{t}</span>
                      ))}
                    </div>

                    {/* Install button pinned to bottom */}
                    <button 
                      onClick={onLaunch}
                      className="w-full py-2 rounded-lg bg-primary/10 border border-primary/25 text-[10px] font-mono font-bold tracking-wider text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer mt-auto"
                    >
                      <span className="material-symbols-outlined text-xs select-none">download</span> Install
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Back to Home CTA button */}
          <div className="flex justify-center pt-8">
            <button 
              onClick={() => {
                setCurrentView('HOME');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-lg border border-outline/30 bg-transparent text-on-surface-variant font-mono text-xs uppercase tracking-wider hover:text-on-surface hover:border-outline transition-all cursor-pointer"
            >
              Back to Home Page
            </button>
          </div>

        </div>
      )}

      {/* VIEW 3: DEDICATED PORTFOLIO PANEL */}
      {currentView === 'PORTFOLIO' && (
        <div className="space-y-10 py-4 animate-[fadeIn_0.3s_ease-out]">
          
          {/* Header Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant select-none">
            <button onClick={() => setCurrentView('HOME')} className="hover:text-white transition-all bg-transparent border-none cursor-pointer">HOME</button>
            <span>/</span>
            <span className="text-[#00e476]">DEVELOPMENT AGENCY CASES</span>
          </div>

          {/* Header copy */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-3xl sm:text-4xl font-bold tracking-tight text-white neon-text-glow flex items-center gap-3">
              <span className="material-symbols-outlined text-[#00e476] text-3xl sm:text-3xl sm:text-4xl">cases</span>
              Custom Development Services Portfolio
            </h2>
            <p className="text-sm sm:text-base text-[#b9cacb] max-w-3xl font-sans font-light leading-relaxed">
              Review our operating case studies and custom structural projects. As an elite development agency, we craft responsive architectures, high-performance visual dashboards, secure cross-platform frameworks, and intelligent local database syncs with complete type-safety.
            </p>
          </div>

          {/* Segment filter panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-surface-container-low/80 p-4 rounded-xl border border-outline/15 select-none">
            <span className="text-xs font-mono text-on-surface-variant uppercase hidden sm:inline">Active Case Filters</span>
            <div className="flex flex-wrap gap-1 bg-[#0c0c0e] p-1 rounded-lg border border-outline/10 font-mono text-[10px]">
              {(['All', 'Web Dev', 'Mobile Apps', 'AI & Analytics'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer border-none font-mono ${
                    activeFilter === filter 
                      ? 'bg-[#00e476]/10 text-[#00e476] font-bold border border-[#00e476]/25 shadow-sm'
                      : 'text-[#b9cacb] hover:text-white bg-transparent hover:bg-white/[0.02]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Full-Page Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((proj) => {
              const liveUrl = getProjectLiveUrl(proj);
              return (
                <div 
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className="group glass-panel rounded-2xl border border-outline/15 hover:border-[#00e476]/50 bg-surface-container-low/30 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,228,118,0.1)] flex flex-col justify-between p-4 sm:p-5 gap-4"
                >
                  <div className="space-y-4">
                    {/* Realistic Browser Showcase Frame */}
                    <ProjectBrowserMockup
                      project={proj}
                      aspectRatio="card"
                      className="w-full shadow-md"
                      showLiveButton={false}
                    />

                    <div className="space-y-2 px-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-sans font-bold text-xl text-white group-hover:text-[#00e476] transition-colors">{proj.title}</h3>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-[#ebb2ff] bg-surface-container px-2 py-0.5 rounded border border-outline/10">
                          {proj.id}
                        </span>
                      </div>
                      <p className="text-xs text-[#b9cacb] leading-relaxed line-clamp-2">{proj.description}</p>
                    </div>
                  </div>

                  <div className="px-1 pt-3 flex flex-wrap items-center justify-between border-t border-outline/10 text-[10px] font-mono gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {proj.techs.slice(0, 3).map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      {liveUrl && (
                        <a
                          href={liveUrl}
                          target={liveUrl.startsWith('/') ? '_self' : '_blank'}
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                        >
                          Visit Live <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <span className="text-[#00e476] flex items-center group-hover:translate-x-1 transition-transform font-bold">
                        Specs <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Corporate Agency Consultation Inquiry block */}
          <div className="glass-panel p-4 sm:p-6 sm:p-4 sm:p-8 rounded-xl border border-[#00e476]/20 bg-[#00e476]/5 mt-10 space-y-4 max-w-3xl mx-auto text-center animate-[fadeIn_0.3s_ease-out]">
            <span className="material-symbols-outlined text-3xl sm:text-4xl text-[#00e476] select-none">chat_bubble_outline</span>
            <h3 className="text-xl font-bold text-white font-sans">Ready to Build Your Project?</h3>
            <p className="text-xs sm:text-sm text-[#b9cacb] leading-relaxed font-light">
              We deliver high-end bespoke products ranging from enterprise-grade corporate portals to custom AI workflows. Sponsor our lab’s open-source tools by partnering with our expert engineering team.
            </p>
            <div className="pt-2">
              <a 
                href="mailto:developer@sutharlabs.com"
                className="inline-flex py-3 px-6 rounded-lg bg-[#00e476] text-[#002022] font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-[0_0_15px_rgba(0,228,118,0.25)] transition-all"
              >
                Contact SutharLabs Agency
              </a>
            </div>
          </div>

          {/* Back to Home CTA button */}
          <div className="flex justify-center pt-8">
            <button 
              onClick={() => {
                setCurrentView('HOME');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-lg border border-outline/30 bg-transparent text-[#b9cacb] font-mono text-xs uppercase tracking-wider hover:text-white hover:border-white transition-all cursor-pointer"
            >
              Back to Home Page
            </button>
          </div>

        </div>
      )}

      {/* VIEW 4: DEDICATED CONTACT PANEL */}
      {currentView === 'CONTACT' && (
        <div className="space-y-10 py-4 animate-[fadeIn_0.3s_ease-out] max-w-4xl mx-auto w-full">
          
          {/* Header Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant select-none">
            <button onClick={() => setCurrentView('HOME')} className="hover:text-white transition-all bg-transparent border-none cursor-pointer">HOME</button>
            <span>/</span>
            <span className="text-[#00dbe7]">CONTACT US</span>
          </div>

          {/* Header copy */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-3xl sm:text-4xl font-bold tracking-tight text-white neon-text-glow flex items-center gap-3">
              <span className="material-symbols-outlined text-[#00dbe7] text-3xl sm:text-3xl sm:text-4xl">mail</span>
              Contact SutharLabs
            </h2>
            <p className="text-sm sm:text-base text-[#b9cacb] font-sans font-light leading-relaxed">
              Have a project in mind, or want to collaborate with our software research lab? Get in touch below. By partnering with our agency, you directly sponsor our freemium developer tools, MCP servers, and open-source workflows.
            </p>
          </div>

          {/* Dual-Track Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-stretch">
            
            {/* Track 1: Enterprise Consultation Form (Cols 7) */}
            <div className="md:col-span-7 glass-panel p-4 sm:p-6 sm:p-4 sm:p-8 rounded-xl border border-outline/15 bg-surface-container-low/50 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-[#00e476]/20 border border-[#00e476]/30 text-[#00e476] text-[9px] font-mono uppercase tracking-wider">Enterprise &amp; Agency Funnel</span>
                <h3 className="text-lg font-bold text-white">Start a Project Consultation</h3>
                <p className="text-xs text-[#b9cacb] font-sans">Submit your project parameters and our elite engineering studio will get back to you within 24 hours.</p>
              </div>

              {/* Form State */}
              {contactSubmitted ? (
                <div className="p-4 sm:p-6 rounded-xl border border-[#00e476]/30 bg-[#00e476]/5 text-center space-y-4 py-12 animate-[fadeIn_0.3s_ease-out]">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl text-[#00e476] select-none">verified_user</span>
                  <h4 className="text-base font-bold text-white">Consultation Request Dispatched!</h4>
                  <p className="text-xs text-[#b9cacb] leading-relaxed max-w-sm mx-auto">
                    Thank you! Your project specification parameters have been successfully registered under tracking ID <span className="font-mono text-[#00e476]">SR_{Math.floor(Math.random() * 90000) + 10000}</span>.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="mt-2 text-xs font-mono text-[#00dbe7] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                  className="space-y-4 font-mono text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-on-surface-variant block">YOUR NAME</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Elon Musk" 
                        className="w-full bg-surface-container-high border border-outline/40 rounded p-2.5 text-on-surface focus: focus:border-outline/40 font-mono text-xs outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-on-surface-variant block">EMAIL ADDRESS</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="elon@spacex.com" 
                        className="w-full bg-surface-container-high border border-outline/40 rounded p-2.5 text-on-surface focus: focus:border-outline/40 font-mono text-xs outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                      <label className="text-on-surface-variant block">PROJECT TYPE</label>
                      <select className="w-full bg-[#0c0c0e] border border-outline/20 rounded p-2.5 text-white focus:outline-none focus:border-[#00dbe7] font-mono text-xs cursor-pointer">
                        <option>Web Application Dev</option>
                        <option>Mobile App Dev (React Native)</option>
                        <option>Agentic AI Workflows</option>
                        <option>MCP Server Integration</option>
                        <option>Other Complex Systems</option>
                      </select>
                    </div>

                  <div className="space-y-1">
                    <label className="text-on-surface-variant block">PROJECT SPECIFICATION OVERVIEW</label>
                    <textarea 
                      rows={4} 
                      required
                      placeholder="Briefly describe the systems architectural target and features needed..." 
                      className="w-full bg-surface-container-high border border-outline/40 rounded p-2.5 text-on-surface focus: focus:border-outline/40 font-mono text-xs resize-none outline-none transition-all"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#00dbe7] text-[#002022] font-mono text-xs font-bold uppercase rounded hover:brightness-110 tracking-wider shadow-[0_0_15px_rgba(0,219,231,0.25)] transition-all cursor-pointer border-none flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm select-none">send</span>
                    Submit Parameters Inquiry
                  </button>
                </form>
              )}
            </div>

            {/* Track 2: Lab & Open Source Support (Cols 5) */}
            <div className="md:col-span-5 flex flex-col gap-4 sm:gap-6">
              
              {/* Card 1: Open Source & Developer Channels */}
              <div className="glass-panel p-4 sm:p-6 rounded-xl border border-outline/15 bg-surface-container-low/40 space-y-4">
                <div className="space-y-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#ce5dff]/20 border border-[#ce5dff]/30 text-[#ebb2ff] text-[9px] font-mono uppercase tracking-wider">Lab Support</span>
                  <h3 className="text-base font-bold text-white">Developer Collaborations</h3>
                  <p className="text-xs text-[#b9cacb] leading-relaxed">Looking to collaborate on our open-source MCP servers, request plugins, or report issues? Access our community channels.</p>
                </div>
                <div className="space-y-2.5 pt-2 font-mono text-xs">
                  <a href="mailto:developer@sutharlabs.com" className="flex items-center gap-3 text-[#ebb2ff] hover:underline transition-all">
                    <span className="material-symbols-outlined text-sm select-none">mail</span>
                    developer@sutharlabs.com
                  </a>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[#74f5ff] hover:underline transition-all">
                    <span className="material-symbols-outlined text-sm select-none">code</span>
                    GitHub Community Portal
                  </a>
                  <a href="https://google.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[#00e476] hover:underline transition-all">
                    <span className="material-symbols-outlined text-sm select-none">share</span>
                    MCP Server Registry
                  </a>
                </div>
              </div>

              {/* Card 2: HQ Coordinates */}
              <div className="glass-panel p-4 sm:p-6 rounded-xl border border-outline/15 bg-surface-container-low/40 space-y-3 font-mono text-xs leading-relaxed text-[#b9cacb]">
                <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">HQ Coordinates</h4>
                <p className="text-xs">
                  SutharLabs Research Hub &amp; Studios<br />
                  Digital Innovation Cluster<br />
                  India
                </p>
                <div className="pt-2 border-t border-outline/10 flex justify-between text-[10px] text-on-surface-variant">
                  <span>TIMEZONE</span>
                  <span>UTC+5:30 (IST)</span>
                </div>
              </div>

            </div>

          </div>

          {/* Back to Home CTA button */}
          <div className="flex justify-center pt-8">
            <button 
              onClick={() => {
                setCurrentView('HOME');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-lg border border-outline/30 bg-transparent text-[#b9cacb] font-mono text-xs uppercase tracking-wider hover:text-white hover:border-white transition-all cursor-pointer"
            >
              Back to Home Page
            </button>
          </div>

        </div>
      )}

      </main>

      {/* Footer */}
      <footer className="w-full py-4 sm:py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container dark:bg-surface-container-low border-t border-outline/10 z-10 mt-auto">
        <div className="text-md font-bold text-primary tracking-tight hover:brightness-110">
          SutharLabs
        </div>
        <div className="text-xs text-on-surface-variant text-center sm:text-left">
          &copy; 2026 SutharLabs Corp. All rights reserved.
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-xs text-on-surface-variant font-mono">
          <a className="hover:text-primary transition-colors" href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a className="hover:text-secondary transition-colors" href="https://google.com" target="_blank" rel="noopener noreferrer">Google</a>
        </div>
      </footer>

      {/* Dynamic Project Spec Sheet Overlay Drawer/Modal (Mounted at root level above navbar z-50) */}
      {selectedProject && (
        <div 
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 lg:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProject(null);
          }}
        >
          <div 
            className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border border-outline/25 bg-surface dark:bg-[#0c0c10] shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Pinned Sticky Header */}
            <div className="shrink-0 px-5 sm:px-7 py-4 border-b border-outline/15 bg-surface-container dark:bg-[#14141a] flex items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-1 px-2.5 rounded-md bg-tertiary/10 text-tertiary border border-tertiary/25 text-xs font-mono shrink-0">
                  {selectedProject.segment}
                </span>
                <span className="font-mono text-xs text-on-surface-variant uppercase shrink-0 hidden sm:inline">
                  {selectedProject.id}
                </span>
                <div className="h-4 w-px bg-outline/20 hidden sm:block shrink-0" />
                <h3 className="text-lg sm:text-xl font-bold font-sans text-on-surface flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-primary text-xl shrink-0">{selectedProject.blueprintSymbol}</span>
                  <span className="truncate">{selectedProject.title}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white transition-all cursor-pointer border border-white/10 flex items-center justify-center group"
                  aria-label="Close details"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5 transition-transform group-hover:scale-110" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body - Widescreen 2-Column Desktop Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-7 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Full-Fidelity Desktop Browser Showcase */}
                <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                  <div className="rounded-xl overflow-hidden shadow-2xl border border-outline/20">
                    <ProjectBrowserMockup
                      project={selectedProject}
                      aspectRatio="modal"
                      showLiveButton={true}
                    />
                  </div>

                  {/* Live URL Quick Bar */}
                  {getProjectLiveUrl(selectedProject) && (
                    <div className="p-3.5 rounded-xl border border-outline/15 bg-surface-container/60 dark:bg-[#14141a]/60 flex items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-on-surface-variant truncate">Live Production URL:</span>
                        <a 
                          href={getProjectLiveUrl(selectedProject)!} 
                          target={getProjectLiveUrl(selectedProject)!.startsWith('/') ? '_self' : '_blank'} 
                          rel="noopener noreferrer" 
                          className="text-emerald-400 hover:underline font-bold truncate"
                        >
                          {getProjectLiveUrl(selectedProject)}
                        </a>
                      </div>
                      <a
                        href={getProjectLiveUrl(selectedProject)!}
                        target={getProjectLiveUrl(selectedProject)!.startsWith('/') ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-[#00e476] font-bold transition-all shrink-0 flex items-center gap-1.5"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Column: Case Details, Metrics, Tech Stack, Feedback */}
                <div className="lg:col-span-5 xl:col-span-5 space-y-4">
                  
                  {/* Visual Case Stats Board */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-dashed border-tertiary/25 bg-surface-container dark:bg-[#14141a] flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-secondary tracking-widest block mb-0.5">Impact Telemetry Metric</span>
                      <span className="text-xl sm:text-2xl font-bold font-mono text-tertiary block tracking-wide">{selectedProject.stat}</span>
                      <span className="text-xs text-on-surface-variant/70 font-mono block mt-0.5">{selectedProject.statLabel}</span>
                    </div>
                    <div className="pt-2 border-t border-outline/10 flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                      <span>GATEWAY AUTH ID</span>
                      <span className="text-secondary font-bold">GW_SECURE_{selectedProject.id.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Problem & Solution Implementation Details */}
                  <div className="space-y-1.5">
                    <h4 className="font-mono text-xs uppercase text-on-surface-variant/70 tracking-wider">Solution Architecture & Scope</h4>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed select-text font-light">
                      {selectedProject.detailedCase}
                    </p>
                  </div>

                  {/* Technologies Grid */}
                  <div className="space-y-1.5">
                    <h4 className="font-mono text-xs uppercase text-on-surface-variant/70 tracking-wider">Tech Stack Specifications</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProject.techs.map((t) => (
                        <span key={t} className="px-2.5 py-0.5 rounded bg-secondary/10 border border-secondary/20 text-xs text-secondary font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Client Partner Testimonial */}
                  {(() => {
                    const feedbackData = getProjectFeedbackDetails(selectedProject);
                    return (
                      <div className="p-3.5 sm:p-4 rounded-xl border border-outline/15 bg-surface-container dark:bg-[#14141a] relative italic font-light text-xs text-on-surface-variant leading-relaxed">
                        <span className="absolute top-2 left-3 font-sans text-2xl font-bold text-on-surface-variant/30 select-none leading-none">“</span>
                        <p className="pl-4 pr-2 text-on-surface font-light leading-relaxed">
                          {feedbackData.quote}
                        </p>
                        <div className="mt-3 pl-4 text-[11px] font-mono not-italic text-secondary flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                          <span className="font-bold text-on-surface">{feedbackData.author}, <span className="text-on-surface-variant/70 font-normal">{feedbackData.authorTitle}</span></span>
                        </div>
                      </div>
                    );
                  })()}

                </div>

              </div>
            </div>

            {/* Modal Pinned Sticky Footer */}
            <div className="shrink-0 px-5 sm:px-7 py-3.5 border-t border-outline/15 bg-surface-container dark:bg-[#14141a] flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
              <span className="text-[11px] font-mono text-on-surface-variant/70 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Production Infrastructure • Enterprise Certified</span>
              </span>
              
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {getProjectLiveUrl(selectedProject) && (
                  <a
                    href={getProjectLiveUrl(selectedProject)!}
                    target={getProjectLiveUrl(selectedProject)!.startsWith('/') ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-[#00e476] hover:bg-emerald-500/25 font-bold text-xs transition-all flex items-center gap-1.5 font-mono shadow-xs"
                  >
                    <span>Visit Live Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject(null);
                    onLaunch();
                  }}
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:brightness-110 text-xs transition-all flex items-center gap-1 cursor-pointer font-sans border-none shadow-sm"
                >
                  <span>Launch Workspace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 rounded-lg border border-outline/30 hover:border-outline/60 text-on-surface-variant hover:text-on-surface text-xs font-mono transition-all cursor-pointer bg-transparent"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
