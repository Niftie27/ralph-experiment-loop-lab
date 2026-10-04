---
type: research-note
created: 2026-09-28T10:12:00Z
topic: orderflow-data
status: access-map-active
work_item: investigation.historical-orderflow-data-rails
tags:
  - ralph
  - research-only
  - orderflow
  - historical-data
  - access-verification
  - no-live-trading
related:
  - 2026-09-28-planned-level-proxy-refresh-baseline.md
  - 2026-09-20-atas-manual-orderflow-rail.md
  - 2026-08-30-orderflow-replay-alignment-audit.md
  - ../../core/data-rails.md
  - ../../automation/retrieval-router.yaml
sources:
  - https://github.com/binance/binance-public-data/blob/master/README.md
  - https://data.binance.vision/
  - https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/daily/
  - https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/spot/daily/
  - https://bybit-exchange.github.io/docs/v5/market/recent-trade
  - https://hyperliquid.gitbook.io/hyperliquid-docs/historical-data
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
  - https://docs.tardis.dev/api/http-api-reference
  - https://docs.tardis.dev/downloadable-csv-files
  - https://www.okx.com/en-sg/historical-data
  - https://app.okx.com/docs-v5/en
  - https://crypto-lake.com/data/
  - https://www.kaiko.com/products/l1-l2-data
  - https://www.coinapi.io/products/market-data-api/docs/rest-api
---
# Historical Orderflow Data Rails

Tomas clarified that ATAS exports currently prove parser/schema examples, not a backtestable historical orderflow rail. Real orderflow research needs either historical trade/book data or deliberately captured live/replay windows. This note classifies what is actually usable from the current workspace.

## Access Checks

Checked from the workspace on 2026-09-28:

- Binance spot daily aggTrades ZIP: `https://data.binance.vision/data/spot/daily/aggTrades/BTCUSDT/BTCUSDT-aggTrades-2025-01-01.zip` returned HTTP 200, `content-type: application/zip`, size about 9.8 MB.
- Binance USD-M futures daily aggTrades ZIP: `https://data.binance.vision/data/futures/um/daily/aggTrades/BTCUSDT/BTCUSDT-aggTrades-2025-01-01.zip` returned HTTP 200, `content-type: application/zip`, size about 9.4 MB.
- Binance tested spot `bookDepth` archive path returned HTTP 404. Do not assume historical book-depth ZIPs exist through the same path.
- Bybit V5 recent public trade endpoint worked no-key for `linear/BTCUSDT`, but that endpoint is recent trade history, not deep historical backtest data.
- Bybit historical-data web page was HTTP 403 from this workspace, so treat it as not currently accessible here until another export/API route is verified.
- Hyperliquid `recentTrades` worked no-key for BTC.
- Hyperliquid `l2Book` worked no-key for current BTC order book.
- Hyperliquid historical docs describe requester-pays S3 archives with L2 book snapshots and node fills/trades. This workspace currently has no `aws` CLI and no `lz4`/`unlz4` binary, so the requester-pays historical rail is proposed/needs-tooling, not active.

## Rail Classification

| Rail | Current status | Use |
| --- | --- | --- |
| Binance historical spot/futures `aggTrades` archives | active public/no-key | Best first historical tape rail for BTC/ETH/SOL-style planned-level and post-entry orderflow proxy studies. |
| Binance REST `aggTrades` windows | active public/no-key | Good for bounded exact windows around frozen events; already used by planned-level proxy replay. |
| Binance historical L2/book-depth archive | unverified/not active | Do not build on it until a real archive path or documented source is verified. |
| Bybit recent public trades | active public/no-key but recent-only | Useful for live/recent sanity checks, not long historical backtesting. |
| Bybit historical market data | inaccessible from workspace web path / needs further verification | Watch/proposed; do not mark active until a downloadable route works here. |
| Hyperliquid current public trades/L2 | active public/no-key | Useful for live/current snapshots and small recent checks. |
| Hyperliquid historical S3 L2/trades/fills | needs-tooling/requester-pays | Potentially valuable for HYPE/perp orderflow, but requires AWS requester-pays tooling and cost awareness before use. |
| ATAS manual CSV exports | active manual/HITL examples | Good for parser and manual decision-review packets; not a historical backtest rail unless Tomas exports matching historical/replay windows. |

## 2026-09-28 21:30 UTC Addendum - Deeper Data-Rail Dig

Additional access checks found a better no-key split:

