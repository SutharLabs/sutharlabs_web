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
  editingInvoice?: GSTInvoice | null;
  onClose: () => void;
  onInvoiceCreated: (invoice: GSTInvoice) => void;
  onInvoiceUpdated?: (invoice: GSTInvoice) => void;
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
  editingInvoice = null,
  onClose,
  onInvoiceCreated,
  onInvoiceUpdated
}: CreateInvoiceDrawerProps) {
  const isEditMode = Boolean(editingInvoice);

  // Buyer selection
  const [selectedPartyId, setSelectedPartyId] = useState<string>(() => {
    if (editingInvoice?.buyer.customerId) return editingInvoice.buyer.customerId;
    return parties[0]?.id || '';
  });
  const [isNewParty, setIsNewParty] = useState(() => {
    if (editingInvoice) {
      return !editingInvoice.buyer.customerId && Boolean(editingInvoice.buyer.legalName);
    }
    return false;
  });
  const [newPartyName, setNewPartyName] = useState(editingInvoice?.buyer.legalName || '');
  const [newPartyGstin, setNewPartyGstin] = useState(editingInvoice?.buyer.gstin || '');
  const [newPartyStateCode, setNewPartyStateCode] = useState(
    editingInvoice?.buyer.stateCode || company.stateCode
  );
  const [newPartyAddress, setNewPartyAddress] = useState(
    editingInvoice?.buyer.billingAddress || ''
  );
  const [gstinError, setGstinError] = useState<string | null>(null);

  // Supply characteristics
  const [placeOfSupply, setPlaceOfSupply] = useState(
    editingInvoice?.placeOfSupplyStateCode || company.stateCode
  );
  const [invoiceDate, setInvoiceDate] = useState(
    editingInvoice?.invoiceDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    editingInvoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(
    editingInvoice?.notes || 'Payment is due within 30 days via NEFT/RTGS or UPI.'
  );
  const [status, setStatus] = useState<GSTInvoice['status']>(
    editingInvoice?.status || 'Issued'
  );
  const [editNote, setEditNote] = useState('');
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<DraftLineItem[]>(() => {
    if (editingInvoice?.items && editingInvoice.items.length > 0) {
      return editingInvoice.items.map((item, idx) => ({
        id: `row_${idx + 1}`,
        itemDescription: item.itemDescription,
        hsnSacCode: item.hsnSacCode,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        discountPercent: item.discountPercent || 0,
        gstRate: item.gstRate
      }));
    }
    return [
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
    ];
  });

  // Sync place of supply when party changes
  useEffect(() => {
    if (!isNewParty && selectedPartyId && !editingInvoice) {
      const party = parties.find(p => p.id === selectedPartyId);
      if (party) {
        setPlaceOfSupply(party.stateCode);
      }
    }
  }, [selectedPartyId, isNewParty, parties, editingInvoice]);

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
    if (isEditMode && !editNote.trim()) {
      alert('Statutory audit trail requirement: Please provide a reason / edit note for amending this Tax Invoice.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        invoiceDate,
        dueDate,
        placeOfSupplyStateCode: placeOfSupply,
        status,
        notes,
        editNote: editNote.trim(),
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

      if (isEditMode && editingInvoice) {
        const res = await fetch(`/api/plugins/wp_accounting/invoices/${encodeURIComponent(editingInvoice.id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updated = await res.json();
          if (onInvoiceUpdated) onInvoiceUpdated(updated);
          onClose();
        } else {
          const errData = await res.json();
          alert(errData.error || 'Failed to update invoice.');
        }
      } else {
        const res = await fetch('/api/plugins/wp_accounting/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`
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
      }
    } catch (err) {
      console.error('Invoice save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentVersion = editingInvoice?.version || 1;
  const nextVersion = currentVersion + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#111113] text-slate-900 dark:text-[#e5e1e4] border border-slate-200 dark:border-[#3a494b]/30 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className={`border-b px-6 py-4 flex items-center justify-between shrink-0 ${
          isEditMode
            ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15'
            : 'bg-slate-50 dark:bg-[#18181c] border-slate-200 dark:border-[#3a494b]/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              isEditMode
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-[#00e476]'
            }`}>
              <span className="material-symbols-outlined text-lg">
                {isEditMode ? 'edit_document' : 'add_circle'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                {isEditMode ? `Amend Tax Invoice: ${editingInvoice?.invoiceNumber}` : 'Issue GST Tax Invoice (Sales Entry)'}
                {isEditMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Revision v{nextVersion}
                  </span>
                )}
              </h2>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Customer / Recipient Party Details */}
          <div className="bg-slate-50 dark:bg-[#18181c]/70 border border-slate-200 dark:border-[#3a494b]/30 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-gray-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-cyan-600 dark:text-[#00dbe7]">person</span>
                1. Recipient (Buyer) Profile & Identification
              </span>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer text-slate-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={isNewParty}
                    onChange={e => setIsNewParty(e.target.checked)}
                    className="rounded border-slate-300 dark:border-gray-600 text-cyan-600 focus:ring-0"
                  />
                  <span>Manual / One-Time Buyer Entry</span>
                </label>
              </div>
            </div>

            {!isNewParty ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block mb-1">
                    Select from Registered Party Master
                  </label>
                  <select
                    value={selectedPartyId}
                    onChange={e => setSelectedPartyId(e.target.value)}
                    className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.gstin ? `(${p.gstin})` : '(Unregistered B2C)'} - {p.stateName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block mb-1">
                    Buyer Jurisdiction State
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 text-xs font-mono text-slate-700 dark:text-gray-300 flex justify-between">
                    <span>
                      {parties.find(p => p.id === selectedPartyId)?.stateName || 'Gujarat'}
                    </span>
                    <span className="font-bold text-cyan-700 dark:text-[#00dbe7]">
                      State Code: {parties.find(p => p.id === selectedPartyId)?.stateCode || company.stateCode}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block mb-1">Buyer Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Corporation Pvt Ltd"
                    value={newPartyName}
                    onChange={e => setNewPartyName(e.target.value)}
                    className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block mb-1">Buyer GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="27AABCT3518Q1ZV"
                    value={newPartyGstin}
                    onChange={e => handleGstinChange(e.target.value)}
                    className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 uppercase"
                  />
                  {gstinError && (
                    <span className="text-[10px] text-rose-500 font-mono block mt-1">{gstinError}</span>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block mb-1">Buyer State</label>
                  <select
                    value={newPartyStateCode}
                    onChange={e => {
                      setNewPartyStateCode(e.target.value);
                      setPlaceOfSupply(e.target.value);
                    }}
                    className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    {INDIAN_GST_STATES.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block mb-1">Billing & Delivery Address</label>
                  <input
                    type="text"
                    placeholder="Building, Road, City, Pincode"
                    value={newPartyAddress}
                    onChange={e => setNewPartyAddress(e.target.value)}
                    className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Invoice Metadata & Supply Characteristics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#18181c]/70 border border-slate-200 dark:border-[#3a494b]/30 rounded-2xl p-5 font-mono text-xs">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Invoice Date</label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Payment Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Place of Supply (POS) *</label>
              <select
                value={placeOfSupply}
                onChange={e => setPlaceOfSupply(e.target.value)}
                className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              >
                {INDIAN_GST_STATES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">GST Tax Framework</label>
              <div className={`p-2.5 rounded-xl border font-bold flex items-center justify-between ${
                isInterState
                  ? 'bg-purple-500/10 text-purple-700 dark:text-[#ce5dff] border-purple-500/30'
                  : 'bg-cyan-500/10 text-cyan-700 dark:text-[#00dbe7] border-cyan-500/30'
              }`}>
                <span>{isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra)'}</span>
                <span className="material-symbols-outlined text-sm">
                  {isInterState ? 'flight_takeoff' : 'domain'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Itemized Line Items Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold uppercase text-slate-700 dark:text-gray-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-cyan-600 dark:text-[#00dbe7]">inventory_2</span>
                2. Goods & Services Itemization (Section 31 Schedule)
              </span>

              <button
                type="button"
                onClick={handleAddLine}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#201f21] dark:hover:bg-[#2e2d31] border border-slate-200 dark:border-[#3a494b]/30 text-xs font-mono font-bold text-cyan-700 dark:text-[#00dbe7] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Line Item
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#3a494b]/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse divide-y divide-slate-200 dark:divide-[#3a494b]/20">
                  <thead className="bg-slate-50 dark:bg-[#18181c] text-slate-600 dark:text-gray-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5 w-12">#</th>
                      <th className="p-2.5 min-w-[200px]">Description & Preset</th>
                      <th className="p-2.5 w-24">HSN / SAC</th>
                      <th className="p-2.5 w-20">Qty</th>
                      <th className="p-2.5 w-20">Unit</th>
                      <th className="p-2.5 w-28">Rate (₹)</th>
                      <th className="p-2.5 w-20">Disc %</th>
                      <th className="p-2.5 w-24">GST Rate</th>
                      <th className="p-2.5 text-right w-28">Taxable (₹)</th>
                      <th className="p-2.5 text-right w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/10 bg-white dark:bg-[#121215]">
                    {calculatedItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                        <td className="p-2.5 text-slate-400 text-center">{idx + 1}</td>
                        <td className="p-2.5 space-y-1">
                          <input
                            type="text"
                            required
                            placeholder="Service or Product Title"
                            value={item.itemDescription}
                            onChange={e => handleUpdateLine(item.id, { itemDescription: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                          <select
                            onChange={e => handleSelectCatalogItem(item.id, e.target.value)}
                            defaultValue=""
                            className="w-full bg-transparent text-[10px] text-slate-500 dark:text-gray-400 border-none p-0 focus:outline-none cursor-pointer"
                          >
                            <option value="" disabled>-- Pick from Catalog Presets --</option>
                            {itemsCatalog.map(cat => (
                              <option key={cat.id} value={cat.code}>
                                {cat.name} ({cat.hsnSacCode}) - ₹{cat.unitPrice}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            required
                            value={item.hsnSacCode}
                            onChange={e => handleUpdateLine(item.id, { hsnSacCode: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none text-center"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={e => handleUpdateLine(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none text-center"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={item.unit}
                            onChange={e => handleUpdateLine(item.id, { unit: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="HRS">HRS</option>
                            <option value="NOS">NOS</option>
                            <option value="PCS">PCS</option>
                            <option value="MTH">MTH</option>
                            <option value="KGS">KGS</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.rate}
                            onChange={e => handleUpdateLine(item.id, { rate: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none text-right font-bold"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={e => handleUpdateLine(item.id, { discountPercent: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none text-center"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={item.gstRate}
                            onChange={e => handleUpdateLine(item.id, { gstRate: parseFloat(e.target.value) as GSTRate })}
                            className="w-full bg-slate-50 dark:bg-[#18181c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="0">0% (Nil)</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatINR(item.taxableValue).replace('₹ ', '')}
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(item.id)}
                            disabled={lineItems.length <= 1}
                            className="w-6 h-6 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30 inline-flex items-center justify-center cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 128 Audit Trail Edit Note (Mandatory when altering an existing invoice) */}
          {isEditMode && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-500/15 space-y-2 font-mono">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-amber-600 dark:text-amber-400">history_edu</span>
                <label className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">
                  Reason for Invoice Amendment / Edit Note (Recorded in Audit Trail)*
                </label>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                Under GST Rule 46 and MCA Audit Trail mandates, revising an issued tax invoice requires recording a revision justification note.
              </p>
              <input
                type="text"
                required
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="e.g. Corrected buyer billing address & updated consulting hours per amended PO"
                className="w-full bg-white dark:bg-[#121215] border border-amber-500/40 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-600"
              />
            </div>
          )}

          {/* Audit History Accordion if invoice has prior revisions */}
          {editingInvoice?.editHistory && editingInvoice.editHistory.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-[#3a494b]/30 bg-slate-50 dark:bg-[#18181c] p-3 text-xs font-mono">
              <button
                type="button"
                onClick={() => setShowAuditTrail(!showAuditTrail)}
                className="w-full flex justify-between items-center text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm text-cyan-600 dark:text-[#00dbe7]">history</span>
                  View Previous Revision Logs ({editingInvoice.editHistory.length})
                </span>
                <span className="material-symbols-outlined text-sm">
                  {showAuditTrail ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showAuditTrail && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#3a494b]/20 space-y-2">
                  {editingInvoice.editHistory.map((hist, i) => (
                    <div key={i} className="p-2 rounded bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/5 text-[11px]">
                      <div className="flex justify-between text-slate-500 dark:text-gray-400 text-[10px]">
                        <span className="font-bold text-amber-600 dark:text-amber-400">v{hist.version}</span>
                        <span>{new Date(hist.editedAt).toLocaleString()}</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-gray-200 mt-0.5">"{hist.editNote}"</p>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">
                        Prev Grand Total: {formatINR(hist.previousGrandTotal)} | Taxable: {formatINR(hist.previousTaxableAmount)} ({hist.previousItemsCount} items)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 4: Terms, Notes & Summary Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block">
                Payment Terms & Remittance Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-xl p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-[#3a494b]/20 font-mono text-[10px] text-slate-600 dark:text-gray-400">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Automated E-Invoicing & Ledger Sync:</span>
                A 64-character SHA-256 Invoice Reference Number (IRN) and signed QR code payload will be generated and synchronized with your General Day Book sales ledger.
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
              className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                isEditMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 dark:bg-[#00e476] dark:hover:brightness-110 text-white dark:text-[#00210c] shadow-emerald-500/20'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isEditMode ? 'save_as' : 'receipt'}
              </span>
              {isSubmitting
                ? (isEditMode ? 'Saving Amendment...' : 'Incepting GST Invoice...')
                : (isEditMode ? `Save Amendment (Rev v${nextVersion})` : 'Generate Tax Invoice')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
