---
title: Backtest Persistence vs Live Timing Spec
date: 2026-10-04
status: spec
tags:
  - ralph
  - backtest
  - latency
  - stale-state
  - dex-discrepancy
---

# Backtest Persistence vs Live Timing Spec

Scope: backlog item 7 from [[2026-10-04-volume-velocity-dex-discrepancy-repo-intake]]. Separate historical opportunity persistence from live observability/execution timing.

Depends on:

- [[2026-10-04-full-cost-model-spec-dex-discrepancy]]
- [[2026-10-04-e2e-latency-stale-state-harness-design]]

## Core Distinction

Backtest can answer:

- Did a block-level or sampled executable discrepancy exist historically?
- How often did it persist for 1 block, 2 blocks, N blocks, or sampled delay windows?
- Would it survive approximate full costs under conservative assumptions?
- Which pairs/venues/notionals are worth live latency measurement?

Backtest cannot answer by itself:

- Would RALPH have observed the event in time?
- Would public/no-key RPC have served fresh state?
- Would quote A and quote B complete before the discrepancy decayed?
- Would a simulation/fork call succeed quickly enough?
- Would a transaction land before the opportunity disappeared?

Therefore backtest persistence is only a **persistence prior**. It must be paired with live measured delay buckets.

## Required Historical Outputs

For each pair/venue/notional:

- `historical_window_start`
- `historical_window_end`
- `sample_interval_blocks`
- `archive_provider`
- `pair`
- `buy_venue`
- `sell_venue`
- `notional_usd`
- `block_number`
- `block_timestamp`
- `gross_spread_pct`
- `executable_quote_positive`
- `post_cost_positive`
- `persistence_blocks`
- `persistence_seconds_est`
- `max_positive_run_blocks`
- `median_positive_run_blocks`
- `p95_positive_run_blocks`
- `event_cluster_id`
- `cost_model_version`
- `data_quality_flags`

Historical records must use the same cost labels as [[2026-10-04-full-cost-model-spec-dex-discrepancy]].

## Pair With Live Delay Buckets

Take historical positive runs and test them against live measured delay distributions from [[2026-10-04-e2e-latency-stale-state-harness-design]]:

- `0.5s`
- `1s`
- `2s`
- `5s`
- `next_block`
- `next_2_blocks`

For each historical run:

```text
historical_survival_after_delay =
  positive_run_duration >= live_delay_bucket
```

But this is still only a proxy. It should be reported as:

- `would_survive_measured_read_delay`
- `would_survive_measured_quote_cycle_delay`
- `would_survive_measured_requote_delay`
- `would_survive_hypothetical_submit_delay`

Do not collapse these into one yes/no.

## Timing Join Table

The combined report should join:

| Historical field | Live field | Meaning |
|---|---|---|
| `positive_run_seconds` | `p50_cycle_latency_ms` | Median access path likely fast enough? |
| `positive_run_seconds` | `p95_cycle_latency_ms` | Tail latency likely kills it? |
| `positive_run_blocks` | `next_block_survival_rate` | Does block persistence match live block timing? |
| `historical_spread_decay_pct` | `live_spread_decay_pct` | Does live decay behave like history? |
| `historical_provider` | `live_provider_id` | Are archive/backtest and live reads comparable? |

## Backtest Resolution Rules

Resolution levels:

1. `coarse_sampled`: every N blocks or minutes. Good for eliminating dead pairs, not for execution-grade claims.
2. `block_boundary`: quote or reconstruct at every block. Minimum useful historical persistence resolution.
3. `event_window`: quote around known swap/leader/factor events. Better for factor-triggered lane.
4. `sub_block`: not available from ordinary archive RPC; do not pretend it exists unless using specialized mempool/orderflow data.

Do not claim second-level survival from five-minute or 150-block samples.

## Archive Access Requirements

Historical backtest needs one of:

- public archive-capable RPC that supports needed `eth_call`/state at old blocks;
- paid/keyed archive RPC with approval;
- indexed pool state from subgraphs/DefiLlama/GeckoTerminal-like sources for coarse discovery only;
- prebuilt local archive dataset, if ever available.

Current access map shows:

- Avalanche official public endpoint passed a simple 1M-block historical state probe.
- Base official public endpoint passed a simple 1M-block historical state probe.
- Mantle official public endpoint passed a simple 1M-block historical state probe.
- PublicNode current endpoints worked, but archive state often required token or failed.

These probes are not enough to assume complex historical quoter calls will work. The backtest must verify the exact contract calls it needs.

## Kill / Promote Use

Historical backtest can kill a pair if:

- no post-cost positive runs appear at block-boundary resolution;
- positives only exist in coarse mid-price data and vanish with executable quotes;
- positives last shorter than even p50 live quote-cycle latency;
- archive calls are too incomplete to reconstruct the route.

Historical backtest can promote to live measurement if:

- post-cost positives recur at block-boundary or event-window resolution;
- positive runs survive at least p95 public quote-cycle latency in a meaningful fraction of cases;
- positives are not isolated to one data-quality anomaly;
- route calls are reproducible on live public endpoints.

Historical backtest cannot promote to execution. It can only justify the next live measurement branch.

## Recommended Order

1. Run live e2e latency baseline first on Avalanche `WAVAX/USDC` to get actual public provider delay distributions.
2. Then run a narrow historical block-boundary backtest on the same pair/venues/notionals.
3. Join the historical persistence runs against measured live delay buckets.
4. Only if both survive, add factor-triggered event windows.

Reason: without live delay distributions, the historical backtest has no grounded answer to Tomas's actual timing question.

## Backlog Implication

Backlog item 7 is specified enough to gate item 8, **Executable-spread kill test**. Item 8 should not run until the e2e harness and historical/live timing join are either implemented or explicitly scoped down by Tomas.
