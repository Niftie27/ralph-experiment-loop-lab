---
type: note
topic: build-vs-buy-decision-memo
created: 2026-08-30T06:58:00Z
last_updated: 2026-08-30T06:58:00Z
work_item: investigation.build-vs-buy-decision-memo
status: complete
scope: research-only
sources:
  - raw/tool-first-pivot-2026-07-01.md
tags:
  - ralph
  - research-note
  - source-scan
  - strategy-family
related:
  - ../../core/profitability-flywheel.md
  - ../../core/testing-protocol.md
  - ../concepts/tool-first-not-build-first.md
  - ../comparisons/existing-tools-vs-custom-ralph-layer.md
  - ../../decisions/decisions.md
---
# Build vs Buy Decision Memo

## Purpose

This closes `investigation.build-vs-buy-decision-memo` as a compact decision artifact for the RALPH Profitability Flywheel.

The memo is based on existing RALPH sources and does not add a new web crawl, paid service, account setup, framework adoption, live trading path, or scheduler change.

## Decision

RALPH should default to existing tools, frameworks, public APIs, dashboards, and datasets before custom infrastructure.

Custom RALPH work is justified only when it is one of these differentiated layers:

- branch selection and queue routing;
- source-backed hypothesis and falsifier design;
- bias-safe validation and rejection discipline;
- Tomas-specific paper/shadow evidence;
- small adapters that connect a verified signal to an existing rail;
- durable memory, search, and decision records.

## Buy / Reuse First

Use or benchmark against existing rails before building:

| Job | Preferred stance |
| --- | --- |
| Generic backtesting | Benchmark with vectorbt, Freqtrade, Jesse, NautilusTrader, or another proven framework before trusting custom stats |
| Generic dry-run/paper engine | Prefer existing framework dry-run/paper semantics after explicit approval for any account/key path |
| Grid/range bot | Treat Pionex, 3Commas, Freqtrade-style grids, and existing bots as prior art or test rails |
| Copytrading execution | Treat Copin/HyperX/Hyperliquid tools as prior art and access references, not auto-enabled execution |
| Market data collection | Prefer public archives, public APIs, and local caches; custom capture only for missing alignment/freshness questions |
| On-chain/entity labels | Prefer Nansen/Arkham/Dune-style sources when access is approved; custom logic should test activity/cohort claims, not worship labels |
| Replay/fill realism | Prefer hftbacktest/Nautilus-style concepts before expanding a custom simulator |

## Build Only With Exception

Custom build is allowed when the wheel gate records:

- the exact missing capability;
- verified access limits of existing tools;
- why a small adapter is cheaper than adopting a full tool;
- the cheapest kill test;
- baseline comparison;
- failure modes;
- what would stop the branch.

## Current Application

Recent RALPH work matches this decision:

- vectorbt remains an external benchmark for alert-edge stats after row-level parity repair;
- Hyperliquid public leaderboard and info endpoints are active no-key research rails, not copytrading execution;
- strategy-destruction-filter is acceptable custom work because its differentiated role is rejection discipline, not generic backtesting;
- orderflow capture is acceptable only when it answers alert-alignment or replay-realism questions that saved candles cannot answer;
- live alerts, thresholds, risk, sizing, TP/SL, orders, exchange keys, wallet keys, accounts, and scheduler changes remain outside autonomous scope.

## Reassess Trigger

Reopen this decision if:

- an existing framework can produce the required RALPH output contract with less custom code;
- a custom module starts becoming a generic engine;
- paid/account-gated access is needed;
- a branch tries to move from research/paper into execution;
- row-level parity, dry-run, or forward-paper evidence contradicts custom results.

## Decision State

Status: active guardrail.

Effect: future RALPH branches must name the existing rail checked before custom build/data/backtest expansion. If no rail is accessible, classify the branch as `needs-access`, `watch`, or `custom-exception`, not silently custom-build.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
