import React, { useState, useEffect, useCallback } from 'react';
import { GSTInvoice, CompanyProfile, PartyCustomer, ItemMaster } from '../plugins/Accounting/types.js';
import { formatINR } from '../plugins/Accounting/gstEngine.js';
import TaxInvoiceModal from '../plugins/Accounting/components/TaxInvoiceModal.js';
import CreateInvoiceDrawer from '../plugins/Accounting/components/CreateInvoiceDrawer.js';
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
  // Navigation sub-tabs within the Accounting ERP suite
  const [activeTab, setActiveTab] = useState<'Invoices' | 'GSTR' | 'Ledger' | 'Parties' | 'Catalog'>('Invoices');

  // Core Data States
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [parties, setParties] = useState<PartyCustomer[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<ItemMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Issued' | 'Draft'>('ALL');
  const [taxFilter, setTaxFilter] = useState<'ALL' | 'INTRA' | 'INTER'>('ALL');

  // Modals & Drawers
  const [selectedInvoice, setSelectedInvoice] = useState<GSTInvoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch initial accounting master datasets
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${userToken}` };

      const [invRes, compRes, partRes, itemsRes] = await Promise.all([
        fetch('/api/plugins/wp_accounting/invoices', { headers }),
        fetch('/api/plugins/wp_accounting/company', { headers }),
        fetch('/api/plugins/wp_accounting/customers', { headers }),
        fetch('/api/plugins/wp_accounting/items', { headers })
      ]);

      if (invRes.ok) setInvoices(await invRes.json());
      if (compRes.ok) setCompany(await compRes.json());
      if (partRes.ok) setParties(await partRes.json());
      if (itemsRes.ok) setItemsCatalog(await itemsRes.json());
    } catch (err) {
      console.error('Failed to load accounting data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
        setInvoices(prev => prev.map(i => i.id === id ? updated : i));
        if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice(updated);
        }
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
        setInvoices(prev => prev.filter(i => i.id !== id));
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

  const handleInvoiceCreated = (newInv: GSTInvoice) => {
    setInvoices(prev => [newInv, ...prev]);
    onAddLog({
      timestamp: new Date().toLocaleTimeString(),
      type: 'SUCCESS',
      message: `ACCOUNTING: Issued GST Tax Invoice ${newInv.invoiceNumber} to [${newInv.buyer.legalName}] for ${formatINR(newInv.grandTotal)}. IRN: ${newInv.eInvoice?.irn.slice(0, 12)}...`
    });
  };

  // Aggregated KPI Metrics
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalTaxable = invoices.reduce((sum, i) => sum + i.taxableAmount, 0);
  const totalCGST = invoices.reduce((sum, i) => sum + i.cgstTotal, 0);
  const totalSGST = invoices.reduce((sum, i) => sum + i.sgstTotal, 0);
  const totalIGST = invoices.reduce((sum, i) => sum + i.igstTotal, 0);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.grandTotal, 0);
  const totalOutstanding = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.grandTotal, 0);

  // Filtered List
  const filteredInvoices = invoices.filter(item => {
    const matchesSearch =
      item.buyer.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.buyer.gstin && item.buyer.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.placeOfSupplyStateName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;

    const matchesTax =
      taxFilter === 'ALL' ||
      (taxFilter === 'INTER' && item.isInterState) ||
      (taxFilter === 'INTRA' && !item.isInterState);

    return matchesSearch && matchesStatus && matchesTax;
  });

  return (
    <div className="flex-grow flex flex-col gap-5">
      {/* Top Banner & Control Deck */}
      <div className="glass-panel p-5 rounded-xl border border-outline/15 bg-surface-container-low/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00dbe7]/20 via-[#ce5dff]/20 to-[#00e476]/20 border border-[#00dbe7]/40 flex items-center justify-center text-[#00dbe7] shadow-lg shadow-[#00dbe7]/10">
            <span className="material-symbols-outlined text-2xl">account_balance</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-sans text-white tracking-tight">
                Indian GST Accounting & ERP Suite
              </h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00e476]/15 text-[#00e476] border border-[#00e476]/30">
                ERPNext & Frappe Parity
              </span>
            </div>
            <p className="text-[11px] font-mono text-gray-400">
              {company ? `${company.legalName} • GSTIN: ${company.gstin} (${company.stateName} - ${company.stateCode})` : 'Loading enterprise profile...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-lg bg-[#18181c] hover:bg-[#201f21] border border-[#3a494b]/30 text-gray-300 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            GST Settings
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[#00e476] hover:brightness-110 text-[#00210c] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#00e476]/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Issue GST Invoice
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-[#3a494b]/20 pb-2 scrollbar-hide">
        {[
          { id: 'Invoices', label: 'Tax Invoices Ledger', icon: 'receipt_long' },
          { id: 'GSTR', label: 'GST Returns (GSTR-1 / 3B)', icon: 'assignment' },
          { id: 'Ledger', label: 'General Ledger Book', icon: 'balance' },
          { id: 'Parties', label: 'Customers (B2B / B2C)', icon: 'domain' },
          { id: 'Catalog', label: 'Items & HSN Catalog', icon: 'inventory_2' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#00dbe7]/15 border border-[#00dbe7]/50 text-[#74f5ff] shadow-sm'
                : 'bg-[#131316] border border-[#3a494b]/20 text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB 1: INVOICES LEDGER ==================== */}
      {activeTab === 'Invoices' && (
        <div className="space-y-5 animate-fade-in">
          {/* Dynamic Indian Rupee KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Invoiced */}
            <div className="glass-panel p-4 rounded-xl border-l-4 border-[#00dbe7] flex flex-col justify-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1 block">
                Total Turnover (Gross)
              </span>
              <span className="text-xl font-bold text-white font-sans block">
                {formatINR(totalInvoiced)}
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1">
                Taxable: {formatINR(totalTaxable)}
              </span>
            </div>

            {/* Total Taxes Collected */}
            <div className="glass-panel p-4 rounded-xl border-l-4 border-[#ce5dff] flex flex-col justify-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1 block">
                Output GST Liability
              </span>
              <span className="text-xl font-bold text-[#ebb2ff] font-sans block">
                {formatINR(totalCGST + totalSGST + totalIGST)}
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 flex gap-2">
                <span>CGST: {formatINR(totalCGST)}</span>
                <span>SGST: {formatINR(totalSGST)}</span>
              </span>
            </div>

            {/* Paid Inflow */}
            <div className="glass-panel p-4 rounded-xl border-l-4 border-[#00e476] flex flex-col justify-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1 block">
                Realized Collections
              </span>
              <span className="text-xl font-bold text-[#00e476] font-sans block">
                {formatINR(totalPaid)}
              </span>
              <span className="text-[10px] font-mono text-[#00e476]/80 mt-1">
                Settled to Bank Account
              </span>
            </div>

            {/* Outstanding Receivables */}
            <div className="glass-panel p-4 rounded-xl border-l-4 border-[#eab308] flex flex-col justify-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mb-1 block">
                Trade Receivables Due
              </span>
              <span className="text-xl font-bold text-[#fde047] font-sans block">
                {formatINR(totalOutstanding)}
              </span>
              <span className="text-[10px] font-mono text-gray-400 mt-1">
                Awaiting Buyer Payment
              </span>
            </div>
          </div>

          {/* Proportional GST Tax Weight Chart */}
          <div className="glass-panel rounded-xl p-5 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-[#3a494b]/20">
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00dbe7] text-base">bar_chart</span>
                Invoice Payout Distribution & Tax Slices
              </h3>
              <span className="text-[10px] font-mono text-gray-400">
                Real-time proportional scale in Indian Rupees (₹)
              </span>
            </div>

            <div className="h-[130px] relative chart-grid rounded-lg bg-surface-container-low/40 flex items-end p-4">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 130" preserveAspectRatio="none">
                {invoices.map((inv, idx) => {
                  const xUnit = 500 / (invoices.length || 1);
                  const xPos = idx * xUnit + (xUnit / 5);
                  const barWidth = xUnit * 0.6;

                  const maxVal = Math.max(...invoices.map(i => i.grandTotal), 400000);
                  const barHeight = Math.max(15, (inv.grandTotal / maxVal) * 90);
                  const yPos = 130 - barHeight - 15;

                  const isPaid = inv.status === 'Paid';
                  const barColor = isPaid ? '#00e476' : inv.isInterState ? '#ce5dff' : '#00dbe7';

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
                        fill="#ffffff"
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

              <div className="absolute bottom-1 left-0 right-0 flex justify-between px-4 font-mono text-[8px] text-gray-400">
                {invoices.map(i => (
                  <span key={i.id} className="truncate max-w-[80px]">{i.invoiceNumber.split('/').pop()}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Ledger Table Container */}
          <div className="glass-panel p-5 rounded-xl border border-outline/15 space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex-1 bg-[#18181c] rounded-lg border border-[#3a494b]/30 flex items-center px-3 py-1.5 focus-within:border-[#00dbe7]">
                <span className="material-symbols-outlined text-sm text-gray-400 mr-2">search</span>
                <input
                  type="text"
                  placeholder="Search ledger by client, invoice number, state, or GSTIN..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs font-mono text-white placeholder-gray-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-[#18181c] border border-[#3a494b]/30 rounded-lg p-1.5 text-xs font-mono text-gray-300 focus:outline-none"
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
                  className="bg-[#18181c] border border-[#3a494b]/30 rounded-lg p-1.5 text-xs font-mono text-gray-300 focus:outline-none"
                >
                  <option value="ALL">All Jurisdictions</option>
                  <option value="INTRA">Intra-State (CGST+SGST)</option>
                  <option value="INTER">Inter-State (IGST)</option>
                </select>
              </div>
            </div>

            {/* Invoices Data Grid */}
            <div className="w-full overflow-x-auto rounded-lg border border-[#3a494b]/20">
              <table className="w-full text-left font-mono text-xs border-collapse divide-y divide-[#3a494b]/15">
                <thead className="bg-[#18181c] text-gray-400 text-[10px] uppercase">
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
                <tbody className="divide-y divide-[#3a494b]/10 bg-surface-container-low/40">
                  {filteredInvoices.map(inv => {
                    const isPaid = inv.status === 'Paid';

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      >
                        <td className="p-3">
                          <span className="font-bold text-[#00dbe7] block">{inv.invoiceNumber}</span>
                          {inv.eInvoice && (
                            <span className="text-[9px] text-gray-500 font-mono flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px] text-[#00e476]">verified</span>
                              IRN Gen
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-400">{inv.invoiceDate}</td>
                        <td className="p-3">
                          <span className="font-bold text-white font-sans block">{inv.buyer.legalName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{inv.buyer.gstin || 'B2C Retail'}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-300 block">{inv.placeOfSupplyStateName}</span>
                          <span className={`text-[9px] font-bold ${inv.isInterState ? 'text-[#ce5dff]' : 'text-[#00dbe7]'}`}>
                            {inv.isInterState ? 'IGST (Inter-State)' : 'CGST+SGST (Intra)'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-gray-300">
                          {formatINR(inv.taxableAmount).replace('₹ ', '')}
                        </td>
                        <td className="p-3 text-right text-gray-400">
                          {formatINR(inv.totalTax).replace('₹ ', '')}
                        </td>
                        <td className="p-3 text-right font-bold text-white text-sm">
                          {formatINR(inv.grandTotal)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            isPaid
                              ? 'bg-[#00e476]/15 text-[#00e476] border-[#00e476]/35'
                              : 'bg-[#ce5dff]/15 text-[#ebb2ff] border-[#ce5dff]/35'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              title="View & Print Rule 46 Tax Invoice"
                              className="w-7 h-7 rounded hover:bg-[#00dbe7]/20 text-gray-400 hover:text-[#00dbe7] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">print</span>
                            </button>

                            {!isPaid && (
                              <button
                                onClick={() => handleMarkPaid(inv.id)}
                                title="Mark Paid"
                                className="w-7 h-7 rounded hover:bg-[#00e476]/20 text-gray-400 hover:text-[#00e476] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                              </button>
                            )}

                            <button
                              onClick={e => handleDeleteInvoice(inv.id, e)}
                              title="Delete Record"
                              className="w-7 h-7 rounded hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
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
                      <td colSpan={9} className="p-12 text-center text-gray-500 font-light">
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

      {/* ==================== TAB 2: GSTR COMPLIANCE ==================== */}
      {activeTab === 'GSTR' && <GstrReportsView userToken={userToken} />}

      {/* ==================== TAB 3: GENERAL LEDGER ==================== */}
      {activeTab === 'Ledger' && <GeneralLedgerView userToken={userToken} />}

      {/* ==================== TAB 4: PARTIES (CUSTOMERS) ==================== */}
      {activeTab === 'Parties' && (
        <PartyMasterView
          parties={parties}
          userToken={userToken}
          onPartyAdded={newParty => {
            setParties(prev => [newParty, ...prev]);
            onAddLog({
              timestamp: new Date().toLocaleTimeString(),
              type: 'SUCCESS',
              message: `ACCOUNTING: Registered party customer [${newParty.name}] (${newParty.stateName}).`
            });
          }}
        />
      )}

      {/* ==================== TAB 5: ITEMS & HSN CATALOG ==================== */}
      {activeTab === 'Catalog' && (
        <ItemCatalogView
          items={itemsCatalog}
          userToken={userToken}
          onItemAdded={newItem => {
            setItemsCatalog(prev => [newItem, ...prev]);
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
