---
type: note
topic: demo-sim-profitable-strategy-source-scan
created: 2026-09-26T16:45:00Z
last_updated: 2026-09-26T16:45:00Z
work_item: discovery.demo-sim-profitable-strategy-source-scan
status: complete
scope: research-only
sources:
  - 2026-08-30-public-free-source-feed-list.md
  - 2026-08-30-strategy-family-taxonomy.md
  - 2026-08-31-strategy-leg-garden-harvest.md
  - 2026-08-31-funding-basis-baseline-monitor.md
  - 2026-08-30-x-reddit-strategy-inspiration-scan.md
  - ../sources/chart-champions-previous-day-high-low-strategy-2026-08-30.md
  - https://github.com/freqtrade/freqtrade/blob/develop/docs/strategy-101.md
  - https://github.com/freqtrade/freqtrade
  - https://hummingbot.org/strategies/
  - https://github.com/hummingbot/hummingbot
  - https://vectorbt.dev/
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
  - https://api-docs.defillama.com/
  - https://docs.dexscreener.com/api/reference
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - source-scan
  - strategy-family
related:
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../decisions/candidates.md
  - ../concepts/funding-basis-structural-baseline.md
  - 2026-09-26-demo-sim-strategy-candidate-spec-seed-list.md
---
# DEMO-SIM Profitable Strategy Source Scan

## Purpose

This closes `demo-sim-profitable-strategy-source-scan` as a bounded Phase 2 discovery pass.

Question: which public/no-key or already-ingested sources can seed new RALPH DEMO-SIM strategy candidates without live trading, keys, paid accounts, scheduler edits, or claims of capital readiness?

## Boundary

No strategy is promoted by this scan. "Profitable" means "has a plausible source claim or prior-art mechanism worth trying to kill cheaply," not "verified edge." All candidates below remain research-only and must pass BTC regime gates, baseline lift, fees/costs, purged/embargo chronology, drawdown, and forward evidence before any paper wording.

## Access Verification

Checked from this workspace on 2026-09-26:

| Route | Probe result | Access class | Use |
| --- | --- | --- | --- |
| Hyperliquid info endpoint | `metaAndAssetCtxs` HTTP 200; 234 markets/context rows; fields include funding, open interest, premium, oracle, mark, mid | verified-public/no-key | funding, OI, market context, wallet/fill checks for named addresses only |
| Binance spot REST | `exchangeInfo?symbol=BTCUSDT` HTTP 200; BTCUSDT trading metadata returned | verified-public/no-key | candles, trades, public market replay |
| DefiLlama chains | HTTP 200; public chain context returned | verified-public/no-key | battlefield/yield/context baseline |
| DEXScreener search | HTTP 200; SOL pair rows returned | verified-public/no-key | mid-cap liquidity sanity checks, not alpha |
| Freqtrade source/docs | GitHub/docs HTTP 200; repo license file says GPLv3 | verified-public/open-source | strategy schema, lookahead/backtest hygiene, examples as source claims |
| Hummingbot source/docs | GitHub/docs HTTP 200; repo license file says Apache 2.0 | verified-public/open-source | range/grid/MM prior art and offline falsifier design |
| vectorbt docs | HTTP 200 | verified-public/open-source/free-core | fast local parameter sweeps; beware PRO-only features |

Access verification only proves reachability and basic license posture. It does not prove API stability, terms sufficiency for production, data depth, fill realism, or edge.

## Retained Source Families

