# Copytrading Watch Ledger

Status: research-only watch ledger.

Purpose: track copytrading, wallet-following, and account/cohort leads without turning them into live-copy instructions. Rows are evidence inventory only. A row can become a paper-test candidate only after a separate frozen-cohort spec and HITL gate.

## Status Values

- `watch`: accessible enough to observe or manually research.
- `proposed`: specific evidence-gathering step is ready, still research-only.
- `needs-access`: useful source, but this workspace lacks verified no-key/API/export access.
- `rejected`: failed a latency, capacity, evidence, or safety screen.

## Ledger

| Candidate account/wallet | Venue | Public profile/source | Strategy archetype | Latency sensitivity | Liquidity/capacity | Holding period | Realized history evidence | Copyability risks | Current status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `0xb317d2bc2d3d2df5fa441b5bae0ab9d8b07283ae` | Hyperliquid | Local inventory plus no-key Hyperliquid `userFills`/`clearinghouseState` probe | Trump-person event radar / high-leverage perp anomaly | High | Large nominal activity, but liquidation and market-impact risks dominate | Event/perp, not proven slow | No-key fills returned, including liquidation history; current clearinghouse snapshot empty | Attribution uncertainty, hidden hedges, extreme leverage, event latency, liquidation tail | watch/radar-only |
| Public stats leaderboard seed route | Hyperliquid | `https://stats-data.hyperliquid.xyz/Mainnet/leaderboard`; see `wiki/notes/2026-08-30-copytrading-public-route-ledger.md` | Discovery route, not a wallet strategy | To classify per sampled address | Leaderboard rows include account value and volume but not copy capacity after slippage | To classify with independent fills | Public no-key probe returned 44,149 address rows, 22,230 with positive all-time PnL, and 2,126 with positive all-time PnL but negative week PnL | Leaderboard survivorship, stale/withdrawn accounts, one-hit PnL, zero recent volume, hidden hedges, beta, latency, copy slippage | active-discovery-route |
| Public leaderboard six-address sample | Hyperliquid | `wiki/notes/2026-08-30-hyperliquid-leaderboard-address-sample.md` | Activity-defined sample from public stats leaderboard | Mixed; high for open-position accounts | 2/6 had open positions; 4/6 capped fills; capacity unknown before round-trip reconstruction | Mixed; latest public responses include stale/empty rows and recent open-position rows | No-key intake over 6 addresses produced 0 copy candidates, 1 rejected-as-copy/watch-as-evidence, 5 watch/sample-only | stale accounts, no-fill responses, capped history, concentrated assets/unknown coins, hidden hedges, live-copy temptation, negative returned close-fill PnL | sample-complete/no-candidates |
| `0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5` | Hyperliquid | HypurrScan search result; see `wiki/notes/2026-08-27-hyperliquid-public-address-sample.md` | Historical ETH perp activity, currently unclassified | Medium to high until holding-period distribution is measured | Current no-key snapshot: account value `0.0`, no open perp positions | Returned capped fills include ETH close-short rows around 2026-05-18T16:02:32Z | No-key `userFills` returned 2000 rows; `clearinghouseState` returned 200 OK and no open positions | Stale/emptied account, capped history, leaderboard/search selection bias, hidden hedges, copy delay | watch/sample-only |
| `0x1d52fe9bde2694f6172192381111a91e24304397` | Hyperliquid | HypurrScan search result; see `wiki/notes/2026-08-27-hyperliquid-public-address-sample.md` | Historical APEX perp activity / possible liquidation-era clue | High until proven otherwise | Current no-key snapshot: account value `0.0`, no open perp positions | Returned capped fills include APEX close-long rows around 2025-10-10T20:59:34Z | No-key `userFills` returned 2000 rows; `clearinghouseState` returned 200 OK and no open positions | Negative returned PnL rows, stale account, event timing ambiguity, capped history, hidden hedges | rejected-as-copy/watch-as-evidence |
| `0xc2a30212a8ddac9e123944d6e29faddce994e5f2` | Hyperliquid | HypurrScan search result; see `wiki/notes/2026-08-27-hyperliquid-public-address-sample.md` | Historical BTC/ZEC/ETH perp activity, currently unclassified | High until proven otherwise | Current no-key snapshot: account value `0.000068`, no open perp positions | Returned capped fills cover 2025-11-10T00:36:04Z to 2025-11-11T21:21:02Z | Repeatable intake returned 2000 capped fills and a negative returned close-fill PnL sum of `-416143.727775`; `clearinghouseState` returned 200 OK and no open positions | Stale/emptied account, no full round-trip measurement yet, capped history, hidden hedges, copy delay, negative returned PnL | rejected-as-copy/watch-as-evidence |
| TBD public Hyperliquid dashboard cohort | Hyperliquid | Hyperliquid leaderboard, HypurrScan, HyperDash, ASXN, HyperTracker | To classify | To classify | To classify | To classify | Dashboard/manual until independently fetched; public address seeds can be independently probed no-key | Leaderboard survivorship, one-hit PnL, stale accounts, hidden hedges, copy slippage | proposed |
| TBD slow accumulator cohort | Spot/on-chain | Dune/Arkham/Nansen/public dashboards if accessible | Slow mid-cap accumulator | Low to medium if days/weeks | Must be checked per asset and exit liquidity | Days to weeks | Not yet verified in this workspace | Exit/distribution risk, label quality, paid data dependence, beta | needs-access |
| Copin/HyperX/Dexly-style product lead | Hyperliquid/multi-exchange perps | Public product pages and docs/blogs | Fast or swing perp copytrading | Medium to high | Product-dependent | Intraday to multi-day | Vendor dashboard evidence only until exported/replicated | Vendor score opacity, account/access requirements, live-copy temptation | watch/needs-access |

## Minimum Intake Fields

Every new row should include:

- candidate account or cohort identifier;
- venue;
- public profile/source URL;
- strategy archetype;
- latency sensitivity;
- liquidity/capacity estimate;
- holding period estimate;
- realized history evidence and source quality;
- copyability risks;
- status.

## Promotion Guard

No row is a strategy. Before paper validation, require:

- activity-defined universe, not leaderboard-only discovery;
- enough closed trades or round-trip flow events;
- PnL not dominated by one or two outliers;
- latency/cost/slippage/capacity assumptions;
- beta and hidden-hedge caveat;
- exit-shadowing or distribution-risk measurement for slow accumulation;
- frozen out-of-sample forward test plan.
