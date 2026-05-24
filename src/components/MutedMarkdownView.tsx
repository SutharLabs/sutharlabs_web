import React, { useState } from 'react';

// Starter markdown configuration
const initialMarkdown = `# SutharLabs Systems Integration Guideline

This document defines the architectural patterns and telemetry specifications for SutharLabs micro-agents.

## Core Operations Framework

- **Vite React 19 Engine**: Compiles single-page workflows using high-density layouts and custom theme definitions.
- **Dynamic Node Coordinates**: Drag-and-drop mechanics in the \`Custom_Flow.flow\` panel bind to React memory hooks.
- **WebSocket Streaming**: Simulated mock market tickers stream live NVDA price feeds straight to SVG lines.

## Telemetry Credentials

To sync with live production nodes, specify the following parameters in your local environment variables:

\`\`\`bash
# .env.local settings
GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_KEY"
PORT=3000
SYS_ROUTING_LATENCY_THRESHOLD=25
\`\`\`

## Functional Highlights

> **Fidelity First Design**: SutharLabs utilizes crisp glassmorphic backplates, custom glowing accents, and a custom neon matrix grid to present developer workloads clearly.

*For assistance with model model contexts or ledger setups, contact our operations department.*`;

export default function MutedMarkdownView() {
  const [markdown, setMarkdown] = useState(initialMarkdown);

  // High-performance bulletproof Markdown parsing regex helper
  const parseMarkdownToHtml = (text: string) => {
    let html = text;

    // Escape basic HTML to avoid rendering issues
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold font-sans text-white mt-4 first:mt-0 mb-3">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold font-sans text-[#74f5ff] mt-5 mb-2">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold font-sans text-[#ce5dff] mt-4 mb-2">$1</h3>');

    // Blockquotes
    html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote class="border-l-4 border-[#ce5dff] pl-3 py-1 my-3 bg-[#ce5dff]/5 rounded-r font-sans italic text-sm text-[#b9cacb]">$1</blockquote>');

    // Code Blocks (fenced)
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-[#201f21] border border-[#3a494b]/30 rounded p-3 my-4 font-mono text-xs overflow-x-auto text-[#74f5ff]">$1</pre>');

    // Inline Code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-[#2a2a2c]/60 border border-[#3a494b]/20 px-1 py-0.5 rounded font-mono text-xs text-[#ebb2ff]">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // Bullet list items
    html = html.replace(/^[-*+]\s+(.*$)/gim, '<li class="ml-4 list-disc pl-1 mb-1.5 font-light">$1</li>');

    // Wrap list piles
    // Simple helper to wrap groups of <li>
    html = html.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul class="my-3 text-sm text-[#b9cacb]">$1</ul>');

    // Paragraph wrappers for orphaned text files
    const paragraphs = html.split(/\n\n+/);
    const parsedParagraphs = paragraphs.map(p => {
      // If of heading or blockquote or lists or code pre, don't wrap in p tags
      if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<pre') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<li')) {
        return p;
      }
      return `<p class="text-sm text-[#b9cacb] leading-relaxed my-3 font-light">${p}</p>`;
    });

    return parsedParagraphs.join('\n');
  };

  const parsedHtml = parseMarkdownToHtml(markdown);

  return (
    <div className="flex-grow flex flex-col lg:flex-row gap-4 min-h-[460px]">
      
      {/* Raw Markdown Editor Pane on Left */}
      <div className="flex-1 flex flex-col bg-[#0e0e10]/80 rounded-lg border border-[#3a494b]/20 overflow-hidden">
        <div className="flex items-center px-4 py-2 border-b border-[#3a494b]/10 bg-[#201f21]/80 select-none justify-between">
          <span className="font-mono text-[9px] font-bold text-[#849495] uppercase tracking-widest leading-none">MARKDOWN SOURCE</span>
          <span className="text-[10px] font-mono text-[#74f5ff]">README.md</span>
        </div>
        
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="# Enter Markdown text here..."
          className="flex-grow w-full p-4 bg-[#050505] font-mono text-xs text-white focus:outline-none focus:ring-0 resize-none min-h-[250px] lg:min-h-0 custom-scrollbar"
        />
      </div>

      {/* Rendered Live Preview Pane on Right */}
      <div className="flex-1 flex flex-col bg-[#0e0e10]/80 rounded-lg border border-[#3a494b]/20 overflow-hidden">
        <div className="flex items-center px-4 py-2 border-b border-[#3a494b]/10 bg-[#201f21]/80 select-none justify-between">
          <span className="font-mono text-[9px] font-bold text-[#849495] uppercase tracking-widest leading-none">DOCKING COMPILED WINDOW</span>
          <span className="text-[10px] font-mono text-[#00e476] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00fb83]"></span> Live HTML
          </span>
        </div>

        <div className="flex-grow bg-[#131315]/40 p-5 overflow-y-auto custom-scrollbar prose-custom">
          {/* Inject safe parsed regex styling code */}
          <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />
        </div>
      </div>

    </div>
  );
}