| Source family | What it contributes | RALPH fit | DEMO-SIM route | Risk / caveat | Decision |
| --- | --- | --- | --- | --- | --- |
| Freqtrade strategy docs and examples | Candle/indicator strategy contract; explicit warning that backtests can be distorted; lookahead/recursive analysis tooling exists | Good validation-hygiene source, not default engine | Translate simple long-only ideas into local DEMO-SIM rules; compare to timestamp/baseline holds | GPLv3 matters if code is reused; strategy examples are inspiration only | retain-as-template-source |
| Hummingbot strategy docs and repo | Market-making, grid, LP, executor/controller vocabulary; paper trading and exchange-connector prior art | Good for range/grid and passive liquidity failure modes | Use offline candles/trades before any product/account step | Live/paper bot operation would require separate approval; MM fill realism is hard | retain-as-prior-art |
| vectorbt docs | Fast vectorized sweeps over many parameters/assets | Useful for kill-test speed and sensitivity checks | Optional local harness if existing JS DEMO-SIM becomes too slow | Free core is enough for simple sweeps; do not depend on PRO-only features | retain-as-tool-reference |
| Hyperliquid public info | Funding, OI, mids, context, named-user public data | Strong no-key route for funding/basis baseline and small named-address falsifiers | Funding snapshot/funding-history tables; BTC-gated context labels | Perp/account/margin assumptions cannot imply execution | retain-as-active-public-rail |
| Binance/Bybit style public market data | Liquid candles/trades/book context for BTC/ETH/SOL/major alts | Main DEMO-SIM market replay rail | Current btc-eth-alert-edge scripts and future candidate replays | CEX public data lacks account-specific fills and may be region/availability sensitive | retain-as-active-public-rail |
| Existing RALPH TA/PDH-PDL source | Previous day high/low liquidity-sweep and acceptance/rejection primitive | Strong fit with BTC-led full-TA gate | Add PDH/PDL acceptance/rejection labels and test against current range-breakout survivor | Manual TA translation can overfit; needs mechanical definitions | retain-as-candidate-seed |
| Existing RALPH funding/basis notes | No-prediction structural carry baseline | Best current patient-retail comparison floor | Use as baseline/context, not as directional alert | Requires cost/tail accounting before any paper/demo step | retain-as-baseline |
| Social/GitHub inspiration scan | Failure lenses: postmortems, ORB baseline, copy-verifier skepticism | Useful for kill criteria, not direct edge | Use source claims only when rules/data are reproducible | High noise and survivorship/social-proof risk | retain-selectively |

## Rejected Or Deferred Sources

| Source type | Reason |
| --- | --- |
| Paid/keyed Nansen, Arkham, Dune API/export | Still needs explicit access approval and material-value gate before active use. |
| Public leaderboards as copy candidates | Leaderboard rank bakes in survivorship and hidden-hedge risk; only usable as a seed for no-key rejection/fill-state checks. |
| Generic X/Twitter strategy posts | Too noisy unless tied to code, data, and a falsifier. |
| Live bot recipes with keys/accounts | Out of scope; execution, paper accounts, API keys, and schedulers need Tomas approval. |
| Liquidation-map liquidity branch | Already killed for current Q1 replay; do not reopen without a new pre-registered question. |

## Candidate Mechanisms Worth Seeding

These are converted into the separate seed-list note:

1. `pdh-pdl-btc-gated-liquidity-sweep-long`
2. `btc-risk-on-opening-range-breakout-continuation`
3. `funding-persistence-context-baseline`
4. `range-grid-offline-falsifier`

Common promotion blockers:

- No BTC gate or BTC regime conflict.
- No baseline lift versus timestamp-matched/no-trade/simple candle rule.
- Positive result disappears under purged/embargo or simple OOS split.
- Edge is dominated by one symbol, one week, one outlier, or one parameter pocket.
- Costs, spread, slippage, funding, or drawdown erase the effect.
- Data cannot be gathered repeatedly with public/no-key rails.

## Decision

The source scan is complete. RALPH has enough accessible, public/no-key source material to seed at least three new Phase 2 strategy specs without scheduler changes or execution-adjacent work.

Next completed companion artifact: `2026-09-26-demo-sim-strategy-candidate-spec-seed-list.md`.

## Verification

- Read existing RALPH routing notes before adding new source claims.
- Verified current public access with HTTP probes listed above.
- Verified license posture for Freqtrade and Hummingbot from upstream license files.
- Did not modify cron, schedulers, live alerts, watcher behavior, keys, accounts, paid services, risk/sizing, TP/SL, execution, or public posting.
