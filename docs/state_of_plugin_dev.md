# State of Plugin Development: SutharLabs Platform

This document outlines the architecture, current implementation state, and developer guidelines for building and extending plugins within the SutharLabs platform.

---

## 1. Executive Summary

SutharLabs operates a **Dual-Mode Hybrid Plugin Architecture**:

- **Vercel Free Tier (Current Environment)**: Serverless edge functions with ephemeral filesystem and static dependency compilation. Plugins operate as **In-Tree Modular Packages** registered via decoupled Client and Server Registries.
- **Self-Hosted / VPS Migration (Future Environment)**: Dedicated Virtual Private Server (Hostinger, AWS, DigitalOcean, or Docker container) running a continuous Node.js process. In addition to in-tree plugins, the server enables [`PluginEngine.ts`](file:///d:/Code/SutharLabs/website/src/plugins/PluginEngine.ts) to accept `.zip` / `.vsix` file uploads at runtime without server redeployment.

---

## 2. Active In-Tree Plugins

All native workspace extensions are co-located in [`src/plugins/`](file:///d:/Code/SutharLabs/website/src/plugins/):

| Plugin Name | Folder | Identifier | Category | Route | Endpoints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stock Tracker** | `src/plugins/StockTracker/` | `wp_stock_analyzer` | Finance | `/workspace/stock-tracker` | `/api/plugins/wp_stock_analyzer/*`, `/api/workspace/stock-analyzer/*` |
| **Custom Flow** | `src/plugins/FlowDesigner/` | `wp_flow_designer` | Architecture | `/workspace/flow` | `/api/plugins/wp_flow_designer/*`, `/api/nodes`, `/api/nodes/sync` |
| **Doc Nexus** | `src/plugins/DocNexus/` | `wp_doc_nexus` | Documentation | `/workspace/docnexus` | `/api/plugins/wp_doc_nexus/*`, `/api/docnexus/document` |
| **Accounting** | `src/plugins/Accounting/` | `wp_accounting` | Operations | `/workspace/accounting` | `/api/plugins/wp_accounting/*`, `/api/invoices` |

---

## 3. In-Tree Plugin Specification

Each plugin is an isolated, self-contained module structured as follows:

```
src/plugins/<PluginName>/
  ├── manifest.json      # Machine-readable metadata (id, version, category, route)
  ├── manifest.ts        # Strongly-typed manifest for compile-time safety
  ├── index.ts           # Browser-safe client entrypoint (exports manifest + React View)
  └── routes.ts          # Server entrypoint (exports registerRoutes(router: Router))
```

### 3.1. `manifest.json` & `manifest.ts`
Defines metadata, categorizations, and workspace routing:
```typescript
import { WorkspacePluginManifest } from "../types.js";

export const manifest: WorkspacePluginManifest = {
  id: "wp_my_extension",
  name: "My Extension",
  version: "1.0.0",
  category: "Developer Tools",
  type: "Native",
  iconSymbol: "terminal",
  route: "/workspace/my-extension",
  description: "High-performance developer tooling extension."
};

export default manifest;
```

### 3.2. `index.ts` (Client Entrypoint)
Exports the manifest and React View component. Must **never** import Node.js, Express, or backend libraries to maintain clean browser bundling via Vite:
```typescript
import { manifest } from "./manifest.js";
import MyExtensionView from "./MyExtensionView.js";

export const MyExtensionPlugin = {
  manifest,
  View: MyExtensionView
};

export { manifest, MyExtensionView as View };
export default MyExtensionPlugin;
```

### 3.3. `routes.ts` (Server Entrypoint)
Defines the Express router endpoints mounted under `/api/plugins/<pluginId>`:
```typescript
import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.js";

export function registerRoutes(router: Router) {
  router.get("/status", authenticateToken, async (req, res) => {
    res.json({ status: "active", timestamp: new Date().toISOString() });
  });
}
```

---

## 4. The Decoupled Registry Pattern

To bridge the client and server while satisfying Vercel `@vercel/nft` AST file tracing, two dedicated registries are maintained:

### 1. Client Registry ([`src/plugins/clientRegistry.ts`](file:///d:/Code/SutharLabs/website/src/plugins/clientRegistry.ts))
Statically imports all plugin `index.ts` files. Provides lookup helpers:
- `getAllClientPlugins()`
- `getClientPluginByName(tabName)`
- `getClientPluginById(id)`

### 2. Server Registry ([`src/plugins/serverRegistry.ts`](file:///d:/Code/SutharLabs/website/src/plugins/serverRegistry.ts))
Statically imports plugin `routes.ts` files and exports:
- `registerAllPluginRoutes(app: Express.Application)`
- Mounts `/api/plugins/:id/*` dynamically.
- Maintains backwards-compatible root aliases for legacy routes.

---

## 5. User Workspace Entitlements

The workspace IDE does not rely on static UI configuration:
1. **Database Tracking**: User installations are tracked in Neon Postgres via `UserWorkspacePlugin` joined to `WorkspacePlugin`.
2. **Initial Auto-Seeding**: When a user visits the workspace, `GET /api/workspace-plugins/installed` checks if the user has any installed plugins; if empty, it seeds the 4 core native tools automatically.
3. **Reactive Store Integration**: When an extension is toggled in the **Workspace Plugin Store**, the `onPluginsChange` hook triggers real-time sidebar tab and view re-rendering with zero page reloads.

---

## 6. How to Add a New In-Tree Plugin (4 Steps)

1. **Create the folder**: `src/plugins/<NewPluginName>/` with `manifest.json`, `manifest.ts`, `index.ts`, and `routes.ts`.
2. **Register in Client Registry**: Add the plugin to [`src/plugins/clientRegistry.ts`](file:///d:/Code/SutharLabs/website/src/plugins/clientRegistry.ts).
3. **Register in Server Registry**: Add the plugin routes to [`src/plugins/serverRegistry.ts`](file:///d:/Code/SutharLabs/website/src/plugins/serverRegistry.ts).
4. **Seed Database Record**: Add the metadata to `inTreePlugins` in [`seed.ts`](file:///d:/Code/SutharLabs/website/seed.ts).
