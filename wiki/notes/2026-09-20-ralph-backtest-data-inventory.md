---
type: research-note
date: 2026-09-20
tags:
  - ralph
  - backtest
  - data-inventory
  - orderflow
  - atas
related:
  - 2026-09-20-atas-manual-orderflow-rail.md
  - 2026-09-20-atas-automation-access-audit.md
  - 2026-09-20-atas-classic-vs-x-exporter-plan.md
  - ../../core/data-rails.md
status: active
---

# RALPH Backtest Data Inventory

Status: `active`. Purpose: keep RALPH from treating "backtest" as one thing. Different tests need different data, and missing data should be explicitly fetched, derived, or marked gated.

## Working Rule

Default posture: fetch as much useful no-key/public historical data as practical, archive raw data outside the wiki, derive compact feature windows, and only use ATAS/manual/exporter data where it adds orderflow structure that public exchange data cannot reproduce cleanly.

When data is missing:

1. Search for an accessible source/tool/API first.
2. Verify access, coverage, freshness, license/limits, and exportability.
3. If no source is available, derive a proxy from available raw data and label it as proxy-derived.
4. If it cannot be fetched or derived honestly, mark it `gated`, `missing`, or `visual-only`; do not silently treat it as active.

## Backtest Types

### Price/Volume Backtest

Use for trend, volatility, range expansion, support/resistance, candle structure, and regime filters.

Likely data:

- OHLCV candles from Binance/Bybit/Hyperliquid/public exchange sources.
- ATAS chart export when available, but note the current Classic chart export is OHLC only, no volume column.
- Existing RALPH/Zela datasets where they line up with symbol/time.

Current status: feasible now.

### Trade-Print Backtest

Use for volume bursts, print clustering, taker-flow proxies, sweep/exhaustion windows, and short-horizon event studies.

Likely data:

- Binance aggregate trades / trade history.
- Bybit trades.
- Hyperliquid public trades.
- ATAS Smart Tape exports, currently `Time;Price;Volume`, supplemental only unless side/aggressor columns become exportable.

Current status: feasible as public-proxy; ATAS Smart Tape remains supplemental.

### Orderflow-ish Backtest

Use for delta velocity, bid/ask-side velocity, absorption, exhaustion, and breakout-quality scoring.

Likely data:

- ATAS Bid/Ask Tape CSV: `Time;Bids;;;;Ask;Delta`.
- Public trades with inferred aggressor side, if available or derivable.
- Public L2/orderbook snapshots/deltas for imbalance and liquidity shock, where capture exists.
- Future ATAS read-only exporter windows.

Current status: partially feasible. Manual ATAS Bid/Ask Tape is active; public historical orderflow needs an explicit inventory/collector pass.

### Footprint / Volume-At-Price Backtest

Use for HVN/LVN, volume-at-price progress, price-level delta, absorption zones, and level acceptance/rejection.

Likely data:

- ATAS Classic `All Prices`: `Price;Volume;Trades;Bid;Asks;Delta`.
- ATAS candle footprint/cluster data via C# indicator API if available in the current plan/feed.
- Derived volume-at-price from trade prints, if raw trades include enough precision and side/proxy information.

Current status: active as manual price-level distribution, not time-sequenced. Needs exporter or public raw trades for historical replay.

### Widget-State Backtest

Use for Market Pressure, Price Change, DOM Pressure, Delta Divergence, and similar ATAS indicator states.

Likely data:

- Direct exported values only if ATAS API exposes them or a custom indicator can reproduce them.
- Manual screenshots are visual evidence, not a reliable backtest rail.
- Proxies: time-in-state, flip frequency, cross-horizon agreement, delta velocity, and price progress can be modeled from raw features if widget internals are unavailable.

Current status: not active as a backtest rail. Treat as feature inspiration until export/API access is verified.

### Live-Capture / Forward-Test Replay

Use for validating a data pipeline and decision features going forward.

Likely data:

- Read-only ATAS `RalphOrderflowExporter` JSONL/CSV windows.
- Public exchange capture from websocket/API.
- Manual ATAS CSV packets around levels/alerts.

Current status: target architecture. Must remain read-only: no trading, orders, account stats, keys, paid-plan activation, or broker/exchange mutation.

## Current ATAS Evidence

New Classic export batch received 2026-09-20 15:02 UTC and archived under:

- `../../raw/atas-manual-exports/2026-09-20/classic-followup-1502/`

