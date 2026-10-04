import React, { useState, useEffect, useRef } from 'react';

interface HeroStudioConsoleProps {
  theme?: 'light' | 'dark';
  onLaunch: () => void;
}

interface PluginSlide {
  id: string;
  name: string;
  badge: string;
  icon: string;
  accentColor: string;
  tagline: string;
  description: string;
  hidden?: boolean;
}

const ALL_PLUGIN_SLIDES: PluginSlide[] = [
  {
    id: 'agentic-mcp',
    name: 'Agentic MCP Engine',
    badge: 'Core Protocol',
    icon: 'smart_toy',
    accentColor: '#00dbe7',
    tagline: 'Autonomous AI Tooling & JSON-RPC Orchestration',
    description: 'Dynamic MCP servers, real-time agent handshakes, and deterministic sandboxed execution.',
    hidden: true // Hidden per requirement
  },
  {
    id: 'stock-tracker',
    name: 'Stock Tracker Hub',
    badge: 'FinTech Plugin',
    icon: 'monitoring',
    accentColor: '#00e476',
    tagline: 'High-Frequency Market Telemetry & Algorithmic Signals',
    description: 'Sub-millisecond tick streaming, predictive RSI/MACD modeling, and automated portfolio execution.'
  },
  {
    id: 'custom-flow',
    name: 'Custom Flow Designer',
    badge: 'Architecture Plugin',
    icon: 'account_tree',
    accentColor: '#ce5dff',
    tagline: 'Visual Event-Driven Data Pipelines & Edge Microservices',
    description: 'Drag-and-drop reactive architectures connecting Neon Serverless PG, edge caches, and client apps.'
  },
  {
    id: 'doc-nexus',
    name: 'Doc Nexus Intelligence',
    badge: 'Knowledge Plugin',
    icon: 'menu_book',
    accentColor: '#ffb74d',
    tagline: 'Vectorized Semantic Knowledge Vault & RAG Search',
    description: 'Enterprise markdown indexing, neural vector embeddings, and zero-latency technical documentation search.'
  }
];

const PLUGIN_SLIDES = ALL_PLUGIN_SLIDES.filter(s => !s.hidden);

