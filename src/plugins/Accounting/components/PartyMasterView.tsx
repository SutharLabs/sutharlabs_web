import React, { useState } from 'react';
import { PartyCustomer } from '../types.js';
import { INDIAN_GST_STATES, validateGSTIN } from '../gstEngine.js';

interface PartyMasterViewProps {
  parties?: PartyCustomer[];
  userToken: string;
  onPartyAdded: (party: PartyCustomer) => void;
}

export default function PartyMasterView({ parties = [], userToken, onPartyAdded }: PartyMasterViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateCode, setStateCode] = useState('24');
  const [billingAddress, setBillingAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [partyType, setPartyType] = useState<PartyCustomer['partyType']>('B2B');
  const [gstinError, setGstinError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleGstinChange = (val: string) => {
    const cleaned = val.toUpperCase().trim();
    setGstin(cleaned);
    if (!cleaned) {
      setGstinError(null);
      return;
    }
    const valResult = validateGSTIN(cleaned);
    if (!valResult.isValid) {
      setGstinError(valResult.error || 'Invalid GSTIN');
    } else {
      setGstinError(null);
      if (valResult.stateCode) {
        setStateCode(valResult.stateCode);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch('/api/plugins/wp_accounting/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          name,
          tradeName,
          gstin,
          stateCode,
          billingAddress,
          email,
          phone,
          partyType: gstin ? partyType : 'B2C'
        })
      });

      if (res.ok) {
        const created = await res.json();
        onPartyAdded(created);
        setIsAdding(false);
        setName('');
        setTradeName('');
        setGstin('');
        setBillingAddress('');
        setEmail('');
        setPhone('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add party');
      }
    } catch (err) {
      console.error('Failed to create customer party:', err);
    }
  };

  const safeParties = Array.isArray(parties) ? parties : [];
  const filtered = safeParties.filter(p =>
    (p?.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
    (p?.gstin && p.gstin.toLowerCase().includes(search.toLowerCase())) ||
    (p?.stateName && p.stateName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 font-mono text-xs animate-fade-in text-slate-900 dark:text-[#e5e1e4]">
      {/* Header & Search Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:max-w-md bg-white dark:bg-[#18181c] rounded-xl border border-slate-200 dark:border-[#3a494b]/30 flex items-center px-3.5 py-2 focus-within:border-cyan-500 shadow-xs">
          <span className="material-symbols-outlined text-sm text-slate-400 dark:text-gray-400 mr-2">search</span>
          <input
            type="text"
            placeholder="Search parties by name, GSTIN, or state..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none w-full"
          />
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 dark:bg-[#00dbe7] text-white dark:text-[#00210c] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 hover:brightness-110 cursor-pointer transition-all"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          {isAdding ? 'Cancel' : 'Register New Party'}
        </button>
      </div>

      {/* Add Party Form Modal/Inline Drawer */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white dark:bg-[#131316] border border-slate-200 dark:border-[#3a494b]/30 space-y-4 shadow-sm animate-fade-in">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-600 dark:text-[#00dbe7] text-base">domain</span>
            Add Customer / Business Party Record
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Company / Legal Name *</label>
              <input
                type="text"
                required
                placeholder="Reliance Industries Ltd"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">15-Digit GSTIN (Optional for B2C)</label>
              <input
                type="text"
                placeholder="27AAACR1234Q1Z5"
                value={gstin}
                onChange={e => handleGstinChange(e.target.value)}
                maxLength={15}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white uppercase focus:outline-none focus:border-cyan-500"
              />
              {gstinError && <span className="text-[9px] text-rose-500">{gstinError}</span>}
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">GST State Code & Jurisdiction</label>
              <select
                value={stateCode}
                onChange={e => setStateCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
              >
                {INDIAN_GST_STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Registered Billing Address</label>
              <input
                type="text"
                placeholder="Street Address, City, Pincode"
                value={billingAddress}
                onChange={e => setBillingAddress(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Contact Email</label>
              <input
                type="email"
                placeholder="finance@client.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Contact Phone</label>
              <input
                type="tel"
                placeholder="+91 98000 00000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-[#00e476] text-white dark:text-[#00210c] font-bold uppercase tracking-wider rounded-xl text-xs hover:brightness-110 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              Save Customer Record
            </button>
          </div>
        </form>
      )}

      {/* Parties Table */}
      <div className="bg-white dark:bg-[#121215] rounded-xl overflow-hidden border border-slate-200 dark:border-[#3a494b]/30 shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 dark:bg-[#18181c] text-[10px] text-slate-600 dark:text-gray-400 uppercase border-b border-slate-200 dark:border-[#3a494b]/20">
            <tr>
              <th className="p-3">Party Name</th>
              <th className="p-3">GSTIN / Tax ID</th>
              <th className="p-3">Type</th>
              <th className="p-3">State & Code</th>
              <th className="p-3">Billing Address</th>
              <th className="p-3">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/15 bg-white dark:bg-[#121215]">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="p-3 font-bold text-slate-900 dark:text-white font-sans">{p.name}</td>
                <td className="p-3 font-mono font-bold text-cyan-700 dark:text-[#00dbe7]">{p.gstin || 'Unregistered'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    p.partyType === 'B2B'
                      ? 'bg-cyan-500/10 text-cyan-700 dark:text-[#74f5ff] border-cyan-500/30'
                      : 'bg-slate-200 dark:bg-gray-500/15 text-slate-700 dark:text-gray-400 border-slate-300 dark:border-gray-500/30'
                  }`}>
                    {p.partyType}
                  </span>
                </td>
                <td className="p-3 text-slate-800 dark:text-white">{p.stateName} ({p.stateCode})</td>
                <td className="p-3 text-slate-600 dark:text-gray-300 max-w-xs truncate">{p.billingAddress}</td>
                <td className="p-3 text-slate-500 dark:text-gray-400 text-[11px]">{p.email || p.phone || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-gray-500 font-light">No party customer records matched search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
