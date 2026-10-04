# Plugin Versioning, Release Tracking & Continuous Development Architecture

This document defines the architectural standard, operational procedures, and automation pipeline for versioning, tracking continuous changes, and managing releases for SutharLabs Workspace Plugins.

---

## 1. Executive Summary & Philosophy

SutharLabs Workspace Plugins follow industry best practices inspired by top-tier extension marketplaces (VS Code Marketplace, Figma Community, JetBrains Marketplace).

Key tenets:
1. **Semantic Versioning (SemVer 2.0.0)**: All plugins use `MAJOR.MINOR.PATCH` notation. All plugins begin at `0.1.0` (initial alpha release).
2. **Immutable Release History**: Once a version (e.g. `0.1.0`) is published, its release record, changelog, and cryptographic hash are immutable in the PostgreSQL `WorkspacePluginVersion` table.
3. **Cryptographic Integrity**: Every published archive package (`.zip` or `.vsix`) is verified using SHA-256 checksums to ensure zero tampering.
4. **Dual Development Lifecycle**: Seamlessly supports both in-tree source development (`src/plugins/*`) and standalone archive packages uploaded by administrators.
5. **Deterministic User Update Lifecycle**: The system tracks `installedVersion` per user in `UserWorkspacePlugin`. When a newer version is cataloged, users receive a non-intrusive "Update Available" badge and 1-click upgrade flow.

---

## 2. Database Schema & Data Model

The versioning architecture is persisted in Neon PostgreSQL via Prisma:

```prisma
model WorkspacePlugin {
  id           String                   @id
  name         String
  category     String
  type         String                   @default("Native")
  description  String
  iconSymbol   String                   @default("extension")
  version      String                   @default("0.1.0")
  installedBy  UserWorkspacePlugin[]
  reviews      WorkspacePluginReview[]
  versions     WorkspacePluginVersion[]
  createdAt    DateTime                 @default(now())
}

model WorkspacePluginVersion {
  id               String          @id @default(uuid())
  pluginId         String
  version          String
  changelog        String?
  packageUrl       String?
  checksumSha256   String?
  minEngineVersion String?         @default("0.1.0")
  publishedBy      String?
  publishedAt      DateTime        @default(now())
  plugin           WorkspacePlugin @relation(fields: [pluginId], references: [id], onDelete: Cascade)

  @@unique([pluginId, version])
}

model UserWorkspacePlugin {
  id               String          @id @default(uuid())
  userEmail        String
  pluginId         String
  installedVersion String          @default("0.1.0")
  updatedAt        DateTime        @default(now()) @updatedAt
  plugin           WorkspacePlugin @relation(fields: [pluginId], references: [id], onDelete: Cascade)

  @@unique([userEmail, pluginId])
}
```

---

## 3. Continuous In-Tree Development Workflow

Core native plugins reside directly in the workspace codebase:
- `src/plugins/StockAnalyzer` (`wp_stock_analyzer`)
- `src/plugins/FlowDesigner` (`wp_flow_designer`)
- `src/plugins/DocNexus` (`wp_doc_nexus`)
- `src/plugins/Accounting` (`wp_accounting`)

### Step 1: Local Feature Development
When introducing changes to a plugin (e.g., adding an RSI indicator or refining canvas nodes):
1. Make your code modifications in `src/plugins/<PluginFolder>/index.ts` and related components.
2. Ensure types and local execution pass (`npm run build`).

### Step 2: Version Increment in `manifest.json`
Each in-tree plugin contains a `manifest.json`:
```json
{
  "id": "wp_stock_analyzer",
  "name": "Stock Analyzer & Algorithmic Trader",
  "version": "0.1.1",
  "category": "Finance",
  "type": "Native",
  "description": "Real-time quote streaming with Bollinger Bands and deterministic order simulator.",
  "iconSymbol": "monitoring",
  "main": "index.ts",
  "minEngineVersion": "0.1.0"
}
```

