---
type: research-note
date: 2026-09-20
tags:
  - ralph
  - atas
  - atas-x
  - orderflow
  - data-surface
  - latency
related:
  - ../sources/atas-api-docs-2026-09-20.md
  - 2026-09-20-atas-docs-ingestion.md
  - 2026-09-20-atas-classic-vs-x-exporter-plan.md
  - 2026-09-20-atas-automation-access-audit.md
  - 2026-09-20-atas-manual-orderflow-rail.md
  - ../../core/data-rails.md
status: active-watch
---

# ATAS X Speed And Data Surface

Status: `active-watch`, research-only. This note clarifies whether ATAS X should be preferred over Classic ATAS and what data RALPH can reasonably expect from ATAS X.

Source pack: [[../sources/atas-api-docs-2026-09-20|ATAS API and ATAS X Documentation]].

## Speed Verdict

Prefer ATAS X first unless Classic exposes a specific module/export/control that ATAS X lacks.

Evidence:

- ATAS's current site presents the modern product as Windows, macOS, and Web capable, with Footprint, Heatmap, Volume Profile, MBO Bundle, 240+ indicators, 25+ connections, Smart Tape, Smart DOM, Market Replay, and API.
- ATAS download/onboarding copy for ATAS X advertises `2.5x faster response time`.
- ATAS X developer docs say ATAS X is cross-platform while Classic is Windows/WPF. They also say a normal no-custom-WPF-UI indicator can be one DLL usable in both Classic and ATAS X.

Working decision:

- For Tomas/RALPH, ATAS X is the default target because Tomas already confirmed usable Bid/Ask Tape and Smart Tape exports there, and the vendor positions X as faster/more modern.
- Classic ATAS is only worth using if ATAS X lacks a specific needed module/export path, if Classic gives cleaner historical mode/export controls, or if the exporter DLL fails in ATAS X but works in Classic.

## What ATAS X Can Give RALPH

Currently verified by Tomas/manual CSV:

- `Bid/Ask Tape` CSV: primary orderflow source. Observed schema `Time;Bids;;;;Ask;Delta`, with bid price, bid-side size, ask-side size, ask price, and running/cumulative delta.
- `Smart Tape` CSV: supplemental print source. Observed schema `Time;Price;Volume`; useful for print context, but not enough alone for side/aggressor/delta unless settings expose more fields.

Available through the documented indicator API, subject to feed/platform support:

- Candle/bar data: `open`, `high`, `low`, `close`, `volume`, `ask`, `bid`, `delta`, `LastTime`, `MaxDelta`, `MinDelta`, OI fields.
- Footprint/cluster data per price level: price-level volume, bid, ask, delta via `GetPriceVolumeInfo()` / `GetAllPriceLevels()`, plus max-volume/max-delta price levels.
- Online ticks: `OnNewTrade(MarketDataArg arg)` callback.
- Aggregated/cumulative trades: `OnCumulativeTrade`, `OnUpdateCumulativeTrade`, plus historical `RequestForCumulativeTrades`.
- Market depth: `MarketDepthChanged`, cumulative DOM asks/bids, DOM snapshot.
- MBO: available only where the provider supports it; docs specifically note Rithmic for MBO, so do not assume crypto/Binance MBO.
- Trading/account statistics: available in docs but not needed for the RALPH read-only orderflow rail and should stay out of scope unless explicitly approved.

## How Fast

Manual CSV:

- Human-in-the-loop speed: seconds to minutes depending on Tomas exporting/sending the file.
- Good for urgent review packets and training/validation, not autonomous live feed.

C# indicator/exporter inside ATAS X:

- `OnCalculate` on the current bar is called on every tick according to docs.
- `OnNewTrade`, `OnCumulativeTrade`, `MarketDepthChanged`, and MBO callbacks are event-driven as ATAS receives/updates data.
- Practical export latency is expected to be near-realtime but not yet measured: feed latency + ATAS processing + indicator callback + file write/flush + RALPH watcher read.
- First target should be conservative: append compact feature windows every 250ms-1s or on bucket close, not raw every-depth-update firehose.
- Exact latency must be measured with a timestamped exporter test before using it for any live decision label.

RALPH priority:

1. Use manual CSV parser now.
2. Generate feature windows over 30s/1m/3m/decision-window buckets.
3. If ATAS X exporter is approved, measure exporter latency and dropped-update risk with timestamps.
4. Compare exporter output against manual CSV and public exchange aggTrades around the same BTCUSDT window.

## Feature Mapping

- `volume_velocity`: activity trigger/screen.
- `delta_velocity`: from candle delta or cumulative trade direction/volume.
- `bid_side_velocity` / `ask_side_velocity`: from Bid/Ask Tape CSV, footprint price levels, cumulative trades if direction maps cleanly, or DOM side changes depending on mode.
- `volume_per_price_progress`: tape/cluster/cumulative volume divided by price movement over the feature window.
- `absorption_score`: high one-sided flow or large prints at a level with weak price progress.
- `exhaustion_score`: high late flow into a level followed by delta deceleration and failed continuation.
- `breakout_quality_score`: acceptance beyond level, aligned delta velocity, efficient price progress, low immediate absorption, and BTC gate alignment.
