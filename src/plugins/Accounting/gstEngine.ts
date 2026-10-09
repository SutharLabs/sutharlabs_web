/**
 * 37 Official Indian States and Union Territories with 2-digit GST State Codes.
 * As defined by GST Council and CBIC (Central Board of Indirect Taxes and Customs).
 */
export interface IndianState {
  code: string;
  name: string;
  type: 'State' | 'Union Territory';
}

export const INDIAN_GST_STATES: IndianState[] = [
  { code: '01', name: 'Jammu and Kashmir', type: 'Union Territory' },
  { code: '02', name: 'Himachal Pradesh', type: 'State' },
  { code: '03', name: 'Punjab', type: 'State' },
  { code: '04', name: 'Chandigarh', type: 'Union Territory' },
  { code: '05', name: 'Uttarakhand', type: 'State' },
  { code: '06', name: 'Haryana', type: 'State' },
  { code: '07', name: 'Delhi', type: 'Union Territory' },
  { code: '08', name: 'Rajasthan', type: 'State' },
  { code: '09', name: 'Uttar Pradesh', type: 'State' },
  { code: '10', name: 'Bihar', type: 'State' },
  { code: '11', name: 'Sikkim', type: 'State' },
  { code: '12', name: 'Arunachal Pradesh', type: 'State' },
  { code: '13', name: 'Nagaland', type: 'State' },
  { code: '14', name: 'Manipur', type: 'State' },
  { code: '15', name: 'Mizoram', type: 'State' },
  { code: '16', name: 'Tripura', type: 'State' },
  { code: '17', name: 'Meghalaya', type: 'State' },
  { code: '18', name: 'Assam', type: 'State' },
  { code: '19', name: 'West Bengal', type: 'State' },
  { code: '20', name: 'Jharkhand', type: 'State' },
  { code: '21', name: 'Odisha', type: 'State' },
  { code: '22', name: 'Chhattisgarh', type: 'State' },
  { code: '23', name: 'Madhya Pradesh', type: 'State' },
  { code: '24', name: 'Gujarat', type: 'State' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'Union Territory' },
  { code: '27', name: 'Maharashtra', type: 'State' },
  { code: '28', name: 'Andhra Pradesh', type: 'State' },
  { code: '29', name: 'Karnataka', type: 'State' },
  { code: '30', name: 'Goa', type: 'State' },
  { code: '31', name: 'Lakshadweep', type: 'Union Territory' },
  { code: '32', name: 'Kerala', type: 'State' },
  { code: '33', name: 'Tamil Nadu', type: 'State' },
  { code: '34', name: 'Puducherry', type: 'Union Territory' },
  { code: '35', name: 'Andaman and Nicobar Islands', type: 'Union Territory' },
  { code: '36', name: 'Telangana', type: 'State' },
  { code: '37', name: 'Andhra Pradesh (New)', type: 'State' },
  { code: '38', name: 'Ladakh', type: 'Union Territory' }
];

export const STATE_CODE_MAP = new Map<string, IndianState>(
  INDIAN_GST_STATES.map(s => [s.code, s])
);

/**
 * Standard Indian GST Tax Slabs
 */
export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GSTRate = (typeof GST_RATES)[number];

/**
 * Predefined Indian HSN/SAC Directory for Goods and Services
 */
export interface HsnMasterEntry {
  code: string;
  type: 'HSN' | 'SAC';
  description: string;
  defaultRate: GSTRate;
  defaultUnit: string;
}

