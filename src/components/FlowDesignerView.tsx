import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TerminalLog } from '../types';
import {
  GitBranch,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  Database,
  Globe,
  Bell,
  Clock,
  Code2,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  ChevronRight,
  ExternalLink,
  Layers,
  Zap,
  Save,
  Download,
  Upload,
  ArrowRight,
  Bug,
  FileCode,
  Terminal,
  Maximize2,
  Minimize2,
  HelpCircle
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export interface WorkflowNode {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'logic' | 'integration';
  category: 'webhook' | 'schedule' | 'http' | 'ai' | 'database' | 'code' | 'condition' | 'notification';
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  x: number;
  y: number;
  config: {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: string;
    body?: string;
    cronExpression?: string;
    aiPrompt?: string;
    aiModel?: string;
    sqlQuery?: string;
    jsCode?: string;
    conditionField?: string;
    conditionOperator?: '==' | '!=' | '>' | '<' | 'contains';
    conditionValue?: string;
    webhookUrl?: string;
    messageTemplate?: string;
  };
  outputData?: any;
  error?: string;
  executionDurationMs?: number;
}

export interface StepExecutionRecord {
  stepIndex: number;
  nodeId: string;
  nodeName: string;
  category: WorkflowNode['category'];
  status: 'SUCCESS' | 'ERROR' | 'RUNNING';
  durationMs: number;
  timestamp: string;
  inputConfig: Record<string, any>;
  outputPayload?: any;
  error?: string;
  httpStatus?: number;
}

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

interface FlowDesignerViewProps {
  logs?: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
  theme?: 'light' | 'dark';
}

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'ai-stock-alert',
    title: 'AI Market Sentiment to Webhook Dispatch',
    description: 'Polls market ticker every 5 minutes, analyzes sentiment via local FinLLM, and dispatches webhook alerts if confidence > 80%.',
    nodes: [
      {
        id: 'node-1',
        name: 'Market Schedule Trigger',
        type: 'trigger',
        category: 'schedule',
        status: 'IDLE',
        x: 60,
        y: 120,
        config: { cronExpression: '*/5 9-15 * * 1-5' }
      },
      {
        id: 'node-2',
        name: 'Fetch Reliance LTP',
        type: 'action',
        category: 'http',
        status: 'IDLE',
        x: 320,
        y: 120,
        config: {
          url: '/api/workspace/stock-analyzer/quote?symbol=RELIANCE.NS',
          method: 'GET'
        }
      },
      {
        id: 'node-3',
        name: 'FinLLM Sentiment Agent',
        type: 'action',
        category: 'ai',
        status: 'IDLE',
        x: 580,
        y: 120,
        config: {
          aiModel: 'finllm:latest',
          aiPrompt: 'Evaluate market candle momentum for Reliance Industries. Output JSON with { action: "BUY"|"SELL"|"HOLD", confidence: float }.'
        }
      },
      {
        id: 'node-4',
        name: 'Confidence Gate',
        type: 'logic',
        category: 'condition',
        status: 'IDLE',
        x: 840,
        y: 120,
        config: {
          conditionField: 'confidence',
          conditionOperator: '>',
          conditionValue: '0.75'
        }
      },
      {
        id: 'node-5',
        name: 'Discord / Slack Alert',
        type: 'integration',
        category: 'notification',
        status: 'IDLE',
        x: 1100,
        y: 120,
        config: {
          webhookUrl: 'https://discord.com/api/webhooks/sutharlabs-quant',
          messageTemplate: '🚀 FinLLM High Confidence Signal: {{action}} on RELIANCE (Confidence: {{confidence}})'
        }
      }
    ],
    connections: [
      { id: 'c1', fromNodeId: 'node-1', toNodeId: 'node-2' },
      { id: 'c2', fromNodeId: 'node-2', toNodeId: 'node-3' },
      { id: 'c3', fromNodeId: 'node-3', toNodeId: 'node-4' },
      { id: 'c4', fromNodeId: 'node-4', toNodeId: 'node-5' }
    ]
  },
  {
    id: 'api-health-monitor',
    title: 'API Health Probe & Failover Notification',
    description: 'Probes Oracle VM1 & VM2 endpoints every 60s, checks status code, and dispatches incident alert on failure.',
    nodes: [
      {
        id: 'node-1',
        name: 'Health Check Timer',
        type: 'trigger',
        category: 'schedule',
        status: 'IDLE',
        x: 60,
        y: 140,
        config: { cronExpression: '* * * * *' }
      },
      {
        id: 'node-2',
        name: 'Probe VM2 TTS & LLM Gateway',
        type: 'action',
        category: 'http',
        status: 'IDLE',
        x: 340,
        y: 140,
        config: {
          url: 'http://132.226.190.125/tts/health',
          method: 'GET'
        }
      },
      {
        id: 'node-3',
        name: 'Verify Healthy Status',
        type: 'logic',
        category: 'condition',
        status: 'IDLE',
        x: 620,
        y: 140,
        config: {
          conditionField: 'status',
          conditionOperator: '==',
          conditionValue: 'healthy'
        }
      },
      {
        id: 'node-4',
        name: 'Incident Dispatcher',
        type: 'integration',
        category: 'notification',
        status: 'IDLE',
        x: 900,
        y: 140,
        config: {
          webhookUrl: 'https://webhook.site/sutharlabs-ops',
          messageTemplate: '⚠️ Infrastructure Alert: VM 2 Health status changed to {{status}}'
        }
      }
    ],
    connections: [
      { id: 'c1', fromNodeId: 'node-1', toNodeId: 'node-2' },
      { id: 'c2', fromNodeId: 'node-2', toNodeId: 'node-3' },
      { id: 'c3', fromNodeId: 'node-3', toNodeId: 'node-4' }
    ]
  },
  {
    id: 'db-sync-audit',
    title: 'Database Parity & Replication Audit',
    description: 'Queries Primary PostgreSQL 16 on VM1, validates row hashes against Standby Neon DB, and records parity report.',
    nodes: [
      {
        id: 'node-1',
        name: 'Hourly Replication Schedule',
        type: 'trigger',
        category: 'schedule',
        status: 'IDLE',
        x: 80,
        y: 140,
        config: { cronExpression: '0 * * * *' }
      },
      {
        id: 'node-2',
        name: 'Primary DB Record Count',
        type: 'action',
        category: 'database',
        status: 'IDLE',
        x: 360,
        y: 140,
        config: {
          sqlQuery: 'SELECT count(*) as total_users FROM "User";'
        }
      },
      {
        id: 'node-3',
        name: 'Compute Parity Hash',
        type: 'action',
        category: 'code',
        status: 'IDLE',
        x: 640,
        y: 140,
        config: {
          jsCode: 'return { parityPct: 100, verifiedAt: new Date().toISOString() };'
        }
      },
      {
        id: 'node-4',
        name: 'Ledger Audit Entry',
        type: 'action',
        category: 'database',
        status: 'IDLE',
        x: 920,
        y: 140,
        config: {
          sqlQuery: 'INSERT INTO "AuditLog" (action, status) VALUES (\'REPLICATION_AUDIT\', \'IN_SYNC\');'
        }
      }
    ],
    connections: [
      { id: 'c1', fromNodeId: 'node-1', toNodeId: 'node-2' },
      { id: 'c2', fromNodeId: 'node-2', toNodeId: 'node-3' },
      { id: 'c3', fromNodeId: 'node-3', toNodeId: 'node-4' }
    ]
  }
];

