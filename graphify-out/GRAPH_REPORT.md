# Graph Report - website  (2026-11-04)

## Corpus Check
- 145 files · ~257,077 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1005 nodes · 2566 edges · 52 communities (50 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `947c1a03`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- tradeSimulator.ts
- lucide-react
- DocNexusStudio.tsx
- dependencies
- StockTrackerView.tsx
- MarkdownStudio.tsx
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
- SlideDeckStudio.tsx
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- OpenLocalWorkspaceModal.tsx
- backtest/engine.ts
- StockTracker/routes.ts
- BugReportModal.tsx
- DocNexusDocument
- express
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- DocNexus/types.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- StockTracker/manifest.json
- _utils.ts
- PluginEngine
- auth.ts
- scripts
- TerminalLog
- vite
- getPrismaClient
- server.ts
- scannerEngine.ts
- WorkspaceLayout
- dotenv
- ManageBugReportsView.tsx
- vercel.json
- StockAnalyzer/index.ts
- StorageVaultView.tsx
- technicalindicators
- storageUtils.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 64 edges
2. `registerRoutes()` - 44 edges
3. `lucide-react` - 39 edges
4. `TerminalLog` - 36 edges
5. `getPrismaClient()` - 35 edges
6. `startServer()` - 34 edges
7. `registerRoutes()` - 30 edges
8. `AccountingStorage` - 27 edges
9. `loadTenantData()` - 23 edges
10. `runEODSimulation()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `main()` --calls--> `getPrismaClient()`  [EXTRACTED]
  scripts/setup-simulation-table.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (52 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): AccountingView(), AccountingViewProps, CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "tradeSimulator.ts"
Cohesion: 0.19
Nodes (18): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+10 more)

### Community 2 - "lucide-react"
Cohesion: 0.09
Nodes (34): AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, FlowDesignerView(), FlowDesignerViewProps, initialNodes (+26 more)

### Community 3 - "DocNexusStudio.tsx"
Cohesion: 0.23
Nodes (10): FORMAT_TABS, INITIAL_DOCS, DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps, FORMAT_ICONS, TemplateLibraryModal(), TemplateLibraryModalProps (+2 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, google-auth-library@^10.9.0, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1 (+23 more)

### Community 5 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (58): lightweight-charts@^5.2.1, lightweight-charts, StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps (+50 more)

### Community 6 - "MarkdownStudio.tsx"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 7 - "clientRegistry.ts"
Cohesion: 0.09
Nodes (30): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, getValidatedUserEmail(), registerRoutes() (+22 more)

### Community 8 - "startServer"
Cohesion: 0.19
Nodes (13): hashPassword(), seedDatabase(), startServer(), errorHandler(), notFoundHandler(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "App.tsx"
Cohesion: 0.12
Nodes (25): react-router-dom@^7.15.1, react, @react-oauth/google, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS (+17 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.14
Nodes (21): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+13 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), RichDocStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 15 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.21
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 22 - "backtest/engine.ts"
Cohesion: 0.20
Nodes (18): fetchHistoricalBacktestBars(), runBacktest(), yf, calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint (+10 more)

### Community 23 - "StockTracker/routes.ts"
Cohesion: 0.16
Nodes (26): express, authenticateToken(), prisma, PluginManifest, searchStocks(), analyzeStockSentiment(), testGeminiApiKey(), loadWatchlistsFromDisk() (+18 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.19
Nodes (12): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal() (+4 more)

### Community 26 - "express"
Cohesion: 0.20
Nodes (6): authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter, securityHeaders()

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
Cohesion: 0.15
Nodes (15): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+7 more)

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

### Community 35 - "_utils.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 37 - "auth.ts"
Cohesion: 0.20
Nodes (8): generateToken(), SECRET_KEY, verifyToken(), main(), AuthenticatedRequest, AuthenticatedUser, optionalAuth(), requireAdmin()

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "TerminalLog"
Cohesion: 0.21
Nodes (10): lucide-react, ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseView(), SYNC_STAGES (+2 more)

### Community 40 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 41 - "getPrismaClient"
Cohesion: 0.29
Nodes (22): getPrismaClient(), appendHistoryReport(), createInitialSimulatorState(), createSimulationInstance(), deleteSimulation(), ensureSimulatorStore(), getEODHistory(), historyKey() (+14 more)

### Community 42 - "server.ts"
Cohesion: 0.10
Nodes (9): handler(), app, defaultPlugins, prisma, startPromise, upload, ContactNotificationPayload, DispatchResult (+1 more)

### Community 43 - "scannerEngine.ts"
Cohesion: 0.14
Nodes (21): StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, StockStrategyMarketplaceProps, calculateSentimentConfluence(), ScannerCandidate, ScannerFilterOptions (+13 more)

### Community 44 - "WorkspaceLayout"
Cohesion: 0.17
Nodes (7): WorkspaceLayout(), BugReportModal(), ErrorBoundary, ManageBugReportsView(), MutedMarkdownProps, MutedMarkdownView(), getClientPluginByName()

### Community 45 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 46 - "ManageBugReportsView.tsx"
Cohesion: 0.29
Nodes (6): BugReportItem, BugReportsStats, ManageBugReportsProps, SEVERITY_COLORS, STATUS_COLORS, STATUS_OPTIONS

### Community 47 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, crons, outputDirectory, rewrites

### Community 48 - "StockAnalyzer/index.ts"
Cohesion: 0.24
Nodes (15): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+7 more)

### Community 49 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 50 - "technicalindicators"
Cohesion: 0.20
Nodes (6): @neondatabase/serverless@^1.1.0, @prisma/adapter-better-sqlite3@^7.8.0, technicalindicators@^3.1.0, @neondatabase/serverless, @prisma/adapter-better-sqlite3, technicalindicators

### Community 51 - "storageUtils.ts"
Cohesion: 0.53
Nodes (5): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `react`, `tradeSimulator.ts`, `lucide-react`, `DocNexusStudio.tsx`, `dependencies`, `StockTrackerView.tsx`, `MarkdownStudio.tsx`, `clientRegistry.ts`, `package.json`, `DocNexusStudio`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `OpenLocalWorkspaceModal.tsx`, `backtest/engine.ts`, `BugReportModal.tsx`, `DocNexusDocument`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `TerminalLog`, `scannerEngine.ts`, `WorkspaceLayout`, `ManageBugReportsView.tsx`, `StorageVaultView.tsx`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.051534225019669554 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `TerminalLog` to `tradeSimulator.ts`, `lucide-react`, `DocNexusStudio.tsx`, `dependencies`, `StockTrackerView.tsx`, `MarkdownStudio.tsx`, `package.json`, `App.tsx`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `OpenLocalWorkspaceModal.tsx`, `backtest/engine.ts`, `BugReportModal.tsx`, `DocNexusDocument`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `scannerEngine.ts`, `ManageBugReportsView.tsx`, `StorageVaultView.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.08859357696567 - nodes in this community are weakly interconnected._
- **Why does `express` connect `StockTracker/routes.ts` to `react`, `dependencies`, `auth.ts`, `clientRegistry.ts`, `startServer`, `package.json`, `server.ts`, `express`, `telemetryService.ts`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._