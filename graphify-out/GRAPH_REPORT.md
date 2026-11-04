# Graph Report - website  (2026-11-04)

## Corpus Check
- 153 files · ~270,291 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1049 nodes · 2656 edges · 48 communities (46 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7569a660`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- StockTrackerView.tsx
- lucide-react
- WorkspaceLayout
- dependencies
- express
- MarkdownStudio.tsx
- clientRegistry.ts
- storageUtils.ts
- package.json
- App.tsx
- sentimentEngine.ts
- documentParsers.ts
- DocNexusStudio.tsx
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- DocNexus/types.ts
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- BugReportModal.tsx
- StockTracker/manifest.json
- StockTracker/routes.ts
- yahoo-finance2
- DocNexusDocument
- AdminAIChatView.tsx
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- serverRegistry.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- api/server.ts
- _utils.ts
- PluginEngine
- scripts
- TerminalLog
- vite
- vaultStorage.ts
- server.ts
- SpeechStudio/manifest.json
- dotenv
- SpeechStudio/routes.ts
- vercel.json
- DocNexus/storage.ts
- OpenLocalWorkspaceModal.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 66 edges
2. `registerRoutes()` - 44 edges
3. `lucide-react` - 41 edges
4. `TerminalLog` - 38 edges
5. `getPrismaClient()` - 35 edges
6. `startServer()` - 34 edges
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
- `main()` --calls--> `getPrismaClient()`  [EXTRACTED]
  scripts/setup-simulation-table.ts → api/_utils.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (48 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (60): lightweight-charts@^5.2.1, lightweight-charts, StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal() (+52 more)

### Community 2 - "lucide-react"
Cohesion: 0.08
Nodes (36): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, DocNexusViewProps (+28 more)

### Community 3 - "WorkspaceLayout"
Cohesion: 0.15
Nodes (11): WorkspaceLayout(), BugReportItem, BugReportsStats, ManageBugReportsProps, ManageBugReportsView(), SEVERITY_COLORS, STATUS_COLORS, STATUS_OPTIONS (+3 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, google-auth-library@^10.9.0, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, pdfjs-dist@^6.4.299 (+20 more)

### Community 5 - "express"
Cohesion: 0.12
Nodes (12): express, AuthenticatedRequest, AuthenticatedUser, requireAdmin(), errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter (+4 more)

### Community 6 - "MarkdownStudio.tsx"
Cohesion: 0.21
Nodes (9): lucide-react, MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps, DEFAULT_SHEET (+1 more)

### Community 7 - "clientRegistry.ts"
Cohesion: 0.09
Nodes (21): FlowDesignerView(), AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, FlowDesignerPlugin (+13 more)

### Community 8 - "storageUtils.ts"
Cohesion: 0.22
Nodes (13): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 9 - "package.json"
Cohesion: 0.11
Nodes (25): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+17 more)

### Community 10 - "App.tsx"
Cohesion: 0.11
Nodes (23): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+15 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.14
Nodes (21): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+13 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "DocNexusStudio.tsx"
Cohesion: 0.17
Nodes (18): DocNexusView(), CanvasStudio(), CommandPaletteModal(), DocExplorerSidebar(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, ExportModal() (+10 more)

### Community 15 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "DocNexus/types.ts"
Cohesion: 0.13
Nodes (17): CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudioProps (+9 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (16): startServer(), BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs() (+8 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.21
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "BugReportModal.tsx"
Cohesion: 0.13
Nodes (13): BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot (+5 more)

### Community 22 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTracker/routes.ts"
Cohesion: 0.05
Nodes (113): getPrismaClient(), StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, optionalAuth(), PluginManifest, AnalysisOptions (+105 more)

### Community 24 - "yahoo-finance2"
Cohesion: 0.33
Nodes (4): multer@^2.1.1, yahoo-finance2@^3.14.1, multer, yahoo-finance2

### Community 25 - "DocNexusDocument"
Cohesion: 0.26
Nodes (9): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument, DocumentFormat (+1 more)

### Community 26 - "AdminAIChatView.tsx"
Cohesion: 0.27
Nodes (12): AdminAIChatView(), init(), INITIAL_PROMPTS, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels(), OllamaModelTag, streamAIChat() (+4 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "serverRegistry.ts"
Cohesion: 0.36
Nodes (7): authenticateToken(), getDefaultUserNodes(), getUserFlowFilePath(), prisma, registerRoutes(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "api/server.ts"
Cohesion: 0.29
Nodes (7): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, @vercel/node@^5.9.7, @vercel/node, app, startPromise

### Community 35 - "_utils.ts"
Cohesion: 0.12
Nodes (17): generateToken(), SECRET_KEY, @neondatabase/serverless@^1.1.0, pg@^8.23.0, @prisma/adapter-neon@^7.9.1, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, ws@^8.21.3 (+9 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "TerminalLog"
Cohesion: 0.14
Nodes (21): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+13 more)

### Community 40 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 41 - "vaultStorage.ts"
Cohesion: 0.54
Nodes (7): clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault(), openVaultDB(), sanitizeForLocalStorage(), saveVault()

### Community 42 - "server.ts"
Cohesion: 0.10
Nodes (8): hashPassword(), defaultPlugins, prisma, seedDatabase(), upload, ContactNotificationPayload, DispatchResult, notifyAdminNewInquiry()

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "dotenv"
Cohesion: 0.29
Nodes (5): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma, main()

### Community 46 - "SpeechStudio/routes.ts"
Cohesion: 0.43
Nodes (6): verifyToken(), getQuotaStatus(), getUserIdentifierAndRole(), quotaStore, registerRoutes(), UserQuotaEntry

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 52 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (3): OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `StockTrackerView.tsx`, `lucide-react`, `WorkspaceLayout`, `dependencies`, `MarkdownStudio.tsx`, `TerminalLog`, `clientRegistry.ts`, `package.json`, `App.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `LandingPage.tsx`, `BugReportModal.tsx`, `OpenLocalWorkspaceModal.tsx`, `StockTracker/routes.ts`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`?**
  _High betweenness centrality (0.204) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `MarkdownStudio.tsx` to `StockTrackerView.tsx`, `lucide-react`, `WorkspaceLayout`, `dependencies`, `TerminalLog`, `clientRegistry.ts`, `package.json`, `App.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `LandingPage.tsx`, `BugReportModal.tsx`, `OpenLocalWorkspaceModal.tsx`, `StockTracker/routes.ts`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `StockTrackerView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.056314699792960665 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `react`, `dependencies`, `package.json`, `server.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `StockTracker/routes.ts`, `telemetryService.ts`, `serverRegistry.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.0824524312896406 - nodes in this community are weakly interconnected._