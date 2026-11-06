# Graph Report - website  (2026-11-06)

## Corpus Check
- 165 files · ~339,047 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1126 nodes · 2786 edges · 59 communities (52 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e43396e`
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
- fetcher.ts
- package.json
- StorageVaultView.tsx
- sentimentEngine.ts
- documentParsers.ts
- SpreadsheetStudio.tsx
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- DocNexus/storage.ts
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- startServer
- StockTracker/manifest.json
- StockTrackerView.tsx
- BugReportModal.tsx
- DocNexusDocument
- AdminAIChatView.tsx
- telemetryService.ts
- @google/genai
- Accounting/manifest.json
- backtest/engine.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- SlideDeckStudio.tsx
- seed.ts
- serverRegistry.ts
- DocNexus/index.ts
- scripts
- WorkspacePluginStore.tsx
- ImageStudioView.tsx
- DocNexusStudio
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- dotenv
- SpeechStudioView.tsx
- vercel.json
- multer
- ImageStudio/manifest.json
- deploy.sh
- @types/pg@^8.21.0
- audioSynth.ts
- strategies/types.ts
- SpeechStudio/index.ts
- StockTrackerView
- ref_fs
- OpenLocalWorkspaceModal.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 68 edges
2. `registerRoutes()` - 44 edges
3. `lucide-react` - 43 edges
4. `TerminalLog` - 38 edges
5. `getPrismaClient()` - 35 edges
6. `startServer()` - 34 edges
7. `registerRoutes()` - 30 edges
8. `AccountingStorage` - 27 edges
9. `loadTenantData()` - 23 edges
10. `runEODSimulation()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --calls--> `PluginEngine`  [EXTRACTED]
  server.ts → src/plugins/PluginEngine.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (59 total, 7 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "App.tsx"
Cohesion: 0.09
Nodes (30): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+22 more)

### Community 2 - "TerminalLog"
Cohesion: 0.08
Nodes (33): AccountingViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, FlowDesignerViewProps, initialNodes (+25 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.10
Nodes (31): lightweight-charts, lucide-react, MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps (+23 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, better-sqlite3@^12.10.0, lightweight-charts@^5.2.1, lucide-react@^0.546.0, motion@^12.23.24, @neondatabase/serverless@^1.1.0, pdfjs-dist@^6.4.299, @prisma/adapter-neon@^7.9.1 (+22 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.07
Nodes (92): getPrismaClient(), main(), StockSimulatorPanelProps, optionalAuth(), AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol() (+84 more)

### Community 6 - "serverRegistry.ts"
Cohesion: 0.22
Nodes (9): manifest, ImageStudioView(), ImageStudioPlugin, manifest, MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes() (+1 more)

### Community 7 - "clientRegistry.ts"
Cohesion: 0.17
Nodes (11): FlowDesignerView(), AccountingPlugin, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, FlowDesignerPlugin, manifest, StockTrackerPlugin, manifest (+3 more)

### Community 8 - "fetcher.ts"
Cohesion: 0.30
Nodes (11): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+3 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (30): vite@^6.2.3, devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13 (+22 more)

### Community 10 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.18
Nodes (14): analyzeAutonomousFallback(), BEARISH_LEXICON, BULLISH_LEXICON, calculateSentimentConfluence(), detectCatalyst(), SENTIMENT_CACHE, SentimentCacheEntry, HeadlineSentimentAnalysis (+6 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "SpreadsheetStudio.tsx"
Cohesion: 0.50
Nodes (3): DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps

### Community 15 - "_utils.ts"
Cohesion: 0.18
Nodes (13): generateToken(), SECRET_KEY, IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey() (+5 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (14): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+6 more)

### Community 21 - "startServer"
Cohesion: 0.19
Nodes (13): hashPassword(), seedDatabase(), startServer(), errorHandler(), notFoundHandler(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 22 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.07
Nodes (18): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+10 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.12
Nodes (13): BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot (+5 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.15
Nodes (19): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, FORMAT_TABS (+11 more)

### Community 26 - "AdminAIChatView.tsx"
Cohesion: 0.13
Nodes (22): AdminAIChatView(), init(), AdminAIChatViewProps, INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth() (+14 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "@google/genai"
Cohesion: 0.20
Nodes (6): google-auth-library@^10.9.0, @google/genai@^2.4.0, @prisma/adapter-better-sqlite3@^7.8.0, google-auth-library, @google/genai, @prisma/adapter-better-sqlite3

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.24
Nodes (13): StockBacktestPanelProps, fetchHistoricalBacktestBars(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics, BacktestReport, BacktestRequest, ExecutionFillModel (+5 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 35 - "seed.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 36 - "serverRegistry.ts"
Cohesion: 0.11
Nodes (16): express@^4.21.2, express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), requireAdmin(), authLimiter, generalApiLimiter (+8 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "WorkspacePluginStore.tsx"
Cohesion: 0.11
Nodes (20): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+12 more)

### Community 40 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 41 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, CanvasStudio(), DocNexusStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 42 - "server.ts"
Cohesion: 0.09
Nodes (11): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise, upload (+3 more)

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.16
Nodes (14): CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps (+6 more)

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

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "strategies/types.ts"
Cohesion: 0.19
Nodes (12): StockScannerPanelProps, UNIVERSE_OPTIONS, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, IStrategy, StrategyIndicatorType (+4 more)

### Community 56 - "StockTrackerView"
Cohesion: 0.19
Nodes (13): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState (+5 more)

### Community 57 - "ref_fs"
Cohesion: 0.18
Nodes (4): @vitejs/plugin-react@^5.0.4, @vitejs/plugin-react, PluginEngine, PluginManifest

### Community 58 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.tsx`, `TerminalLog`, `indicatorEngine.ts`, `dependencies`, `StockTracker/routes.ts`, `clientRegistry.ts`, `package.json`, `StorageVaultView.tsx`, `SpreadsheetStudio.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `backtest/engine.ts`, `SlideDeckStudio.tsx`, `WorkspacePluginStore.tsx`, `ImageStudioView.tsx`, `DocNexusStudio`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `strategies/types.ts`, `StockTrackerView`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `indicatorEngine.ts` to `App.tsx`, `TerminalLog`, `dependencies`, `StockTracker/routes.ts`, `package.json`, `StorageVaultView.tsx`, `SpreadsheetStudio.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `backtest/engine.ts`, `SlideDeckStudio.tsx`, `WorkspacePluginStore.tsx`, `ImageStudioView.tsx`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `strategies/types.ts`, `StockTrackerView`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0945945945945946 - nodes in this community are weakly interconnected._
- **Why does `express` connect `serverRegistry.ts` to `react`, `StockTracker/routes.ts`, `serverRegistry.ts`, `package.json`, `server.ts`, `SpeechStudioView.tsx`, `DocNexus/storage.ts`, `startServer`, `ref_fs`, `telemetryService.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.08170731707317073 - nodes in this community are weakly interconnected._