# Graph Report - website  (2026-11-10)

## Corpus Check
- 230 files · ~483,424 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1836 nodes · 4353 edges · 94 communities (85 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b02a1bef`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- PdfToolsStudio.tsx
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
- react
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
- tradeSimulator.ts
- backgroundWorker.ts
- ImageStudio/index.ts
- getInvoices
- serverRegistry.ts
- SpreadsheetStudio.tsx
- Accounting/index.ts
- registerRoutes5
- getDatabaseStatus
- SpeechStudio/index.ts
- _utils.ts
- StudioCast/manifest.json
- DocNexusDocument
- CutoutStudio/manifest.json
- StockTrackerAlertModal.tsx
- getMarketSessionStatus
- clientRegistry.ts
- MockupStudio/manifest.json
- OcrReceiptModal.tsx
- TranscribeStudio/manifest.json
- MotionStudioView.tsx
- ref_path
- FlowDesigner/index.ts

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

## Communities (94 total, 9 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "PdfToolsStudio.tsx"
Cohesion: 0.12
Nodes (25): tesseract.js, PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool(), PdfEditorTool() (+17 more)

### Community 2 - "src/types.ts"
Cohesion: 0.07
Nodes (41): WorkspaceLayout(), AccountingViewProps, AdminAIChatViewProps, AdminConsoleView(), CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ConfirmModal(), ManageAppsView() (+33 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "package.json"
Cohesion: 0.03
Nodes (80): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, @google/genai@^2.4.0, @huggingface/transformers@^4.3.2, @imgly/background-removal@^1.7.0, jszip@^3.10.2, lucide-react@^0.546.0 (+72 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (18): loadWatchlistsFromDisk(), logger, registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+10 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.16
Nodes (29): appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteSimulation(), ensureSimulatorStore(), getEODHistory(), getEODPortfolio() (+21 more)

### Community 8 - "App.tsx"
Cohesion: 0.06
Nodes (40): @react-oauth/google@^0.13.5, react-router-dom@^7.15.1, @react-oauth/google, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS (+32 more)

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
Nodes (16): StudioCastView(), ParticipantStreamSource, StudioCastCompositor, chatStore, getOrCreateRoom(), logger, recordingsStore, roomsStore (+8 more)

### Community 15 - "fetcher.ts"
Cohesion: 0.30
Nodes (11): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.17
Nodes (19): getPrismaClient(), dotenv@^16.4.5, dotenv, runCronSync(), main(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump() (+11 more)

### Community 17 - "src/types.ts"
Cohesion: 0.07
Nodes (54): AdminAIChatView(), init(), INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, CATEGORIES, StorageVaultView(), AGENT_PERSONAS (+46 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.18
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "StockTrackerView"
Cohesion: 0.27
Nodes (10): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), createWatchlistItem(), formatRelativeTime(), formatTickerDisplay() (+2 more)

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
Cohesion: 0.21
Nodes (18): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+10 more)

### Community 26 - "ConfirmModal.tsx"
Cohesion: 0.09
Nodes (20): AdminConsoleProps, FleetTelemetry, IncidentAlert, NodeServiceStatus, NodeTelemetry, SystemTelemetry, ConfirmModalProps, ModalVariant (+12 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.20
Nodes (13): FleetTelemetry, formatUptime(), getCpuSnapshot(), getFleetTelemetry(), getRequestMetrics(), getSystemTelemetry(), IncidentAlert, lastCpuSample (+5 more)

### Community 28 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 29 - "gstEngine.ts"
Cohesion: 0.13
Nodes (23): CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), COMMON_HSN_SAC_CATALOG, determineSupplyType(), generateEInvoiceIRN() (+15 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.13
Nodes (28): StockBacktestPanelProps, StockStrategyMarketplaceProps, fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams (+20 more)

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
Cohesion: 0.15
Nodes (19): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, FORMAT_TABS (+11 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "SpeechStudio/storage.ts"
Cohesion: 0.33
Nodes (15): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfileAsync(), getClonedVoiceProfiles(), getClonedVoiceProfilesAsync(), getProfilesFilePath(), getSamplesDirectory() (+7 more)

### Community 37 - "react"
Cohesion: 0.10
Nodes (24): jszip, lucide-react, react, AppIconGeneratorTool(), GeneratedAsset, AudioFileItem, AudioTranscriberTool(), SubtitleSegment (+16 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "scannerEngine.ts"
Cohesion: 0.31
Nodes (6): StockScannerPanelProps, UNIVERSE_OPTIONS, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload

### Community 40 - "express"
Cohesion: 0.09
Nodes (22): verifyToken(), express@^4.21.2, express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin() (+14 more)

### Community 41 - "react"
Cohesion: 0.21
Nodes (17): AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView(), GstrReportsViewProps (+9 more)

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
Cohesion: 0.11
Nodes (20): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+12 more)

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
Cohesion: 0.14
Nodes (16): FinancialStatementsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport, BankReconciliationItem, BankReconciliationReport, GSTR1Summary (+8 more)

### Community 56 - "ResumeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 57 - "MotionStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 58 - "PartyCustomer"
Cohesion: 0.18
Nodes (15): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawerProps, InvoiceAnalyticsChartProps, OcrReceiptModal(), OcrReceiptModalProps, PartyMasterView(), PartyMasterViewProps (+7 more)

### Community 59 - "getPrismaClient"
Cohesion: 0.18
Nodes (30): appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteJsonData(), deleteSimulation(), detectMarketRegion(), ensureSimulatorStore() (+22 more)

### Community 60 - "deploy-production.ts"
Cohesion: 0.18
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), RichDocStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

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
Cohesion: 0.13
Nodes (14): hashPassword(), seedDatabase(), startServer(), appendMessageToSession(), executeMcpTool(), loadSystemSettings(), runBackgroundAITask(), saveSystemSettings() (+6 more)

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.13
Nodes (21): FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView(), ResumeStudioViewProps, ResumeStudioPlugin (+13 more)

### Community 70 - "ImageStudioView.tsx"
Cohesion: 0.17
Nodes (14): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, MODEL_SPECS, registerRoutes(), AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel (+6 more)

### Community 71 - "tradeSimulator.ts"
Cohesion: 0.18
Nodes (19): StockSimulatorPanelProps, getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS (+11 more)

### Community 72 - "backgroundWorker.ts"
Cohesion: 0.43
Nodes (5): executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), listSimulations()

### Community 73 - "ImageStudio/index.ts"
Cohesion: 0.50
Nodes (3): ImageStudioView(), ImageStudioPlugin, manifest

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "serverRegistry.ts"
Cohesion: 0.39
Nodes (5): registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, StudioCastPlugin, manifest, registerRoutes()

### Community 76 - "SpreadsheetStudio.tsx"
Cohesion: 0.50
Nodes (3): DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps

### Community 78 - "registerRoutes5"
Cohesion: 0.32
Nodes (12): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfiles(), getProfilesFilePath(), getQuotaStatus(), getSamplesDirectory(), getSpeechDataDirectory() (+4 more)

### Community 79 - "getDatabaseStatus"
Cohesion: 0.25
Nodes (9): executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), loadSyncHistory(), loadSyncHistoryFromDb(), parseDatabaseMetadata(), persistSyncHistoryInDb() (+1 more)

### Community 81 - "_utils.ts"
Cohesion: 0.11
Nodes (22): generateToken(), SECRET_KEY, pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client (+14 more)

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 83 - "DocNexusDocument"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 84 - "CutoutStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

### Community 90 - "clientRegistry.ts"
Cohesion: 0.11
Nodes (16): CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, CutoutStudioPlugin, manifest, MockupStudioPlugin, manifest, MotionStudioPlugin, manifest (+8 more)

### Community 91 - "MockupStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 92 - "OcrReceiptModal.tsx"
Cohesion: 0.25
Nodes (8): DraftLineItem, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, GSTRate, GSTInvoiceItem, ItemMaster

### Community 93 - "TranscribeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 95 - "MotionStudioView.tsx"
Cohesion: 0.15
Nodes (12): CutoutStudioView(), BackgroundRemoverTool(), MockupStudioTool(), ASPECT_RATIOS, AspectRatioConfig, AspectRatioType, MotionVideoStudioTool(), PRESET_COLORS (+4 more)

### Community 97 - "ref_path"
Cohesion: 0.20
Nodes (6): @tailwindcss/vite@^4.1.14, vite@^6.2.3, vite@^6.2.3, @tailwindcss/vite, vite, PluginManifest

### Community 99 - "FlowDesigner/index.ts"
Cohesion: 0.50
Nodes (3): FlowDesignerView(), FlowDesignerPlugin, manifest

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PdfToolsStudio.tsx`, `src/types.ts`, `indicatorEngine.ts`, `package.json`, `App.tsx`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `StockTrackerView.tsx`, `server.js`, `ConfirmModal.tsx`, `LandingPage.tsx`, `gstEngine.ts`, `backtest/engine.ts`, `DocNexusStudio`, `scannerEngine.ts`, `react`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `Accounting/types.ts`, `PartyCustomer`, `DocNexusStudio`, `lucide-react`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `tradeSimulator.ts`, `SpreadsheetStudio.tsx`, `DocNexusDocument`, `StockTrackerAlertModal.tsx`, `clientRegistry.ts`, `OcrReceiptModal.tsx`, `MotionStudioView.tsx`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `PdfToolsStudio.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11965811965811966 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `PdfToolsStudio.tsx`, `src/types.ts`, `indicatorEngine.ts`, `package.json`, `App.tsx`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `StockTrackerView.tsx`, `server.js`, `ConfirmModal.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `scannerEngine.ts`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `lucide-react`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `tradeSimulator.ts`, `SpreadsheetStudio.tsx`, `DocNexusDocument`, `StockTrackerAlertModal.tsx`, `OcrReceiptModal.tsx`, `MotionStudioView.tsx`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06547619047619048 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `ref_path`, `package.json`, `StockTracker/routes.ts`, `ImageStudioView.tsx`, `server.ts`, `serverRegistry.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `StudioCastCompositor`, `server.js`, `gstEngine.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._