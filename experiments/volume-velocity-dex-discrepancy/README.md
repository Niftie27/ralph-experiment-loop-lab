# Volume Velocity DEX Discrepancy

Status: research-only measurement experiment. No live trading, private keys, tx signing, bundle submission, paid infra, scheduler change, or execution path.

Purpose: measure whether accessible public/no-key infrastructure can observe and re-quote same-chain DEX discrepancies quickly enough to justify deeper research.

Current first target:

- Chain: Avalanche C-Chain.
- Pair: `WAVAX/USDC`.
- Venues: Uniswap V3 and Trader Joe Liquidity Book.
- Providers: official public Avalanche HTTP and PublicNode HTTP.
- Notionals: `$100`, `$300`, `$1000`.

Run:

```bash
npm run baseline:avax
npm run verify
```

The baseline emits:

- `results/e2e-latency-samples.jsonl`
- `results/e2e-latency-summary.json`
- `results/e2e-latency-summary.md`

Positive labels are conservative and research-only. A gross quote spread is never a viable strategy claim; every sample is scored against the v0 proxy cost stack from [[2026-10-04-full-cost-model-spec-dex-discrepancy]] and re-quote delay buckets from [[2026-10-04-e2e-latency-stale-state-harness-design]].