export const COMMON_HSN_SAC_CATALOG: HsnMasterEntry[] = [
  { code: '998313', type: 'SAC', description: 'Information technology (IT) software and application design & development', defaultRate: 18, defaultUnit: 'HRS' },
  { code: '998314', type: 'SAC', description: 'Internet telecommunication, cloud hosting and data processing services', defaultRate: 18, defaultUnit: 'MTH' },
  { code: '998311', type: 'SAC', description: 'Management and IT technical consulting services', defaultRate: 18, defaultUnit: 'HRS' },
  { code: '998319', type: 'SAC', description: 'Other information technology services n.e.c.', defaultRate: 18, defaultUnit: 'NOS' },
  { code: '998222', type: 'SAC', description: 'Accounting, auditing and bookkeeping services', defaultRate: 18, defaultUnit: 'NOS' },
  { code: '998365', type: 'SAC', description: 'Marketing research, public relations and digital advertising', defaultRate: 18, defaultUnit: 'CAM' },
  { code: '847130', type: 'HSN', description: 'Portable automatic data processing machines / Laptops', defaultRate: 18, defaultUnit: 'NOS' },
  { code: '847141', type: 'HSN', description: 'Data processing desktop units and enterprise server racks', defaultRate: 18, defaultUnit: 'NOS' },
  { code: '851762', type: 'HSN', description: 'Network routers, switches, enterprise firewalls and optic modems', defaultRate: 18, defaultUnit: 'NOS' },
  { code: '852351', type: 'HSN', description: 'Solid-State Non-Volatile Storage (SSD) & Flash memory drives', defaultRate: 18, defaultUnit: 'NOS' },
  { code: '998713', type: 'SAC', description: 'Maintenance and repair services of office and accounting machinery', defaultRate: 18, defaultUnit: 'JOB' },
  { code: '482010', type: 'HSN', description: 'Registers, account books, order books, receipt books & stationery', defaultRate: 12, defaultUnit: 'NOS' },
  { code: '999293', type: 'SAC', description: 'Commercial training, coaching, and engineering workshop certification', defaultRate: 18, defaultUnit: 'SES' }
];

/**
 * Validates 15-character Indian GSTIN format and extracts structure:
 * Format: 2-digit State Code + 10-char PAN + 1-digit entity number + 'Z' + 1 checksum char
 */
export function validateGSTIN(gstin: string): {
  isValid: boolean;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  entityNumber?: string;
  error?: string;
} {
  if (!gstin) {
    return { isValid: false, error: 'GSTIN cannot be empty' };
  }

  const cleaned = gstin.trim().toUpperCase();
  if (cleaned.length !== 15) {
    return { isValid: false, error: `GSTIN must be exactly 15 characters (currently ${cleaned.length})` };
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid GSTIN syntax. Expected pattern: 2-digit State + 10-char PAN + Entity code + Z + Checksum digit.'
    };
  }

  const stateCode = cleaned.substring(0, 2);
  const pan = cleaned.substring(2, 12);
  const entityNumber = cleaned.substring(12, 13);
  const state = STATE_CODE_MAP.get(stateCode);

  if (!state) {
    return {
      isValid: false,
      error: `Invalid GST state code "${stateCode}". Must be between 01 and 38.`
    };
  }

  return {
    isValid: true,
    stateCode,
    stateName: state.name,
    pan,
    entityNumber
  };
}

/**
 * Determines whether a transaction is Intra-State or Inter-State
 * based on Supplier State Code and Place of Supply (POS) State Code.
 */
export function determineSupplyType(supplierStateCode: string, placeOfSupplyStateCode: string): {
  isInterState: boolean;
  supplyType: 'INTRA_STATE' | 'INTER_STATE';
  applicableTaxes: 'CGST_SGST' | 'IGST';
} {
  const isInterState = supplierStateCode !== placeOfSupplyStateCode;
  return {
    isInterState,
    supplyType: isInterState ? 'INTER_STATE' : 'INTRA_STATE',
    applicableTaxes: isInterState ? 'IGST' : 'CGST_SGST'
  };
}

/**
 * Calculates item-level GST breakdowns accurately according to CBIC guidelines.
 */
export function calculateItemTaxes(
  taxableValue: number,
  gstRate: number,
  isInterState: boolean,
  cessRate: number = 0
): {
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  totalAmount: number;
} {
  const round2 = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = gstRate;
    igstAmount = round2((taxableValue * igstRate) / 100);
  } else {
    // Split 50-50 into CGST and SGST
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = round2((taxableValue * cgstRate) / 100);
    sgstAmount = round2((taxableValue * sgstRate) / 100);
  }

  const cessAmount = cessRate > 0 ? round2((taxableValue * cessRate) / 100) : 0;
  const totalTax = round2(cgstAmount + sgstAmount + igstAmount + cessAmount);
  const totalAmount = round2(taxableValue + totalTax);

  return {
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    cessAmount,
    totalTax,
    totalAmount
  };
}

