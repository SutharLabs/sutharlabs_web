import React, { useState, useRef, useEffect } from 'react';
import { FlowNode, TerminalLog } from '../types';

interface FlowDesignerViewProps {
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
}

const initialNodes: FlowNode[] = [
  { id: '1', label: 'SutharCore Stock API', type: 'source', status: 'EXECUTED', x: 50, y: 80, fileUsed: 'stocks_list_feed.csv' },
  { id: '2', label: 'SutharAnalytics Node', type: 'processor', status: 'ACTIVE', pluginActive: true, x: 260, y: 150 },
  { id: '3', label: 'PostgreSQL Ledger', type: 'output', status: 'IDLE', x: 480, y: 90 }
];

export default function FlowDesignerView({ onAddLog, userToken }: FlowDesignerViewProps) {
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);

  // Load layout nodes on mount
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await fetch('/api/nodes', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setNodes(data);
        }
      } catch (err) {
        console.error('Failed to load nodes:', err);
      }
    };
    fetchNodes();
  }, [userToken]);

  // Sync canvas nodes layout to backend SQLite
  const syncNodesWithBackend = async (updatedNodes: FlowNode[]) => {
    try {
      const response = await fetch('/api/nodes/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(updatedNodes)
      });
      if (!response.ok) {
        const errData = await response.json();
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          message: `DAG Error: ${errData.error || 'Failed to sync visual workflow canvas.'}`
        });
      }
    } catch (err) {
      console.error('Failed to sync canvas nodes:', err);
    }
  };

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('2');
  const [isDraggingNodeId, setIsDraggingNodeId] = useState<string | null>(null);
  
  // Drag offsets
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // File Drop integration
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [importedFilename, setImportedFilename] = useState<string>('');

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Handle standard node dragging clicks
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setIsDraggingNodeId(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      dragOffset.current = {
        x: e.clientX - node.x,
        y: e.clientY - node.y
      };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingNodeId) return;
    
    // Bounds check within container boundaries
    if (canvasRef.current) {
      const containerRect = canvasRef.current.getBoundingClientRect();
      let nextX = e.clientX - dragOffset.current.x;
      let nextY = e.clientY - dragOffset.current.y;

      // Restrain coordinates
      nextX = Math.max(10, Math.min(containerRect.width - 200, nextX));
      nextY = Math.max(10, Math.min(containerRect.height - 100, nextY));

      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === isDraggingNodeId ? { ...n, x: nextX, y: nextY } : n
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDraggingNodeId) {
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'INFO',
        message: `Node [${nodes.find(n => n.id === isDraggingNodeId)?.label}] coordinate positions updated.`
      });
      setIsDraggingNodeId(null);
      syncNodesWithBackend(nodes);
    }
  };

  // Node Creator
  const addNewNode = () => {
    const names = ['AI Classifier API', 'Risk Assessor', 'SMTP Transceiver', 'Slack Webhook Gateway', 'IP Anonymization Stack'];
    const label = names[Math.floor(Math.random() * names.length)];
    const types: ('source' | 'processor' | 'output')[] = ['processor', 'output'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const count = nodes.length + 1;
    const newNode: FlowNode = {
      id: String(count),
      label: `${label} - ${count}`,
      type: type,
      status: 'IDLE',
      x: 180 + Math.random() * 80,
      y: 100 + Math.random() * 80
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    setSelectedNodeId(newNode.id);
    syncNodesWithBackend(nextNodes);
    
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `SUCCESS: Provisioned and injected micro node [${newNode.label}] to canvas.`
    });
  };

  // Node property update helpers
  const updateSelectedNode = (updates: Partial<FlowNode>) => {
    if (!selectedNodeId) return;
    const nextNodes = nodes.map(n => n.id === selectedNodeId ? { ...n, ...updates } : n);
    setNodes(nextNodes);
    syncNodesWithBackend(nextNodes);
  };

  // SVG Bezier Curves drawing calculation helpers
  const drawBezierLine = (x1: number, y1: number, x2: number, y2: number) => {
    const cp1x = x1 + (x2 - x1) / 2;
    const cp1y = y1;
    const cp2x = x1 + (x2 - x1) / 2;
    const cp2y = y2;
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  };

  return (
    <div className="flex-grow flex flex-col gap-4">
      {/* Designer Dashboard Header toolbar info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-[#1c1b1d]/40 border border-outline/20 p-3 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#ce5dff] select-none text-md">account_tree</span>
          <div>
            <h2 className="font-mono text-xs font-bold text-on-surface leading-none">Custom_Flow.flow</h2>
            <span className="text-[10px] text-[#b9cacb]/80 leading-none">Visual Orchestration Workspace</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={addNewNode}
            className="px-3 py-1.5 rounded bg-[#ce5dff] text-[#480064] font-mono text-[10px] uppercase font-bold hover:brightness-110 tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_8px_rgba(206,93,255,0.25)]"
          >
            <span className="material-symbols-outlined text-xs select-none leading-none">add</span> Include Node
          </button>
          <button 
            onClick={() => {
              setNodes(initialNodes);
              syncNodesWithBackend(initialNodes);
              onAddLog({
                timestamp: new Date().toLocaleTimeString(),
                type: 'ALERT',
                message: 'Flow canvas node positions reverted to initial defaults.'
              });
            }}
            className="px-3 py-1.5 rounded bg-[#201f21] border border-outline/30 text-xs text-[#b9cacb] font-mono hover:text-on-surface cursor-pointer"
          >
            Clear Nodes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow min-h-[460px]">
        {/* Graph Canvas Container */}
        <div className="lg:col-span-8 flex flex-col relative">
          <div 
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="flex-grow rounded-lg h-full border border-outline/15 bg-surface-container-low/80 chart-grid relative overflow-hidden select-none"
          >
            {/* SVG wires connections layer */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
              <defs>
                <linearGradient id="glowPurple" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00dbe7" />
                  <stop offset="50%" stopColor="#ce5dff" />
                  <stop offset="100%" stopColor="#00e476" />
                </linearGradient>
              </defs>

              {/* Draw connected Bezier lines dynamically based on node coordinates */}
              {nodes.map((node, i) => {
                if (i === nodes.length - 1) return null;
                const nextNode = nodes[i + 1];
                
                // Output side center right of previous node
                const startX = node.x + 180;
                const startY = node.y + 35;
                
                // Input side center left of next node
                const endX = nextNode.x;
                const endY = nextNode.y + 35;

                return (
                  <path 
                    key={node.id}
                    d={drawBezierLine(startX, startY, endX, endY)}
                    fill="none" 
                    stroke="url(#glowPurple)" 
                    strokeWidth="2" 
                    className="opacity-70 drop-shadow-[0_0_4px_rgba(206,93,255,0.5)]"
                  />
                );
              })}
            </svg>

            {/* Nodes Elements Layer */}
            {nodes.map((node) => {
              const isActive = selectedNodeId === node.id;
              let badgeColor = 'bg-[#201f21] text-[#b9cacb] border-outline/30';
              if (node.status === 'EXECUTED') badgeColor = 'bg-[#00fb83]/10 text-[#00e476] border-[#00e476]/35';
              if (node.status === 'ACTIVE') badgeColor = 'bg-[#ce5dff]/10 text-[#ebb2ff] border-[#ce5dff]/35';

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  className={`absolute w-[180px] p-3 rounded-lg glass-panel hover:scale-[1.01] hover:border-[#74f5ff]/20 hover:shadow-[0_0_12px_rgba(0,219,231,0.15)] transition-all cursor-grab active:cursor-grabbing z-10 ${
                    isActive ? 'neon-border-active' : 'border-outline/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">{node.type}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono leading-none border uppercase ${badgeColor}`}>
                      {node.status || 'IDLE'}
                    </span>
                  </div>
                  
                  <h3 className="text-xs font-semibold text-on-surface leading-tight select-none pointer-events-none truncate">{node.label}</h3>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#849495]"></div>
                    <span className="font-mono text-[8px] text-on-surface-variant">x:{Math.round(node.x)} y:{Math.round(node.y)}</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-[#00fb83]"></div>
                  </div>
                </div>
              );
            })}

            {/* Empty Watermark Indicator */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-on-surface-variant font-mono text-xs">
                No active nodes. Click "Include Node" to initialize pipeline.
              </div>
            )}
          </div>
        </div>

        {/* Property Inspector sidebar / Form configurer */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Node detailed inspector */}
          <div className="glass-panel rounded-lg p-5 border border-outline/15 flex-grow flex flex-col gap-5 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-outline/10 pb-2">
                <span className="material-symbols-outlined text-[#00dbe7] text-md select-none">terminal</span>
                <h3 className="font-mono text-xs font-bold text-on-surface uppercase tracking-widest">Properties</h3>
              </div>

              {selectedNode ? (
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] text-on-surface-variant uppercase">Node Label</label>
                    <input 
                      type="text"
                      className="w-full bg-surface-container-high border border-outline/40 rounded p-2 text-xs font-mono text-on-surface focus: focus:border-outline/40 focus:ring-0 outline-none transition-all"
                      value={selectedNode.label}
                      onChange={(e) => updateSelectedNode({ label: e.target.value })}
                    />
                  </div>

                  {/* Status Dropdowns */}
                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] text-on-surface-variant uppercase">Process Status</label>
                    <select 
                      className="w-full bg-[#201f21] border border-outline/40 rounded p-2 text-xs font-mono text-on-surface focus:outline-none focus:border-[#ce5dff] focus:ring-0"
                      value={selectedNode.status || 'IDLE'}
                      onChange={(e) => updateSelectedNode({ status: e.target.value as any })}
                    >
                      <option value="IDLE">IDLE</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="EXECUTED">EXECUTED</option>
                    </select>
                  </div>

                  {/* Attachment toggle sliders */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="block font-mono text-xs text-on-surface font-medium">Orchestration Plugin</span>
                      <span className="text-[10px] text-on-surface-variant font-light">Bypass validation checks</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={!!selectedNode.pluginActive}
                        onChange={(e) => updateSelectedNode({ pluginActive: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-[#201f21] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ce5dff] peer-checked:after:bg-white peer-checked:after:border-none"></div>
                    </label>
                  </div>

                  {selectedNode.fileUsed && (
                    <div className="p-3 rounded bg-[#0e0e10]/80 border border-outline/30 font-mono text-[10px] space-y-1 text-[#b9cacb]">
                      <div className="text-on-surface-variant uppercase">Linked Schema Assets</div>
                      <div className="text-white font-bold truncate">{selectedNode.fileUsed}</div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-12 text-on-surface-variant font-mono text-xs">
                  Select a workflow node on the canvas to configure parameters.
                </div>
              )}
            </div>

            {/* Simulated CSV Import Drop Zone */}
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                const file = e.dataTransfer.files[0];
                if (file) {
                  setImportedFilename(file.name);
                  if (selectedNodeId) {
                    updateSelectedNode({ fileUsed: file.name, status: 'EXECUTED' });
                  }
                  onAddLog({
                    timestamp: new Date().toLocaleTimeString(),
                    type: 'SUCCESS',
                    message: `SUCCESS: Imported file asset [${file.name}] into current execution thread.`
                  });
                }
              }}
              className={`border-2 border-dashed p-4 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDraggingFile ? 'border-[#00dbe7] bg-[#00dbe7]/5' : 'border-outline/30 hover:border-[#00e476]/50'
              }`}
            >
              <span className="material-symbols-outlined text-[#00e476] mb-1.5 text-2xl select-none">upload_file</span>
              <span className="font-sans text-xs text-on-surface font-medium block">Drop schema dataset (.csv, .json)</span>
              <span className="text-[10px] font-mono text-on-surface-variant block mt-0.5">Drag &amp; drop mock values here</span>
              
              {importedFilename && (
                <div className="mt-3 bg-[#00fb83]/10 text-[#00e476] border border-[#00fb83]/30 px-2 py-1 rounded text-[10px] font-mono truncate w-full max-w-[200px]">
                  Loaded: {importedFilename}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