**SemVer Increment Rules**:
- **PATCH (`0.1.0` -> `0.1.1`)**: Backward-compatible bug fixes, UI styling refinements, small performance patches.
- **MINOR (`0.1.0` -> `0.2.0`)**: New feature additions, new exposed plugin actions, backward-compatible API expansion.
- **MAJOR (`0.x.x` -> `1.0.0`)**: Breaking architectural changes, state migration requirements, or engine compatibility bumps.

### Step 3: Automated Packaging & Integrity Pipeline
Run the automated packaging script:
```bash
npm run package:plugins
```
This command triggers `scripts/package-plugins.ts`, which:
1. Validates `manifest.json` across all plugins.
2. Compresses the plugin sources into `./storage/plugins/<id>-v<version>.zip`.
3. Computes the SHA-256 cryptographic digest of the bundle.
4. Generates a consolidated `./storage/plugins/catalog-manifest.json`.
5. Synchronizes the new version record directly into the Neon PostgreSQL `WorkspacePluginVersion` table.

---

## 4. Archive Upload & Admin Cataloging Workflow

For third-party or externally developed plugins packaged as `.zip` or `.vsix`:

1. **Upload Archive**:
   - Admin visits `/workspace/admin/plugins` ("Manage Plugins").
   - Selects the `.zip` archive package.
   - The frontend streams the archive to `POST /api/plugins/upload`.
   - The server computes the SHA-256 hash in memory, writes the package to `./storage/plugins/`, and returns `packageUrl` and `checksumSha256`.

2. **Publish Metadata & Changelog**:
   - The Admin specifies the **Version** (e.g. `0.2.0`), **Category**, **Plugin Name**, and **Release Notes / Changelog**.
   - Submitting the form calls `POST /api/workspace-plugins`.
   - The server creates or updates the `WorkspacePlugin` and records the new release in `WorkspacePluginVersion`.

---

## 5. User Store & 1-Click Update Experience

The Plugin Store (`WorkspacePluginStore.tsx`) automatically detects version deltas:

1. **Version Comparison**:
   The store fetches `installedVersion` from `GET /api/workspace-plugins/installed` and compares it with `plugin.version`.
   ```ts
   const hasUpdate = isInstalled && userPlugin?.installedVersion && userPlugin.installedVersion !== plugin.version;
   ```

2. **Visual Indicators**:
   - **Extension Card**: Displays a pulsating cyan badge: `Update Available (v0.1.0 -> v0.2.0)`.
   - **Action Button**: The default "Installed" status transforms into an active `Update to v0.2.0` button.
   - **Spotlight Banner**: Highlights available updates for featured tools.

3. **Releases & Changelog Tab**:
   In the Extension Details modal, users can inspect:
   - Full chronological release timeline.
   - Detailed markdown changelogs.
   - SHA-256 cryptographic verification checksums.
   - Direct package archive download links.
   - Tag identifying which version is currently active in the user's workspace.

4. **1-Click Execution**:
   Clicking `Update to v...` posts to `POST /api/workspace-plugins/install`, which smoothly updates `UserWorkspacePlugin.installedVersion` to the latest release and triggers the real-time `onPluginsChange` hook.

---

## 6. Recommended CI/CD Release Automation (Future Roadmap)

To maintain effortless version tracking in team environments:

### GitHub Actions Workflow (`.github/workflows/plugins-release.yml`)
1. **Trigger on PR**: Run `scripts/package-plugins.ts` in dry-run mode to verify all plugin manifests are valid and hashes generate cleanly.
2. **Release Tagging**: When a git tag matching `plugin-<id>-v*` (e.g. `plugin-stock-analyzer-v0.2.0`) is pushed:
   - Automatically package the plugin.
   - Upload archive to SutharLabs S3/Cloudflare R2 Object Storage.
   - Call the internal admin API or run database migration to register the new release.
   - Post release notification to workspace developer activity feed.

---

## 7. Developer Pre-Commit Checklist

Before committing any modifications that touch plugin source code or platform core, developers must follow the verification sequence in [docs/pre_commit_checklist.md](file:///d:/Code/SutharLabs/website/docs/pre_commit_checklist.md).

