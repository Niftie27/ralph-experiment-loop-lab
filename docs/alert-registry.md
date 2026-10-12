# Alert registry

Generated: 2026-10-12T06:44:16Z

This registry documents watcher alert sources and script versions only. It does
not include per-alert rows, Telegram message IDs, or individual alert prices.

## Short-watch sources

| source_id | script path | version | sha256 | valid_from | proof level | sent alerts | failed sends |
| --- | --- | --- | --- | --- | --- | ---: | ---: |
| sw-btc-82k | `tools/vps-scripts/btc-short-watch-82k.mjs` | `unknown-before-2026-09-09` | unknown | before `2026-09-09T16:07:58Z` | unknown | 28 | 0 |
| sw-btc-82k | `tools/vps-scripts/btc-short-watch-82k.mjs` | `b72040d2` | `b72040d2dcf382275bb6bedede5a27202a82f58824386a20bbe4e9c469a0b233` | `2026-09-09T16:09:46.306Z` | mtime | 11 | 0 |
| sw-zec | `tools/vps-scripts/zec-hype-short-watch.mjs` | `unknown-before-2026-09-13` | unknown | before `2026-09-13T21:23:45Z` | unknown | 18 | 0 |
| sw-hype | `tools/vps-scripts/zec-hype-short-watch.mjs` | `unknown-before-2026-09-13` | unknown | before `2026-09-13T21:23:45Z` | unknown | 24 | 1 |
| sw-hype | `tools/vps-scripts/zec-hype-short-watch.mjs` | `c920209c` | `c920209cb0482c21378eb152c8a368e44642fd87f23e6a2f97eac2287917815d` | `2026-09-13T22:01:01.177Z` | mtime | 1 | 0 |

`valid_from` for the known versions is the first watcher `started` line after
the script mtime. The proof level is therefore `mtime`, not git provenance.

## Logic summary

### sw-btc-82k

- Price feed: Bybit linear public REST endpoints for ticker, 1m candles, 5m candles, and recent trades.
- Entry trigger: BTC short candidate requires the extension zone to have been seen, with `highSeen >= 81_950`, flow `deltaPct <= 5`, 1m structure loss or 5m weakness, and failed continuation from the high.
- SL rule: invalidation is the evaluated recent high plus 120.
- TP rule: TP1 is `max(localLow, mark - 300)`, TP2 is `max(79_280, mark - 650)`, and TP3 is `max(78_550, mark - 1_100)`.
- Dedupe/seed rule: repeats are throttled for 45 minutes. A later alert requires a better retest by at least the larger of 100 or 0.12%. On start, the script seeds the last alert from recent successful log history within a 3-hour lookback.
- `highSeen` never decreases during a process run; it is updated with `Math.max(highSeen, recentHigh)` and resets only when the process starts.

### sw-zec and sw-hype

- Price feed: Bybit linear public REST endpoints for BTC gate context and each watched symbol's ticker, 1m candles, 5m candles, and recent trades.
- Entry trigger: each alt short candidate requires its rejection zone to have been seen, BTC gate approval, no accepted 5m close above rejection high, flow under the configured max, failed continuation by absolute and percent pullback thresholds, and 1m structure loss or 5m weakness.
- SL rule: invalidation is evaluated recent high plus the larger of configured minimum SL pad, `ATR1 * 1.6`, or `ATR5 * 0.35`.
- TP rule: fixed configured targets per symbol.
- Dedupe/seed rule: repeats are throttled for 45 minutes. A later alert requires a better retest by at least the larger of 75% of the symbol minimum pullback or 0.2%. On start, the script seeds each symbol's last alert from recent successful log history within a 3-hour lookback.
- `highSeen` never decreases during a process run for each symbol; it is updated with `Math.max(symbolState.highSeen, recentHigh)` and resets only when the process starts.

## v1 alert categories

Names only, from `tools/crypto-updates/realtime-market-watcher.mjs`:

- `BTC UP WICK 5s`
- `BTC DOWN WICK 5s`
- `BTC UP VELOCITY 60s`
- `BTC DOWN VELOCITY 60s`
- `BTC UP VELOCITY 5m`
- `BTC DOWN VELOCITY 5m`
- `BTC UP VELOCITY 15m`
- `BTC DOWN VELOCITY 15m`
- `ETH UP WICK 5s`
- `ETH DOWN WICK 5s`
- `ETH UP VELOCITY 60s`
- `ETH DOWN VELOCITY 60s`
- `ETH UP VELOCITY 5m`
- `ETH DOWN VELOCITY 5m`
- `ETH UP VELOCITY 15m`
- `ETH DOWN VELOCITY 15m`
- `SOL UP WICK 5s`
- `SOL DOWN WICK 5s`
- `SOL UP VELOCITY 60s`
- `SOL DOWN VELOCITY 60s`
- `SOL UP VELOCITY 5m`
- `SOL DOWN VELOCITY 5m`
- `SOL UP VELOCITY 15m`
- `SOL DOWN VELOCITY 15m`
- `HYPE UP WICK 5s`
- `HYPE DOWN WICK 5s`
- `HYPE UP VELOCITY 60s`
- `HYPE DOWN VELOCITY 60s`
- `HYPE UP VELOCITY 5m`
- `HYPE DOWN VELOCITY 5m`
- `HYPE UP VELOCITY 15m`
- `HYPE DOWN VELOCITY 15m`
- `CRYPTO ALERT REVIEW`
- `PAPER OPEN`
- `PAPER CLOSE`
- `DEMO-SIM FILL`
- `DEMO-SIM CLOSE`
