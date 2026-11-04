# Graph Report - website  (2026-11-04)

## Corpus Check
- 143 files · ~251,233 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 983 nodes · 2514 edges · 49 communities (44 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7b691adf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- StockTracker/routes.ts
- TerminalLog
- scannerEngine.ts
- dependencies
- StockTrackerView.tsx
- WorkspaceLayout
- clientRegistry.ts
- startServer
- package.json
- CookieConsentBanner.tsx
- sentimentEngine.ts
- documentParsers.ts
- DocNexusStudio
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- App.tsx
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- getPrismaClient
- UserProfileView.tsx
- backtest/engine.ts
- BugReportModal.tsx
- DocNexusStudio.tsx
- tradeSimulator.ts
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- DocNexus/types.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- StockTracker/manifest.json
- _utils.ts
- PluginEngine
- StockAnalyzer/index.ts
- scripts
- react
- vite
- express
- server.ts
- storageUtils.ts
- yahoo-finance2
- prisma
- main.tsx
- vercel.json
- technicalindicators

## God Nodes (most connected - your core abstractions)
1. `react` - 63 edges
2. `registerRoutes()` - 44 edges
3. `lucide-react` - 38 edges
4. `TerminalLog` - 34 edges
5. `getPrismaClient()` - 33 edges
6. `startServer()` - 32 edges
7. `registerRoutes()` - 30 edges
8. `AccountingStorage` - 27 edges
9. `loadTenantData()` - 23 edges
10. `runEODSimulation()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `main()` --calls--> `getPrismaClient()`  [EXTRACTED]
  scripts/setup-simulation-table.ts → api/_utils.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (49 total, 5 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (81): AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView(), DayBookViewProps (+73 more)

### Community 1 - "StockTracker/routes.ts"
Cohesion: 0.24
Nodes (23): analyzeStockSentiment(), testGeminiApiKey(), loadWatchlistsFromDisk(), registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord (+15 more)

### Community 2 - "TerminalLog"
Cohesion: 0.08
Nodes (40): lucide-react, AccountingViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, FlowDesignerViewProps (+32 more)

### Community 3 - "scannerEngine.ts"
Cohesion: 0.32
Nodes (7): UNIVERSE_OPTIONS, MARKET_UNIVERSES, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, PRESET_STRATEGIES

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, google-auth-library@^10.9.0, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1 (+16 more)

### Community 5 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (55): lightweight-charts@^5.2.1, lightweight-charts, StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState (+47 more)

### Community 6 - "WorkspaceLayout"
Cohesion: 0.22
Nodes (6): WorkspaceLayout(), BugReportModal(), ErrorBoundary, ManageBugReportsView(), UserProfileView(), getClientPluginByName()

### Community 7 - "clientRegistry.ts"
Cohesion: 0.07
Nodes (40): verifyToken(), FlowDesignerView(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), AccountingPlugin (+32 more)

### Community 8 - "startServer"
Cohesion: 0.19
Nodes (14): generateToken(), hashPassword(), seedDatabase(), startServer(), errorHandler(), notFoundHandler(), BlobUploadOptions, deleteFromBlob() (+6 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "CookieConsentBanner.tsx"
Cohesion: 0.24
Nodes (10): react-router-dom@^7.15.1, react-router-dom, App(), PasswordResetModal(), CookieConsentBanner(), CookiePreferences, getStoredCookiePreferences(), openCookiePreferencesModal() (+2 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.14
Nodes (21): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+13 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.16
Nodes (21): OpenLocalWorkspaceModal(), colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX() (+13 more)

### Community 13 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), SpreadsheetStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 15 - "_utils.ts"
Cohesion: 0.39
Nodes (8): decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive(), resolvePluginArchiveBuffer(), SLPK_MAGIC, SLPK_VERSION

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.16
Nodes (17): @neondatabase/serverless@^1.1.0, @prisma/adapter-neon@^7.9.1, ws@^8.21.3, @neondatabase/serverless, @prisma/adapter-neon, ws, runCronSync(), DatabaseSyncHistoryEntry (+9 more)

### Community 17 - "App.tsx"
Cohesion: 0.22
Nodes (7): ADMIN_TOOLS, ALL_TABS, INSTALLED_PLUGINS, ROUTE_MAP, STORE_TOOLS, URL_TO_TAB, MutedMarkdownView()

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.21
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "getPrismaClient"
Cohesion: 0.26
Nodes (23): getPrismaClient(), detectMarketRegion(), appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteSimulation(), ensureSimulatorStore() (+15 more)

### Community 22 - "UserProfileView.tsx"
Cohesion: 0.32
Nodes (6): AuthPage(), AuthPageProps, LandingPageProps, ProfileData, UserProfileViewProps, UserProfile

### Community 23 - "backtest/engine.ts"
Cohesion: 0.11
Nodes (32): StockBacktestPanel(), StockBacktestPanelProps, StockScannerPanelProps, StockSimulatorPanelProps, StockStrategyMarketplaceProps, fetchHistoricalBacktestBars(), runBacktest(), yf (+24 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 25 - "DocNexusStudio.tsx"
Cohesion: 0.12
Nodes (24): CanvasStudioProps, CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG (+16 more)

### Community 26 - "tradeSimulator.ts"
Cohesion: 0.20
Nodes (17): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+9 more)

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
Cohesion: 0.10
Nodes (22): CanvasStudio(), COLOR_PRESETS, DEFAULT_SCENE, DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudio() (+14 more)

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
Cohesion: 0.13
Nodes (16): SECRET_KEY, dotenv@^16.4.5, pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, dotenv, pg, @prisma/adapter-pg (+8 more)

### Community 37 - "StockAnalyzer/index.ts"
Cohesion: 0.25
Nodes (15): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+7 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "react"
Cohesion: 0.15
Nodes (15): react, ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseView(), SyncHistoryEntry (+7 more)

### Community 40 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 41 - "express"
Cohesion: 0.20
Nodes (6): authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter, securityHeaders()

### Community 42 - "server.ts"
Cohesion: 0.10
Nodes (9): handler(), app, defaultPlugins, prisma, startPromise, upload, ContactNotificationPayload, DispatchResult (+1 more)

### Community 43 - "storageUtils.ts"
Cohesion: 0.25
Nodes (7): express, PluginManifest, deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob()

### Community 44 - "yahoo-finance2"
Cohesion: 0.33
Nodes (4): react-dom@^19.0.1, yahoo-finance2@^3.14.1, react-dom, yahoo-finance2

### Community 47 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, crons, outputDirectory, rewrites

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `react`, `TerminalLog`, `scannerEngine.ts`, `dependencies`, `StockTrackerView.tsx`, `clientRegistry.ts`, `package.json`, `CookieConsentBanner.tsx`, `documentParsers.ts`, `DocNexusStudio`, `App.tsx`, `LandingPage.tsx`, `UserProfileView.tsx`, `backtest/engine.ts`, `BugReportModal.tsx`, `DocNexusStudio.tsx`, `tradeSimulator.ts`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`, `main.tsx`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.05224576835932294 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `TerminalLog` to `scannerEngine.ts`, `dependencies`, `StockTrackerView.tsx`, `react`, `package.json`, `documentParsers.ts`, `LandingPage.tsx`, `UserProfileView.tsx`, `backtest/engine.ts`, `BugReportModal.tsx`, `DocNexusStudio.tsx`, `tradeSimulator.ts`, `WorkspacePluginStore.tsx`, `DocNexus/types.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.07908163265306123 - nodes in this community are weakly interconnected._
- **Why does `getPrismaClient()` connect `getPrismaClient` to `react`, `StockTracker/routes.ts`, `_utils.ts`, `clientRegistry.ts`, `server.ts`, `databaseSyncService.ts`, `getPrismaClient`, `tradeSimulator.ts`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._