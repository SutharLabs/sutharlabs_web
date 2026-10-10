# SutharLabs Indian GST Accounting & ERP Engine: Master Specification

> **Plugin ID:** `wp_accounting`  
> **Version:** `v0.2.3` (Beta)  
> **Route:** `/workspace/accounting`  
> **Original Master Specification:** See [Full Accounting Plugin Architecture & Logic Specification](../accounting_plugin_architecture_and_logic.md)  
> **Local Plugin Reference:** See [Accounting Plugin README](../../src/plugins/Accounting/README.md)

---

## 1. Executive Summary

The **Accounting** plugin (`wp_accounting`) is an enterprise-grade Indian GST Accounting, Rule 46 Tax Invoicing, Double-Entry General Ledger, and statutory returns generation suite with Frappe Books & ERPNext India Compliance parity.

### Core Capabilities:
- **Rule 46 Tax Invoicing**: Itemized HSN/SAC codes, CGST/SGST/IGST breakdown, and Indian Rupee (`₹`) formatting in words.
- **Section 128 Audit Trail Notes**: Statutory alter/edit logs recording old and new values.
- **E-Invoicing IRN & QR Code**: Automated 64-character SHA-256 Invoice Reference Number and Base64 QR code payload.
- **Statutory Returns Generation**: **GSTR-1** (B2B, B2CL, B2CS, Table 12 HSN Summary) with GST Portal offline tool JSON export, and **GSTR-3B** (Consolidated monthly tax liability and Input Tax Credit / ITC).
- **Double-Entry General Ledger**: Real-time balanced journal postings under Companies Act, 2013.
- **Multi-Tenant Cloud Sync**: Scoped per user in Neon PostgreSQL with local fallback cache.

---

## 2. File Organization

```
src/plugins/Accounting/
├── gstEngine.ts                     # Isomorphic Indian GST calculation & validation engine
├── types.ts                         # Complete TypeScript data contracts & models
├── storage.ts                       # Persistent storage, fallback cache & Prisma syncer
├── routes.ts                        # Express API router controller
├── manifest.ts                      # Workspace plugin manifest (v0.2.3)
├── manifest.json                    # Plugin engine manifest descriptor
├── README.md                        # Regulatory & architecture documentation
└── components/
    ├── TaxInvoiceModal.tsx          # Rule 46 official printable Tax Invoice preview
    ├── CreateInvoiceDrawer.tsx      # Real-time GST invoice creator studio
    ├── GstrReportsView.tsx          # GSTR-1 & GSTR-3B return tables + JSON export
    ├── GeneralLedgerView.tsx        # Double-entry balance & journal entries view
    ├── PartyMasterView.tsx          # Customer & vendor master directory
    ├── ItemCatalogView.tsx          # Goods & services catalog with HSN codes
    ├── CompanySettingsModal.tsx     # Enterprise profile & bank remittance settings
    └── InvoiceAnalyticsChart.tsx    # Stacked tax analytics chart
```
