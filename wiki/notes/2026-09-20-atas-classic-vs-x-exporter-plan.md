---
type: research-note
date: 2026-09-20
tags:
  - ralph
  - atas
  - atas-classic
  - atas-x
  - orderflow
  - hitl
related:
  - 2026-09-20-atas-x-speed-and-data-surface.md
  - 2026-09-20-atas-automation-access-audit.md
  - 2026-09-20-atas-manual-orderflow-rail.md
  - ../../core/data-rails.md
status: active-watch
---

# ATAS Classic vs ATAS X Exporter Plan

Status: `active-watch`, research-only. Goal is to decide where a read-only C# exporter should run and what Tomas needs to provide for HITL validation.

## Official Platform Difference

ATAS Classic is Windows-only and built on WPF. ATAS X is cross-platform for Windows/macOS and uses cross-platform technologies. ATAS docs say most indicators originally developed for Classic should work in ATAS X without code changes because common Windows-specific types are converted at runtime, but WPF custom editors or WPF UI elements are not portable.

For RALPH, this is favorable because the planned exporter should not need a custom UI. It can be a simple indicator/exporter that reads data and writes append-only rows to a file. That makes a single simple DLL plausible for both Classic and ATAS X, subject to the installed platform's .NET runtime.

Update: ATAS X should be the default target unless Classic exposes a specific missing tool or cleaner export path. ATAS's current public copy advertises ATAS X as faster/more modern, and Tomas has already verified usable Bid/Ask Tape and Smart Tape exports in ATAS X. See `2026-09-20-atas-x-speed-and-data-surface.md`.

## Installation Difference

Classic:

- Build a C# class library referencing `ATAS.Indicators.dll` from the installed ATAS folder.
- Place the resulting DLL into the indicators folder or use `Add custom indicator`.
- Manual folder path documented as `C:\Users\<Your_name>\AppData\Roaming\ATAS\Indicators`.

ATAS X:

- Recommended path is also `Add custom indicator` from the indicators window.
- Manual Windows folder path documented as `C:\Users\<user>\AppData\Roaming\ATAS X\Indicators`.
- Manual macOS folder path documented as `~/Library/Application Support/ATAS/Indicators`.
- ATAS X watches the folder and reloads new/updated DLLs automatically.

Runtime:

- Target framework must match the platform runtime, currently documented as `.NET 8` or `.NET 10`.
- The reliable check is the runtimeconfig file next to the platform executable:
  - Classic: `OFT.Platform.runtimeconfig.json`
  - ATAS X: `OFT.PlatformX.runtimeconfig.json`
- Multitargeting `net8.0-windows;net10.0-windows` is the safest build approach.

## Data Surface That Matters

Official data docs confirm enough in-platform access for an exporter prototype:

- candle ask/bid/volume/delta
- footprint/cluster data per price level via candle price-volume info
- online ticks through `OnNewTrade`
- cumulative trades through `OnCumulativeTrade` / update hook
- market depth and MBO, where provider/feed supports it
- trading statistics, though account stats are not needed for the RALPH orderflow rail

For first RALPH exporter, prefer the smallest read-only subset:

1. cumulative trade rows or tick rows when available
2. candle/footprint cluster summaries by bar
3. optional market depth/MBO later only if the feed supports it and it adds evidence

## Manual Classic Follow-Up

Tomas's Classic ATAS settings screenshots on 2026-09-20 show no obvious export/history-depth setting in the opened windows:

- Bid/Ask Tape settings: common visual settings only, including background, buy/sell colors, between color, and font size.
- Smart Tape settings: visual settings, filters, alerts, and templates; visible rows include colors, font, volume visualization, and price digits.
- All Prices window: period selector set to `Current Day` and price scale set to `1`.

New Classic CSV evidence:

- `Bid_Ask_Classic_2` confirms Classic can export a longer accumulated Bid/Ask Tape buffer: 153 rows over `15:28:46..15:47:43`, same schema as ATAS X Bid/Ask Tape, net ask minus bid `150.985`, delta range `-102.358..159.050`.
- `All_prices_Classic` confirms a useful price-distribution export: 5,419 rows with `Price;Volume;Trades;Bid;Asks;Delta`, price range `80095.9..81294.9`, total volume `47330.804`, net delta `-1630.986`.

Interpretation: Classic is now useful as a secondary manual rail for `All Prices` and for longer live-accumulated Bid/Ask Tape. It still has not proven a superior historical/replay-selected export.

ATAS X has a visible `Replay` widget/menu item from Tomas's earlier ATAS X screenshot, so replay exists as a UI surface. The open question is narrower: whether Replay can drive Bid/Ask Tape/All Prices and whether those widgets can export the selected replay interval.

Follow-up screenshot update: ATAS X/ATAS build `8.0.14.399-latest` shows `Market Replay` is not available on Tomas's current `Start` subscription. The modal says the current plan does not allow Market Replay and presents `Plus`, `Pro`, `Ultra`, or a 14-day free trial. Therefore replay-export testing is blocked by subscription access right now; do not treat replay as an active/manual rail unless Tomas explicitly enables a trial or higher plan.

The same screenshot set shows a data-provider chooser with crypto venues including `Binance`, `Bybit`, `OKX`, `Kraken`, and others, and a current chart label `BTCUSDT@BinanceFutures`. That is useful for exporter planning because ATAS can be pointed at the relevant BTCUSDT venue context on Tomas's machine. It does not give this workspace direct access without a manual export, watched folder, or read-only indicator bridge.

## HITL Ask From Tomas

Needed now:

- Decide which app you want to test first: `ATAS X` you already used, or `Classic ATAS` if installed/available.
- Send platform version and, if accessible, the runtime target from:
  - ATAS X: `OFT.PlatformX.runtimeconfig.json`
  - Classic: `OFT.Platform.runtimeconfig.json`
- Confirm OS/machine path: Windows ATAS, macOS ATAS X, or another reachable desktop.
- Confirm instrument/feed pair used in the screenshots/exports, for example `BTCUSDT`, Binance/crypto sim/ATAS sim/dxFeed.

Helpful but optional now:

- Screenshot of the Classic module launcher/widgets if Classic is installed, especially whether `Bid/Ask Tape`, `Smart Tape`, `All Prices`, Historical Mode, and Save/Export look cleaner than ATAS X.
- One Classic Bid/Ask Tape CSV and one Smart Tape CSV for schema comparison.
- Whether `Add custom indicator` is visible in the indicator window.

Needed later for exporter proof:

- Permission to install/test one read-only indicator DLL.
- A target output folder that contains no secrets and can be read by OpenClaw or synced back here.
- Confirmation that the indicator runs with no order-placement permissions and no broker/exchange credentials stored in RALPH.

## What To Build Next

Build in this order:

1. Manual CSV parser and feature window generator for existing ATAS exports.
2. Header-based schema classifier for Bid/Ask Tape and Smart Tape.
3. Research-only feature schema for `volume_velocity`, `delta_velocity`, bid/ask-side velocity, volume-per-price-progress, absorption, exhaustion, and breakout quality.
4. Optional read-only C# exporter skeleton once Tomas picks ATAS X vs Classic and provides runtime/install context.
5. Parity check between manual CSV, exporter output, and public exchange aggTrades/orderflow around the same BTCUSDT UTC window.

Boundary: no live trading, no orders, no account stats export, no keys, no paid feed setup, no alert wording/threshold/cadence changes, no strategy promotion.
