# Graph Report - website  (2026-11-04)

## Corpus Check
- 153 files · ~268,570 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1052 nodes · 2654 edges · 48 communities (46 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3df6280`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- indicatorEngine.ts
- lucide-react
- TemplateLibraryModal.tsx
- dependencies
- StockTrackerView.tsx
- MarkdownStudio.tsx
- clientRegistry.ts
- startServer
- package.json
- App.tsx
- sentimentEngine.ts
- documentParsers.ts
- DocNexusStudio.tsx
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- DocNexus/types.ts
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- WorkspaceLayout
- backtest/types.ts
- StockTracker/routes.ts
- StockSimulatorPanel.tsx
- DocNexusDocument
- AdminAIChatView.tsx
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- CanvasStudio.tsx
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- StockTracker/manifest.json
- _utils.ts
- PluginEngine
- scripts
- TerminalLog
- vite
- server.ts
- StockScannerPanel.tsx
- SpeechStudio/manifest.json
- dotenv
- vercel.json
- serverRegistry.ts
- StorageVaultView.tsx
- @google/genai

## God Nodes (most connected - your core abstractions)
1. `react` - 66 edges
2. `registerRoutes()` - 44 edges
3. `lucide-react` - 41 edges
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
- `main()` --calls--> `getPrismaClient()`  [EXTRACTED]
  scripts/setup-simulation-table.ts → api/_utils.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (48 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (26): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+18 more)

### Community 2 - "lucide-react"
Cohesion: 0.08
Nodes (37): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, DocNexusView() (+29 more)

### Community 3 - "TemplateLibraryModal.tsx"
Cohesion: 0.67
Nodes (3): FORMAT_ICONS, TemplateLibraryModalProps, DocTemplate

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, lucide-react@^0.546.0, multer@^2.1.1, pdfjs-dist@^6.4.299, @prisma/adapter-better-sqlite3@^7.8.0, react@^19.0.1 (+17 more)

### Community 5 - "StockTrackerView.tsx"
Cohesion: 0.09
Nodes (30): StockBacktestPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, Analysis, Candle (+22 more)

### Community 6 - "MarkdownStudio.tsx"
Cohesion: 0.19
Nodes (11): lucide-react, MarkdownStudio(), MarkdownStudioProps, OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, COMMAND_LIST, CommandItem, SlashCommandMenu() (+3 more)

### Community 7 - "clientRegistry.ts"
Cohesion: 0.09
Nodes (22): FlowDesignerView(), AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, getClientPluginByName(), DocNexusPlugin, manifest (+14 more)

### Community 8 - "startServer"
Cohesion: 0.24
Nodes (9): hashPassword(), seedDatabase(), startServer(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob(), listStoredBlobs(), uploadToBlob() (+1 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "App.tsx"
Cohesion: 0.07
Nodes (36): @react-oauth/google@^0.13.5, @react-oauth/google, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal() (+28 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.14
Nodes (21): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+13 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.20
Nodes (18): colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX(), parseRTF() (+10 more)

### Community 13 - "DocNexusStudio.tsx"
Cohesion: 0.20
Nodes (19): CanvasStudio(), CommandPaletteModal(), DocExplorerSidebar(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, ExportModal(), InspectorPanel() (+11 more)

### Community 15 - "_utils.ts"
Cohesion: 0.14
Nodes (17): generateToken(), SECRET_KEY, @prisma/adapter-neon@^7.9.1, ws@^8.21.3, @prisma/adapter-neon, ws, IN_TREE_PLUGINS, packageAllPlugins() (+9 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.17
Nodes (17): @neondatabase/serverless@^1.1.0, @neondatabase/serverless, runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus() (+9 more)

### Community 17 - "DocNexus/types.ts"
Cohesion: 0.15
Nodes (15): DEFAULT_DOC_STATE, RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET, SpreadsheetStudioProps, DocNexusMetadata (+7 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.21
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "WorkspaceLayout"
Cohesion: 0.12
Nodes (11): WorkspaceLayout(), ErrorBoundary, BugReportItem, BugReportsStats, ManageBugReportsProps, ManageBugReportsView(), SEVERITY_COLORS, STATUS_COLORS (+3 more)

### Community 22 - "backtest/types.ts"
Cohesion: 0.20
Nodes (15): StockBacktestPanelProps, StockStrategyMarketplaceProps, BacktestEquityPoint, BacktestMetrics, BacktestReport, BacktestRequest, ExecutionFillModel, FrictionBreakdown (+7 more)

### Community 23 - "StockTracker/routes.ts"
Cohesion: 0.07
Nodes (94): getPrismaClient(), yahoo-finance2, optionalAuth(), PluginManifest, AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol() (+86 more)

### Community 24 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.26
Nodes (9): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument, DocumentFormat (+1 more)

### Community 26 - "AdminAIChatView.tsx"
Cohesion: 0.27
Nodes (12): AdminAIChatView(), init(), INITIAL_PROMPTS, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels(), OllamaModelTag, streamAIChat() (+4 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "CanvasStudio.tsx"
Cohesion: 0.28
Nodes (7): CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanelProps, CanvasElement, CanvasSceneState, CanvasShapeType

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

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "TerminalLog"
Cohesion: 0.18
Nodes (11): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+3 more)

### Community 40 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 42 - "server.ts"
Cohesion: 0.10
Nodes (9): handler(), app, defaultPlugins, prisma, startPromise, upload, ContactNotificationPayload, DispatchResult (+1 more)

### Community 43 - "StockScannerPanel.tsx"
Cohesion: 0.24
Nodes (8): StockScannerPanel(), StockScannerPanelProps, UNIVERSE_OPTIONS, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, StrategySignal

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.20
Nodes (9): category, description, iconSymbol, id, main, minEngineVersion, name, type (+1 more)

### Community 45 - "dotenv"
Cohesion: 0.29
Nodes (5): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma, main()

### Community 47 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, crons, outputDirectory, rewrites

### Community 48 - "serverRegistry.ts"
Cohesion: 0.07
Nodes (41): verifyToken(), express@^4.21.2, express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), requireAdmin(), errorHandler() (+33 more)

### Community 49 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 50 - "@google/genai"
Cohesion: 0.33
Nodes (4): @google/genai@^2.4.0, motion@^12.23.24, @google/genai, motion

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `indicatorEngine.ts`, `lucide-react`, `TemplateLibraryModal.tsx`, `dependencies`, `StockTrackerView.tsx`, `MarkdownStudio.tsx`, `clientRegistry.ts`, `package.json`, `App.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `LandingPage.tsx`, `WorkspaceLayout`, `backtest/types.ts`, `StockSimulatorPanel.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `CanvasStudio.tsx`, `TerminalLog`, `StockScannerPanel.tsx`, `StorageVaultView.tsx`?**
  _High betweenness centrality (0.236) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `MarkdownStudio.tsx` to `indicatorEngine.ts`, `lucide-react`, `TemplateLibraryModal.tsx`, `dependencies`, `StockTrackerView.tsx`, `clientRegistry.ts`, `package.json`, `App.tsx`, `DocNexusStudio.tsx`, `DocNexus/types.ts`, `LandingPage.tsx`, `WorkspaceLayout`, `backtest/types.ts`, `StockSimulatorPanel.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `CanvasStudio.tsx`, `TerminalLog`, `StockScannerPanel.tsx`, `StorageVaultView.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `express` connect `serverRegistry.ts` to `react`, `package.json`, `server.ts`, `StockTracker/routes.ts`, `telemetryService.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.07922705314009662 - nodes in this community are weakly interconnected._