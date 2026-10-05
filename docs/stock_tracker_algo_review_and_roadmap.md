# SutharLabs Stock Tracker & Algorithmic Trading Engine
## Comprehensive Architectural Review, Industry Benchmark & Implementation Roadmap

> **Author**: SutharLabs Software Research & Engineering Studio  
> **Document Version**: 1.2.0 (Updated post Stage 1 & Stage 2 Delivery)  
> **Current Plugin Release**: `v0.3.0` (Beta)  
> **Scope**: Equity & Derivatives Market Analytics, Algorithmic Signal Generation, Multi-Timeframe Backtesting, Community Strategy Marketplace, and End-of-Day (EOD) Trade Simulation across Global Markets (India NSE/BSE, US NYSE/NASDAQ, Europe LSE/Euronext/DAX, and East Asia HKEX/China CSI 300/Japan TSE).

---

## 1. Executive Summary

The SutharLabs Developer Platform currently includes a native **Stock Tracker** plugin (`wp_stock_analyzer`) powered by Express, Prisma (Neon/PostgreSQL & SQLite), and an open-source analytical stack (`yahoo-finance2`, `technicalindicators`).

While the current implementation demonstrates core viability (real-time quote retrieval, SVG sparkline rendering, basic RSI/MACD/Bollinger Band calculation, and rudimentary manual paper trading), it remains a **crude prototype** compared to production-grade algorithmic trading systems.

This document presents:
1. **Industry Benchmarks**: Deep architectural review of top-rated open-source and free tools across US, Indian, and Global markets.
2. **Current Implementation Audit**: Line-by-line gap analysis of our existing plugin.
3. **Target Architecture & Capability Blueprint**:
   - **Pluggable Global Market Architecture**: Unified adapter system supporting India (NSE/BSE), US (NYSE/NASDAQ), Europe (LSE/Euronext/DAX), China/HK (CSI 300/Hang Seng), and Japan (Nikkei 225).
   - **Pluggable Algorithm Engine**: User-definable strategies with parameter schemas and visual condition builder.
   - **Strategy Rating & Community Marketplace**: Publishing, community reviews, backtest verification badges, and strategy forks.
   - **Historical Backtesting Engine**: Multi-year simulation, realistic localized slippage & tax friction models (STT/GST for India, SEC for US, SDRT for UK, FTT for Europe, Stamp Duty for HK/China), and institutional metrics.
   - **Real-Time News & AI Sentiment Engine**: Live financial news stream (Yahoo/Finnhub/Google News) synthesized by Google Gemini AI with strict non-AI autonomous fallback.
   - **Market Scanner & Screener**: Multi-asset scanning across global benchmark universes with real-time buy/sell alerts.
   - **End-of-Day (EOD) Trade Simulator**: Automated daily closing candle / Bhavcopy trade execution with risk management (Take Profit, Stop Loss, Trailing Stop).

---

## 2. Global & Indian Market Industry Benchmarks

| Platform / Framework | Origin / Primary Market | Core Focus | Key Architectural Strengths | Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **Freqtrade** | Global (Crypto/Equity) | Automated Bot & Backtesting | Modular `IStrategy` lifecycle, hyperparameter optimization (`Hyperopt` with Bayesian search), dry-run paper trading, web dashboard (FreqUI), edge-position sizing. | Primarily crypto-native; equity requires custom data provider middleware. |
| **Vectorbt / Vectorbt PRO** | Global (US/Crypto/Forex) | Vectorized Backtesting | Blazing-fast NumPy/Numba vectorized matrix execution (tests 10,000 parameter combinations in seconds), rich statistical reporting. | Vectorized nature makes complex state-dependent order execution (e.g. trailing brackets) tricky without event loops. |
| **QuantConnect LEAN** | Global (US/Cross-Asset) | Institutional Algo Engine | Event-driven C#/Python core, cross-asset (Equities, Options, Futures, FX), multi-broker live connectivity, institutional data feeds. | Heavy architecture, complex setup, steep learning curve for retail users. |
| **OpenAlgo** | India (NSE/BSE) | Self-Hosted Broker Gateway | Direct connectivity with 15+ Indian brokers (Zerodha Kite, Angel One, Upstox, Dhan, Fyers, Shoonya), unified REST & WebSocket API, TradingView webhook triggers. | Gateway only; does not provide native strategy backtesting or visual analytics out of the box. |
| **Streak (Zerodha)** | India (NSE/BSE) | Retail No-Code Algo & Backtest | Simple condition builder (`Close crosses above EMA 20`), 5-year historical backtesting on 1-min to 1-day candles, 1-click paper trading and broker deployment. | Closed-source, proprietary SaaS, limited to Zerodha/partner brokers, no custom code injection. |
| **Chartink** | India (NSE/BSE) | Market Screener & Scanners | Rapid intra-day and EOD technical condition screening across 2,000+ NSE stocks, candlestick pattern recognition, instant alert triggers. | Closed source, limited backtesting metrics, no portfolio simulation. |
| **TradingView (Pine Script)** | Global / US / India | Visual Charting & Community | Industry-standard interactive charting, rich community strategy library with likes/ratings, clean performance reports (Trades list, drawdown curve). | Proprietary runtime, limits on free historical bars, webhook automation requires paid tiers. |

---

## 3. Deep Audit: Current Implementation vs. Industry Standard

