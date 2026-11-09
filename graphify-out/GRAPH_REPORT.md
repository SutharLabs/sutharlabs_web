# Graph Report - website  (2026-11-10)

## Corpus Check
- 230 files · ~484,522 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1838 nodes · 4357 edges · 105 communities (96 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ccfabcf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- PdfToolsStudio.tsx
- src/types.ts
- indicatorEngine.ts
- dependencies
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
- fetcher.ts
- databaseSyncService.ts
- src/types.ts
- getPrismaClient
- compilerOptions
- StockTracker/manifest.json
- StockTrackerView
- Accounting/manifest.json
- StockTrackerView.tsx
- server.js
- scannerEngine.ts
- ConfirmModal.tsx
- telemetryService.ts
- LandingPage.tsx
- gstEngine.ts
- backtest/engine.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- DocNexusStudio
- registerRoutes
- SpeechStudio/storage.ts
- tools/types.ts
- scripts
- scannerEngine.ts
- express
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
- package.json
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
- BugReportModal.tsx
- StorageVaultView.tsx
- getInvoices
- serverRegistry.ts
- BackgroundRemoverTool.tsx
- clientRegistry.ts
- registerRoutes5
- getDatabaseStatus
- auth.ts
- package-plugins.ts
- StudioCast/manifest.json
- DocNexusDocument
- CutoutStudio/manifest.json
- MotionStudioView.tsx
- getMarketSessionStatus
- DocNexusDocument
- seed.ts
- exchangeCalendar.ts
- clientRegistry.ts
- MockupStudio/manifest.json
- OcrReceiptModal.tsx
- TranscribeStudio/manifest.json
- @prisma/adapter-neon
- MotionStudioView.tsx
- ToolsStudioView.tsx
- ref_path
- dotenv
- FlowDesigner/index.ts
- ReceiptToCsvTool.tsx
- AudioTranscriberTool
- multer
- @types/pg@^8.21.0
- @vitejs/plugin-react

## God Nodes (most connected - your core abstractions)
1. `react` - 95 edges
2. `lucide-react` - 72 edges
3. `registerRoutes()` - 46 edges
4. `startServer()` - 42 edges
5. `TerminalLog` - 42 edges
6. `getPrismaClient()` - 39 edges
7. `startServer()` - 35 edges
8. `registerRoutes()` - 30 edges
9. `PdfToolsStudio()` - 29 edges
10. `AccountingStorage` - 27 edges

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

## Communities (105 total, 9 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "PdfToolsStudio.tsx"
Cohesion: 0.19
Nodes (17): PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool(), PdfEditorTool(), PdfToImageTool() (+9 more)

### Community 2 - "src/types.ts"
Cohesion: 0.09
Nodes (31): AccountingViewProps, AdminAIChatViewProps, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, DocNexusViewProps, ManageAppsView(), ManageProps, BugReportItem (+23 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, google-auth-library@^10.9.0, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, @neondatabase/serverless@^1.1.0, pdf-lib@^1.17.1, pdfjs-dist@^6.4.299 (+23 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.09
Nodes (20): KNOWN_US_TICKERS, MARKET_UNIVERSES, loadWatchlistsFromDisk(), logger, registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem (+12 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.17
Nodes (31): getPrismaClient(), SECRET_KEY, main(), executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), appendHistoryReport() (+23 more)

### Community 8 - "App.tsx"
Cohesion: 0.09
Nodes (32): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+24 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.21
Nodes (11): analyzeAutonomousFallback(), analyzeStockSentiment(), BEARISH_LEXICON, BULLISH_LEXICON, detectCatalyst(), SENTIMENT_CACHE, SentimentCacheEntry, HeadlineSentimentAnalysis (+3 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "StudioCastCompositor"
Cohesion: 0.10
Nodes (15): StudioCastView(), ParticipantStreamSource, StudioCastCompositor, chatStore, logger, recordingsStore, roomsStore, signalQueue (+7 more)

### Community 15 - "fetcher.ts"
Cohesion: 0.30
Nodes (11): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "src/types.ts"
Cohesion: 0.09
Nodes (41): AdminAIChatView(), init(), budgetDocumentText(), INITIAL_PROMPTS, toSafeTimestamp(), MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS (+33 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "StockTrackerView"
Cohesion: 0.21
Nodes (11): StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, createWatchlistItem(), formatRelativeTime() (+3 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (19): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+11 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.28
Nodes (14): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+6 more)

### Community 26 - "ConfirmModal.tsx"
Cohesion: 0.09
Nodes (23): AdminConsoleProps, AdminConsoleView(), FleetTelemetry, IncidentAlert, NodeServiceStatus, NodeTelemetry, SystemTelemetry, ConfirmModal() (+15 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.20
Nodes (13): FleetTelemetry, formatUptime(), getCpuSnapshot(), getFleetTelemetry(), getRequestMetrics(), getSystemTelemetry(), IncidentAlert, lastCpuSample (+5 more)

### Community 28 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 29 - "gstEngine.ts"
Cohesion: 0.12
Nodes (23): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), PartyMasterView(), PartyMasterViewProps, amountInWordsIndian(), convertThreeDigits(), convertTwoDigits() (+15 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.21
Nodes (17): StockBacktestPanel(), fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint (+9 more)

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
Cohesion: 0.17
Nodes (18): DocNexusView(), CanvasStudio(), CommandPaletteModal(), DocExplorerSidebar(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, ExportModal() (+10 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "SpeechStudio/storage.ts"
Cohesion: 0.33
Nodes (15): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfileAsync(), getClonedVoiceProfiles(), getClonedVoiceProfilesAsync(), getProfilesFilePath(), getSamplesDirectory() (+7 more)

### Community 37 - "tools/types.ts"
Cohesion: 0.14
Nodes (11): Base64Tool(), BusinessCardContact, HashGeneratorTool(), JsonConverterTool(), QrGeneratorTool(), TextDiffTool(), SubToolProps, ToolCategory (+3 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "scannerEngine.ts"
Cohesion: 0.14
Nodes (20): StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockStrategyMarketplaceProps, calculateSentimentConfluence(), ScannerCandidate, ScannerFilterOptions, ScannerReport (+12 more)

### Community 40 - "express"
Cohesion: 0.14
Nodes (12): express@^4.21.2, express, errorHandler(), notFoundHandler(), requestLogger(), authLimiter, generalApiLimiter, RateLimitOptions (+4 more)

### Community 41 - "react"
Cohesion: 0.19
Nodes (19): react, AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView() (+11 more)

### Community 42 - "server.ts"
Cohesion: 0.07
Nodes (16): BACKEND_TARGET, config, handler(), maxDuration, ORACLE_BACKEND_URL, generateToken(), hashPassword(), app (+8 more)

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
Cohesion: 0.13
Nodes (17): CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudioProps (+9 more)

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

### Community 57 - "MotionStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 58 - "package.json"
Cohesion: 0.09
Nodes (30): vite@^6.2.3, devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13 (+22 more)

### Community 59 - "getPrismaClient"
Cohesion: 0.18
Nodes (30): appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteJsonData(), deleteSimulation(), detectMarketRegion(), ensureSimulatorStore() (+22 more)

### Community 60 - "deploy-production.ts"
Cohesion: 0.18
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "DocNexusStudio"
Cohesion: 0.54
Nodes (7): clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault(), openVaultDB(), sanitizeForLocalStorage(), saveVault()

### Community 62 - "pluginLogger.ts"
Cohesion: 0.18
Nodes (10): createPluginLogger(), PluginLogContext, PluginLogEntry, PluginLogLevel, PluginSpan, logger, ScopedDocumentInput, ScopedInvoiceInput (+2 more)

### Community 63 - "lucide-react"
Cohesion: 0.21
Nodes (9): lucide-react, MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps, DEFAULT_SHEET (+1 more)

### Community 65 - "unifiedInferenceQueue.ts"
Cohesion: 0.20
Nodes (9): ActiveTaskDetails, InferenceTaskType, JobStatus, QueuedJob, QueuePositionInfo, QueueTelemetry, StepDiagnostic, TaskPriority (+1 more)

### Community 66 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 67 - "startServer"
Cohesion: 0.14
Nodes (19): startServer(), appendMessageToSession(), executeMcpTool(), loadSystemSettings(), runBackgroundAITask(), saveSystemSettings(), deleteJsonData(), getWritableDataDirectory() (+11 more)

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.13
Nodes (21): FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView(), ResumeStudioViewProps, ResumeStudioPlugin (+13 more)

### Community 70 - "ImageStudioView.tsx"
Cohesion: 0.16
Nodes (14): ImageStudioView(), PROMPT_SUGGESTIONS, SAMPLE_IMAGES, ImageStudioPlugin, manifest, AspectRatio, ImageGeneratePayload, ImageGenerateResult (+6 more)

### Community 71 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 72 - "BugReportModal.tsx"
Cohesion: 0.11
Nodes (14): @react-oauth/google@^0.13.5, @react-oauth/google, BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State (+6 more)

### Community 73 - "StorageVaultView.tsx"
Cohesion: 0.28
Nodes (14): CATEGORIES, StorageVaultView(), completeChunkedUpload(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl() (+6 more)

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "serverRegistry.ts"
Cohesion: 0.24
Nodes (9): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, StudioCastPlugin, manifest, getOrCreateRoom() (+1 more)

### Community 76 - "BackgroundRemoverTool.tsx"
Cohesion: 0.16
Nodes (9): jszip@^3.10.2, jszip, AppIconGeneratorTool(), GeneratedAsset, AudioFileItem, SubtitleSegment, BackdropPreset, ProcessedImageItem (+1 more)

### Community 77 - "clientRegistry.ts"
Cohesion: 0.14
Nodes (9): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, MotionStudioPlugin, manifest, SpeechStudioPlugin, manifest, StockTrackerPlugin (+1 more)

### Community 78 - "registerRoutes5"
Cohesion: 0.32
Nodes (12): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfiles(), getProfilesFilePath(), getQuotaStatus(), getSamplesDirectory(), getSpeechDataDirectory() (+4 more)

### Community 79 - "getDatabaseStatus"
Cohesion: 0.25
Nodes (9): executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), loadSyncHistory(), loadSyncHistoryFromDb(), parseDatabaseMetadata(), persistSyncHistoryInDb() (+1 more)

### Community 80 - "auth.ts"
Cohesion: 0.23
Nodes (10): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath() (+2 more)

### Community 81 - "package-plugins.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 83 - "DocNexusDocument"
Cohesion: 0.50
Nodes (3): OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 84 - "CutoutStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 85 - "MotionStudioView.tsx"
Cohesion: 0.17
Nodes (11): @imgly/background-removal@^1.7.0, @imgly/background-removal, BackgroundRemoverTool(), ApparelType, DeviceType, MockupCategory, MockupStudioTool(), MotionVideoStudioTool() (+3 more)

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

### Community 87 - "DocNexusDocument"
Cohesion: 0.26
Nodes (9): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument, DocumentFormat (+1 more)

### Community 88 - "seed.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 89 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 90 - "clientRegistry.ts"
Cohesion: 0.14
Nodes (13): ClientPluginEntry, CutoutStudioView(), CutoutStudioPlugin, manifest, MockupStudioView(), MockupStudioPlugin, manifest, TranscribeStudioView() (+5 more)

### Community 91 - "MockupStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 92 - "OcrReceiptModal.tsx"
Cohesion: 0.19
Nodes (17): CreateInvoiceDrawerProps, DraftLineItem, InvoiceAnalyticsChartProps, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, OcrReceiptModal() (+9 more)

### Community 93 - "TranscribeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 94 - "@prisma/adapter-neon"
Cohesion: 0.14
Nodes (8): better-sqlite3@^12.10.0, @prisma/adapter-neon@^7.9.1, react-dom@^19.0.1, ws@^8.21.3, better-sqlite3, @prisma/adapter-neon, react-dom, ws

### Community 95 - "MotionStudioView.tsx"
Cohesion: 0.29
Nodes (6): ASPECT_RATIOS, AspectRatioConfig, AspectRatioType, PRESET_COLORS, TEMPLATES, VideoTemplateType

### Community 96 - "ToolsStudioView.tsx"
Cohesion: 0.40
Nodes (4): ToolsStudioView(), ToolsStudioViewProps, ToolsStudioPlugin, manifest

### Community 97 - "ref_path"
Cohesion: 0.18
Nodes (4): @tailwindcss/vite@^4.1.14, @tailwindcss/vite, PluginEngine, PluginManifest

### Community 98 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 99 - "FlowDesigner/index.ts"
Cohesion: 0.50
Nodes (3): FlowDesignerView(), FlowDesignerPlugin, manifest

### Community 100 - "ReceiptToCsvTool.tsx"
Cohesion: 0.40
Nodes (4): tesseract.js@^7.0.0, tesseract.js, CsvReceiptRow, ReceiptToCsvTool()

### Community 101 - "AudioTranscriberTool"
Cohesion: 0.67
Nodes (3): @huggingface/transformers@^4.3.2, @huggingface/transformers, AudioTranscriberTool()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PdfToolsStudio.tsx`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `StockTrackerView`, `StockTrackerView.tsx`, `server.js`, `ConfirmModal.tsx`, `LandingPage.tsx`, `gstEngine.ts`, `backtest/engine.ts`, `DocNexusStudio`, `tools/types.ts`, `scannerEngine.ts`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `Accounting/types.ts`, `package.json`, `lucide-react`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `BugReportModal.tsx`, `StorageVaultView.tsx`, `BackgroundRemoverTool.tsx`, `clientRegistry.ts`, `DocNexusDocument`, `MotionStudioView.tsx`, `DocNexusDocument`, `clientRegistry.ts`, `OcrReceiptModal.tsx`, `MotionStudioView.tsx`, `ToolsStudioView.tsx`, `ReceiptToCsvTool.tsx`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08558558558558559 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `PdfToolsStudio.tsx`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `StockTrackerView`, `StockTrackerView.tsx`, `server.js`, `ConfirmModal.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `tools/types.ts`, `scannerEngine.ts`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `package.json`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `BugReportModal.tsx`, `StorageVaultView.tsx`, `BackgroundRemoverTool.tsx`, `DocNexusDocument`, `MotionStudioView.tsx`, `DocNexusDocument`, `clientRegistry.ts`, `OcrReceiptModal.tsx`, `MotionStudioView.tsx`, `ToolsStudioView.tsx`, `ReceiptToCsvTool.tsx`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `ref_path`, `StockTracker/routes.ts`, `server.ts`, `serverRegistry.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `StudioCastCompositor`, `auth.ts`, `server.js`, `package.json`, `gstEngine.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._