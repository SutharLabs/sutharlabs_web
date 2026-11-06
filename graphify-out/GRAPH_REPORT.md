# Graph Report - website  (2026-11-06)

## Corpus Check
- 192 files · ~393,528 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1283 nodes · 3063 edges · 78 communities (72 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a5485452`
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
- ref_path
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
- src/types.ts
- WorkspacePluginStore.tsx
- StockAnalyzer/index.ts
- UserProfileView.tsx
- @types/qrcode@^1.5.6
- DocNexus/types.ts
- StorageVaultView.tsx
- MarkdownStudio.tsx
- PdfToolsStudio.tsx
- OpenLocalWorkspaceModal.tsx
- fetcher.ts
- startServer
- PublicToolsHubView.tsx
- ResumeBuilderTool.tsx
- StockSimulatorPanel.tsx
- exchangeCalendar.ts
- BusinessCardScannerTool.tsx
- react-dom
- technicalindicators
- backgroundWorker.ts
- storageUtils.ts
- @prisma/adapter-neon

## God Nodes (most connected - your core abstractions)
1. `react` - 84 edges
2. `lucide-react` - 60 edges
3. `TerminalLog` - 40 edges
4. `startServer()` - 37 edges
5. `getPrismaClient()` - 37 edges
6. `registerRoutes()` - 30 edges
7. `AccountingStorage` - 27 edges
8. `registerRoutes()` - 27 edges
9. `PdfToolsStudio()` - 25 edges
10. `loadTenantData()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --calls--> `generateToken()`  [EXTRACTED]
  server.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (78 total, 6 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "clientRegistry.ts"
Cohesion: 0.07
Nodes (32): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, FlowDesignerPlugin, manifest (+24 more)

### Community 2 - "src/types.ts"
Cohesion: 0.10
Nodes (27): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView() (+19 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, @google/genai@^2.4.0, lucide-react@^0.546.0, multer@^2.1.1, @neondatabase/serverless@^1.1.0, pdf-lib@^1.17.1 (+23 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (18): optionalAuth(), loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+10 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.27
Nodes (24): getPrismaClient(), main(), appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteSimulation(), ensureSimulatorStore() (+16 more)

### Community 8 - "App.tsx"
Cohesion: 0.13
Nodes (20): ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP, STORE_TOOLS, URL_TO_TAB (+12 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.16
Nodes (16): analyzeAutonomousFallback(), analyzeStockSentiment(), BEARISH_LEXICON, BULLISH_LEXICON, calculateSentimentConfluence(), detectCatalyst(), SENTIMENT_CACHE, SentimentCacheEntry (+8 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.20
Nodes (18): colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX(), parseRTF() (+10 more)

### Community 13 - "AccountingView.tsx"
Cohesion: 0.13
Nodes (23): CompanySettingsModalProps, CreateInvoiceDrawerProps, DraftLineItem, DayBookViewProps, ItemCatalogView(), ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem (+15 more)

### Community 15 - "_utils.ts"
Cohesion: 0.18
Nodes (13): generateToken(), SECRET_KEY, IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey() (+5 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "AdminAIChatView.tsx"
Cohesion: 0.19
Nodes (16): AdminAIChatView(), init(), INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels() (+8 more)

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
Cohesion: 0.29
Nodes (8): BlobUploadOptions, deleteFromBlob(), fetchJsonBlob(), isBlobConfigured(), listStoredBlobs(), saveJsonBlob(), uploadToBlob(), verifyBlobWebhookSignature()

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (18): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+10 more)

### Community 24 - "UserProfileView.tsx"
Cohesion: 0.11
Nodes (14): @react-oauth/google@^0.13.5, @react-oauth/google, BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State (+6 more)

### Community 25 - "DocNexusStudio.tsx"
Cohesion: 0.15
Nodes (18): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, FORMAT_TABS (+10 more)

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.12
Nodes (17): ConfirmModal(), ConfirmModalProps, ModalVariant, FlowDesignerView(), FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection (+9 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "LandingPage.tsx"
Cohesion: 0.20
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 29 - "Accounting/storage.ts"
Cohesion: 0.16
Nodes (20): CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), determineSupplyType(), generateEInvoiceIRN(), generateSignedQrPayload() (+12 more)

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
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.29
Nodes (15): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+7 more)

### Community 37 - "react"
Cohesion: 0.19
Nodes (13): lucide-react, react, Base64Tool(), HashGeneratorTool(), JsonConverterTool(), QrGeneratorTool(), CsvReceiptRow, TextDiffTool() (+5 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "serverRegistry.ts"
Cohesion: 0.16
Nodes (15): express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), getUserEmail(), getDefaultUserNodes(), getUserFlowFilePath(), prisma (+7 more)

### Community 40 - "ref_path"
Cohesion: 0.22
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 41 - "formatINR"
Cohesion: 0.17
Nodes (17): AccountingView(), CompanySettingsModal(), DayBookView(), GeneralLedgerView(), GeneralLedgerViewProps, InvoiceAnalyticsChart(), InvoiceAnalyticsChartProps, OcrReceiptModal() (+9 more)

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (12): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise, upload (+4 more)

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.22
Nodes (9): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, CanvasElement, CanvasSceneState (+1 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.12
Nodes (33): verifyToken(), audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS (+25 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "StockStrategyMarketplace.tsx"
Cohesion: 0.17
Nodes (14): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, createWatchlistItem() (+6 more)

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "rateLimiter.ts"
Cohesion: 0.15
Nodes (8): errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter, securityHeaders()

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "strategies/types.ts"
Cohesion: 0.19
Nodes (13): StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockStrategyMarketplaceProps, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload (+5 more)

### Community 54 - "Accounting/types.ts"
Cohesion: 0.13
Nodes (18): FinancialStatementsView(), FinancialStatementsViewProps, GstrReportsView(), GstrReportsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport (+10 more)

### Community 56 - "src/types.ts"
Cohesion: 0.12
Nodes (15): InquiriesStats, ManageContactInquiriesProps, ManageContactInquiriesView(), PROJECT_TYPE_COLORS, STATUS_OPTIONS, AIArtifactItem, ChatSession, ContactInquiryItem (+7 more)

### Community 57 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 58 - "StockAnalyzer/index.ts"
Cohesion: 0.23
Nodes (16): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+8 more)

### Community 59 - "UserProfileView.tsx"
Cohesion: 0.24
Nodes (10): react-router-dom, BugReportModal(), CookieConsentBanner(), CookiePreferences, getStoredCookiePreferences(), openCookiePreferencesModal(), CopyrightView(), PrivacyPolicyView() (+2 more)

### Community 61 - "DocNexus/types.ts"
Cohesion: 0.13
Nodes (17): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET, SpreadsheetStudio() (+9 more)

### Community 62 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 63 - "MarkdownStudio.tsx"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 64 - "PdfToolsStudio.tsx"
Cohesion: 0.28
Nodes (12): CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool(), PdfEditorTool(), PdfToImageTool(), PdfToolsStudio(), PdfToolsStudioProps (+4 more)

### Community 65 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 66 - "fetcher.ts"
Cohesion: 0.30
Nodes (11): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+3 more)

### Community 67 - "startServer"
Cohesion: 0.22
Nodes (7): hashPassword(), seedDatabase(), startServer(), loadSystemSettings(), saveSystemSettings(), requireAdmin(), PluginEngine

### Community 68 - "PublicToolsHubView.tsx"
Cohesion: 0.18
Nodes (10): CATEGORIES, FAQS, filteredTools, jsonLdData, PublicToolsHubViewProps, relatedTools, ToolCategory, ToolMeta (+2 more)

### Community 69 - "ResumeBuilderTool.tsx"
Cohesion: 0.20
Nodes (8): jszip@^3.10.2, jszip, GeneratedAsset, DEFAULT_RESUME, ResumeData, ResumeEducation, ResumeExperience, ResumeProject

### Community 70 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 71 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 72 - "BusinessCardScannerTool.tsx"
Cohesion: 0.25
Nodes (6): tesseract.js@^7.0.0, tesseract.js, BusinessCardContact, BusinessCardScannerTool(), MultilingualOcrTool(), ReceiptToCsvTool()

### Community 73 - "react-dom"
Cohesion: 0.14
Nodes (8): google-auth-library@^10.9.0, motion@^12.23.24, react-dom@^19.0.1, @types/pg@^8.21.0, google-auth-library, motion, react-dom, @types/pg

### Community 75 - "backgroundWorker.ts"
Cohesion: 0.36
Nodes (5): executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), listSimulations()

### Community 76 - "storageUtils.ts"
Cohesion: 0.48
Nodes (6): deleteJsonData(), getWritableDataDirectory(), memoryCache, readJsonData(), resolveDataFilePath(), syncFromBlob()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `package.json`, `patterns/types.ts`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `UserProfileView.tsx`, `DocNexusStudio.tsx`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `DocNexusStudio`, `formatINR`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `StockStrategyMarketplace.tsx`, `strategies/types.ts`, `Accounting/types.ts`, `src/types.ts`, `WorkspacePluginStore.tsx`, `UserProfileView.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `MarkdownStudio.tsx`, `PdfToolsStudio.tsx`, `OpenLocalWorkspaceModal.tsx`, `PublicToolsHubView.tsx`, `ResumeBuilderTool.tsx`, `StockSimulatorPanel.tsx`, `BusinessCardScannerTool.tsx`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `clientRegistry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06748911465892599 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `package.json`, `patterns/types.ts`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `UserProfileView.tsx`, `DocNexusStudio.tsx`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `StockStrategyMarketplace.tsx`, `strategies/types.ts`, `src/types.ts`, `WorkspacePluginStore.tsx`, `UserProfileView.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `MarkdownStudio.tsx`, `PdfToolsStudio.tsx`, `OpenLocalWorkspaceModal.tsx`, `PublicToolsHubView.tsx`, `ResumeBuilderTool.tsx`, `StockSimulatorPanel.tsx`, `BusinessCardScannerTool.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10037878787878787 - nodes in this community are weakly interconnected._
- **Why does `getPrismaClient()` connect `tradeSimulator.ts` to `registerRoutes`, `DocNexus/storage.ts`, `StockTracker/routes.ts`, `serverRegistry.ts`, `server.ts`, `backgroundWorker.ts`, `_utils.ts`, `databaseSyncService.ts`, `getPrismaClient`, `Accounting/storage.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._