/**
 * Formats numbers into Indian Rupee currency standard:
 * e.g. 1234567.89 -> "₹ 12,34,567.89"
 */
export function formatINR(val: number): string {
  if (isNaN(val)) return '₹ 0.00';
  const parts = val.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  const isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.substring(1);

  // Indian comma formatting: last 3 digits, then pairs of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹ ${formatted}.${decimalPart}`;
}

/**
 * Converts numeric amount to official Indian words format (Lakhs, Crores)
 * e.g., 142850.50 => "Rupees One Lakh Forty-Two Thousand Eight Hundred Fifty and Fifty Paise Only"
 */
export function amountInWordsIndian(amount: number): string {
  if (amount === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(num: number): string {
    if (num === 0) return '';
    if (num < 10) return singleDigits[num];
    if (num < 20) return teens[num - 10];
    const rem = num % 10;
    return tens[Math.floor(num / 10)] + (rem !== 0 ? '-' + singleDigits[rem] : '');
  }

  function convertThreeDigits(num: number): string {
    let str = '';
    const hundred = Math.floor(num / 100);
    const rem = num % 100;
    if (hundred > 0) {
      str += singleDigits[hundred] + ' Hundred';
      if (rem > 0) str += ' and ';
    }
    if (rem > 0) {
      str += convertTwoDigits(rem);
    }
    return str;
  }

  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let crore = Math.floor(rupees / 10000000);
  let remRupees = rupees % 10000000;
  let lakh = Math.floor(remRupees / 100000);
  remRupees = remRupees % 100000;
  let thousand = Math.floor(remRupees / 1000);
  let hundredPart = remRupees % 1000;

  let words = '';

  if (crore > 0) {
    words += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (hundredPart > 0) {
    words += convertThreeDigits(hundredPart) + ' ';
  }

  words = words.trim();
  if (words.length === 0) words = 'Zero';

  let result = `Rupees ${words}`;
  if (paise > 0) {
    result += ` and ${convertTwoDigits(paise)} Paise`;
  }
  result += ' Only';

  return result;
}

/**
 * Isomorphic SHA-256 implementation that works in both Node.js and Browser runtimes.
 */
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty as any] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeCount = 64;
  ascii += '\x80';
  while ((ascii[lengthProperty as any] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty as any]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty as any]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty as any]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty as any];) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + w[i]) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Generates official 64-character SHA-256 Invoice Reference Number (IRN)
 * replicating the Indian NIC E-Invoicing portal hashing formula:
 * IRN = SHA256(SupplierGSTIN + FinancialYear + DocType + DocNo)
 */
export function generateEInvoiceIRN(
  supplierGSTIN: string,
  finYear: string,
  docType: string,
  docNo: string
): string {
  const payload = `${supplierGSTIN}${finYear}${docType}${docNo}`;
  return sha256Sync(payload).toLowerCase();
}

/**
 * Generates synthetic signed E-Invoice QR Code payload
 * meeting NIC schema requirements for B2B Indian Tax Invoices.
 */
export function generateSignedQrPayload(invoice: {
  sellerGstin: string;
  buyerGstin: string;
  docNo: string;
  docDate: string;
  totalValue: number;
  itemCount: number;
  irn: string;
}): string {
  const summaryObj = {
    SellerGSTIN: invoice.sellerGstin,
    BuyerGSTIN: invoice.buyerGstin,
    DocNo: invoice.docNo,
    DocTyp: 'INV',
    DocDt: invoice.docDate,
    TotInvVal: invoice.totalValue,
    ItemCnt: invoice.itemCount,
    MainHsnCode: '998313',
    Irn: invoice.irn
  };
  const jsonStr = JSON.stringify(summaryObj);
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(jsonStr)));
  }
  return Buffer.from(jsonStr).toString('base64');
}
