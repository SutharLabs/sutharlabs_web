# Graph Report - website  (2026-11-10)

## Corpus Check
- 232 files · ~498,948 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1889 nodes · 4459 edges · 104 communities (87 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f95d8a07`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- StudioCastView.tsx
- src/types.ts
- indicatorEngine.ts
- dependencies
- StockTracker/routes.ts
- SovereignTools/manifest.json
- tradeSimulator.ts
- App.tsx
- UnifiedInferenceQueueManager
- patterns/types.ts
- sentimentEngine.ts
- documentParsers.ts
- StudioCastCompositor
- TelemetryLoggerService
- imageGenService.ts
- databaseSyncService.ts
- src/types.ts
- getPrismaClient
- compilerOptions
- StockTracker/manifest.json
- Accounting/routes.ts
- Accounting/manifest.json
- StockTrackerView.tsx
- server.js
- scannerEngine.ts
- @neondatabase/serverless
- telemetryService.ts
- LandingPage.tsx
- gstEngine.ts
- backtest/engine.ts
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- DocNexusStudio
- registerRoutes
- SpeechStudio/storage.ts
- react
- scripts
- scannerEngine.ts
- express
- react
- server.ts
- SpeechStudio/routes.ts
- SpeechStudio/manifest.json
- DocNexus/storage.ts
- SpeechStudioView.tsx
- vercel.json
- DocNexus/types.ts
- ImageStudio/manifest.json
- deploy.sh
- startServer
- audioSynth.ts
- loadTenantData
- Accounting/types.ts
- ResumeStudio/manifest.json
- MotionStudio/manifest.json
- package.json
- getPrismaClient
- deploy-production.ts
- DocNexusStudio
- pluginLogger.ts
- lucide-react
- PluginLogger
- motion@^12.23.24
- WorkspacePluginStore.tsx
- startServer
- ResumeEngine.tsx
- ImageStudioView.tsx
- StockSimulatorPanel.tsx
- pdf-lib
- pdfjs-dist
- getInvoices
- serverRegistry.ts
- qrcode
- react-dom
- registerRoutes5
- getDatabaseStatus
- auth.ts
- package-plugins.ts
- StudioCast/manifest.json
- DocNexusDocument
- CutoutStudio/manifest.json
- MotionStudioView.tsx
- getMarketSessionStatus
- ContextualRagEngine
- seed.ts
- exchangeCalendar.ts
- clientRegistry.ts
- MockupStudio/manifest.json
- OcrReceiptModal.tsx
- TranscribeStudio/manifest.json
- @prisma/adapter-neon
- @types/ws@^8.18.1
- ToolsStudioView.tsx
- ref_fs
- dotenv
- api/server.ts
- FlowDesignerView.tsx
- yahoo-finance2
- vite
- DocNexusStudio.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 95 edges
2. `lucide-react` - 72 edges
3. `registerRoutes()` - 46 edges
4. `startServer()` - 44 edges
5. `TerminalLog` - 42 edges
6. `getPrismaClient()` - 39 edges
7. `startServer()` - 35 edges
8. `registerRoutes()` - 30 edges
9. `PdfToolsStudio()` - 29 edges
10. `AccountingStorage` - 27 edges

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

## Communities (104 total, 17 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "StudioCastView.tsx"
Cohesion: 0.19
Nodes (13): ParticipantStreamSource, chatStore, logger, recordingsStore, roomsStore, signalQueue, IsoRecordingTrack, LowerThirdConfig (+5 more)

### Community 2 - "src/types.ts"
Cohesion: 0.07
Nodes (42): AdminConsoleProps, AdminConsoleView(), FleetTelemetry, IncidentAlert, NodeServiceStatus, NodeTelemetry, SystemTelemetry, CollapsibleLogDrawer() (+34 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, @google/genai@^2.4.0, @huggingface/transformers@^4.3.2, @imgly/background-removal@^1.7.0, jszip@^3.10.2, lucide-react@^0.546.0 (+21 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (19): KNOWN_US_TICKERS, loadWatchlistsFromDisk(), logger, registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord (+11 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.17
Nodes (34): getPrismaClient(), executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), appendHistoryReport(), closeEODPosition(), createInitialSimulatorState() (+26 more)

### Community 8 - "App.tsx"
Cohesion: 0.07
Nodes (39): react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP, STORE_TOOLS (+31 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.13
Nodes (22): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+14 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 15 - "imageGenService.ts"
Cohesion: 0.18
Nodes (13): executeMcpTool(), ASPECT_RATIO_DIMS, buildEnhancedPrompt(), GeneratedImageResult, generateSovereignImage(), generateSovereignVisualSVG(), getStorageDirectory(), ImageGenOptions (+5 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "src/types.ts"
Cohesion: 0.05
Nodes (70): AdminAIChatView(), init(), AdminAIChatViewProps, budgetDocumentText(), INITIAL_PROMPTS, toSafeTimestamp(), MarkdownMessage(), MarkdownMessageProps (+62 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "Accounting/routes.ts"
Cohesion: 0.25
Nodes (8): CompanySettingsModal(), CompanySettingsModalProps, PartyMasterView(), PartyMasterViewProps, COMMON_HSN_SAC_CATALOG, INDIAN_GST_STATES, validateGSTIN(), getUserEmail()

### Community 22 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.05
Nodes (33): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, Analysis (+25 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.28
Nodes (14): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+6 more)

### Community 26 - "@neondatabase/serverless"
Cohesion: 0.20
Nodes (6): @neondatabase/serverless@^1.1.0, @prisma/adapter-better-sqlite3@^7.8.0, @types/qrcode@^1.5.6, @neondatabase/serverless, @prisma/adapter-better-sqlite3, @types/qrcode

### Community 27 - "telemetryService.ts"
Cohesion: 0.18
Nodes (13): FleetTelemetry, formatUptime(), getCpuSnapshot(), getFleetTelemetry(), getRequestMetrics(), getSystemTelemetry(), IncidentAlert, lastCpuSample (+5 more)

### Community 28 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 29 - "gstEngine.ts"
Cohesion: 0.15
Nodes (20): CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), determineSupplyType(), generateEInvoiceIRN(), generateSignedQrPayload() (+12 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.17
Nodes (21): fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), detectMarketRegion(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics (+13 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.15
Nodes (12): DocNexusPlugin, category, description, iconSymbol, id, main, manifest, minEngineVersion (+4 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "DocNexusStudio"
Cohesion: 0.23
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument (+2 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "SpeechStudio/storage.ts"
Cohesion: 0.27
Nodes (17): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfileAsync(), getClonedVoiceProfiles(), getClonedVoiceProfilesAsync(), getProfilesFilePath(), getSamplesDirectory() (+9 more)

### Community 37 - "react"
Cohesion: 0.07
Nodes (45): tesseract.js@^7.0.0, jszip, lucide-react, react, tesseract.js, MutedMarkdownProps, MutedMarkdownView(), PublicToolsHubView() (+37 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "scannerEngine.ts"
Cohesion: 0.17
Nodes (15): StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, StockStrategyMarketplaceProps, MARKET_UNIVERSES, ScannerCandidate, ScannerFilterOptions (+7 more)

### Community 40 - "express"
Cohesion: 0.14
Nodes (12): express@^4.21.2, express, errorHandler(), notFoundHandler(), requestLogger(), authLimiter, generalApiLimiter, RateLimitOptions (+4 more)

### Community 41 - "react"
Cohesion: 0.17
Nodes (20): AccountingView(), AccountingViewProps, DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView() (+12 more)

### Community 42 - "server.ts"
Cohesion: 0.09
Nodes (16): app, defaultPlugins, prisma, startPromise, upload, BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+8 more)

### Community 43 - "SpeechStudio/routes.ts"
Cohesion: 0.12
Nodes (23): executeBackgroundCloning(), executeBackgroundSynthesis(), getOracleTtsUrls(), getQuotaStatus(), getUserIdentifierAndRole(), logger, preprocessEmotionTags(), quotaStore (+15 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "DocNexus/storage.ts"
Cohesion: 0.27
Nodes (16): getValidatedUserEmail(), logger, registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument() (+8 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.15
Nodes (15): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, DEFAULT_SYNTHESIS_STEPS, SAMPLE_PROMPTS (+7 more)

### Community 47 - "vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/server.ts, outputDirectory, rewrites

### Community 48 - "DocNexus/types.ts"
Cohesion: 0.11
Nodes (21): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+13 more)

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
Cohesion: 0.15
Nodes (16): FinancialStatementsViewProps, GstrReportsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport, BankReconciliationItem, BankReconciliationReport (+8 more)

### Community 56 - "ResumeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 57 - "MotionStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 58 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13, @types/express@^4.17.21 (+19 more)

### Community 59 - "getPrismaClient"
Cohesion: 0.18
Nodes (30): appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteJsonData(), deleteSimulation(), detectMarketRegion(), ensureSimulatorStore() (+22 more)

### Community 60 - "deploy-production.ts"
Cohesion: 0.16
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "DocNexusStudio"
Cohesion: 0.54
Nodes (7): clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault(), openVaultDB(), sanitizeForLocalStorage(), saveVault()

### Community 62 - "pluginLogger.ts"
Cohesion: 0.18
Nodes (10): createPluginLogger(), PluginLogContext, PluginLogEntry, PluginLogLevel, PluginSpan, logger, ScopedDocumentInput, ScopedInvoiceInput (+2 more)

### Community 63 - "lucide-react"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 66 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 67 - "startServer"
Cohesion: 0.21
Nodes (8): hashPassword(), seedDatabase(), startServer(), appendMessageToSession(), loadSystemSettings(), runBackgroundAITask(), saveSystemSettings(), PluginEngine

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.12
Nodes (21): FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView(), ResumeStudioViewProps, ResumeStudioPlugin (+13 more)

### Community 70 - "ImageStudioView.tsx"
Cohesion: 0.22
Nodes (11): PROMPT_SUGGESTIONS, SAMPLE_IMAGES, AspectRatio, ImageGeneratePayload, ImageGenerateResult, ImageGenModel, ImageHistoryItem, ImageUpscalePayload (+3 more)

### Community 71 - "StockSimulatorPanel.tsx"
Cohesion: 0.36
Nodes (8): PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate, SimulationRegistryEntry

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "serverRegistry.ts"
Cohesion: 0.24
Nodes (9): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, StudioCastPlugin, manifest, getOrCreateRoom() (+1 more)

### Community 78 - "registerRoutes5"
Cohesion: 0.32
Nodes (12): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfiles(), getProfilesFilePath(), getQuotaStatus(), getSamplesDirectory(), getSpeechDataDirectory() (+4 more)

### Community 79 - "getDatabaseStatus"
Cohesion: 0.25
Nodes (9): executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), loadSyncHistory(), loadSyncHistoryFromDb(), parseDatabaseMetadata(), persistSyncHistoryInDb() (+1 more)

### Community 80 - "auth.ts"
Cohesion: 0.23
Nodes (10): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath() (+2 more)

### Community 81 - "package-plugins.ts"
Cohesion: 0.19
Nodes (11): IN_TREE_PLUGINS, PluginConfig, PluginManifest, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 83 - "DocNexusDocument"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 84 - "CutoutStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 85 - "MotionStudioView.tsx"
Cohesion: 0.13
Nodes (14): ApparelType, DeviceType, MockupCategory, MockupStudioTool(), ASPECT_RATIOS, AspectRatioConfig, AspectRatioType, MotionVideoStudioTool() (+6 more)

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

### Community 88 - "seed.ts"
Cohesion: 0.13
Nodes (15): generateToken(), SECRET_KEY, dotenv@^16.4.5, pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, dotenv, pg (+7 more)

### Community 89 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 90 - "clientRegistry.ts"
Cohesion: 0.08
Nodes (27): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, CutoutStudioView(), CutoutStudioPlugin, manifest, AudioTranscriberTool() (+19 more)

### Community 91 - "MockupStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 92 - "OcrReceiptModal.tsx"
Cohesion: 0.20
Nodes (16): CreateInvoiceDrawerProps, DraftLineItem, InvoiceAnalyticsChartProps, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, OcrReceiptModal() (+8 more)

### Community 93 - "TranscribeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 96 - "ToolsStudioView.tsx"
Cohesion: 0.40
Nodes (4): ToolsStudioView(), ToolsStudioViewProps, ToolsStudioPlugin, manifest

### Community 97 - "ref_fs"
Cohesion: 0.22
Nodes (8): ContextualChunk, ContextualRagResponse, RAG_DATA_DIR, RAG_INDEX_FILE, RagDocument, RagQueryResult, sovereignRag, STOP_WORDS

### Community 99 - "api/server.ts"
Cohesion: 0.25
Nodes (5): BACKEND_TARGET, config, handler(), maxDuration, ORACLE_BACKEND_URL

### Community 100 - "FlowDesignerView.tsx"
Cohesion: 0.20
Nodes (9): FlowDesignerView(), FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode, WorkflowTemplate, FlowDesignerPlugin (+1 more)

### Community 104 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 105 - "DocNexusStudio.tsx"
Cohesion: 0.17
Nodes (16): DocNexusView(), DocNexusViewProps, CommandPaletteModal(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, ExportModal(), RichDocStudio() (+8 more)

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `StudioCastView.tsx`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `patterns/types.ts`, `src/types.ts`, `Accounting/routes.ts`, `StockTrackerView.tsx`, `server.js`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `scannerEngine.ts`, `react`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `Accounting/types.ts`, `package.json`, `lucide-react`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `DocNexusDocument`, `MotionStudioView.tsx`, `clientRegistry.ts`, `OcrReceiptModal.tsx`, `ToolsStudioView.tsx`, `FlowDesignerView.tsx`, `DocNexusStudio.tsx`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06509803921568627 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `StudioCastView.tsx`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `patterns/types.ts`, `src/types.ts`, `StockTrackerView.tsx`, `server.js`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `scannerEngine.ts`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `package.json`, `lucide-react`, `WorkspacePluginStore.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `DocNexusDocument`, `MotionStudioView.tsx`, `clientRegistry.ts`, `OcrReceiptModal.tsx`, `ToolsStudioView.tsx`, `FlowDesignerView.tsx`, `DocNexusStudio.tsx`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `StudioCastView.tsx`, `StockTracker/routes.ts`, `server.ts`, `serverRegistry.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `auth.ts`, `package-plugins.ts`, `Accounting/routes.ts`, `server.js`, `package.json`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._