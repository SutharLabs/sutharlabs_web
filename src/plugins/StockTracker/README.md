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

### Stage 6: Multi-Market Screener, Automated EOD Trade Simulator & Webhook Alerts
- **Global Screener & Scanner Hub**: Parallel multi-symbol screener scanning entire exchange universes or custom watchlists in 4-symbol concurrency chunks.
- **Volume Surge & Breakout Detection**: Rolling 20-day volume baseline computing real-time `volumeSpikeRatio` (e.g. `🔥 2.4x Vol`).
- **Webhook Alert Dispatcher**: 1-click dispatch of trade signals with rich formatted markdown embeds to **Discord**, **Telegram**, or generic endpoints.
- **Automated End-of-Day (EOD) Batch Trade Simulator**:
  - Daily closing candle paper trading execution with Stop Loss, Take Profit, and dynamic Trailing Stop management.
  - Capital allocation sizing with realistic fee deductions.
  - Persistent portfolio ledger stored in `data/eod_portfolio.json` and simulation audit logs in `data/eod_simulation_history.json`.

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
│   ├── index.ts                 # EOD simulator entrypoint
│   ├── eodSimulator.ts          # EOD daily closing batch execution engine
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

### Automated EOD Batch Trade Simulator
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/simulator/run-eod` | Execute automated daily EOD trade simulation session |
| `GET` | `/simulator/portfolio` | Retrieve current paper trading portfolio snapshot |
| `GET` | `/simulator/history` | Retrieve historical daily simulation audit sessions |

---

## 5. Client Components

The frontend experience is constructed using clean, decoupled React 19 components in [`src/components/`](file:///d:/Code/SutharLabs/website/src/components/):

1. **[`StockTrackerView.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockTrackerView.tsx)**: Main workspace view hosting the interactive TradingView canvas, resizable right split-pane, market ticker strip, and expansive floating modal window.
2. **[`StockScannerPanel.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockScannerPanel.tsx)**: Multi-market screener hub with filter controls, candidate grid, volume surge badges, and 1-click inspection.
3. **[`StockSimulatorPanel.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockSimulatorPanel.tsx)**: Virtual paper trading portfolio tracker with open positions, historical simulation runs ledger, and execution audit log.
4. **[`StockStrategyMarketplace.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockStrategyMarketplace.tsx)**: Community marketplace with ratings, reviews, cloning, and cryptographic performance verification modals.
5. **[`StockBacktestPanel.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockBacktestPanel.tsx)**: Point-in-time historical backtester with SVG equity curve, friction breakdowns, and institutional KPI suite.
6. **[`StockTrackerAlertModal.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockTrackerAlertModal.tsx)**: Custom branded glassmorphic confirmation and feedback modal dialog.
