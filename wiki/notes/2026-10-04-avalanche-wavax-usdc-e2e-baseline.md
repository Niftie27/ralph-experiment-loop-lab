---
title: Avalanche WAVAX USDC E2E Baseline
date: 2026-10-04
status: baseline
tags:
  - ralph
  - dex-discrepancy
  - avalanche
  - latency
  - executable-quotes
---

# Avalanche WAVAX USDC E2E Baseline

Scope: first read-only implementation pass after [[2026-10-04-e2e-latency-stale-state-harness-design]] and [[2026-10-04-backtest-persistence-vs-live-timing-spec]]. This is not execution research and not a strategy promotion.

Experiment path: `experiments/volume-velocity-dex-discrepancy`

Outputs:

- `experiments/volume-velocity-dex-discrepancy/results/e2e-latency-samples.jsonl`
- `experiments/volume-velocity-dex-discrepancy/results/e2e-latency-summary.json`
- `experiments/volume-velocity-dex-discrepancy/results/e2e-latency-summary.md`

## Boundary

No live trading, private keys, wallet access, tx signing, bundle submission, paid infra, scheduler change, alert wording change, risk/sizing/TP/SL change, or execution path was added.

The run used public/no-key reads only:

- Avalanche official HTTP RPC.
- Avalanche PublicNode HTTP RPC.
- Uniswap V3 QuoterV2 static calls.
- Trader Joe LB V2.2 quoter static/view calls.
- Binance public REST only for BTC/ETH factor context labels.

## Implementation Notes

The old intake config used the wrong Avalanche Uniswap V3 QuoterV2 address. On-chain code check returned empty bytecode for `0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8` on Avalanche, so early samples were all quote errors.

The baseline was corrected to use the official Avalanche Uniswap V3 `QuoterV2` address `0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F`, matching Uniswap's Avalanche deployment docs.

This is an important repo-intake lesson: old chain configs can look structurally reusable while containing stale cross-chain deployment addresses. Future harnesses must verify bytecode at every quoter/router/pool address before interpreting quote failures as market evidence.

Source: `https://developers.uniswap.org/docs/protocols/v3/deployments/v3-avalanche-deployments`

## Baseline Result

Command:

```bash
npm run baseline:avax --prefix ralph-research-os/experiments/volume-velocity-dex-discrepancy
npm run verify --prefix ralph-research-os/experiments/volume-velocity-dex-discrepancy
```

Verification passed.

Summary:

- Samples: `72`.
- Quote errors after address correction: `0`.
- Providers: Avalanche official HTTP and Avalanche PublicNode HTTP.
- Routes: Uniswap V3 0.05% -> Trader Joe LB V2.2 and Trader Joe LB V2.2 -> Uniswap V3 0.05%.
- Notionals: `$100`, `$300`, `$1000`.
- Delay buckets: immediate, `500ms`, `1000ms`.
- BTC gate at run time: `BTC_TRANSITION`.
- ETH/major state: `ETH_MIXED`.
- Post-cost positives: `0`.
- Latency-survived positives: `0`.
- Verdict: `no_positive_after_v0_costs_in_tiny_baseline`.

Best observed v0 net-after-cost values by route/notional were still negative:

- `$100`: best about `-$0.286` to `-$0.386` depending on provider/route.
- `$300`: best about `-$0.722` to `-$1.068`.
- `$1000`: best about `-$2.359` to `-$3.266`.

Cycle p50/p95 latency was roughly `378-401ms` p50 and `397-684ms` p95 across route/provider/notional groups. Median block lag was roughly `2.2-5.1s`, with a few stale/head-move flags.

## Interpretation

This tiny baseline does **not** prove Avalanche `WAVAX/USDC` is dead. It only says the first no-key public-RPC measurement on the easiest repo-compatible venue pair found no post-cost-positive route.

It does prove the harness can now collect successful executable quote samples with BTC/factor context, per-provider timing, delay buckets, v0 cost fields, kill reasons, and data-quality flags.

Do not promote. The result blocks any execution-research label and supports only careful continuation or pivot.

## Next Branch Options

1. **Longer no-key Avalanche run**
   - Same route, more cycles, more block windows.
   - Goal: confirm whether the initial negative result is stable.
   - Still read-only.

2. **Add venue adapters**
   - Map Pharaoh V3/DLMM or Blackhole if quoter paths are verifiable.
   - Reason: pair-first overlap said the strongest `WAVAX/USDC` volume is not only Uniswap/TJ.
   - Must verify bytecode and quote calls before sampling.

3. **Historical block-boundary backtest**
   - Only after exact live route calls are stable.
   - Goal: compare historical persistence with measured live delay buckets.

4. **Move to second pair**
   - `WETH.e/WAVAX` or `BTC.b/WAVAX`.
   - Use only if current pair remains uninteresting after a slightly longer no-key run or if better venue adapters are not worth mapping.

## Backlog Implication

Backlog item 8 should remain **not promoted**. The first tiny executable-quote baseline produced a clean negative under v0 proxy costs. The next useful work is either a longer no-key run or mapping the missing higher-volume Avalanche venue adapters, not execution.
