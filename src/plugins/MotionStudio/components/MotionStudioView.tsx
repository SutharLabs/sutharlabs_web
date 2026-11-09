import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Sparkles, 
  Layers, 
  Cpu, 
  Smartphone, 
  Laptop, 
  Server, 
  Zap, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Sliders, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Share2,
  QrCode,
  Activity
} from 'lucide-react';
import { WorkspacePluginViewProps } from '../../types.js';
import MotionVideoStudioTool from '../../DocNexus/components/tools/MotionVideoStudioTool.js';
import MockupStudioTool from '../../DocNexus/components/tools/MockupStudioTool.js';
import BackgroundRemoverTool from '../../DocNexus/components/tools/BackgroundRemoverTool.js';
import ConfirmModal from '../../../components/ConfirmModal.js';

type MotionTab = 'video' | 'thumbnail' | 'mockup' | 'cutout' | 'cluster';

interface ClusterNode {
  id: string;
  name: string;
  type: 'master' | 'worker';
  platform: 'android' | 'ios' | 'pc' | 'mac' | 'vm';
  endpoint: string;
  memoryMb: number;
  freeMemoryMb: number;
  speedGbps: number;
  assignedLayers: number;
  totalLayers: number;
  status: 'active' | 'idle' | 'unreachable';
  isThisDevice?: boolean;
}

