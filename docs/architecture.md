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
