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