### 3.1. Current Plugin Code Audit

| Component | Current Implementation in SutharLabs | State of the Art Benchmark | Critical Gaps |
| :--- | :--- | :--- | :--- |
| **Market Data Ingestion** | `yahoo-finance2` HTTP polling every 30s. Hardcoded static array of 12 Nifty 50 stocks in `routes.ts`. | WebSocket streaming tick feeds (NSE Tick-by-tick / Polygon.io / Alpaca), automated Bhavcopy ingestion for EOD, support for US (S&P 500) and Indian (NIFTY 500) indices. | High latency, rate-limit vulnerability, no historical tick replay, no multi-asset switcher. |
| **Charting Engine** | Primitive SVG `<polyline>` with calculated normalized pixel coordinates in `StockTrackerView.tsx`. | Lightweight Charts (TradingView open source) or Canvas/WebGL rendering with zoom, pan, crosshair, volume histogram, and indicator overlay tracks. | No candlestick bars (only close price line), no interactive hover tooltip, no indicator sub-charts (RSI/MACD drawn separately or missing visual plots). |
| **Technical Analysis** | Fixed calculation of 7 indicators (RSI, MACD, BB, ATR, ADX, EMA 20/50, SMA 20) with hardcoded parameters in `index.ts`. | Dynamic indicator pipeline supporting 50+ indicators, customizable periods/multipliers, multi-timeframe resamplers (5m, 15m, 1h, 1D). | Users cannot adjust indicator parameters (e.g. RSI 14 to 9), no SuperTrend, VWAP, Pivot Points, Stochastic, or Volume Profile. |
| **Algorithmic Signal Engine** | Single hardcoded `getSuggestion()` function combining static heuristics with arbitrary weights (`score += 0.3`) in `index.ts`. | Pluggable Strategy Pattern (`interface TradingStrategy`) with user-defined entry/exit conditions, signal confidence weighting, and risk-reward modeling. | Completely inflexible; users cannot modify, test, or add their own strategies. |
| **Backtesting Framework** | **Completely non-existent**. Zero historical test execution, zero performance metrics. | Event-driven and vectorized backtester calculating CAGR, Sharpe Ratio, Sortino Ratio, Max Drawdown, Win Rate, Profit Factor, Expectancy, and Trade Distribution. | Critical missing feature. Traders cannot validate if any algorithm makes or loses money. |
| **Brokerage & Friction Costs** | Zero modeling. Instant fills at current market price without fees or slippage. | Realistic friction model: STT (0.1%), GST (18%), Exchange turnover charges, SEBI charges, Stamp duty for India; slippage buffer (0.05% - 0.1%). | Backtest and simulation results will be unrealistically optimistic without fee modeling. |
| **Strategy Marketplace & Community** | None. Strategies cannot be created, saved, published, rated, or shared. | Strategy Catalog with public/private visibility, user ratings (1-5 stars), verified backtest badges, strategy forks, and author attribution. | Missing core collaborative platform capability requested by the user. |
| **Market Scanner & Screener** | None. Single symbol search only. | Background screener running strategies across watchlists (NIFTY 50, NIFTY IT, S&P 100), outputting filtered candidate stocks with live signal triggers. | Users must manually type symbols one by one. |
| **Real-Time News & AI Sentiment** | **Completely absent**. No market news stream, zero qualitative context. | Live news feed (Yahoo Finance, Finnhub, Google News) analyzed via Google Gemini AI (`@google/genai`) for catalyst extraction, sentiment scoring, and circuit-breaker triggers. | Traders fly blind during sudden earnings surprises, RBI/Fed interest rate announcements, regulatory probes, or corporate actions. |
| **EOD Trade Simulation** | Primitive manual BUY/SELL click updating a single `shares` and `cash` scalar in DB. | End-of-Day Batch Execution Simulator: scans closing candles, triggers entries/exits, manages open positions with automated SL/TP brackets, records ledger. | No automated position management, trailing stops, or daily portfolio summary. |

---

## 4. Architectural Target Blueprint

