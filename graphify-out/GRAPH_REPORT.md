# Graph Report - website  (2026-11-04)

## Corpus Check
- 139 files · ~242,808 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 948 nodes · 2461 edges · 52 communities (43 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `790e7887`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- StockTracker/routes.ts
- TerminalLog
- indicatorEngine.ts
- dependencies
- StockTrackerView.tsx
- strategies/types.ts
- clientRegistry.ts
- server.ts
- package.json
- App.tsx
- sentimentEngine.ts
- documentParsers.ts
- DocNexusStudio.tsx
- TelemetryLoggerService
- _utils.ts
- backtest/engine.ts
- rateLimiter.ts
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- DocNexus/storage.ts
- DocNexus/types.ts
- auth.ts
- BugReportModal.tsx
- DocNexusDocument
- UserProfile
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- CanvasStudio.tsx
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- StockTracker/manifest.json
- seed.ts
- PluginEngine
- @react-oauth/google
- scripts
- lucide-react
- vite
- ManageContactInquiriesView.tsx
- api/server.ts
- @prisma/adapter-better-sqlite3@^7.8.0
- TemplateLibraryModal.tsx
- dotenv
- @google/genai
- vercel.json
- multer
- @neondatabase/serverless
- @vercel/blob
- yahoo-finance2

## God Nodes (most connected - your core abstractions)
1. `react` - 61 edges
2. `registerRoutes()` - 44 edges
3. `lucide-react` - 36 edges
4. `TerminalLog` - 32 edges
5. `registerRoutes()` - 30 edges
6. `getPrismaClient()` - 29 edges
7. `startServer()` - 29 edges
8. `AccountingStorage` - 27 edges
9. `loadTenantData()` - 23 edges
10. `runEODSimulation()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `main()` --calls--> `getPrismaClient()`  [EXTRACTED]
  scripts/setup-simulation-table.ts → api/_utils.ts
- `loadTenantData()` --calls--> `getPrismaClient()`  [EXTRACTED]
  src/plugins/Accounting/storage.ts → api/_utils.ts
- `saveTenantData()` --calls--> `getPrismaClient()`  [EXTRACTED]
  src/plugins/Accounting/storage.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (52 total, 9 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "StockTracker/routes.ts"
Cohesion: 0.06
Nodes (96): express, StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, PluginManifest, AnalysisOptions, formatTickerDisplay(), getAnalysis() (+88 more)

### Community 2 - "TerminalLog"
Cohesion: 0.08
Nodes (35): AccountingViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, DocNexusView(), DocNexusViewProps (+27 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.16
Nodes (21): lightweight-charts@^5.2.1, lightweight-charts, ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner(), calculateSupertrend() (+13 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, google-auth-library@^10.9.0, lucide-react@^0.546.0, motion@^12.23.24, pdfjs-dist@^6.4.299, @prisma/adapter-neon@^7.9.1 (+16 more)

### Community 5 - "StockTrackerView.tsx"
Cohesion: 0.09
Nodes (30): StockScannerPanel(), StockSimulatorPanel(), Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, createWatchlistItem(), DEFAULT_CANDLE_FOR_SCALE (+22 more)

### Community 6 - "strategies/types.ts"
Cohesion: 0.16
Nodes (15): StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, calculateSentimentConfluence(), calculateSupertrend(), CandleData (+7 more)

### Community 7 - "clientRegistry.ts"
Cohesion: 0.14
Nodes (14): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, FlowDesignerPlugin, manifest (+6 more)

### Community 8 - "server.ts"
Cohesion: 0.15
Nodes (17): generateToken(), hashPassword(), defaultPlugins, prisma, seedDatabase(), startServer(), upload, errorHandler() (+9 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 10 - "App.tsx"
Cohesion: 0.14
Nodes (23): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+15 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.13
Nodes (23): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+15 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.20
Nodes (18): colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX(), parseRTF() (+10 more)

### Community 13 - "DocNexusStudio.tsx"
Cohesion: 0.20
Nodes (19): CanvasStudio(), CommandPaletteModal(), DocExplorerSidebar(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, ExportModal(), InspectorPanel() (+11 more)

### Community 15 - "_utils.ts"
Cohesion: 0.20
Nodes (12): SECRET_KEY, IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage() (+4 more)

### Community 16 - "backtest/engine.ts"
Cohesion: 0.20
Nodes (16): StockBacktestPanel(), StockBacktestPanelProps, fetchHistoricalBacktestBars(), yf, getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics (+8 more)

### Community 17 - "rateLimiter.ts"
Cohesion: 0.20
Nodes (6): authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter, securityHeaders()

### Community 18 - "getPrismaClient"
Cohesion: 0.18
Nodes (18): getPrismaClient(), main(), resetSimulator(), BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport() (+10 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.21
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 21 - "DocNexus/storage.ts"
Cohesion: 0.29
Nodes (15): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+7 more)

### Community 22 - "DocNexus/types.ts"
Cohesion: 0.15
Nodes (15): DEFAULT_DOC_STATE, RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET, SpreadsheetStudioProps, DocNexusMetadata (+7 more)

### Community 23 - "auth.ts"
Cohesion: 0.21
Nodes (11): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath() (+3 more)

### Community 24 - "BugReportModal.tsx"
Cohesion: 0.12
Nodes (12): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot, LogLevel (+4 more)

### Community 25 - "DocNexusDocument"
Cohesion: 0.26
Nodes (9): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument, DocumentFormat (+1 more)

### Community 26 - "UserProfile"
Cohesion: 0.40
Nodes (5): AuthPage(), AuthPageProps, LandingPageProps, UserProfileViewProps, UserProfile

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

### Community 35 - "seed.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 38 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, clean, dev, dev:watch, lint, package:plugins, preview (+1 more)

### Community 39 - "lucide-react"
Cohesion: 0.19
Nodes (11): lucide-react, MarkdownStudio(), MarkdownStudioProps, OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, COMMAND_LIST, CommandItem, SlashCommandMenu() (+3 more)

### Community 40 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 41 - "ManageContactInquiriesView.tsx"
Cohesion: 0.29
Nodes (6): InquiriesStats, ManageContactInquiriesProps, ManageContactInquiriesView(), PROJECT_TYPE_COLORS, STATUS_OPTIONS, ContactInquiryItem

### Community 42 - "api/server.ts"
Cohesion: 0.67
Nodes (3): handler(), app, startPromise

### Community 44 - "TemplateLibraryModal.tsx"
Cohesion: 0.67
Nodes (3): FORMAT_ICONS, TemplateLibraryModalProps, DocTemplate

### Community 45 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 47 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, crons, outputDirectory, rewrites

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `StockTracker/routes.ts`, `TerminalLog`, `indicatorEngine.ts`, `dependencies`, `StockTrackerView.tsx`, `strategies/types.ts`, `clientRegistry.ts`, `package.json`, `App.tsx`, `DocNexusStudio.tsx`, `backtest/engine.ts`, `LandingPage.tsx`, `DocNexus/types.ts`, `BugReportModal.tsx`, `DocNexusDocument`, `UserProfile`, `WorkspacePluginStore.tsx`, `CanvasStudio.tsx`, `lucide-react`, `ManageContactInquiriesView.tsx`, `TemplateLibraryModal.tsx`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `StockTracker/routes.ts`, `TerminalLog`, `indicatorEngine.ts`, `dependencies`, `StockTrackerView.tsx`, `strategies/types.ts`, `package.json`, `ManageContactInquiriesView.tsx`, `App.tsx`, `TemplateLibraryModal.tsx`, `DocNexusStudio.tsx`, `backtest/engine.ts`, `LandingPage.tsx`, `DocNexus/types.ts`, `BugReportModal.tsx`, `DocNexusDocument`, `WorkspacePluginStore.tsx`, `CanvasStudio.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `StockTracker/routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06178887484197219 - nodes in this community are weakly interconnected._
- **Why does `getPrismaClient()` connect `getPrismaClient` to `react`, `StockTracker/routes.ts`, `server.ts`, `_utils.ts`, `DocNexus/storage.ts`, `auth.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.08456659619450317 - nodes in this community are weakly interconnected._