import React, { useState } from 'react';
import { Invoice, TerminalLog } from '../types';

interface AccountingViewProps {
  onAddLog: (log: TerminalLog) => void;
}

const initialInvoices: Invoice[] = [
  { id: 'ST-00241', date: '2026-05-18', client: 'AlphaCorp Int', amount: 8450.00, status: 'Paid' },
  { id: 'ST-00242', date: '2026-05-20', client: 'Tesla Forge', amount: 12500.00, status: 'Pending' },
  { id: 'ST-00243', date: '2026-05-22', client: 'Vertex Grid', amount: 9950.00, status: 'Pending' },
  { id: 'ST-00244', date: '2026-05-23', client: 'Lambda Group', amount: 4800.00, status: 'Paid' }
];

export default function AccountingView({ onAddLog }: AccountingViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New invoice form input states
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Derive all statistics dynamically to support live user form submissions
  const totalAmount = invoices.reduce((sum, current) => sum + current.amount, 0);
  
  const outstandingAmount = invoices
    .filter(i => i.status === 'Pending')
    .reduce((sum, curr) => sum + curr.amount, 0);

  const paidAmount = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, curr) => sum + curr.amount, 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !amount) return;
    
    // Parse numeric value
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const codeId = `ST-00${240 + invoices.length + 1}`;
    const newInvoice: Invoice = {
      id: codeId,
      date: new Date().toISOString().split('T')[0],
      client: client,
      amount: parsedAmount,
      status: status
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Track visual indicators
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `ACCOUNTING: Formed invoice ${codeId} representing client [${client}] for $${parsedAmount.toFixed(2)}.`
    });

    // Reset fields
    setClient('');
    setAmount('');
    setStatus('Pending');
    setIsFormVisible(false);
  };

  // Filter invoices relative to query
  const filteredInvoices = invoices.filter(item => 
    item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // SVG Chart rendering dimensions
  const svgWidth = 500;
  const svgHeight = 150;

  return (
    <div className="flex-grow flex flex-col gap-5">
      
      {/* Dynamic Summary Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Outstanding Card */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-[#00dbe7] flex flex-col justify-center">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#849495] mb-1 block">Total Value</span>
          <span className="text-xl font-bold text-[#e5e1e4] font-sans block">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Pending / Overdue Card */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-[#ce5dff] flex flex-col justify-center">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#849495] mb-1 block">Outstanding</span>
          <span className="text-xl font-bold text-[#ebb2ff] font-sans block">${outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Paid / Realized Card */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-[#00e476] flex flex-col justify-center">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#849495] mb-1 block">Paid Portfolio</span>
          <span className="text-xl font-bold text-[#00e476] font-sans block">${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Gross margin placeholder calculation */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-gray-600 flex flex-col justify-center">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#849495] mb-1 block">Margin</span>
          <span className="text-xl font-bold text-white font-mono block">84.2%</span>
        </div>
      </div>

      {/* Main Bar Chart Matrix displaying invoices visual proportions */}
      <div className="glass-panel rounded-lg p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#3a494b]/10">
          <h3 className="font-mono text-xs font-bold text-[#e5e1e4] uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00dbe7] text-base select-none">currency_exchange</span>
            Payout Cycle Analysis (Active Invoices Proportional Graph)
          </h3>
          <span className="text-[10px] font-mono text-[#849495]">Dynamic scale relative to inputs</span>
        </div>

        {/* Custom SVG bars representing individual invoice weights */}
        <div className="h-[140px] relative chart-grid rounded bg-[#131315]/40 flex items-end p-4">
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            {/* Draw flowing connections under values */}
            {invoices.map((inv, idx) => {
              const xUnit = svgWidth / (invoices.length || 1);
              const xPos = idx * xUnit + (xUnit / 4);
              const barWidth = xUnit / 2;
              
              // Max pricing capping scale
              const maxVal = Math.max(...invoices.map(i => i.amount), 15000);
              const barHeight = (inv.amount / maxVal) * (svgHeight - 40);
              const yPos = svgHeight - barHeight - 15;

              return (
                <g key={inv.id}>
                  {/* Subtle bar drop glow */}
                  <rect 
                    x={xPos} 
                    y={yPos} 
                    width={barWidth} 
                    height={barHeight} 
                    rx="3"
                    fill={inv.status === 'Paid' ? '#00e476' : '#ce5dff'} 
                    opacity="0.15"
                    className="drop-shadow-[0_0_8px_rgba(206,93,255,0.4)]"
                  />
                  {/* Real visual bar */}
                  <rect 
                    x={xPos} 
                    y={yPos} 
                    width={barWidth} 
                    height={barHeight} 
                    rx="3"
                    fill={inv.status === 'Paid' ? '#00e476' : '#ce5dff'} 
                    opacity="0.7"
                  />
                  {/* Text value inside the bars */}
                  <text 
                    x={xPos + barWidth / 2} 
                    y={yPos - 6} 
                    fill="#e5e1e4" 
                    fontSize="8" 
                    textAnchor="middle" 
                    fontFamily="monospace"
                  >
                    ${inv.amount >= 1000 ? `${(inv.amount/1000).toFixed(1)}k` : inv.amount}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Simple legends inside bottom panel */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-between px-6 font-mono text-[8px] text-[#849495]">
            {invoices.map(i => <span key={i.id}>{i.id}</span>)}
          </div>
        </div>
      </div>

      {/* Interactive Creation invoice overlay or inline form */}
      <div className="glass-panel p-5 rounded-lg border border-[#3a494b]/15">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00e476] select-none text-md">receipt_long</span>
            <h3 className="font-mono text-xs font-bold text-[#e5e1e4] uppercase tracking-widest">Invoices Log Book</h3>
          </div>
          
          <button 
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="px-3 py-1 bg-[#201f21] border border-[#3a494b]/40 rounded hover:border-[#00dbe7] text-xs font-mono text-[#74f5ff] transition-all cursor-pointer"
          >
            {isFormVisible ? 'Collapse Panel' : 'Form Invoice Entry'}
          </button>
        </div>

        {/* Input Form Elements */}
        {isFormVisible && (
          <form onSubmit={handleCreateInvoice} className="bg-[#0e0e10]/60 p-4 rounded-md border border-[#3a494b]/20 mb-5 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-[#849495] uppercase">Client Name</label>
                <input 
                  type="text" 
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Tesla Motors"
                  className="w-full bg-[#131315] border border-[#3a494b]/40 rounded p-2 text-xs font-mono text-[#e5e1e4] focus:outline-none focus:border-[#00e476]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-[#849495] uppercase">Billing Amount ($USD)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2500"
                  className="w-full bg-[#131315] border border-[#3a494b]/40 rounded p-2 text-xs font-mono text-[#e5e1e4] focus:outline-none focus:border-[#00e476]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-[#849495] uppercase">Inception Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#131315] border border-[#3a494b]/40 rounded p-2 text-xs font-mono text-[#e5e1e4] focus:outline-none focus:border-[#00e476] h-[34px]"
                >
                  <option value="Pending">Pending / Unpaid</option>
                  <option value="Paid">Cleared / Paid</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button 
                type="submit"
                className="px-4 py-2 bg-[#00e476] text-[#00210c] text-xs font-mono font-bold uppercase tracking-widest rounded hover:brightness-115 shadow-[0_0_8px_rgba(0,228,118,0.25)] cursor-pointer"
              >
                Incept Invoice
              </button>
            </div>
          </form>
        )}

        {/* Filters control toolbar */}
        <div className="flex gap-2 mb-4">
          <div className="flex-grow bg-[#201f21] rounded border border-[#3a494b]/30 flex items-center px-3 py-1.5 focus-within:border-[#00dbe7] transition-all">
            <span className="material-symbols-outlined text-sm text-[#849495] select-none mr-2">search</span>
            <input 
              type="text" 
              placeholder="Search ledger by client name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs font-mono text-white placeholder-gray-500 focus:outline-none w-full p-0"
            />
          </div>
        </div>

        {/* Ledgers table representation */}
        <div className="w-full overflow-x-auto rounded border border-[#3a494b]/10">
          <table className="w-full text-left font-mono text-xs border-collapse divide-y divide-[#3a494b]/15">
            <thead className="bg-[#0e0e10]/60 text-[#849495] select-none text-[10px]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">DATE</th>
                <th className="p-3">CLIENT</th>
                <th className="p-3 text-right">AMOUNT ($)</th>
                <th className="p-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3a494b]/10 bg-[#131315]/40">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === 'Paid';

                return (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-[#00dbe7] font-bold">{inv.id}</td>
                    <td className="p-3 text-gray-400">{inv.date}</td>
                    <td className="p-3 text-[#e5e1e4] font-semibold">{inv.client}</td>
                    <td className="p-3 text-right text-white font-bold">
                      ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        isPaid 
                          ? 'bg-[#00fb83]/10 text-[#00e476] border-[#00e476]/35' 
                          : 'bg-[#ce5dff]/10 text-[#ebb2ff] border-[#ce5dff]/35'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#849495] font-light">
                    No records matches filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
