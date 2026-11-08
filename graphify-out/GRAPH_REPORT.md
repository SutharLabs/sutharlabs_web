# Graph Report - website  (2026-11-08)

## Corpus Check
- 207 files · ~419,817 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1639 nodes · 3963 edges · 88 communities (77 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0dfb803`
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
- pdfjs-dist
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
- FlowDesigner/index.ts
- express
- react
- server.ts
- _utils.ts
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
- @prisma/adapter-better-sqlite3@^7.8.0
- WorkspacePluginStore.tsx
- startServer
- ResumeEngine.tsx
- CanvasStudio.tsx
- exchangeCalendar.ts
- ImageStudioView.tsx
- pdf-lib
- getInvoices
- serverRegistry.ts
- vaultStorage.ts
- vite
- registerRoutes5
- getDatabaseStatus
- yahoo-finance2
- StudioCast/manifest.json
- @react-oauth/google
- OpenLocalWorkspaceModal.tsx
- @google/genai
- getMarketSessionStatus
- @types/pg@^8.21.0
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
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `getUserIdentifierAndRole()` --calls--> `verifyToken()`  [EXTRACTED]
  src/plugins/SpeechStudio/routes.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (88 total, 11 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "clientRegistry.ts"
Cohesion: 0.14
Nodes (13): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, SpeechStudioPlugin, manifest (+5 more)

### Community 2 - "src/types.ts"
Cohesion: 0.09
Nodes (31): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView() (+23 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1, @neondatabase/serverless@^1.1.0, pg@^8.23.0 (+23 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview(), createStrategy() (+9 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.13
Nodes (40): getPrismaClient(), main(), StockSimulatorPanelProps, executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), appendHistoryReport() (+32 more)

### Community 8 - "App.tsx"
Cohesion: 0.09
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
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "StudioCastCompositor"
Cohesion: 0.10
Nodes (14): StudioCastView(), ParticipantStreamSource, StudioCastCompositor, chatStore, recordingsStore, roomsStore, signalQueue, IsoRecordingTrack (+6 more)

### Community 15 - "pdfjs-dist"
Cohesion: 0.20
Nodes (6): pdfjs-dist@^6.4.299, react-dom@^19.0.1, technicalindicators@^3.1.0, pdfjs-dist, react-dom, technicalindicators

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
Cohesion: 0.13
Nodes (15): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, defaultPlugins, hashPassword(), seed(), PluginManifest, decryptPluginPackage() (+7 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.05
Nodes (32): StockSimulatorPanel(), StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, Analysis, Candle (+24 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.14
Nodes (23): StockScannerPanel(), StockScannerPanelProps, UNIVERSE_OPTIONS, AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory() (+15 more)

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.12
Nodes (16): ConfirmModal(), ConfirmModalProps, ModalVariant, FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode (+8 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "LandingPage.tsx"
Cohesion: 0.18
Nodes (14): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+6 more)

### Community 29 - "Accounting/storage.ts"
Cohesion: 0.12
Nodes (23): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), PartyMasterView(), PartyMasterViewProps, amountInWordsIndian(), convertThreeDigits(), convertTwoDigits() (+15 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.15
Nodes (26): StockBacktestPanel(), StockBacktestPanelProps, fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams (+18 more)

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
Cohesion: 0.07
Nodes (39): tesseract.js@^7.0.0, tesseract.js, PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool() (+31 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "FlowDesigner/index.ts"
Cohesion: 0.50
Nodes (3): FlowDesignerView(), FlowDesignerPlugin, manifest

### Community 40 - "express"
Cohesion: 0.15
Nodes (10): express@^4.21.2, express, errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord (+2 more)

### Community 41 - "react"
Cohesion: 0.19
Nodes (19): react, AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView() (+11 more)

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (13): BACKEND_TARGET, config, handler(), maxDuration, ORACLE_BACKEND_URL, app, defaultPlugins, prisma (+5 more)

### Community 43 - "_utils.ts"
Cohesion: 0.19
Nodes (12): generateToken(), SECRET_KEY, verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin() (+4 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.12
Nodes (33): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, SpeechStudioView() (+25 more)

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
Cohesion: 0.13
Nodes (12): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot, LogLevel (+4 more)

### Community 58 - "OcrReceiptModal.tsx"
Cohesion: 0.19
Nodes (17): CreateInvoiceDrawerProps, DraftLineItem, InvoiceAnalyticsChartProps, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, OcrReceiptModal() (+9 more)

### Community 59 - "getPrismaClient"
Cohesion: 0.18
Nodes (30): appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteJsonData(), deleteSimulation(), detectMarketRegion(), ensureSimulatorStore() (+22 more)

### Community 60 - "deploy-production.ts"
Cohesion: 0.18
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

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "serverRegistry.ts"
Cohesion: 0.24
Nodes (9): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, StudioCastPlugin, manifest, getOrCreateRoom() (+1 more)

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

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 84 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `tradeSimulator.ts`, `App.tsx`, `package.json`, `patterns/types.ts`, `StudioCastCompositor`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `server.js`, `scannerEngine.ts`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `DocNexusStudio`, `PdfToolsStudio.tsx`, `SpeechStudioView.tsx`, `Accounting/types.ts`, `BugReportModal.tsx`, `OcrReceiptModal.tsx`, `SlideDeckStudio.tsx`, `StorageVaultView.tsx`, `lucide-react`, `DocNexusStudio.tsx`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `CanvasStudio.tsx`, `ImageStudioView.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.263) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `clientRegistry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13675213675213677 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `tradeSimulator.ts`, `App.tsx`, `package.json`, `patterns/types.ts`, `StudioCastCompositor`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `server.js`, `scannerEngine.ts`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `PdfToolsStudio.tsx`, `SpeechStudioView.tsx`, `BugReportModal.tsx`, `OcrReceiptModal.tsx`, `SlideDeckStudio.tsx`, `StorageVaultView.tsx`, `DocNexusStudio.tsx`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `CanvasStudio.tsx`, `ImageStudioView.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08819345661450925 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `DocNexus/storage.ts`, `StockTracker/routes.ts`, `package.json`, `server.ts`, `_utils.ts`, `serverRegistry.ts`, `StudioCastCompositor`, `SpeechStudioView.tsx`, `_utils.ts`, `server.js`, `telemetryService.ts`, `Accounting/storage.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._