export interface UserProfile {
  email: string;
  name: string;
  isLoggedIn: boolean;
  role?: 'Admin' | 'Developer' | 'Banned' | 'Pending';
  token?: string;
  mustChangePassword?: boolean;
  bio?: string;
  githubHandle?: string;
  company?: string;
  joinedAt?: string;
}

export type WorkspaceTab = 
  | 'Stock Tracker' 
  | 'Workflow'
  | 'Custom Flow' 
  | 'Accounting' 
  | 'Tools Studio'
  | 'Resume Studio'
  | 'Admin Console' 
  | 'Manage Database'
  | 'Storage Vault'
  | 'AI Agent Studio'
  | 'Manage Plugins' 
  | 'Manage Apps' 
  | 'Manage Portfolios' 
  | 'Contact Inquiries'
  | 'Reported Bugs'
  | 'Doc Nexus'
  | 'Speech Studio' 
  | 'Image Studio'
  | 'StudioCast'
  | 'Motion Studio'
  | 'Transcribe Studio'
  | 'Cutout Studio'
  | 'Mockup Studio'
  | 'README' 
  | 'Plugin Store' 
  | 'Profile & Settings';

export interface VaultFileItem {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  mimeType: string;
  checksum: string;
  uploadedAt: string;
  category?: string;
}

export interface VaultDiskStats {
  totalBytes: number;
  usedBytes: number;
  availBytes: number;
  percentUsed: string;
}

export interface VaultStatsResponse {
  totalFiles: number;
  totalVaultBytes: number;
  disk: VaultDiskStats;
  uptimeSeconds: number;
  memory?: Record<string, number>;
}

export interface AIChatAttachment {
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
  extractedText?: string;
}

export type AIChatMode = 'chat' | 'plan' | 'agent' | 'autonomous';

export interface PlanMilestone {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface PlanCardData {
  title: string;
  objective: string;
  milestones: PlanMilestone[];
  files: string[];
  risks: string[];
  isExecutable?: boolean;
}

export interface TaskExecutionStep {
  stepNumber: number;
  title: string;
  tool?: string;
  status: 'running' | 'completed' | 'failed';
  detail?: string;
  output?: string;
  timestamp?: number;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  mode?: AIChatMode;
  tokensGenerated?: number;
  tokensPerSec?: number;
  durationMs?: number;
  timestamp: string;
  agentId?: string;
  researchSources?: Array<{ title: string; url: string; snippet: string; source: string; date?: string }>;
  attachments?: AIChatAttachment[];
  thought?: string;
  planData?: PlanCardData;
  executionSteps?: TaskExecutionStep[];
  mcpCalls?: Array<{ server: string; tool: string; params: any; resultSummary: string }>;
}

export interface AIAgentPersona {
  id: string;
  name: string;
  title: string;
  icon: string;
  badge: string;
  description: string;
  systemPrompt: string;
  recommendedModel: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AIChatMessage[];
  model?: string;
  agentId?: string;
}

export interface AIArtifactItem {
  id: string;
  title: string;
  language: string;
  code: string;
  sourceMessageId: string;
  timestamp: string;
}

export interface AIChatBackgroundTask {
  id: string;
  sessionId: string;
  userEmail: string;
  mode: AIChatMode;
  model: string;
  agentId: string;
  skillId?: string;
  mcpEnabled?: boolean;
  isDeepResearch?: boolean;
  researchSources?: Array<{ title: string; url: string; snippet: string; source: string; date?: string }>;
  prompt: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    currentStep: number;
    totalSteps: number;
    phase: string;
    percent: number;
  };
  steps: TaskExecutionStep[];
  logs: string[];
  partialText: string;
  fullResult?: string;
  thought?: string;
  planData?: PlanCardData;
  metrics?: {
    totalTokens: number;
    speedTokensPerSec: number;
    durationMs: number;
  };
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
}

export interface MCPServerInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'connected' | 'idle' | 'error';
  latencyMs?: number;
  tools: Array<{
    name: string;
    description: string;
    parameters?: any;
  }>;
}

export interface AISkillInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  systemInstruction: string;
  suggestedPrompts: string[];
}

export interface ContactInquiryItem {
  id: string;
  trackingId: string;
  name: string;
  email: string;
  projectType: string;
  message: string;
  status: 'New' | 'Contacted' | 'In Progress' | 'Closed' | 'Archived' | string;
  notes?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Developer' | 'Banned' | 'Pending';
  joinedAt: string;
  activityCount: number;
}


export interface Invoice {
  id: string;
  date: string;
  client: string;
  amount: number;
  status: 'Paid' | 'Pending';
}

export interface FlowNode {
  id: string;
  label: string;
  type: 'source' | 'processor' | 'output';
  fileUsed?: string;
  pluginActive?: boolean;
  status?: string;
  x: number;
  y: number;
}

export interface FlowConnection {
  fromId: string;
  toId: string;
}

export interface TerminalLog {
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'AGENT' | 'DATA' | 'ALERT' | 'ERROR';
  message: string;
}

export interface StockTick {
  time: string;
  price: number;
}

export interface UserPortfolio {
  cash: number;
  shares: number;
  buyPrice: number;
}

export interface StorePlugin {
  id: string;
  name: string;
  category: string;
  type: 'Free' | 'Premium' | 'Trial';
  downloads: string;
  rating: number;
  description: string;
  iconSymbol: string;
  tags: string[];
}
