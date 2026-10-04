import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_accounting",
  name: "Accounting",
  version: "0.1.0",
  category: "Operations",
  type: "Native",
  iconSymbol: "currency_exchange",
  route: "/workspace/accounting",
  description: "Financial ledger, invoicing, daily transaction sequences, and balance auditing."
};

export default manifest;
