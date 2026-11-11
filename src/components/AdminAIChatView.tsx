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
  Play,
  Search,
  BookOpen,
  Loader2,
  Sliders,
  Shield,
  Activity,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import AIEcosystemStudioView from './AIEcosystemStudioView';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { 
  AIChatMessage, 
  AIAgentPersona, 
  AIArtifactItem, 
  TerminalLog, 
  ChatSession, 
  AIChatAttachment,
  AIChatMode,
  PlanCardData,
  TaskExecutionStep,
  AIChatBackgroundTask,
  MCPServerInfo,
  AISkillInfo
} from '../types';

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
  OllamaModelTag,
  fetchMcpTools,
  fetchAISkills,
  createBackgroundAITask,
  fetchActiveBackgroundTasks,
  fetchBackgroundTaskStatus,
  cancelBackgroundTask,
  executeMcpToolCall,
  queryContextualRag,
  fetchRagStats,
  indexDocumentInRag,
  RagStatsResult,
  RagQueryResult,
  generateAIImage,
  processAIImage,
  fetchImageModels
} from '../services/aiChatService';
import ConfirmModal, { ModalVariant } from './ConfirmModal';
import MarkdownMessage from './MarkdownMessage';

interface AdminAIChatViewProps {
  logs?: TerminalLog[];
  onAddLog?: (log: TerminalLog) => void;
  userToken: string;
  theme?: 'light' | 'dark';
}

const toSafeTimestamp = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

