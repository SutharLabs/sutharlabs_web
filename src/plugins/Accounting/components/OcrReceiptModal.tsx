import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  AlertCircle, 
  Trash2, 
  Plus, 
  FileText, 
  Copy, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  Building2,
  Calendar,
  Receipt,
  FileCheck,
  CreditCard,
  Hash,
  Eye,
  Sliders,
  DollarSign
} from 'lucide-react';
import { CompanyProfile, PartyCustomer, AccountingVoucher, GSTInvoice, GSTInvoiceItem } from '../types.js';
import { validateGSTIN, determineSupplyType, calculateItemTaxes, formatINR, GSTRate } from '../gstEngine.js';
import ConfirmModal from '../../../components/ConfirmModal.js';

export interface OcrExtractedLineItem {
  id: string;
  itemDescription: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  rate: number;
  gstRate: GSTRate;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface OcrReceiptData {
  vendorName: string;
  vendorGstin?: string | null;
  vendorAddress?: string | null;
  vendorPhone?: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  voucherType: 'Payment' | 'Purchase';
  expenseCategory: string;
  items: OcrExtractedLineItem[];
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card';
  detectedLanguage: 'Hindi' | 'English' | 'Bilingual';
  confidenceScore: number;
  rawText?: string;
  notes?: string;
}

interface OcrReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  parties: PartyCustomer[];
  company: CompanyProfile | null;
  userToken: string;
  onVoucherCreated: (voucher: AccountingVoucher) => void;
  onInvoiceCreated: (invoice: GSTInvoice) => void;
  onAddParty?: (party: PartyCustomer) => void;
  theme?: 'light' | 'dark';
}

const EXPENSE_CATEGORIES = [
  'Office Supplies & Stationery',
  'Fuel, Petrol & Travel',
  'Raw Materials & Inventory',
  'Hardware & Equipment',
  'Repairs & Maintenance',
  'Food, Grocery & Pantry',
  'Utilities, Electricity & Internet',
  'Professional & Cloud Services',
  'General Operational Expense'
];

