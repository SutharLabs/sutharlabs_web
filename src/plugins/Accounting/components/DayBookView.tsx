import React, { useState, useEffect, useCallback } from 'react';
import { AccountingVoucher, VoucherType } from '../types.js';
import { formatINR } from '../gstEngine.js';

interface DayBookViewProps {
  vouchers?: AccountingVoucher[];
  userToken?: string;
  onOpenVoucherModal: (type?: VoucherType) => void;
  onEditVoucher?: (voucher: AccountingVoucher) => void;
  onDeleteVoucher?: (id: string) => void;
}

export default function DayBookView({
  vouchers,
  userToken,
  onOpenVoucherModal,
  onEditVoucher,
  onDeleteVoucher
}: DayBookViewProps) {
  const [internalVouchers, setInternalVouchers] = useState<AccountingVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAuditVoucher, setSelectedAuditVoucher] = useState<AccountingVoucher | null>(null);

  // Fallback internal fetch if vouchers prop is not provided or undefined
  const fetchVouchers = useCallback(async () => {
    if (!userToken) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/plugins/wp_accounting/vouchers', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInternalVouchers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch vouchers in DayBookView:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    if (!vouchers && userToken) {
      fetchVouchers();
    }
  }, [vouchers, userToken, fetchVouchers]);

  // Handle local delete if parent didn't supply onDeleteVoucher
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to cancel and delete voucher ${id}?`)) return;

    if (onDeleteVoucher) {
      onDeleteVoucher(id);
      return;
    }

    if (userToken) {
      try {
        const res = await fetch(`/api/plugins/wp_accounting/vouchers/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userToken}` }
        });
        if (res.ok) {
          setInternalVouchers(prev => prev.filter(v => v.id !== id));
        }
      } catch (err) {
        console.error('Failed to delete voucher:', err);
      }
    }
  };

  const safeVouchers = Array.isArray(vouchers)
    ? vouchers
    : Array.isArray(internalVouchers)
    ? internalVouchers
    : [];

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = safeVouchers.filter(v => {
    if (!v) return false;
    const matchesType = selectedType === 'ALL' || v.voucherType === selectedType;
    const matchesSearch =
      (v.voucherNumber && v.voucherNumber.toLowerCase().includes(search.toLowerCase())) ||
      (v.partyName && v.partyName.toLowerCase().includes(search.toLowerCase())) ||
      (v.narration && v.narration.toLowerCase().includes(search.toLowerCase())) ||
      (v.debitAccount && v.debitAccount.toLowerCase().includes(search.toLowerCase())) ||
      (v.creditAccount && v.creditAccount.toLowerCase().includes(search.toLowerCase())) ||
      (v.editNote && v.editNote.toLowerCase().includes(search.toLowerCase()));
    const matchesDate = !dateFilter || v.date === dateFilter;

    return matchesType && matchesSearch && matchesDate;
  });

  const totalDebits = filtered.reduce((s, v) => s + (v.amount || 0), 0);

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
    <div className="space-y-4 font-mono text-xs animate-fade-in text-slate-900 dark:text-[#e5e1e4]">
      
      {/* Tally Quick Action Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#3a494b]/30 bg-white dark:bg-[#121215] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-cyan-600 dark:text-[#00dbe7]">menu_book</span>
            Tally Prime General Day Book Register
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
            Real-time chronological recording of Contra, Payments, Receipts, Sales, and Journal Adjustments
          </p>
        </div>

        {/* Function Keys Hotbar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onOpenVoucherModal('Contra')}
            title="Contra Voucher (Press F4 or Alt+4)"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#3a494b]/40 bg-slate-50 hover:bg-slate-100 dark:bg-[#18181c] dark:hover:bg-[#222227] text-[11px] text-slate-700 dark:text-gray-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-600 dark:text-[#00dbe7] text-[10px]">F4</span>
            Contra
          </button>
          <button
            onClick={() => onOpenVoucherModal('Payment')}
            title="Payment Voucher (Press F5 or Alt+5)"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#3a494b]/40 bg-slate-50 hover:bg-slate-100 dark:bg-[#18181c] dark:hover:bg-[#222227] text-[11px] text-slate-700 dark:text-gray-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="px-1 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px]">F5</span>
            Payment
          </button>
          <button
            onClick={() => onOpenVoucherModal('Receipt')}
            title="Receipt Voucher (Press F6 or Alt+6)"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#3a494b]/40 bg-slate-50 hover:bg-slate-100 dark:bg-[#18181c] dark:hover:bg-[#222227] text-[11px] text-slate-700 dark:text-gray-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-[#00e476] text-[10px]">F6</span>
            Receipt
          </button>
          <button
            onClick={() => onOpenVoucherModal('Journal')}
            title="Journal Voucher (Press F7 or Alt+7)"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#3a494b]/40 bg-slate-50 hover:bg-slate-100 dark:bg-[#18181c] dark:hover:bg-[#222227] text-[11px] text-slate-700 dark:text-gray-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="px-1 py-0.2 rounded bg-purple-500/15 text-purple-600 dark:text-[#ebb2ff] text-[10px]">F7</span>
            Journal
          </button>
          <button
            onClick={() => onOpenVoucherModal('Purchase')}
            title="Purchase Voucher (Press F9 or Alt+9)"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#3a494b]/40 bg-slate-50 hover:bg-slate-100 dark:bg-[#18181c] dark:hover:bg-[#222227] text-[11px] text-slate-700 dark:text-gray-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px]">F9</span>
            Purchase
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-[#3a494b]/30 bg-white dark:bg-[#121215] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-xs">
        
        {/* Search Input */}
        <div className="flex-1 bg-slate-50 dark:bg-[#18181c] rounded-xl border border-slate-200 dark:border-[#3a494b]/30 flex items-center px-3 py-1.5 focus-within:border-cyan-500">
          <span className="material-symbols-outlined text-sm text-slate-400 dark:text-gray-400 mr-2">search</span>
          <input
            type="text"
            placeholder="Search by Voucher No, Party, Narration, Ledger code, or Edit notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none w-full"
          />
        </div>

        {/* Filter selects */}
        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2 text-xs text-slate-800 dark:text-gray-300 focus:outline-none shadow-xs"
          >
            <option value="ALL">All Types</option>
            <option value="Payment">Payments (F5)</option>
            <option value="Receipt">Receipts (F6)</option>
            <option value="Contra">Contra (F4)</option>
            <option value="Journal">Journal (F7)</option>
            <option value="Sales">Sales (F8)</option>
            <option value="Purchase">Purchase (F9)</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2 text-xs text-slate-800 dark:text-gray-300 focus:outline-none shadow-xs"
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white cursor-pointer"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="p-8 text-center text-slate-500 dark:text-gray-400">
          <span className="material-symbols-outlined text-2xl animate-spin text-cyan-600 dark:text-[#00dbe7] block mb-2">sync</span>
          Loading Day Book Vouchers...
        </div>
      )}

      {/* Vouchers Data Grid */}
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#3a494b]/30 bg-white dark:bg-[#121215] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-[#18181c] text-[10px] text-slate-600 dark:text-gray-400 uppercase border-b border-slate-200 dark:border-[#3a494b]/20">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Voucher No</th>
                <th className="p-3">Type</th>
                <th className="p-3">Particulars / Party</th>
                <th className="p-3">Debit A/C (Dr)</th>
                <th className="p-3">Credit A/C (Cr)</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3">Narration & Notes</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/10 bg-white dark:bg-[#121215]">
              {filtered.map(v => {
                const hasRevisions = (v.version && v.version > 1) || (v.editHistory && v.editHistory.length > 0);

                return (
                  <tr
                    key={v.id}
                    onClick={() => onEditVoucher && onEditVoucher(v)}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="p-3 text-slate-500 dark:text-gray-400 whitespace-nowrap">{v.date}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-cyan-700 dark:text-[#00dbe7] group-hover:underline">
                          {v.voucherNumber}
                        </span>
                        {hasRevisions && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedAuditVoucher(v);
                            }}
                            title={`Edited (Revision v${v.version || 2}) - Click to view Audit Trail`}
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-0.5 hover:bg-amber-500/25 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[10px]">history_edu</span>
                            Rev v{v.version || 2}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getTypeBadge(v.voucherType)}`}>
                        {v.voucherType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-white font-sans block">{v.partyName || 'General Entry'}</span>
                      {v.referenceNo && (
                        <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">Ref: {v.referenceNo}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-700 dark:text-[#00e476] font-medium block">{v.debitAccount}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-cyan-700 dark:text-[#74f5ff] font-medium block">{v.creditAccount}</span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                      {formatINR(v.amount)}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-gray-400 text-[11px] max-w-xs">
                      <div className="truncate">{v.narration}</div>
                      {v.editNote && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400/90 truncate flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[11px]">edit_note</span>
                          Edit: {v.editNote}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {onEditVoucher && (
                          <button
                            onClick={() => onEditVoucher(v)}
                            title="Alter / Edit Voucher"
                            className="w-7 h-7 rounded hover:bg-amber-50 dark:hover:bg-amber-500/20 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        )}
                        <button
                          onClick={e => handleDelete(v.id, e)}
                          title="Cancel and remove voucher"
                          className="w-7 h-7 rounded hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !isLoading && (
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
            <span className="text-base font-bold text-emerald-700 dark:text-[#00e476]">{formatINR(totalDebits)}</span>
          </div>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {selectedAuditVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/40 rounded-2xl p-6 shadow-2xl font-mono text-xs">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-white/10">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">history_edu</span>
                  Audit Trail: {selectedAuditVoucher.voucherNumber}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">
                  Section 128 Statutory Edit History (Current Version: v{selectedAuditVoucher.version || 1})
                </p>
              </div>
              <button
                onClick={() => setSelectedAuditVoucher(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#201f21] flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-[#00e476] block">
                  Current Active State (v{selectedAuditVoucher.version || 1})
                </span>
                <div className="text-slate-900 dark:text-white font-bold mt-1">
                  Amount: {formatINR(selectedAuditVoucher.amount)} | Dr: {selectedAuditVoucher.debitAccount} / Cr: {selectedAuditVoucher.creditAccount}
                </div>
                {selectedAuditVoucher.editNote && (
                  <p className="text-slate-600 dark:text-gray-300 mt-1 italic">
                    Reason: "{selectedAuditVoucher.editNote}"
                  </p>
                )}
                <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                  Updated: {new Date(selectedAuditVoucher.updatedAt || selectedAuditVoucher.createdAt).toLocaleString()}
                </div>
              </div>

              {selectedAuditVoucher.editHistory && selectedAuditVoucher.editHistory.length > 0 ? (
                selectedAuditVoucher.editHistory.map((hist, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-white/10">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-gray-400">
                      <span className="font-bold text-amber-600 dark:text-amber-400">Prior State (v{hist.version})</span>
                      <span>{new Date(hist.editedAt).toLocaleString()}</span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-gray-200 mt-1">
                      Edit Reason: "{hist.editNote}"
                    </p>
                    <div className="text-[11px] text-slate-600 dark:text-gray-400 mt-1">
                      Amount was: {formatINR(hist.previousAmount)} | Dr: {hist.previousDebitAccount} / Cr: {hist.previousCreditAccount}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-4">No prior revisions recorded.</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedAuditVoucher(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#201f21] text-xs font-mono font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
