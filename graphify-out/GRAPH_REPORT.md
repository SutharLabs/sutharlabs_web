# Graph Report - website  (2026-11-05)

## Corpus Check
- 164 files · ~282,983 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1091 nodes · 2729 edges · 61 communities (56 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2f67340a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- StockAnalyzer/index.ts
- lucide-react
- StockTrackerView.tsx
- dependencies
- backtest/engine.ts
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
- SlideDeckStudio.tsx
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- WorkspaceLayout
- StockTracker/manifest.json
- tradeSimulator.ts
- strategies/types.ts
- DocNexusDocument
- AdminAIChatView.tsx
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- serverRegistry.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- ImageStudioView.tsx
- _utils.ts
- startServer
- StorageVaultView.tsx
- scripts
- ManageDatabaseView.tsx
- StockTracker/routes.ts
- DocNexus/types.ts
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- BugReportModal.tsx
- SpeechStudio/routes.ts
- vercel.json
- DocNexus/storage.ts
- ImageStudio/manifest.json
- deploy.sh
- _utils.ts
- rateLimiter.ts
- StockSimulatorPanel.tsx
- vite
- ManageContactInquiriesView.tsx
- PluginEngine
- OpenLocalWorkspaceModal.tsx
- better-sqlite3@^12.10.0
- prisma

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

## Communities (61 total, 5 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "StockAnalyzer/index.ts"
Cohesion: 0.25
Nodes (15): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+7 more)

### Community 2 - "lucide-react"
Cohesion: 0.09
Nodes (28): AccountingViewProps, AdminConsoleProps, SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, DocNexusView(), DocNexusViewProps, FlowDesignerView() (+20 more)

### Community 3 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (57): lightweight-charts@^5.2.1, lightweight-charts, StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps (+49 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, express@^4.21.2, google-auth-library@^10.9.0, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1, pdfjs-dist@^6.4.299, @prisma/adapter-better-sqlite3@^7.8.0 (+17 more)

### Community 5 - "backtest/engine.ts"
Cohesion: 0.23
Nodes (16): fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics (+8 more)

### Community 6 - "MarkdownStudio.tsx"
Cohesion: 0.31
Nodes (7): lucide-react, MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 7 - "clientRegistry.ts"
Cohesion: 0.11
Nodes (16): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, getClientPluginByName(), DocNexusPlugin, manifest, FlowDesignerPlugin (+8 more)

