import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Activity, 
  Server, 
  Grid, 
  Info, 
  Copy, 
  Check, 
  Heading1, 
  Heading2, 
  Bold, 
  Code, 
  AlertCircle,
  Plus,
  Columns,
  Eye,
  Edit3
} from 'lucide-react';
import SlashCommandMenu from './SlashCommandMenu.js';

interface MarkdownStudioProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  theme?: 'dark' | 'light';
}

export default function MarkdownStudio({
  content,
  onChangeContent,
  theme = 'dark'
}: MarkdownStudioProps) {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'SEQUENCE' | 'TOPOLOGY' | 'GRID'>('PREVIEW');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);

  // Custom parsers output states
  const [actors, setActors] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ from: string; to: string; text: string }[]>([]);
  const [topologyNodes, setTopologyNodes] = useState<string[]>([]);
  const [topologyConnections, setTopologyConnections] = useState<{ from: string; to: string; type: string }[]>([]);
  const [parsedTable, setParsedTable] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);
  const [headings, setHeadings] = useState<{ text: string; id: string; level: number }[]>([]);

  // Word count & reading time
  const wordCount = React.useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Synchronize dynamic conversions and TOC on markdown change
  useEffect(() => {
    const lines = content.split('\n');
    const extractedHeadings: { text: string; id: string; level: number }[] = [];
    const extractedActors = new Set<string>();
    const extractedMessages: { from: string; to: string; text: string }[] = [];
    let insideSequenceBlock = false;

    const extractedNodes = new Set<string>();
    const extractedConnections: { from: string; to: string; type: string }[] = [];
    let insideTopologyBlock = false;

    const tableRows: string[][] = [];

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
        const isSeparator = columns.every(col => col.match(/^:?-+:?$/));
        if (isSeparator) return;
        tableRows.push(columns);
      }
    });

    setHeadings(extractedHeadings);
    setActors(Array.from(extractedActors));
    setMessages(extractedMessages);
    setTopologyNodes(Array.from(extractedNodes));
    setTopologyConnections(extractedConnections);

    if (tableRows.length > 1) {
      setParsedTable({
        headers: tableRows[0],
        rows: tableRows.slice(1)
      });
    } else {
      setParsedTable({ headers: [], rows: [] });
    }
  }, [content]);

  // Insert snippets into textarea
  const insertSnippet = (snippet: string) => {
    onChangeContent(content + '\n\n' + snippet);
  };

  const parseMarkdownToHtml = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^# (.*$)/gim, `<h1 class="text-2xl font-bold font-sans ${isLight ? 'text-slate-900' : 'text-white'} mt-4 first:mt-0 mb-3">$1</h1>`);
    html = html.replace(/^## (.*$)/gim, `<h2 class="text-lg font-bold font-sans ${isLight ? 'text-sky-700' : 'text-[#74f5ff]'} mt-5 mb-2">$1</h2>`);
    html = html.replace(/^### (.*$)/gim, `<h3 class="text-base font-bold font-sans ${isLight ? 'text-purple-700' : 'text-[#ce5dff]'} mt-4 mb-2">$1</h3>`);

    // Callouts / Alerts
    html = html.replace(/^\s*&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/gim, (_, type, c) => {
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
      return `<div class="border-l-4 p-4 my-3 rounded-r ${colorClass}">
        <strong class="font-mono text-xs uppercase tracking-wider block mb-1">
          ${type}
        </strong>
        <span class="text-sm font-sans font-light leading-relaxed">${c}</span>
      </div>`;
    });

    // Blockquotes
    html = html.replace(/^\s*&gt;\s+(.*$)/gim, `<blockquote class="border-l-4 ${isLight ? 'border-slate-300 bg-slate-50 text-slate-700' : 'border-gray-600 bg-white/[0.02] text-[#b9cacb]'} pl-3 py-1 my-3 rounded-r font-sans italic text-sm">$1</blockquote>`);

    // Code Blocks
    html = html.replace(/```([\s\S]*?)```/gim, `<pre class="${isLight ? 'bg-slate-100 border border-slate-200 text-slate-800' : 'bg-surface-container-low/90 border border-outline/20 text-[#ebb2ff]'} rounded-lg p-3.5 my-4 font-mono text-xs overflow-x-auto relative">$1</pre>`);

    // Inline Code
    html = html.replace(/`([^`]+)`/g, `<code class="${isLight ? 'bg-slate-100 border border-slate-200 text-purple-700 font-semibold' : 'bg-[#2a2a2c]/60 border border-outline/25 text-[#74f5ff]'} px-1 py-0.5 rounded font-mono text-xs">$1</code>`);

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, `<strong class="font-bold ${isLight ? 'text-slate-900' : 'text-white'}">$1</strong>`);

    // Lists
    html = html.replace(/^[-*+]\s+(.*$)/gim, '<li class="ml-4 list-disc pl-1 mb-1 font-light">$1</li>');
    html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, `<ul class="my-3 text-sm ${isLight ? 'text-slate-700' : 'text-[#b9cacb]'}">$1</ul>`);

    // Paragraphs
    const paragraphs = html.split(/\n\n+/);
    return paragraphs.map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li') || trimmed.startsWith('<div')) {
        return p;
      }
      return `<p class="text-sm ${isLight ? 'text-slate-700' : 'text-[#b9cacb]'} leading-relaxed my-3 font-light">${p}</p>`;
    }).join('\n');
  };

  const parsedHtml = parseMarkdownToHtml(content);

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
    <div className="flex flex-col flex-grow h-full overflow-hidden p-3 gap-2">
      {/* Top Ergonomics Ribbon (Outline & Affine Standard) */}
      <div className="flex items-center justify-between px-2 font-mono text-[11px] text-on-surface-variant shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#00dbe7] font-semibold">{wordCount} words</span>
          <span>•</span>
          <span>{readingTime} min read</span>
          <span>•</span>
          <span className="text-[#00e476]">Local Sync Ready</span>
        </div>

        {/* View Mode Switcher: Split / Editor / Preview */}
        <div className={`flex items-center gap-1 rounded-lg p-0.5 border ${
          isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-surface-container-low border-outline/15'
        }`}>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'split' 
                ? isLight ? 'bg-sky-600 text-white shadow-xs' : 'bg-[#00dbe7]/20 text-[#74f5ff]' 
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Columns className="w-3 h-3" />
            Split
          </button>
          <button
            onClick={() => setViewMode('editor')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'editor' 
                ? isLight ? 'bg-purple-600 text-white shadow-xs' : 'bg-[#ce5dff]/20 text-[#ebb2ff]' 
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            Write
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'preview' 
                ? isLight ? 'bg-emerald-600 text-white shadow-xs' : 'bg-[#00e476]/20 text-[#00e476]' 
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" />
            Read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-grow h-full items-stretch overflow-hidden">
        {/* Left: Smart TOC + Markdown Editor */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className={`${viewMode === 'editor' ? 'lg:col-span-12' : 'lg:col-span-6'} rounded-xl border flex overflow-hidden min-h-[400px] ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#08080a] border-outline/15'
          }`}>
            {/* TOC Sidebar */}
            <div className={`w-40 border-r flex flex-col p-3 shrink-0 select-none hidden md:flex ${
              isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#0c0c0e]/95 border-outline/10'
            }`}>
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest block mb-4 border-b border-outline/15 pb-1">
                Document TOC
              </span>
              <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-grow pr-1">
                {headings.length === 0 ? (
                  <span className="text-[10px] text-on-surface-variant italic">No headings found.</span>
                ) : (
                  headings.map((h, i) => (
                    <div
                      key={i}
                      style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                      className={`font-sans text-[11px] truncate leading-tight cursor-default ${
                        h.level === 1 
                          ? isLight ? 'text-sky-700 font-semibold' : 'text-[#74f5ff] font-medium'
                          : isLight ? 'text-slate-600' : 'text-[#b9cacb]/80'
                      }`}
                    >
                      {h.level > 1 && <span className="opacity-40 mr-1">└</span>}
                      {h.text}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Textarea Editor */}
            <div className="flex-1 flex flex-col h-full relative">
              {/* Quick Formatting Toolbar */}
              <div className={`flex items-center px-3 py-1.5 border-b select-none justify-between font-mono text-[10px] ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#141418] border-outline/10'
              }`}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsSlashMenuOpen(true)}
                    className="px-2 py-1 rounded bg-[#00dbe7]/15 text-[#74f5ff] hover:bg-[#00dbe7]/25 font-bold flex items-center gap-1 mr-1 cursor-pointer"
                    title="Insert Block (/)"
                  >
                    <Plus className="w-3 h-3" />
                    Insert Block (/)
                  </button>
                  <button
                    onClick={() => insertSnippet('# New Heading 1')}
                    className={`p-1 rounded cursor-pointer ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-white'}`}
                    title="Heading 1"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => insertSnippet('## New Heading 2')}
                    className={`p-1 rounded cursor-pointer ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-white'}`}
                    title="Heading 2"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => insertSnippet('**Bold Text**')}
                    className={`p-1 rounded cursor-pointer ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-white'}`}
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => insertSnippet('```typescript\nconst greeting = "Hello SutharLabs";\n```')}
                    className={`p-1 rounded cursor-pointer ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-white'}`}
                    title="Code Block"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => insertSnippet('> [!NOTE]\n> Enter critical technical callout message here.')}
                    className={`p-1 rounded cursor-pointer ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-white'}`}
                    title="Callout Box"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-[#00dbe7]" />
                  </button>
                </div>
                <span className="text-[#00e476] font-bold">Affine/Outline Mode</span>
              </div>

              <textarea
                value={content}
                onChange={e => onChangeContent(e.target.value)}
                placeholder="# Enter Markdown or diagrams... (Press / for slash command menu)"
                className={`flex-grow w-full p-4 bg-transparent font-mono text-xs focus:outline-none focus:ring-0 resize-none min-h-[300px] custom-scrollbar leading-relaxed ${
                  isLight ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-gray-600'
                }`}
              />
            </div>
          </div>
        )}

        {/* Right: Compiled Conversions Sandbox */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`${viewMode === 'preview' ? 'lg:col-span-12' : 'lg:col-span-6'} flex flex-col rounded-xl border overflow-hidden min-h-[400px] ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#08080a] border-outline/15'
          }`}>
            {/* Sandbox Tabs */}
            <div className={`flex border-b font-mono text-[10px] items-center px-2 select-none justify-between ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#141418] border-outline/10'
            }`}>
              <div className="flex gap-1">
                {(['PREVIEW', 'SEQUENCE', 'TOPOLOGY', 'GRID'] as const).map(tab => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-3 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 font-bold ${
                        isActive 
                          ? isLight 
                            ? 'text-sky-700 border-sky-600 bg-white shadow-xs' 
                            : 'text-[#74f5ff] border-[#00dbe7] bg-white/[0.02]' 
                          : isLight 
                            ? 'text-slate-500 border-transparent hover:text-slate-800' 
                            : 'text-on-surface-variant border-transparent hover:text-white'
                      }`}
                    >
                      {tab === 'PREVIEW' && <BookOpen className="w-3.5 h-3.5" />}
                      {tab === 'SEQUENCE' && <Activity className="w-3.5 h-3.5" />}
                      {tab === 'TOPOLOGY' && <Server className="w-3.5 h-3.5" />}
                      {tab === 'GRID' && <Grid className="w-3.5 h-3.5" />}
                      {tab}
                    </button>
                  );
                })}
              </div>
              <span className="text-[#00e476] flex items-center gap-1 font-semibold text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00fb83] animate-pulse"></span>
                Live Pipeline
              </span>
            </div>

            {/* Sandbox Body */}
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
              {activeTab === 'PREVIEW' && (
                <div className="prose-custom">
                  {content.trim() === '' ? (
                    <div className="text-center text-on-surface-variant font-mono text-xs italic py-20">
                      Document is empty. Enter markdown on the left pane.
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />
                  )}
                </div>
              )}

              {activeTab === 'SEQUENCE' && (
                <div className="flex flex-col gap-4">
                  <div className={`p-2.5 rounded border flex items-center gap-2 text-[11px] ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#121216] border-outline/20 text-[#b9cacb]'
                  }`}>
                    <Info className="w-4 h-4 text-[#00dbe7] shrink-0" />
                    <span>Format: <code>Actor1 -&gt; Actor2: Message</code> inside a <code>```sequence</code> block</span>
                  </div>

                  {messages.length === 0 ? (
                    <div className="text-center py-20 text-on-surface-variant font-mono text-xs italic">
                      No sequence flows detected in document.
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border border-outline/15 overflow-x-auto min-w-[400px]">
                      <div className="flex justify-around mb-8 w-full gap-6">
                        {actors.map(actor => (
                          <div key={actor} className="px-3 py-1.5 rounded font-mono text-xs font-bold text-center w-28 truncate border bg-[#ce5dff]/15 border-[#ce5dff]/40 text-[#ebb2ff]">
                            {actor}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-6">
                        {messages.map((msg, i) => {
                          const idxFrom = actors.indexOf(msg.from);
                          const idxTo = actors.indexOf(msg.to);
                          if (idxFrom === -1 || idxTo === -1) return null;

                          const unitWidth = 100 / (actors.length || 1);
                          const startPercent = idxFrom * unitWidth + (unitWidth / 2);
                          const endPercent = idxTo * unitWidth + (unitWidth / 2);
                          const leftPos = Math.min(startPercent, endPercent);
                          const widthPercent = Math.abs(endPercent - startPercent);

                          return (
                            <div key={i} className="relative h-6 w-full font-mono text-[10px]">
                              <div 
                                style={{ left: `${leftPos}%`, width: `${widthPercent}%` }}
                                className="absolute top-1/2 border-t-2 border-dashed border-[#00dbe7]/60"
                              />
                              <div 
                                style={{ left: `${leftPos}%`, width: `${widthPercent}%` }}
                                className={`absolute top-[-10px] text-center truncate px-1 font-semibold text-[9px] ${
                                  isLight ? 'text-slate-900 bg-white/90 rounded' : 'text-white'
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'TOPOLOGY' && (
                <div className="flex flex-col gap-4">
                  <div className={`p-2.5 rounded border flex items-center gap-2 text-[11px] ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#121216] border-outline/20 text-[#b9cacb]'
                  }`}>
                    <Server className="w-4 h-4 text-[#ce5dff] shrink-0" />
                    <span>Format: <code>[Node1] === [Node2]</code> inside a <code>```topology</code> block</span>
                  </div>

                  {topologyNodes.length === 0 ? (
                    <div className="text-center py-20 text-on-surface-variant font-mono text-xs italic">
                      No topology nodes detected in document.
                    </div>
                  ) : (
                    <div className={`rounded-lg border min-h-[250px] p-6 relative ${
                      isLight ? 'border-slate-200 bg-slate-50/50' : 'border-outline/15 bg-transparent'
                    }`}>
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {topologyConnections.map((conn, idx) => {
                          const idxFrom = topologyNodes.indexOf(conn.from);
                          const idxTo = topologyNodes.indexOf(conn.to);
                          if (idxFrom === -1 || idxTo === -1) return null;
                          const fromX = 50 + (idxFrom % 3) * 140;
                          const fromY = 50 + Math.floor(idxFrom / 3) * 90;
                          const toX = 50 + (idxTo % 3) * 140;
                          const toY = 50 + Math.floor(idxTo / 3) * 90;
                          return (
                            <line
                              key={idx}
                              x1={fromX}
                              y1={fromY}
                              x2={toX}
                              y2={toY}
                              stroke={conn.type === '===' ? (isLight ? '#059669' : '#00e476') : (isLight ? '#0284c7' : '#74f5ff')}
                              strokeWidth={conn.type === '===' ? 3 : 1.5}
                              opacity={0.7}
                            />
                          );
                        })}
                      </svg>
                      {topologyNodes.map((node, i) => {
                        const posX = 50 + (i % 3) * 140;
                        const posY = 50 + Math.floor(i / 3) * 90;
                        return (
                          <div
                            key={node}
                            style={{ left: `${posX - 40}px`, top: `${posY - 25}px` }}
                            className={`absolute w-20 p-2 rounded-lg border flex flex-col items-center justify-center text-center shadow-lg ${
                              isLight ? 'bg-white border-sky-300' : 'border-[#00dbe7]/30 bg-[#121216]'
                            }`}
                          >
                            <span className={`material-symbols-outlined text-sm mb-0.5 ${isLight ? 'text-sky-600' : 'text-[#74f5ff]'}`}>dns</span>
                            <span className={`font-mono text-[9px] font-bold truncate w-full ${isLight ? 'text-slate-900' : 'text-white'}`}>{node}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'GRID' && (
                <div className="flex flex-col gap-4">
                  {parsedTable.headers.length === 0 ? (
                    <div className={`text-center py-20 font-mono text-xs italic ${
                      isLight ? 'text-slate-400' : 'text-on-surface-variant'
                    }`}>
                      No Markdown tables detected. Type a standard Markdown table on the left.
                    </div>
                  ) : (
                    <div className={`overflow-x-auto rounded border ${
                      isLight ? 'border-slate-200 bg-white' : 'border-outline/15 bg-transparent'
                    }`}>
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead className={`text-[10px] uppercase ${
                          isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#121216] text-on-surface-variant'
                        }`}>
                          <tr>
                            {parsedTable.headers.map((hdr, i) => (
                              <th
                                key={i}
                                onClick={() => handleSort(i)}
                                className={`p-3 cursor-pointer border-b font-bold ${
                                  isLight ? 'hover:text-slate-900 border-slate-200' : 'hover:text-white border-outline/20'
                                }`}
                              >
                                <span className="flex items-center gap-1">
                                  {hdr}
                                  {sortConfig?.key === i && (
                                    <span className="text-[#00dbe7] text-[8px]">
                                      {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                    </span>
                                  )}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={isLight ? 'divide-y divide-slate-200 text-slate-800' : 'divide-y divide-white/5 text-white'}>
                          {parsedTable.rows.map((row, rIdx) => (
                            <tr key={rIdx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-3">
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
        )}
      </div>

      {/* Floating Slash Command Menu */}
      <SlashCommandMenu
        isOpen={isSlashMenuOpen}
        onClose={() => setIsSlashMenuOpen(false)}
        onInsert={insertSnippet}
        theme={theme}
      />
    </div>
  );
}
