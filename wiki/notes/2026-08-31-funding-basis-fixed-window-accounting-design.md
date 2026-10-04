---
type: note
topic: funding-basis-fixed-window-accounting-design
created: 2026-08-31T06:44:00Z
last_updated: 2026-08-31T06:50:00Z
work_item: validation.funding-basis-fixed-window-accounting-design
status: complete
scope: research-only
sources:
  - 2026-08-31-funding-basis-baseline-monitor.md
  - 2026-08-31-funding-basis-public-snapshot-table.md
  - ../../outputs/funding-basis-public-snapshot-table.md
  - ../concepts/funding-basis-structural-baseline.md
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - funding
related:
  - ../../automation/funding-basis-public-snapshot-table.mjs
  - ../../outputs/funding-basis-public-snapshot-table.json
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Funding/Basis Fixed-Window Accounting Design

## Purpose

This closes `validation.funding-basis-fixed-window-accounting-design` as a research-only design.

Question: after RALPH can collect public funding/basis snapshots, what exact paper-accounting shape would decide whether the baseline deserves more work?

No live trading, copying, orders, alerts, thresholds, execution, risk sizing, leverage, TP/SL, accounts, keys, paid services, scheduler changes, or strategy promotion changed.

## Fixed Window

The unit of evidence is a frozen observation window, not a single attractive funding print.

Minimum window record:

| Field | Meaning |
| --- | --- |
| `window_id` | deterministic ID from venue, coin, start, end |
| `venue` | public data venue |
| `coin` | perp market |
| `started_at` / `ended_at` | fixed before interpretation |
| `snapshot_count` | number of public snapshots included |
| `funding_row_count` | number of funding-history rows included |
| `selection_reason` | why the coin entered the window, recorded before scoring |
| `exclusions` | missing data, stale data, thin liquidity, mark/oracle caveats |

Do not compare windows selected after seeing outcomes against windows selected before outcomes.

## Accounting Rows

Each coin-window should produce one row:

| Group | Fields |
| --- | --- |
| Gross carry | sum funding, average funding, funding sign share, funding flip count |
| Liquidity | average daily notional, average OI, impact-width notes |
| Basis/tail | mark/oracle spread notes, premium path, stress flags |
| Cost class | conservative rebalance cost class, hedge friction class, borrow/yield proxy note |
| Baseline | stable/yield context, no-trade, spot-only, equal-weight top-liquid observation |
| Verdict | `reject`, `watch`, or `needs-longer-paper-window` |

The row should explain why the verdict follows from the evidence. It should not output a trade.

## Cost Classes

Use qualitative cost classes until venue/account mechanics are explicitly approved:

| Class | Meaning |
| --- | --- |
| `unmodeled` | cannot compare economics yet |
| `low-friction-proxy` | large/liquid market, narrow public impact width, stable mark/oracle behavior |
| `medium-friction-proxy` | usable market but repeated flips or wider public impact width |
| `high-friction-proxy` | tail or liquidity caveats dominate the gross carry print |
| `blocked-account-mechanics` | would require real venue account/margin/borrow information |

Any row that needs actual liquidation, margin, borrow, or order-book execution assumptions becomes `blocked-account-mechanics`, not promoted.

## Decision Rules

For the current no-key phase:

- `reject`: public snapshots are unreliable, missing, dominated by flips, or gross carry is not meaningfully distinguishable from dumb baselines under conservative qualitative costs.
- `watch`: public data is stable enough to keep observing, but cost/tail evidence is still too weak for paper qualification.
- `needs-longer-paper-window`: repeated windows show stable public data and clear accounting assumptions, but more time is needed before any demo/testnet/HITL discussion.

These are research states. They are not live alert labels.

## Required Comparisons

Each fixed-window report must compare against:

- stable/yield context from public DefiLlama data;
- no-trade;
- spot-only mark-price path;
- equal-weight top-liquid perp market observation;
- the prior window for the same coin, if one exists.

If RALPH cannot compute a comparison with public data, the row must say so directly.

## Tail-Risk Flags

Record these as veto-style caveats:

- funding sign flips;
- mark/oracle divergence;
- impact-width or liquidity caveat;
- basis or premium stress;
- stable/yield baseline deterioration;
- apparent opportunity concentrated in thin or unstable coins;
- account mechanics required for the result to look good.

## Implementation Update

Implemented immediately after this design:

- `automation/funding-basis-public-snapshot-table.mjs` now reads the previous local JSON output before overwriting it.
- `outputs/funding-basis-public-snapshot-table.md` now includes a `Previous-Run Comparison` section when a prior output exists.
- The comparison reports rank change, current funding annualized delta, average funding annualized delta, daily notional delta, and diagnostic-state change for matching coins.

This supports manual repeated runs only. It is not a scheduler, live monitor, alert, threshold, account setup, sizing model, or execution system.

## Next Safe Step

The next safe step is to stop or rerun the collector manually after real elapsed time, then inspect whether the comparison rows are stable enough to justify a longer paper-accounting window.

A scheduler, live monitor, alert, account, demo/testnet setup, threshold, sizing rule, or execution behavior requires separate explicit HITL.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
