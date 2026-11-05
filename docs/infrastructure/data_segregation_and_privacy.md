# SutharLabs Zero-Trust Data Segregation & Multi-Tenant Privacy Architecture

**Document Version:** 1.0.0  
**Effective Date:** 2026-10-11  
**Classification:** Core Architectural Standard & Security Policy  
**Applies To:** Core User Portal, Platform Server, Native Plugins (`DocNexus`, `StockTracker`, `FlowDesigner`, `Accounting`), Background Workers & Automated Batch Cron Jobs.

---

## 1. Executive Summary & Zero-Trust Mandate

Under the **SutharLabs Privacy Mandate**, data belonging to one user must **never** be exposed, shared, mutated, or accessible to another user under any circumstance or mechanism.

Every request, database query, cache write, client-side persistence operation, and automated background job operates under a **Zero-Trust Multi-Tenant Architecture**. Trust is never granted based on client-provided query parameters or payload fields (`req.query.email`, `req.body.email`). Identity is cryptographically verified from the signed authentication token (`req.user.email`), and data is strictly partitioned across all tiers.

---

## 2. Threat Model & Comprehensive Audit Findings

A rigorous end-to-end security audit of the user portal, plugin architecture, database models, and background task runners revealed five critical data isolation vectors that have been remediated:

### Audit Vector 1: Client Parameter Tampering (IDOR / BOLA)
- **Vulnerability Identified:** In endpoints such as `/api/portfolio` (GET) and `/api/portfolio/trade` (POST), queries allowed reading and mutating portfolios using `req.query.email` or `req.body.email`. A logged-in user could supply another user's email address in the query string to inspect or trade with victim assets.
- **Remediation Implemented:** Completely stripped client-supplied email parameters from transaction execution. The server strictly binds all queries and ledger operations to `req.user.email` extracted from the verified JWT. Any attempt to supply an unauthorized email mismatch is immediately terminated with `403 Forbidden`.

### Audit Vector 2: Unscoped Database Tables & Global Mutation Sweeps
- **Vulnerability Identified:** The `FlowNode` Prisma model previously lacked a tenant identifier (`userEmail`). In `FlowDesigner/routes.ts`, `GET /nodes` returned every node created across the entire user base, and `POST /nodes/sync` executed `tx.flowNode.deleteMany()`, wiping every other user's canvas.
- **Remediation Implemented:**
  1. Altered Prisma schema with `userEmail String @default("default@sutharlabs.com") @map("user_email")`.
  2. Scoped all queries strictly to `where: { userEmail }`.
  3. Partitioned transaction delete sweeps to `tx.flowNode.deleteMany({ where: { userEmail } })`.
  4. Segmented filesystem fallbacks to `data/flows/flow_nodes_${sanitizedEmail}.json`.

### Audit Vector 3: Client-Side Storage Leakage in Shared Browsers
- **Vulnerability Identified:** In single-page applications where users share a terminal or log out and log in with different accounts, `localStorage` and `IndexedDB` historically used static keys (`sutharlabs_docnexus_vault` and `DocNexusVaultDB`). User B logging into the browser would load User A's private documents and canvases.
- **Remediation Implemented:** Dynamic namespacing of client persistence buckets:
  - `localStorage` key: `sutharlabs_docnexus_vault_${encodeURIComponent(userEmail)}`
  - `IndexedDB` database: `DocNexusVaultDB_${encodeURIComponent(userEmail)}`
  - React State Synchronization: When the active user session changes, the studio purges in-memory state and reloads the authenticated user's private vault partition.

