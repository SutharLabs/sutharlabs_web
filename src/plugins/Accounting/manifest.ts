import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_accounting",
  name: "Accounting",
  version: "0.2.2",
  category: "Operations",
  type: "Native",
  iconSymbol: "currency_exchange",
  route: "/workspace/accounting",
  description: "Enterprise Indian GST Accounting, Rule 46 Tax Invoicing, GSTR-1 & GSTR-3B Returns, E-Invoicing (IRN), Double-Entry General Ledger, and Multi-Tenant PostgreSQL Cloud Sync."
};

export default manifest;
