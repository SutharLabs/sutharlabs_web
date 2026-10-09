import fs from 'fs';
import path from 'path';
import os from 'os';
import { getPrismaClient } from '../../../api/_utils.js';
import {
  CompanyProfile,
  PartyCustomer,
  ItemMaster,
  GSTInvoice,
  JournalEntry,
  GSTR1Summary,
  GSTR3BSummary
} from './types.js';
import {
  calculateItemTaxes,
  determineSupplyType,
  amountInWordsIndian,
  generateEInvoiceIRN,
  generateSignedQrPayload,
  STATE_CODE_MAP
} from './gstEngine.js';

function getAccountingDataDirectory(): string {
  if (process.env.APP_DATA_DIR) {
    const custom = path.resolve(process.env.APP_DATA_DIR, 'accounting');
    try {
      if (!fs.existsSync(custom)) fs.mkdirSync(custom, { recursive: true });
      return custom;
    } catch {}
  }

  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );

  if (isServerless) {
    const tmpDir = path.join(os.tmpdir(), 'sutharlabs-accounting');
    try {
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      return tmpDir;
    } catch {
      return os.tmpdir();
    }
  }

  const localDir = path.join(process.cwd(), 'data', 'accounting');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    const fallbackTmp = path.join(os.tmpdir(), 'sutharlabs-accounting');
    try {
      if (!fs.existsSync(fallbackTmp)) fs.mkdirSync(fallbackTmp, { recursive: true });
      return fallbackTmp;
    } catch {
      return os.tmpdir();
    }
  }
}

// In-memory cache for ultra-fast response & environments with read-only filesystems
const memoryCache = new Map<string, any>();