```
+---------------------------------------------------------------------------------------------------+
|                                 SUTHARLABS TRADING SUITE 2.0                                     |
+---------------------------------------------------------------------------------------------------+
|  [Market Data & News Ingestion Gateway]                                                           |
|   ├── Market Feeds: Yahoo Finance / Alpaca Free Tier / NSE Bhavcopy EOD / OpenAlgo Webhooks       |
|   └── Real-Time News Stream: Yahoo Finance RSS / Finnhub / Google News (NSE & US Equities)        |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|  [AI-Driven Sentiment & Catalyst Engine] (Google Gemini @google/genai)                            |
|   ├── Headline & Summary Tokenization & Financial Polarity Scoring (-1.0 Bearish to +1.0 Bullish) |
|   ├── Catalyst Classification: Earnings, Regulatory/Legal, M&A, Management, Macro/Rates          |
|   └── Circuit Breaker & Urgency Detection (Emergency Stop Tightening / Long Pause)               |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|  [Modular Strategy Execution Engine (Core)]                                                      |
|   ├── Base Strategy Interface (IStrategy) with Qualitative AI Sentiment Confluence Factor         |
|   ├── Built-in Presets: RSI Mean-Reversion, EMA Golden Cross, MACD Breakout, Supertrend Trend     |
|   ├── Custom Script Engine: JSON Rule Builder + JavaScript/Sandboxed Formula Evaluator            |
|   └── Risk Manager: Position Sizing (Fixed %, Kelly, Risk-per-trade), Trailing Stop Loss, Take TP  |
+---------------------------------------------------------------------------------------------------+
          │                                       │                                       │
          ▼                                       ▼                                       ▼
+-----------------------+               +-----------------------+               +-------------------+
| [Backtesting Engine]  |               | [Market Scanner Hub]  |               | [EOD Trade Bot]   |
| ├── Multi-Year Replay |               | ├── NIFTY 50 / 500    |               | ├── Automated EOD |
| ├── Slippage & Fees   |               | ├── S&P 500 Universe  |               |     Batch Scan    |
| ├── Sharpe / Sortino  |               | ├── Signal Alerts     |               | ├── Paper Orders  |
| └── Equity Curve Plot |               | └── Heatmap Matrix    |               | └── PnL Ledger    |
+-----------------------+               +-----------------------+               +-------------------+
          │                                                                               │
          └───────────────────────────────────────┬───────────────────────────────────────┘
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|  [Community Strategy Marketplace & Rating Hub]                                                    |
|   ├── Strategy Publishing (Public / Private / Forkable)                                           |
|   ├── Verified Backtest Badge (Tamper-proof server-run metrics)                                   |
|   ├── User Rating & Reviews (1-5 stars, comments, performance upvotes)                           |
|   └── One-Click Strategy Clone & Paper Trade Activation                                           |
+---------------------------------------------------------------------------------------------------+
```

---

## 5. Detailed Component Specifications

### 5.1. Pluggable Algorithm Specification (`IStrategy`)

To allow users to create and publish custom algorithms, we define a standardized strategy contract:

```typescript
export interface StrategyParameter {
  id: string;
  name: string;
  type: 'number' | 'select' | 'boolean';
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description: string;
}

export interface StrategySignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0.0 to 1.0
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
}

export interface IStrategy {
  id: string;
  name: string;
  description: string;
  authorEmail: string;
  authorName: string;
  version: string;
  isPublic: boolean;
  market: 'NSE' | 'US' | 'BOTH';
  timeframe: '5m' | '15m' | '1h' | '1D';
  parameters: StrategyParameter[];
  
  // Rule specification: visual rule or script
  rules: {
    indicators: Record<string, { type: string; params: Record<string, any> }>;
    entryConditions: Array<{ indicator: string; operator: '>' | '<' | 'crosses_above' | 'crosses_below' | '=='; value: number | string }>;
    exitConditions: Array<{ indicator: string; operator: '>' | '<' | 'crosses_above' | 'crosses_below' | '=='; value: number | string }>;
  };
}
```

### 5.2. Strategy Marketplace & User Rating Database Schema

We extend `prisma/schema.prisma` with models for community strategies, ratings, and backtest results:

```prisma
model TradingAlgorithm {
  id              String            @id @default(uuid())
  title           String
  description     String
  authorEmail     String
  authorName      String
  version         String            @default("1.0.0")
  isPublic        Boolean           @default(false)
  market          String            @default("BOTH") // "NSE", "US", "BOTH"
  timeframe       String            @default("1D")
  parametersJson  String            // Serialized parameter definitions
  rulesJson       String            // Serialized entry/exit condition tree
  
  // Community & Ratings metrics
  ratingAvg       Float             @default(0.0)
  ratingCount     Int               @default(0)
  backtestScore   Float?            // Normalized score from benchmark backtest
  cloneCount      Int               @default(0)
  
  ratings         AlgorithmRating[]
  backtests       BacktestRun[]
  signals         AlgorithmSignal[]
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model AlgorithmRating {
  id              String            @id @default(uuid())
  algorithmId     String
  userEmail       String
  userName        String
  rating          Int               // 1 to 5
  review          String?
  usedInPaper     Boolean           @default(false)
  createdAt       DateTime          @default(now())
  
  algorithm       TradingAlgorithm  @relation(fields: [algorithmId], references: [id], onDelete: Cascade)
  @@unique([algorithmId, userEmail])
}

model BacktestRun {
  id              String            @id @default(uuid())
  algorithmId     String
  symbol          String
  market          String            // "NSE" or "US"
  startDate       DateTime
  endDate         DateTime
  initialCapital  Float
  finalCapital    Float
  netProfit       Float
  netProfitPct    Float
  totalTrades     Int
  winRatePct      Float
  profitFactor    Float
  maxDrawdownPct  Float
  sharpeRatio     Float
  sortinoRatio    Float
  tradesJson      String            // Detailed trade log
  createdAt       DateTime          @default(now())
  
  algorithm       TradingAlgorithm  @relation(fields: [algorithmId], references: [id], onDelete: Cascade)
}

model AlgorithmSignal {
  id              String            @id @default(uuid())
  algorithmId     String
  symbol          String
  action          String            // "BUY", "SELL", "HOLD"
  confidence      Float
  price           Float
  stopLoss        Float?
  takeProfit      Float?
  timestamp       DateTime          @default(now())
  
  algorithm       TradingAlgorithm  @relation(fields: [algorithmId], references: [id], onDelete: Cascade)
}
```

### 5.3. Institutional Backtesting Statistics Engine

The backtesting calculator must report key quantitative finance metrics:

