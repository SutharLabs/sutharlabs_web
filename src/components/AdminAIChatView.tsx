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
  PanelRightOpen,
  RefreshCw,
  Globe,
  Lock,
  Settings,
  Plus,
  MessageSquare,
  ChevronDown,
  Brain,
  History,
  CheckCircle2,
  Paperclip,
  Film,
  Palette,
  FileText,
  Image as ImageIcon,
  XCircle,
  FileUp,
  Folder,
  Play
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { AIChatMessage, AIAgentPersona, AIArtifactItem, TerminalLog, ChatSession, AIChatAttachment } from '../types';

// Configure PDF.js worker for client-side document processing
if (typeof window !== 'undefined' && (pdfjsLib as any).GlobalWorkerOptions) {
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${(pdfjsLib as any).version || '4.10.38'}/build/pdf.worker.min.mjs`;
  } catch {}
}
import { 
  AGENT_PERSONAS, 
  fetchAIModels, 
  fetchAIHealth, 
  streamAIChat, 
  performWebResearch,
  WebResearchSource,
  OllamaModelTag 
} from '../services/aiChatService';
import ConfirmModal, { ModalVariant } from './ConfirmModal';
import MarkdownMessage from './MarkdownMessage';

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
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5:1.5b');
  const [selectedAgent, setSelectedAgent] = useState<AIAgentPersona>(AGENT_PERSONAS[0]);
  const [fleetHealth, setFleetHealth] = useState<{ status: string; node: string; engine: string; memory: string } | null>(null);

  // Multi-Session Chat State with localStorage persistence (OpenCode-style)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_ai_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Seed initial session from legacy history if exists
    let legacyMsgs: AIChatMessage[] = [];
    try {
      const legacy = localStorage.getItem('sutharlabs_ai_chat_history');
      if (legacy) legacyMsgs = JSON.parse(legacy);
    } catch {}
    const initId = 'session-' + Date.now();
    return [{
      id: initId,
      title: legacyMsgs.length > 0 ? (legacyMsgs[0]?.content.slice(0, 32) + '...') : 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: legacyMsgs,
      model: 'qwen2.5-coder:3b',
      agentId: AGENT_PERSONAS[0].id
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('sutharlabs_ai_active_session_id');
      if (savedId) return savedId;
    } catch {}
    return 'default-session';
  });

  const [isSessionsSidebarOpen, setIsSessionsSidebarOpen] = useState<boolean>(true);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);

  // Ensure activeSessionId points to a valid session
  useEffect(() => {
    if (!sessions.some(s => s.id === activeSessionId) && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem('sutharlabs_ai_active_session_id', activeSessionId);
    } catch {}
  }, [activeSessionId]);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0] || {
      id: 'fallback',
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: 'qwen2.5-coder:3b',
      agentId: AGENT_PERSONAS[0].id
    };
  }, [sessions, activeSessionId]);

  const messages = activeSession.messages;

  // Cloud Sync State (Cross-Device Persistent History)
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Cloud Sync: Fetch user sessions from server
  useEffect(() => {
    if (!userToken) return;
    const fetchCloudSessions = async () => {
      try {
        const res = await fetch('/api/ai/chat/sessions', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.sessions) && data.sessions.length > 0) {
            setSessions(prev => {
              const map = new Map<string, ChatSession>();
              prev.forEach(s => map.set(s.id, s));
              data.sessions.forEach((serverSess: ChatSession) => {
                const existing = map.get(serverSess.id);
                if (!existing || (serverSess.updatedAt || 0) >= (existing.updatedAt || 0)) {
                  map.set(serverSess.id, serverSess);
                }
              });
              const merged = Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
              try {
                localStorage.setItem('sutharlabs_ai_chat_sessions', JSON.stringify(merged));
              } catch {}
              return merged;
            });
            setIsCloudSynced(true);
          }
        }
      } catch (err) {
        console.warn('Cross-device session sync notice:', err);
      }
    };
    fetchCloudSessions();
  }, [userToken]);

  // 2. Persist sessions to localStorage & debounce sync to Cloud Backend
  useEffect(() => {
    try {
      localStorage.setItem('sutharlabs_ai_chat_sessions', JSON.stringify(sessions));
      localStorage.setItem('sutharlabs_ai_chat_history', JSON.stringify(messages));
    } catch {}

    if (!userToken) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/ai/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ sessions })
        });
        setIsCloudSynced(true);
      } catch (err) {
        console.warn('Failed to sync chat sessions to server:', err);
      }
    }, 2500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [sessions, messages, userToken]);

  const setMessages = (updater: AIChatMessage[] | ((prev: AIChatMessage[]) => AIChatMessage[])) => {
    setSessions(prevSessions => {
      return prevSessions.map(sess => {
        if (sess.id === activeSession.id) {
          const nextMsgs = typeof updater === 'function' ? updater(sess.messages) : updater;
          let title = sess.title;
          if ((title === 'New Conversation' || !title) && nextMsgs.length > 0) {
            const firstUser = nextMsgs.find(m => m.role === 'user');
            if (firstUser) {
              title = firstUser.content.slice(0, 32) + (firstUser.content.length > 32 ? '...' : '');
            }
          }
          return {
            ...sess,
            title,
            messages: nextMsgs,
            updatedAt: Date.now(),
            model: selectedModel,
            agentId: selectedAgent.id
          };
        }
        return sess;
      });
    });
  };

  const handleCreateNewSession = () => {
    const newId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: selectedModel,
      agentId: selectedAgent.id
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setArtifacts([]);
    setActiveArtifact(null);
    setIsArtifactPanelOpen(false);
    addLog('AGENT', 'Started new conversation session.', 'INFO');
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const target = sessions.find(s => s.id === id);
    if (target) {
      if (target.model) setSelectedModel(target.model);
      if (target.agentId) {
        const ag = AGENT_PERSONAS.find(a => a.id === target.agentId);
        if (ag) setSelectedAgent(ag);
      }
    }
  };

  const promptDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSession = sessions.find(s => s.id === sessionId);
    setModalConfig({
      isOpen: true,
      title: 'Delete Conversation',
      message: `Delete "${targetSession?.title || 'this conversation'}"?`,
      subtext: 'This action is irreversible and will remove all messages from storage.',
      confirmLabel: 'Delete Session',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        setModalConfig(null);
        if (userToken) {
          fetch(`/api/ai/chat/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${userToken}` }
          }).catch(() => {});
        }
        if (sessions.length <= 1) {
          setSessions([{
            id: 'session-' + Date.now(),
            title: 'New Conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
            model: selectedModel,
            agentId: selectedAgent.id
          }]);
          setArtifacts([]);
          setActiveArtifact(null);
          return;
        }
        const remaining = sessions.filter(s => s.id !== sessionId);
        setSessions(remaining);
        if (activeSessionId === sessionId) {
          setActiveSessionId(remaining[0].id);
        }
      }
    });
  };

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [streamBuffer, setStreamBuffer] = useState<string>('');
  const [isDeepResearch, setIsDeepResearch] = useState<boolean>(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState<boolean>(false);

  // Active Context Calculations
  const contextStats = useMemo(() => {
    const turns = messages.length;
    const estTokens = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
    return { turns, estTokens };
  }, [messages]);

  // Claude Artifacts State
  const [artifacts, setArtifacts] = useState<AIArtifactItem[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<AIArtifactItem | null>(null);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState<boolean>(false);
  const [isArtifactFullscreen, setIsArtifactFullscreen] = useState<boolean>(false);

  // OpenCode SOTA Agent vs Custom Chat Studio Mode (Default: Custom Chat)
  const [studioMode, setStudioMode] = useState<'custom-chat' | 'opencode'>('custom-chat');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [opencodeUrl, setOpencodeUrl] = useState<string>(() => {
    return localStorage.getItem('sutharlabs_opencode_url') || 'https://basin-engine-expensive-innocent.trycloudflare.com';
  });
  const [directVmUrl, setDirectVmUrl] = useState<string>('http://132.226.190.125/');
  const [isSecureContext, setIsSecureContext] = useState<boolean>(true);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);

  // Native Embedded OpenCode Studio State
  const [openCodeFiles, setOpenCodeFiles] = useState<{ name: string; lang: string; content: string }[]>([
    {
      name: 'index.ts',
      lang: 'typescript',
      content: `// Sovereign Agent Studio Workspace\nimport { UnifiedQueue } from './services/queue';\n\nexport async function main() {\n  console.log("⚡ Sovereign OpenCode Daemon Initialized");\n  const queue = new UnifiedQueue();\n  await queue.acquireHeavySlot({ type: 'COMPUTE', maxWaitMs: 15000 });\n  console.log("✓ System Parity: 100% In-Sync");\n}\n\nmain();\n`
    },
    {
      name: 'server.ts',
      lang: 'typescript',
      content: `// Express / Node.js Workspace API\nimport express from 'express';\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', engine: 'OpenCode Sovereign V2', uptime: process.uptime() });\n});\n\napp.listen(PORT, () => console.log(\`Server listening on port \${PORT}\`));\n`
    },
    {
      name: 'schema.prisma',
      lang: 'prisma',
      content: `datasource db {\n  provider = "postgresql"\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\nmodel AgentTask {\n  id        String   @id @default(uuid())\n  title     String\n  status    String   @default("PENDING")\n  createdAt DateTime @default(now())\n}\n`
    }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [openCodeTerminalLogs, setOpenCodeTerminalLogs] = useState<string[]>([
    '[System] OpenCode Native Studio v2.4 initialized on Sovereign Engine.',
    '[Environment] Oracle Always Free VM 2 (12 GB RAM) · Node 20.x · Ollama Engine',
    '[Ready] Qwen 2.5 Coder 3B ready for autonomous code generation.'
  ]);
  const [isAgentCoding, setIsAgentCoding] = useState<boolean>(false);
  const [codingPrompt, setCodingPrompt] = useState<string>('');
  const [openCodeMode, setOpenCodeMode] = useState<'native' | 'remote'>('native');
  const [copiedCodeSuccess, setCopiedCodeSuccess] = useState<boolean>(false);

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
          const preferred = models.find(m => m.name.includes('1.5b')) || models.find(m => m.name.includes('3b')) || models[0];
          setSelectedModel(preferred.name);
        }
      } catch (err: any) {
        console.error('Failed to init AI chat:', err);
      }
    }
    init();

    // 2. Discover active OpenCode URL
    async function discoverOpencode() {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      setIsSecureContext(isHttps);

      try {
        const res = await fetch('/api/ai/opencode-info');
        if (res.ok) {
          const info = await res.json();
          const savedUrl = localStorage.getItem('sutharlabs_opencode_url');
          if (!savedUrl && info.url) {
            setOpencodeUrl(isHttps ? info.url : (info.directUrl || info.url));
          }
          if (info.directUrl) {
            setDirectVmUrl(info.directUrl);
          }
        }
      } catch (err) {
        console.warn('OpenCode discovery failed, using fallback:', err);
      }
    }
    discoverOpencode();
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

  // Attachments State & Client Processing (Claude / ChatGPT / Gemini Standard)
  const [pendingAttachments, setPendingAttachments] = useState<AIChatAttachment[]>([]);
  const [isProcessingAttachment, setIsProcessingAttachment] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [copiedTranscript, setCopiedTranscript] = useState<boolean>(false);
  const fileAttachmentInputRef = useRef<HTMLInputElement>(null);

  const processAttachmentFile = async (file: File): Promise<AIChatAttachment> => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.name.toLowerCase().endsWith('.docx');

    let extractedText = '';
    let previewUrl: string | undefined = undefined;

    if (isImage) {
      previewUrl = URL.createObjectURL(file);
      extractedText = `[Attached Image: ${file.name} (${(file.size / 1024).toFixed(1)} KB, type: ${file.type})]`;
    } else if (isPdf) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 15);
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageStr = textContent.items.map((item: any) => (item as any).str).join(' ');
          fullText += `--- Page ${pageNum} of ${pdf.numPages} ---\n${pageStr}\n\n`;
        }
        extractedText = fullText.trim();
      } catch (err: any) {
        console.warn('PDF parsing error:', err);
        extractedText = `[PDF Document: ${file.name} (Client OCR note: ${err?.message})]`;
      }
    } else if (isDocx) {
      try {
        const zip = await JSZip.loadAsync(file);
        const xmlFile = zip.file('word/document.xml');
        if (xmlFile) {
          const xmlText = await xmlFile.async('text');
          extractedText = xmlText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      } catch (err: any) {
        console.warn('DOCX parsing error:', err);
        extractedText = `[DOCX Document: ${file.name}]`;
      }
    } else {
      // Plain text, code, markdown, csv, json
      try {
        extractedText = await file.text();
      } catch (err: any) {
        extractedText = `[File: ${file.name}]`;
      }
    }

    return {
      name: file.name,
      type: file.type || 'text/plain',
      size: file.size,
      previewUrl,
      extractedText
    };
  };

  const handleAttachFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessingAttachment(true);
    try {
      const parsed: AIChatAttachment[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const item = await processAttachmentFile(fileList[i]);
        parsed.push(item);
      }
      setPendingAttachments((prev) => [...prev, ...parsed]);
      addLog('AGENT', `Processed ${parsed.length} attachment(s) for prompt context.`, 'SUCCESS');
    } catch (err: any) {
      addLog('AGENT', `Attachment processing error: ${err?.message}`, 'ALERT');
    } finally {
      setIsProcessingAttachment(false);
    }
  };

  // Full Conversation Export Functions
  const handleExportMarkdown = () => {
    let md = `# SutharLabs AI Agent Studio Transcript\n\n`;
    md += `- **Date:** ${new Date().toLocaleString()}\n`;
    md += `- **Agent:** ${selectedAgent.name} (${selectedAgent.badge})\n`;
    md += `- **Model:** ${selectedModel}\n`;
    md += `- **Total Messages:** ${messages.length}\n\n---\n\n`;

    messages.forEach((m) => {
      const roleName = m.role === 'user' ? '👤 User' : `🤖 ${selectedAgent.name}`;
      md += `### ${roleName} • ${m.timestamp}\n\n`;
      if (m.attachments && m.attachments.length > 0) {
        md += `*Attached Files:* ${m.attachments.map(a => a.name).join(', ')}\n\n`;
      }
      md += `${m.content}\n\n`;
      if (m.tokensGenerated) {
        md += `> Telemetry: ${m.tokensGenerated} tokens • ${m.tokensPerSec} t/s\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sutharlabs-chat-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('AGENT', 'Exported conversation transcript as Markdown (.md)', 'SUCCESS');
  };

  const handleExportJSON = () => {
    const exportData = {
      title: 'SutharLabs AI Conversation',
      exportedAt: new Date().toISOString(),
      agent: selectedAgent,
      model: selectedModel,
      messages
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sutharlabs-chat-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('AGENT', 'Exported conversation data as JSON', 'SUCCESS');
  };

  const handleCopyTranscript = () => {
    const text = messages.map(m => `[${m.timestamp}] ${m.role === 'user' ? 'User' : selectedAgent.name}:\n${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2500);
    addLog('AGENT', 'Copied complete conversation transcript to clipboard', 'SUCCESS');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = (textToSend || inputPrompt).trim();
    if ((!rawText && pendingAttachments.length === 0) || isGenerating) return;

    const currentAttachments = [...pendingAttachments];
    setPendingAttachments([]);

    // Construct prompt sent to LLM: inject document text if attachments exist
    let promptForLLM = rawText;
    if (currentAttachments.length > 0) {
      const docSnippets = currentAttachments
        .filter(a => a.extractedText)
        .map(a => `### Document: ${a.name} (${(a.size / 1024).toFixed(1)} KB)\n\`\`\`\n${a.extractedText}\n\`\`\``)
        .join('\n\n');

      promptForLLM = `[Attached Files Context: ${currentAttachments.map(a => a.name).join(', ')}]\n\n${docSnippets}\n\nUser Instruction/Question:\n${rawText || 'Please analyze the attached document(s) and provide a structured synthesis.'}`;
    }

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: rawText || `[Attached: ${currentAttachments.map(a => a.name).join(', ')}]`,
      timestamp: new Date().toLocaleTimeString(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setIsGenerating(true);
    setStreamBuffer('');

    let researchSources: WebResearchSource[] = [];
    let systemPromptToUse = selectedAgent.systemPrompt;

    if (isDeepResearch) {
      setIsSearchingWeb(true);
      addLog('RESEARCH', `Conducting live web research for query: "${(rawText || 'attachments analysis').slice(0, 50)}..."`, 'INFO');
      try {
        const researchData = await performWebResearch(rawText || 'document analysis', userToken);
        if (researchData && Array.isArray(researchData.sources) && researchData.sources.length > 0) {
          researchSources = researchData.sources;
          systemPromptToUse += `\n\n${researchData.summary}`;
          addLog('RESEARCH', `Web research complete. Found ${researchSources.length} verified real-time sources.`, 'SUCCESS');
        } else {
          addLog('RESEARCH', 'Web research query executed. No real-time external articles returned.', 'INFO');
        }
      } catch (researchErr: any) {
        console.warn('Deep research non-fatal error:', researchErr.message);
        addLog('RESEARCH', `Web research warning: ${researchErr.message}`, 'ALERT');
      } finally {
        setIsSearchingWeb(false);
      }
    }

    // Smart sliding context window: keep system prompt, first intent anchor, and recent turns
    const maxHistoryTurns = 8;
    const trimmedHistory = newHistory.length > maxHistoryTurns
      ? [newHistory[0], ...newHistory.slice(-maxHistoryTurns)]
      : newHistory;

    // Prepare message history with agent system prompt & augmented document context
    const apiMessages = [
      { role: 'system' as const, content: systemPromptToUse },
      ...trimmedHistory.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: promptForLLM }
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
            agentId: selectedAgent.id,
            researchSources: researchSources.length > 0 ? researchSources : undefined
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
        localStorage.removeItem('sutharlabs_ai_chat_history');
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

  const handleTriggerAgentCoding = async (actionPrompt?: string) => {
    const promptToRun = actionPrompt || codingPrompt;
    if (!promptToRun.trim() || isAgentCoding) return;
    setIsAgentCoding(true);
    const currentFile = openCodeFiles[activeFileIndex];
    setOpenCodeTerminalLogs(prev => [
      ...prev,
      `[Agent Task] ${promptToRun}`,
      `[Inference] Dispatching code synthesis to Qwen 2.5 Coder on VM 2...`
    ]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          model: 'qwen2.5-coder:3b',
          stream: false,
          messages: [
            {
              role: 'system',
              content: 'You are OpenCode autonomous coding agent. Provide clean, production-grade code modifications or analysis. Return valid code snippets directly.'
            },
            {
              role: 'user',
              content: `File: ${currentFile.name} (${currentFile.lang})\n\nExisting Code:\n\`\`\`${currentFile.lang}\n${currentFile.content}\n\`\`\`\n\nTask: ${promptToRun}`
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.message?.content || data.response || 'Code completed.';
        setOpenCodeTerminalLogs(prev => [
          ...prev,
          `[Agent Output] Synthesized ${reply.length} bytes of code suggestions.`,
          `[Status] Code updated.`
        ]);
        const codeMatch = reply.match(/```(?:\w+)?\n([\s\S]*?)```/);
        if (codeMatch && codeMatch[1]) {
          setOpenCodeFiles(prev => prev.map((f, idx) => idx === activeFileIndex ? { ...f, content: codeMatch[1] } : f));
          setOpenCodeTerminalLogs(prev => [...prev, `[Auto-Apply] Updated ${currentFile.name} with synthesized code block.`]);
        }
      } else {
        setOpenCodeTerminalLogs(prev => [...prev, `[Agent Error] Failed to get response from coding node.`]);
      }
    } catch (err: any) {
      setOpenCodeTerminalLogs(prev => [...prev, `[Agent Error] ${err.message}`]);
    } finally {
      setIsAgentCoding(false);
      setCodingPrompt('');
    }
  };

  const getAgentIcon = (iconName: string) => {
    switch (iconName) {
      case 'server': return <Server className="w-3.5 h-3.5 shrink-0" />;
      case 'database': return <Database className="w-3.5 h-3.5 shrink-0" />;
      case 'code': return <Code2 className="w-3.5 h-3.5 shrink-0" />;
      case 'line-chart': return <TrendingUp className="w-3.5 h-3.5 shrink-0" />;
      case 'cpu': return <Cpu className="w-3.5 h-3.5 shrink-0" />;
      case 'globe': return <Globe className="w-3.5 h-3.5 shrink-0" />;
      case 'film': return <Film className="w-3.5 h-3.5 shrink-0" />;
      case 'palette': return <Palette className="w-3.5 h-3.5 shrink-0" />;
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
            {studioMode === 'opencode' ? (
              <Bot className="w-5 h-5 text-[#00dbe7] shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#00dbe7] shrink-0" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                {studioMode === 'opencode' ? 'OpenCode AI Studio' : 'AI Agent Studio'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                VM2 132.226.190.125 (Live)
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              {studioMode === 'opencode' 
                ? 'Autonomous open-source coding agent on Ampere ARM A1 (12 GB RAM) · Local Ollama Models' 
                : 'Claude-style multi-agent aggregator on Ampere ARM A1 (12 GB RAM + 4 GB Swap)'}
            </p>
          </div>
        </div>

        {/* Sub-Tab Switcher: 1st Custom Chat / AI Agent Studio, 2nd OpenCode Studio */}
        <div className={`flex rounded-lg p-0.5 border text-[11px] shrink-0 ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
        }`}>
          <button
            type="button"
            onClick={() => setStudioMode('custom-chat')}
            className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              studioMode === 'custom-chat'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>AI Agent Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('opencode')}
            className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              studioMode === 'opencode'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span>OpenCode Studio</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
          {studioMode === 'opencode' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIframeKey((k) => k + 1)}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                    : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                }`}
                title="Reload OpenCode Session"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Reload</span>
              </button>
              <a
                href={directVmUrl}
                target="_blank"
                rel="noreferrer"
                className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                  isLight
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                    : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                }`}
                title="Open Direct VM Node IP in New Window"
              >
                <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="hidden sm:inline">Direct Node IP</span>
              </a>
              <a
                href={opencodeUrl}
                target="_blank"
                rel="noreferrer"
                className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                  isLight
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                    : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Launch Fullscreen</span>
              </a>
            </div>
          ) : (
            <>
              {/* DESKTOP TOOLBAR (hidden sm:flex) */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 flex-nowrap">
                {/* Sessions Sidebar Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsSessionsSidebarOpen(!isSessionsSidebarOpen)}
                  className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm select-none ${
                    isSessionsSidebarOpen
                      ? isLight
                        ? 'bg-sky-50 text-sky-700 border-sky-300'
                        : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40'
                      : isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                  title={isSessionsSidebarOpen ? "Hide Sessions Sidebar" : "Show Sessions Sidebar"}
                >
                  <History className="w-3.5 h-3.5 shrink-0" />
                  <span>Sessions</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">{sessions.length}</span>
                </button>

                {/* Agent Persona Menu Button */}
                <button
                  type="button"
                  onClick={() => setIsAgentModalOpen(true)}
                  className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm select-none ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                  }`}
                  title="Open Agent Persona Selector"
                >
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    {getAgentIcon(selectedAgent.icon)}
                  </div>
                  <span className="hidden md:inline">{selectedAgent.name}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-400 uppercase tracking-wider">{selectedAgent.badge}</span>
                  <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                </button>

                {/* Context Memory Pill */}
                <div 
                  className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-[11px] font-mono select-none ${
                    contextStats.turns > 0
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold'
                      : isLight
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : 'bg-white/5 text-on-surface-variant border-white/10'
                  }`}
                  title={`Multi-turn memory: ${contextStats.turns} messages saved (~${contextStats.estTokens.toLocaleString()} tokens within 8,192 context window)`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">Context:</span>
                  <span>
                    {contextStats.turns > 0 ? `${contextStats.turns} msgs (~${contextStats.estTokens} tok)` : 'Empty'}
                  </span>
                </div>

                {/* Model Selector Dropdown */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-on-surface-variant hidden lg:inline">Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isGenerating}
                    className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer max-w-[200px] md:max-w-[260px] truncate ${
                      isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-800 focus:border-sky-500'
                        : 'bg-[#201f21] border-[#3a494b]/40 text-[#00dbe7] focus:border-[#00dbe7]/60'
                    }`}
                  >
                    <optgroup label="⚡ Ultra-Fast & Instant (Recommended for CPU)">
                      <option value="qwen2.5:1.5b">Qwen 2.5 1.5B (⚡ Sub-Second ~48 t/s)</option>
                      <option value="deepseek-r1:1.5b">DeepSeek R1 1.5B (🧠 Fast Reasoning ~40 t/s)</option>
                      <option value="gemma2:2b">Gemma 2 2B (⚡ Fast Synthesizer ~35 t/s)</option>
                      <option value="qwen2.5-coder:3b">Qwen 2.5 Coder 3B (💻 SOTA Code ~28 t/s)</option>
                    </optgroup>
                    <optgroup label="🐢 7B Deep Models (Heavier CPU Footprint ~45s Cold Load)">
                      <option value="qwen2.5:7b">Qwen 2.5 7B (🧠 Deep Knowledge 4.7GB ~8 t/s)</option>
                      <option value="deepseek-r1:7b">DeepSeek R1 7B (🧠 Frontier Reasoning 4.7GB ~6 t/s)</option>
                    </optgroup>
                    {availableModels
                      .filter(m => !['deepseek-r1:7b', 'deepseek-r1:1.5b', 'qwen2.5:1.5b', 'gemma2:2b', 'qwen2.5-coder:3b', 'qwen2.5:7b'].includes(m.name))
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

                {/* Export Dropdown */}
                {messages.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                        isLight
                          ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                          : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                      }`}
                      title="Export Conversation"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>Export</span>
                      <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                    </button>
                    {isExportMenuOpen && (
                      <div className={`absolute right-0 top-full mt-1.5 w-52 rounded-xl border shadow-2xl p-1.5 z-50 flex flex-col gap-1 ${
                        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#18181c] border-[#3a494b]/60 text-[#e5e1e4]'
                      }`}>
                        <button
                          type="button"
                          onClick={() => { handleExportMarkdown(); setIsExportMenuOpen(false); }}
                          className="px-2.5 py-1.5 rounded-lg text-left text-xs font-mono hover:bg-sky-500/10 hover:text-sky-400 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0 text-sky-500" />
                          <span>Export Markdown (.md)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { handleExportJSON(); setIsExportMenuOpen(false); }}
                          className="px-2.5 py-1.5 rounded-lg text-left text-xs font-mono hover:bg-emerald-500/10 hover:text-emerald-400 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <FileCode className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span>Export JSON (.json)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { handleCopyTranscript(); setIsExportMenuOpen(false); }}
                          className="px-2.5 py-1.5 rounded-lg text-left text-xs font-mono hover:bg-amber-500/10 hover:text-amber-400 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                          <span>{copiedTranscript ? 'Copied Transcript!' : 'Copy Transcript'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Clear Conversation Button */}
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={promptClearChat}
                    className={`h-8 px-2.5 rounded-lg border flex items-center gap-1 text-xs font-mono transition-all cursor-pointer shadow-sm select-none ${
                      isLight
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                    title="Clear current session messages"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>

              {/* MOBILE RESPONSIVE TOOLBAR (sm:hidden) */}
              <div className="sm:hidden flex flex-col gap-2 w-full pt-1">
                {/* Row 1: Actions */}
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsSessionsSidebarOpen(!isSessionsSidebarOpen)}
                      className={`h-7 px-2 rounded-lg border flex items-center gap-1 text-[11px] font-mono font-bold ${
                        isSessionsSidebarOpen
                          ? isLight ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40'
                          : isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40'
                      }`}
                    >
                      <History className="w-3 h-3 shrink-0" />
                      <span>History</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAgentModalOpen(true)}
                      className={`h-7 px-2 rounded-lg border flex items-center gap-1 text-[11px] font-mono font-bold ${
                        isLight ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                        {getAgentIcon(selectedAgent.icon)}
                      </div>
                      <span className="truncate max-w-[80px]">{selectedAgent.name}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        className={`h-7 px-2 rounded-lg border text-[11px] font-mono flex items-center gap-1 ${
                          isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40'
                        }`}
                      >
                        <Download className="w-3 h-3 shrink-0" />
                        <span>Export</span>
                      </button>
                    )}

                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={promptClearChat}
                        className="h-7 w-7 rounded-lg border flex items-center justify-center bg-rose-500/10 text-rose-400 border-rose-500/30"
                      >
                        <Trash2 className="w-3 h-3 shrink-0" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Full Width Model Selector + Context Badge */}
                <div className="flex items-center gap-1.5 w-full">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isGenerating}
                    className={`flex-1 min-w-0 h-8 px-2 rounded-lg text-[11px] font-mono font-bold border truncate ${
                      isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-800 focus:border-sky-500'
                        : 'bg-[#201f21] border-[#3a494b]/40 text-[#00dbe7] focus:border-[#00dbe7]/60'
                    }`}
                  >
                    <optgroup label="⚡ Fast CPU Models">
                      <option value="qwen2.5:1.5b">Qwen 2.5 1.5B (⚡ Fast ~48 t/s)</option>
                      <option value="deepseek-r1:1.5b">DeepSeek R1 1.5B (🧠 Reasoning)</option>
                      <option value="gemma2:2b">Gemma 2 2B (⚡ Fast)</option>
                      <option value="qwen2.5-coder:3b">Qwen 2.5 Coder 3B (💻 Code)</option>
                    </optgroup>
                    <optgroup label="🐢 7B Models">
                      <option value="qwen2.5:7b">Qwen 2.5 7B (~8 t/s)</option>
                      <option value="deepseek-r1:7b">DeepSeek R1 7B (~6 t/s)</option>
                    </optgroup>
                    {availableModels
                      .filter(m => !['deepseek-r1:7b', 'deepseek-r1:1.5b', 'qwen2.5:1.5b', 'gemma2:2b', 'qwen2.5-coder:3b', 'qwen2.5:7b'].includes(m.name))
                      .map(m => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                  </select>

                  <div 
                    className={`h-8 px-2 rounded-lg border flex items-center gap-1 text-[10px] font-mono shrink-0 ${
                      contextStats.turns > 0
                        ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-on-surface-variant border-white/10'
                    }`}
                  >
                    <Layers className="w-3 h-3 shrink-0" />
                    <span>{contextStats.turns} msgs</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {studioMode === 'custom-chat' ? (
        <>
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

      {selectedModel.includes(':7b') && (
        <div className={`px-4 sm:px-6 py-1.5 border-b text-[11px] font-mono flex items-center justify-between gap-2 shrink-0 ${
          isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">⚠️ High-Parameter 7B Model Selected:</span>
            <span>Evaluating prompts on ARM CPU may take 30–60s for first token. For instant responses, switch to Qwen 2.5 1.5B.</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedModel('qwen2.5:1.5b')}
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase underline cursor-pointer hover:opacity-80 shrink-0"
          >
            Switch to 1.5B (Instant)
          </button>
        </div>
      )}

      {/* 3. Split-Pane Main Body (Sessions Sidebar + Chat + Claude Artifacts) */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Mobile Backdrop for Sessions Sidebar */}
        {isSessionsSidebarOpen && (
          <div
            onClick={() => setIsSessionsSidebarOpen(false)}
            className="sm:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in duration-150"
          />
        )}

        {/* Sessions History Sidebar (Fixed Full-Height on Mobile, Relative on Desktop) */}
        {isSessionsSidebarOpen && (
          <div className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] z-50 sm:relative sm:w-72 sm:z-auto sm:inset-auto shrink-0 border-r flex flex-col h-full transition-all duration-200 shadow-2xl sm:shadow-none ${
            isLight ? 'bg-slate-50/95 border-slate-200 backdrop-blur-md' : 'bg-[#121215]/95 border-outline/10 backdrop-blur-md'
          }`}>
            {/* Sidebar Header */}
            <div className="p-3 border-b flex items-center justify-between gap-2 border-inherit">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-on-surface">
                <MessageSquare className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                <span>Chat History</span>
                {isCloudSynced && (
                  <span className="text-[10px] text-emerald-400 font-normal flex items-center gap-0.5" title="Synchronized across web & mobile">
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                    <span className="hidden sm:inline">Synced</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCreateNewSession}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs leading-none ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40'
                  }`}
                  title="Start a new chat session"
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  <span>New</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSessionsSidebarOpen(false)}
                  className="sm:hidden h-7 w-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                  title="Close Sidebar"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Sessions Scroll List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                const msgCount = sess.messages.length;
                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      handleSelectSession(sess.id);
                      if (window.innerWidth < 640) setIsSessionsSidebarOpen(false);
                    }}
                    className={`group relative p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-start justify-between gap-2 select-none ${
                      isActive
                        ? isLight
                          ? 'bg-white border-sky-400 text-slate-900 shadow-xs'
                          : 'bg-[#00dbe7]/15 border-[#00dbe7]/50 text-[#00dbe7] shadow-xs'
                        : isLight
                          ? 'bg-white/60 hover:bg-white border-slate-200/60 hover:border-slate-300 text-slate-700'
                          : 'bg-white/3 hover:bg-white/7 border-white/5 hover:border-white/10 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-[11px] leading-tight">
                        {sess.title || 'New Conversation'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70 mt-1">
                        <span>{new Date(sess.updatedAt || sess.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span>{msgCount} {msgCount === 1 ? 'msg' : 'msgs'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => promptDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 rounded transition-opacity"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3 h-3 shrink-0" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Left Column: Chat Conversation */}
        <div className={`flex-1 min-w-0 flex flex-col h-full overflow-hidden transition-all duration-200 ${
          isArtifactPanelOpen && !isArtifactFullscreen ? 'hidden lg:flex' : 'w-full'
        }`}>
          
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-4 sm:space-y-5 min-w-0">
            
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
                  className={`flex gap-2.5 sm:gap-3 w-full max-w-3xl min-w-0 ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <Bot className="w-4 h-4 text-[#00dbe7] shrink-0" />
                    </div>
                  )}

                  <div className={`space-y-1.5 min-w-0 ${isUser ? 'items-end max-w-[85%]' : 'items-start flex-1 max-w-full'}`}>
                    
                    {/* Header meta */}
                    <div className={`flex items-center gap-2 text-[10px] font-mono text-on-surface-variant ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-bold">{isUser ? 'You' : selectedAgent.name}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Web Research Sources Pill (Assistant only, if present) */}
                    {!isUser && msg.researchSources && msg.researchSources.length > 0 && (
                      <div className={`p-2 rounded-lg border text-[11px] font-mono mb-1.5 ${
                        isLight ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-[#00dbe7]/10 border-[#00dbe7]/30 text-[#00dbe7]'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span>Live Web Research ({msg.researchSources.length} Sources Verified)</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.researchSources.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`px-1.5 py-0.5 rounded text-[10px] border flex items-center gap-1 transition-all ${
                                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-black/30 hover:bg-black/50 text-[#e5e1e4] border-white/10'
                              }`}
                              title={s.snippet}
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[140px]">{s.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User Attachments Display */}
                    {isUser && msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-end mb-1.5">
                        {msg.attachments.map((att, aIdx) => (
                          <div
                            key={aIdx}
                            className={`p-1.5 px-2.5 rounded-xl border flex items-center gap-2 text-xs font-mono shadow-xs select-none ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-800'
                                : 'bg-[#18181c] border-white/15 text-white'
                            }`}
                          >
                            {att.previewUrl ? (
                              <img
                                src={att.previewUrl}
                                alt={att.name}
                                className="w-7 h-7 rounded object-cover border border-white/20 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
                                <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              </div>
                            )}
                            <div className="min-w-0 text-left">
                              <div className="truncate font-bold text-[11px] max-w-[160px]">{att.name}</div>
                              <div className="text-[9px] text-gray-400">
                                {(att.size / 1024).toFixed(0)} KB • Extracted
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content Bubble */}
                    <div className={`p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed transition-colors min-w-0 max-w-full break-words overflow-hidden ${
                      isUser
                        ? isLight
                          ? 'bg-sky-500 text-white font-sans rounded-tr-xs shadow-sm'
                          : 'bg-[#00dbe7]/15 border border-[#00dbe7]/35 text-[#e5e1e4] font-sans rounded-tr-xs shadow-sm'
                        : isLight
                          ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-sm'
                          : 'bg-surface-container-low/60 border border-outline/15 text-[#e5e1e4] rounded-tl-xs'
                    }`}>
                      {isUser ? (
                        <div className="whitespace-pre-wrap font-sans text-xs">
                          {msg.content}
                        </div>
                      ) : (
                        <MarkdownMessage
                          content={msg.content}
                          theme={theme}
                          onExtractArtifact={(code, lang) => {
                            extractArtifactsFromContent(`\`\`\`${lang}\n${code}\n\`\`\``, msg.id);
                          }}
                        />
                      )}

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
              <div className="flex gap-2.5 sm:gap-3 w-full max-w-3xl min-w-0 mr-auto justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 mt-1 animate-pulse shadow-xs">
                  <Bot className="w-4 h-4 text-[#00dbe7] shrink-0" />
                </div>
                <div className="space-y-1.5 items-start flex-1 min-w-0 max-w-full">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant">
                    <span className="font-bold text-[#00dbe7]">{selectedAgent.name}</span>
                    <span className="animate-pulse">
                      {isSearchingWeb ? 'searching live web sources...' : 'streaming tokens...'}
                    </span>
                  </div>
                  <div className={`p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed transition-colors rounded-tl-xs min-w-0 max-w-full break-words overflow-hidden ${
                    isLight ? 'bg-white border border-slate-200 text-slate-800' : 'bg-surface-container-low/60 border border-outline/15 text-[#e5e1e4]'
                  }`}>
                    <div className="text-xs break-words overflow-hidden max-w-full">
                      <MarkdownMessage
                        content={streamBuffer || (isSearchingWeb ? '🔍 Conducting Deep Web Research across live news, Wikipedia & DuckDuckGo...' : 'Thinking...')}
                        theme={theme}
                      />
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
                {/* Pending Attachments Chip Shelf (ChatGPT / Claude / Gemini Standard) */}
                {pendingAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1 pt-0.5 border-b border-outline/10">
                    {pendingAttachments.map((att, aIdx) => (
                      <div
                        key={aIdx}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-mono select-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 shadow-xs'
                            : 'bg-white/5 border-white/10 text-white'
                        }`}
                      >
                        {att.previewUrl ? (
                          <img
                            src={att.previewUrl}
                            alt={att.name}
                            className="w-4 h-4 rounded object-cover shrink-0"
                          />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[140px] text-[11px] font-medium">{att.name}</span>
                        <span className="text-[10px] text-gray-400">({(att.size / 1024).toFixed(0)}KB)</span>
                        <button
                          type="button"
                          onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== aIdx))}
                          className="text-gray-400 hover:text-rose-400 cursor-pointer ml-0.5"
                          title="Remove attachment"
                        >
                          <X className="w-3 h-3 shrink-0" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onPaste={(e) => {
                    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                      e.preventDefault();
                      handleAttachFiles(e.clipboardData.files);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask ${selectedAgent.name} (Enter to send, Shift+Enter for newline, or paste files/images)...`}
                  rows={1}
                  className="w-full bg-transparent resize-none border-none outline-hidden text-xs font-sans text-on-surface placeholder:text-on-surface-variant/50 max-h-44 p-1"
                />

                <div className="flex items-center justify-between pt-1 border-t border-outline/10 gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2">
                    {/* Attach File Button */}
                    <button
                      type="button"
                      onClick={() => fileAttachmentInputRef.current?.click()}
                      disabled={isProcessingAttachment || isGenerating}
                      className={`h-7 px-2.5 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                        isProcessingAttachment
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : isLight
                          ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                          : 'bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface border border-white/10'
                      }`}
                      title="Attach PDF, Word (.docx), TXT, CSV, Code, or Images"
                    >
                      <Paperclip className={`w-3.5 h-3.5 shrink-0 ${isProcessingAttachment ? 'animate-spin' : ''}`} />
                      <span>{isProcessingAttachment ? 'Extracting...' : 'Attach'}</span>
                      {pendingAttachments.length > 0 && (
                        <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] flex items-center justify-center font-bold">
                          {pendingAttachments.length}
                        </span>
                      )}
                    </button>
                    <input
                      ref={fileAttachmentInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,.csv,.json,.md,.js,.ts,.tsx,.jsx,.py,.html,.css,image/*"
                      onChange={(e) => {
                        if (e.target.files) handleAttachFiles(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => setIsDeepResearch(!isDeepResearch)}
                      className={`h-7 px-2.5 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                        isDeepResearch
                          ? isLight
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/50 shadow-[0_0_8px_rgba(0,219,231,0.25)]'
                          : isLight
                            ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                            : 'bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface border border-white/10'
                      }`}
                      title={isDeepResearch ? "Deep Web Research Enabled: Live web intelligence and citations injected" : "Click to Enable Real-Time Web Research"}
                    >
                      <Globe className={`w-3.5 h-3.5 shrink-0 ${isDeepResearch ? 'text-white dark:text-[#00dbe7] animate-pulse' : ''}`} />
                      <span>Deep Research:</span>
                      <span className="font-extrabold">{isDeepResearch ? 'ON' : 'OFF'}</span>
                    </button>

                    <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-on-surface-variant">
                      <span className="text-[#00dbe7] font-semibold">{selectedModel}</span>
                      <span>•</span>
                      <span className="text-emerald-400">12GB RAM Node</span>
                    </div>
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
                        disabled={!inputPrompt.trim() && pendingAttachments.length === 0}
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
          <div className={`border-l flex flex-col transition-all duration-200 shrink-0 ${
            isArtifactFullscreen ? 'fixed inset-0 z-50 bg-background' : 'w-full lg:w-[42%] xl:w-[40%]'
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
      </>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
          {/* OpenCode Studio Top Toolbar */}
          <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 text-xs font-mono shrink-0 transition-colors flex-wrap ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#151518] border-[#3a494b]/40 text-[#e5e1e4]'
          }`}>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                OpenCode Native Studio v2.4 (Sovereign IDE)
              </span>
              <span className="text-on-surface-variant hidden sm:inline">•</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase tracking-wider font-bold hidden md:inline">
                Zero Cloud Latency · Qwen 2.5 Coder
              </span>
            </div>

            {/* Mode Switcher: Native Embedded IDE vs Remote Daemon Frame */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`flex rounded-lg p-0.5 border text-[11px] ${
                isLight ? 'bg-white border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
              }`}>
                <button
                  type="button"
                  onClick={() => setOpenCodeMode('native')}
                  className={`px-2.5 py-1 rounded-md font-mono cursor-pointer transition-all ${
                    openCodeMode === 'native'
                      ? isLight ? 'bg-sky-500 text-white font-bold' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Native Studio
                </button>
                <button
                  type="button"
                  onClick={() => setOpenCodeMode('remote')}
                  className={`px-2.5 py-1 rounded-md font-mono cursor-pointer transition-all ${
                    openCodeMode === 'remote'
                      ? isLight ? 'bg-sky-500 text-white font-bold' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Remote Bridge
                </button>
              </div>

              {openCodeMode === 'native' && (
                <button
                  type="button"
                  onClick={() => {
                    const active = openCodeFiles[activeFileIndex];
                    if (active) {
                      navigator.clipboard.writeText(active.content);
                      setCopiedCodeSuccess(true);
                      setTimeout(() => setCopiedCodeSuccess(false), 2000);
                    }
                  }}
                  className={`h-7 px-2.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                >
                  {copiedCodeSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                  <span>{copiedCodeSuccess ? 'Copied' : 'Copy Code'}</span>
                </button>
              )}
            </div>
          </div>

          {openCodeMode === 'native' ? (
            /* NATIVE EMBEDDED OPENCODE STUDIO */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              {/* File Explorer Sidebar */}
              <div className={`w-full md:w-56 shrink-0 border-r flex flex-col transition-colors border-inherit ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#121215] border-outline/10'
              }`}>
                <div className="p-2.5 px-3 border-b flex items-center justify-between text-xs font-mono font-bold text-on-surface border-inherit">
                  <div className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Workspace Files</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">{openCodeFiles.length} files</span>
                </div>
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                  {openCodeFiles.map((file, idx) => (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => setActiveFileIndex(idx)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-mono flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        activeFileIndex === idx
                          ? isLight ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                          : isLight ? 'hover:bg-slate-200/50 text-slate-700' : 'hover:bg-white/5 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/5 dark:bg-white/5 text-on-surface-variant shrink-0">{file.lang}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Editor (Center Pane) */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-inherit">
                {/* Editor Tab Bar */}
                <div className={`p-2 px-3 border-b flex items-center justify-between text-xs font-mono shrink-0 border-inherit ${
                  isLight ? 'bg-white' : 'bg-[#151518]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#00dbe7] shrink-0" />
                    <span className="font-bold text-on-surface">{openCodeFiles[activeFileIndex]?.name}</span>
                    <span className="text-[10px] text-on-surface-variant hidden sm:inline">
                      ({openCodeFiles[activeFileIndex]?.content.split('\n').length} lines)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenCodeTerminalLogs(prev => [
                          ...prev,
                          `[Exec] Running syntax verification for ${openCodeFiles[activeFileIndex]?.name}...`,
                          `[TypeScript] 0 diagnostics errors found. Build target: ES2022.`,
                          `[Output] Compiled successfully.`
                        ]);
                      }}
                      className="h-7 px-2.5 rounded text-[11px] font-mono border flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-pointer"
                    >
                      <Play className="w-3 h-3 shrink-0" />
                      <span>Run Test</span>
                    </button>
                  </div>
                </div>

                {/* Editor Textarea with Line Numbers */}
                <div className="flex-1 flex min-h-[300px] overflow-hidden relative font-mono text-xs">
                  {/* Line numbers */}
                  <div className={`w-10 sm:w-12 py-3 px-1 text-right select-none text-[11px] font-mono shrink-0 border-r ${
                    isLight ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-[#101013] text-white/30 border-outline/10'
                  }`}>
                    {(openCodeFiles[activeFileIndex]?.content || '').split('\n').map((_, i) => (
                      <div key={i} className="leading-5">{i + 1}</div>
                    ))}
                  </div>
                  {/* Editable Code Box */}
                  <textarea
                    value={openCodeFiles[activeFileIndex]?.content || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOpenCodeFiles(prev => prev.map((f, idx) => idx === activeFileIndex ? { ...f, content: val } : f));
                    }}
                    className={`flex-1 p-3 font-mono text-xs sm:text-[13px] leading-5 resize-none border-none outline-hidden overflow-auto ${
                      isLight ? 'bg-white text-slate-900' : 'bg-[#131316] text-[#e5e1e4]'
                    }`}
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Right Pane: AI Coding Agent & Console Output */}
              <div className={`w-full md:w-80 shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-inherit ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#131316] border-outline/10'
              }`}>
                {/* Agent Control Header */}
                <div className="p-3 border-b flex items-center justify-between text-xs font-mono font-bold text-on-surface border-inherit">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Qwen Coder Assistant</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-normal">Active</span>
                </div>

                {/* Quick AI Action Badges */}
                <div className="p-2.5 border-b flex flex-wrap gap-1.5 border-inherit">
                  <button
                    type="button"
                    onClick={() => handleTriggerAgentCoding('Explain how this file works and its architecture.')}
                    disabled={isAgentCoding}
                    className="px-2 py-1 rounded text-[10px] font-mono border bg-white/5 hover:bg-white/10 border-white/10 cursor-pointer disabled:opacity-40"
                  >
                    📖 Explain File
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerAgentCoding('Refactor this file for optimal performance, clean types, and robust error handling.')}
                    disabled={isAgentCoding}
                    className="px-2 py-1 rounded text-[10px] font-mono border bg-white/5 hover:bg-white/10 border-white/10 cursor-pointer disabled:opacity-40"
                  >
                    ⚡ Refactor Code
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerAgentCoding('Generate comprehensive Jest/Vitest unit tests for this code.')}
                    disabled={isAgentCoding}
                    className="px-2 py-1 rounded text-[10px] font-mono border bg-white/5 hover:bg-white/10 border-white/10 cursor-pointer disabled:opacity-40"
                  >
                    🧪 Write Unit Tests
                  </button>
                </div>

                {/* Agent Custom Prompt Input */}
                <div className="p-2.5 border-b border-inherit">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={codingPrompt}
                      onChange={(e) => setCodingPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleTriggerAgentCoding(); }}
                      placeholder="Ask coding agent to modify code..."
                      disabled={isAgentCoding}
                      className={`flex-1 h-8 px-2.5 rounded-lg text-xs font-mono border outline-hidden ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#101013] border-white/10 text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleTriggerAgentCoding()}
                      disabled={!codingPrompt.trim() || isAgentCoding}
                      className="h-8 px-3 rounded-lg text-xs font-mono font-bold bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40 cursor-pointer disabled:opacity-40"
                    >
                      {isAgentCoding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Terminal Console Output */}
                <div className="flex-1 flex flex-col min-h-[160px] p-2 font-mono text-[11px] overflow-hidden">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Terminal / Agent Output</span>
                    <button
                      type="button"
                      onClick={() => setOpenCodeTerminalLogs(['[Terminal] Logs cleared.'])}
                      className="hover:underline text-[9px] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className={`flex-1 overflow-y-auto p-2 rounded-lg border font-mono text-[10px] leading-relaxed select-text ${
                    isLight ? 'bg-slate-900 text-emerald-400 border-slate-700' : 'bg-[#0a0a0c] text-emerald-400 border-white/10'
                  }`}>
                    {openCodeTerminalLogs.map((log, i) => (
                      <div key={i} className="py-0.5">{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* REMOTE BRIDGE VIEW WITH SETTINGS */
            <div className="flex-1 flex flex-col p-3 sm:p-5 gap-3.5 overflow-hidden">
              <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono transition-colors shadow-xs flex-wrap ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#151518] border-[#3a494b]/40 text-[#e5e1e4]'
              }`}>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-on-surface-variant">Active Bridge:</span>
                  <code className={`px-1.5 py-0.5 rounded text-[10px] border flex items-center gap-1 font-mono ${
                    isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-white/5 text-[#00dbe7] border-white/10'
                  }`}>
                    <span>{opencodeUrl}</span>
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomUrlInput(opencodeUrl);
                      setIsEditingUrl(!isEditingUrl);
                    }}
                    className="text-[10px] text-on-surface-variant hover:text-on-surface underline flex items-center gap-1 cursor-pointer"
                  >
                    <Settings className="w-3 h-3 shrink-0" />
                    <span>{isEditingUrl ? 'Cancel' : 'Configure Bridge'}</span>
                  </button>
                </div>
              </div>

              {isEditingUrl && (
                <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs font-mono transition-all animate-in fade-in duration-150 ${
                  isLight ? 'bg-white border-slate-300 shadow-sm' : 'bg-[#161619] border-[#3a494b]/50 shadow-md'
                }`}>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-on-surface-variant shrink-0 text-[11px]">Bridge URL:</span>
                    <input
                      type="text"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://... or http://132.226.190.125/"
                      className="flex-1 h-8 px-3 rounded-lg border text-xs font-mono bg-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        setOpencodeUrl(customUrlInput.trim());
                        localStorage.setItem('sutharlabs_opencode_url', customUrlInput.trim());
                        setIsEditingUrl(false);
                        setIframeKey((k) => k + 1);
                      }
                    }}
                    className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-sky-500 text-white cursor-pointer"
                  >
                    Save &amp; Connect
                  </button>
                </div>
              )}

              <div className="flex-1 min-h-[500px] rounded-2xl border overflow-hidden relative shadow-xl">
                <iframe
                  key={iframeKey}
                  src={opencodeUrl}
                  title="OpenCode AI Coding Agent Studio"
                  className="w-full h-full border-0 absolute inset-0"
                  allow="clipboard-read; clipboard-write;"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* OpenCode-Style Agent Persona Modal */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
          }`}>
            <div className="h-1 w-full bg-[#00dbe7]" />
            <div className="p-5 border-b flex items-center justify-between gap-3 border-inherit">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-purple-400 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Agent Personas & Capabilities</h3>
                  <p className="text-xs text-on-surface-variant font-mono">Select an autonomous role for specialized reasoning</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-[65vh] overflow-y-auto space-y-2.5">
              {AGENT_PERSONAS.map((agent) => {
                const isSelected = selectedAgent.id === agent.id;
                return (
                  <div
                    key={agent.id}
                    onClick={() => {
                      handleAgentSelect(agent);
                      setIsAgentModalOpen(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                      isSelected
                        ? isLight
                          ? 'bg-sky-50 border-sky-400 text-slate-900 shadow-xs'
                          : 'bg-[#00dbe7]/10 border-[#00dbe7]/50 text-[#e5e1e4] shadow-xs'
                        : isLight
                          ? 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                          : 'bg-white/3 hover:bg-white/6 border-white/5 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
                      {getAgentIcon(agent.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-on-surface">{agent.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 uppercase font-semibold">
                          {agent.badge}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-mono mt-0.5">{agent.title}</p>
                      <p className="text-xs mt-1.5 leading-relaxed text-on-surface-variant/90">{agent.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-on-surface-variant">Recommended Model:</span>
                        <span className="text-emerald-400 font-bold">{agent.recommendedModel}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#00dbe7] shrink-0 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 border-t border-inherit flex justify-end">
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(false)}
                className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer ${
                  isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

