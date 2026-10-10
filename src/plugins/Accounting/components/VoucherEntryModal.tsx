import React, { useState, useEffect } from 'react';
import { VoucherType, AccountingVoucher, PartyCustomer } from '../types.js';
import { formatINR } from '../gstEngine.js';

interface VoucherEntryModalProps {
  initialType?: VoucherType;
  parties: PartyCustomer[];
  userToken: string;
  onClose: () => void;
  onVoucherCreated: (voucher: AccountingVoucher) => void;
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
  parties,
  userToken,
  onClose,
  onVoucherCreated
}: VoucherEntryModalProps) {
  const [voucherType, setVoucherType] = useState<VoucherType>(initialType);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<AccountingVoucher['paymentMode']>('Bank Transfer');
  const [narration, setNarration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accounts selection defaults based on voucher type
  const [debitAccount, setDebitAccount] = useState<string>(() => {
    if (voucherType === 'Payment') return '5100-EXP-CLOUD';
    if (voucherType === 'Receipt') return '1010-BANK-HDFC';
    if (voucherType === 'Contra') return '1020-CASH-OFFICE';
    if (voucherType === 'Purchase') return '5000-PURCHASES';
    return '5100-EXP-CLOUD';
  });

  const [creditAccount, setCreditAccount] = useState<string>(() => {
    if (voucherType === 'Payment') return '1010-BANK-HDFC';
    if (voucherType === 'Receipt') return '1100-AR-DEBTORS';
    if (voucherType === 'Contra') return '1010-BANK-HDFC';
    if (voucherType === 'Purchase') return '2100-AP-CREDITORS';
    return '1010-BANK-HDFC';
  });

  const handleTypeChange = (type: VoucherType) => {
    setVoucherType(type);
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
  }, []);

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;
    setIsSubmitting(true);

    try {
      const party = parties.find(p => p.id === partyId);
      const res = await fetch('/api/plugins/wp_accounting/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({
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
          narration
        })
      });

      if (res.ok) {
        const created = await res.json();
        onVoucherCreated(created);
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to post voucher');
      }
    } catch (err) {
      console.error('Voucher creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#121215] text-slate-900 dark:text-[#e5e1e4] border border-slate-200 dark:border-[#3a494b]/30 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col font-sans">
        
        {/* Top Header */}
        <div className="bg-slate-50 dark:bg-[#18181c] border-b border-slate-200 dark:border-[#3a494b]/20 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-[#00dbe7]/15 border border-primary/30 dark:border-[#00dbe7]/40 flex items-center justify-center text-primary dark:text-[#00dbe7]">
              <span className="material-symbols-outlined text-xl">receipt</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Accounting Voucher Entry
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300">
                  Tally / SAP Core
                </span>
              </h2>
              <p className="text-[11px] font-mono text-slate-500 dark:text-gray-400">
                Double-Entry General Journal posting under Section 128
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
            <label className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-gray-400 block mb-1.5">
              Select Voucher Type (Tally Function Keys)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {[
                { type: 'Payment', key: 'F5', color: 'border-rose-400 text-rose-600 dark:text-rose-400' },
                { type: 'Receipt', key: 'F6', color: 'border-emerald-400 text-emerald-600 dark:text-[#00e476]' },
                { type: 'Contra', key: 'F4', color: 'border-cyan-400 text-cyan-600 dark:text-[#00dbe7]' },
                { type: 'Journal', key: 'F7', color: 'border-purple-400 text-purple-600 dark:text-[#ebb2ff]' },
                { type: 'Purchase', key: 'F9', color: 'border-amber-400 text-amber-600 dark:text-amber-400' },
                { type: 'Credit Note', key: 'Cr', color: 'border-blue-400 text-blue-600 dark:text-blue-400' }
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleTypeChange(item.type as VoucherType)}
                  className={`p-2.5 rounded-xl border text-xs font-mono font-bold text-center transition-all cursor-pointer ${
                    voucherType === item.type
                      ? 'bg-primary/10 dark:bg-[#00dbe7]/15 border-primary dark:border-[#00dbe7] text-primary dark:text-[#74f5ff] shadow-sm'
                      : 'bg-slate-50 dark:bg-[#18181c] border-slate-200 dark:border-[#3a494b]/20 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#201f21]'
                  }`}
                >
                  <span className="text-[9px] block opacity-70">[{item.key}]</span>
                  <span>{item.type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Core Voucher Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-[#3a494b]/20 text-xs font-mono">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Posting Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary dark:focus:border-[#00dbe7]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Ref / Chq / UTR No.</label>
              <input
                type="text"
                placeholder="UTR-4892019"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary dark:focus:border-[#00dbe7]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Party / Entity (Optional)</label>
              <select
                value={partyId}
                onChange={e => setPartyId(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">-- Direct Ledger Account --</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.partyType})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Double-Entry Accounts Pairing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-[#3a494b]/20 text-xs font-mono">
            {/* Debit Account (By / Dr) */}
            <div className="space-y-1.5">
              <span className="font-bold text-emerald-600 dark:text-[#00e476] uppercase tracking-wider text-[11px] block">
                [Dr.] Debit Account (Receiving / Expense)
              </span>
              <select
                value={debitAccount}
                onChange={e => setDebitAccount(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none"
              >
                {ACCOUNT_PRESETS.map(acc => (
                  <option key={acc.code} value={acc.code}>[{acc.type}] {acc.code} — {acc.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 dark:text-gray-400">
                Debit increases assets & expenses, decreases liabilities.
              </span>
            </div>

            {/* Credit Account (To / Cr) */}
            <div className="space-y-1.5">
              <span className="font-bold text-purple-600 dark:text-[#ebb2ff] uppercase tracking-wider text-[11px] block">
                [Cr.] Credit Account (Giving / Income)
              </span>
              <select
                value={creditAccount}
                onChange={e => setCreditAccount(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-slate-900 dark:text-white focus:outline-none"
              >
                {ACCOUNT_PRESETS.map(acc => (
                  <option key={acc.code} value={acc.code}>[{acc.type}] {acc.code} — {acc.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 dark:text-gray-400">
                Credit increases revenue, equity & liabilities, decreases assets.
              </span>
            </div>
          </div>

          {/* Amount & Payment Mode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Voucher Amount (₹ INR) *</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="45000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-base font-bold text-slate-900 dark:text-white text-right focus:outline-none focus:border-primary dark:focus:border-[#00dbe7]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">GST / Tax Component (Optional ₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={taxAmount}
                onChange={e => setTaxAmount(e.target.value)}
                className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-slate-900 dark:text-white text-right focus:outline-none"
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

          {/* Tally Narration (The signature of Tally) */}
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
              className="px-6 py-2.5 rounded-lg bg-primary hover:brightness-110 dark:bg-[#00e476] text-white dark:text-[#00210c] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 dark:shadow-[#00e476]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">post_add</span>
              {isSubmitting ? 'Posting Voucher...' : `Post ${voucherType} Voucher`}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
