---
type: research-note
date: 2026-08-11
tags:
  - ralph
  - ta
  - orderflow
  - tool-stack
  - dont-reinvent-wheel
---

# Trader-Grade TA And Orderflow Tool Stack

Prompt from Tomas: the alert system should use tools and data that serious traders use, not only simple OHLCV scripts. Include orderflow, ATAS-style tooling, technical analysis, and adjacent market structure data. Autoresearch should find the tools, evaluate them, self-test outputs, and only surface significant setup alerts or requested summaries.

## Working Principle

Hard TA should be encoded as explicit, testable rules:

- levels, trend, volatility, range, breakout/retest, reclaim/deviation, momentum exhaustion
- volume profile, VWAP, session levels, prior high/low, imbalance zones where data supports them
- orderflow/DOM proxies: trades, aggTrades, bookTicker, depth, L2 book, CVD, absorption, imbalance, liquidity shifts
- derivatives context: open interest, funding, basis, liquidation clusters, long/short crowding

No discretionary chart claim should be promoted into an alert until it has:

- repeatable rule definition
- backtest or event-study statistics
- baseline comparison
- paper/shadow forward observation
- data-quality check
- clear invalidation and caveat

## Prior-Art / Tool Scan

Initial official-source scan:

- ATAS: professional order flow and volume analysis platform. Useful as conceptual benchmark for footprint, DOM, Time and Sales, volume profile, and imbalance workflows. Source: https://atas.net/
- Bookmap Crypto: crypto orderflow visual platform with liquidity heatmaps, volume bubbles, volume profiles, and multi-exchange orderflow views. Source: https://bookmap.com/crypto
- Exocharts: orderflow charting platform for futures and crypto markets; relevant benchmark for footprint and market profile workflows. Source: https://exocharts.com/
- TradingView: broad charting/TA platform; useful reference for common TA primitives and alert UX, but not a source of edge by itself. Source: https://www.tradingview.com/
- CoinGlass: derivatives/liquidity data provider covering liquidations, open interest, funding, L2/L3 order book products, and multi-exchange market snapshots; likely paid/API-key for serious use. Sources: https://www.coinglass.com/pricing and https://docs.coinglass.com/reference/getting-started-with-your-api
- Coinalyze: futures market data including OI, funding, predicted funding, liquidations, basis, and long/short ratio; API requires key. Sources: https://coinalyze.net/ and https://api.coinalyze.net/v1/doc/
- Laevitas: derivatives analytics/API for options, futures, spreads, volatility surfaces, and statistical market data. Sources: https://www.laevitas.ch/ and https://apiv2.laevitas.ch/swagger
- Hyblock: liquidation heatmap and crypto derivatives/trading tools; useful benchmark for predicted liquidation/liquidity-zone concepts. Sources: https://hyblockcapital.com/ and https://docs.hyblockcapital.com/liquidation-heatmap

## Integration Tiers

T0 no-key now:

- Binance public archives, REST, and websocket trades/bookTicker/depth.
- Hyperliquid public websocket/API.
- Local orderflow capture/features already indexed under Crypto Updates.
- vectorbt/Freqtrade/Nautilus/CCXT for no-key framework sanity checks when feasible.

T1 no-key / manual benchmark:

- Use ATAS/Bookmap/Exocharts/TradingView/Hyblock/CoinGlass as workflow references.
- Recreate only the minimum testable feature definitions locally with public data.
- Do not copy proprietary indicators or rely on screenshots as truth.

T2 explicit approval later:

- Paid/API-key data for liquidation heatmaps, OI/funding history, options, or L2/L3 order books if public proxies prove insufficient.
- Demo/testnet exchange account or exchange API integration for realistic order lifecycle tests.
- Any paid tool subscription.

## Alert Relevance

Trader-grade data should enter alerts only as a compact evidence block:

- `TA`: setup family, level, timeframe, invalidation.
- `Orderflow`: CVD/imbalance/absorption/liquidity shift when measured.
- `Derivatives`: OI/funding/liquidation context when sourced and reliable.
- `Stats`: winrate, sample, expectancy, baseline, paper/shadow status.
- `Confidence`: tier plus caveat, never certainty.

If the data is interesting but not significant, keep it internal.

## 2026-08-11 Active Public Proxy Gate

Implemented first live evidence capture in `crypto-updates/realtime-market-watcher.mjs` using active no-key sources only:

- Binance public `trade` stream for aggressive buy/sell notional and 60s CVD proxy.
- Binance public `depth5@100ms` stream for top-of-book spread, top-5 bid/ask depth imbalance, and depth-change proxy.
- Existing live volume velocity as the burst filter.
- If explicitly enabled with `CRYPTO_UPDATES_REQUIRE_ALERT_EVIDENCE=1`, suppressed candidates are written to `crypto-updates/runtime/alert-feedback.jsonl` as `alert_suppressed` for later event-study statistics.

Default runtime behavior after Tomas's correction: realtime watcher alerts still send normally. Evidence is log-only, and the alert text remains unchanged unless `CRYPTO_UPDATES_INCLUDE_ALERT_EVIDENCE_LINE=1` is set. Optional blocking mode is intentionally conservative: a fast move must have directional orderflow evidence, sufficient signed trade-flow sample, fresh public depth, and at least a small multi-signal score before Telegram delivery. HYPE remains normal movement-alert flow by default until a separate setup-alert gate is explicitly approved.

Verify/Reassess:

- Syntax checks passed for watcher and monitor indexer.
- Realtime watcher restarted and reconnected to Binance plus Hyperliquid.
- Existing alert feedback sample is too small for promotion: 5 finalized/manual reviews, only one `fade-useful`, and no historical gate features before this change.
- Latest BTC/ETH alert-edge refresh still shows open 4h momentum-reversal longs as low-sample/weak; no setup alert.

## Next Work Items

- Build a trader-tool fit map: ATAS vs Bookmap vs Exocharts vs TradingView vs CoinGlass/Coinalyze/Laevitas/Hyblock.
- Let the live public-proxy gate collect forward `alert_suppressed` and `alert_sent` samples, then run event studies by CVD/imbalance/spread/depth buckets.
- Run Freqtrade no-key dry-run spike against the same setup candidates where feasible.
- Decide whether paid/API data would add unique signal beyond public proxies; ask Tomas only if the answer is likely yes.
