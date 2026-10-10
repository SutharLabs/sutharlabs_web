import React, { useState } from 'react';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  CheckSquare, 
  Code, 
  AlertCircle, 
  Activity, 
  Server, 
  Table, 
  Minus,
  X
} from 'lucide-react';

interface SlashCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (snippet: string) => void;
  theme?: 'dark' | 'light';
}

interface CommandItem {
  id: string;
  title: string;
  desc: string;
  icon: any;
  snippet: string;
  category: string;
}

const COMMAND_LIST: CommandItem[] = [
  { id: 'h1', title: 'Heading 1', desc: 'Large document section title', icon: Heading1, snippet: '# Section Heading 1', category: 'Typography' },
  { id: 'h2', title: 'Heading 2', desc: 'Medium subsection title', icon: Heading2, snippet: '## Subsection Heading 2', category: 'Typography' },
  { id: 'h3', title: 'Heading 3', desc: 'Small subsection title', icon: Heading3, snippet: '### Micro Heading 3', category: 'Typography' },
  { id: 'task', title: 'Task Checkbox', desc: 'Interactive to-do list item', icon: CheckSquare, snippet: '- [ ] Complete architecture verification\n- [ ] Run security audit', category: 'Lists' },
  { id: 'bullet', title: 'Bulleted List', desc: 'Simple bulleted items', icon: List, snippet: '- First milestone deliverable\n- Second milestone deliverable', category: 'Lists' },
  { id: 'code', title: 'Code Block', desc: 'Syntax-highlighted code block', icon: Code, snippet: '```typescript\ninterface CloudConfig {\n  region: "ap-south-1";\n  replicas: 3;\n}\n```', category: 'Code' },
  { id: 'note', title: 'Callout Note', desc: 'Highlight important technical notices', icon: AlertCircle, snippet: '> [!NOTE]\n> Ensure cryptographic AES-256 signatures are validated before deployment.', category: 'Callouts' },
  { id: 'warning', title: 'Callout Warning', desc: 'Crucial hazard or caution alert', icon: AlertCircle, snippet: '> [!WARNING]\n> Breaking change: legacy endpoints will deprecate on next release.', category: 'Callouts' },
  { id: 'sequence', title: 'Sequence Flow Diagram', desc: 'Interactive actor calling flow', icon: Activity, snippet: '```sequence\nClient -> Gateway: POST /api/auth\nGateway -> Database: Verify Hash\nGateway -> Client: 200 OK Token\n```', category: 'Diagrams' },
  { id: 'topology', title: 'Network Topology', desc: 'Microservices architecture topology', icon: Server, snippet: '```topology\n[ClientApp] === [NginxIngress]\n[NginxIngress] === [CoreAPI]\n[CoreAPI] --- [PostgreSQL]\n```', category: 'Diagrams' },
  { id: 'table', title: 'Data Table', desc: 'Tabular comparison matrix', icon: Table, snippet: '| Service | Port | Protocol | Status |\n| :--- | :---: | :---: | :---: |\n| API Gateway | 3000 | HTTPS | ACTIVE |\n| Database | 5432 | TCP | READY |', category: 'Data' },
  { id: 'divider', title: 'Divider', desc: 'Visual section boundary rule', icon: Minus, snippet: '\n---\n', category: 'Formatting' }
];

export default function SlashCommandMenu({
  isOpen,
  onClose,
  onInsert,
  theme = 'dark'
}: SlashCommandMenuProps) {
  if (!isOpen) return null;
  const isLight = theme === 'light';
  const [search, setSearch] = useState('');

  const filteredCommands = COMMAND_LIST.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-3 flex flex-col font-mono text-xs max-h-[75vh] overflow-hidden ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-[#121216] border-outline/25 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Header search */}
        <div className="flex items-center justify-between px-2 pb-2 border-b border-outline/10">
          <span className={`font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-on-surface'}`}>
            <span className={`${isLight ? 'text-indigo-600' : 'text-[#00dbe7]'} font-black text-sm`}>/</span> Slash Insert Menu
          </span>
          <button 
            onClick={onClose} 
            className={`p-1 rounded ${isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800' : 'hover:bg-white/10 text-on-surface-variant hover:text-white'}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="py-2">
          <input
            type="text"
            placeholder="Filter blocks (e.g. heading, table, sequence)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
              isLight 
                ? 'border-slate-300 bg-white text-slate-800 focus:border-indigo-500' 
                : 'border-outline/15 bg-surface-container-low text-white focus:border-[#00dbe7]'
            }`}
          />
        </div>

        {/* Command list */}
        <div className="flex-1 overflow-y-auto space-y-1 p-1 custom-scrollbar">
          {filteredCommands.map(cmd => {
            const IconComp = cmd.icon;
            return (
              <div
                key={cmd.id}
                onClick={() => {
                  onInsert(cmd.snippet);
                  onClose();
                }}
                className={`p-2 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-colors ${
                  isLight ? 'hover:bg-indigo-50 text-slate-800' : 'hover:bg-white/5 text-[#b9cacb] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`p-2 rounded-lg ${
                    isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-surface-container-high text-[#00dbe7]'
                  }`}>
                    <IconComp className="w-4 h-4" />
                  </span>
                  <div className="truncate">
                    <span className={`font-sans text-xs font-bold block truncate ${
                      isLight ? 'text-slate-800' : 'text-on-surface'
                    }`}>
                      {cmd.title}
                    </span>
                    <span className={`text-[10px] truncate block ${
                      isLight ? 'text-slate-500' : 'text-on-surface-variant'
                    }`}>
                      {cmd.desc}
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded shrink-0 ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-black/20 text-on-surface-variant'
                }`}>
                  {cmd.category}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
