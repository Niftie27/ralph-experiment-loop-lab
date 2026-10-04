---
type: note
name: BTC/ETH Alert Edge Prior-Art Scan
created: '2026-08-11T10:18:00Z'
last_updated: '2026-08-11T10:38:00Z'
sources:
  - https://www.freqtrade.io/en/stable/backtesting/
  - https://www.freqtrade.io/en/stable/strategy-101/
  - https://vectorbt.dev/
  - https://github.com/polakowo/vectorbt
  - https://nautilustrader.io/
  - https://github.com/binance/binance-public-data
  - https://developers.binance.com/en/docs/products/spot/faqs/market_data_only
  - https://docs.ccxt.com/
  - https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/rest-api/market-data
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals
  - https://docs.coinglass.com/reference/getting-started-with-your-api
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - source-scan
  - btc-risk-on
related:
  - wiki/concepts/prior-art-before-experiment.md
  - automation/btc-eth-alert-edge-loop.md
  - experiments/btc-eth-alert-edge/README.md
  - experiments/btc-eth-alert-edge/universe-policy.md
---
# BTC/ETH Alert Edge Prior-Art Scan

Tomas reinforced the hard rule: do not reinvent the wheel. This scan checks whether the new BTC/ETH alert-edge layer should keep custom-building or reuse existing rails.

## Verdict

The current custom script is acceptable as a thin MVP and alert-facing snapshot generator, but generic historical data collection and generic backtesting are already solved. RALPH should not grow a large homegrown engine by default.

Best next posture:

- keep the current custom layer as a small adapter/output contract for Telegram alert blocks
- reuse public data archives and exchange/public APIs where possible
- benchmark setup logic inside at least one established framework before trusting custom results
- add custom code only for Tomas-specific glue: alert formatting, paper-trade journal linkage, regime labels, and cross-source feature alignment

## Existing Wheels

### Backtesting / dry-run frameworks

- Freqtrade: crypto-focused bot/backtesting stack with data downloading, backtesting, and dry-run guidance. Its docs explicitly say backtesting needs historic data and that strategies should be dry-run after backtesting to compare behavior.
- vectorbt: research/backtesting toolkit for indicators, signals, portfolio performance, analytics, and visualization. Useful for fast parameter sweeps and robustness checks.
- NautilusTrader: production-grade event-driven engine with deterministic backtesting, replay, fee/fill/latency models, and one architecture spanning research through live deployment. Useful if RALPH outgrows vectorized candle backtests.

### Public/free data rails

- Binance public data archive: daily/monthly spot and futures files including klines, trades, and aggregate trades. This is a better historical bulk source than repeatedly paging public REST for old candles.
- Binance market-data-only endpoints: no API key needed for public market data endpoints and public WebSocket streams.
- CCXT: unified API over many exchanges for market data access; useful as an adapter layer, not necessarily as a backtest engine.
- Binance futures market data: funding-rate history is available from official futures market-data endpoints.
- Hyperliquid info endpoint: public perpetual asset contexts include mark price, current funding, and open interest.
- CoinGlass: strong derivatives/open-interest/liquidation/funding coverage, but API access/pricing means it should be treated as paid unless Tomas separately approves.

## Implications For BTC/ETH Alert Edge

Do not custom-build:

- historical bulk kline/trade archive downloader if Binance archives cover it
- generic portfolio metrics that vectorbt/Freqtrade already provide
- generic exchange adapter if CCXT covers the public endpoint cleanly
- event-driven fill/latency engine if NautilusTrader is a better fit

Custom-build only:

- Telegram alert probability block and local snapshot schema
- paper-trade records linked to Tomas's actual alert history
- setup taxonomy and regime labels specific to RALPH
- adapters from existing tools into `edge-snapshot.json`
- cross-source comparison of backtest vs forward paper outcomes

## Immediate Follow-Up

1. Add Binance public archive as a historical data source candidate for BTCUSDT/ETHUSDT spot and futures. Initial spot adapter is done for BTCUSDT/ETHUSDT klines.
2. Compare current custom backtest results against vectorbt or Freqtrade for at least one setup family. Local check on 2026-08-11 found `vectorbt` and `pandas` are not installed, so this should be a bounded framework spike rather than a silent dependency install.
3. Add funding/open-interest context from official Binance/Hyperliquid public endpoints before paying for CoinGlass-like data.
4. Keep CoinGlass/paid derivatives APIs on watch, not default.

