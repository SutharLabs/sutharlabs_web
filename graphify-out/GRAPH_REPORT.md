# Graph Report - website  (2026-11-08)

## Corpus Check
- 209 files · ~430,909 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1685 nodes · 4054 edges · 88 communities (77 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ff4217c`
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
- tradeSimulator.ts
- App.tsx
- package.json
- patterns/types.ts
- sentimentEngine.ts
- documentParsers.ts
- StudioCastCompositor
- TelemetryLoggerService
- GSTInvoice
- _utils.ts
- AdminAIChatView.tsx
- getPrismaClient
- compilerOptions
- StockTracker/manifest.json
- _utils.ts
- Accounting/manifest.json
- StockTrackerView.tsx
- server.js
- scannerEngine.ts
- ManageDatabaseView.tsx
- telemetryService.ts
- LandingPage.tsx
- Accounting/storage.ts
- backtest/engine.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- DocNexusStudio
- registerRoutes
- WorkspaceLayout
- PdfToolsStudio.tsx
- scripts
- scannerEngine.ts
- express
- react
- server.ts
- _utils.ts
- SpeechStudio/manifest.json
- api/server.ts
- SpeechStudio/routes.ts
- vercel.json
- SlideDeckStudio.tsx
- ImageStudio/manifest.json
- deploy.sh
- startServer
- audioSynth.ts
- loadTenantData
- Accounting/types.ts
- ResumeStudio/manifest.json
- pdfjs-dist
- OcrReceiptModal.tsx
- getPrismaClient
- deploy-production.ts
- DocNexus/types.ts
- StorageVaultView.tsx
- lucide-react
- startServer
- @prisma/adapter-better-sqlite3@^7.8.0
- WorkspacePluginStore.tsx
- ToolsStudioView.tsx
- ResumeEngine.tsx
- ImageStudioView.tsx
- StockSimulatorPanel.tsx
- motion@^12.23.24
- OpenLocalWorkspaceModal.tsx
- getInvoices
- serverRegistry.ts
- DocNexusStudio
- @vitejs/plugin-react
- registerRoutes5
- getDatabaseStatus
- qrcode
- technicalindicators
- StudioCast/manifest.json
- yahoo-finance2
- @types/ws@^8.18.1
- getMarketSessionStatus
- FlowDesigner/index.ts
- SpreadsheetStudio.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 87 edges
2. `lucide-react` - 64 edges
3. `registerRoutes()` - 46 edges
4. `TerminalLog` - 42 edges
5. `startServer()` - 39 edges
6. `getPrismaClient()` - 39 edges
7. `startServer()` - 35 edges
8. `registerRoutes()` - 30 edges
9. `AccountingStorage` - 27 edges
10. `registerRoutes()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `main()` --calls--> `getPrismaClient()`  [EXTRACTED]
  scripts/setup-simulation-table.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (88 total, 11 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "clientRegistry.ts"
Cohesion: 0.12
Nodes (15): AccountingPlugin, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, getClientPluginById(), getClientPluginByName(), getClientPluginByRoute(), DocNexusPlugin, manifest (+7 more)

### Community 2 - "src/types.ts"
Cohesion: 0.08
Nodes (35): lucide-react, AccountingViewProps, AdminAIChatViewProps, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, FlowDesignerViewProps, StepExecutionRecord, TEMPLATES (+27 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, @google/genai@^2.4.0, jszip@^3.10.2, lucide-react@^0.546.0, multer@^2.1.1, pdf-lib@^1.17.1 (+16 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): loadWatchlistsFromDisk(), logger, registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+9 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.12
Nodes (44): getPrismaClient(), getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS (+36 more)

### Community 8 - "App.tsx"
Cohesion: 0.11
Nodes (23): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+15 more)

### Community 9 - "package.json"
Cohesion: 0.09
Nodes (30): vite@^6.2.3, devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13 (+22 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.13
Nodes (22): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+14 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "StudioCastCompositor"
Cohesion: 0.10
Nodes (15): StudioCastView(), ParticipantStreamSource, StudioCastCompositor, chatStore, logger, recordingsStore, roomsStore, signalQueue (+7 more)

### Community 15 - "GSTInvoice"
Cohesion: 0.18
Nodes (15): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawerProps, InvoiceAnalyticsChartProps, OcrReceiptModal(), OcrReceiptModalProps, PartyMasterView(), PartyMasterViewProps (+7 more)

### Community 16 - "_utils.ts"
Cohesion: 0.08
Nodes (34): generateToken(), SECRET_KEY, dotenv@^16.4.5, @neondatabase/serverless@^1.1.0, pg@^8.23.0, @prisma/adapter-neon@^7.9.1, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0 (+26 more)

### Community 17 - "AdminAIChatView.tsx"
Cohesion: 0.12
Nodes (24): AdminAIChatView(), init(), INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels() (+16 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "_utils.ts"
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.05
Nodes (35): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockStrategyMarketplaceProps, StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState (+27 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.23
Nodes (16): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+8 more)

### Community 26 - "ManageDatabaseView.tsx"
Cohesion: 0.12
Nodes (17): AdminConsoleProps, AdminConsoleView(), FleetTelemetry, IncidentAlert, NodeServiceStatus, NodeTelemetry, SystemTelemetry, ConfirmModal() (+9 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.18
Nodes (13): FleetTelemetry, formatUptime(), getCpuSnapshot(), getFleetTelemetry(), getRequestMetrics(), getSystemTelemetry(), IncidentAlert, lastCpuSample (+5 more)

### Community 28 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 29 - "Accounting/storage.ts"
Cohesion: 0.13
Nodes (23): CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), COMMON_HSN_SAC_CATALOG, determineSupplyType(), generateEInvoiceIRN() (+15 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.21
Nodes (17): StockBacktestPanelProps, fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint (+9 more)

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
Cohesion: 0.15
Nodes (19): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, FORMAT_TABS (+11 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "WorkspaceLayout"
Cohesion: 0.12
Nodes (16): WorkspaceLayout(), BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State (+8 more)

### Community 37 - "PdfToolsStudio.tsx"
Cohesion: 0.08
Nodes (37): tesseract.js@^7.0.0, react, tesseract.js, MutedMarkdownProps, PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool() (+29 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "scannerEngine.ts"
Cohesion: 0.17
Nodes (16): StockScannerPanelProps, UNIVERSE_OPTIONS, calculateSentimentConfluence(), ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, calculateSupertrend() (+8 more)

### Community 40 - "express"
Cohesion: 0.14
Nodes (12): express@^4.21.2, express, errorHandler(), notFoundHandler(), requestLogger(), authLimiter, generalApiLimiter, RateLimitOptions (+4 more)

### Community 41 - "react"
Cohesion: 0.21
Nodes (17): AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView(), GstrReportsViewProps (+9 more)

### Community 42 - "server.ts"
Cohesion: 0.09
Nodes (16): app, defaultPlugins, prisma, startPromise, upload, BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+8 more)

### Community 43 - "_utils.ts"
Cohesion: 0.14
Nodes (13): verifyToken(), @tailwindcss/vite@^4.1.14, @tailwindcss/vite, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin() (+5 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "api/server.ts"
Cohesion: 0.25
Nodes (5): BACKEND_TARGET, config, handler(), maxDuration, ORACLE_BACKEND_URL

### Community 46 - "SpeechStudio/routes.ts"
Cohesion: 0.05
Nodes (69): createPluginLogger(), generateTraceId(), PluginLogContext, PluginLogEntry, PluginLogger, PluginLogLevel, PluginSpan, getValidatedUserEmail() (+61 more)

### Community 47 - "vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/server.ts, outputDirectory, rewrites

### Community 48 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "startServer"
Cohesion: 0.08
Nodes (33): createBugReport(), decryptPluginPackage(), deleteBugReport(), deleteFromBlob(), encryptPluginPackage(), errorHandler(), exportDatabaseDump(), generateToken() (+25 more)

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 53 - "loadTenantData"
Cohesion: 0.11
Nodes (28): addItem(), addParty(), addVoucher(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), buildGSTInvoiceObject(), calculateItemTaxes() (+20 more)

### Community 54 - "Accounting/types.ts"
Cohesion: 0.14
Nodes (16): FinancialStatementsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport, BankReconciliationItem, BankReconciliationReport, GSTR1Summary (+8 more)

### Community 56 - "ResumeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 57 - "pdfjs-dist"
Cohesion: 0.20
Nodes (6): pdfjs-dist@^6.4.299, @react-oauth/google@^0.13.5, @vercel/blob@^2.8.1, pdfjs-dist, @react-oauth/google, @vercel/blob

### Community 58 - "OcrReceiptModal.tsx"
Cohesion: 0.25
Nodes (8): DraftLineItem, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, GSTRate, GSTInvoiceItem, ItemMaster

### Community 59 - "getPrismaClient"
Cohesion: 0.18
Nodes (30): appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteJsonData(), deleteSimulation(), detectMarketRegion(), ensureSimulatorStore() (+22 more)

### Community 60 - "deploy-production.ts"
Cohesion: 0.18
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "DocNexus/types.ts"
Cohesion: 0.15
Nodes (15): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+7 more)

### Community 62 - "StorageVaultView.tsx"
Cohesion: 0.28
Nodes (14): CATEGORIES, StorageVaultView(), completeChunkedUpload(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl() (+6 more)

### Community 63 - "lucide-react"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 64 - "startServer"
Cohesion: 0.22
Nodes (7): hashPassword(), seedDatabase(), startServer(), loadSystemSettings(), saveSystemSettings(), PluginEngine, exportDatabaseDump()

### Community 66 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 67 - "ToolsStudioView.tsx"
Cohesion: 0.40
Nodes (4): ToolsStudioView(), ToolsStudioViewProps, ToolsStudioPlugin, manifest

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.12
Nodes (22): jszip, FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView(), ResumeStudioViewProps (+14 more)

### Community 70 - "ImageStudioView.tsx"
Cohesion: 0.16
Nodes (14): ImageStudioView(), PROMPT_SUGGESTIONS, SAMPLE_IMAGES, ImageStudioPlugin, manifest, AspectRatio, ImageGeneratePayload, ImageGenerateResult (+6 more)

### Community 71 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 73 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "serverRegistry.ts"
Cohesion: 0.22
Nodes (10): manifest, MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, StudioCastPlugin, manifest (+2 more)

### Community 76 - "DocNexusStudio"
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), RichDocStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 78 - "registerRoutes5"
Cohesion: 0.32
Nodes (12): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfiles(), getProfilesFilePath(), getQuotaStatus(), getSamplesDirectory(), getSpeechDataDirectory() (+4 more)

### Community 79 - "getDatabaseStatus"
Cohesion: 0.25
Nodes (9): executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), loadSyncHistory(), loadSyncHistoryFromDb(), parseDatabaseMetadata(), persistSyncHistoryInDb() (+1 more)

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

### Community 88 - "FlowDesigner/index.ts"
Cohesion: 0.50
Nodes (3): FlowDesignerView(), FlowDesignerPlugin, manifest

### Community 91 - "SpreadsheetStudio.tsx"
Cohesion: 0.50
Nodes (3): DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `PdfToolsStudio.tsx` to `clientRegistry.ts`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `package.json`, `patterns/types.ts`, `StudioCastCompositor`, `GSTInvoice`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `Accounting/storage.ts`, `backtest/engine.ts`, `DocNexusStudio`, `WorkspaceLayout`, `scannerEngine.ts`, `react`, `SpeechStudio/routes.ts`, `SlideDeckStudio.tsx`, `Accounting/types.ts`, `OcrReceiptModal.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `lucide-react`, `WorkspacePluginStore.tsx`, `ToolsStudioView.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `OpenLocalWorkspaceModal.tsx`, `DocNexusStudio`, `SpreadsheetStudio.tsx`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `clientRegistry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `src/types.ts` to `indicatorEngine.ts`, `dependencies`, `App.tsx`, `package.json`, `patterns/types.ts`, `StudioCastCompositor`, `AdminAIChatView.tsx`, `StockTrackerView.tsx`, `server.js`, `ManageDatabaseView.tsx`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `WorkspaceLayout`, `PdfToolsStudio.tsx`, `scannerEngine.ts`, `SpeechStudio/routes.ts`, `SlideDeckStudio.tsx`, `OcrReceiptModal.tsx`, `DocNexus/types.ts`, `StorageVaultView.tsx`, `lucide-react`, `WorkspacePluginStore.tsx`, `ToolsStudioView.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `OpenLocalWorkspaceModal.tsx`, `SpreadsheetStudio.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08013937282229965 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `StockTracker/routes.ts`, `package.json`, `server.ts`, `_utils.ts`, `serverRegistry.ts`, `StudioCastCompositor`, `SpeechStudio/routes.ts`, `server.js`, `Accounting/storage.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._