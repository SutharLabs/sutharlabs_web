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
  partyType: 'B2B' | 'B2C' | 'SEZ' | 'DEEMED_EXPORT' | 'VENDOR';
  stateCode: string;
  stateName: string;
  billingAddress: string;
  shippingAddress?: string;
  email: string;
  phone: string;
  openingBalance?: number;
  currentBalance?: number;
  creditDays?: number;
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
  purchasePrice?: number;
  gstRate: GSTRate;
  cessRate?: number;
  description?: string;
  stockQuantity?: number;
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
    partyType: 'B2B' | 'B2C' | 'SEZ' | 'DEEMED_EXPORT' | 'VENDOR';
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
  version?: number; // Revision counter (starts at 1)
  editNote?: string; // Latest amendment / revision reason
  editHistory?: InvoiceEditRecord[]; // Section 128 statutory audit trail
}

export interface InvoiceEditRecord {
  editedAt: string;
  editNote: string;
  previousGrandTotal: number;
  previousTaxableAmount: number;
  previousItemsCount: number;
  version: number;
}

// ==================== TALLY / SAP VOUCHER & LEDGER ENGINE ====================

export type VoucherType = 
  | 'Contra'     // F4: Bank to Cash, Cash to Bank, Bank to Bank
  | 'Payment'    // F5: Expense / Vendor payment
  | 'Receipt'    // F6: Customer payment receipt / Income
  | 'Journal'    // F7: Non-cash adjustments, provisions, depreciation
  | 'Sales'      // F8: Tax Invoice / Credit Sale
  | 'Purchase'   // F9: Vendor Bill / Inward supply
  | 'Credit Note'// Sales return / rebate
  | 'Debit Note';// Purchase return / supplier debit

export interface VoucherEditRecord {
  editedAt: string;
  editNote: string;
  previousAmount: number;
  previousDebitAccount: string;
  previousCreditAccount: string;
  previousNarration?: string;
  version: number;
}

export interface AccountingVoucher {
  id: string; // VCH-2026-0001
  voucherNumber: string; // e.g. PMT-2026-001, RCP-2026-001
  voucherType: VoucherType;
  date: string; // YYYY-MM-DD
  referenceNo?: string; // Cheque No / UTR / Bill No
  partyId?: string;
  partyName?: string;
  debitAccount: string; // Account Code / Name
  creditAccount: string; // Account Code / Name
  amount: number;
  taxAmount?: number;
  paymentMode: 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash' | 'Card' | 'Journal Adjustment';
  narration: string; // Tally style Narration (Being payment made for...)
  status: 'Posted' | 'Draft' | 'Reconciled';
  createdAt: string;
  updatedAt?: string;
  version?: number; // Revision sequence (v1 -> v2)
  editNote?: string; // Reason for alteration / edit note
  editHistory?: VoucherEditRecord[]; // MCA / Section 128 audit trail
  lines: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    note?: string;
  }[];
}

export interface AccountHead {
  code: string;
  name: string;
  group: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Direct Expenses' | 'Indirect Expenses';
  subGroup: string; // Current Assets, Bank, Fixed Assets, Current Liabilities, etc.
  openingBalance: number;
  currentBalance: number;
  balanceType: 'Debit' | 'Credit';
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

// ==================== SAP / TALLY FINANCIAL STATEMENTS ====================

export interface BalanceSheetReport {
  asOfDate: string;
  financialYear: string;
  equitiesAndLiabilities: {
    shareholdersFunds: {
      shareCapital: number;
      reservesAndSurplus: number;
      currentYearEarnings: number;
      total: number;
    };
    nonCurrentLiabilities: {
      longTermBorrowings: number;
      deferredTaxLiabilities: number;
      total: number;
    };
    currentLiabilities: {
      tradePayables: number;
      outputGstPayable: number;
      shortTermProvisions: number;
      otherCurrentLiabilities: number;
      total: number;
    };
    totalLiabilitiesAndEquity: number;
  };
  assets: {
    nonCurrentAssets: {
      fixedAssetsPlantTech: number;
      intangibleAssetsSoftware: number;
      accumulatedDepreciation: number;
      netFixedAssets: number;
      total: number;
    };
    currentAssets: {
      cashAndBankBalances: number;
      tradeReceivablesDebtors: number;
      inputTaxCreditGstAsset: number;
      prepaidExpenses: number;
      inventories: number;
      total: number;
    };
    totalAssets: number;
  };
  isBalanced: boolean;
  workingCapital: number;
}

export interface ProfitAndLossReport {
  period: string;
  financialYear: string;
  income: {
    grossSalesRevenue: number;
    otherOperatingRevenue: number;
    lessGstPaid: number;
    netRevenue: number;
  };
  costOfGoodsSold: {
    openingStock: number;
    purchases: number;
    directTechnicalExpenses: number;
    lessClosingStock: number;
    totalCOGS: number;
  };
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: {
    salariesAndStaffCosts: number;
    cloudInfrastructureAndServers: number;
    rentAndUtilities: number;
    marketingAndClientAcquisition: number;
    legalAndAuditFees: number;
    depreciationAndAmortization: number;
    totalOperatingExpenses: number;
  };
  operatingProfitEBITDA: number;
  taxProvision: number;
  netProfitAfterTax: number;
  netMarginPercent: number;
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  group: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  asOfDate: string;
  financialYear: string;
  accounts: TrialBalanceItem[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface AgingBucket {
  partyId: string;
  partyName: string;
  gstin?: string;
  totalOutstanding: number;
  notDue: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  daysOver90: number;
}

export interface AgingAnalysisReport {
  asOfDate: string;
  totalReceivables: number;
  totalPayables: number;
  receivablesAging: AgingBucket[];
  payablesAging: AgingBucket[];
}

export interface BankReconciliationItem {
  id: string;
  date: string;
  voucherNumber: string;
  partyOrParticulars: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal';
  statementDate?: string;
  status: 'Reconciled' | 'Pending';
}

export interface BankReconciliationReport {
  bankName: string;
  accountNumber: string;
  bookBalance: number;
  bankStatementBalance: number;
  unreconciledDeposits: number;
  unpresentedCheques: number;
  adjustedBalance: number;
  isReconciled: boolean;
  transactions: BankReconciliationItem[];
}

// ==================== STATUTORY GST RETURNS ====================

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
