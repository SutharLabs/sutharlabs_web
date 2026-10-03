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
import CollapsibleLogDrawer from './CollapsibleLogDrawer';

interface DocNexusViewProps {
  logs?: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
  theme?: 'light' | 'dark';
}

export default function DocNexusView({ logs = [], onAddLog, userToken, theme = 'dark' }: DocNexusViewProps) {
  const isLight = theme === 'light';
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
    html = html.replace(/^# (.*$)/gim, `<h1 class="text-2xl font-bold font-sans ${isLight ? 'text-slate-900' : 'text-white'} mt-4 first:mt-0 mb-3">$1</h1>`);
    html = html.replace(/^## (.*$)/gim, `<h2 class="text-lg font-bold font-sans ${isLight ? 'text-sky-700' : 'text-[#74f5ff]'} mt-5 mb-2">$1</h2>`);
    html = html.replace(/^### (.*$)/gim, `<h3 class="text-base font-bold font-sans ${isLight ? 'text-purple-700' : 'text-[#ce5dff]'} mt-4 mb-2">$1</h3>`);

    // Blockquotes & GitHub callouts mapping
    // Convert GitHub alert boxes
    html = html.replace(/^\s*&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/gim, (match, type, content) => {
      let colorClass = isLight 
        ? 'border-sky-500 bg-sky-50/80 text-sky-900' 
        : 'border-[#74f5ff] bg-[#00dbe7]/5 text-[#74f5ff]';
      if (type === 'WARNING' || type === 'CAUTION') {
        colorClass = isLight 
          ? 'border-rose-500 bg-rose-50/80 text-rose-900' 
          : 'border-[#ffb4ab] bg-red-950/10 text-[#ffb4ab]';
      }
      if (type === 'IMPORTANT' || type === 'TIP') {
        colorClass = isLight 
          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900' 
          : 'border-[#00e476] bg-[#00fb83]/5 text-[#00e476]';
      }
      
      return `<div class="border-l-4 p-4.5 my-4 rounded-r glass-panel ${colorClass}">
        <strong class="font-mono text-xs uppercase tracking-wider block mb-1 flex items-center gap-1.5 leading-none">
          <span class="material-symbols-outlined text-sm leading-none">info</span> ${type}
        </strong>
        <span class="text-sm font-sans font-light leading-relaxed">${content}</span>
      </div>`;
    });

    // Standard blockquote fallback
    html = html.replace(/^\s*&gt;\s+(.*$)/gim, `<blockquote class="border-l-4 ${isLight ? 'border-slate-300 bg-slate-50 text-slate-700' : 'border-gray-600 bg-white/[0.02] text-[#b9cacb]'} pl-3 py-1 my-3 rounded-r font-sans italic text-sm">$1</blockquote>`);

    // Code Blocks (fenced)
    html = html.replace(/```([\s\S]*?)```/gim, `<pre class="${isLight ? 'bg-slate-100 border border-slate-200 text-slate-800' : 'bg-surface-container-low/90 border border-outline/20 text-[#ebb2ff]'} rounded-lg p-3.5 my-4 font-mono text-xs overflow-x-auto">$1</pre>`);

    // Inline Code
    html = html.replace(/`([^`]+)`/g, `<code class="${isLight ? 'bg-slate-100 border border-slate-200 text-purple-700 font-semibold' : 'bg-[#2a2a2c]/60 border border-outline/25 text-[#74f5ff]'} px-1 py-0.5 rounded font-mono text-xs">$1</code>`);

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, `<strong class="font-bold ${isLight ? 'text-slate-900' : 'text-white'}">$1</strong>`);

    // Bullet list items
    html = html.replace(/^[-*+]\s+(.*$)/gim, '<li class="ml-4 list-disc pl-1 mb-1 font-light">$1</li>');
    html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, `<ul class="my-3 text-sm ${isLight ? 'text-slate-700' : 'text-[#b9cacb]'}">$1</ul>`);

    // Paragraph wrappers
    const paragraphs = html.split(/\n\n+/);
    const parsedParagraphs = paragraphs.map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li') || trimmed.startsWith('<div')) {
        return p;
      }
      return `<p class="text-sm ${isLight ? 'text-slate-700' : 'text-[#b9cacb]'} leading-relaxed my-3 font-light">${p}</p>`;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline/20 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg flex items-center justify-center ${
            isLight 
              ? 'bg-purple-100 border border-purple-200 text-purple-700 shadow-sm' 
              : 'bg-[#ce5dff]/15 border border-[#ce5dff]/30 text-[#ebb2ff]'
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`bg-transparent border-none text-xl font-bold tracking-tight focus:outline-none w-full max-w-[320px] p-0 font-sans focus:border-b ${
                isLight 
                  ? 'text-slate-900 focus:border-purple-500' 
                  : 'text-white focus:border-[#74f5ff]/40'
              }`}
            />
            <p className="text-[10px] text-on-surface-variant font-mono mt-1">
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
                ? isLight 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm' 
                  : 'bg-[#1a2f21] text-[#00e476] border-[#00e476]/30' 
                : isLight 
                  ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100 shadow-sm' 
                  : 'bg-[#ce5dff]/10 text-[#ebb2ff] border-[#ce5dff]/30 hover:bg-[#ce5dff]/25'
            }`}
          >
            <Save className={`w-4 h-4 shrink-0 ${isLight ? (saveSuccess ? 'text-emerald-700' : 'text-purple-700') : (saveSuccess ? 'text-[#00e476]' : 'text-[#ebb2ff]')}`} />
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved Sync!' : 'Save SQLite'}
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            className={`px-4 py-2.5 rounded font-bold uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-2 ${
              isLight 
                ? 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 shadow-sm' 
                : 'bg-[#1a2c31] text-[#74f5ff] border-[#00dbe7]/30 hover:bg-[#00dbe7]/20'
            }`}
          >
            <Download className={`w-4 h-4 shrink-0 ${isLight ? 'text-sky-700' : 'text-[#00dbe7]'}`} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Bento Layout Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow min-h-[500px] items-stretch">
        
        {/* Left Side: Smart TOC & Editor Pane (col-span-6) */}
        <div className="lg:col-span-6 glass-panel rounded-xl border border-outline/15 bg-surface-container-low/40 flex overflow-hidden min-h-[400px]">
          
          {/* Smart TOC Column Sidebar */}
          <div className={`w-44 border-r flex flex-col p-3 shrink-0 select-none hidden sm:flex ${
            isLight 
              ? 'bg-slate-50/90 border-slate-200' 
              : 'bg-[#0c0c0e]/95 border-outline/10'
          }`}>
            <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest block mb-4 border-b border-outline/15 pb-1">
              Smart TOC
            </span>
            <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-grow pr-1">
              {headings.length === 0 ? (
                <span className="text-[10px] text-on-surface-variant italic">No headings found.</span>
              ) : (
                headings.map((h, i) => (
                  <a
                    key={i}
                    href={`#${h.id}`}
                    style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                    className={`block font-sans text-[11px] truncate transition-all leading-tight ${
                      h.level === 1 
                        ? isLight ? 'text-sky-700 font-semibold' : 'text-[#74f5ff] font-medium'
                        : isLight ? 'text-slate-600 hover:text-slate-900 font-normal' : 'text-[#b9cacb]/80 hover:text-white font-light'
                    }`}
                  >
                    {h.level > 1 && <span className={`${isLight ? 'text-slate-400' : 'text-gray-600'} mr-1`}>└</span>}
                    {h.text}
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Document Content Textarea */}
          <div className={`flex-1 flex flex-col h-full relative ${
            isLight ? 'bg-white' : 'bg-[#050505]'
          }`}>
            <div className={`flex items-center px-4 py-2 border-b select-none justify-between font-mono text-[10px] ${
              isLight 
                ? 'bg-slate-100/90 border-slate-200' 
                : 'bg-[#201f21]/80 border-outline/10'
            }`}>
              <span className={isLight ? 'text-slate-600 font-semibold' : 'text-on-surface-variant'}>DOCNEXUS SOURCE EDITOR</span>
              <span className={isLight ? 'text-purple-700 font-bold' : 'text-[#ebb2ff]'}>Markdown Mode</span>
            </div>
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Type Markdown or diagram files here..."
              className={`flex-grow w-full p-4 bg-transparent font-mono text-xs focus:outline-none focus:ring-0 resize-none min-h-[300px] custom-scrollbar leading-relaxed ${
                isLight ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-gray-600'
              }`}
            />
          </div>

        </div>

        {/* Right Side: Compiled Conversions Sandbox (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col glass-panel rounded-xl border border-outline/15 bg-surface-container-low/40 overflow-hidden min-h-[400px]">
          
          {/* Tabs Toggles */}
          <div className={`flex border-b font-mono text-[10px] items-center px-2 select-none justify-between ${
            isLight 
              ? 'bg-slate-100/90 border-slate-200' 
              : 'bg-[#201f21]/60 border-outline/10'
          }`}>
            <div className="flex gap-2">
              {(['PREVIEW', 'SEQUENCE', 'TOPOLOGY', 'GRID'] as const).map(tab => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-3 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 font-bold ${
                      isActive 
                        ? isLight 
                          ? 'text-sky-700 border-sky-600 bg-white shadow-xs' 
                          : 'text-[#74f5ff] border-[#00dbe7] bg-white/[0.02]' 
                        : isLight 
                          ? 'text-slate-500 border-transparent hover:text-slate-800' 
                          : 'text-on-surface-variant border-transparent hover:text-white'
                    }`}
                  >
                    {tab === 'PREVIEW' && <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isActive ? (isLight ? 'text-sky-700' : 'text-[#74f5ff]') : (isLight ? 'text-slate-400' : 'text-on-surface-variant')}`} />}
                    {tab === 'SEQUENCE' && <Activity className={`w-3.5 h-3.5 shrink-0 ${isActive ? (isLight ? 'text-sky-700' : 'text-[#74f5ff]') : (isLight ? 'text-slate-400' : 'text-on-surface-variant')}`} />}
                    {tab === 'TOPOLOGY' && <Server className={`w-3.5 h-3.5 shrink-0 ${isActive ? (isLight ? 'text-sky-700' : 'text-[#74f5ff]') : (isLight ? 'text-slate-400' : 'text-on-surface-variant')}`} />}
                    {tab === 'GRID' && <Grid className={`w-3.5 h-3.5 shrink-0 ${isActive ? (isLight ? 'text-sky-700' : 'text-[#74f5ff]') : (isLight ? 'text-slate-400' : 'text-on-surface-variant')}`} />}
                    {tab}
                  </button>
                );
              })}
            </div>
            <span className={`flex items-center gap-1 shrink-0 px-2 font-mono text-[9px] font-semibold ${
              isLight ? 'text-emerald-700' : 'text-[#00e476]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLight ? 'bg-emerald-500' : 'bg-[#00fb83]'}`}></span>
              Live Pipeline
            </span>
          </div>

          {/* Compiled Canvas Body */}
          <div className="flex-grow p-4 overflow-y-auto custom-scrollbar bg-surface-container-low/20 flex flex-col">
            
            {/* TAB 1: Markdown + Alerts Preview */}
            {activeTab === 'PREVIEW' && (
              <div className="prose-custom flex-grow">
                {content.trim() === '' ? (
                  <div className="h-full flex items-center justify-center text-center text-on-surface-variant font-mono text-xs italic py-20">
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
                <div className={`p-3 rounded border flex items-center gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0e0e10]/80 border-outline/20 text-[#b9cacb]'
                }`}>
                  <Info className={`w-4 h-4 shrink-0 ${isLight ? 'text-sky-600' : 'text-[#00dbe7]'}`} />
                  <span className="font-sans text-[11px]">
                    Automatically parses sequential message formats: <code className={`px-1 py-0.5 rounded font-mono text-[10px] ${
                      isLight ? 'bg-slate-200 text-slate-800' : 'bg-[#201f21] text-white'
                    }`}>Actor1 -&gt; Actor2: Message</code>
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center py-20 text-on-surface-variant font-mono text-xs italic">
                    No matching sequence flows found. Wrap them inside a sequence block!
                  </div>
                ) : (
                  <div className={`flex-grow glass-panel p-4 sm:p-6 rounded-lg border overflow-x-auto relative flex flex-col items-center ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10]/40 border-outline/15'
                  }`}>
                    
                    {/* SVG Sequence diagram drawer */}
                    <div className="min-w-[450px] relative flex flex-col py-4">
                      {/* Actors Headers */}
                      <div className="flex justify-around mb-8 w-full gap-6 sm:gap-10">
                        {actors.map(actor => (
                          <div 
                            key={actor} 
                            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold text-center w-28 truncate border ${
                              isLight 
                                ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-sm' 
                                : 'bg-[#ce5dff]/15 border-[#ce5dff]/30 text-white shadow-[0_0_10px_rgba(206,93,255,0.1)]'
                            }`}
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
                                className={`absolute top-1/2 border-t-2 border-dashed ${isLight ? 'border-sky-500' : 'border-[#00dbe7]/60'}`}
                              >
                                {/* Arrow marker depending on direction */}
                                <div 
                                  className={`absolute top-[-5px] border-t-[4px] border-b-[4px] border-transparent ${
                                    isRightFlow 
                                      ? `right-0 border-l-[6px] ${isLight ? 'border-l-sky-600' : 'border-l-[#00dbe7]'}` 
                                      : `left-0 border-r-[6px] ${isLight ? 'border-r-sky-600' : 'border-r-[#00dbe7]'}`
                                  }`}
                                ></div>
                              </div>

                              {/* Label text */}
                              <div 
                                style={{ left: `${leftPos}%`, width: `${widthPercent}%` }}
                                className={`absolute top-[-12px] text-center truncate px-1 font-semibold block text-[9px] ${
                                  isLight ? 'text-slate-800' : 'text-white'
                                }`}
                              >
                                {msg.text}
                              </div>

                            </div>
                          );
                        })}
                      </div>

                      {/* Actors Lifelines dashed bounds behind flows */}
                      <div className="absolute inset-0 flex justify-around pointer-events-none z-[-1] py-4 gap-6 sm:gap-10">
                        {actors.map(actor => (
                          <div 
                            key={actor} 
                            className="w-28 flex justify-center h-full"
                          >
                            <div className={`h-full border-l-2 border-dashed ${isLight ? 'border-purple-200' : 'border-[#ce5dff]/15'}`}></div>
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
                <div className={`p-3 rounded border flex items-center gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0e0e10]/80 border-outline/20 text-[#b9cacb]'
                }`}>
                  <Server className={`w-4 h-4 shrink-0 ${isLight ? 'text-purple-600' : 'text-[#ce5dff]'}`} />
                  <span className="font-sans text-[11px]">
                    Recognizes network layout coordinate files: <code className={`px-1 py-0.5 rounded font-mono text-[10px] ${
                      isLight ? 'bg-slate-200 text-slate-800' : 'bg-[#201f21] text-white'
                    }`}>[Node1] === [Node2]</code>
                  </span>
                </div>

                {topologyNodes.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center py-20 text-on-surface-variant font-mono text-xs italic">
                    No network nodes recognized. Specify structural nodes in raw panels.
                  </div>
                ) : (
                  <div className={`flex-grow glass-panel rounded-lg border overflow-hidden relative min-h-[300px] p-4 sm:p-6 flex flex-col ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10]/40 border-outline/15'
                  }`}>
                    
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
                              stroke={conn.type === '===' ? (isLight ? '#059669' : '#00e476') : (isLight ? '#0284c7' : '#74f5ff')}
                              strokeWidth={conn.type === '===' ? '3.5' : '1.5'}
                              opacity={isLight ? '0.8' : '0.6'}
                              className={isLight ? '' : 'drop-shadow-[0_0_4px_rgba(0,228,118,0.5)]'}
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
                            className={`absolute w-20 p-2 rounded-lg border flex flex-col items-center justify-center text-center transition-all select-none hover:scale-105 ${
                              isLight 
                                ? 'bg-white border-sky-300 shadow-md hover:border-sky-500' 
                                : 'bg-surface-container-low border-[#00dbe7]/30 hover:border-[#74f5ff]/70 shadow-[0_0_12px_rgba(0,219,231,0.15)]'
                            }`}
                          >
                            <span className={`material-symbols-outlined text-base mb-1 select-none ${isLight ? 'text-sky-600' : 'text-[#74f5ff]'}`}>dns</span>
                            <span className="font-mono text-[9px] text-on-surface font-bold block truncate w-full">{node}</span>
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
                <div className={`p-3 rounded border flex items-center gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0e0e10]/80 border-outline/20 text-[#b9cacb]'
                }`}>
                  <Grid className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-[#00e476]'}`} />
                  <span className="font-sans text-[11px]">
                    Sortable grid parsed from standard Markdown table schemas. Click columns headers to sort.
                  </span>
                </div>

                {parsedTable.headers.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center py-20 text-on-surface-variant font-mono text-xs italic">
                    No table found. Type standard Markdown tables on the left pane.
                  </div>
                ) : (
                  <div className={`w-full overflow-x-auto rounded border ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10]/40 border-outline/15'
                  }`}>
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead className={`select-none text-[10px] uppercase ${
                        isLight ? 'bg-slate-50 text-slate-700 border-b border-slate-200' : 'bg-[#0c0c0e] text-on-surface-variant'
                      }`}>
                        <tr>
                          {parsedTable.headers.map((hdr, i) => {
                            const isSorted = sortConfig?.key === i;
                            return (
                              <th 
                                key={i} 
                                onClick={() => handleSort(i)}
                                className={`p-3 cursor-pointer transition-colors border-b border-outline/20 select-none font-bold ${
                                  isLight ? 'hover:text-slate-900' : 'hover:text-white'
                                }`}
                              >
                                <span className="flex items-center gap-1">
                                  {hdr}
                                  {isSorted && (
                                    <span className={isLight ? 'text-sky-600 text-[8px]' : 'text-[#74f5ff] text-[8px]'}>
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
                          <tr key={rIdx} className={`transition-all text-on-surface ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'}`}>
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

      <CollapsibleLogDrawer
        title="DOCNEXUS WORKSPACE AUDIT LOG"
        logs={logs}
        defaultExpanded={false}
      />
    </div>
  );
}