### Audit Vector 4: Unauthenticated Automated Batch Jobs & Shared Simulators
- **Vulnerability Identified:** Stock paper-trading simulator endpoints (`/simulator/portfolio`, `/simulator/history`, `/simulator/run-eod`, `/simulator/reset`) were unauthenticated and operated on a shared `simId: "default"`. One user clicking "Reset Simulator" or running an EOD batch mutated paper accounts for all users.
- **Remediation Implemented:**
  1. Enforced tenant partitioning for all simulations: `targetSimId = ${sanitizedUserEmail}__${rawSimId}`.
  2. Public/guest sessions operate strictly in an isolated sandbox (`guest__default`).
  3. Automated background cron executions (Vercel cron / Cron-Job.org) require verification via `process.env.CRON_SECRET` and operate on institutional system simulations (`system_eod_cron`).
  4. Users can only inspect, run, close, or delete simulations with their matching tenant prefix.

### Audit Vector 5: Shared Fallback Accounts
- **Vulnerability Identified:** Fallbacks such as `req.user?.email || 'default@sutharlabs.com'` or `"guest@sutharlabs.com"` allowed unauthenticated or malformed requests to silently inherit a shared repository.
- **Remediation Implemented:** Elimination of shared fallbacks. Handlers require verified authentication tokens and throw `401 Unauthorized` or `403 Forbidden` if identity is absent.

---

## 3. The SutharLabs Multi-Tenant Segregation Standard

The following 5-layer isolation model is mandatory for all core features and plugins:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Layer 1: Transport & Auth                      │
│   Incoming Request -> Bearer JWT -> Verified Cryptographic Payload     │
│   (Rejects expired tokens, banned accounts, forged signatures)         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Layer 2: Backend Query Scoping                   │
│   Prisma ORM Queries strictly include: { where: { userEmail } }        │
│   (Zero global deletes, zero un-scoped SELECT queries)                 │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Layer 3: File System Storage                       │
│   File caches partitioned: `data/{plugin}/{tenant_hash}_{filename}`     │
│   (Path traversal sanitization prevents cross-directory access)        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Layer 4: Automated Jobs & Cron Tasks                 │
│   Institutional crons require `CRON_SECRET` -> `system__` partition    │
│   User-triggered batch jobs -> `${userEmail}__${simId}` partition      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Layer 5: Client-Side Storage Isolation               │
│   IndexedDB: `PluginDB_${userEmail}`                                   │
│   LocalStorage: `plugin_store_${userEmail}`                            │
│   (Session change purges memory and swaps data store safely)           │
└────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: Cryptographic Authentication
All API routes that read or write user-specific data must be guarded by `authenticateToken` middleware (`src/middleware/auth.ts`):
```typescript
import { authenticateToken } from '../../middleware/auth.js';

router.get('/my-data', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userEmail = req.user!.email.toLowerCase().trim();
  // Safe execution with verified user identity
});
```

### Layer 2: Database Multi-Tenancy (Prisma ORM)
Every database model storing user state must declare a `userEmail` relation or attribute:
```prisma
model UserEntity {
  id        String   @id @default(uuid())
  userEmail String   @map("user_email")
  payload   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userEmail])
}
```
**Strict ORM Rule:** Every query must enforce `where: { userEmail }`:
```typescript
// ✅ Compliant
const items = await prisma.userEntity.findMany({ where: { userEmail } });
await prisma.userEntity.deleteMany({ where: { userEmail, id: { in: ids } } });

// ❌ Forbidden (Critical Vulnerability)
const items = await prisma.userEntity.findMany();
await prisma.userEntity.deleteMany();
```

### Layer 3: File System Storage Partitioning
When plugins utilize disk caching or local JSON storage, file names must be sanitized and scoped to the user's identity:
```typescript
function getUserFilePath(pluginDir: string, userEmail: string, filename: string): string {
  const safeEmail = crypto.createHash('sha256').update(userEmail.toLowerCase().trim()).digest('hex').slice(0, 16);
  return path.join(pluginDir, `${safeEmail}_${filename}`);
}
```

### Layer 4: Client Storage Isolation
No plugin may store un-namespaced state in browser storage:
```typescript
export function getVaultStorageKey(userEmail?: string): string {
  const safeUser = (userEmail || 'guest').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `sutharlabs_plugin_vault_${safeUser}`;
}
```

