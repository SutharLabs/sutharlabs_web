import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Code2, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb, 
  ExternalLink 
} from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  theme?: 'light' | 'dark';
  onExtractArtifact?: (code: string, language: string) => void;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  theme = 'dark',
  onExtractArtifact
}) => {
  const isLight = theme === 'light';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse inline markdown (bold, italic, code, link)
  const renderInlineSpans = (text: string) => {
    // Regex for inline code: `code`
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|~~[^~]+~~)/g);
    return parts.map((part, i) => {
      if (!part) return null;

      // Inline Code: `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const codeText = part.slice(1, -1);
        return (
          <code
            key={i}
            className={`px-1.5 py-0.5 rounded text-[11px] font-mono border mx-0.5 ${
              isLight
                ? 'bg-slate-100 text-slate-800 border-slate-300 font-medium'
                : 'bg-white/5 text-on-surface border-white/10'
            }`}
          >
            {codeText}
          </code>
        );
      }

      // Bold: **bold**
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={i} className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic: *italic*
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={i} className={`italic ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
            {part.slice(1, -1)}
          </em>
        );
      }

      // Strikethrough: ~~del~~
      if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
        return (
          <del key={i} className="line-through opacity-70">
            {part.slice(2, -2)}
          </del>
        );
      }

      // Link: [text](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-0.5 underline font-medium hover:opacity-80 transition-opacity ${
              isLight ? 'text-sky-600' : 'text-[#00dbe7]'
            }`}
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
          </a>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  // High-performance block-level parser
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let blockKey = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Fenced Code Block: ```lang ... ```
      if (line.trim().startsWith('```')) {
        const langMatch = line.trim().match(/^```([a-zA-Z0-9_-]*)/);
        const language = (langMatch && langMatch[1]) ? langMatch[1] : 'code';
        const codeLines: string[] = [];
        i++; // skip start ```
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        const codeText = codeLines.join('\n');
        const codeIdx = blockKey++;

        elements.push(
          <div
            key={codeIdx}
            className={`my-3 rounded-xl border overflow-hidden shadow-xs font-mono transition-colors ${
              isLight
                ? 'bg-slate-100/80 border-slate-300'
                : 'bg-[#121215] border-[#3a494b]/40'
            }`}
          >
            {/* Code Block Header */}
            <div
              className={`flex items-center justify-between px-3 py-1.5 border-b text-[10px] select-none ${
                isLight
                  ? 'bg-slate-200/60 border-slate-300 text-slate-700'
                  : 'bg-white/5 border-white/10 text-on-surface-variant'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                <span>{language}</span>
              </div>
              <div className="flex items-center gap-2">
                {onExtractArtifact && (
                  <button
                    type="button"
                    onClick={() => onExtractArtifact(codeText, language)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all flex items-center gap-1 cursor-pointer select-none ${
                      isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                        : 'bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface border-white/10'
                    }`}
                  >
                    <span>Extract Artifact</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => copyCode(codeText, codeIdx)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all flex items-center gap-1 cursor-pointer select-none ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600'
                      : 'bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface border-white/10'
                  }`}
                  title="Copy snippet"
                >
                  {copiedIndex === codeIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 shrink-0" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* Code Content */}
            <pre className="p-3 text-[11px] sm:text-xs overflow-x-auto leading-relaxed select-all scrollbar-thin">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        continue;
      }

      // 2. Alert Callout: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
      if (line.trim().match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i)) {
        const alertMatch = line.trim().match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
        const alertType = (alertMatch ? alertMatch[1] : 'NOTE').toUpperCase();
        const calloutLines: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          calloutLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }

        const alertStyles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
          NOTE: {
            bg: isLight ? 'bg-sky-50' : 'bg-sky-500/10',
            border: isLight ? 'border-sky-300' : 'border-sky-500/30',
            text: isLight ? 'text-sky-800' : 'text-sky-300',
            icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />
          },
          TIP: {
            bg: isLight ? 'bg-emerald-50' : 'bg-emerald-500/10',
            border: isLight ? 'border-emerald-300' : 'border-emerald-500/30',
            text: isLight ? 'text-emerald-800' : 'text-emerald-300',
            icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />
          },
          IMPORTANT: {
            bg: isLight ? 'bg-purple-50' : 'bg-purple-500/10',
            border: isLight ? 'border-purple-300' : 'border-purple-500/30',
            text: isLight ? 'text-purple-800' : 'text-purple-300',
            icon: <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
          },
          WARNING: {
            bg: isLight ? 'bg-amber-50' : 'bg-amber-500/10',
            border: isLight ? 'border-amber-300' : 'border-amber-500/30',
            text: isLight ? 'text-amber-800' : 'text-amber-300',
            icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          },
          CAUTION: {
            bg: isLight ? 'bg-rose-50' : 'bg-rose-500/10',
            border: isLight ? 'border-rose-300' : 'border-rose-500/30',
            text: isLight ? 'text-rose-800' : 'text-rose-300',
            icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          }
        };

        const activeAlert = alertStyles[alertType] || alertStyles.NOTE;

        elements.push(
          <div
            key={blockKey++}
            className={`my-3 p-3.5 rounded-xl border ${activeAlert.bg} ${activeAlert.border} text-xs leading-relaxed shadow-xs`}
          >
            <div className={`flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1 text-[11px] ${activeAlert.text}`}>
              {activeAlert.icon}
              <span>{alertType}</span>
            </div>
            <div className={`text-xs pl-5.5 ${isLight ? 'text-slate-800' : 'text-on-surface'}`}>
              {calloutLines.map((cl, idx) => (
                <p key={idx} className="my-0.5">{renderInlineSpans(cl)}</p>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // 3. Standard Blockquote: > text
      if (line.trim().startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        elements.push(
          <blockquote
            key={blockKey++}
            className={`my-2 pl-3 py-1 border-l-2 text-xs italic ${
              isLight
                ? 'border-sky-500 bg-sky-50/50 text-slate-700'
                : 'border-[#00dbe7] bg-[#00dbe7]/5 text-on-surface-variant'
            } rounded-r`}
          >
            {quoteLines.map((ql, idx) => (
              <p key={idx} className="my-0.5">{renderInlineSpans(ql)}</p>
            ))}
          </blockquote>
        );
        continue;
      }

      // 4. Headings: #, ##, ###, ####
      if (line.startsWith('#')) {
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          const hKey = blockKey++;

          if (level === 1) {
            elements.push(
              <h2
                key={hKey}
                className={`text-sm sm:text-base font-bold font-sans mt-3.5 mb-1.5 pb-1 border-b ${
                  isLight ? 'text-slate-900 border-slate-200' : 'text-white border-outline/10'
                }`}
              >
                {renderInlineSpans(text)}
              </h2>
            );
          } else if (level === 2) {
            elements.push(
              <h3
                key={hKey}
                className={`text-xs sm:text-sm font-bold font-sans mt-3 mb-1 ${
                  isLight ? 'text-sky-700' : 'text-[#74f5ff]'
                }`}
              >
                {renderInlineSpans(text)}
              </h3>
            );
          } else {
            elements.push(
              <h4
                key={hKey}
                className={`text-xs font-semibold font-sans mt-2.5 mb-0.5 ${
                  isLight ? 'text-purple-700' : 'text-[#ce5dff]'
                }`}
              >
                {renderInlineSpans(text)}
              </h4>
            );
          }
          i++;
          continue;
        }
      }

      // 5. Horizontal Rule: --- or ***
      if (line.trim().match(/^(---|---|\*\*\*)$/)) {
        elements.push(
          <hr
            key={blockKey++}
            className={`my-3 border-t ${isLight ? 'border-slate-200' : 'border-outline/15'}`}
          />
        );
        i++;
        continue;
      }

      // 6. GFM Tables: | Col 1 | Col 2 |
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          const headerCells = tableLines[0].slice(1, -1).split('|').map(c => c.trim());
          const isDelimiter = tableLines[1].replace(/[\s|:-]/g, '').length === 0;
          const rowLines = isDelimiter ? tableLines.slice(2) : tableLines.slice(1);

          elements.push(
            <div key={blockKey++} className="my-3 overflow-x-auto rounded-xl border shadow-xs border-outline/15">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className={isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/5 text-[#00dbe7]'}>
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 font-bold font-mono text-[11px] border-b border-outline/15">
                        {renderInlineSpans(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowLines.map((rowStr, rIdx) => {
                    const cells = rowStr.slice(1, -1).split('|').map(c => c.trim());
                    return (
                      <tr
                        key={rIdx}
                        className={`border-b last:border-b-0 transition-colors ${
                          rIdx % 2 === 0
                            ? isLight ? 'bg-white' : 'bg-transparent'
                            : isLight ? 'bg-slate-50' : 'bg-white/[0.02]'
                        } hover:${isLight ? 'bg-sky-50/50' : 'bg-white/5'}`}
                      >
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5 text-xs text-on-surface">
                            {renderInlineSpans(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 7. Bullet or Numbered Lists
      if (line.trim().match(/^([-*+]|\d+\.)\s+/)) {
        const listItems: { text: string; isOrdered: boolean }[] = [];
        while (i < lines.length && lines[i].trim().match(/^([-*+]|\d+\.)\s+/)) {
          const match = lines[i].trim().match(/^([-*+]|\d+\.)\s+(.*)$/);
          if (match) {
            const isOrdered = /^\d+\./.test(match[1]);
            listItems.push({ text: match[2], isOrdered });
          }
          i++;
        }
        const isOrderedList = listItems[0]?.isOrdered;
        elements.push(
          isOrderedList ? (
            <ol key={blockKey++} className="my-2 ml-4 list-decimal space-y-1 text-xs text-on-surface">
              {listItems.map((item, idx) => (
                <li key={idx} className="pl-1 leading-relaxed">
                  {renderInlineSpans(item.text)}
                </li>
              ))}
            </ol>
          ) : (
            <ul key={blockKey++} className="my-2 ml-4 list-disc space-y-1 text-xs text-on-surface">
              {listItems.map((item, idx) => (
                <li key={idx} className="pl-1 leading-relaxed">
                  {renderInlineSpans(item.text)}
                </li>
              ))}
            </ul>
          )
        );
        continue;
      }

      // 8. Empty lines
      if (line.trim() === '') {
        i++;
        continue;
      }

      // 9. Regular Paragraph
      const pLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].startsWith('#') &&
        !lines[i].trim().startsWith('>') &&
        !lines[i].trim().match(/^([-*+]|\d+\.)\s+/) &&
        !lines[i].trim().match(/^(---|---|\*\*\*)$/) &&
        !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|'))
      ) {
        pLines.push(lines[i]);
        i++;
      }

      if (pLines.length > 0) {
        elements.push(
          <p key={blockKey++} className="my-1.5 text-xs leading-relaxed text-on-surface font-sans">
            {pLines.map((pl, plIdx) => (
              <React.Fragment key={plIdx}>
                {plIdx > 0 && <br />}
                {renderInlineSpans(pl)}
              </React.Fragment>
            ))}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <div className="markdown-body space-y-1 text-xs">
      {renderBlocks()}
    </div>
  );
};

export default MarkdownMessage;
