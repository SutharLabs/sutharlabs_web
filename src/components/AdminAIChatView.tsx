import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  Square, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Code2, 
  Server, 
  Database, 
  Cpu, 
  FileCode, 
  Maximize2, 
  Minimize2, 
  X, 
  Terminal, 
  Bot, 
  User as UserIcon, 
  ExternalLink,
  Zap,
  Layers,
  ChevronRight,
  TrendingUp,
  LineChart,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { AIChatMessage, AIAgentPersona, AIArtifactItem, TerminalLog } from '../types';
import { 
  AGENT_PERSONAS, 
  fetchAIModels, 
  fetchAIHealth, 
  streamAIChat, 
  OllamaModelTag 
} from '../services/aiChatService';
import ConfirmModal, { ModalVariant } from './ConfirmModal';

interface AdminAIChatViewProps {
  logs?: TerminalLog[];
  onAddLog?: (log: TerminalLog) => void;
  userToken: string;
  theme?: 'light' | 'dark';
}

const INITIAL_PROMPTS = [
  {
    agentId: 'cloud-architect',
    title: 'Audit Oracle VM Resources',
    prompt: 'Review our Oracle Cloud multi-node fleet (VM1 AMD Micro at 137.23.61.191 with Postgres, and VM2 Ampere A1 ARM with 12GB RAM + 4GB swap). Suggest best practices to keep both nodes 100% stable and exempt from idle reclamation.'
  },
  {
    agentId: 'database-architect',
    title: 'PostgreSQL Memory Tuning',
    prompt: 'Provide a production-tuned postgresql.conf snippet for an AMD Micro instance with 1 GB physical RAM and 2 GB swap running PostgreSQL 16. Detail shared_buffers, work_mem, and max_connections.'
  },
  {
    agentId: 'software-engineer',
    title: 'Claude-Style Artifact Component',
    prompt: 'Write a TypeScript React component that parses markdown code blocks and extracts them into an interactive side-drawer with line numbers and a download button.'
  },
  {
    agentId: 'quant-analyst',
    title: 'Fibonacci Volatility Algorithm',
    prompt: 'Write a Python function to calculate Fibonacci retracement levels for a given stock price series, and explain the algorithmic complexity.'
  }
];

