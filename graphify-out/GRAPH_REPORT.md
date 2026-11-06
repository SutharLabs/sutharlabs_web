# Graph Report - website  (2026-11-06)

## Corpus Check
- 173 files · ~352,905 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1184 nodes · 2859 edges · 65 communities (57 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d9fd9ae`
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
- StorageVaultView.tsx
- sentimentEngine.ts
- documentParsers.ts
- UserProfile
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
- DocNexusStudio
- _utils.ts
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
- @vercel/blob
- audioSynth.ts
- strategies/types.ts
- DocNexus/index.ts
- SpeechStudio/index.ts
- WorkspacePluginStore.tsx
- StockSimulatorPanel.tsx
- technicalindicators
- backgroundWorker.ts
- SlideDeckStudio.tsx
- storageUtils.ts
- OpenLocalWorkspaceModal.tsx
- ref_fs

## God Nodes (most connected - your core abstractions)
1. `react` - 69 edges
2. `lucide-react` - 45 edges
3. `TerminalLog` - 38 edges
4. `getPrismaClient()` - 37 edges
5. `startServer()` - 36 edges
6. `registerRoutes()` - 30 edges
7. `AccountingStorage` - 27 edges
8. `registerRoutes()` - 27 edges
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
- `getUserIdentifierAndRole()` --calls--> `verifyToken()`  [EXTRACTED]
  src/plugins/SpeechStudio/routes.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (65 total, 8 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (81): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+73 more)

### Community 1 - "App.tsx"
Cohesion: 0.11
Nodes (26): react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP, STORE_TOOLS (+18 more)

### Community 2 - "TerminalLog"
Cohesion: 0.10
Nodes (29): lucide-react, AccountingViewProps, AdminConsoleProps, SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView(), ManageProps (+21 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, better-sqlite3@^12.10.0, dotenv@^16.4.5, express@^4.21.2, google-auth-library@^10.9.0, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1 (+16 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): KNOWN_US_TICKERS, loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+9 more)

### Community 6 - "serverRegistry.ts"
Cohesion: 0.33
Nodes (5): manifest, MODEL_SPECS, registerRoutes(), processImageUpscale(), SERVER_PLUGIN_ENTRIES

### Community 7 - "clientRegistry.ts"
Cohesion: 0.16
Nodes (12): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, FlowDesignerPlugin, manifest, ImageStudioPlugin, StockTrackerPlugin (+4 more)

### Community 8 - "tradeSimulator.ts"
Cohesion: 0.16
Nodes (36): detectMarketRegion(), getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS (+28 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "StorageVaultView.tsx"
Cohesion: 0.33
Nodes (11): CATEGORIES, StorageVaultView(), StorageVaultViewProps, deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl() (+3 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.12
Nodes (24): @google/genai@^2.4.0, @google/genai, buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews() (+16 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "UserProfile"
Cohesion: 0.29
Nodes (7): @react-oauth/google@^0.13.5, @react-oauth/google, AuthPage(), AuthPageProps, LandingPageProps, UserProfileViewProps, UserProfile

### Community 15 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): dotenv, runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "AdminAIChatView.tsx"
Cohesion: 0.11
Nodes (26): AdminAIChatView(), init(), AdminAIChatViewProps, INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth() (+18 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.18
Nodes (18): getPrismaClient(), main(), BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports() (+10 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.21
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "startServer"
Cohesion: 0.24
Nodes (11): hashPassword(), seedDatabase(), startServer(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob(), isBlobConfigured(), listStoredBlobs() (+3 more)

### Community 22 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.05
Nodes (39): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, createWatchlistItem() (+31 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.12
Nodes (12): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot, LogLevel (+4 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.19
Nodes (12): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal() (+4 more)

### Community 26 - "StorageVaultView.tsx"
Cohesion: 0.11
Nodes (18): ConfirmModal(), ConfirmModalProps, ModalVariant, FlowDesignerView(), FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection (+10 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "StockAnalyzer/index.ts"
Cohesion: 0.28
Nodes (14): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+6 more)

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.11
Nodes (32): StockBacktestPanelProps, StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, fetchHistoricalBacktestBars(), runBacktest() (+24 more)

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
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), RichDocStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 35 - "_utils.ts"
Cohesion: 0.12
Nodes (17): generateToken(), SECRET_KEY, @neondatabase/serverless@^1.1.0, pg@^8.23.0, @prisma/adapter-neon@^7.9.1, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, ws@^8.21.3 (+9 more)

### Community 36 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 37 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "express"
Cohesion: 0.09
Nodes (21): verifyToken(), express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), errorHandler() (+13 more)

### Community 40 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 41 - "DocNexusStudio.tsx"
Cohesion: 0.23
Nodes (10): FORMAT_TABS, INITIAL_DOCS, DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps, FORMAT_ICONS, TemplateLibraryModal(), TemplateLibraryModalProps (+2 more)

### Community 42 - "server.ts"
Cohesion: 0.09
Nodes (11): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise, upload (+3 more)

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.15
Nodes (15): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+7 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.12
Nodes (32): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, SpeechStudioView() (+24 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "MarkdownStudio.tsx"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "@vercel/blob"
Cohesion: 0.33
Nodes (4): @types/pg@^8.21.0, @vercel/blob@^2.8.1, @types/pg, @vercel/blob

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "strategies/types.ts"
Cohesion: 0.25
Nodes (8): StockScannerPanelProps, UNIVERSE_OPTIONS, MARKET_UNIVERSES, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, PRESET_STRATEGIES

### Community 57 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 58 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 60 - "backgroundWorker.ts"
Cohesion: 0.40
Nodes (3): executeAutomationCycle(), SimulatorWorkerStatus, startSimulatorBackgroundWorker()

### Community 61 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 63 - "storageUtils.ts"
Cohesion: 0.53
Nodes (5): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob()

### Community 65 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.tsx`, `TerminalLog`, `indicatorEngine.ts`, `dependencies`, `clientRegistry.ts`, `package.json`, `StorageVaultView.tsx`, `UserProfile`, `AdminAIChatView.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `StorageVaultView.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `ImageStudioView.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `MarkdownStudio.tsx`, `strategies/types.ts`, `WorkspacePluginStore.tsx`, `StockSimulatorPanel.tsx`, `SlideDeckStudio.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.236) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.053515783769136974 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `TerminalLog` to `App.tsx`, `indicatorEngine.ts`, `dependencies`, `package.json`, `StorageVaultView.tsx`, `AdminAIChatView.tsx`, `LandingPage.tsx`, `StockTrackerView.tsx`, `BugReportModal.tsx`, `DocNexusDocument`, `StorageVaultView.tsx`, `backtest/engine.ts`, `ImageStudioView.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `SpeechStudioView.tsx`, `MarkdownStudio.tsx`, `strategies/types.ts`, `WorkspacePluginStore.tsx`, `StockSimulatorPanel.tsx`, `SlideDeckStudio.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11088709677419355 - nodes in this community are weakly interconnected._
- **Why does `getPrismaClient()` connect `getPrismaClient` to `react`, `_utils.ts`, `DocNexus/storage.ts`, `StockTracker/routes.ts`, `express`, `tradeSimulator.ts`, `server.ts`, `databaseSyncService.ts`, `backgroundWorker.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.10158730158730159 - nodes in this community are weakly interconnected._