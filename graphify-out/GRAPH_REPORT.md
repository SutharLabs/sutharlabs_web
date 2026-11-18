# Graph Report - website  (2026-11-18)

## Corpus Check
- 233 files · ~520,767 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1906 nodes · 4495 edges · 110 communities (95 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5ed45769`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- WorkspacePluginStore.tsx
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
- Accounting/manifest.json
- OcrReceiptModal.tsx
- src/types.ts
- StockTrackerView.tsx
- server.js
- scannerEngine.ts
- exchangeCalendar.ts
- telemetryService.ts
- lucide-react
- gstEngine.ts
- tools/types.ts
- DocNexus/manifest.json
- ConfirmModal.tsx
- StockAnalyzer/manifest.json
- DocNexusStudio
- registerRoutes
- vite
- ref_fs
- scripts
- backtest/engine.ts
- express
- react
- server.ts
- SpeechStudio/routes.ts
- SpeechStudio/manifest.json
- DocNexus/storage.ts
- BugReportModal.tsx
- vercel.json
- plugins/types.ts
- SpeechStudio/storage.ts
- deploy.sh
- startServer
- SpeechStudioView.tsx
- loadTenantData
- Accounting/types.ts
- ResumeStudio/manifest.json
- MotionStudio/manifest.json
- package.json
- getPrismaClient
- deploy-production.ts
- DocNexusStudio
- DocNexusStudio.tsx
- lucide-react
- PluginLogger
- FlowDesignerView.tsx
- FlowDesigner/manifest.json
- startServer
- ResumeEngine.tsx
- ImageStudioView.tsx
- StockSimulatorPanel.tsx
- pluginLogger.ts
- ImageStudio/manifest.json
- getInvoices
- _utils.ts
- StockTracker/manifest.json
- LandingPage.tsx
- registerRoutes5
- getDatabaseStatus
- auth.ts
- BusinessCardScannerTool.tsx
- StudioCast/manifest.json
- api/server.ts
- CutoutStudio/manifest.json
- BackgroundRemoverTool.tsx
- getMarketSessionStatus
- ContextualRagEngine
- SlideDeckStudio.tsx
- clientRegistry.ts
- AudioTranscriberTool.tsx
- MockupStudio/manifest.json
- audioSynth.ts
- TranscribeStudio/manifest.json
- MotionVideoStudioTool.tsx
- serverRegistry.ts
- @neondatabase/serverless
- MockupStudioView.tsx
- dotenv
- PluginEngine
- FlowDesigner/index.ts
- Accounting/index.ts
- AudioTranscriberTool
- @google/genai
- multer
- DocNexus/types.ts
- pdfjs-dist
- qrcode
- @types/qrcode@^1.5.6
- @vercel/blob

## God Nodes (most connected - your core abstractions)
1. `react` - 96 edges
2. `lucide-react` - 73 edges
3. `startServer()` - 54 edges
4. `registerRoutes()` - 46 edges
5. `TerminalLog` - 44 edges
6. `getPrismaClient()` - 39 edges
7. `startServer()` - 35 edges
8. `registerRoutes()` - 30 edges
9. `PdfToolsStudio()` - 29 edges
10. `AccountingStorage` - 27 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --calls--> `PluginEngine`  [EXTRACTED]
  server.ts → src/plugins/PluginEngine.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (110 total, 15 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 2 - "src/types.ts"
Cohesion: 0.09
Nodes (29): AccountingViewProps, AdminAIChatViewProps, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ManageAppsView(), ManageProps, BugReportItem, BugReportsStats (+21 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, better-sqlite3@^12.10.0, google-auth-library@^10.9.0, jszip@^3.10.2, lucide-react@^0.546.0, motion@^12.23.24, @prisma/adapter-better-sqlite3@^7.8.0, @prisma/adapter-neon@^7.9.1 (+20 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (19): KNOWN_US_TICKERS, loadWatchlistsFromDisk(), logger, registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord (+11 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.15
Nodes (35): getPrismaClient(), main(), executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), appendHistoryReport(), closeEODPosition() (+27 more)

### Community 8 - "App.tsx"
Cohesion: 0.08
Nodes (28): react-router-dom@^7.15.1, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+20 more)

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
Cohesion: 0.07
Nodes (34): CATEGORIES, StorageVaultView(), StudioCastView(), ParticipantStreamSource, StudioCastCompositor, chatStore, getOrCreateRoom(), logger (+26 more)

### Community 15 - "imageGenService.ts"
Cohesion: 0.19
Nodes (11): ASPECT_RATIO_DIMS, buildEnhancedPrompt(), GeneratedImageResult, generateSovereignImage(), getStorageDirectory(), ImageGenOptions, ImageModelInfo, ImageProcessOptions (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "src/types.ts"
Cohesion: 0.10
Nodes (40): AdminAIChatView(), init(), budgetDocumentText(), INITIAL_PROMPTS, toSafeTimestamp(), AIEcosystemStudioView(), AIEcosystemStudioViewProps, DEFAULT_MCP_SERVERS (+32 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "OcrReceiptModal.tsx"
Cohesion: 0.19
Nodes (17): CreateInvoiceDrawerProps, DraftLineItem, InvoiceAnalyticsChartProps, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, OcrReceiptModal() (+9 more)

### Community 22 - "src/types.ts"
Cohesion: 0.10
Nodes (20): @react-oauth/google@^0.13.5, @react-oauth/google, AuthPage(), AuthPageProps, LandingPageProps, UserProfileViewProps, AIArtifactItem, AIChatAttachment (+12 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.05
Nodes (32): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, Analysis (+24 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.18
Nodes (19): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+11 more)

### Community 26 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.18
Nodes (13): FleetTelemetry, formatUptime(), getCpuSnapshot(), getFleetTelemetry(), getRequestMetrics(), getSystemTelemetry(), IncidentAlert, lastCpuSample (+5 more)

### Community 28 - "lucide-react"
Cohesion: 0.18
Nodes (17): PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool(), ImageToPdfTool(), MergePdfTool(), PdfEditorTool(), PdfToImageTool() (+9 more)

### Community 29 - "gstEngine.ts"
Cohesion: 0.12
Nodes (23): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), PartyMasterView(), PartyMasterViewProps, amountInWordsIndian(), convertThreeDigits(), convertTwoDigits() (+15 more)

### Community 30 - "tools/types.ts"
Cohesion: 0.16
Nodes (10): Base64Tool(), HashGeneratorTool(), JsonConverterTool(), QrGeneratorTool(), TextDiffTool(), SubToolProps, ToolCategory, ToolMeta (+2 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.15
Nodes (12): DocNexusPlugin, category, description, iconSymbol, id, main, manifest, minEngineVersion (+4 more)

### Community 32 - "ConfirmModal.tsx"
Cohesion: 0.11
Nodes (18): AdminConsoleProps, AdminConsoleView(), FleetTelemetry, IncidentAlert, NodeServiceStatus, NodeTelemetry, SystemTelemetry, ConfirmModal() (+10 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "DocNexusStudio"
Cohesion: 0.23
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal(), ExportModalProps, DocNexusDocument (+2 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "vite"
Cohesion: 0.67
Nodes (3): vite@^6.2.3, vite@^6.2.3, vite

### Community 37 - "ref_fs"
Cohesion: 0.13
Nodes (11): @vitejs/plugin-react@^5.0.4, @vitejs/plugin-react, PluginManifest, ContextualChunk, ContextualRagResponse, RAG_DATA_DIR, RAG_INDEX_FILE, RagDocument (+3 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "backtest/engine.ts"
Cohesion: 0.12
Nodes (31): StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, StockStrategyMarketplaceProps, fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction() (+23 more)

### Community 40 - "express"
Cohesion: 0.14
Nodes (12): express@^4.21.2, express, errorHandler(), notFoundHandler(), requestLogger(), authLimiter, generalApiLimiter, RateLimitOptions (+4 more)

### Community 41 - "react"
Cohesion: 0.19
Nodes (19): react, AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView() (+11 more)

### Community 42 - "server.ts"
Cohesion: 0.08
Nodes (18): hashPassword(), app, defaultPlugins, prisma, seedDatabase(), startPromise, upload, BlobUploadOptions (+10 more)

### Community 43 - "SpeechStudio/routes.ts"
Cohesion: 0.12
Nodes (23): executeBackgroundCloning(), executeBackgroundSynthesis(), getOracleTtsUrls(), getQuotaStatus(), getUserIdentifierAndRole(), logger, preprocessEmotionTags(), quotaStore (+15 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "DocNexus/storage.ts"
Cohesion: 0.27
Nodes (16): getValidatedUserEmail(), logger, registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument() (+8 more)

### Community 46 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 47 - "vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/server.ts, outputDirectory, rewrites

### Community 48 - "plugins/types.ts"
Cohesion: 0.18
Nodes (10): ClientPluginEntry, CutoutStudioView(), CutoutStudioPlugin, manifest, TranscribeStudioView(), TranscribeStudioPlugin, manifest, WorkspacePluginManifest (+2 more)

### Community 49 - "SpeechStudio/storage.ts"
Cohesion: 0.27
Nodes (17): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfileAsync(), getClonedVoiceProfiles(), getClonedVoiceProfilesAsync(), getProfilesFilePath(), getSamplesDirectory() (+9 more)

### Community 51 - "startServer"
Cohesion: 0.08
Nodes (33): createBugReport(), decryptPluginPackage(), deleteBugReport(), deleteFromBlob(), encryptPluginPackage(), errorHandler(), exportDatabaseDump(), generateToken() (+25 more)

### Community 52 - "SpeechStudioView.tsx"
Cohesion: 0.15
Nodes (15): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, DEFAULT_SYNTHESIS_STEPS, SAMPLE_PROMPTS (+7 more)

### Community 53 - "loadTenantData"
Cohesion: 0.11
Nodes (28): addItem(), addParty(), addVoucher(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), buildGSTInvoiceObject(), calculateItemTaxes() (+20 more)

### Community 54 - "Accounting/types.ts"
Cohesion: 0.13
Nodes (21): FinancialStatementsViewProps, DEFAULT_COMPANY, DEFAULT_ITEMS, DEFAULT_PARTIES, getInitialVouchers(), tenantMemoryCache, AccountHead, AgingAnalysisReport (+13 more)

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
Cohesion: 0.18
Nodes (15): args, colors, commitMsgArg, logError(), logStep(), logSuccess(), logWarn(), main() (+7 more)

### Community 61 - "DocNexusStudio"
Cohesion: 0.54
Nodes (7): clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault(), openVaultDB(), sanitizeForLocalStorage(), saveVault()

### Community 62 - "DocNexusStudio.tsx"
Cohesion: 0.17
Nodes (16): DocNexusView(), DocNexusViewProps, CommandPaletteModal(), DocExplorerSidebar(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, RichDocStudio() (+8 more)

### Community 63 - "lucide-react"
Cohesion: 0.19
Nodes (11): lucide-react, MarkdownStudio(), MarkdownStudioProps, OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, COMMAND_LIST, CommandItem, SlashCommandMenu() (+3 more)

### Community 65 - "FlowDesignerView.tsx"
Cohesion: 0.29
Nodes (6): FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode, WorkflowTemplate

### Community 66 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 67 - "startServer"
Cohesion: 0.16
Nodes (16): startServer(), appendMessageToSession(), broadcastSessionChunk(), broadcastSessionDone(), broadcastSessionError(), collectWorkspaceFiles(), ensureOpenCodeWorkspacesRoot(), executeMcpTool() (+8 more)

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.12
Nodes (22): jszip, FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView(), ResumeStudioViewProps (+14 more)

### Community 70 - "ImageStudioView.tsx"
Cohesion: 0.16
Nodes (14): ImageStudioView(), PROMPT_SUGGESTIONS, SAMPLE_IMAGES, ImageStudioPlugin, manifest, AspectRatio, ImageGeneratePayload, ImageGenerateResult (+6 more)

### Community 71 - "StockSimulatorPanel.tsx"
Cohesion: 0.36
Nodes (8): PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate, SimulationRegistryEntry

### Community 72 - "pluginLogger.ts"
Cohesion: 0.18
Nodes (10): createPluginLogger(), PluginLogContext, PluginLogEntry, PluginLogLevel, PluginSpan, logger, ScopedDocumentInput, ScopedInvoiceInput (+2 more)

### Community 73 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "_utils.ts"
Cohesion: 0.11
Nodes (22): generateToken(), SECRET_KEY, pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client (+14 more)

### Community 76 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 77 - "LandingPage.tsx"
Cohesion: 0.19
Nodes (13): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+5 more)

### Community 78 - "registerRoutes5"
Cohesion: 0.32
Nodes (12): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfiles(), getProfilesFilePath(), getQuotaStatus(), getSamplesDirectory(), getSpeechDataDirectory() (+4 more)

### Community 79 - "getDatabaseStatus"
Cohesion: 0.25
Nodes (9): executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), loadSyncHistory(), loadSyncHistoryFromDb(), parseDatabaseMetadata(), persistSyncHistoryInDb() (+1 more)

### Community 80 - "auth.ts"
Cohesion: 0.23
Nodes (10): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), optionalAuth(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath() (+2 more)

### Community 81 - "BusinessCardScannerTool.tsx"
Cohesion: 0.22
Nodes (6): tesseract.js@^7.0.0, tesseract.js, BusinessCardContact, MultilingualOcrTool(), CsvReceiptRow, ReceiptToCsvTool()

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 83 - "api/server.ts"
Cohesion: 0.25
Nodes (5): BACKEND_TARGET, config, handler(), maxDuration, ORACLE_BACKEND_URL

### Community 84 - "CutoutStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 85 - "BackgroundRemoverTool.tsx"
Cohesion: 0.13
Nodes (13): @imgly/background-removal@^1.7.0, @imgly/background-removal, BackdropPreset, BackgroundRemoverTool(), ProcessedImageItem, ApparelType, DeviceType, MockupCategory (+5 more)

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

### Community 88 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 89 - "clientRegistry.ts"
Cohesion: 0.15
Nodes (9): CLIENT_PLUGIN_REGISTRY, MotionStudioPlugin, manifest, ToolsStudioPlugin, manifest, SpeechStudioPlugin, manifest, StockTrackerPlugin (+1 more)

### Community 90 - "AudioTranscriberTool.tsx"
Cohesion: 0.25
Nodes (5): AppIconGeneratorTool(), GeneratedAsset, AudioFileItem, SubtitleSegment, ToolCommonProps

### Community 91 - "MockupStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 92 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 93 - "TranscribeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 94 - "MotionVideoStudioTool.tsx"
Cohesion: 0.29
Nodes (6): ASPECT_RATIOS, AspectRatioConfig, AspectRatioType, PRESET_COLORS, TEMPLATES, VideoTemplateType

### Community 95 - "serverRegistry.ts"
Cohesion: 0.27
Nodes (8): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, StudioCastPlugin, manifest, registerRoutes()

### Community 96 - "@neondatabase/serverless"
Cohesion: 0.20
Nodes (6): @neondatabase/serverless@^1.1.0, pdf-lib@^1.17.1, @types/ws@^8.18.1, @neondatabase/serverless, pdf-lib, @types/ws

### Community 97 - "MockupStudioView.tsx"
Cohesion: 0.47
Nodes (3): MockupStudioView(), MockupStudioPlugin, manifest

### Community 98 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 100 - "FlowDesigner/index.ts"
Cohesion: 0.50
Nodes (3): FlowDesignerView(), FlowDesignerPlugin, manifest

### Community 102 - "AudioTranscriberTool"
Cohesion: 0.67
Nodes (3): @huggingface/transformers@^4.3.2, @huggingface/transformers, AudioTranscriberTool()

### Community 105 - "DocNexus/types.ts"
Cohesion: 0.15
Nodes (15): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+7 more)

## Knowledge Gaps
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `WorkspacePluginStore.tsx`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `OcrReceiptModal.tsx`, `src/types.ts`, `StockTrackerView.tsx`, `server.js`, `lucide-react`, `gstEngine.ts`, `tools/types.ts`, `ConfirmModal.tsx`, `DocNexusStudio`, `backtest/engine.ts`, `BugReportModal.tsx`, `plugins/types.ts`, `SpeechStudioView.tsx`, `Accounting/types.ts`, `package.json`, `DocNexusStudio.tsx`, `lucide-react`, `FlowDesignerView.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `LandingPage.tsx`, `BusinessCardScannerTool.tsx`, `BackgroundRemoverTool.tsx`, `SlideDeckStudio.tsx`, `clientRegistry.ts`, `AudioTranscriberTool.tsx`, `MotionVideoStudioTool.tsx`, `MockupStudioView.tsx`, `DocNexus/types.ts`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09243697478991597 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `WorkspacePluginStore.tsx`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `OcrReceiptModal.tsx`, `StockTrackerView.tsx`, `server.js`, `lucide-react`, `tools/types.ts`, `ConfirmModal.tsx`, `DocNexusStudio`, `backtest/engine.ts`, `BugReportModal.tsx`, `plugins/types.ts`, `SpeechStudioView.tsx`, `package.json`, `DocNexusStudio.tsx`, `FlowDesignerView.tsx`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `LandingPage.tsx`, `BusinessCardScannerTool.tsx`, `BackgroundRemoverTool.tsx`, `SlideDeckStudio.tsx`, `AudioTranscriberTool.tsx`, `MotionVideoStudioTool.tsx`, `MockupStudioView.tsx`, `DocNexus/types.ts`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `ref_fs`, `StockTracker/routes.ts`, `server.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `StudioCastCompositor`, `auth.ts`, `server.js`, `package.json`, `gstEngine.ts`, `serverRegistry.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._