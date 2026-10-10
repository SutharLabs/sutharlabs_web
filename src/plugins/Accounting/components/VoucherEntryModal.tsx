import React, { useState, useEffect } from 'react';
import { VoucherType, AccountingVoucher, PartyCustomer } from '../types.js';
import { formatINR } from '../gstEngine.js';

interface VoucherEntryModalProps {
  initialType?: VoucherType;
  editingVoucher?: AccountingVoucher | null;
  parties: PartyCustomer[];
  userToken: string;
  onClose: () => void;
  onVoucherCreated: (voucher: AccountingVoucher) => void;
  onVoucherUpdated?: (voucher: AccountingVoucher) => void;
}

const ACCOUNT_PRESETS = [
  { code: '1010-BANK-HDFC', name: 'HDFC Bank Current Account', type: 'Bank' },
  { code: '1020-CASH-OFFICE', name: 'Office Petty Cash in Hand', type: 'Cash' },
  { code: '1100-AR-DEBTORS', name: 'Trade Receivables (Sundry Debtors)', type: 'Receivable' },
  { code: '2100-AP-CREDITORS', name: 'Trade Payables (Sundry Creditors)', type: 'Payable' },
  { code: '4000-REV-SALES', name: 'Sales & Cloud Engineering Revenue', type: 'Revenue' },
  { code: '4100-REV-CONSULTING', name: 'Quantitative Consulting Revenue', type: 'Revenue' },
  { code: '5000-PURCHASES', name: 'Hardware & Inward Purchases', type: 'Expense' },
  { code: '5100-EXP-CLOUD', name: 'Cloud Server & Compute Infrastructure (AWS)', type: 'Expense' },
  { code: '5200-EXP-SALARIES', name: 'Engineering & Staff Salaries', type: 'Expense' },
  { code: '5300-EXP-RENT', name: 'Office Rent & Infrastructure Utilities', type: 'Expense' },
  { code: '5400-EXP-DEP', name: 'Depreciation & Amortization Expense', type: 'Expense' },
  { code: '1590-ACCUM-DEP', name: 'Accumulated Depreciation - Hardware', type: 'Liability' }
];

