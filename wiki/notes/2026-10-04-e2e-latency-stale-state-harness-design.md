---
title: E2E Latency and Stale State Harness Design
date: 2026-10-04
status: design
tags:
  - ralph
  - latency
  - stale-state
  - dex-discrepancy
  - measurement
---

# E2E Latency and Stale State Harness Design

Scope: backlog item 6 from [[2026-10-04-volume-velocity-dex-discrepancy-repo-intake]]. Design the measurement harness that replaces Zela's role: prove whether accessible infrastructure can observe, quote, compute, simulate/read, and still see the discrepancy before it decays.

Depends on:

- [[2026-10-04-zela-replacement-infra-access-map]]
- [[2026-10-04-pair-first-overlap-map-dex-discrepancy]]
- [[2026-10-04-full-cost-model-spec-dex-discrepancy]]

This is a design note only. Do not implement until Tomas approves the next work branch.

## Core Question

For a candidate pair/venue/notional, is the route still `post_cost_positive` after the time RALPH actually needs to:

1. detect or poll a trigger;
2. fetch fresh block/price state;
3. quote venue A;
4. quote venue B;
5. compute full costs;
6. optionally simulate/read a route;
7. re-quote after delay buckets;
8. decide kill/extend.

If the answer is no under public/no-key infra, do not buy infra yet. First classify whether the failure is opportunity absence, stale data, provider latency, quoter errors, or cost model.

## Harness Modes

| Mode | Purpose | Runs now? |
|---|---|---:|
| `poll_baseline` | Sample candidate pair/venue/notional on a fixed cadence and record quote latency, block lag, and costed route. | yes, after approval |
| `block_triggered` | Run one quote cycle whenever a new block/header is observed from WS or HTTP polling. | yes, after approval |
| `factor_triggered` | Run quote cycles around BTC/ETH/leader impulse windows from public CEX/perp WebSockets. | later |
| `delay_requote` | Re-quote the same route after 0.5s, 1s, 2s, 5s, next block, and next 2 blocks. | yes, after approval |
| `archive_backtest_pairing` | Compare historical persistence to live measured delay buckets. | later, depends on archive access |

## Minimal Active Target

First harness target should be:

- Chain: Avalanche.
- Pair family: `WAVAX/USDC`.
- Venues: start with 2-3 only:
  - Pharaoh V3 or DLMM if quoter path is identified;
  - Uniswap V3;
  - Trader Joe LB/V2.2 or Blackhole V3 if quoter path is identified.
- Notionals: `$100`, `$300`, `$1000`.
- RPCs:
  - official Avalanche HTTP;
  - PublicNode Avalanche HTTP;
  - PublicNode Avalanche WS;
  - official Avalanche WS only if subscription methods work for needed block timing.

Fallback first target if Pharaoh/Blackhole quoter mapping is too slow:

- Use known/repo-compatible quoter types first: Uniswap V3 and Trader Joe LB on Avalanche, then add Pharaoh/Blackhole as adapters later.

## Timing Fields

Each cycle must emit:

- `cycle_id`
- `trigger_type`
- `trigger_ts_ms`
- `provider_id`
- `chain`
- `pair`
- `notional_usd`
- `block_before_quote`
- `block_after_quote`
- `block_timestamp`
- `local_block_receive_ts_ms`
- `block_lag_ms`
- `quote_a_start_ms`
- `quote_a_end_ms`
- `quote_a_latency_ms`
- `quote_b_start_ms`
- `quote_b_end_ms`
- `quote_b_latency_ms`
- `compute_start_ms`
- `compute_end_ms`
- `compute_latency_ms`
- `cycle_end_ms`
- `cycle_latency_ms`
- `delay_bucket`
- `requoted_net_after_costs_usd`
- `spread_decay_usd`
- `spread_decay_pct`

Store raw millisecond timestamps, not only formatted dates.

## Provider Comparison

The harness must compare providers side-by-side without assuming one is better.

For each provider:

- p50/p95/p99 `eth_blockNumber` latency;
- p50/p95/p99 quote latency per venue;
- block lag in milliseconds and blocks;
- error rate by method;
- stale-state rate, defined as quote responses using an older block than the current provider head;
- disagreement between providers for the same route and near-same timestamp.

Do not use average latency as the primary metric. Tail latency matters because short-lived spreads die in the tail.

## Delay Buckets

Delay buckets:

- `0s`: immediate route quote.
- `0.5s`: re-quote after 500ms.
- `1s`
- `2s`
- `5s`
- `next_block`
- `next_2_blocks`

For each delay bucket:

- re-run both venue quotes;
- re-run full-cost model;
- log whether the original positive survives;
- log whether the best direction flips;
- log whether one venue/pool errors or returns stale state.

The key output is not "a spread existed." The key output is **how quickly it decayed relative to RALPH's actual access path**.

## Data Quality Gates

Kill or quarantine a sample if:

- pool reserve is zero, null, or inconsistent with quote output;
- one route leg returns a quoter error while the opposite leg succeeds in a suspicious way;
- provider heads disagree by more than 2 blocks on short-window tests;
- price output implies absurd profit above a configured sanity band;
- DEX metadata comes only from indexer data and no on-chain pool/quoter can be mapped;
- factor timestamp is stale or missing for factor-triggered mode.

## Metrics Summary

Per pair/venue/notional/provider:

- `samples`
- `quote_success_rate`
- `quote_error_rate`
- `p50_quote_latency_ms`
- `p95_quote_latency_ms`
- `p99_quote_latency_ms`
- `p50_cycle_latency_ms`
- `p95_cycle_latency_ms`
- `p99_cycle_latency_ms`
- `median_block_lag_ms`
- `p95_block_lag_ms`
- `post_cost_positive_count`
- `post_cost_positive_rate`
- `survived_0_5s_count`
- `survived_1s_count`
- `survived_2s_count`
- `survived_5s_count`
- `survived_next_block_count`
- `median_spread_decay_pct`
- `p95_spread_decay_pct`
- `kill_reason_distribution`

## BTC / Factor Context

Even in `poll_baseline`, include a factor context stub:

- `btc_gate`
- `btc_gate_reason`
- `btc_last_price`
- `btc_trigger_window`
- `eth_major_state`
- `leader_asset`
- `factor_class`

For the first non-factor run, `factor_class = none` is acceptable. The schema must still include the fields so later factor-triggered runs are comparable.

## Stop Conditions

Stop a pair/venue/notional branch if:

- no `post_cost_positive` samples after an agreed minimum sample count;
- all positives die by the 0.5s or 1s delay bucket;
- quote error rate is too high to measure;
- public RPC block lag makes state stale relative to the decay window;
- the route requires paid/keyed infrastructure before any no-key evidence exists.

Extend a branch only if:

- repeated `post_cost_positive` samples occur;
- at least some survive 1s or next-block re-quote;
- data-quality flags are not the source of positives;
- costs remain positive under conservative proxies from [[2026-10-04-full-cost-model-spec-dex-discrepancy]].

## Output Files When Implemented Later

Suggested future output shape:

- raw JSONL: `experiments/volume-velocity-dex-discrepancy/results/e2e-latency-samples.jsonl`
- summary JSON: `experiments/volume-velocity-dex-discrepancy/results/e2e-latency-summary.json`
- summary Markdown: `experiments/volume-velocity-dex-discrepancy/results/e2e-latency-summary.md`

Implementation must be read-only. No private keys, no tx signing, no execution, no bundle submission.

## Backlog Implication

Backlog item 6 is designed enough to move to item 7, **Backtest persistence versus live execution timing**. That item should specify how historical block-level persistence will be paired with the live latency buckets above.
