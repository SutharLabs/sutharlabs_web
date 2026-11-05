# Graph Report - website  (2026-11-05)

## Corpus Check
- 164 files · ~292,834 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1097 nodes · 2741 edges · 59 communities (54 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f5fe823e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- App.tsx
- TerminalLog
- StockTrackerView.tsx
- dependencies
- tradeSimulator.ts
- MarkdownStudio.tsx
- clientRegistry.ts
- express
- package.json
- StockTracker/routes.ts
- sentimentEngine.ts
- documentParsers.ts
- DocNexusStudio
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- registerRoutes
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- IStrategy
- StockTracker/manifest.json
- getPrismaClient
- api/server.ts
- DocNexusDocument
- AdminAIChatView.tsx
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- startServer
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- ImageStudioView.tsx
- _utils.ts
- serverRegistry.ts
- StorageVaultView.tsx
- scripts
- ManageDatabaseView.tsx
- ManageBugReportsView.tsx
- DocNexus/types.ts
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- BugReportModal.tsx
- DocNexus/storage.ts
- vercel.json
- scannerEngine.ts
- ImageStudio/manifest.json
- deploy.sh
- dotenv
- audioSynth.ts
- yahoo-finance2
- vite
- Accounting/index.ts
- PluginEngine
- OpenLocalWorkspaceModal.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 68 edges
2. `registerRoutes()` - 44 edges
3. `lucide-react` - 43 edges
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

## Communities (59 total, 5 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "App.tsx"
Cohesion: 0.09
Nodes (29): react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP, STORE_TOOLS (+21 more)

### Community 2 - "TerminalLog"
Cohesion: 0.09
Nodes (34): AccountingViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, FlowDesignerView(), FlowDesignerViewProps (+26 more)

### Community 3 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (55): lightweight-charts, StockBacktestPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, Analysis (+47 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, google-auth-library@^10.9.0, @google/genai@^2.4.0, lightweight-charts@^5.2.1, lucide-react@^0.546.0, motion@^12.23.24 (+22 more)

### Community 5 - "tradeSimulator.ts"
Cohesion: 0.18
Nodes (19): StockSimulatorPanelProps, getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS (+11 more)

### Community 6 - "MarkdownStudio.tsx"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 7 - "clientRegistry.ts"
Cohesion: 0.16
Nodes (12): CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, FlowDesignerPlugin, manifest, SpeechStudioPlugin, StockTrackerPlugin (+4 more)

### Community 8 - "express"
Cohesion: 0.20
Nodes (6): authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter, securityHeaders()

### Community 9 - "package.json"
Cohesion: 0.11
Nodes (25): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+17 more)