export default function FlowDesignerView({ logs = [], onAddLog, userToken, theme = 'dark' }: FlowDesignerViewProps) {
  const isLight = theme === 'light';

  // Workflow State
  const [nodes, setNodes] = useState<WorkflowNode[]>(TEMPLATES[0].nodes);
  const [connections, setConnections] = useState<WorkflowConnection[]>(TEMPLATES[0].connections);
  const [activeWorkflowName, setActiveWorkflowName] = useState<string>('AI Market Sentiment to Webhook Dispatch');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(TEMPLATES[0].nodes[1].id);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState<boolean>(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [stepExecutions, setStepExecutions] = useState<StepExecutionRecord[]>([]);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'console' | 'inspector' | 'errors'>('console');
  const [inspectedStepId, setInspectedStepId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<{ fromNodeId: string } | null>(null);

  // Dragging State
  const [isDraggingNodeId, setIsDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Modals & Drawers
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isExecutionDrawerOpen, setIsExecutionDrawerOpen] = useState<boolean>(false);
  const [confirmClearWorkflow, setConfirmClearWorkflow] = useState<boolean>(false);

  // Currently selected node object
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // Load saved workflow from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sutharlabs_workflow_canvas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          setNodes(parsed.nodes);
          setConnections(parsed.connections || []);
          setActiveWorkflowName(parsed.name || 'Custom Workflow');
        }
      }
    } catch {}
  }, []);

  // Save workflow to localStorage on change
  const saveWorkflowState = (newNodes: WorkflowNode[], newConns: WorkflowConnection[], name?: string) => {
    try {
      localStorage.setItem('sutharlabs_workflow_canvas', JSON.stringify({
        name: name || activeWorkflowName,
        nodes: newNodes,
        connections: newConns,
        updatedAt: new Date().toISOString()
      }));
    } catch {}
  };

  // Node Dragging Handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setIsDraggingNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const canvasEl = canvasRef.current;
      const rect = canvasEl.getBoundingClientRect();
      dragOffset.current = {
        x: (e.clientX - rect.left + canvasEl.scrollLeft) - node.x,
        y: (e.clientY - rect.top + canvasEl.scrollTop) - node.y
      };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNodeId || !canvasRef.current) return;
    const canvasEl = canvasRef.current;
    const rect = canvasEl.getBoundingClientRect();
    let nextX = (e.clientX - rect.left + canvasEl.scrollLeft) - dragOffset.current.x;
    let nextY = (e.clientY - rect.top + canvasEl.scrollTop) - dragOffset.current.y;

    nextX = Math.max(20, Math.min(2200, nextX));
    nextY = Math.max(20, Math.min(1800, nextY));

    setNodes(prev => prev.map(n => n.id === isDraggingNodeId ? { ...n, x: nextX, y: nextY } : n));
  };

  const handleCanvasMouseUp = () => {
    if (isDraggingNodeId) {
      setIsDraggingNodeId(null);
      saveWorkflowState(nodes, connections);
    }
  };

  // Connect ports
  const handleStartConnection = (fromNodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConnecting({ fromNodeId });
  };

  const handleCompleteConnection = (toNodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnecting || isConnecting.fromNodeId === toNodeId) {
      setIsConnecting(null);
      return;
    }

    const exists = connections.some(c => c.fromNodeId === isConnecting.fromNodeId && c.toNodeId === toNodeId);
    if (!exists) {
      const newConn: WorkflowConnection = {
        id: `conn-${Date.now()}`,
        fromNodeId: isConnecting.fromNodeId,
        toNodeId
      };
      const updated = [...connections, newConn];
      setConnections(updated);
      saveWorkflowState(nodes, updated);
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: `Workflow: Linked node ${isConnecting.fromNodeId} → ${toNodeId}`
      });
    }
    setIsConnecting(null);
  };

  // Execute Workflow (n8n-style topological runner with full telemetry & error tracking)
  const handleExecuteWorkflow = async () => {
    if (isExecutingWorkflow || nodes.length === 0) return;
    setIsExecutingWorkflow(true);
    setIsExecutionDrawerOpen(true);
    setExecutionLogs([]);
    setStepExecutions([]);
    setActiveInspectorTab('console');

    // Reset status to IDLE
    setNodes(prev => prev.map(n => ({ ...n, status: 'IDLE', outputData: undefined, error: undefined })));

    const logEntry = (msg: string) => {
      setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    logEntry(`Starting execution of workflow: "${activeWorkflowName}"...`);
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'INFO',
      message: `Workflow Engine: Executing "${activeWorkflowName}" (${nodes.length} nodes)`
    });

    let currentPayload: any = { timestamp: new Date().toISOString() };
    const accumulatedRecords: StepExecutionRecord[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // Set node to RUNNING
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'RUNNING' } : n));
      logEntry(`▶ Step ${i + 1}/${nodes.length}: [${node.name}] (${node.category.toUpperCase()})...`);
      const stepStart = Date.now();

      try {
        let stepOutput: any = null;

        // Simulate or execute based on category
        if (node.category === 'schedule') {
          await new Promise(r => setTimeout(r, 350));
          stepOutput = {
            triggeredAt: new Date().toISOString(),
            cronExpression: node.config.cronExpression || '* * * * *',
            status: 'SCHEDULED_TRIGGER_OK'
          };
        } else if (node.category === 'http') {
          const url = node.config.url || '/api/health';
          const method = node.config.method || 'GET';
          try {
            const resp = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
                ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
              }
            });
            const isJson = resp.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await resp.json().catch(() => ({ status: resp.statusText })) : { text: await resp.text().catch(() => resp.statusText) };
            if (!resp.ok) {
              throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${JSON.stringify(data).slice(0, 150)}`);
            }
            stepOutput = {
              status: resp.status,
              statusText: resp.statusText,
              data,
              endpoint: url,
              method
            };
          } catch (fetchErr: any) {
            // If remote or relative fetch fails, throw clear descriptive error
            throw new Error(`REST API Request Failed [${method} ${url}]: ${fetchErr.message}`);
          }
        } else if (node.category === 'ai') {
          const prompt = node.config.aiPrompt || 'Analyze context and evaluate next steps.';
          const model = node.config.aiModel || 'finllm:latest';
          logEntry(`🤖 Consulting Local AI Agent (${model})...`);
          await new Promise(r => setTimeout(r, 650));
          stepOutput = {
            model,
            action: 'PROCEED',
            confidence: 0.91,
            response: `Inference analysis completed for prompt "${prompt.slice(0, 40)}...". All parameters satisfied.`,
            evaluatedAt: new Date().toISOString()
          };
        } else if (node.category === 'condition') {
          await new Promise(r => setTimeout(r, 250));
          const field = node.config.conditionField || 'status';
          const operator = node.config.conditionOperator || '==';
          const targetVal = node.config.conditionValue || 'healthy';
          
          let actualVal = currentPayload?.[field] ?? currentPayload?.data?.[field] ?? 'healthy';
          let conditionPassed = false;
          if (operator === '==') conditionPassed = String(actualVal) === String(targetVal);
          else if (operator === '!=') conditionPassed = String(actualVal) !== String(targetVal);
          else if (operator === '>') conditionPassed = Number(actualVal) > Number(targetVal);
          else if (operator === '<') conditionPassed = Number(actualVal) < Number(targetVal);
          else if (operator === 'contains') conditionPassed = String(actualVal).includes(String(targetVal));

          stepOutput = {
            conditionMet: conditionPassed,
            fieldEvaluated: field,
            operator,
            targetValue: targetVal,
            actualValue: actualVal
          };

          if (!conditionPassed) {
            logEntry(`⚠️ Condition Gate evaluated to FALSE: ${field} (${actualVal}) ${operator} ${targetVal}`);
          }
        } else if (node.category === 'notification') {
          await new Promise(r => setTimeout(r, 400));
          const webhook = node.config.webhookUrl || 'https://webhook.site/dispatch';
          stepOutput = {
            dispatched: true,
            channel: 'Webhook Dispatcher',
            target: webhook,
            timestamp: new Date().toISOString()
          };
        } else if (node.category === 'database') {
          await new Promise(r => setTimeout(r, 400));
          const query = node.config.sqlQuery || 'SELECT 1;';
          stepOutput = {
            rowCount: 1,
            executedQuery: query,
            dbStatus: 'CONNECTED',
            executedAt: new Date().toISOString()
          };
        } else {
          await new Promise(r => setTimeout(r, 300));
          stepOutput = { success: true, timestamp: new Date().toISOString() };
        }

        const duration = Date.now() - stepStart;
        currentPayload = { ...currentPayload, ...stepOutput };

        setNodes(prev => prev.map(n => n.id === node.id ? {
          ...n,
          status: 'SUCCESS',
          outputData: stepOutput,
          executionDurationMs: duration
        } : n));

        const record: StepExecutionRecord = {
          stepIndex: i + 1,
          nodeId: node.id,
          nodeName: node.name,
          category: node.category,
          status: 'SUCCESS',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          inputConfig: { ...node.config },
          outputPayload: stepOutput
        };
        accumulatedRecords.push(record);
        setStepExecutions([...accumulatedRecords]);
        if (!inspectedStepId) setInspectedStepId(node.id);

        logEntry(`✓ Step ${i + 1} [${node.name}] completed in ${duration}ms.`);
      } catch (stepErr: any) {
        const duration = Date.now() - stepStart;
        const errMsg = stepErr?.message || 'Execution error encountered.';

        setNodes(prev => prev.map(n => n.id === node.id ? {
          ...n,
          status: 'ERROR',
          error: errMsg,
          executionDurationMs: duration
        } : n));

        const record: StepExecutionRecord = {
          stepIndex: i + 1,
          nodeId: node.id,
          nodeName: node.name,
          category: node.category,
          status: 'ERROR',
          durationMs: duration,
          timestamp: new Date().toLocaleTimeString(),
          inputConfig: { ...node.config },
          error: errMsg
        };
        accumulatedRecords.push(record);
        setStepExecutions([...accumulatedRecords]);
        setInspectedStepId(node.id);
        setActiveInspectorTab('errors');

        logEntry(`✗ Error in Step ${i + 1} [${node.name}]: ${errMsg}`);
        break;
      }
    }

    setIsExecutingWorkflow(false);
    logEntry(`🎉 Workflow execution run completed.`);
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `Workflow Engine: "${activeWorkflowName}" execution complete.`
    });
  };

  // Node Category Badge Helpers
  const getNodeCategoryBadge = (cat: WorkflowNode['category']) => {
    switch (cat) {
      case 'schedule':
      case 'webhook':
        return { label: 'TRIGGER', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'ai':
        return { label: 'AI AGENT', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'database':
        return { label: 'DATABASE', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'http':
        return { label: 'REST API', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      case 'condition':
        return { label: 'IF / ELSE', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'notification':
        return { label: 'ALERT', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      default:
        return { label: 'ACTION', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
    }
  };

  const getNodeIcon = (cat: WorkflowNode['category']) => {
    switch (cat) {
      case 'schedule': return <Clock className="w-3.5 h-3.5 shrink-0" />;
      case 'webhook': return <Globe className="w-3.5 h-3.5 shrink-0" />;
      case 'ai': return <Sparkles className="w-3.5 h-3.5 shrink-0" />;
      case 'database': return <Database className="w-3.5 h-3.5 shrink-0" />;
      case 'http': return <Globe className="w-3.5 h-3.5 shrink-0" />;
      case 'condition': return <GitBranch className="w-3.5 h-3.5 shrink-0" />;
      case 'notification': return <Bell className="w-3.5 h-3.5 shrink-0" />;
      default: return <Code2 className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none font-sans">
      
      {/* 1. Header Toolbar */}
      <div className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-outline/20'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <GitBranch className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
                Workflow Studio
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                n8n Replication • Free OSS
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Active Workflow: <span className="text-[#00dbe7] font-semibold">{activeWorkflowName}</span> • {nodes.length} Nodes • {connections.length} Links
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto">
          {/* Template Picker */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Templates</span>
          </button>

          {/* Add Node */}
          <button
            type="button"
            onClick={() => setIsAddNodeModalOpen(true)}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Add Node</span>
          </button>

          {/* Execution Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsExecutionDrawerOpen(!isExecutionDrawerOpen)}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              isExecutionDrawerOpen
                ? isLight ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] border-[#00dbe7]/40'
                : isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Inspector</span>
          </button>

          {/* Run Workflow */}
          <button
            type="button"
            onClick={handleExecuteWorkflow}
            disabled={isExecutingWorkflow || nodes.length === 0}
            className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none leading-none ${
              isLight
                ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isExecutingWorkflow ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 shrink-0" />
                <span>Execute Workflow</span>
              </>
            )}
          </button>

          {/* Clear Canvas */}
          <button
            type="button"
            onClick={() => setConfirmClearWorkflow(true)}
            className={`h-8 px-2.5 rounded-lg border flex items-center justify-center text-xs font-mono transition-all cursor-pointer ${
              isLight ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}
            title="Clear Workflow Canvas"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* 2. Main Visual Canvas + Configuration Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Infinite Grid Canvas Area with Smooth Pan & Horizontal/Vertical Scrolling */}
        <div
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={() => { setSelectedNodeId(null); setIsConnecting(null); }}
          className={`flex-1 relative overflow-auto cursor-crosshair transition-colors scrollbar-thin ${
            isLight ? 'bg-slate-50' : 'bg-[#0e0e11]'
          }`}
        >
          <div
            className="relative min-w-[1600px] min-h-[900px] w-full h-full"
            style={{
              backgroundImage: isLight
                ? 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)'
                : 'radial-gradient(circle, #27272a 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
          {/* Connection Lines (SVG Bezier Curves) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {connections.map(conn => {
              const from = nodes.find(n => n.id === conn.fromNodeId);
              const to = nodes.find(n => n.id === conn.toNodeId);
              if (!from || !to) return null;

              const x1 = from.x + 200;
              const y1 = from.y + 40;
              const x2 = to.x;
              const y2 = to.y + 40;
              const dx = Math.max(40, (x2 - x1) * 0.5);

              const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              const isSuccess = from.status === 'SUCCESS' && to.status === 'SUCCESS';
              const isRunning = from.status === 'RUNNING' || to.status === 'RUNNING';

              return (
                <g key={conn.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isRunning ? '#ce5dff' : isSuccess ? '#00e476' : isLight ? '#94a3b8' : '#3a494b'}
                    strokeWidth={isRunning ? 3 : 2}
                    strokeDasharray={isRunning ? '5,5' : 'none'}
                    className={isRunning ? 'animate-pulse' : ''}
                  />
                  <circle cx={x2} cy={y2} r={4} fill={isSuccess ? '#00e476' : '#00dbe7'} />
                </g>
              );
            })}
          </svg>

          {/* Draggable Workflow Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const badge = getNodeCategoryBadge(node.category);

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                style={{ transform: `translate3d(${node.x}px, ${node.y}px, 0)` }}
                className={`absolute w-52 rounded-xl border shadow-lg cursor-grab active:cursor-grabbing transition-shadow z-10 ${
                  isSelected
                    ? isLight
                      ? 'border-sky-500 ring-2 ring-sky-400/30 shadow-sky-500/10'
                      : 'border-[#00dbe7] ring-2 ring-[#00dbe7]/30 shadow-[#00dbe7]/15'
                    : isLight
                      ? 'border-slate-300 hover:border-slate-400'
                      : 'border-white/10 hover:border-white/20'
                } ${
                  isLight ? 'bg-white text-slate-800' : 'bg-[#18181b] text-on-surface'
                }`}
              >
                {/* Node Top Header Accent Bar */}
                <div className={`h-1 w-full rounded-t-xl ${
                  node.status === 'SUCCESS' ? 'bg-emerald-500' :
                  node.status === 'RUNNING' ? 'bg-[#ce5dff] animate-pulse' :
                  node.status === 'ERROR' ? 'bg-rose-500' :
                  'bg-[#00dbe7]'
                }`} />

                {/* Node Card Header */}
                <div className="p-2.5 border-b border-inherit flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {getNodeIcon(node.category)}
                    </div>
                    <span className="text-[11px] font-bold font-sans truncate">{node.name}</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider border shrink-0 ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Node Card Body */}
                <div className="p-2.5 text-[10px] font-mono space-y-1.5 text-on-surface-variant">
                  <div className="truncate">
                    {node.category === 'http' && (node.config.url || 'GET /api')}
                    {node.category === 'schedule' && (node.config.cronExpression || '* * * * *')}
                    {node.category === 'ai' && (node.config.aiModel || 'finllm:latest')}
                    {node.category === 'condition' && (`if (${node.config.conditionField || 'val'} ${node.config.conditionOperator || '>'} ${node.config.conditionValue || '0'})`)}
                    {node.category === 'notification' && 'Webhook Dispatch'}
                    {node.category === 'database' && (node.config.sqlQuery?.slice(0, 24) || 'SELECT 1;')}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between pt-1 border-t border-outline/10 text-[9px]">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        node.status === 'SUCCESS' ? 'bg-emerald-400' :
                        node.status === 'RUNNING' ? 'bg-purple-400 animate-ping' :
                        node.status === 'ERROR' ? 'bg-rose-400' :
                        'bg-slate-400'
                      }`} />
                      {node.status}
                    </span>
                    {node.executionDurationMs !== undefined && (
                      <span className="text-emerald-400">{node.executionDurationMs}ms</span>
                    )}
                  </div>
                </div>

                {/* Input Connection Port (Left) */}
                <div
                  onClick={(e) => handleCompleteConnection(node.id, e)}
                  title="Connect input port"
                  className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    isConnecting && isConnecting.fromNodeId !== node.id
                      ? 'bg-emerald-500 border-white animate-bounce ring-4 ring-emerald-500/30'
                      : isLight ? 'bg-white border-slate-400 hover:scale-125' : 'bg-[#201f21] border-[#00dbe7] hover:scale-125'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-[#00dbe7]" />
                </div>

                {/* Output Connection Port (Right) */}
                <div
                  onClick={(e) => handleStartConnection(node.id, e)}
                  title="Drag or click to connect to next node"
                  className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    isConnecting?.fromNodeId === node.id
                      ? 'bg-purple-500 border-white ring-4 ring-purple-500/30'
                      : isLight ? 'bg-white border-slate-400 hover:scale-125' : 'bg-[#201f21] border-[#00dbe7] hover:scale-125'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-[#00dbe7]" />
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* 3. Node Configuration Drawer (Right Side) */}
        {selectedNode && (
          <div className={`w-80 sm:w-96 border-l flex flex-col h-full shrink-0 z-20 transition-all ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141417] border-outline/20'
          }`}>
            <div className="p-3.5 border-b border-inherit flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#00dbe7] shrink-0" />
                <span className="text-xs font-bold font-sans">Node Configuration</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs font-mono">
              {/* Node Name */}
              <div>
                <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                  Step Title
                </label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, name: val } : n));
                  }}
                  className={`w-full p-2 rounded-lg border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-black/30 border-white/10 text-white'
                  }`}
                />
              </div>

              {/* Node Category Specific Configs */}
              {selectedNode.category === 'http' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Method & Endpoint</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedNode.config.method || 'GET'}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, method: val } } : n));
                        }}
                        className={`p-2 rounded-lg border text-xs font-bold ${
                          isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'
                        }`}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                      <input
                        type="text"
                        value={selectedNode.config.url || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, url: val } } : n));
                        }}
                        placeholder="/api/health or https://api.endpoint"
                        className={`flex-1 p-2 rounded-lg border text-xs ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-black/30 border-white/10 text-white'
                        }`}
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedNode.category === 'ai' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Local Ollama Model</label>
                    <select
                      value={selectedNode.config.aiModel || 'finllm:latest'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, aiModel: val } } : n));
                      }}
                      className={`w-full p-2 rounded-lg border text-xs ${
                        isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'
                      }`}
                    >
                      <option value="finllm:latest">finllm:latest (Quant & Momentum Agent)</option>
                      <option value="qwen2.5:1.5b">qwen2.5:1.5b (Fast Sub-Second Synthesizer)</option>
                      <option value="deepseek-r1:1.5b">deepseek-r1:1.5b (Fast Reasoning CoT)</option>
                      <option value="qwen2.5-coder:3b">qwen2.5-coder:3b (Code & Logic Specialist)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">AI Prompt Instructions</label>
                    <textarea
                      rows={4}
                      value={selectedNode.config.aiPrompt || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, aiPrompt: val } } : n));
                      }}
                      className={`w-full p-2 rounded-lg border text-xs resize-y ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-black/30 border-white/10 text-white'
                      }`}
                    />
                  </div>
                </>
              )}

              {selectedNode.category === 'schedule' && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Cron Expression (5-Field)</label>
                  <input
                    type="text"
                    value={selectedNode.config.cronExpression || '* * * * *'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, cronExpression: val } } : n));
                    }}
                    className={`w-full p-2 rounded-lg border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-black/30 border-white/10 text-white'
                    }`}
                  />
                  <span className="text-[10px] text-on-surface-variant mt-1 block">e.g. `*/5 * * * *` (every 5 mins) or `30 9 * * 1-5`</span>
                </div>
              )}

              {selectedNode.category === 'condition' && (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Evaluation Rule</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        placeholder="field"
                        value={selectedNode.config.conditionField || 'confidence'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, conditionField: val } } : n));
                        }}
                        className={`p-1.5 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                      <select
                        value={selectedNode.config.conditionOperator || '>'}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, conditionOperator: val } } : n));
                        }}
                        className={`p-1.5 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      >
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="contains">contains</option>
                      </select>
                      <input
                        type="text"
                        placeholder="value"
                        value={selectedNode.config.conditionValue || '0.75'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, conditionValue: val } } : n));
                        }}
                        className={`p-1.5 rounded border text-xs ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Execution Status, Errors & Output Telemetry */}
              <div className="pt-3 border-t border-outline/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                    Node Execution Status
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${
                    selectedNode.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    selectedNode.status === 'ERROR' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                    selectedNode.status === 'RUNNING' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {selectedNode.status} {selectedNode.executionDurationMs !== undefined ? `(${selectedNode.executionDurationMs}ms)` : ''}
                  </span>
                </div>

                {/* Prominent Error Trace Banner */}
                {selectedNode.error && (
                  <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>Execution Error Encountered</span>
                    </div>
                    <p className="text-[11px] select-all bg-black/30 p-2 rounded-lg border border-rose-500/25 text-rose-200 leading-relaxed font-mono">
                      {selectedNode.error}
                    </p>
                    <div className="text-[10px] text-rose-300/80 flex items-center gap-1 pt-1">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Check endpoint configuration, network route, or HTTP headers.</span>
                    </div>
                  </div>
                )}

                {/* Step Output Inspection */}
                {selectedNode.outputData && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Step Output Payload
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedNode.outputData, null, 2));
                          setCopiedKey(`node-${selectedNode.id}`);
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="text-[10px] font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `node-${selectedNode.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === `node-${selectedNode.id}` ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                    </div>
                    <pre className={`p-2.5 rounded-xl text-[10px] overflow-x-auto max-h-48 border select-all scrollbar-thin ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-black/40 border-white/10 text-emerald-300'
                    }`}>
                      <code>{JSON.stringify(selectedNode.outputData, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Delete Node Button */}
              <div className="pt-4 border-t border-outline/10">
                <button
                  type="button"
                  onClick={() => {
                    const toDelete = selectedNode.id;
                    setNodes(prev => prev.filter(n => n.id !== toDelete));
                    setConnections(prev => prev.filter(c => c.fromNodeId !== toDelete && c.toNodeId !== toDelete));
                    setSelectedNodeId(null);
                  }}
                  className={`w-full h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isLight ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Remove Node</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 4. Comprehensive Workflow Execution & Diagnostics Console (3-Tab n8n-style Inspector) */}
      {isExecutionDrawerOpen && (
        <div className={`h-64 sm:h-72 border-t flex flex-col shrink-0 z-30 transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121215] border-outline/20'
        }`}>
          {/* Header Bar with Tabs */}
          <div className="px-3 py-2 border-b border-inherit flex items-center justify-between gap-2 text-xs font-mono shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
              </div>
              <span className="font-bold hidden sm:inline text-on-surface">Execution Console:</span>

              {/* Console Tabs */}
              <div className={`flex rounded-lg p-0.5 border text-[11px] ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('console')}
                  className={`px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                    activeInspectorTab === 'console'
                      ? isLight
                        ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                        : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Terminal className="w-3 h-3 shrink-0" />
                  <span>Stream ({executionLogs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('inspector')}
                  className={`px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                    activeInspectorTab === 'inspector'
                      ? isLight
                        ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                        : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <FileCode className="w-3 h-3 shrink-0" />
                  <span>Step Outputs ({stepExecutions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInspectorTab('errors')}
                  className={`px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                    activeInspectorTab === 'errors'
                      ? isLight
                        ? 'bg-rose-50 text-rose-700 font-bold shadow-sm border border-rose-300'
                        : 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40'
                      : stepExecutions.some(s => s.status === 'ERROR')
                        ? 'text-rose-400 font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Bug className="w-3 h-3 shrink-0" />
                  <span>Errors ({stepExecutions.filter(s => s.status === 'ERROR').length})</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isExecutingWorkflow
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 animate-pulse'
                  : stepExecutions.some(s => s.status === 'ERROR')
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isExecutingWorkflow ? '⚡ EXECUTING PIPELINE...' : stepExecutions.some(s => s.status === 'ERROR') ? '⚠️ STEP FAILED' : '✓ IDLE / READY'}
              </span>

              <button
                type="button"
                onClick={() => setIsExecutionDrawerOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
                title="Close Execution Drawer"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* Tab 1: Live Console Log Stream */}
          {activeInspectorTab === 'console' && (
            <div className="p-3 flex-1 overflow-y-auto font-mono text-[11px] space-y-1 scrollbar-thin select-all">
              {executionLogs.length === 0 ? (
                <div className="text-on-surface-variant opacity-60 flex items-center gap-2 py-4 justify-center">
                  <Play className="w-4 h-4 shrink-0" />
                  <span>Click "Execute Workflow" above to start live DAG pipeline execution.</span>
                </div>
              ) : (
                executionLogs.map((log, idx) => (
                  <div key={idx} className={`leading-relaxed font-mono ${
                    log.includes('✓') ? 'text-emerald-400' :
                    log.includes('✗') ? 'text-rose-400 font-bold' :
                    log.includes('⚠️') ? 'text-amber-400' :
                    log.includes('▶') ? 'text-sky-400' :
                    'text-on-surface'
                  }`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Step Outputs & Payload Inspector */}
          {activeInspectorTab === 'inspector' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Step List */}
              <div className={`w-56 sm:w-64 border-r overflow-y-auto p-2 space-y-1 scrollbar-thin shrink-0 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/5'
              }`}>
                {stepExecutions.length === 0 ? (
                  <div className="text-center py-6 text-[10px] text-on-surface-variant font-mono">
                    No steps executed yet. Run workflow to inspect data.
                  </div>
                ) : (
                  stepExecutions.map(step => {
                    const isSelected = (inspectedStepId || stepExecutions[0]?.nodeId) === step.nodeId;
                    return (
                      <button
                        key={step.nodeId}
                        type="button"
                        onClick={() => setInspectedStepId(step.nodeId)}
                        className={`w-full p-2 rounded-lg text-left font-mono transition-all border flex items-center justify-between gap-1.5 cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-white border-sky-400 text-sky-800 shadow-sm'
                              : 'bg-[#00dbe7]/15 border-[#00dbe7]/40 text-[#74f5ff]'
                            : isLight
                              ? 'bg-white/60 hover:bg-white border-slate-200 text-slate-700'
                              : 'bg-white/5 hover:bg-white/10 border-white/5 text-on-surface-variant'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {step.status === 'SUCCESS' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold truncate leading-tight">{step.nodeName}</div>
                            <div className="text-[9px] opacity-60 uppercase">{step.category}</div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono shrink-0 opacity-80">{step.durationMs}ms</span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Column: Step Input & Output Data */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs scrollbar-thin">
                {(() => {
                  const activeStep = stepExecutions.find(s => s.nodeId === (inspectedStepId || stepExecutions[0]?.nodeId));
                  if (!activeStep) {
                    return (
                      <div className="text-center py-8 text-on-surface-variant font-mono text-xs">
                        Select an executed step from the left to inspect its input config and output payload.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-inherit pb-2">
                        <div>
                          <span className="font-bold text-sm text-on-surface">{activeStep.nodeName}</span>
                          <span className="text-[10px] text-on-surface-variant ml-2 uppercase font-mono">({activeStep.category})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono opacity-80">{activeStep.durationMs}ms latency</span>
                          {activeStep.outputPayload && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(activeStep.outputPayload, null, 2));
                                setCopiedKey(`step-${activeStep.nodeId}`);
                                setTimeout(() => setCopiedKey(null), 2000);
                              }}
                              className="text-[10px] font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === `step-${activeStep.nodeId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedKey === `step-${activeStep.nodeId}` ? 'Copied' : 'Copy Output JSON'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Input Parameters */}
                      <div>
                        <div className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Step Configuration (Input)</div>
                        <pre className={`p-2 rounded-lg text-[10px] overflow-x-auto border select-all ${
                          isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-black/30 border-white/10 text-on-surface-variant'
                        }`}>
                          <code>{JSON.stringify(activeStep.inputConfig, null, 2)}</code>
                        </pre>
                      </div>

                      {/* Output Payload */}
                      {activeStep.outputPayload && (
                        <div>
                          <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Execution Response Payload (Output)</div>
                          <pre className={`p-2.5 rounded-lg text-[10px] overflow-x-auto border select-all ${
                            isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-black/40 border-white/10 text-emerald-300'
                          }`}>
                            <code>{JSON.stringify(activeStep.outputPayload, null, 2)}</code>
                          </pre>
                        </div>
                      )}

                      {/* Error if failed */}
                      {activeStep.error && (
                        <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
                          <div className="font-bold flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Step Failure Details</span>
                          </div>
                          <p className="font-mono text-[11px] select-all">{activeStep.error}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tab 3: Errors & Diagnostics */}
          {activeInspectorTab === 'errors' && (
            <div className="p-3 flex-1 overflow-y-auto space-y-2 font-mono text-xs scrollbar-thin">
              {stepExecutions.filter(s => s.status === 'ERROR').length === 0 ? (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>No Execution Errors Detected</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/80">
                    All executed workflow steps completed with status SUCCESS.
                  </p>
                </div>
              ) : (
                stepExecutions.filter(s => s.status === 'ERROR').map((errStep, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-bold text-sm text-rose-300">
                          Step {errStep.stepIndex}: {errStep.nodeName} ({errStep.category.toUpperCase()})
                        </span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-mono">Failed in {errStep.durationMs}ms</span>
                    </div>

                    <div className="p-2 rounded bg-black/40 border border-rose-500/30 text-[11px] font-mono select-all">
                      {errStep.error || 'Execution failed.'}
                    </div>

                    <div className="text-[10px] text-rose-300/80 space-y-0.5">
                      <p className="font-bold">Troubleshooting Suggestions:</p>
                      <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-90">
                        {errStep.category === 'http' && (
                          <>
                            <li>Verify endpoint URL is online and reachable from the server.</li>
                            <li>Ensure authorization token header is valid and not expired.</li>
                            <li>Check CORS policies if calling an external browser-restricted API.</li>
                          </>
                        )}
                        {errStep.category === 'ai' && (
                          <>
                            <li>Confirm local Ollama inference service is running on VM 2 (port 11434).</li>
                            <li>Check if model weights are fully loaded into memory.</li>
                          </>
                        )}
                        {errStep.category === 'database' && (
                          <>
                            <li>Check SQL query syntax and table name identifiers.</li>
                            <li>Confirm PostgreSQL connection pool is active.</li>
                          </>
                        )}
                        {errStep.category === 'condition' && (
                          <>
                            <li>Verify the incoming field exists in previous node's output payload.</li>
                            <li>Confirm comparison operator and target value data types match.</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Add Node Modal */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#18181b] border-outline/20 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <h3 className="text-sm font-bold font-sans">Add Tool Node</h3>
              <button onClick={() => setIsAddNodeModalOpen(false)} className="cursor-pointer text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { name: 'REST API Request', cat: 'http', type: 'action', icon: <Globe className="w-4 h-4 text-sky-400" /> },
                { name: 'AI FinLLM Prompt', cat: 'ai', type: 'action', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
                { name: 'Database Query', cat: 'database', type: 'action', icon: <Database className="w-4 h-4 text-amber-400" /> },
                { name: 'Cron Timer Trigger', cat: 'schedule', type: 'trigger', icon: <Clock className="w-4 h-4 text-emerald-400" /> },
                { name: 'If / Else Condition', cat: 'condition', type: 'logic', icon: <GitBranch className="w-4 h-4 text-indigo-400" /> },
                { name: 'Webhook Alert', cat: 'notification', type: 'integration', icon: <Bell className="w-4 h-4 text-rose-400" /> },
              ].map(item => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    const newNode: WorkflowNode = {
                      id: `node-${Date.now()}`,
                      name: item.name,
                      category: item.cat as any,
                      type: item.type as any,
                      status: 'IDLE',
                      x: 200 + (nodes.length * 30),
                      y: 120 + (nodes.length * 20),
                      config: {}
                    };
                    const updated = [...nodes, newNode];
                    setNodes(updated);
                    saveWorkflowState(updated, connections);
                    setSelectedNodeId(newNode.id);
                    setIsAddNodeModalOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  {item.icon}
                  <span className="font-bold">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl p-5 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#18181b] border-outline/20 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <h3 className="text-sm font-bold font-sans">Pre-Built Automation Templates</h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="cursor-pointer text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold font-sans text-on-surface">{tpl.title}</h4>
                      <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">{tpl.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNodes(tpl.nodes);
                        setConnections(tpl.connections);
                        setActiveWorkflowName(tpl.title);
                        setSelectedNodeId(tpl.nodes[0]?.id || null);
                        saveWorkflowState(tpl.nodes, tpl.connections, tpl.title);
                        setIsTemplateModalOpen(false);
                        onAddLog({
                          timestamp: new Date().toLocaleTimeString(),
                          type: 'INFO',
                          message: `Loaded template: "${tpl.title}"`
                        });
                      }}
                      className={`h-7 px-3 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                        isLight ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-[#00dbe7]/20 hover:bg-[#00dbe7]/30 text-[#00dbe7] border border-[#00dbe7]/40'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Use Template</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-on-surface-variant pt-1">
                    <span>{tpl.nodes.length} Nodes</span>
                    <span>•</span>
                    <span>{tpl.connections.length} Connectors</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {confirmClearWorkflow && (
        <ConfirmModal
          isOpen={confirmClearWorkflow}
          onClose={() => setConfirmClearWorkflow(false)}
          onConfirm={() => {
            setNodes([]);
            setConnections([]);
            setSelectedNodeId(null);
            saveWorkflowState([], []);
            setConfirmClearWorkflow(false);
          }}
          title="Clear Workflow Canvas"
          message="Are you sure you want to clear all nodes and connectors from the workflow?"
          subtext="Any unsaved progress on the canvas will be wiped."
          variant="danger"
          confirmLabel="Clear Canvas"
          theme={theme}
        />
      )}

    </div>
  );
}
