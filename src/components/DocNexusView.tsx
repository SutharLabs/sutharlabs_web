import React, { useState, useEffect, useRef } from 'react';
import { TerminalLog } from '../types';
import { 
  BookOpen, 
  Save, 
  Download, 
  Activity, 
  Server, 
  Grid, 
  Info 
} from 'lucide-react';

interface DocNexusViewProps {
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
}

export default function DocNexusView({ onAddLog, userToken }: DocNexusViewProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('DocNexus Sovereign Guide');
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'SEQUENCE' | 'TOPOLOGY' | 'GRID'>('PREVIEW');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Custom parsers output states
  const [actors, setActors] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ from: string; to: string; text: string }[]>([]);
  const [topologyNodes, setTopologyNodes] = useState<string[]>([]);
  const [topologyConnections, setTopologyConnections] = useState<{ from: string; to: string; type: string }[]>([]);
  const [parsedTable, setParsedTable] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);

  // Table of contents headings
  const [headings, setHeadings] = useState<{ text: string; id: string; level: number }[]>([]);

  // Load document from database on mount
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const response = await fetch('/api/docnexus/document', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title || 'DocNexus Sovereign Guide');
          setContent(data.content || '');
        }
      } catch (err) {
        console.error('Failed to load DocNexus document:', err);
      }
    };
    fetchDoc();
  }, [userToken]);

  // Synchronize dynamic conversions and TOC on markdown change
  useEffect(() => {
    // 1. Table of Contents Heading Parser
    const lines = content.split('\n');
    const extractedHeadings: { text: string; id: string; level: number }[] = [];
    
    // 2. Sequence Diagram Parser parameters
    const extractedActors = new Set<string>();
    const extractedMessages: { from: string; to: string; text: string }[] = [];
    let insideSequenceBlock = false;

    // 3. Network Topology Parser parameters
    const extractedNodes = new Set<string>();
    const extractedConnections: { from: string; to: string; type: string }[] = [];
    let insideTopologyBlock = false;

    // 4. Data Tables Parser
    const tableRows: string[][] = [];
    let isTableActive = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Heading parsing
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].replace(/\*\*|`|_/g, '');
        const id = `heading-${idx}`;
        extractedHeadings.push({ text, id, level });
      }

      // Check codeblock states
      if (trimmed.startsWith('```sequence')) {
        insideSequenceBlock = true;
        return;
      }
      if (trimmed.startsWith('```topology')) {
        insideTopologyBlock = true;
        return;
      }
      if (trimmed.startsWith('```') && (insideSequenceBlock || insideTopologyBlock)) {
        insideSequenceBlock = false;
        insideTopologyBlock = false;
        return;
      }

      // Parse Sequence Diagrams
      if (insideSequenceBlock) {
        const msgMatch = trimmed.match(/^([\w\-]+)\s*->\s*([\w\-]+)\s*:\s*(.*)$/i);
        if (msgMatch) {
          const from = msgMatch[1].trim();
          const to = msgMatch[2].trim();
          const text = msgMatch[3].trim();
          extractedActors.add(from);
          extractedActors.add(to);
          extractedMessages.push({ from, to, text });
        }
      }

      // Parse Network Topologies
      if (insideTopologyBlock) {
        const connMatch = trimmed.match(/^\[([\w\-]+)\]\s*(===|---)\s*\[([\w\-]+)\]/i);
        if (connMatch) {
          const from = connMatch[1].trim();
          const type = connMatch[2];
          const to = connMatch[3].trim();
          extractedNodes.add(from);
          extractedNodes.add(to);
          extractedConnections.push({ from, to, type });
        }
      }

      // Parse Markdown Tables
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
        const columns = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        
        // Skip separator line (e.g. |:---|:---:|)
        const isSeparator = columns.every(col => col.match(/^:?-+:?$/));
        if (isSeparator) {
          isTableActive = true;
          return;
        }

        tableRows.push(columns);
      }
    });

    setHeadings(extractedHeadings);
    setActors(Array.from(extractedActors));
    setMessages(extractedMessages);
    setTopologyNodes(Array.from(extractedNodes));
    setTopologyConnections(extractedConnections);

    // Form sortable data tables
    if (tableRows.length > 1) {
      setParsedTable({
        headers: tableRows[0],
        rows: tableRows.slice(1)
      });
    } else {
      setParsedTable({ headers: [], rows: [] });
    }

  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/docnexus/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ title, content })
      });

      if (response.ok) {
        setSaveSuccess(true);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: `DOCNEXUS: Synchronized "${title}" document changes with SQLite database.`
        });
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format: 'pdf' | 'docx') => {
    const blobContent = `${title}\n\n${content}`;
    const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.${format}`;
    link.click();
    
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `DOCNEXUS: Exported custom dynamic document to standalone .${format} download file.`
    });
  };

  // High-performance bulletproof Markdown parsing regex helper
  const parseMarkdownToHtml = (text: string) => {
    let html = text;

    // Escape basic HTML
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold font-sans text-white mt-4 first:mt-0 mb-3">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold font-sans text-[#74f5ff] mt-5 mb-2">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold font-sans text-[#ce5dff] mt-4 mb-2">$1</h3>');

    // Blockquotes & GitHub callouts mapping
    // Convert GitHub alert boxes
    html = html.replace(/^\s*&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/gim, (match, type, content) => {
      let colorClass = 'border-[#74f5ff] bg-[#00dbe7]/5 text-[#74f5ff]';
      if (type === 'WARNING' || type === 'CAUTION') colorClass = 'border-[#ffb4ab] bg-red-950/10 text-[#ffb4ab]';
      if (type === 'IMPORTANT' || type === 'TIP') colorClass = 'border-[#00e476] bg-[#00fb83]/5 text-[#00e476]';
      
      return `<div class="border-l-4 p-4.5 my-4 rounded-r glass-panel ${colorClass}">
        <strong class="font-mono text-xs uppercase tracking-wider block mb-1 flex items-center gap-1.5 leading-none">
          <span class="material-symbols-outlined text-sm leading-none">info</span> ${type}
        </strong>
        <span class="text-sm font-sans font-light leading-relaxed">${content}</span>
      </div>`;
    });

    // Standard blockquote fallback
    html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote class="border-l-4 border-gray-600 pl-3 py-1 my-3 bg-white/[0.02] rounded-r font-sans italic text-sm text-[#b9cacb]">$1</blockquote>');

    // Code Blocks (fenced)
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-[#131315]/90 border border-[#3a494b]/20 rounded-lg p-3.5 my-4 font-mono text-xs overflow-x-auto text-[#ebb2ff]">$1</pre>');

    // Inline Code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-[#2a2a2c]/60 border border-[#3a494b]/25 px-1 py-0.5 rounded font-mono text-xs text-[#74f5ff]">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // Bullet list items
    html = html.replace(/^[-*+]\s+(.*$)/gim, '<li class="ml-4 list-disc pl-1 mb-1 font-light">$1</li>');
    html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul class="my-3 text-sm text-[#b9cacb]">$1</ul>');

    // Paragraph wrappers
    const paragraphs = html.split(/\n\n+/);
    const parsedParagraphs = paragraphs.map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li') || trimmed.startsWith('<div')) {
        return p;
      }
      return `<p class="text-sm text-[#b9cacb] leading-relaxed my-3 font-light">${p}</p>`;
    });

    return parsedParagraphs.join('\n');
  };

  const parsedHtml = parseMarkdownToHtml(content);

  // Table sort handler
  const handleSort = (index: number) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === index && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: index, direction });

    const sortedRows = [...parsedTable.rows].sort((a, b) => {
      if (a[index] < b[index]) return direction === 'asc' ? -1 : 1;
      if (a[index] > b[index]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setParsedTable(prev => ({ ...prev, rows: sortedRows }));
  };

  return (
    <div className="space-y-4 flex flex-col h-full overflow-y-auto">
      
      {/* Top Controls Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#3a494b]/20 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#ce5dff]/15 border border-[#ce5dff]/30 text-[#ebb2ff] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-none text-xl font-bold tracking-tight text-white focus:outline-none w-full max-w-[320px] p-0 font-sans focus:border-b focus:border-[#74f5ff]/40"
            />
            <p className="text-[10px] text-[#b9cacb]/80 font-mono mt-1">
              DocNexus Document Compiler &amp; Visual Analytics Engine
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2.5 rounded font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
              saveSuccess 
                ? 'bg-[#1a2f21] text-[#00e476] border-[#00e476]/30' 
                : 'bg-[#ce5dff]/10 text-[#ebb2ff] border-[#ce5dff]/30 hover:bg-[#ce5dff]/25'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved Sync!' : 'Save SQLite'}
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2.5 rounded font-bold uppercase tracking-wider cursor-pointer border bg-[#1a2c31] text-[#74f5ff] border-[#00dbe7]/30 hover:bg-[#00dbe7]/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-[#00dbe7]" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Bento Layout Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow min-h-[500px] items-stretch">
        
        {/* Left Side: Smart TOC & Editor Pane (col-span-6) */}
        <div className="lg:col-span-6 glass-panel rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 flex overflow-hidden min-h-[400px]">
          
          {/* Smart TOC Column Sidebar */}
          <div className="w-44 bg-[#0c0c0e]/95 border-r border-[#3a494b]/10 flex flex-col p-3 shrink-0 select-none hidden sm:flex">
            <span className="font-mono text-[9px] text-[#849495] uppercase tracking-widest block mb-4 border-b border-[#3a494b]/15 pb-1">
              Smart TOC
            </span>
            <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-grow pr-1">
              {headings.length === 0 ? (
                <span className="text-[10px] text-gray-600 italic">No headings found.</span>
              ) : (
                headings.map((h, i) => (
                  <a
                    key={i}
                    href={`#${h.id}`}
                    style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                    className={`block font-sans text-[11px] font-light truncate transition-all leading-tight ${
                      h.level === 1 ? 'text-[#74f5ff] font-medium' : 'text-[#b9cacb]/80 hover:text-white'
                    }`}
                  >
                    {h.level > 1 && <span className="text-gray-600 mr-1">└</span>}
                    {h.text}
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Document Content Textarea */}
          <div className="flex-1 flex flex-col h-full bg-[#050505] relative">
            <div className="flex items-center px-4 py-2 border-b border-[#3a494b]/10 bg-[#201f21]/80 select-none justify-between font-mono text-[10px]">
              <span className="text-gray-400">DOCNEXUS SOURCE EDITOR</span>
              <span className="text-[#ebb2ff]">Markdown Mode</span>
            </div>
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Type Markdown or diagram files here..."
              className="flex-grow w-full p-4 bg-transparent font-mono text-xs text-white focus:outline-none focus:ring-0 resize-none min-h-[300px] custom-scrollbar leading-relaxed"
            />
          </div>

        </div>

        {/* Right Side: Compiled Conversions Sandbox (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col glass-panel rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 overflow-hidden min-h-[400px]">
          
          {/* Tabs Toggles */}
          <div className="flex border-b border-[#3a494b]/10 bg-[#201f21]/60 font-mono text-[10px] items-center px-2 select-none justify-between">
            <div className="flex gap-2">
              {(['PREVIEW', 'SEQUENCE', 'TOPOLOGY', 'GRID'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-3 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                    activeTab === tab 
                      ? 'text-[#74f5ff] border-[#00dbe7] bg-white/[0.02]' 
                      : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  {tab === 'PREVIEW' && <BookOpen className="w-3.5 h-3.5" />}
                  {tab === 'SEQUENCE' && <Activity className="w-3.5 h-3.5" />}
                  {tab === 'TOPOLOGY' && <Server className="w-3.5 h-3.5" />}
                  {tab === 'GRID' && <Grid className="w-3.5 h-3.5" />}
                  {tab}
                </button>
              ))}
            </div>
            <span className="text-[#00e476] flex items-center gap-1 shrink-0 px-2 font-mono text-[9px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fb83] animate-pulse"></span>
              Live Pipeline
            </span>
          </div>

          {/* Compiled Canvas Body */}
          <div className="flex-grow p-4 overflow-y-auto custom-scrollbar bg-[#131315]/20 flex flex-col">
            
            {/* TAB 1: Markdown + Alerts Preview */}
            {activeTab === 'PREVIEW' && (
              <div className="prose-custom flex-grow">
                {content.trim() === '' ? (
                  <div className="h-full flex items-center justify-center text-center text-gray-500 font-mono text-xs italic py-20">
                    Document is blank. Start typing on the left pane.
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />
                )}
              </div>
            )}

            {/* TAB 2: Smart Sequence Compiler */}
            {activeTab === 'SEQUENCE' && (
              <div className="flex-grow flex flex-col gap-4">
                <div className="p-3 bg-[#0e0e10]/80 rounded border border-[#3a494b]/20 flex items-center gap-2">
                  <Info className="text-[#00dbe7] w-4 h-4" />
                  <span className="font-sans text-[11px] text-[#b9cacb]">
                    Automatically parses sequential message formats: <code className="bg-[#201f21] px-1 py-0.5 rounded text-white font-mono text-[10px]">Actor1 -&gt; Actor2: Message</code>
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center py-20 text-gray-500 font-mono text-xs italic">
                    No matching sequence flows found. Wrap them inside a sequence block!
                  </div>
                ) : (
                  <div className="flex-grow glass-panel p-6 rounded-lg border border-[#3a494b]/15 bg-[#0e0e10]/40 overflow-x-auto relative flex flex-col items-center">
                    
                    {/* SVG Sequence diagram drawer */}
                    <div className="min-w-[450px] relative flex flex-col py-4">
                      {/* Actors Headers */}
                      <div className="flex justify-around mb-8 w-full gap-10">
                        {actors.map(actor => (
                          <div 
                            key={actor} 
                            className="px-4 py-2 rounded-lg bg-[#ce5dff]/15 border border-[#ce5dff]/30 text-white font-mono text-xs font-bold text-center w-28 truncate shadow-[0_0_10px_rgba(206,93,255,0.1)]"
                          >
                            {actor}
                          </div>
                        ))}
                      </div>

                      {/* Messages calls flow list */}
                      <div className="relative space-y-6 flex-grow">
                        {messages.map((msg, i) => {
                          const idxFrom = actors.indexOf(msg.from);
                          const idxTo = actors.indexOf(msg.to);
                          if (idxFrom === -1 || idxTo === -1) return null;

                          const unitWidth = 100 / (actors.length || 1);
                          const startPercent = idxFrom * unitWidth + (unitWidth / 2);
                          const endPercent = idxTo * unitWidth + (unitWidth / 2);
                          const isRightFlow = idxTo > idxFrom;
                          
                          const leftPos = Math.min(startPercent, endPercent);
                          const rightPos = Math.max(startPercent, endPercent);
                          const widthPercent = rightPos - leftPos;

                          return (
                            <div key={i} className="relative h-6 w-full font-mono text-[10px]">
                              
                              {/* Connector horizontal line arrow */}
                              <div 
                                style={{ left: `${leftPos}%`, width: `${widthPercent}%` }}
                                className="absolute top-1/2 border-t-2 border-dashed border-[#00dbe7]/60"
                              >
                                {/* Arrow marker depending on direction */}
                                <div 
                                  className={`absolute top-[-5px] border-t-[4px] border-b-[4px] border-transparent ${
                                    isRightFlow 
                                      ? 'right-0 border-l-[6px] border-l-[#00dbe7]' 
                                      : 'left-0 border-r-[6px] border-r-[#00dbe7]'
                                  }`}
                                ></div>
                              </div>

                              {/* Label text */}
                              <div 
                                style={{ left: `${leftPos}%`, width: `${widthPercent}%` }}
                                className="absolute top-[-12px] text-center text-white truncate px-1 font-semibold block text-[9px]"
                              >
                                {msg.text}
                              </div>

                            </div>
                          );
                        })}
                      </div>

                      {/* Actors Lifelines dashed bounds behind flows */}
                      <div className="absolute inset-0 flex justify-around pointer-events-none z-[-1] py-4 gap-10">
                        {actors.map(actor => (
                          <div 
                            key={actor} 
                            className="w-28 flex justify-center h-full"
                          >
                            <div className="h-full border-l-2 border-dashed border-[#ce5dff]/15"></div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Network Topology Visualizer */}
            {activeTab === 'TOPOLOGY' && (
              <div className="flex-grow flex flex-col gap-4">
                <div className="p-3 bg-[#0e0e10]/80 rounded border border-[#3a494b]/20 flex items-center gap-2">
                  <Server className="text-[#ce5dff] w-4 h-4" />
                  <span className="font-sans text-[11px] text-[#b9cacb]">
                    Recognizes network layout coordinate files: <code className="bg-[#201f21] px-1 py-0.5 rounded text-white font-mono text-[10px]">[Node1] === [Node2]</code>
                  </span>
                </div>

                {topologyNodes.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center py-20 text-gray-500 font-mono text-xs italic">
                    No network nodes recognized. Specify structural nodes in raw panels.
                  </div>
                ) : (
                  <div className="flex-grow glass-panel rounded-lg border border-[#3a494b]/15 bg-[#0e0e10]/40 overflow-hidden relative min-h-[300px] p-6 flex flex-col">
                    
                    {/* SVG lines layer drawing connections */}
                    <div className="w-full flex-grow relative min-h-[250px] chart-grid rounded overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {topologyConnections.map((conn, idx) => {
                          const idxFrom = topologyNodes.indexOf(conn.from);
                          const idxTo = topologyNodes.indexOf(conn.to);
                          if (idxFrom === -1 || idxTo === -1) return null;

                          // calculate dynamic circle points
                          const fromX = 50 + (idxFrom % 3) * 150;
                          const fromY = 60 + Math.floor(idxFrom / 3) * 110;
                          
                          const toX = 50 + (idxTo % 3) * 150;
                          const toY = 60 + Math.floor(idxTo / 3) * 110;

                          return (
                            <line 
                              key={idx}
                              x1={fromX}
                              y1={fromY}
                              x2={toX}
                              y2={toY}
                              stroke={conn.type === '===' ? '#00e476' : '#74f5ff'}
                              strokeWidth={conn.type === '===' ? '3.5' : '1.5'}
                              opacity="0.6"
                              className="drop-shadow-[0_0_4px_rgba(0,228,118,0.5)]"
                            />
                          );
                        })}
                      </svg>

                      {/* Draggable/Interactive Nodes drawer */}
                      {topologyNodes.map((node, i) => {
                        const posX = 50 + (i % 3) * 150;
                        const posY = 60 + Math.floor(i / 3) * 110;

                        return (
                          <div 
                            key={node}
                            style={{ left: `${posX - 40}px`, top: `${posY - 35}px` }}
                            className="absolute w-20 p-2 rounded-lg border border-[#00dbe7]/30 bg-[#131315] hover:border-[#74f5ff]/70 flex flex-col items-center justify-center text-center shadow-[0_0_12px_rgba(0,219,231,0.15)] transition-all select-none hover:scale-105"
                          >
                            <span className="material-symbols-outlined text-[#74f5ff] text-base mb-1 select-none">dns</span>
                            <span className="font-mono text-[9px] text-[#e5e1e4] font-bold block truncate w-full">{node}</span>
                          </div>
                        );
                      })}

                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Sortable High-Density Table Grid */}
            {activeTab === 'GRID' && (
              <div className="flex-grow flex flex-col gap-4">
                <div className="p-3 bg-[#0e0e10]/80 rounded border border-[#3a494b]/20 flex items-center gap-2">
                  <Grid className="text-[#00e476] w-4 h-4" />
                  <span className="font-sans text-[11px] text-[#b9cacb]">
                    Sortable grid parsed from standard Markdown table schemas. Click columns headers to sort.
                  </span>
                </div>

                {parsedTable.headers.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center py-20 text-gray-500 font-mono text-xs italic">
                    No table found. Type standard Markdown tables on the left pane.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto rounded border border-[#3a494b]/15 bg-[#0e0e10]/40">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead className="bg-[#0c0c0e] text-[#849495] select-none text-[10px] uppercase">
                        <tr>
                          {parsedTable.headers.map((hdr, i) => {
                            const isSorted = sortConfig?.key === i;
                            return (
                              <th 
                                key={i} 
                                onClick={() => handleSort(i)}
                                className="p-3 cursor-pointer hover:text-white transition-colors border-b border-[#3a494b]/20 select-none font-bold"
                              >
                                <span className="flex items-center gap-1">
                                  {hdr}
                                  {isSorted && (
                                    <span className="text-[#74f5ff] text-[8px]">
                                      {sortConfig?.direction === 'asc' ? '▲' : '▼'}
                                    </span>
                                  )}
                                </span>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3a494b]/10">
                        {parsedTable.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-white/[0.02] transition-all text-[#e5e1e4]">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3 select-all leading-normal">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
