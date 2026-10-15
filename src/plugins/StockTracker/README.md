# Stock Tracker Plugin (`wp_stock_analyzer`)
### Version: `v1.0.0` (Production Milestone) &bull; Native Workspace Extension

The **Stock Tracker** plugin is an enterprise-grade quantitative trading, backtesting, market screening, and algorithmic portfolio management suite built natively for the SutharLabs platform.

---

## 1. Architectural Overview & Capabilities

The plugin spans 6 full implementation stages covering the entire quantitative trading lifecycle:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 STOCK TRACKER SUITE (v1.0.0)                            │
├──────────────────────────┬─────────────────────────────┬────────────────────────────────┤
│    ANALYSIS & CHARTS     │    QUANTITATIVE ENGINES     │     PORTFOLIO & EXECUTION      │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────┤
│ • TradingView Canvas     │ • IStrategy Architecture    │ • Multi-Country Tax Friction   │
│ • 4 Global Universes     │ • Visual Condition Builder  │ • Community Marketplace        │
│ • Continuous Indicators  │ • Historical Backtester     │ • Multi-Market Screener Hub    │
│ • Live News & AI Stream  │ • Sentiment Confluence      │ • Automated EOD Trade Sim      │
│ • Custom Watchlists      │ • Cryptographic Proofs      │ • Webhook Alerts (Discord/TG)  │
└──────────────────────────┴─────────────────────────────┴────────────────────────────────┘
```

---

## 2. Feature Breakdown by Stage

### Stage 1: Core Foundation, TradingView Canvas & Global Universes
- **Interactive Candlestick Charting**: Canvas-based [`lightweight-charts`](file:///d:/Code/SutharLabs/website/node_modules/lightweight-charts/) series with smooth crosshair tracking, volume histograms, EMA 20 & 50 overlays, and multi-timeframe navigation (`5m`, `15m`, `1h`, `1D`).
- **Pluggable Global Universes**: Seamless one-click switching across 4 global benchmark directories:
  - 🇮🇳 **India (`IN`)**: NSE & BSE (NIFTY 50, Bank NIFTY, Midcaps) with localized `₹` INR currency.
  - 🇺🇸 **United States (`US`)**: NYSE & NASDAQ (S&P 500, NASDAQ 100) with `$` USD currency.
  - 🇪🇺 **Europe (`EU`)**: LSE, Euronext, DAX 40 with `€` EUR and `£` GBP currencies.
  - 🇯🇵 **East Asia (`ASIA`)**: Nikkei 225, Hang Seng, SSE with localized board lots.
- **Persistent Watchlists**: Custom database-persisted watchlists with real-time quote streaming.

### Stage 2: Algorithmic Strategy Architecture & Visual Builder
- **`IStrategy` Interface**: Decoupled strategy schema supporting mathematical parameters, entry/exit rules, and deterministic signal evaluation (`BUY`, `SELL`, `HOLD`).
- **4 Quantitative Presets**:
  - `strat-ema-cross`: EMA Golden / Death Cross (20 vs 50).
  - `strat-rsi-reversal`: RSI Mean Reversion (Overbought 70 / Oversold 30).
  - `strat-macd-trend`: MACD Zero-Line & Histogram Momentum Trend.
  - `strat-bb-breakout`: Bollinger Band Volatility Breakout with 2.0σ expansion.
- **Visual Condition Builder**: GUI rule constructor with operators (`>`, `<`, `crosses_above`, `crosses_below`) and live testing sandbox.

### Stage 3: Real-Time News Stream & Dual-Engine AI Sentiment
- **Financial News Stream**: Continuous RSS news aggregator across Indian, US, and European markets.
- **Dual AI Sentiment Analysis**:
  - **Primary**: Google Gemini 2.5 Flash via structured prompt engineering.
  - **Autonomous Fallback**: Deterministic Lexicon Rule Engine computing sentiment scores with zero external dependencies.
- **Signal Confluence**: Sentiment verdicts (`BULLISH`, `BEARISH`, `NEUTRAL`) dynamically modulate algorithmic confidence or trigger circuit breakers on contradictory headlines.

### Stage 4: High-Performance Backtesting Engine & Multi-Country Market Friction
- **Sequential Simulation**: Point-in-time candle-by-candle simulation eliminating lookahead bias.
- **Statutory Taxes & Friction Modeling**:
  - **India**: Securities Transaction Tax (STT 0.1%), GST (18%), Stamp Duty, and exchange turnover fees.
  - **US**: SEC Section 31 fees, FINRA TAF, and bid-ask slippage.
  - **UK / Europe**: Stamp Duty Reserve Tax (SDRT 0.5%), Financial Transaction Tax (FTT).
  - **Asia**: T+1 settlement rules, stamp duties, and exchange levies.
- **Institutional Metrics**: CAGR, Sharpe Ratio, Sortino Ratio, Maximum Drawdown (depth & duration), Win Rate, and Alpha vs. Buy & Hold.

### Stage 5: Community Strategy Marketplace & Lifecycle Controls
- **Marketplace Hub**: Peer-to-peer catalog with public publishing, 1-click cloning/forking, and interactive 5-star community reviews.
- **Verifiable Performance Badges**: SHA-256 cryptographic backtest audit proofs verifying that published CAGR and Sharpe metrics were generated on real historical exchange data.
- **Lifecycle Management**: Strategy deletion controls with core preset immutability protection, and modal-based algorithm renaming.
- **Glassmorphic Hover Window UI**: Expansive centered floating modal utilizing ~96%–98% viewport width with backdrop blur and keyboard navigation.

### Stage 6: Multi-Market Screener, Automated EOD & Intraday Trade Simulator & Webhook Alerts
- **Global Screener & Scanner Hub**: Parallel multi-symbol screener scanning entire exchange universes or custom watchlists in 4-symbol concurrency chunks.
- **Volume Surge & Breakout Detection**: Rolling 20-day volume baseline computing real-time `volumeSpikeRatio` (e.g. `🔥 2.4x Vol`).
- **Webhook Alert Dispatcher**: 1-click dispatch of trade signals with rich formatted markdown embeds to **Discord**, **Telegram**, or generic endpoints.
- **Multi-Instance Trade Simulator Engine (`cron_live`, custom instances)**:
  - **Multi-Timeframe Execution**: Supports intraday candle intervals (`1m`, `5m`, `15m`, `1h`, `4h`) as well as end-of-day daily (`1d`) candles.
  - **Dynamic Risk & Stop Management**: Ratchets trailing stops upwards as assets reach session highs; automatically executes Take Profit and Stop Loss limits.
  - **Tenant Ownership & Access Control**: Per-user simulation instances with email ownership verification, Admin override, and Public/Private catalog visibility.
  - **Stateless Serverless Cron Integration**: Seamless background triggers via Vercel Crons or external 1-minute schedulers (e.g. `cron-job.org`) using secure HMAC key validation.
  - **Intelligent Event Compaction**: Differentiates between non-actionable heartbeat pings (updates latest equity snapshot in-place) and actionable events (appends to immutable audit trail), eliminating log spam.
  - **Adaptive Frontend Polling**: Tab visibility-aware client auto-sync with live cron heartbeat pulse pills and stream filters.

---

## 3. Directory Layout

```text
src/plugins/StockTracker/
├── index.ts                     # Browser-safe client exports (manifest, view)
├── manifest.json                # Machine-readable metadata (version 1.0.0)
├── manifest.ts                  # Strongly-typed TypeScript manifest
├── routes.ts                    # Modular server routes & REST controller
├── backtest/
│   ├── index.ts                 # Backtest entrypoint
│   ├── backtestEngine.ts        # Point-in-time sequential simulation engine
│   ├── frictionModel.ts         # Multi-country statutory tax & fee calculations
│   └── types.ts                 # Backtest reports, trades & metrics types
├── news/
│   ├── index.ts                 # News stream entrypoint
│   ├── newsService.ts           # Multi-market RSS news aggregator
│   ├── sentimentService.ts      # Gemini AI & Lexicon sentiment analyzer
│   └── types.ts                 # News articles & sentiment report types
├── scanner/
│   ├── index.ts                 # Screener entrypoint
│   ├── scannerEngine.ts         # Multi-symbol parallel scanner & webhook dispatcher
│   └── types.ts                 # Scan candidates, reports & filter types
├── simulator/
│   ├── index.ts                 # Simulator entrypoint
│   ├── tradeSimulator.ts        # Quantitative trade simulator & replay execution engine
│   └── types.ts                 # Portfolio, positions & trade execution types
└── strategies/
    ├── index.ts                 # Strategy registry entrypoint
    ├── engine.ts                # Strategy signal evaluation engine
    ├── presets.ts               # 4 default quantitative strategy models
    └── types.ts                 # IStrategy, StrategySignal & parameter types
