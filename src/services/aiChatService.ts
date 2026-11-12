import { AIAgentPersona, AIChatMessage, AIChatMode, AIChatBackgroundTask, MCPServerInfo, AISkillInfo } from '../types';

export interface OllamaModelTag {
  name: string;
  size: number;
  digest: string;
  details: {
    parameter_size: string;
    quantization_level: string;
    family: string;
  };
}

export const AGENT_PERSONAS: AIAgentPersona[] = [
  {
    id: 'cloud-architect',
    name: 'Sovereign Cloud Architect',
    title: 'Cloud Infrastructure & DevOps Engineer',
    icon: 'server',
    badge: 'OCI & Docker',
    description: 'Expert in Oracle Cloud Always Free VM orchestration, swap tuning, Nginx proxies, and Linux security.',
    systemPrompt: `You are the Lead Sovereign Cloud Infrastructure Architect for SutharLabs. You specialize in zero-cost, high-reliability enterprise cloud architectures using Oracle Cloud Always Free compute (AMD E2.1.Micro and Ampere ARM A1), Docker containerization, Linux memory and swap tuning, Nginx reverse proxies, and secure networking. Always provide production-ready commands, architectural clarity, and precise, well-reasoned explanations.`,
    recommendedModel: 'qwen2.5:1.5b'
  },
  {
    id: 'database-architect',
    name: 'Database Engine Architect',
    title: 'PostgreSQL & Replication DBA',
    icon: 'database',
    badge: 'PostgreSQL 16',
    description: 'Specialist in low-footprint PostgreSQL tuning, dual-database replication, query optimization, and schema design.',
    systemPrompt: `You are the Chief Database Administrator (DBA) for SutharLabs. You oversee the PostgreSQL 16 database running on Oracle Cloud and disaster recovery replication to Neon. You specialize in low-memory PostgreSQL configuration, indexing strategies, query execution plans, ACID transactions, data consistency verification, and Prisma ORM migrations. Provide exact SQL statements, explain trade-offs, and prioritize database integrity.`,
    recommendedModel: 'qwen2.5:1.5b'
  },
  {
    id: 'software-engineer',
    name: 'Full-Stack Engineer',
    title: 'React 19 & TypeScript Engineer',
    icon: 'code',
    badge: 'React & Node',
    description: 'Crafts elegant, high-performance UI code adhering to Tailwind CSS v4, component isolation, and clean APIs.',
    systemPrompt: `You are a Principal Full-Stack Engineer at SutharLabs. You build resilient, high-speed interfaces using React 19, TypeScript, Tailwind CSS v4, and Node.js. Always format code cleanly with type safety, follow strict design system tokens, ensure dark and light mode harmony, and avoid unhandled edge cases. When producing code or configuration files, structure them modularly.`,
    recommendedModel: 'qwen2.5-coder:3b'
  },
  {
    id: 'quant-analyst',
    name: 'Quantitative Strategist',
    title: 'Algorithmic Trading & Math Quant',
    icon: 'line-chart',
    badge: 'Quant Models',
    description: 'Analyzes financial markets, statistical indicators, backtesting logic, and risk modeling formulas.',
    systemPrompt: `You are a Senior Quantitative Analyst at SutharLabs. You specialize in statistical arbitrage, algorithmic trading execution, risk modeling (Sharpe, Sortino, VaR), Fibonacci series, moving averages, and technical indicators. Always verify mathematical formulas, detail time and space complexities, and output concise analytical summaries.`,
    recommendedModel: 'gemma4:e2b'
  },
  {
    id: 'math-reasoner',
    name: 'Mathematical & Logic Reasoner',
    title: 'Symbolic Reasoning & CoT Specialist',
    icon: 'cpu',
    badge: 'DeepSeek-R1 CoT',
    description: 'Uses DeepSeek-R1 chain-of-thought to solve complex algorithms, verify logic proofs, and compute mathematical models step-by-step.',
    systemPrompt: `You are the Lead Symbolic Reasoner and Mathematical Analyst for SutharLabs, powered by DeepSeek-R1 chain-of-thought architecture. When solving problems, think rigorously step-by-step, verify edge cases, prove formulas mathematically, and provide clear structured conclusions with complete algorithmic notation.`,
    recommendedModel: 'deepseek-r1:1.5b'
  },
  {
    id: 'research-synthesizer',
    name: 'Research & Intelligence Agent',
    title: 'Web Synthesis & Documentation Analyst',
    icon: 'globe',
    badge: 'Docs & Intelligence',
    description: 'Synthesizes technical documentation, compares open-source tools, extracts web data, and crafts exhaustive architectural reports.',
    systemPrompt: `You are the Lead Technical Research and Intelligence Agent for SutharLabs. You analyze APIs, documentation, open-source repositories, and system architectures. Structure answers with high-density insights, objective trade-off matrices, and actionable implementation roadmaps.`,
    recommendedModel: 'qwen2.5-coder:3b'
  },
  {
    id: 'sovereign-assistant',
    name: 'Sovereign Assistant',
    title: 'Fast Synthesis & General Intelligence',
    icon: 'sparkles',
    badge: 'Fast Synthesis',
    description: 'General-purpose intelligent assistant powered by Google Gemma 4 E2B for ultra-fast conversational answers and edge multimodal intelligence.',
    systemPrompt: `You are SutharLabs Sovereign AI, a sharp, concise, and helpful artificial intelligence running locally on private ARM64 cloud infrastructure. Provide clear, direct, and well-structured answers with zero corporate fluff.`,
    recommendedModel: 'gemma4:e2b'
  },
  {
    id: 'video-director',
    name: 'Motion Graphic & Video Director',
    title: 'Video Compositor & Social Reel Specialist',
    icon: 'film',
    badge: '9:16 & 16:9 Reels',
    description: 'Specializes in multi-aspect ratio kinetic motion graphics (9:16 Reels/Shorts/TikTok, 16:9 YouTube, 1:1 Square) with storyboard scripting and HTML5 Canvas animation logic.',
    systemPrompt: `You are the Lead Video Director and Motion Graphics Specialist for SutharLabs. You architect high-impact social reels, product launch teasers, and metric animations. When asked to generate videos or motion scripts, recommend optimal aspect ratios (9:16 for Reels/Shorts/TikTok, 16:9 for YouTube/Desktop, 1:1 for Instagram), provide kinetic typography timing, audio soundwave cues, and exact Canvas/HTML motion specifications that can directly run in the Motion Video & Reels Studio (/tools/motion-video).`,
    recommendedModel: 'qwen2.5-coder:3b'
  },
  {
    id: 'creative-designer',
    name: 'Creative Visual & Mockup Designer',
    title: 'Brand Asset & Deterministic Mockup Specialist',
    icon: 'palette',
    badge: 'Mockups & Thumbnails',
    description: 'Specializes in high-CTR YouTube thumbnails, 3D device mockups, apparel design, and crisp SVG visual assets without diffusion hallucination.',
    systemPrompt: `You are the Lead Creative Visual Designer and Mockup Specialist for SutharLabs. You create high-CTR YouTube thumbnails, device frames (MacBook, iPhone), transparent PNG cutouts, and SVG graphics. You guide users on color theory, typography hierarchy, sticker glow outlines, and 3D isometric perspectives compatible with the Thumbnail & Mockup Studio (/tools/mockup-studio) and AI Background Remover (/tools/background-remover).`,
    recommendedModel: 'qwen2.5-coder:3b'
  },
  {
    id: 'edgerock-reasoner',
    name: 'EdgeRock Constant-Memory Reasoner',
    title: 'Long-Context & Flat-KV Specialist',
    icon: 'zap',
    badge: '256K Constant KV',
    description: 'Powered by EdgeRock-4B (Rock Matrix Gated DeltaNet). Retains massive 256K context at constant 72MB memory for uninterrupted complex reasoning.',
    systemPrompt: `You are the Lead Constant-Memory Reasoning Specialist for SutharLabs, powered by EdgeRock-4B (4.5B parameters, Rock Matrix hybrid architecture). You leverage Gated DeltaNet recurrent memory and Rock Memory Anchors (RMA) to process ultra-long multi-turn contexts (up to 256K tokens) with fixed-size memory footprint. Synthesize deep codebases, multi-file architectural specifications, and complex mathematical proofs without context loss or attention degradation.`,
    recommendedModel: 'edgerock:4b'
  }
];

