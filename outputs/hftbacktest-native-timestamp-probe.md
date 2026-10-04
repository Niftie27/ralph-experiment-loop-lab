# HftBacktest Native Timestamp Probe

Generated: 2026-08-22T07:45:49Z
Status: research-only-no-live-execution.
Source run: `2026-08-22T07-41-21-734Z`

## Verdict: VALIDATED_WITH_SCOPE

A bounded 30s no-key BTC capture confirmed the timestamp split:

- Binance trades have native exchange timestamp evidence.
- Binance `book_ticker` and `depth5` rows do not expose native exchange timestamps in this capture and need fallback `ts`.
- Hyperliquid `trade` and `l2_book` rows have native exchange timestamp evidence.

## Capture

- Raw events: 6,318.
- 1s feature rows: 70.
- Projected hftbacktest-like rows: 12,659.
- Rows without native exchange timestamp evidence: 10,014.

## Timestamp Evidence

| Key | Rows | Native exchange ts | Fallback exchange ts |
| --- | ---: | ---: | ---: |
| binance:depth:BTCUSDT | 2,090 | 0 | 2,090 |
| binance:top_of_book:BTCUSDT | 7,924 | 0 | 7,924 |
| binance:trade:BTCUSDT | 1,952 | 1,952 | 0 |
| hyperliquid:depth:BTC | 560 | 560 | 0 |
| hyperliquid:trade:BTC | 133 | 133 | 0 |

## Hyperliquid Replay Smoke

- Selected Hyperliquid BTC events: 195.
- Replay rows after order correction: 666.
- Missing exchange timestamp events: 0.
- Missing local receive timestamp events: 0.
- Minimum feed latency: 316,000,000 ns.
- No-trade baseline: 0 trades, flat state.
- Passive fixed-spread quote: 2 simulated fills under frozen zero-fee, zero-latency assumptions.

Interpretation: for latency-sensitive hftbacktest replay, Hyperliquid trade/`l2_book` rows are the cleaner no-key path than Binance bookTicker/depth rows in this capture. The passive quote result remains a runtime smoke test, not edge evidence.

Verification:

```bash
ORDERFLOW_SPIKE_DURATION_MS=30000 ORDERFLOW_SPIKE_SYMBOLS=BTC node crypto-updates/orderflow-spike.mjs
ORDERFLOW_RUN_ID=2026-08-22T07-41-21-734Z node ralph-research-os/automation/hftbacktest-orderflow-replay-feasibility.mjs
ORDERFLOW_RUN_ID=2026-08-22T07-41-21-734Z node crypto-updates/orderflow-features.mjs
ORDERFLOW_RUN_ID=2026-08-22T07-41-21-734Z ORDERFLOW_SOURCE=hyperliquid ORDERFLOW_SYMBOL=BTC .tmp/openclaw-spikes/hftbacktest-minimal-replay-runtime/uv-venv/bin/python ralph-research-os/automation/hftbacktest-minimal-replay-runtime-spike.py
.tmp/openclaw-spikes/hftbacktest-minimal-replay-runtime/uv-venv/bin/python -m unittest ralph-research-os/automation/hftbacktest_minimal_replay_fixture_tests.py
```
