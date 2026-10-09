# SutharLabs Indian GST Accounting & ERP Engine

> **Version:** v0.2.0 (Beta)  
> **Standard:** CBIC GST Rules 2017–2026, Section 31 of CGST Act, Rule 46 (Tax Invoice Specifications)  
> **Inspiration / Parity:** Frappe Books & ERPNext India Compliance (`resilient-tech/india-compliance`)

---

## 1. Overview

The **Accounting** plugin (`wp_accounting`) has been upgraded from a basic invoice prototype into an enterprise-grade, Indian GST-compliant accounting and billing suite mirroring the architecture of **ERPNext** and **Frappe Books**.

It handles the complete lifecycle of Indian business transactions:
- **Tax Invoicing** according to Rule 46 with itemized HSN/SAC codes, CGST/SGST/IGST breakdown, and Indian Rupee (`₹`) formatting in numbers and words.
- **E-Invoicing & Compliance** with automated 64-character SHA-256 Invoice Reference Number (IRN) generation and signed QR code payload.
- **Statutory Returns Generation** for **GSTR-1** (B2B, B2CL, B2CS, Table 12 HSN Summary) with GST Portal offline tool JSON export, and **GSTR-3B** (Consolidated monthly tax liability and Input Tax Credit / ITC).
- **Double-Entry General Ledger Book** under the Companies Act, 2013, with real-time debit and credit parity verification.
- **Party Master & Catalog** with 15-digit GSTIN validation, automatic state code extraction, and standard HSN/SAC directories.

---

## 2. Indian GST Architecture & Regulatory Mechanics

### A. GSTIN Validation & Structure
Every Indian Goods and Services Tax Identification Number (GSTIN) follows a strict 15-character structure:
```
[State Code: 2 digits] + [PAN: 10 chars] + [Entity Number: 1 char] + [Default 'Z'] + [Checksum: 1 char]
Example: 24AAACS7492D1ZP (Gujarat) | 27AAACT2727Q1ZW (Maharashtra)
```
The GST engine ([gstEngine.ts](file:///d:/Code/SutharLabs/website/src/plugins/Accounting/gstEngine.ts)) verifies:
1. Exact syntax matching regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`.
2. Valid state code mapping across all 37 Indian States and Union Territories (01 Jammu & Kashmir to 38 Ladakh).
3. Automatic extraction of the entity's 10-character Income Tax PAN and jurisdiction state name.

### B. Place of Supply (POS) & Tax Split Logic
Tax determination follows Section 7 & 8 of the IGST Act, 2017:
* **Intra-State Supply** (`Supplier State == Place of Supply State`):
  - Split 50/50 into **Central GST (CGST)** and **State GST (SGST)**.
  - *Example:* 18% GST on ₹1,00,000 = ₹9,000 CGST + ₹9,000 SGST.
* **Inter-State Supply** (`Supplier State != Place of Supply State`):
  - Levies 100% **Integrated GST (IGST)**.
  - *Example:* 18% GST on ₹1,00,000 = ₹18,000 IGST.

### C. Standard Tax Slabs & HSN/SAC Classification
Supported tax slabs:
- `0%` (Nil rated / exempt supplies)
- `5%` (Essential items, transport)
- `12%` (Standard goods, books)
- `18%` (Standard services, IT engineering, software consulting)
- `28%` (Luxury goods, hardware appliances)

Preloaded HSN/SAC directory covers:
- `998313`: IT Software design and development
- `998314`: Cloud hosting and telecommunication services
- `998311`: Management and IT technical consulting
- `847141`: Enterprise data processing servers
- `851762`: Network routers and optic telecommunication hardware

### D. Electronic Invoicing (E-Invoice IRN & QR Code)
For B2B invoices, the engine computes a 64-character SHA-256 hash replicating the National Informatics Centre (NIC) standard:
$$\text{IRN} = \text{SHA256}(\text{SupplierGSTIN} + \text{FinancialYear} + \text{DocType} + \text{DocNo})$$
In addition, a signed Base64 QR code payload containing seller GSTIN, buyer GSTIN, doc number, date, total value, and IRN is generated and printed.

### E. Indian Currency Representation
- Numbers formatted using the Indian numbering system (thousands, lakhs, crores): `₹ 12,34,567.89`.
- Conversion to official words: `"Rupees Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven and Eighty-Nine Paise Only"`.

---

## 3. Double-Entry General Ledger

Every issued invoice automatically creates dual balanced postings in the General Ledger:
1. **Debit**: Accounts Receivable (Debtors Asset) or Bank Account if settled immediately.
2. **Credit**: Sales Revenue (Income Account).
3. **Credit**: Duties & Taxes Output Payable:
   - `2110-OUTPUT-CGST`: Output CGST Payable
   - `2120-OUTPUT-SGST`: Output SGST Payable
   - `2130-OUTPUT-IGST`: Output IGST Payable
4. **Discrepancy Round-off**: `4990-ROUND-OFF` account.

---

## 4. REST API Reference

Mounted under `/api/plugins/wp_accounting/` (with legacy backward compatibility alias `/api/invoices`):

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/company` | Get company legal profile, GSTIN, and bank settings |
| `PUT` | `/company` | Update company legal and statutory settings |
| `GET` | `/states` | List 37 Indian GST states & codes |
| `GET` | `/hsn-catalog` | List standard HSN/SAC master entries |
| `GET` | `/gstin/:gstin` | Validate 15-char GSTIN and extract state & PAN |
| `GET` | `/customers` | List customer party master directory |
| `POST` | `/customers` | Register new customer party with GSTIN |
| `GET` | `/items` | List items and services catalog |
| `POST` | `/items` | Add new item with HSN code & tax slab |
| `GET` | `/invoices` | List all GST Tax Invoices |
| `POST` | `/invoices` | Create new Rule 46 Tax Invoice |
| `GET` | `/invoices/:id` | Fetch complete invoice details |
| `PATCH` | `/invoices/:id/status` | Update invoice status (`Draft`, `Issued`, `Paid`) |
| `DELETE` | `/invoices/:id` | Delete invoice from ledger |
| `GET` | `/reports/gstr-1` | GSTR-1 return filing breakdown (B2B, B2CL, B2CS, HSN) |
| `GET` | `/reports/gstr-3b` | GSTR-3B monthly return and ITC summary |
| `GET` | `/reports/ledger` | Indian Double-Entry General Ledger entries |

---

## 5. File Structure

```
src/plugins/Accounting/
├── gstEngine.ts                     # Isomorphic Indian GST calculation & validation engine
├── types.ts                         # Complete TypeScript data contracts & models
├── storage.ts                       # Persistent storage, fallback cache & Prisma syncer
├── routes.ts                        # Express API router controller
├── manifest.ts                      # Workspace plugin manifest (v0.2.0 Beta)
├── manifest.json                    # Plugin engine manifest descriptor
├── README.md                        # Regulatory & architecture documentation
└── components/
    ├── TaxInvoiceModal.tsx          # Rule 46 official printable Tax Invoice preview
    ├── CreateInvoiceDrawer.tsx      # Real-time GST invoice creator studio
    ├── GstrReportsView.tsx          # GSTR-1 & GSTR-3B return tables + JSON export
    ├── GeneralLedgerView.tsx        # Double-entry balance & journal entries view
    ├── PartyMasterView.tsx          # Customer & vendor master directory
    ├── ItemCatalogView.tsx          # Goods & services catalog with HSN codes
    └── CompanySettingsModal.tsx     # Enterprise profile & bank remittance settings
```