export const AdminAIChatView: React.FC<AdminAIChatViewProps> = ({
  onAddLog,
  userToken,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  // AI Fleet State
  const [availableModels, setAvailableModels] = useState<OllamaModelTag[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5:7b');
  const [selectedAgent, setSelectedAgent] = useState<AIAgentPersona>(AGENT_PERSONAS[0]);
  const [fleetHealth, setFleetHealth] = useState<{ status: string; node: string; engine: string; memory: string } | null>(null);

  // Chat State
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [streamBuffer, setStreamBuffer] = useState<string>('');

  // Claude Artifacts State
  const [artifacts, setArtifacts] = useState<AIArtifactItem[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<AIArtifactItem | null>(null);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState<boolean>(false);
  const [isArtifactFullscreen, setIsArtifactFullscreen] = useState<boolean>(false);

  // UI Helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subtext?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ModalVariant;
    isAlert?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const addLog = (source: string, message: string, type: 'INFO' | 'SUCCESS' | 'ALERT' | 'ERROR' = 'INFO') => {
    if (onAddLog) {
      onAddLog({
        source,
        message: `[${source}] ${message}`,
        type,
        timestamp: new Date().toLocaleTimeString()
      } as any);
    }
  };

  // 1. Initial Load of Models & Node Health
  useEffect(() => {
    async function init() {
      try {
        const [models, health] = await Promise.all([
          fetchAIModels(userToken).catch(() => []),
          fetchAIHealth().catch(() => null)
        ]);
        setAvailableModels(models);
        setFleetHealth(health);
        if (models.length > 0 && !models.some(m => m.name === selectedModel)) {
          setSelectedModel(models[0].name);
        }
      } catch (err: any) {
        console.error('Failed to init AI chat:', err);
      }
    }
    init();
  }, [userToken]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamBuffer]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputPrompt]);

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to extract code blocks into Claude-style artifacts
  const extractArtifactsFromContent = (content: string, messageId: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const found: AIArtifactItem[] = [];
    let match;
    let idx = 1;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2];
      const title = `${language.toUpperCase()} Artifact #${idx}`;
      found.push({
        id: `artifact-${messageId}-${idx}`,
        title,
        language,
        code,
        sourceMessageId: messageId,
        timestamp: new Date().toLocaleTimeString()
      });
      idx++;
    }

    if (found.length > 0) {
      setArtifacts((prev) => [...prev, ...found]);
      setActiveArtifact(found[0]);
      setIsArtifactPanelOpen(true);
    }
  };

  const handleAgentSelect = (agent: AIAgentPersona) => {
    setSelectedAgent(agent);
    setSelectedModel(agent.recommendedModel);
    addLog('AGENT', `Activated "${agent.name}" with recommended model ${agent.recommendedModel}`, 'INFO');
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      addLog('AGENT', 'Generation halted by user.', 'ALERT');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isGenerating) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setIsGenerating(true);
    setStreamBuffer('');

    // Prepare message history with agent system prompt
    const apiMessages = [
      { role: 'system' as const, content: selectedAgent.systemPrompt },
      ...newHistory.map(m => ({ role: m.role, content: m.content }))
    ];

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let fullGeneratedText = '';

    try {
      addLog('INFERENCE', `Sending inference query to ${selectedModel} on sutharlabs-prod...`, 'INFO');

      await streamAIChat({
        model: selectedModel,
        messages: apiMessages,
        token: userToken,
        signal: abortController.signal,
        onChunk: (chunk) => {
          fullGeneratedText += chunk;
          setStreamBuffer((prev) => prev + chunk);
        },
        onDone: (metrics) => {
          const assistantMsg: AIChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: fullGeneratedText,
            model: selectedModel,
            tokensGenerated: metrics.totalTokens,
            tokensPerSec: metrics.speedTokensPerSec,
            durationMs: metrics.durationMs,
            timestamp: new Date().toLocaleTimeString(),
            agentId: selectedAgent.id
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setStreamBuffer('');
          extractArtifactsFromContent(fullGeneratedText, assistantMsg.id);
          addLog('INFERENCE', `Inference complete. Generated ${metrics.totalTokens} tokens at ${metrics.speedTokensPerSec} tokens/sec (${(metrics.durationMs / 1000).toFixed(2)}s).`, 'SUCCESS');
        }
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        const errorMsg: AIChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Inference Error**: ${err.message || 'Unable to communicate with Oracle AI node.'}`,
          timestamp: new Date().toLocaleTimeString(),
          model: selectedModel
        };
        setMessages((prev) => [...prev, errorMsg]);
        addLog('INFERENCE', `Inference request failed: ${err.message}`, 'ERROR');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const promptClearChat = () => {
    setModalConfig({
      isOpen: true,
      title: 'Clear Conversation',
      message: 'Are you sure you want to clear this entire session history?',
      subtext: 'This will reset active chat logs and clear all extracted code artifacts.',
      confirmLabel: 'Clear Chat',
      cancelLabel: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        setMessages([]);
        setArtifacts([]);
        setActiveArtifact(null);
        setIsArtifactPanelOpen(false);
        setModalConfig(null);
        addLog('AGENT', 'Chat history and artifacts cleared.', 'INFO');
      }
    });
  };

  const downloadArtifactFile = (artifact: AIArtifactItem) => {
    const extMap: Record<string, string> = {
      python: 'py',
      py: 'py',
      javascript: 'js',
      typescript: 'ts',
      ts: 'ts',
      tsx: 'tsx',
      jsx: 'jsx',
      bash: 'sh',
      sh: 'sh',
      sql: 'sql',
      json: 'json',
      css: 'css',
      html: 'html',
      yaml: 'yml',
      yml: 'yml',
      markdown: 'md',
      md: 'md'
    };
    const ext = extMap[artifact.language.toLowerCase()] || 'txt';
    const filename = `${artifact.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.${ext}`;

    const blob = new Blob([artifact.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getAgentIcon = (iconName: string) => {
    switch (iconName) {
      case 'server': return <Server className="w-3.5 h-3.5 shrink-0" />;
      case 'database': return <Database className="w-3.5 h-3.5 shrink-0" />;
      case 'code': return <Code2 className="w-3.5 h-3.5 shrink-0" />;
      case 'line-chart': return <TrendingUp className="w-3.5 h-3.5 shrink-0" />;
      default: return <Sparkles className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      
      {/* 1. Header Toolbar */}
      <div className={`p-4 sm:p-5 border-b shrink-0 flex items-center justify-between gap-4 flex-wrap transition-colors ${
        isLight ? 'bg-white/90 border-slate-200' : 'bg-surface-container-low/40 border-outline/15'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                AI Agent Studio
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                132.226.190.125 (Live)
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Open-source Claude-style multi-agent aggregator on Ampere ARM A1 (12 GB RAM + 4 GB Swap)
            </p>
          </div>
        </div>

        {/* Action Controls & Model Switcher */}
        <div className="flex items-center gap-2.5 shrink-0 flex-nowrap">
          
          {/* Model Selector Dropdown */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-on-surface-variant hidden sm:inline">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isGenerating}
              className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 focus:border-sky-500'
                  : 'bg-[#201f21] border-[#3a494b]/40 text-[#00dbe7] focus:border-[#00dbe7]/60'
              }`}
            >
              <option value="qwen2.5:7b">Qwen 2.5 (7.6B Deep Reasoning)</option>
              <option value="gemma2:2b">Gemma 2 (2.6B Fast Synthesizer)</option>
              {availableModels
                .filter(m => m.name !== 'qwen2.5:7b' && m.name !== 'gemma2:2b')
                .map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
            </select>
          </div>

          {/* Toggle Artifacts Drawer */}
          {artifacts.length > 0 && (
            <button
              type="button"
              onClick={() => setIsArtifactPanelOpen(!isArtifactPanelOpen)}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isArtifactPanelOpen
                  ? isLight
                    ? 'bg-sky-500 text-white border-sky-600'
                    : 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/50'
                  : isLight
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span>Artifacts ({artifacts.length})</span>
            </button>
          )}

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={promptClearChat}
              disabled={isGenerating}
              className={`h-8 px-2.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
              title="Clear Conversation"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}

        </div>
      </div>

      {/* 2. Agent Personas Aggregator Bar */}
      <div className={`px-4 sm:px-6 py-2.5 border-b shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-none transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#121215] border-outline/10'
      }`}>
        <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-bold shrink-0 mr-1 flex items-center gap-1">
          <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          Agents:
        </span>
        {AGENT_PERSONAS.map((agent) => {
          const isSelected = selectedAgent.id === agent.id;
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => handleAgentSelect(agent)}
              className={`h-7 px-2.5 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shrink-0 select-none ${
                isSelected
                  ? isLight
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 font-bold shadow-sm'
                  : isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                    : 'bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline/10'
              }`}
              title={agent.description}
            >
              {getAgentIcon(agent.icon)}
              <span>{agent.name}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded uppercase ${
                isSelected 
                  ? 'bg-black/20 text-white' 
                  : isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/50'
              }`}>
                {agent.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Split-Pane Main Body (Chat + Claude Artifacts) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Chat Conversation */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-200 ${
          isArtifactPanelOpen && !isArtifactFullscreen ? 'lg:w-3/5' : 'w-full'
        }`}>
          
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            
            {/* Empty State Welcome Screen */}
            {messages.length === 0 && (
              <div className="max-w-2xl mx-auto my-8 space-y-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto shadow-sm">
                  <Bot className="w-7 h-7 text-[#00dbe7] shrink-0" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">
                    Welcome to SutharLabs Sovereign AI
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-1 max-w-md mx-auto">
                    Active Agent: <span className="text-[#00dbe7] font-semibold">{selectedAgent.name}</span> • Model: <span className="text-purple-400 font-semibold">{selectedModel}</span>
                  </p>
                </div>

                {/* Quick Starter Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  {INITIAL_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const targetAgent = AGENT_PERSONAS.find(a => a.id === p.agentId) || selectedAgent;
                        handleAgentSelect(targetAgent);
                        handleSendMessage(p.prompt);
                      }}
                      className={`p-3.5 rounded-xl border text-xs font-mono transition-all cursor-pointer text-left ${
                        isLight
                          ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
                          : 'bg-surface-container-low/40 hover:bg-surface-container-low border-outline/15 text-on-surface hover:border-[#00dbe7]/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[#00dbe7] mb-1">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{p.title}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2">
                        {p.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <Bot className="w-4 h-4 text-[#00dbe7] shrink-0" />
                    </div>
                  )}

                  <div className={`space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                    
                    {/* Header meta */}
                    <div className={`flex items-center gap-2 text-[10px] font-mono text-on-surface-variant ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-bold">{isUser ? 'You' : selectedAgent.name}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Content Bubble */}
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed transition-colors ${
                      isUser
                        ? isLight
                          ? 'bg-sky-500 text-white font-sans rounded-tr-xs shadow-sm'
                          : 'bg-[#00dbe7]/15 border border-[#00dbe7]/35 text-[#e5e1e4] font-sans rounded-tr-xs shadow-sm'
                        : isLight
                          ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-sm'
                          : 'bg-surface-container-low/60 border border-outline/15 text-[#e5e1e4] rounded-tl-xs'
                    }`}>
                      <div className="whitespace-pre-wrap font-sans text-xs">
                        {msg.content}
                      </div>

                      {/* Code Block Artifact Extract Action */}
                      {msg.content.includes('```') && (
                        <div className="pt-2 mt-2 border-t border-outline/10 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-on-surface-variant">
                            Contains code artifact
                          </span>
                          <button
                            type="button"
                            onClick={() => extractArtifactsFromContent(msg.content, msg.id)}
                            className="h-6 px-2 rounded text-[10px] font-mono font-bold bg-[#00dbe7]/10 hover:bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/30 flex items-center gap-1 cursor-pointer"
                          >
                            <Code2 className="w-3 h-3 shrink-0" />
                            <span>View in Artifact Panel</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Telemetry pill (Assistant only) */}
                    {!isUser && msg.tokensGenerated !== undefined && (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant pl-1 pt-0.5">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3 shrink-0" />
                          {msg.tokensPerSec} t/s
                        </span>
                        <span>•</span>
                        <span>{msg.tokensGenerated} tokens</span>
                        <span>•</span>
                        <span className="text-purple-400">{msg.model}</span>
                        <span>•</span>
                        <span>Oracle Mumbai</span>
                      </div>
                    )}

                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <UserIcon className="w-4 h-4 text-on-surface shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Streaming Response Bubble */}
            {isGenerating && (
              <div className="flex gap-3 max-w-3xl mr-auto justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 mt-1 animate-pulse shadow-xs">
                  <Bot className="w-4 h-4 text-[#00dbe7] shrink-0" />
                </div>
                <div className="space-y-1.5 items-start">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant">
                    <span className="font-bold text-[#00dbe7]">{selectedAgent.name}</span>
                    <span className="animate-pulse">is streaming tokens...</span>
                  </div>
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed transition-colors rounded-tl-xs ${
                    isLight ? 'bg-white border border-slate-200 text-slate-800' : 'bg-surface-container-low/60 border border-outline/15 text-[#e5e1e4]'
                  }`}>
                    <div className="whitespace-pre-wrap font-sans text-xs">
                      {streamBuffer || 'Thinking...'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className={`p-3 sm:p-4 border-t shrink-0 transition-colors ${
            isLight ? 'bg-white/95 border-slate-200' : 'bg-surface-container-low/50 border-outline/15'
          }`}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="max-w-3xl mx-auto relative"
            >
              <div className={`rounded-xl border p-2 flex flex-col gap-2 transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 focus-within:border-sky-500 shadow-xs' 
                  : 'bg-[#121215] border-[#3a494b]/40 focus-within:border-[#00dbe7]/60'
              }`}>
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask ${selectedAgent.name} (Enter to send, Shift+Enter for newline)...`}
                  rows={1}
                  className="w-full bg-transparent resize-none border-none outline-hidden text-xs font-sans text-on-surface placeholder:text-on-surface-variant/50 max-h-44 p-1"
                />

                <div className="flex items-center justify-between pt-1 border-t border-outline/10">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant">
                    <span className="text-[#00dbe7] font-semibold">{selectedModel}</span>
                    <span>•</span>
                    <span className="text-emerald-400">12GB RAM Node</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isGenerating ? (
                      <button
                        type="button"
                        onClick={handleStopGeneration}
                        className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!inputPrompt.trim()}
                        className="h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border border-[#00dbe7]/50 hover:border-[#00dbe7] transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className="w-3.5 h-3.5 shrink-0" />
                        <span>Send</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: Claude-Style Artifacts Studio Panel */}
        {isArtifactPanelOpen && activeArtifact && (
          <div className={`border-l flex flex-col transition-all duration-200 ${
            isArtifactFullscreen ? 'fixed inset-0 z-50 bg-background' : 'w-full lg:w-2/5'
          } ${
            isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#0e0e11] border-outline/15'
          }`}>
            
            {/* Artifact Panel Header */}
            <div className={`p-3.5 border-b shrink-0 flex items-center justify-between gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-surface-container-low/40 border-outline/15'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold font-mono text-on-surface truncate">
                    {activeArtifact.title}
                  </div>
                  <div className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1.5">
                    <span className="uppercase text-[#00dbe7] font-semibold">{activeArtifact.language}</span>
                    <span>•</span>
                    <span>Claude-Style Artifact</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeArtifact.code, activeArtifact.id)}
                  title="Copy Code"
                  className={`h-7 px-2.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1 cursor-pointer select-none ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                >
                  {copiedKey === activeArtifact.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{copiedKey === activeArtifact.id ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadArtifactFile(activeArtifact)}
                  title="Download File"
                  className={`h-7 px-2.5 rounded text-[11px] font-mono border transition-all flex items-center gap-1 cursor-pointer select-none ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
                  title={isArtifactFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  className={`h-7 w-7 rounded flex items-center justify-center border transition-all cursor-pointer ${
                    isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#201f21] border-[#3a494b]/40 text-on-surface'
                  }`}
                >
                  {isArtifactFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsArtifactPanelOpen(false)}
                  title="Close Panel"
                  className={`h-7 w-7 rounded flex items-center justify-center border transition-all cursor-pointer ${
                    isLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#201f21] border-[#3a494b]/40 text-on-surface hover:text-rose-400'
                  }`}
                >
                  <X className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>

            {/* Artifact Selector Tabs (If multiple) */}
            {artifacts.length > 1 && (
              <div className={`px-3 py-1.5 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/20 border-outline/10'
              }`}>
                {artifacts.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => setActiveArtifact(art)}
                    className={`h-6 px-2.5 rounded text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                      activeArtifact.id === art.id
                        ? isLight
                          ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300'
                          : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/40'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {art.title}
                  </button>
                ))}
              </div>
            )}

            {/* Code Content Viewer */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs select-all">
              <pre className={`p-4 rounded-xl border overflow-x-auto ${
                isLight 
                  ? 'bg-slate-100 border-slate-300 text-slate-900' 
                  : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
              }`}>
                <code>{activeArtifact.code}</code>
              </pre>
            </div>

          </div>
        )}

      </div>

      {/* Clear Confirmation Modal */}
      {modalConfig && (
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          subtext={modalConfig.subtext}
          confirmLabel={modalConfig.confirmLabel}
          cancelLabel={modalConfig.cancelLabel}
          variant={modalConfig.variant}
          isAlert={modalConfig.isAlert}
          theme={theme}
        />
      )}

    </div>
  );
};

export default AdminAIChatView;

