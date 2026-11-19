# Graph Report - website  (2026-11-19)

## Corpus Check
- 233 files · ~523,039 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1909 nodes · 4501 edges · 108 communities (89 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5eef3d58`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registerRoutes
- storageUtils.ts
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
- GSTInvoice
- StockTrackerView.tsx
- server.js
- scannerEngine.ts
- scannerEngine.ts
- telemetryService.ts
- lucide-react
- gstEngine.ts
- unifiedInferenceQueue.ts
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
- clientRegistry.ts
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
- pluginCrypto.ts
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
- FlowDesignerView.tsx
- registerRoutes5
- getDatabaseStatus
- fetcher.ts
- OpenLocalWorkspaceModal.tsx
- StudioCast/manifest.json
- StockTrackerView
- CutoutStudio/manifest.json
- MotionVideoStudioTool.tsx
- getMarketSessionStatus
- ContextualRagEngine
- SlideDeckStudio.tsx
- @prisma/adapter-neon
- technicalindicators
- MockupStudio/manifest.json
- @types/pg@^8.21.0
- TranscribeStudio/manifest.json
- yahoo-finance2
- serverRegistry.ts
- better-sqlite3@^12.10.0
- backgroundWorker.ts
- dotenv
- PluginEngine
- ToolsStudioView.tsx
- StockTracker/index.ts
- StockTrackerAlertModal.tsx
- multer
- DocNexus/types.ts
- pdfjs-dist
- qrcode
- @types/qrcode@^1.5.6

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
- `startServer()` --indirect_call--> `requireAdmin()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --calls--> `PluginEngine`  [EXTRACTED]
  server.ts → src/plugins/PluginEngine.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (108 total, 19 thin omitted)

### Community 0 - "registerRoutes"
Cohesion: 0.20
Nodes (7): registerRoutes(), AccountingStorage, getAccountingDataDirectory(), getSafeFileSlug(), loadTenantData(), normalizeUserEmail(), saveTenantData()

### Community 1 - "storageUtils.ts"
Cohesion: 0.22
Nodes (13): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 2 - "src/types.ts"
Cohesion: 0.06
Nodes (48): WorkspaceLayout(), AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), CollapsibleLogDrawer(), CollapsibleLogDrawerProps, ConfirmModal() (+40 more)

