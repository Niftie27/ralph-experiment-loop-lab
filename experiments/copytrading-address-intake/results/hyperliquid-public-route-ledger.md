# Hyperliquid Public Route Ledger

Generated: 2026-08-30T06:05:10.667Z

Mode: research-only, public/no-key route audit.

## Access Verdict

Hyperliquid's public stats leaderboard is reachable without a key and returns structured wallet rows. It is usable as a discovery route only, not as evidence of copyable edge.

## Routes

| Route | Access class | Programmatic? | RALPH use | Status |
| --- | --- | --- | --- | --- |
| Hyperliquid public stats leaderboard | verified-public-no-key | yes | address seed discovery only; must independent-check fills/state | active-discovery-route |
| Hyperliquid official info endpoint | verified-public-no-key | yes | independent clearinghouseState/userFills checks for known addresses | active-verification-route |
| HypurrScan | verified-public-manual | not verified | manual address/profile cross-checks | watch/manual |
| HyperDash Explore | verified-public-js-page | not verified | manual cohort/source discovery and prior-art UX reference | watch/manual |
| HyperTracker | verified-public-page; API/pricing exists | needs account/API for official product route | manual discovery and prior-art; API remains needs-access | watch/needs-access |
| Nansen Hyperliquid leaderboard API | documented-api-key-required | not active in this workspace | future paid/keyed smart-money reference if approved | needs-access |
| Apify Hyperliquid leaderboard actors | public listing; paid-per-use/account path | not active in this workspace | watch as possible extractor if free public route breaks | watch/needs-approval |

## Leaderboard Snapshot

- Rows returned: 44149
- Rows with addresses: 44149
- Rows with positive all-time PnL: 22230
- Rows with positive all-time and negative week PnL: 2126

## Top Compact Rows

| Address | Account value | Day PnL | Week PnL | Month PnL | All-time PnL | Month volume | Risk tags |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `0x4ec8fe22a531a96c8a846aaf5cbef73202649a80` | 225006148.99 | 1.14 | 5.01 | 25.44 | 445047903.8 | 0 | inactive-recent-volume-risk |
| `0x393d0b87ed38fc779fd9611144ae649ba6082109` | 1112392096.01 | 12259608.28 | 70869162.31 | 377419828.38 | 402461035.13 | 0 | inactive-recent-volume-risk, recent-pnl-concentration-risk |
| `0xecb63caa47c7c4e77f60f1ce858cf28dc2b82b00` | 140630863.99 | -400822.3 | 1082229.92 | -8647809.28 | 205083973.25 | 13626226490.55 | needs-fill-history-check |
| `0x8d68efbf06fb8cf932518bcb53705e674c4852dc` | 690333880.66 | 5997053.64 | 21378068.62 | 119565751.98 | 191767072.37 | 0 | inactive-recent-volume-risk |
| `0xfae95f601f3a25ace60d19dbb929f2a5c57e3571` | 2402555.89 | 122.64 | 1182.52 | 1506.49 | 149881319.24 | 0 | withdrawn-or-stale-profit-risk, inactive-recent-volume-risk |
| `0x488d2a9b70cc18ef66057a48ab3d59da1c59fe08` | 253163904.82 | 5707159.54 | 15202812.71 | 82900375.51 | 149564759.1 | 0 | inactive-recent-volume-risk |
| `0x7fdafde5cfb5465924316eced2d3715494c517d1` | 52808850.43 | -1310330.04 | -4566935.7 | -26857114.67 | 146746839.46 | 1728443888.43 | recent-drawdown-risk |
| `0x9794bbbc222b6b93c1417d01aa1ff06d42e5333b` | 3596.83 | 40.47 | 207.22 | 1148.36 | 144136783.68 | 0 | small-account-capacity-risk, withdrawn-or-stale-profit-risk, inactive-recent-volume-risk |
| `0xdfc24b077bc1425ad1dea75bcb6f8158e10df303` | 187687643.72 | 10596.17 | 178107.33 | 907454.28 | 137812671.68 | 0 | inactive-recent-volume-risk |
| `0x5b5d51203a0f9079f8aeb098a6523a13f298c060` | 180929793.88 | -2742866.27 | -2908502.7 | -38613748.58 | 133896210.16 | 625095712.92 | recent-drawdown-risk |
| `0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5` | 3.41 | 0.01 | 0.32 | 0.52 | 122544571.99 | 0 | small-account-capacity-risk, withdrawn-or-stale-profit-risk, inactive-recent-volume-risk |
| `0x493db0ed7514c975e9abcc110bd40c473b6763e3` | 109898995.36 | 1314135.64 | 6237618.6 | 36053203.05 | 120935301.38 | 0 | inactive-recent-volume-risk |

## Decision

The official stats endpoint is an active no-key public route for candidate-source discovery, but it is leaderboard-selected and cannot prove copyability. Rows from it must pass independent `userFills`/`clearinghouseState` intake and outlier, latency, capacity, beta, hidden-hedge, and exit-shadowing checks before any frozen paper cohort spec.

No live copying, trading, wallet keys, exchange keys, paid APIs, account setup, public posting, scheduler changes, alert wording, thresholds, risk/sizing, TP/SL, execution, or orders changed.
