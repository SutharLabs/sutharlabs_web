import { Application, Router } from "express";
import { manifest as stockManifest } from "./StockTracker/manifest.js";
import { registerRoutes as registerStockRoutes } from "./StockTracker/routes.js";
import { manifest as flowManifest } from "./FlowDesigner/manifest.js";
import { registerRoutes as registerFlowRoutes } from "./FlowDesigner/routes.js";
import { manifest as docNexusManifest } from "./DocNexus/manifest.js";
import { registerRoutes as registerDocNexusRoutes } from "./DocNexus/routes.js";
import { manifest as accountingManifest } from "./Accounting/manifest.js";
import { registerRoutes as registerAccountingRoutes } from "./Accounting/routes.js";

export const SERVER_PLUGIN_ENTRIES = [
  { manifest: stockManifest, registerRoutes: registerStockRoutes },
  { manifest: flowManifest, registerRoutes: registerFlowRoutes },
  { manifest: docNexusManifest, registerRoutes: registerDocNexusRoutes },
  { manifest: accountingManifest, registerRoutes: registerAccountingRoutes }
];

/**
 * Registers all in-tree plugin API routes on the Express server.
 * Mounts standard modular endpoints at /api/plugins/:id
 * and provides legacy route aliases for 100% backward compatibility.
 */
export function registerAllPluginRoutes(app: Application) {
  // 1. Mount modular routes at /api/plugins/:pluginId
  for (const plugin of SERVER_PLUGIN_ENTRIES) {
    const router = Router();
    plugin.registerRoutes(router);
    app.use(`/api/plugins/${plugin.manifest.id}`, router);
  }

  // 2. Backward compatibility aliases
  // Stock Analyzer routes: /api/workspace/stock-analyzer/*
  const stockRouter = Router();
  registerStockRoutes(stockRouter);
  app.use("/api/workspace/stock-analyzer", stockRouter);

  // Flow Designer routes: /api/nodes & /api/nodes/sync
  const flowRouter = Router();
  registerFlowRoutes(flowRouter);
  app.use("/api", flowRouter);

  // DocNexus routes: /api/docnexus/document
  const docNexusRouter = Router();
  registerDocNexusRoutes(docNexusRouter);
  app.use("/api/docnexus", docNexusRouter);

  // Accounting routes: /api/invoices
  const accountingRouter = Router();
  registerAccountingRoutes(accountingRouter);
  app.use("/api", accountingRouter);
}
