import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Server, 
  Database, 
  Cpu, 
  FileCode, 
  Zap, 
  Layers, 
  Globe, 
  Shield, 
  Terminal, 
  Check, 
  CheckCircle2, 
  Copy, 
  Search, 
  Plus, 
  Trash2, 
  ArrowRight, 
  RefreshCw, 
  Sliders, 
  ExternalLink, 
  Activity, 
  BookOpen, 
  AlertCircle, 
  Sparkles, 
  MessageSquare, 
  Code2, 
  LineChart, 
  Film, 
  Palette, 
  ChevronRight, 
  ChevronDown, 
  Lock, 
  History, 
  Play
} from 'lucide-react';
import { AIAgentPersona, MCPServerInfo, AISkillInfo, TerminalLog } from '../types';
import { AGENT_PERSONAS } from '../services/aiChatService';

interface AIEcosystemStudioViewProps {
  theme?: 'light' | 'dark';
  selectedAgent: AIAgentPersona;
  onSelectAgent: (agent: AIAgentPersona) => void;
  onOpenChat: () => void;
  mcpServers?: MCPServerInfo[];
  onExecuteMcpTool?: (toolName: string, args: Record<string, any>) => Promise<any>;
  terminalLogs?: TerminalLog[];
  skills?: AISkillInfo[];
  selectedSkillId?: string | null;
  onSelectSkill?: (id: string | null) => void;
  userToken?: string;
  onPrepopulatePrompt?: (prompt: string) => void;
}

export const DEFAULT_MCP_SERVERS = [
  {
    id: 'database-mcp',
    name: 'Database Engine MCP',
    category: 'Infrastructure',
    desc: 'PostgreSQL 16 Primary (Oracle Cloud Port 5432) + Neon Standby Failover Parity',
    status: 'connected',
    tools: [
      { name: 'database_schema_and_stats', desc: 'Inspects Postgres tables, row counts, indexes, and replication state' },
      { name: 'database_query_explain', desc: 'Runs EXPLAIN ANALYZE on read-only queries to optimize execution plan' }
    ]
  },
  {
    id: 'graphify-mcp',
    name: 'Knowledge Graph MCP',
    category: 'Architecture',
    desc: 'AST Codebase Graph with God-node analysis & semantic relationship mapping',
    status: 'connected',
    tools: [
      { name: 'codebase_graph_query', desc: 'Queries AST nodes, call paths, and dependency hierarchies across src/' },
      { name: 'codebase_graph_explain', desc: 'Returns focused subgraphs for specialized architectural subsystems' }
    ]
  },
  {
    id: 'storage-vault-mcp',
    name: 'Storage Vault MCP',
    category: 'Storage',
    desc: 'Oracle Cloud File System & Vault Record Inspector over HTTP',
    status: 'connected',
    tools: [
      { name: 'storage_vault_list', desc: 'Lists files in the encrypted Oracle Cloud file storage and snapshot backups' },
      { name: 'storage_vault_stat', desc: 'Checks file size, integrity checksum, and disk storage allocation' }
    ]
  },
  {
    id: 'fleet-telemetry-mcp',
    name: 'Cloud Fleet Telemetry MCP',
    category: 'DevOps',
    desc: 'Multi-node Always Free VM cluster telemetry (VM1 & VM2 RAM/Swap/Load)',
    status: 'connected',
    tools: [
      { name: 'fleet_health_check', desc: 'Queries CPU %, RAM, Swap allocation, and system uptime across VM fleet' },
      { name: 'fleet_process_audit', desc: 'Inspects active background daemons (PM2, Ollama, Lookbusy, Nginx)' }
    ]
  },
  {
    id: 'contextual-rag-mcp',
    name: 'Contextual RAG & Semantic Corpus MCP',
    category: 'Retrieval',
    desc: 'Hybrid dense semantic vectors (nomic-embed-text) + BM25 with Reciprocal Rank Fusion (RRF, k=60)',
    status: 'connected',
    tools: [
      { name: 'contextual_rag_query', desc: 'Performs hybrid semantic + BM25 search across indexed documentation chunks' },
      { name: 'contextual_rag_stats', desc: 'Retrieves vector corpus status, chunk count, and embedding dimensions' }
    ]
  },
  {
    id: 'web-search-mcp',
    name: 'Real-Time Web Intelligence MCP',
    category: 'Intelligence',
    desc: 'DuckDuckGo Instant Search API for real-time external documentation & news',
    status: 'connected',
    tools: [
      { name: 'web_search', desc: 'Queries live web documents, tech releases, and official developer documentations' }
    ]
  }
];