### Layer 5: Automated Jobs & Background Cron Workers
Automated background workers must identify themselves via a cryptographic secret:
```typescript
const isCron = req.headers["x-cron-secret"] === process.env.CRON_SECRET ||
               req.headers["authorization"] === `Bearer ${process.env.CRON_SECRET}`;

const targetSimId = isCron 
  ? `system_cron_${simId}` 
  : `${req.user.email.replace(/[^a-z0-9_-]/g, '_')}__${simId}`;
```

---

## 4. Per-Plugin Implementation Matrix

| Module / Plugin | Storage Tier | Partitioning Strategy | Access Guard |
| :--- | :--- | :--- | :--- |
| **User Portfolio & Trading** | Neon PostgreSQL / Prisma | `Portfolio` & `TradeTransaction` bound to verified `user.email` | `authenticateToken` + User Email Guard |
| **DocNexus Studio** | IndexedDB & LocalStorage | Database: `DocNexusVaultDB_${userEmail}`<br>Key: `sutharlabs_docnexus_vault_${userEmail}` | `authenticateToken` + Author ownership check |
| **DocNexus Server Docs** | Prisma `Document` / Memory | Document IDs prefixed by `doc_${userEmail}_*`<br>Author email verified on fetch | `authenticateToken` |
| **FlowDesigner** | Neon PostgreSQL / File Fallback | Prisma `FlowNode` filtered by `where: { userEmail }`<br>File: `flow_nodes_${userEmail}.json` | `authenticateToken` |
| **StockTracker Watchlists** | `watchlists.json` | Records tagged with `userEmail`<br>Users only receive system seed + owned lists | `optionalAuth` (Guests see system only)<br>`authenticateToken` on mutations |
| **Trade Simulator & EOD** | Neon DB / JSON Registry | Partitioned IDs: `${userEmail}__${simId}`<br>Crons: `system_eod_cron` | `authenticateToken` (User runs)<br>`CRON_SECRET` (Automated cron) |
| **Accounting Master** | Neon DB / `AccountingStorage` | Company, Vouchers, Invoices, Customers isolated by `getUserEmail(req)` | `authenticateToken` (Zero default fallback) |
| **Bug Reports & Telemetry** | Neon DB / `BugReport` | Reports tagged with `userEmail`<br>Admins view all; users only view own reports | `authenticateToken` + Role Guard |

---

## 5. Developer Checklist for Future Plugins

Before any new plugin or automated job is approved for release or deployment to SutharLabs, developers must satisfy this mandatory checklist:

- [ ] **No Client-Supplied Identity:** Endpoints must never accept `userEmail` or `userId` in `req.query` or `req.body` as authorization proof. Always use `req.user.email`.
- [ ] **Mandatory Auth Middleware:** Mutating endpoints (`POST`, `PUT`, `DELETE`) and private reads (`GET`) must declare `authenticateToken`.
- [ ] **No Global Batch Deletes:** Never invoke `prisma.<model>.deleteMany()` or wipe directories without a verified `where: { userEmail }` predicate.
- [ ] **Client Persistence Namespacing:** All `localStorage`, `sessionStorage`, and `IndexedDB` databases must be keyed by `userEmail`.
- [ ] **Purge on Session Change:** React components must listen to `userEmail` prop/context changes and cleanly reset internal state to avoid displaying cached data from prior sessions.
- [ ] **Automated Cron Protection:** Any automated batch endpoints must verify `process.env.CRON_SECRET` and execute in isolated institutional partitions.
- [ ] **Encryption of Plugin Packages:** Release zips must be encrypted using `scripts/package-plugins.ts` (`SLPK` AES-256-GCM) to safeguard plugin proprietary code.
- [ ] **Zero Shared Default Accounts:** Never use fallbacks like `|| 'default@sutharlabs.com'`. Return `401 Unauthorized` if identity is missing.
