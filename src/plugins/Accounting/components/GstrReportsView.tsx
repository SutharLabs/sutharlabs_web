import React, { useState, useEffect } from 'react';
import { GSTR1Summary, GSTR3BSummary } from '../types.js';
import { formatINR } from '../gstEngine.js';

interface GstrReportsViewProps {
  userToken: string;
}

export default function GstrReportsView({ userToken }: GstrReportsViewProps) {
  const [activeReportTab, setActiveReportTab] = useState<'GSTR1' | 'GSTR3B'>('GSTR1');
  const [gstr1Tab, setGstr1Tab] = useState<'B2B' | 'B2CL' | 'B2CS' | 'HSN'>('B2B');
  const [gstr1, setGstr1] = useState<GSTR1Summary | null>(null);
  const [gstr3b, setGstr3b] = useState<GSTR3BSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const [r1, r3b] = await Promise.all([
          fetch('/api/plugins/wp_accounting/reports/gstr-1', {
            headers: { Authorization: `Bearer ${userToken}` }
          }).then(res => res.json()),
          fetch('/api/plugins/wp_accounting/reports/gstr-3b', {
            headers: { Authorization: `Bearer ${userToken}` }
          }).then(res => res.json())
        ]);
        setGstr1(r1);
        setGstr3b(r3b);
      } catch (err) {
        console.error('Failed to load GSTR reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [userToken]);

  const handleExportGstr1Json = () => {
    if (!gstr1) return;
    const jsonStr = JSON.stringify(gstr1, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${gstr1.financialYear}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading || !gstr1 || !gstr3b) {
    return (
      <div className="p-8 text-center font-mono text-xs text-gray-400">
        <span className="material-symbols-outlined text-2xl animate-spin text-[#00dbe7] block mb-2">sync</span>
        Compiling GST Portal Compliance Reports...
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Controls & Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[#3a494b]/20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveReportTab('GSTR1')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'GSTR1'
                ? 'bg-[#00dbe7]/15 border border-[#00dbe7]/40 text-[#74f5ff] shadow-sm'
                : 'bg-[#18181c] text-gray-400 hover:text-white border border-[#3a494b]/20'
            }`}
          >
            📊 GSTR-1 Return (Outward Supplies)
          </button>
          <button
            onClick={() => setActiveReportTab('GSTR3B')}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'GSTR3B'
                ? 'bg-[#00e476]/15 border border-[#00e476]/40 text-[#00e476] shadow-sm'
                : 'bg-[#18181c] text-gray-400 hover:text-white border border-[#3a494b]/20'
            }`}
          >
            📑 GSTR-3B (Monthly Summary & ITC)
          </button>
        </div>

        {activeReportTab === 'GSTR1' && (
          <button
            onClick={handleExportGstr1Json}
            className="px-3 py-1.5 rounded-lg bg-[#201f21] hover:bg-[#2e2d31] border border-[#00dbe7]/40 text-[#00dbe7] font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export GST Portal JSON
          </button>
        )}
      </div>

      {/* GSTR-1 Tab Content */}
      {activeReportTab === 'GSTR1' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
              <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Total Invoices</span>
              <span className="font-sans text-xl font-bold text-white block">{gstr1.totalInvoices}</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
              <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Taxable Turnover</span>
              <span className="font-sans text-xl font-bold text-[#00dbe7] block">{formatINR(gstr1.totalTaxableValue)}</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
              <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Integrated Tax (IGST)</span>
              <span className="font-sans text-xl font-bold text-[#ce5dff] block">{formatINR(gstr1.totalIGST)}</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
              <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Central Tax (CGST)</span>
              <span className="font-sans text-xl font-bold text-[#74f5ff] block">{formatINR(gstr1.totalCGST)}</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-outline/15 bg-surface-container-low/40">
              <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 block mb-1">State Tax (SGST)</span>
              <span className="font-sans text-xl font-bold text-[#74f5ff] block">{formatINR(gstr1.totalSGST)}</span>
            </div>
          </div>

          {/* Sub-tables Nav */}
          <div className="flex gap-2 border-b border-[#3a494b]/20 pb-2">
            {[
              { id: 'B2B', label: '4. B2B Invoices (Registered)' },
              { id: 'B2CL', label: '5. B2CL (Interstate > 2.5L)' },
              { id: 'B2CS', label: '7. B2CS (Small Retail)' },
              { id: 'HSN', label: '12. HSN Summary of Outward' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setGstr1Tab(tab.id as any)}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  gstr1Tab === tab.id
                    ? 'bg-[#00dbe7] text-[#00210c] font-bold'
                    : 'bg-[#18181c] text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* B2B Table */}
          {gstr1Tab === 'B2B' && (
            <div className="glass-panel rounded-xl overflow-hidden border border-outline/15">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-[#18181c] text-gray-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">GSTIN / UIN of Recipient</th>
                    <th className="p-3">Receiver Legal Name</th>
                    <th className="p-3 text-center">Invoices</th>
                    <th className="p-3 text-right">Taxable Value (₹)</th>
                    <th className="p-3 text-right">IGST (₹)</th>
                    <th className="p-3 text-right">CGST (₹)</th>
                    <th className="p-3 text-right">SGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a494b]/15 bg-surface-container-low/40">
                  {gstr1.b2b.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-[#00dbe7]">{row.recipientGstin}</td>
                      <td className="p-3 text-white font-sans">{row.recipientName}</td>
                      <td className="p-3 text-center">{row.invoiceCount}</td>
                      <td className="p-3 text-right font-bold text-white">{formatINR(row.taxableValue).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#ce5dff]">{formatINR(row.igst).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#74f5ff]">{formatINR(row.cgst).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#74f5ff]">{formatINR(row.sgst).replace('₹ ', '')}</td>
                    </tr>
                  ))}
                  {gstr1.b2b.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500 font-light">No B2B invoices recorded in this filing period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* B2CL Table */}
          {gstr1Tab === 'B2CL' && (
            <div className="glass-panel rounded-xl overflow-hidden border border-outline/15">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-[#18181c] text-gray-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Place of Supply (State)</th>
                    <th className="p-3 text-center">Invoices</th>
                    <th className="p-3 text-right">Taxable Value (₹)</th>
                    <th className="p-3 text-right">Integrated Tax (IGST) (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a494b]/15 bg-surface-container-low/40">
                  {gstr1.b2cl.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-white">{row.stateCode} - {row.stateName}</td>
                      <td className="p-3 text-center">{row.invoiceCount}</td>
                      <td className="p-3 text-right font-bold text-white">{formatINR(row.taxableValue).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#ce5dff] font-bold">{formatINR(row.igst).replace('₹ ', '')}</td>
                    </tr>
                  ))}
                  {gstr1.b2cl.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500 font-light">No interstate B2C large invoices exceeding ₹2.5 Lakhs in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* B2CS Table */}
          {gstr1Tab === 'B2CS' && (
            <div className="glass-panel rounded-xl overflow-hidden border border-outline/15">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-[#18181c] text-gray-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Place of Supply</th>
                    <th className="p-3 text-center">Rate (%)</th>
                    <th className="p-3 text-right">Taxable Value (₹)</th>
                    <th className="p-3 text-right">IGST (₹)</th>
                    <th className="p-3 text-right">CGST (₹)</th>
                    <th className="p-3 text-right">SGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a494b]/15 bg-surface-container-low/40">
                  {gstr1.b2cs.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-3 text-gray-300">{row.supplyType}</td>
                      <td className="p-3 text-white font-bold">{row.placeOfSupply}</td>
                      <td className="p-3 text-center">{row.gstRate}%</td>
                      <td className="p-3 text-right font-bold text-white">{formatINR(row.taxableValue).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#ce5dff]">{formatINR(row.igst).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#74f5ff]">{formatINR(row.cgst).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#74f5ff]">{formatINR(row.sgst).replace('₹ ', '')}</td>
                    </tr>
                  ))}
                  {gstr1.b2cs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500 font-light">No small B2C retail supplies reported.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* HSN Summary Table */}
          {gstr1Tab === 'HSN' && (
            <div className="glass-panel rounded-xl overflow-hidden border border-outline/15">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-[#18181c] text-gray-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">HSN / SAC</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">UQC</th>
                    <th className="p-3 text-right">Total Qty</th>
                    <th className="p-3 text-right">Total Value (₹)</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">IGST (₹)</th>
                    <th className="p-3 text-right">CGST (₹)</th>
                    <th className="p-3 text-right">SGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a494b]/15 bg-surface-container-low/40">
                  {gstr1.hsnSummary.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-[#00e476]">{row.hsnCode}</td>
                      <td className="p-3 text-white font-sans max-w-xs truncate">{row.description}</td>
                      <td className="p-3 text-center text-gray-400">{row.unit}</td>
                      <td className="p-3 text-right">{row.totalQuantity}</td>
                      <td className="p-3 text-right font-bold text-white">{formatINR(row.totalValue).replace('₹ ', '')}</td>
                      <td className="p-3 text-right font-bold text-[#00dbe7]">{formatINR(row.taxableValue).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#ce5dff]">{formatINR(row.integratedTax).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#74f5ff]">{formatINR(row.centralTax).replace('₹ ', '')}</td>
                      <td className="p-3 text-right text-[#74f5ff]">{formatINR(row.stateTax).replace('₹ ', '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GSTR-3B Tab Content */}
      {activeReportTab === 'GSTR3B' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Table 3.1 Outward Taxable Supplies */}
          <div className="glass-panel p-5 rounded-xl border border-outline/15 space-y-3">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00dbe7] text-base">table_chart</span>
              3.1 Details of Outward Supplies and Inward Supplies Liable to Reverse Charge
            </h3>
            
            <div className="overflow-x-auto rounded border border-[#3a494b]/20">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#18181c] text-gray-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Nature of Supplies</th>
                    <th className="p-3 text-right">Total Taxable Value (₹)</th>
                    <th className="p-3 text-right">IGST (₹)</th>
                    <th className="p-3 text-right">CGST (₹)</th>
                    <th className="p-3 text-right">SGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a494b]/15 bg-surface-container-low/40">
                  <tr>
                    <td className="p-3 font-medium text-white">(a) Outward Taxable Supplies (other than zero rated, nil and exempted)</td>
                    <td className="p-3 text-right font-bold text-white">{formatINR(gstr3b.outwardTaxableSupplies.totalTaxableValue).replace('₹ ', '')}</td>
                    <td className="p-3 text-right text-[#ce5dff]">{formatINR(gstr3b.outwardTaxableSupplies.integratedTax).replace('₹ ', '')}</td>
                    <td className="p-3 text-right text-[#74f5ff]">{formatINR(gstr3b.outwardTaxableSupplies.centralTax).replace('₹ ', '')}</td>
                    <td className="p-3 text-right text-[#74f5ff]">{formatINR(gstr3b.outwardTaxableSupplies.stateTax).replace('₹ ', '')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4 Eligible ITC */}
          <div className="glass-panel p-5 rounded-xl border border-outline/15 space-y-3">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00e476] text-base">savings</span>
              4. Eligible Input Tax Credit (ITC) Available
            </h3>
            
            <div className="overflow-x-auto rounded border border-[#3a494b]/20">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#18181c] text-gray-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Details</th>
                    <th className="p-3 text-right">IGST (₹)</th>
                    <th className="p-3 text-right">CGST (₹)</th>
                    <th className="p-3 text-right">SGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a494b]/15 bg-surface-container-low/40">
                  <tr>
                    <td className="p-3 font-medium text-white">(A) ITC Available (All other ITC on inward business supplies)</td>
                    <td className="p-3 text-right text-[#00e476] font-bold">{formatINR(gstr3b.eligibleITC.integratedTax).replace('₹ ', '')}</td>
                    <td className="p-3 text-right text-[#00e476] font-bold">{formatINR(gstr3b.eligibleITC.centralTax).replace('₹ ', '')}</td>
                    <td className="p-3 text-right text-[#00e476] font-bold">{formatINR(gstr3b.eligibleITC.stateTax).replace('₹ ', '')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 6.1 Net Tax Payable */}
          <div className="glass-panel p-5 rounded-xl border border-outline/15 space-y-3">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <span className="material-symbols-outlined text-[#eab308] text-base">payments</span>
              6.1 Payment of Tax: Net Tax Liability Payable in Cash
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-[#0a0a0c] border border-[#3a494b]/30">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Net IGST Payable</span>
                <span className="text-xl font-bold text-[#ce5dff]">{formatINR(gstr3b.netTaxPayable.integratedTax)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0a0a0c] border border-[#3a494b]/30">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Net CGST Payable</span>
                <span className="text-xl font-bold text-[#74f5ff]">{formatINR(gstr3b.netTaxPayable.centralTax)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0a0a0c] border border-[#3a494b]/30">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Net SGST Payable</span>
                <span className="text-xl font-bold text-[#74f5ff]">{formatINR(gstr3b.netTaxPayable.stateTax)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
