---
type: source
title: ATAS API and ATAS X Documentation
date: 2026-09-20
source_type: web-docs
origin: web
authors:
  - ATAS
source_urls:
  - https://docs.atas.net/en/index.html
  - https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20010__BasicIndicator.html
  - https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20025__ReceivingProcessingData.html
  - https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20125__Performance.html
  - https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20200__ATASX__Indicator.html
  - https://docs.atas.net/en/md_Indicators_2Heatmap_2README.html
  - https://github.com/AtasPlatform/Indicators
tags:
  - ralph
  - atas
  - atas-x
  - orderflow
  - api
  - source
status: active-source
---

# ATAS API and ATAS X Documentation

Source pass date: 2026-09-20. This page is a source-backed Obsidian summary of the ATAS technical docs relevant to RALPH orderflow ingestion and a future read-only ATAS X exporter.

Scope: top-level ATAS technical documentation pages from the official Doxygen nav plus official ATAS site/GitHub examples. This does not copy the full generated class/member reference; class pages should be opened only when implementing the exporter.

## Source Map

- Introduction: `https://docs.atas.net/en/index.html`
- Development of a user indicator: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20010__BasicIndicator.html`
- Customizing an indicator: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20020__CustomizingOurIndicator.html`
- Receiving and processing data: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20025__ReceivingProcessingData.html`
- Working with trading events: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20030__IndicatorEvents.html`
- Creating composite indicators: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20040___01CompositeIndicators.html`
- Dataseries: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20050__Dataseries.html`
- Embedded graphic shapes: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20060__EmbeddedGraphicShapes.html`
- Drawing: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20070__Graphics.html`
- Keyboard and mouse: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20080__KeyboardMouse.html`
- Chart managing: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20095__ChartManaging.html`
- Indicator property management: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20097__ManagingIndicatorProperties.html`
- Strategies: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20100__Strategies.html`
- Managing orders: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20110__ManagingOrders.html`
- Indicator examples: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20115__IndicatorExamples.html`
- Strategy examples: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20120__StrategyExamples.html`
- Performance recommendations: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20125__Performance.html`
- Adding logging: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20130__AddingLogging.html`
- Debug mode: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20135__DebugMode.html`
- Distribution: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20140__IndicatorsStrategiesDistribution.html`
- Managing access: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20150__AccessToIndicators.html`
- Developing indicators for ATAS X: `https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20200__ATASX__Indicator.html`
- Heatmap author guide: `https://docs.atas.net/en/md_Indicators_2Heatmap_2README.html`
- Official examples repository: `https://github.com/AtasPlatform/Indicators`

## High-Signal Findings For RALPH

ATAS X:

- ATAS X is the cross-platform Windows/macOS platform. Classic ATAS is Windows-only and WPF-based.
- ATAS X automatically converts many Windows-specific drawing/input types for indicators originally built for Classic.
- WPF custom editors/UI are not converted; exporter should avoid custom UI and run as a simple indicator.
- A separate ATAS X build is not required for normal no-custom-UI indicators; a single DLL can load in Classic and ATAS X if runtime-compatible.
- Runtime must match platform `.NET 8` or `.NET 10`; inspect `OFT.Platform.runtimeconfig.json` or `OFT.PlatformX.runtimeconfig.json`.
- ATAS X can install custom indicators through `Add custom indicator` or watched indicator folders.

Data access:

- `OnCalculate` receives historical bars and current bar updates. Docs state current-bar `OnCalculate` is called on every tick.
- `IndicatorCandle` exposes `Open`, `High`, `Low`, `Close`, `Volume`, `Ask`, `Bid`, `Delta`, `LastTime`, `MaxDelta`, `MinDelta`, and OI-related fields.
- Footprint/cluster data is available per price level through `PriceVolumeInfo`, `GetPriceVolumeInfo(price)`, `GetAllPriceLevels()`, and max-volume/max-delta price-level helpers.
- Online ticks are available through `OnNewTrade(MarketDataArg arg)`.
- Aggregated/cumulative trades are available through `OnCumulativeTrade`, `OnUpdateCumulativeTrade`, and historical `RequestForCumulativeTrades`.
- Market depth updates are available through `MarketDepthChanged(MarketDataArg arg)`.
- DOM aggregate totals are available through `MarketDepthInfo.CumulativeDomAsks` and `MarketDepthInfo.CumulativeDomBids`; snapshots through `GetMarketDepthSnapshot()`.
- MBO requires provider support; docs state it is currently provided only by Rithmic. Do not assume MBO for crypto/Binance.
- Trading statistics include account/order/trade/equity collections, but they are out of scope for the RALPH read-only orderflow rail.

Performance:

- Avoid repeated `GetCandle(bar)` calls for the same bar; store locally.
- Iterating all cluster price levels is more expensive than candle access; do only when needed.
- Split calculation and rendering concerns. The RALPH exporter should not render custom visuals.
- ATAS X-specific performance recommendations are broadly the same as Classic except for custom editor restrictions.

## RALPH Design Implications

- Default target remains ATAS X.
- Classic is fallback only for missing ATAS X export/module features or runtime problems.
- First exporter should be read-only, no UI, no trading/account statistics, no order APIs.
- Start with compact feature windows, not raw firehose:
  - `volume_velocity`
  - `delta_velocity`
  - `bid_side_velocity`
  - `ask_side_velocity`
  - `volume_per_price_progress`
  - `absorption_score`
  - `exhaustion_score`
  - `breakout_quality_score`
- Measure exporter latency explicitly with timestamps before assigning any live-decision label.
- Preserve manual CSV rail as active path until exporter proof passes.

## Open Questions

- Which ATAS X runtime is installed for Tomas: `.NET 8` or `.NET 10`?
- Does Tomas's crypto feed expose enough cumulative trade direction and depth data through the indicator API?
- Does ATAS X Smart Tape have settings that expose side/aggressor/delta in CSV?
- Can a read-only indicator write files without extra permission prompts on Tomas's install?
- What is measured end-to-end latency from ATAS event callback to RALPH watcher ingestion?

