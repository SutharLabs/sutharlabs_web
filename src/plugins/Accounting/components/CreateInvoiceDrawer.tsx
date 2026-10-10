import React, { useState, useEffect } from 'react';
import { CompanyProfile, PartyCustomer, ItemMaster, GSTInvoice } from '../types.js';
import {
  INDIAN_GST_STATES,
  validateGSTIN,
  determineSupplyType,
  calculateItemTaxes,
  formatINR,
  amountInWordsIndian,
  GSTRate
} from '../gstEngine.js';

interface CreateInvoiceDrawerProps {
  company: CompanyProfile;
  parties: PartyCustomer[];
  itemsCatalog: ItemMaster[];
  userToken: string;
  onClose: () => void;
  onInvoiceCreated: (invoice: GSTInvoice) => void;
}

interface DraftLineItem {
  id: string;
  itemDescription: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  gstRate: GSTRate;
}

export default function CreateInvoiceDrawer({
  company,
  parties,
  itemsCatalog,
  userToken,
  onClose,
  onInvoiceCreated
}: CreateInvoiceDrawerProps) {
  // Buyer selection
  const [selectedPartyId, setSelectedPartyId] = useState<string>(parties[0]?.id || '');
  const [isNewParty, setIsNewParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyGstin, setNewPartyGstin] = useState('');
  const [newPartyStateCode, setNewPartyStateCode] = useState(company.stateCode);
  const [newPartyAddress, setNewPartyAddress] = useState('');
  const [gstinError, setGstinError] = useState<string | null>(null);

  // Supply characteristics
  const [placeOfSupply, setPlaceOfSupply] = useState(company.stateCode);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Payment is due within 30 days via NEFT/RTGS or UPI.');
  const [status, setStatus] = useState<GSTInvoice['status']>('Issued');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([
    {
      id: 'row_1',
      itemDescription: itemsCatalog[0]?.name || 'IT Software Development Services',
      hsnSacCode: itemsCatalog[0]?.hsnSacCode || '998313',
      quantity: 10,
      unit: itemsCatalog[0]?.unit || 'HRS',
      rate: itemsCatalog[0]?.unitPrice || 4500,
      discountPercent: 0,
      gstRate: itemsCatalog[0]?.gstRate || 18
    }
  ]);

  // Sync place of supply when party changes
  useEffect(() => {
    if (!isNewParty && selectedPartyId) {
      const party = parties.find(p => p.id === selectedPartyId);
      if (party) {
        setPlaceOfSupply(party.stateCode);
      }
    }
  }, [selectedPartyId, isNewParty, parties]);

  // Validate GSTIN on the fly
  const handleGstinChange = (val: string) => {
    const uppercase = val.toUpperCase().trim();
    setNewPartyGstin(uppercase);
    if (!uppercase) {
      setGstinError(null);
      return;
    }
    const result = validateGSTIN(uppercase);
    if (!result.isValid) {
      setGstinError(result.error || 'Invalid GSTIN');
    } else {
      setGstinError(null);
      if (result.stateCode) {
        setNewPartyStateCode(result.stateCode);
        setPlaceOfSupply(result.stateCode);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const { isInterState } = determineSupplyType(company.stateCode, placeOfSupply);

  // Real-time tax and total calculations
  let grossTotal = 0;
  let totalDiscount = 0;
  let taxableTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const calculatedItems = lineItems.map(item => {
    const raw = item.quantity * item.rate;
    const disc = Math.round((raw * (item.discountPercent / 100)) * 100) / 100;
    const taxable = Math.round((raw - disc) * 100) / 100;
    const taxes = calculateItemTaxes(taxable, item.gstRate, isInterState, 0);

    grossTotal += raw;
    totalDiscount += disc;
    taxableTotal += taxable;
    cgstTotal += taxes.cgstAmount;
    sgstTotal += taxes.sgstAmount;
    igstTotal += taxes.igstAmount;

    return {
      ...item,
      rawAmount: raw,
      discountAmount: disc,
      taxableValue: taxable,
      taxes
    };
  });

  const totalTax = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = taxableTotal + totalTax;
  const words = amountInWordsIndian(grandTotal);

  // Line item modifiers
  const handleAddLine = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `row_${Date.now()}`,
        itemDescription: '',
        hsnSacCode: '998313',
        quantity: 1,
        unit: 'NOS',
        rate: 1000,
        discountPercent: 0,
        gstRate: 18
      }
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateLine = (id: string, updates: Partial<DraftLineItem>) => {
    setLineItems(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleSelectCatalogItem = (rowId: string, itemCode: string) => {
    const catalogItem = itemsCatalog.find(i => i.code === itemCode);
    if (!catalogItem) return;
    handleUpdateLine(rowId, {
      itemDescription: catalogItem.name,
      hsnSacCode: catalogItem.hsnSacCode,
      rate: catalogItem.unitPrice,
      unit: catalogItem.unit,
      gstRate: catalogItem.gstRate
    });
  };

  // Submit invoice
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0 || taxableTotal <= 0) return;
    setIsSubmitting(true);

    try {
      const payload: any = {
        invoiceDate,
        dueDate,
        placeOfSupplyStateCode: placeOfSupply,
        status,
        notes,
        items: lineItems.map(item => ({
          itemDescription: item.itemDescription || 'Professional Services',
          hsnSacCode: item.hsnSacCode || '998313',
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'NOS',
          rate: Number(item.rate) || 0,
          discountPercent: Number(item.discountPercent) || 0,
          gstRate: Number(item.gstRate) || 18
        }))
      };

      if (isNewParty) {
        payload.buyerName = newPartyName;
        payload.buyerGstin = newPartyGstin;
        payload.buyerStateCode = newPartyStateCode;
        payload.buyerAddress = newPartyAddress;
      } else {
        payload.buyerId = selectedPartyId;
      }

      const res = await fetch('/api/plugins/wp_accounting/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        onInvoiceCreated(created);
        onClose();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create invoice.');
      }
    } catch (err) {
      console.error('Invoice creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#111113] text-slate-900 dark:text-[#e5e1e4] border border-slate-200 dark:border-[#3a494b]/30 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-[#18181c] border-b border-slate-200 dark:border-[#3a494b]/20 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-[#00e476]">
              <span className="material-symbols-outlined text-lg">add_circle</span>
            </div>
            <div>
              <h2 className="text-base font-bold font-sans text-slate-900 dark:text-white">Issue GST Tax Invoice (Sales Entry)</h2>
              <p className="text-[10px] font-mono text-slate-500 dark:text-gray-400">
                Rule 46 & CBIC Compliant E-Invoicing Engine • Supplier: {company.legalName} ({company.stateName})
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Party & Supply Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-[#3a494b]/20">
            {/* Left: Customer Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] uppercase font-bold text-cyan-700 dark:text-[#00dbe7] tracking-wider">
                  Buyer (Bill To) Recipient
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewParty(!isNewParty)}
                  className="text-[10px] font-mono text-purple-600 dark:text-[#ce5dff] hover:underline cursor-pointer"
                >
                  {isNewParty ? 'Select from Saved Parties' : '+ Add New Customer'}
                </button>
              </div>

              {!isNewParty ? (
                <div>
                  <select
                    value={selectedPartyId}
                    onChange={e => setSelectedPartyId(e.target.value)}
                    className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.gstin ? `(${p.gstin})` : '(B2C)'} — {p.stateName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Customer / Company Legal Name *"
                    value={newPartyName}
                    onChange={e => setNewPartyName(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                  <div>
                    <input
                      type="text"
                      placeholder="15-digit GSTIN (e.g. 27AAACT2727Q1ZW)"
                      value={newPartyGstin}
                      onChange={e => handleGstinChange(e.target.value)}
                      maxLength={15}
                      className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white uppercase focus:outline-none focus:border-cyan-500"
                    />
                    {gstinError && (
                      <span className="text-[10px] font-mono text-rose-500 mt-1 block">{gstinError}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newPartyStateCode}
                      onChange={e => {
                        setNewPartyStateCode(e.target.value);
                        setPlaceOfSupply(e.target.value);
                      }}
                      className="bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    >
                      {INDIAN_GST_STATES.map(s => (
                        <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Billing Address"
                      value={newPartyAddress}
                      onChange={e => setNewPartyAddress(e.target.value)}
                      className="bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Place of Supply & Supply Classification */}
            <div className="space-y-3 font-mono text-xs">
              <label className="font-mono text-[10px] uppercase font-bold text-purple-700 dark:text-[#ce5dff] tracking-wider block">
                Place of Supply (POS) & Dates
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 block mb-1">Place of Supply State:</span>
                  <select
                    value={placeOfSupply}
                    onChange={e => setPlaceOfSupply(e.target.value)}
                    className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    {INDIAN_GST_STATES.map(s => (
                      <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 block mb-1">Inception Status:</span>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Issued">Issued / Pending</option>
                    <option value="Paid">Cleared / Paid</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 block mb-1">Invoice Date:</span>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 block mb-1">Payment Due Date:</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Tax Type Badge */}
              <div className={`p-2.5 rounded-lg border font-mono text-[11px] flex items-center justify-between ${
                isInterState
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-[#ebb2ff]'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-[#74f5ff]'
              }`}>
                <span>Tax Regimen:</span>
                <span className="font-bold">
                  {isInterState ? '⚡ Inter-State: IGST Applied' : '🏛️ Intra-State: CGST (50%) + SGST (50%)'}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-[#00e476] text-sm">view_list</span>
                Invoice Particulars (HSN/SAC Line Items)
              </h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#201f21] dark:hover:bg-[#2e2d31] border border-slate-200 dark:border-[#3a494b]/40 text-emerald-700 dark:text-[#00e476] font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                Add Item Row
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => {
                const calc = calculatedItems[idx];
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e0e10] border border-slate-200 dark:border-[#3a494b]/20 flex flex-col md:flex-row items-start md:items-center gap-2 text-xs font-mono"
                  >
                    <span className="text-slate-400 dark:text-gray-500 font-bold shrink-0">{idx + 1}.</span>

                    {/* Quick Catalog Preset */}
                    <div className="w-full md:w-44 shrink-0">
                      <select
                        onChange={e => handleSelectCatalogItem(item.id, e.target.value)}
                        className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-[10px] text-slate-700 dark:text-gray-300 focus:outline-none"
                      >
                        <option value="">-- Choose from Catalog --</option>
                        {itemsCatalog.map(cat => (
                          <option key={cat.code} value={cat.code}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="w-full md:flex-1">
                      <input
                        type="text"
                        placeholder="Description of Goods or Services *"
                        value={item.itemDescription}
                        onChange={e => handleUpdateLine(item.id, { itemDescription: e.target.value })}
                        required
                        className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* HSN/SAC */}
                    <div className="w-24 shrink-0">
                      <input
                        type="text"
                        placeholder="HSN/SAC"
                        value={item.hsnSacCode}
                        onChange={e => handleUpdateLine(item.id, { hsnSacCode: e.target.value })}
                        className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    {/* Qty & Unit */}
                    <div className="flex items-center gap-1 w-24 shrink-0">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => handleUpdateLine(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        className="w-14 bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white text-right focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={e => handleUpdateLine(item.id, { unit: e.target.value.toUpperCase() })}
                        className="w-10 bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-[10px] text-slate-700 dark:text-gray-300 text-center uppercase"
                      />
                    </div>

                    {/* Rate (₹) */}
                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Rate ₹"
                        value={item.rate}
                        onChange={e => handleUpdateLine(item.id, { rate: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white text-right focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* GST Slab % */}
                    <div className="w-20 shrink-0">
                      <select
                        value={item.gstRate}
                        onChange={e => handleUpdateLine(item.id, { gstRate: parseInt(e.target.value, 10) as GSTRate })}
                        className="w-full bg-white dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>

                    {/* Row Taxable & Total preview */}
                    <div className="w-28 text-right font-bold shrink-0">
                      <div className="text-emerald-700 dark:text-[#00e476]">{formatINR(calc?.taxes.totalAmount || 0)}</div>
                      <div className="text-[9px] text-slate-500 dark:text-gray-400">Tax: {formatINR(calc?.taxes.totalTax || 0)}</div>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(item.id)}
                      disabled={lineItems.length <= 1}
                      className="w-7 h-7 rounded hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 flex items-center justify-center shrink-0 disabled:opacity-30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Grid: Notes & Summary Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-[#3a494b]/20">
            {/* Notes */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-slate-500 dark:text-gray-400 uppercase">Invoice Remarks & Instructions</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-[#3a494b]/20 font-mono text-[10px] text-slate-600 dark:text-gray-400">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Automated E-Invoicing:</span>
                A 64-character SHA-256 Invoice Reference Number (IRN) and signed QR code payload will be automatically generated upon creation.
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-gray-400">Taxable Value:</span>
                <span className="text-slate-900 dark:text-white font-bold">{formatINR(taxableTotal)}</span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-cyan-700 dark:text-[#00dbe7]">Central Tax (CGST):</span>
                    <span className="text-slate-900 dark:text-white">{formatINR(cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-cyan-700 dark:text-[#00dbe7]">State Tax (SGST):</span>
                    <span className="text-slate-900 dark:text-white">{formatINR(sgstTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-[11px]">
                  <span className="text-purple-700 dark:text-[#ce5dff]">Integrated Tax (IGST):</span>
                  <span className="text-slate-900 dark:text-white">{formatINR(igstTotal)}</span>
                </div>
              )}

              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-[#3a494b]/20">
                <span className="text-slate-500 dark:text-gray-400">Total Tax:</span>
                <span className="text-slate-900 dark:text-white font-bold">{formatINR(totalTax)}</span>
              </div>

              <div className="flex justify-between pt-2 border-t-2 border-cyan-500 dark:border-[#00dbe7]/40 text-sm">
                <span className="font-bold text-slate-900 dark:text-white uppercase">Grand Total:</span>
                <span className="font-black text-lg text-emerald-700 dark:text-[#00e476]">{formatINR(grandTotal)}</span>
              </div>

              <div className="pt-1 text-[10px] text-slate-500 dark:text-gray-400 italic">
                {words}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#3a494b]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#201f21] dark:hover:bg-[#2e2d31] text-xs font-mono text-slate-700 dark:text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || taxableTotal <= 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-[#00e476] dark:hover:brightness-110 text-white dark:text-[#00210c] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">receipt</span>
              {isSubmitting ? 'Incepting GST Invoice...' : 'Generate Tax Invoice'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