- Binance S3 listing confirms `data/futures/um/daily/` has `aggTrades/`, `trades/`, `bookDepth/`, `bookTicker/`, `metrics/`, mark/index/premium klines, and normal klines.
- Binance S3 listing confirms `data/spot/daily/` has only `aggTrades/`, `trades/`, and `klines/` for the relevant spot rail; no spot `bookDepth/` prefix is advertised.
- Binance USD-M futures `trades` archive for `BTCUSDT` on `2025-01-01` returned HTTP 200, about 15.1 MB.
- Binance USD-M futures `bookDepth` archive for `BTCUSDT` on `2025-01-01` returned HTTP 200, about 463 KB. Sample rows parse as `timestamp,percentage,depth,notional`, e.g. depth/notional at `-5`, `-4`, `-3`, etc. percentage bands. This is not full L2 replay, but it is a useful public historical liquidity-surface proxy for demo-sim/backtest features such as depth thinning, wall/void context, and level-adjacent liquidity regime.
- Binance spot `trades` archive for `BTCUSDT` on `2025-01-01` returned HTTP 200, about 14.0 MB. Spot remains usable for historical tape, not historical book depth.
- Tardis.dev official HTTP API exposes historical raw feeds with channels such as `trade` and `depth`; without an API key, first-day-of-month historical windows are accessible. A no-key sample request for Binance `trade` on `2024-03-01T00:03Z` returned real trade rows. Full historical coverage beyond those samples requires an API key/subscription; current pricing page showed a minimum order of `$300`.
- Bybit current public recent trades still works no-key, but the official docs point historical trade downloads to their website; no reliable deep-history no-key API route was verified from this workspace.
- Hyperliquid current no-key `recentTrades` and `l2Book` still work. Official historical S3 remains useful but needs AWS requester-pays tooling and LZ4 support; this workspace currently has neither `aws` nor `lz4` installed.

### Updated Rail Ranking

| Rank | Rail | Current role |
| ---: | --- | --- |
| 1 | Binance USD-M futures public archives: `trades`/`aggTrades` + `bookDepth` + bookTicker/metrics | Best active no-key rail for backtesting/demo-sim orderflow proxies with both tape and coarse historical liquidity context. |
| 2 | Binance spot public archives: `trades`/`aggTrades` | Best active no-key spot tape rail; use for spot-style planned-level/fill-flow studies, but not book-depth backtests. |
| 3 | Tardis.dev no-key first-day samples | Best benchmark/prototype rail for true historical trade + depth stream replay before deciding whether a paid key is worth it. |
| 4 | Hyperliquid current public API | Best active live/recent snapshot rail for HYPE/perp context; not a historical backtest rail without S3 tooling. |
| 5 | Hyperliquid historical S3 | Potentially strong for HYPE L2 snapshots and fills, but needs requester-pays approval/tooling before active use. |
| 6 | Bybit recent public trades | Recent sanity checks only until a historical website/export route is automated and verified. |

### Recommendation After Addendum

The next useful orderflow branch should be a **Binance USD-M futures archive batch**, not another spot-only planned-level sample. It should stay research-only and produce features for comparison, not watcher gates:

1. Extend the existing archive adapter to support USD-M futures `trades`/`aggTrades` and `bookDepth` daily files.
2. Build a frozen event-window manifest from existing demo-sim/live-alert review rows, prioritizing BTC/ETH/SOL/LINK/ADA rows where futures symbols exist.
3. For each window, compute taker delta/CVD, trade intensity, bookDepth notional around percentage bands, depth-thinning before/after alert, and simple price-progress-per-aggressive-volume.
4. Compare against existing outcomes and the candle-only baseline; do not optimize thresholds.
5. Separately, make a tiny Tardis no-key first-day sample adapter only as a schema/proof benchmark for true `trade + depth` replay, not as a production dependency.

Do not create a recurring orderflow job or feed these features into live alerts/demo-sim until the batch shows stable explanatory lift over candle-only and existing proxy baselines.

## 2026-09-28 21:46 UTC Addendum - Other Rails And Screenshot Interpretation

Additional non-Tardis/non-Binance rails verified at documentation level:

- OKX exposes an official historical market data download surface for tick-level trade history, candlesticks, and order book data, with trade history advertised from September 2021 onward. Its API docs expose current/recent order book and candle endpoints, but historical bulk order book access should be treated as website/download automation to verify before active use.
- Crypto Lake advertises book-derived data types including `level_1` and deeper market data through an API/project surface. Treat as a likely paid/vendor rail until workspace access, coverage, pricing, and license are verified.
- Kaiko advertises historical/live Level 1 and Level 2 data across spot and derivatives, available through API, CSV, and cloud services. Treat as institutional/vendor rail.
- CoinAPI documents historical trades, quotes, L2 order book snapshots, and L3 order book data, plus flat-file bulk historical data. Treat as vendor/API-key rail.
- Binance COIN-M futures is a likely adjacent public archive candidate to verify after USD-M, but USD-M should stay first because it aligns better with the actively traded USDT-perp universe and has already been workspace-verified.

Current practical ranking after this addendum:

