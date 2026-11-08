import { Router } from 'express';

import { GoogleGenAI } from '@google/genai';

import { authenticateToken } from '../../middleware/auth.js';

import { AccountingStorage } from './storage.js';

import { validateGSTIN, COMMON_HSN_SAC_CATALOG, INDIAN_GST_STATES } from './gstEngine.js';



function getUserEmail(req: any): string {

  const email = req.user?.email;

  if (!email || typeof email !== 'string') {

    throw new Error('Unauthorized: Missing or invalid user identity in authentication token');

  }

  return email.toLowerCase().trim();

}



export function registerRoutes(router: Router) {

  // ==================== COMPANY PROFILE & GST SETTINGS ====================



  router.get('/company', authenticateToken, async (req: any, res: any) => {

    try {

      const company = await AccountingStorage.getCompany(getUserEmail(req));

      res.json(company);

    } catch (error) {

      res.status(500).json({ error: 'Failed to retrieve company profile.' });

    }

  });



  router.put('/company', authenticateToken, async (req: any, res: any) => {

    try {

      const updated = await AccountingStorage.updateCompany(getUserEmail(req), req.body);

      res.json(updated);

    } catch (error) {

      res.status(500).json({ error: 'Failed to update company profile.' });

    }

  });



  // ==================== REFERENCE DIRECTORIES ====================



  router.get('/states', authenticateToken, async (_req, res) => {

    res.json(INDIAN_GST_STATES);

  });



  router.get('/hsn-catalog', authenticateToken, async (_req, res) => {

    res.json(COMMON_HSN_SAC_CATALOG);

  });



  router.get('/gstin/:gstin', authenticateToken, async (req: any, res: any) => {

    const { gstin } = req.params;

    const result = validateGSTIN(gstin);

    res.json(result);

  });



  // ==================== PARTIES (CUSTOMERS & VENDORS) ====================



  router.get('/customers', authenticateToken, async (req: any, res: any) => {

    try {

      const parties = await AccountingStorage.getParties(getUserEmail(req));

      res.json(parties);

    } catch (error) {

      res.status(500).json({ error: 'Failed to retrieve party masters.' });

    }

  });



  router.post('/customers', authenticateToken, async (req: any, res: any) => {

    try {

      const { name, tradeName, gstin, stateCode, billingAddress, email, phone, partyType, openingBalance, creditDays } = req.body;

      if (!name) {

        return res.status(400).json({ error: 'Party customer name is required.' });

      }



      if (gstin) {

        const val = validateGSTIN(gstin);

        if (!val.isValid) {

          return res.status(400).json({ error: val.error });

        }

      }



      const party = await AccountingStorage.addParty(getUserEmail(req), {

        name,

        tradeName,

        gstin,

        stateCode: stateCode || '24',

        stateName: '',

        billingAddress: billingAddress || '',

        email: email || '',

        phone: phone || '',

        openingBalance: Number(openingBalance) || 0,

        currentBalance: Number(openingBalance) || 0,

        creditDays: Number(creditDays) || 30,

        partyType: partyType || (gstin ? 'B2B' : 'B2C')

      });

      res.status(201).json(party);

    } catch (error) {

      res.status(500).json({ error: 'Failed to register customer party.' });

    }

  });



  // ==================== ITEMS & HSN MASTER ====================



  router.get('/items', authenticateToken, async (req: any, res: any) => {

    try {

      const items = await AccountingStorage.getItems(getUserEmail(req));

      res.json(items);

    } catch (error) {

      res.status(500).json({ error: 'Failed to retrieve items catalog.' });

    }

  });



  router.post('/items', authenticateToken, async (req: any, res: any) => {

    try {

      const { code, name, type, hsnSacCode, unit, unitPrice, purchasePrice, gstRate, description } = req.body;

      if (!name || !unitPrice) {

        return res.status(400).json({ error: 'Item name and unit price are required.' });

      }



      const item = await AccountingStorage.addItem(getUserEmail(req), {

        code: code || `SKU-${Date.now().toString().slice(-4)}`,

        name,

        type: type || 'Services',

        hsnSacCode: hsnSacCode || '998313',

        unit: unit || 'NOS',

        unitPrice: parseFloat(unitPrice),

        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,

        gstRate: (Number(gstRate) || 18) as any,

        description

      });

      res.status(201).json(item);

    } catch (error) {

      res.status(500).json({ error: 'Failed to create item in catalog.' });

    }

  });



  // ==================== INVOICES (RULE 46 GST TAX INVOICES) ====================



  router.get('/invoices', authenticateToken, async (req: any, res: any) => {

    try {

      const invoices = await AccountingStorage.getInvoices(getUserEmail(req));

      res.json(invoices);

    } catch (error) {

      res.status(500).json({ error: 'Failed to fetch invoices ledger.' });

    }

  });



  router.get('/invoices/:id', authenticateToken, async (req: any, res: any) => {

    try {

      const invoice = await AccountingStorage.getInvoiceById(getUserEmail(req), req.params.id);

      if (!invoice) {

        return res.status(404).json({ error: 'Invoice not found.' });

      }

      res.json(invoice);

    } catch (error) {

      res.status(500).json({ error: 'Failed to fetch invoice details.' });

    }

  });



  router.post('/invoices', authenticateToken, async (req: any, res: any) => {

    try {

      const {

        client,

        amount,

        status,

        buyerId,

        buyerName,

        buyerGstin,

        buyerStateCode,

        buyerAddress,

        placeOfSupplyStateCode,

        invoiceDate,

        dueDate,

        items,

        notes

      } = req.body;



      let processedItems = items;

      if (!processedItems || !Array.isArray(processedItems) || processedItems.length === 0) {

        const numAmount = parseFloat(amount) || 10000;

        processedItems = [

          {

            itemDescription: 'Software Development & IT Professional Services',

            hsnSacCode: '998313',

            quantity: 1,

            unit: 'NOS',

            rate: numAmount,

            discountPercent: 0,

            gstRate: 18

          }

        ];

      }



      const created = await AccountingStorage.createInvoice(getUserEmail(req), {

        buyerId,

        buyerName: buyerName || client,

        buyerGstin,

        buyerStateCode,

        buyerAddress,

        placeOfSupplyStateCode,

        invoiceDate,

        dueDate,

        items: processedItems,

        status: status === 'Paid' ? 'Paid' : 'Issued',

        notes

      });



      res.status(201).json(created);

    } catch (error: any) {

      console.error('Create invoice error:', error);

      res.status(500).json({ error: error.message || 'Failed to generate GST Tax Invoice.' });

    }

  });



  router.put('/invoices/:id', authenticateToken, async (req: any, res: any) => {

    try {

      const {

        buyerId,

        buyerName,

        client,

        buyerGstin,

        buyerStateCode,

        buyerAddress,

        placeOfSupplyStateCode,

        invoiceDate,

        dueDate,

        items,

        status,

        notes,

        editNote

      } = req.body;



      let processedItems = items;

      if (!processedItems || !Array.isArray(processedItems) || processedItems.length === 0) {

        return res.status(400).json({ error: 'Invoice must contain at least one line item.' });

      }



      const updated = await AccountingStorage.updateInvoice(getUserEmail(req), req.params.id, {

        buyerId,

        buyerName: buyerName || client,

        buyerGstin,

        buyerStateCode,

        buyerAddress,

        placeOfSupplyStateCode,

        invoiceDate,

        dueDate,

        items: processedItems,

        status,

        notes,

        editNote

      });



      res.json(updated);

    } catch (error: any) {

      console.error('Update invoice error:', error);

      res.status(500).json({ error: error.message || 'Failed to update GST Tax Invoice.' });

    }

  });



  router.patch('/invoices/:id/status', authenticateToken, async (req: any, res: any) => {

    try {

      const { status } = req.body;

      const updated = await AccountingStorage.updateInvoiceStatus(getUserEmail(req), req.params.id, status);

      if (!updated) {

        return res.status(404).json({ error: 'Invoice not found.' });

      }

      res.json(updated);

    } catch (error) {

      res.status(500).json({ error: 'Failed to update invoice status.' });

    }

  });



  router.delete('/invoices/:id', authenticateToken, async (req: any, res: any) => {

    try {

      const success = await AccountingStorage.deleteInvoice(getUserEmail(req), req.params.id);

      if (!success) {

        return res.status(404).json({ error: 'Invoice not found or could not be removed.' });

      }

      res.json({ success: true, deletedId: req.params.id });

    } catch (error) {

      res.status(500).json({ error: 'Failed to delete invoice.' });

    }

  });



  // ==================== TALLY / SAP VOUCHERS (F4 TO F9) ====================



  router.get('/vouchers', authenticateToken, async (req: any, res: any) => {

    try {

      const vouchers = await AccountingStorage.getVouchers(getUserEmail(req));

      res.json(vouchers);

    } catch (error) {

      res.status(500).json({ error: 'Failed to retrieve vouchers register.' });

    }

  });



  router.post('/vouchers', authenticateToken, async (req: any, res: any) => {

    try {

      const {

        voucherNumber,

        voucherType,

        date,

        referenceNo,

        partyId,

        partyName,

        debitAccount,

        creditAccount,

        amount,

        taxAmount,

        paymentMode,

        narration,

        lines

      } = req.body;



      if (!voucherType || !amount || !debitAccount || !creditAccount) {

        return res.status(400).json({ error: 'Voucher type, accounts, and amount are required.' });

      }



      const numAmount = parseFloat(amount);

      const today = new Date().toISOString().split('T')[0];



      // Auto construct lines if not provided

      const finalLines = lines && lines.length > 0 ? lines : [

        { accountCode: debitAccount, accountName: debitAccount, debit: numAmount, credit: 0 },

        { accountCode: creditAccount, accountName: creditAccount, debit: 0, credit: numAmount }

      ];



      const prefix = voucherType.substring(0, 3).toUpperCase();

      const num = voucherNumber || `${prefix}-${Date.now().toString().slice(-6)}`;



      const created = await AccountingStorage.addVoucher(getUserEmail(req), {

        voucherNumber: num,

        voucherType,

        date: date || today,

        referenceNo,

        partyId,

        partyName,

        debitAccount,

        creditAccount,

        amount: numAmount,

        taxAmount: taxAmount ? parseFloat(taxAmount) : 0,

        paymentMode: paymentMode || 'Bank Transfer',

        narration: narration || `Being ${voucherType.toLowerCase()} transaction posted.`,

        status: 'Posted',

        lines: finalLines

      });



      res.status(201).json(created);

    } catch (error: any) {

      res.status(500).json({ error: error.message || 'Failed to post voucher.' });

    }

  });



  router.put('/vouchers/:id', authenticateToken, async (req: any, res: any) => {

    try {

      const {

        voucherType,

        date,

        referenceNo,

        partyId,

        partyName,

        debitAccount,

        creditAccount,

        amount,

        taxAmount,

        paymentMode,

        narration,

        editNote,

        lines

      } = req.body;



      if (!amount || !debitAccount || !creditAccount) {

        return res.status(400).json({ error: 'Accounts and amount are required.' });

      }



      const updated = await AccountingStorage.updateVoucher(getUserEmail(req), req.params.id, {

        voucherType,

        date,

        referenceNo,

        partyId,

        partyName,

        debitAccount,

        creditAccount,

        amount,

        taxAmount,

        paymentMode,

        narration,

        editNote,

        lines

      });



      res.json(updated);

    } catch (error: any) {

      res.status(500).json({ error: error.message || 'Failed to update voucher.' });

    }

  });



  router.delete('/vouchers/:id', authenticateToken, async (req: any, res: any) => {

    try {

      const success = await AccountingStorage.deleteVoucher(getUserEmail(req), req.params.id);

      if (!success) {

        return res.status(404).json({ error: 'Voucher not found.' });

      }

      res.json({ success: true });

    } catch (error) {

      res.status(500).json({ error: 'Failed to delete voucher.' });

    }

  });



  // ==================== SAP / TALLY FINANCIAL STATEMENTS ====================



  router.get('/reports/balance-sheet', authenticateToken, async (req: any, res: any) => {

    try {

      const bs = await AccountingStorage.getBalanceSheet(getUserEmail(req));

      res.json(bs);

    } catch (error) {

      res.status(500).json({ error: 'Failed to generate Balance Sheet.' });

    }

  });



  router.get('/reports/profit-loss', authenticateToken, async (req: any, res: any) => {

    try {

      const pl = await AccountingStorage.getProfitAndLoss(getUserEmail(req));

      res.json(pl);

    } catch (error) {

      res.status(500).json({ error: 'Failed to generate Profit & Loss statement.' });

    }

  });



  router.get('/reports/trial-balance', authenticateToken, async (req: any, res: any) => {

    try {

      const tb = await AccountingStorage.getTrialBalance(getUserEmail(req));

      res.json(tb);

    } catch (error) {

      res.status(500).json({ error: 'Failed to generate Trial Balance.' });

    }

  });



  router.get('/reports/aging', authenticateToken, async (req: any, res: any) => {

    try {

      const aging = await AccountingStorage.getAgingAnalysis(getUserEmail(req));

      res.json(aging);

    } catch (error) {

      res.status(500).json({ error: 'Failed to generate Aging Analysis.' });

    }

  });



  router.get('/reports/brs', authenticateToken, async (req: any, res: any) => {

    try {

      const brs = await AccountingStorage.getBankReconciliation(getUserEmail(req));

      res.json(brs);

    } catch (error) {

      res.status(500).json({ error: 'Failed to generate Bank Reconciliation.' });

    }

  });



  // ==================== STATUTORY GST COMPLIANCE ====================



  router.get('/reports/gstr-1', authenticateToken, async (req: any, res: any) => {

    try {

      const period = (req.query.period as string) || 'Current Quarter';

      const report = await AccountingStorage.getGSTR1Report(getUserEmail(req), period);

      res.json(report);

    } catch (error) {

      res.status(500).json({ error: 'Failed to generate GSTR-1 summary.' });

    }

  });



  router.get('/reports/gstr-3b', authenticateToken, async (req: any, res: any) => {

    try {

      const report = await AccountingStorage.getGSTR3BReport(getUserEmail(req));

      res.json(report);

    } catch (error) {

      res.status(500).json({ error: 'Failed to generate GSTR-3B summary.' });

    }

  });



  router.get('/reports/ledger', authenticateToken, async (req: any, res: any) => {

    try {

      const ledger = await AccountingStorage.getGeneralLedger(getUserEmail(req));

      res.json(ledger);

    } catch (error) {

      res.status(500).json({ error: 'Failed to generate General Ledger.' });

    }

  });



  // ==================== MULTILINGUAL AI RECEIPT & BILL OCR ====================



  router.post('/ocr-receipt', authenticateToken, async (req: any, res: any) => {

    try {

      const { image, apiKey: clientApiKey } = req.body;

      if (!image || typeof image !== 'string') {

        return res.status(400).json({ error: 'Receipt image data is required (base64 data URL).' });

      }



      // Extract mime type and base64 payload

      let mimeType = 'image/jpeg';

      let base64Data = image;



      if (image.startsWith('data:')) {

        const match = image.match(/^data:([^;]+);base64,(.+)$/);

        if (match) {

          mimeType = match[1];

          base64Data = match[2];

        }

      }



      // Resolve Gemini API key with priority: body apiKey -> header x-gemini-key -> env variables

      const apiKey = (clientApiKey && String(clientApiKey).trim()) ||

                     (req.headers['x-gemini-key'] && String(req.headers['x-gemini-key']).trim()) ||

                     process.env.GEMINI_API_KEY ||

                     process.env.GOOGLE_API_KEY;



      if (!apiKey) {

        return res.status(400).json({

          error: 'No Gemini Vision API key provided. Pass x-gemini-key header or enter your API key in the OCR dialog, or run client-side Tesseract.js.'

        });

      }



      const ai = new GoogleGenAI({ apiKey });



      const prompt = `You are a Chartered Accountant, Tax Auditor, and Multilingual OCR Engine specialized in Indian and International financial documents, receipts, invoices, and bills.

Analyze this receipt/bill image carefully. The receipt may be in English, Hindi (हिन्दी / देवनागरी लिपि), or bilingual English-Hindi (e.g. किराना बिल, पेट्रोल पंप रसीद, रेस्टोरेंट बिल, टैक्स इनवॉइस, सर्विस बिल, हार्डवेयर बिल).



Understand both English and Hindi text thoroughly. Extract all visible financial metadata, itemized lines, taxes, and totals accurately.

If certain fields are in Hindi/Devanagari (e.g. "श्री गणेश ट्रेडर्स", "कर इनवॉयस", "रसीद नं", "दिनांक", "कुल योग"), capture the vendor name authentically and provide a clear English description if helpful.



Extract and output ONLY a valid, raw JSON object (with NO markdown code fences, NO formatting text, NO backticks) adhering strictly to this JSON schema:

{

  "vendorName": string,

  "vendorGstin": string or null,

  "vendorAddress": string or null,

  "vendorPhone": string or null,

  "invoiceNumber": string,

  "invoiceDate": string,

  "dueDate": string,

  "voucherType": string,

  "expenseCategory": string,

  "items": [

    {

      "itemDescription": string,

      "hsnSacCode": string,

      "quantity": number,

      "unit": string,

      "rate": number,

      "gstRate": number,

      "taxableValue": number,

      "cgstAmount": number,

      "sgstAmount": number,

      "igstAmount": number,

      "totalAmount": number

    }

  ],

  "taxableAmount": number,

  "cgstTotal": number,

  "sgstTotal": number,

  "igstTotal": number,

  "totalTax": number,

  "roundOff": number,

  "grandTotal": number,

  "paymentMode": string,

  "detectedLanguage": string,

  "confidenceScore": number,

  "rawText": string,

  "notes": string

}



Rules:

- If tax amounts are not explicitly broken down but grand total is known, calculate or infer reasonable GST amounts or set tax to 0.

- Ensure all numbers are valid numerical values, not strings.

- Return ONLY the JSON object.`;



      let response: any = null;

      const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

      let lastErr: any = null;



      for (const modelName of candidateModels) {

        try {

          response = await ai.models.generateContent({

            model: modelName,

            contents: [

              {

                inlineData: {

                  mimeType,

                  data: base64Data

                }

              },

              prompt

            ],

            config: {

              responseMimeType: 'application/json'

            }

          });

          if (response && response.text) break;

        } catch (modelErr: any) {

          lastErr = modelErr;

          console.warn(`[Accounting OCR] Model ${modelName} attempt failed:`, modelErr.message);

        }

      }



      if (!response || !response.text) {

        throw new Error(lastErr?.message || 'AI Vision models failed to extract structured receipt data.');

      }



      const text = response.text || '';

      let parsed;

      try {

        parsed = JSON.parse(text);

      } catch {

        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {

          parsed = JSON.parse(jsonMatch[0]);

        } else {

          throw new Error('Failed to parse structured JSON from OCR response.');

        }

      }



      res.json({ success: true, data: parsed });

    } catch (err: any) {

      console.error('OCR Receipt processing error:', err);

      res.status(500).json({ error: err.message || 'Failed to process receipt image with AI Vision OCR.' });

    }

  });



}

