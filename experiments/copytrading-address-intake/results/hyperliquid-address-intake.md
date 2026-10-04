# Hyperliquid Address Intake Report

Generated: 2026-08-27T16:38:18.399Z

Mode: research-only, public/no-key Hyperliquid `info` probes.

## Verdict

The repeatable intake works for known addresses, but this sample produces no copy candidate: all sampled accounts are currently flat, all fill responses are capped, and discovery quality remains the binding risk.

## Rows

| Address | Status | Open positions | Account value | Fills | Window | Top coins | Closed PnL sum | Reasons |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: | --- |
| `0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5` | watch/sample-only | 0 | 0 | 2000 capped | 2026-05-18T16:02:28.246Z to 2026-05-18T21:59:32.337Z | ETH:2000 | 1041128.354342 | currently flat in clearinghouseState; stale or emptied account risk; userFills response is capped; full history not proven; returned fills are concentrated in one coin |
| `0x1d52fe9bde2694f6172192381111a91e24304397` | rejected-as-copy/watch-as-evidence | 0 | 0 | 2000 capped | 2025-10-10T20:59:34.636Z to 2026-01-07T00:00:00.119Z | APEX:464, XPL:220, DOGE:186, ZORA:169, kPEPE:169 | -12948410.205726 | currently flat in clearinghouseState; stale or emptied account risk; userFills response is capped; full history not proven; returned close-fill PnL sum is negative |
| `0xc2a30212a8ddac9e123944d6e29faddce994e5f2` | rejected-as-copy/watch-as-evidence | 0 | 0.000068 | 2000 capped | 2025-11-10T00:36:04.702Z to 2025-11-11T21:21:02.841Z | ZEC:876, ETH:868, BTC:228, @156:28 | -416143.727775 | currently flat in clearinghouseState; stale or emptied account risk; userFills response is capped; full history not proven; returned close-fill PnL sum is negative |
| `0xb317d2bc2d3d2df5fa441b5bae0ab9d8b07283ae` | watch/radar-only | 0 | 0 | 2000 capped | 2026-01-31T18:43:33.193Z to 2026-01-31T18:43:52.514Z | ETH:1266, SOL:734 | -36768308.936506 | currently flat in clearinghouseState; stale or emptied account risk; userFills response is capped; full history not proven; returned close-fill PnL sum is negative |

## Guardrails

- No row is a strategy.
- Do not promote from capped recent fills or public-profile visibility.
- Require a frozen cohort and forward paper validation before any strategy claim.
- No live copying, trading, keys, paid APIs, cron/cadence, watcher wording, risk/sizing, TP/SL, execution, or orders changed.
