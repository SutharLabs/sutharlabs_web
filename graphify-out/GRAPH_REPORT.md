# Graph Report - website  (2026-11-05)

## Corpus Check
- 164 files · ~332,296 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .prisma 1)

## Summary
- 1104 nodes · 2750 edges · 58 communities (52 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b68888e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- App.tsx
- TerminalLog
- StockTrackerView.tsx
- dependencies
- StockTracker/routes.ts
- MarkdownStudio.tsx
- clientRegistry.ts
- express
- package.json
- _utils.ts
- sentimentEngine.ts
- documentParsers.ts
- DocNexusStudio.tsx
- TelemetryLoggerService
- _utils.ts
- databaseSyncService.ts
- DocNexus/storage.ts
- getPrismaClient
- compilerOptions
- LandingPage.tsx
- auth.ts
- StockTracker/manifest.json
- storageUtils.ts
- api/server.ts
- DocNexusDocument
- AdminAIChatView.tsx
- telemetryService.ts
- WorkspacePluginStore.tsx
- Accounting/manifest.json
- FlowDesignerView.tsx
- DocNexus/manifest.json
- FlowDesigner/manifest.json
- StockAnalyzer/manifest.json
- SlideDeckStudio.tsx
- _utils.ts
- serverRegistry.ts
- StorageVaultView.tsx
- scripts
- ManageDatabaseView.tsx
- @google/genai
- DocNexus/types.ts
- server.ts
- DocNexus/types.ts
- SpeechStudio/manifest.json
- BugReportModal.tsx
- SpeechStudioView.tsx
- vercel.json
- @prisma/adapter-better-sqlite3@^7.8.0
- ImageStudio/manifest.json
- deploy.sh
- dotenv
- audioSynth.ts
- ws
- @neondatabase/serverless
- PluginEngine
- OpenLocalWorkspaceModal.tsx

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
- `startServer()` --indirect_call--> `errorHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `notFoundHandler()`  [INFERRED]
  server.ts → src/middleware/errorHandler.ts
- `startServer()` --indirect_call--> `authenticateToken()`  [INFERRED]
  server.ts → src/middleware/auth.ts
- `loadTenantData()` --calls--> `getPrismaClient()`  [EXTRACTED]
  src/plugins/Accounting/storage.ts → api/_utils.ts

## Import Cycles
- 2-file cycle: `src/components/LandingPage.tsx -> src/components/ProjectBrowserMockup.tsx -> src/components/LandingPage.tsx`

## Communities (58 total, 6 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (82): react, AccountingView(), CompanySettingsModal(), CompanySettingsModalProps, CreateInvoiceDrawer(), CreateInvoiceDrawerProps, DraftLineItem, DayBookView() (+74 more)

### Community 1 - "App.tsx"
Cohesion: 0.09
Nodes (25): react-router-dom, ADMIN_TOOLS, ALL_TABS, App(), INSTALLED_PLUGINS, PasswordResetModal(), ROUTE_MAP, STORE_TOOLS (+17 more)

### Community 2 - "TerminalLog"
Cohesion: 0.08
Nodes (34): AccountingViewProps, AdminAIChatViewProps, AdminConsoleProps, AdminConsoleView(), SystemTelemetry, CollapsibleLogDrawer(), CollapsibleLogDrawerProps, DocNexusView() (+26 more)

### Community 3 - "StockTrackerView.tsx"
Cohesion: 0.06
Nodes (56): lightweight-charts@^5.2.1, lightweight-charts, StockBacktestPanel(), StockScannerPanel(), StockSimulatorPanel(), StockStrategyMarketplace(), StockTrackerAlertModal(), StockTrackerAlertModalProps (+48 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, better-sqlite3@^12.10.0, express@^4.21.2, lucide-react@^0.546.0, motion@^12.23.24, multer@^2.1.1, pdfjs-dist@^6.4.299, @prisma/adapter-neon@^7.9.1 (+20 more)

### Community 5 - "StockTracker/routes.ts"
Cohesion: 0.05
Nodes (114): getPrismaClient(), yahoo-finance2, main(), StockBacktestPanelProps, StockScannerPanelProps, UNIVERSE_OPTIONS, StockSimulatorPanelProps, StockStrategyMarketplaceProps (+106 more)

### Community 6 - "MarkdownStudio.tsx"
Cohesion: 0.31
Nodes (7): lucide-react, MarkdownStudio(), MarkdownStudioProps, COMMAND_LIST, CommandItem, SlashCommandMenu(), SlashCommandMenuProps

### Community 7 - "clientRegistry.ts"
Cohesion: 0.08
Nodes (26): AccountingPlugin, manifest, CLIENT_PLUGIN_REGISTRY, ClientPluginEntry, DocNexusPlugin, manifest, PROMPT_SUGGESTIONS, SAMPLE_IMAGES (+18 more)

### Community 8 - "express"
Cohesion: 0.16
Nodes (9): express, errorHandler(), notFoundHandler(), authLimiter, generalApiLimiter, RateLimitOptions, RateLimitRecord, stockApiLimiter (+1 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (28): vite@^6.2.3, devDependencies, autoprefixer@^10.4.21, cross-env@^10.1.0, esbuild@^0.25.0, tailwindcss@^4.1.14, tsx@^4.21.0, @types/better-sqlite3@^7.6.13 (+20 more)

### Community 10 - "_utils.ts"
Cohesion: 0.15
Nodes (8): generateToken(), SECRET_KEY, @vitejs/plugin-react@^5.0.4, @vitejs/plugin-react, IN_TREE_PLUGINS, packageAllPlugins(), PluginConfig, PluginManifest

### Community 11 - "sentimentEngine.ts"
Cohesion: 0.12
Nodes (25): buildRegionalQueries(), CacheEntry, cleanRssText(), decodeHtmlEntities(), fetchGoogleNews(), fetchStockNews(), fetchYahooNews(), NEWS_CACHE (+17 more)

### Community 12 - "documentParsers.ts"
Cohesion: 0.20
Nodes (18): colLettersToNumber(), parseDOCX(), parseExcalidraw(), parseImageToCanvas(), parseJupyterNotebook(), parsePDF(), parsePPTX(), parseRTF() (+10 more)

### Community 13 - "DocNexusStudio.tsx"
Cohesion: 0.20
Nodes (18): CommandPaletteModal(), DocNexusStudio(), FORMAT_TABS, INITIAL_DOCS, ExportModal(), SpreadsheetStudio(), FORMAT_ICONS, TemplateLibraryModal() (+10 more)

### Community 15 - "_utils.ts"
Cohesion: 0.39
Nodes (8): decryptPluginPackage(), encryptPluginPackage(), getEncryptionKey(), isEncryptedPluginPackage(), isRawZipArchive(), resolvePluginArchiveBuffer(), SLPK_MAGIC, SLPK_VERSION

### Community 16 - "databaseSyncService.ts"
Cohesion: 0.22
Nodes (14): runCronSync(), DatabaseSyncHistoryEntry, executeDatabaseSync(), getBackupPrismaClient(), getDatabaseStatus(), getSyncHistorySummary(), HISTORY_FILE, inMemoryHistory (+6 more)

### Community 17 - "DocNexus/storage.ts"
Cohesion: 0.33
Nodes (14): getValidatedUserEmail(), registerRoutes(), createDefaultUserDocuments(), createDocument(), deleteDocument(), duplicateDocument(), getDocument(), getLegacyDocument() (+6 more)

### Community 18 - "getPrismaClient"
Cohesion: 0.19
Nodes (15): BugReportItem, BugReportsStats, BUGS_FILE, createBugReport(), deleteBugReport(), getBugReports(), getLiveTelemetryLogs(), ingestTelemetryLogs() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 20 - "LandingPage.tsx"
Cohesion: 0.14
Nodes (18): AuthPage(), AuthPageProps, ALL_PLUGIN_SLIDES, HeroStudioConsole(), HeroStudioConsoleProps, PLUGIN_SLIDES, PluginSlide, getProjectFeedbackDetails() (+10 more)

### Community 21 - "auth.ts"
Cohesion: 0.22
Nodes (10): verifyToken(), AuthenticatedRequest, AuthenticatedUser, authenticateToken(), requireAdmin(), getDefaultUserNodes(), getUserFlowFilePath(), prisma (+2 more)

### Community 22 - "StockTracker/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 23 - "storageUtils.ts"
Cohesion: 0.22
Nodes (13): deleteJsonData(), getWritableDataDirectory(), memoryCache, resolveDataFilePath(), syncFromBlob(), BlobUploadOptions, deleteFromBlob(), fetchJsonBlob() (+5 more)

### Community 24 - "api/server.ts"
Cohesion: 0.29
Nodes (7): BACKEND_TARGET, handler(), ORACLE_BACKEND_URL, @vercel/node@^5.9.7, @vercel/node, app, startPromise

### Community 25 - "DocNexusDocument"
Cohesion: 0.23
Nodes (10): CommandPaletteModalProps, FORMAT_ICONS, DocExplorerSidebar(), DocExplorerSidebarProps, FILTER_LABELS, FORMAT_CONFIG, ExportModalProps, DocNexusDocument (+2 more)

### Community 26 - "AdminAIChatView.tsx"
Cohesion: 0.13
Nodes (21): AdminAIChatView(), init(), INITIAL_PROMPTS, MarkdownMessage(), MarkdownMessageProps, AGENT_PERSONAS, fetchAIHealth(), fetchAIModels() (+13 more)

### Community 27 - "telemetryService.ts"
Cohesion: 0.25
Nodes (8): requestLogger(), getCpuSnapshot(), getRequestMetrics(), getSystemTelemetry(), lastCpuSample, recentRequests, recordApiRequest(), RequestSample

### Community 28 - "WorkspacePluginStore.tsx"
Cohesion: 0.24
Nodes (10): compareSemverDesc(), DEFAULT_METADATA, InstalledPlugin, isBetaVersion(), PLUGIN_METADATA_REGISTRY, WorkspacePlugin, WorkspacePluginReview, WorkspacePluginStore() (+2 more)

### Community 29 - "Accounting/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 30 - "FlowDesignerView.tsx"
Cohesion: 0.28
Nodes (6): FlowDesignerView(), FlowDesignerViewProps, initialNodes, FlowDesignerPlugin, manifest, FlowNode

### Community 31 - "DocNexus/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 32 - "FlowDesigner/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 33 - "StockAnalyzer/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 34 - "SlideDeckStudio.tsx"
Cohesion: 0.29
Nodes (6): DEFAULT_SLIDES, SlideDeckStudio(), SlideDeckStudioProps, THEME_STYLES, SlideDeckState, SlideItem

### Community 35 - "_utils.ts"
Cohesion: 0.22
Nodes (9): pg@^8.23.0, @prisma/adapter-pg@^7.9.1, @prisma/client@^7.8.0, pg, @prisma/adapter-pg, @prisma/client, defaultPlugins, hashPassword() (+1 more)

### Community 36 - "serverRegistry.ts"
Cohesion: 0.39
Nodes (6): MODEL_SPECS, registerRoutes(), processImageUpscale(), registerAllPluginRoutes(), SERVER_PLUGIN_ENTRIES, registerRoutes()

### Community 37 - "StorageVaultView.tsx"
Cohesion: 0.38
Nodes (10): CATEGORIES, StorageVaultView(), deleteVaultFile(), fetchVaultFiles(), fetchVaultStats(), formatBytes(), getVaultDownloadUrl(), uploadVaultFile() (+2 more)

### Community 38 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, clean, db:cron-sync, dev, dev:watch, lint, package:plugins (+2 more)

### Community 39 - "ManageDatabaseView.tsx"
Cohesion: 0.16
Nodes (12): ConfirmModal(), ConfirmModalProps, ModalVariant, DatabaseEndpointInfo, DatabaseStatusResponse, ManageDatabaseProps, ManageDatabaseView(), SYNC_STAGES (+4 more)

### Community 41 - "DocNexus/types.ts"
Cohesion: 0.18
Nodes (12): DEFAULT_DOC_STATE, RichDocStudio(), RichDocStudioProps, DEFAULT_SHEET, SpreadsheetStudioProps, DocNexusMetadata, DocNexusStudioProps, RichDocPage (+4 more)

### Community 42 - "server.ts"
Cohesion: 0.11
Nodes (6): defaultPlugins, prisma, upload, ContactNotificationPayload, DispatchResult, notifyAdminNewInquiry()

### Community 43 - "DocNexus/types.ts"
Cohesion: 0.22
Nodes (9): CanvasStudio(), CanvasStudioProps, COLOR_PRESETS, DEFAULT_SCENE, InspectorPanel(), InspectorPanelProps, CanvasElement, CanvasSceneState (+1 more)

### Community 44 - "SpeechStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 45 - "BugReportModal.tsx"
Cohesion: 0.20
Nodes (11): BugReportModalProps, MODULE_OPTIONS, SEVERITY_LEVELS, Props, State, EnvironmentSnapshot, LogLevel, LogListener (+3 more)

### Community 46 - "SpeechStudioView.tsx"
Cohesion: 0.15
Nodes (17): CALIBRATION_PROMPTS, CalibrationPromptItem, DEFAULT_ARCHITECTURES, DEFAULT_NEURAL_VOICES, SAMPLE_PROMPTS, getQuotaStatus(), quotaStore, SOTA_ARCHITECTURES (+9 more)

### Community 47 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 49 - "ImageStudio/manifest.json"
Cohesion: 0.18
Nodes (10): category, description, iconSymbol, id, main, minEngineVersion, name, packagedAt (+2 more)

### Community 51 - "dotenv"
Cohesion: 0.40
Nodes (4): dotenv@^16.4.5, prisma@^7.8.0, dotenv, prisma

### Community 52 - "audioSynth.ts"
Cohesion: 0.67
Nodes (3): createWavBuffer(), generateNeuralAudioWaveform(), SynthesizeOptions

### Community 54 - "@neondatabase/serverless"
Cohesion: 0.20
Nodes (6): google-auth-library@^10.9.0, @neondatabase/serverless@^1.1.0, @tailwindcss/vite@^4.1.14, google-auth-library, @neondatabase/serverless, @tailwindcss/vite

### Community 57 - "PluginEngine"
Cohesion: 0.25
Nodes (5): hashPassword(), seedDatabase(), startServer(), PluginEngine, exportDatabaseDump()

### Community 58 - "OpenLocalWorkspaceModal.tsx"
Cohesion: 0.50
Nodes (4): OpenLocalWorkspaceModal(), OpenLocalWorkspaceModalProps, readDirectoryHandleRecursively(), walk()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.tsx`, `TerminalLog`, `StockTrackerView.tsx`, `dependencies`, `StockTracker/routes.ts`, `MarkdownStudio.tsx`, `clientRegistry.ts`, `package.json`, `DocNexusStudio.tsx`, `LandingPage.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `FlowDesignerView.tsx`, `SlideDeckStudio.tsx`, `StorageVaultView.tsx`, `ManageDatabaseView.tsx`, `DocNexus/types.ts`, `DocNexus/types.ts`, `BugReportModal.tsx`, `SpeechStudioView.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerRoutes()` (e.g. with `authenticateToken()` and `optionalAuth()`) actually correct?**
  _`registerRoutes()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.052976658798846055 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `MarkdownStudio.tsx` to `App.tsx`, `TerminalLog`, `StockTrackerView.tsx`, `dependencies`, `StockTracker/routes.ts`, `clientRegistry.ts`, `package.json`, `DocNexusStudio.tsx`, `LandingPage.tsx`, `DocNexusDocument`, `AdminAIChatView.tsx`, `WorkspacePluginStore.tsx`, `SlideDeckStudio.tsx`, `StorageVaultView.tsx`, `ManageDatabaseView.tsx`, `DocNexus/types.ts`, `DocNexus/types.ts`, `BugReportModal.tsx`, `SpeechStudioView.tsx`, `OpenLocalWorkspaceModal.tsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09246088193456614 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `react`, `dependencies`, `serverRegistry.ts`, `StockTracker/routes.ts`, `package.json`, `server.ts`, `_utils.ts`, `SpeechStudioView.tsx`, `DocNexus/storage.ts`, `auth.ts`, `telemetryService.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `TerminalLog` be split into smaller, more focused modules?**
  _Cohesion score 0.07781649245063879 - nodes in this community are weakly interconnected._