### Community 10 - "StockTracker/routes.ts"
Cohesion: 0.18
Nodes (20): express, optionalAuth(), PluginManifest, analyzeStockSentiment(), testGeminiApiKey(), loadWatchlistsFromDisk(), saveWatchlistsToDisk(), SEED_WATCHLISTS (+12 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.14
Nodes (21): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+13 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.20
Nodes (18): colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX(), parseRTF() (+10 more)

### Community 13 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), SpreadsheetStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 15 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "registerRoutes"
Cohesion: 0.22
Nodes (23): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+15 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.20
Nodes (14): lucide-react, ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage() (+6 more)

### Community 21 - "IStrategy"
Cohesion: 0.25
Nodes (13): fetchHistoricalBacktestBars(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics, BacktestReport, BacktestRequest, ExecutionFillModel (+5 more)

### Community 22 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "getPrismaClient"
Cohesion: 0.17
Nodes (30): getPrismaClient(), appendHistoryReport(), createInitialSimulatorState(), createSimulationInstance(), deleteSimulation(), ensureSimulatorStore(), getEODHistory(), getEODPortfolio() (+22 more)

### Community 24 - "api/server.ts"
Cohesion: 0.29
Nodes (7): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, @vercel/node@^5.9.7, @vercel/node, app, startPromise

### Community 25 - "DocNexusDocument"
Cohesion: 0.19
Nodes (12): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal() (+4 more)

### Community 26 - "AdminAIChatView.tsx"
Cohesion: 0.20
Nodes (14): AdminAIChatView(), init(), AdminAIChatViewProps, INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth() (+6 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "startServer"
Cohesion: 0.20
Nodes (10): hashPassword(), seedDatabase(), startServer(), errorHandler(), notFoundHandler(), BlobUploadOptions, deleteFromBlob(), listStoredBlobs() (+2 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "ImageStudioView.tsx"
Cohesion: 0.23
Nodes (8): ImageStudioView(), SAMPLE_IMAGES, ImageStudioPlugin, manifest, ImageHistoryItem, ImageUpscalePayload, ImageUpscaleResult, UpscaleEngineType

### Community 35 - "_utils.ts"
Cohesion: 0.12
Nodes (17): generateToken(), SECRET_KEY, @neondatabase/serverless@^1.1.0, pg@^8.23.0, @prisma/adapter-neon@^7.9.1, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, ws@^8.21.3 (+9 more)

### Community 36 - "serverRegistry.ts"
Cohesion: 0.39
Nodes (4): registerRoutes(), processImageUpscale(), SERVER_PLUGIN_ENTRIES, manifest

### Community 37 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "ManageDatabaseView.tsx"
Cohesion: 0.18
Nodes (11): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+3 more)

### Community 40 - "ManageBugReportsView.tsx"
Cohesion: 0.25
Nodes (7): BugReportItem, BugReportsStats, ManageBugReportsProps, ManageBugReportsView(), SEVERITY_COLORS, STATUS_COLORS, STATUS_OPTIONS

### Community 41 - "DocNexus/types.ts"
Cohesion: 0.13
Nodes (17): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET (+9 more)

### Community 42 - "server.ts"
Cohesion: 0.11
Nodes (6): defaultPlugins, prisma, upload, ContactNotificationPayload, DispatchResult, notifyAdminNewInquiry()

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.15
Nodes (16): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, FORMAT_TABS, INITIAL_DOCS, InspectorPanel(), InspectorPanelProps (+8 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "BugReportModal.tsx"
Cohesion: 0.13
Nodes (13): BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot (+5 more)

### Community 46 - "DocNexus/storage.ts"
Cohesion: 0.07
Nodes (44): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), requireAdmin(), getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments() (+36 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "scannerEngine.ts"
Cohesion: 0.13
Nodes (22): StockBacktestPanelProps, StockScannerPanel(), StockScannerPanelProps, UNIVERSE_OPTIONS, StockStrategyMarketplaceProps, calculateSentimentConfluence(), dispatchWebhookAlert(), ScannerCandidate (+14 more)

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "dotenv"
Cohesion: 0.29
Nodes (5): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma, main()

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "yahoo-finance2"
Cohesion: 0.33
Nodes (4): react-dom@^19.0.1, yahoo-finance2@^3.14.1, react-dom, yahoo-finance2

### Community 54 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 58 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.tsx`, `TerminalLog`, `StockTrackerView.tsx`, `dependencies`, `tradeSimulator.ts`, `MarkdownStudio.tsx`, `clientRegistry.ts`, `package.json`, `DocNexusStudio`, `LandingPage.tsx`, `IStrategy`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `ImageStudioView.tsx`, `StorageVaultView.tsx`, `ManageDatabaseView.tsx`, `ManageBugReportsView.tsx`, `DocNexus/types.ts`, `DocNexus/types.ts`, `BugReportModal.tsx`, `DocNexus/storage.ts`, `scannerEngine.ts`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.241) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `LandingPage.tsx` to `App.tsx`, `TerminalLog`, `StockTrackerView.tsx`, `dependencies`, `tradeSimulator.ts`, `MarkdownStudio.tsx`, `package.json`, `IStrategy`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `ImageStudioView.tsx`, `StorageVaultView.tsx`, `ManageDatabaseView.tsx`, `ManageBugReportsView.tsx`, `DocNexus/types.ts`, `DocNexus/types.ts`, `BugReportModal.tsx`, `DocNexus/storage.ts`, `scannerEngine.ts`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09388335704125178 - nodes in this community are weakly interconnected._
- **Why does `express` connect `StockTracker/routes.ts` to `react`, `dependencies`, `serverRegistry.ts`, `express`, `package.json`, `server.ts`, `DocNexus/storage.ts`, `telemetryService.ts`, `startServer`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.08826945412311266 - nodes in this community are weakly interconnected._