# Graph Report - website  (2026-11-06)

## Corpus Check
- 166 files · ~344,164 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1147 nodes · 2808 edges · 56 communities (50 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b591b7d`
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
- UserProfileView.tsx
- sentimentEngine.ts
- documentParsers.ts
- FlowDesignerView.tsx
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- _utils.ts
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- startServer
- StockTracker/manifest.json
- StockTrackerView.tsx
- BugReportModal.tsx
- DocNexusDocument
- src/types.ts
- telemetryService.ts
- UserProfile
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
- main.tsx
- ImageStudioView.tsx
- DocNexusStudio
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- dotenv
- SpeechStudioView.tsx
- vercel.json
- MarkdownStudio.tsx
- ImageStudio/manifest.json
- deploy.sh
- audioSynth.ts
- strategies/types.ts
- StockTrackerView
- PluginEngine

## God Nodes (most connected - your core abstractions)
1. `react` - 68 edges
2. `lucide-react` - 44 edges
3. `registerRoutes()` - 38 edges
4. `TerminalLog` - 38 edges
5. `startServer()` - 36 edges
6. `getPrismaClient()` - 35 edges
7. `registerRoutes()` - 30 edges
8. `AccountingStorage` - 27 edges
9. `runEODSimulation()` - 24 edges
10. `loadTenantData()` - 23 edges

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

## Communities (56 total, 6 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (81): AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView(), DayBookViewProps (+73 more)

### Community 1 - "App.tsx"
Cohesion: 0.15
Nodes (16): ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP, STORE_TOOLS, URL_TO_TAB (+8 more)

### Community 2 - "TerminalLog"
Cohesion: 0.09
Nodes (34): lucide-react, react, AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer() (+26 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1, pdfjs-dist@^6.4.299, @prisma/adapter-better-sqlite3@^7.8.0 (+16 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.05
Nodes (95): yahoo-finance2, optionalAuth(), PluginManifest, AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory() (+87 more)

### Community 6 - "serverRegistry.ts"
Cohesion: 0.33
Nodes (4): ImageStudioPlugin, manifest, SERVER_PLUGIN_ENTRIES, manifest

### Community 7 - "clientRegistry.ts"
Cohesion: 0.16
Nodes (12): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, SpeechStudioPlugin, StockTrackerPlugin (+4 more)

### Community 8 - "fetcher.ts"
Cohesion: 0.30
Nodes (11): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+3 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "UserProfileView.tsx"
Cohesion: 0.27
Nodes (9): react-router-dom@^7.15.1, react-router-dom, BugReportModal(), CookieConsentBanner(), CookiePreferences, getStoredCookiePreferences(), openCookiePreferencesModal(), ProfileData (+1 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.12
Nodes (19): @google/genai@^2.4.0, technicalindicators@^3.1.0, @google/genai, technicalindicators, analyzeAutonomousFallback(), analyzeStockSentiment(), BEARISH_LEXICON, BULLISH_LEXICON (+11 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.16
Nodes (21): OpenLocalWorkspaceModal(), colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX() (+13 more)

### Community 13 - "FlowDesignerView.tsx"
Cohesion: 0.22
Nodes (8): FlowDesignerView(), FlowDesignerViewProps, TEMPLATES, WorkflowConnection, WorkflowNode, WorkflowTemplate, FlowDesignerPlugin, manifest

### Community 15 - "_utils.ts"
Cohesion: 0.19
Nodes (13): dotenv@^16.4.5, dotenv, IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey() (+5 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.22
Nodes (14): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE, inMemoryHistory (+6 more)

### Community 17 - "_utils.ts"
Cohesion: 0.22
Nodes (8): generateToken(), SECRET_KEY, @neondatabase/serverless@^1.1.0, @prisma/adapter-neon@^7.9.1, ws@^8.21.3, @neondatabase/serverless, @prisma/adapter-neon, ws

### Community 18 - "getPrismaClient"
Cohesion: 0.18
Nodes (18): getPrismaClient(), main(), BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports() (+10 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (14): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+6 more)

### Community 21 - "startServer"
Cohesion: 0.24
Nodes (11): hashPassword(), seedDatabase(), startServer(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob(), isBlobConfigured(), listStoredBlobs() (+3 more)

### Community 22 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.07
Nodes (18): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+10 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.14
Nodes (19): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, FORMAT_TABS (+11 more)

### Community 26 - "src/types.ts"
Cohesion: 0.05
Nodes (56): AdminAIChatView(), init(), INITIAL_PROMPTS, ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse (+48 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "UserProfile"
Cohesion: 0.29
Nodes (7): @react-oauth/google@^0.13.5, @react-oauth/google, AuthPage(), AuthPageProps, LandingPageProps, UserProfileViewProps, UserProfile

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.23
Nodes (11): StockBacktestPanel(), StockBacktestPanelProps, BacktestEquityPoint, BacktestMetrics, BacktestReport, BacktestRequest, ExecutionFillModel, FrictionBreakdown (+3 more)

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
Cohesion: 0.13
Nodes (17): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET (+9 more)

### Community 35 - "seed.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.08
Nodes (37): express@^4.21.2, express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), requireAdmin(), errorHandler(), notFoundHandler() (+29 more)

### Community 37 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 40 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 41 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), SpreadsheetStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 42 - "server.ts"
Cohesion: 0.09
Nodes (11): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise, upload (+3 more)

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.22
Nodes (9): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, CanvasElement, CanvasSceneState (+1 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.12
Nodes (33): verifyToken(), audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS (+25 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "MarkdownStudio.tsx"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "strategies/types.ts"
Cohesion: 0.16
Nodes (14): StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, StockStrategyMarketplaceProps, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload (+6 more)

### Community 56 - "StockTrackerView"
Cohesion: 0.21
Nodes (11): StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, createWatchlistItem(), formatRelativeTime() (+3 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `TerminalLog` to `react`, `App.tsx`, `indicatorEngine.ts`, `dependencies`, `StockTracker/routes.ts`, `clientRegistry.ts`, `package.json`, `UserProfileView.tsx`, `documentParsers.ts`, `FlowDesignerView.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `src/types.ts`, `UserProfile`, `backtest/engine.ts`, `DocNexus/types.ts`, `main.tsx`, `ImageStudioView.tsx`, `DocNexusStudio`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `MarkdownStudio.tsx`, `strategies/types.ts`, `StockTrackerView`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.05224576835932294 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `TerminalLog` to `indicatorEngine.ts`, `dependencies`, `StockTracker/routes.ts`, `package.json`, `UserProfileView.tsx`, `documentParsers.ts`, `FlowDesignerView.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `src/types.ts`, `backtest/engine.ts`, `DocNexus/types.ts`, `ImageStudioView.tsx`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `MarkdownStudio.tsx`, `strategies/types.ts`, `StockTrackerView`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.09390243902439024 - nodes in this community are weakly interconnected._
- **Why does `express` connect `DocNexus/storage.ts` to `react`, `StockTracker/routes.ts`, `serverRegistry.ts`, `package.json`, `server.ts`, `SpeechStudioView.tsx`, `telemetryService.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._