export async function fetchAIModels(token?: string): Promise<OllamaModelTag[]> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/models', { headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch AI models (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.models || [];
}

export async function fetchAIHealth(): Promise<{ status: string; node: string; engine: string; memory: string }> {
  const res = await fetch('/api/ai/health');
  if (!res.ok) {
    throw new Error(`AI node health check failed (HTTP ${res.status})`);
  }
  return res.json();
}

export interface StreamChatParams {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  token?: string;
  signal?: AbortSignal;
  streamId?: string;
  onStreamId?: (streamId: string) => void;
  onChunk: (chunk: string) => void;
  onDone?: (metrics: {
    totalTokens: number;
    speedTokensPerSec: number;
    durationMs: number;
  }) => void;
}

export async function abortAIChatStream(streamId: string, token?: string): Promise<boolean> {
  if (!streamId) return false;
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/ai/chat/stream/${streamId}/abort`, {
      method: 'POST',
      headers
    });
    return res.ok;
  } catch (err) {
    console.warn('[aiChatService] Failed to notify server of abort:', err);
    return false;
  }
}

export async function streamAIChat({
  model,
  messages,
  token,
  signal,
  streamId: initialStreamId,
  onStreamId,
  onChunk,
  onDone
}: StreamChatParams): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const assignedStreamId = initialStreamId || `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  if (onStreamId) {
    onStreamId(assignedStreamId);
  }

  const startTime = Date.now();
  let finalEvalCount = 0;
  let finalEvalDurationNs = 0;
  let highestSeq = 0;
  let isStreamFinished = false;

  // Reusable SSE line processor
  const processStreamReader = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const abortHandler = () => {
      try { reader.cancel(); } catch {}
    };

    if (signal) {
      if (signal.aborted) {
        abortHandler();
        return;
      }
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    try {
      while (true) {
        if (signal?.aborted || isStreamFinished) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (signal?.aborted) break;
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue; // Ignore SSE keep-alive comments

          let payloadStr = trimmed;
          if (payloadStr.startsWith('data:')) {
            payloadStr = payloadStr.replace(/^data:\s*/, '').trim();
          }
          if (!payloadStr) continue;

          try {
            const parsed = JSON.parse(payloadStr);

            if (parsed.streamId && onStreamId) {
              onStreamId(parsed.streamId);
            }

            if (typeof parsed.seq === 'number') {
              highestSeq = Math.max(highestSeq, parsed.seq);
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.message && parsed.message.content) {
              onChunk(parsed.message.content);
            }

            if (parsed.done) {
              finalEvalCount = parsed.eval_count || finalEvalCount;
              finalEvalDurationNs = parsed.eval_duration || finalEvalDurationNs;
              isStreamFinished = true;
              break;
            }
          } catch (jsonErr: any) {
            if (jsonErr.message && !jsonErr.message.includes('JSON')) {
              throw jsonErr;
            }
          }
        }

        if (isStreamFinished) break;
      }
    } finally {
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
      try { reader.releaseLock(); } catch {}
    }
  };

  try {
    // 1. Initial Connection: POST /api/ai/chat with SSE handshake
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        streamId: assignedStreamId
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `AI inference failed (HTTP ${res.status})`);
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported by server.');
    }

    await processStreamReader(res.body.getReader());
  } catch (initialErr: any) {
    if (initialErr.name === 'AbortError' || signal?.aborted) {
      return;
    }
    console.warn(`[aiChatService] Primary stream encounter notice: ${initialErr.message}. Checking resilient resume...`);
  }

  // 2. Resilient Auto-Resumption: If stream was severed mid-generation (e.g. Vercel 60s timeout / network drop)
  // Re-attach to GET /api/ai/chat/stream/:id?offset=X with zero data loss!
  let resumeAttempts = 0;
  const maxResumeAttempts = 3;

  while (!isStreamFinished && !signal?.aborted && resumeAttempts < maxResumeAttempts) {
    resumeAttempts++;
    console.log(`[aiChatService] Re-attaching to stream ${assignedStreamId} from offset ${highestSeq} (attempt ${resumeAttempts}/${maxResumeAttempts})...`);
    await new Promise(r => setTimeout(r, 600));
    if (signal?.aborted) break;

    try {
      const resumeRes = await fetch(`/api/ai/chat/stream/${assignedStreamId}?offset=${highestSeq}`, {
        method: 'GET',
        headers,
        signal
      });

      if (!resumeRes.ok) {
        if (resumeRes.status === 404) {
          // Session expired or completed on server
          break;
        }
        continue;
      }

      if (resumeRes.body) {
        await processStreamReader(resumeRes.body.getReader());
      }
    } catch (resumeErr: any) {
      if (resumeErr.name === 'AbortError' || signal?.aborted) {
        return;
      }
      console.warn(`[aiChatService] Resumption attempt ${resumeAttempts} failed:`, resumeErr.message);
    }
  }

  if (signal?.aborted) {
    return;
  }

  const durationMs = Date.now() - startTime;
  const speed = finalEvalDurationNs > 0 
    ? finalEvalCount / (finalEvalDurationNs / 1e9) 
    : (finalEvalCount / (durationMs / 1000));

  if (onDone) {
    onDone({
      totalTokens: finalEvalCount,
      speedTokensPerSec: parseFloat(speed.toFixed(2)),
      durationMs
    });
  }
}

