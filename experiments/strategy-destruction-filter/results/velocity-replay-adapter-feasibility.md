# Velocity Replay Adapter Feasibility

Generated: 2026-08-26T08:22:39.675Z

Status: research-only feasibility check. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, or sizing changed.

## Verdict

- build_public_aggtrades_adapter_before_any_new_strict_candidate

## Totals

- Velocity reviews: 146
- Included after strict quality: 144
- Excluded by strict quality: 2
- 1m candle coverage: 3
- Coarse 1m same-sign moves: 3
- Rows needing Binance public aggTrades for exact volume velocity: 54

## Adapter Decision

- 1m candles: usable for coarse price context only; not exact volume velocity replay.
- Binance public aggTrades: proposed no-key adapter for exact 5s notional slots on BTC/ETH/SOL/XRP.
- HYPE: keep event-only until historical Hyperliquid trade/book access is verified.
- Historical book evidence: cannot be reconstructed from candles or aggTrades; needs recorded live depth evidence.

## Rows

- ETH-DOWN-1786374789722-rrlduq: ETH 60s DOWN, recordedMove=-0.6513%, 1mReplay=coarse_1m_replay, exact=needs_binance_public_aggtrades
- HYPE-UP-1786381837992-iaia51: HYPE 5m UP, recordedMove=1.0135%, 1mReplay=insufficient_candles, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-UP-1786411467173-1jqvyw: HYPE 60s UP, recordedMove=0.7533%, 1mReplay=insufficient_candles, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-DOWN-1786411527625-cv6dv9: HYPE 60s DOWN, recordedMove=-0.7585%, 1mReplay=insufficient_candles, exact=needs_hyperliquid_historical_trade_access_verification
- ETH-DOWN-1786462644866-k89vtm: ETH 5m DOWN, recordedMove=-0.9004%, 1mReplay=coarse_1m_replay, exact=needs_binance_public_aggtrades
- HYPE-UP-1786614248771-feu2wd: HYPE 5m UP, recordedMove=0.9543%, 1mReplay=insufficient_candles, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-DOWN-1787069898591-m4pzur: HYPE 60s DOWN, recordedMove=-0.6504%, 1mReplay=coarse_1m_replay, exact=needs_hyperliquid_historical_trade_access_verification
- SOL-UP-1787151268089-364skg: SOL 15m UP, recordedMove=1.6502%, 1mReplay=missing_cache_coverage, exact=needs_binance_public_aggtrades
- HYPE-UP-1787151269940-mkv63q: HYPE 5m UP, recordedMove=0.975%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- ETH-UP-1787151298775-bhrjsk: ETH 5m UP, recordedMove=0.9001%, 1mReplay=missing_cache_coverage, exact=needs_binance_public_aggtrades
- ETH-DOWN-1787151595654-yiizfv: ETH 60s DOWN, recordedMove=-0.679%, 1mReplay=missing_cache_coverage, exact=needs_binance_public_aggtrades
- BTC-UP-1787152019278-xupw3o: BTC 15m UP, recordedMove=1.2999%, 1mReplay=missing_cache_coverage, exact=needs_binance_public_aggtrades
- ETH-UP-1787153055182-ymjew4: ETH 5m UP, recordedMove=0.9005%, 1mReplay=missing_cache_coverage, exact=needs_binance_public_aggtrades
- HYPE-UP-1787153280193-j6hhm4: HYPE 60s UP, recordedMove=0.6615%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- SOL-UP-1787153364061-ic0w69: SOL 5m UP, recordedMove=1.2591%, 1mReplay=missing_cache_coverage, exact=needs_binance_public_aggtrades
- HYPE-DOWN-1787153436310-ime11e: HYPE 60s DOWN, recordedMove=-0.6635%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- BTC-UP-1787153434499-s85pic: BTC 15m UP, recordedMove=1.7401%, 1mReplay=missing_cache_coverage, exact=needs_binance_public_aggtrades
- HYPE-UP-1787155175032-chovji: HYPE 5m UP, recordedMove=0.9911%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-DOWN-1787155789969-rq2hdh: HYPE 60s DOWN, recordedMove=-0.652%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-UP-1787157099316-6nqqwq: HYPE 60s UP, recordedMove=0.6557%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-UP-1787159427781-dp5jd5: HYPE 60s UP, recordedMove=0.6552%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-UP-1787166698402-y86jgn: HYPE 60s UP, recordedMove=1.7212%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-DOWN-1787167811527-fqi9h7: HYPE 5m DOWN, recordedMove=-1.1988%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-UP-1787168551733-hw8vah: HYPE 60s UP, recordedMove=0.7181%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-DOWN-1787169791681-6o54vf: HYPE 60s DOWN, recordedMove=-0.7044%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-UP-1787170395921-jws2ws: HYPE 60s UP, recordedMove=0.6797%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-UP-1787172996271-7xxljj: HYPE 5m UP, recordedMove=1.0317%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- HYPE-DOWN-1787173253101-1lqvpq: HYPE 60s DOWN, recordedMove=-0.7016%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- ETH-UP-1787174375823-5yeu15: ETH 15m UP, recordedMove=2.0392%, 1mReplay=missing_cache_coverage, exact=needs_binance_public_aggtrades
- HYPE-UP-1787174845459-1wfkyu: HYPE 15m UP, recordedMove=1.8456%, 1mReplay=missing_cache_coverage, exact=needs_hyperliquid_historical_trade_access_verification
- ... 114 more rows in velocity-replay-adapter-feasibility.json

## Rationale

- A 1m-only adapter is useful for context and sanity checks but would overclaim exact 5s volume-velocity reconstruction.
- The clean ETH bucket remains tiny, and the prior OHLCV proxy was killed by the destruction filter.
- The next honest upgrade is a Binance public aggTrades replay for Binance assets plus explicit non-replay status for historical book/HYPE rows.