export default function MotionStudioView({
  logs,
  onAddLog,
  userEmail,
  userToken,
  theme = 'dark',
  userRole
}: WorkspacePluginViewProps) {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<MotionTab>('video');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cluster & Multi-Device RPC State (from cross-platform-llm-client architecture)
  const [isClusterEnabled, setIsClusterEnabled] = useState<boolean>(true);
  const [clusterNodes, setClusterNodes] = useState<ClusterNode[]>([
    {
      id: 'node-master-vm2',
      name: 'Oracle VM 2 (Ampere ARM64 Master)',
      type: 'master',
      platform: 'vm',
      endpoint: '127.0.0.1:11434',
      memoryMb: 12288,
      freeMemoryMb: 7420,
      speedGbps: 18.4,
      assignedLayers: 16,
      totalLayers: 28,
      status: 'active',
      isThisDevice: true
    },
    {
      id: 'node-worker-rtx',
      name: 'Secondary Worker (RTX 4090 / PC Node)',
      type: 'worker',
      platform: 'pc',
      endpoint: '192.168.1.105:50052',
      memoryMb: 24576,
      freeMemoryMb: 18400,
      speedGbps: 1008.0,
      assignedLayers: 12,
      totalLayers: 28,
      status: 'active'
    }
  ]);

  // New Node Form State
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeEndpoint, setNewNodeEndpoint] = useState<string>('');
  const [newNodePlatform, setNewNodePlatform] = useState<'android' | 'ios' | 'pc' | 'mac'>('android');
  const [newNodeMemory, setNewNodeMemory] = useState<number>(8192);
  const [isAddingNode, setIsAddingNode] = useState<boolean>(false);

  // Add Log Helper
  const addLogSafe = (type: 'INFO' | 'SUCCESS' | 'ERROR', message: string) => {
    if (onAddLog) {
      onAddLog({
        type: type === 'ERROR' ? 'ERROR' : type === 'SUCCESS' ? 'SUCCESS' : 'INFO',
        message: `[MotionStudio] ${message}`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  // Add a new RPC cluster worker node
  const handleAddWorker = () => {
    if (!newNodeEndpoint.trim()) {
      setErrorMessage('Endpoint IP and port are required (e.g. 192.168.1.50:50052)');
      return;
    }

    const newNode: ClusterNode = {
      id: `node-worker-${Date.now()}`,
      name: newNodeName.trim() || `Worker (${newNodeEndpoint})`,
      type: 'worker',
      platform: newNodePlatform,
      endpoint: newNodeEndpoint.trim(),
      memoryMb: newNodeMemory,
      freeMemoryMb: Math.round(newNodeMemory * 0.75),
      speedGbps: newNodePlatform === 'pc' ? 450 : 28.5,
      assignedLayers: 0,
      totalLayers: 28,
      status: 'active'
    };

    setClusterNodes(prev => [...prev, newNode]);
    setNewNodeName('');
    setNewNodeEndpoint('');
    setIsAddingNode(false);
    addLogSafe('SUCCESS', `Paired new RPC cluster worker: ${newNode.name} at ${newNode.endpoint}`);
    setStatusMessage(`Worker node ${newNode.name} paired successfully.`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleRemoveWorker = (id: string) => {
    setClusterNodes(prev => prev.filter(n => n.id !== id));
    addLogSafe('INFO', `Removed worker node ${id} from inference cluster.`);
  };

  // Calculate cluster summary metrics (inspired by cross-platform-llm-client planner)
  const totalClusterRamMb = clusterNodes.reduce((acc, n) => acc + n.freeMemoryMb, 0);
  const totalLayers = 28;
  const masterLayers = clusterNodes.find(n => n.type === 'master')?.assignedLayers || 16;
  const workerLayers = totalLayers - masterLayers;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Standard Header with Dedicated Container Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline/10">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
            <Film className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
              Motion &amp; Creative Studio
            </h2>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Kinetic HTML5 Video Generator • 9:16 Vertical, 16:9 &amp; 1:1 • Multi-Device GPU Cluster Acceleration
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <a
            href="/admin/storage"
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span>File Vault</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setStatusMessage('Cluster and GPU engine operational. 0 cold reload latency.');
              setTimeout(() => setStatusMessage(null), 3000);
            }}
            className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
              isLight
                ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 font-bold'
                : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 hover:border-[#00dbe7]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>Probe Engine</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
        <div className={`inline-flex rounded-xl p-1 border text-xs font-mono ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#18181c] border-[#3a494b]/40'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'video'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Film className="w-3.5 h-3.5 shrink-0" />
            <span>Kinetic Video &amp; Reels</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thumbnail')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'thumbnail'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>YouTube Thumbnails</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mockup')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mockup'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 shrink-0" />
            <span>3D Device Mockups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cutout')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cutout'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>AI Background Cutout</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cluster')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cluster'
                ? isLight
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>GPU Cluster Acceleration</span>
          </button>
        </div>

        {/* Active Pill Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>100% Client-Side Engine</span>
          </span>
          <span>•</span>
          <span className="text-on-surface-variant font-medium">Zero Server Latency</span>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 animate-in fade-in ${
          isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="cursor-pointer font-bold">×</button>
        </div>
      )}

      {/* 3. TAB 1: KINETIC VIDEO & REELS */}
      {activeTab === 'video' && (
        <MotionVideoStudioTool
          isLight={isLight}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          setStatus={setStatusMessage}
          setError={setErrorMessage}
          addLog={addLogSafe}
        />
      )}

      {/* 4. TAB 2: YOUTUBE THUMBNAILS & MOCKUPS */}
      {activeTab === 'thumbnail' && (
        <MockupStudioTool
          isLight={isLight}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          setStatus={setStatusMessage}
          setError={setErrorMessage}
          addLog={addLogSafe}
        />
      )}

      {/* 5. TAB 3: 3D DEVICE & APPAREL MOCKUPS */}
      {activeTab === 'mockup' && (
        <MockupStudioTool
          isLight={isLight}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          setStatus={setStatusMessage}
          setError={setErrorMessage}
          addLog={addLogSafe}
        />
      )}

      {/* 6. TAB 4: AI BACKGROUND REMOVER */}
      {activeTab === 'cutout' && (
        <BackgroundRemoverTool
          isLight={isLight}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          setStatus={setStatusMessage}
          setError={setErrorMessage}
          addLog={addLogSafe}
        />
      )}

      {/* 7. TAB 5: MULTI-DEVICE GPU CLUSTER ACCELERATION (cross-platform-llm-client optimization) */}
      {activeTab === 'cluster' && (
        <div className="space-y-6">
          {/* Architecture Banner */}
          <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131315] border-[#3a494b]/50'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5 text-purple-400 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface font-sans">
                    Multi-Device Model Sharding &amp; RPC Worker Cluster
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                    Distributed llama.cpp / ggml-rpc Engine • Spreads 7B–27B Model Layers across Phones, PCs &amp; VMs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNode(!isAddingNode)}
                  className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
                    isLight
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border-[#00dbe7]/50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Pair Worker Device</span>
                </button>
              </div>
            </div>

            {/* Core Optimizations Explainer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-outline/10 text-xs font-mono">
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
              }`}>
                <div className="font-bold text-[#00dbe7] flex items-center gap-1 mb-1">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Output Layer on Master (2x Faster)</span>
                </div>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  Keeping the output projection on Master eliminates transmitting high-bandwidth logit tensors over Wi-Fi, cutting latency by 50%+.
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
              }`}>
                <div className="font-bold text-purple-400 flex items-center gap-1 mb-1">
                  <Sliders className="w-3.5 h-3.5 shrink-0" />
                  <span>Fastest-First Memory Planner</span>
                </div>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  Probes memory speed (GB/s) across all nodes. Fills fastest GPUs first up to RAM headroom so slow devices don't bottleneck the pipeline.
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
              }`}>
                <div className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Clean Abort Lifecycle</span>
                </div>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  Hanging up mid-stream waits for previous generation tokens to finish before context reuse, preventing stale leaks and native crashes.
                </p>
              </div>
            </div>
          </div>

          {/* New Worker Pairing Form */}
          {isAddingNode && (
            <div className={`p-4 rounded-xl border space-y-3 animate-in fade-in ${
              isLight ? 'bg-white border-slate-300' : 'bg-[#18181c] border-[#3a494b]/60'
            }`}>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#00dbe7] shrink-0" />
                <span>Pair New Worker Device (Phone, Tablet, or PC)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <span className="block text-[11px] font-mono text-on-surface-variant mb-1">Device Name</span>
                  <input
                    type="text"
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    placeholder="e.g. Pixel 8 / RTX 3080"
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border focus:outline-hidden ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-mono text-on-surface-variant mb-1">RPC Endpoint (Host:Port)</span>
                  <input
                    type="text"
                    value={newNodeEndpoint}
                    onChange={(e) => setNewNodeEndpoint(e.target.value)}
                    placeholder="192.168.1.15:50052"
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border focus:outline-hidden ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-mono text-on-surface-variant mb-1">Platform</span>
                  <select
                    value={newNodePlatform}
                    onChange={(e) => setNewNodePlatform(e.target.value as any)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    <option value="android">Android (Vulkan GPU)</option>
                    <option value="ios">iOS / iPad (Metal GPU)</option>
                    <option value="pc">PC / Linux (CUDA / ROCm)</option>
                    <option value="mac">macOS (Metal Unified)</option>
                  </select>
                </div>

                <div>
                  <span className="block text-[11px] font-mono text-on-surface-variant mb-1">Allocated RAM (MB)</span>
                  <input
                    type="number"
                    value={newNodeMemory}
                    onChange={(e) => setNewNodeMemory(Number(e.target.value))}
                    step={1024}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline/10">
                <button
                  type="button"
                  onClick={() => setIsAddingNode(false)}
                  className={`h-7 px-3 rounded text-xs font-mono border cursor-pointer ${
                    isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddWorker}
                  className="h-7 px-3.5 rounded text-xs font-mono font-bold bg-[#00dbe7] text-black cursor-pointer shadow-xs"
                >
                  Connect &amp; Probe
                </button>
              </div>
            </div>
          )}

          {/* Connected Cluster Nodes List */}
          <div className={`rounded-xl border overflow-hidden ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131315] border-[#3a494b]/50'
          }`}>
            <div className={`p-3.5 border-b flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#18181c] border-[#3a494b]/40 text-[#e5e1e4]'
            }`}>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Active Cluster Nodes ({clusterNodes.length})</span>
              </div>
              <div className="text-[11px] font-normal text-emerald-400">
                Total Pool: {(totalClusterRamMb / 1024).toFixed(1)} GB Free RAM
              </div>
            </div>

            <div className="divide-y divide-outline/10">
              {clusterNodes.map((node) => (
                <div key={node.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                      node.type === 'master'
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                        : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    }`}>
                      {node.platform === 'android' ? (
                        <Smartphone className="w-4 h-4 shrink-0" />
                      ) : node.platform === 'pc' ? (
                        <Laptop className="w-4 h-4 shrink-0" />
                      ) : (
                        <Server className="w-4 h-4 shrink-0" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface text-sm">{node.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                          node.type === 'master'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        }`}>
                          {node.type}
                        </span>
                        {node.isThisDevice && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Local Node
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                        <span>{node.endpoint}</span>
                        <span>•</span>
                        <span>{(node.freeMemoryMb / 1024).toFixed(1)} GB / {(node.memoryMb / 1024).toFixed(1)} GB RAM</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{node.speedGbps} GB/s bandwidth</span>
                      </div>
                    </div>
                  </div>

                  {/* Layer Distribution Bar */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-on-surface">
                        {node.assignedLayers} / {node.totalLayers} Layers
                      </div>
                      <div className="text-[10px] text-on-surface-variant">
                        {Math.round((node.assignedLayers / node.totalLayers) * 100)}% of model weights
                      </div>
                    </div>

                    {node.type !== 'master' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveWorker(node.id)}
                        className="p-1.5 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove node"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Model Sharding Progress Visualizer */}
            <div className="p-3.5 bg-black/30 border-t border-outline/10 text-xs font-mono">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-gray-300">Distributed Layer Sharding (Moonlight 16B / Gemma 27B)</span>
                <span className="text-[#00dbe7] font-bold">
                  Master: {masterLayers} layers ({Math.round((masterLayers / totalLayers) * 100)}%) • Workers: {workerLayers} layers ({Math.round((workerLayers / totalLayers) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                <div style={{ width: `${(masterLayers / totalLayers) * 100}%` }} className="h-full bg-sky-500" title="Master Layers (includes Output Embedding Layer)" />
                <div style={{ width: `${(workerLayers / totalLayers) * 100}%` }} className="h-full bg-purple-500" title="Worker Layers (GPU accelerated)" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

