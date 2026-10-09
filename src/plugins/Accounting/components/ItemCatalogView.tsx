import React, { useState } from 'react';
import { ItemMaster } from '../types.js';
import { COMMON_HSN_SAC_CATALOG, GSTRate, formatINR } from '../gstEngine.js';

interface ItemCatalogViewProps {
  items: ItemMaster[];
  userToken: string;
  onItemAdded: (item: ItemMaster) => void;
}

export default function ItemCatalogView({ items, userToken, onItemAdded }: ItemCatalogViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemMaster['type']>('Services');
  const [hsnSacCode, setHsnSacCode] = useState('998313');
  const [unit, setUnit] = useState('HRS');
  const [unitPrice, setUnitPrice] = useState('5000');
  const [gstRate, setGstRate] = useState<GSTRate>(18);
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');

  const handleSelectPredefinedHsn = (entryCode: string) => {
    const entry = COMMON_HSN_SAC_CATALOG.find(h => h.code === entryCode);
    if (!entry) return;
    setHsnSacCode(entry.code);
    setType(entry.type === 'HSN' ? 'Goods' : 'Services');
    setUnit(entry.defaultUnit);
    setGstRate(entry.defaultRate);
    if (!name) setName(entry.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unitPrice) return;

    try {
      const res = await fetch('/api/plugins/wp_accounting/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          code: code || `SKU-${Date.now().toString().slice(-4)}`,
          name,
          type,
          hsnSacCode,
          unit,
          unitPrice: parseFloat(unitPrice),
          gstRate,
          description
        })
      });

      if (res.ok) {
        const created = await res.json();
        onItemAdded(created);
        setIsAdding(false);
        setCode('');
        setName('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.hsnSacCode.includes(search) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 font-mono text-xs animate-fade-in text-slate-900 dark:text-[#e5e1e4]">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:max-w-md bg-white dark:bg-[#18181c] rounded-xl border border-slate-200 dark:border-[#3a494b]/30 flex items-center px-3.5 py-2 focus-within:border-cyan-500 shadow-xs">
          <span className="material-symbols-outlined text-sm text-slate-400 dark:text-gray-400 mr-2">search</span>
          <input
            type="text"
            placeholder="Search items by name, SKU, or HSN/SAC code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none w-full"
          />
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 dark:bg-[#00dbe7] text-white dark:text-[#00210c] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 hover:brightness-110 cursor-pointer transition-all"
        >
          <span className="material-symbols-outlined text-sm">add_box</span>
          {isAdding ? 'Cancel' : 'Add Catalog Item'}
        </button>
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white dark:bg-[#131316] border border-slate-200 dark:border-[#3a494b]/30 space-y-4 shadow-sm animate-fade-in">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-[#00e476] text-base">inventory_2</span>
            Register Item in HSN/SAC Master Catalog
          </h3>

          {/* Quick HSN suggestions */}
          <div>
            <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">
              Select Standard HSN/SAC Classification
            </label>
            <select
              onChange={e => handleSelectPredefinedHsn(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">-- Choose standard Goods/Services code --</option>
              {COMMON_HSN_SAC_CATALOG.map(h => (
                <option key={h.code} value={h.code}>
                  [{h.type}: {h.code}] {h.description} (Default {h.defaultRate}%)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Item / SKU Code</label>
              <input
                type="text"
                placeholder="SKU-8471"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white uppercase focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Item Title / Service Name *</label>
              <input
                type="text"
                required
                placeholder="Machine Learning Workflow Engineering"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Item Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Services">Services (SAC)</option>
                <option value="Goods">Goods (HSN)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">HSN / SAC Code *</label>
              <input
                type="text"
                required
                value={hsnSacCode}
                onChange={e => setHsnSacCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Unit of Measure (UQC)</label>
              <input
                type="text"
                required
                value={unit}
                onChange={e => setUnit(e.target.value.toUpperCase())}
                placeholder="HRS / NOS / MTH"
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white uppercase focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Standard Rate (₹) *</label>
              <input
                type="number"
                required
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white text-right focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Default GST Slab (%)</label>
              <select
                value={gstRate}
                onChange={e => setGstRate(parseInt(e.target.value, 10) as GSTRate)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18% (Standard Services)</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-[#00e476] text-white dark:text-[#00210c] font-bold uppercase tracking-wider rounded-xl text-xs hover:brightness-110 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              Save Item in Catalog
            </button>
          </div>
        </form>
      )}

      {/* Items Table */}
      <div className="bg-white dark:bg-[#121215] rounded-xl overflow-hidden border border-slate-200 dark:border-[#3a494b]/30 shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 dark:bg-[#18181c] text-[10px] text-slate-600 dark:text-gray-400 uppercase border-b border-slate-200 dark:border-[#3a494b]/20">
            <tr>
              <th className="p-3">SKU Code</th>
              <th className="p-3">Item Description</th>
              <th className="p-3">Classification</th>
              <th className="p-3">HSN / SAC</th>
              <th className="p-3 text-center">Unit</th>
              <th className="p-3 text-right">Standard Rate (₹)</th>
              <th className="p-3 text-center">GST Slab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/15 bg-white dark:bg-[#121215]">
            {filtered.map(i => (
              <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="p-3 font-mono font-bold text-cyan-700 dark:text-[#00dbe7]">{i.code}</td>
                <td className="p-3 text-slate-900 dark:text-white font-sans font-medium">{i.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    i.type === 'Services'
                      ? 'bg-purple-500/10 text-purple-700 dark:text-[#ebb2ff] border-purple-500/30'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-[#00e476] border-emerald-500/30'
                  }`}>
                    {i.type}
                  </span>
                </td>
                <td className="p-3 font-bold text-slate-800 dark:text-white">{i.hsnSacCode}</td>
                <td className="p-3 text-center text-slate-500 dark:text-gray-400 uppercase">{i.unit}</td>
                <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{formatINR(i.unitPrice)}</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-bold text-[10px] border border-slate-200 dark:border-white/10">
                    {i.gstRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
