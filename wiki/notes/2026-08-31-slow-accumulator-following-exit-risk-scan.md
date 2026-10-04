---
type: note
topic: slow-accumulator-following-exit-risk-scan
created: 2026-08-31T11:38:19Z
last_updated: 2026-08-31T11:38:19Z
work_item: discovery.slow-accumulator-following-exit-risk-scan
status: complete
scope: research-only
sources:
  - ../concepts/smart-money-accumulation-cohort.md
  - ../concepts/forward-paper-trade-gate.md
  - ../comparisons/fast-copy-trading-vs-slow-accumulator-following.md
  - ../comparisons/copyable-wallets-vs-radar-wallets.md
  - 2026-08-31-slow-accumulator-copytrading-source-fit.md
  - 2026-08-31-mid-cap-accumulation-flow-scan.md
  - 2026-08-31-strategy-leg-garden-harvest.md
  - 2026-08-30-wallet-shadowing-forward-paper-trade-spec.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
related:
  - ../concepts/smart-money-accumulation-cohort.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
  - ../../decisions/copytrading-watch-ledger.md
---
# Slow Accumulator Following Exit Risk Scan

## Purpose

This closes `discovery.slow-accumulator-following-exit-risk-scan` as a bounded exit/distribution falsifier.

Question: what must RALPH prove about exits before a slow accumulator cohort is allowed to become a paper candidate?

No scanner, copy target, cohort, alert, threshold, account, key, paid service, risk sizing, TP/SL, execution, scheduler, public posting, or strategy promotion was created.

## Core Finding

For slow accumulator following, late entry is not the primary failure mode. The primary failure mode is joining a real accumulation too late and becoming exit liquidity when the informed cohort distributes.

Therefore an entry-only signal is not useful evidence. RALPH must require round-trip evidence:

- who accumulated;
- what token they accumulated;
- when accumulation began;
- when Tomas could first observe it;
- whether the same cohort reduced, transferred to exchanges, bridged out, or stopped adding;
- whether the exit was visible before or during the public repricing window;
- whether a delayed follower would still keep positive residual PnL after costs and beta.

## Exit-Risk Taxonomy

| Risk | What it looks like | Why it matters |
| --- | --- | --- |
| Distribution into attention | Cohort buys quietly, then sells or transfers out as volume/news/social attention rises | Tomas copies the entry thesis but arrives for the sell-side phase |
| Missing exit rail | Source exposes accumulation but not later reductions, transfers, CEX deposits, or realized exits | RALPH can see entry but cannot know when the trade stopped being valid |
| Vendor-label survivor bias | "Smart money" label is defined by past winners or opaque heuristics | The cohort may be selected after success, not before it |
| One-token / one-narrative PnL | Apparent edge comes from one exceptional token or narrative season | Repeatability is weak; forward test likely mean-reverts |
| Liquidity trap | Mid-cap token can be entered slowly but cannot be exited without impact | Paper PnL overstates realizable capture |
| Beta masquerade | Cohort is just long high-beta alts during a broad market rally | Signal adds little versus a simple beta/momentum basket |
| Internal/LP/noise flow | Transfers, LP moves, treasury movements, or exchange internal flows look like accumulation | False positives trigger bad paper cohorts |

## Minimum Exit Evidence

Before a slow accumulator row can enter a paper cohort, the source must expose enough data to fill:

| Field | Requirement |
| --- | --- |
| `selection_time` | Frozen before outcome scoring |
| `wallet_or_entity` | Address/entity identifier and label/source confidence |
| `token` | Token address/symbol and chain |
| `entry_window` | First observed accumulation window |
| `entry_flow` | Net token and USD accumulation |
| `stablecoin_flow` | Stablecoin-to-alt rotation or funding source where available |
| `exit_window` | First observed distribution/reduction window, or explicit no-exit |
| `exit_flow` | Net token and USD distribution/reduction |
| `cex_or_bridge_flow` | Deposits, bridge-outs, or known off-ramp movement when visible |
| `price_path` | Token price from selection through exit/timeout |
| `liquidity_context` | DEX/CEX volume, spread or impact proxy, and token market-cap class |
| `beta_context` | BTC/ETH/SOL/sector movement over the same window |
| `paper_follower_result` | Delayed-entry, delayed-exit, cost-adjusted result |
| `quality_flags` | Missing exit, one-token concentration, label bias, LP/internal flow, thin liquidity |

If `exit_window` or `exit_flow` is unavailable, the row can be `watch` or `radar-only`, not `paper-candidate`.

## Falsifier Shape

The cheapest valid test is not "find wallets that bought before a pump." It is:

1. Freeze one token/cohort export at selection time.
2. Require at least 20 wallets/entities and 7-14 days of entry and exit/distribution coverage.
3. Score only windows after the frozen selection time.
4. Compare delayed follower results to dumb baselines: no-trade, buy-and-hold token, BTC/ETH/SOL beta, sector basket, and simple momentum.
5. Remove the largest winner and rescore.
6. Reject if exits are not observable, are late, or produce negative delayed follower capture.

This is a paper validation design, not an entry signal.

## Kill Criteria

Kill or downgrade the slow accumulator branch before paper promotion if:

- exits cannot be observed from the same source or a paired approved source;
- more than half the apparent PnL comes from one wallet, token, or event window;
- delayed exit turns profitable cohort behavior into negative follower PnL;
- accumulation flow cannot be separated from exchange, bridge, LP, treasury, or internal movement;
- source labels are opaque and cannot be cross-checked;
- net flow is broad-market beta or simple momentum in disguise;
- token liquidity cannot support entry and exit under conservative public assumptions.

## Decision

`discovery.slow-accumulator-following-exit-risk-scan` is complete.

Verdict: slow accumulator following remains plausible only if exit/distribution measurement is first-class. The branch should not move toward scanner/prototype/paper-cohort work from entry accumulation alone. Missing exits are a veto, not a caveat.

C-029 should remain Candidate, but its next action is now "exit-first frozen paper design or approved export sample," not broader discovery.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, scanner, cohort, or strategy promotion changed.
