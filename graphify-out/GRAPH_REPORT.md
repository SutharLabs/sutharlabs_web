# Graph Report - website  (2026-11-06)

## Corpus Check
- 199 files · ~403,274 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1336 nodes · 3152 edges · 83 communities (70 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10066ac8`
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
- tradeSimulator.ts
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
- scannerEngine.ts
- ManageDatabaseView.tsx
- telemetryService.ts
- LandingPage.tsx
- Accounting/routes.ts
- backtest/engine.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- DocNexusStudio
- _utils.ts
- DocNexus/storage.ts
- PdfToolsStudio.tsx
- scripts
- serverRegistry.ts
- DocNexusStudio.tsx
- formatINR
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- dotenv
- SpeechStudioView.tsx
- vercel.json
- StockTrackerView
- ImageStudio/manifest.json
- deploy.sh
- rateLimiter.ts
- audioSynth.ts
- tools/types.ts
- Accounting/types.ts
- ResumeStudio/manifest.json
- WorkspacePluginStore.tsx
- fetcher.ts
- BusinessCardScannerTool.tsx
- deploy-production.ts
- SlideDeckStudio.tsx
- StorageVaultView.tsx
- lucide-react
- exchangeCalendar.ts
- OpenLocalWorkspaceModal.tsx
- ref_fs
- PluginEngine
- ResumeEngine.tsx
- strategies/types.ts
- pdfjs-dist
- @prisma/adapter-better-sqlite3@^7.8.0
- qrcode
- storageUtils.ts
- motion@^12.23.24
- SpreadsheetStudio.tsx
- ref_path
- pg
- @react-oauth/google
- @types/qrcode@^1.5.6
- @vercel/blob
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
- `startServer()` --calls--> `PluginEngine`  [EXTRACTED]
  server.ts → src/plugins/PluginEngine.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (83 total, 13 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.18
Nodes (10): InvoiceAnalyticsChartProps, TaxInvoiceModalProps, registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail() (+2 more)

### Community 1 - "clientRegistry.ts"
Cohesion: 0.05
Nodes (42): FlowDesignerView(), FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode, WorkflowTemplate, AccountingPlugin (+34 more)

### Community 2 - "src/types.ts"
Cohesion: 0.08
Nodes (33): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView() (+25 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.14
Nodes (24): lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner(), calculateSupertrend() (+16 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, google-auth-library@^10.9.0, @google/genai@^2.4.0, jszip@^3.10.2, lightweight-charts@^5.2.1, lucide-react@^0.546.0, multer@^2.1.1, @neondatabase/serverless@^1.1.0 (+22 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (18): KNOWN_US_TICKERS, loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+10 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.19
Nodes (29): getPrismaClient(), main(), executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), appendHistoryReport(), createInitialSimulatorState() (+21 more)

### Community 8 - "App.tsx"
Cohesion: 0.11
Nodes (24): react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP, STORE_TOOLS (+16 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.21
Nodes (11): analyzeAutonomousFallback(), analyzeStockSentiment(), BEARISH_LEXICON, BULLISH_LEXICON, detectCatalyst(), SENTIMENT_CACHE, SentimentCacheEntry, HeadlineSentimentAnalysis (+3 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "AccountingView.tsx"
Cohesion: 0.16
Nodes (20): CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, OcrReceiptModal() (+12 more)

### Community 15 - "_utils.ts"
Cohesion: 0.18
Nodes (13): generateToken(), SECRET_KEY, IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey() (+5 more)

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
Cohesion: 0.21
Nodes (13): hashPassword(), seedDatabase(), startServer(), loadSystemSettings(), saveSystemSettings(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (18): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+10 more)

### Community 24 - "UserProfileView.tsx"
Cohesion: 0.13
Nodes (13): BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot (+5 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.18
Nodes (19): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+11 more)

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.18
Nodes (11): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+3 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "LandingPage.tsx"
Cohesion: 0.13
Nodes (18): AuthPage(), AuthPageProps, ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails() (+10 more)

### Community 29 - "Accounting/routes.ts"
Cohesion: 0.25
Nodes (8): CompanySettingsModal(), CompanySettingsModalProps, PartyMasterView(), PartyMasterViewProps, COMMON_HSN_SAC_CATALOG, INDIAN_GST_STATES, validateGSTIN(), getUserEmail()

### Community 30 - "backtest/engine.ts"
Cohesion: 0.14
Nodes (25): StockBacktestPanel(), StockBacktestPanelProps, fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams (+17 more)

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
Nodes (11): DocNexusView(), DocNexusViewProps, CanvasStudio(), DocNexusStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 35 - "_utils.ts"
Cohesion: 0.25
Nodes (8): AuthenticatedRequest, AuthenticatedUser, authenticateToken(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath(), prisma, registerRoutes()

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 37 - "PdfToolsStudio.tsx"
Cohesion: 0.16
Nodes (17): PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool(), PdfEditorTool(), PdfToImageTool() (+9 more)

### Community 38 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, clean, db:cron-sync, deploy, deploy:ps, deploy:quick, dev (+5 more)

### Community 39 - "serverRegistry.ts"
Cohesion: 0.33
Nodes (6): manifest, MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES

### Community 40 - "DocNexusStudio.tsx"
Cohesion: 0.16
Nodes (16): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, FORMAT_TABS (+8 more)

### Community 41 - "formatINR"
Cohesion: 0.16
Nodes (22): react, AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView() (+14 more)

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (11): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise, upload (+3 more)

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.16
Nodes (14): CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps (+6 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.11
Nodes (34): verifyToken(), optionalAuth(), audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES (+26 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "StockTrackerView"
Cohesion: 0.21
Nodes (11): StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, createWatchlistItem(), formatRelativeTime() (+3 more)

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "rateLimiter.ts"
Cohesion: 0.15
Nodes (10): express@^4.21.2, express, errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord (+2 more)

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "tools/types.ts"
Cohesion: 0.16
Nodes (10): Base64Tool(), HashGeneratorTool(), JsonConverterTool(), QrGeneratorTool(), TextDiffTool(), SubToolProps, ToolCategory, ToolMeta (+2 more)

### Community 54 - "Accounting/types.ts"
Cohesion: 0.10
Nodes (27): FinancialStatementsViewProps, generateEInvoiceIRN(), generateSignedQrPayload(), sha256Sync(), STATE_CODE_MAP, buildGSTInvoiceObject(), DEFAULT_COMPANY, DEFAULT_ITEMS (+19 more)

### Community 56 - "ResumeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 57 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 58 - "fetcher.ts"
Cohesion: 0.30
Nodes (11): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+3 more)

### Community 59 - "BusinessCardScannerTool.tsx"
Cohesion: 0.22
Nodes (7): tesseract.js@^7.0.0, tesseract.js, BusinessCardContact, BusinessCardScannerTool(), MultilingualOcrTool(), CsvReceiptRow, ReceiptToCsvTool()

### Community 60 - "deploy-production.ts"
Cohesion: 0.18
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 62 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 63 - "lucide-react"
Cohesion: 0.31
Nodes (7): lucide-react, MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 64 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 65 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.31
Nodes (7): ExportModal(), ExportModalProps, OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, DocNexusDocument, readDirectoryHandleRecursively(), walk()

### Community 66 - "ref_fs"
Cohesion: 0.29
Nodes (4): defaultPlugins, hashPassword(), seed(), PluginManifest

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.16
Nodes (18): jszip, FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, extractContactDetails(), parseDocx() (+10 more)

### Community 70 - "strategies/types.ts"
Cohesion: 0.16
Nodes (18): StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, StockStrategyMarketplaceProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions (+10 more)

### Community 71 - "pdfjs-dist"
Cohesion: 0.14
Nodes (8): better-sqlite3@^12.10.0, pdfjs-dist@^6.4.299, @prisma/adapter-neon@^7.9.1, @prisma/client@^7.8.0, better-sqlite3, pdfjs-dist, @prisma/adapter-neon, @prisma/client

### Community 74 - "storageUtils.ts"
Cohesion: 0.53
Nodes (5): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob()

### Community 76 - "SpreadsheetStudio.tsx"
Cohesion: 0.50
Nodes (3): DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps

### Community 77 - "ref_path"
Cohesion: 0.22
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `formatINR` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `package.json`, `patterns/types.ts`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `UserProfileView.tsx`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `Accounting/routes.ts`, `backtest/engine.ts`, `DocNexusStudio`, `PdfToolsStudio.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `StockTrackerView`, `tools/types.ts`, `Accounting/types.ts`, `WorkspacePluginStore.tsx`, `BusinessCardScannerTool.tsx`, `SlideDeckStudio.tsx`, `StorageVaultView.tsx`, `lucide-react`, `OpenLocalWorkspaceModal.tsx`, `ResumeEngine.tsx`, `strategies/types.ts`, `SpreadsheetStudio.tsx`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `clientRegistry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050203527815468114 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `package.json`, `patterns/types.ts`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `UserProfileView.tsx`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `PdfToolsStudio.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `StockTrackerView`, `tools/types.ts`, `WorkspacePluginStore.tsx`, `BusinessCardScannerTool.tsx`, `SlideDeckStudio.tsx`, `StorageVaultView.tsx`, `OpenLocalWorkspaceModal.tsx`, `ResumeEngine.tsx`, `strategies/types.ts`, `SpreadsheetStudio.tsx`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08205128205128205 - nodes in this community are weakly interconnected._
- **Why does `express` connect `rateLimiter.ts` to `ref_fs`, `_utils.ts`, `DocNexus/storage.ts`, `StockTracker/routes.ts`, `serverRegistry.ts`, `package.json`, `server.ts`, `SpeechStudioView.tsx`, `telemetryService.ts`, `Accounting/routes.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13763440860215054 - nodes in this community are weakly interconnected._