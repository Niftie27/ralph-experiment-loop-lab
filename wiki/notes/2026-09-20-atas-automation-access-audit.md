---
type: research-note
date: 2026-09-20
tags:
  - ralph
  - atas
  - orderflow
  - automation-audit
  - data-rail
related:
  - 2026-09-20-atas-manual-orderflow-rail.md
  - 2026-09-20-atas-classic-vs-x-exporter-plan.md
  - ../../core/data-rails.md
  - ../../outputs/atas-access-audit.md
status: active-watch
---

# ATAS Automation Access Audit

Status: `active-watch`, research-only. The workspace can process Tomas-provided ATAS CSV exports now, but it does not currently have direct runtime access to an ATAS installation, ATAS process, local ATAS database, or ATAS export folder.

## Access Verdict

Current verdict: `manual_csv_active__automatic_access_unproven`.

The best automation route is not screen scraping and not network interception. It is a read-only ATAS custom indicator/exporter running inside ATAS and writing normalized orderflow rows or derived feature windows to an append-only local file such as JSONL/CSV. ATAS official documentation describes custom indicators/strategies, access to candles, footprint price levels, online ticks, cumulative trades, market depth, MBO where the provider supports it, and trading statistics. The official GitHub examples repo is public and references the ATAS Platform install path and .NET SDK build flow.

What is verified:

- ATAS manual export is active through `+ -> New Widget -> Bid/Ask Tape -> export/save CSV`.
- Bid/Ask Tape gives usable bid/ask-size and delta rows: schema `Time;Bids;;;;Ask;Delta`.
- Smart Tape currently gives supplemental print rows: schema `Time;Price;Volume`.
- The local OpenClaw workspace has no detected ATAS install under `/mnt/c/Program Files/ATAS Platform`, `/home/coder/ATAS`, or Wine's default `Program Files/ATAS Platform`.
- Official docs expose an in-platform C# API surface broad enough for a read-only exporter prototype, but not a confirmed external REST/WebSocket API for pulling ATAS tape data from this workspace.

## Automation Routes

Ranked routes:

1. `read_only_custom_indicator_exporter` - Build a C# indicator for ATAS/ATAS X that observes trades/cumulative trades/footprint/DOM and appends JSONL feature rows to a configured local path. Highest-quality path because it uses ATAS's own normalized data surface.
2. `watched_manual_export_folder` - Tomas continues exporting Bid/Ask Tape/Smart Tape CSVs into a synced folder; RALPH watches/imports new files by header, not filename. Lower latency than Telegram attachments if the folder is accessible, but still human-in-the-loop.
3. `ui_export_automation` - Automating ATAS UI export clicks is possible only after a reachable desktop/node exists. Treat as fragile backup, not core architecture.
4. `local_database_or_log_reader` - Not verified. Do not assume private local storage format, retention, or licensing. Only inspect after Tomas grants read-only access to the machine/path.
5. `network_capture` - Last resort and not recommended for the current RALPH path. Avoid unless there is explicit approval, a narrow diagnostic target, and no credential/session capture risk.

Rejected as active routes today:

- Direct ATAS pull from this workspace: no local install or running ATAS process detected.
- Broker/exchange credentials in RALPH: not needed for the research rail and explicitly out of bounds.
- Live strategy/bot execution: out of scope; exporter must be read-only.

## Metric Bridge

Keep volume velocity as the screening/trigger layer. ATAS-derived orderflow should confirm or reject the event quality.

Feature groups:

- `volume_velocity`: existing activity spike detector from public/CSV volume. Use for watchlist surfacing and alert-window selection, not final interpretation.
- `delta_velocity`: rate of change in Bid/Ask Tape cumulative delta over rolling windows. Positive/negative impulse confirms aggressive side.
- `bid_side_velocity` and `ask_side_velocity`: rolling bid-size and ask-size flow per second or per row-window.
- `volume_per_price_progress`: total tape volume divided by absolute price progress. High volume with low progress is absorption candidate; high progress per volume is easier continuation.
- `absorption_score`: one-sided aggressive flow or large prints at/near a level with limited price progress and failure to extend.
- `exhaustion_score`: high late flow into a level followed by delta deceleration, price stall, and failed continuation.
- `breakout_quality_score`: price acceptance beyond level plus positive delta velocity in breakout direction, price progress per volume, low immediate absorption, and BTC gate alignment.

Research-only interpretation:

- High `volume_velocity` + positive breakout `delta_velocity` + good `volume_per_price_progress` = continuation candidate, still BTC-gated.
- High `volume_velocity` + large one-sided side velocity + poor price progress = absorption candidate.
- High `volume_velocity` into level + delta deceleration + reversal in price progress = exhaustion candidate.
- Breakout attempt with high volume but negative/flat delta velocity and poor price progress = fakeout/watch, not entry confirmation.

## Required Prototype

First prototype should avoid trading permissions entirely:

1. Parser/importer: classify ATAS CSV by header, preserve source path and original row index, normalize time with explicit capture date/timezone metadata, and output compact windows.
2. Feature window generator: compute the metric bridge over 30s, 1m, 3m, and decision-window buckets.
3. ATAS exporter proof: only after Tomas can run or install a DLL locally, write a read-only C# indicator that exports the same window schema without manual CSV clicks.
4. Parity check: compare manual CSV windows, exporter windows, and public exchange aggTrades around the same BTCUSDT interval before trusting any automated ATAS feature.

Classic vs ATAS X update: ATAS docs say Classic is Windows/WPF while ATAS X is cross-platform; a simple no-custom-UI indicator/exporter is likely portable across both, while WPF custom editors/UI would not be. First exporter proof should therefore avoid custom UI entirely and target the installed platform runtime (`.NET 8` or `.NET 10`) discovered from `OFT.Platform.runtimeconfig.json` or `OFT.PlatformX.runtimeconfig.json`. See `2026-09-20-atas-classic-vs-x-exporter-plan.md`.

## 2026-09-20 Current Access Update

ATAS docs/API surface is strong enough for an exporter design:

- custom C# indicators are documented through `ATAS.Indicators.dll`, `Indicator`, and `OnCalculate`;
- candle fields include OHLC, volume, bid, ask, delta, max/min delta, VWAP, OI, and last trade time;
- footprint/cluster fields are reachable through `IndicatorCandle` and `PriceVolumeInfo`;
- online ticks, cumulative trades, cumulative-trade updates, and historical cumulative-trade responses are documented;
- `CumulativeTradesRequest` documents a max request span of `7` days;
- market-depth callbacks/snapshots exist but should stay optional until provider support is tested.

ATAS plan/runtime access is not fully proven:

- current public ATAS pricing says `Start` is free and includes ATAS X, real-time crypto exchange access, one active crypto connection, basic indicators, three indicators per chart, and standard timeframes;
- the same pricing table puts Market Replay under Plus/Pro/Ultra, matching Tomas's Start-plan replay modal;
- the pricing page does not explicitly verify custom DLL loading on Start.

Verdict: `RalphOrderflowExporter` is now `docs-supported__runtime-plan-gated`. A design note exists at `2026-09-20-ralph-orderflow-exporter-v0-design.md`, but actual DLL/code work should wait until Tomas confirms `Add custom indicator` is visible/usable and provides the installed runtime target. Continue public fetchers and manual CSV import in parallel.

## Boundaries

No live trading, order placement, wallet keys, exchange keys, broker keys, paid-feed setup, alert wording changes, thresholds, risk/sizing, TP/SL, scheduler/cadence changes, or strategy promotion. This is an access and feature-design audit only.
