# Graph Report - website  (2026-11-09)

## Corpus Check
- 210 files · ~441,693 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1720 nodes · 4122 edges · 84 communities (77 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a8dd585`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- clientRegistry.ts
- src/types.ts
- indicatorEngine.ts
- package.json
- StockTracker/routes.ts
- SovereignTools/manifest.json
- tradeSimulator.ts
- react
- UnifiedInferenceQueueManager
- patterns/types.ts
- sentimentEngine.ts
- documentParsers.ts
- StudioCastCompositor
- TelemetryLoggerService
- Accounting/routes.ts
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
- BugReportModal.tsx
- OcrReceiptModal.tsx
- getPrismaClient
- deploy-production.ts
- WorkspaceLayout
- pluginLogger.ts
- lucide-react
- PluginLogger
- unifiedInferenceQueue.ts
- WorkspacePluginStore.tsx
- backgroundWorker.ts
- ResumeEngine.tsx
- ImageStudioView.tsx
- StockSimulatorPanel.tsx
- ImageStudio/index.ts
- Accounting/index.ts
- getInvoices
- serverRegistry.ts
- DocNexusStudio.tsx
- ref_path
- registerRoutes5
- getDatabaseStatus
- _utils.ts
- StudioCast/manifest.json
- getMarketSessionStatus
- FlowDesignerView.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 87 edges
2. `lucide-react` - 64 edges
3. `registerRoutes()` - 46 edges
4. `TerminalLog` - 42 edges
5. `startServer()` - 39 edges
6. `getPrismaClient()` - 39 edges
7. `startServer()` - 35 edges
8. `registerRoutes()` - 30 edges
9. `AccountingStorage` - 27 edges
10. `registerRoutes()` - 26 edges

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

## Communities (84 total, 7 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "clientRegistry.ts"
Cohesion: 0.10
Nodes (19): FlowDesignerView(), CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, getClientPluginById(), getClientPluginByName(), getClientPluginByRoute(), DocNexusPlugin, manifest (+11 more)

### Community 2 - "src/types.ts"
Cohesion: 0.08
Nodes (35): AdminAIChatViewProps, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView(), ManageProps, BugReportItem, BugReportsStats, ManageBugReportsProps (+27 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.14
Nodes (24): lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner(), calculateSupertrend() (+16 more)

### Community 4 - "package.json"
Cohesion: 0.04
Nodes (78): dependencies, better-sqlite3@^12.10.0, dotenv@^16.4.5, google-auth-library@^10.9.0, @google/genai@^2.4.0, jszip@^3.10.2, lightweight-charts@^5.2.1, lucide-react@^0.546.0 (+70 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): loadWatchlistsFromDisk(), logger, registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+9 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.15
Nodes (38): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+30 more)

### Community 8 - "react"
Cohesion: 0.11
Nodes (25): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+17 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.13
Nodes (22): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+14 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.13
Nodes (26): pdfjs-dist@^6.4.299, pdfjs-dist, DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps, SheetColumn, SheetRow, SpreadsheetState (+18 more)

### Community 13 - "StudioCastCompositor"
Cohesion: 0.10
Nodes (15): StudioCastView(), ParticipantStreamSource, StudioCastCompositor, chatStore, logger, recordingsStore, roomsStore, signalQueue (+7 more)

### Community 15 - "Accounting/routes.ts"
Cohesion: 0.25
Nodes (8): CompanySettingsModal(), CompanySettingsModalProps, PartyMasterView(), PartyMasterViewProps, COMMON_HSN_SAC_CATALOG, INDIAN_GST_STATES, validateGSTIN(), getUserEmail()

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.19
Nodes (17): getPrismaClient(), runCronSync(), main(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus() (+9 more)

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

### Community 21 - "StorageVaultView.tsx"
Cohesion: 0.28
Nodes (14): CATEGORIES, StorageVaultView(), completeChunkedUpload(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl() (+6 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.05
Nodes (32): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, Analysis (+24 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.23
Nodes (16): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+8 more)

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.13
Nodes (14): AdminConsoleProps, FleetTelemetry, IncidentAlert, NodeServiceStatus, NodeTelemetry, SystemTelemetry, ConfirmModalProps, ModalVariant (+6 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.18
Nodes (13): FleetTelemetry, formatUptime(), getCpuSnapshot(), getFleetTelemetry(), getRequestMetrics(), getSystemTelemetry(), IncidentAlert, lastCpuSample (+5 more)

### Community 28 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 29 - "Accounting/storage.ts"
Cohesion: 0.15
Nodes (20): CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), determineSupplyType(), generateEInvoiceIRN(), generateSignedQrPayload() (+12 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.17
Nodes (21): fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics (+13 more)

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
Cohesion: 0.14
Nodes (16): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal() (+8 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "SpeechStudio/storage.ts"
Cohesion: 0.32
Nodes (15): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfileAsync(), getClonedVoiceProfiles(), getClonedVoiceProfilesAsync(), getProfilesFilePath(), getSamplesDirectory() (+7 more)

### Community 37 - "PdfToolsStudio.tsx"
Cohesion: 0.08
Nodes (41): tesseract.js@^7.0.0, lucide-react, react, tesseract.js, PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool() (+33 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "scannerEngine.ts"
Cohesion: 0.17
Nodes (15): StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockStrategyMarketplaceProps, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload (+7 more)

### Community 40 - "express"
Cohesion: 0.09
Nodes (22): verifyToken(), express@^4.21.2, express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin() (+14 more)

### Community 41 - "react"
Cohesion: 0.17
Nodes (20): AccountingView(), AccountingViewProps, DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView() (+12 more)

### Community 42 - "server.ts"
Cohesion: 0.06
Nodes (27): BACKEND_TARGET, config, handler(), maxDuration, ORACLE_BACKEND_URL, hashPassword(), app, defaultPlugins (+19 more)

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
Nodes (20): CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SLIDES (+12 more)

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
Cohesion: 0.15
Nodes (16): FinancialStatementsViewProps, GstrReportsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport, BankReconciliationItem, BankReconciliationReport (+8 more)

### Community 56 - "ResumeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 57 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 58 - "OcrReceiptModal.tsx"
Cohesion: 0.20
Nodes (16): CreateInvoiceDrawerProps, DraftLineItem, InvoiceAnalyticsChartProps, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, OcrReceiptModal() (+8 more)

### Community 59 - "getPrismaClient"
Cohesion: 0.18
Nodes (30): appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteJsonData(), deleteSimulation(), detectMarketRegion(), ensureSimulatorStore() (+22 more)

### Community 60 - "deploy-production.ts"
Cohesion: 0.18
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "WorkspaceLayout"
Cohesion: 0.17
Nodes (7): WorkspaceLayout(), AdminConsoleView(), ConfirmModal(), ErrorBoundary, ManageDatabaseView(), MutedMarkdownProps, MutedMarkdownView()

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

### Community 67 - "backgroundWorker.ts"
Cohesion: 0.36
Nodes (5): executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), listSimulations()

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.14
Nodes (20): jszip, FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView(), ResumeStudioViewProps (+12 more)

### Community 70 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 71 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 72 - "ImageStudio/index.ts"
Cohesion: 0.50
Nodes (3): ImageStudioView(), ImageStudioPlugin, manifest

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "serverRegistry.ts"
Cohesion: 0.24
Nodes (9): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, StudioCastPlugin, manifest, getOrCreateRoom() (+1 more)

### Community 76 - "DocNexusStudio.tsx"
Cohesion: 0.17
Nodes (19): DocNexusView(), DocNexusViewProps, CanvasStudio(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, InspectorPanel(), FORMAT_ICONS (+11 more)

### Community 77 - "ref_path"
Cohesion: 0.20
Nodes (6): @tailwindcss/vite@^4.1.14, vite@^6.2.3, vite@^6.2.3, @tailwindcss/vite, vite, PluginManifest

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

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

### Community 90 - "FlowDesignerView.tsx"
Cohesion: 0.29
Nodes (6): FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode, WorkflowTemplate

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `PdfToolsStudio.tsx` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `package.json`, `react`, `patterns/types.ts`, `documentParsers.ts`, `StudioCastCompositor`, `Accounting/routes.ts`, `AdminAIChatView.tsx`, `StorageVaultView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `scannerEngine.ts`, `react`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `Accounting/types.ts`, `BugReportModal.tsx`, `OcrReceiptModal.tsx`, `WorkspaceLayout`, `lucide-react`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `DocNexusStudio.tsx`, `FlowDesignerView.tsx`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `clientRegistry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10160427807486631 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `PdfToolsStudio.tsx` to `src/types.ts`, `indicatorEngine.ts`, `package.json`, `react`, `patterns/types.ts`, `documentParsers.ts`, `StudioCastCompositor`, `AdminAIChatView.tsx`, `StorageVaultView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `scannerEngine.ts`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `BugReportModal.tsx`, `OcrReceiptModal.tsx`, `lucide-react`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `DocNexusStudio.tsx`, `FlowDesignerView.tsx`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08246225319396051 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `package.json`, `StockTracker/routes.ts`, `server.ts`, `serverRegistry.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `ref_path`, `Accounting/routes.ts`, `StudioCastCompositor`, `server.js`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._