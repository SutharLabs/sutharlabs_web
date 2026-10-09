import React, { useState } from 'react';
import { AccountingVoucher, VoucherType } from '../types.js';
import { formatINR } from '../gstEngine.js';

interface DayBookViewProps {
  vouchers: AccountingVoucher[];
  onOpenVoucherModal: (type?: VoucherType) => void;
  onDeleteVoucher: (id: string) => void;
}

export default function DayBookView({
  vouchers,
  onOpenVoucherModal,
  onDeleteVoucher
}: DayBookViewProps) {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = vouchers.filter(v => {
    const matchesType = selectedType === 'ALL' || v.voucherType === selectedType;
    const matchesSearch =
      v.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      (v.partyName && v.partyName.toLowerCase().includes(search.toLowerCase())) ||
      v.narration.toLowerCase().includes(search.toLowerCase()) ||
      v.debitAccount.toLowerCase().includes(search.toLowerCase()) ||
      v.creditAccount.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateFilter || v.date === dateFilter;

    return matchesType && matchesSearch && matchesDate;
  });

  const totalDebits = filtered.reduce((s, v) => s + v.amount, 0);

  const getTypeBadge = (type: VoucherType) => {
    switch (type) {
      case 'Payment':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'Receipt':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-[#00e476] border-emerald-500/30';
      case 'Contra':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-[#00dbe7] border-cyan-500/30';
      case 'Journal':
        return 'bg-purple-500/10 text-purple-600 dark:text-[#ebb2ff] border-purple-500/30';
      case 'Purchase':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Sales':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300 border-slate-300 dark:border-white/20';
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs animate-fade-in">
      
      {/* Tally Quick Action Action Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/30 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-[#00dbe7] text-xl">auto_stories</span>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans">
              Tally Prime Day Book • Voucher Register
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-gray-400">
              Chronological financial journal of all posted transactions
            </span>
          </div>
        </div>

        {/* Quick voucher buttons (F4 - F9) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onOpenVoucherModal('Contra')}
            className="px-2.5 py-1.5 rounded-lg border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-[#74f5ff] font-bold text-[11px] hover:brightness-110 cursor-pointer"
          >
            [F4] Contra
          </button>
          <button
            onClick={() => onOpenVoucherModal('Payment')}
            className="px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-[11px] hover:brightness-110 cursor-pointer"
          >
            [F5] Payment
          </button>
          <button
            onClick={() => onOpenVoucherModal('Receipt')}
            className="px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-[#00e476] font-bold text-[11px] hover:brightness-110 cursor-pointer"
          >
            [F6] Receipt
          </button>
          <button
            onClick={() => onOpenVoucherModal('Journal')}
            className="px-2.5 py-1.5 rounded-lg border border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-[#ebb2ff] font-bold text-[11px] hover:brightness-110 cursor-pointer"
          >
            [F7] Journal
          </button>
          <button
            onClick={() => onOpenVoucherModal('Purchase')}
            className="px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px] hover:brightness-110 cursor-pointer"
          >
            [F9] Purchase
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="flex-1 bg-white dark:bg-[#18181c] rounded-lg border border-slate-200 dark:border-[#3a494b]/30 flex items-center px-3 py-1.5 focus-within:border-primary dark:focus-within:border-[#00dbe7] shadow-sm">
          <span className="material-symbols-outlined text-sm text-slate-400 mr-2">search</span>
          <input
            type="text"
            placeholder="Search Day Book by party, voucher no, narration, or account..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        {/* Voucher Type Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-800 dark:text-gray-300 focus:outline-none shadow-sm"
          >
            <option value="ALL">All Vouchers</option>
            <option value="Payment">Payments [F5]</option>
            <option value="Receipt">Receipts [F6]</option>
            <option value="Contra">Contra [F4]</option>
            <option value="Journal">Journal [F7]</option>
            <option value="Sales">Sales [F8]</option>
            <option value="Purchase">Purchase [F9]</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-800 dark:text-gray-300 focus:outline-none shadow-sm"
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Vouchers Register Grid */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-[#18181c] text-[10px] text-slate-500 dark:text-gray-400 uppercase border-b border-slate-200 dark:border-[#3a494b]/20">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Voucher No</th>
                <th className="p-3">Type</th>
                <th className="p-3">Particulars & Narration</th>
                <th className="p-3">Debit Account</th>
                <th className="p-3">Credit Account</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 text-center">Mode</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/15 bg-white dark:bg-surface-container-low/40">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 text-slate-500 dark:text-gray-400 whitespace-nowrap">{v.date}</td>
                  <td className="p-3 font-bold text-primary dark:text-[#00dbe7] whitespace-nowrap">{v.voucherNumber}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getTypeBadge(v.voucherType)}`}>
                      {v.voucherType}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs">
                    {v.partyName && (
                      <span className="font-bold text-slate-900 dark:text-white font-sans block truncate">
                        {v.partyName}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-600 dark:text-gray-400 block truncate">
                      {v.narration}
                    </span>
                    {v.referenceNo && (
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 block">
                        Ref: {v.referenceNo}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-gray-300 font-mono text-[11px]">
                    <span className="text-emerald-600 dark:text-[#00e476] font-bold mr-1">Dr:</span>
                    {v.debitAccount.split('-')[1] || v.debitAccount}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-gray-300 font-mono text-[11px]">
                    <span className="text-purple-600 dark:text-[#ebb2ff] font-bold mr-1">Cr:</span>
                    {v.creditAccount.split('-')[1] || v.creditAccount}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white font-sans text-sm whitespace-nowrap">
                    {formatINR(v.amount)}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 text-[10px]">
                      {v.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onDeleteVoucher(v.id)}
                      title="Delete Voucher"
                      className="w-7 h-7 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 dark:text-gray-500 font-light">
                    No vouchers match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Subtotal */}
        <div className="p-3.5 bg-slate-50 dark:bg-[#18181c] border-t border-slate-200 dark:border-[#3a494b]/20 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-gray-400 font-bold">
            Showing {filtered.length} posted vouchers
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-gray-400">Total Filtered Turnover:</span>
            <span className="text-base font-bold text-emerald-600 dark:text-[#00e476]">{formatINR(totalDebits)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