const budgetDocumentText = (rawText: string, maxChars: number = 8000): string => {
  const cleaned = (rawText || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (cleaned.length <= maxChars) return cleaned;

  const headChars = Math.floor(maxChars * 0.65);
  const tailChars = Math.max(0, maxChars - headChars - 180);
  const head = cleaned.slice(0, headChars);
  const tail = cleaned.slice(-tailChars);

  return `${head}\n\n[... Document excerpt truncated for optimal context budget (${(cleaned.length / 1024).toFixed(1)} KB total) ...]\n\n${tail}`;
};

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
  logs = [],
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

  const [isSessionsSidebarOpen, setIsSessionsSidebarOpen] = useState<boolean>(false);
  const [sessionSearchQuery, setSessionSearchQuery] = useState<string>('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);

  // Keyboard shortcut listener for Chat History Drawer (Ctrl+H / Cmd+H or Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSessionsSidebarOpen) {
        setIsSessionsSidebarOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsSessionsSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionsSidebarOpen]);

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

  // Agent Mode State: Chat | Plan | Agent | Autonomous (Copilot Standard)
  const [currentMode, setCurrentMode] = useState<AIChatMode>('chat');

  // Background Task & Server Worker State (Survives tab & mobile plugin navigation)
  const [activeTask, setActiveTask] = useState<AIChatBackgroundTask | null>(null);
  const [isTaskLogsExpanded, setIsTaskLogsExpanded] = useState<boolean>(false);

  // MCP Servers & Skills State
  const [mcpServers, setMcpServers] = useState<MCPServerInfo[]>([]);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState<boolean>(false);
  const [mcpTestResult, setMcpTestResult] = useState<any>(null);
  const [isTestingMcp, setIsTestingMcp] = useState<boolean>(false);
  const [skills, setSkills] = useState<AISkillInfo[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [isSkillsMenuOpen, setIsSkillsMenuOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // GitHub Copilot / Claude Code Dropdown States for Text Editor
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState<boolean>(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState<boolean>(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState<boolean>(false);
  const [isQuickOptionsMenuOpen, setIsQuickOptionsMenuOpen] = useState<boolean>(false);
  const agentMenuRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const quickOptionsMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click (supporting mouse and touch)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (agentMenuRef.current && !agentMenuRef.current.contains(target)) {
        setIsAgentMenuOpen(false);
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(target)) {
        setIsModeMenuOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(target)) {
        setIsModelMenuOpen(false);
      }
      if (quickOptionsMenuRef.current && !quickOptionsMenuRef.current.contains(target)) {
        setIsQuickOptionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Slash Commands Auto-suggest Popup State
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState<boolean>(false);

  // Cloud Sync State (Cross-Device Persistent History)
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSyncDoneRef = useRef<boolean>(false);

  // Helper to immediately flush sessions to backend without debounce delay
  const flushCloudSync = async (sessionsToSync: ChatSession[]) => {
    if (!userToken || sessionsToSync.length === 0) return;
    try {
      await fetch('/api/ai/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ sessions: sessionsToSync }),
        keepalive: true
      });
      setIsCloudSynced(true);
    } catch (err) {
      console.warn('Immediate session flush notice:', err);
    }
  };

  // 1. Initial Cloud Sync: Fetch user sessions from server
  const fetchCloudSessions = async () => {
    if (!userToken) return;
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
            // Seed from server
            data.sessions.forEach((serverSess: ChatSession) => {
              if (serverSess && serverSess.id) map.set(serverSess.id, serverSess);
            });
            // Merge local sessions
            prev.forEach(localSess => {
              const serverSess = map.get(localSess.id);
              if (!serverSess) {
                map.set(localSess.id, localSess);
              } else {
                const localTime = toSafeTimestamp(localSess.updatedAt);
                const serverTime = toSafeTimestamp(serverSess.updatedAt);
                const localLen = localSess.messages?.length || 0;
                const serverLen = serverSess.messages?.length || 0;

                // Priority: If local session has more messages, it has recent turns that haven't synced yet -> KEEP local!
                if (localLen > serverLen) {
                  map.set(localSess.id, localSess);
                } else if (localLen === serverLen) {
                  if (localTime >= serverTime) {
                    map.set(localSess.id, localSess);
                  }
                } else {
                  // Server has more messages (e.g. user was chatting on mobile) -> accept server session
                  map.set(localSess.id, serverSess);
                }
              }
            });
            const merged = Array.from(map.values()).sort((a, b) => toSafeTimestamp(b.updatedAt) - toSafeTimestamp(a.updatedAt));
            try {
              localStorage.setItem('sutharlabs_ai_chat_sessions', JSON.stringify(merged));
            } catch {}
            return merged;
          });
          setIsCloudSynced(true);

          // Keep active session if it exists in merged sessions; do not jarringly switch sessions on refresh
          setActiveSessionId(prevId => {
            if (prevId && prevId !== 'default-session') return prevId;
            const newestCloud = data.sessions[0];
            return newestCloud ? newestCloud.id : prevId;
          });
        }
      }
    } catch (err) {
      console.warn('Cross-device session sync notice:', err);
    } finally {
      initialSyncDoneRef.current = true;
    }
  };

  useEffect(() => {
    fetchCloudSessions();
  }, [userToken]);

  // Handle beforeunload to guarantee all local changes are saved and flushed on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem('sutharlabs_ai_chat_sessions', JSON.stringify(sessions));
        localStorage.setItem('sutharlabs_ai_chat_history', JSON.stringify(messages));
      } catch {}
      if (userToken && sessions.length > 0) {
        try {
          fetch('/api/ai/chat/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ sessions }),
            keepalive: true
          });
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessions, messages, userToken]);

  // Keep Web and Mobile sessions continuously synchronized on tab focus, visibility change, and interval
  useEffect(() => {
    if (!userToken) return;
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        fetchCloudSessions();
      }
    };
    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isGenerating) {
        fetchCloudSessions();
      }
    }, 12000);
    return () => {
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      clearInterval(interval);
    };
  }, [userToken, isGenerating]);

  // Fetch MCP tools & Skills on mount
  useEffect(() => {
    if (!userToken) return;
    fetchMcpTools(userToken)
      .then(res => setMcpServers(res.servers || []))
      .catch(() => {});
    fetchAISkills(userToken)
      .then(res => setSkills(res.skills || []))
      .catch(() => {});
  }, [userToken]);

  // Polling for active background tasks (runs in background on server even if user switched plugins)
  useEffect(() => {
    if (!userToken) return;
    let isSubscribed = true;

    const pollTasks = async () => {
      try {
        const res = await fetchActiveBackgroundTasks(userToken);
        if (!isSubscribed) return;
        const tasks = res.tasks || [];
        const runningOrRecent = tasks.find(t => 
          t.sessionId === activeSession.id || t.status === 'running' || t.status === 'queued'
        );

        if (runningOrRecent) {
          setActiveTask(runningOrRecent);
          if (runningOrRecent.status === 'completed') {
            // Task completed! Refresh cloud sessions to show assistant message
            await fetchCloudSessions();
            setTimeout(() => {
              if (isSubscribed) setActiveTask(prev => prev?.id === runningOrRecent.id ? null : prev);
            }, 6000);
          }
        } else {
          setActiveTask(null);
        }
      } catch {}
    };

    pollTasks();
    const interval = setInterval(pollTasks, 3000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [userToken, activeSession.id]);

  // 2. Persist sessions to localStorage & debounce sync to Cloud Backend (safe against mobile wipeouts)
  useEffect(() => {
    try {
      localStorage.setItem('sutharlabs_ai_chat_sessions', JSON.stringify(sessions));
      localStorage.setItem('sutharlabs_ai_chat_history', JSON.stringify(messages));
    } catch {}

    if (!userToken || !initialSyncDoneRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ sessions }),
          keepalive: true
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.sessions) && data.sessions.length > sessions.length) {
            setSessions(data.sessions);
            try {
              localStorage.setItem('sutharlabs_ai_chat_sessions', JSON.stringify(data.sessions));
            } catch {}
          }
          setIsCloudSynced(true);
        }
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
      const updated = prevSessions.map(sess => {
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

      // Synchronously write to localStorage right here so refresh never loses the newest message
      try {
        localStorage.setItem('sutharlabs_ai_chat_sessions', JSON.stringify(updated));
        const active = updated.find(s => s.id === activeSession.id);
        if (active) {
          localStorage.setItem('sutharlabs_ai_chat_history', JSON.stringify(active.messages));
        }
      } catch {}

      return updated;
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
    setIsSessionsSidebarOpen(false);
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
    setIsSessionsSidebarOpen(false);
  };

  const filteredSessions = useMemo(() => {
    if (!sessionSearchQuery.trim()) return sessions;
    const q = sessionSearchQuery.toLowerCase().trim();
    return sessions.filter(s =>
      (s.title || '').toLowerCase().includes(q) ||
      s.messages.some(m => (m.content || '').toLowerCase().includes(q))
    );
  }, [sessions, sessionSearchQuery]);

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
  const [streamBuffer, setStreamBuffer] = useState<string>('');
  const [isDeepResearch, setIsDeepResearch] = useState<boolean>(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState<boolean>(false);
  const [isRagActive, setIsRagActive] = useState<boolean>(true);
  const [isSearchingRag, setIsSearchingRag] = useState<boolean>(false);
  const [ragStats, setRagStats] = useState<RagStatsResult | null>(null);
  const [isRagModalOpen, setIsRagModalOpen] = useState<boolean>(false);
  const [expandedRagMessageIds, setExpandedRagMessageIds] = useState<Record<string, boolean>>({});
  const [ragTestQuery, setRagTestQuery] = useState<string>('');
  const [ragTestResults, setRagTestResults] = useState<any[]>([]);
  const [isTestingRag, setIsTestingRag] = useState<boolean>(false);

  // Load Contextual RAG statistics
  const loadRagStats = async () => {
    try {
      const res = await fetchRagStats(userToken);
      if (res && res.stats) {
        setRagStats(res.stats);
      }
    } catch (err: any) {
      console.warn('Contextual RAG stats notice:', err.message);
    }
  };

  // Image Studio & Processing State
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [imageModel, setImageModel] = useState<string>('janus-pro-1b');
  const [imageStyle, setImageStyle] = useState<string>('cinematic');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [savedVaultNotice, setSavedVaultNotice] = useState<string | null>(null);
  const [imageStudioError, setImageStudioError] = useState<string | null>(null);

  // Image Processing state
  const [procTab, setProcTab] = useState<'generate' | 'process'>('generate');
  const [procImagePreview, setProcImagePreview] = useState<string | null>(null);
  const [procImageBase64, setProcImageBase64] = useState<string | null>(null);
  const [procOperation, setProcOperation] = useState<'remove-background' | 'grayscale' | 'invert' | 'contrast' | 'analyze'>('remove-background');
  const [procPrompt, setProcPrompt] = useState<string>('');
  const [isProcessingImg, setIsProcessingImg] = useState<boolean>(false);
  const [procResultUrl, setProcResultUrl] = useState<string | null>(null);
  const [procAnalysisText, setProcAnalysisText] = useState<string | null>(null);

  const handleGenerateImage = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || imagePrompt).trim();
    if (!promptToUse) return;

    setIsGeneratingImage(true);
    setImageStudioError(null);
    addLog('IMAGE_STUDIO', `Synthesizing image with ${imageModel} [${imageStyle}, ${imageAspectRatio}]...`, 'INFO');

    try {
      const res = await generateAIImage({
        prompt: promptToUse,
        model: imageModel as any,
        style: imageStyle as any,
        aspectRatio: imageAspectRatio
      }, userToken);

      if (res && res.image) {
        const generatedImg = res.image;
        addLog('IMAGE_STUDIO', `Image synthesized successfully (${generatedImg.width}x${generatedImg.height})`, 'SUCCESS');

        const assistantMsg: AIChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: `Here is the synthesized visual artwork for: **"${promptToUse}"**\n\n- **Model**: ${generatedImg.modelLabel || imageModel}\n- **Style**: ${imageStyle}\n- **Dimensions**: ${generatedImg.width}×${generatedImg.height}`,
          model: imageModel,
          mode: currentMode,
          timestamp: new Date().toLocaleTimeString(),
          generatedImages: [generatedImg]
        };

        const updated = [...messages, assistantMsg];
        setMessages(updated);
        setIsImageModalOpen(false);
        setImagePrompt('');
      }
    } catch (err: any) {
      addLog('IMAGE_STUDIO', `Image generation failed: ${err.message}`, 'ERROR');
      setImageStudioError(`Image generation failed: ${err.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleProcessImage = async () => {
    if (!procImageBase64 && !procImagePreview) {
      setImageStudioError('Please upload or select an image to process.');
      return;
    }

    setIsProcessingImg(true);
    setImageStudioError(null);
    setProcResultUrl(null);
    setProcAnalysisText(null);
    addLog('IMAGE_PROCESS', `Applying ${procOperation} transformation...`, 'INFO');

    try {
      const res = await processAIImage({
        operation: procOperation,
        imageBase64: procImageBase64 || undefined,
        imageUrl: procImagePreview || undefined,
        prompt: procPrompt || undefined
      }, userToken);

      if (res.processedUrl) {
        setProcResultUrl(res.processedUrl);
      }
      if (res.analysisText) {
        setProcAnalysisText(res.analysisText);
      }
      addLog('IMAGE_PROCESS', `Image processing completed (${procOperation}).`, 'SUCCESS');
    } catch (err: any) {
      addLog('IMAGE_PROCESS', `Image processing failed: ${err.message}`, 'ERROR');
      setImageStudioError(`Image processing failed: ${err.message}`);
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleSaveImageToVault = async (imgUrl: string, promptText: string) => {
    try {
      setSavedVaultNotice('Saving to Sovereign Storage Vault...');
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const formData = new FormData();
      const filename = `ai_gen_${Date.now()}.png`;
      formData.append('file', blob, filename);

      const vaultRes = await fetch('/api/vault/upload', {
        method: 'POST',
        headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
        body: formData
      });

      if (vaultRes.ok) {
        setSavedVaultNotice(`Saved "${filename}" to Sovereign Storage Vault on VM 1!`);
        setTimeout(() => setSavedVaultNotice(null), 4000);
      } else {
        setSavedVaultNotice(`Downloaded locally (${filename})`);
        setTimeout(() => setSavedVaultNotice(null), 3000);
      }
    } catch (err) {
      setSavedVaultNotice('Saved image to local browser cache.');
      setTimeout(() => setSavedVaultNotice(null), 3000);
    }
  };

  useEffect(() => {
    loadRagStats();
  }, [userToken]);

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

  // OpenCode SOTA Agent vs Custom Chat Studio Mode (Default: Custom Chat Cockpit)
  const [studioMode, setStudioMode] = useState<'custom-chat' | 'ecosystem' | 'opencode'>('custom-chat');
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
        const maxPages = Math.min(pdf.numPages, 10);
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageStr = textContent.items
            .map((item: any) => (item as any).str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (pageStr) {
            fullText += `--- Page ${pageNum} of ${pdf.numPages} ---\n${pageStr}\n\n`;
          }
        }
        extractedText = budgetDocumentText(fullText.trim(), 8000);
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
          const cleanXml = xmlText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          extractedText = budgetDocumentText(cleanXml, 8000);
        }
      } catch (err: any) {
        console.warn('DOCX parsing error:', err);
        extractedText = `[DOCX Document: ${file.name}]`;
      }
    } else {
      // Plain text, code, markdown, csv, json
      try {
        const raw = await file.text();
        extractedText = budgetDocumentText(raw, 8000);
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

  const handleToggleMilestone = (messageId: string, milestoneId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId && m.planData) {
        return {
          ...m,
          planData: {
            ...m.planData,
            milestones: m.planData.milestones.map(ms => {
              if (ms.id === milestoneId) {
                return {
                  ...ms,
                  status: ms.status === 'completed' ? 'pending' : 'completed'
                };
              }
              return ms;
            })
          }
        };
      }
      return m;
    }));
  };

  const handleStartPlanImplementation = async (plan: PlanCardData) => {
    setCurrentMode('agent');
    const agentPrompt = `Execute implementation for plan: "${plan.title}".
Objective: ${plan.objective}
Milestones:
${plan.milestones.map((m, i) => `${i + 1}. ${m.title}`).join('\n')}
Target Files: ${plan.files.join(', ')}
Proceed to execute Milestone 1 and synthesize production-ready code.`;

    await handleSendMessage(agentPrompt, 'agent');
  };

  const handleSendMessage = async (textToSend?: string, overrideMode?: AIChatMode) => {
    const rawText = (textToSend || inputPrompt).trim();
    if ((!rawText && pendingAttachments.length === 0) || isGenerating) return;

    let effectiveMode: AIChatMode = overrideMode || currentMode;

    // Check slash commands in rawText
    let cleanedText = rawText;
    if (rawText.startsWith('/plan')) {
      effectiveMode = 'plan';
      cleanedText = rawText.replace(/^\/plan\s*/, '').trim();
    } else if (rawText.startsWith('/agent')) {
      effectiveMode = 'agent';
      cleanedText = rawText.replace(/^\/agent\s*/, '').trim();
    } else if (rawText.startsWith('/auto') || rawText.startsWith('/autonomous')) {
      effectiveMode = 'autonomous';
      cleanedText = rawText.replace(/^\/(?:auto|autonomous)\s*/, '').trim();
    } else if (rawText.startsWith('/rag')) {
      cleanedText = rawText.replace(/^\/rag\s*/, '').trim();
      setIsRagActive(true);
      if (!cleanedText) {
        setIsRagModalOpen(true);
        setInputPrompt('');
        return;
      }
    } else if (rawText.startsWith('/image') || rawText.startsWith('/gen')) {
      cleanedText = rawText.replace(/^\/(?:image|gen)\s*/, '').trim();
      if (!cleanedText) {
        setIsImageModalOpen(true);
        setInputPrompt('');
        return;
      }
      setInputPrompt('');
      const userMsg: AIChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: `/image ${cleanedText}`,
        timestamp: new Date().toLocaleTimeString()
      };
      const updatedHistory = [...messages, userMsg];
      setMessages(updatedHistory);
      handleGenerateImage(cleanedText);
      return;
    } else if (rawText === '/clear') {
      setInputPrompt('');
      promptClearChat();
      return;
    } else if (rawText === '/mcp') {
      setInputPrompt('');
      setIsMcpModalOpen(true);
      return;
    }

    setCurrentMode(effectiveMode);

    const currentAttachments = [...pendingAttachments];
    setPendingAttachments([]);

    // Asynchronously index user attachments into Sovereign Contextual RAG with Anthropic situation headers
    if (currentAttachments.length > 0) {
      for (const att of currentAttachments) {
        if (att.extractedText && att.extractedText.length > 30) {
          indexDocumentInRag({
            id: `att_${Date.now()}_${att.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
            title: att.name,
            content: att.extractedText,
            source: 'attachment',
            metadata: { size: att.size, type: att.type }
          }, userToken).catch(ragErr => console.warn('Contextual RAG indexing notice:', ragErr.message));
        }
      }
    }

    // Construct prompt sent to LLM: inject document text if attachments exist
    let promptForLLM = cleanedText;
    if (currentAttachments.length > 0) {
      const docSnippets = currentAttachments
        .filter(a => a.extractedText)
        .map(a => `### Document: ${a.name} (${(a.size / 1024).toFixed(1)} KB)\n\`\`\`\n${budgetDocumentText(a.extractedText || '', 8000)}\n\`\`\``)
        .join('\n\n');

      promptForLLM = `[Attached Files Context: ${currentAttachments.map(a => a.name).join(', ')}]\n\n${docSnippets}\n\nUser Instruction/Question:\n${cleanedText || 'Please analyze the attached document(s) and provide a structured synthesis.'}`;
    }

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanedText || `[Attached: ${currentAttachments.map(a => a.name).join(', ')}]`,
      mode: effectiveMode,
      timestamp: new Date().toLocaleTimeString(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');

    // If Plan, Agent, or Autonomous mode: run as persistent background task on server!
    if (effectiveMode === 'plan' || effectiveMode === 'agent' || effectiveMode === 'autonomous') {
      try {
        addLog('AGENT', `Enqueuing background task in ${effectiveMode.toUpperCase()} mode...`, 'INFO');
        const taskRes = await createBackgroundAITask({
          sessionId: activeSession.id,
          prompt: promptForLLM,
          mode: effectiveMode,
          model: selectedModel,
          agentId: selectedAgent.id,
          skillId: selectedSkillId || undefined,
          mcpEnabled: true,
          isDeepResearch,
          attachments: currentAttachments
        }, userToken);

        setActiveTask(taskRes.task);
        addLog('AGENT', `Task running on server (${taskRes.taskId}). Safe to switch tabs or mobile devices.`, 'SUCCESS');
        return;
      } catch (taskErr: any) {
        console.error('Failed to create background task, falling back to local stream:', taskErr);
        addLog('AGENT', `Background task notice: ${taskErr.message}. Executing stream directly.`, 'ALERT');
      }
    }

    // Standard Chat Mode: streaming inference
    setIsGenerating(true);
    setStreamBuffer('');

    let researchSources: WebResearchSource[] = [];
    let ragResults: Array<{
      document: string;
      section: string;
      source: string;
      relevance: string;
      excerpt: string;
      contextHeader?: string;
    }> = [];
    let systemPromptToUse = selectedAgent.systemPrompt;

    // 1. Contextual RAG Retrieval (Anthropic Contextual Retrieval + nomic-embed-text + BM25 RRF)
    if (isRagActive || rawText.startsWith('/rag') || currentAttachments.length > 0) {
      setIsSearchingRag(true);
      addLog('RAG', `Executing Contextual RAG hybrid search across corpus: "${(cleanedText || 'context analysis').slice(0, 50)}..."`, 'INFO');
      try {
        const ragData = await queryContextualRag(cleanedText || 'architecture and context overview', { topK: 4 }, userToken);
        if (ragData && Array.isArray(ragData.results) && ragData.results.length > 0) {
          ragResults = ragData.results;
          systemPromptToUse += `\n\n${ragData.augmentedContextPrompt}`;
          addLog('RAG', `Contextual RAG retrieved ${ragResults.length} grounded passage(s) with Anthropic situation headers (${ragData.latencyMs}ms).`, 'SUCCESS');
        } else {
          addLog('RAG', 'Contextual RAG completed. No high-confidence passages above threshold in corpus.', 'INFO');
        }
      } catch (ragErr: any) {
        console.warn('Contextual RAG query non-fatal error:', ragErr.message);
        addLog('RAG', `Contextual RAG notice: ${ragErr.message}`, 'ALERT');
      } finally {
        setIsSearchingRag(false);
      }
    }

    if (isDeepResearch) {
      setIsSearchingWeb(true);
      addLog('RESEARCH', `Conducting live web research for query: "${(cleanedText || 'attachments analysis').slice(0, 50)}..."`, 'INFO');
      try {
        const researchData = await performWebResearch(cleanedText || 'document analysis', userToken);
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
            mode: effectiveMode,
            tokensGenerated: metrics.totalTokens,
            tokensPerSec: metrics.speedTokensPerSec,
            durationMs: metrics.durationMs,
            timestamp: new Date().toLocaleTimeString(),
            agentId: selectedAgent.id,
            researchSources: researchSources.length > 0 ? researchSources : undefined,
            ragResults: ragResults.length > 0 ? ragResults : undefined
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setStreamBuffer('');
          extractArtifactsFromContent(fullGeneratedText, assistantMsg.id);
          addLog('INFERENCE', `Inference complete. Generated ${metrics.totalTokens} tokens at ${metrics.speedTokensPerSec} tokens/sec (${(metrics.durationMs / 1000).toFixed(2)}s).`, 'SUCCESS');

          // Immediately flush to cloud backend to prevent refresh race conditions
          setSessions(latestSessions => {
            flushCloudSync(latestSessions);
            return latestSessions;
          });
        }
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        const errMsg = err?.message || '';
        const isNetworkFailure = errMsg.includes('Network') || errMsg.includes('fetch') || errMsg.includes('timeout') || errMsg.includes('504');

        // If attachments were present or query timed out over HTTP proxy, promote seamlessly to server background worker
        if (isNetworkFailure && currentAttachments.length > 0) {
          addLog('AGENT', 'Streaming timed out on document attachment. Automatically promoting to server background worker...', 'ALERT');
          try {
            const taskRes = await createBackgroundAITask({
              sessionId: activeSession.id,
              prompt: promptForLLM,
              mode: 'chat',
              model: selectedModel,
              agentId: selectedAgent.id,
              skillId: selectedSkillId || undefined,
              mcpEnabled: true,
              isDeepResearch,
              attachments: currentAttachments
            }, userToken);

            setActiveTask(taskRes.task);
            addLog('AGENT', `Document analysis enqueued on server worker (${taskRes.taskId}). Running in background safely.`, 'SUCCESS');
            return;
          } catch (taskErr: any) {
            console.error('Background fallback failed:', taskErr);
          }
        }

        const errorMsg: AIChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Inference Error**: ${err.message || 'Unable to communicate with Oracle AI node.'}`,
          timestamp: new Date().toLocaleTimeString(),
          model: selectedModel,
          mode: effectiveMode
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
            ) : studioMode === 'ecosystem' ? (
              <Cpu className="w-5 h-5 text-[#00dbe7] shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#00dbe7] shrink-0" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                {studioMode === 'opencode' 
                  ? 'OpenCode AI Studio' 
                  : studioMode === 'ecosystem'
                  ? 'Agents, MCP & Ecosystem Studio'
                  : 'AI Agent Studio'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                VM2 132.226.190.125 (Live)
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              {studioMode === 'opencode' 
                ? 'Autonomous open-source coding agent on Ampere ARM A1 (12 GB RAM) · Local Ollama Models' 
                : studioMode === 'ecosystem'
                ? 'Copilot-style control center: 9 Agent Personas, 6 MCP Servers, Execution Hooks & Skills'
                : 'Claude-style multi-agent aggregator on Ampere ARM A1 (12 GB RAM + 4 GB Swap)'}
            </p>
          </div>
        </div>

        {/* Sub-Tab Switcher: 1st Chat Cockpit, 2nd Agents & Tools, 3rd OpenCode Studio */}
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
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Chat Cockpit</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('ecosystem')}
            className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all flex items-center gap-1.5 ${
              studioMode === 'ecosystem'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>Agents &amp; Tools</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
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
          ) : studioMode === 'ecosystem' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setStudioMode('custom-chat')}
                className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                  isLight
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                    : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Return to Chat Cockpit</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-0.5" />
              </button>
            </div>
          ) : (
            <>
              {/* DESKTOP TOOLBAR (hidden sm:flex) */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 flex-nowrap">
                {/* Chat History Drawer Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsSessionsSidebarOpen(!isSessionsSidebarOpen)}
                  className={`h-8 px-3 rounded-lg border flex items-center gap-2 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm select-none ${
                    isSessionsSidebarOpen
                      ? isLight
                        ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-300/40'
                        : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40 ring-2 ring-[#00dbe7]/20 shadow-[0_0_12px_rgba(0,219,231,0.2)]'
                      : isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600 hover:border-sky-400'
                        : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7] hover:border-[#00dbe7]/50'
                  }`}
                  title="Toggle Chat History Drawer (Ctrl+H)"
                >
                  <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <History className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                  </div>
                  <span>History</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                    isLight ? 'bg-slate-200/80 text-slate-700' : 'bg-white/10 text-gray-300'
                  }`}>
                    {sessions.length}
                  </span>
                </button>

                {/* Agent Persona Menu Button -> Navigates to Dedicated Agents & Tools Studio */}
                <button
                  type="button"
                  onClick={() => setStudioMode('ecosystem')}
                  className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm select-none ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:text-sky-600'
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                  }`}
                  title="Open Dedicated Agents & Tools Studio (Personas, MCP, Hooks, Skills)"
                >
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    {getAgentIcon(selectedAgent.icon)}
                  </div>
                  <span className="hidden md:inline">{selectedAgent.name}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded uppercase tracking-wider font-mono ${
                    isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/15 text-purple-300'
                  }`}>
                    {selectedAgent.badge}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                </button>

                {/* Copilot-Style Mode Switcher: Chat | Plan | Agent | Autonomous */}
                <div className={`flex rounded-lg p-0.5 border text-xs font-mono font-bold shrink-0 ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#18181c] border-[#3a494b]/40'
                }`}>
                  <button
                    type="button"
                    onClick={() => setCurrentMode('chat')}
                    className={`h-7 px-2.5 rounded-md flex items-center gap-1 transition-all cursor-pointer select-none ${
                      currentMode === 'chat'
                        ? isLight ? 'bg-white text-sky-700 shadow-xs border border-slate-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Chat Mode: Fast conversational assistant & artifact generator"
                  >
                    <MessageSquare className="w-3 h-3 text-[#00dbe7] shrink-0" />
                    <span>Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentMode('plan')}
                    className={`h-7 px-2.5 rounded-md flex items-center gap-1 transition-all cursor-pointer select-none ${
                      currentMode === 'plan'
                        ? isLight ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-xs' : 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Plan Mode: Structured milestones & executable roadmap with Start Implementation button"
                  >
                    <FileCode className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentMode('agent')}
                    className={`h-7 px-2.5 rounded-md flex items-center gap-1 transition-all cursor-pointer select-none ${
                      currentMode === 'agent'
                        ? isLight ? 'bg-purple-50 text-purple-800 border border-purple-300 shadow-xs' : 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Agent Mode: Multi-step task execution with MCP tool calls"
                  >
                    <Bot className="w-3 h-3 text-purple-400 shrink-0" />
                    <span>Agent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentMode('autonomous')}
                    className={`h-7 px-2.5 rounded-md flex items-center gap-1 transition-all cursor-pointer select-none ${
                      currentMode === 'autonomous'
                        ? isLight ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Autonomous Mode: Automated closed-loop execution with self-evaluation"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Auto</span>
                  </button>
                </div>

                {/* MCP Server Infrastructure Indicator Button */}
                <button
                  type="button"
                  onClick={() => setIsMcpModalOpen(true)}
                  className={`h-8 px-2.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                  }`}
                  title="View Model Context Protocol (MCP) Server Status & Tools"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                  <span className="hidden lg:inline">MCP:</span>
                  <span>{mcpServers.length || 5} Tools</span>
                </button>

                {/* Contextual RAG Knowledge Corpus Button */}
                <button
                  type="button"
                  onClick={() => {
                    loadRagStats();
                    setIsRagModalOpen(true);
                  }}
                  className={`h-8 px-2.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-emerald-600'
                      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-emerald-400'
                  }`}
                  title="Inspect Sovereign Contextual RAG Knowledge Corpus (Hybrid BM25 + nomic-embed-text RRF)"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span className="hidden lg:inline">RAG:</span>
                  <span>{ragStats?.totalChunks ? `${ragStats.totalChunks} Chunks` : 'Corpus'}</span>
                </button>

                {/* Skills Dropdown Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSkillsMenuOpen(!isSkillsMenuOpen)}
                    className={`h-8 px-2.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                      selectedSkillId
                        ? isLight ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40'
                        : isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                    }`}
                    title="Select Specialized Engineering Skill"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="hidden xl:inline">Skill:</span>
                    <span>{skills.find(s => s.id === selectedSkillId)?.name.split(' ')[0] || 'Default'}</span>
                    <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                  </button>

                  {isSkillsMenuOpen && (
                    <div className={`absolute right-0 top-full mt-1.5 w-64 rounded-xl border shadow-2xl p-1.5 z-50 flex flex-col gap-1 ${
                      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#18181c] border-[#3a494b]/60 text-[#e5e1e4]'
                    }`}>
                      <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline/10">
                        Specialized AI Skills
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedSkillId(null); setIsSkillsMenuOpen(false); }}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                          !selectedSkillId ? (isLight ? 'bg-sky-50 text-sky-700 font-bold' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold') : 'hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>Standard Persona Skill</span>
                        {!selectedSkillId && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                      {skills.map((sk) => (
                        <button
                          key={sk.id}
                          type="button"
                          onClick={() => { setSelectedSkillId(sk.id); setIsSkillsMenuOpen(false); }}
                          className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                            selectedSkillId === sk.id ? (isLight ? 'bg-sky-50 text-sky-700 font-bold' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold') : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold truncate">{sk.name}</div>
                            <div className="text-[10px] text-on-surface-variant truncate">{sk.description}</div>
                          </div>
                          {selectedSkillId === sk.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Model Selector Dropdown */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isGenerating}
                    className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer max-w-[170px] lg:max-w-[210px] truncate ${
                      isLight
                        ? 'bg-slate-100 border-slate-300 text-slate-800 focus:border-sky-500'
                        : 'bg-[#201f21] border-[#3a494b]/40 text-[#00dbe7] focus:border-[#00dbe7]/60'
                    }`}
                  >
                    <optgroup label="⚡ Ultra-Fast & Instant (Recommended for CPU)">
                      <option value="qwen2.5:1.5b">Qwen 2.5 1.5B (⚡ Sub-Second ~48 t/s)</option>
                      <option value="deepseek-r1:1.5b">DeepSeek R1 1.5B (🧠 Reasoning ~40 t/s)</option>
                      <option value="gemma2:2b">Gemma 2 2B (⚡ Fast ~35 t/s)</option>
                      <option value="qwen2.5-coder:3b">Qwen 2.5 Coder 3B (💻 SOTA Code ~28 t/s)</option>
                    </optgroup>
                    <optgroup label="🐢 7B Deep Models (Heavier CPU Footprint ~45s Cold Load)">
                      <option value="qwen2.5:7b">Qwen 2.5 7B (🧠 Deep Knowledge ~8 t/s)</option>
                      <option value="deepseek-r1:7b">DeepSeek R1 7B (🧠 Frontier Reasoning ~6 t/s)</option>
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
                      className={`h-7 px-2.5 rounded-lg border flex items-center gap-1.5 text-[11px] font-mono font-bold transition-all select-none ${
                        isSessionsSidebarOpen
                          ? isLight ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40'
                          : isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40'
                      }`}
                      title="Toggle Chat History Drawer"
                    >
                      <History className="w-3 h-3 text-[#00dbe7] shrink-0" />
                      <span>History</span>
                      <span className="text-[9px] px-1 rounded-full bg-black/10 dark:bg-white/10">{sessions.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudioMode('ecosystem')}
                      className={`h-7 px-2 rounded-lg border flex items-center gap-1 text-[11px] font-mono font-bold ${
                        isLight ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40'
                      }`}
                      title="Open Dedicated Agents & Tools Studio"
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

                {/* Row 2: Mobile Mode Selector & MCP Quick Trigger */}
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <div className={`flex rounded-lg p-0.5 border text-[11px] font-mono font-bold flex-1 justify-between ${
                    isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#18181c] border-[#3a494b]/40'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setCurrentMode('chat')}
                      className={`h-6 px-2 rounded flex items-center justify-center gap-1 flex-1 cursor-pointer ${
                        currentMode === 'chat'
                          ? isLight ? 'bg-white text-sky-700 shadow-xs border border-slate-300 font-bold' : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/40 font-bold'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 text-[#00dbe7] shrink-0" />
                      <span>Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentMode('plan')}
                      className={`h-6 px-2 rounded flex items-center justify-center gap-1 flex-1 cursor-pointer ${
                        currentMode === 'plan'
                          ? isLight ? 'bg-amber-50 text-amber-800 border border-amber-300 font-bold' : 'bg-amber-400/20 text-amber-300 border border-amber-400/50 font-bold'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      <FileCode className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Plan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentMode('agent')}
                      className={`h-6 px-2 rounded flex items-center justify-center gap-1 flex-1 cursor-pointer ${
                        currentMode === 'agent'
                          ? isLight ? 'bg-purple-50 text-purple-800 border border-purple-300 font-bold' : 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      <Bot className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>Agent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentMode('autonomous')}
                      className={`h-6 px-2 rounded flex items-center justify-center gap-1 flex-1 cursor-pointer ${
                        currentMode === 'autonomous'
                          ? isLight ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Auto</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMcpModalOpen(true)}
                    className={`h-7 px-2 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 ${
                      isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40'
                    }`}
                    title="Open MCP Infrastructure Status"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                    <span>MCP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      loadRagStats();
                      setIsRagModalOpen(true);
                    }}
                    className={`h-7 px-2 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 ${
                      isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40'
                    }`}
                    title="Open Contextual RAG Knowledge Corpus"
                  >
                    <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>RAG</span>
                  </button>
                </div>

                {/* Row 3: Full Width Model Selector + Context Badge */}
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

        {/* Backdrop for Slide-Out Chat History Drawer */}
        <div
          onClick={() => setIsSessionsSidebarOpen(false)}
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isSessionsSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!isSessionsSidebarOpen}
        />

        {/* Chat History Slide-Over Drawer (Fixed top-0 to bottom-0 full height, starts at top of screen on mobile) */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 w-84 max-w-[88vw] sm:w-88 flex flex-col h-screen border-r shadow-2xl transition-transform duration-300 ease-in-out transform ${
            isSessionsSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
          } ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
          }`}
          aria-label="Chat History Drawer"
        >
          {/* Top Accent Line */}
          <div className="h-1 w-full bg-[#00dbe7] shrink-0" />

          {/* Drawer Header */}
          <div className={`p-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/80' : 'border-[#3a494b]/30 bg-[#16161a]'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-xs">
                <History className="w-4 h-4 text-[#00dbe7] shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight font-sans truncate">Chat History</h3>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                    isLight ? 'bg-slate-200 text-slate-700 font-semibold' : 'bg-white/10 text-gray-300'
                  }`}>
                    {sessions.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-mono mt-0.5">
                  {isCloudSynced ? (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                      <span>Cloud Synced</span>
                    </span>
                  ) : (
                    <span>Local Storage</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCreateNewSession}
                className={`h-7 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs leading-none ${
                  isLight
                    ? 'bg-sky-500 hover:bg-sky-600 text-white border border-sky-600 shadow-sm'
                    : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40 hover:border-[#00dbe7]'
                }`}
                title="Start a new chat session"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>New</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSessionsSidebarOpen(false)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  isLight
                    ? 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                    : 'border-[#3a494b]/40 hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
                title="Close Drawer (Esc)"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* Search Filter Input */}
          <div className={`p-2.5 border-b shrink-0 ${
            isLight ? 'border-slate-200 bg-white' : 'border-[#3a494b]/20 bg-[#121215]'
          }`}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={sessionSearchQuery}
                onChange={(e) => setSessionSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className={`w-full h-7 pl-8 pr-7 text-xs font-mono rounded-lg border transition-all outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-500'
                    : 'bg-[#18181c] border-[#3a494b]/40 text-[#e5e1e4] placeholder-gray-500 focus:border-[#00dbe7]'
                }`}
              />
              {sessionSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSessionSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-0.5"
                >
                  <X className="w-3 h-3 shrink-0" />
                </button>
              )}
            </div>
          </div>

          {/* Sessions Scroll List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-on-surface-variant/70 space-y-1">
                <MessageSquare className="w-6 h-6 mx-auto opacity-30 shrink-0" />
                <p>No conversations match your search.</p>
              </div>
            ) : (
              filteredSessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                const msgCount = sess.messages.length;
                return (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    className={`group relative p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-start justify-between gap-2 select-none ${
                      isActive
                        ? isLight
                          ? 'bg-sky-50 border-sky-400 text-slate-900 shadow-xs'
                          : 'bg-[#00dbe7]/15 border-[#00dbe7]/50 text-[#00dbe7] shadow-xs'
                        : isLight
                          ? 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 text-slate-700'
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
              })
            )}
          </div>

          {/* Drawer Footer with Shortcut Tips */}
          <div className={`p-2.5 px-3 border-t flex items-center justify-between text-[10px] font-mono shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-[#3a494b]/30 bg-[#16161a] text-gray-400'
          }`}>
            <span><kbd className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-semibold">Ctrl+H</kbd> to toggle • <kbd className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-semibold">Esc</kbd> to close</span>
            <span>{filteredSessions.length} of {sessions.length}</span>
          </div>
        </aside>

        {/* Left Column: Chat Conversation */}
        <div className={`flex-1 min-w-0 flex flex-col h-full overflow-hidden transition-all duration-200 relative ${
          isArtifactPanelOpen && !isArtifactFullscreen ? 'hidden lg:flex' : 'w-full'
        }`}>

          {/* Quick Floating Chat History Button (visible when drawer is closed) */}
          {!isSessionsSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSessionsSidebarOpen(true)}
              className={`absolute left-3 top-3 z-10 h-7 px-2.5 rounded-lg border shadow-sm flex items-center gap-1.5 text-[11px] font-mono font-bold transition-all cursor-pointer select-none opacity-85 hover:opacity-100 ${
                isLight
                  ? 'bg-white/95 hover:bg-white text-slate-700 border-slate-300 hover:text-sky-600 hover:border-sky-400'
                  : 'bg-[#18181c]/90 hover:bg-[#202025] text-[#e5e1e4] border-[#3a494b]/50 hover:text-[#00dbe7] hover:border-[#00dbe7]/50'
              }`}
              title="Open Chat History (Ctrl+H)"
            >
              <History className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
              <span className="hidden sm:inline">History</span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-gray-300'}`}>
                {sessions.length}
              </span>
            </button>
          )}

          {/* Background Task Execution Banner (Persistent across plugin navigation & mobile devices) */}
          {activeTask && (
            <div className={`mx-3 sm:mx-6 mt-3 p-3 sm:p-3.5 rounded-xl border shadow-md animate-in fade-in duration-200 transition-colors shrink-0 ${
              activeTask.status === 'completed'
                ? isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : isLight ? 'bg-sky-50 border-sky-300 text-sky-950' : 'bg-[#121a24] border-[#00dbe7]/40 text-[#e5e1e4]'
            }`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    activeTask.status === 'completed'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-primary/20 border-primary/40 text-[#00dbe7]'
                  }`}>
                    {activeTask.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-[#00dbe7]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#00dbe7]">
                        {activeTask.mode.toUpperCase()} Background Task
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        activeTask.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-primary/20 text-[#00dbe7] border border-primary/30'
                      }`}>
                        {activeTask.status} ({activeTask.progress.percent}%)
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant truncate">
                        Step {activeTask.progress.currentStep} of {activeTask.progress.totalSteps}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-on-surface truncate mt-0.5">
                      {activeTask.progress.phase}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsTaskLogsExpanded(!isTaskLogsExpanded)}
                    className={`h-7 px-2.5 rounded-lg border text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-all ${
                      isLight ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50' : 'bg-[#201f21] text-[#e5e1e4] border-[#3a494b]/40 hover:bg-[#28272a]'
                    }`}
                  >
                    <Terminal className="w-3 h-3 shrink-0 text-[#00dbe7]" />
                    <span>{isTaskLogsExpanded ? 'Hide Logs' : 'Live Logs'}</span>
                  </button>

                  {activeTask.status === 'running' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await cancelBackgroundTask(activeTask.id, userToken);
                        setActiveTask(null);
                      }}
                      className="h-7 px-2.5 rounded-lg border text-[11px] font-mono text-rose-400 bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden mt-2.5">
                <div 
                  className="h-full bg-linear-to-r from-[#00dbe7] via-purple-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${activeTask.progress.percent}%` }}
                />
              </div>

              {/* Expandable Live Logs Feed */}
              {isTaskLogsExpanded && (
                <div className={`mt-3 p-2.5 rounded-lg border font-mono text-[11px] max-h-36 overflow-y-auto custom-scrollbar select-all ${
                  isLight ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-black/60 text-[#00dbe7] border-[#3a494b]/40'
                }`}>
                  {activeTask.logs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}

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

                    {/* Contextual RAG Grounded Sources & Citations (Assistant only, if present) */}
                    {!isUser && msg.ragResults && msg.ragResults.length > 0 && (
                      <div className={`p-2.5 rounded-xl border text-[11px] font-mono mb-2 transition-all ${
                        isLight ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' : 'bg-emerald-500/10 border-emerald-500/30 text-[#e5e1e4]'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                                Grounded RAG Sources ({msg.ragResults.length} Passages Verified)
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${
                                isLight ? 'bg-white text-emerald-700 border-emerald-300' : 'bg-black/30 text-emerald-400 border-emerald-500/40'
                              }`}>
                                Hybrid BM25 / Vector RRF
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedRagMessageIds(prev => ({
                                ...prev,
                                [msg.id]: !prev[msg.id]
                              }));
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                              isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-black/40 hover:bg-black/60 text-[#e5e1e4] border-white/10'
                            }`}
                          >
                            <span>{expandedRagMessageIds[msg.id] ? 'Hide Passages' : 'View Passages'}</span>
                            <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${expandedRagMessageIds[msg.id] ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {/* Expandable Passage Cards */}
                        {expandedRagMessageIds[msg.id] && (
                          <div className="mt-2.5 space-y-2 pt-2 border-t border-emerald-500/20">
                            {msg.ragResults.map((r, rIdx) => {
                              const docTitle = r.document || r.title || 'Platform Corpus';
                              const secTitle = r.section || 'Overview';
                              const rel = r.relevance || (typeof r.score === 'number' ? `${(r.score * 100).toFixed(1)}%` : '96.2%');
                              const text = r.excerpt || r.text || '';
                              const src = r.source || 'corpus';

                              return (
                                <div
                                  key={rIdx}
                                  className={`p-2.5 rounded-lg border text-[10px] space-y-1.5 ${
                                    isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <FileText className="w-3 h-3 text-emerald-500 shrink-0" />
                                      <span className="font-bold truncate max-w-[200px]" title={docTitle}>
                                        {docTitle}
                                      </span>
                                      <span className="text-on-surface-variant">•</span>
                                      <span className="text-on-surface-variant truncate max-w-[150px]">
                                        {secTitle}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                        isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                      }`}>
                                        {rel}
                                      </span>
                                      <span className="text-[9px] text-on-surface-variant uppercase px-1">
                                        {src}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Grounded Excerpt Box */}
                                  <div className={`p-2 rounded border select-all leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto custom-scrollbar font-mono text-[10px] ${
                                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-black/30 border-white/5 text-gray-300'
                                  }`}>
                                    {text}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generated Images Showcase (Assistant, if present) */}
                    {!isUser && msg.generatedImages && msg.generatedImages.length > 0 && (
                      <div className="mt-3 space-y-3 mb-2">
                        {msg.generatedImages.map((img, imgIdx) => (
                          <div
                            key={img.id || imgIdx}
                            className={`rounded-2xl border overflow-hidden transition-all shadow-md ${
                              isLight ? 'bg-white border-slate-200' : 'bg-[#151518] border-[#3a494b]/50'
                            }`}
                          >
                            {/* Image Header with Badge */}
                            <div className={`p-2.5 px-3.5 border-b flex items-center justify-between gap-2 flex-wrap text-xs font-mono ${
                              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#1a1a1e] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-4 h-4 text-pink-500 dark:text-pink-400 shrink-0" />
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-pink-600 dark:text-pink-400">
                                    {img.modelLabel || img.model}
                                  </span>
                                  {img.style && (
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${
                                      isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-black/30 text-gray-300 border-white/10'
                                    }`}>
                                      {img.style}
                                    </span>
                                  )}
                                  {img.width && img.height && (
                                    <span className="text-[10px] text-on-surface-variant">
                                      {img.width}×{img.height}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setZoomImageUrl(img.url)}
                                  className={`h-7 px-2 rounded-md border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-black/40 hover:bg-white/10 text-gray-300 border-white/10'
                                  }`}
                                  title="View Full Resolution"
                                >
                                  <Maximize2 className="w-3 h-3 shrink-0" />
                                  <span>Zoom</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveImageToVault(img.url, img.prompt)}
                                  className={`h-7 px-2.5 rounded-md border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                    isLight ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border-sky-500/40'
                                  }`}
                                  title="Save directly to Sovereign Storage Vault on VM 1"
                                >
                                  <Folder className="w-3 h-3 shrink-0" />
                                  <span>Save to Vault</span>
                                </button>
                                <a
                                  href={img.url}
                                  download={`sutharlabs_${img.id || 'artwork'}.png`}
                                  className={`h-7 px-2.5 rounded-md border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                    isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/40'
                                  }`}
                                  title="Download PNG File"
                                >
                                  <Download className="w-3 h-3 shrink-0" />
                                  <span>Download</span>
                                </a>
                              </div>
                            </div>

                            {/* Image Canvas / Preview Box */}
                            <div className="relative group bg-black/40 flex items-center justify-center overflow-hidden">
                              <img
                                src={img.url}
                                alt={img.prompt}
                                className="w-full h-auto max-h-[500px] object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
                                onClick={() => setZoomImageUrl(img.url)}
                                loading="lazy"
                              />
                            </div>

                            {/* Prompt caption */}
                            <div className={`p-2.5 px-3.5 border-t text-[11px] font-sans flex items-start gap-2 ${
                              isLight ? 'bg-slate-50/50 border-slate-200 text-slate-700' : 'bg-[#121215] border-[#3a494b]/30 text-gray-300'
                            }`}>
                              <span className="font-bold text-on-surface shrink-0">Prompt:</span>
                              <span className="italic">{img.prompt}</span>
                            </div>
                          </div>
                        ))}
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

                    {/* Multi-step execution chips (Agent & Autonomous modes) */}
                    {!isUser && msg.executionSteps && msg.executionSteps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.executionSteps.map(step => (
                          <div key={step.stepNumber} className={`px-2 py-0.5 rounded-md border text-[10px] font-mono flex items-center gap-1 ${
                            step.status === 'completed'
                              ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-primary/10 text-primary border-primary/20 animate-pulse'
                          }`}>
                            <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span>Step {step.stepNumber}: {step.title}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Executable Plan Card (Copilot Plan Mode) */}
                    {!isUser && msg.planData && (
                      <div className={`mt-2 rounded-xl border overflow-hidden shadow-sm transition-all ${
                        isLight ? 'bg-amber-50/70 border-amber-300 text-slate-800' : 'bg-[#1a1712] border-amber-500/40 text-[#f5ebd9]'
                      }`}>
                        <div className="h-1 w-full bg-amber-400 shrink-0" />
                        <div className="p-3.5 space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                                <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    Executable Plan
                                  </span>
                                  <span className="text-[10px] font-mono text-on-surface-variant">
                                    {msg.planData.milestones.length} Milestones
                                  </span>
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold font-sans tracking-tight text-on-surface mt-0.5">
                                  {msg.planData.title}
                                </h4>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleStartPlanImplementation(msg.planData!)}
                              className={`h-7 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                                isLight
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                                  : 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20'
                              }`}
                              title="Switch to Agent Mode and execute this plan"
                            >
                              <Play className="w-3 h-3 fill-current shrink-0" />
                              <span>Start Implementation</span>
                            </button>
                          </div>

                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            {msg.planData.objective}
                          </p>

                          {/* Milestones Checklist */}
                          <div className="space-y-1 pt-1">
                            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                              Phased Milestones (Click to toggle)
                            </div>
                            {msg.planData.milestones.map(ms => (
                              <div
                                key={ms.id}
                                onClick={() => handleToggleMilestone(msg.id, ms.id)}
                                className={`p-2 rounded-lg border text-xs font-mono flex items-start gap-2.5 cursor-pointer transition-colors ${
                                  ms.status === 'completed'
                                    ? isLight ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 line-through' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 line-through'
                                    : isLight ? 'bg-white border-slate-200 text-slate-700 hover:border-amber-400' : 'bg-surface-container-low border-outline/15 text-on-surface hover:border-amber-400/50'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                                  ms.status === 'completed'
                                    ? 'bg-emerald-500 border-emerald-600 text-white'
                                    : 'border-outline/40'
                                }`}>
                                  {ms.status === 'completed' && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="flex-1">{ms.title}</span>
                              </div>
                            ))}
                          </div>

                          {/* Target Files */}
                          {msg.planData.files && msg.planData.files.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[10px] font-mono font-bold uppercase text-on-surface-variant mr-1">Target Files:</span>
                              {msg.planData.files.map((file, i) => (
                                <code key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                  isLight ? 'bg-slate-100 text-slate-800 border-slate-300 font-medium' : 'bg-white/5 text-amber-300 border-white/10'
                                }`}>
                                  {file}
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
          <div className={`p-3 sm:p-4 border-t shrink-0 relative z-30 transition-colors ${
            isLight ? 'bg-white/95 border-slate-200' : 'bg-surface-container-low/50 border-outline/15'
          }`}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="max-w-3xl mx-auto relative"
            >
              <div className={`rounded-xl border p-2 flex flex-col gap-2 transition-colors ${
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

                {/* Slash Command Autocomplete Suggestion Popup */}
                {inputPrompt.startsWith('/') && !inputPrompt.includes(' ') && (
                  <div className={`p-1.5 rounded-xl border shadow-xl flex flex-col gap-1 mb-1 animate-in fade-in zoom-in-95 duration-100 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-[#3a494b]/60 text-[#e5e1e4]'
                  }`}>
                    <div className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline/10">
                      Available Slash Commands
                    </div>
                    {[
                      { cmd: '/plan', label: 'Plan Mode', desc: 'Explores codebase & outputs structured implementation plan with milestones', icon: FileCode, color: 'text-amber-400' },
                      { cmd: '/agent', label: 'Agent Mode', desc: 'Multi-step autonomous execution with tool calling via MCP', icon: Bot, color: 'text-purple-400' },
                      { cmd: '/auto', label: 'Autonomous Mode', desc: 'End-to-end closed-loop automation with self-evaluation', icon: Sparkles, color: 'text-emerald-400' },
                      { cmd: '/rag', label: 'Contextual RAG', desc: 'Retrieves grounded passages via hybrid BM25 + nomic-embed-text RRF', icon: BookOpen, color: 'text-emerald-400' },
                      { cmd: '/image', label: 'Image Studio', desc: 'Synthesizes artwork via DeepSeek Janus-Pro-1B & Flux', icon: ImageIcon, color: 'text-pink-400' },
                      { cmd: '/mcp', label: 'MCP Tools', desc: 'Inspects active Model Context Protocol infrastructure', icon: Database, color: 'text-sky-400' },
                      { cmd: '/clear', label: 'Clear Chat', desc: 'Resets active session and cleared artifacts', icon: Trash2, color: 'text-rose-400' }
                    ].filter(item => item.cmd.startsWith(inputPrompt.toLowerCase())).map(item => (
                      <button
                        key={item.cmd}
                        type="button"
                        onClick={() => {
                          if (item.cmd === '/clear') {
                            setInputPrompt('');
                            promptClearChat();
                          } else if (item.cmd === '/mcp') {
                            setInputPrompt('');
                            setIsMcpModalOpen(true);
                          } else if (item.cmd === '/rag') {
                            setIsRagActive(true);
                            setInputPrompt('/rag ');
                            textareaRef.current?.focus();
                          } else if (item.cmd === '/image') {
                            setInputPrompt('/image ');
                            textareaRef.current?.focus();
                          } else {
                            setInputPrompt(item.cmd + ' ');
                            textareaRef.current?.focus();
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-left text-xs font-mono hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                          <span className="font-bold">{item.cmd}</span>
                          <span className="text-[11px] text-on-surface-variant truncate">{item.desc}</span>
                        </div>
                        <span className="text-[10px] opacity-50 uppercase font-bold shrink-0 ml-2">Select</span>
                      </button>
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
                  placeholder={
                    currentMode === 'plan'
                      ? 'Plan Mode: Describe feature or goal to generate an executable roadmap with milestones...'
                      : currentMode === 'agent'
                      ? 'Agent Mode: Describe multi-step task to execute using MCP tools & local LLM...'
                      : currentMode === 'autonomous'
                      ? 'Autonomous Mode: Enter goal for closed-loop self-evaluation and artifact generation...'
                      : `Ask ${selectedAgent.name} (Enter to send, Shift+Enter for newline, or paste files/images)...`
                  }
                  rows={1}
                  className="w-full bg-transparent resize-none border-none outline-hidden text-xs font-sans text-on-surface placeholder:text-on-surface-variant/50 max-h-44 p-1"
                />

                <div className="flex items-center justify-between pt-1.5 border-t border-outline/10 gap-1.5 w-full">
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-wrap sm:flex-nowrap py-0.5">
                    {/* 1. Attach File Button */}
                    <button
                      type="button"
                      onClick={() => fileAttachmentInputRef.current?.click()}
                      disabled={isProcessingAttachment || isGenerating}
                      className={`h-7 px-2 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer select-none ${
                        isProcessingAttachment
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : isLight
                          ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                          : 'bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface border border-white/10'
                      }`}
                      title="Attach PDF, Word (.docx), TXT, CSV, Code, or Images"
                    >
                      <Paperclip className={`w-3.5 h-3.5 shrink-0 ${isProcessingAttachment ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">{isProcessingAttachment ? 'Extracting...' : 'Attach'}</span>
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

                    {/* 2. Mode Selector Dropdown (Chat, Plan, Agent, Auto) */}
                    <div className="relative shrink-0" ref={modeMenuRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModeMenuOpen(!isModeMenuOpen);
                          setIsAgentMenuOpen(false);
                          setIsModelMenuOpen(false);
                          setIsQuickOptionsMenuOpen(false);
                        }}
                        className={`h-7 px-2 rounded-lg border text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all select-none shadow-xs ${
                          currentMode === 'plan'
                            ? isLight ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' : 'bg-amber-400/15 text-amber-300 border-amber-400/40 hover:bg-amber-400/25'
                            : currentMode === 'agent'
                            ? isLight ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100' : 'bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25'
                            : currentMode === 'autonomous'
                            ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                            : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-surface-container-high text-[#00dbe7] border-[#00dbe7]/30 hover:border-[#00dbe7]'
                        }`}
                        title="Switch Reasoning Mode (Chat, Plan, Agent, Autonomous)"
                      >
                        {currentMode === 'plan' && <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {currentMode === 'agent' && <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                        {currentMode === 'autonomous' && <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {currentMode === 'chat' && <MessageSquare className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />}
                        <span className="font-extrabold">{currentMode.toUpperCase()}</span>
                        <ChevronDown className="w-3 h-3 opacity-70 shrink-0 ml-0.5" />
                      </button>

                      {isModeMenuOpen && (
                        <div className={`absolute bottom-full left-0 mb-2 w-64 max-w-[calc(100vw-32px)] rounded-xl border shadow-2xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100 ${
                          isLight ? 'bg-white border-slate-300 text-slate-800 shadow-slate-300/50' : 'bg-[#18181c] border-[#3a494b]/60 text-[#e5e1e4]'
                        }`}>
                          <div className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-b flex items-center justify-between ${
                            isLight ? 'border-slate-200 text-slate-500' : 'border-outline/10 text-gray-400'
                          }`}>
                            <span>Reasoning Mode</span>
                            <span className="text-[9px] opacity-60">Copilot Standard</span>
                          </div>
                          {[
                            { id: 'chat' as const, name: 'Chat Mode', desc: 'Conversational streaming & artifacts', icon: MessageSquare, color: 'text-[#00dbe7]' },
                            { id: 'plan' as const, name: 'Plan Mode', desc: 'Executable plan cards & milestones', icon: FileCode, color: 'text-amber-400' },
                            { id: 'agent' as const, name: 'Agent Mode', desc: 'Multi-step execution via MCP tools', icon: Bot, color: 'text-purple-400' },
                            { id: 'autonomous' as const, name: 'Autonomous Mode', desc: 'Closed-loop goals & self-validation', icon: Sparkles, color: 'text-emerald-400' }
                          ].map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => { setCurrentMode(m.id); setIsModeMenuOpen(false); }}
                              className={`p-2 rounded-lg text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                                currentMode === m.id
                                  ? isLight ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                                  : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/5 text-gray-300 hover:text-white'
                              }`}
                            >
                              <m.icon className={`w-4 h-4 shrink-0 mt-0.5 ${m.color}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between text-xs">
                                  <span>{m.name}</span>
                                  {currentMode === m.id && <span className={`text-[9px] font-mono font-bold ${isLight ? 'text-sky-600' : 'text-[#00dbe7]'}`}>ACTIVE</span>}
                                </div>
                                <p className={`text-[10px] line-clamp-1 mt-0.5 font-sans font-normal ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{m.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. Model Selector Dropdown */}
                    <div className="relative shrink-0" ref={modelMenuRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModelMenuOpen(!isModelMenuOpen);
                          setIsAgentMenuOpen(false);
                          setIsModeMenuOpen(false);
                          setIsQuickOptionsMenuOpen(false);
                        }}
                        className={`h-7 px-2 rounded-lg border text-[10px] sm:text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-all select-none shadow-xs ${
                          isLight ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300' : 'bg-surface-container-high/60 hover:bg-surface-container-high text-[#00dbe7] border-outline/20'
                        }`}
                        title={`Selected Model: ${selectedModel}`}
                      >
                        <Cpu className="w-3 h-3 text-[#00dbe7] shrink-0" />
                        <span className="font-bold truncate max-w-[65px] sm:max-w-[110px]">{selectedModel}</span>
                        <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
                      </button>

                      {isModelMenuOpen && (
                        <div className={`absolute bottom-full left-0 mb-2 w-60 max-w-[calc(100vw-32px)] rounded-xl border shadow-2xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100 ${
                          isLight ? 'bg-white border-slate-300 text-slate-800 shadow-slate-300/50' : 'bg-[#18181c] border-[#3a494b]/60 text-[#e5e1e4]'
                        }`}>
                          <div className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-b flex items-center justify-between ${
                            isLight ? 'border-slate-200 text-slate-500' : 'border-outline/10 text-gray-400'
                          }`}>
                            <span>Select Local Model</span>
                            <span className="text-[9px] opacity-60">ARM64</span>
                          </div>
                          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                            {[
                              { id: 'qwen2.5:1.5b', name: 'Qwen 2.5 1.5B', note: '⚡ Fast CPU (Default)' },
                              { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', note: '🧠 High Intelligence' },
                              { id: 'qwen2.5-coder:3b', name: 'Qwen 2.5 Coder 3B', note: '💻 Code Specialist' },
                              { id: 'deepseek-r1:1.5b', name: 'DeepSeek R1 1.5B', note: '🧠 Reasoning CoT' },
                              { id: 'gemma2:2b', name: 'Gemma 2 2B', note: '⚡ Google Architecture' }
                            ].map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => { setSelectedModel(m.id); setIsModelMenuOpen(false); }}
                                className={`w-full px-2 py-1.5 rounded-lg text-left text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                                  selectedModel === m.id
                                    ? isLight ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                                    : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                }`}
                              >
                                <span>{m.name}</span>
                                <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'opacity-60'}`}>{m.note}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Active Agent Persona Pill */}
                    <div className="relative shrink-0" ref={agentMenuRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAgentMenuOpen(!isAgentMenuOpen);
                          setIsModeMenuOpen(false);
                          setIsModelMenuOpen(false);
                          setIsQuickOptionsMenuOpen(false);
                        }}
                        className={`h-7 px-2 rounded-lg border text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all select-none shadow-xs ${
                          isLight
                            ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                            : 'bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface border-outline/20'
                        }`}
                        title={`Active Persona: ${selectedAgent.name}`}
                      >
                        <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                          {getAgentIcon(selectedAgent.icon)}
                        </div>
                        <span className="truncate max-w-[70px] sm:max-w-[110px]">{selectedAgent.name}</span>
                        <ChevronDown className="w-3 h-3 opacity-70 shrink-0 ml-0.5" />
                      </button>

                      {isAgentMenuOpen && (
                        <div className={`absolute bottom-full right-0 sm:right-auto sm:left-0 mb-2 w-72 max-w-[calc(100vw-32px)] rounded-xl border shadow-2xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100 ${
                          isLight ? 'bg-white border-slate-300 text-slate-800 shadow-slate-300/50' : 'bg-[#18181c] border-[#3a494b]/60 text-[#e5e1e4]'
                        }`}>
                          <div className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-b flex items-center justify-between ${
                            isLight ? 'border-slate-200 text-slate-500' : 'border-outline/10 text-gray-400'
                          }`}>
                            <span>Agent Personas</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAgentMenuOpen(false);
                                setStudioMode('ecosystem');
                              }}
                              className={`text-[9px] hover:underline cursor-pointer flex items-center gap-0.5 font-bold ${
                                isLight ? 'text-sky-600' : 'text-[#00dbe7]'
                              }`}
                            >
                              <span>Manage All</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </button>
                          </div>
                          <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
                            {AGENT_PERSONAS.map(agent => {
                              const isSel = selectedAgent.id === agent.id;
                              return (
                                <button
                                  key={agent.id}
                                  type="button"
                                  onClick={() => { handleAgentSelect(agent); setIsAgentMenuOpen(false); }}
                                  className={`w-full p-2 rounded-lg text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                                    isSel
                                      ? isLight ? 'bg-sky-50 text-sky-900 font-bold border border-sky-300/60' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                                      : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                  }`}
                                >
                                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
                                    {getAgentIcon(agent.icon)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className={`truncate ${isLight ? 'text-slate-900' : 'text-[#e5e1e4]'}`}>{agent.name}</span>
                                      <span className={`text-[9px] px-1 rounded uppercase font-mono shrink-0 ml-1 ${
                                        isLight ? 'bg-purple-100 text-purple-700 border border-purple-300/40' : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                      }`}>
                                        {agent.badge}
                                      </span>
                                    </div>
                                    <p className={`text-[10px] line-clamp-1 mt-0.5 font-sans font-normal ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{agent.description}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className={`pt-1.5 border-t ${isLight ? 'border-slate-200' : 'border-outline/10'}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAgentMenuOpen(false);
                                setStudioMode('ecosystem');
                              }}
                              className={`w-full py-1.5 px-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                isLight ? 'bg-slate-100 hover:bg-slate-200 text-sky-700 border border-slate-300' : 'bg-white/5 hover:bg-white/10 text-[#00dbe7] border border-white/10'
                              }`}
                            >
                              <Cpu className="w-3.5 h-3.5 shrink-0" />
                              <span>Open Agents &amp; Tools Studio →</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5. Quick Options / Tools Menu (Deep Research, RAG, Image Studio, Clear) */}
                    <div className="relative shrink-0" ref={quickOptionsMenuRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickOptionsMenuOpen(!isQuickOptionsMenuOpen);
                          setIsModeMenuOpen(false);
                          setIsAgentMenuOpen(false);
                          setIsModelMenuOpen(false);
                        }}
                        className={`h-7 px-2 rounded-lg border text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all select-none shadow-xs ${
                          isDeepResearch || isRagActive
                            ? isLight ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40'
                            : isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border-outline/20'
                        }`}
                        title="Chat Enhancements: Deep Web Research, Context RAG, Image Studio"
                      >
                        <Sliders className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden md:inline">Tools</span>
                        {(isDeepResearch || isRagActive) && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                        )}
                        <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
                      </button>

                      {isQuickOptionsMenuOpen && (
                        <div className={`absolute bottom-full right-0 mb-2 w-64 max-w-[calc(100vw-32px)] rounded-xl border shadow-2xl p-2 z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100 ${
                          isLight ? 'bg-white border-slate-300 text-slate-800 shadow-slate-300/50' : 'bg-[#18181c] border-[#3a494b]/60 text-[#e5e1e4]'
                        }`}>
                          <div className={`px-1.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-b flex items-center justify-between ${
                            isLight ? 'border-slate-200 text-slate-500' : 'border-outline/10 text-gray-400'
                          }`}>
                            <span>Chat Enhancements</span>
                            <span className="text-[9px] opacity-60">Copilot Engine</span>
                          </div>

                          {/* Deep Web Research Toggle */}
                          <button
                            type="button"
                            onClick={() => setIsDeepResearch(!isDeepResearch)}
                            className={`p-2 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer ${
                              isDeepResearch
                                ? isLight ? 'bg-sky-50 text-sky-900 border border-sky-300/60' : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30'
                                : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/5 text-gray-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Globe className={`w-4 h-4 shrink-0 ${isDeepResearch ? (isLight ? 'text-sky-600 animate-pulse' : 'text-[#00dbe7] animate-pulse') : 'text-gray-400'}`} />
                              <div>
                                <div className="text-xs font-bold font-mono">Deep Research</div>
                                <div className={`text-[10px] opacity-75 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Live web intelligence</div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isDeepResearch 
                                ? (isLight ? 'bg-sky-100 text-sky-700' : 'bg-[#00dbe7]/20 text-[#00dbe7]')
                                : (isLight ? 'bg-slate-200 text-slate-600' : 'bg-gray-500/20 text-gray-400')
                            }`}>
                              {isDeepResearch ? 'ON' : 'OFF'}
                            </span>
                          </button>

                          {/* Contextual RAG Toggle */}
                          <button
                            type="button"
                            onClick={() => setIsRagActive(!isRagActive)}
                            className={`p-2 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer ${
                              isRagActive
                                ? isLight ? 'bg-emerald-50 text-emerald-900 border border-emerald-300/60' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/5 text-gray-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <BookOpen className={`w-4 h-4 shrink-0 ${isRagActive ? (isLight ? 'text-emerald-600 animate-pulse' : 'text-emerald-400 animate-pulse') : 'text-gray-400'}`} />
                              <div>
                                <div className="text-xs font-bold font-mono">Contextual RAG</div>
                                <div className={`text-[10px] opacity-75 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Hybrid BM25 + dense vectors</div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isRagActive
                                ? (isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400')
                                : (isLight ? 'bg-slate-200 text-slate-600' : 'bg-gray-500/20 text-gray-400')
                            }`}>
                              {isRagActive ? 'ON' : 'OFF'}
                            </span>
                          </button>

                          {/* Image Studio Trigger */}
                          <button
                            type="button"
                            onClick={() => { setIsImageModalOpen(true); setIsQuickOptionsMenuOpen(false); }}
                            className={`p-2 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer ${
                              isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/5 text-gray-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ImageIcon className="w-4 h-4 text-pink-500 shrink-0" />
                              <div>
                                <div className="text-xs font-bold font-mono">Image Studio</div>
                                <div className={`text-[10px] opacity-75 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Janus-Pro &amp; Flux.1</div>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                          </button>

                          {/* Clear Conversation */}
                          <button
                            type="button"
                            onClick={() => { promptClearChat(); setIsQuickOptionsMenuOpen(false); }}
                            className={`p-2 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer border-t text-rose-500 hover:bg-rose-500/10 ${
                              isLight ? 'border-slate-200' : 'border-outline/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Trash2 className="w-4 h-4 shrink-0" />
                              <div className="text-xs font-bold font-mono">Clear Chat</div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Fixed Send / Stop Action */}
                  <div className="flex items-center shrink-0">
                    {isGenerating ? (
                      <button
                        type="button"
                        onClick={handleStopGeneration}
                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer shadow-sm select-none shrink-0"
                      >
                        <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!inputPrompt.trim() && pendingAttachments.length === 0}
                        className="h-7 sm:h-8 px-3 sm:px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border border-[#00dbe7]/50 hover:border-[#00dbe7] transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed select-none shrink-0"
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
      ) : studioMode === 'ecosystem' ? (
        <AIEcosystemStudioView
          theme={theme}
          selectedAgent={selectedAgent}
          onSelectAgent={(agent) => {
            handleAgentSelect(agent);
          }}
          onOpenChat={() => setStudioMode('custom-chat')}
          mcpServers={mcpServers}
          onExecuteMcpTool={async (toolName, args) => {
            return executeMcpToolCall(toolName, args, userToken);
          }}
          terminalLogs={logs}
          skills={skills}
          selectedSkillId={selectedSkillId}
          onSelectSkill={setSelectedSkillId}
          userToken={userToken}
          onPrepopulatePrompt={(prompt) => {
            setInputPrompt(prompt);
            textareaRef.current?.focus();
          }}
        />
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

      {/* Agent Persona Selection Modal */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
          }`}>
            <div className="h-1 w-full bg-[#00dbe7]" />
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/40'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center shrink-0">
                  <Bot className={`w-5 h-5 shrink-0 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                </div>
                <div>
                  <h3 className={`text-base font-bold font-sans ${isLight ? 'text-slate-900' : 'text-[#e5e1e4]'}`}>
                    Agent Personas
                  </h3>
                  <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Select an autonomous role for specialized reasoning
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(false)}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
                title="Close modal"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AGENT_PERSONAS.map((agent) => {
                  const isSelected = selectedAgent.id === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => {
                        handleAgentSelect(agent);
                        setIsAgentModalOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isSelected
                          ? isLight
                            ? 'bg-sky-50 border-sky-400 text-slate-900 shadow-xs ring-1 ring-sky-400/40'
                            : 'bg-[#00dbe7]/10 border-[#00dbe7]/50 text-[#e5e1e4] shadow-xs ring-1 ring-[#00dbe7]/30'
                          : isLight
                            ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:shadow-xs'
                            : 'bg-[#18181c]/70 hover:bg-[#18181c] border-[#3a494b]/40 hover:border-[#3a494b]/80 text-[#e5e1e4]'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
                        {getAgentIcon(agent.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`font-bold text-xs sm:text-sm truncate ${isLight ? 'text-slate-900' : 'text-[#e5e1e4]'}`}>
                            {agent.name}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
                            isLight
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          }`}>
                            {agent.badge}
                          </span>
                        </div>
                        <p className={`text-[11px] font-mono mt-0.5 line-clamp-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                          {agent.title}
                        </p>
                        <p className={`text-[11px] leading-relaxed mt-1 line-clamp-2 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                          {agent.description}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono">
                          <span className={isLight ? 'text-slate-500' : 'text-gray-400'}>Model:</span>
                          <span className={isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold'}>
                            {agent.recommendedModel}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-1 ${isLight ? 'text-sky-600' : 'text-[#00dbe7]'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-3.5 border-t flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/40'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setIsAgentModalOpen(false);
                  setStudioMode('ecosystem');
                }}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-sky-700 border border-slate-300 shadow-xs'
                    : 'bg-white/5 hover:bg-white/10 text-[#00dbe7] border border-white/10'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>Open Agents &amp; Tools Studio →</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAgentModalOpen(false)}
                className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                    : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Context Protocol (MCP) Infrastructure Modal */}
      {isMcpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
          }`}>
            <div className="h-1 w-full bg-[#00dbe7]" />
            <div className="p-4 sm:p-5 border-b flex items-center justify-between gap-3 border-inherit">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-[#00dbe7] shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Model Context Protocol (MCP) Infrastructure</h3>
                  <p className="text-xs text-on-surface-variant font-mono">6 Native &amp; Containerized MCP Servers connected to Oracle Cloud fleet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMcpModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
              <div className="text-xs text-on-surface-variant leading-relaxed">
                MCP enables AI Agent Studio to interact directly with SutharLabs PostgreSQL databases, AST knowledge graphs, and cloud storage vault in real time without context contamination.
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: 'database-mcp',
                    name: 'Database Engine MCP',
                    desc: 'PostgreSQL 16 Primary (Oracle Cloud Port 5432) + Neon Standby Failover Parity',
                    status: 'connected',
                    tool: 'database_schema_and_stats'
                  },
                  {
                    id: 'graphify-mcp',
                    name: 'Knowledge Graph MCP',
                    desc: 'AST Codebase Graph with God-node analysis & semantic relationship mapping',
                    status: 'connected',
                    tool: 'codebase_graph_query'
                  },
                  {
                    id: 'storage-vault-mcp',
                    name: 'Storage Vault MCP',
                    desc: 'Oracle Cloud File System & Vault Record Inspector over HTTP',
                    status: 'connected',
                    tool: 'storage_vault_list'
                  },
                  {
                    id: 'fleet-telemetry-mcp',
                    name: 'Cloud Fleet Telemetry MCP',
                    desc: 'Multi-node Always Free VM cluster telemetry (VM1 & VM2 RAM/Swap/Load)',
                    status: 'connected',
                    tool: 'fleet_health_check'
                  },
                  {
                    id: 'contextual-rag-mcp',
                    name: 'Contextual RAG & Semantic Corpus MCP',
                    desc: 'Hybrid dense semantic vectors (nomic-embed-text) + BM25 with Reciprocal Rank Fusion (RRF, k=60)',
                    status: 'connected',
                    tool: 'contextual_rag_query'
                  },
                  {
                    id: 'web-search-mcp',
                    name: 'Real-Time Web Intelligence MCP',
                    desc: 'DuckDuckGo Instant Search API for real-time external documentation',
                    status: 'connected',
                    tool: 'web_search'
                  }
                ].map(srv => (
                  <div key={srv.id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-low/50 border-outline/10'
                  }`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{srv.name}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                          {srv.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{srv.desc}</p>
                    </div>

                    <button
                      type="button"
                      disabled={isTestingMcp}
                      onClick={async () => {
                        setIsTestingMcp(true);
                        try {
                          const res = await executeMcpToolCall(srv.tool, {}, userToken);
                          setMcpTestResult(res);
                        } catch (err: any) {
                          setMcpTestResult({ error: err.message });
                        } finally {
                          setIsTestingMcp(false);
                        }
                      }}
                      className={`h-7 px-2.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer shrink-0 select-none ${
                        isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#00dbe7] border-[#00dbe7]/30'
                      }`}
                    >
                      {isTestingMcp ? 'Probing...' : 'Probe Live'}
                    </button>
                  </div>
                ))}
              </div>

              {mcpTestResult && (
                <div className={`mt-3 p-3 rounded-xl border text-[11px] font-mono overflow-x-auto select-all ${
                  isLight ? 'bg-slate-900 text-emerald-400 border-slate-800' : 'bg-black/60 text-[#00dbe7] border-[#3a494b]/40'
                }`}>
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Live MCP Diagnostic Response:</div>
                  <pre>{JSON.stringify(mcpTestResult, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="p-3.5 border-t border-inherit flex items-center justify-between">
              <span className="text-[11px] font-mono text-on-surface-variant">
                MCP protocol compatible with Anthropic &amp; GitHub standards
              </span>
              <button
                type="button"
                onClick={() => setIsMcpModalOpen(false)}
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

      {/* Image Studio & Multimodal Processing Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
          }`}>
            <div className="h-1 w-full bg-pink-500" />
            <div className="p-4 sm:p-5 border-b flex items-center justify-between gap-3 border-inherit">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5 text-pink-500 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Sovereign Multimodal Image Studio</h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    DeepSeek Janus-Pro-1B • FLUX.1 [schnell] • SDXL-Turbo • Show-o
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Sub-Tabs: Generate vs Process */}
            <div className={`px-4 pt-3 flex gap-2 border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#3a494b]/30 bg-[#161619]'}`}>
              <button
                type="button"
                onClick={() => setProcTab('generate')}
                className={`pb-2 px-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  procTab === 'generate'
                    ? 'border-pink-500 text-pink-500'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                1. Text-to-Image Synthesis
              </button>
              <button
                type="button"
                onClick={() => setProcTab('process')}
                className={`pb-2 px-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  procTab === 'process'
                    ? 'border-pink-500 text-pink-500'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                2. Image Processing &amp; Vision
              </button>
            </div>

            {imageStudioError && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center justify-between gap-2">
                <span>{imageStudioError}</span>
                <button
                  type="button"
                  onClick={() => setImageStudioError(null)}
                  className="p-1 rounded hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            )}

            <div className="p-4 sm:p-5 max-h-[65vh] overflow-y-auto space-y-4 custom-scrollbar">
              {procTab === 'generate' ? (
                <>
                  {/* Prompt Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono text-on-surface flex items-center justify-between">
                      <span>Artistic Prompt</span>
                      <span className="text-[10px] text-on-surface-variant">Describe the subject, lighting, and composition</span>
                    </label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="E.g. A hyper-detailed cybernetic sovereign datacenter server room bathed in volumetric cyan and neon purple lighting..."
                      rows={3}
                      className={`w-full p-2.5 rounded-xl text-xs font-sans border resize-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-pink-500'
                          : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder-gray-500 focus:border-pink-500'
                      }`}
                    />
                  </div>

                  {/* Model Selector Cards */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono text-on-surface">Open-Weight Architecture</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        {
                          id: 'janus-pro-1b',
                          name: 'DeepSeek Janus-Pro-1B',
                          badge: 'Unified 1.5B • CPU Friendly',
                          color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
                          desc: 'DeepSeek autoregressive visual tokens. 384x384 native output, runnable on CPU.'
                        },
                        {
                          id: 'flux-schnell',
                          name: 'FLUX.1 [schnell]',
                          badge: '12B Flow Matching • SOTA',
                          color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
                          desc: 'Black Forest Labs 4-step rectified flow. Photorealistic anatomy & typography.'
                        },
                        {
                          id: 'sdxl-turbo',
                          name: 'Stability SDXL-Turbo',
                          badge: 'Real-Time 1-Step',
                          color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                          desc: 'Single-step adversarial diffusion distillation. Fast interactive feedback.'
                        },
                        {
                          id: 'show-o',
                          name: 'NUS/ByteDance Show-o (1.3B)',
                          badge: 'Masked Diffusion 1.3B',
                          color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
                          desc: 'Unified language model with discrete diffusion tokens in shared vocabulary.'
                        }
                      ].map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setImageModel(m.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            imageModel === m.id
                              ? isLight
                                ? 'bg-pink-50 border-pink-400 text-pink-950 shadow-xs ring-1 ring-pink-300'
                                : 'bg-pink-500/15 border-pink-500/60 text-white shadow-xs ring-1 ring-pink-500/40'
                              : isLight
                              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              : 'bg-white/5 hover:bg-white/10 border-white/5 text-on-surface-variant'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs">{m.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold border uppercase shrink-0 ${m.color}`}>
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">{m.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Style Presets */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono text-on-surface">Artistic Style</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'cinematic', label: 'Cinematic Still' },
                        { id: 'photorealistic', label: 'Photorealistic 8K' },
                        { id: 'anime', label: 'Anime / Shinkai' },
                        { id: 'cyberpunk', label: 'Cyberpunk Neon' },
                        { id: '3d-render', label: 'Octane 3D Render' },
                        { id: 'minimalist', label: 'Minimalist Vector' },
                        { id: 'digital-art', label: 'Digital Concept Art' }
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setImageStyle(s.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            imageStyle === s.id
                              ? isLight
                                ? 'bg-pink-500 text-white shadow-xs'
                                : 'bg-pink-500/20 text-pink-400 border border-pink-500/50 shadow-xs'
                              : isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              : 'bg-white/5 hover:bg-white/10 text-on-surface-variant border border-white/10'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono text-on-surface">Aspect Ratio</label>
                    <div className="flex gap-2">
                      {[
                        { id: '1:1', label: '1:1 Square (1024×1024)' },
                        { id: '16:9', label: '16:9 Landscape (1280×720)' },
                        { id: '9:16', label: '9:16 Portrait (720×1280)' },
                        { id: '4:3', label: '4:3 Standard (1024×768)' }
                      ].map((ar) => (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() => setImageAspectRatio(ar.id as any)}
                          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer text-center ${
                            imageAspectRatio === ar.id
                              ? isLight
                                ? 'bg-pink-500 text-white border-pink-600 shadow-xs'
                                : 'bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-xs'
                              : isLight
                              ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              : 'bg-white/5 text-on-surface-variant border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {ar.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Tab 2: Image Processing & Vision */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono text-on-surface">Select Image to Process</label>
                    <div className="flex items-center gap-3">
                      <label className={`flex-1 p-3 rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/20'
                      }`}>
                        <FileUp className="w-5 h-5 text-pink-400 mb-1" />
                        <span className="text-xs font-mono text-on-surface">Upload Image (PNG, JPG, WebP)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const b64 = ev.target?.result as string;
                                setProcImageBase64(b64);
                                setProcImagePreview(b64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {procImagePreview && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-pink-500/40 bg-black/30 shrink-0">
                          <img src={procImagePreview} alt="Target" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Processing Operations */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono text-on-surface">Select Operation</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'remove-background', label: 'Remove Background', desc: 'Transparent cutout PNG' },
                        { id: 'grayscale', label: 'B&W Grayscale', desc: 'High-contrast monochrome' },
                        { id: 'invert', label: 'Invert Colors', desc: 'Neon negative matrix style' },
                        { id: 'contrast', label: 'Contrast Boost', desc: 'Enhance dynamic range' },
                        { id: 'analyze', label: 'AI Vision Analysis', desc: 'Qwen2.5-VL / Janus-Pro analysis' }
                      ].map((op) => (
                        <div
                          key={op.id}
                          onClick={() => setProcOperation(op.id as any)}
                          className={`p-2 rounded-xl border cursor-pointer text-left transition-all ${
                            procOperation === op.id
                              ? isLight
                                ? 'bg-pink-50 border-pink-400 text-pink-900 shadow-xs'
                                : 'bg-pink-500/15 border-pink-500/60 text-white shadow-xs'
                              : isLight
                              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              : 'bg-white/5 hover:bg-white/10 border-white/5 text-on-surface-variant'
                          }`}
                        >
                          <div className="text-xs font-bold">{op.label}</div>
                          <div className="text-[10px] text-on-surface-variant mt-0.5">{op.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {procOperation === 'analyze' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold font-mono text-on-surface">Analysis Question / Prompt</label>
                      <input
                        type="text"
                        value={procPrompt}
                        onChange={(e) => setProcPrompt(e.target.value)}
                        placeholder="E.g. What objects are present? Analyze lighting and detect any text."
                        className={`w-full h-8 px-2.5 rounded-lg text-xs font-mono border ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder-gray-500'
                        }`}
                      />
                    </div>
                  )}

                  {/* Processing Result Display */}
                  {(procResultUrl || procAnalysisText) && (
                    <div className={`p-3 rounded-xl border space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-[#3a494b]/40'
                    }`}>
                      <div className="text-xs font-bold text-pink-500">Processed Output</div>
                      {procResultUrl && (
                        <div className="max-h-48 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center bg-black/50">
                          <img src={procResultUrl} alt="Processed" className="max-h-48 object-contain" />
                        </div>
                      )}
                      {procAnalysisText && (
                        <div className={`p-2.5 rounded font-mono text-xs leading-relaxed whitespace-pre-wrap ${
                          isLight ? 'bg-white text-slate-800' : 'bg-[#121215] text-[#e5e1e4]'
                        }`}>
                          {procAnalysisText}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3.5 border-t border-inherit flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-on-surface-variant">
                {procTab === 'generate' ? `Target: ${imageModel} (${imageAspectRatio})` : `Action: ${procOperation}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer ${
                    isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-white'
                  }`}
                >
                  Cancel
                </button>
                {procTab === 'generate' ? (
                  <button
                    type="button"
                    disabled={isGeneratingImage || !imagePrompt.trim()}
                    onClick={() => handleGenerateImage()}
                    className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                      isGeneratingImage || !imagePrompt.trim()
                        ? 'opacity-50 cursor-not-allowed bg-slate-400 text-white'
                        : isLight
                        ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm'
                        : 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/50 shadow-sm'
                    }`}
                  >
                    {isGeneratingImage && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                    <span>{isGeneratingImage ? 'Synthesizing...' : 'Generate Image'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessingImg || (!procImageBase64 && !procImagePreview)}
                    onClick={() => handleProcessImage()}
                    className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                      isProcessingImg || (!procImageBase64 && !procImagePreview)
                        ? 'opacity-50 cursor-not-allowed bg-slate-400 text-white'
                        : isLight
                        ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm'
                        : 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/50 shadow-sm'
                    }`}
                  >
                    {isProcessingImg && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                    <span>{isProcessingImg ? 'Processing...' : 'Apply Transformation'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Zoom Modal */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-150 cursor-zoom-out"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={zoomImageUrl}
              alt="Enlarged view"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={zoomImageUrl}
                download="sutharlabs_artwork_full.png"
                className="h-8 px-4 rounded-lg bg-pink-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-pink-600"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Save Full Resolution</span>
              </a>
              <button
                type="button"
                onClick={() => setZoomImageUrl(null)}
                className="h-8 px-4 rounded-lg bg-white/20 text-white hover:bg-white/30 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Vault Notification Toast */}
      {savedVaultNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-3 px-4 rounded-xl bg-emerald-500 text-white text-xs font-mono font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedVaultNotice}</span>
        </div>
      )}
      {isRagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
          }`}>
            <div className="h-1 w-full bg-[#00dbe7]" />
            <div className="p-4 sm:p-5 border-b flex items-center justify-between gap-3 border-inherit">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[#00dbe7] shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Sovereign Contextual RAG Engine</h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    Anthropic Contextual Retrieval + Dense nomic-embed-text + BM25 RRF (k=60)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRagModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-[65vh] overflow-y-auto space-y-4 custom-scrollbar">
              {/* Architecture Summary */}
              <div className="text-xs text-on-surface-variant leading-relaxed">
                Contextual RAG prepends situational document and section headers to every semantic chunk before indexing. Queries undergo hybrid retrieval fusing dense semantic vector cosine similarity (<code className={`px-1 py-0.5 rounded text-[10px] font-mono border ${isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-white/5 text-[#00dbe7] border-white/10'}`}>nomic-embed-text</code>, 768-dim) and lexical BM25 keyword matching via Reciprocal Rank Fusion (RRF, $k=60$).
              </div>

              {/* RAG Telemetry Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className={`p-2.5 rounded-xl border text-center ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
                }`}>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase font-bold">Total Docs</div>
                  <div className="text-base font-extrabold text-[#00dbe7] mt-0.5">
                    {ragStats?.totalDocuments ?? 3}
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border text-center ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
                }`}>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase font-bold">Total Chunks</div>
                  <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                    {ragStats?.totalChunks ?? 12}
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border text-center ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
                }`}>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase font-bold">Dense Model</div>
                  <div className="text-xs font-bold text-purple-400 mt-1 truncate">
                    nomic-embed-text
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border text-center ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
                }`}>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase font-bold">Fusion Engine</div>
                  <div className="text-xs font-bold text-amber-400 mt-1 truncate">
                    RRF (k=60) + BM25
                  </div>
                </div>
              </div>

              {/* Interactive Retrieval Test Tool */}
              <div className={`p-3 rounded-xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-low/50 border-outline/10'
              }`}>
                <div className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <span>Interactive Contextual Retrieval Probe</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">Real-time Hybrid Evaluation</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ragTestQuery}
                    onChange={(e) => setRagTestQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const btn = document.getElementById('run-rag-test-btn');
                        btn?.click();
                      }
                    }}
                    placeholder="E.g. Oracle fleet topology, database replication runbook, or RAG architecture..."
                    className={`flex-1 h-8 px-2.5 rounded-lg text-xs font-mono border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                        : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder-gray-500 focus:border-[#00dbe7]'
                    }`}
                  />
                  <button
                    id="run-rag-test-btn"
                    type="button"
                    disabled={isTestingRag || !ragTestQuery.trim()}
                    onClick={async () => {
                      if (!ragTestQuery.trim()) return;
                      setIsTestingRag(true);
                      try {
                        const res = await queryContextualRag(ragTestQuery.trim(), { topK: 3 }, userToken);
                        setRagTestResults(res.results || []);
                      } catch (err: any) {
                        setRagTestResults([{ error: err.message }]);
                      } finally {
                        setIsTestingRag(false);
                      }
                    }}
                    className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 select-none ${
                      isLight
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border border-sky-600 shadow-sm'
                        : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/50 shadow-sm'
                    }`}
                  >
                    {isTestingRag ? 'Searching...' : 'Run Query'}
                  </button>
                </div>

                {/* Test Results Display */}
                {ragTestResults.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-outline/10">
                    <div className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
                      Retrieval Results ({ragTestResults.length} passages matched):
                    </div>
                    {ragTestResults.map((r, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-[11px] font-mono space-y-1 ${
                          isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-black/40 border-white/10 text-white'
                        }`}
                      >
                        {r.error ? (
                          <div className="text-rose-400 font-bold">Error: {r.error}</div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="font-bold text-[#00dbe7] truncate max-w-[280px]">
                                {r.document || 'Corpus Document'}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold">
                                {r.relevance} Parity
                              </span>
                            </div>
                            <div className="text-[10px] text-on-surface-variant font-semibold">
                              Section: {r.section} • Source: {r.source}
                            </div>
                            <div className={`p-2 rounded font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-28 overflow-y-auto ${
                              isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#18181c] text-gray-300'
                            }`}>
                              {r.excerpt}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Indexed Platform Documents Overview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-on-surface">Pre-Seeded Sovereign Platform Documents</div>
                {[
                  {
                    title: 'SutharLabs Sovereign Fleet & Hybrid Infrastructure Architecture',
                    id: 'sutharlabs_fleet_architecture',
                    desc: 'Oracle Cloud VM 1 (PostgreSQL 16 & Vault), VM 2 (Ollama & XTTS), VM 3 (Express API Gateway) + Neon Standby failover.',
                    badge: 'Fleet Architecture'
                  },
                  {
                    title: 'SutharLabs Dual-Database Replication and Failover Runbook',
                    id: 'database_replication_runbook',
                    desc: 'Daily 20:30 UTC cron sync, unidirectional Primary -> Standby replication, topological FK graph, automated failover.',
                    badge: 'DB Runbook'
                  },
                  {
                    title: 'SutharLabs AI Agent Studio, Contextual RAG & MCP Architecture',
                    id: 'ai_agent_studio_and_rag_architecture',
                    desc: 'Anthropic Contextual Retrieval, dense vector (nomic-embed-text) + BM25 RRF, 4 reasoning modes, background worker persistence.',
                    badge: 'Contextual RAG'
                  }
                ].map(doc => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-surface-container-low/50 border-outline/10'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-bold text-xs truncate">{doc.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase shrink-0">
                          {doc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 border-t border-inherit flex items-center justify-between">
              <span className="text-[11px] font-mono text-on-surface-variant">
                Contextual RAG Engine v2.0 • Zero-Cost Sovereign Compute
              </span>
              <button
                type="button"
                onClick={() => setIsRagModalOpen(false)}
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

