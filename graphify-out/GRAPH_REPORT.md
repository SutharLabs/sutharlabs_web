# Graph Report - website  (2026-11-07)

## Corpus Check
- 207 files · ~418,459 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1636 nodes · 3954 edges · 91 communities (81 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f802217c`
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
- StudioCastCompositor
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- AdminAIChatView.tsx
- getPrismaClient
- compilerOptions
- StockTracker/manifest.json
- _utils.ts
- Accounting/manifest.json
- StockTrackerView.tsx
- server.js
- scannerEngine.ts
- ManageDatabaseView.tsx
- telemetryService.ts
- LandingPage.tsx
- Accounting/storage.ts
- backtest/engine.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- DocNexusStudio
- registerRoutes
- DocNexus/storage.ts
- PdfToolsStudio.tsx
- scripts
- express
- StockSimulatorPanel.tsx
- react
- server.ts
- auth.ts
- SpeechStudio/manifest.json
- dotenv
- SpeechStudioView.tsx
- vercel.json
- startServer
- ImageStudio/manifest.json
- deploy.sh
- startServer
- audioSynth.ts
- loadTenantData
- Accounting/types.ts
- ResumeStudio/manifest.json
- BugReportModal.tsx
- OcrReceiptModal.tsx
- getPrismaClient
- deploy-production.ts
- SlideDeckStudio.tsx
- StorageVaultView.tsx
- lucide-react
- DocNexusStudio.tsx
- scannerEngine.ts
- WorkspacePluginStore.tsx
- startServer
- ResumeEngine.tsx
- CanvasStudio.tsx
- exchangeCalendar.ts
- ImageStudioView.tsx
- fetcher.ts
- getInvoices
- serverRegistry.ts
- vaultStorage.ts
- vite
- registerRoutes5
- getDatabaseStatus
- StockTrackerView
- @prisma/adapter-better-sqlite3@^7.8.0
- StudioCast/manifest.json
- backgroundWorker.ts
- OpenLocalWorkspaceModal.tsx
- @google/genai
- getMarketSessionStatus
- SpeechStudio/index.ts
- motion@^12.23.24
- @prisma/adapter-neon
- ws

## God Nodes (most connected - your core abstractions)
1. `react` - 87 edges
2. `lucide-react` - 64 edges
3. `registerRoutes()` - 46 edges
4. `TerminalLog` - 42 edges
5. `startServer()` - 38 edges
6. `getPrismaClient()` - 37 edges
7. `startServer()` - 35 edges
8. `registerRoutes()` - 30 edges
9. `AccountingStorage` - 27 edges
10. `registerRoutes()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --calls--> `generateToken()`  [EXTRACTED]
  server.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (91 total, 10 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "clientRegistry.ts"
Cohesion: 0.10
Nodes (19): FlowDesignerView(), AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, FlowDesignerPlugin (+11 more)

### Community 2 - "src/types.ts"
Cohesion: 0.09
Nodes (32): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView() (+24 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, lucide-react@^0.546.0, multer@^2.1.1, @neondatabase/serverless@^1.1.0, pdfjs-dist@^6.4.299, qrcode@^1.5.4 (+21 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview(), createStrategy() (+9 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.27
Nodes (25): getPrismaClient(), main(), appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteSimulation(), ensureSimulatorStore() (+17 more)

### Community 8 - "App.tsx"
Cohesion: 0.07
Nodes (34): @react-oauth/google@^0.13.5, react-router-dom@^7.15.1, @react-oauth/google, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS (+26 more)

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
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "StudioCastCompositor"
Cohesion: 0.11
Nodes (14): StudioCastView(), ParticipantStreamSource, StudioCastCompositor, chatStore, recordingsStore, roomsStore, signalQueue, IsoRecordingTrack (+6 more)

### Community 15 - "_utils.ts"
Cohesion: 0.39
Nodes (8): decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive(), resolvePluginArchiveBuffer(), SLPK_MAGIC, SLPK_VERSION

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

### Community 21 - "_utils.ts"
Cohesion: 0.12
Nodes (17): generateToken(), SECRET_KEY, dotenv@^16.4.5, pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, dotenv, pg (+9 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (18): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+10 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.23
Nodes (16): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+8 more)

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.12
Nodes (16): ConfirmModal(), ConfirmModalProps, ModalVariant, FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode (+8 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 29 - "Accounting/storage.ts"
Cohesion: 0.12
Nodes (23): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), PartyMasterView(), PartyMasterViewProps, amountInWordsIndian(), convertThreeDigits(), convertTwoDigits() (+15 more)

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
Cohesion: 0.23
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal(), ExportModalProps, DocNexusDocument (+2 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 37 - "PdfToolsStudio.tsx"
Cohesion: 0.08
Nodes (35): tesseract.js@^7.0.0, tesseract.js, PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool() (+27 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "express"
Cohesion: 0.15
Nodes (10): express@^4.21.2, express, errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord (+2 more)

### Community 40 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 41 - "react"
Cohesion: 0.19
Nodes (19): react, AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView() (+11 more)

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (13): BACKEND_TARGET, config, handler(), maxDuration, ORACLE_BACKEND_URL, app, defaultPlugins, prisma (+5 more)

### Community 43 - "auth.ts"
Cohesion: 0.21
Nodes (11): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath() (+3 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.12
Nodes (31): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, SpeechStudioView() (+23 more)

### Community 47 - "vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/server.ts, outputDirectory, rewrites

### Community 48 - "startServer"
Cohesion: 0.22
Nodes (13): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "startServer"
Cohesion: 0.08
Nodes (33): createBugReport(), decryptPluginPackage(), deleteBugReport(), deleteFromBlob(), encryptPluginPackage(), errorHandler(), exportDatabaseDump(), generateToken() (+25 more)

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "loadTenantData"
Cohesion: 0.11
Nodes (28): addItem(), addParty(), addVoucher(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), buildGSTInvoiceObject(), calculateItemTaxes() (+20 more)

### Community 54 - "Accounting/types.ts"
Cohesion: 0.13
Nodes (21): FinancialStatementsViewProps, DEFAULT_COMPANY, DEFAULT_ITEMS, DEFAULT_PARTIES, getInitialVouchers(), tenantMemoryCache, AccountHead, AgingAnalysisReport (+13 more)

### Community 56 - "ResumeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 57 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 58 - "OcrReceiptModal.tsx"
Cohesion: 0.19
Nodes (17): CreateInvoiceDrawerProps, DraftLineItem, InvoiceAnalyticsChartProps, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, OcrReceiptModal() (+9 more)

### Community 59 - "getPrismaClient"
Cohesion: 0.18
Nodes (30): appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteJsonData(), deleteSimulation(), detectMarketRegion(), ensureSimulatorStore() (+22 more)

### Community 60 - "deploy-production.ts"
Cohesion: 0.16
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 62 - "StorageVaultView.tsx"
Cohesion: 0.28
Nodes (14): CATEGORIES, StorageVaultView(), completeChunkedUpload(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl() (+6 more)

### Community 63 - "lucide-react"
Cohesion: 0.19
Nodes (10): lucide-react, MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps, DEFAULT_SHEET (+2 more)

### Community 64 - "DocNexusStudio.tsx"
Cohesion: 0.21
Nodes (13): DocNexusView(), DocNexusViewProps, CommandPaletteModal(), DocExplorerSidebar(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, RichDocStudio() (+5 more)

### Community 65 - "scannerEngine.ts"
Cohesion: 0.19
Nodes (13): StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockStrategyMarketplaceProps, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload (+5 more)

### Community 66 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 67 - "startServer"
Cohesion: 0.24
Nodes (6): hashPassword(), seedDatabase(), startServer(), loadSystemSettings(), saveSystemSettings(), PluginEngine

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.12
Nodes (23): jszip@^3.10.2, jszip, FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView() (+15 more)

### Community 70 - "CanvasStudio.tsx"
Cohesion: 0.15
Nodes (15): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+7 more)

### Community 71 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 72 - "ImageStudioView.tsx"
Cohesion: 0.16
Nodes (14): ImageStudioView(), PROMPT_SUGGESTIONS, SAMPLE_IMAGES, ImageStudioPlugin, manifest, AspectRatio, ImageGeneratePayload, ImageGenerateResult (+6 more)

### Community 73 - "fetcher.ts"
Cohesion: 0.30
Nodes (11): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+3 more)

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "serverRegistry.ts"
Cohesion: 0.27
Nodes (8): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, manifest, getOrCreateRoom(), registerRoutes()

### Community 76 - "vaultStorage.ts"
Cohesion: 0.54
Nodes (7): clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault(), openVaultDB(), sanitizeForLocalStorage(), saveVault()

### Community 77 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 78 - "registerRoutes5"
Cohesion: 0.32
Nodes (12): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfiles(), getProfilesFilePath(), getQuotaStatus(), getSamplesDirectory(), getSpeechDataDirectory() (+4 more)

### Community 79 - "getDatabaseStatus"
Cohesion: 0.25
Nodes (9): executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), loadSyncHistory(), loadSyncHistoryFromDb(), parseDatabaseMetadata(), persistSyncHistoryInDb() (+1 more)

### Community 80 - "StockTrackerView"
Cohesion: 0.17
Nodes (14): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, createWatchlistItem() (+6 more)

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 83 - "backgroundWorker.ts"
Cohesion: 0.36
Nodes (5): executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), listSimulations()

### Community 84 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 85 - "@google/genai"
Cohesion: 0.20
Nodes (6): @google/genai@^2.4.0, pdf-lib@^1.17.1, @types/qrcode@^1.5.6, @google/genai, pdf-lib, @types/qrcode

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `package.json`, `patterns/types.ts`, `StudioCastCompositor`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `DocNexusStudio`, `PdfToolsStudio.tsx`, `StockSimulatorPanel.tsx`, `SpeechStudioView.tsx`, `Accounting/types.ts`, `BugReportModal.tsx`, `OcrReceiptModal.tsx`, `SlideDeckStudio.tsx`, `StorageVaultView.tsx`, `lucide-react`, `DocNexusStudio.tsx`, `scannerEngine.ts`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `CanvasStudio.tsx`, `ImageStudioView.tsx`, `StockTrackerView`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `clientRegistry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09915966386554621 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `package.json`, `patterns/types.ts`, `StudioCastCompositor`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `PdfToolsStudio.tsx`, `StockSimulatorPanel.tsx`, `SpeechStudioView.tsx`, `BugReportModal.tsx`, `OcrReceiptModal.tsx`, `SlideDeckStudio.tsx`, `StorageVaultView.tsx`, `DocNexusStudio.tsx`, `scannerEngine.ts`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `CanvasStudio.tsx`, `ImageStudioView.tsx`, `StockTrackerView`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08502024291497975 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `DocNexus/storage.ts`, `StockTracker/routes.ts`, `package.json`, `server.ts`, `auth.ts`, `serverRegistry.ts`, `StudioCastCompositor`, `SpeechStudioView.tsx`, `_utils.ts`, `server.js`, `telemetryService.ts`, `Accounting/storage.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._