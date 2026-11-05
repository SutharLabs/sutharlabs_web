import { AIAgentPersona, AIChatMessage } from '../types';

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
    recommendedModel: 'qwen2.5:7b'
  },
  {
    id: 'database-architect',
    name: 'Database Engine Architect',
    title: 'PostgreSQL & Replication DBA',
    icon: 'database',
    badge: 'PostgreSQL 16',
    description: 'Specialist in low-footprint PostgreSQL tuning, dual-database replication, query optimization, and schema design.',
    systemPrompt: `You are the Chief Database Administrator (DBA) for SutharLabs. You oversee the PostgreSQL 16 database running on Oracle Cloud and disaster recovery replication to Neon. You specialize in low-memory PostgreSQL configuration, indexing strategies, query execution plans, ACID transactions, data consistency verification, and Prisma ORM migrations. Provide exact SQL statements, explain trade-offs, and prioritize database integrity.`,
    recommendedModel: 'qwen2.5:7b'
  },
  {
    id: 'software-engineer',
    name: 'Full-Stack Engineer',
    title: 'React 19 & TypeScript Engineer',
    icon: 'code',
    badge: 'React & Node',
    description: 'Crafts elegant, high-performance UI code adhering to Tailwind CSS v4, component isolation, and clean APIs.',
    systemPrompt: `You are a Principal Full-Stack Engineer at SutharLabs. You build resilient, high-speed interfaces using React 19, TypeScript, Tailwind CSS v4, and Node.js. Always format code cleanly with type safety, follow strict design system tokens, ensure dark and light mode harmony, and avoid unhandled edge cases. When producing code or configuration files, structure them modularly.`,
    recommendedModel: 'qwen2.5:7b'
  },
  {
    id: 'quant-analyst',
    name: 'Quantitative Strategist',
    title: 'Algorithmic Trading & Math Quant',
    icon: 'line-chart',
    badge: 'Quant Models',
    description: 'Analyzes financial markets, statistical indicators, backtesting logic, and risk modeling formulas.',
    systemPrompt: `You are a Senior Quantitative Analyst at SutharLabs. You specialize in statistical arbitrage, algorithmic trading execution, risk modeling (Sharpe, Sortino, VaR), Fibonacci series, moving averages, and technical indicators. Always verify mathematical formulas, detail time and space complexities, and output concise analytical summaries.`,
    recommendedModel: 'gemma2:2b'
  },
  {
    id: 'math-reasoner',
    name: 'Mathematical & Logic Reasoner',
    title: 'Symbolic Reasoning & CoT Specialist',
    icon: 'cpu',
    badge: 'DeepSeek-R1 CoT',
    description: 'Uses DeepSeek-R1 chain-of-thought to solve complex algorithms, verify logic proofs, and compute mathematical models step-by-step.',
    systemPrompt: `You are the Lead Symbolic Reasoner and Mathematical Analyst for SutharLabs, powered by DeepSeek-R1 chain-of-thought architecture. When solving problems, think rigorously step-by-step, verify edge cases, prove formulas mathematically, and provide clear structured conclusions with complete algorithmic notation.`,
    recommendedModel: 'deepseek-r1:7b'
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
    description: 'General-purpose intelligent assistant powered by Google Gemma 2 2B for ultra-fast conversational answers.',
    systemPrompt: `You are SutharLabs Sovereign AI, a sharp, concise, and helpful artificial intelligence running locally on private ARM64 cloud infrastructure. Provide clear, direct, and well-structured answers with zero corporate fluff.`,
    recommendedModel: 'gemma2:2b'
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
  onChunk: (chunk: string) => void;
  onDone?: (metrics: {
    totalTokens: number;
    speedTokensPerSec: number;
    durationMs: number;
  }) => void;
}

export async function streamAIChat({
  model,
  messages,
  token,
  signal,
  onChunk,
  onDone
}: StreamChatParams): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const startTime = Date.now();
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model,
      messages,
      stream: true
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `AI inference failed (HTTP ${res.status})`);
  }

  if (!res.body) {
    throw new Error('ReadableStream not supported by server.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalEvalCount = 0;
  let finalEvalDurationNs = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // Ignore SSE keep-alive heartbeats

        let payloadStr = trimmed;
        if (payloadStr.startsWith('data:')) {
          payloadStr = payloadStr.replace(/^data:\s*/, '').trim();
        }
        if (!payloadStr) continue;

        try {
          const parsed = JSON.parse(payloadStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.message && parsed.message.content) {
            onChunk(parsed.message.content);
          }
          if (parsed.done) {
            finalEvalCount = parsed.eval_count || 0;
            finalEvalDurationNs = parsed.eval_duration || 0;
          }
        } catch (jsonErr: any) {
          if (jsonErr.message && !jsonErr.message.includes('JSON')) {
            throw jsonErr;
          }
          // Ignore partial or malformed JSON chunks in stream
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return; // Handled cancel
    }
    throw err;
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

