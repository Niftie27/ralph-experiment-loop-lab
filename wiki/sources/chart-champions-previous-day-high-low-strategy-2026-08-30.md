---
type: source
title: "Previous Day High & Low Strategy: Master Liquidity Sweeps"
original_path: https://www.youtube.com/watch?v=mgK6kHH3RJI
raw_file: raw/chart-champions-previous-day-high-low-strategy-2026-08-30.md
assets: []
authors: [Chart Champions]
published_date: null
publication: YouTube
relevance_score: 0.86
ingested: 2026-08-30T10:10:00Z
last_updated: 2026-08-30T14:16:00Z
entities:
  - TradingView
concepts:
  - wiki/concepts/multi-timeframe-full-ta.md
related:
  - wiki/notes/2026-08-30-previous-day-high-low-liquidity-sweep-intake.md
  - wiki/notes/2026-08-30-trader-grade-ta-feature-taxonomy.md
  - wiki/notes/2026-08-29-shared-language-maintenance-and-grill-me.md
---

# Previous Day High & Low Strategy: Master Liquidity Sweeps

Raw source: [[raw/chart-champions-previous-day-high-low-strategy-2026-08-30]]

YouTube: https://www.youtube.com/watch?v=mgK6kHH3RJI

## Why This Source Matters

Tomas supplied this Chart Champions video transcript as general trading knowledge for the Obsidian/RALPH second brain. It is useful because it maps a simple, widely watched intraday level pair - previous day high and previous day low - into liquidity, failed breakout, continuation, and reversal language.

## What Was Extracted

- Chapter anchors:
  - 00:00 Intro
  - 01:14 What are the previous day high and low
  - 02:17 How to mark these levels correctly in TradingView
  - 06:02 Setup 1: Liquidity sweep and reversal
  - 08:22 Setup 2: Breakout and acceptance
  - 10:38 Setup 3: No trade condition
  - 12:34 Using VWAP as confirmation
  - 14:49 Recap
- Previous day high and low as two core pre-session levels.
- The warning that prior day high is not automatically resistance and prior day low is not automatically support.
- The interpretation of prior day extremes as order-concentration and decision areas.
- The need to choose a session definition consistently: full/electronic trading hours versus regular trading hours.
- The idea that volume, volatility, and participation can increase near these levels, but that this does not by itself imply reversal.
- A TradingView workflow clue: enable session breaks to make prior session boundaries visible.
- Three reaction buckets: liquidity sweep and reversal, breakout and acceptance, and unclear no-trade.
- Bearish sweep confirmation: price trades above PDH, then quickly closes back below and cannot reclaim; inverse logic applies at PDL.
- Breakout acceptance: price opens/closes beyond the level with momentum and holds there, sometimes without a retest.
- No-trade condition: overlapping candles, repeated attempts through/back across the level, and no clear acceptance or rejection.
- VWAP confirmation: RTH VWAP slope/context can support continuation direction; flat VWAP warns of balanced/choppy control.
- Educational stop/target examples: stops beyond the sweep high/low or breakout candle; targets can include VWAP, opposite side of balance, opening-range extensions, value area levels, point of control, or fixed R-multiple.

## RALPH Implications

- Prior day high/low belongs in the mid-timeframe setup layer of [[wiki/concepts/multi-timeframe-full-ta]], not as a standalone trade signal.
- Per Tomas's correction, this source should also be retrieved as a reusable full-TA primitive whenever PDH/PDL, liquidity sweep, breakout acceptance, no-trade, or VWAP session-control context is relevant.
- Liquidity sweep language should distinguish sweep-and-fail, failed breakout, continuation through level, and no-trade decision point.
- Session definition must be explicit in any backtest, paper record, or alert analysis using PDH/PDL. Mixing RTH and ETH/full-session levels creates hidden lookahead or inconsistent labels.
- A TradingView indicator may help humans draw the levels, but RALPH should not treat the indicator itself as edge.
- VWAP and value-area targets are context/management fields; they do not make the PDH/PDL touch itself a trade.

## Caveats

- The transcript was manually supplied without timestamps.
- The TradingView indicator link was not supplied in the transcript and was not verified in this runtime.
- This intake does not change alerts, thresholds, live trading, execution, or strategy status.
