# Hyperliquid Address Intake Report

Generated: 2026-08-30T06:14:35.999Z

Mode: research-only, public/no-key Hyperliquid `info` probes.

## Verdict

The repeatable intake works for known addresses, but this sample produces no copy candidate. 2/6 sampled accounts currently have open positions, which increases live-copy temptation and hidden-hedge risk. 4/6 fill responses are capped, so full history is not proven. 1/6 returned no fills from the latest public userFills response. 1/6 are rejected as copy candidates from returned evidence. Remaining non-rejected rows stay watch/sample-only until a frozen cohort and forward paper test exist.

## Rows

| Address | Status | Open positions | Account value | Fills | Window | Top coins | Closed PnL sum | Reasons |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: | --- |
| `0x4ec8fe22a531a96c8a846aaf5cbef73202649a80` | watch/sample-only | 0 | 0 | 9 | 2026-03-05T08:49:08.663Z to 2026-03-05T09:11:32.728Z | @107:9 | 0 | currently flat in clearinghouseState; stale or emptied account risk; returned fills are concentrated in one coin |
| `0x393d0b87ed38fc779fd9611144ae649ba6082109` | watch/sample-only | 0 | 0 | 0 | n/a to n/a |  | 0 | currently flat in clearinghouseState; stale or emptied account risk |
| `0x7fdafde5cfb5465924316eced2d3715494c517d1` | rejected-as-copy/watch-as-evidence | 32 | 38010794.400255 | 2000 capped | 2026-08-30T01:09:25.885Z to 2026-08-30T06:14:20.010Z | ZEC:951, XMR:319, xyz:SNDK:238, FARTCOIN:107, xyz:SILVER:91 | -28591.243331 | currently has open positions; live-copy temptation and hidden-hedge risk; userFills response is capped; full history not proven; returned close-fill PnL sum is negative |
| `0x9794bbbc222b6b93c1417d01aa1ff06d42e5333b` | watch/sample-only | 0 | 0 | 2000 capped | 2024-11-30T07:32:46.598Z to 2026-01-09T00:00:00.020Z | @107:1893, PURR/USDC:30, @113:23, @114:19, @195:13 | 0 | currently flat in clearinghouseState; stale or emptied account risk; userFills response is capped; full history not proven; returned fills are concentrated in one coin |
| `0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5` | watch/sample-only | 0 | 0 | 2000 capped | 2026-05-18T16:02:28.246Z to 2026-05-18T21:59:32.337Z | ETH:2000 | 1041128.354342 | currently flat in clearinghouseState; stale or emptied account risk; userFills response is capped; full history not proven; returned fills are concentrated in one coin |
| `0x5b5d51203a0f9079f8aeb098a6523a13f298c060` | watch/sample-only | 8 | 83405595.343122 | 2000 capped | 2026-08-29T23:22:53.277Z to 2026-08-30T05:12:15.088Z | SOL:1831, ETH:169 | 0 | currently has open positions; live-copy temptation and hidden-hedge risk; userFills response is capped; full history not proven; returned fills are concentrated in one coin |

## Guardrails

- No row is a strategy.
- Do not promote from capped recent fills or public-profile visibility.
- Require a frozen cohort and forward paper validation before any strategy claim.
- No live copying, trading, keys, paid APIs, cron/cadence, watcher wording, risk/sizing, TP/SL, execution, or orders changed.
