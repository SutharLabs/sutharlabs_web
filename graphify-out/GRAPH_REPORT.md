# Graph Report - website  (2026-11-12)

## Corpus Check
- 233 files · ~514,064 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1898 nodes · 4487 edges · 105 communities (92 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd7506e5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- ConfirmModal.tsx
- src/types.ts
- indicatorEngine.ts
- dependencies
- StockTracker/routes.ts
- SovereignTools/manifest.json
- tradeSimulator.ts
- react
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
- GSTInvoice
- fetcher.ts
- StockTrackerView.tsx
- server.js
- scannerEngine.ts
- @imgly/background-removal
- telemetryService.ts
- LandingPage.tsx
- gstEngine.ts
- backtest/engine.ts
- DocNexus/manifest.json
- backgroundWorker.ts
- StockAnalyzer/manifest.json
- DocNexusStudio
- registerRoutes
- SpeechStudio/storage.ts
- react
- scripts
- StockStrategyMarketplace.tsx
- express
- react
- server.ts
- SpeechStudio/routes.ts
- SpeechStudio/manifest.json
- DocNexus/storage.ts
- SpeechStudioView.tsx
- vercel.json
- DocNexus/types.ts
- BugReportModal.tsx
- deploy.sh
- startServer
- scannerEngine.ts
- loadTenantData
- Accounting/types.ts
- ResumeStudio/manifest.json
- MotionStudio/manifest.json
- package.json
- getPrismaClient
- deploy-production.ts
- DocNexusStudio
- scopedDatabase.ts
- lucide-react
- PluginLogger
- multer
- FlowDesigner/manifest.json
- startServer
- ResumeEngine.tsx
- ImageStudioView.tsx
- StockSimulatorPanel.tsx
- @prisma/adapter-better-sqlite3@^7.8.0
- ImageStudio/manifest.json
- getInvoices
- seed.ts
- StockTracker/manifest.json
- unifiedInferenceQueue.ts
- registerRoutes5
- getDatabaseStatus
- auth.ts
- package-plugins.ts
- StudioCast/manifest.json
- DocNexusDocument
- CutoutStudio/manifest.json
- MotionVideoStudioTool.tsx
- getMarketSessionStatus
- ContextualRagEngine
- @vercel/blob
- exchangeCalendar.ts
- clientRegistry.ts
- MockupStudio/manifest.json
- OcrReceiptModal.tsx
- TranscribeStudio/manifest.json
- ws
- serverRegistry.ts
- api/server.ts
- ref_fs
- dotenv
- StockTracker/index.ts
- FlowDesignerView.tsx
- @prisma/adapter-neon
- @vitejs/plugin-react
- vite
- DocNexusStudio.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 96 edges
2. `lucide-react` - 73 edges
3. `startServer()` - 48 edges
4. `registerRoutes()` - 46 edges
5. `TerminalLog` - 44 edges
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

## Communities (105 total, 13 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "ConfirmModal.tsx"
Cohesion: 0.22
Nodes (8): ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, SYNC_STAGES, SyncHistoryEntry, SyncHistorySummary

### Community 2 - "src/types.ts"
Cohesion: 0.07
Nodes (43): WorkspaceLayout(), AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ConfirmModal() (+35 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (33): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, @google/genai@^2.4.0, @huggingface/transformers@^4.3.2, jszip@^3.10.2, lucide-react@^0.546.0, motion@^12.23.24 (+25 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (18): loadWatchlistsFromDisk(), logger, registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+10 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.22
Nodes (30): getPrismaClient(), detectMarketRegion(), appendHistoryReport(), closeEODPosition(), createInitialSimulatorState(), createSimulationInstance(), deleteSimulation(), ensureSimulatorStore() (+22 more)

### Community 8 - "react"
Cohesion: 0.09
Nodes (30): react, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+22 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.21
Nodes (11): analyzeAutonomousFallback(), analyzeStockSentiment(), BEARISH_LEXICON, BULLISH_LEXICON, detectCatalyst(), SENTIMENT_CACHE, SentimentCacheEntry, HeadlineSentimentAnalysis (+3 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.20
Nodes (18): colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX(), parseRTF() (+10 more)

### Community 13 - "StudioCastCompositor"
Cohesion: 0.07
Nodes (32): CATEGORIES, StorageVaultView(), StudioCastView(), ParticipantStreamSource, StudioCastCompositor, StudioCastPlugin, manifest, chatStore (+24 more)

### Community 15 - "imageGenService.ts"
Cohesion: 0.17
Nodes (12): executeMcpTool(), ASPECT_RATIO_DIMS, buildEnhancedPrompt(), GeneratedImageResult, generateSovereignImage(), getStorageDirectory(), ImageGenOptions, ImageModelInfo (+4 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.20
Nodes (15): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE (+7 more)

### Community 17 - "src/types.ts"
Cohesion: 0.07
Nodes (57): AdminAIChatView(), init(), budgetDocumentText(), INITIAL_PROMPTS, toSafeTimestamp(), AIEcosystemStudioView(), AIEcosystemStudioViewProps, DEFAULT_MCP_SERVERS (+49 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 21 - "GSTInvoice"
Cohesion: 0.20
Nodes (13): CreateInvoiceDrawerProps, InvoiceAnalyticsChartProps, ItemCatalogViewProps, OcrReceiptModalProps, PartyMasterView(), PartyMasterViewProps, DEFAULT_COMPANY, TaxInvoiceModalProps (+5 more)

### Community 22 - "fetcher.ts"
Cohesion: 0.30
Nodes (11): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+3 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (19): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+11 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.20
Nodes (18): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+10 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.16
Nodes (15): requestLogger(), FleetTelemetry, formatUptime(), getCpuSnapshot(), getFleetTelemetry(), getRequestMetrics(), getSystemTelemetry(), IncidentAlert (+7 more)

### Community 28 - "LandingPage.tsx"
Cohesion: 0.18
Nodes (14): ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails(), LandingPage(), PortfolioProject (+6 more)

### Community 29 - "gstEngine.ts"
Cohesion: 0.14
Nodes (21): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), COMMON_HSN_SAC_CATALOG (+13 more)

### Community 30 - "backtest/engine.ts"
Cohesion: 0.13
Nodes (27): StockBacktestPanelProps, StockScannerPanelProps, StockStrategyMarketplaceProps, calculateRegionalFriction(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint, BacktestMetrics (+19 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.15
Nodes (12): DocNexusPlugin, category, description, iconSymbol, id, main, manifest, minEngineVersion (+4 more)

### Community 32 - "backgroundWorker.ts"
Cohesion: 0.19
Nodes (7): SECRET_KEY, main(), executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), listSimulations()

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "DocNexusStudio"
Cohesion: 0.19
Nodes (12): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal() (+4 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "SpeechStudio/storage.ts"
Cohesion: 0.37
Nodes (13): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfiles(), getClonedVoiceProfilesAsync(), getProfilesFilePath(), getSamplesDirectory(), getSpeechDataDirectory(), loadProfilesFromDisk() (+5 more)

### Community 37 - "react"
Cohesion: 0.07
Nodes (41): jszip, lucide-react, tesseract.js, PublicToolsHubView(), PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool() (+33 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "StockStrategyMarketplace.tsx"
Cohesion: 0.19
Nodes (12): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps, StockTrackerAlertState, createWatchlistItem() (+4 more)

### Community 40 - "express"
Cohesion: 0.16
Nodes (9): express, errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter (+1 more)

### Community 41 - "react"
Cohesion: 0.20
Nodes (17): AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView(), GstrReportsViewProps (+9 more)

### Community 42 - "server.ts"
Cohesion: 0.09
Nodes (16): app, defaultPlugins, prisma, startPromise, upload, BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+8 more)

### Community 43 - "SpeechStudio/routes.ts"
Cohesion: 0.17
Nodes (19): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions, executeBackgroundCloning(), executeBackgroundSynthesis(), getOracleTtsUrls(), getQuotaStatus(), getUserIdentifierAndRole() (+11 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "DocNexus/storage.ts"
Cohesion: 0.23
Nodes (18): createPluginLogger(), getValidatedUserEmail(), logger, registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument() (+10 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.12
Nodes (19): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, DEFAULT_SYNTHESIS_STEPS, SAMPLE_PROMPTS (+11 more)

### Community 47 - "vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/server.ts, outputDirectory, rewrites

### Community 48 - "DocNexus/types.ts"
Cohesion: 0.13
Nodes (17): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, DEFAULT_SHEET (+9 more)

### Community 49 - "BugReportModal.tsx"
Cohesion: 0.13
Nodes (13): BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot (+5 more)

### Community 51 - "startServer"
Cohesion: 0.08
Nodes (33): createBugReport(), decryptPluginPackage(), deleteBugReport(), deleteFromBlob(), encryptPluginPackage(), errorHandler(), exportDatabaseDump(), generateToken() (+25 more)

### Community 52 - "scannerEngine.ts"
Cohesion: 0.32
Nodes (6): UNIVERSE_OPTIONS, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, PRESET_STRATEGIES

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
Cohesion: 0.29
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), SpreadsheetStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 62 - "scopedDatabase.ts"
Cohesion: 0.33
Nodes (5): logger, ScopedDocumentInput, ScopedInvoiceInput, ScopedVaultFileInput, ScopedVoiceProfileInput

### Community 63 - "lucide-react"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 64 - "PluginLogger"
Cohesion: 0.20
Nodes (6): generateTraceId(), PluginLogContext, PluginLogEntry, PluginLogger, PluginLogLevel, PluginSpan

### Community 65 - "multer"
Cohesion: 0.14
Nodes (8): google-auth-library@^10.9.0, multer@^2.1.1, pdf-lib@^1.17.1, @types/qrcode@^1.5.6, google-auth-library, multer, pdf-lib, @types/qrcode

### Community 66 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 67 - "startServer"
Cohesion: 0.14
Nodes (14): handler(), generateToken(), hashPassword(), seedDatabase(), startServer(), appendMessageToSession(), broadcastSessionChunk(), broadcastSessionDone() (+6 more)

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.13
Nodes (21): FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, ResumeStudioView(), ResumeStudioViewProps, ResumeStudioPlugin (+13 more)

### Community 70 - "ImageStudioView.tsx"
Cohesion: 0.16
Nodes (14): ImageStudioView(), PROMPT_SUGGESTIONS, SAMPLE_IMAGES, ImageStudioPlugin, manifest, AspectRatio, ImageGeneratePayload, ImageGenerateResult (+6 more)

### Community 71 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

### Community 73 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 74 - "getInvoices"
Cohesion: 0.19
Nodes (13): getAgingAnalysis(), getBalanceSheet(), getBankReconciliation(), getCompany(), getGeneralLedger(), getGSTR1Report(), getGSTR3BReport(), getInvoiceById() (+5 more)

### Community 75 - "seed.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 76 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 77 - "unifiedInferenceQueue.ts"
Cohesion: 0.20
Nodes (9): ActiveTaskDetails, InferenceTaskType, JobStatus, QueuedJob, QueuePositionInfo, QueueTelemetry, StepDiagnostic, TaskPriority (+1 more)

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
Cohesion: 0.23
Nodes (11): IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive() (+3 more)

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 83 - "DocNexusDocument"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 84 - "CutoutStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 85 - "MotionVideoStudioTool.tsx"
Cohesion: 0.29
Nodes (6): ASPECT_RATIOS, AspectRatioConfig, AspectRatioType, PRESET_COLORS, TEMPLATES, VideoTemplateType

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

### Community 89 - "exchangeCalendar.ts"
Cohesion: 0.31
Nodes (9): getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS, NYSE_NASDAQ_HOLIDAYS (+1 more)

### Community 90 - "clientRegistry.ts"
Cohesion: 0.06
Nodes (35): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, getClientPluginById(), getClientPluginByName(), getClientPluginByRoute(), CutoutStudioView() (+27 more)

### Community 91 - "MockupStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 92 - "OcrReceiptModal.tsx"
Cohesion: 0.22
Nodes (9): pdfjs-dist@^6.4.299, pdfjs-dist, DraftLineItem, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, OcrReceiptModal(), GSTRate (+1 more)

### Community 93 - "TranscribeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 95 - "serverRegistry.ts"
Cohesion: 0.39
Nodes (6): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, registerRoutes()

### Community 96 - "api/server.ts"
Cohesion: 0.33
Nodes (4): BACKEND_TARGET, config, maxDuration, ORACLE_BACKEND_URL

### Community 97 - "ref_fs"
Cohesion: 0.13
Nodes (11): @tailwindcss/vite@^4.1.14, @tailwindcss/vite, PluginManifest, ContextualChunk, ContextualRagResponse, RAG_DATA_DIR, RAG_INDEX_FILE, RagDocument (+3 more)

### Community 98 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 100 - "FlowDesignerView.tsx"
Cohesion: 0.20
Nodes (9): FlowDesignerView(), FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode, WorkflowTemplate, FlowDesignerPlugin (+1 more)

### Community 104 - "vite"
Cohesion: 0.67
Nodes (3): vite@^6.2.3, vite@^6.2.3, vite

### Community 105 - "DocNexusStudio.tsx"
Cohesion: 0.15
Nodes (16): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, FORMAT_TABS, INITIAL_DOCS, InspectorPanel(), InspectorPanelProps (+8 more)

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `ConfirmModal.tsx`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `GSTInvoice`, `StockTrackerView.tsx`, `server.js`, `LandingPage.tsx`, `gstEngine.ts`, `backtest/engine.ts`, `DocNexusStudio`, `react`, `StockStrategyMarketplace.tsx`, `react`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `BugReportModal.tsx`, `scannerEngine.ts`, `Accounting/types.ts`, `package.json`, `DocNexusStudio`, `lucide-react`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `DocNexusDocument`, `MotionVideoStudioTool.tsx`, `clientRegistry.ts`, `OcrReceiptModal.tsx`, `FlowDesignerView.tsx`, `DocNexusStudio.tsx`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06938775510204082 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `ConfirmModal.tsx`, `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `react`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `StockTrackerView.tsx`, `server.js`, `LandingPage.tsx`, `backtest/engine.ts`, `DocNexusStudio`, `StockStrategyMarketplace.tsx`, `SpeechStudioView.tsx`, `DocNexus/types.ts`, `BugReportModal.tsx`, `scannerEngine.ts`, `package.json`, `lucide-react`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `DocNexusDocument`, `MotionVideoStudioTool.tsx`, `clientRegistry.ts`, `OcrReceiptModal.tsx`, `FlowDesignerView.tsx`, `DocNexusStudio.tsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `ref_fs`, `dependencies`, `StockTracker/routes.ts`, `server.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `StudioCastCompositor`, `auth.ts`, `server.js`, `package.json`, `telemetryService.ts`, `gstEngine.ts`, `serverRegistry.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._