1. **Compounded Annual Growth Rate (CAGR)**:
   $$\text{CAGR} = \left(\frac{V_{\text{final}}}{V_{\text{initial}}}\right)^{\frac{365}{\text{Days}}} - 1$$
2. **Sharpe Ratio** (Risk-Free Rate default 6.5% for India / 4.5% for US):
   $$\text{Sharpe} = \frac{R_p - R_f}{\sigma_p} \times \sqrt{252}$$
3. **Sortino Ratio** (Focuses on downside volatility):
   $$\text{Sortino} = \frac{R_p - R_f}{\sigma_{\text{downside}}} \times \sqrt{252}$$
4. **Maximum Drawdown (MDD)**: Peak-to-trough decline percentage across portfolio equity curve.
5. **Profit Factor**: Gross Profits / Gross Losses.
6. **Transaction Friction Model**:
   - **NSE (India)**:
     - Brokerage: Flat ₹20 per trade or 0.03% (whichever is lower).
     - STT (Securities Transaction Tax): 0.1% on delivery Buy/Sell.
     - Exchange Turnover: 0.00345%.
     - GST: 18% on (Brokerage + Exchange + SEBI).
     - Stamp Duty: 0.015% on Buy.
   - **US (NYSE/NASDAQ)**:
     - Zero commission baseline (Robinhood/Schwab standard).
     - SEC fee: $0.0000278 \times \text{Value}$.
     - FINRA TAF: $0.000166 \times \text{Shares}$ (max $8.30$).
     - Conservative slippage: 0.05% per fill.

### 5.4. Market Scanner & Screener Pipeline

- **Universe Selector**:
  - `NSE Top 50` (NIFTY 50)
  - `NSE Next 50`
  - `NSE NIFTY Bank`
  - `US S&P 100 / Mega Cap Tech`
- **Execution Mechanism**:
  - Worker runs user's chosen strategy across all stocks in universe in parallel (batches of 10 with concurrency control to avoid rate limits).
  - Produces a real-time matrix of matching candidates sorted by **Signal Confidence** and **Risk-Reward Ratio**.
  - One-click "Execute Paper Trade" or "Send Webhook Alert".

### 5.5. End-of-Day (EOD) Simulation Bot

- **Batch Schedule**: Runs daily at 16:00 IST (post-NSE close) and 16:30 EST (post-US close).
- **Execution Flow**:
  1. Ingests official daily closing candles for all tracked watchlist symbols.
  2. Evaluates all **Active Paper Trading Algorithms** against the day's candles.
  3. Checks existing open positions:
     - Hits Target/Take-Profit $\rightarrow$ Auto-exits at target price, credits cash, logs profit.
     - Hits Stop-Loss $\rightarrow$ Auto-exits at stop price, updates cash, logs loss.
     - Trailing Stop adjustment $\rightarrow$ If close made a new high, raises stop loss.
  4. Checks for new Entry signals $\rightarrow$ Computes position sizing based on available paper cash balance, creates new open trade record.
  5. Generates **Daily Simulation PnL Digest** sent to user terminal logs and dashboard summary.

### 5.6. Real-Time News Stream & AI Catalyst Sentiment Engine

Financial markets do not move on pure technical indicators alone; quarterly earnings surprises, management shifts, regulatory interventions, and macroeconomic announcements frequently overpower technical signals.

To provide a state-of-the-art sovereign advantage, SutharLabs integrates an **AI-driven Real-Time News & Catalyst Intelligence Engine** powered by Google Gemini (`@google/genai`):

#### 1. Ingestion Pipeline
- **Indian Equities (NSE/BSE)**: Aggregates real-time feeds from Google News RSS / Moneycontrol / Economic Times / LiveMint and official corporate announcements.
- **US Equities (NYSE/NASDAQ)**: Aggregates feeds from Finnhub Financial News API, Yahoo Finance News RSS, and SEC EDGAR 8-K filings.
- **Deduplication & Ticker Tagging**: Automatically correlates articles against symbol tickers (e.g. `RELIANCE.NS`, `TCS.NS`, `AAPL`, `NVDA`).

#### 2. Gemini AI Financial Extraction Schema
When news hits the stream, the AI engine evaluates the headline and content against a strict JSON schema:

```typescript
export interface NewsSentimentAnalysis {
  id: string;
  symbol: string;
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
  sentimentScore: number;       // Range: -1.0 (Strongly Bearish) to +1.0 (Strongly Bullish)
  sentimentLabel: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;           // 0.0 to 1.0
  catalystType: 
    | 'EARNINGS' 
    | 'REGULATORY_LEGAL' 
    | 'MACRO_POLICY' 
    | 'M_AND_A' 
    | 'MANAGEMENT_CHANGE' 
    | 'PRODUCT_INNOVATION' 
    | 'ANALYST_RATING' 
    | 'GENERAL';
  urgency: 'IMMEDIATE_CIRCUIT_BREAKER' | 'HIGH' | 'MEDIUM' | 'LOW';
  aiSummary: string;            // 2-sentence executive summary explaining market impact
  keyQuotes: string[];
}
```

#### 3. Signal Modulation & Circuit Breakers
- **Confluence Scoring**: Pure technical signals are cross-referenced with recent 24h AI sentiment:
  $$\text{Adjusted Confidence} = \text{Technical Confidence} \times \left(1 + 0.35 \times \text{Sentiment Score}\right)$$
  - *Example*: An RSI oversold signal (0.65 confidence) combined with a strongly positive earnings surprise (+0.80 sentiment) generates an adjusted **High-Conviction Buy (0.83 confidence)**.
