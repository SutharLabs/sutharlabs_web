import React, { useState, useEffect, useCallback } from 'react';
import { GSTInvoice, CompanyProfile, PartyCustomer, ItemMaster, VoucherType, AccountingVoucher } from '../plugins/Accounting/types.js';
import { formatINR } from '../plugins/Accounting/gstEngine.js';
import TaxInvoiceModal from '../plugins/Accounting/components/TaxInvoiceModal.js';
import CreateInvoiceDrawer from '../plugins/Accounting/components/CreateInvoiceDrawer.js';
import VoucherEntryModal from '../plugins/Accounting/components/VoucherEntryModal.js';
import DayBookView from '../plugins/Accounting/components/DayBookView.js';
import FinancialStatementsView from '../plugins/Accounting/components/FinancialStatementsView.js';
import GstrReportsView from '../plugins/Accounting/components/GstrReportsView.js';
import GeneralLedgerView from '../plugins/Accounting/components/GeneralLedgerView.js';
import PartyMasterView from '../plugins/Accounting/components/PartyMasterView.js';
import ItemCatalogView from '../plugins/Accounting/components/ItemCatalogView.js';
import CompanySettingsModal from '../plugins/Accounting/components/CompanySettingsModal.js';
import CollapsibleLogDrawer from './CollapsibleLogDrawer.js';
import { TerminalLog } from '../types.js';

interface AccountingViewProps {
  logs?: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userToken: string;
}

