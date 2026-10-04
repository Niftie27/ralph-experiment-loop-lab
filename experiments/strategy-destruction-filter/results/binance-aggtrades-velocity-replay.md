# Binance AggTrades Velocity Replay

Generated: 2026-08-26T08:22:41.023Z

Status: research-only replay over public/no-key Binance aggregate trades. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed.

## Verdict

- exact_replay_rows_available_for_bucket_selection
- Next: Use replay-clean buckets only; require sample size, same mechanism, and strict filter survival before forward paper design.

## Totals

- Replayed rows: 54
- Replay OK: 54
- Fetch failed: 0
- No trades returned: 0
- Exact watcher-field matches: 29
- Usable bucket rows: 29

## Buckets

- ETH|5m|UP|follow-useful: N=4, avgVelocity=2.8529, avgMove=0.9176%
- ETH|60s|DOWN|fade-useful: N=4, avgVelocity=8.2763, avgMove=-0.6599%
- ETH|5m|DOWN|fade-useful: N=2, avgVelocity=2.3853, avgMove=-0.9016%
- SOL|15m|DOWN|fade-useful: N=2, avgVelocity=4.654, avgMove=-1.6612%
- BTC|15m|UP|noisy: N=1, avgVelocity=4.5975, avgMove=1.2508%
- BTC|5m|UP|follow-useful: N=1, avgVelocity=4.721, avgMove=0.9926%
- BTC|60s|DOWN|follow-useful: N=1, avgVelocity=1.0773, avgMove=-0.601%
- BTC|60s|UP|fade-useful: N=1, avgVelocity=5.492, avgMove=0.6091%
- ETH|5m|DOWN|noisy: N=1, avgVelocity=23.0782, avgMove=-0.9074%
- ETH|5m|UP|noisy: N=1, avgVelocity=3.2939, avgMove=0.9006%
- ETH|60s|DOWN|noisy: N=1, avgVelocity=6.1517, avgMove=-0.6226%
- ETH|60s|UP|fade-useful: N=1, avgVelocity=33.1865, avgMove=0.6512%
- ETH|60s|UP|follow-useful: N=1, avgVelocity=217.1798, avgMove=0.6309%
- SOL|15m|UP|follow-useful: N=1, avgVelocity=0.5636, avgMove=1.6502%
- SOL|15m|UP|noisy: N=1, avgVelocity=0.2363, avgMove=1.673%
- SOL|5m|DOWN|fade-useful: N=1, avgVelocity=0.3449, avgMove=-1.2189%
- SOL|5m|DOWN|follow-useful: N=1, avgVelocity=12.8938, avgMove=-1.1825%
- SOL|5m|UP|fade-useful: N=1, avgVelocity=3.9592, avgMove=1.2031%
- SOL|5m|UP|follow-useful: N=1, avgVelocity=2.5594, avgMove=1.2%
- SOL|60s|DOWN|fade-useful: N=1, avgVelocity=9.7742, avgMove=-0.902%
- SOL|60s|DOWN|follow-useful: N=1, avgVelocity=6.4006, avgMove=-0.9159%

## Rows