export default function OcrReceiptModal({
  isOpen,
  onClose,
  parties,
  company,
  userToken,
  onVoucherCreated,
  onInvoiceCreated,
  onAddParty,
  theme
}: OcrReceiptModalProps) {
  const effectiveTheme: 'light' | 'dark' = theme || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  const isLight = effectiveTheme === 'light';

  // Processing & UI States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'rawText'>('image');
  const [ocrEngine, setOcrEngine] = useState<'ai' | 'tesseract'>('ai');
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    return localStorage.getItem('sutharlabs_gemini_api_key') || '';
  });

  // Zoom & Rotate Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  // Reconciliation Form States (Prefilled & Fully Editable)
  const [targetType, setTargetType] = useState<'Voucher' | 'Invoice'>('Voucher');
  const [vendorName, setVendorName] = useState<string>('');
  const [vendorGstin, setVendorGstin] = useState<string>('');
  const [vendorAddress, setVendorAddress] = useState<string>('');
  const [vendorPhone, setVendorPhone] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState<string>('Office Supplies & Stationery');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Card'>('UPI');
  const [items, setItems] = useState<OcrExtractedLineItem[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<'Hindi' | 'English' | 'Bilingual'>('English');
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [autoAddParty, setAutoAddParty] = useState<boolean>(true);

  // Feedback & Modal state
  const [copiedRawText, setCopiedRawText] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subtext?: string;
    confirmLabel?: string;
    variant?: 'primary' | 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Recalculate totals whenever items change
  const calculatedTotals = React.useMemo(() => {
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    const myStateCode = company?.stateCode || '24';
    const vendorStateCode = vendorGstin && vendorGstin.length >= 2 ? vendorGstin.substring(0, 2) : myStateCode;
    const isInterState = vendorStateCode !== myStateCode;

    items.forEach(it => {
      const qty = Number(it.quantity) || 1;
      const rate = Number(it.rate) || 0;
      const rowTaxable = qty * rate;
      taxable += rowTaxable;

      const gstRate = Number(it.gstRate) || 0;
      if (isInterState) {
        igst += (rowTaxable * gstRate) / 100;
      } else {
        cgst += (rowTaxable * (gstRate / 2)) / 100;
        sgst += (rowTaxable * (gstRate / 2)) / 100;
      }
    });

    const totalTax = cgst + sgst + igst;
    const rawGrandTotal = taxable + totalTax;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

    return {
      taxableAmount: Number(taxable.toFixed(2)),
      cgstTotal: Number(cgst.toFixed(2)),
      sgstTotal: Number(sgst.toFixed(2)),
      igstTotal: Number(igst.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      roundOff,
      grandTotal,
      isInterState
    };
  }, [items, company, vendorGstin]);

  // Helper to handle uploaded image or PDF
  const handleFileUpload = (file: File) => {
    setErrorMessage(null);
    setImageFileName(file.name);

    if (file.type === 'application/pdf') {
      // PDF handling: read file as array buffer and render page 1 to canvas
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          const typedarray = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await (page.render as any)({ canvasContext: context, viewport, canvas }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            setImagePreview(dataUrl);
            runOcrRecognition(dataUrl);
          }
        } catch (err: any) {
          console.error('PDF Render Error:', err);
          setErrorMessage('Could not render PDF. Please upload a PNG or JPG image directly.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        runOcrRecognition(dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMessage('Please upload a valid image (PNG, JPG, WebP) or PDF file.');
    }
  };

  // Run Multimodal OCR Engine or Tesseract.js fallback
  const runOcrRecognition = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setProcessingStep('Analyzing receipt geometry and character contours...');
    setErrorMessage(null);

    const savedApiKey = apiKeyInput.trim() || localStorage.getItem('sutharlabs_gemini_api_key') || '';

    if (ocrEngine === 'ai') {
      try {
        setProcessingStep('Connecting to Sovereign AI Multimodal Vision (Gemini 2.5 Flash)...');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`
        };
        if (savedApiKey) {
          headers['x-gemini-key'] = savedApiKey;
        }

        const res = await fetch('/api/plugins/wp_accounting/ocr-receipt', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            image: imageDataUrl,
            apiKey: savedApiKey || undefined
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server OCR returned status ${res.status}`);
        }

        const result = await res.json();
        if (result.success && result.data) {
          populatePrefilledForm(result.data);
          setIsProcessing(false);
          return;
        } else {
          throw new Error('Invalid OCR response structure.');
        }
      } catch (aiErr: any) {
        console.warn('AI OCR failed, switching to client-side Tesseract.js fallback:', aiErr);
        setProcessingStep('AI Vision unavailable. Launching Client-side Tesseract OCR (Devanagari Hindi + English)...');
        await runTesseractFallback(imageDataUrl);
      }
    } else {
      await runTesseractFallback(imageDataUrl);
    }
  };

  // Client-side Tesseract.js Fallback (Offline zero-cloud processing)
  const runTesseractFallback = async (imageDataUrl: string) => {
    try {
      setProcessingStep('Initializing WebAssembly Tesseract OCR worker (eng + hin)...');
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['eng', 'hin']);

      setProcessingStep('Scanning Devanagari Hindi & Latin script glyphs in browser RAM...');
      const ret = await worker.recognize(imageDataUrl);
      const text = ret.data.text || '';
      await worker.terminate();

      // Heuristic parsing on extracted text
      setProcessingStep('Extracting vendor, GSTIN, line items, and monetary totals...');
      const parsedData = parseRawReceiptText(text);
      populatePrefilledForm(parsedData);
      setIsProcessing(false);
    } catch (tessErr: any) {
      console.error('Tesseract OCR error:', tessErr);
      setIsProcessing(false);
      setErrorMessage(`OCR processing failed: ${tessErr.message || 'Unknown error'}. You can still enter details manually.`);
    }
  };

  // Regex and heuristic receipt parser for English and Hindi text
  const parseRawReceiptText = (text: string): OcrReceiptData => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Detect GSTIN (15 characters: 2 digits, 5 letters, 4 digits, 1 letter, 1 char, Z, 1 char)
    const gstinMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/i);
    const detectedGstin = gstinMatch ? gstinMatch[0].toUpperCase() : null;

    // 2. Detect Invoice / Bill Number
    let detectedBillNo = '';
    const billMatch = text.match(/(?:Invoice|Bill|Receipt|रसीद|बिल|इनवॉयस)\s*(?:No|Num|#|नं|क्र\.?)?[:.\s-]*([A-Za-z0-9\-\/]+)/i);
    if (billMatch && billMatch[1]) {
      detectedBillNo = billMatch[1].trim();
    } else {
      detectedBillNo = `REC-${Date.now().toString().slice(-6)}`;
    }

    // 3. Detect Date (DD/MM/YYYY or YYYY-MM-DD or DD-MM-YYYY)
    let detectedDate = new Date().toISOString().split('T')[0];
    const dateMatch = text.match(/\b(\d{1,2})[-/\.](\d{1,2})[-/\.](\d{2,4})\b/);
    if (dateMatch) {
      const p1 = parseInt(dateMatch[1], 10);
      const p2 = parseInt(dateMatch[2], 10);
      let year = parseInt(dateMatch[3], 10);
      if (year < 100) year += 2000;

      // Check if format is DD-MM-YYYY
      if (p1 <= 31 && p2 <= 12) {
        detectedDate = `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
    }

    // 4. Detect Vendor Name (usually the first 1-3 prominent lines)
    let detectedVendor = 'Unknown Vendor / Supplier';
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      if (
        line.length > 3 &&
        !line.toLowerCase().includes('tax invoice') &&
        !line.toLowerCase().includes('cash memo') &&
        !line.includes('कर इनवॉयस') &&
        !line.includes('रसीद') &&
        !line.includes('GSTIN') &&
        !line.includes('Date')
      ) {
        detectedVendor = line;
        break;
      }
    }

    // 5. Detect Grand Total
    let grandTotal = 0;
    const totalMatch = text.match(/(?:Grand Total|Net Total|Total Amount|Amount Payable|कुल योग|कुल राशि|रकम|देय राशि)\s*[:.\s-]*₹?\s*([\d,]+(?:\.\d{2})?)/i);
    if (totalMatch && totalMatch[1]) {
      grandTotal = parseFloat(totalMatch[1].replace(/,/g, '')) || 0;
    }

    // If no total match, pick largest currency amount found in the bottom lines
    if (!grandTotal) {
      const allNumbers = text.match(/₹?\s*(\d+[\d,]*\.\d{2})/g);
      if (allNumbers && allNumbers.length > 0) {
        const parsedNums = allNumbers.map(n => parseFloat(n.replace(/[₹\s,]/g, ''))).filter(n => !isNaN(n));
        grandTotal = Math.max(...parsedNums, 0);
      }
    }

    // 6. Detect language (Hindi / Devanagari characters: \u0900-\u097F)
    const hasHindi = /[\u0900-\u097F]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    const detectedLang: 'Hindi' | 'English' | 'Bilingual' = hasHindi && hasEnglish ? 'Bilingual' : hasHindi ? 'Hindi' : 'English';

    // 7. Synthesize line items
    const parsedItems: OcrExtractedLineItem[] = [
      {
        id: 'ocr_item_1',
        itemDescription: hasHindi ? 'सामग्री / व्यावसायिक आपूर्ति (Supplies)' : 'Commercial Inward Supplies & Services',
        hsnSacCode: '998313',
        quantity: 1,
        unit: 'NOS',
        rate: grandTotal ? Number((grandTotal / 1.18).toFixed(2)) : 1000,
        gstRate: 18,
        taxableValue: grandTotal ? Number((grandTotal / 1.18).toFixed(2)) : 1000,
        cgstAmount: grandTotal ? Number(((grandTotal / 1.18) * 0.09).toFixed(2)) : 90,
        sgstAmount: grandTotal ? Number(((grandTotal / 1.18) * 0.09).toFixed(2)) : 90,
        igstAmount: 0,
        totalAmount: grandTotal || 1180
      }
    ];

    return {
      vendorName: detectedVendor,
      vendorGstin: detectedGstin,
      vendorAddress: null,
      vendorPhone: null,
      invoiceNumber: detectedBillNo,
      invoiceDate: detectedDate,
      dueDate: detectedDate,
      voucherType: 'Payment',
      expenseCategory: 'Office Supplies & Stationery',
      items: parsedItems,
      taxableAmount: parsedItems[0].taxableValue,
      cgstTotal: parsedItems[0].cgstAmount,
      sgstTotal: parsedItems[0].sgstAmount,
      igstTotal: 0,
      totalTax: parsedItems[0].cgstAmount + parsedItems[0].sgstAmount,
      roundOff: 0,
      grandTotal: parsedItems[0].totalAmount,
      paymentMode: 'Cash',
      detectedLanguage: detectedLang,
      confidenceScore: 78,
      rawText: text,
      notes: 'Extracted using local Tesseract.js in-browser engine.'
    };
  };

  // Populate form fields with extracted OCR data
  const populatePrefilledForm = (data: Partial<OcrReceiptData>) => {
    if (data.vendorName) setVendorName(data.vendorName);
    if (data.vendorGstin) setVendorGstin(data.vendorGstin);
    if (data.vendorAddress) setVendorAddress(data.vendorAddress);
    if (data.vendorPhone) setVendorPhone(data.vendorPhone);
    if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
    if (data.invoiceDate) setInvoiceDate(data.invoiceDate);
    if (data.dueDate) setDueDate(data.dueDate || data.invoiceDate || new Date().toISOString().split('T')[0]);
    if (data.expenseCategory) setExpenseCategory(data.expenseCategory);
    if (data.paymentMode) setPaymentMode(data.paymentMode);
    if (data.voucherType === 'Purchase') setTargetType('Invoice');
    if (data.detectedLanguage) setDetectedLanguage(data.detectedLanguage);
    if (data.confidenceScore) setConfidenceScore(data.confidenceScore);
    if (data.rawText) setRawText(data.rawText);
    if (data.notes) setNotes(data.notes);

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      setItems(data.items.map((it, idx) => ({
        id: `ocr_row_${idx + 1}`,
        itemDescription: it.itemDescription || 'Inward Item',
        hsnSacCode: it.hsnSacCode || '998313',
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'NOS',
        rate: Number(it.rate) || 0,
        gstRate: (Number(it.gstRate) as GSTRate) || 18,
        taxableValue: Number(it.taxableValue) || 0,
        cgstAmount: Number(it.cgstAmount) || 0,
        sgstAmount: Number(it.sgstAmount) || 0,
        igstAmount: Number(it.igstAmount) || 0,
        totalAmount: Number(it.totalAmount) || 0
      })));
    } else if (data.grandTotal) {
      // Create single item fallback
      const total = Number(data.grandTotal);
      const taxable = Number((total / 1.18).toFixed(2));
      setItems([
        {
          id: 'ocr_row_1',
          itemDescription: data.vendorName ? `${data.vendorName} Inward Expense` : 'Inward Operational Expense',
          hsnSacCode: '998313',
          quantity: 1,
          unit: 'NOS',
          rate: taxable,
          gstRate: 18,
          taxableValue: taxable,
          cgstAmount: Number(((taxable * 0.09)).toFixed(2)),
          sgstAmount: Number(((taxable * 0.09)).toFixed(2)),
          igstAmount: 0,
          totalAmount: total
        }
      ]);
    }
  };

  // Add a new empty row to line items
  const handleAddItemRow = () => {
    const newRow: OcrExtractedLineItem = {
      id: `row_${Date.now()}`,
      itemDescription: 'New Item / Service',
      hsnSacCode: '998313',
      quantity: 1,
      unit: 'NOS',
      rate: 1000,
      gstRate: 18,
      taxableValue: 1000,
      cgstAmount: 90,
      sgstAmount: 90,
      igstAmount: 0,
      totalAmount: 1180
    };
    setItems(prev => [...prev, newRow]);
  };

  // Remove a row
  const handleDeleteRow = (id: string) => {
    setItems(prev => prev.filter(r => r.id !== id));
  };

  // Update a line item field
  const handleUpdateItem = (id: string, field: keyof OcrExtractedLineItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };

      if (field === 'quantity' || field === 'rate' || field === 'gstRate') {
        const qty = Number(updated.quantity) || 0;
        const rate = Number(updated.rate) || 0;
        const gst = Number(updated.gstRate) || 0;
        const taxable = qty * rate;
        const tax = (taxable * gst) / 100;

        updated.taxableValue = Number(taxable.toFixed(2));
        updated.cgstAmount = Number((tax / 2).toFixed(2));
        updated.sgstAmount = Number((tax / 2).toFixed(2));
        updated.igstAmount = 0;
        updated.totalAmount = Number((taxable + tax).toFixed(2));
      }
      return updated;
    }));
  };

  // Quick Sample Bills for testing
  const loadSampleBill = (sampleType: 'hindi' | 'english' | 'fuel') => {
    let mockData: OcrReceiptData;
    let canvasBg = '#fff';

    if (sampleType === 'hindi') {
      mockData = {
        vendorName: 'श्री बालाजी किराना एवं जनरल स्टोर्स (Shri Balaji Kirana)',
        vendorGstin: '24AAGCS8912P1Z4',
        vendorAddress: 'दुकान नं. १२, मुख्य बाजार, अहमदाबाद, गुजरात - ३८०००१',
        vendorPhone: '+91 98250 12345',
        invoiceNumber: 'रसीद सं. BK-2026/842',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        voucherType: 'Payment',
        expenseCategory: 'Food, Grocery & Pantry',
        items: [
          {
            id: 'row_1',
            itemDescription: 'प्रीमियम बासमती चावल (Basmati Rice 5kg)',
            hsnSacCode: '1006',
            quantity: 2,
            unit: 'BOX',
            rate: 650.00,
            gstRate: 5,
            taxableValue: 1300.00,
            cgstAmount: 32.50,
            sgstAmount: 32.50,
            igstAmount: 0,
            totalAmount: 1365.00
          },
          {
            id: 'row_2',
            itemDescription: 'शुद्ध देसी घी (Pure Cow Ghee 1 Ltr)',
            hsnSacCode: '0405',
            quantity: 1,
            unit: 'NOS',
            rate: 750.00,
            gstRate: 12,
            taxableValue: 750.00,
            cgstAmount: 45.00,
            sgstAmount: 45.00,
            igstAmount: 0,
            totalAmount: 840.00
          },
          {
            id: 'row_3',
            itemDescription: 'फॉर्च्यून रिफाइंड तेल (Fortune Sunflower Oil)',
            hsnSacCode: '1512',
            quantity: 2,
            unit: 'LTR',
            rate: 180.00,
            gstRate: 5,
            taxableValue: 360.00,
            cgstAmount: 9.00,
            sgstAmount: 9.00,
            igstAmount: 0,
            totalAmount: 378.00
          }
        ],
        taxableAmount: 2410.00,
        cgstTotal: 86.50,
        sgstTotal: 86.50,
        igstTotal: 0,
        totalTax: 173.00,
        roundOff: 0,
        grandTotal: 2583.00,
        paymentMode: 'UPI',
        detectedLanguage: 'Hindi',
        confidenceScore: 98,
        rawText: `श्री बालाजी किराना एवं जनरल स्टोर्स
दुकान नं. १२, मुख्य बाजार, अहमदाबाद - ३८०००१
जीएसटीIN: 24AAGCS8912P1Z4 | फोन: ९८२५० १२३४५
------------------------------------------------
कर इनवॉयस / रसीद क्र.: BK-2026/842
दिनांक: ${new Date().toLocaleDateString('hi-IN')}
------------------------------------------------
क्र. सामान विवरण          मात्रा    दर     रकम (₹)
1   प्रीमियम बासमती चावल     2      650.00  1300.00
2   शुद्ध देसी घी 1L        1      750.00   750.00
3   फॉर्च्यून रिफाइंड तेल    2      180.00   360.00
------------------------------------------------
सकल योग (Taxable Amount):           ₹2,410.00
सीजीएसटी (CGST):                     ₹86.50
एसजीएसटी (SGST):                     ₹86.50
------------------------------------------------
अंतिम कुल योग (Grand Total):         ₹2,583.00
भुगतान माध्यम: यूपीआई (PhonePe / GPay - SUCCESS)
धन्यवाद! पुनः पधारें।`,
        notes: 'किराना एवं ऑफिस पेंट्री हेतु सामान खरीद रसीद।'
      };
    } else if (sampleType === 'english') {
      mockData = {
        vendorName: 'Apex Data Networks & Electronics Pvt Ltd',
        vendorGstin: '24AAACA9812K1Z9',
        vendorAddress: 'Plot 42, GIDC Electronic Estate, Gandhinagar, Gujarat - 382016',
        vendorPhone: '+91 79 2328 0000',
        invoiceNumber: 'INV/2026-27/0491',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        voucherType: 'Purchase',
        expenseCategory: 'Hardware & Equipment',
        items: [
          {
            id: 'row_1',
            itemDescription: 'Samsung 990 Pro 2TB NVMe PCIe 4.0 SSD',
            hsnSacCode: '8471',
            quantity: 2,
            unit: 'NOS',
            rate: 14500.00,
            gstRate: 18,
            taxableValue: 29000.00,
            cgstAmount: 2610.00,
            sgstAmount: 2610.00,
            igstAmount: 0,
            totalAmount: 34220.00
          },
          {
            id: 'row_2',
            itemDescription: 'Cat6 Pure Copper Shielded Ethernet Cable 305m',
            hsnSacCode: '8544',
            quantity: 1,
            unit: 'BOX',
            rate: 8200.00,
            gstRate: 18,
            taxableValue: 8200.00,
            cgstAmount: 738.00,
            sgstAmount: 738.00,
            igstAmount: 0,
            totalAmount: 9676.00
          }
        ],
        taxableAmount: 37200.00,
        cgstTotal: 3348.00,
        sgstTotal: 3348.00,
        igstTotal: 0,
        totalTax: 6696.00,
        roundOff: 0,
        grandTotal: 43896.00,
        paymentMode: 'Bank Transfer',
        detectedLanguage: 'English',
        confidenceScore: 99,
        rawText: `TAX INVOICE
Apex Data Networks & Electronics Pvt Ltd
GIDC Electronic Estate, Gandhinagar, GJ - 382016
GSTIN: 24AAACA9812K1Z9 | CIN: U72200GJ2020PTC099882
Invoice No: INV/2026-27/0491  Date: ${new Date().toISOString().split('T')[0]}
Billed to: SutharLabs Private Limited
------------------------------------------------
Item                HSN   Qty  Rate (₹)    Taxable (₹)
Samsung 990 Pro 2TB 8471   2   14,500.00   29,000.00
Cat6 Cable 305m     8544   1    8,200.00    8,200.00
------------------------------------------------
Subtotal:              ₹37,200.00
CGST @ 9%:              ₹3,348.00
SGST @ 9%:              ₹3,348.00
------------------------------------------------
Invoice Total:         ₹43,896.00
Payment Terms: Net 15 Days via NEFT`,
        notes: 'Inference node hardware upgrade parts.'
      };
    } else {
      mockData = {
        vendorName: 'भारत पेट्रोलियम कॉर्पोरेशन लिमिटेड (BPCL Fuel Retail)',
        vendorGstin: '24AAACB2902M1ZT',
        vendorAddress: 'BPCL Highway Outlet, SG Highway, Ahmedabad, GJ - 380054',
        vendorPhone: '+91 1800 22 4344',
        invoiceNumber: 'RCP-BPCL-99201',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        voucherType: 'Payment',
        expenseCategory: 'Fuel, Petrol & Travel',
        items: [
          {
            id: 'row_1',
            itemDescription: 'Speed Petrol (मोटर स्पिरिट) - 24.50 Ltr',
            hsnSacCode: '2710',
            quantity: 24.5,
            unit: 'LTR',
            rate: 86.44,
            gstRate: 18,
            taxableValue: 2117.78,
            cgstAmount: 190.60,
            sgstAmount: 190.60,
            igstAmount: 0,
            totalAmount: 2498.98
          }
        ],
        taxableAmount: 2117.78,
        cgstTotal: 190.60,
        sgstTotal: 190.60,
        igstTotal: 0,
        totalTax: 381.20,
        roundOff: 1.02,
        grandTotal: 2500.00,
        paymentMode: 'Card',
        detectedLanguage: 'Bilingual',
        confidenceScore: 97,
        rawText: `BHARAT PETROLEUM CORPORATION LTD
SG HIGHWAY RETAIL OUTLET
GSTIN: 24AAACB2902M1ZT
Date: ${new Date().toLocaleDateString()} Time: 14:22:10
Receipt No: RCP-BPCL-99201
Nozzle: 03  Product: SPEED PETROL
Rate/Ltr: ₹102.04
Volume: 24.50 Ltr
Total Amount: ₹2,500.00
Mode: Card (Txn Ref: 489201948210)
Drive Clean, Go Green!`,
        notes: 'Operational logistics and travel fuel expense.'
      };
    }

    // Generate a visual canvas representation of the sample receipt
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 600, 800);

      // Receipt border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 560, 760);

      // Header
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mockData.vendorName.substring(0, 36), 300, 65);

      ctx.font = '12px monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText(mockData.vendorAddress ? mockData.vendorAddress.substring(0, 48) : 'Commercial Center', 300, 90);
      ctx.fillText(`GSTIN: ${mockData.vendorGstin || 'UNREGISTERED'} | Tel: ${mockData.vendorPhone || '+91-XXXXX'}`, 300, 110);

      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(40, 125);
      ctx.lineTo(560, 125);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`Invoice / Bill No: ${mockData.invoiceNumber}`, 45, 150);
      ctx.fillText(`Date: ${mockData.invoiceDate}`, 400, 150);

      // Items table
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(40, 170, 520, 26);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Description', 50, 187);
      ctx.fillText('Qty', 320, 187);
      ctx.fillText('Rate (₹)', 380, 187);
      ctx.fillText('Total (₹)', 480, 187);

      let y = 220;
      mockData.items.forEach(it => {
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText(it.itemDescription.substring(0, 30), 50, y);
        ctx.fillText(String(it.quantity), 325, y);
        ctx.fillText(it.rate.toFixed(2), 380, y);
        ctx.fillText(it.totalAmount.toFixed(2), 480, y);
        y += 30;
      });

      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(40, y + 10);
      ctx.lineTo(560, y + 10);
      ctx.stroke();

      y += 40;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(`Taxable Subtotal:`, 320, y);
      ctx.fillText(`₹${mockData.taxableAmount.toFixed(2)}`, 480, y);

      y += 25;
      ctx.fillText(`CGST + SGST:`, 320, y);
      ctx.fillText(`₹${mockData.totalTax.toFixed(2)}`, 480, y);

      y += 30;
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`GRAND TOTAL:`, 320, y);
      ctx.fillText(`₹${mockData.grandTotal.toFixed(2)}`, 480, y);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(`Payment Mode: ${mockData.paymentMode} • Verification Parity Matched`, 300, 740);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setImagePreview(dataUrl);
      setImageFileName(`sample-${sampleType}-receipt.jpg`);
    }

    populatePrefilledForm(mockData);
  };

  // Save the audited receipt into Accounting
  const handleSaveToAccounting = async () => {
    if (!vendorName.trim()) {
      setErrorMessage('Vendor / Supplier name is required before saving.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Receipt must have at least one valid line item.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      };

      // 1. Optionally register party customer/vendor if not exists
      let matchedParty = parties.find(p => 
        (vendorGstin && p.gstin && p.gstin.toUpperCase() === vendorGstin.toUpperCase()) ||
        p.name.toLowerCase() === vendorName.trim().toLowerCase()
      );

      if (!matchedParty && autoAddParty) {
        try {
          const partyRes = await fetch('/api/plugins/wp_accounting/customers', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: vendorName.trim(),
              gstin: vendorGstin?.trim() || undefined,
              stateCode: vendorGstin && vendorGstin.length >= 2 ? vendorGstin.substring(0, 2) : (company?.stateCode || '24'),
              partyType: 'VENDOR',
              billingAddress: vendorAddress || 'Address extracted via OCR',
              phone: vendorPhone || '',
              openingBalance: 0,
              creditDays: 30
            })
          });

          if (partyRes.ok) {
            matchedParty = await partyRes.json();
            if (matchedParty && onAddParty) {
              onAddParty(matchedParty);
            }
          }
        } catch (partyErr) {
          console.warn('Auto add party non-fatal error:', partyErr);
        }
      }

      // 2. Post as Payment Voucher (DayBook F5) OR Purchase Tax Invoice (F9)
      if (targetType === 'Voucher') {
        // Map expense category to debit account
        let debitAccount = '5000-PURCHASES';
        if (expenseCategory.includes('Fuel') || expenseCategory.includes('Travel')) debitAccount = '5100-EXP-CLOUD';
        else if (expenseCategory.includes('Food') || expenseCategory.includes('Grocery')) debitAccount = '5300-EXP-RENT';
        else if (expenseCategory.includes('Hardware') || expenseCategory.includes('Equipment')) debitAccount = '5000-PURCHASES';
        else debitAccount = '5100-EXP-CLOUD';

        let creditAccount = '1010-BANK-HDFC';
        if (paymentMode === 'Cash') creditAccount = '1020-CASH-OFFICE';
        else if (paymentMode === 'UPI') creditAccount = '1010-BANK-HDFC';

        const voucherPayload = {
          voucherNumber: invoiceNumber ? `VCH-${invoiceNumber.replace(/[^A-Za-z0-9]/g, '').slice(-8)}` : `VCH-${Date.now().toString().slice(-6)}`,
          voucherType: 'Payment',
          date: invoiceDate,
          referenceNo: invoiceNumber,
          partyId: matchedParty?.id || undefined,
          partyName: vendorName.trim(),
          debitAccount,
          creditAccount,
          amount: calculatedTotals.grandTotal,
          taxAmount: calculatedTotals.totalTax,
          paymentMode: paymentMode || 'UPI',
          narration: `Being ${expenseCategory} expense paid to ${vendorName.trim()} via ${paymentMode}. Ref: ${invoiceNumber} (Reconciled via Bilingual AI OCR).`,
          lines: [
            {
              accountCode: debitAccount,
              accountName: `${expenseCategory} (${vendorName.trim()})`,
              debit: calculatedTotals.grandTotal,
              credit: 0
            },
            {
              accountCode: creditAccount,
              accountName: creditAccount === '1020-CASH-OFFICE' ? 'Office Cash in Hand' : 'HDFC Bank Current Account',
              debit: 0,
              credit: calculatedTotals.grandTotal
            }
          ]
        };

        const res = await fetch('/api/plugins/wp_accounting/vouchers', {
          method: 'POST',
          headers,
          body: JSON.stringify(voucherPayload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to post Payment Voucher into DayBook.');
        }

        const createdVoucher = await res.json();
        onVoucherCreated(createdVoucher);
        onClose();
      } else {
        // Post as Purchase Invoice (GST Inward Invoice)
        const invoicePayload = {
          client: vendorName.trim(),
          buyerName: vendorName.trim(),
          buyerGstin: vendorGstin || undefined,
          buyerStateCode: vendorGstin && vendorGstin.length >= 2 ? vendorGstin.substring(0, 2) : (company?.stateCode || '24'),
          buyerAddress: vendorAddress || undefined,
          invoiceDate,
          dueDate,
          placeOfSupplyStateCode: company?.stateCode || '24',
          status: 'Paid',
          notes: `Purchase tax invoice reconciled via Bilingual OCR. Ref: ${invoiceNumber}. Category: ${expenseCategory}.`,
          items: items.map(item => ({
            itemDescription: item.itemDescription,
            hsnSacCode: item.hsnSacCode || '998313',
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'NOS',
            rate: Number(item.rate) || 0,
            discountPercent: 0,
            gstRate: item.gstRate
          }))
        };

        const res = await fetch('/api/plugins/wp_accounting/invoices', {
          method: 'POST',
          headers,
          body: JSON.stringify(invoicePayload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to generate Purchase Tax Invoice.');
        }

        const createdInvoice = await res.json();
        onInvoiceCreated(createdInvoice);
        onClose();
      }
    } catch (saveErr: any) {
      console.error('Save to accounting error:', saveErr);
      setErrorMessage(saveErr.message || 'Failed to save into accounting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRawTextToClipboard = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className={`relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]'
      }`}>
        
        {/* Top Accent Sovereign Line */}
        <div className="h-1 w-full bg-[#00dbe7] shrink-0" />

        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#18181c]/60 border-[#3a494b]/40 text-[#e5e1e4]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
              isLight ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-cyan-500/10 border-cyan-500/25 text-[#00dbe7]'
            }`}>
              <Camera className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-sans tracking-tight">
                  AI Receipt &amp; Bill OCR Engine
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isLight ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-[#00dbe7]/10 text-[#00dbe7] border-[#00dbe7]/30'
                }`}>
                  Devanagari (हिन्दी) &amp; English
                </span>
                {confidenceScore > 0 && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-[#00e476] border-emerald-500/25'
                  }`}>
                    {confidenceScore}% Parity
                  </span>
                )}
              </div>
              <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                Scan complex Hindi &amp; English receipts, verify extracted tables, and reconcile directly into DayBook or GST Invoices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Engine toggle */}
            <div className={`hidden sm:flex rounded-lg p-0.5 border text-[11px] ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
            }`}>
              <button
                type="button"
                onClick={() => setOcrEngine('ai')}
                className={`px-2.5 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  ocrEngine === 'ai'
                    ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                }`}
              >
                AI Multimodal
              </button>
              <button
                type="button"
                onClick={() => setOcrEngine('tesseract')}
                className={`px-2.5 py-1 rounded-md font-mono cursor-pointer transition-all ${
                  ocrEngine === 'tesseract'
                    ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                }`}
              >
                Offline Tesseract
              </button>
            </div>

            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200' : 'text-gray-400 hover:text-white hover:bg-[#201f21]'
              }`}
            >
              <X className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Screen */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col lg:flex-row gap-5">
          
          {/* LEFT COLUMN: Receipt Document Viewer & Dropzone */}
          <div className="w-full lg:w-5/12 flex flex-col gap-3">
            
            {/* Sample Bills Bar */}
            <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
            }`}>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                Quick Test Samples:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => loadSampleBill('hindi')}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold text-center transition-all cursor-pointer truncate ${
                    isLight ? 'bg-white hover:bg-slate-100 text-sky-700 border-slate-300 shadow-xs' : 'bg-[#201f21] hover:bg-[#28272a] text-[#00dbe7] border-[#3a494b]/40'
                  }`}
                  title="Hindi Kirana Store Receipt (किराना दुकान रसीद)"
                >
                  🇮🇳 हिन्दी किराना
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleBill('english')}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold text-center transition-all cursor-pointer truncate ${
                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs' : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40'
                  }`}
                  title="English GST Hardware Tax Invoice"
                >
                  📄 GST Invoice
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleBill('fuel')}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold text-center transition-all cursor-pointer truncate ${
                    isLight ? 'bg-white hover:bg-slate-100 text-emerald-700 border-slate-300 shadow-xs' : 'bg-[#201f21] hover:bg-[#28272a] text-emerald-400 border-[#3a494b]/40'
                  }`}
                  title="Petrol Pump Slip (BPCL Fuel)"
                >
                  ⛽ Petrol Slip
                </button>
              </div>
            </div>

            {/* Document Preview Area */}
            <div className={`relative flex-1 min-h-[380px] lg:min-h-[480px] rounded-xl border flex flex-col overflow-hidden ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0f0f12] border-[#3a494b]/40'
            }`}>
              
              {/* Controls Toolbar */}
              <div className={`p-2 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c]/80 border-[#3a494b]/30'
              }`}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('image')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      activeTab === 'image'
                        ? isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30'
                        : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Image View
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('rawText')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      activeTab === 'rawText'
                        ? isLight ? 'bg-white text-slate-900 border border-slate-300 shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30'
                        : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Raw OCR Text
                  </button>
                </div>

                {activeTab === 'image' && imagePreview && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(z => Math.max(z - 25, 50))}
                      className={`p-1 rounded cursor-pointer ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-gray-300'}`}
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <span className={`text-[10px] w-10 text-center font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{zoomLevel}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(z => Math.min(z + 25, 250))}
                      className={`p-1 rounded cursor-pointer ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-gray-300'}`}
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      className={`p-1 rounded cursor-pointer ml-1 ${isLight ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-gray-300'}`}
                      title="Rotate 90 deg"
                    >
                      <RotateCw className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                )}

                {activeTab === 'rawText' && rawText && (
                  <button
                    type="button"
                    onClick={copyRawTextToClipboard}
                    className={`flex items-center gap-1 text-[11px] font-mono font-bold cursor-pointer ${
                      isLight ? 'text-sky-600 hover:underline' : 'text-[#00dbe7] hover:underline'
                    }`}
                  >
                    {copiedRawText ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                    <span>{copiedRawText ? 'Copied' : 'Copy Text'}</span>
                  </button>
                )}
              </div>

              {/* Viewport Content */}
              <div className="flex-1 flex items-center justify-center p-3 overflow-auto relative">
                {isProcessing && (
                  <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                    <RefreshCw className="w-8 h-8 text-[#00dbe7] animate-spin shrink-0 mb-3" />
                    <p className="text-sm font-bold text-white mb-1">Processing Receipt with OCR</p>
                    <p className="text-xs font-mono text-cyan-200 animate-pulse max-w-xs">{processingStep}</p>
                  </div>
                )}

                {activeTab === 'image' ? (
                  imagePreview ? (
                    <div className="flex items-center justify-center w-full h-full">
                      <img
                        src={imagePreview}
                        alt="Receipt Preview"
                        style={{
                          transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                          transition: 'transform 0.15s ease-out'
                        }}
                        className="max-h-[440px] max-w-full object-contain shadow-lg rounded"
                      />
                    </div>
                  ) : (
                    /* Dropzone when no file uploaded */
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`w-full h-full min-h-[300px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
                        isLight
                          ? 'border-slate-300 hover:border-sky-500 bg-slate-50/50'
                          : 'border-[#3a494b]/50 hover:border-[#00dbe7]/50 bg-[#121215]/50'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-md border ${
                        isLight
                          ? 'bg-sky-50 border-sky-200 text-sky-600'
                          : 'bg-[#00dbe7]/10 border-[#00dbe7]/30 text-[#00dbe7]'
                      }`}>
                        <Upload className="w-7 h-7 shrink-0" />
                      </div>
                      <p className={`font-bold text-sm mb-1 ${isLight ? 'text-slate-800' : 'text-[#e5e1e4]'}`}>
                        Drop receipt or bill here, or click to upload
                      </p>
                      <p className={`text-xs font-mono mb-3 max-w-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        Supports PNG, JPG, WebP, PDF. Paste directly with <kbd className={`px-1 py-0.5 rounded border ${isLight ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/10 border-white/20 text-white'}`}>Ctrl+V</kbd>.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          Devanagari (हिन्दी)
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          isLight ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        }`}>
                          English &amp; GST
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  /* Raw Transcribed Text Tab */
                  <div className="w-full h-full p-2">
                    <textarea
                      readOnly
                      value={rawText || 'No transcribed text available yet. Upload a receipt to run OCR.'}
                      className={`w-full h-full min-h-[340px] p-3 rounded-lg border font-mono text-xs resize-none outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#18181c] border-[#3a494b]/40 text-[#e5e1e4]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Image Footer / Re-upload button */}
              {imagePreview && (
                <div className={`p-2.5 border-t flex items-center justify-between text-xs shrink-0 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c]/60 border-[#3a494b]/30'
                }`}>
                  <span className={`font-mono text-[11px] truncate max-w-[200px] ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    {imageFileName || 'Uploaded Document'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-bold cursor-pointer ${
                        isLight ? 'text-sky-600 hover:underline' : 'text-[#00dbe7] hover:underline'
                      }`}
                    >
                      Change File
                    </button>
                    <button
                      type="button"
                      onClick={() => imagePreview && runOcrRecognition(imagePreview)}
                      disabled={isProcessing}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isLight
                          ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300'
                          : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/30'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 shrink-0 ${isProcessing ? 'animate-spin' : ''}`} />
                      Re-scan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Editable Prefilled Data Reconciliation Form */}
          <div className="w-full lg:w-7/12 flex flex-col gap-4">
            
            {/* Mode & Target Entry Selector */}
            <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
            }`}>
              <div>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                  isLight ? 'text-slate-600' : 'text-gray-400'
                }`}>
                  Accounting Posting Target:
                </span>
                <span className={`text-xs font-sans ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                  Where should this audited receipt be recorded?
                </span>
              </div>

              <div className={`flex rounded-lg p-0.5 border text-xs font-mono shrink-0 ${
                isLight ? 'bg-white border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
              }`}>
                <button
                  type="button"
                  onClick={() => setTargetType('Voucher')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                    targetType === 'Voucher'
                      ? isLight ? 'bg-slate-200 text-slate-900 font-bold shadow-xs border border-slate-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Payment Voucher (DayBook F5)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('Invoice')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                    targetType === 'Invoice'
                      ? isLight ? 'bg-slate-200 text-slate-900 font-bold shadow-xs border border-slate-300' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Purchase Tax Invoice (GST F9)
                </button>
              </div>
            </div>

            {/* Primary Vendor Details Card */}
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-sky-700' : 'text-[#00dbe7]'
                }`}>
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  Vendor &amp; Supplier Profile
                </span>
                {detectedLanguage && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    Script: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{detectedLanguage}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Vendor Name */}
                <div>
                  <label className={`text-[11px] font-mono uppercase font-bold block mb-1 ${
                    isLight ? 'text-slate-700' : 'text-gray-400'
                  }`}>
                    Vendor / Firm Name *
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. श्री गणेश ट्रेडर्स or Reliance Retail"
                    className={`w-full px-3 py-2 rounded-lg border font-mono text-xs outline-none transition-colors ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder-gray-500 focus:border-[#00dbe7]'
                    }`}
                  />
                </div>

                {/* Vendor GSTIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[11px] font-mono uppercase font-bold ${
                      isLight ? 'text-slate-700' : 'text-gray-400'
                    }`}>
                      Vendor GSTIN
                    </label>
                    {vendorGstin && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        validateGSTIN(vendorGstin).isValid
                          ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-[#00e476] border-emerald-500/25'
                          : isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                      }`}>
                        {validateGSTIN(vendorGstin).isValid ? 'Valid GSTIN' : 'Unregistered / B2C'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={vendorGstin || ''}
                    onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                    placeholder="15-digit GSTIN (optional for cash bills)"
                    maxLength={15}
                    className={`w-full px-3 py-2 rounded-lg border font-mono text-xs uppercase outline-none transition-colors ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder-gray-500 focus:border-[#00dbe7]'
                    }`}
                  />
                </div>
              </div>

              {/* Vendor Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-[11px] font-mono uppercase font-bold block mb-1 ${
                    isLight ? 'text-slate-700' : 'text-gray-400'
                  }`}>
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    value={vendorPhone || ''}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="+91-XXXXX XXXXX"
                    className={`w-full px-3 py-2 rounded-lg border font-mono text-xs outline-none transition-colors ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder-gray-500 focus:border-[#00dbe7]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-mono uppercase font-bold block mb-1 ${
                    isLight ? 'text-slate-700' : 'text-gray-400'
                  }`}>
                    Vendor Address
                  </label>
                  <input
                    type="text"
                    value={vendorAddress || ''}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    placeholder="Market / City address"
                    className={`w-full px-3 py-2 rounded-lg border font-mono text-xs outline-none transition-colors ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder-gray-500 focus:border-[#00dbe7]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Bill & Transaction Metadata */}
            <div className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
            }`}>
              {/* Bill Number */}
              <div>
                <label className={`text-[11px] font-mono uppercase font-bold block mb-1 ${
                  isLight ? 'text-slate-700' : 'text-gray-400'
                }`}>
                  Bill / Ref No *
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. REC-0091"
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                  }`}
                />
              </div>

              {/* Bill Date */}
              <div>
                <label className={`text-[11px] font-mono uppercase font-bold block mb-1 ${
                  isLight ? 'text-slate-700' : 'text-gray-400'
                }`}>
                  Bill Date *
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                  }`}
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className={`text-[11px] font-mono uppercase font-bold block mb-1 ${
                  isLight ? 'text-slate-700' : 'text-gray-400'
                }`}>
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className={`w-full px-2 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                  }`}
                >
                  <option value="UPI">UPI (GPay/PhonePe)</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              {/* Expense Category */}
              <div>
                <label className={`text-[11px] font-mono uppercase font-bold block mb-1 ${
                  isLight ? 'text-slate-700' : 'text-gray-400'
                }`}>
                  Expense Category
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] focus:border-[#00dbe7]'
                  }`}
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Itemized Line Items Table (Editable) */}
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-slate-800' : 'text-white'
                }`}>
                  <Receipt className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-sky-600' : 'text-[#00dbe7]'}`} />
                  Itemized Line Items ({items.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className={`h-7 px-2.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                    isLight
                      ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300'
                      : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/30'
                  }`}
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  Add Row
                </button>
              </div>

              {/* Grid Header */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase font-bold ${
                      isLight ? 'border-slate-300 text-slate-700 bg-slate-100' : 'border-[#3a494b]/40 text-gray-400 bg-[#121215]'
                    }`}>
                      <th className="p-2 min-w-[160px]">Description</th>
                      <th className="p-2 w-16">HSN/SAC</th>
                      <th className="p-2 w-16 text-right">Qty</th>
                      <th className="p-2 w-24 text-right">Rate (₹)</th>
                      <th className="p-2 w-16 text-right">GST %</th>
                      <th className="p-2 w-24 text-right">Total (₹)</th>
                      <th className="p-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className={isLight ? 'divide-y divide-slate-200' : 'divide-y divide-[#3a494b]/20'}>
                    {items.map((it) => (
                      <tr key={it.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={it.itemDescription}
                            onChange={(e) => handleUpdateItem(it.id, 'itemDescription', e.target.value)}
                            placeholder="Item name / विवरण"
                            className={`w-full px-2 py-1 rounded border text-xs outline-none ${
                              isLight ? 'bg-white border-slate-300 text-slate-900 focus:border-sky-500' : 'bg-[#141417] border-[#3a494b]/40 text-[#e5e1e4] focus:border-[#00dbe7]'
                            }`}
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={it.hsnSacCode}
                            onChange={(e) => handleUpdateItem(it.id, 'hsnSacCode', e.target.value)}
                            className={`w-full px-1.5 py-1 rounded border text-xs outline-none ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#141417] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItem(it.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className={`w-full px-1.5 py-1 rounded border text-xs text-right outline-none ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#141417] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.rate}
                            onChange={(e) => handleUpdateItem(it.id, 'rate', parseFloat(e.target.value) || 0)}
                            className={`w-full px-2 py-1 rounded border text-xs text-right outline-none ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#141417] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={it.gstRate}
                            onChange={(e) => handleUpdateItem(it.id, 'gstRate', Number(e.target.value))}
                            className={`w-full px-1 py-1 rounded border text-xs text-right outline-none ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#141417] border-[#3a494b]/40 text-[#e5e1e4]'
                            }`}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className={`p-1.5 text-right font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          ₹{it.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-1.5 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(it.id)}
                              className={`p-1 transition-colors cursor-pointer ${isLight ? 'text-slate-400 hover:text-rose-600' : 'text-gray-400 hover:text-rose-400'}`}
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Tax Breakdown Deck */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/30'
            }`}>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAddParty}
                    onChange={(e) => setAutoAddParty(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                  <span className={`text-xs font-mono ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                    Auto-register vendor in Party Master directory
                  </span>
                </label>
                <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  Supply Type: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{calculatedTotals.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</strong>
                </p>
              </div>

              {/* Totals Box */}
              <div className="w-full sm:w-auto flex flex-col gap-1 text-right font-mono text-xs">
                <div className={`flex justify-between sm:justify-end gap-6 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  <span>Taxable Subtotal:</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{calculatedTotals.taxableAmount.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between sm:justify-end gap-6 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  <span>{calculatedTotals.isInterState ? 'IGST Total:' : 'CGST + SGST:'}</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{calculatedTotals.totalTax.toFixed(2)}</span>
                </div>
                {calculatedTotals.roundOff !== 0 && (
                  <div className={`flex justify-between sm:justify-end gap-6 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                    <span>Round Off:</span>
                    <span>{calculatedTotals.roundOff > 0 ? `+₹${calculatedTotals.roundOff}` : `-₹${Math.abs(calculatedTotals.roundOff)}`}</span>
                  </div>
                )}
                <div className={`flex justify-between sm:justify-end gap-6 text-base font-bold pt-1 border-t ${
                  isLight ? 'text-sky-600 border-slate-300' : 'text-[#00dbe7] border-[#3a494b]/40'
                }`}>
                  <span>Grand Total:</span>
                  <span>₹{calculatedTotals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-[#3a494b]/40'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Ready for Double-Entry Ledger Reconciliation</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs'
                  : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border border-[#3a494b]/40 shadow-xs'
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveToAccounting}
              disabled={isSubmitting || !vendorName.trim()}
              className={`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-sky-500 hover:bg-sky-600 text-white border border-sky-600'
                  : 'bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border border-[#00dbe7]/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Reconciling...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Save to {targetType === 'Voucher' ? 'DayBook' : 'Tax Invoices'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Zero Native Dialog ConfirmModal */}
      {confirmModalConfig && (
        <ConfirmModal
          isOpen={confirmModalConfig.isOpen}
          onClose={() => setConfirmModalConfig(null)}
          onConfirm={confirmModalConfig.onConfirm}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          subtext={confirmModalConfig.subtext}
          confirmLabel={confirmModalConfig.confirmLabel}
          variant={confirmModalConfig.variant}
          theme={effectiveTheme}
        />
      )}
    </div>
  );
}