1. Active no-key first branch: Binance USD-M futures `trades`/`aggTrades` + `bookDepth`, aligned to frozen demo-sim/live-alert windows.
2. Active no-key spot tape companion: Binance spot `trades`/`aggTrades`, useful when the question is spot-driven selling/buying without historical book depth.
3. Next no-key/public candidate to verify: OKX historical downloads, especially if there is automatable trade + order book access for the same instruments and windows.
4. True replay benchmark: Tardis no-key first-day samples; paid key only if schema proof and explanatory lift justify it.
5. Perp/venue-specific later branch: Hyperliquid historical S3 after explicit requester-pays/tooling approval.
6. Paid institutional/vendor rails: Crypto Lake, Kaiko, CoinAPI. Useful if budget/licensing becomes acceptable, not active by default.
7. Manual visual/export fallback: ATAS. Best for Tomas-reviewed slices, feature inspiration, parser validation, and manual decision packets; not the default scalable historical backtest rail unless Tomas provides replay/export windows or a custom exporter path is approved.

Screenshot interpretation for chr0e post: the claim is not simply "price is different on perp and Binance." It says BTC is dumping with aggressive spot selling while funding turns negative and open interest rises, which implies new perp shorts are entering rather than the move being only a classic long squeeze/liquidation cascade. Negative funding usually points to perp short demand / perp trading below index or spot pressure. Rising OI during a selloff means new positions are being opened; paired with negative funding, the inference is crowded new shorts. That can make the dump dangerous because if spot selling fades, those shorts can become squeeze fuel. For RALPH, this maps to a feature family of spot taker selling + perp OI/funding/basis divergence, not just a single price feed mismatch.

## Earlier Recommendation - Superseded By 21:30 Addendum

The original first-pass recommendation was to start with Binance historical spot/futures `aggTrades`, not ATAS examples and not Hyperliquid S3. The 21:30 addendum above supersedes this: USD-M futures `trades`/`aggTrades` plus `bookDepth` is now the preferred next branch because it adds a verified coarse historical liquidity surface.

Smallest useful branch:

1. Build or reuse a Binance historical aggTrades ZIP fetcher for one symbol/date/window.
2. Align it to frozen planned-level events or existing finalized alert/review timestamps.
3. Derive only simple features first: signed taker delta, CVD slope, aggressive notional near level, fail-back/reclaim, and price progress per aggressive volume.
4. Compare against the new `planned-level-proxy-baseline-check` result, not against intuition.

Do not add a recurring orderflow job until there is a thresholded input stream, such as new frozen event windows, explicit ATAS historical exports, or a validated archive fetcher plus a bounded queue.

## 2026-09-28 Archive Alignment Sample

Implemented the first narrow archive-backed sample in `experiments/strategy-destruction-filter/src/run-planned-level-archive-orderflow-sample.mjs`, reusing the Binance daily `aggTrades` adapter from `experiments/btc-eth-alert-edge/src/binance-aggtrades-archive.mjs`.

Verification:

- Command: `npm run study:planned-level-archive-orderflow --prefix ralph-research-os/experiments/strategy-destruction-filter`
- Output: `experiments/strategy-destruction-filter/results/planned-level-archive-orderflow-sample.json` and `.md`
- Sample: 2 frozen BTCUSDT planned-level windows from `planned-level-proxy-replay.json`, selected from fetched rows with existing nonzero near-level aggressive notional.
- Features: signed taker delta, CVD slope per minute, aggressive notional near planned level, price progress per aggressive volume, and near-level absorption.
- Verdict: `archive_features_sample_ready_no_promotion`
- Existing baseline comparison: planned-level proxy baseline remains `proxy_labels_mixed_no_promotion`; archive labels matched old labels on 1/2 rows; one row flipped from hold/retest to fast-kill because archive last price failed back under the planned level while near-level buy aggression was absorbed.
- Absorption sample: 1/2 rows flagged absorbed near planned level.

Important adapter correction: Binance daily archive booleans are capitalized (`True`/`False`), so the archive adapter now parses booleans case-insensitively. Treat the earlier first-20-trade CVD smoke result as parser-smoke only, not as signed-flow evidence.

Interpretation: this proves reproducible archive-window feature plumbing and exposes a useful mismatch against the old REST-window proxy, but the sample is intentionally far too small and the baseline is still mixed. No watcher-gate, paper-alert, live-alert, or execution change should be proposed from this result.

## 2026-09-28 USD-M DEMO-SIM Archive Batch

Implemented the first tiny USD-M archive-backed DEMO-SIM batch:

- Adapter: `experiments/btc-eth-alert-edge/src/binance-usdm-archive.mjs`
- Runner: `experiments/strategy-destruction-filter/src/run-usdm-orderflow-demo-sim-batch.mjs`
- Script: `npm run study:usdm-orderflow-demo-sim --prefix ralph-research-os/experiments/strategy-destruction-filter`
- Output: `experiments/strategy-destruction-filter/results/usdm-orderflow-demo-sim-batch.json` and `.md`

