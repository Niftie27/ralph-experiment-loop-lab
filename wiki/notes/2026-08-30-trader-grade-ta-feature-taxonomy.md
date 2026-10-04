---
type: note
topic: trader-grade-ta-feature-taxonomy
created: 2026-08-30T09:30:00Z
last_updated: 2026-08-30T09:30:00Z
work_item: investigation.trader-grade-ta-feature-taxonomy
status: complete
scope: research-only
sources:
  - https://atas.net/
  - https://bookmap.com/crypto
  - https://exocharts.com/
  - https://www.tradingview.com/
tags:
  - ralph
  - research-note
  - orderflow
  - ta
  - strategy-family
related:
  - 2026-08-11-trader-grade-ta-orderflow-tool-stack.md
  - 2026-08-11-orderflow-feature-taxonomy.md
  - 2026-08-29-shared-language-maintenance-and-grill-me.md
  - ../concepts/multi-timeframe-full-ta.md
  - ../../../crypto-updates/wiki/orderflow/replay-alignment.md
---
# Trader-Grade TA Feature Taxonomy

## Purpose

This closes `investigation.trader-grade-ta-feature-taxonomy`.

The goal is to separate full TA, lower-timeframe triggers, orderflow proxies, derivatives context, statistics, and data-quality flags so RALPH does not overstate a simple price/volume event as a complete trading thesis.

No alert wording, alert threshold, watcher behavior, execution rule, risk rule, data subscription, account, key, or live trading path changed.

## Feature Layers

| Layer | Examples | Evidence role | Current source state |
| --- | --- | --- | --- |
| HTF context | daily/4h trend, market structure, major levels, regime, thesis invalidation | defines whether a trade idea is structurally valid | local candles and RALPH full-TA vocabulary |
| Mid-TF setup | range acceptance/rejection, VWAP/value, retest/reclaim, prior high/low, session structure | defines the actionable setup and alternate scenarios | partly in local candle setup stats; needs richer records |
| LTF trigger | wick shock, volume velocity, breakout/retest trigger, sweep, fast reclaim/reject | timing evidence only, especially for fast trades | live watcher and local alert-feedback artifacts |
| Orderflow proxy | CVD/signed taker flow, buy/sell split, imbalance, spread, book update burst, absorption/sweep proxy | confirms or falsifies trigger quality | public Binance/Hyperliquid captures; alignment still weak |
| Derivatives context | funding, open interest, basis, liquidation clusters, long/short crowding | regime/context or structural baseline evidence | public/free partial; paid/API sources need approval |
| Statistical evidence | sample, winrate, expectancy R, profit factor, baseline lift, OOS/walk-forward, paper result | gate for Watch/Candidate/Paper decisions | strategy filter and alert-edge harness |
| Quality flags | stale book, missing source, symbol/time mismatch, capped fills, incomplete horizon, bad schema | prevents false confidence | active in several local validators and notes |

## Naming Rules

- Full TA means HTF context plus mid-TF setup plus LTF trigger plus scenario map.
- Volume velocity is an LTF trigger unless it is joined to higher-timeframe context.
- Orderflow confirmation is not a trade by itself; it is trigger-quality evidence.
- Derivatives data is context unless a separate structural strategy hypothesis is defined.
- Paper/shadow outcome is evidence, not permission to change live alerts.
- Modified/manual executions are comparison buckets, not pure alert-quality labels.

## Minimum Feature Contract

Before a future alert or research record can claim trader-grade setup quality, it should carry:

- setup family and direction;
- HTF trend/regime and invalidation;
- mid-TF range/level context;
- LTF trigger type and decay horizon;
- orderflow feature window when available;
- baseline comparison;
- sample count and forward-paper status;
- data-quality flags;
- no-trade condition.

If any layer is missing, the record should say which layer is missing rather than implying confidence.

## Current Falsifier

The current public orderflow artifacts are not enough to promote orderflow into a live gate because the 2026-08-30 replay-alignment audit found zero exact symbol/time matches between saved feature runs and finalized alerts.

Until exact overlap exists, orderflow features remain pipeline evidence and research context.

## Queue Implication

Future TA/orderflow work should prefer:

- capture or align features around actual alert windows;
- label records by feature layer instead of one generic "TA" bucket;
- test price-only versus price-plus-orderflow outcomes;
- keep Telegram wording unchanged unless Tomas explicitly approves alert-surface changes.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
