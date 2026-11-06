# Graph Report - website  (2026-11-06)

## Corpus Check
- 173 files · ~350,018 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1180 nodes · 2845 edges · 68 communities (63 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8fcae8d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- App.tsx
- TerminalLog
- indicatorEngine.ts
- dependencies
- StockTracker/routes.ts
- serverRegistry.ts
- clientRegistry.ts
- tradeSimulator.ts
- package.json
- patterns/types.ts
- sentimentEngine.ts
- documentParsers.ts
- FlowDesignerView.tsx
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- AdminAIChatView.tsx
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- startServer
- StockTracker/manifest.json
- StockTrackerView.tsx
- BugReportModal.tsx
- DocNexusDocument
- StorageVaultView.tsx
- telemetryService.ts
- StockAnalyzer/index.ts
- Accounting/manifest.json
- backtest/engine.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- DocNexus/types.ts
- seed.ts
- DocNexus/storage.ts
- vite
- scripts
- express
- ImageStudioView.tsx
- DocNexusStudio.tsx
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- dotenv
- SpeechStudioView.tsx
- vercel.json
- MarkdownStudio.tsx
- ImageStudio/manifest.json
- deploy.sh
- auth.ts
- audioSynth.ts
- strategies/types.ts
- strategies/types.ts
- StockTrackerView
- WorkspacePluginStore.tsx
- StockSimulatorPanel.tsx
- exchangeCalendar.ts
- backgroundWorker.ts
- SlideDeckStudio.tsx
- strategies/engine.ts
- storageUtils.ts
- FlowDesigner/index.ts
- OpenLocalWorkspaceModal.tsx
- StockTracker/index.ts
- ref_fs

## God Nodes (most connected - your core abstractions)
1. `react` - 69 edges
2. `lucide-react` - 45 edges
3. `TerminalLog` - 38 edges
4. `startServer()` - 36 edges
5. `getPrismaClient()` - 35 edges
6. `registerRoutes()` - 30 edges
7. `registerRoutes()` - 27 edges
8. `AccountingStorage` - 27 edges
9. `loadTenantData()` - 23 edges
10. `runEODSimulation()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `registerRoutes()` --calls--> `getPrismaClient()`  [EXTRACTED]
  src/plugins/StockTracker/routes.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (68 total, 5 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "App.tsx"
Cohesion: 0.09
Nodes (29): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+21 more)

### Community 2 - "TerminalLog"
Cohesion: 0.07
Nodes (42): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, DocNexusView() (+34 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (31): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1, pdfjs-dist@^6.4.299 (+23 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview(), createStrategy() (+9 more)

### Community 6 - "serverRegistry.ts"
Cohesion: 0.27
Nodes (7): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, SpeechStudioPlugin, manifest

### Community 7 - "clientRegistry.ts"
Cohesion: 0.17
Nodes (11): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, ImageStudioPlugin, manifest (+3 more)

### Community 8 - "tradeSimulator.ts"
Cohesion: 0.25
Nodes (27): getPrismaClient(), main(), calculateRegionalFriction(), detectMarketRegion(), appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance() (+19 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.21
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.13
Nodes (22): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+14 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.20
Nodes (18): colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX(), parseRTF() (+10 more)

### Community 13 - "FlowDesignerView.tsx"
Cohesion: 0.33
Nodes (5): FlowDesignerViewProps, TEMPLATES, WorkflowConnection, WorkflowNode, WorkflowTemplate

### Community 15 - "_utils.ts"
Cohesion: 0.18
Nodes (13): generateToken(), SECRET_KEY, IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey() (+5 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.13
Nodes (21): @neondatabase/serverless@^1.1.0, @prisma/adapter-neon@^7.9.1, ws@^8.21.3, @neondatabase/serverless, @prisma/adapter-neon, ws, runCronSync(), DatabaseSyncHistoryEntry (+13 more)

### Community 17 - "AdminAIChatView.tsx"
Cohesion: 0.19
Nodes (16): AdminAIChatView(), init(), INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels() (+8 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.21
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "startServer"
Cohesion: 0.16
Nodes (12): hashPassword(), seedDatabase(), startServer(), PluginEngine, BlobUploadOptions, deleteFromBlob(), fetchJsonBlob(), isBlobConfigured() (+4 more)

### Community 22 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.07
Nodes (19): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+11 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.13
Nodes (13): BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot (+5 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.23
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument (+2 more)

### Community 26 - "StorageVaultView.tsx"
Cohesion: 0.14
Nodes (21): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+13 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "StockAnalyzer/index.ts"
Cohesion: 0.20
Nodes (18): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+10 more)

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.25
Nodes (13): fetchHistoricalBacktestBars(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics, BacktestReport, BacktestRequest, ExecutionFillModel (+5 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "DocNexus/types.ts"
Cohesion: 0.18
Nodes (12): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SHEET, SpreadsheetStudioProps, DocNexusMetadata, DocNexusStudioProps, RichDocPage (+4 more)

### Community 35 - "seed.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 37 - "vite"
Cohesion: 0.22
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "express"
Cohesion: 0.15
Nodes (10): express@^4.21.2, express, errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord (+2 more)

### Community 40 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 41 - "DocNexusStudio.tsx"
Cohesion: 0.20
Nodes (18): CommandPaletteModal(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, ExportModal(), SpreadsheetStudio(), FORMAT_ICONS, TemplateLibraryModal() (+10 more)

### Community 42 - "server.ts"
Cohesion: 0.09
Nodes (11): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise, upload (+3 more)

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
Nodes (32): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, SpeechStudioView() (+24 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "MarkdownStudio.tsx"
Cohesion: 0.31
Nodes (7): lucide-react, MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "auth.ts"
Cohesion: 0.23
Nodes (10): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath() (+2 more)

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "strategies/types.ts"
Cohesion: 0.20
Nodes (12): StockBacktestPanelProps, StockScannerPanel(), StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, StockStrategyMarketplaceProps, ScannerCandidate, ScannerFilterOptions (+4 more)

### Community 54 - "strategies/types.ts"
Cohesion: 0.27
Nodes (8): StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, StrategyIndicatorType, StrategyParameter, StrategyReview, VerifiedBacktestBadge

### Community 56 - "StockTrackerView"
Cohesion: 0.38
Nodes (7): StockBacktestPanel(), StockSimulatorPanel(), createWatchlistItem(), formatRelativeTime(), formatTickerDisplay(), normalizeTicker(), StockTrackerView()

### Community 57 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 58 - "StockSimulatorPanel.tsx"
Cohesion: 0.36
Nodes (8): PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate, SimulationRegistryEntry

### Community 59 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 60 - "backgroundWorker.ts"
Cohesion: 0.36
Nodes (5): executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), listSimulations()

### Community 61 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 62 - "strategies/engine.ts"
Cohesion: 0.33
Nodes (5): calculateSentimentConfluence(), calculateSupertrend(), CandleData, QuoteData, StrategySignal

### Community 63 - "storageUtils.ts"
Cohesion: 0.53
Nodes (5): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob()

### Community 64 - "FlowDesigner/index.ts"
Cohesion: 0.50
Nodes (3): FlowDesignerView(), FlowDesignerPlugin, manifest

### Community 65 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.tsx`, `TerminalLog`, `indicatorEngine.ts`, `dependencies`, `clientRegistry.ts`, `package.json`, `patterns/types.ts`, `FlowDesignerView.tsx`, `AdminAIChatView.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `StorageVaultView.tsx`, `backtest/engine.ts`, `DocNexus/types.ts`, `ImageStudioView.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `MarkdownStudio.tsx`, `strategies/types.ts`, `strategies/types.ts`, `WorkspacePluginStore.tsx`, `StockSimulatorPanel.tsx`, `SlideDeckStudio.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `MarkdownStudio.tsx` to `App.tsx`, `TerminalLog`, `indicatorEngine.ts`, `dependencies`, `package.json`, `patterns/types.ts`, `FlowDesignerView.tsx`, `AdminAIChatView.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `StorageVaultView.tsx`, `backtest/engine.ts`, `DocNexus/types.ts`, `ImageStudioView.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `strategies/types.ts`, `strategies/types.ts`, `WorkspacePluginStore.tsx`, `StockSimulatorPanel.tsx`, `SlideDeckStudio.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09388335704125178 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `react`, `ref_fs`, `DocNexus/storage.ts`, `StockTracker/routes.ts`, `serverRegistry.ts`, `package.json`, `server.ts`, `SpeechStudioView.tsx`, `auth.ts`, `telemetryService.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.06823529411764706 - nodes in this community are weakly interconnected._