# Planned-Level Archive Orderflow Sample

Generated: 2026-09-28T13:41:49.620Z

Research-only archive-backed sample aligning Binance spot daily aggTrades to frozen planned-level windows. It does not change live alerts, watcher gates, paper logic, schedulers, risk, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy status.

## Decision

- Verdict: archive_features_sample_ready_no_promotion
- Reason: Archive-backed window features are reproducible on the tiny sample, but the existing planned-level proxy baseline is mixed and this sample is far below any watcher-gate threshold.
- Existing planned-level proxy baseline: proxy_labels_mixed_no_promotion
- Baseline label matches/mismatches: 1/1
- Absorbed near planned level: 1/2

## Rows

| Event | Window | Setup | Existing label | Archive label | Signed delta | CVD slope/min | Aggressive near level | Progress/aggr | Absorbed? | H5 baseline MFE-MAE |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: |
| BTC-1h-previous_day_high-1789948800 | 2026-09-20T23:55:00.000Z to 2026-09-21T00:10:00.000Z | continuation_long | hold_or_retest_candidate | fast_kill_candidate | 2036832 | 135789 | 2765304 | -0.0000411203 | true | -0.325 |
| BTC-1h-previous_day_high-1790125200 | 2026-09-23T00:55:00.000Z to 2026-09-23T01:10:00.000Z | fade_short | hold_or_retest_candidate | hold_or_retest_candidate | -1611459 | -107431 | 200921 | -0.001221378 | false | -0.9246 |

## Notes

- Signed taker delta treats buyer-is-maker trades as taker sells and the rest as taker buys.
- Aggressive notional near level uses max(ATR * configured multiple, level bps band) around the frozen planned level.
- Absorption near level requires aligned aggressive notional dominance but weak/failing progress through the planned level.
- This is a reproducible feature plumbing sample only; it is intentionally too small for any watcher-gate change.

## Boundary

No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed.
