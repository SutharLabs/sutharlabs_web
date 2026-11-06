# Graph Report - website  (2026-11-06)

## Corpus Check
- 186 files · ~379,674 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1246 nodes · 3013 edges · 79 communities (65 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d15ffdc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- App.tsx
- TerminalLog
- indicatorEngine.ts
- dependencies
- StockTracker/routes.ts
- react-dom
- clientRegistry.ts
- tradeSimulator.ts
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
- LandingPage.tsx
- startServer
- Accounting/manifest.json
- StockTrackerView.tsx
- BugReportModal.tsx
- DocNexusStudio.tsx
- ManageDatabaseView.tsx
- telemetryService.ts
- StockAnalyzer/index.ts
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
- auth.ts
- vite
- formatINR
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- dotenv
- SpeechStudioView.tsx
- vercel.json
- MarkdownStudio.tsx
- ImageStudio/manifest.json
- deploy.sh
- serverRegistry.ts
- audioSynth.ts
- strategies/types.ts
- Accounting/types.ts
- strategies/types.ts
- WorkspacePluginStore.tsx
- tradeSimulator.ts
- ImageStudioView.tsx
- motion@^12.23.24
- DocNexus/types.ts
- StorageVaultView.tsx
- storageUtils.ts
- api/server.ts
- OpenLocalWorkspaceModal.tsx
- DocNexusDocument
- PluginEngine
- CookieConsentBanner.tsx
- main.tsx
- pdfjs-dist
- backgroundWorker.ts
- UserProfileView.tsx
- Accounting/index.ts
- DocNexus/index.ts
- StockTracker/index.ts
- @google/genai
- @types/jszip@^3.4.0
- @vercel/blob

## God Nodes (most connected - your core abstractions)
1. `react` - 81 edges
2. `lucide-react` - 57 edges
3. `TerminalLog` - 38 edges
4. `getPrismaClient()` - 37 edges
5. `startServer()` - 36 edges
6. `registerRoutes()` - 30 edges
7. `AccountingStorage` - 27 edges
8. `registerRoutes()` - 27 edges
9. `loadTenantData()` - 23 edges
10. `PdfToolsStudio()` - 22 edges

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

## Communities (79 total, 14 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "App.tsx"
Cohesion: 0.15
Nodes (13): ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP, STORE_TOOLS, URL_TO_TAB (+5 more)

### Community 2 - "TerminalLog"
Cohesion: 0.07
Nodes (39): AccountingViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, DocNexusView(), DocNexusViewProps (+31 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, google-auth-library@^10.9.0, jszip@^3.10.2, lucide-react@^0.546.0, multer@^2.1.1, @neondatabase/serverless@^1.1.0 (+23 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview(), createStrategy() (+9 more)

### Community 7 - "clientRegistry.ts"
Cohesion: 0.16
Nodes (13): WorkspaceLayout(), CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, getClientPluginById(), getClientPluginByName(), getClientPluginByRoute(), FlowDesignerPlugin, manifest (+5 more)

### Community 8 - "tradeSimulator.ts"
Cohesion: 0.28
Nodes (22): getPrismaClient(), appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteSimulation(), ensureSimulatorStore(), getEODHistory() (+14 more)

### Community 9 - "package.json"
Cohesion: 0.11
Nodes (25): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+17 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.24
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
Cohesion: 0.18
Nodes (17): AdminAIChatView(), init(), AdminAIChatViewProps, INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth() (+9 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "startServer"
Cohesion: 0.19
Nodes (13): hashPassword(), seedDatabase(), startServer(), errorHandler(), notFoundHandler(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.09
Nodes (20): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+12 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (27): StockBacktestPanel(), StockSimulatorPanel(), Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, createWatchlistItem(), DEFAULT_CANDLE_FOR_SCALE (+19 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 25 - "DocNexusStudio.tsx"
Cohesion: 0.31
Nodes (8): FORMAT_TABS, INITIAL_DOCS, FORMAT_ICONS, TemplateLibraryModal(), TemplateLibraryModalProps, BUILT_IN_TEMPLATES, DocNexusStudioProps, DocTemplate

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.12
Nodes (17): ConfirmModal(), ConfirmModalProps, ModalVariant, FlowDesignerView(), FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection (+9 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "StockAnalyzer/index.ts"
Cohesion: 0.23
Nodes (16): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+8 more)

### Community 29 - "Accounting/storage.ts"
Cohesion: 0.13
Nodes (23): CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), COMMON_HSN_SAC_CATALOG, determineSupplyType(), generateEInvoiceIRN() (+15 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.21
Nodes (18): StockBacktestPanelProps, fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint (+10 more)

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
Cohesion: 0.28
Nodes (12): CommandPaletteModal(), DocNexusStudio(), ExportModal(), RichDocStudio(), SpreadsheetStudio(), clearVault(), getVaultDbName(), getVaultStorageKey() (+4 more)

### Community 35 - "seed.ts"
Cohesion: 0.14
Nodes (14): generateToken(), SECRET_KEY, dotenv@^16.4.5, pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, dotenv, pg (+6 more)

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 37 - "react"
Cohesion: 0.11
Nodes (32): lucide-react, react, tesseract.js, PublicToolsHubViewProps, CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool() (+24 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "auth.ts"
Cohesion: 0.23
Nodes (10): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath() (+2 more)

### Community 40 - "vite"
Cohesion: 0.22
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 41 - "formatINR"
Cohesion: 0.17
Nodes (17): AccountingView(), DayBookView(), FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView(), GstrReportsViewProps, InvoiceAnalyticsChart() (+9 more)

### Community 42 - "server.ts"
Cohesion: 0.10
Nodes (7): defaultPlugins, prisma, upload, securityHeaders(), ContactNotificationPayload, DispatchResult, notifyAdminNewInquiry()

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.22
Nodes (9): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, CanvasElement, CanvasSceneState (+1 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.12
Nodes (32): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, SpeechStudioView() (+24 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "MarkdownStudio.tsx"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "serverRegistry.ts"
Cohesion: 0.15
Nodes (12): express, authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter, manifest, MODEL_SPECS (+4 more)

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "strategies/types.ts"
Cohesion: 0.16
Nodes (14): StockScannerPanel(), StockScannerPanelProps, UNIVERSE_OPTIONS, calculateSentimentConfluence(), ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload (+6 more)

### Community 54 - "Accounting/types.ts"
Cohesion: 0.15
Nodes (15): FinancialStatementsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport, BankReconciliationItem, BankReconciliationReport, GSTR3BSummary (+7 more)

### Community 56 - "strategies/types.ts"
Cohesion: 0.24
Nodes (9): StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, StrategyIndicatorType, StrategyParameter, StrategyReview (+1 more)

### Community 57 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 58 - "tradeSimulator.ts"
Cohesion: 0.17
Nodes (20): StockSimulatorPanelProps, getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS (+12 more)

### Community 59 - "ImageStudioView.tsx"
Cohesion: 0.18
Nodes (13): ImageStudioView(), PROMPT_SUGGESTIONS, SAMPLE_IMAGES, ImageStudioPlugin, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel (+5 more)

### Community 60 - "motion@^12.23.24"
Cohesion: 0.20
Nodes (6): motion@^12.23.24, @prisma/adapter-better-sqlite3@^7.8.0, @types/pg@^8.21.0, motion, @prisma/adapter-better-sqlite3, @types/pg

### Community 61 - "DocNexus/types.ts"
Cohesion: 0.14
Nodes (16): DEFAULT_DOC_STATE, RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET, SpreadsheetStudioProps (+8 more)

### Community 62 - "StorageVaultView.tsx"
Cohesion: 0.33
Nodes (11): CATEGORIES, StorageVaultView(), StorageVaultViewProps, deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl() (+3 more)

### Community 63 - "storageUtils.ts"
Cohesion: 0.53
Nodes (5): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob()

### Community 64 - "api/server.ts"
Cohesion: 0.29
Nodes (7): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, @vercel/node@^5.9.7, @vercel/node, app, startPromise

### Community 65 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 66 - "DocNexusDocument"
Cohesion: 0.23
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument (+2 more)

### Community 68 - "CookieConsentBanner.tsx"
Cohesion: 0.27
Nodes (8): react-router-dom@^7.15.1, react-router-dom, CookieConsentBanner(), CookiePreferences, getStoredCookiePreferences(), openCookiePreferencesModal(), CopyrightView(), PrivacyPolicyView()

### Community 71 - "backgroundWorker.ts"
Cohesion: 0.43
Nodes (5): executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), listSimulations()

### Community 72 - "UserProfileView.tsx"
Cohesion: 0.21
Nodes (9): @react-oauth/google@^0.13.5, @react-oauth/google, AuthPageProps, BugReportModal(), LandingPageProps, ProfileData, UserProfileView(), UserProfileViewProps (+1 more)

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.tsx`, `TerminalLog`, `indicatorEngine.ts`, `dependencies`, `clientRegistry.ts`, `package.json`, `patterns/types.ts`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusStudio.tsx`, `ManageDatabaseView.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `formatINR`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `MarkdownStudio.tsx`, `strategies/types.ts`, `Accounting/types.ts`, `strategies/types.ts`, `WorkspacePluginStore.tsx`, `tradeSimulator.ts`, `ImageStudioView.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `OpenLocalWorkspaceModal.tsx`, `DocNexusDocument`, `CookieConsentBanner.tsx`, `main.tsx`, `UserProfileView.tsx`?**
  _High betweenness centrality (0.227) - this node is a cross-community bridge._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.07446808510638298 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `TerminalLog`, `indicatorEngine.ts`, `dependencies`, `package.json`, `patterns/types.ts`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusStudio.tsx`, `ManageDatabaseView.tsx`, `backtest/engine.ts`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `MarkdownStudio.tsx`, `strategies/types.ts`, `strategies/types.ts`, `WorkspacePluginStore.tsx`, `tradeSimulator.ts`, `ImageStudioView.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `OpenLocalWorkspaceModal.tsx`, `DocNexusDocument`, `UserProfileView.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `getPrismaClient()` connect `tradeSimulator.ts` to `registerRoutes`, `seed.ts`, `DocNexus/storage.ts`, `StockTracker/routes.ts`, `auth.ts`, `backgroundWorker.ts`, `server.ts`, `databaseSyncService.ts`, `getPrismaClient`, `tradeSimulator.ts`, `Accounting/storage.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `StockTracker/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._