export interface WebResearchSource {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date?: string;
}

export interface WebResearchResult {
  query: string;
  sources: WebResearchSource[];
  summary: string;
}

export async function performWebResearch(query: string, token?: string): Promise<WebResearchResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/research', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Research request failed (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchMcpTools(token?: string): Promise<{ servers: MCPServerInfo[] }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/chat/mcp/tools', { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch MCP tools (HTTP ${res.status})`);
  }
  return res.json();
}

export async function executeMcpToolCall(tool: string, params: any = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/chat/mcp/execute', {
    method: 'POST',
    headers,
    body: JSON.stringify({ tool, params })
  });
  if (!res.ok) {
    throw new Error(`Failed to execute MCP tool (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchAISkills(token?: string): Promise<{ skills: AISkillInfo[] }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/chat/skills', { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch AI skills (HTTP ${res.status})`);
  }
  return res.json();
}

export interface CreateBackgroundTaskParams {
  sessionId: string;
  prompt: string;
  mode: AIChatMode;
  model: string;
  agentId: string;
  skillId?: string;
  mcpEnabled?: boolean;
  isDeepResearch?: boolean;
  attachments?: any[];
}

export async function createBackgroundAITask(
  params: CreateBackgroundTaskParams,
  token?: string
): Promise<{ success: boolean; taskId: string; sessionId: string; mode: AIChatMode; task: AIChatBackgroundTask }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/chat/tasks', {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create background AI task (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchActiveBackgroundTasks(token?: string): Promise<{ tasks: AIChatBackgroundTask[] }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/chat/tasks/active', { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch active background tasks (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchBackgroundTaskStatus(taskId: string, token?: string): Promise<{ task: AIChatBackgroundTask }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/ai/chat/tasks/${encodeURIComponent(taskId)}`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch task status (HTTP ${res.status})`);
  }
  return res.json();
}

