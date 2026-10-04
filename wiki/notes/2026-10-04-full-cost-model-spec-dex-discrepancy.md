---
title: Full Cost Model Spec for DEX Discrepancy
date: 2026-10-04
status: spec
tags:
  - ralph
  - cost-model
  - dex-discrepancy
  - arbitrage
  - latency
---

# Full Cost Model Spec for DEX Discrepancy

Scope: backlog item 5 from [[2026-10-04-volume-velocity-dex-discrepancy-repo-intake]]. Define the cost stack before any result can be called positive.

This is a measurement spec, not execution approval.

## Core Rule

RALPH must never call a DEX discrepancy profitable from gross price spread alone.

A sample is only `post_cost_positive` if the measured route remains positive after:

- DEX swap fees;
- price impact/slippage;
- gas/base fee;
- priority tip / bribe / bundle proxy;
- flashloan fee if modeled;
- simulation/revert/failure budget;
- stale quote/state drift;
- MEV/searcher competition haircut;
- infra hurdle when converting repeated samples into strategy economics.

## Output Classifications

| Label | Meaning | Allowed use |
|---|---|---|
| `gross_spread_only` | Mid-price or quote-to-quote discrepancy before full route costs. | Discovery/debug only. Never viability. |
| `executable_quote_positive` | Round-trip static/quoter output is positive after DEX fee and price impact embedded in the quote, but before all external costs. | Candidate observation only. |
| `post_cost_positive` | Positive after full estimated cost stack and stale-drift haircut. | Minimum label for extending measurement. |
| `latency_survived` | Still positive after delay bucket re-quote, e.g. 0.5s/1s/2s/5s/next block. | Required before promote. |
| `execution_research_candidate` | Repeated post-cost positives with latency survival and no obvious data-quality issue. | Research only; still no keys/execution. |
| `killed` | Fails after full costs, stale drift, or public infra latency. | Stop/pivot for that pair/venue/notional. |

## Per-Sample Required Fields

Identity:

- `sample_id`
- `ts_local_start_ms`
- `ts_local_end_ms`
- `chain`
- `chain_id`
- `provider_id`
- `rpc_url_class` (`official_public`, `publicnode`, `paid_keyed`, `local_fork`, etc.)
- `block_number_start`
- `block_number_end`
- `block_timestamp`
- `block_lag_ms`

Factor context:

- `btc_gate` (`BTC_RISK_ON`, `BTC_RISK_OFF`, `BTC_TRANSITION`, `BTC_STALE`)
- `btc_gate_reason`
- `eth_major_state`
- `leader_asset`
- `leader_impulse_window`
- `follower_token`
- `factor_class` (`global_beta`, `ecosystem_leader`, `sector_leader`, `token_local`, `none`)

Route:

- `pair`
- `notional_usd`
- `token_in`
- `token_mid`
- `token_out`
- `buy_venue`
- `sell_venue`
- `buy_pool`
- `sell_pool`
- `buy_amm_type`
- `sell_amm_type`
- `route_direction`

Quote timing:

- `quote_a_start_ms`
- `quote_a_end_ms`
- `quote_a_latency_ms`
- `quote_b_start_ms`
- `quote_b_end_ms`
- `quote_b_latency_ms`
- `roundtrip_latency_ms`
- `quote_error_class`

Economic fields:

- `amount_in`
- `amount_mid`
- `amount_out`
- `gross_output_usd`
- `gross_profit_usd`
- `gross_spread_pct`
- `quote_embedded_dex_fee_usd`
- `quote_embedded_price_impact_usd`
- `gas_units_est`
- `base_fee_gwei`
- `priority_tip_gwei`
- `l1_data_fee_usd` for L2s when applicable
- `gas_cost_usd`
- `priority_or_bribe_cost_usd`
- `flashloan_fee_usd`
- `simulation_failure_budget_usd`
- `revert_failure_budget_usd`
- `stale_state_drift_usd`
- `mev_competition_haircut_usd`
- `infra_hurdle_allocated_usd`
- `net_after_costs_usd`
- `net_after_costs_pct`
- `cost_model_version`