### Community 8 - "storageUtils.ts"
Cohesion: 0.39
Nodes (8): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob(), fetchJsonBlob(), isBlobConfigured(), saveJsonBlob()

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "App.tsx"
Cohesion: 0.11
Nodes (23): @react-oauth/google@^0.13.5, @react-oauth/google, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal() (+15 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.12
Nodes (24): @google/genai@^2.4.0, @google/genai, buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews() (+16 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.20
Nodes (18): colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX(), parseRTF() (+10 more)

### Community 13 - "DocNexusStudio.tsx"
Cohesion: 0.20
Nodes (18): CommandPaletteModal(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, ExportModal(), SpreadsheetStudio(), FORMAT_ICONS, TemplateLibraryModal() (+10 more)

### Community 15 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.22
Nodes (14): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE, inMemoryHistory (+6 more)

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

### Community 21 - "WorkspaceLayout"
Cohesion: 0.16
Nodes (8): WorkspaceLayout(), AdminConsoleView(), BugReportModal(), ErrorBoundary, ManagePortfoliosView(), MutedMarkdownProps, MutedMarkdownView(), UserProfileView()

### Community 22 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "tradeSimulator.ts"
Cohesion: 0.20
Nodes (32): getPrismaClient(), getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS (+24 more)

### Community 24 - "strategies/types.ts"
Cohesion: 0.14
Nodes (21): StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockStrategyMarketplaceProps, MARKET_UNIVERSES, calculateSentimentConfluence(), ScannerCandidate, ScannerFilterOptions (+13 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.23
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument (+2 more)

### Community 26 - "AdminAIChatView.tsx"
Cohesion: 0.13
Nodes (21): AdminAIChatView(), init(), AdminAIChatViewProps, INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth() (+13 more)

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
Cohesion: 0.19
Nodes (13): express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath(), prisma (+5 more)

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
Cohesion: 0.24
Nodes (7): SAMPLE_IMAGES, ImageStudioPlugin, manifest, ImageHistoryItem, ImageUpscalePayload, ImageUpscaleResult, UpscaleEngineType

### Community 35 - "_utils.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 36 - "startServer"
Cohesion: 0.18
Nodes (11): hashPassword(), seedDatabase(), startServer(), errorHandler(), notFoundHandler(), BlobUploadOptions, deleteFromBlob(), listStoredBlobs() (+3 more)

### Community 37 - "StorageVaultView.tsx"
Cohesion: 0.33
Nodes (11): CATEGORIES, StorageVaultView(), StorageVaultViewProps, deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl() (+3 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "ManageDatabaseView.tsx"
Cohesion: 0.16
Nodes (12): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+4 more)

### Community 40 - "StockTracker/routes.ts"
Cohesion: 0.19
Nodes (23): optionalAuth(), PluginManifest, testGeminiApiKey(), loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem (+15 more)

### Community 41 - "DocNexus/types.ts"
Cohesion: 0.18
Nodes (12): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SHEET, SpreadsheetStudioProps, DocNexusMetadata, DocNexusStudioProps, RichDocPage (+4 more)

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (12): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise, upload (+4 more)

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.22
Nodes (9): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, CanvasElement, CanvasSceneState (+1 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 46 - "SpeechStudio/routes.ts"
Cohesion: 0.15
Nodes (17): verifyToken(), createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, getQuotaStatus(), getUserIdentifierAndRole() (+9 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "_utils.ts"
Cohesion: 0.15
Nodes (11): generateToken(), SECRET_KEY, dotenv@^16.4.5, @neondatabase/serverless@^1.1.0, @prisma/adapter-neon@^7.9.1, ws@^8.21.3, dotenv, @neondatabase/serverless (+3 more)

### Community 52 - "rateLimiter.ts"
Cohesion: 0.29
Nodes (5): authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter

### Community 53 - "StockSimulatorPanel.tsx"
Cohesion: 0.27
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 54 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 56 - "ManageContactInquiriesView.tsx"
Cohesion: 0.29
Nodes (6): InquiriesStats, ManageContactInquiriesProps, ManageContactInquiriesView(), PROJECT_TYPE_COLORS, STATUS_OPTIONS, ContactInquiryItem

### Community 58 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 59 - "better-sqlite3@^12.10.0"
Cohesion: 0.33
Nodes (4): better-sqlite3@^12.10.0, @types/ws@^8.18.1, better-sqlite3, @types/ws

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `lucide-react`, `StockTrackerView.tsx`, `dependencies`, `backtest/engine.ts`, `MarkdownStudio.tsx`, `clientRegistry.ts`, `package.json`, `App.tsx`, `DocNexusStudio.tsx`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `WorkspaceLayout`, `strategies/types.ts`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `ImageStudioView.tsx`, `StorageVaultView.tsx`, `ManageDatabaseView.tsx`, `DocNexus/types.ts`, `DocNexus/types.ts`, `BugReportModal.tsx`, `SpeechStudio/routes.ts`, `StockSimulatorPanel.tsx`, `ManageContactInquiriesView.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `MarkdownStudio.tsx` to `lucide-react`, `StockTrackerView.tsx`, `dependencies`, `backtest/engine.ts`, `package.json`, `App.tsx`, `DocNexusStudio.tsx`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `strategies/types.ts`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `ImageStudioView.tsx`, `StorageVaultView.tsx`, `ManageDatabaseView.tsx`, `DocNexus/types.ts`, `DocNexus/types.ts`, `BugReportModal.tsx`, `SpeechStudio/routes.ts`, `StockSimulatorPanel.tsx`, `ManageContactInquiriesView.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.09365079365079365 - nodes in this community are weakly interconnected._
- **Why does `express` connect `serverRegistry.ts` to `react`, `dependencies`, `startServer`, `StockTracker/routes.ts`, `package.json`, `server.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `rateLimiter.ts`, `telemetryService.ts`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `StockTrackerView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059673659673659674 - nodes in this community are weakly interconnected._