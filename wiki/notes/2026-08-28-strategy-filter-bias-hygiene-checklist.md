---
type: note
name: Strategy Filter Bias Hygiene Checklist
created: 2026-08-28T11:37:31Z
last_updated: 2026-08-28T12:04:13Z
tags:
  - autoresearch
  - strategy-destruction-filter
  - bias-hygiene
  - freqtrade
  - validation
sources:
  - https://www.freqtrade.io/en/stable/lookahead-analysis/
  - https://www.freqtrade.io/en/stable/recursive-analysis/
related:
  - ./2026-08-28-freqtrade-no-key-dry-run-spike.md
  - ../concepts/strategy-destruction-filter.md
  - ../../experiments/strategy-destruction-filter/README.md
  - ../../experiments/strategy-destruction-filter/src/engine.mjs
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
---

# Strategy Filter Bias Hygiene Checklist

Status: checklist complete; startup/recursive variance and source-pattern lookahead guards implemented in the local harness test suite.

## Purpose

Convert the useful parts of the Freqtrade no-key spike into a RALPH-native bias-hygiene checklist for the current strategy-destruction filter, without installing Freqtrade or changing any trading, alert, risk, sizing, TP/SL, watcher, or cron behavior.

## Checklist

| Guard | Current RALPH status | Next hardening action |
| --- | --- | --- |
| Research-only status | Verified in `verify-filter.mjs`: report, feature study, replay, event-study, shadow PnL, and data-access artifacts must stay `research-only-no-live-execution`. | Keep as required invariant. |
| Chronological OOS split | Verified: report evaluation must use `chronological_entry_time`; every variant's in-sample plus out-of-sample sample must equal total sample. | Keep as hard survival gate. |
| Baseline comparison | Verified: every variant carries a same-sample `time_matched_alternating_direction` baseline and baseline lift gate. | Keep as hard survival gate. |
| Multiple-testing penalty | Verified: every variant carries labeled `approximate_multiple_testing_deflated_sharpe`. | Keep approximate label explicit; do not overclaim institutional DSR. |
| Semantic rejection memory | Verified: every rejected row must match source candidate `idea`, `thesis`, `dataRequirements`, and `validation`. | Keep to prevent repackaged weak ideas. |
| Lookahead leakage | Covered for current signal-path functions by `signal path source avoids explicit future candle access` in `test/engine.test.mjs`. The guard scans pre-entry helper functions for explicit future candle access and whole-series aggregation patterns. | Keep this guard focused on signal generation; exit simulation may legitimately inspect future bars after entry. |
| Startup/recursive variance | Covered for current representative rule families by `signal decisions are stable after truncating warmup history` in `test/engine.test.mjs`. The test compares full-history signals against a prefix-truncated history once both runs have enough warmup. | Keep this as a required test when adding new rule-family helpers; extend the representative variant set if future rules use longer lookbacks or stateful indicators. |
| Dynamic pairlist/data-scope drift | Mostly covered by fixed candidate market/timeframe filters and report source records. Alert-edge universe rotation is external and should feed candidate specs, not mutate a tested candidate after the fact. | Add a candidate/report identity check if dynamic universe-derived candidates become common. |
| Backtest-only fills | Not execution-grade. The current harness uses coarse candles, cost assumptions, and shadow PnL caveats; replay/event studies explicitly gate low samples. | Keep candidate promotion blocked until replay/forward-paper evidence exists for alert-derived ideas. |

## Local Evidence

The latest verified filter report has 9 candidates, 105 variants, 0 survivors, and 105 rejected rows. The existing verifier already catches the major numeric and semantic anti-overfit guardrails: research-only status, chronological split, baseline method, approximate deflated-Sharpe label, survivor gates, walk-forward diagnostics, source coverage, and candidate-consistent rejected-ledger semantics.

The remaining blind spot is not the current verdict quality. It is harness hygiene for future rule additions: lookahead behavior now has a focused source-pattern guard for pre-entry signal functions, and startup/recursive variance has a deterministic representative test. Freqtrade stays useful as a benchmark vocabulary for those two guard classes, not as an active dependency.

## Reassessment

Do not install Freqtrade for this yet. The next RALPH-native hardening should move back from bias-hygiene scaffolding toward data/evidence quality. The cheapest queued choice is `validation.ta-orderflow-alert-gate-backtest` if the goal is strategy-filter integration, or `validation.book-freshness-repair-for-orderflow-alert-gate` if the goal is replay quality first.

Self-check: research-only; local files plus already-cited official public docs; no package install; no API keys; no accounts; no paid access; no execution, orders, wallet keys, alert wording, watcher behavior, risk/sizing, TP/SL, cron cadence, public posting, or strategy promotion changed.