Verification:

- The adapter fetches public/no-key Binance USD-M daily `trades` and `bookDepth` ZIP archives.
- Important parser correction: `bookDepth` timestamps are string datetimes such as `2026-08-16 00:00:01`, not numeric milliseconds. The adapter now parses both numeric trade timestamps and string book-depth timestamps.
- Important memory correction: the runner parses only the requested window from each daily CSV rather than retaining whole parsed trading days in memory. The first naive 3-window run hit Node heap pressure; the bounded-window parser fixed it.
- Default batch analyzed 3 frozen closed DEMO-SIM rows and joined all 3 to both futures trades and bookDepth rows.
- Verdict: `usdm_archive_features_sample_ready_no_promotion`.
- Tiny sample flags: 2 absorption-proxy rows and 1 liquidity-thinning proxy row. These are plumbing smoke signals only, not evidence of an edge.
- `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` now asserts the USD-M batch remains research-only, no-key, and no-promotion/no-live-change.

Interpretation: USD-M archives are now not just an access finding; this workspace has a reproducible research-only join from frozen DEMO-SIM rows to futures tape plus coarse percentage-band liquidity features. The next expansion, if chosen, should increase the frozen-row manifest and compare against candle-only/proxy baselines. Do not wire these features into demo-sim, live alerts, watcher gates, thresholds, sizing, or execution from the tiny sample.

## 2026-09-29 USD-M DEMO-SIM Broader Frozen Batch

Expanded `experiments/strategy-destruction-filter/src/run-usdm-orderflow-demo-sim-batch.mjs` from a 3-window plumbing sample to the lane-requested 30-window frozen manifest.

Verification:

- Command: `USDM_ORDERFLOW_BATCH_WINDOWS=30 npm run study:usdm-orderflow-demo-sim --prefix ralph-research-os/experiments/strategy-destruction-filter`
- Output: `experiments/strategy-destruction-filter/results/usdm-orderflow-demo-sim-batch.json` and `.md`
- Verifier: `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`
- Runtime fix: the broader run exposed a V8 argument-stack limit from spread-pushing large trade arrays. The runner now appends parsed rows with a loop, preserving bounded-window parsing while scaling beyond the tiny sample.

Result:

- Verdict: `usdm_archive_features_broader_sample_ready_no_promotion`
- Requested/analyzed windows: `30/30`
- Rows with both futures trades and bookDepth: `30/30`
- Positive/negative existing DEMO-SIM outcome rows: `12/18`
- Absorption-proxy rows: `22`
- Liquidity-thinning proxy rows: `7`

Descriptive feature/outcome split:

| Slice | Rows | Win rate | Mean R | Median R | Net PnL USD |
| --- | ---: | ---: | ---: | ---: | ---: |
| all | 30 | 40.00% | -0.0016 | -1.0482 | 24.18 |
| absorptionProxy=true | 22 | 54.55% | 0.4023 | 1.1994 | 1630.84 |
| absorptionProxy=false | 8 | 0.00% | -1.1122 | -1.0770 | -1606.66 |
| liquidityThinningProxy=true | 7 | 0.00% | -1.0718 | -1.0634 | -1251.01 |
| liquidityThinningProxy=false | 23 | 52.17% | 0.3241 | 0.9593 | 1275.20 |
| alignedAggressiveFlow=true | 26 | 46.15% | 0.1750 | -1.0469 | 926.69 |
| alignedAggressiveFlow=false | 4 | 0.00% | -1.1493 | -1.0842 | -902.51 |

Same setup/regime descriptive bucket highlight:

- `range_breakout_long|long|up/mid-vol`: 16 rows; flagged rows mean R `0.3604`; unflagged mean R `-1.0474`.

Interpretation:

- This is the first useful USD-M futures tape + coarse liquidity-surface comparison against existing DEMO-SIM outcomes, not just an access/plumbing result.
- The absorption proxy is directionally interesting in this frozen slice, but the sample is clustered by date, setup, and regime, and reuses existing DEMO-SIM replay outcomes.
- The liquidity-thinning proxy is currently a warning flag, not an entry-support flag, in this sample.
- No MFE/MAE, fill modeling, threshold optimization, live/paper/demo gate, sizing, TP/SL, or execution logic was introduced.
- Next useful step is a less clustered manifest or a purged comparison against same setup/regime rows before any broader claim.

## Boundary

No scheduler beyond the separately approved alert-edge cron repair, no live alerts/watchers, no account/key/API credential, no paid service, no public posting, no sizing, no TP/SL, no execution, and no strategy promotion changed.