export async function cancelBackgroundTask(taskId: string, token?: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  await fetch(`/api/ai/chat/tasks/${encodeURIComponent(taskId)}/cancel`, {
    method: 'POST',
    headers
  });
}

export interface RagChunkResult {
  chunkId: string;
  docId: string;
  title: string;
  section: string;
  text: string;
  contextHeader?: string;
  sourceType?: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface RagQueryResult {
  query: string;
  totalChunksSearched: number;
  results: Array<{
    document: string;
    section: string;
    source: string;
    relevance: string;
    excerpt: string;
    contextHeader?: string;
  }>;
  augmentedContextPrompt: string;
  latencyMs: number;
}

export interface RagStatsResult {
  totalDocuments: number;
  totalChunks: number;
  embeddingModel: string;
  lexicalEngine: string;
  fusionAlgorithm: string;
  avgChunkLengthWords: number;
  sources: string[];
}

export async function queryContextualRag(
  query: string,
  options: { topK?: number; source?: string; docIds?: string[] } = {},
  token?: string
): Promise<RagQueryResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/rag/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, ...options })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `RAG query failed (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchRagStats(token?: string): Promise<{ stats: RagStatsResult }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/rag/stats', { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch RAG stats (HTTP ${res.status})`);
  }
  return res.json();
}

export async function indexDocumentInRag(
  doc: { id: string; title: string; content: string; source?: string; authorEmail?: string; metadata?: Record<string, any> },
  token?: string
): Promise<{ success: boolean; docId: string; chunkCount: number }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/ai/rag/index', {
    method: 'POST',
    headers,
    body: JSON.stringify(doc)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to index document in RAG (HTTP ${res.status})`);
  }
  return res.json();
}