- **Emergency Circuit Breaker**: If breaking news produces a sentiment score $< -0.75$ flagged with `IMMEDIATE_CIRCUIT_BREAKER` (e.g., regulatory probe, fraud investigation, credit downgrade):
  - Suspends any pending or triggered long algorithm entries immediately.
  - Automatically tightens trailing stop-loss orders on active paper positions by 50% to shield capital.
  - Emits high-priority terminal alerts (`type: 'ALERT'`) in the workspace console.

#### 4. Frontend Workspace Presentation
- **Live News Ticker Bar**: Displays breaking headlines with real-time sentiment color pills (`[🟢 +0.82 BULLISH - EARNINGS BEAT]`, `[🔴 -0.78 BEARISH - SEBI PROBE]`).
- **AI Catalyst Drawer**: Clicking any news item opens an executive briefing detailing why the AI categorized the news as bullish/bearish, key risks, and projected price reaction timeframe.
- **Chart Timeline Overlay**: Renders sentiment markers along the bottom of the candlestick chart, visually displaying whether news events triggered historical breakouts or selloffs.

### 5.7. Autonomous Non-AI Operation & Graceful Degradation (Strict Decoupling)

**Core Architectural Guarantee**: The SutharLabs Stock Tracker and Algorithmic Trading suite must remain **100% functional, autonomous, and self-sufficient** without opting into AI analysis or having an active LLM API key.

#### 1. Zero AI Dependency for Core Trading Pillars
- **Real-Time Tracking & Charts**: Candlestick price feeds, volume bars, order book ticks, and OHLC data render instantly with zero AI network overhead.
- **Technical Indicator Computation**: RSI, MACD, Bollinger Bands, ATR, ADX, SuperTrend, EMA, SMA, and VWAP are computed locally in pure deterministic mathematics via `technicalindicators` / TypeScript math libraries. Execution latency is sub-millisecond ($< 2\text{ms}$).
- **Algorithmic Signal Generation**: All built-in and user-authored strategies execute deterministically based strictly on mathematical entry/exit rules. When AI is disabled, $\text{Adjusted Confidence} \equiv \text{Technical Confidence}$.
- **Historical Backtesting**: Runs entirely offline on historical OHLCV bar datasets. Never calls AI services during backtest loops, guaranteeing ultra-fast execution and zero token costs.
- **Market Scanners**: Scans the entire NIFTY 50, NIFTY 500, or S&P 500 universe using pure technical condition filters (e.g., `EMA(20) crosses above EMA(50)`).
- **End-of-Day (EOD) Trade Simulator**: Executes paper trades, updates cash/share ledgers, and tracks trailing stops based solely on price action and technical rules.

#### 2. User Mode Selection & Fallback Behavior
- **Global Workspace Toggle**: A simple UI switch in the tracker header:  
  `[⚡ Pure Technical Mode]` vs. `[🤖 AI-Augmented Intelligence]` (Default: Pure Technical Mode).
- **Graceful Network / Quota Degradation**:
  - If the user opts into AI mode, but the network drops, rate limits occur, or no Gemini API key is configured, the system **never crashes or blocks order execution**.
  - It seamlessly falls back to Pure Technical Mode with a discreet status badge: `AI Offline - Running Pure Technical Engine`.

---

### 5.8. Pluggable Global Market Adapter Architecture (Europe, China, Hong Kong, Japan & Beyond)

To ensure SutharLabs is not locked strictly to Indian and US equities, the engine employs a modular **Global Market Adapter** pattern. Each market is encapsulated inside a self-contained `IMarketAdapter` provider defining exchange schedules, symbol formatting, local currency formatting, regulatory trading constraints, and localized tax/friction calculations.

#### 1. The `IMarketAdapter` Contract

```typescript
export type MarketRegion = 'IN' | 'US' | 'UK' | 'EU' | 'CN' | 'HK' | 'JP';

export interface MarketHours {
  timezone: string;           // IANA format: 'Asia/Kolkata', 'Europe/London', etc.
  openTime: string;           // '09:00'
  closeTime: string;          // '17:30'
  hasLunchBreak: boolean;     // e.g. China (11:30 - 13:00) & Japan (11:30 - 12:30)
  lunchBreak?: { start: string; end: string };
  tradingDays: number[];      // [1, 2, 3, 4, 5] (Monday to Friday)
}

export interface MarketFrictionRules {
  turnoverFeeRate: number;    // e.g. SEBI, SEC, SFC fee
  stampDutyBuy: number;       // e.g. UK SDRT 0.5%, HK 0.1%
  stampDutySell: number;      // e.g. India STT 0.1%, China 0.05%, HK 0.1%
  gstOrVatRate: number;       // e.g. India GST 18% on brokerage
  minCommission: number;      // Minimum ticket fee in local currency
  settlementDays: number;     // T+1 or T+2
  canIntradayShort: boolean;  // False for China A-shares (T+1 rule)
  dailyPriceBandPct?: number; // e.g. China ±10% / ±20%, India 5/10/20% circuit bands
  boardLotSize: number;       // e.g. 100 in HK/Japan, 1 in US/India
}

export interface IMarketAdapter {
  readonly id: MarketRegion;
  readonly name: string;
  readonly primaryExchange: string;
  readonly currencyCode: string;     // 'INR', 'USD', 'EUR', 'GBP', 'CNY', 'HKD', 'JPY'
  readonly currencySymbol: string;   // '₹', '$', '€', '£', '¥', 'HK$'
  readonly marketHours: MarketHours;
  readonly friction: MarketFrictionRules;
  readonly defaultBenchmarks: { symbol: string; name: string }[];
  
  // Symbol notation & normalization
  formatSymbolForFeed(ticker: string): string;       // e.g. 'TCS' -> 'TCS.NS', '700' -> '0700.HK'
  formatDisplaySymbol(feedSymbol: string): string;    // 'TCS.NS' -> 'TCS'
  
  // Session checks
  isMarketOpen(timestamp?: Date): boolean;
  getNextMarketOpen(timestamp?: Date): Date;
  
  // Localized Friction Calculator
  calculateTransactionFriction(params: {
    side: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    isDelivery: boolean;
  }): {
    grossAmount: number;
    brokerage: number;
    taxes: number; // STT, Stamp Duty, SEC/SFC levies
    netAmount: number;
    frictionPct: number;
  };
}
```