`Classic_All_Prices---694b61dd-d970-4fb9-932f-00202dc7084d.csv`:

- 6,963 data rows.
- Schema: `Price;Volume;Trades;Bid;Asks;Delta`.
- Price range: `80095.9..81294.9`.
- Total volume: `53390.850`.
- Trades sum: `1,133,519`.
- Bid sum: `27215.591`; ask sum: `26175.259`; net delta: `-1040.332`.
- Top volume price levels: `80300.0`, `80500.0`, `80400.0`, `80620.0`, `80475.0`.
- Top 100-price bands by volume: `80400`, `80300`, `80500`, `80200`, `80600`.

`Chart_Classic_2---caca0a5d-e6de-44c6-a672-3c34adc3a1e3.csv`:

- 1,042 rows.
- Schema: timestamp + OHLC only; no volume/delta columns.
- Timestamp parse format observed as `YYYY-DD-MM HH:MM:SS`, e.g. `2026-17-09` parses as 2026-09-17.
- Time range: `2026-09-17 02:00:00..2026-09-20 16:50:00`.
- Open first: `76180.0`; close last: `80640.0`; net change `+4460.0`.
- Low/high range: `75980.0..81940.0`.
- Largest 5m range bars cluster around 2026-09-18 15:35..16:05 UTC.

Interpretation:

- Classic `All Prices` is useful for price-level/session distribution and absorption-zone context.
- Classic chart export is useful for broad price history but not orderflow.
- Neither replaces time-sequenced Bid/Ask Tape or a read-only exporter.

## Next Research Loop

Build a source inventory before writing more strategy logic:

1. Public no-key historical OHLCV/trades/aggTrades for BTCUSDT and relevant perps.
2. Public L2/orderbook historical/capture options and storage cost.
3. Existing local RALPH/Zela datasets, symbols, time coverage, and feature columns.
4. ATAS manual exports: schemas, time ranges, what is time-sequenced vs distribution-only.
5. ATAS C# API access and licensing/plan constraints for custom indicators, file writes, historical cumulative trades, and footprint data.
6. A unified feature-window format so price/volume, public orderflow, ATAS Bid/Ask, All Prices, and exporter output can be compared.

Do all of this as research/backtest infrastructure. Do not promote any live trading behavior from this note.

## Verified Inventory Update - 2026-09-20 15:35 UTC

This pass checked local RALPH/ATAS notes, the ATAS docs cache, the latest Classic `15:02` batch, local public-orderflow captures, the Zela benchmark tree, and live no-key public API probes from the workspace.

### Inventory Matrix

