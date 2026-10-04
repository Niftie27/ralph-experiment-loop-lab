---
type: note
topic: source-falsification-guide
created: 2026-08-29T22:05:51Z
last_updated: 2026-08-29T22:05:51Z
work_item: validation.guide-source-falsification
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - source-scan
related:
  - ../../core/profitability-flywheel.md
  - ../concepts/prior-art-before-experiment.md
  - ../concepts/strategy-destruction-filter.md
---
# Source Falsification Guide

## Purpose

This guide closes `validation.guide-source-falsification`.

RALPH already has a hard wheel gate: do not reinvent the wheel, and do not promote a strategy-shaped idea from one good historical slice. The missing operational step was a compact source-falsification pass that future researchers can run before expanding a candidate, adding custom code, or treating a historical survivor as more than Watch.

## When To Run

Run this guide whenever a source, operator profile, GitHub repo, dashboard, paper, alert-edge bucket, or strategy-filter survivor looks promising enough to influence the queue.

It is mandatory before:

- moving a source-backed idea from Watch to Candidate;
- adding a new strategy spec from social, repo, blog, or dashboard inspiration;
- expanding custom data capture or backtest machinery for a source claim;
- treating a T2 historical survivor as a serious forward-paper candidate;
- drafting an alert-qualified or paper-qualified proposal for Tomas.

## Falsification Questions

Answer these before more work:

1. What exact claim is the source making?
2. What mechanism would make the claim true after fees, latency, slippage, and Tomas's execution constraints?
3. What market, venue, timeframe, symbol set, and regime does the claim require?
4. What baseline must it beat: random direction, timestamp-matched hold, current alert-edge bucket, RSI/regime bucket, funding/OI bucket, or another simple rule?
5. What would kill the claim cheaply: no independent prior art, inaccessible data, weak sample, weak baseline lift, failed OOS/walk-forward, excessive drawdown, stale labels, impossible fills, or a mechanism mismatch?
6. Is the source an authority, a sales page, a hindsight chart, a code artifact, or a reproducible dataset?
7. Can this workspace verify the source now with public/no-key data, local artifacts, or installed tools?
8. If access is not verified, should the item be Watch / needs-access / proposed instead of active?

## Evidence Classes

Use these classes in notes and candidates:

| Class | Meaning | Allowed Decision |
| --- | --- | --- |
| `source-claim` | A claim exists but is not independently checked. | Watch only. |
| `source-prior-art` | Independent source, repo, paper, or dashboard supports the general mechanism. | Candidate only if data access is verified. |
| `source-reproducible` | Source includes code/data or enough rules to reproduce a test. | Candidate or kill-test input. |
| `source-falsified` | Source claim fails baseline, access, data quality, mechanism, or reproducibility checks. | Rejected or Blocked. |
| `source-unresolved` | Evidence is mixed or underpowered. | Watch / Reassess. |

Do not treat popularity, confident tone, trader PnL screenshots, single-chart examples, or vendor scores as validation.

## Minimum Output

Every source-falsification run should leave a short record with:

- source or upstream evidence;
- claim and mechanism;
- access classification: `verified-public`, `verified-local`, `needs-key`, `needs-account`, `paid`, `blocked`, or `unknown`;
- cheapest kill test;
- baseline;
- explicit falsifier;
- decision: Rejected, Watch, Candidate, Blocked, or Reassess;
- next branch and stop trigger.

## AVAX Watch Implication

`alert-edge-avax-range-breakdown-short-v0` is a useful example. It survived strict historical gates, but exact regime-tagged forward paper support is currently 0 rows for `AVAX|1h|range_breakdown_short|down/low-vol`.

Source-falsification treatment:

- class: `source-unresolved`;
- decision: Watch / forward-paper-needed;
- no paper-qualified, alert-qualified, live-qualified, or strategy-promotion state;
- next test: recheck only after enough exact forward-paper rows exist, or falsify earlier if independent source/prior-art checks contradict the mechanism.

## Verify / Reassess

This guide is a control-plane hardening step, not a strategy result. It adds no live trading capability and changes no alert wording, thresholds, assets, taxonomy, risk, sizing, TP/SL, execution, orders, accounts, keys, paid services, scheduler, cron, systemd, or watcher behavior.

Next useful branch: `validation.ai-research-os-index-lint`, unless the forward-paper threshold for a watch item is reached first.
