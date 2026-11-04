# Graph Report - website  (2026-11-04)

## Corpus Check
- 152 files · ~268,123 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1042 nodes · 2650 edges · 51 communities (49 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bce0b0a7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- StockSimulatorPanel.tsx
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
- _utils.ts
- backtest/engine.ts
- tradeSimulator.ts
- BugReportModal.tsx
- DocNexusDocument
- AdminAIChatView.tsx
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
- StockTracker/routes.ts
- scripts
- TerminalLog
- vite
- DocNexus/storage.ts
- server.ts
- scannerEngine.ts
- StockAnalyzer/index.ts
- dotenv
- storageUtils.ts
- vercel.json
- rateLimiter.ts
- StorageVaultView.tsx
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
- `main()` --calls--> `getPrismaClient()`  [EXTRACTED]
  scripts/setup-simulation-table.ts → api/_utils.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (51 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (81): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+73 more)

### Community 1 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (8): PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate, SimulationRegistryEntry

### Community 2 - "lucide-react"
Cohesion: 0.08
Nodes (39): lucide-react, WorkspaceLayout(), AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer() (+31 more)

### Community 3 - "DocNexusStudio.tsx"
Cohesion: 0.23
Nodes (10): FORMAT_TABS, INITIAL_DOCS, DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps, FORMAT_ICONS, TemplateLibraryModal(), TemplateLibraryModalProps (+2 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, google-auth-library@^10.9.0, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1 (+23 more)

### Community 5 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (59): lightweight-charts@^5.2.1, lightweight-charts, StockBacktestPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps (+51 more)

### Community 6 - "MarkdownStudio.tsx"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 7 - "clientRegistry.ts"
Cohesion: 0.09
Nodes (21): FlowDesignerView(), AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, FlowDesignerPlugin (+13 more)

### Community 8 - "startServer"
Cohesion: 0.19
Nodes (13): hashPassword(), seedDatabase(), startServer(), errorHandler(), notFoundHandler(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "App.tsx"
Cohesion: 0.10
Nodes (26): @react-oauth/google@^0.13.5, @react-oauth/google, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal() (+18 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.14
Nodes (21): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+13 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, CanvasStudio(), DocNexusStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 15 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.13
Nodes (21): @neondatabase/serverless@^1.1.0, @prisma/adapter-neon@^7.9.1, ws@^8.21.3, @neondatabase/serverless, @prisma/adapter-neon, ws, runCronSync(), DatabaseSyncHistoryEntry (+13 more)

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

### Community 21 - "_utils.ts"
Cohesion: 0.11
Nodes (21): generateToken(), SECRET_KEY, verifyToken(), express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth() (+13 more)

### Community 22 - "backtest/engine.ts"
Cohesion: 0.20
Nodes (18): fetchHistoricalBacktestBars(), runBacktest(), yf, calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint (+10 more)

### Community 23 - "tradeSimulator.ts"
Cohesion: 0.21
Nodes (31): getPrismaClient(), getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS (+23 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.13
Nodes (13): BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot (+5 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.19
Nodes (12): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal() (+4 more)

### Community 26 - "AdminAIChatView.tsx"
Cohesion: 0.17
Nodes (18): AdminAIChatView(), init(), INITIAL_PROMPTS, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels(), OllamaModelTag, streamAIChat() (+10 more)

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
Nodes (14): CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps (+6 more)

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

### Community 37 - "StockTracker/routes.ts"
Cohesion: 0.24
Nodes (22): analyzeStockSentiment(), testGeminiApiKey(), loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord (+14 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "TerminalLog"
Cohesion: 0.18
Nodes (11): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+3 more)

### Community 40 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 41 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 42 - "server.ts"
Cohesion: 0.10
Nodes (9): handler(), app, defaultPlugins, prisma, startPromise, upload, ContactNotificationPayload, DispatchResult (+1 more)

### Community 43 - "scannerEngine.ts"
Cohesion: 0.15
Nodes (19): StockBacktestPanelProps, StockScannerPanel(), StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, MARKET_UNIVERSES, calculateSentimentConfluence(), ScannerCandidate (+11 more)

### Community 44 - "StockAnalyzer/index.ts"
Cohesion: 0.25
Nodes (15): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+7 more)

### Community 45 - "dotenv"
Cohesion: 0.29
Nodes (5): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma, main()

### Community 46 - "storageUtils.ts"
Cohesion: 0.29
Nodes (6): PluginManifest, deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob()

### Community 47 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, crons, outputDirectory, rewrites

### Community 48 - "rateLimiter.ts"
Cohesion: 0.20
Nodes (6): authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter, securityHeaders()

### Community 49 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 50 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `StockSimulatorPanel.tsx`, `lucide-react`, `DocNexusStudio.tsx`, `dependencies`, `StockTrackerView.tsx`, `MarkdownStudio.tsx`, `clientRegistry.ts`, `package.json`, `App.tsx`, `DocNexusStudio`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `BugReportModal.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `TerminalLog`, `scannerEngine.ts`, `StorageVaultView.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.053515783769136974 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `StockSimulatorPanel.tsx`, `DocNexusStudio.tsx`, `dependencies`, `StockTrackerView.tsx`, `MarkdownStudio.tsx`, `clientRegistry.ts`, `package.json`, `App.tsx`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `BugReportModal.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `TerminalLog`, `scannerEngine.ts`, `StorageVaultView.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.0786308973172988 - nodes in this community are weakly interconnected._
- **Why does `express` connect `_utils.ts` to `dependencies`, `StockTracker/routes.ts`, `startServer`, `package.json`, `server.ts`, `DocNexus/storage.ts`, `storageUtils.ts`, `rateLimiter.ts`, `telemetryService.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._