| Backtest class | Exists locally now | Public/no-key fetchable now | Derivable proxy | Gated or missing | Storage/tooling |
| --- | --- | --- | --- | --- | --- |
| Price/volume | ATAS Classic `Chart_Classic_2` has 1,042 5m OHLC rows, no volume; `crypto-updates` has saved 1s public-orderflow feature CSVs/SQLite; Zela has feed latency benchmark CSVs, not market candles | Binance spot/futures klines returned HTTP 200; Bybit linear klines returned HTTP 200; Hyperliquid candles remain usable from prior probes but this exact tiny future-ish probe returned `[]` | Resample trades/aggTrades to OHLCV; align public BTC/ETH/SOL/HYPE candles to alert/review windows | Exchange historical depth beyond endpoint limits may require pagination; ATAS chart volume absent in current Classic export | Store raw public candles in SQLite/Parquet/JSONL under runtime/raw; compact feature windows in SQLite/CSV plus wiki summaries |
| Trade-print | `crypto-updates/runtime/orderflow-spikes/*/orderflow.sqlite` contains saved public trade rows; ATAS Smart Tape exports exist but current schema is only `Time;Price;Volume`; no complete local historical tape for the latest Classic chart window | Binance spot and USD-M `aggTrades` returned HTTP 200; Bybit recent trades returned HTTP 200; Hyperliquid websocket/rest public trades are an active public proxy rail from prior verified captures | Infer taker side from Binance `m` flag / Bybit `side`; compute signed volume, CVD proxy, print burst, sweep/exhaustion windows | Deep history needs paginated fetchers and exchange retention rules; ATAS Smart Tape side/aggressor export is still unverified | Fetcher + normalizer to `trade_prints` table; include exchange, venue, symbol, trade id, timestamp, price, size, aggressor/proxy side |
| Orderflow-ish | `crypto-updates` public orderflow captures include Binance bookTicker/depth5 and Hyperliquid l2Book/allMids/trades; latest big BTC-only run has 855,975 raw records and 11,519 1s feature rows; ATAS Bid/Ask Tape manual CSV is active | Binance spot/futures depth snapshots returned HTTP 200; Bybit public trades/klines returned HTTP 200; Hyperliquid `l2Book` returned HTTP 200 | Delta velocity, bid/ask-side velocity, book imbalance, spread/liquidity shock, volume-per-price-progress, absorption/exhaustion scores | Historical L2/orderbook replay is mostly gated by prior capture unless exchange archives are found; current saved public captures have no exact finalized alert symbol/time overlap | Continue SQLite for raw events/features; add ingestion timestamps and symbol/time overlap audit immediately after each capture |
| Footprint / volume-at-price | ATAS Classic `Classic_All_Prices` exists: 6,963 rows, `Price;Volume;Trades;Bid;Asks;Delta`, price range `80095.9..81294.9`, total volume `53390.850`, net delta `-1040.332`; earlier `All_prices_Classic` also exists | Direct exchange footprint is not provided as a ready endpoint, but raw trades/aggTrades can be fetched and bucketed by price/tick | Derive volume-at-price, price-level delta proxy, HVN/LVN, POC, price-band absorption from public trades; compare to ATAS All Prices when windows overlap | ATAS All Prices is distribution-only, not time-sequenced; true candle footprint history from ATAS depends on C# indicator/feed/runtime access | Price-level table keyed by source window id, price/tick, volume, trades, bid, ask, delta/proxy_delta |
| Widget-state | Screenshots show Market Pressure, Price Change, DOM Pressure, Delta Divergence; no export path visible for Market Pressure; Delta Divergence screenshots are state evidence only | Not public-fetchable as ATAS widget internals | Recreate proxy states from feature windows: divergence state, dwell time, flip frequency, cross-horizon agreement, delta-vs-price progress | Actual ATAS built-in widget values are missing unless API exposes them or a custom indicator can reproduce/log them | Treat as model features, not source truth. Store derived state windows separately from raw source data |
| Live-capture / forward-test | Existing `crypto-updates` websocket capture scripts and public-orderflow SQLite runs prove the public capture path; ATAS manual CSVs prove HITL capture; no ATAS automatic exporter yet | Binance/Bybit/Hyperliquid live public endpoints are currently reachable from workspace; ATAS live capture requires Tomas-machine indicator/manual folder bridge | Forward-test public and ATAS feature windows in parallel; compare manual CSV, exporter output, and public aggTrades around same UTC interval | ATAS exporter install/run, Tomas output folder, runtime target, and Start-plan custom DLL loading are still unverified | Use append-only JSONL/CSV for exporter windows plus SQLite importer; one heartbeat/status file; no account/order/trade-stat data |

### Local Data Inventory

- `crypto-updates/orderflow-index.yaml` indexes public no-key captures from Binance and Hyperliquid. The largest BTC run, `2026-08-22T08-39-ralph-hl-btc-2h`, has `855975` raw records, `263961` trade records, `535518` book-ticker records, `41763` depth5 records, and `11519` 1s feature rows.
- `crypto-updates/wiki/orderflow/replay-alignment.md` says saved feature captures remain pipeline evidence only: `0` exact finalized alert symbol/time matches, with `8` near misses.
- `zela-benchmark/source/zela_datasets/*` contains feed latency/slot benchmark CSVs (`aggregates.csv`, `feeds.csv`) for Zela vs baseline. It is useful infrastructure/context evidence, not direct BTC/ETH/SOL market backtest data.
- `ralph-research-os/raw/atas-manual-exports/2026-09-20/classic-followup-1502/Classic_All_Prices---694b61dd-d970-4fb9-932f-00202dc7084d.csv` is the strongest current footprint/volume-at-price manual file.
- `ralph-research-os/raw/atas-manual-exports/2026-09-20/classic-followup-1502/Chart_Classic_2---caca0a5d-e6de-44c6-a672-3c34adc3a1e3.csv` is OHLC-only and should not be treated as volume/orderflow evidence.

### Current Public No-Key Access Checks

Workspace probes on 2026-09-20 returned:

