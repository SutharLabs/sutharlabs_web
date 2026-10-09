import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types.js';
import { formatINR } from '../gstEngine.js';

interface GeneralLedgerViewProps {
  userToken: string;
}

export default function GeneralLedgerView({ userToken }: GeneralLedgerViewProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/plugins/wp_accounting/reports/ledger', {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch (err) {
        console.error('Failed to load ledger:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLedger();
  }, [userToken]);

  let grandDebit = 0;
  let grandCredit = 0;

  for (const entry of entries) {
    for (const line of entry.lines) {
      grandDebit += line.debit;
      grandCredit += line.credit;
    }
  }

  const isTallyBalanced = Math.abs(grandDebit - grandCredit) < 0.05;

  if (isLoading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-gray-400">
        <span className="material-symbols-outlined text-2xl animate-spin text-[#00dbe7] block mb-2">sync</span>
        Calculating Double-Entry Ledger Balances...
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-xs animate-fade-in">
      {/* Tally Balance Status Card */}
      <div className="glass-panel p-4 rounded-xl border border-outline/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low/40">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isTallyBalanced ? 'bg-[#00e476]/15 text-[#00e476]' : 'bg-rose-500/15 text-rose-400'
          }`}>
            <span className="material-symbols-outlined text-xl">balance</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-white font-sans">
              Indian Chart of Accounts • General Ledger Journal Book
            </h3>
            <span className="text-[10px] text-gray-400">
              Automated Double-Entry postings reflecting Section 128 of Companies Act, 2013
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-gray-400 block">Total Debits</span>
            <span className="font-bold text-[#00e476]">{formatINR(grandDebit)}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block">Total Credits</span>
            <span className="font-bold text-[#74f5ff]">{formatINR(grandCredit)}</span>
          </div>
          <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase ${
            isTallyBalanced
              ? 'bg-[#00e476]/15 text-[#00e476] border-[#00e476]/40'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
          }`}>
            {isTallyBalanced ? 'Tally Balanced ✓' : 'Discrepancy ⚠'}
          </span>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="glass-panel rounded-xl overflow-hidden border border-outline/15">
            {/* Entry Header */}
            <div className="bg-[#18181c] px-4 py-2.5 border-b border-[#3a494b]/20 flex flex-wrap justify-between items-center text-[11px] gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#00dbe7]">{entry.id}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">Ref: {entry.referenceNo}</span>
                <span className="text-gray-500">•</span>
                <span className="text-white">{entry.date}</span>
              </div>
              <span className="text-[10px] text-gray-400 italic max-w-md truncate">{entry.description}</span>
            </div>

            {/* Entry Lines */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#121215] text-[10px] text-gray-400 uppercase">
                  <tr>
                    <th className="p-2.5 pl-4">Account Code</th>
                    <th className="p-2.5">Account Particulars</th>
                    <th className="p-2.5 text-right">Debit (₹)</th>
                    <th className="p-2.5 text-right pr-4">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a494b]/10 bg-surface-container-low/40">
                  {entry.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 pl-4 text-gray-400 font-bold">{line.accountCode}</td>
                      <td className="p-2.5 text-white font-sans">{line.accountName}</td>
                      <td className="p-2.5 text-right font-bold text-[#00e476]">
                        {line.debit > 0 ? formatINR(line.debit).replace('₹ ', '') : '-'}
                      </td>
                      <td className="p-2.5 text-right pr-4 font-bold text-[#74f5ff]">
                        {line.credit > 0 ? formatINR(line.credit).replace('₹ ', '') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="p-12 text-center text-gray-500 font-light glass-panel rounded-xl">
            No journal entries recorded. Generate an invoice to see automated ledger postings.
          </div>
        )}
      </div>
    </div>
  );
}
