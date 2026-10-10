import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '../types.js';
import { INDIAN_GST_STATES, validateGSTIN } from '../gstEngine.js';

interface CompanySettingsModalProps {
  company: CompanyProfile;
  userToken: string;
  onClose: () => void;
  onCompanyUpdated: (updated: CompanyProfile) => void;
}

export default function CompanySettingsModal({
  company,
  userToken,
  onClose,
  onCompanyUpdated
}: CompanySettingsModalProps) {
  const [profile, setProfile] = useState<CompanyProfile>(company);
  const [gstinError, setGstinError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleGstinChange = (val: string) => {
    const uppercase = val.toUpperCase().trim();
    setProfile(prev => ({ ...prev, gstin: uppercase }));
    if (!uppercase) {
      setGstinError(null);
      return;
    }
    const res = validateGSTIN(uppercase);
    if (!res.isValid) {
      setGstinError(res.error || 'Invalid GSTIN');
    } else {
      setGstinError(null);
      setProfile(prev => ({
        ...prev,
        stateCode: res.stateCode || prev.stateCode,
        stateName: res.stateName || prev.stateName,
        pan: res.pan || prev.pan
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/plugins/wp_accounting/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(profile)
      });

      if (res.ok) {
        const updated = await res.json();
        onCompanyUpdated(updated);
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update company settings');
      }
    } catch (err) {
      console.error('Failed to update company:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#111113] text-slate-900 dark:text-[#e5e1e4] border border-slate-200 dark:border-[#3a494b]/30 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col font-mono text-xs">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-[#18181c] border-b border-slate-200 dark:border-[#3a494b]/20 px-6 py-4 flex items-center justify-between shrink-0 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-[#00dbe7]">
              <span className="material-symbols-outlined text-lg">corporate_fare</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Enterprise GST & Bank Configuration</h2>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                Supplier Tax Identification & Banking Details for Indian Invoicing
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Statutory Registration */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs font-sans uppercase tracking-wider text-cyan-700 dark:text-[#00dbe7]">
              Statutory Company Registration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={profile.legalName}
                  onChange={e => setProfile({ ...profile, legalName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Trade / Brand Name</label>
                <input
                  type="text"
                  value={profile.tradeName || ''}
                  onChange={e => setProfile({ ...profile, tradeName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">15-Digit GSTIN *</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={profile.gstin}
                  onChange={e => handleGstinChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white uppercase focus:outline-none focus:border-cyan-500"
                />
                {gstinError && <span className="text-[9px] text-rose-500">{gstinError}</span>}
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Permanent Account No (PAN)</label>
                <input
                  type="text"
                  value={profile.pan}
                  onChange={e => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Registered State (Jurisdiction)</label>
                <select
                  value={profile.stateCode}
                  onChange={e => {
                    const st = INDIAN_GST_STATES.find(s => s.code === e.target.value);
                    setProfile({
                      ...profile,
                      stateCode: e.target.value,
                      stateName: st ? st.name : profile.stateName
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                >
                  {INDIAN_GST_STATES.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Registered Address Line</label>
                <input
                  type="text"
                  value={profile.addressLine1}
                  onChange={e => setProfile({ ...profile, addressLine1: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">City & Pincode</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profile.city}
                    placeholder="City"
                    onChange={e => setProfile({ ...profile, city: e.target.value })}
                    className="w-2/3 bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={profile.pincode}
                    placeholder="Pincode"
                    onChange={e => setProfile({ ...profile, pincode: e.target.value })}
                    className="w-1/3 bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-[#3a494b]/20">
            <h3 className="font-bold text-xs font-sans uppercase tracking-wider text-emerald-700 dark:text-[#00e476]">
              Bank Remittance & Payment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={profile.bankName}
                  onChange={e => setProfile({ ...profile, bankName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={profile.bankAccountNumber}
                  onChange={e => setProfile({ ...profile, bankAccountNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  value={profile.bankIfsc}
                  onChange={e => setProfile({ ...profile, bankIfsc: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Branch Name</label>
                <input
                  type="text"
                  value={profile.bankBranch}
                  onChange={e => setProfile({ ...profile, bankBranch: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">UPI VPA (QR Payment ID)</label>
                <input
                  type="text"
                  value={profile.upiId || ''}
                  onChange={e => setProfile({ ...profile, upiId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Invoicing Series & Signatory */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-[#3a494b]/20">
            <h3 className="font-bold text-xs font-sans uppercase tracking-wider text-purple-700 dark:text-[#ce5dff]">
              Invoice Sequence & Signatory Designation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Invoice Prefix / Financial Year</label>
                <input
                  type="text"
                  value={profile.invoicePrefix}
                  onChange={e => setProfile({ ...profile, invoicePrefix: e.target.value })}
                  placeholder="SL/2026-27/"
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 uppercase block mb-1">Authorized Signatory Name & Title</label>
                <input
                  type="text"
                  value={profile.authorizedSignatory}
                  onChange={e => setProfile({ ...profile, authorizedSignatory: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-[#3a494b]/30 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#3a494b]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#201f21] dark:hover:bg-[#2e2d31] text-slate-700 dark:text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 dark:bg-[#00dbe7] text-white dark:text-[#00210c] font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md shadow-cyan-600/20"
            >
              {isSaving ? 'Saving...' : 'Update Settings'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