```

---

## 4. API Endpoints Reference

All routes are available under `/api/workspace/stock-analyzer/*` and `/api/plugins/wp_stock_analyzer/*`:

### Market Data & Quotes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/quote?symbol=:symbol&region=:region` | Real-time quote retrieval with 24h change & volume |
| `GET` | `/history?symbol=:symbol&period=:period&interval=:interval` | Historical OHLCV candle bars |
| `GET` | `/search?q=:query&region=:region` | Multi-market symbol search and directory lookup |
| `GET` | `/markets` | Global exchange benchmarks and session status |

### Algorithmic Strategies & Marketplace
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/strategies` | List all available strategies (presets + custom) |
| `POST` | `/strategies` | Create new custom strategy |
| `PUT` | `/strategies/:id` | Update custom strategy parameters or conditions |
| `DELETE`| `/strategies/:id` | Delete custom strategy (presets protected) |
| `POST` | `/strategies/fork` | Clone existing strategy with custom overrides |
| `GET` | `/strategies/:id/reviews` | Get community ratings and verified reviews |
| `POST` | `/strategies/:id/reviews` | Submit community review and 1–5 star rating |
| `POST` | `/strategy-signal` | Evaluate strategy against active stock |
| `POST` | `/strategy-sandbox` | Live evaluate draft condition rules in sandbox |

### Backtesting Engine
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/backtest` | Execute historical backtest simulation |

### Screener & Scanner Hub
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/scanner/scan` | Run multi-symbol market scan across universe or watchlist |
| `POST` | `/scanner/alert-webhook` | Dispatch trade alert to Discord, Telegram, or webhook |

### Automated Trade Simulator & Background Execution
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`/`POST` | `/simulator/run-eod` | Execute trade simulation step or intraday bar (cron authorization via `cronSecret` param or `X-Cron-Secret` header) |
| `GET` | `/simulator/simulations` | List simulation instances accessible to the user (own + public instances; Admins see all) |
| `POST` | `/simulator/simulations` | Create a new isolated simulation instance with independent cash and strategy config |
| `PATCH` | `/simulator/simulations/:simId/config` | Update active strategy, timeframe (`1m`–`1d`), allocation %, and trailing stop % |
| `PATCH` | `/simulator/simulations/:simId/public` | Toggle public/private visibility (owner or Admin only) |
| `DELETE`| `/simulator/simulations/:simId` | Delete a simulation instance and its portfolio state (owner or Admin only; protected `cron_live`) |
| `GET` | `/simulator/portfolio?simulationId=:id` | Retrieve live portfolio store (cash, open positions, unrealized PnL, win/loss stats) |
| `GET` | `/simulator/history?simulationId=:id` | Retrieve execution audit log and historical run reports |
| `POST` | `/simulator/close-position` | Manually liquidate an open position at current market price |
| `POST` | `/simulator/reset` | Reset simulation portfolio cash, clear positions, and wipe history (owner or Admin only) |
| `GET` | `/simulator/cron-config` | Retrieve system cron authorization key for setting up background schedulers |

---

## 5. Client Components

The frontend experience is constructed using clean, decoupled React 19 components in [`src/components/`](file:///d:/Code/SutharLabs/website/src/components/):

1. **[`StockTrackerView.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockTrackerView.tsx)**: Main workspace view hosting the interactive TradingView canvas, resizable right split-pane, market ticker strip, and expansive floating modal window.
2. **[`StockScannerPanel.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockScannerPanel.tsx)**: Multi-market screener hub with filter controls, candidate grid, volume surge badges, and 1-click inspection.
3. **[`StockSimulatorPanel.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockSimulatorPanel.tsx)**: Virtual paper trading portfolio tracker with multi-instance selector, live heartbeat status pills, stream filters (`Actionable Events Only` vs `All Snapshots`), trailing stop audit, and dynamic cron link generator.
4. **[`StockStrategyMarketplace.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockStrategyMarketplace.tsx)**: Community marketplace with ratings, reviews, cloning, and cryptographic performance verification modals.
5. **[`StockBacktestPanel.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockBacktestPanel.tsx)**: Point-in-time historical backtester with SVG equity curve, friction breakdowns, and institutional KPI suite.
6. **[`StockTrackerAlertModal.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockTrackerAlertModal.tsx)**: Custom branded glassmorphic confirmation and feedback modal dialog.

---

## 6. Background Cron Automation & Continuity Architecture

The Trade Simulator is architected to run autonomously in serverless environments (such as Vercel) where long-running daemon processes are not supported:

```
               [ Cron-Job.org / Vercel Cron ]
                             │
                             │ (Every 1 minute HTTP Ping)
                             ▼
     ┌──────────────────────────────────────────────────┐
     │  Vercel Serverless Function (Node.js API)        │
     │  POST/GET /simulator/run-eod?simId=cron_live     │
     │                                                  │
     │  1. Loads portfolio from Neon PostgreSQL DB      │
     │  2. Evaluates live prices & strategy signals     │
     │  3. Fills BUY/SELL orders & raises trailing stops│
     │  4. Saves updated portfolio & ledger to DB       │
     └──────────────────────┬───────────────────────────┘
                            │ (Atomic DB Commit)
                            ▼
     ┌──────────────────────────────────────────────────┐
     │  Neon PostgreSQL (simulation_stores table)       │
     │  - Cash, Positions, Closed Trades Ledger         │
     └──────────────────────▲───────────────────────────┘
                            │
               (Every 30s GET /simulator/portfolio)
                            │
     ┌──────────────────────────────────────────────────┐
     │  Browser Client (StockSimulatorPanel.tsx)        │
     │  - If tab is active: Polls & updates UI live     │
     │  - If tab was closed/hidden: Refreshes instantly │
     │    the moment you open or click into the tab     │
     └──────────────────────────────────────────────────┘
```

### Key Continuity Principles:
1. **Decoupled Execution**: Cron pings run server-side and commit directly to the database. They execute regardless of whether the user has the browser open or computer on.
2. **Actionable Event Compaction**: To prevent log bloat from 1-minute crons (1,440 pings/day), non-actionable heartbeat pings update the latest equity snapshot in-place. A new immutable history card is appended only when an actionable event occurs (order filled or trailing stop raised).
3. **Adaptive Polling with Page Visibility API**: The frontend polls every 30 seconds when the tab is visible. When hidden or minimized, polling pauses to save bandwidth, and immediately refreshes when the user focuses the tab.

---

## 7. Live Broker Execution Bridge Architecture

The simulator's state machine, position sizing, risk engine, and cron-driven loop serve as the production-ready foundation for routing live orders to real brokerage accounts:

```
[Cron Trigger] ──> [Strategy Engine] ──> [Risk & Trailing Stop Gatekeeper]
                                                         │
                                   ┌─────────────────────┴─────────────────────┐
                                   ▼                                           ▼
                      [PAPER MODE (Current)]                     [LIVE_BROKER MODE]
                      store.positions.push(...)                  brokerClient.placeOrder(...)
                      store.cash -= cost                         (Zerodha / Angel / Upstox / IBKR)
```

To switch an instance to live trading:
1. Add broker API credentials to environment variables (`KITE_API_KEY`, `KITE_ACCESS_TOKEN`, etc.).
2. Set `EXECUTION_MODE=LIVE_BROKER` in configuration.
3. Hook `brokerClient.placeOrder()` into the BUY and SELL fill points inside [`tradeSimulator.ts`](file:///d:/Code/SutharLabs/website/src/plugins/StockTracker/simulator/tradeSimulator.ts). All risk checks, trailing stop ratcheting, and exchange session hours gatekeeping remain identical.

