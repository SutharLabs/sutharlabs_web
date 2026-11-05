# Graph Report - website  (2026-11-05)

## Corpus Check
- 164 files · ~281,591 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1091 nodes · 2728 edges · 60 communities (54 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2d508b96`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- indicatorEngine.ts
- lucide-react
- StockTrackerView.tsx
- dependencies
- backtest/engine.ts
- MarkdownStudio.tsx
- clientRegistry.ts
- storageUtils.ts
- package.json
- App.tsx
- sentimentEngine.ts
- documentParsers.ts
- DocNexusStudio.tsx
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- SlideDeckStudio.tsx
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- WorkspaceLayout
- StockTracker/manifest.json
- StockTracker/routes.ts
- strategies/types.ts
- DocNexusDocument
- AdminAIChatView.tsx
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- serverRegistry.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- ImageStudioView.tsx
- _utils.ts
- startServer
- StorageVaultView.tsx
- scripts
- ManageDatabaseView.tsx
- ref_fs
- vaultStorage.ts
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- main.tsx
- SpeechStudio/routes.ts
- vercel.json
- DocNexus/storage.ts
- ImageStudio/manifest.json
- deploy.sh
- _utils.ts
- rateLimiter.ts
- SpeechStudioView.tsx
- vite
- multer
- pdfjs-dist
- @tailwindcss/vite
- @vercel/blob

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
- `main()` --calls--> `getPrismaClient()`  [EXTRACTED]
  scripts/setup-simulation-table.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (60 total, 6 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "indicatorEngine.ts"
Cohesion: 0.14
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 2 - "lucide-react"
Cohesion: 0.09
Nodes (34): AccountingViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, FlowDesignerView(), FlowDesignerViewProps (+26 more)

### Community 3 - "StockTrackerView.tsx"
Cohesion: 0.08
Nodes (31): StockBacktestPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, Analysis, Candle (+23 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (23): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, google-auth-library@^10.9.0, lucide-react@^0.546.0, motion@^12.23.24, prisma@^7.8.0, @prisma/adapter-better-sqlite3@^7.8.0 (+15 more)

### Community 5 - "backtest/engine.ts"
Cohesion: 0.19
Nodes (16): fetchHistoricalBacktestBars(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics, BacktestReport, BacktestRequest, ExecutionFillModel, FrictionBreakdown (+8 more)

### Community 6 - "MarkdownStudio.tsx"
Cohesion: 0.19
Nodes (11): lucide-react, MarkdownStudio(), MarkdownStudioProps, OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, COMMAND_LIST, CommandItem, SlashCommandMenu() (+3 more)

### Community 7 - "clientRegistry.ts"
Cohesion: 0.11
Nodes (14): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, getClientPluginByName(), DocNexusPlugin, manifest, FlowDesignerPlugin (+6 more)

### Community 8 - "storageUtils.ts"
Cohesion: 0.22
Nodes (13): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "App.tsx"
Cohesion: 0.12
Nodes (22): react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP, STORE_TOOLS (+14 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.13
Nodes (23): @google/genai@^2.4.0, @google/genai, buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews() (+15 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "DocNexusStudio.tsx"
Cohesion: 0.17
Nodes (16): DocNexusView(), DocNexusViewProps, CommandPaletteModal(), DocExplorerSidebar(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, RichDocStudio() (+8 more)

### Community 14 - "TelemetryLoggerService"
Cohesion: 0.10
Nodes (12): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+4 more)

### Community 15 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

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

### Community 21 - "WorkspaceLayout"
Cohesion: 0.14
Nodes (13): WorkspaceLayout(), BugReportModal(), BugReportItem, BugReportsStats, ManageBugReportsProps, ManageBugReportsView(), SEVERITY_COLORS, STATUS_COLORS (+5 more)

### Community 22 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTracker/routes.ts"
Cohesion: 0.08
Nodes (86): getPrismaClient(), StockSimulatorPanelProps, optionalAuth(), AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory() (+78 more)

### Community 24 - "strategies/types.ts"
Cohesion: 0.16
Nodes (15): StockBacktestPanelProps, StockScannerPanel(), StockScannerPanelProps, UNIVERSE_OPTIONS, StockStrategyMarketplaceProps, ScannerCandidate, ScannerFilterOptions, ScannerReport (+7 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.23
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal(), ExportModalProps, DocNexusDocument (+2 more)

### Community 26 - "AdminAIChatView.tsx"
Cohesion: 0.20
Nodes (14): AdminAIChatView(), init(), AdminAIChatViewProps, INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth() (+6 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "serverRegistry.ts"
Cohesion: 0.18
Nodes (13): express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath(), prisma (+5 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "ImageStudioView.tsx"
Cohesion: 0.39
Nodes (5): SAMPLE_IMAGES, ImageHistoryItem, ImageUpscalePayload, ImageUpscaleResult, UpscaleEngineType

### Community 35 - "_utils.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 36 - "startServer"
Cohesion: 0.22
Nodes (6): hashPassword(), seedDatabase(), startServer(), errorHandler(), notFoundHandler(), PluginEngine

### Community 37 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "ManageDatabaseView.tsx"
Cohesion: 0.16
Nodes (12): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+4 more)

### Community 40 - "ref_fs"
Cohesion: 0.29
Nodes (3): @vitejs/plugin-react@^5.0.4, @vitejs/plugin-react, PluginManifest

### Community 41 - "vaultStorage.ts"
Cohesion: 0.54
Nodes (7): clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault(), openVaultDB(), sanitizeForLocalStorage(), saveVault()

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (12): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, app, defaultPlugins, prisma, startPromise, upload (+4 more)

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.15
Nodes (15): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+7 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "main.tsx"
Cohesion: 0.17
Nodes (5): react-dom@^19.0.1, @react-oauth/google@^0.13.5, react-dom, @react-oauth/google, ErrorBoundary

### Community 46 - "SpeechStudio/routes.ts"
Cohesion: 0.26
Nodes (10): verifyToken(), createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions, getQuotaStatus(), getUserIdentifierAndRole(), quotaStore, registerRoutes() (+2 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 48 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "_utils.ts"
Cohesion: 0.15
Nodes (11): generateToken(), SECRET_KEY, dotenv@^16.4.5, @neondatabase/serverless@^1.1.0, @prisma/adapter-neon@^7.9.1, ws@^8.21.3, dotenv, @neondatabase/serverless (+3 more)

### Community 52 - "rateLimiter.ts"
Cohesion: 0.29
Nodes (5): authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter

### Community 53 - "SpeechStudioView.tsx"
Cohesion: 0.21
Nodes (9): DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, SpeechStudioPlugin, manifest, ClonedVoiceProfile, SpeechHistoryItem, TTSQuotaStatus, TTSSynthesizePayload (+1 more)

### Community 54 - "vite"
Cohesion: 0.67
Nodes (3): vite@^6.2.3, vite@^6.2.3, vite

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `indicatorEngine.ts`, `lucide-react`, `StockTrackerView.tsx`, `dependencies`, `backtest/engine.ts`, `MarkdownStudio.tsx`, `clientRegistry.ts`, `package.json`, `App.tsx`, `DocNexusStudio.tsx`, `TelemetryLoggerService`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `WorkspaceLayout`, `StockTracker/routes.ts`, `strategies/types.ts`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `ImageStudioView.tsx`, `StorageVaultView.tsx`, `ManageDatabaseView.tsx`, `DocNexus/types.ts`, `main.tsx`, `SpeechStudioView.tsx`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `MarkdownStudio.tsx` to `indicatorEngine.ts`, `lucide-react`, `StockTrackerView.tsx`, `dependencies`, `backtest/engine.ts`, `package.json`, `App.tsx`, `DocNexusStudio.tsx`, `TelemetryLoggerService`, `SlideDeckStudio.tsx`, `LandingPage.tsx`, `WorkspaceLayout`, `StockTracker/routes.ts`, `strategies/types.ts`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `ImageStudioView.tsx`, `StorageVaultView.tsx`, `ManageDatabaseView.tsx`, `DocNexus/types.ts`, `SpeechStudioView.tsx`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13763440860215054 - nodes in this community are weakly interconnected._
- **Why does `express` connect `serverRegistry.ts` to `react`, `dependencies`, `startServer`, `ref_fs`, `package.json`, `server.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `rateLimiter.ts`, `StockTracker/routes.ts`, `telemetryService.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.08748615725359911 - nodes in this community are weakly interconnected._