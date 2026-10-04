# Pre-Commit Checklist & Guidelines for SutharLabs

This document outlines the mandatory steps every developer must follow before committing code to this repository. Because this project contains both core platform code and extensible workspace plugins (`src/plugins/*`), commits often span multiple layers (manifests, package archives, database schema, and runtime code).

---

## 1. Quick Reference Cheatsheet

| Type of Changes | Required Pre-Commit Commands | Files to Stage & Commit |
| :--- | :--- | :--- |
| **Plugin Code Modified** (`src/plugins/*`) | 1. Bump version in `manifest.json`<br>2. `npm run package:plugins`<br>3. `npm run lint`<br>4. `npm run build` | `src/plugins/<Plugin>/*`<br>`src/plugins/<Plugin>/manifest.json`<br>`storage/plugins/*` |
| **Database Schema** (`prisma/schema.prisma`) | 1. `npx prisma db push`<br>2. `npx prisma generate`<br>3. `npm run lint`<br>4. `npm run build` | `prisma/schema.prisma`<br>`seed.ts` (if updated) |
| **Core UI / Server Code** (`src/components/*`, `server.ts`) | 1. `npm run lint`<br>2. `npm run build` | Modified source files |
| **Documentation Only** (`docs/*`, `*.md`) | Verification of markdown links & preview | `.md` files |

---

## 2. Step-by-Step Workflow

### Step 1: Identify What Changed
Before staging files with `git add`, inspect modified files:
```bash
git status
```
Determine if changes touch:
- **In-tree plugins** (`src/plugins/StockAnalyzer`, `FlowDesigner`, `DocNexus`, `Accounting`, etc.)
- **Platform core** (`src/components/`, `src/App.tsx`, `server.ts`)
- **Database models** (`prisma/schema.prisma`)

---

### Step 2: Plugin Changes (If `src/plugins/*` was modified)

When changing any file inside `src/plugins/<PluginName>/`:

1. **Update `manifest.json` Version & Metadata**:
   Open `src/plugins/<PluginName>/manifest.json` and bump the `version` field according to Semantic Versioning:
   - **PATCH (`0.1.0` → `0.1.1`)**: Bug fixes, minor UI tweaks, internal optimizations.
   - **MINOR (`0.1.0` → `0.2.0`)**: New feature, new action handler, non-breaking capability addition.
   - **MAJOR (`0.x.x` → `1.0.0`)**: Breaking state/database changes, incompatible engine interface changes.

   ```json
   {
     "id": "wp_stock_analyzer",
     "name": "Stock Analyzer & Algorithmic Trader",
     "version": "0.1.1",
     "description": "Added MACD histogram calculation and deterministic trade execution.",
     "minEngineVersion": "0.1.0"
   }
   ```

2. **Run the Plugin Packaging & Integrity Pipeline**:
   Run the packaging command:
   ```bash
   npm run package:plugins
   ```
   **What this command does automatically:**
   - Validates all plugin `manifest.json` files.
   - Archives the plugin sources into `./storage/plugins/<id>-v<version>.zip`.
   - Computes the SHA-256 cryptographic checksum for the package.
   - Updates `./storage/plugins/catalog-manifest.json`.
   - Synchronizes the new version record directly into the Neon PostgreSQL `WorkspacePluginVersion` table (via `--sync-db`).

---

### Step 3: Database Changes (If `prisma/schema.prisma` was modified)

If you modified models or fields in `prisma/schema.prisma`:

1. **Push Changes to the Database**:
   ```bash
   npx prisma db push
   ```
2. **Regenerate Prisma Client Typings**:
   ```bash
   npx prisma generate
   ```
3. **Verify `seed.ts`**:
   Ensure `seed.ts` is updated if new required fields were added or default catalog values changed.

---

### Step 4: Mandatory Code Verification (Run for ALL Commits)

Before committing, run these two mandatory verification steps. **Commits must never be pushed with failing checks.**

1. **Run TypeScript Lint & Type Check**:
   ```bash
   npm run lint
   ```
   *(Executes `tsc --noEmit`. Must exit with code 0 and zero errors.)*

2. **Run Production Build**:
   ```bash
   npm run build
   ```
   *(Compiles both the Vite React frontend and the esbuild Express backend bundle into `dist/`. Must exit with code 0.)*

---

### Step 5: Git Staging & Commit Conventions

1. **Stage Required Files**:
   Ensure you stage the plugin source code, the updated `manifest.json`, the generated package archive, and the catalog manifest together:
   ```bash
   git add src/plugins/<PluginName>/
   git add storage/plugins/
   git add src/ server.ts prisma/ # (or specific modified files)
   ```

2. **Commit Message Format**:
   Follow Conventional Commits:
   - **Plugin feature**: `feat(plugin-stock): add MACD histogram and bump version to v0.1.1`
   - **Plugin bugfix**: `fix(plugin-doc): resolve split-pane markdown scroll desync (v0.1.1)`
   - **Store/Catalog**: `feat(store): add 1-click update button and release changelog modal`
   - **Backend API**: `fix(api): correct SHA-256 validation on archive package upload`
   - **Database**: `chore(db): add release versioning model to schema`

---

## 3. Pre-Commit Command Summary

For convenience, you can run this single compound command before committing:

```bash
npm run package:plugins && npm run lint && npm run build
```

If all three steps pass cleanly, your code is safe to commit.
