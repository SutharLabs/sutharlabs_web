import React, { useState } from 'react';
import { GSTInvoice } from '../types.js';
import { formatINR } from '../gstEngine.js';

interface TaxInvoiceModalProps {
  invoice: GSTInvoice;
  onClose: () => void;
  onMarkPaid?: (id: string) => void;
}

export default function TaxInvoiceModal({ invoice, onClose, onMarkPaid }: TaxInvoiceModalProps) {
  const [copyType, setCopyType] = useState<'Original' | 'Duplicate' | 'Triplicate'>('Original');

  const copyLabels = {
    Original: 'ORIGINAL FOR RECIPIENT',
    Duplicate: 'DUPLICATE FOR TRANSPORTER',
    Triplicate: 'TRIPLICATE FOR SUPPLIER'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#111113] text-[#e5e1e4] border border-[#3a494b]/30 rounded-xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Top Action Toolbar (Hidden during print) */}
        <div className="print:hidden bg-[#18181c] border-b border-[#3a494b]/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00dbe7] text-xl">receipt_long</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Rule 46 GST Tax Invoice Preview
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00dbe7]/15 text-[#74f5ff] border border-[#00dbe7]/30">
              {invoice.isInterState ? 'INTER-STATE (IGST)' : 'INTRA-STATE (CGST + SGST)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy selector */}
            <div className="flex rounded border border-[#3a494b]/40 bg-[#0e0e10] p-0.5 text-[10px] font-mono">
              {(['Original', 'Duplicate', 'Triplicate'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setCopyType(type)}
                  className={`px-2 py-1 rounded transition-colors ${
                    copyType === type
                      ? 'bg-[#00dbe7] text-[#00210c] font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {onMarkPaid && invoice.status !== 'Paid' && (
              <button
                onClick={() => onMarkPaid(invoice.id)}
                className="px-3 py-1.5 rounded bg-[#00e476]/15 hover:bg-[#00e476]/25 border border-[#00e476]/40 text-[#00e476] font-mono text-xs font-bold flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Mark as Paid
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-[#00dbe7] hover:brightness-110 text-[#00210c] font-mono text-xs font-bold flex items-center gap-1 shadow-md shadow-[#00dbe7]/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print Invoice
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#201f21] hover:bg-[#2e2d31] border border-[#3a494b]/30 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Printable Indian Tax Invoice Body */}
        <div id="printable-tax-invoice" className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0a0a0c] font-sans print:p-0 print:bg-white print:text-black">
          
          <div className="max-w-3xl mx-auto border border-[#3a494b]/30 bg-[#131316] p-6 sm:p-8 rounded-lg print:border-gray-800 print:bg-white print:p-6 print:rounded-none">
            
            {/* Top Official Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#3a494b]/30 gap-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-[#00dbe7]/15 text-[#74f5ff] border border-[#00dbe7]/30 rounded print:text-black print:border-black">
                  {copyLabels[copyType]}
                </span>
                <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-white print:text-black mt-1">
                  TAX INVOICE
                </h1>
                <p className="text-[10px] font-mono text-gray-400 print:text-gray-600">
                  Issued under Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules, 2017
                </p>
              </div>

              {/* E-Invoice QR & Ack Details */}
              {invoice.eInvoice && (
                <div className="flex items-center gap-3 bg-[#0a0a0c] print:bg-white p-2 rounded border border-[#3a494b]/20 print:border-gray-400">
                  <div className="w-14 h-14 bg-white p-1 rounded flex items-center justify-center shrink-0">
                    {/* Visual QR representation */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="currentColor">
                      <rect x="0" y="0" width="30" height="30" />
                      <rect x="5" y="5" width="20" height="20" fill="white" />
                      <rect x="10" y="10" width="10" height="10" />
                      <rect x="70" y="0" width="30" height="30" />
                      <rect x="75" y="5" width="20" height="20" fill="white" />
                      <rect x="80" y="10" width="10" height="10" />
                      <rect x="0" y="70" width="30" height="30" />
                      <rect x="5" y="75" width="20" height="20" fill="white" />
                      <rect x="10" y="80" width="10" height="10" />
                      <rect x="40" y="10" width="10" height="20" />
                      <rect x="45" y="45" width="15" height="15" />
                      <rect x="70" y="70" width="15" height="15" />
                      <rect x="85" y="85" width="15" height="15" />
                    </svg>
                  </div>
                  <div className="text-[9px] font-mono leading-tight">
                    <span className="text-[#00e476] print:text-black font-bold block">NIC E-INVOICE VALIDATED</span>
                    <span className="text-gray-400 print:text-gray-700 block">Ack: {invoice.eInvoice.ackNo}</span>
                    <span className="text-gray-400 print:text-gray-700 block">Dt: {invoice.eInvoice.ackDate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* IRN Bar */}
            {invoice.eInvoice && (
              <div className="my-2.5 px-3 py-1.5 rounded bg-[#0a0a0c] print:bg-gray-100 border border-[#3a494b]/20 print:border-gray-300 font-mono text-[9px] flex items-center gap-2 overflow-hidden">
                <span className="text-gray-400 print:text-gray-700 font-bold shrink-0">IRN:</span>
                <span className="text-[#74f5ff] print:text-black truncate">{invoice.eInvoice.irn}</span>
              </div>
            )}

            {/* Supplier & Invoice Identifiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 pb-4 border-b border-[#3a494b]/20 print:border-gray-300 text-xs">
              {/* Supplier Info */}
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#00dbe7] print:text-black font-bold block">
                  Supplier / Service Provider (Details of Signatory)
                </span>
                <h3 className="font-bold text-sm text-white print:text-black">{invoice.supplier.legalName}</h3>
                {invoice.supplier.tradeName && (
                  <p className="text-[11px] text-gray-300 print:text-gray-700">Trade: {invoice.supplier.tradeName}</p>
                )}
                <p className="text-gray-300 print:text-gray-700 text-[11px]">{invoice.supplier.address}</p>
                <div className="font-mono text-[10px] space-y-0.5 pt-1">
                  <div><span className="text-gray-400 print:text-gray-600">GSTIN: </span><span className="font-bold text-white print:text-black">{invoice.supplier.gstin}</span></div>
                  <div><span className="text-gray-400 print:text-gray-600">PAN: </span><span>{invoice.supplier.pan}</span></div>
                  <div><span className="text-gray-400 print:text-gray-600">State: </span><span>{invoice.supplier.stateName} (Code: {invoice.supplier.stateCode})</span></div>
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="bg-[#0a0a0c]/60 print:bg-gray-50 p-3 rounded border border-[#3a494b]/20 print:border-gray-300 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 print:text-gray-600">Invoice No:</span>
                  <span className="font-bold text-[#00dbe7] print:text-black">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 print:text-gray-600">Invoice Date:</span>
                  <span className="text-white print:text-black">{invoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 print:text-gray-600">Due Date:</span>
                  <span className="text-white print:text-black">{invoice.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 print:text-gray-600">Place of Supply (POS):</span>
                  <span className="font-bold text-[#ebb2ff] print:text-black">{invoice.placeOfSupplyStateName} ({invoice.placeOfSupplyStateCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 print:text-gray-600">Supply Classification:</span>
                  <span className="font-bold text-white print:text-black">
                    {invoice.isInterState ? 'Inter-State Supply (IGST)' : 'Intra-State Supply (CGST + SGST)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 print:text-gray-600">Reverse Charge (RCM):</span>
                  <span className="text-white print:text-black">{invoice.reverseChargeApplicable ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Buyer (Bill To) & Consignee (Ship To) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#3a494b]/20 print:border-gray-300 text-xs">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#ce5dff] print:text-black font-bold block">
                  Bill To (Recipient Details)
                </span>
                <h4 className="font-bold text-sm text-white print:text-black">{invoice.buyer.legalName}</h4>
                <p className="text-gray-300 print:text-gray-700 text-[11px]">{invoice.buyer.billingAddress}</p>
                <div className="font-mono text-[10px] space-y-0.5 pt-1">
                  <div>
                    <span className="text-gray-400 print:text-gray-600">GSTIN / UIN: </span>
                    <span className="font-bold text-white print:text-black">{invoice.buyer.gstin || 'Unregistered Person (B2C)'}</span>
                  </div>
                  {invoice.buyer.pan && (
                    <div><span className="text-gray-400 print:text-gray-600">PAN: </span><span>{invoice.buyer.pan}</span></div>
                  )}
                  <div><span className="text-gray-400 print:text-gray-600">State: </span><span>{invoice.buyer.stateName} (Code: {invoice.buyer.stateCode})</span></div>
                  {invoice.buyer.email && <div><span className="text-gray-400 print:text-gray-600">Email: </span><span>{invoice.buyer.email}</span></div>}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#00e476] print:text-black font-bold block">
                  Ship To / Consignee Destination
                </span>
                <h4 className="font-bold text-sm text-white print:text-black">{invoice.buyer.legalName}</h4>
                <p className="text-gray-300 print:text-gray-700 text-[11px]">{invoice.buyer.shippingAddress || invoice.buyer.billingAddress}</p>
                <div className="font-mono text-[10px] space-y-0.5 pt-1">
                  <div><span className="text-gray-400 print:text-gray-600">State: </span><span>{invoice.placeOfSupplyStateName} (Code: {invoice.placeOfSupplyStateCode})</span></div>
                  <div><span className="text-gray-400 print:text-gray-600">Place of Delivery: </span><span>{invoice.placeOfSupplyStateName}</span></div>
                </div>
              </div>
            </div>

            {/* Line Items Table compliant with Rule 46 item specifications */}
            <div className="my-4 overflow-x-auto rounded border border-[#3a494b]/30 print:border-gray-400">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead className="bg-[#18181c] print:bg-gray-200 text-gray-300 print:text-black text-[9px] uppercase">
                  <tr>
                    <th className="p-2 border-b border-r border-[#3a494b]/20 print:border-gray-400">#</th>
                    <th className="p-2 border-b border-r border-[#3a494b]/20 print:border-gray-400">Description</th>
                    <th className="p-2 border-b border-r border-[#3a494b]/20 print:border-gray-400">HSN/SAC</th>
                    <th className="p-2 border-b border-r border-[#3a494b]/20 print:border-gray-400 text-right">Qty</th>
                    <th className="p-2 border-b border-r border-[#3a494b]/20 print:border-gray-400 text-right">Rate (₹)</th>
                    <th className="p-2 border-b border-r border-[#3a494b]/20 print:border-gray-400 text-right">Taxable (₹)</th>
                    {invoice.isInterState ? (
                      <th className="p-2 border-b border-r border-[#3a494b]/20 print:border-gray-400 text-right">IGST</th>
                    ) : (
                      <>
                        <th className="p-2 border-b border-r border-[#3a494b]/20 print:border-gray-400 text-right">CGST</th>
                        <th className="p-2 border-b border-r border-[#3a494b]/20 print:border-gray-400 text-right">SGST</th>
                      </>
                    )}
                    <th className="p-2 border-b border-[#3a494b]/20 print:border-gray-400 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a494b]/15 print:divide-gray-300">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                      <td className="p-2 text-center text-gray-400 print:text-gray-700 border-r border-[#3a494b]/20 print:border-gray-400">
                        {idx + 1}
                      </td>
                      <td className="p-2 font-sans font-medium text-white print:text-black border-r border-[#3a494b]/20 print:border-gray-400">
                        {item.itemDescription}
                      </td>
                      <td className="p-2 text-gray-300 print:text-gray-700 border-r border-[#3a494b]/20 print:border-gray-400">
                        {item.hsnSacCode}
                      </td>
                      <td className="p-2 text-right border-r border-[#3a494b]/20 print:border-gray-400">
                        {item.quantity} <span className="text-[9px] text-gray-400 print:text-gray-600">{item.unit}</span>
                      </td>
                      <td className="p-2 text-right border-r border-[#3a494b]/20 print:border-gray-400">
                        {formatINR(item.rate).replace('₹ ', '')}
                      </td>
                      <td className="p-2 text-right font-bold text-white print:text-black border-r border-[#3a494b]/20 print:border-gray-400">
                        {formatINR(item.taxableValue).replace('₹ ', '')}
                      </td>

                      {invoice.isInterState ? (
                        <td className="p-2 text-right border-r border-[#3a494b]/20 print:border-gray-400">
                          <div className="text-[9px] text-[#ce5dff] print:text-black">{item.igstRate}%</div>
                          <div>{formatINR(item.igstAmount).replace('₹ ', '')}</div>
                        </td>
                      ) : (
                        <>
                          <td className="p-2 text-right border-r border-[#3a494b]/20 print:border-gray-400">
                            <div className="text-[9px] text-[#00dbe7] print:text-black">{item.cgstRate}%</div>
                            <div>{formatINR(item.cgstAmount).replace('₹ ', '')}</div>
                          </td>
                          <td className="p-2 text-right border-r border-[#3a494b]/20 print:border-gray-400">
                            <div className="text-[9px] text-[#00dbe7] print:text-black">{item.sgstRate}%</div>
                            <div>{formatINR(item.sgstAmount).replace('₹ ', '')}</div>
                          </td>
                        </>
                      )}

                      <td className="p-2 text-right font-bold text-[#00e476] print:text-black">
                        {formatINR(item.totalAmount).replace('₹ ', '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 pt-2">
              {/* Left Column: Bank Details & Terms */}
              <div className="space-y-3 font-mono text-[10px]">
                <div className="p-3 rounded bg-[#0a0a0c]/80 print:bg-gray-50 border border-[#3a494b]/20 print:border-gray-300 space-y-1">
                  <span className="font-bold text-[#00dbe7] print:text-black uppercase tracking-wider block">
                    Bank Remittance Details
                  </span>
                  <div><span className="text-gray-400 print:text-gray-600">Bank Name: </span><span className="text-white print:text-black">{invoice.supplier.bankName}</span></div>
                  <div><span className="text-gray-400 print:text-gray-600">Account No: </span><span className="font-bold text-white print:text-black">{invoice.supplier.bankAccountNumber}</span></div>
                  <div><span className="text-gray-400 print:text-gray-600">IFSC Code: </span><span className="text-white print:text-black font-bold">{invoice.supplier.bankIfsc}</span></div>
                  {invoice.supplier.upiId && (
                    <div><span className="text-gray-400 print:text-gray-600">UPI VPA: </span><span className="text-[#00e476] print:text-black">{invoice.supplier.upiId}</span></div>
                  )}
                </div>

                {invoice.terms && (
                  <div className="p-2.5 rounded bg-[#0a0a0c]/40 print:bg-transparent text-gray-400 print:text-gray-700 whitespace-pre-line text-[9px] leading-tight">
                    <span className="font-bold text-gray-300 print:text-black block mb-0.5">Terms & Conditions:</span>
                    {invoice.terms}
                  </div>
                )}
              </div>

              {/* Right Column: Tax Breakdown & Grand Total */}
              <div className="bg-[#0a0a0c]/80 print:bg-gray-50 p-4 rounded border border-[#3a494b]/20 print:border-gray-300 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 print:text-gray-600">Taxable Value:</span>
                  <span className="text-white print:text-black font-bold">{formatINR(invoice.taxableAmount)}</span>
                </div>

                {!invoice.isInterState && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400 print:text-gray-600">Central GST (CGST):</span>
                      <span className="text-white print:text-black">{formatINR(invoice.cgstTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 print:text-gray-600">State GST (SGST):</span>
                      <span className="text-white print:text-black">{formatINR(invoice.sgstTotal)}</span>
                    </div>
                  </>
                )}

                {invoice.isInterState && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 print:text-gray-600">Integrated GST (IGST):</span>
                    <span className="text-white print:text-black">{formatINR(invoice.igstTotal)}</span>
                  </div>
                )}

                {invoice.cessTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 print:text-gray-600">GST Cess:</span>
                    <span className="text-white print:text-black">{formatINR(invoice.cessTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-1 border-t border-[#3a494b]/20 print:border-gray-300">
                  <span className="text-gray-400 print:text-gray-600">Total Tax:</span>
                  <span className="text-white print:text-black font-bold">{formatINR(invoice.totalTax)}</span>
                </div>

                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400 print:text-gray-600">Round Off:</span>
                    <span className="text-gray-300 print:text-gray-700">{formatINR(invoice.roundOff)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t-2 border-[#00dbe7]/40 print:border-black text-sm">
                  <span className="font-bold text-white print:text-black uppercase">Invoice Total (INR):</span>
                  <span className="font-black text-lg text-[#00e476] print:text-black">{formatINR(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Total in words */}
            <div className="p-3 rounded bg-[#0a0a0c]/60 print:bg-gray-100 border border-[#3a494b]/20 print:border-gray-300 font-mono text-xs my-3">
              <span className="text-gray-400 print:text-gray-600 font-bold">Total Amount in Words: </span>
              <span className="text-white print:text-black font-semibold">{invoice.amountInWords}</span>
            </div>

            {/* Signature & Declaration Footer */}
            <div className="mt-8 pt-4 border-t border-[#3a494b]/30 print:border-gray-400 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] font-mono">
              <div className="text-gray-400 print:text-gray-600 max-w-sm space-y-1">
                <span className="font-bold text-gray-300 print:text-black block">Declaration:</span>
                <p>We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.</p>
              </div>

              <div className="text-right space-y-12">
                <div className="text-gray-400 print:text-gray-600">
                  For <span className="font-bold text-white print:text-black">{invoice.supplier.legalName}</span>
                </div>
                <div className="border-t border-[#3a494b]/40 print:border-black pt-1">
                  <span className="font-bold text-white print:text-black block">Authorized Signatory</span>
                  <span className="text-gray-400 print:text-gray-600 text-[9px]">{DEFAULT_COMPANY.authorizedSignatory}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
const DEFAULT_COMPANY = {
  authorizedSignatory: 'Suresh Suthar (Managing Director)'
};