## Adapter Result 2026-08-11

Implemented Binance spot kline reuse in `experiments/btc-eth-alert-edge/src/binance-data.mjs`.

Behavior:

- monthly/daily Binance public archive ZIPs for historical candles
- Binance public REST klines only for the recent tail
- local JSON cache under `experiments/btc-eth-alert-edge/data/candles/`
- local CSV cache under `experiments/btc-eth-alert-edge/data/binance-archive-cache/` so scheduled runs do not refetch immutable historical archives every 4 hours
- Coinbase remains fallback if Binance archive/REST fails

Validation:

- First clean run generated `edge-snapshot.json` at `2026-08-11T10:20:36Z`.
- Sources showed BTC/ETH 1h and 4h candles from `binance-public-archive-rest-tail`.
- Timestamp normalization was fixed after detecting Binance archive microsecond timestamps.
- Contaminated paper records from the failed timestamp run were reset because this layer is new and those records were invalid.

Current latest candidates:

- BTC 4h `momentum_reversal_long`: `low-sample`, regime sample 9, winrate 44.4%, expectancy -0.026R.
- ETH 4h `momentum_reversal_long`: `low-sample`, all-regime sample 54, winrate 40.7%, expectancy -0.108R.

This reinforces the alert rule: do not label these as high-probability.

## Framework Benchmark Result 2026-08-11

Tomas added the operating loop: run your own statistics, Verify/Reassess, do not reinvent the wheel, and find another route when blocked.

Tried routes:

- System Python has no `pip`.
- Unpinned `uv run --with vectorbt` resolved an old dependency chain that failed on Python 3.12.
- `uv run --with 'vectorbt>=0.26.0' --with pandas --with numpy` succeeded and imported vectorbt 1.1.0.

Implemented `experiments/btc-eth-alert-edge/src/framework_benchmark.py`.

Command:

```bash
npm run benchmark:vectorbt --prefix ralph-research-os/experiments/btc-eth-alert-edge
```

Output: `experiments/btc-eth-alert-edge/results/framework-benchmark.json`.

Scope: BTCUSDT/ETHUSDT 4h `momentum_reversal_long`.

Results:

- BTCUSDT independent event study: 45 samples, 37.78% winrate, -0.1278R expectancy, 0.7938 profit factor.
- BTCUSDT vectorbt portfolio sanity check: 34 trades, 42.42% win rate, -7.4993% total return.
- ETHUSDT independent event study: 54 samples, 40.74% winrate, -0.108R expectancy, 0.8001 profit factor.
- ETHUSDT vectorbt portfolio sanity check: 37 trades, 41.67% win rate, -16.7005% total return.

Verify/Reassess:

- The framework sanity check agrees with the main conclusion: this setup family is not currently high probability.
- Vectorbt is useful as a benchmark, but not a drop-in replacement yet because RALPH currently scores independent setup events while vectorbt models position/capital state and overlapping signals differently.
- Next step is row-level parity: export exact custom trade rows and compare entry/exit timestamps against vectorbt or Freqtrade.

## Dynamic Universe Expansion 2026-08-11

Tomas clarified that the system should not be limited to BTC/ETH. SOL, HYPE, and currently moving larger/mid-sized alts should be covered when data and liquidity justify it.

Implemented `experiments/btc-eth-alert-edge/src/universe.mjs`.

Existing public rails used:

- Binance spot `exchangeInfo` and 24h ticker.
- Binance USD-M futures `exchangeInfo` and 24h ticker.
- Hyperliquid public `metaAndAssetCtxs`.
- CoinGecko trending search as context only.

Current watchlist coverage from the first clean run:

- BTC: Binance spot, Binance USDT perp, Hyperliquid perp.
- ETH: Binance spot, Binance USDT perp, Hyperliquid perp.
- SOL: Binance spot, Binance USDT perp, Hyperliquid perp.
- HYPE: Binance USDT perp and Hyperliquid perp; not Binance spot in the current verified check.

Verify/Reassess:

- Raw movement ranking over-promoted one-venue movers. The selector was tightened so deep stats require watchlist status or multi-venue liquidity.
- Single-venue high-volatility names are retained as `watchOnlyMovers`, not immediately promoted to deep setup stats.
- Stable/quote assets are excluded from directional setup scans.

Output:

- `experiments/btc-eth-alert-edge/results/universe-snapshot.json`
- `experiments/btc-eth-alert-edge/results/universe-summary.md`