export default function VoucherEntryModal({
  initialType = 'Payment',
  editingVoucher = null,
  parties,
  userToken,
  onClose,
  onVoucherCreated,
  onVoucherUpdated
}: VoucherEntryModalProps) {
  const isEditMode = Boolean(editingVoucher);

  const [voucherType, setVoucherType] = useState<VoucherType>(
    editingVoucher ? editingVoucher.voucherType : initialType
  );
  const [date, setDate] = useState(
    editingVoucher ? editingVoucher.date : new Date().toISOString().split('T')[0]
  );
  const [referenceNo, setReferenceNo] = useState(editingVoucher?.referenceNo || '');
  const [partyId, setPartyId] = useState(editingVoucher?.partyId || '');
  const [amount, setAmount] = useState(editingVoucher ? String(editingVoucher.amount) : '');
  const [taxAmount, setTaxAmount] = useState(
    editingVoucher?.taxAmount !== undefined ? String(editingVoucher.taxAmount) : ''
  );
  const [paymentMode, setPaymentMode] = useState<AccountingVoucher['paymentMode']>(
    editingVoucher?.paymentMode || 'Bank Transfer'
  );
  const [narration, setNarration] = useState(
    editingVoucher?.narration || 'Being operational payment made via banking channel.'
  );
  const [editNote, setEditNote] = useState('');
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accounts selection defaults based on voucher type
  const [debitAccount, setDebitAccount] = useState<string>(() => {
    if (editingVoucher) return editingVoucher.debitAccount;
    if (voucherType === 'Payment') return '5100-EXP-CLOUD';
    if (voucherType === 'Receipt') return '1010-BANK-HDFC';
    if (voucherType === 'Contra') return '1020-CASH-OFFICE';
    if (voucherType === 'Purchase') return '5000-PURCHASES';
    return '5100-EXP-CLOUD';
  });

  const [creditAccount, setCreditAccount] = useState<string>(() => {
    if (editingVoucher) return editingVoucher.creditAccount;
    if (voucherType === 'Payment') return '1010-BANK-HDFC';
    if (voucherType === 'Receipt') return '1100-AR-DEBTORS';
    if (voucherType === 'Contra') return '1010-BANK-HDFC';
    if (voucherType === 'Purchase') return '2100-AP-CREDITORS';
    return '1010-BANK-HDFC';
  });

  const handleTypeChange = (type: VoucherType) => {
    setVoucherType(type);
    if (!editingVoucher) {
      if (type === 'Payment') {
        setDebitAccount('5100-EXP-CLOUD');
        setCreditAccount('1010-BANK-HDFC');
        setNarration('Being operational payment made via banking channel.');
      } else if (type === 'Receipt') {
        setDebitAccount('1010-BANK-HDFC');
        setCreditAccount('1100-AR-DEBTORS');
        setNarration('Being payment received from customer against outstanding receivables.');
      } else if (type === 'Contra') {
        setDebitAccount('1020-CASH-OFFICE');
        setCreditAccount('1010-BANK-HDFC');
        setNarration('Being cash withdrawn from HDFC Bank for office petty cash.');
      } else if (type === 'Journal') {
        setDebitAccount('5400-EXP-DEP');
        setCreditAccount('1590-ACCUM-DEP');
        setNarration('Being monthly adjustment and depreciation provision posted.');
      } else if (type === 'Purchase') {
        setDebitAccount('5000-PURCHASES');
        setCreditAccount('2100-AP-CREDITORS');
        setNarration('Being inward goods and cloud hardware bill entered.');
      }
    }
  };

  // Keyboard shortcut listener to switch voucher types or close modal with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' || (e.altKey && e.key === '4')) {
        e.preventDefault();
        e.stopPropagation();
        handleTypeChange('Contra');
      } else if (e.key === 'F5' || (e.altKey && e.key === '5')) {
        e.preventDefault();
        e.stopPropagation();
        handleTypeChange('Payment');
      } else if (e.key === 'F6' || (e.altKey && e.key === '6')) {
        e.preventDefault();
        e.stopPropagation();
        handleTypeChange('Receipt');
      } else if (e.key === 'F7' || (e.altKey && e.key === '7')) {
        e.preventDefault();
        e.stopPropagation();
        handleTypeChange('Journal');
      } else if (e.key === 'F9' || (e.altKey && e.key === '9')) {
        e.preventDefault();
        e.stopPropagation();
        handleTypeChange('Purchase');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingVoucher]);

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;
    if (isEditMode && !editNote.trim()) {
      alert('Statutory audit trail requirement: Please provide a reason / edit note for altering this voucher.');
      return;
    }

    setIsSubmitting(true);

    try {
      const party = parties.find(p => p.id === partyId);
      const payload = {
        voucherType,
        date,
        referenceNo,
        partyId,
        partyName: party?.name,
        debitAccount,
        creditAccount,
        amount: numAmount,
        taxAmount: parseFloat(taxAmount) || 0,
        paymentMode,
        narration,
        editNote: editNote.trim()
      };

      if (isEditMode && editingVoucher) {
        const res = await fetch(`/api/plugins/wp_accounting/vouchers/${encodeURIComponent(editingVoucher.id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updated = await res.json();
          if (onVoucherUpdated) onVoucherUpdated(updated);
          onClose();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update voucher');
        }
      } else {
        const res = await fetch('/api/plugins/wp_accounting/vouchers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          onVoucherCreated(created);
          onClose();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to post voucher');
        }
      }
    } catch (err) {
      console.error('Voucher save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentVersion = editingVoucher?.version || 1;
  const nextVersion = currentVersion + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#121215] text-slate-900 dark:text-[#e5e1e4] border border-slate-200 dark:border-[#3a494b]/30 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col font-sans">
        
        {/* Top Header */}
        <div className={`border-b px-6 py-4 flex items-center justify-between shrink-0 ${
          isEditMode
            ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15'
            : 'bg-slate-50 dark:bg-[#18181c] border-slate-200 dark:border-[#3a494b]/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              isEditMode
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                : 'bg-primary/10 dark:bg-[#00dbe7]/15 border-primary/30 dark:border-[#00dbe7]/40 text-primary dark:text-[#00dbe7]'
            }`}>
              <span className="material-symbols-outlined text-xl">
                {isEditMode ? 'edit_note' : 'receipt'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isEditMode ? `Alter Voucher: ${editingVoucher?.voucherNumber}` : 'Accounting Voucher Entry'}
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isEditMode
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300'
                }`}>
                  {isEditMode ? `Revision v${nextVersion}` : 'Tally / SAP Core'}
                </span>
              </h2>
              <p className="text-[11px] font-mono text-slate-500 dark:text-gray-400">
                {isEditMode
                  ? 'All edits create an immutable Section 128 audit trail entry with your reason notes'
                  : 'Double-Entry General Journal posting under Section 128'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#201f21] dark:hover:bg-[#2e2d31] border border-slate-200 dark:border-[#3a494b]/30 flex items-center justify-center text-slate-500 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Tally Voucher Type Selector Bar */}
          <div>
            <label className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-gray-400 block mb-2">
              Select Voucher Classification (Hotkeys F4–F9 or Alt+4–9)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['Contra', 'Payment', 'Receipt', 'Journal', 'Purchase'] as VoucherType[]).map(type => {
                const isActive = voucherType === type;
                const hotkeyMap: Record<string, string> = {
                  Contra: 'F4',
                  Payment: 'F5',
                  Receipt: 'F6',
                  Journal: 'F7',
                  Purchase: 'F9'
                };
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-mono ${
                      isActive
                        ? 'border-primary dark:border-[#00dbe7] bg-primary/10 dark:bg-[#00dbe7]/15 shadow-sm'
                        : 'border-slate-200 dark:border-[#3a494b]/30 bg-slate-50 dark:bg-[#18181c] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-gray-400">
                      <span className="font-bold">{type}</span>
                      <span className="px-1 py-0.5 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 text-[9px]">
                        {hotkeyMap[type]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date, Reference, Party Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary dark:focus:border-[#00dbe7]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">
                Ref No / Cheque / UTR
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-982104"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary dark:focus:border-[#00dbe7]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">
                Associated Party / Client
              </label>
              <select
                value={partyId}
                onChange={e => setPartyId(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary dark:focus:border-[#00dbe7]"
              >
                <option value="">-- General / Direct Ledger --</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.partyType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Double Entry Accounts: Debit (By) and Credit (To) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#3a494b]/30 bg-slate-50 dark:bg-[#18181c]/70 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-gray-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-cyan-600 dark:text-[#00dbe7]">balance</span>
              Double-Entry General Ledger Postings
            </h3>

            {/* Debit Account (Dr) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-3">
                <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-[#00e476] font-mono font-bold text-[11px] block text-center">
                  DEBIT (By / Dr)
                </span>
              </div>
              <div className="sm:col-span-9">
                <select
                  value={debitAccount}
                  onChange={e => setDebitAccount(e.target.value)}
                  className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                >
                  {ACCOUNT_PRESETS.map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Credit Account (Cr) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-3">
                <span className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-[#00dbe7] font-mono font-bold text-[11px] block text-center">
                  CREDIT (To / Cr)
                </span>
              </div>
              <div className="sm:col-span-9">
                <select
                  value={creditAccount}
                  onChange={e => setCreditAccount(e.target.value)}
                  className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                >
                  {ACCOUNT_PRESETS.map(acc => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amount & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">
                Amount (₹ INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg pl-7 pr-3 py-2 text-slate-900 dark:text-white font-bold text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">GST Tax Included (Optional)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={taxAmount}
                onChange={e => setTaxAmount(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value as any)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none h-[42px]"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI Digital Payment</option>
                <option value="Cheque">Banker Cheque</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Journal Adjustment">Non-Cash Adjustment</option>
              </select>
            </div>
          </div>

          {/* Tally Narration */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-gray-400 block mb-1">
              Narration (Tally Prime / SAP Remark Note)
            </label>
            <textarea
              rows={2}
              value={narration}
              onChange={e => setNarration(e.target.value)}
              placeholder="Being payment made towards..."
              className="w-full bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-primary dark:focus:border-[#00dbe7]"
            />
          </div>

          {/* Section 128 Audit Trail Edit Note (Mandatory when altering an existing entry) */}
          {isEditMode && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-500/15 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-amber-600 dark:text-amber-400">history_edu</span>
                <label className="text-xs font-mono font-bold uppercase text-amber-800 dark:text-amber-300">
                  Reason for Alteration / Edit Note (Audit Trail)*
                </label>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                Under MCA Audit Trail rules, an unalterable log entry will be saved with this reason.
              </p>
              <input
                type="text"
                required
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="e.g., Rectified bank account allocation per bank statement reconciliation"
                className="w-full bg-white dark:bg-[#121215] border border-amber-500/40 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-600"
              />
            </div>
          )}

          {/* Audit History Accordion if previously modified */}
          {editingVoucher?.editHistory && editingVoucher.editHistory.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-[#3a494b]/30 bg-slate-50 dark:bg-[#18181c] p-3 text-xs font-mono">
              <button
                type="button"
                onClick={() => setShowAuditTrail(!showAuditTrail)}
                className="w-full flex justify-between items-center text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm text-cyan-600 dark:text-[#00dbe7]">history</span>
                  View Previous Revision Logs ({editingVoucher.editHistory.length})
                </span>
                <span className="material-symbols-outlined text-sm">
                  {showAuditTrail ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showAuditTrail && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#3a494b]/20 space-y-2">
                  {editingVoucher.editHistory.map((hist, i) => (
                    <div key={i} className="p-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/5 text-[11px]">
                      <div className="flex justify-between text-slate-500 dark:text-gray-400 text-[10px]">
                        <span className="font-bold text-amber-600 dark:text-amber-400">v{hist.version}</span>
                        <span>{new Date(hist.editedAt).toLocaleString()}</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-gray-200 mt-0.5">"{hist.editNote}"</p>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                        Prev Amount: {formatINR(hist.previousAmount)} | Dr: {hist.previousDebitAccount} / Cr: {hist.previousCreditAccount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Balancing Verification Preview */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 font-mono text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-500 dark:text-gray-400 block text-[10px]">Dual-Entry Balancing Equation:</span>
              <span className="font-bold text-slate-800 dark:text-white">
                Dr. {debitAccount.split('-')[1]} = Cr. {creditAccount.split('-')[1]}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-gray-400 block text-[10px]">Net Transaction Value:</span>
              <span className="text-base font-bold text-emerald-600 dark:text-[#00e476]">{formatINR(numAmount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#3a494b]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#201f21] dark:hover:bg-[#2e2d31] text-xs font-mono text-slate-700 dark:text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                isEditMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-primary hover:brightness-110 dark:bg-[#00e476] text-white dark:text-[#00210c] shadow-primary/20 dark:shadow-[#00e476]/20'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isEditMode ? 'save_as' : 'post_add'}
              </span>
              {isSubmitting
                ? (isEditMode ? 'Saving Revision...' : 'Posting Voucher...')
                : (isEditMode ? `Save Alteration (Rev v${nextVersion})` : `Post ${voucherType} Voucher`)}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
