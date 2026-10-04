# AggTrades Velocity Event Study

Generated: 2026-10-04T08:05:01.763Z

Status: research-only event study over existing public/no-key Binance aggTrades replay output. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed.

## Decision

- Verdict: watch_low_sample
- Candidate added: false
- Rationale: Replay is feasible (29 usable rows), but every bucket is below N=10 or blocked by prior strict-filter failure.
- Next: Keep collecting replay-clean rows; do not add another broad OHLCV proxy from this evidence.

## Gates

- Minimum sample for candidate: 10
- Minimum dominant verdict share: 0.75
- Same failed strict-filter mechanism is blocked without new data.

## Totals

- Replay rows: 54
- Replay OK: 54
- Usable replay-clean rows: 29
- Primary buckets: 13
- Velocity-band buckets: 18
- Candidate-ready buckets: 0
- Watch low-sample buckets: 12

## Top Primary Buckets

- ETH|5m|UP: N=5, dominant=follow-useful/0.8, 30mAvg=1.3865%, 1hAvg=2.2869%, replayVelocityAvg=2.9411, gate=watch_low_sample
- ETH|60s|DOWN: N=5, dominant=fade-useful/0.8, 30mAvg=-0.4112%, 1hAvg=-0.4324%, replayVelocityAvg=7.8514, gate=killed_or_no_bucket
- ETH|5m|DOWN: N=3, dominant=fade-useful/0.6667, 30mAvg=-0.4606%, 1hAvg=-0.7355%, replayVelocityAvg=9.2829, gate=watch_low_sample
- SOL|15m|DOWN: N=2, dominant=fade-useful/1, 30mAvg=-1.225%, 1hAvg=-0.7675%, replayVelocityAvg=4.654, gate=watch_low_sample
- SOL|5m|UP: N=2, dominant=fade-useful/0.5, 30mAvg=0.7626%, 1hAvg=-2.1946%, replayVelocityAvg=3.2593, gate=watch_low_sample
- SOL|15m|UP: N=2, dominant=follow-useful/0.5, 30mAvg=0.6235%, 1hAvg=1.2668%, replayVelocityAvg=0.4, gate=watch_low_sample
- SOL|5m|DOWN: N=2, dominant=fade-useful/0.5, 30mAvg=-1.1215%, 1hAvg=-0.9794%, replayVelocityAvg=6.6194, gate=watch_low_sample
- SOL|60s|DOWN: N=2, dominant=fade-useful/0.5, 30mAvg=-0.522%, 1hAvg=-0.4081%, replayVelocityAvg=8.0874, gate=watch_low_sample
- ETH|60s|UP: N=2, dominant=fade-useful/0.5, 30mAvg=0.0845%, 1hAvg=-0.17%, replayVelocityAvg=125.1831, gate=watch_low_sample
- BTC|5m|UP: N=1, dominant=follow-useful/1, 30mAvg=1.4178%, 1hAvg=1.7681%, replayVelocityAvg=4.721, gate=watch_low_sample
- BTC|60s|UP: N=1, dominant=fade-useful/1, 30mAvg=-0.8312%, 1hAvg=-0.7061%, replayVelocityAvg=5.492, gate=watch_low_sample
- BTC|15m|UP: N=1, dominant=noisy/1, 30mAvg=0.0975%, 1hAvg=0.0707%, replayVelocityAvg=4.5975, gate=watch_low_sample

## Top Velocity-Band Buckets

- ETH|60s|DOWN|velocity_gte_5: N=4, verdicts={"noisy":1,"fade-useful":3}, 30mAvg=-0.4044%, 1hAvg=-0.4669%
- ETH|5m|UP|velocity_2_to_5: N=3, verdicts={"follow-useful":2,"noisy":1}, 30mAvg=0.9194%, 1hAvg=1.4013%
- ETH|5m|UP|velocity_lt_2: N=2, verdicts={"follow-useful":2}, 30mAvg=2.0872%, 1hAvg=3.6153%
- ETH|5m|DOWN|velocity_2_to_5: N=2, verdicts={"fade-useful":2}, 30mAvg=-0.6107%, 1hAvg=-0.934%
- SOL|5m|UP|velocity_2_to_5: N=2, verdicts={"fade-useful":1,"follow-useful":1}, 30mAvg=0.7626%, 1hAvg=-2.1946%
- SOL|15m|UP|velocity_lt_2: N=2, verdicts={"follow-useful":1,"noisy":1}, 30mAvg=0.6235%, 1hAvg=1.2668%
- SOL|60s|DOWN|velocity_gte_5: N=2, verdicts={"fade-useful":1,"follow-useful":1}, 30mAvg=-0.522%, 1hAvg=-0.4081%
- ETH|60s|UP|velocity_gte_5: N=2, verdicts={"fade-useful":1,"follow-useful":1}, 30mAvg=0.0845%, 1hAvg=-0.17%
- SOL|5m|DOWN|velocity_lt_2: N=1, verdicts={"fade-useful":1}, 30mAvg=-2.4478%, 1hAvg=-2.0666%
- BTC|5m|UP|velocity_2_to_5: N=1, verdicts={"follow-useful":1}, 30mAvg=1.4178%, 1hAvg=1.7681%
- SOL|15m|DOWN|velocity_gte_5: N=1, verdicts={"fade-useful":1}, 30mAvg=-0.6528%, 1hAvg=-0.8562%
- BTC|60s|UP|velocity_gte_5: N=1, verdicts={"fade-useful":1}, 30mAvg=-0.8312%, 1hAvg=-0.7061%

## Row IDs

- ETH|5m|UP: ETH-UP-1787151298775-bhrjsk, ETH-UP-1787153055182-ymjew4, ETH-UP-1787213450759-gcxdd2, ETH-UP-1787238219715-lur5og, ETH-UP-1787380834476-2j4any
- ETH|60s|DOWN: ETH-DOWN-1787232650136-ns43m6, ETH-DOWN-1787351462736-f5kvh3, ETH-DOWN-1787364017274-190mj4, ETH-DOWN-1787644182524-q4d5qb, ETH-DOWN-1787692087789-pk6bzs
- ETH|5m|DOWN: ETH-DOWN-1786462644866-k89vtm, ETH-DOWN-1787337935499-ypx996, ETH-DOWN-1787357205898-w0o15a
- SOL|15m|DOWN: SOL-DOWN-1787387436908-gaekvu, SOL-DOWN-1787622780137-43xvxn
- SOL|5m|UP: SOL-UP-1787373085522-14v6kz, SOL-UP-1787380707958-c9h18r
- SOL|15m|UP: SOL-UP-1787151268089-364skg, SOL-UP-1787395094474-0cyc5n
- SOL|5m|DOWN: SOL-DOWN-1787393034069-hgn807, SOL-DOWN-1787617033673-kiu4zh
- SOL|60s|DOWN: SOL-DOWN-1787351466713-opibm0, SOL-DOWN-1787644183415-62on8x
