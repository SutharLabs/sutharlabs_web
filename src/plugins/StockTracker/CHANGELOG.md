# Changelog: Stock Tracker (`wp_stock_analyzer`)

All notable changes to the **Stock Tracker** plugin will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.3] - 2026-10-17

### Added
- **Workspace Execution Log / Terminal Settings Toggle**: Added a dedicated user setting in the Settings Drawer (`TRADING` tab) to enable/disable the execution log console window. Persisted in `localStorage` (`sutharlabs_enable_terminal`) and kept **disabled & hidden by default**.
- **Themed Custom Candle Size Selector**: High-fidelity custom popover menu replacing native `<select>`, with support for `1m`, `5m`, `15m`, `1h`, `4h`, `1d` intervals, strategy classification badges, active checkmark states, and full light/dark theme parity.
- **Dedicated Release Packaging Pipeline Support**: Integrated markdown changelog support in `package-plugins.ts` to sync version records and release notes directly into Neon PostgreSQL.

### Fixed
- **Chart Toolbar Splitter Clipping**: Re-architected the chart toolbar header with `flex-wrap` and dynamic spacing, preventing indicator and expand/collapse buttons from being cut off when resizing panes or dragging the workspace window slider.
- **Candle Interval Selection**: Fixed bug where selecting candle intervals was not registering properly due to unstyled native select behavior.
- **Fluid Tile Widths & Responsive Grid**: Replaced static fixed widths across stock tracker sidebar and tiles with dynamic responsive widths and proper vertical spacing when stacked on smaller viewports.
- **Horizontal Bar Icon Mixup**: Fixed low screen size icon overlapping and misalignment across tracker sub-bars.
- **Simulator Multi-Instance Persistence**:
  - Fixed public/private simulation state loss on refresh by resolving canonical simulation IDs across tenant prefixes in Neon DB.
  - Eliminated duplicate `cron_live` entries and enforced base slug deduplication.
  - Made `resolveSimulationTargetId` database-safe to prevent accidental instance creation on configuration save.
  - Synchronized simulation deletion and permission checks with complete database cleanup.
- **Simulator Header Layout**: Switched action buttons to compact inline layouts on mobile screens to reclaim empty left header space.
- **Authentic Execution Timestamps**: Ensured simulated orders and trade logs retain authentic real-time or historical candle timestamps rather than artificial session overrides.
- **Live Cron Heartbeat**: Corrected heartbeat pulse pill indicator to accurately reflect Neon DB `updatedAt` timestamps.

---

## [1.1.2] - 2026-10-10

### Security
- **Multi-Tenant Data Segregation**: Enforced strict per-tenant data partitioning, client vault isolation, and privacy boundaries across simulation stores and user portfolios.

---

## [1.1.0] - 2026-10-09

### Added
- **Multi-Instance Trade Simulator Engine**: Support for multiple paper trading instances, customizable capital allocation, and automated cron execution.
- **Product Types**: Added CNC (Cash and Carry delivery) and MIS (Margin Intraday Square-off) with automatic 3:15 PM EOD square-off.

---

## [1.0.2] - 2026-10-08

### Fixed
- Fixed order sizing calculations under heavy market friction.
- Improved historical backtest replay throughput for high-frequency candle sets.

---

## [1.0.1] - 2026-10-07

### Fixed
- Corrected slippage calculation for international exchange universes.
- Fixed minor layout alignment in TradingView overlay controls.

---

## [1.0.0] - 2026-10-06

### Added
- **Initial Production Milestone**: Full quantitative suite with lightweight candlestick charts, 4 global universes (IN, US, EU, ASIA), continuous technical indicators (EMA, RSI, MACD, BB), visual condition builder, backtesting engine with multi-country tax modeling, and strategy marketplace.
