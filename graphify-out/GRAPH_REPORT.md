# Graph Report - website  (2026-11-07)

## Corpus Check
- 207 files · ~418,236 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1632 nodes · 3948 edges · 87 communities (75 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4132f65d`
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
- registerRoutes3
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
- formatINR
- server.ts
- @types/pg@^8.21.0
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
- AccountingView.tsx
- getPrismaClient
- deploy-production.ts
- DocNexus/types.ts
- StorageVaultView.tsx
- lucide-react
- DocNexusStudio.tsx
- scannerEngine.ts
- WorkspacePluginStore.tsx
- PluginEngine
- ResumeEngine.tsx
- CanvasStudio.tsx
- exchangeCalendar.ts
- ImageStudioView.tsx
- ItemMaster
- FlowDesigner/index.ts
- serverRegistry.ts
- DocNexus/index.ts
- vite
- registerRoutes5
- getDatabaseStatus
- multer
- @prisma/adapter-better-sqlite3@^7.8.0
- StudioCast/manifest.json
- OpenLocalWorkspaceModal.tsx
- yahoo-finance2
- @react-oauth/google
- @types/jszip@^3.4.0

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
- `startServer()` --calls--> `PluginEngine`  [EXTRACTED]
  server.ts → src/plugins/PluginEngine.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (87 total, 12 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "clientRegistry.ts"
Cohesion: 0.14
Nodes (13): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, ImageStudioPlugin, manifest, SpeechStudioPlugin, manifest (+5 more)

### Community 2 - "src/types.ts"
Cohesion: 0.08
Nodes (33): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView() (+25 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.14
Nodes (24): lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner(), calculateSupertrend() (+16 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, better-sqlite3@^12.10.0, dotenv@^16.4.5, google-auth-library@^10.9.0, @google/genai@^2.4.0, lightweight-charts@^5.2.1, lucide-react@^0.546.0, motion@^12.23.24 (+21 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): KNOWN_US_TICKERS, loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+9 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.16
Nodes (34): executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance() (+26 more)

### Community 8 - "App.tsx"
Cohesion: 0.08
Nodes (32): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+24 more)

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

### Community 13 - "StudioCastCompositor"
Cohesion: 0.11
Nodes (14): StudioCastView(), ParticipantStreamSource, StudioCastCompositor, chatStore, recordingsStore, roomsStore, signalQueue, IsoRecordingTrack (+6 more)

### Community 15 - "_utils.ts"
Cohesion: 0.26
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.11
Nodes (29): generateToken(), getPrismaClient(), SECRET_KEY, dotenv, @neondatabase/serverless, pg, @prisma/adapter-neon, @prisma/adapter-pg (+21 more)

### Community 17 - "AdminAIChatView.tsx"
Cohesion: 0.13
Nodes (24): AdminAIChatView(), init(), INITIAL_PROMPTS, MarkdownMessage(), AGENT_PERSONAS, fetchAIHealth(), fetchAIModels(), OllamaModelTag (+16 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "registerRoutes3"
Cohesion: 0.11
Nodes (25): authenticateToken(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDefaultUserNodes(), getDocument(), getLegacyDocument() (+17 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.05
Nodes (34): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState (+26 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (41): analyzeAutonomousFallback(), analyzeStockSentiment(), buildRegionalQueries(), cleanRssText(), decodeHtmlEntities(), detectCandlestickPatterns(), detectCatalyst(), detectGeometricPatterns() (+33 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.28
Nodes (14): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+6 more)

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.11
Nodes (17): ConfirmModal(), ConfirmModalProps, ModalVariant, FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode (+9 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "LandingPage.tsx"
Cohesion: 0.16
Nodes (15): react, ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage() (+7 more)

### Community 29 - "Accounting/storage.ts"
Cohesion: 0.13
Nodes (23): CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), COMMON_HSN_SAC_CATALOG, determineSupplyType(), generateEInvoiceIRN() (+15 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.15
Nodes (25): StockBacktestPanelProps, fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint (+17 more)

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
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument (+2 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (35): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createInitialSimulatorState(), createSimulationInstance(), createStrategy(), deleteStrategy() (+27 more)

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 37 - "PdfToolsStudio.tsx"
Cohesion: 0.07
Nodes (39): tesseract.js@^7.0.0, tesseract.js, PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool() (+31 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "express"
Cohesion: 0.10
Nodes (20): verifyToken(), express@^4.21.2, express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin() (+12 more)

### Community 40 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 41 - "formatINR"
Cohesion: 0.23
Nodes (14): AccountingView(), DayBookView(), FinancialStatementsView(), GeneralLedgerView(), GstrReportsView(), InvoiceAnalyticsChart(), InvoiceAnalyticsChartProps, ItemCatalogView() (+6 more)

### Community 42 - "server.ts"
Cohesion: 0.09
Nodes (12): BACKEND_TARGET, config, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise (+4 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.12
Nodes (32): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, SpeechStudioView() (+24 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "startServer"
Cohesion: 0.21
Nodes (13): hashPassword(), seedDatabase(), startServer(), loadSystemSettings(), saveSystemSettings(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

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
Nodes (18): FinancialStatementsViewProps, GeneralLedgerViewProps, GstrReportsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport, BankReconciliationItem (+10 more)

### Community 56 - "ResumeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 57 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 58 - "AccountingView.tsx"
Cohesion: 0.16
Nodes (19): pdfjs-dist@^6.4.299, pdfjs-dist, CompanySettingsModal(), CompanySettingsModalProps, DayBookViewProps, EXPENSE_CATEGORIES, OcrReceiptData, OcrReceiptModal() (+11 more)

### Community 59 - "getPrismaClient"
Cohesion: 0.18
Nodes (29): appendHistoryReport(), closeEODPosition(), deleteJsonData(), deleteSimulation(), detectMarketRegion(), ensureSimulatorStore(), executeAutomationCycle(), getEODHistory() (+21 more)

### Community 60 - "deploy-production.ts"
Cohesion: 0.16
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "DocNexus/types.ts"
Cohesion: 0.13
Nodes (17): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET (+9 more)

### Community 62 - "StorageVaultView.tsx"
Cohesion: 0.28
Nodes (14): CATEGORIES, StorageVaultView(), completeChunkedUpload(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl() (+6 more)

### Community 63 - "lucide-react"
Cohesion: 0.31
Nodes (7): lucide-react, MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 64 - "DocNexusStudio.tsx"
Cohesion: 0.16
Nodes (20): DocNexusView(), DocNexusViewProps, CommandPaletteModal(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, ExportModal(), SpreadsheetStudio() (+12 more)

### Community 65 - "scannerEngine.ts"
Cohesion: 0.25
Nodes (8): StockScannerPanelProps, UNIVERSE_OPTIONS, MARKET_UNIVERSES, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, PRESET_STRATEGIES

### Community 66 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.12
Nodes (23): jszip@^3.10.2, jszip, FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView() (+15 more)

### Community 70 - "CanvasStudio.tsx"
Cohesion: 0.22
Nodes (9): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, CanvasElement, CanvasSceneState (+1 more)

### Community 71 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 72 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 73 - "ItemMaster"
Cohesion: 0.32
Nodes (7): CreateInvoiceDrawerProps, DraftLineItem, ItemCatalogViewProps, OcrExtractedLineItem, GSTRate, GSTInvoiceItem, ItemMaster

### Community 74 - "FlowDesigner/index.ts"
Cohesion: 0.50
Nodes (3): FlowDesignerView(), FlowDesignerPlugin, manifest

### Community 75 - "serverRegistry.ts"
Cohesion: 0.24
Nodes (9): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, StudioCastPlugin, manifest, getOrCreateRoom() (+1 more)

### Community 77 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 78 - "registerRoutes5"
Cohesion: 0.32
Nodes (12): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfiles(), getProfilesFilePath(), getQuotaStatus(), getSamplesDirectory(), getSpeechDataDirectory() (+4 more)

### Community 79 - "getDatabaseStatus"
Cohesion: 0.25
Nodes (9): executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), loadSyncHistory(), loadSyncHistoryFromDb(), parseDatabaseMetadata(), persistSyncHistoryInDb() (+1 more)

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 84 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 86 - "@react-oauth/google"
Cohesion: 0.20
Nodes (6): pdf-lib@^1.17.1, @react-oauth/google@^0.13.5, @types/ws@^8.18.1, pdf-lib, @react-oauth/google, @types/ws

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `LandingPage.tsx` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `package.json`, `patterns/types.ts`, `StudioCastCompositor`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `DocNexusStudio`, `PdfToolsStudio.tsx`, `StockSimulatorPanel.tsx`, `formatINR`, `SpeechStudioView.tsx`, `Accounting/types.ts`, `BugReportModal.tsx`, `AccountingView.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `lucide-react`, `DocNexusStudio.tsx`, `scannerEngine.ts`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `CanvasStudio.tsx`, `ImageStudioView.tsx`, `ItemMaster`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `clientRegistry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13675213675213677 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `package.json`, `patterns/types.ts`, `StudioCastCompositor`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `PdfToolsStudio.tsx`, `StockSimulatorPanel.tsx`, `SpeechStudioView.tsx`, `BugReportModal.tsx`, `AccountingView.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `DocNexusStudio.tsx`, `scannerEngine.ts`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `CanvasStudio.tsx`, `ImageStudioView.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08205128205128205 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `PluginEngine`, `DocNexus/storage.ts`, `StockTracker/routes.ts`, `package.json`, `server.ts`, `serverRegistry.ts`, `StudioCastCompositor`, `SpeechStudioView.tsx`, `server.js`, `telemetryService.ts`, `Accounting/storage.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._