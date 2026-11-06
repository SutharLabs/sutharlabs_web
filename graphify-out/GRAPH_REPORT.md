# Graph Report - website  (2026-11-06)

## Corpus Check
- 197 files · ~399,443 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1310 nodes · 3117 edges · 79 communities (63 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30594d9c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- clientRegistry.ts
- src/types.ts
- indicatorEngine.ts
- dependencies
- StockTracker/routes.ts
- SovereignTools/manifest.json
- ImageStudioView.tsx
- App.tsx
- package.json
- patterns/types.ts
- sentimentEngine.ts
- documentParsers.ts
- AccountingView.tsx
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- AdminAIChatView.tsx
- getPrismaClient
- compilerOptions
- StockTracker/manifest.json
- startServer
- Accounting/manifest.json
- StockTrackerView.tsx
- UserProfileView.tsx
- DocNexusStudio.tsx
- ManageDatabaseView.tsx
- telemetryService.ts
- LandingPage.tsx
- Accounting/storage.ts
- backtest/engine.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- DocNexusStudio
- seed.ts
- DocNexus/storage.ts
- react
- scripts
- serverRegistry.ts
- vite
- formatINR
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- dotenv
- SpeechStudioView.tsx
- vercel.json
- StockStrategyMarketplace.tsx
- ImageStudio/manifest.json
- deploy.sh
- rateLimiter.ts
- audioSynth.ts
- strategies/types.ts
- Accounting/types.ts
- ResumeStudio/manifest.json
- WorkspacePluginStore.tsx
- strategies/engine.ts
- ImageStudio/index.ts
- @types/qrcode@^1.5.6
- DocNexus/types.ts
- StorageVaultView.tsx
- DocNexus/index.ts
- FlowDesigner/index.ts
- OpenLocalWorkspaceModal.tsx
- StockTracker/index.ts
- ref_fs
- pdf-lib
- ResumeEngine.tsx
- StockSimulatorPanel.tsx
- pdfjs-dist
- @prisma/adapter-better-sqlite3@^7.8.0
- multer
- @types/jszip@^3.4.0
- @types/ws@^8.18.1
- @vercel/blob
- @vitejs/plugin-react
- ws

## God Nodes (most connected - your core abstractions)
1. `react` - 85 edges
2. `lucide-react` - 61 edges
3. `TerminalLog` - 42 edges
4. `startServer()` - 37 edges
5. `getPrismaClient()` - 37 edges
6. `registerRoutes()` - 30 edges
7. `AccountingStorage` - 27 edges
8. `registerRoutes()` - 27 edges
9. `PdfToolsStudio()` - 25 edges
10. `loadTenantData()` - 23 edges

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

## Communities (79 total, 16 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "clientRegistry.ts"
Cohesion: 0.17
Nodes (11): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, ResumeStudioPlugin, manifest, ToolsStudioPlugin, manifest (+3 more)

### Community 2 - "src/types.ts"
Cohesion: 0.08
Nodes (34): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView() (+26 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, @google/genai@^2.4.0, jszip@^3.10.2, lucide-react@^0.546.0, motion@^12.23.24, @neondatabase/serverless@^1.1.0 (+17 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.05
Nodes (83): getPrismaClient(), AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion() (+75 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 8 - "App.tsx"
Cohesion: 0.08
Nodes (31): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+23 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.13
Nodes (22): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+14 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.20
Nodes (18): colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX(), parseRTF() (+10 more)

### Community 13 - "AccountingView.tsx"
Cohesion: 0.14
Nodes (24): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawerProps, DraftLineItem, DayBookViewProps, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem (+16 more)

### Community 15 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "AdminAIChatView.tsx"
Cohesion: 0.12
Nodes (25): AdminAIChatView(), init(), INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels() (+17 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "startServer"
Cohesion: 0.22
Nodes (10): hashPassword(), seedDatabase(), startServer(), loadSystemSettings(), saveSystemSettings(), BlobUploadOptions, deleteFromBlob(), listStoredBlobs() (+2 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (18): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+10 more)

### Community 24 - "UserProfileView.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 25 - "DocNexusStudio.tsx"
Cohesion: 0.15
Nodes (18): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, FORMAT_TABS (+10 more)

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.11
Nodes (16): ConfirmModal(), ModalVariant, FlowDesignerView(), FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode (+8 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 29 - "Accounting/storage.ts"
Cohesion: 0.13
Nodes (23): CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), COMMON_HSN_SAC_CATALOG, determineSupplyType(), generateEInvoiceIRN() (+15 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.23
Nodes (16): fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics (+8 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), SlideDeckStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 35 - "seed.ts"
Cohesion: 0.14
Nodes (14): generateToken(), SECRET_KEY, dotenv@^16.4.5, pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, dotenv, pg (+6 more)

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.14
Nodes (26): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), getValidatedUserEmail(), registerRoutes() (+18 more)

### Community 37 - "react"
Cohesion: 0.07
Nodes (44): lucide-react, react, tesseract.js, ConfirmModalProps, PublicToolsHubView(), PublicToolsHubViewProps, ToolCategory, MarkdownStudio() (+36 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "serverRegistry.ts"
Cohesion: 0.27
Nodes (7): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, SpeechStudioPlugin, manifest

### Community 40 - "vite"
Cohesion: 0.67
Nodes (3): vite@^6.2.3, vite@^6.2.3, vite

### Community 41 - "formatINR"
Cohesion: 0.17
Nodes (17): AccountingView(), DayBookView(), FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView(), GstrReportsViewProps, InvoiceAnalyticsChart() (+9 more)

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (11): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise, upload (+3 more)

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.22
Nodes (9): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, CanvasElement, CanvasSceneState (+1 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.12
Nodes (31): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, SpeechStudioView() (+23 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "StockStrategyMarketplace.tsx"
Cohesion: 0.27
Nodes (10): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), createWatchlistItem(), formatRelativeTime(), formatTickerDisplay() (+2 more)

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "rateLimiter.ts"
Cohesion: 0.15
Nodes (10): express@^4.21.2, express, errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord (+2 more)

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "strategies/types.ts"
Cohesion: 0.19
Nodes (12): StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockStrategyMarketplaceProps, StockTrackerAlertModalProps, StockTrackerAlertState, PRESET_STRATEGIES, IStrategy (+4 more)

### Community 54 - "Accounting/types.ts"
Cohesion: 0.15
Nodes (15): FinancialStatementsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport, BankReconciliationItem, BankReconciliationReport, GSTR3BSummary (+7 more)

### Community 56 - "ResumeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 57 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 58 - "strategies/engine.ts"
Cohesion: 0.38
Nodes (6): calculateSentimentConfluence(), calculateSupertrend(), CandleData, evaluateStrategy(), QuoteData, StrategySignal

### Community 59 - "ImageStudio/index.ts"
Cohesion: 0.50
Nodes (3): ImageStudioView(), ImageStudioPlugin, manifest

### Community 61 - "DocNexus/types.ts"
Cohesion: 0.13
Nodes (17): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET, SpreadsheetStudio() (+9 more)

### Community 62 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 65 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 67 - "ref_fs"
Cohesion: 0.18
Nodes (4): @tailwindcss/vite@^4.1.14, @tailwindcss/vite, PluginEngine, PluginManifest

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.14
Nodes (20): jszip, FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView(), ResumeStudioViewProps (+12 more)

### Community 70 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 73 - "multer"
Cohesion: 0.20
Nodes (6): multer@^2.1.1, qrcode@^1.5.4, @types/pg@^8.21.0, multer, qrcode, @types/pg

## Knowledge Gaps
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `ImageStudioView.tsx`, `App.tsx`, `package.json`, `patterns/types.ts`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `UserProfileView.tsx`, `DocNexusStudio.tsx`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `DocNexusStudio`, `formatINR`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `strategies/types.ts`, `Accounting/types.ts`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `OpenLocalWorkspaceModal.tsx`, `ResumeEngine.tsx`, `StockSimulatorPanel.tsx`?**
  _High betweenness centrality (0.232) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07926829268292683 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `ImageStudioView.tsx`, `App.tsx`, `package.json`, `patterns/types.ts`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `UserProfileView.tsx`, `DocNexusStudio.tsx`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `strategies/types.ts`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `OpenLocalWorkspaceModal.tsx`, `ResumeEngine.tsx`, `StockSimulatorPanel.tsx`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `express` connect `rateLimiter.ts` to `ref_fs`, `DocNexus/storage.ts`, `StockTracker/routes.ts`, `serverRegistry.ts`, `package.json`, `server.ts`, `SpeechStudioView.tsx`, `telemetryService.ts`, `Accounting/storage.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._