export default function HeroStudioConsole({ theme = 'dark', onLaunch }: HeroStudioConsoleProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<'console' | 'architecture' | 'metrics'>('console');
  const [terminalTick, setTerminalTick] = useState(0);

  const isLight = theme === 'light';
  const currentSlide = PLUGIN_SLIDES[currentSlideIndex];

  // Auto-cycle carousel every 7 seconds when active
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % PLUGIN_SLIDES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Terminal clock tick for simulated live activity
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTerminalTick((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(tickInterval);
  }, []);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentSlideIndex((prev) => (prev === 0 ? PLUGIN_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentSlideIndex((prev) => (prev + 1) % PLUGIN_SLIDES.length);
  };

  const handleSelectSlide = (idx: number) => {
    setIsAutoPlaying(false);
    setCurrentSlideIndex(idx);
  };

  return (
    <div 
      className="w-full mt-12 sm:mt-16 relative rounded-2xl overflow-hidden glass-panel border transition-all duration-500 shadow-2xl"
      style={{
        borderColor: isLight ? 'rgba(226, 232, 240, 0.9)' : 'rgba(58, 73, 75, 0.4)',
        background: isLight 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.95) 100%)' 
          : 'linear-gradient(135deg, rgba(12,12,14,0.95) 0%, rgba(18,18,22,0.95) 100%)',
        boxShadow: isLight
          ? '0 20px 50px rgba(0, 219, 231, 0.08), 0 4px 20px rgba(0,0,0,0.04)'
          : '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 219, 231, 0.06)'
      }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Top Window Bar with macOS traffic lights, carousel tab strip, and live pulse */}
      <div 
        className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b select-none transition-colors duration-300"
        style={{
          borderColor: isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(58, 73, 75, 0.25)',
          background: isLight ? 'rgba(241, 245, 249, 0.6)' : 'rgba(20, 20, 24, 0.7)'
        }}
      >
        {/* Left: macOS dots & context label */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm"></div>
          </div>
          <div className="h-4 w-[1px] bg-slate-300 dark:bg-white/10 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-[#b9cacb]">
            <span className="font-semibold text-slate-800 dark:text-white">sutharlabs-runtime</span>
            <span className="text-slate-400 dark:text-[#849495]">/</span>
            <span style={{ color: currentSlide.accentColor }} className="font-bold">
              {currentSlide.id}
            </span>
          </div>
        </div>

        {/* Center: Carousel Tabs Strip */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide">
          {PLUGIN_SLIDES.map((slide, idx) => {
            const isSelected = idx === currentSlideIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? isLight
                      ? 'bg-white shadow-sm font-bold border border-slate-300'
                      : 'bg-white/10 font-bold border border-white/20'
                    : isLight
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                      : 'text-[#849495] hover:text-[#e5e1e4] hover:bg-white/5'
                }`}
                style={isSelected ? { color: slide.accentColor } : {}}
              >
                <span className="material-symbols-outlined text-[14px] leading-none select-none">
                  {slide.icon}
                </span>
                <span>{slide.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Controls (Previous, Next, Auto-play indicator) */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-[#00e476]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] font-bold">EDGE SYNC 14ms</span>
          </div>

          <div className="flex items-center border rounded-lg overflow-hidden border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Capability"
              className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-600 dark:text-[#b9cacb] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm leading-none">chevron_left</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10"></div>
            <button
              type="button"
              onClick={handleNext}
              title="Next Capability"
              className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-600 dark:text-[#b9cacb] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dynamic Workspace Display Canvas */}
      <div className="p-4 sm:p-6 lg:p-8 min-h-[380px] flex flex-col justify-between relative overflow-hidden">
        
        {/* Subtle Accent Glow based on active slide color */}
        <div 
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-all duration-700 opacity-20 dark:opacity-30"
          style={{ background: currentSlide.accentColor }}
        ></div>

        {/* Slide Header: Title, Badge, and Tagline */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-white/5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                style={{
                  background: isLight ? `${currentSlide.accentColor}18` : `${currentSlide.accentColor}25`,
                  color: currentSlide.accentColor,
                  border: `1px solid ${currentSlide.accentColor}40`
                }}
              >
                {currentSlide.badge}
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currentSlide.tagline}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#b9cacb] font-light max-w-2xl leading-relaxed">
              {currentSlide.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onLaunch}
            className="px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 hover:scale-[1.02]"
            style={{
              background: currentSlide.accentColor,
              color: isLight ? '#ffffff' : '#050505',
              boxShadow: `0 0 20px ${currentSlide.accentColor}40`
            }}
          >
            <span>Launch Live</span>
            <span className="material-symbols-outlined text-sm leading-none">arrow_forward</span>
          </button>
        </div>

        {/* Dynamic Graphic Stage: Rendered Content per Slide */}
        <div className="my-6 relative z-10">
          
          {/* SLIDE 1: AGENTIC MCP ORCHESTRATOR */}
          {currentSlide.id === 'agentic-mcp' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Terminal Output Simulation */}
              <div className="lg:col-span-8 rounded-xl p-4 font-mono text-xs overflow-hidden border bg-slate-900 text-slate-100 dark:bg-black/60 dark:border-white/10 shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00dbe7] animate-pulse"></span>
                    MCP CLIENT DAEMON: CONNECTED
                  </span>
                  <span>STDIN / STDOUT JSON-RPC 2.0</span>
                </div>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="text-slate-400">
                    <span className="text-[#00dbe7] font-bold">agy</span> agent:orchestrate --protocol=mcp-stream
                  </div>
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <span>✔</span> Handshake verified with <code className="text-[#74f5ff]">sutharlabs-mcp-v2</code> (14 tools discovered)
                  </div>
                  <div className="text-purple-300">
                    → Invoking tool: <span className="text-[#ce5dff] font-bold">"calculate_predictive_risk"</span> with params: <code className="bg-white/10 px-1 rounded text-white">{`{"asset": "PORTFOLIO_PRIMARY", "window": "7D"}`}</code>
                  </div>
                  <div className="text-slate-300 pl-4 border-l-2 border-[#00dbe7]/40 bg-white/[0.02] py-1">
                    {`{ "confidence": 0.94, "sharpe_ratio": 2.41, "risk_category": "OPTIMAL", "latency_ms": 16 }`}
                  </div>
                  <div className="text-amber-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span>Continuous Agent Telemetry Heartbeat active (tick #{terminalTick})</span>
                  </div>
                </div>
              </div>

              {/* Right: Micro Telemetry HUD Cards */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10">
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">Execution Speed</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono text-[#00dbe7]">16.4 ms</span>
                    <span className="text-[10px] text-emerald-600 dark:text-[#00e476] font-mono font-semibold">Sub-edge tier</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#00dbe7] w-[88%] rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10">
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">Tool Capability Registry</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['postgres_sync', 'mcp_search', 'llm_eval', 'market_feed'].map(t => (
                      <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-200/80 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-slate-700 dark:text-[#b9cacb]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: STOCK TRACKER HUB */}
          {currentSlide.id === 'stock-tracker' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Animated FinTech Chart */}
              <div className="lg:col-span-8 rounded-xl p-4 border bg-slate-900 dark:bg-black/60 dark:border-white/10 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">RELIANCE.NS</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#00e476]/20 text-[#00e476] text-[10px] font-bold">NSE LIVE</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#00e476]">₹2,984.40</span>
                    <span className="text-[10px] text-emerald-400 ml-2 font-semibold">+1.85%</span>
                  </div>
                </div>

                {/* SVG Visual Candlestick / Trend Curve */}
                <div className="w-full h-32 relative my-2">
                  <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="stockGreenGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e476" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#00e476" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,100 Q40,80 80,85 T160,60 T240,65 T320,30 T400,15 L400,120 L0,120 Z"
                      fill="url(#stockGreenGlow)"
                    />
                    <path
                      d="M0,100 Q40,80 80,85 T160,60 T240,65 T320,30 T400,15"
                      fill="none"
                      stroke="#00e476"
                      strokeWidth="2.5"
                    />
                    {/* Glowing active price head marker */}
                    <circle cx="400" cy="15" r="4" fill="#00e476" className="animate-ping" />
                    <circle cx="400" cy="15" r="3" fill="#ffffff" />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-white/10">
                  <span>RSI: <strong className="text-emerald-400">58.4 (Bullish)</strong></span>
                  <span>MACD Hist: <strong className="text-emerald-400">+14.2</strong></span>
                  <span>Volume: <strong className="text-white">4.82M</strong></span>
                  <span>Model Action: <strong className="text-[#00e476] bg-[#00e476]/10 px-2 py-0.5 rounded border border-[#00e476]/30">BUY (91%)</strong></span>
                </div>
              </div>

              {/* Right: Technical Stats Widget */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Predictive Alpha Engine</span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium my-2">
                    Autonomous signal generator tracking 50+ NIFTY constituents with sub-second WebSocket pushes.
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-white/10">
                    <span>Average Return:</span>
                    <span className="text-emerald-600 dark:text-[#00e476]">+18.4% YTD</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 dark:text-slate-400">Latency Profile</span>
                    <span className="text-[#00e476] font-bold">12ms</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono mt-1">
                    <span className="text-slate-500 dark:text-slate-400">Risk-Reward Ratio</span>
                    <span className="text-slate-900 dark:text-white font-bold">1 : 3.4</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: CUSTOM FLOW DESIGNER */}
          {currentSlide.id === 'custom-flow' && (
            <div className="rounded-xl p-4 sm:p-6 border bg-slate-900 dark:bg-black/60 dark:border-white/10 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4 pb-2 border-b border-white/10">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <span className="material-symbols-outlined text-sm">hub</span>
                  DYNAMIC PIPELINE TOPOLOGY
                </span>
                <span>STATEFUL REACTIVE BUS</span>
              </div>

              {/* Rendered Visual Nodes with glowing connection lines */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 relative">
                
                {/* Node 1 */}
                <div className="w-full md:w-44 p-3 rounded-lg border bg-white/[0.04] border-cyan-500/30 text-center shadow-lg relative group hover:border-cyan-400 transition-colors">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">01. INGESTION</div>
                  <div className="text-xs font-bold text-white">Client Events</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1">REST / WebSocket</div>
                </div>

                {/* Arrow Pulse 1 */}
                <div className="hidden md:flex items-center text-purple-400 font-mono text-xs">
                  <span className="animate-pulse">──▶</span>
                </div>

                {/* Node 2 */}
                <div className="w-full md:w-48 p-3 rounded-lg border bg-white/[0.04] border-purple-500/40 text-center shadow-lg relative group hover:border-purple-400 transition-colors">
                  <div className="text-[10px] font-mono text-[#ce5dff] font-bold uppercase mb-1">02. EDGE LOGIC</div>
                  <div className="text-xs font-bold text-white">Custom Flow Node</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1">Rules &amp; Routing</div>
                </div>

                {/* Arrow Pulse 2 */}
                <div className="hidden md:flex items-center text-emerald-400 font-mono text-xs">
                  <span className="animate-pulse">──▶</span>
                </div>

                {/* Node 3 */}
                <div className="w-full md:w-44 p-3 rounded-lg border bg-white/[0.04] border-emerald-500/30 text-center shadow-lg relative group hover:border-emerald-400 transition-colors">
                  <div className="text-[10px] font-mono text-[#00e476] font-bold uppercase mb-1">03. PERSISTENCE</div>
                  <div className="text-xs font-bold text-white">Neon PostgreSQL</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1">Realtime Serverless</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-3 border-t border-white/10 mt-2">
                <span>Node Isolation: <strong className="text-purple-300">V8 Sandbox</strong></span>
                <span>Throughput: <strong className="text-cyan-300">4,200 req/sec</strong></span>
                <span>Failover: <strong className="text-emerald-300">Active-Active</strong></span>
              </div>
            </div>
          )}

          {/* SLIDE 4: DOC NEXUS INTELLIGENCE */}
          {currentSlide.id === 'doc-nexus' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Vector Semantic Query Visualizer */}
              <div className="lg:col-span-8 rounded-xl p-4 border bg-slate-900 dark:bg-black/60 dark:border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 mb-3 text-xs font-mono">
                    <span className="material-symbols-outlined text-amber-400 text-sm">search</span>
                    <span className="text-slate-300">"Explain architectural protocol for cross-tenant Postgres synchronization"</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono text-slate-300 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold">
                      <span>✓ 98.6% SEMANTIC SIMILARITY MATCH</span>
                      <span className="text-slate-500">•</span>
                      <span>DOC ID #0492</span>
                    </div>
                    <p className="text-slate-200">
                      The synchronization pipeline leverages Neon Serverless branching with Prisma schema validation, ensuring zero data pollution across enterprise tenant workspaces...
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-3 border-t border-white/10 mt-3">
                  <span>Embedding Model: <strong className="text-amber-400">text-embedding-3-small</strong></span>
                  <span>Search Latency: <strong className="text-emerald-400">4ms</strong></span>
                  <span>Documents: <strong className="text-white">12,480 indexed</strong></span>
                </div>
              </div>

              {/* Right: Knowledge Hub Feature Pill */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10">
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Intelligent RAG Index</span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium my-2">
                    Turn messy markdown repos, architectural specs, and API contracts into vectorized technical knowledge for human teams and agents.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {['Markdown', 'PDF', 'OpenAPI', 'Codebase'].map(fmt => (
                      <span key={fmt} className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Compliance Audit</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500 font-bold">SOC2 READY</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Carousel Bottom Control Footer & Dot Indicators */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500 dark:text-[#849495] relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px]">Showcase {currentSlideIndex + 1} of {PLUGIN_SLIDES.length}</span>
            <span className="text-slate-300 dark:text-white/10">•</span>
            <span className="text-[10px] uppercase tracking-wider hidden sm:inline">
              {isAutoPlaying ? 'Auto-cycling (7s)' : 'Paused (Hover or Click to resume)'}
            </span>
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center gap-2">
            {PLUGIN_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentSlideIndex
                    ? 'w-7 h-2 bg-gradient-to-r'
                    : 'w-2 h-2 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40'
                }`}
                style={idx === currentSlideIndex ? {
                  backgroundColor: slide.accentColor,
                  boxShadow: `0 0 10px ${slide.accentColor}80`
                } : {}}
                title={slide.name}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