- Binance spot klines, spot aggTrades, and spot depth for `BTCUSDT`: HTTP 200 with data.
- Binance USD-M futures klines, aggTrades, and depth for `BTCUSDT`: HTTP 200 with data.
- Bybit v5 linear klines and recent trades for `BTCUSDT`: HTTP 200 with data.
- Hyperliquid `l2Book` for `BTC`: HTTP 200 with data.

Working decision: public exchange data is enough to build the first historical fetchers and proxy feature windows without keys. It is not enough to claim parity with ATAS widgets or true ATAS footprint internals.

### ATAS C# / Plan Access Verification

Local docs cache facts:

- Custom indicators are a documented C# class-library flow: reference `ATAS.Indicators.dll`, inherit from `Indicator`, implement `OnCalculate`, build a DLL, and place/add it as a custom indicator.
- `OnCalculate` runs on each historical bar and on each current-bar tick.
- Candle access exposes OHLC, volume, bid, ask, delta, max/min delta, VWAP, OI, and last trade time.
- Footprint/cluster access is documented through `IndicatorCandle.GetAllPriceLevels()`, `GetPriceVolumeInfo(price)`, and `PriceVolumeInfo` fields `Price`, `Volume`, `Bid`, `Ask`, `Ticks`, `Between`, and `Time`.
- Online tick and cumulative-trade hooks are documented through `OnNewTrade`, `OnCumulativeTrade`, and `OnUpdateCumulativeTrade`.
- Historical cumulative trade requests are documented through `RequestForCumulativeTrades` and `OnCumulativeTradesResponse`; `CumulativeTradesRequest` says the requested period must not be more than `7` days.
- Indicator has `DataPath`, market-depth callbacks/snapshot, cumulative DOM fields, `TradingManager`, and `TradingStatisticsProvider`. RALPH exporter must avoid `TradingManager` and trading/account-stat surfaces.

Current ATAS site facts checked on 2026-09-20:

- ATAS public product copy advertises API/custom C# development and use of the same raw exchange data used by built-in indicators.
- Pricing page confirms `Start` is free and includes ATAS X, real-time crypto exchange access, `1` active crypto connection, basic indicators, `3` indicators per chart, standard timeframes, and no Market Replay; Market Replay appears in Plus/Pro/Ultra.
- Pricing page does not explicitly say whether custom C# DLL indicators are allowed on `Start`. Tomas's screenshot already proves Market Replay is gated on Start. Custom DLL loading therefore remains `docs-supported__runtime-plan-unverified`, not fully active.

Verdict: build the exporter design/spec now, but do not treat a deployable `RalphOrderflowExporter` DLL as verified until Tomas confirms `Add custom indicator` is visible/usable on his current ATAS X/Classic Start setup and provides the matching runtime target (`OFT.PlatformX.runtimeconfig.json` or `OFT.Platform.runtimeconfig.json`). This is the narrow blocker; no paid-plan/trial activation is required or requested.

### Upgraded Data / Backtest Rail

1. `public_historical_core`: fetch Binance USD-M + spot klines/aggTrades, Bybit linear klines/trades, and Hyperliquid candles/trades/L2 where available. Use this for price/volume, trade-print, and orderflow-ish proxies.
2. `public_live_capture`: extend existing `crypto-updates` capture into a repeatable forward-test rail with immediate overlap audit against alerts/reviews.
3. `atas_manual_import`: normalize Bid/Ask Tape, Smart Tape, All Prices, and Chart exports by header. Preserve source path and original row index. Produce compact feature windows.
4. `atas_exporter_candidate`: read-only C# indicator/exporter, pending runtime-plan verification, that writes append-only feature windows only.
5. `feature_window_unification`: common 1s/5s/30s/1m/3m schema for public and ATAS sources: price progress, volume, signed volume/proxy CVD, delta, delta velocity, bid/ask-side velocity, spread/imbalance where available, volume-at-price summary, absorption/exhaustion/breakout-quality candidates, and BTC gate fields.

### Next Concrete Artifacts

- `tools/ralph-data-inventory` or equivalent: source probe/fetch scripts and a manifest of accessible public endpoints.
- ATAS CSV importer: header-based classifier for Bid/Ask Tape, Smart Tape, All Prices, and OHLC chart exports.
- Feature-window schema: one JSON schema/Markdown spec shared by public fetchers, ATAS manual import, and future exporter.
- `RalphOrderflowExporter` design skeleton: C# class shape, fields, file format, and safety guard, but actual build/deploy waits on the custom-indicator/runtime check.
