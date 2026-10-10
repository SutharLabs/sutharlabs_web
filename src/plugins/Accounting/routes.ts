import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { AccountingStorage } from './storage.js';
import { validateGSTIN, COMMON_HSN_SAC_CATALOG, INDIAN_GST_STATES } from './gstEngine.js';

function getUserEmail(req: any): string {
  return req.user?.email || 'default@sutharlabs.com';
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
}