Delay survival:

- `delay_bucket`
- `requoted_amount_out`
- `requoted_net_after_costs_usd`
- `spread_decay_usd`
- `spread_decay_pct`
- `survived_delay`

Verdict:

- `sample_label`
- `kill_reason`
- `data_quality_flags`

## Cost Calculation

Use:

```text
net_after_costs_usd =
  gross_output_usd
  - notional_usd
  - gas_cost_usd
  - priority_or_bribe_cost_usd
  - flashloan_fee_usd
  - simulation_failure_budget_usd
  - revert_failure_budget_usd
  - stale_state_drift_usd
  - mev_competition_haircut_usd
  - infra_hurdle_allocated_usd
```

Important nuance:

- Quoter/static-call output already embeds swap fee and price impact for that quoted route. Log those as explicit fields where the quoter exposes them, but do not double-subtract if already embedded in `amount_out`.
- Mid-price spreads do not embed executable price impact. They are never enough.
- Gas must not stay fixed forever. For early triage, a chain-specific conservative proxy is acceptable, but it must be versioned and later replaced by actual gas estimate / transaction simulation.
- Priority/bribe/bundle cost can start as a proxy bucket, but must be nonzero for any execution-grade conclusion.
- Failure budgets should be expected-value costs, not only observed failures:

```text
failure_budget_usd =
  estimated_failure_probability * estimated_loss_if_failure
```

## Default Conservative Proxies For Early Read-Only Tests

These are only starting assumptions for a read-only kill test. They should be stored as `cost_model_version = v0_proxy`.

| Cost | v0 proxy |
|---|---|
| Gas/base fee | Use chain-specific latest fee data when available; otherwise conservative fixed USD placeholder from measured tx class. |
| Priority/bribe | Start at `max(0.5 * gas_cost_usd, $0.05)` for L2/lower-cost chains; increase if chain/venue is competitive. |
| Flashloan fee | `0` only if route is explicitly modeled without flashloan; otherwise use provider-specific fee or pessimistic placeholder. |
| Simulation failure budget | Start `0.02%` of notional for read-only scoring until measured. |
| Revert/failure budget | Start `0.03%` of notional for read-only scoring until measured. |
| Stale drift | Minimum of observed delay-bucket decay and `0.05%` of notional for volatile pairs; lower only after data proves it. |
| MEV/searcher haircut | `0.05%-0.15%` of notional depending on chain/venue competitiveness; Base/control pairs should use the high end. |
| Infra hurdle | `0` for single-sample viability; apply monthly hurdle only in strategy economics summaries. |

## Promote / Kill Rules

Kill immediately if:

- `net_after_costs_usd <= 0` for all sampled venues/notionals;
- positive observations vanish in the 0.5s or 1s delay bucket;
- quote errors or stale blocks make the route non-measurable;
- the only positives come from suspicious pool data, zero/near-zero reserve artifacts, or known indexer anomalies.

Extend only if:

- at least one pair/venue/notional has repeated `post_cost_positive` samples;
- at least some positives survive next quote or next block delay;
- block lag and quote latency are measured;
- BTC/factor context is attached, even if the factor state is `none`.

Promote to execution research candidate only if:

- positives repeat across multiple events or time windows;
- median and p95 latency are inside the measured survival window;
- the full cost stack remains positive with conservative proxies;
- no private key or execution path is required for the next measurement step.

## Budget Hurdle

Monthly infra cost must be converted into per-trade or per-event hurdle before any strategy claim:

```text
infra_hurdle_per_trade = monthly_infra_cost / expected_trades_per_month
```

Examples:

- `$300/month` and 10 trades/month means `>$30/trade` just to pay infra.
- `$300/month` and 30 trades/month means `>$10/trade`.
- `$50/month` and 10 trades/month means `>$5/trade`.

Rare factor-triggered systems must clear the infra hurdle precisely because they trade less often.

## Backlog Implication

Backlog item 5 is complete enough to move to item 6, **E2E latency and stale-state harness**. The harness should measure whether public/no-key reads and quotes are fresh enough before any 24h executable-spread kill test runs.
