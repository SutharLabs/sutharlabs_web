# Graph Report - website  (2026-11-04)

## Corpus Check
- 141 files · ~246,470 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 969 nodes · 2484 edges · 44 communities (41 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6e4d7442`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- StockTracker/routes.ts
- TerminalLog
- WorkspaceLayout
- dependencies
- StockTrackerView.tsx
- ManageBugReportsView.tsx
- clientRegistry.ts
- startServer
- package.json
- App.tsx
- sentimentEngine.ts
- documentParsers.ts
- DocNexusStudio
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- OpenLocalWorkspaceModal.tsx
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- emailService.ts
- SlideDeckStudio.tsx
- BugReportModal.tsx
- DocNexusDocument
- UserProfileView.tsx
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- DocNexus/types.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- StockTracker/manifest.json
- seed.ts
- PluginEngine
- scripts
- lucide-react
- vite
- server.ts
- DocNexusStudio.tsx
- _utils.ts
- vercel.json
- yahoo-finance2

## God Nodes (most connected - your core abstractions)
1. `react` - 62 edges
2. `registerRoutes()` - 44 edges
3. `lucide-react` - 37 edges
4. `TerminalLog` - 34 edges
5. `getPrismaClient()` - 33 edges
6. `startServer()` - 31 edges
7. `registerRoutes()` - 30 edges
8. `AccountingStorage` - 27 edges
9. `loadTenantData()` - 23 edges
10. `runEODSimulation()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `main()` --calls--> `getPrismaClient()`  [EXTRACTED]
  scripts/setup-simulation-table.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (44 total, 3 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "StockTracker/routes.ts"
Cohesion: 0.05
Nodes (118): getPrismaClient(), StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, PluginManifest, AnalysisOptions, formatTickerDisplay() (+110 more)

### Community 2 - "TerminalLog"
Cohesion: 0.09
Nodes (33): AccountingViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, DocNexusView(), DocNexusViewProps (+25 more)

### Community 3 - "WorkspaceLayout"
Cohesion: 0.12
Nodes (9): WorkspaceLayout(), ErrorBoundary, ManageAppsView(), DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), MutedMarkdownView() (+1 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, @google/genai@^2.4.0, lightweight-charts@^5.2.1, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1 (+22 more)

### Community 5 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (60): lightweight-charts, lucide-react, StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal() (+52 more)

### Community 6 - "ManageBugReportsView.tsx"
Cohesion: 0.25
Nodes (7): BugReportItem, BugReportsStats, ManageBugReportsProps, ManageBugReportsView(), SEVERITY_COLORS, STATUS_COLORS, STATUS_OPTIONS

### Community 7 - "clientRegistry.ts"
Cohesion: 0.05
Nodes (49): verifyToken(), express@^4.21.2, express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin() (+41 more)

### Community 8 - "startServer"
Cohesion: 0.24
Nodes (12): generateToken(), hashPassword(), seedDatabase(), startServer(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob(), isBlobConfigured() (+4 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "App.tsx"
Cohesion: 0.15
Nodes (16): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+8 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.14
Nodes (21): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+13 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "DocNexusStudio"
Cohesion: 0.50
Nodes (8): DocNexusStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault(), openVaultDB(), sanitizeForLocalStorage(), saveVault()

### Community 15 - "_utils.ts"
Cohesion: 0.39
Nodes (8): decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive(), resolvePluginArchiveBuffer(), SLPK_MAGIC, SLPK_VERSION

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.53
Nodes (5): executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), parseDatabaseMetadata()

### Community 17 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.21
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "emailService.ts"
Cohesion: 0.50
Nodes (3): ContactNotificationPayload, DispatchResult, notifyAdminNewInquiry()

### Community 22 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.19
Nodes (12): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal() (+4 more)

### Community 26 - "UserProfileView.tsx"
Cohesion: 0.29
Nodes (8): AuthPageProps, BugReportModal(), getStoredCookiePreferences(), LandingPageProps, ProfileData, UserProfileView(), UserProfileViewProps, UserProfile

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "DocNexus/types.ts"
Cohesion: 0.16
Nodes (14): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+6 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 35 - "seed.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 38 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, clean, dev, dev:watch, lint, package:plugins, preview (+1 more)

### Community 39 - "lucide-react"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 40 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 42 - "server.ts"
Cohesion: 0.12
Nodes (6): handler(), app, defaultPlugins, prisma, startPromise, upload

### Community 44 - "DocNexusStudio.tsx"
Cohesion: 0.19
Nodes (12): FORMAT_TABS, INITIAL_DOCS, RichDocStudio(), DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps, FORMAT_ICONS, TemplateLibraryModal() (+4 more)

### Community 45 - "_utils.ts"
Cohesion: 0.11
Nodes (15): SECRET_KEY, dotenv@^16.4.5, @neondatabase/serverless@^1.1.0, prisma@^7.8.0, @prisma/adapter-neon@^7.9.1, ws@^8.21.3, dotenv, @neondatabase/serverless (+7 more)

### Community 47 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, crons, outputDirectory, rewrites

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `StockTracker/routes.ts`, `TerminalLog`, `WorkspaceLayout`, `dependencies`, `StockTrackerView.tsx`, `ManageBugReportsView.tsx`, `clientRegistry.ts`, `package.json`, `App.tsx`, `OpenLocalWorkspaceModal.tsx`, `LandingPage.tsx`, `SlideDeckStudio.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `UserProfileView.tsx`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `lucide-react`, `DocNexusStudio.tsx`?**
  _High betweenness centrality (0.224) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `StockTrackerView.tsx` to `StockTracker/routes.ts`, `TerminalLog`, `WorkspaceLayout`, `dependencies`, `ManageBugReportsView.tsx`, `lucide-react`, `package.json`, `DocNexusStudio.tsx`, `OpenLocalWorkspaceModal.tsx`, `LandingPage.tsx`, `SlideDeckStudio.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `UserProfileView.tsx`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `StockTracker/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05052693785088151 - nodes in this community are weakly interconnected._
- **Why does `getPrismaClient()` connect `StockTracker/routes.ts` to `react`, `clientRegistry.ts`, `server.ts`, `_utils.ts`, `databaseSyncService.ts`, `getPrismaClient`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.09059233449477352 - nodes in this community are weakly interconnected._