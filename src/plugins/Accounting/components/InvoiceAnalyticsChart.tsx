import React, { useState } from 'react';
import { GSTInvoice } from '../types.js';
import { formatINR } from '../gstEngine.js';

interface InvoiceAnalyticsChartProps {
  invoices: GSTInvoice[];
  onSelectInvoice: (invoice: GSTInvoice) => void;
}

export default function InvoiceAnalyticsChart({
  invoices,
  onSelectInvoice
}: InvoiceAnalyticsChartProps) {
  const [hoveredInvoice, setHoveredInvoice] = useState<GSTInvoice | null>(null);

  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  if (safeInvoices.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121215] rounded-2xl p-6 border border-slate-200 dark:border-[#3a494b]/30 shadow-xs text-center font-mono text-xs text-slate-400 dark:text-gray-500 py-12">
        <span className="material-symbols-outlined text-3xl block mb-2 text-slate-300 dark:text-gray-600">bar_chart</span>
        No invoice records available to display distribution chart.
      </div>
    );
  }

  // Show up to the last 10 invoices for clear, uncrowded spacing
  const displayInvoices = safeInvoices.slice(-10);

  // Calculate dynamic scale
  const rawMax = Math.max(...displayInvoices.map(i => i.grandTotal || 0), 50000);
  
  // Clean Y-axis step calculation
  let step = 50000;
  if (rawMax > 1500000) step = 500000;
  else if (rawMax > 800000) step = 250000;
  else if (rawMax > 400000) step = 100000;
  else if (rawMax > 200000) step = 50000;
  else if (rawMax > 100000) step = 25000;
  else step = 10000;

  const yTicksCount = 4;
  const yMax = Math.ceil(rawMax / step) * step || step * yTicksCount;
  const tickValues = Array.from({ length: yTicksCount + 1 }, (_, i) => (yMax / yTicksCount) * (yTicksCount - i));

  const formatYLabel = (val: number) => {
    if (val === 0) return '₹0';
    if (val >= 100000) {
      const inLakhs = val / 100000;
      return `₹${inLakhs % 1 === 0 ? inLakhs.toFixed(0) : inLakhs.toFixed(1)}L`;
    }
    return `₹${(val / 1000).toFixed(0)}k`;
  };

  const totalTurnover = displayInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalTaxSlices = displayInvoices.reduce((s, i) => s + (i.totalTax || 0), 0);
  const avgInvoice = totalTurnover / (displayInvoices.length || 1);

  return (
    <div className="bg-white dark:bg-[#121215] rounded-2xl p-5 border border-slate-200 dark:border-[#3a494b]/30 shadow-xs flex flex-col gap-4 font-sans text-xs">
      
      {/* Chart Top Header & Legend */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#3a494b]/20">
        <div>
          <h3 className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-600 dark:text-[#00dbe7] text-base">bar_chart</span>
            Invoice Value & GST Tax Slices Distribution
          </h3>
          <p className="text-[11px] font-mono text-slate-500 dark:text-gray-400 mt-0.5">
            Breakdown of Taxable Revenue vs Output GST Tax for recent billing cycles
          </p>
        </div>

        {/* Institutional Chart Legend & KPI Chips */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
            <span className="w-3 h-3 rounded bg-cyan-600 dark:bg-[#00dbe7] inline-block shadow-xs"></span>
            <span>Taxable Base Value</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
            <span className="w-3 h-3 rounded bg-purple-500 dark:bg-[#ce5dff] inline-block shadow-xs"></span>
            <span>GST Output Tax Slice</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400">
            <span>Avg: <strong className="text-slate-800 dark:text-white font-bold">{formatINR(avgInvoice)}</strong></span>
            <span>•</span>
            <span>Tax Ratio: <strong className="text-purple-600 dark:text-[#ebb2ff] font-bold">{((totalTaxSlices / totalTurnover) * 100).toFixed(1)}%</strong></span>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Area with Distinct Y and X Axes */}
      <div className="relative pt-4">
        
        {/* Y-Axis Label Tag */}
        <div className="absolute -top-1 left-0 text-[10px] font-mono text-slate-400 dark:text-gray-500 tracking-wider">
          Y: Value in INR (₹)
        </div>

        <div className="flex items-stretch gap-2 h-64 mt-2">
          
          {/* Y-Axis Column (Scale Labels & Tick Marks) */}
          <div className="w-14 shrink-0 flex flex-col justify-between items-end pr-2 font-mono text-[10px] text-slate-400 dark:text-gray-500 select-none pb-8 border-r border-slate-200 dark:border-[#3a494b]/30">
            {tickValues.map((val, idx) => (
              <span key={idx} className="leading-none transform -translate-y-1">
                {formatYLabel(val)}
              </span>
            ))}
          </div>

          {/* Chart Plot Area with Grid Lines and Stacked Bars */}
          <div className="relative flex-1 flex flex-col justify-between">
            
            {/* Background Horizontal Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
              {tickValues.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-full border-b ${
                    idx === tickValues.length - 1
                      ? 'border-slate-300 dark:border-[#3a494b]/80'
                      : 'border-slate-100 dark:border-[#3a494b]/20 border-dashed'
                  }`}
                />
              ))}
            </div>

            {/* Bars Flex Container */}
            <div className="relative z-10 flex-1 flex items-end justify-around px-2 sm:px-4 pb-8">
              {displayInvoices.map((inv) => {
                const isHovered = hoveredInvoice?.id === inv.id;
                const isPaid = inv.status === 'Paid';

                const totalVal = inv.grandTotal || 0;
                const taxableVal = inv.taxableAmount || 0;
                const taxVal = inv.totalTax || 0;

                const taxableHeightPercent = Math.min(100, Math.max(2, (taxableVal / yMax) * 100));
                const taxHeightPercent = Math.min(100, Math.max(2, (taxVal / yMax) * 100));

                const invoiceShortNo = inv.invoiceNumber.split('/').pop() || inv.invoiceNumber;

                return (
                  <div
                    key={inv.id}
                    className="flex flex-col items-center group relative cursor-pointer"
                    style={{ width: `${Math.min(48, Math.max(32, 100 / displayInvoices.length))}%`, maxWidth: '52px' }}
                    onClick={() => onSelectInvoice(inv)}
                    onMouseEnter={() => setHoveredInvoice(inv)}
                    onMouseLeave={() => setHoveredInvoice(null)}
                  >
                    {/* Top Value Label above the bar */}
                    <div className="text-[10px] font-mono font-bold text-slate-700 dark:text-gray-300 mb-1.5 transition-transform group-hover:-translate-y-0.5 whitespace-nowrap">
                      {formatYLabel(totalVal)}
                    </div>

                    {/* Stacked Bar Container */}
                    <div
                      className={`w-full rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-200 ${
                        isHovered
                          ? 'ring-2 ring-cyan-400 dark:ring-[#00dbe7] shadow-lg shadow-cyan-500/10 dark:shadow-[#00dbe7]/20 scale-105'
                          : 'opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* Upper Stack: Tax Slice */}
                      <div
                        style={{ height: `${taxHeightPercent * 1.7}px` }}
                        className="w-full bg-purple-500 dark:bg-[#ce5dff] border-b border-purple-400/30 transition-all"
                        title={`GST Tax: ${formatINR(taxVal)}`}
                      />

                      {/* Lower Stack: Taxable Base Revenue */}
                      <div
                        style={{ height: `${taxableHeightPercent * 1.7}px` }}
                        className="w-full bg-cyan-600 dark:bg-[#00dbe7] transition-all"
                        title={`Taxable Base: ${formatINR(taxableVal)}`}
                      />
                    </div>

                    {/* X-Axis Column Data (Under the baseline) */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-center w-full">
                      <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-700 dark:text-gray-300 whitespace-nowrap">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isPaid ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          title={isPaid ? 'Cleared & Settled' : 'Payment Awaiting'}
                        />
                        <span className="truncate max-w-[50px]">{invoiceShortNo}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* X-Axis Title */}
        <div className="text-center font-mono text-[10px] text-slate-400 dark:text-gray-500 pt-2 border-t border-slate-200/60 dark:border-[#3a494b]/30 flex justify-between items-center px-16">
          <span>Older Invoices</span>
          <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-gray-400">
            X: Invoices Sequence & Client Settlement
          </span>
          <span>Latest Invoices</span>
        </div>
      </div>

      {/* Interactive Tooltip Card on Hover */}
      {hoveredInvoice && (
        <div className="bg-slate-50 dark:bg-[#18181c] border border-cyan-500/30 dark:border-[#00dbe7]/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-fade-in shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-[#00dbe7] flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">receipt_long</span>
            </span>
            <div>
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{hoveredInvoice.invoiceNumber}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                  hoveredInvoice.status === 'Paid'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#00e476]'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                }`}>
                  {hoveredInvoice.status}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-gray-400">
                Buyer: {hoveredInvoice.buyer.legalName} • Date: {hoveredInvoice.invoiceDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Taxable Base:</span>
              <span className="font-bold text-cyan-700 dark:text-[#00dbe7]">{formatINR(hoveredInvoice.taxableAmount)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">GST Tax Slice:</span>
              <span className="font-bold text-purple-700 dark:text-[#ebb2ff]">{formatINR(hoveredInvoice.totalTax)}</span>
            </div>
            <div className="pl-3 border-l border-slate-200 dark:border-white/10">
              <span className="text-slate-400 block text-[10px]">Invoice Total:</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">{formatINR(hoveredInvoice.grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