### Community 3 - "indicatorEngine.ts"
Cohesion: 0.13
Nodes (25): lightweight-charts@^5.2.1, lightweight-charts, ChartLegend(), ChartLegendProps, HoveredBarData, calculateDonchian(), calculateIndicatorData(), calculateKeltner() (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, google-auth-library@^10.9.0, @google/genai@^2.4.0, @huggingface/transformers@^4.3.2, @imgly/background-removal@^1.7.0, jszip@^3.10.2, lucide-react@^0.546.0, motion@^12.23.24 (+22 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.10
Nodes (17): loadWatchlistsFromDisk(), logger, registerRoutes(), saveWatchlistsToDisk(), SEED_WATCHLISTS, WatchlistItem, WatchlistRecord, addStrategyReview() (+9 more)

### Community 6 - "SovereignTools/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 7 - "tradeSimulator.ts"
Cohesion: 0.17
Nodes (34): detectMarketRegion(), getExchangeHolidayName(), getMarketSessionStatus(), isExchangeTradingDay(), LSE_UK_HOLIDAYS, MarketSessionStatus, normalizeMarketKey(), NSE_BSE_HOLIDAYS (+26 more)

### Community 8 - "App.tsx"
Cohesion: 0.07
Nodes (43): react, react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP (+35 more)

### Community 10 - "patterns/types.ts"
Cohesion: 0.22
Nodes (12): detectCandlestickPatterns(), ChartPatternsPanelProps, detectGeometricPatterns(), scanChartPatterns(), CandleData, DetectedPattern, KeyPivotPoint, PatternAction (+4 more)

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.21
Nodes (11): analyzeAutonomousFallback(), analyzeStockSentiment(), BEARISH_LEXICON, BULLISH_LEXICON, detectCatalyst(), SENTIMENT_CACHE, SentimentCacheEntry, HeadlineSentimentAnalysis (+3 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.17
Nodes (21): SheetColumn, SheetRow, SpreadsheetState, colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook() (+13 more)

### Community 13 - "StudioCastCompositor"
Cohesion: 0.07
Nodes (35): CATEGORIES, extractAllFolderPaths(), getParentFolder(), StorageVaultView(), StudioCastView(), ParticipantStreamSource, StudioCastCompositor, chatStore (+27 more)

### Community 15 - "imageGenService.ts"
Cohesion: 0.19
Nodes (11): ASPECT_RATIO_DIMS, buildEnhancedPrompt(), GeneratedImageResult, generateSovereignImage(), getStorageDirectory(), ImageGenOptions, ImageModelInfo, ImageProcessOptions (+3 more)

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.17
Nodes (19): getPrismaClient(), dotenv@^16.4.5, dotenv, runCronSync(), main(), DatabaseSyncHistoryEntry, executeDatabaseSync(), exportDatabaseDump() (+11 more)

### Community 17 - "src/types.ts"
Cohesion: 0.07
Nodes (54): AdminAIChatView(), init(), budgetDocumentText(), INITIAL_PROMPTS, toSafeTimestamp(), AIEcosystemStudioView(), AIEcosystemStudioViewProps, DEFAULT_MCP_SERVERS (+46 more)

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
Cohesion: 0.25
Nodes (8): DraftLineItem, ItemCatalogViewProps, EXPENSE_CATEGORIES, OcrExtractedLineItem, OcrReceiptData, GSTRate, GSTInvoiceItem, ItemMaster

### Community 22 - "GSTInvoice"
Cohesion: 0.18
Nodes (15): CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawerProps, InvoiceAnalyticsChartProps, OcrReceiptModal(), OcrReceiptModalProps, PartyMasterView(), PartyMasterViewProps (+7 more)

### Community 23 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (18): Analysis, Candle, CANDLE_INTERVAL_OPTIONS, CandleInterval, DEFAULT_CANDLE_FOR_SCALE, DEFAULT_UNIVERSES, DEFAULT_WATCHLISTS, INDEX_TICKER_MAP (+10 more)

### Community 24 - "server.js"
Cohesion: 0.05
Nodes (48): analyzeAutonomousFallback(), analyzeStockSentiment(), authenticateToken(), buildRegionalQueries(), cleanRssText(), createDefaultUserDocuments(), createDocument(), decodeHtmlEntities() (+40 more)

### Community 25 - "scannerEngine.ts"
Cohesion: 0.23
Nodes (16): AnalysisOptions, formatTickerDisplay(), getAnalysis(), getCurrencySymbol(), getHistory(), getQuote(), getSuggestion(), INDEX_TICKER_MAP (+8 more)

### Community 26 - "scannerEngine.ts"
Cohesion: 0.28
Nodes (7): StockScannerPanelProps, UNIVERSE_OPTIONS, ScannerCandidate, ScannerFilterOptions, ScannerReport, WebhookAlertPayload, PRESET_STRATEGIES

### Community 27 - "telemetryService.ts"
Cohesion: 0.16
Nodes (15): requestLogger(), FleetTelemetry, formatUptime(), getCpuSnapshot(), getFleetTelemetry(), getRequestMetrics(), getSystemTelemetry(), IncidentAlert (+7 more)

### Community 28 - "lucide-react"
Cohesion: 0.07
Nodes (43): jszip, lucide-react, tesseract.js, PublicToolsHubViewProps, ToolCategory, CompressImageTool(), ExtractTextTool(), ImageToPdfTool() (+35 more)

### Community 29 - "gstEngine.ts"
Cohesion: 0.13
Nodes (23): CreateInvoiceDrawer(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), calculateItemTaxes(), COMMON_HSN_SAC_CATALOG, determineSupplyType(), generateEInvoiceIRN() (+15 more)

### Community 30 - "unifiedInferenceQueue.ts"
Cohesion: 0.20
Nodes (9): ActiveTaskDetails, InferenceTaskType, JobStatus, QueuedJob, QueuePositionInfo, QueueTelemetry, StepDiagnostic, TaskPriority (+1 more)

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.15
Nodes (12): DocNexusPlugin, category, description, iconSymbol, id, main, manifest, minEngineVersion (+4 more)

### Community 32 - "ConfirmModal.tsx"
Cohesion: 0.22
Nodes (8): ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, SYNC_STAGES, SyncHistoryEntry, SyncHistorySummary

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "DocNexusStudio"
Cohesion: 0.19
Nodes (12): CommandPaletteModal(), CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModal() (+4 more)

### Community 35 - "registerRoutes"
Cohesion: 0.13
Nodes (34): addStrategyReview(), calculateRegionalFriction(), calculateSentimentConfluence(), calculateSupertrend(), createStrategy(), deleteStrategy(), deleteStrategyReview(), dispatchWebhookAlert() (+26 more)

### Community 36 - "vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.1.14, vite@^6.2.3, @vitejs/plugin-react@^5.0.4, vite@^6.2.3, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 37 - "ref_fs"
Cohesion: 0.13
Nodes (11): IN_TREE_PLUGINS, PluginConfig, PluginManifest, ContextualChunk, ContextualRagResponse, RAG_DATA_DIR, RAG_INDEX_FILE, RagDocument (+3 more)

### Community 38 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:server, clean, db:cron-sync, deploy, deploy:ps, deploy:quick (+6 more)

### Community 39 - "backtest/engine.ts"
Cohesion: 0.13
Nodes (28): StockBacktestPanelProps, StockStrategyMarketplaceProps, fetchHistoricalBacktestBars(), runBacktest(), calculateRegionalFriction(), getRegionCurrencyInfo(), RegionalFrictionParams, BacktestEquityPoint (+20 more)

### Community 40 - "express"
Cohesion: 0.11
Nodes (16): express@^4.21.2, express, AuthenticatedRequest, AuthenticatedUser, authenticateToken(), requireAdmin(), authLimiter, generalApiLimiter (+8 more)

### Community 41 - "react"
Cohesion: 0.21
Nodes (17): AccountingView(), DayBookView(), DayBookViewProps, FinancialStatementsView(), GeneralLedgerView(), GeneralLedgerViewProps, GstrReportsView(), GstrReportsViewProps (+9 more)

### Community 42 - "server.ts"
Cohesion: 0.07
Nodes (13): BACKEND_TARGET, config, handler(), maxDuration, ORACLE_BACKEND_URL, app, defaultPlugins, prisma (+5 more)

### Community 43 - "SpeechStudio/routes.ts"
Cohesion: 0.16
Nodes (19): verifyToken(), optionalAuth(), createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions, executeBackgroundCloning(), executeBackgroundSynthesis(), getOracleTtsUrls() (+11 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "DocNexus/storage.ts"
Cohesion: 0.27
Nodes (16): getValidatedUserEmail(), logger, registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument() (+8 more)

### Community 46 - "BugReportModal.tsx"
Cohesion: 0.13
Nodes (13): BugReportModal(), BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, ErrorBoundary, Props, State, EnvironmentSnapshot (+5 more)

### Community 47 - "vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/server.ts, outputDirectory, rewrites

### Community 48 - "clientRegistry.ts"
Cohesion: 0.07
Nodes (32): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, CutoutStudioView(), CutoutStudioPlugin, manifest, AudioTranscriberTool() (+24 more)

### Community 49 - "SpeechStudio/storage.ts"
Cohesion: 0.33
Nodes (15): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfileAsync(), getClonedVoiceProfiles(), getClonedVoiceProfilesAsync(), getProfilesFilePath(), getSamplesDirectory() (+7 more)

### Community 51 - "startServer"
Cohesion: 0.08
Nodes (33): createBugReport(), decryptPluginPackage(), deleteBugReport(), deleteFromBlob(), encryptPluginPackage(), errorHandler(), exportDatabaseDump(), generateToken() (+25 more)

### Community 52 - "SpeechStudioView.tsx"
Cohesion: 0.14
Nodes (17): audioBufferToWavBlob(), AudioDiagnostics, CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, DEFAULT_SYNTHESIS_STEPS, SAMPLE_PROMPTS (+9 more)

### Community 53 - "loadTenantData"
Cohesion: 0.11
Nodes (28): addItem(), addParty(), addVoucher(), amountInWordsIndian(), convertThreeDigits(), convertTwoDigits(), buildGSTInvoiceObject(), calculateItemTaxes() (+20 more)

### Community 54 - "Accounting/types.ts"
Cohesion: 0.14
Nodes (16): FinancialStatementsViewProps, AccountHead, AgingAnalysisReport, AgingBucket, BalanceSheetReport, BankReconciliationItem, BankReconciliationReport, GSTR1Summary (+8 more)

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
Nodes (11): DocNexusView(), DocNexusViewProps, DocNexusStudio(), RichDocStudio(), clearVault(), getVaultDbName(), getVaultStorageKey(), loadVault() (+3 more)

### Community 62 - "DocNexusStudio.tsx"
Cohesion: 0.23
Nodes (10): FORMAT_TABS, INITIAL_DOCS, DEFAULT_SHEET, SpreadsheetStudio(), SpreadsheetStudioProps, FORMAT_ICONS, TemplateLibraryModal(), TemplateLibraryModalProps (+2 more)

### Community 63 - "lucide-react"
Cohesion: 0.32
Nodes (6): MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 65 - "pluginCrypto.ts"
Cohesion: 0.39
Nodes (8): decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive(), resolvePluginArchiveBuffer(), SLPK_MAGIC, SLPK_VERSION

### Community 66 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 67 - "startServer"
Cohesion: 0.13
Nodes (20): hashPassword(), seedDatabase(), startServer(), appendMessageToSession(), broadcastSessionChunk(), broadcastSessionDone(), broadcastSessionError(), collectWorkspaceFiles() (+12 more)

### Community 69 - "ResumeEngine.tsx"
Cohesion: 0.17
Nodes (17): FormSubTab, InputMode, ResumeEngine(), ResumeEngineProps, TemplateStyle, extractContactDetails(), parseDocx(), parseJsonResume() (+9 more)

### Community 70 - "ImageStudioView.tsx"
Cohesion: 0.16
Nodes (14): ImageStudioView(), PROMPT_SUGGESTIONS, SAMPLE_IMAGES, ImageStudioPlugin, manifest, AspectRatio, ImageGeneratePayload, ImageGenerateResult (+6 more)

### Community 71 - "StockSimulatorPanel.tsx"
Cohesion: 0.31
Nodes (9): StockSimulatorPanelProps, PersistedEODState, EODPortfolioStore, EODPosition, EODSimulationOptions, EODSimulationReport, EODTradeExecution, EODTrailingStopUpdate (+1 more)

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
Cohesion: 0.17
Nodes (12): generateToken(), SECRET_KEY, pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client (+4 more)

### Community 76 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 77 - "FlowDesignerView.tsx"
Cohesion: 0.20
Nodes (9): FlowDesignerView(), FlowDesignerViewProps, StepExecutionRecord, TEMPLATES, WorkflowConnection, WorkflowNode, WorkflowTemplate, FlowDesignerPlugin (+1 more)

### Community 78 - "registerRoutes5"
Cohesion: 0.32
Nodes (12): deleteClonedVoiceProfile(), getClonedAudioSample(), getClonedVoiceProfile(), getClonedVoiceProfiles(), getProfilesFilePath(), getQuotaStatus(), getSamplesDirectory(), getSpeechDataDirectory() (+4 more)

### Community 79 - "getDatabaseStatus"
Cohesion: 0.25
Nodes (9): executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), loadSyncHistory(), loadSyncHistoryFromDb(), parseDatabaseMetadata(), persistSyncHistoryInDb() (+1 more)

### Community 80 - "fetcher.ts"
Cohesion: 0.30
Nodes (11): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+3 more)

### Community 81 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

### Community 82 - "StudioCast/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 83 - "StockTrackerView"
Cohesion: 0.27
Nodes (10): StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), createWatchlistItem(), formatRelativeTime(), formatTickerDisplay() (+2 more)

### Community 84 - "CutoutStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 85 - "MotionVideoStudioTool.tsx"
Cohesion: 0.29
Nodes (6): ASPECT_RATIOS, AspectRatioConfig, AspectRatioType, PRESET_COLORS, TEMPLATES, VideoTemplateType

### Community 86 - "getMarketSessionStatus"
Cohesion: 0.60
Nodes (5): getExchangeHolidayName(), getMarketSessionStatus(), getSessionExecutionTimestamp(), isExchangeTradingDay(), normalizeMarketKey()

### Community 88 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 91 - "MockupStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 93 - "TranscribeStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 95 - "serverRegistry.ts"
Cohesion: 0.24
Nodes (9): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, StudioCastPlugin, manifest, getOrCreateRoom() (+1 more)

### Community 96 - "better-sqlite3@^12.10.0"
Cohesion: 0.20
Nodes (6): better-sqlite3@^12.10.0, @prisma/adapter-better-sqlite3@^7.8.0, @types/ws@^8.18.1, better-sqlite3, @prisma/adapter-better-sqlite3, @types/ws

### Community 97 - "backgroundWorker.ts"
Cohesion: 0.36
Nodes (5): executeAutomationCycle(), getSimulatorWorkerStatus(), SimulatorWorkerStatus, startSimulatorBackgroundWorker(), listSimulations()

### Community 100 - "ToolsStudioView.tsx"
Cohesion: 0.50
Nodes (3): ToolsStudioView(), ToolsStudioViewProps, ToolsStudioPlugin

### Community 105 - "DocNexus/types.ts"
Cohesion: 0.15
Nodes (15): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, DEFAULT_DOC_STATE, RichDocStudioProps (+7 more)

## Knowledge Gaps
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `OcrReceiptModal.tsx`, `GSTInvoice`, `StockTrackerView.tsx`, `server.js`, `scannerEngine.ts`, `lucide-react`, `gstEngine.ts`, `ConfirmModal.tsx`, `DocNexusStudio`, `backtest/engine.ts`, `react`, `BugReportModal.tsx`, `clientRegistry.ts`, `SpeechStudioView.tsx`, `Accounting/types.ts`, `package.json`, `DocNexusStudio`, `DocNexusStudio.tsx`, `lucide-react`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `FlowDesignerView.tsx`, `OpenLocalWorkspaceModal.tsx`, `MotionVideoStudioTool.tsx`, `SlideDeckStudio.tsx`, `ToolsStudioView.tsx`, `StockTrackerAlertModal.tsx`, `DocNexus/types.ts`?**
  _High betweenness centrality (0.238) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `startServer()` (e.g. with `authenticateToken()` and `requireAdmin()`) actually correct?**
  _`startServer()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `src/types.ts`, `indicatorEngine.ts`, `dependencies`, `App.tsx`, `patterns/types.ts`, `StudioCastCompositor`, `src/types.ts`, `OcrReceiptModal.tsx`, `StockTrackerView.tsx`, `server.js`, `scannerEngine.ts`, `ConfirmModal.tsx`, `DocNexusStudio`, `backtest/engine.ts`, `BugReportModal.tsx`, `clientRegistry.ts`, `SpeechStudioView.tsx`, `package.json`, `DocNexusStudio.tsx`, `lucide-react`, `ResumeEngine.tsx`, `ImageStudioView.tsx`, `StockSimulatorPanel.tsx`, `FlowDesignerView.tsx`, `OpenLocalWorkspaceModal.tsx`, `MotionVideoStudioTool.tsx`, `SlideDeckStudio.tsx`, `ToolsStudioView.tsx`, `StockTrackerAlertModal.tsx`, `DocNexus/types.ts`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `registerRoutes()` (e.g. with `server.js` and `authenticateToken()`) actually correct?**
  _`registerRoutes()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `indicatorEngine.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `startServer`, `ref_fs`, `StockTracker/routes.ts`, `server.ts`, `SpeechStudio/routes.ts`, `DocNexus/storage.ts`, `StudioCastCompositor`, `server.js`, `package.json`, `telemetryService.ts`, `gstEngine.ts`, `serverRegistry.ts`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._