#### 2. Registered Regional Market Profiles

| Region | Primary Exchanges | Currency | Ticker Suffix | Benchmark Indices | Regulatory Constraints & Friction Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **India (`IN`)** | NSE, BSE | INR (`₹`) | `.NS`, `.BO` | NIFTY 50, SENSEX, NIFTY Bank | STT 0.1% delivery, SEBI turnover, 0.015% stamp duty buy, 18% GST on charges. Circuit filters: 5%, 10%, 20%. |
| **United States (`US`)** | NYSE, NASDAQ | USD (`$`) | *None* (`AAPL`, `NVDA`) | S&P 500, Nasdaq 100, Dow 30 | SEC Section 31 ($0.0000278/sell $), FINRA TAF ($0.000166/share). Pattern Day Trader (PDT) margin rules. |
| **United Kingdom (`UK`)** | London Stock Exchange (LSE) | GBP (`£`) | `.L` (`SHEL.L`, `AZN.L`) | FTSE 100, FTSE 250 | UK Stamp Duty Reserve Tax (SDRT) of 0.50% on all electronic share purchases. Trading hours: 08:00 - 16:30 GMT. |
| **Europe (`EU`)** | Euronext (Paris, Amsterdam), Deutsche Börse (XETRA) | EUR (`€`) | `.PA`, `.AS`, `.DE` | CAC 40, DAX 40, Euro Stoxx 50 | French/Italian Financial Transaction Tax (FTT 0.3% on large cap purchases). Trading hours: 09:00 - 17:30 CET. |
| **Greater China (`CN`)** | Shanghai (SSE), Shenzhen (SZSE) | CNY (`¥`) | `.SS`, `.SZ` (`600519.SS`, `002594.SZ`) | CSI 300, SSE Composite | **T+1 Settlement Rule**: Stocks bought on Day T cannot be sold on Day T. **Daily Price Limit Bands**: ±10% main board, ±20% ChiNext/STAR. Stamp duty 0.05% on sell. |
| **Hong Kong (`HK`)** | Hong Kong Exchanges (HKEX) | HKD (`HK$`) | `.HK` (`0700.HK`, `9988.HK`) | Hang Seng Index (HSI) | Board lot trading (e.g. 100 share lots). Stamp Duty 0.1% on both buy and sell. Trading session with lunch break (12:00 - 13:00 HKT). |
| **Japan (`JP`)** | Tokyo Stock Exchange (TSE) | JPY (`¥`) | `.T` (`7203.T`, `6758.T`) | Nikkei 225, TOPIX | Standard 100-share trading unit (*toushi tan'i*). Morning session (09:00 - 11:30) & Afternoon session (12:30 - 15:30 JST). |

#### 3. Handling Global Market Rules in the Trading Engine
1. **T+1 Settlement Constraints (China A-Shares)**:
   - In the backtesting and paper trading state machine, if `market.friction.canIntradayShort === false`, any buy order executed on bar date $D$ locks the inventory until $D+1$. The backtester rejects or defers any intraday exit signal, preventing unrealistic simulation results.
2. **Daily Price Limit Bands**:
   - For China (±10%/±20%) and India circuit limits, orders cannot be executed above the upper limit price or below the lower limit price. The simulation flags orders as *Unfilled (Circuit Hit)* if the high/low touches the band.
3. **Multi-Currency Portfolio & FX Normalization**:
   - The user can select their sovereign **Reporting Currency** (`baseCurrency: 'USD' | 'INR' | 'EUR' | 'GBP'`).
   - The portfolio engine automatically queries real-time FX pairs (`USDINR=X`, `EURUSD=X`, `GBPUSD=X`, `USDCNY=X`, `USDHKD=X`, `USDJPY=X`) to compute consolidated Net Asset Value (NAV), unrealized PnL, and cross-border currency exposure.
4. **Pluggable Data Feed Matrix**:
   - **Yahoo Finance Engine**: Free global coverage across all suffixes (`.NS`, `.L`, `.PA`, `.DE`, `.SS`, `.SZ`, `.HK`, `.T`).
   - **Alpha Vantage & EODHD**: Fallback historical and real-time feeds with institutional worldwide coverage.
   - **Local Broker Gateway**: Connects via OpenAlgo (India) or Interactive Brokers Web API (US/Europe/Asia) when deploying live orders.

---

## 6. Phased Implementation Roadmap & Current Status

### Summary Status Matrix

| Phase / Stage | Core Deliverable | Target Release | Status | Live Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1** | Professional Lightweight Charting, Global Universe Switcher, Multi-Indicator Stack | `v0.2.0` | **COMPLETED & SHIPPED** ✅ | Production Verified |
| **Stage 2** | `IStrategy` Architecture, 4 Quant Presets, Server Engine, Visual Condition Builder UI | `v0.3.0` (Beta) | **COMPLETED & SHIPPED** ✅ | Production & Vercel Verified |
| **Stage 3** | Live Financial News Feeds, Google Gemini AI Sentiment Analysis & Confluence Factors | `v0.4.0` | **NEXT UP** ⏳ | Pending Implementation |
| **Stage 4** | High-Performance Historical Backtester & Multi-Country Friction / Tax Modeling | `v0.5.0` | Planned 📅 | Specification Ready |
| **Stage 5** | Community Strategy Marketplace, Verified Performance Badges & Strategy Forking | `v0.6.0` | Planned 📅 | Specification Ready |
| **Stage 6** | Global Market Screener / Scanner & Automated Daily EOD Batch Trade Simulator | `v1.0.0` | Planned 📅 | Specification Ready |

---

### Stage 1: Core Foundation, Professional Charting & Global Universe Switcher
> **Release Version**: `v0.2.0` &bull; **Status**: **COMPLETED & SHIPPED** ✅

#### Additions & Architectural Milestones Delivered:
1. **TradingView Lightweight Charts Integration**:
   - Replaced static SVG sparklines with high-performance Canvas-based candlestick charting (`lightweight-charts`).
   - Added interactive crosshairs, pan/zoom gestures, custom timeframes (`5m`, `15m`, `1h`, `1D`), dark theme styling matching the platform design tokens, and synchronized volume histogram sub-track.
2. **Pluggable Global Market Universe Switcher**:
   - Implemented dynamic market switching across 4 global regions:
     - **India (`IN`)**: NSE / BSE NIFTY 50 benchmarks (Reliance, TCS, HDFC Bank, Infosys, ICICI Bank, etc.).
     - **United States (`US`)**: S&P 500 / NASDAQ 100 benchmarks (Apple, Microsoft, NVIDIA, Amazon, Alphabet, etc.).
     - **Europe (`EU` / `UK`)**: FTSE 100, CAC 40, and DAX 40 blue chips.
     - **East Asia (`HK` / `CN`)**: Hang Seng and CSI 300 benchmarks (Tencent, Alibaba, Meituan, BYD, Kweichow Moutai).
   - Added localized currency symbol formatting (`₹`, `$`, `€`, `£`, `HK$`, `¥`), exchange suffixes (`.NS`, `.BO`, `.L`, `.PA`, `.DE`, `.HK`, `.SS`), and live market session status checks (Market Open vs. Closed).
3. **Decoupled Technical Indicator Engine**:
   - Modularized technical indicator calculations using `technicalindicators` into standalone processing functions.
   - Built real-time calculations for RSI (14), MACD (12, 26, 9), Bollinger Bands (20, 2), ATR (14), ADX (14), EMA (20, 50), and SMA (20).

---

### Stage 2: Algorithmic Strategy Architecture, Presets & Visual Condition Builder
> **Release Version**: `v0.3.0` (Beta) &bull; **Status**: **COMPLETED & SHIPPED** ✅

#### Additions & Architectural Milestones Delivered:
1. **Standardized Strategy Contract (`IStrategy`)**:
   - Defined strict TypeScript contracts in [`src/plugins/StockTracker/strategies/types.ts`](file:///d:/Code/SutharLabs/website/src/plugins/StockTracker/strategies/types.ts) covering `IStrategy`, `StrategyParameter`, `StrategyRuleCondition`, and `StrategySignal`.
   - Enabled flexible multi-operator condition rules (`crosses_above`, `crosses_below`, `>`, `<`, `>=`, `<=`, `==`, `between`).
2. **Four Battle-Tested Quantitative Presets**:
   - Implemented in [`src/plugins/StockTracker/strategies/presets.ts`](file:///d:/Code/SutharLabs/website/src/plugins/StockTracker/strategies/presets.ts):
     - **EMA Golden Cross / Death Cross** (`strat-ema-cross`): Momentum trend follower evaluating 20/50/200 crossovers with dynamic price trend confirmation.
     - **RSI Mean Reversion** (`strat-rsi-mean-reversion`): Counter-trend swing system triggering at oversold/overbought thresholds confirmed by MACD histogram momentum.
     - **Bollinger Bands Squeeze & Breakout** (`strat-bb-squeeze`): Volatility breakout algorithm capturing expansion beyond upper/lower bands with volume filters.
     - **Supertrend Trend-Following** (`strat-supertrend`): Directional volatility trailing strategy utilizing ATR multiplier and band switches.
3. **Server-Side Quantitative Execution Engine**:
   - Implemented in [`src/plugins/StockTracker/strategies/engine.ts`](file:///d:/Code/SutharLabs/website/src/plugins/StockTracker/strategies/engine.ts):
     - Calculates technical indicators (RSI, MACD, BB, ATR, EMA, SMA, and custom Supertrend formula) across historical candle bars.
     - Dynamically evaluates entry and exit condition trees with customizable parameter substitutions.
     - Generates deterministic signals (`BUY`, `SELL`, `HOLD`) accompanied by confidence scores (0.0 to 1.0), calculated Stop Loss, Take Profit targets, and human-readable trigger reasoning.
4. **Strategy Persistence Store & REST API**:
   - Implemented file-backed persistence in [`src/plugins/StockTracker/strategies/store.ts`](file:///d:/Code/SutharLabs/website/src/plugins/StockTracker/strategies/store.ts) (`data/strategies.json`) with automated data directory creation and built-in preset immutability.
   - Exposed RESTful endpoints in [`src/plugins/StockTracker/routes.ts`](file:///d:/Code/SutharLabs/website/src/plugins/StockTracker/routes.ts):
     - `GET /api/workspace/stock-analyzer/strategies`: List all available presets and user-created custom models.
     - `POST /api/workspace/stock-analyzer/strategies`: Create a new custom algorithm.
     - `GET /api/workspace/stock-analyzer/strategies/:id`: Fetch specific strategy configuration.
     - `PUT /api/workspace/stock-analyzer/strategies/:id`: Update user-authored strategy parameters and rules.
     - `DELETE /api/workspace/stock-analyzer/strategies/:id`: Delete custom models (with preset protection).
     - `GET /api/workspace/stock-analyzer/strategy-signal`: Evaluate real-time signal on any symbol for the active strategy.
5. **Interactive Frontend Strategy Catalog & Visual Rule Builder UI**:
   - Built into [`src/components/StockTrackerView.tsx`](file:///d:/Code/SutharLabs/website/src/components/StockTrackerView.tsx):
     - **Strategy Catalog Modal**: Searchable gallery of quant strategies with author badges, preset indicators, 1-click active strategy switching, and 1-click cloning.
     - **Visual Condition Builder**: No-code interface for naming, market assignment, parameter configuration, adding/removing dynamic entry and exit rules.
     - **Live Dry-Run Signal Tester**: Evaluates the unsaved builder draft against live active market data in real time, displaying immediate confidence, action, and reasoning.
     - **Chart Toolbar Integration**: Active strategy signal pill on the chart header displaying live signal (`BUY`, `SELL`, `HOLD`) and detailed breakdown panel.
6. **Marketplace UI & Versioning Polish**:
   - Upgraded plugin manifest and database seeds to `v0.3.0` (classified as **Beta** for sub-v1.0.0 releases).
   - Unified button sizing, fixed height cards, typography weights, and vertically aligned install/uninstall status pills.
   - Fixed Node.js ESM file extension resolution (`.js`) ensuring seamless deployment on Vercel production serverless runtimes.

---

### Stage 3: Real-Time News Stream & AI Sentiment Intelligence
> **Target Version**: `v0.4.0` &bull; **Status**: **NEXT UP** ⏳
- Ingest real-time financial news RSS/API feeds for active symbols across global markets (NSE, US, Europe, Asia).
- Implement Google Gemini AI (`@google/genai`) sentiment scoring endpoint (`/api/workspace/stock-analyzer/news-sentiment`).
- Add Live News Ticker drawer and sentiment badges to the Stock Tracker UI.
- Incorporate AI Sentiment Confluence Factor into algorithmic signal calculations and emergency circuit breakers.

---

### Stage 4: High-Performance Backtesting Engine & Global Friction Models
> **Target Version**: `v0.5.0` &bull; **Status**: Planned 📅
- Implement historical bar replay backtester with full transaction friction modeling (NSE STT/GST, US SEC fees, UK Stamp Duty SDRT, China A-Share T+1 and stamp duty).
- Generate institutional statistics (CAGR, Sharpe, Sortino, Max Drawdown, Win Rate, Profit Factor).
- Render interactive Equity Curve and Trade Log table with trade-by-trade entry/exit points plotted on the chart.

---

### Stage 5: Community Algorithm Marketplace & Ratings
> **Target Version**: `v0.6.0` &bull; **Status**: Planned 📅
- Allow users to publish their custom strategies to the SutharLabs catalog (`isPublic: true`).
- Community rating modal (1-5 stars, reviews, paper trading verification).
- Strategy Forking: Allow users to clone any published strategy, tweak parameters, and re-test.

---

### Stage 6: Market Scanner & Automated EOD Simulation
> **Target Version**: `v1.0.0` (Production Milestone) &bull; **Status**: Planned 📅
- Multi-symbol scanner running strategies across NIFTY 50, S&P 500, FTSE 100, DAX, and CSI 300.
- Daily EOD simulation daemon executing paper trades on closing data with automatic SL/TP tracking and multi-currency portfolio conversion.
- Webhook alert integration (exporting signals to Telegram/Discord or OpenAlgo/Interactive Brokers endpoints).

---

## 7. Conclusion

By evolving our Stock Tracker plugin from a basic quote viewer into a comprehensive, **multi-market AI-Augmented Algorithmic Trading & Backtesting Suite**, SutharLabs will deliver a state-of-the-art capability surpassing retail platforms like Streak and Chartink, seamlessly integrated into our sovereign developer workspace with native global exchange reach.
