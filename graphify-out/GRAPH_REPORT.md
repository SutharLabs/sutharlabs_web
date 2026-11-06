# Graph Report - website  (2026-11-06)

## Corpus Check
- 190 files · ~381,231 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1264 nodes · 3040 edges · 77 communities (65 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9cee3bba`
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
- serverRegistry.ts
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
- StockTracker/manifest.json
- startServer
- Accounting/manifest.json
- StockTrackerView.tsx
- App.tsx
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
- StockTrackerView
- WorkspacePluginStore.tsx
- tradeSimulator.ts
- ImageStudioView.tsx
- @google/genai
- DocNexus/types.ts
- StorageVaultView.tsx
- MarkdownStudio.tsx
- ImageStudio/index.ts
- OpenLocalWorkspaceModal.tsx
- Accounting/index.ts
- PluginEngine
- DocNexus/index.ts
- StockTracker/index.ts
- motion@^12.23.24
- backgroundWorker.ts
- react-dom
- ChartPatternsPanel.tsx
- technicalindicators
- @types/jszip@^3.4.0
- yahoo-finance2

## God Nodes (most connected - your core abstractions)
1. `react` - 82 edges
2. `lucide-react` - 58 edges
3. `TerminalLog` - 40 edges
4. `getPrismaClient()` - 37 edges
5. `startServer()` - 36 edges
6. `registerRoutes()` - 30 edges
7. `AccountingStorage` - 27 edges
8. `registerRoutes()` - 27 edges
9. `loadTenantData()` - 23 edges
10. `PdfToolsStudio()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `packageAllPlugins()` --calls--> `encryptPluginPackage()`  [EXTRACTED]
  scripts/package-plugins.ts → src/plugins/security/pluginCrypto.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (77 total, 12 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "clientRegistry.ts"
Cohesion: 0.14
Nodes (13): WorkspaceLayout(), MutedMarkdownProps, MutedMarkdownView(), CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, getClientPluginById(), getClientPluginByName(), getClientPluginByRoute() (+5 more)

### Community 2 - "src/types.ts"
Cohesion: 0.07
Nodes (39): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView() (+31 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, better-sqlite3@^12.10.0, jszip@^3.10.2, lucide-react@^0.546.0, multer@^2.1.1, pdf-lib@^1.17.1, pdfjs-dist@^6.4.299, qrcode@^1.5.4 (+18 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview(), createStrategy() (+9 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "serverRegistry.ts"
Cohesion: 0.27
Nodes (7): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, SpeechStudioPlugin, manifest

### Community 8 - "tradeSimulator.ts"
Cohesion: 0.22
Nodes (25): getPrismaClient(), main(), appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteSimulation(), ensureSimulatorStore() (+17 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.26
Nodes (10): detectCandlestickPatterns(), detectGeometricPatterns(), scanChartPatterns(), CandleData, KeyPivotPoint, PatternAction, PatternDirection, PatternType (+2 more)

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
Cohesion: 0.39
Nodes (8): decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive(), resolvePluginArchiveBuffer(), SLPK_MAGIC, SLPK_VERSION

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.15
Nodes (19): @neondatabase/serverless@^1.1.0, ws@^8.21.3, @neondatabase/serverless, ws, runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump() (+11 more)

### Community 17 - "AdminAIChatView.tsx"
Cohesion: 0.19
Nodes (16): AdminAIChatView(), init(), INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels() (+8 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (16): startServer(), BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs() (+8 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "startServer"
Cohesion: 0.22
Nodes (13): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (21): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+13 more)

### Community 24 - "App.tsx"
Cohesion: 0.05
Nodes (51): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+43 more)

### Community 25 - "DocNexusStudio.tsx"
Cohesion: 0.15
Nodes (17): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, FORMAT_TABS (+9 more)

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
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), SpreadsheetStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 35 - "seed.ts"
Cohesion: 0.12
Nodes (16): generateToken(), SECRET_KEY, pg@^8.23.0, @prisma/adapter-neon@^7.9.1, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-neon (+8 more)

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 37 - "react"
Cohesion: 0.10
Nodes (35): lucide-react, react, tesseract.js, PublicToolsHubView(), PublicToolsHubViewProps, CompressImageTool(), ExtractTextTool(), ImageToPdfTool() (+27 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "auth.ts"
Cohesion: 0.23
Nodes (10): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath() (+2 more)

### Community 40 - "ref_path"
Cohesion: 0.22
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 41 - "formatINR"
Cohesion: 0.17
Nodes (17): AccountingView(), DayBookView(), FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView(), GstrReportsViewProps, InvoiceAnalyticsChart() (+9 more)

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (13): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, hashPassword(), app, defaultPlugins, prisma, seedDatabase() (+5 more)

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

### Community 48 - "StockStrategyMarketplace.tsx"
Cohesion: 0.31
Nodes (7): StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, StrategyReview, VerifiedBacktestBadge

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "rateLimiter.ts"
Cohesion: 0.15
Nodes (10): express@^4.21.2, express, errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord (+2 more)

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "strategies/types.ts"
Cohesion: 0.28
Nodes (7): StockScannerPanelProps, UNIVERSE_OPTIONS, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, PRESET_STRATEGIES

### Community 54 - "Accounting/types.ts"
Cohesion: 0.15
Nodes (15): FinancialStatementsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport, BankReconciliationItem, BankReconciliationReport, GSTR3BSummary (+7 more)

### Community 56 - "StockTrackerView"
Cohesion: 0.32
Nodes (8): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), createWatchlistItem(), formatRelativeTime(), formatTickerDisplay(), normalizeTicker(), StockTrackerView()

### Community 57 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 58 - "tradeSimulator.ts"
Cohesion: 0.19
Nodes (18): StockSimulatorPanelProps, getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS (+10 more)

### Community 59 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 60 - "@google/genai"
Cohesion: 0.20
Nodes (6): google-auth-library@^10.9.0, @google/genai@^2.4.0, @prisma/adapter-better-sqlite3@^7.8.0, google-auth-library, @google/genai, @prisma/adapter-better-sqlite3

### Community 61 - "DocNexus/types.ts"
Cohesion: 0.13
Nodes (17): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET (+9 more)

### Community 62 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 63 - "MarkdownStudio.tsx"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 64 - "ImageStudio/index.ts"
Cohesion: 0.50
Nodes (3): ImageStudioView(), ImageStudioPlugin, manifest

### Community 65 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.31
Nodes (7): ExportModal(), ExportModalProps, OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, DocNexusDocument, readDirectoryHandleRecursively(), walk()

### Community 71 - "backgroundWorker.ts"
Cohesion: 0.43
Nodes (5): executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), listSimulations()

### Community 73 - "ChartPatternsPanel.tsx"
Cohesion: 0.67
Nodes (3): ChartPatternsPanel(), ChartPatternsPanelProps, DetectedPattern

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `package.json`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `App.tsx`, `DocNexusStudio.tsx`, `ManageDatabaseView.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `DocNexusStudio`, `formatINR`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `StockStrategyMarketplace.tsx`, `strategies/types.ts`, `Accounting/types.ts`, `WorkspacePluginStore.tsx`, `tradeSimulator.ts`, `ImageStudioView.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `MarkdownStudio.tsx`, `OpenLocalWorkspaceModal.tsx`, `ChartPatternsPanel.tsx`?**
  _High betweenness centrality (0.262) - this node is a cross-community bridge._
- **Should `clientRegistry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `package.json`, `AccountingView.tsx`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `App.tsx`, `DocNexusStudio.tsx`, `ManageDatabaseView.tsx`, `backtest/engine.ts`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `StockStrategyMarketplace.tsx`, `strategies/types.ts`, `WorkspacePluginStore.tsx`, `tradeSimulator.ts`, `ImageStudioView.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `MarkdownStudio.tsx`, `OpenLocalWorkspaceModal.tsx`, `ChartPatternsPanel.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07358156028368794 - nodes in this community are weakly interconnected._
- **Why does `express` connect `rateLimiter.ts` to `PluginEngine`, `DocNexus/storage.ts`, `StockTracker/routes.ts`, `auth.ts`, `serverRegistry.ts`, `package.json`, `server.ts`, `SpeechStudioView.tsx`, `telemetryService.ts`, `Accounting/storage.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._