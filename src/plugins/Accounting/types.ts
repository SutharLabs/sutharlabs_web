import { GSTRate } from './gstEngine.js';

export interface CompanyProfile {
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  stateCode: string;
  stateName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  pincode: string;
  email: string;
  phone: string;
  website?: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  upiId?: string;
  authorizedSignatory: string;
  invoicePrefix: string;
  currentFiscalYear: string;
  isCompositionScheme: boolean;
  lutArn?: string; // Letter of Undertaking for zero-rated export
}

export interface PartyCustomer {
  id: string;
  name: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  partyType: 'B2B' | 'B2C' | 'SEZ' | 'DEEMED_EXPORT';
  stateCode: string;
  stateName: string;
  billingAddress: string;
  shippingAddress?: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface ItemMaster {
  id: string;
  code: string;
  name: string;
  type: 'Goods' | 'Services';
  hsnSacCode: string;
  unit: string; // NOS, HRS, KGS, PCS, BOX, MTH
  unitPrice: number;
  gstRate: GSTRate;
  cessRate?: number;
  description?: string;
}

export interface GSTInvoiceItem {
  id: string;
  itemId?: string;
  itemDescription: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  discountAmount: number;
  taxableValue: number;
  gstRate: GSTRate;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
  totalAmount: number;
}

export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Cancelled';

export interface GSTInvoice {
  id: string; // e.g. SL/2026-27/0042 or INV-2026-001
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  
  // Supplier Snapshot
  supplier: {
    legalName: string;
    tradeName?: string;
    gstin: string;
    pan: string;
    stateCode: string;
    stateName: string;
    address: string;
    bankName: string;
    bankAccountNumber: string;
    bankIfsc: string;
    upiId?: string;
  };

  // Buyer Snapshot
  buyer: {
    customerId?: string;
    legalName: string;
    tradeName?: string;
    gstin?: string;
    pan?: string;
    partyType: 'B2B' | 'B2C' | 'SEZ';
    stateCode: string;
    stateName: string;
    billingAddress: string;
    shippingAddress?: string;
    email?: string;
    phone?: string;
  };

  // Supply Characteristics
  placeOfSupplyStateCode: string;
  placeOfSupplyStateName: string;
  isInterState: boolean;
  reverseChargeApplicable: boolean;
  
  // Line Items
  items: GSTInvoiceItem[];

  // Totals
  grossTotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;

  // Payments & Status
  status: InvoiceStatus;
  amountPaid: number;
  balanceDue: number;
  paymentMode?: 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash' | 'Card';

  // Compliance & E-Invoicing
  eInvoice?: {
    irn: string;
    ackNo: string;
    ackDate: string;
    signedQr: string;
    status: 'GENERATED' | 'NOT_APPLICABLE' | 'FAILED';
  };
  eWayBill?: {
    eWayBillNo?: string;
    validUpto?: string;
    transporterName?: string;
    vehicleNumber?: string;
  };

  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  referenceNo: string;
  description: string;
  lines: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
}

export interface GSTR1Summary {
  financialYear: string;
  returnPeriod: string;
  totalInvoices: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalTaxLiability: number;
  
  // Table 4: B2B Invoices
  b2b: {
    recipientGstin: string;
    recipientName: string;
    invoiceCount: number;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
  }[];

  // Table 5: B2CL (Interstate large > 2.5L)
  b2cl: {
    stateCode: string;
    stateName: string;
    invoiceCount: number;
    taxableValue: number;
    igst: number;
  }[];

  // Table 7: B2CS (Small supplies)
  b2cs: {
    supplyType: string;
    placeOfSupply: string;
    gstRate: number;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
  }[];

  // Table 12: HSN Summary
  hsnSummary: {
    hsnCode: string;
    description: string;
    unit: string;
    totalQuantity: number;
    totalValue: number;
    taxableValue: number;
    integratedTax: number;
    centralTax: number;
    stateTax: number;
    cess: number;
  }[];
}

export interface GSTR3BSummary {
  financialYear: string;
  returnPeriod: string;
  outwardTaxableSupplies: {
    totalTaxableValue: number;
    integratedTax: number;
    centralTax: number;
    stateTax: number;
    cess: number;
  };
  eligibleITC: {
    integratedTax: number;
    centralTax: number;
    stateTax: number;
    cess: number;
  };
  netTaxPayable: {
    integratedTax: number;
    centralTax: number;
    stateTax: number;
    cess: number;
  };
}