export default function AccountingView({ logs = [], onAddLog, userToken }: AccountingViewProps) {
  // Navigation tabs across the Tally / SAP Enterprise Suite
  const [activeTab, setActiveTab] = useState<'DayBook' | 'Statements' | 'Invoices' | 'GSTR' | 'Ledger' | 'Parties' | 'Catalog'>('DayBook');

  // Core Data States
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [parties, setParties] = useState<PartyCustomer[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<ItemMaster[]>([]);
  const [vouchers, setVouchers] = useState<AccountingVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Issued' | 'Draft'>('ALL');
  const [taxFilter, setTaxFilter] = useState<'ALL' | 'INTRA' | 'INTER'>('ALL');

  // Modals & Drawers
  const [selectedInvoice, setSelectedInvoice] = useState<GSTInvoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherInitialType, setVoucherInitialType] = useState<VoucherType>('Payment');
  const [dataRefreshCounter, setDataRefreshCounter] = useState(0);

  // Fetch initial accounting master datasets
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${userToken}` };

      const [invRes, compRes, partRes, itemsRes, vouchersRes] = await Promise.all([
        fetch('/api/plugins/wp_accounting/invoices', { headers }),
        fetch('/api/plugins/wp_accounting/company', { headers }),
        fetch('/api/plugins/wp_accounting/customers', { headers }),
        fetch('/api/plugins/wp_accounting/items', { headers }),
        fetch('/api/plugins/wp_accounting/vouchers', { headers })
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(Array.isArray(invData) ? invData : []);
      }
      if (compRes.ok) {
        const compData = await compRes.json();
        if (compData && typeof compData === 'object' && !compData.error) {
          setCompany(compData);
        }
      }
      if (partRes.ok) {
        const partData = await partRes.json();
        setParties(Array.isArray(partData) ? partData : []);
      }
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItemsCatalog(Array.isArray(itemsData) ? itemsData : []);
      }
      if (vouchersRes.ok) {
        const vouchersData = await vouchersRes.json();
        setVouchers(Array.isArray(vouchersData) ? vouchersData : []);
      }
    } catch (err) {
      console.error('Failed to load accounting data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, dataRefreshCounter]);

  // Invoice Handlers
  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/plugins/wp_accounting/invoices/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        },
        body: JSON.stringify({ status: 'Paid' })
      });

      if (res.ok) {
        const updated = await res.json();
        setInvoices(prev => (Array.isArray(prev) ? prev.map(i => i.id === id ? updated : i) : [updated]));
        if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice(updated);
        }
        setDataRefreshCounter(c => c + 1);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
          message: `ACCOUNTING: Invoice [${id}] marked as PAID. Reconciled ${formatINR(updated.grandTotal)} in receivables.`
        });
      }
    } catch (err) {
      console.error('Failed to update invoice status:', err);
    }
  };

  const handleDeleteInvoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete invoice ${id}?`)) return;

    try {
      const res = await fetch(`/api/plugins/wp_accounting/invoices/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (res.ok) {
        setInvoices(prev => (Array.isArray(prev) ? prev.filter(i => i.id !== id) : []));
        setDataRefreshCounter(c => c + 1);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `ACCOUNTING: Invoice [${id}] has been removed from ledger.`
        });
      }
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    try {
      const res = await fetch(`/api/plugins/wp_accounting/vouchers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (res.ok) {
        setVouchers(prev => (Array.isArray(prev) ? prev.filter(v => v.id !== id) : []));
        setDataRefreshCounter(c => c + 1);
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'ALERT',
          message: `ACCOUNTING: Voucher [${id}] cancelled and removed.`
        });
      }
    } catch (err) {
      console.error('Failed to delete voucher:', err);
    }
  };

  const handleInvoiceCreated = (newInv: GSTInvoice) => {
    setInvoices(prev => (Array.isArray(prev) ? [newInv, ...prev] : [newInv]));
    setDataRefreshCounter(c => c + 1);
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `ACCOUNTING: Issued GST Tax Invoice ${newInv.invoiceNumber} to [${newInv.buyer.legalName}] for ${formatINR(newInv.grandTotal)}. IRN: ${newInv.eInvoice?.irn.slice(0, 12)}...`
    });
  };

  // Launch voucher modal with specific type
  const openVoucherEntry = (type: VoucherType = 'Payment') => {
    setVoucherInitialType(type);
    setIsVoucherModalOpen(true);
  };

  // Safe invoice collections
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  // Aggregated KPI Metrics
  const totalInvoiced = safeInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalTaxable = safeInvoices.reduce((sum, i) => sum + (i.taxableAmount || 0), 0);
  const totalCGST = safeInvoices.reduce((sum, i) => sum + (i.cgstTotal || 0), 0);
  const totalSGST = safeInvoices.reduce((sum, i) => sum + (i.sgstTotal || 0), 0);
  const totalIGST = safeInvoices.reduce((sum, i) => sum + (i.igstTotal || 0), 0);
  const totalPaid = safeInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalOutstanding = safeInvoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  // Filtered List
  const filteredInvoices = safeInvoices.filter(item => {
    if (!item) return false;
    const matchesSearch =
      (item.buyer?.legalName && item.buyer.legalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.buyer?.gstin && item.buyer.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.placeOfSupplyStateName && item.placeOfSupplyStateName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;

    const matchesTax =
      taxFilter === 'ALL' ||
      (taxFilter === 'INTER' && item.isInterState) ||
      (taxFilter === 'INTRA' && !item.isInterState);

    return matchesSearch && matchesStatus && matchesTax;
  });

  return (
    <div className="flex-grow flex flex-col gap-5 text-slate-900 dark:text-[#e5e1e4]">
      {/* Top Banner & Control Deck */}
      <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-[#3a494b]/30 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/15 via-purple-500/15 to-emerald-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-[#00dbe7] shadow-md shadow-cyan-500/5">
            <span className="material-symbols-outlined text-2xl">account_balance</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-sans text-slate-900 dark:text-white tracking-tight">
                Enterprise Accounting & ERP Suite
              </h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00e476] border border-emerald-500/20">
                Tally Prime & SAP ERP Parity
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-gray-400">
              {company ? `${company.legalName} • GSTIN: ${company.gstin} (${company.stateName} - ${company.stateCode})` : 'Loading enterprise profile...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#18181c] dark:hover:bg-[#201f21] border border-slate-200 dark:border-[#3a494b]/30 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            GST Settings
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-[#00e476] dark:hover:brightness-110 text-white dark:text-[#00210c] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Issue GST Invoice
          </button>
        </div>
      </div>

      {/* Tally Prime & SAP Voucher Action Hotbar */}
      <div className="bg-slate-50 dark:bg-[#16161a] p-3 rounded-xl border border-slate-200 dark:border-[#3a494b]/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-500 dark:text-gray-400 tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-cyan-600 dark:text-[#00dbe7]">keyboard</span>
            Voucher Entry (Tally Hotkeys):
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => openVoucherEntry('Contra')}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f1f24] hover:bg-cyan-50 dark:hover:bg-cyan-950/30 border border-cyan-400/30 text-cyan-700 dark:text-[#74f5ff] font-mono text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Contra Voucher (F4) - Bank to Cash / Bank to Bank transfers"
          >
            <span className="px-1 py-0.2 rounded bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 text-[9px]">F4</span>
            Contra
          </button>
          <button
            onClick={() => openVoucherEntry('Payment')}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f1f24] hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-400/30 text-rose-700 dark:text-rose-400 font-mono text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Payment Voucher (F5) - Cash or Bank outflow"
          >
            <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 text-[9px]">F5</span>
            Payment
          </button>
          <button
            onClick={() => openVoucherEntry('Receipt')}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f1f24] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-400/30 text-emerald-700 dark:text-[#00e476] font-mono text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Receipt Voucher (F6) - Cash or Bank collections"
          >
            <span className="px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-[9px]">F6</span>
            Receipt
          </button>
          <button
            onClick={() => openVoucherEntry('Journal')}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f1f24] hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-purple-400/30 text-purple-700 dark:text-[#ebb2ff] font-mono text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Journal Voucher (F7) - Adjustments & depreciation"
          >
            <span className="px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-[9px]">F7</span>
            Journal
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f1f24] hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-blue-400/30 text-blue-700 dark:text-blue-400 font-mono text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Sales Voucher (F8) - Tax Invoices"
          >
            <span className="px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-[9px]">F8</span>
            Sales (Tax Invoice)
          </button>
          <button
            onClick={() => openVoucherEntry('Purchase')}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f1f24] hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-400/30 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Purchase Voucher (F9) - Inward goods & expenses"
          >
            <span className="px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[9px]">F9</span>
            Purchase
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-[#3a494b]/20 pb-2 scrollbar-hide">
        {[
          { id: 'DayBook', label: 'Day Book (Vouchers)', icon: 'menu_book' },
          { id: 'Statements', label: 'Financial Statements (BS / P&L / TB)', icon: 'query_stats' },
          { id: 'Invoices', label: 'Tax Invoices Ledger', icon: 'receipt_long' },
          { id: 'GSTR', label: 'GST Returns (GSTR-1 / 3B)', icon: 'assignment' },
          { id: 'Ledger', label: 'General Ledger Book', icon: 'balance' },
          { id: 'Parties', label: 'Customers & Vendors', icon: 'domain' },
          { id: 'Catalog', label: 'Items & HSN Catalog', icon: 'inventory_2' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-50 dark:bg-[#00dbe7]/15 border border-cyan-400 dark:border-[#00dbe7]/50 text-cyan-800 dark:text-[#74f5ff] shadow-xs'
                : 'bg-white dark:bg-[#131316] border border-slate-200 dark:border-[#3a494b]/20 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB 1: DAY BOOK (VOUCHERS) ==================== */}
      {activeTab === 'DayBook' && (
        <DayBookView
          vouchers={vouchers}
          userToken={userToken}
          onOpenVoucherModal={openVoucherEntry}
          onDeleteVoucher={handleDeleteVoucher}
        />
      )}

      {/* ==================== TAB 2: FINANCIAL STATEMENTS ==================== */}
      {activeTab === 'Statements' && (
        <FinancialStatementsView
          userToken={userToken}
        />
      )}

      {/* ==================== TAB 3: INVOICES LEDGER ==================== */}
      {activeTab === 'Invoices' && (
        <div className="space-y-5 animate-fade-in">
          {/* Dynamic Indian Rupee KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Invoiced */}
            <div className="bg-white dark:bg-[#121215] p-4 rounded-xl border border-slate-200 dark:border-[#3a494b]/30 border-l-4 border-l-cyan-500 flex flex-col justify-center shadow-xs">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-1 block">
                Total Turnover (Gross)
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-sans block">
                {formatINR(totalInvoiced)}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 mt-1">
                Taxable: {formatINR(totalTaxable)}
              </span>
            </div>

            {/* Total Taxes Collected */}
            <div className="bg-white dark:bg-[#121215] p-4 rounded-xl border border-slate-200 dark:border-[#3a494b]/30 border-l-4 border-l-purple-500 flex flex-col justify-center shadow-xs">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-1 block">
                Output GST Liability
              </span>
              <span className="text-xl font-bold text-purple-700 dark:text-[#ebb2ff] font-sans block">
                {formatINR(totalCGST + totalSGST + totalIGST)}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 mt-1 flex gap-2">
                <span>CGST: {formatINR(totalCGST)}</span>
                <span>SGST: {formatINR(totalSGST)}</span>
              </span>
            </div>

            {/* Paid Inflow */}
            <div className="bg-white dark:bg-[#121215] p-4 rounded-xl border border-slate-200 dark:border-[#3a494b]/30 border-l-4 border-l-emerald-500 flex flex-col justify-center shadow-xs">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-1 block">
                Realized Collections
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-[#00e476] font-sans block">
                {formatINR(totalPaid)}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-[#00e476]/80 mt-1">
                Settled to Bank Account
              </span>
            </div>

            {/* Outstanding Receivables */}
            <div className="bg-white dark:bg-[#121215] p-4 rounded-xl border border-slate-200 dark:border-[#3a494b]/30 border-l-4 border-l-amber-500 flex flex-col justify-center shadow-xs">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-1 block">
                Trade Receivables Due
              </span>
              <span className="text-xl font-bold text-amber-700 dark:text-[#fde047] font-sans block">
                {formatINR(totalOutstanding)}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 mt-1">
                Awaiting Buyer Payment
              </span>
            </div>
          </div>

          {/* Proportional GST Tax Weight Chart */}
          <div className="bg-white dark:bg-[#121215] rounded-xl p-5 border border-slate-200 dark:border-[#3a494b]/30 flex flex-col gap-3 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#3a494b]/20">
              <h3 className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600 dark:text-[#00dbe7] text-base">bar_chart</span>
                Invoice Payout Distribution & Tax Slices
              </h3>
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400">
                Real-time proportional scale in Indian Rupees (₹)
              </span>
            </div>

            <div className="h-[130px] relative rounded-lg bg-slate-50 dark:bg-[#18181c] flex items-end p-4 border border-slate-200/60 dark:border-transparent">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 130" preserveAspectRatio="none">
                {safeInvoices.map((inv, idx) => {
                  const xUnit = 500 / (safeInvoices.length || 1);
                  const xPos = idx * xUnit + (xUnit / 5);
                  const barWidth = xUnit * 0.6;

                  const maxVal = Math.max(...safeInvoices.map(i => i.grandTotal), 400000);
                  const barHeight = Math.max(15, (inv.grandTotal / maxVal) * 90);
                  const yPos = 130 - barHeight - 15;

                  const isPaid = inv.status === 'Paid';
                  const barColor = isPaid ? '#10b981' : inv.isInterState ? '#a855f7' : '#06b6d4';

                  return (
                    <g key={inv.id} className="cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                      <rect
                        x={xPos}
                        y={yPos}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        fill={barColor}
                        opacity="0.25"
                      />
                      <rect
                        x={xPos}
                        y={yPos}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        fill={barColor}
                        opacity="0.85"
                      />
                      <text
                        x={xPos + barWidth / 2}
                        y={yPos - 4}
                        fill="currentColor"
                        className="text-slate-700 dark:text-white"
                        fontSize="8"
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        ₹{(inv.grandTotal / 1000).toFixed(0)}k
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-1 left-0 right-0 flex justify-between px-4 font-mono text-[8px] text-slate-500 dark:text-gray-400">
                {safeInvoices.map(i => (
                  <span key={i.id} className="truncate max-w-[80px]">{i.invoiceNumber.split('/').pop()}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Ledger Table Container */}
          <div className="bg-white dark:bg-[#121215] p-5 rounded-xl border border-slate-200 dark:border-[#3a494b]/30 space-y-4 shadow-xs">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex-1 bg-slate-50 dark:bg-[#18181c] rounded-lg border border-slate-200 dark:border-[#3a494b]/30 flex items-center px-3 py-1.5 focus-within:border-cyan-500">
                <span className="material-symbols-outlined text-sm text-slate-400 dark:text-gray-400 mr-2">search</span>
                <input
                  type="text"
                  placeholder="Search ledger by client, invoice number, state, or GSTIN..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs font-mono text-slate-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="Paid">Cleared / Paid</option>
                  <option value="Issued">Issued / Pending</option>
                  <option value="Draft">Draft</option>
                </select>

                {/* Tax Supply Filter */}
                <select
                  value={taxFilter}
                  onChange={e => setTaxFilter(e.target.value as any)}
                  className="bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs font-mono text-slate-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="ALL">All Jurisdictions</option>
                  <option value="INTRA">Intra-State (CGST+SGST)</option>
                  <option value="INTER">Inter-State (IGST)</option>
                </select>
              </div>
            </div>

            {/* Invoices Data Grid */}
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-[#3a494b]/20">
              <table className="w-full text-left font-mono text-xs border-collapse divide-y divide-slate-200 dark:divide-[#3a494b]/15">
                <thead className="bg-slate-50 dark:bg-[#18181c] text-slate-600 dark:text-gray-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Recipient Customer</th>
                    <th className="p-3">Place of Supply (POS)</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">Total GST (₹)</th>
                    <th className="p-3 text-right">Invoice Total (₹)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/10 bg-white dark:bg-[#121215]">
                  {filteredInvoices.map(inv => {
                    const isPaid = inv.status === 'Paid';

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      >
                        <td className="p-3">
                          <span className="font-bold text-cyan-600 dark:text-[#00dbe7] block">{inv.invoiceNumber}</span>
                          {inv.eInvoice && (
                            <span className="text-[9px] text-slate-500 dark:text-gray-400 font-mono flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px] text-emerald-600 dark:text-[#00e476]">verified</span>
                              IRN Gen
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-gray-400">{inv.invoiceDate}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 dark:text-white font-sans block">{inv.buyer.legalName}</span>
                          <span className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">{inv.buyer.gstin || 'B2C Retail'}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-700 dark:text-gray-300 block">{inv.placeOfSupplyStateName}</span>
                          <span className={`text-[9px] font-bold ${inv.isInterState ? 'text-purple-600 dark:text-[#ce5dff]' : 'text-cyan-600 dark:text-[#00dbe7]'}`}>
                            {inv.isInterState ? 'IGST (Inter-State)' : 'CGST+SGST (Intra)'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-slate-700 dark:text-gray-300">
                          {formatINR(inv.taxableAmount).replace('₹ ', '')}
                        </td>
                        <td className="p-3 text-right text-slate-500 dark:text-gray-400">
                          {formatINR(inv.totalTax).replace('₹ ', '')}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white text-sm">
                          {formatINR(inv.grandTotal)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#00e476] border-emerald-500/30'
                              : 'bg-purple-500/10 text-purple-700 dark:text-[#ebb2ff] border-purple-500/30'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              title="View & Print Rule 46 Tax Invoice"
                              className="w-7 h-7 rounded hover:bg-cyan-50 dark:hover:bg-[#00dbe7]/20 text-slate-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-[#00dbe7] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">print</span>
                            </button>

                            {!isPaid && (
                              <button
                                onClick={() => handleMarkPaid(inv.id)}
                                title="Mark Paid"
                                className="w-7 h-7 rounded hover:bg-emerald-50 dark:hover:bg-[#00e476]/20 text-slate-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-[#00e476] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                              </button>
                            )}

                            <button
                              onClick={e => handleDeleteInvoice(inv.id, e)}
                              title="Delete Record"
                              className="w-7 h-7 rounded hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-400 dark:text-gray-500 font-light">
                        No invoice ledger entries match filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: GSTR COMPLIANCE ==================== */}
      {activeTab === 'GSTR' && <GstrReportsView userToken={userToken} />}

      {/* ==================== TAB 5: GENERAL LEDGER ==================== */}
      {activeTab === 'Ledger' && <GeneralLedgerView userToken={userToken} />}

      {/* ==================== TAB 6: PARTIES (CUSTOMERS & VENDORS) ==================== */}
      {activeTab === 'Parties' && (
        <PartyMasterView
          parties={parties}
          userToken={userToken}
          onPartyAdded={newParty => {
            setParties(prev => (Array.isArray(prev) ? [newParty, ...prev] : [newParty]));
            onAddLog({
              timestamp: new Date().toLocaleTimeString(),
              type: 'SUCCESS',
              message: `ACCOUNTING: Registered party customer [${newParty.name}] (${newParty.stateName}).`
            });
          }}
        />
      )}

      {/* ==================== TAB 7: ITEMS & HSN CATALOG ==================== */}
      {activeTab === 'Catalog' && (
        <ItemCatalogView
          items={itemsCatalog}
          userToken={userToken}
          onItemAdded={newItem => {
            setItemsCatalog(prev => (Array.isArray(prev) ? [newItem, ...prev] : [newItem]));
            onAddLog({
              timestamp: new Date().toLocaleTimeString(),
              type: 'SUCCESS',
              message: `ACCOUNTING: Added catalog item [${newItem.name}] (HSN: ${newItem.hsnSacCode}).`
            });
          }}
        />
      )}

      {/* Financial Audit Logs Drawer */}
      <CollapsibleLogDrawer
        title="FINANCIAL AUDIT & STATUTORY GST LEDGER LOGS"
        logs={logs}
        defaultExpanded={false}
      />

      {/* Voucher Entry Modal (Tally Prime / SAP F4-F9) */}
      {isVoucherModalOpen && (
        <VoucherEntryModal
          initialType={voucherInitialType}
          userToken={userToken}
          parties={parties}
          onClose={() => setIsVoucherModalOpen(false)}
          onVoucherCreated={v => {
            setVouchers(prev => (Array.isArray(prev) ? [v, ...prev] : [v]));
            setDataRefreshCounter(c => c + 1);
            onAddLog({
              timestamp: new Date().toLocaleTimeString(),
              type: 'SUCCESS',
              message: `ACCOUNTING [${v.voucherType}]: Voucher ${v.voucherNumber} created. Dr: ${v.debitAccount} / Cr: ${v.creditAccount} for ${formatINR(v.amount)}.`
            });
          }}
        />
      )}

      {/* Rule 46 Tax Invoice Modal */}
      {selectedInvoice && (
        <TaxInvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {/* Invoice Studio Creator Drawer */}
      {isCreateOpen && company && (
        <CreateInvoiceDrawer
          company={company}
          parties={parties}
          itemsCatalog={itemsCatalog}
          userToken={userToken}
          onClose={() => setIsCreateOpen(false)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}

      {/* Company Settings Modal */}
      {isSettingsOpen && company && (
        <CompanySettingsModal
          company={company}
          userToken={userToken}
          onClose={() => setIsSettingsOpen(false)}
          onCompanyUpdated={updated => {
            setCompany(updated);
            onAddLog({
              timestamp: new Date().toLocaleTimeString(),
              type: 'INFO',
              message: `ACCOUNTING: Company settings updated for [${updated.legalName}].`
            });
          }}
        />
      )}
    </div>
  );
}
