# HftBacktest Orderflow Replay Feasibility

Generated: 2026-08-22T10:43:38.235Z
Status: research-only-no-live-execution.
Source run: `2026-08-22T08-39-ralph-hl-btc-2h`

## Verdict

Partial fit: capture-v2 stores separate local receive timestamps, but some projected rows still lack native exchange timestamp evidence and must use a fallback timestamp. Replay is usable for runtime smoke tests, not latency-sensitive edge claims.

Do not treat this as edge evidence yet. Separate local receive timestamps are available, but exchange-time evidence still needs per-source scrutiny before latency-sensitive replay claims.

## HftBacktest Contract

HftBacktest expects normalized events with `ev`, `exch_ts`, `local_ts`, `px`, `qty`, `order_id`, `ival`, and `fval`; its docs also call out chronological ordering and positive feed latency checks.

Source: https://hftbacktest.readthedocs.io/en/latest/data.html

## Local Access

- `python3` is available.
- `hftbacktest` is not installed in the current interpreter.
- `python3 -m pip` is not available here, so package installation was not attempted.
- This pass stayed as schema/replay feasibility only.

## Raw Capture Coverage

- Raw events: 855975
- Projected hftbacktest-like rows: 1885667
- Trade rows: 263961
- Depth rows: 550670
- Top-of-book rows: 1071036
- Rows missing separate local receive timestamp: 0
- Rows without native exchange timestamp evidence: 1488666

## Source/Type Counts

| Key | Count |
| --- | ---: |
| binance:book_ticker:BTCUSDT | 535518 |
| binance:depth5:BTCUSDT | 41763 |
| binance:trade:BTCUSDT | 221304 |
| hyperliquid:l2_book:BTC | 13304 |
| hyperliquid:mid:BTC | 1429 |
| hyperliquid:trade:BTC | 42657 |

## Timestamp Evidence By Projected Row Kind

| Key | Rows | Native exchange ts | Fallback exchange ts | Separate local ts |
| --- | ---: | ---: | ---: | ---: |
| binance:depth:BTCUSDT | 417630 | 0 | 417630 | 417630 |
| binance:top_of_book:BTCUSDT | 1071036 | 0 | 1071036 | 1071036 |
| binance:trade:BTCUSDT | 221304 | 221304 | 0 | 221304 |
| hyperliquid:depth:BTC | 133040 | 133040 | 0 | 133040 |
| hyperliquid:trade:BTC | 42657 | 42657 | 0 | 42657 |

## Interpretation

- Capture-v2 records separate exchange and local receive timestamps for projected rows in this test capture.
- Some rows still lack native exchange timestamp evidence and would need an explicit conservative timestamp policy.
- This is enough for package/runtime smoke tests, but not enough for latency-sensitive replay or edge claims.
- Existing L1 feature CSVs are useful for alert classification, but hftbacktest replay needs event-level depth/trade rows and a frozen latency/fee model.

## Next Test

Next: timestamp evidence gate before longer replay:

- report native timestamp coverage by source/type;
- distinguish measured exchange time from local receive and fallback timestamps;
- keep fallback-timestamp rows out of latency-sensitive edge metrics;
- only then run a longer bounded no-key capture.

## Candidate Impact

- C-036 stays benchmark-qualified, but the immediate blocker is capture schema quality, not strategy logic.
- `orderflow-capture-v2-schema` is only partially complete for latency-sensitive replay; the new blocker is timestamp evidence by source/type.
- No live trading, keys, paid APIs, watcher thresholds, alert wording, risk, sizing, or execution changed.
