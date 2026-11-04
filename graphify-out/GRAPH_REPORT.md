# Graph Report - website  (2026-11-04)

## Corpus Check
- 147 files · ~262,339 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1020 nodes · 2606 edges · 49 communities (46 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b715d480`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- StockSimulatorPanel.tsx
- lucide-react
- DocNexusStudio.tsx
- dependencies
- StockTrackerView.tsx
- MarkdownStudio.tsx
- clientRegistry.ts
- startServer
- package.json
- App.tsx
- sentimentEngine.ts
- documentParsers.ts
- DocNexusStudio
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- SlideDeckStudio.tsx
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- indicatorEngine.ts
- backtest/engine.ts
- StockTracker/routes.ts
- BugReportModal.tsx
- DocNexusDocument
- AdminAIChatView.tsx
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- DocNexus/types.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- StockTracker/manifest.json
- _utils.ts
- ref_fs
- StockStrategyMarketplace.tsx
- scripts
- TerminalLog
- @vitejs/plugin-react
- @prisma/adapter-neon
- server.ts
- StockScannerPanel.tsx
- WorkspaceLayout
- dotenv
- yahoo-finance2
- vercel.json
- StorageVaultView.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 65 edges
2. `registerRoutes()` - 44 edges
3. `lucide-react` - 40 edges
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

## Communities (49 total, 3 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 2 - "lucide-react"
Cohesion: 0.07
Nodes (40): AccountingViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, FlowDesignerViewProps, initialNodes (+32 more)

### Community 3 - "DocNexusStudio.tsx"
Cohesion: 0.17
Nodes (16): DocNexusView(), DocNexusViewProps, CommandPaletteModal(), DocExplorerSidebar(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, RichDocStudio() (+8 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, express@^4.21.2, google-auth-library@^10.9.0, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1, @neondatabase/serverless@^1.1.0 (+21 more)

### Community 5 - "StockTrackerView.tsx"
Cohesion: 0.09
Nodes (28): StockBacktestPanel(), StockSimulatorPanel(), Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, createWatchlistItem(), DEFAULT_CANDLE_FOR_SCALE (+20 more)

### Community 6 - "MarkdownStudio.tsx"
Cohesion: 0.19
Nodes (11): lucide-react, MarkdownStudio(), MarkdownStudioProps, OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, COMMAND_LIST, CommandItem, SlashCommandMenu() (+3 more)

### Community 7 - "clientRegistry.ts"
Cohesion: 0.05
Nodes (51): generateToken(), SECRET_KEY, verifyToken(), express, FlowDesignerView(), AuthenticatedRequest, AuthenticatedUser, authenticateToken() (+43 more)

### Community 8 - "startServer"
Cohesion: 0.22
Nodes (12): hashPassword(), seedDatabase(), startServer(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob(), isBlobConfigured(), listStoredBlobs() (+4 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (30): vite@^6.2.3, devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13 (+22 more)

### Community 10 - "App.tsx"
Cohesion: 0.12
Nodes (21): @react-oauth/google@^0.13.5, @react-oauth/google, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal() (+13 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.14
Nodes (22): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+14 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "DocNexusStudio"
Cohesion: 0.54
Nodes (7): clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault(), openVaultDB(), sanitizeForLocalStorage(), saveVault()

### Community 15 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.22
Nodes (14): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE, inMemoryHistory (+6 more)

### Community 17 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.21
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "indicatorEngine.ts"
Cohesion: 0.15
Nodes (23): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+15 more)

### Community 22 - "backtest/engine.ts"
Cohesion: 0.15
Nodes (22): StockBacktestPanelProps, fetchHistoricalBacktestBars(), yf, RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics, BacktestReport, BacktestRequest (+14 more)

### Community 23 - "StockTracker/routes.ts"
Cohesion: 0.08
Nodes (81): getPrismaClient(), main(), AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote() (+73 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.23
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal(), ExportModalProps, DocNexusDocument (+2 more)

### Community 26 - "AdminAIChatView.tsx"
Cohesion: 0.27
Nodes (12): AdminAIChatView(), init(), AdminAIChatViewProps, INITIAL_PROMPTS, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels(), OllamaModelTag (+4 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "DocNexus/types.ts"
Cohesion: 0.15
Nodes (15): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+7 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 35 - "_utils.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 36 - "ref_fs"
Cohesion: 0.18
Nodes (4): @tailwindcss/vite@^4.1.14, @tailwindcss/vite, PluginEngine, PluginManifest

### Community 37 - "StockStrategyMarketplace.tsx"
Cohesion: 0.36
Nodes (6): StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, VerifiedBacktestBadge

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "TerminalLog"
Cohesion: 0.20
Nodes (10): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+2 more)

### Community 41 - "@prisma/adapter-neon"
Cohesion: 0.20
Nodes (6): better-sqlite3@^12.10.0, pdfjs-dist@^6.4.299, @prisma/adapter-neon@^7.9.1, better-sqlite3, pdfjs-dist, @prisma/adapter-neon

### Community 42 - "server.ts"
Cohesion: 0.10
Nodes (9): handler(), app, defaultPlugins, prisma, startPromise, upload, ContactNotificationPayload, DispatchResult (+1 more)

### Community 43 - "StockScannerPanel.tsx"
Cohesion: 0.24
Nodes (8): StockScannerPanel(), StockScannerPanelProps, UNIVERSE_OPTIONS, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, PRESET_STRATEGIES

### Community 44 - "WorkspaceLayout"
Cohesion: 0.15
Nodes (10): WorkspaceLayout(), BugReportModal(), getStoredCookiePreferences(), ErrorBoundary, ManageAppsView(), MutedMarkdownProps, MutedMarkdownView(), ProfileData (+2 more)

### Community 45 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 47 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, crons, outputDirectory, rewrites

### Community 49 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `StockSimulatorPanel.tsx`, `lucide-react`, `DocNexusStudio.tsx`, `dependencies`, `StockTrackerView.tsx`, `MarkdownStudio.tsx`, `clientRegistry.ts`, `package.json`, `App.tsx`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `indicatorEngine.ts`, `backtest/engine.ts`, `BugReportModal.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `StockStrategyMarketplace.tsx`, `TerminalLog`, `StockScannerPanel.tsx`, `WorkspaceLayout`, `StorageVaultView.tsx`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `MarkdownStudio.tsx` to `StockSimulatorPanel.tsx`, `lucide-react`, `DocNexusStudio.tsx`, `dependencies`, `StockTrackerView.tsx`, `package.json`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `indicatorEngine.ts`, `backtest/engine.ts`, `BugReportModal.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `StockStrategyMarketplace.tsx`, `TerminalLog`, `StockScannerPanel.tsx`, `WorkspaceLayout`, `StorageVaultView.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.07397959183673469 - nodes in this community are weakly interconnected._
- **Why does `getPrismaClient()` connect `StockTracker/routes.ts` to `react`, `clientRegistry.ts`, `startServer`, `server.ts`, `databaseSyncService.ts`, `getPrismaClient`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._