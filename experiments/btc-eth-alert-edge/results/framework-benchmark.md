# Framework Benchmark

Generated: 2026-08-30T06:33:26.990930+00:00

Status: research-only, no live execution.

## Scope

- Framework: vectorbt 1.1.0
- Setup: momentum_reversal_long
- Timeframe: 4h

## Row-Level Parity

| Symbol | Custom rows | Vectorbt rows | Shared entries | Custom-only | Vectorbt-only | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| BTCUSDT | 47 | 34 | 33 | 14 | 1 | explainable_portfolio_tail_difference |
| ETHUSDT | 55 | 35 | 34 | 21 | 1 | explainable_portfolio_tail_difference |

## Reassessment

Vectorbt still agrees directionally that BTC/ETH 4h momentum reversal long is weak, but row-level parity is explainable rather than exact. Custom event-study rows score every qualifying setup independently; vectorbt suppresses overlapping entries while a portfolio position is open, and vectorbt can include a recent tail entry before the custom event-study has a full max-bars outcome window.

Decision: keep vectorbt as an external sanity check and do not replace the custom event-study adapter yet. Any future framework parity claim must report row-level overlap, not only aggregate return.

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
