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
    <div className="space-y-4 font-mono text-xs animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:max-w-md bg-[#18181c] rounded-lg border border-[#3a494b]/30 flex items-center px-3 py-1.5 focus-within:border-[#00dbe7]">
          <span className="material-symbols-outlined text-sm text-gray-400 mr-2">search</span>
          <input
            type="text"
            placeholder="Search items by name, SKU, or HSN/SAC code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none w-full"
          />
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 rounded-lg bg-[#00dbe7] text-[#00210c] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add_box</span>
          {isAdding ? 'Cancel' : 'Add Catalog Item'}
        </button>
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-[#131316] border border-[#3a494b]/30 space-y-3 animate-fade-in">
          <h3 className="font-bold text-sm text-white font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00e476] text-base">inventory_2</span>
            Register Item in HSN/SAC Master Catalog
          </h3>

          {/* Quick HSN suggestions */}
          <div>
            <label className="text-[10px] text-gray-400 uppercase block mb-1">
              Select Standard HSN/SAC Classification
            </label>
            <select
              onChange={e => handleSelectPredefinedHsn(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#3a494b]/30 rounded p-2 text-xs text-white focus:outline-none"
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
              <label className="text-[10px] text-gray-400 uppercase block mb-1">Item / SKU Code</label>
              <input
                type="text"
                placeholder="SKU-8471"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#3a494b]/30 rounded p-2 text-white uppercase focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-gray-400 uppercase block mb-1">Item Title / Service Name *</label>
              <input
                type="text"
                required
                placeholder="Machine Learning Workflow Engineering"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#3a494b]/30 rounded p-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase block mb-1">Item Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-[#0a0a0c] border border-[#3a494b]/30 rounded p-2 text-white focus:outline-none"
              >
                <option value="Services">Services (SAC)</option>
                <option value="Goods">Goods (HSN)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase block mb-1">HSN / SAC Code *</label>
              <input
                type="text"
                required
                value={hsnSacCode}
                onChange={e => setHsnSacCode(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#3a494b]/30 rounded p-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase block mb-1">Unit of Measure (UQC)</label>
              <input
                type="text"
                required
                value={unit}
                onChange={e => setUnit(e.target.value.toUpperCase())}
                placeholder="HRS / NOS / MTH"
                className="w-full bg-[#0a0a0c] border border-[#3a494b]/30 rounded p-2 text-white uppercase focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase block mb-1">Standard Rate (₹) *</label>
              <input
                type="number"
                required
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#3a494b]/30 rounded p-2 text-white text-right focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase block mb-1">Default GST Slab (%)</label>
              <select
                value={gstRate}
                onChange={e => setGstRate(parseInt(e.target.value, 10) as GSTRate)}
                className="w-full bg-[#0a0a0c] border border-[#3a494b]/30 rounded p-2 text-white focus:outline-none"
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
              className="px-4 py-2 bg-[#00e476] text-[#00210c] font-bold uppercase tracking-wider rounded text-xs hover:brightness-110 cursor-pointer"
            >
              Save Item in Catalog
            </button>
          </div>
        </form>
      )}

      {/* Items Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-outline/15">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#18181c] text-[10px] text-gray-400 uppercase">
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
          <tbody className="divide-y divide-[#3a494b]/15 bg-surface-container-low/40">
            {filtered.map(i => (
              <tr key={i.id} className="hover:bg-white/[0.02]">
                <td className="p-3 font-mono font-bold text-[#00dbe7]">{i.code}</td>
                <td className="p-3 text-white font-sans font-medium">{i.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    i.type === 'Services'
                      ? 'bg-[#ce5dff]/15 text-[#ebb2ff] border-[#ce5dff]/30'
                      : 'bg-[#00e476]/15 text-[#00e476] border-[#00e476]/30'
                  }`}>
                    {i.type}
                  </span>
                </td>
                <td className="p-3 font-bold text-white">{i.hsnSacCode}</td>
                <td className="p-3 text-center text-gray-400 uppercase">{i.unit}</td>
                <td className="p-3 text-right font-bold text-white">{formatINR(i.unitPrice)}</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
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
