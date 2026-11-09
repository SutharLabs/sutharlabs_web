# Graph Report - website  (2026-11-09)

## Corpus Check
- 230 files · ~472,387 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1817 nodes · 4307 edges · 111 communities (95 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `50e31c20`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- plugins/types.ts
- src/types.ts
- indicatorEngine.ts
- package.json
- StockTracker/routes.ts
- SovereignTools/manifest.json
- tradeSimulator.ts
- App.tsx
- UnifiedInferenceQueueManager
- patterns/types.ts
- sentimentEngine.ts
- documentParsers.ts
- StudioCastCompositor
- TelemetryLoggerService
- dependencies
- databaseSyncService.ts
- AdminAIChatView.tsx
- getPrismaClient
- compilerOptions
- StockTracker/manifest.json
- StorageVaultView.tsx
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
- SpeechStudio/storage.ts
- PdfToolsStudio.tsx
- scripts
- scannerEngine.ts
- auth.ts
- react
- server.ts
- SpeechStudio/routes.ts
- SpeechStudio/manifest.json
- DocNexus/storage.ts
- SpeechStudioView.tsx
- vercel.json
- DocNexus/types.ts
- ImageStudio/manifest.json
- deploy.sh
- startServer
- audioSynth.ts
- loadTenantData
- Accounting/types.ts
- ResumeStudio/manifest.json
- MotionStudio/manifest.json
- PartyCustomer
- getPrismaClient
- deploy-production.ts
- DocNexusStudio
- pluginLogger.ts
- lucide-react
- PluginLogger
- unifiedInferenceQueue.ts
- WorkspacePluginStore.tsx
- startServer
- ResumeEngine.tsx
- ImageStudioView.tsx
- StockSimulatorPanel.tsx
- lucide-react
- BackgroundRemoverTool.tsx
- getInvoices
- serverRegistry.ts
- DocNexusStudio.tsx
- ref_path
- registerRoutes5
- getDatabaseStatus
- exchangeCalendar.ts
- _utils.ts
- StudioCast/manifest.json
- DocNexusDocument
- CutoutStudio/manifest.json
- BugReportModal.tsx
- getMarketSessionStatus
- SlideDeckStudio.tsx
- rateLimiter.ts
- @neondatabase/serverless
- clientRegistry.ts
- MockupStudio/manifest.json
- pdfjs-dist
- TranscribeStudio/manifest.json
- @huggingface/transformers
- MotionStudioView.tsx
- pdf-lib
- ref_path
- AudioTranscriberTool.tsx
- FlowDesigner/index.ts
- MockupStudioView.tsx
- Accounting/index.ts
- ToolsStudioView.tsx
- ImageStudio/index.ts
- MotionStudio/index.ts
- TranscribeStudio/index.ts
- technicalindicators
- prisma
- multer
- react-dom
- ws

## God Nodes (most connected - your core abstractions)
1. `react` - 95 edges
2. `lucide-react` - 72 edges
3. `registerRoutes()` - 46 edges
4. `TerminalLog` - 42 edges
5. `startServer()` - 39 edges
6. `getPrismaClient()` - 39 edges
7. `startServer()` - 35 edges
8. `registerRoutes()` - 30 edges
9. `PdfToolsStudio()` - 29 edges
10. `AccountingStorage` - 27 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --calls--> `verifyToken()`  [EXTRACTED]
  server.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (111 total, 16 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.19
Nodes (8): getUserEmail(), registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "plugins/types.ts"
Cohesion: 0.26
Nodes (7): ClientPluginEntry, CutoutStudioView(), CutoutStudioPlugin, manifest, WorkspacePluginManifest, WorkspacePluginModule, WorkspacePluginViewProps

### Community 2 - "src/types.ts"
Cohesion: 0.10
Nodes (28): AccountingViewProps, AdminAIChatViewProps, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView(), ManageProps, BugReportItem, BugReportsStats (+20 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (18): loadWatchlistsFromDisk(), logger, registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+10 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.15
Nodes (36): getPrismaClient(), main(), detectMarketRegion(), executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), appendHistoryReport() (+28 more)

### Community 8 - "App.tsx"
Cohesion: 0.09
Nodes (30): @react-oauth/google@^0.13.5, @react-oauth/google, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal() (+22 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.13
Nodes (22): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+14 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "StudioCastCompositor"
Cohesion: 0.09
Nodes (19): StudioCastView(), ParticipantStreamSource, StudioCastCompositor, StudioCastPlugin, manifest, chatStore, getOrCreateRoom(), logger (+11 more)

### Community 15 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, pg@^8.23.0, @prisma/adapter-better-sqlite3@^7.8.0 (+23 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.22
Nodes (14): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE, inMemoryHistory (+6 more)

### Community 17 - "AdminAIChatView.tsx"
Cohesion: 0.11
Nodes (26): AdminAIChatView(), init(), INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels() (+18 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.18
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "StorageVaultView.tsx"
Cohesion: 0.28
Nodes (14): CATEGORIES, StorageVaultView(), completeChunkedUpload(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl() (+6 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.05
Nodes (35): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState (+27 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.23
Nodes (16): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+8 more)

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.08
Nodes (24): AdminConsoleProps, AdminConsoleView(), FleetTelemetry, IncidentAlert, NodeServiceStatus, NodeTelemetry, SystemTelemetry, ConfirmModal() (+16 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.17
Nodes (15): requestLogger(), FleetTelemetry, formatUptime(), getCpuSnapshot(), getFleetTelemetry(), getRequestMetrics(), getSystemTelemetry(), IncidentAlert (+7 more)

### Community 28 - "LandingPage.tsx"
Cohesion: 0.18
Nodes (14): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+6 more)

### Community 29 - "Accounting/storage.ts"
Cohesion: 0.15
Nodes (17): CreateInvoiceDrawer(), DraftLineItem, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, amountInWordsIndian(), convertThreeDigits(), convertTwoDigits() (+9 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.22
Nodes (17): StockBacktestPanelProps, fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics (+9 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.15
Nodes (12): DocNexusPlugin, category, description, iconSymbol, id, main, manifest, minEngineVersion (+4 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "DocNexusStudio"
Cohesion: 0.19
Nodes (12): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal() (+4 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "SpeechStudio/storage.ts"
Cohesion: 0.32
Nodes (15): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfileAsync(), getClonedVoiceProfiles(), getClonedVoiceProfilesAsync(), getProfilesFilePath(), getSamplesDirectory() (+7 more)

### Community 37 - "PdfToolsStudio.tsx"
Cohesion: 0.12
Nodes (25): PublicToolsHubView(), PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool(), PdfEditorTool() (+17 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "scannerEngine.ts"
Cohesion: 0.17
Nodes (13): StockScannerPanelProps, UNIVERSE_OPTIONS, calculateSentimentConfluence(), ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, calculateSupertrend() (+5 more)

### Community 40 - "auth.ts"
Cohesion: 0.23
Nodes (10): SECRET_KEY, verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), getDefaultUserNodes(), getUserFlowFilePath() (+2 more)

### Community 41 - "react"
Cohesion: 0.16
Nodes (23): react, AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView() (+15 more)

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (13): BACKEND_TARGET, config, handler(), maxDuration, ORACLE_BACKEND_URL, app, defaultPlugins, prisma (+5 more)

### Community 43 - "SpeechStudio/routes.ts"
Cohesion: 0.23
Nodes (14): executeBackgroundCloning(), executeBackgroundSynthesis(), getOracleTtsUrls(), getQuotaStatus(), getUserIdentifierAndRole(), logger, preprocessEmotionTags(), quotaStore (+6 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "DocNexus/storage.ts"
Cohesion: 0.27
Nodes (16): getValidatedUserEmail(), logger, registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument() (+8 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.14
Nodes (17): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, DEFAULT_SYNTHESIS_STEPS, SAMPLE_PROMPTS (+9 more)

### Community 47 - "vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/server.ts, outputDirectory, rewrites

### Community 48 - "DocNexus/types.ts"
Cohesion: 0.16
Nodes (14): CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps (+6 more)

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
Cohesion: 0.12
Nodes (22): FinancialStatementsViewProps, STATE_CODE_MAP, DEFAULT_COMPANY, DEFAULT_ITEMS, DEFAULT_PARTIES, getInitialVouchers(), tenantMemoryCache, AccountHead (+14 more)

### Community 56 - "ResumeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 57 - "MotionStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 58 - "PartyCustomer"
Cohesion: 0.18
Nodes (16): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawerProps, InvoiceAnalyticsChartProps, ItemCatalogViewProps, OcrReceiptModalProps, PartyMasterView(), PartyMasterViewProps (+8 more)

### Community 59 - "getPrismaClient"
Cohesion: 0.18
Nodes (30): appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteJsonData(), deleteSimulation(), detectMarketRegion(), ensureSimulatorStore() (+22 more)

### Community 60 - "deploy-production.ts"
Cohesion: 0.18
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, CanvasStudio(), DocNexusStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 62 - "pluginLogger.ts"
Cohesion: 0.18
Nodes (10): createPluginLogger(), PluginLogContext, PluginLogEntry, PluginLogLevel, PluginSpan, logger, ScopedDocumentInput, ScopedInvoiceInput (+2 more)

### Community 63 - "lucide-react"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 65 - "unifiedInferenceQueue.ts"
Cohesion: 0.20
Nodes (9): ActiveTaskDetails, InferenceTaskType, JobStatus, QueuedJob, QueuePositionInfo, QueueTelemetry, StepDiagnostic, TaskPriority (+1 more)

### Community 66 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 67 - "startServer"
Cohesion: 0.14
Nodes (18): generateToken(), hashPassword(), seedDatabase(), startServer(), loadSystemSettings(), saveSystemSettings(), requireAdmin(), errorHandler() (+10 more)

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.13
Nodes (21): FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView(), ResumeStudioViewProps, ResumeStudioPlugin (+13 more)

### Community 70 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 71 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 72 - "lucide-react"
Cohesion: 0.24
Nodes (7): lucide-react, BusinessCardContact, CsvReceiptRow, SubToolProps, ToolCategory, ToolMeta, ToolType

### Community 73 - "BackgroundRemoverTool.tsx"
Cohesion: 0.17
Nodes (10): @imgly/background-removal@^1.7.0, jszip@^3.10.2, @imgly/background-removal, jszip, AppIconGeneratorTool(), GeneratedAsset, BackdropPreset, BackgroundRemoverTool() (+2 more)

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "serverRegistry.ts"
Cohesion: 0.36
Nodes (6): express, MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES

### Community 76 - "DocNexusStudio.tsx"
Cohesion: 0.23
Nodes (10): FORMAT_TABS, INITIAL_DOCS, DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps, FORMAT_ICONS, TemplateLibraryModal(), TemplateLibraryModalProps (+2 more)

### Community 78 - "registerRoutes5"
Cohesion: 0.32
Nodes (12): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfiles(), getProfilesFilePath(), getQuotaStatus(), getSamplesDirectory(), getSpeechDataDirectory() (+4 more)

### Community 79 - "getDatabaseStatus"
Cohesion: 0.25
Nodes (9): executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), loadSyncHistory(), loadSyncHistoryFromDb(), parseDatabaseMetadata(), persistSyncHistoryInDb() (+1 more)

### Community 80 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 81 - "_utils.ts"
Cohesion: 0.16
Nodes (14): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, defaultPlugins, hashPassword(), seed(), decryptPluginPackage(), encryptPluginPackage() (+6 more)

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 83 - "DocNexusDocument"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 84 - "CutoutStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 85 - "BugReportModal.tsx"
Cohesion: 0.13
Nodes (13): BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot (+5 more)

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

### Community 87 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 88 - "rateLimiter.ts"
Cohesion: 0.20
Nodes (6): authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter, securityHeaders()

### Community 89 - "@neondatabase/serverless"
Cohesion: 0.14
Nodes (8): google-auth-library@^10.9.0, @neondatabase/serverless@^1.1.0, @types/jszip@^3.4.0, yahoo-finance2@^3.14.1, google-auth-library, @neondatabase/serverless, @types/jszip, yahoo-finance2

### Community 90 - "clientRegistry.ts"
Cohesion: 0.23
Nodes (5): CLIENT_PLUGIN_REGISTRY, SpeechStudioPlugin, manifest, StockTrackerPlugin, manifest

### Community 91 - "MockupStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 92 - "pdfjs-dist"
Cohesion: 0.40
Nodes (5): pdfjs-dist@^6.4.299, tesseract.js@^7.0.0, pdfjs-dist, tesseract.js, OcrReceiptModal()

### Community 93 - "TranscribeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 95 - "MotionStudioView.tsx"
Cohesion: 0.13
Nodes (14): ApparelType, DeviceType, MockupCategory, MockupStudioTool(), ASPECT_RATIOS, AspectRatioConfig, AspectRatioType, MotionVideoStudioTool() (+6 more)

### Community 97 - "ref_path"
Cohesion: 0.22
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 98 - "AudioTranscriberTool.tsx"
Cohesion: 0.33
Nodes (4): AudioFileItem, AudioTranscriberTool(), SubtitleSegment, TranscribeStudioView()

### Community 99 - "FlowDesigner/index.ts"
Cohesion: 0.50
Nodes (3): FlowDesignerView(), FlowDesignerPlugin, manifest

### Community 100 - "MockupStudioView.tsx"
Cohesion: 0.47
Nodes (3): MockupStudioView(), MockupStudioPlugin, manifest

### Community 102 - "ToolsStudioView.tsx"
Cohesion: 0.40
Nodes (4): ToolsStudioView(), ToolsStudioViewProps, ToolsStudioPlugin, manifest

### Community 103 - "ImageStudio/index.ts"
Cohesion: 0.50
Nodes (3): ImageStudioView(), ImageStudioPlugin, manifest

### Community 107 - "prisma"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

## Knowledge Gaps
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `plugins/types.ts`, `src/types.ts`, `indicatorEngine.ts`, `package.json`, `App.tsx`, `patterns/types.ts`, `StudioCastCompositor`, `dependencies`, `AdminAIChatView.tsx`, `StorageVaultView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `DocNexusStudio`, `PdfToolsStudio.tsx`, `scannerEngine.ts`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `Accounting/types.ts`, `PartyCustomer`, `DocNexusStudio`, `lucide-react`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `lucide-react`, `BackgroundRemoverTool.tsx`, `DocNexusStudio.tsx`, `DocNexusDocument`, `BugReportModal.tsx`, `SlideDeckStudio.tsx`, `clientRegistry.ts`, `MotionStudioView.tsx`, `AudioTranscriberTool.tsx`, `MockupStudioView.tsx`, `ToolsStudioView.tsx`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0962566844919786 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `plugins/types.ts`, `src/types.ts`, `indicatorEngine.ts`, `package.json`, `App.tsx`, `patterns/types.ts`, `StudioCastCompositor`, `dependencies`, `AdminAIChatView.tsx`, `StorageVaultView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `DocNexusStudio`, `PdfToolsStudio.tsx`, `scannerEngine.ts`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `lucide-react`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `BackgroundRemoverTool.tsx`, `DocNexusStudio.tsx`, `DocNexusDocument`, `BugReportModal.tsx`, `SlideDeckStudio.tsx`, `MotionStudioView.tsx`, `AudioTranscriberTool.tsx`, `MockupStudioView.tsx`, `ToolsStudioView.tsx`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `express` connect `serverRegistry.ts` to `startServer`, `package.json`, `StockTracker/routes.ts`, `auth.ts`, `rateLimiter.ts`, `server.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `ref_path`, `dependencies`, `StudioCastCompositor`, `server.js`, `telemetryService.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._