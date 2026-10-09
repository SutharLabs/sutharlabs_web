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
      <div className="p-12 text-center font-mono text-xs text-slate-500 dark:text-gray-400">
        <span className="material-symbols-outlined text-2xl animate-spin text-cyan-600 dark:text-[#00dbe7] block mb-2">sync</span>
        Calculating Double-Entry Ledger Balances...
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-xs animate-fade-in text-slate-900 dark:text-[#e5e1e4]">
      {/* Tally Balance Status Card */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#3a494b]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#121215] shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isTallyBalanced ? 'bg-emerald-500/15 text-emerald-600 dark:text-[#00e476]' : 'bg-rose-500/15 text-rose-500'
          }`}>
            <span className="material-symbols-outlined text-xl">balance</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans">
              Indian Chart of Accounts • General Ledger Journal Book
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-gray-400">
              Automated Double-Entry postings reflecting Section 128 of Companies Act, 2013
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-gray-400 block">Total Debits</span>
            <span className="font-bold text-emerald-700 dark:text-[#00e476]">{formatINR(grandDebit)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-gray-400 block">Total Credits</span>
            <span className="font-bold text-cyan-700 dark:text-[#74f5ff]">{formatINR(grandCredit)}</span>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase ${
            isTallyBalanced
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#00e476] border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
          }`}>
            {isTallyBalanced ? 'Tally Balanced ✓' : 'Discrepancy ⚠'}
          </span>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#3a494b]/30 bg-white dark:bg-[#121215] shadow-xs">
            {/* Entry Header */}
            <div className="bg-slate-50 dark:bg-[#18181c] px-4 py-2.5 border-b border-slate-200 dark:border-[#3a494b]/20 flex flex-wrap justify-between items-center text-[11px] gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-700 dark:text-[#00dbe7]">{entry.id}</span>
                <span className="text-slate-300 dark:text-gray-600">•</span>
                <span className="text-slate-600 dark:text-gray-400">Ref: {entry.referenceNo}</span>
                <span className="text-slate-300 dark:text-gray-600">•</span>
                <span className="text-slate-800 dark:text-white font-medium">{entry.date}</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-gray-400 italic max-w-md truncate">{entry.description}</span>
            </div>

            {/* Entry Lines */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/60 dark:bg-[#121215] text-[10px] text-slate-500 dark:text-gray-400 uppercase border-b border-slate-200 dark:border-[#3a494b]/20">
                  <tr>
                    <th className="p-2.5 pl-4">Account Code</th>
                    <th className="p-2.5">Account Particulars</th>
                    <th className="p-2.5 text-right">Debit (₹)</th>
                    <th className="p-2.5 text-right pr-4">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/10 bg-white dark:bg-[#121215]">
                  {entry.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-2.5 pl-4 text-slate-500 dark:text-gray-400 font-bold">{line.accountCode}</td>
                      <td className="p-2.5 text-slate-900 dark:text-white font-sans font-medium">{line.accountName}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700 dark:text-[#00e476]">
                        {line.debit > 0 ? formatINR(line.debit).replace('₹ ', '') : '-'}
                      </td>
                      <td className="p-2.5 text-right pr-4 font-bold text-cyan-700 dark:text-[#74f5ff]">
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
          <div className="p-12 text-center text-slate-400 dark:text-gray-500 font-light bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#3a494b]/30">
            No journal entries recorded. Generate an invoice or record a voucher to see automated ledger postings.
          </div>
        )}
      </div>
    </div>
  );
}