- ETH-DOWN-1786374789722-rrlduq: ETH 60s DOWN, replay=ok, match=false, recordedVol=2.8828, replayVol=3.8079
- ETH-DOWN-1786462644866-k89vtm: ETH 5m DOWN, replay=ok, match=true, recordedVol=22.3757, replayVol=23.0782
- SOL-UP-1787151268089-364skg: SOL 15m UP, replay=ok, match=true, recordedVol=0.5627, replayVol=0.5636
- ETH-UP-1787151298775-bhrjsk: ETH 5m UP, replay=ok, match=true, recordedVol=1.6716, replayVol=1.6741
- ETH-DOWN-1787151595654-yiizfv: ETH 60s DOWN, replay=ok, match=false, recordedVol=6.881, replayVol=0
- BTC-UP-1787152019278-xupw3o: BTC 15m UP, replay=ok, match=false, recordedVol=0.0061, replayVol=n/a
- ETH-UP-1787153055182-ymjew4: ETH 5m UP, replay=ok, match=true, recordedVol=3.0712, replayVol=3.2095
- SOL-UP-1787153364061-ic0w69: SOL 5m UP, replay=ok, match=false, recordedVol=0.1299, replayVol=0.2015
- BTC-UP-1787153434499-s85pic: BTC 15m UP, replay=ok, match=false, recordedVol=1.5769, replayVol=n/a
- ETH-UP-1787174375823-5yeu15: ETH 15m UP, replay=ok, match=false, recordedVol=1.7578, replayVol=n/a
- ETH-DOWN-1787176906667-6oyr2y: ETH 15m DOWN, replay=ok, match=false, recordedVol=1.9104, replayVol=n/a
- ETH-DOWN-1787178833331-szd94s: ETH 15m DOWN, replay=ok, match=false, recordedVol=2.3149, replayVol=0
- ETH-UP-1787179272469-o4lvks: ETH 5m UP, replay=ok, match=false, recordedVol=0.0698, replayVol=0.1424
- ETH-DOWN-1787187119846-3vul1o: ETH 60s DOWN, replay=ok, match=false, recordedVol=8.5258, replayVol=8.7665
- ETH-DOWN-1787195477083-sqogs3: ETH 5m DOWN, replay=ok, match=false, recordedVol=4.138, replayVol=5.1687
- BTC-UP-1787213359438-7qays5: BTC 5m UP, replay=ok, match=true, recordedVol=4.6967, replayVol=4.721
- ETH-UP-1787213450759-gcxdd2: ETH 5m UP, replay=ok, match=true, recordedVol=4.2536, replayVol=4.7457
- BTC-UP-1787220936327-ke83bj: BTC 60s UP, replay=ok, match=true, recordedVol=5.347, replayVol=5.492
- ETH-DOWN-1787227447653-ai8ddk: ETH 15m DOWN, replay=ok, match=false, recordedVol=31.4204, replayVol=n/a
- ETH-DOWN-1787232650136-ns43m6: ETH 60s DOWN, replay=ok, match=true, recordedVol=5.3707, replayVol=6.1517
- ETH-UP-1787238219715-lur5og: ETH 5m UP, replay=ok, match=true, recordedVol=1.7793, replayVol=1.7822
- BTC-UP-1787238242568-s2y5k6: BTC 15m UP, replay=ok, match=true, recordedVol=4.5859, replayVol=4.5975
- ETH-UP-1787241070259-ry3krz: ETH 5m UP, replay=ok, match=false, recordedVol=3.4066, replayVol=2.4735
- BTC-UP-1787275902584-2j4z65: BTC 15m UP, replay=ok, match=false, recordedVol=6.921, replayVol=n/a
- ETH-UP-1787276849407-2ty74i: ETH 60s UP, replay=ok, match=true, recordedVol=34.7531, replayVol=33.1865
- BTC-DOWN-1787279617750-809y4g: BTC 60s DOWN, replay=ok, match=true, recordedVol=1.0746, replayVol=1.0773
- ETH-DOWN-1787321104344-gtu8lf: ETH 15m DOWN, replay=ok, match=false, recordedVol=4.0871, replayVol=0
- ETH-DOWN-1787337935499-ypx996: ETH 5m DOWN, replay=ok, match=true, recordedVol=2.1675, replayVol=2.1884
- ETH-UP-1787349130589-ptephm: ETH 60s UP, replay=ok, match=true, recordedVol=215.1398, replayVol=217.1798
- ETH-DOWN-1787351462736-f5kvh3: ETH 60s DOWN, replay=ok, match=true, recordedVol=7.6113, replayVol=7.8411
- SOL-DOWN-1787351466713-opibm0: SOL 60s DOWN, replay=ok, match=true, recordedVol=9.7513, replayVol=9.7742
- ETH-DOWN-1787357205898-w0o15a: ETH 5m DOWN, replay=ok, match=true, recordedVol=2.5441, replayVol=2.5821
- ETH-DOWN-1787364017274-190mj4: ETH 60s DOWN, replay=ok, match=true, recordedVol=3.5504, replayVol=3.5661
- SOL-UP-1787373085522-14v6kz: SOL 5m UP, replay=ok, match=true, recordedVol=3.9589, replayVol=3.9592
- SOL-UP-1787374996149-2vjk44: SOL 5m UP, replay=ok, match=false, recordedVol=0.0663, replayVol=0.1088
- ETH-DOWN-1787375424400-z85x0h: ETH 15m DOWN, replay=ok, match=false, recordedVol=0.0339, replayVol=0
- BTC-DOWN-1787375424407-i6rob9: BTC 5m DOWN, replay=ok, match=false, recordedVol=0.0426, replayVol=11.3827
- SOL-DOWN-1787375462566-d8vt9x: SOL 15m DOWN, replay=ok, match=false, recordedVol=4.4039, replayVol=0
- ETH-UP-1787376354071-6tjhus: ETH 15m UP, replay=ok, match=false, recordedVol=1.2598, replayVol=n/a
- SOL-UP-1787376953160-il5m3v: SOL 5m UP, replay=ok, match=false, recordedVol=7.4829, replayVol=3.1158
- ... 14 more rows in binance-aggtrades-velocity-replay.json