export default function AIEcosystemStudioView({
  theme,
  selectedAgent,
  onSelectAgent,
  onOpenChat,
  mcpServers,
  onExecuteMcpTool,
  terminalLogs = [],
  skills = [],
  selectedSkillId,
  onSelectSkill,
  userToken,
  onPrepopulatePrompt
}: AIEcosystemStudioViewProps) {
  // Theme Fallback Resolution
  const effectiveTheme: 'light' | 'dark' = theme || (
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const isLight = effectiveTheme === 'light';

  // Sub-Tab Switcher State: 'agents' | 'mcp' | 'hooks' | 'skills'
  const [activeTab, setActiveTab] = useState<'agents' | 'mcp' | 'hooks' | 'skills'>('agents');

  // Search & Filtering States
  const [agentSearch, setAgentSearch] = useState<string>('');
  const [agentCategoryFilter, setAgentCategoryFilter] = useState<string>('all');
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // MCP Probing State
  const [activeMcpTool, setActiveMcpTool] = useState<string>('database_schema_and_stats');
  const [isProbingMcp, setIsProbingMcp] = useState<boolean>(false);
  const [mcpProbeOutput, setMcpProbeOutput] = useState<any>(null);
  const [mcpProbeLatency, setMcpProbeLatency] = useState<number | null>(null);

  // Custom Agent Persona Creator Drawer
  const [isCreatingPersona, setIsCreatingPersona] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customBadge, setCustomBadge] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('qwen2.5:1.5b');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [customPersonas, setCustomPersonas] = useState<AIAgentPersona[]>(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_custom_agent_personas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save custom persona to localStorage
  const handleSaveCustomPersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPrompt.trim()) return;

    const newPersona: AIAgentPersona = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      title: customTitle.trim() || 'Custom Autonomous Specialist',
      icon: 'bot',
      badge: customBadge.trim() || 'Custom',
      description: customPrompt.trim().slice(0, 120) + '...',
      systemPrompt: customPrompt.trim(),
      recommendedModel: customModel
    };

    const updated = [newPersona, ...customPersonas];
    setCustomPersonas(updated);
    try {
      localStorage.setItem('sutharlabs_custom_agent_personas', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save custom persona:', err);
    }

    onSelectAgent(newPersona);
    setIsCreatingPersona(false);
    setCustomName('');
    setCustomTitle('');
    setCustomBadge('');
    setCustomPrompt('');
  };

  const handleDeleteCustomPersona = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPersonas.filter(p => p.id !== id);
    setCustomPersonas(updated);
    try {
      localStorage.setItem('sutharlabs_custom_agent_personas', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to update custom personas:', err);
    }
  };

  // Helper to copy prompt to clipboard
  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // Helper to test MCP Tool
  const handleRunMcpProbe = async (toolName: string) => {
    setActiveMcpTool(toolName);
    setIsProbingMcp(true);
    setMcpProbeOutput(null);
    const start = performance.now();
    try {
      if (onExecuteMcpTool) {
        const res = await onExecuteMcpTool(toolName, {});
        setMcpProbeOutput(res);
      } else {
        // Fallback direct endpoint call
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (userToken) headers['Authorization'] = `Bearer ${userToken}`;
        const res = await fetch('/api/ai/mcp/execute', {
          method: 'POST',
          headers,
          body: JSON.stringify({ tool: toolName, arguments: {} })
        });
        const data = await res.json();
        setMcpProbeOutput(data);
      }
    } catch (err: any) {
      setMcpProbeOutput({ error: err.message || 'Tool execution failed' });
    } finally {
      setMcpProbeLatency(Math.round(performance.now() - start));
      setIsProbingMcp(false);
    }
  };

  // Helper for agent icons
  const getAgentIcon = (iconName: string) => {
    switch (iconName) {
      case 'server': return <Server className="w-5 h-5 text-sky-400 shrink-0" />;
      case 'database': return <Database className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'code': return <Code2 className="w-5 h-5 text-purple-400 shrink-0" />;
      case 'line-chart': return <LineChart className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'cpu': return <Cpu className="w-5 h-5 text-[#00dbe7] shrink-0" />;
      case 'globe': return <Globe className="w-5 h-5 text-blue-400 shrink-0" />;
      case 'film': return <Film className="w-5 h-5 text-pink-400 shrink-0" />;
      case 'palette': return <Palette className="w-5 h-5 text-indigo-400 shrink-0" />;
      default: return <Sparkles className="w-5 h-5 text-[#00dbe7] shrink-0" />;
    }
  };

  // Combine built-in personas with custom personas
  const allPersonas = [...customPersonas, ...AGENT_PERSONAS];

  // Filter personas
  const filteredPersonas = allPersonas.filter(persona => {
    const matchesSearch = 
      persona.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      persona.title.toLowerCase().includes(agentSearch.toLowerCase()) ||
      persona.badge.toLowerCase().includes(agentSearch.toLowerCase()) ||
      persona.description.toLowerCase().includes(agentSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (agentCategoryFilter === 'all') return true;
    if (agentCategoryFilter === 'infra') return ['cloud-architect', 'database-architect'].includes(persona.id);
    if (agentCategoryFilter === 'code') return ['software-engineer', 'research-synthesizer'].includes(persona.id);
    if (agentCategoryFilter === 'math') return ['quant-analyst', 'math-reasoner'].includes(persona.id);
    if (agentCategoryFilter === 'creative') return ['video-director', 'creative-designer'].includes(persona.id);
    if (agentCategoryFilter === 'custom') return persona.id.startsWith('custom-');
    return true;
  });

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-background text-[#e5e1e4]'
    }`}>

      {/* Top Banner & Tab Navigation */}
      <div className={`px-4 sm:px-6 py-4 border-b shrink-0 flex items-center justify-between gap-4 flex-wrap transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-surface-container-low/40 border-outline/15'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Cpu className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight font-sans">
                Agents, MCP &amp; Ecosystem Studio
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Copilot / ACP Standard
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Decoupled specialized agents, native Model Context Protocol (MCP) servers, safety guardrails &amp; skills
            </p>
          </div>
        </div>

        {/* Quick Return to Chat Cockpit Action */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenChat}
            className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              isLight
                ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 shadow-[#00dbe7]/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Open Chat Cockpit</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className={`px-4 sm:px-6 py-2 border-b shrink-0 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar transition-colors ${
        isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-[#141417] border-outline/10'
      }`}>
        <div className="flex items-center gap-1.5">
          {[
            { id: 'agents' as const, name: 'Agent Personas', count: allPersonas.length, icon: Bot, color: 'text-purple-400' },
            { id: 'mcp' as const, name: 'MCP Servers', count: (mcpServers?.length || DEFAULT_MCP_SERVERS.length), icon: Database, color: 'text-emerald-400' },
            { id: 'hooks' as const, name: 'Hooks & Guardrails', count: 3, icon: Shield, color: 'text-sky-400' },
            { id: 'skills' as const, name: 'Skills Catalog', count: (skills.length || 5), icon: Zap, color: 'text-amber-400' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer select-none shrink-0 ${
                  isActive
                    ? isLight
                      ? 'bg-white text-slate-900 border border-slate-300 shadow-sm font-extrabold'
                      : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 shadow-sm font-extrabold'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? (isLight ? 'text-sky-600' : 'text-[#00dbe7]') : tab.color}`} />
                <span>{tab.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? isLight ? 'bg-sky-100 text-sky-800' : 'bg-[#00dbe7]/20 text-[#00dbe7]'
                    : isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Selected Agent Status Pill */}
        <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-mono ${
          isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#18181c] border-outline/10 text-gray-300'
        }`}>
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Active in Chat:</span>
          <div className="flex items-center gap-1.5 font-bold text-on-surface">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>{selectedAgent.name}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded uppercase bg-purple-500/15 text-purple-400">
              {selectedAgent.badge}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">

        {/* TAB 1: AGENT PERSONAS COCKPIT */}
        {activeTab === 'agents' && (
          <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-150">
            {/* Header Toolbar: Search + Categories + Create Button */}
            <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141417] border-outline/15'
            }`}>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className={`relative flex-1 md:w-64 rounded-xl border flex items-center px-2.5 ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#1a1a1e] border-outline/20'
                }`}>
                  <Search className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mr-2" />
                  <input
                    type="text"
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    placeholder="Search agents by role, domain..."
                    className="w-full bg-transparent py-1.5 text-xs font-mono border-none outline-hidden text-on-surface placeholder:text-on-surface-variant/60"
                  />
                  {agentSearch && (
                    <button
                      type="button"
                      onClick={() => setAgentSearch('')}
                      className="p-1 text-on-surface-variant hover:text-on-surface"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'infra', label: 'DevOps & DB' },
                    { id: 'code', label: 'Full-Stack' },
                    { id: 'math', label: 'Quant & CoT' },
                    { id: 'creative', label: 'Creative' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAgentCategoryFilter(cat.id)}
                      className={`h-7 px-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        agentCategoryFilter === cat.id
                          ? isLight ? 'bg-sky-50 text-sky-800 border border-sky-300 font-bold' : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30'
                          : isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-on-surface-variant'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Custom Persona Toggle Button */}
              <button
                type="button"
                onClick={() => setIsCreatingPersona(!isCreatingPersona)}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none shrink-0 ${
                  isCreatingPersona
                    ? isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-white'
                    : isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>{isCreatingPersona ? 'Cancel Creator' : 'New Custom Persona'}</span>
              </button>
            </div>

            {/* Custom Persona Creator Panel */}
            {isCreatingPersona && (
              <form
                onSubmit={handleSaveCustomPersona}
                className={`p-5 rounded-2xl border animate-in fade-in zoom-in-98 duration-150 ${
                  isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-[#18181c] border-outline/25'
                }`}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-outline/10">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-purple-400 shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Build Custom Autonomous Agent Persona</h3>
                    <p className="text-[11px] text-on-surface-variant font-mono">Define unique system prompt, tool constraints, and model specialization</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Agent Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Security Auditor"
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono outline-hidden ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. OWASP & Linux Penetration Tester"
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono outline-hidden ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Badge Label
                    </label>
                    <input
                      type="text"
                      value={customBadge}
                      onChange={(e) => setCustomBadge(e.target.value)}
                      placeholder="e.g. Infosec"
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono outline-hidden ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                      Specialized System Prompt Instructions *
                    </label>
                    <span className="text-[10px] font-mono text-on-surface-variant">Injected into LLM context header</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="You are an expert Autonomous Security Auditor for SutharLabs. Review server configurations, check open ports, audit Nginx logs, and detect unhandled vulnerabilities..."
                    className={`w-full p-3 rounded-xl border text-xs font-mono resize-none outline-hidden leading-relaxed ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                    }`}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[11px] text-on-surface-variant">Recommended Local Model:</span>
                    <select
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className={`h-7 px-2.5 rounded-lg border text-xs font-mono font-bold ${
                        isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#121215] border-[#3a494b]/50 text-[#00dbe7]'
                      }`}
                    >
                      <option value="qwen2.5:1.5b">Qwen 2.5 1.5B (Fast CPU)</option>
                      <option value="qwen2.5-coder:3b">Qwen 2.5 Coder 3B (Code SOTA)</option>
                      <option value="deepseek-r1:1.5b">DeepSeek R1 1.5B (CoT Reasoner)</option>
                      <option value="gemma2:2b">Gemma 2 2B (Google Architecture)</option>
                      <option value="qwen2.5:7b">Qwen 2.5 7B (Deep Knowledge)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingPersona(false)}
                      className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer ${
                        isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                        isLight
                          ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                          : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/50'
                      }`}
                    >
                      Save Persona &amp; Activate
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Personas Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPersonas.map(agent => {
                const isSelected = selectedAgent.id === agent.id;
                const isExpanded = expandedPromptId === agent.id;
                const isCustom = agent.id.startsWith('custom-');

                return (
                  <div
                    key={agent.id}
                    className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? isLight
                          ? 'bg-white border-sky-400 ring-2 ring-sky-300/40 shadow-md'
                          : 'bg-[#18181c] border-[#00dbe7]/60 ring-2 ring-[#00dbe7]/20 shadow-[0_0_20px_rgba(0,219,231,0.15)]'
                        : isLight
                          ? 'bg-white hover:border-slate-300 border-slate-200 shadow-xs'
                          : 'bg-[#141417] hover:border-outline/30 border-outline/10'
                    }`}
                  >
                    {/* Card Top Header */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
                          {getAgentIcon(agent.icon)}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-bold uppercase tracking-wider">
                            {agent.badge}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                              Active
                            </span>
                          )}
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomPersona(agent.id, e)}
                              className="p-1 text-gray-400 hover:text-rose-400 cursor-pointer"
                              title="Delete custom persona"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3.5">
                        <h3 className="font-bold text-sm sm:text-base text-on-surface">
                          {agent.name}
                        </h3>
                        <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                          {agent.title}
                        </p>
                      </div>

                      <p className="text-xs text-on-surface-variant/90 leading-relaxed mt-2.5 font-sans line-clamp-3">
                        {agent.description}
                      </p>

                      {/* Recommended Local Model Pill */}
                      <div className={`mt-3.5 p-2 rounded-xl border flex items-center justify-between gap-2 text-[10px] font-mono ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-low/40 border-outline/10'
                      }`}>
                        <span className="text-on-surface-variant">Recommended Model:</span>
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Cpu className="w-3 h-3 shrink-0" />
                          {agent.recommendedModel}
                        </span>
                      </div>

                      {/* Expandable System Prompt Disclosure */}
                      <div className="mt-3 pt-3 border-t border-outline/10">
                        <button
                          type="button"
                          onClick={() => setExpandedPromptId(isExpanded ? null : agent.id)}
                          className="w-full flex items-center justify-between text-[11px] font-mono text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                        >
                          <span className="font-semibold flex items-center gap-1">
                            <Code2 className="w-3 h-3 text-purple-400 shrink-0" />
                            <span>System Prompt ({agent.systemPrompt.length} chars)</span>
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className={`mt-2 p-3 rounded-xl border font-mono text-[10px] select-all leading-relaxed animate-in fade-in zoom-in-98 duration-100 ${
                            isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-black/60 border-outline/20 text-gray-300'
                          }`}>
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-outline/10">
                              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Injected System Prompt</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPrompt(agent.id, agent.systemPrompt)}
                                className="flex items-center gap-1 text-[10px] text-sky-500 hover:underline cursor-pointer"
                              >
                                {copiedPromptId === agent.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedPromptId === agent.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <div className="max-h-36 overflow-y-auto whitespace-pre-wrap">
                              {agent.systemPrompt}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className={`p-3.5 border-t flex items-center justify-between gap-2 ${
                      isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-surface-container-low/20 border-outline/10'
                    }`}>
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Selected in Chat</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectAgent(agent);
                          }}
                          className={`h-7 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            isLight
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface border border-white/10'
                          }`}
                        >
                          Select Persona
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onSelectAgent(agent);
                          onOpenChat();
                        }}
                        className={`h-7 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                          isSelected
                            ? isLight
                              ? 'bg-sky-500 hover:bg-sky-600 text-white'
                              : 'bg-[#00dbe7]/20 hover:bg-[#00dbe7]/30 text-[#00dbe7] border border-[#00dbe7]/50'
                            : isLight
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                              : 'bg-white/10 hover:bg-white/15 text-white'
                        }`}
                      >
                        <span>Chat Now</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MODEL CONTEXT PROTOCOL (MCP) SERVERS */}
        {activeTab === 'mcp' && (
          <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-150">
            {/* MCP Banner */}
            <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141417] border-outline/15'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Model Context Protocol (MCP) Infrastructure</h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                    Standardized tool protocol connecting Ollama local models to live fleet telemetry, PostgreSQL, AST graph &amp; storage
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>6 Servers Healthy</span>
                </span>
              </div>
            </div>

            {/* MCP Servers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(mcpServers?.length ? mcpServers : DEFAULT_MCP_SERVERS).map((srv: any) => (
                <div
                  key={srv.id}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-outline/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <h4 className="font-bold text-sm text-on-surface">{srv.name}</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 uppercase font-bold">
                        {srv.category || 'System'}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed mt-2 font-mono">
                      {srv.desc || srv.description}
                    </p>

                    {/* Tools List */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Exposed Capabilities:
                      </div>
                      {(srv.tools || []).map((t: any) => (
                        <div
                          key={t.name}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-low/40 border-outline/10'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold font-mono text-[#00dbe7] truncate">{t.name}</div>
                            <div className="text-[10px] text-on-surface-variant line-clamp-1 font-sans">{t.desc || t.description}</div>
                          </div>
                          <button
                            type="button"
                            disabled={isProbingMcp}
                            onClick={() => handleRunMcpProbe(t.name)}
                            className={`h-6 px-2 rounded text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 select-none ${
                              isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300' : 'bg-white/5 hover:bg-white/10 text-[#00dbe7] border border-[#00dbe7]/30'
                            }`}
                          >
                            Probe
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline/10 flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                    <span>Protocol: JSON-RPC 2.0</span>
                    <span className="text-emerald-400 font-bold">Zero Cloud Leak</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Interactive MCP Probe Output Terminal */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141417] border-outline/15'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-outline/10">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-on-surface">
                  <Terminal className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  <span>Live MCP Diagnostic Console:</span>
                  <span className="text-purple-400">{activeMcpTool}</span>
                </div>
                {mcpProbeLatency !== null && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                    Execution Latency: {mcpProbeLatency}ms
                  </span>
                )}
              </div>

              <div className="mt-3">
                {isProbingMcp ? (
                  <div className="p-8 flex items-center justify-center gap-2 font-mono text-xs text-on-surface-variant">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#00dbe7] shrink-0" />
                    <span>Executing tool call across Oracle Cloud VM fleet...</span>
                  </div>
                ) : mcpProbeOutput ? (
                  <pre className={`p-3.5 rounded-xl border text-xs font-mono overflow-x-auto max-h-72 select-all ${
                    isLight ? 'bg-slate-900 text-emerald-400 border-slate-800' : 'bg-black/70 text-[#00dbe7] border-outline/20'
                  }`}>
                    <code>{JSON.stringify(mcpProbeOutput, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="p-6 text-center text-xs font-mono text-on-surface-variant">
                    Click "Probe" on any MCP capability above to verify live connection parity.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HOOKS & SAFETY GUARDRAILS */}
        {activeTab === 'hooks' && (
          <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-150">
            {/* Header */}
            <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141417] border-outline/15'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-sky-400 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Execution Hooks &amp; Safety Policies</h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                    Pre-execution validation, secret redactors, context governors &amp; audit trails (GitHub Copilot ACP Architecture)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase">
                Active &amp; Enforced
              </span>
            </div>

            {/* Hook Policies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Hook 1: Pre-Execution Confirmation */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-outline/10'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">Pre-Execution Gate</h4>
                    <p className="text-[10px] text-on-surface-variant font-mono">Mutating Action Approval</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant mt-2.5 leading-relaxed">
                  Prevents destructive actions (e.g. DROP TABLE, file deletions, PM2 process stops) from executing autonomously without an explicit user confirmation modal.
                </p>
                <div className="mt-3.5 pt-3 border-t border-outline/10 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-on-surface-variant">Gate Status:</span>
                  <span className="text-emerald-400 font-bold">STRICT_CONFIRM</span>
                </div>
              </div>

              {/* Hook 2: Secret Redaction & Privacy */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-outline/10'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">Secret Sanitizer</h4>
                    <p className="text-[10px] text-on-surface-variant font-mono">Zero Context Leak</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant mt-2.5 leading-relaxed">
                  Regular expression pattern engine that scrubs PostgreSQL passwords, SSH private keys, and session JWTs from LLM prompt inputs before inference execution.
                </p>
                <div className="mt-3.5 pt-3 border-t border-outline/10 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-on-surface-variant">Redaction:</span>
                  <span className="text-emerald-400 font-bold">100% FILTERED</span>
                </div>
              </div>

              {/* Hook 3: Context Bounds Governor */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-outline/10'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4 text-purple-400 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">Context Governor</h4>
                    <p className="text-[10px] text-on-surface-variant font-mono">8192 Token Buffer</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant mt-2.5 leading-relaxed">
                  Monitors conversation token volume and automatically applies Anthropic-style sliding context summaries when conversation history approaches Ollama memory limits.
                </p>
                <div className="mt-3.5 pt-3 border-t border-outline/10 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-on-surface-variant">Governor:</span>
                  <span className="text-purple-400 font-bold">AUTO_PRUNE_RAG</span>
                </div>
              </div>
            </div>

            {/* Live Engine Audit Telemetry Feed */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141417] border-outline/15'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-outline/10">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-on-surface">
                  <Activity className="w-4 h-4 text-[#00dbe7] shrink-0" />
                  <span>Real-Time Agent Audit &amp; Telemetry Stream</span>
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant">
                  {terminalLogs.length} Events Logged
                </span>
              </div>

              <div className={`mt-3 p-3 rounded-xl border font-mono text-[11px] overflow-y-auto max-h-64 space-y-1.5 ${
                isLight ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-black/70 text-gray-300 border-outline/15'
              }`}>
                {terminalLogs.length === 0 ? (
                  <div className="text-gray-500 p-4 text-center">
                    Zero error alerts. Telemetry engine running at 100% nominal health.
                  </div>
                ) : (
                  terminalLogs.slice(-20).map((log, lIdx) => (
                    <div key={lIdx} className="flex items-start gap-2.5 leading-tight">
                      <span className="text-gray-500 text-[10px] shrink-0">{log.timestamp}</span>
                      <span className={`px-1 rounded text-[9px] font-bold uppercase shrink-0 ${
                        log.type === 'ERROR' ? 'bg-rose-500/20 text-rose-400' :
                        log.type === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                        log.type === 'ALERT' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-sky-500/20 text-sky-400'
                      }`}>
                        {log.type}
                      </span>
                      <span className="flex-1 min-w-0 break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SKILLS CATALOG */}
        {activeTab === 'skills' && (
          <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-150">
            {/* Header */}
            <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141417] border-outline/15'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Specialized Engineering Skills Catalog</h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                    Deterministic prompt runbooks and multi-step workflows executable across any active persona
                  </p>
                </div>
              </div>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: 'fleet-audit',
                  name: 'Cloud Fleet Telemetry Auditor',
                  desc: 'Inspects Oracle Always Free VM1 and VM2 CPU, RAM, and Swap to maintain 100% uptime without reclamation.',
                  suggestedPrompts: [
                    'Review our Oracle Cloud multi-node fleet (VM1 AMD Micro and VM2 Ampere A1). Suggest best practices to prevent idle reclamation.',
                    'Check current RAM, swap usage, and Lookbusy process status across VM2.'
                  ]
                },
                {
                  id: 'db-parity',
                  name: 'Database Parity & Replication Runbook',
                  desc: 'Verifies PostgreSQL 16 primary against Neon PostgreSQL standby failover and reviews connection pools.',
                  suggestedPrompts: [
                    'Provide a production-tuned postgresql.conf snippet for an AMD Micro instance with 1 GB RAM and 2 GB swap.',
                    'Compare row counts and primary keys across VM1 Postgres and Neon standby.'
                  ]
                },
                {
                  id: 'claude-artifact',
                  name: 'Claude-Style Artifact Visualizer',
                  desc: 'Extracts full-screen interactive React components, Markdown reports, and SVGs into side-drawer artifacts.',
                  suggestedPrompts: [
                    'Write a TypeScript React component that parses markdown code blocks and extracts them into an interactive side-drawer with line numbers and copy buttons.',
                    'Generate an SVG architecture diagram for SutharLabs sovereign three-tier infrastructure.'
                  ]
                },
                {
                  id: 'contextual-rag',
                  name: 'Contextual RAG Semantic Query',
                  desc: 'Leverages hybrid dense semantic vectors with nomic-embed-text and BM25 to ground technical answers.',
                  suggestedPrompts: [
                    'Search our sovereign codebase for database connection retry loops and explain the backoff strategy.',
                    'Query Contextual RAG for current API rate limit policies.'
                  ]
                },
                {
                  id: 'multimodal-art',
                  name: 'Multimodal Image Synthesis',
                  desc: 'Synthesizes high-fidelity digital artwork and social graphics via DeepSeek Janus-Pro-1B and FLUX.1 schnell.',
                  suggestedPrompts: [
                    'Generate a futuristic sovereign cloud server room in neon cyan and deep violet cyberpunk aesthetics.',
                    'Create an isometric icon badge for an autonomous database orchestrator.'
                  ]
                }
              ].map(sk => {
                const isSelected = selectedSkillId === sk.id;
                return (
                  <div
                    key={sk.id}
                    className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                      isSelected
                        ? isLight ? 'bg-white border-amber-400 ring-2 ring-amber-300/40 shadow-md' : 'bg-[#18181c] border-amber-400/60 ring-2 ring-amber-400/20'
                        : isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141417] border-outline/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        </div>
                        <h4 className="font-bold text-sm text-on-surface">{sk.name}</h4>
                      </div>

                      <p className="text-xs text-on-surface-variant mt-2.5 leading-relaxed font-sans">
                        {sk.desc}
                      </p>

                      <div className="mt-3.5 space-y-1.5">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                          Sample Runbook Prompts:
                        </div>
                        {sk.suggestedPrompts.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              if (onPrepopulatePrompt) onPrepopulatePrompt(p);
                              if (onSelectSkill) onSelectSkill(sk.id);
                              onOpenChat();
                            }}
                            className={`w-full p-2 rounded-xl text-left text-[11px] font-mono transition-all flex items-start gap-2 cursor-pointer ${
                              isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200' : 'bg-surface-container-low/40 hover:bg-surface-container-low text-on-surface border border-outline/10'
                            }`}
                          >
                            <ArrowRight className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{p}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline/10 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-on-surface-variant">One-Click Execute</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onPrepopulatePrompt && sk.suggestedPrompts[0]) {
                            onPrepopulatePrompt(sk.suggestedPrompts[0]);
                          }
                          if (onSelectSkill) onSelectSkill(sk.id);
                          onOpenChat();
                        }}
                        className={`h-7 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                          isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-900' : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <span>Run in Chat</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
