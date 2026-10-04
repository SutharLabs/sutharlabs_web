# Architectural Walkthrough: SutharLabs Platform

We have completed several massive overhauls to transform the monolithic template into a fully structured, modular platform capable of loading external React plugins dynamically.

## 1. Global Navigation & Architecture
We successfully migrated from simple state-based view swapping to a robust URL-driven architecture utilizing `react-router-dom`.
- `App.tsx` now utilizes `BrowserRouter` and maps distinct URLs (e.g. `/admin/manage-plugins`) to specific React components.
- The sidebar navigation cleanly distinguishes between **MANAGEMENT** (Admin Controls, Docs) and **INSTALLED PLUGINS** (Stock Tracker, IDE Tools).
- File extension pseudo-names were removed for a cleaner, polished UX.

## 2. Admin Console Refactoring
The 900+ line Admin Console was cleanly decoupled into 4 lightweight, dedicated views:
- **`AdminConsoleView.tsx`**: A pure high-level dashboard displaying telemetry, user privileges, system stress toggles, and live inventory metrics.
- **`ManageAppsView.tsx`**: Dedicated page for Admins to view public marketplace items and upload `.zip` `.vsix` packages.
- **`ManagePluginsView.tsx`**: Dedicated page to manage internal workspace-specific plugins.
- **`ManagePortfoliosView.tsx`**: Dedicated page strictly for viewing user financial telemetry.

> **Tip**: This separation allows us to lazily load these admin panels independently in the future, improving Webpack chunking and TTI (Time to Interactive).

## 3. Dynamic Plugin File Upload Engine
We initialized the foundational Node.js API to accept plugin package uploads over the network:
- Built `server.ts` integration with `multer` to accept `multipart/form-data` uploads at `POST /api/plugins/upload`.
- Added highly responsive UI input forms inside `ManageAppsView` and `ManagePluginsView`.
- These binary files are temporarily staged in `/uploads` before being validated and migrated to the `installed_plugins/` directory.

## 4. Hybrid Serverless Deployment Architecture (Vercel)
The platform is engineered to support a highly flexible **"Best of Both Worlds"** deployment strategy, bridging a traditional monolithic Express backend with modern Serverless edge infrastructure (Vercel).

### The Challenge
Vercel is designed for Next.js or static frontend sites (SPAs). It expects server-side logic to be split into individual isolated Serverless Functions inside an `api/` directory. It does not naturally support a massive monolithic `server.ts` Express application, leading to routing conflicts where the Vite React frontend "swallows" API requests (the classic SPA Catch-All issue).

### The Custom Solution
We implemented a robust hybrid architecture utilizing:
1. **The Vercel Serverless Bridge (`api/server.ts`)**: 
   A dedicated Serverless Function handler that acts as a proxy. Vercel automatically boots this function for all `/api/*` requests. This file then imports the heavy `server.js` Express application, allowing Vercel to route traffic into the Express router dynamically.
2. **Explicit Query Parameter Routing (`vercel.json`)**: 
   To circumvent Vercel's Edge Router stripping the `/api/` basepath, we use explicit rewrites:
   ```json
   { "source": "/api/(.*)", "destination": "/api/server?apiPath=$1" },
   { "source": "/(.*)", "destination": "/index.html" }
   ```
   This passes the requested path explicitly to the Express server, ensuring 100% routing fidelity between local development and production.
3. **Static Plugin Compilation**:
   Because Vercel's Node File Trace (`@vercel/nft`) relies on static analysis to bundle serverless functions, dynamic `.ts` runtime imports (like `await import("./StockAnalyzer/index.ts")`) fail in production. We solved this by strictly using static ESM `.js` imports for native plugins, ensuring `esbuild` perfectly bundles third-party dependencies (like `yahoo-finance2`) directly into the Vercel function.