function loadJson<T>(filename: string, defaultValue: T): T {
  const dir = getAccountingDataDirectory();
  const filePath = path.join(dir, filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      memoryCache.set(filename, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn(`[AccountingStorage] Failed to read ${filename}, checking memory cache:`, err);
  }

  if (memoryCache.has(filename)) {
    return memoryCache.get(filename);
  }

  saveJson(filename, defaultValue);
  return defaultValue;
}

function saveJson<T>(filename: string, data: T): void {
  memoryCache.set(filename, data);
  const dir = getAccountingDataDirectory();
  const filePath = path.join(dir, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[AccountingStorage] Could not write ${filename} to disk, cached in-memory:`, err);
  }
}

// ==================== DEFAULT SEED DATA ====================

export const DEFAULT_COMPANY: CompanyProfile = {
  legalName: 'SutharLabs Technologies India Private Limited',
  tradeName: 'SutharLabs Tech',
  gstin: '24AAACS7492D1ZP', // Valid Gujarat GSTIN format
  pan: 'AAACS7492D',
  stateCode: '24',
  stateName: 'Gujarat',
  addressLine1: 'Infinity Tech Park, Complex 402, Sarkhej-Gandhinagar Hwy',
  city: 'Ahmedabad',
  pincode: '380054',
  email: 'billing@sutharlabs.com',
  phone: '+91 79 4892 0100',
  website: 'https://sutharlabs.com',
  bankName: 'HDFC Bank Ltd',
  bankAccountNumber: '50200048920199',
  bankIfsc: 'HDFC0000060',
  bankBranch: 'SG Highway Branch, Ahmedabad',
  upiId: 'sutharlabs@hdfcbank',
  authorizedSignatory: 'Suresh Suthar (Managing Director)',
  invoicePrefix: 'SL/2026-27/',
  currentFiscalYear: '2026-27',
  isCompositionScheme: false
};

export const DEFAULT_PARTIES: PartyCustomer[] = [
  {
    id: 'party_1',
    name: 'Tata Consultancy Services Limited',
    tradeName: 'TCS Enterprise',
    gstin: '27AAACT2727Q1ZW', // Maharashtra (27)
    pan: 'AAACT2727Q',
    partyType: 'B2B',
    stateCode: '27',
    stateName: 'Maharashtra',
    billingAddress: 'TCS House, Raveline Street, Fort, Mumbai, MH - 400001',
    email: 'vendor.invoices@tcs.com',
    phone: '+91 22 6778 9999',
    createdAt: '2026-04-01T10:00:00Z'
  },
  {
    id: 'party_2',
    name: 'Infosys Limited',
    tradeName: 'Infosys Tech',
    gstin: '29AAACI4322L1ZT', // Karnataka (29)
    pan: 'AAACI4322L',
    partyType: 'B2B',
    stateCode: '29',
    stateName: 'Karnataka',
    billingAddress: 'Electronics City, Hosur Road, Bengaluru, KA - 560100',
    email: 'accounts.payable@infosys.com',
    phone: '+91 80 2852 0261',
    createdAt: '2026-04-02T11:00:00Z'
  },
  {
    id: 'party_3',
    name: 'Adani Digital Labs Pvt Ltd',
    tradeName: 'Adani Digital',
    gstin: '24AAACA8841P1ZB', // Gujarat (24) -> Intra-state!
    pan: 'AAACA8841P',
    partyType: 'B2B',
    stateCode: '24',
    stateName: 'Gujarat',
    billingAddress: 'Adani Corporate House, Shantigram, SG Highway, Ahmedabad, GJ - 382421',
    email: 'finance.digital@adani.com',
    phone: '+91 79 2656 5555',
    createdAt: '2026-04-03T14:30:00Z'
  },
  {
    id: 'party_4',
    name: 'Razorpay Software Private Limited',
    tradeName: 'Razorpay Payments',
    gstin: '29AABCR8023D1ZX', // Karnataka (29)
    pan: 'AABCR8023D',
    partyType: 'B2B',
    stateCode: '29',
    stateName: 'Karnataka',
    billingAddress: 'SJRS Park, 1st Cross Rd, Koramangala, Bengaluru, KA - 560034',
    email: 'fin-ops@razorpay.com',
    phone: '+91 80 4666 9999',
    createdAt: '2026-04-05T09:15:00Z'
  }
];

export const DEFAULT_ITEMS: ItemMaster[] = [
  {
    id: 'item_1',
    code: 'SRV-AI-ENG',
    name: 'AI Agent Architecture & Cloud Engineering',
    type: 'Services',
    hsnSacCode: '998313',
    unit: 'HRS',
    unitPrice: 4500.0,
    gstRate: 18,
    description: 'High performance autonomous agent deployment and workflow microservices'
  },
  {
    id: 'item_2',
    code: 'SRV-DATA-PIPE',
    name: 'Real-time Financial Telemetry Pipeline',
    type: 'Services',
    hsnSacCode: '998314',
    unit: 'MTH',
    unitPrice: 150000.0,
    gstRate: 18,
    description: 'Low latency algorithmic stock analytics streaming infrastructure'
  },
  {
    id: 'item_3',
    code: 'SRV-CONSULT',
    name: 'Enterprise Quantitative Strategy Consulting',
    type: 'Services',
    hsnSacCode: '998311',
    unit: 'HRS',
    unitPrice: 7500.0,
    gstRate: 18,
    description: 'Bespoke machine learning backtesting advisory and code audit'
  },
  {
    id: 'item_4',
    code: 'HW-EDGE-NODE',
    name: 'Quantum-Grade On-Prem Inference Server Node',
    type: 'Goods',
    hsnSacCode: '847141',
    unit: 'NOS',
    unitPrice: 285000.0,
    gstRate: 18,
    description: 'Custom GPU-accelerated edge inference server rack unit'
  }
];

// Seed initial GST Invoices reflecting both Intra-state and Inter-state transactions
export function getInitialInvoices(): GSTInvoice[] {
  const company = DEFAULT_COMPANY;
  const tcs = DEFAULT_PARTIES[0]; // Inter-state (MH: 27 vs GJ: 24)
  const adani = DEFAULT_PARTIES[2]; // Intra-state (GJ: 24 vs GJ: 24)
  const infy = DEFAULT_PARTIES[1]; // Inter-state (KA: 29 vs GJ: 24)
  const razorpay = DEFAULT_PARTIES[3]; // Inter-state (KA: 29 vs GJ: 24)

  const inv1: GSTInvoice = buildGSTInvoiceObject({
    invoiceNumber: 'SL/2026-27/0001',
    invoiceDate: '2026-04-10',
    dueDate: '2026-05-10',
    supplier: company,
    buyer: tcs,
    placeOfSupplyStateCode: '27',
    items: [
      {
        itemDescription: 'AI Agent Architecture & Cloud Engineering',
        hsnSacCode: '998313',
        quantity: 40,
        unit: 'HRS',
        rate: 4500,
        discountPercent: 0,
        gstRate: 18
      },
      {
        itemDescription: 'Real-time Financial Telemetry Pipeline',
        hsnSacCode: '998314',
        quantity: 1,
        unit: 'MTH',
        rate: 150000,
        discountPercent: 5,
        gstRate: 18
      }
    ],
    status: 'Paid',
    amountPaid: 380550,
    paymentMode: 'Bank Transfer'
  });

  const inv2: GSTInvoice = buildGSTInvoiceObject({
    invoiceNumber: 'SL/2026-27/0002',
    invoiceDate: '2026-04-18',
    dueDate: '2026-05-18',
    supplier: company,
    buyer: adani, // Intra-state
    items: [
      {
        itemDescription: 'Enterprise Quantitative Strategy Consulting',
        hsnSacCode: '998311',
        quantity: 32,
        unit: 'HRS',
        rate: 7500,
        discountPercent: 0,
        gstRate: 18
      }
    ],
    status: 'Paid',
    amountPaid: 283200,
    paymentMode: 'Bank Transfer'
  });

  const inv3: GSTInvoice = buildGSTInvoiceObject({
    invoiceNumber: 'SL/2026-27/0003',
    invoiceDate: '2026-05-02',
    dueDate: '2026-06-02',
    supplier: company,
    buyer: infy,
    items: [
      {
        itemDescription: 'Quantum-Grade On-Prem Inference Server Node',
        hsnSacCode: '847141',
        quantity: 1,
        unit: 'NOS',
        rate: 285000,
        discountPercent: 0,
        gstRate: 18
      }
    ],
    status: 'Issued',
    amountPaid: 0,
    paymentMode: 'Bank Transfer'
  });

  const inv4: GSTInvoice = buildGSTInvoiceObject({
    invoiceNumber: 'SL/2026-27/0004',
    invoiceDate: '2026-05-12',
    dueDate: '2026-06-12',
    supplier: company,
    buyer: razorpay,
    items: [
      {
        itemDescription: 'AI Agent Architecture & Cloud Engineering',
        hsnSacCode: '998313',
        quantity: 25,
        unit: 'HRS',
        rate: 4500,
        discountPercent: 0,
        gstRate: 18
      }
    ],
    status: 'Issued',
    amountPaid: 0,
    paymentMode: 'UPI'
  });

  return [inv4, inv3, inv2, inv1];
}

/**
 * Builds a complete GST Tax Invoice object including line item calculations,
 * CGST/SGST/IGST breakdown, total in words, and E-Invoicing IRN hash.
 */
export function buildGSTInvoiceObject(params: {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  supplier: CompanyProfile;
  buyer: PartyCustomer;
  placeOfSupplyStateCode?: string;
  reverseChargeApplicable?: boolean;
  items: {
    itemDescription: string;
    hsnSacCode: string;
    quantity: number;
    unit: string;
    rate: number;
    discountPercent?: number;
    gstRate: number;
    cessRate?: number;
  }[];
  status?: GSTInvoice['status'];
  amountPaid?: number;
  paymentMode?: GSTInvoice['paymentMode'];
  notes?: string;
  terms?: string;
}): GSTInvoice {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    supplier,
    buyer,
    items: rawItems,
    status = 'Issued',
    amountPaid = 0,
    paymentMode = 'Bank Transfer',
    notes,
    terms
  } = params;

  const posCode = params.placeOfSupplyStateCode || buyer.stateCode || supplier.stateCode;
  const posState = STATE_CODE_MAP.get(posCode);
  const posStateName = posState ? posState.name : 'Gujarat';

  const { isInterState } = determineSupplyType(supplier.stateCode, posCode);

  let grossTotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let cessTotal = 0;

  const processedItems = rawItems.map((item, idx) => {
    const rawValue = item.quantity * item.rate;
    const discountPercent = item.discountPercent || 0;
    const discountAmount = Math.round((rawValue * (discountPercent / 100)) * 100) / 100;
    const itemTaxable = Math.round((rawValue - discountAmount) * 100) / 100;

    const taxes = calculateItemTaxes(
      itemTaxable,
      item.gstRate,
      isInterState,
      item.cessRate || 0
    );

    grossTotal += rawValue;
    totalDiscount += discountAmount;
    taxableAmount += itemTaxable;
    cgstTotal += taxes.cgstAmount;
    sgstTotal += taxes.sgstAmount;
    igstTotal += taxes.igstAmount;
    cessTotal += taxes.cessAmount;

    return {
      id: `item_${Date.now()}_${idx}`,
      itemDescription: item.itemDescription,
      hsnSacCode: item.hsnSacCode,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      discountPercent,
      discountAmount,
      taxableValue: itemTaxable,
      gstRate: item.gstRate as any,
      cgstRate: taxes.cgstRate,
      cgstAmount: taxes.cgstAmount,
      sgstRate: taxes.sgstRate,
      sgstAmount: taxes.sgstAmount,
      igstRate: taxes.igstRate,
      igstAmount: taxes.igstAmount,
      cessRate: item.cessRate || 0,
      cessAmount: taxes.cessAmount,
      totalAmount: taxes.totalAmount
    };
  });

  const totalTax = Math.round((cgstTotal + sgstTotal + igstTotal + cessTotal) * 100) / 100;
  const exactGrandTotal = taxableAmount + totalTax;
  const roundedGrandTotal = Math.round(exactGrandTotal);
  const roundOff = Math.round((roundedGrandTotal - exactGrandTotal) * 100) / 100;

  const words = amountInWordsIndian(roundedGrandTotal);

  const irn = generateEInvoiceIRN(
    supplier.gstin,
    supplier.currentFiscalYear || '2026-27',
    'INV',
    invoiceNumber
  );

  const signedQr = generateSignedQrPayload({
    sellerGstin: supplier.gstin,
    buyerGstin: buyer.gstin || 'URP',
    docNo: invoiceNumber,
    docDate: invoiceDate,
    totalValue: roundedGrandTotal,
    itemCount: processedItems.length,
    irn
  });

  const now = new Date().toISOString();

  return {
    id: invoiceNumber,
    invoiceNumber,
    invoiceDate,
    dueDate,
    supplier: {
      legalName: supplier.legalName,
      tradeName: supplier.tradeName,
      gstin: supplier.gstin,
      pan: supplier.pan,
      stateCode: supplier.stateCode,
      stateName: supplier.stateName,
      address: `${supplier.addressLine1}, ${supplier.city}, ${supplier.stateName} - ${supplier.pincode}`,
      bankName: supplier.bankName,
      bankAccountNumber: supplier.bankAccountNumber,
      bankIfsc: supplier.bankIfsc,
      upiId: supplier.upiId
    },
    buyer: {
      customerId: buyer.id,
      legalName: buyer.name,
      tradeName: buyer.tradeName,
      gstin: buyer.gstin,
      pan: buyer.pan,
      partyType: buyer.partyType,
      stateCode: buyer.stateCode,
      stateName: buyer.stateName,
      billingAddress: buyer.billingAddress,
      shippingAddress: buyer.shippingAddress || buyer.billingAddress,
      email: buyer.email,
      phone: buyer.phone
    },
    placeOfSupplyStateCode: posCode,
    placeOfSupplyStateName: posStateName,
    isInterState,
    reverseChargeApplicable: params.reverseChargeApplicable || false,
    items: processedItems,
    grossTotal: Math.round(grossTotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    cgstTotal: Math.round(cgstTotal * 100) / 100,
    sgstTotal: Math.round(sgstTotal * 100) / 100,
    igstTotal: Math.round(igstTotal * 100) / 100,
    cessTotal: Math.round(cessTotal * 100) / 100,
    totalTax,
    roundOff,
    grandTotal: roundedGrandTotal,
    amountInWords: words,
    status,
    amountPaid,
    balanceDue: Math.max(0, roundedGrandTotal - amountPaid),
    paymentMode,
    eInvoice: {
      irn,
      ackNo: `1120${Math.floor(100000000 + Math.random() * 900000000)}`,
      ackDate: `${invoiceDate} 12:45:00`,
      signedQr,
      status: 'GENERATED'
    },
    notes: notes || 'Thank you for your business. Payment is due within 30 days.',
    terms: terms || '1. Goods/Services once sold are subject to SutharLabs Master Services Agreement.\n2. Invoices overdue past 30 days attract 18% p.a. interest.\n3. Subject to Ahmedabad jurisdiction.',
    createdAt: now,
    updatedAt: now
  };
}

// ==================== STORAGE CONTROLLER API ====================

export class AccountingStorage {
  static getCompany(): CompanyProfile {
    return loadJson<CompanyProfile>('company_profile.json', DEFAULT_COMPANY);
  }

  static updateCompany(profile: Partial<CompanyProfile>): CompanyProfile {
    const current = this.getCompany();
    const updated = { ...current, ...profile };
    saveJson('company_profile.json', updated);
    return updated;
  }

  static getParties(): PartyCustomer[] {
    return loadJson<PartyCustomer[]>('parties.json', DEFAULT_PARTIES);
  }

  static addParty(party: Omit<PartyCustomer, 'id' | 'createdAt'>): PartyCustomer {
    const parties = this.getParties();
    const stateObj = STATE_CODE_MAP.get(party.stateCode);
    const newParty: PartyCustomer = {
      ...party,
      id: `party_${Date.now()}`,
      stateName: stateObj ? stateObj.name : party.stateName || 'Gujarat',
      createdAt: new Date().toISOString()
    };
    parties.unshift(newParty);
    saveJson('parties.json', parties);
    return newParty;
  }

  static getItems(): ItemMaster[] {
    return loadJson<ItemMaster[]>('items.json', DEFAULT_ITEMS);
  }

  static addItem(item: Omit<ItemMaster, 'id'>): ItemMaster {
    const items = this.getItems();
    const newItem: ItemMaster = {
      ...item,
      id: `item_${Date.now()}`
    };
    items.unshift(newItem);
    saveJson('items.json', items);
    return newItem;
  }

  static getInvoices(): GSTInvoice[] {
    return loadJson<GSTInvoice[]>('invoices.json', getInitialInvoices());
  }

  static getInvoiceById(id: string): GSTInvoice | undefined {
    const invoices = this.getInvoices();
    return invoices.find(i => i.id === id || i.invoiceNumber === id);
  }

  static async createInvoice(invoiceData: {
    buyerId?: string;
    buyerName?: string;
    buyerGstin?: string;
    buyerStateCode?: string;
    buyerAddress?: string;
    placeOfSupplyStateCode?: string;
    invoiceDate?: string;
    dueDate?: string;
    items: {
      itemDescription: string;
      hsnSacCode: string;
      quantity: number;
      unit: string;
      rate: number;
      discountPercent?: number;
      gstRate: number;
    }[];
    status?: GSTInvoice['status'];
    notes?: string;
  }): Promise<GSTInvoice> {
    const company = this.getCompany();
    const invoices = this.getInvoices();
    const parties = this.getParties();

    // Determine Party
    let buyerParty: PartyCustomer | undefined;
    if (invoiceData.buyerId) {
      buyerParty = parties.find(p => p.id === invoiceData.buyerId);
    }
    if (!buyerParty && invoiceData.buyerName) {
      const stateObj = STATE_CODE_MAP.get(invoiceData.buyerStateCode || company.stateCode);
      buyerParty = {
        id: `party_${Date.now()}`,
        name: invoiceData.buyerName,
        gstin: invoiceData.buyerGstin,
        partyType: invoiceData.buyerGstin ? 'B2B' : 'B2C',
        stateCode: invoiceData.buyerStateCode || company.stateCode,
        stateName: stateObj ? stateObj.name : company.stateName,
        billingAddress: invoiceData.buyerAddress || `${stateObj?.name || 'Ahmedabad'}, India`,
        email: 'billing@client.com',
        phone: '+91 98000 00000',
        createdAt: new Date().toISOString()
      };
      // Save new buyer for reuse
      parties.push(buyerParty);
      saveJson('parties.json', parties);
    }

    if (!buyerParty) {
      throw new Error('Valid buyer details or client name required.');
    }

    // Sequence invoice number
    const seq = invoices.length + 1;
    const prefix = company.invoicePrefix || 'SL/2026-27/';
    const invoiceNumber = `${prefix}${seq.toString().padStart(4, '0')}`;

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newInvoice = buildGSTInvoiceObject({
      invoiceNumber,
      invoiceDate: invoiceData.invoiceDate || today,
      dueDate: invoiceData.dueDate || dueDate,
      supplier: company,
      buyer: buyerParty,
      placeOfSupplyStateCode: invoiceData.placeOfSupplyStateCode || buyerParty.stateCode,
      items: invoiceData.items,
      status: invoiceData.status || 'Issued',
      notes: invoiceData.notes
    });

    invoices.unshift(newInvoice);
    saveJson('invoices.json', invoices);

    // Sync to Prisma for backward-compatibility if active
    try {
      const prisma = getPrismaClient();
      await prisma.invoice.upsert({
        where: { id: newInvoice.id },
        update: {
          client: newInvoice.buyer.legalName,
          amount: newInvoice.grandTotal,
          status: newInvoice.status === 'Paid' ? 'Paid' : 'Pending'
        },
        create: {
          id: newInvoice.id,
          date: newInvoice.invoiceDate,
          client: newInvoice.buyer.legalName,
          amount: newInvoice.grandTotal,
          status: newInvoice.status === 'Paid' ? 'Paid' : 'Pending'
        }
      });
    } catch (e) {
      // Ignore Prisma sync error in offline/local mock mode
    }

    return newInvoice;
  }

  static async updateInvoiceStatus(id: string, status: GSTInvoice['status']): Promise<GSTInvoice | null> {
    const invoices = this.getInvoices();
    const index = invoices.findIndex(i => i.id === id || i.invoiceNumber === id);
    if (index === -1) return null;

    invoices[index].status = status;
    if (status === 'Paid') {
      invoices[index].amountPaid = invoices[index].grandTotal;
      invoices[index].balanceDue = 0;
    } else if (status === 'Draft' || status === 'Issued') {
      invoices[index].amountPaid = 0;
      invoices[index].balanceDue = invoices[index].grandTotal;
    }
    invoices[index].updatedAt = new Date().toISOString();

    saveJson('invoices.json', invoices);

    // Sync to Prisma
    try {
      const prisma = getPrismaClient();
      await prisma.invoice.update({
        where: { id },
        data: { status: status === 'Paid' ? 'Paid' : 'Pending' }
      });
    } catch (e) {}

    return invoices[index];
  }

  static async deleteInvoice(id: string): Promise<boolean> {
    const invoices = this.getInvoices();
    const filtered = invoices.filter(i => i.id !== id && i.invoiceNumber !== id);
    if (filtered.length === invoices.length) return false;

    saveJson('invoices.json', filtered);

    try {
      const prisma = getPrismaClient();
      await prisma.invoice.delete({ where: { id } });
    } catch (e) {}

    return true;
  }

  // ==================== GST REPORTING ENGINES ====================

  /**
   * Generates GSTR-1 Return Filing breakdown compliant with GST Portal JSON schema
   */
  static getGSTR1Report(period: string = 'Current Quarter'): GSTR1Summary {
    const invoices = this.getInvoices().filter(i => i.status !== 'Cancelled');
    const company = this.getCompany();

    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const b2bMap = new Map<string, any>();
    const b2clList: any[] = [];
    const b2csMap = new Map<string, any>();
    const hsnMap = new Map<string, any>();

    for (const inv of invoices) {
      totalTaxableValue += inv.taxableAmount;
      totalCGST += inv.cgstTotal;
      totalSGST += inv.sgstTotal;
      totalIGST += inv.igstTotal;

      const isB2B = Boolean(inv.buyer.gstin && inv.buyer.gstin.length === 15);

      if (isB2B) {
        const key = inv.buyer.gstin!;
        const existing = b2bMap.get(key) || {
          recipientGstin: inv.buyer.gstin,
          recipientName: inv.buyer.legalName,
          invoiceCount: 0,
          taxableValue: 0,
          igst: 0,
          cgst: 0,
          sgst: 0
        };
        existing.invoiceCount += 1;
        existing.taxableValue += inv.taxableAmount;
        existing.igst += inv.igstTotal;
        existing.cgst += inv.cgstTotal;
        existing.sgst += inv.sgstTotal;
        b2bMap.set(key, existing);
      } else if (inv.isInterState && inv.grandTotal > 250000) {
        // Interstate B2C Large > 2.5 Lakhs
        b2clList.push({
          stateCode: inv.placeOfSupplyStateCode,
          stateName: inv.placeOfSupplyStateName,
          invoiceCount: 1,
          taxableValue: inv.taxableAmount,
          igst: inv.igstTotal
        });
      } else {
        // B2C Small
        const key = `${inv.placeOfSupplyStateCode}_${inv.items[0]?.gstRate || 18}`;
        const existing = b2csMap.get(key) || {
          supplyType: inv.isInterState ? 'Inter-State' : 'Intra-State',
          placeOfSupply: `${inv.placeOfSupplyStateCode}-${inv.placeOfSupplyStateName}`,
          gstRate: inv.items[0]?.gstRate || 18,
          taxableValue: 0,
          igst: 0,
          cgst: 0,
          sgst: 0
        };
        existing.taxableValue += inv.taxableAmount;
        existing.igst += inv.igstTotal;
        existing.cgst += inv.cgstTotal;
        existing.sgst += inv.sgstTotal;
        b2csMap.set(key, existing);
      }

      // HSN Breakdown
      for (const item of inv.items) {
        const hsn = item.hsnSacCode || '998313';
        const existingHsn = hsnMap.get(hsn) || {
          hsnCode: hsn,
          description: item.itemDescription,
          unit: item.unit,
          totalQuantity: 0,
          totalValue: 0,
          taxableValue: 0,
          integratedTax: 0,
          centralTax: 0,
          stateTax: 0,
          cess: 0
        };
        existingHsn.totalQuantity += item.quantity;
        existingHsn.totalValue += item.totalAmount;
        existingHsn.taxableValue += item.taxableValue;
        existingHsn.integratedTax += item.igstAmount;
        existingHsn.centralTax += item.cgstAmount;
        existingHsn.stateTax += item.sgstAmount;
        existingHsn.cess += item.cessAmount;
        hsnMap.set(hsn, existingHsn);
      }
    }

    return {
      financialYear: company.currentFiscalYear || '2026-27',
      returnPeriod: period,
      totalInvoices: invoices.length,
      totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
      totalCGST: Math.round(totalCGST * 100) / 100,
      totalSGST: Math.round(totalSGST * 100) / 100,
      totalIGST: Math.round(totalIGST * 100) / 100,
      totalTaxLiability: Math.round((totalCGST + totalSGST + totalIGST) * 100) / 100,
      b2b: Array.from(b2bMap.values()),
      b2cl: b2clList,
      b2cs: Array.from(b2csMap.values()),
      hsnSummary: Array.from(hsnMap.values())
    };
  }

  /**
   * Generates GSTR-3B Consolidated Return Summary
   */
  static getGSTR3BReport(): GSTR3BSummary {
    const gstr1 = this.getGSTR1Report();

    // Simulated Input Tax Credit (ITC) for demo parity with Indian enterprises
    const simulatedItc = {
      integratedTax: Math.round(gstr1.totalIGST * 0.35 * 100) / 100,
      centralTax: Math.round(gstr1.totalCGST * 0.35 * 100) / 100,
      stateTax: Math.round(gstr1.totalSGST * 0.35 * 100) / 100,
      cess: 0
    };

    return {
      financialYear: gstr1.financialYear,
      returnPeriod: gstr1.returnPeriod,
      outwardTaxableSupplies: {
        totalTaxableValue: gstr1.totalTaxableValue,
        integratedTax: gstr1.totalIGST,
        centralTax: gstr1.totalCGST,
        stateTax: gstr1.totalSGST,
        cess: 0
      },
      eligibleITC: simulatedItc,
      netTaxPayable: {
        integratedTax: Math.max(0, Math.round((gstr1.totalIGST - simulatedItc.integratedTax) * 100) / 100),
        centralTax: Math.max(0, Math.round((gstr1.totalCGST - simulatedItc.centralTax) * 100) / 100),
        stateTax: Math.max(0, Math.round((gstr1.totalSGST - simulatedItc.stateTax) * 100) / 100),
        cess: 0
      }
    };
  }

  /**
   * Generates Indian Double-Entry General Ledger journal entries from active invoices
   */
  static getGeneralLedger(): JournalEntry[] {
    const invoices = this.getInvoices().filter(i => i.status !== 'Cancelled');
    const entries: JournalEntry[] = [];

    for (const inv of invoices) {
      const isPaid = inv.status === 'Paid';
      const lines: JournalEntry['lines'] = [];

      // 1. Debit: Debtor (Accounts Receivable) or Bank if already paid
      lines.push({
        accountCode: isPaid ? '1010-BANK-HDFC' : '1100-AR-DEBTORS',
        accountName: isPaid ? 'HDFC Current Account' : `Accounts Receivable - ${inv.buyer.legalName}`,
        debit: inv.grandTotal,
        credit: 0
      });

      // 2. Credit: Sales Revenue
      lines.push({
        accountCode: '4000-REV-SERVICES',
        accountName: 'Sales & Professional Services Revenue',
        debit: 0,
        credit: inv.taxableAmount
      });

      // 3. Credit: Duties & Taxes (Output CGST / SGST / IGST)
      if (inv.cgstTotal > 0) {
        lines.push({
          accountCode: '2110-OUTPUT-CGST',
          accountName: 'Output CGST Payable',
          debit: 0,
          credit: inv.cgstTotal
        });
      }
      if (inv.sgstTotal > 0) {
        lines.push({
          accountCode: '2120-OUTPUT-SGST',
          accountName: 'Output SGST Payable',
          debit: 0,
          credit: inv.sgstTotal
        });
      }
      if (inv.igstTotal > 0) {
        lines.push({
          accountCode: '2130-OUTPUT-IGST',
          accountName: 'Output IGST Payable',
          debit: 0,
          credit: inv.igstTotal
        });
      }

      // Round off adjustment if any
      if (inv.roundOff !== 0) {
        if (inv.roundOff > 0) {
          lines.push({
            accountCode: '4990-ROUND-OFF',
            accountName: 'Round Off Discrepancy',
            debit: 0,
            credit: inv.roundOff
          });
        } else {
          lines.push({
            accountCode: '4990-ROUND-OFF',
            accountName: 'Round Off Discrepancy',
            debit: Math.abs(inv.roundOff),
            credit: 0
          });
        }
      }

      entries.push({
        id: `JRN-${inv.id}`,
        date: inv.invoiceDate,
        referenceNo: inv.invoiceNumber,
        description: `Sales invoice posting for ${inv.buyer.legalName} (POS: ${inv.placeOfSupplyStateName})`,
        lines
      });
    }

    return entries;
  }
}