### Database Layer
Because Vercel is strictly ephemeral (no file-system persistence), the original file-based SQLite database (`prisma/dev.db`) is replaced in production with **Neon Serverless Postgres** via `@prisma/adapter-neon`. Prisma acts as the universal ORM interface, seamlessly interacting with SQLite locally and Postgres in the cloud without altering any backend logic.

## 6. In-Tree Modular Plugin Architecture (Dual Registry Pattern)
To ensure compatibility with Vercel's free serverless tier (ephemeral filesystem, static `@vercel/nft` dependency tracing) while maintaining full architectural isolation for future VPS migration, the platform implements an **In-Tree Modular Plugin Architecture** using a decoupled Dual Registry pattern:

### Directory Structure per Plugin:
```
src/plugins/<PluginName>/
  ├── manifest.json      # Machine-readable metadata (id, version, category, route)
  ├── manifest.ts        # Typed TypeScript manifest
  ├── index.ts           # Browser-safe client entrypoint (exports manifest + React View)
  └── routes.ts          # Server entrypoint (exports registerRoutes(router))
```

### Decoupled Registries:
1. **Client Registry (`src/plugins/clientRegistry.ts`)**:
   Statically imports client entrypoints (`manifest` + `View`) without any Node.js or Express dependencies, guaranteeing error-free client bundling via Vite.
2. **Server Registry (`src/plugins/serverRegistry.ts`)**:
   Imports server entrypoints (`registerRoutes`) and mounts both modular namespaced routes (`/api/plugins/:id/*`) and backward-compatible route aliases (`/api/workspace/stock-analyzer`, `/api/nodes`, `/api/docnexus/document`, `/api/invoices`).

## 7. Dynamic User Workspace Entitlements
Instead of hardcoding workspace tabs and views, the IDE workspace is dynamically driven by the database:
- User installations are tracked in `UserWorkspacePlugin` joined with `WorkspacePlugin`.
- On workspace boot, `/api/workspace-plugins/installed` returns the user's active tools (auto-seeding the default 4 native tools for new accounts).
- The sidebar tabs in `App.tsx` and active view panels are rendered dynamically via `getClientPluginByName(activeTab)`.
- When users install or uninstall extensions in the `WorkspacePluginStore`, the `onPluginsChange` hook triggers immediate, seamless re-rendering without page refresh.

## 8. Portability & Future VPS Migration (AWS, Hostinger, DigitalOcean)
One of the primary advantages of this custom monolithic Express architecture is **zero vendor lock-in**. Unlike Next.js applications that are heavily coupled to Vercel's proprietary infrastructure, this entire platform remains a standard Node.js application at its core.

If scaling demands or feature requirements (such as long-running background tasks, WebSocket streaming, or runtime `.zip`/`.vsix` plugin hot-loading via `PluginEngine.ts`) outgrow Vercel's Serverless environment, the platform can be seamlessly ported to any traditional Virtual Private Server (VPS) or cloud provider (e.g., AWS EC2, Hostinger, Render, DigitalOcean, or Railway).

### Migration Strategy:
1. **Remove Vercel Bridge**: Simply delete `api/server.ts` and `vercel.json`.
2. **Build the Frontend**: Run `npm run build` to compile the Vite React application into static assets.
3. **Start the Express Server**: The `server.ts` file automatically detects if it is running outside of Vercel (via the lack of the `VERCEL` env flag) and will natively serve the static `dist/` directory on port 3000 (or the specified `$PORT` environment variable).
4. **Enable Runtime Dynamic Loading**: Re-enable `multer` uploads in `server.ts` to allow administrators to upload `.zip`/`.vsix` packages directly into `installed_plugins/`, which `PluginEngine` automatically loads and mounts at runtime without restarting the server.
5. **Dockerization (Optional)**: The platform can easily be containerized using a standard Node.js Dockerfile, allowing orchestrated deployments via Kubernetes or AWS ECS.

This hybrid approach ensures immediate, free scalability via Vercel today, with an open, unhindered migration path to dedicated hardware tomorrow.

