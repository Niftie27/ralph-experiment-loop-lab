---
type: research-note
date: 2026-09-20
tags:
  - ralph
  - atas
  - orderflow
  - manual-hitl
  - data-rail
related:
  - ../../core/data-rails.md
  - 2026-09-20-atas-automation-access-audit.md
  - 2026-08-11-orderflow-feature-taxonomy.md
  - 2026-08-11-trader-grade-ta-orderflow-tool-stack.md
  - ../../outputs/atas-access-audit.md
status: active-manual-hitl
---

# ATAS Manual Orderflow Rail

Status: `active-manual-hitl`, research-only. This rail is usable when Tomas manually exports CSV files from ATAS X widgets and sends them into the workspace. It is not an automated local feed and does not imply live trading, execution, account/key handling, paid API change, alert wording change, or strategy promotion.

## Confirmed Access Path

ATAS X Start/Beta chart export is not enough: chart/statistic-row exports named `Volume`, `Delta`, or `Session_delta` were verified as the same OHLC schema, not real statistic exports.

Confirmed usable path:

1. Open ATAS X.
2. Use the top tab `+`.
3. Select `New Widget`.
4. Open `Bid/Ask Tape`.
5. Right-click/export/save CSV from the Bid/Ask Tape rows.

Observed complementary path:

1. Use `+ -> New Widget -> Smart Tape`.
2. Export/save CSV.

Smart Tape currently exports only `Time;Price;Volume` in the sample, so it is simpler than Bid/Ask Tape and should be treated as supplemental unless settings can expose side/aggressor/delta columns.

## Sample Verification

Working samples received from Tomas on 2026-09-20:

- `Bid_Ask_tape---da21c681-9d44-4ad8-967e-620a4337a619.csv`
- `Smart_tape---49ead761-c641-43c2-9479-14bd2a812773.csv`

Local checks:

| Export | Rows | Schema | Time range | Notes |
| --- | ---: | --- | --- | --- |
| Bid/Ask Tape | 4,199 data rows + header | `Time;Bids;;;;Ask;Delta` | `09:46:49..10:39:58` | Bid price, bid size, ask size, ask price, running/cumulative delta. One minor out-of-order timestamp jump around `10:36:49 -> 10:37:10`; parser should normalize by time and preserve original row index as tiebreaker. |
| Smart Tape | 79 data rows + header | `Time;Price;Volume` | `10:40:28..10:41:27` | Compact print tape only; 23 zero-volume rows and one blank price/volume row in the sample. |

Bid/Ask sample aggregate checks:

- Bid-side size sum: `925.406`
- Ask-side size sum: `968.311`
- Delta range: `-163.438..65.223`

Smart Tape sample aggregate checks:

- Volume sum: `43.57`
- Max visible print row: `10:41:17;80294.5;18.11`

Additional samples received later on 2026-09-20:

- `Bid_Ask_tape_3---e4820f4f-b8d8-49ba-8110-a8b4bc781c1e.csv`
- `Smart_tape_3---eb29a04f-4683-40f4-8c8d-1df0e17930cb.csv`
- `Bid_Ask_tape_4_CLassic---4dce2f84-d104-437d-b124-6c6cf33a3bb9.csv`
- `Bid_Ask_Classic_2---d3089fa9-cfe1-48fe-961b-bb08ef8f5912.csv`
- `All_prices_Classic---2331c19f-e1b4-4d7d-a5a1-ab5874b9263b.csv`
- `Classic_All_Prices---694b61dd-d970-4fb9-932f-00202dc7084d.csv`
- `Chart_Classic_2---caca0a5d-e6de-44c6-a672-3c34adc3a1e3.csv`

Raw Classic follow-up evidence was archived under `../../raw/atas-manual-exports/2026-09-20/classic-followup-1552/`.

The later 15:02 UTC Classic follow-up evidence was archived under `../../raw/atas-manual-exports/2026-09-20/classic-followup-1502/`.

Later ATAS screenshots from the same day were archived under `../../raw/atas-manual-exports/2026-09-20/atas-screenshots-1430/`.

Latest ATAS X ZIP follow-up from 2026-09-20 15:38 UTC was archived under `../../raw/atas-manual-exports/2026-09-20/atasx-followup-1538/` after extracting Tomas's `Documents---99a79cb5-13fa-4adf-b071-aa11619351e2.zip`.

Local checks:

ATAS X ZIP follow-up:

- `All_prices_ATASX.csv`: 6,059 data rows, schema `Price;Volume;Trades;Bid;Asks;Delta`, price range `80095.9..81294.9`, total volume `52943.020`, trades `1,109,159`, bid `26981.378`, asks `25961.642`, net delta `-1019.736`.
- Top ATAS X All Prices volume levels: `80300.0` volume `667.791`, `80500.0` volume `587.978`, `80400.0` volume `394.567`, `80620.0` volume `201.507`, `80475.0` volume `195.866`.
- `Bid_Ask_ATASX.csv`: 9,286 data rows, schema `Time;Bids;;;;Ask;Delta`, time range `16:41:16..17:33:11`, bid-side sum `1809.677`, ask-side sum `2306.228`, net ask minus bid `496.551`, delta range `-61.211..720.364`, price range `80570.5..80910.1`.
- Largest ATAS X Bid/Ask combined side-size rows include `17:07:08` at bid price `80882.8`, ask size `96.732`, ask price `80883.0`, delta `669.666`; `17:19:41`, bid size `69.108`, ask price `80840.1`, delta `645.548`; and `16:44:04`, ask size `59.515`, ask price `80590.2`, delta `-1.696`.
- `Smart_Tape_ATASX.csv`: 1,951 data rows, schema `Time;Price;Volume`, time range `17:20:00..17:33:31`, volume sum `718.69`, price range `80623.2..80809.7`, one blank price/volume row, 497 zero-volume rows. Top print rows: `17:27:34;80743.7;40`, `17:27:59;80700.8;37.46`, and `17:29:31;80630.0;32.08`.

Interpretation: this ATAS X ZIP proves ATAS X can export all three useful manual rails: Bid/Ask Tape, Smart Tape, and All Prices. ATAS X All Prices is the same useful price-level distribution class as Classic All Prices, and ATAS X Bid/Ask Tape is a longer and richer time-sequenced orderflow sample than several earlier packets. This strengthens ATAS X as the default manual rail.

Latest Classic 15:02 UTC batch:

- `Classic_All_Prices`: 6,963 data rows, schema `Price;Volume;Trades;Bid;Asks;Delta`, price range `80095.9..81294.9`, total volume `53390.850`, bid `27215.591`, asks `26175.259`, net delta `-1040.332`.
- Top volume levels: `80300.0`, `80500.0`, `80400.0`, `80620.0`, `80475.0`.
- Top 100-price bands by volume: `80400`, `80300`, `80500`, `80200`, `80600`.
- `Chart_Classic_2`: 1,042 5m OHLC rows, no volume/delta columns, timestamp format observed as `YYYY-DD-MM HH:MM:SS`, range `2026-09-17 02:00:00..2026-09-20 16:50:00`, low/high `75980.0..81940.0`.

Interpretation: the newer All Prices export is a larger price-level distribution rail; the chart export gives broad price history but does not replace Bid/Ask Tape or a read-only ATAS exporter for time-sequenced orderflow.

| Export | Rows | Schema | Time range | Notes |
| --- | ---: | --- | --- | --- |
| Bid/Ask Tape 3 | 4,515 data rows + header | `Time;Bids;;;;Ask;Delta` | `09:46:49..11:07:04` | Same useful Bid/Ask Tape structure as prior samples. File is reverse chronological except one adjacent jump around `10:36:49 -> 10:37:10`; preserve row index before sorting. |
| Smart Tape 3 | 1,837 data rows + header | `Time;Price;Volume` | `10:52:16..11:07:05` | Larger supplemental print sample. Contains one blank price/volume row, 377 zero-volume rows, and one adjacent ordering jump at the first rows (`11:07:04 -> 11:07:05`). |

Bid/Ask Tape 3 aggregate checks:

- Bid-side size sum: `1722.685`
- Ask-side size sum: `1836.674`
- Net ask minus bid size: `113.989`
- Delta range: `-175.663..114.220`
- Largest ask-side event: `11:06:25`, bid price `80282.9`, bid size `2.408`, ask size `89.576`, ask price `80283.0`, delta `114.220`
- Largest bid-side event: `09:58:45`, bid price `80330.9`, bid size `126.784`, ask size `0`, ask price `80331.1`, delta `-155.957`

Smart Tape 3 aggregate checks:

- Volume sum: `610.39`
- Max print row: `11:07:04;80283.0;83.98`
- Top second by Smart Tape volume: `11:07:04`, total volume `86.06`, 15 rows, price range `80283.0..80300.0`
- The `11:07:04` Smart Tape max print aligns with the high ask-side Bid/Ask Tape event at `80283.0` around `11:06:25`. Treat this as a prime matching case for absorption/exhaustion/breakout-quality feature design, but remember these manual exports have only second-level timestamps and may be shown/saved with widget-specific aggregation or ordering.

Classic ATAS screenshot/export follow-up:

- Tomas opened Classic ATAS `8.0.14.399-latest` and shared screenshots of the Home ribbon plus floating Bid/Ask Tape and Smart Tape widgets.
- Classic Home exposes the same relevant widget family as ATAS X: `Smart DOM`, `Smart Tape`, `Bid/Ask Tape`, `All Prices`, `Heatmap`, and chart modules. This does not by itself prove better exportability than ATAS X.
- The Classic Smart Tape context menu visible in the screenshot contains `Freeze`, `Layouts`, `Clone window`, `Reset`, and `Settings...`; no `Export` / `Save to file` option is visible there. Treat Smart Tape export as unconfirmed/unavailable in Classic unless another menu or settings path appears.
- The Classic Smart Tape UI itself is richer than the ATAS X sample export: visible columns include `Time`, `Price`, `+/-`, `Volume`, `Bid`, `Asks`, `Sizes`, and `Avg`. This may be useful visually, but it is not yet a data rail without export/API access.
- `Bid_Ask_tape_4_CLassic` has the same `Time;Bids;;;;Ask;Delta` schema as ATAS X Bid/Ask Tape, but the received file has only 12 data rows over `15:28:46..15:29:31`. Bid-side sum is `16.183`, ask-side sum is `7.874`, net ask minus bid is `-8.309`, and delta range is `-8.309..4.115`.
- Largest Classic Bid/Ask Tape 4 event by combined side size: `20.09.2026 15:29:06`, bid price `80490.0`, bid size `10.213`, ask size `0.166`, ask price `80490.1`, delta `-6.307`. Largest ask-side row: `20.09.2026 15:28:46`, bid price `80490.0`, bid size `1.823`, ask size `5.341`, ask price `80490.1`, delta `3.518`.
- `Bid_Ask_Classic_2` has the same `Time;Bids;;;;Ask;Delta` schema and is the first useful Classic longer-buffer check. It has 153 data rows over `15:28:46..15:47:43`, bid-side sum `270.692`, ask-side sum `421.677`, net ask minus bid `150.985`, latest/ending delta `150.985`, earliest delta `3.518`, and delta range `-102.358..159.050`.
- Largest `Bid_Ask_Classic_2` combined side-size rows include `15:43:21` at bid price `80480.5`, bid `10.014`, ask `23.218`, ask price `80480.6`, delta `77.674`, total side size `33.232`; `15:36:02` at bid price `80422.2`, bid `27.322`, ask `2.976`, ask price `80422.3`, delta `-95.425`, total `30.298`; and `15:42:50` at bid price `80465.6`, bid `0.876`, ask `26.231`, ask price `80465.7`, delta `64.470`, total `27.107`.
- `All_prices_Classic` exports `Price;Volume;Trades;Bid;Asks;Delta`. It has 5,419 usable rows, price range `80095.9..81294.9`, total volume `47330.804`, bid `24480.895`, asks `22849.909`, net delta `-1630.986`, and `971833` trades.
- Top `All_prices_Classic` volume levels: `80300.0` volume `667.791`, trades `4221`, bid `377.794`, asks `289.997`, delta `-87.797`; `80500.0` volume `548.811`, trades `4088`, bid `435.994`, asks `112.817`, delta `-323.177`; `80400.0` volume `361.750`, trades `4257`, bid `183.224`, asks `178.526`, delta `-4.698`; `80620.0` volume `196.594`, delta `-192.404`; `80475.0` volume `195.825`, delta `-112.285`; `80450.0` volume `172.570`, delta `47.786`.
- Working comparison: Classic now proves it can export at least a longer accumulated Bid/Ask Tape buffer and an `All Prices` price-level distribution. It still has not proven a selected historical/replay export, and Smart Tape export remains unconfirmed. Keep ATAS X Bid/Ask Tape as the default manual rail unless Classic's All Prices distribution becomes specifically useful for a level/context workflow.

## Replay And Historical Slice Status

ATAS X has a visible `Replay` entry in the New Widget menu from Tomas's earlier screenshot. That confirms a Replay UI surface exists in ATAS X, but it does not yet prove that Bid/Ask Tape can export a selected replay/historical slice.

The official technical docs support two relevant implementation paths:

- `OnCalculate` is called for each historical bar and then on each tick, so an indicator can calculate over loaded chart history.
- `RequestForCumulativeTrades` plus `OnCumulativeTradesResponse` can request historical cumulative trades for a specified start/end time period.

Practical interpretation: manual replay-export capability is still unknown; C# exporter/historical-cumulative-trades capability looks plausible from the docs, subject to feed/provider support and exact runtime testing inside ATAS. For Tomas's manual testing, the useful check is not "wait randomly and send more"; it is whether ATAS X or Classic can load Replay/Historical Mode for a chosen window and then let `Bid/Ask Tape` or `All Prices` export that selected window.

Update from Tomas's 2026-09-20 ATAS screenshots:

- The ATAS ribbon exposes `Replay`, but `Market Replay` is gated on the current plan. The modal says the current `Start` subscription does not allow Market Replay and presents `Plus`, `Pro`, and `Ultra` as eligible plans, plus a 14-day free trial. This blocks manual replay-slice validation for now unless Tomas explicitly trials/upgrades.
- The connections/data-provider dialog shows real crypto providers under `Crypto`, including `Binance`, `Bitfinex`, `Bitget`, `BitMEX`, `Bybit`, `Kraken`, `OKX`, `Phemex`, and `Whitebit`, plus simulators/delayed feeds. The left connection list shows `Crypto Sim`, `ATAS Sim (15-min delayed)`, `dxFeed (15-min delayed)`, and `Binance` connected/available. Treat this as Tomas-machine UI access, not automated workspace access.
- The chart screenshot labels the instrument as `BTCUSDT@BinanceFutures`, strengthening the assumption that Tomas's ATAS context can inspect Binance/BinanceFutures BTCUSDT orderflow through the UI.

ATAS X vs Classic replay clarification after the 15:38 UTC ZIP:

- ATAS X: Replay is visible in the UI, but Market Replay is blocked on Tomas's current `Start` subscription, so replay-export testing remains `needs-access/subscription-gated`.
- Classic: current screenshots and CSV evidence do not prove a Replay entry/export path in Classic. Treat Classic replay as `not-visible/unverified`, not as a confirmed absence across all Classic builds.
- Short exports are not proof of no history/replay. The very short 12-row `Bid_Ask_tape_4_CLassic` was Classic; the first small 79-row Smart Tape sample was ATAS X. Shortness means the widget/export contained only a short live/current buffer at save time unless a historical/replay-selected source is explicitly verified.
- Practical decision: do not rely on Replay for the current RALPH rail. Use ATAS X manual exports now, public no-key historical fetchers for backtests, and C# historical cumulative-trade requests/exporter later if Start/runtime access is verified.

## Visual Widgets And Feature Inspiration

Tomas's 2026-09-20 screenshots show additional ATAS widgets under the `Widgets` ribbon:

- `Market Pressure`
- `Price Change`
- `DOM Pressure`
- `Delta Divergence`

`Market Pressure` displays aggressive buys versus aggressive sells as a visual panel. In the screenshot, the context menu offers `Clone window`, `Layouts`, and `Topmost`; no `Export` / `Save to file` path is visible. Treat it as visual context and feature inspiration, not an active CSV rail.

`Delta Divergence` displays multi-window delta/price divergence states over `5s`, `15s`, `30s`, `1m`, `5m`, `10m`, and `20m`. In the screenshot, it marks `5m` and `10m` as `BEAR`, while `20m` remains `OK`. This is directly relevant to RALPH's proposed confirmation features: delta velocity, cross-horizon divergence, exhaustion, and breakout-quality scoring. It is not yet a data rail until export/API access is verified.

## Working Interpretation

Bid/Ask Tape is the primary ATAS export for RALPH orderflow review because it carries bid/ask side sizes and delta. Smart Tape is useful for compact trade/print context, but the current export lacks side/aggressor/delta fields.

Treat the raw Bid/Ask Tape rows as event/tape rows, not candles. For analysis, derive compact windows rather than dumping raw CSV into prompts:

- CVD/delta change over the selected window
- large bid/ask prints near local highs/lows
- bid/ask size imbalance around sweep or rejection levels
- absorption candidates: strong one-sided size with little price progress
- exhaustion candidates: large prints into a level followed by failed continuation
- alignment with chart levels: PDH/PDL, VWAP, session high/low, range edges, and alert levels

## Proposed HITL Capture Protocol

Use a hybrid manual ATAS capture protocol. No single regime is excluded; choose capture mode by decision pressure, market regime, and what RALPH is trying to learn.

Decision/urgent mode:

- before entering or evaluating a live discretionary trade idea
- after a fast move into an important level
- after a sweep of prior high/low or obvious liquidity level
- when price reaches planned support/resistance/VWAP/session levels
- when a RALPH alert/setup fires and Tomas wants orderflow context
- during a suspected absorption or exhaustion pattern

Default packet for urgent decisions:

1. 3-5 minute `Bid/Ask Tape` CSV centered on the decision point.
2. One screenshot with the relevant level, price action, and ATAS context visible.
3. One sentence stating the question, for example: `breakout acceptance or absorption?`

Review mode:

1. Screenshot of the chart with levels visible.
2. `Bid/Ask Tape` CSV covering at least 15-30 minutes.
3. Optional `Smart Tape` CSV for the same period if it can be exported easily.
4. Instrument, connector/exchange route, local timezone, and approximate reason for capture.
5. If possible, include the current timeframe and whether chart mode is candles, clusters, footprint, or another ATAS mode.

Research/training mode:

1. 30-60 minute `Bid/Ask Tape` export around a clean move, range day, breakout attempt, failed breakout, or high-liquidity session.
2. Matching screenshot(s) before/after the key move if available.
3. Optional `Smart Tape` and `All Prices` exports for schema comparison and feature discovery.

The core purpose is better decisions in critical moments at important levels: orderflow should help distinguish absorption, sweep/fakeout, breakout acceptance, exhaustion, and aggressive continuation. For higher-timeframe structure, OHLC and regime analysis can still work; for short-horizon entries and level decisions, orderflow is a necessary context layer.

Until automated ATAS access is verified, treat Tomas-provided exports as the active path. Continue separately auditing whether ATAS exposes an API, local files, logs, database, plugin bridge, or export automation that the workspace can safely access.

Automation audit update: as of 2026-09-20, the safest promising route is a read-only ATAS custom indicator/exporter writing append-only local JSONL/CSV from inside ATAS; direct external pull remains unverified. Preserve volume velocity as the screening trigger and connect it to ATAS confirmation metrics: delta velocity, bid/ask-side velocity, volume-per-price-progress, absorption score, exhaustion score, and breakout quality score.

## Parser Requirements

The ATAS parser should:

- strip BOM/CRLF where present
- parse semicolon-delimited rows
- tolerate blank rows and blank price/volume rows
- preserve original row index
- normalize timestamps and sort only after preserving original row order
- classify Bid/Ask Tape and Smart Tape by header, not filename
- produce compact Markdown/JSON summaries suitable for Claude/RALPH review
- never treat this rail as execution advice by itself

## Relationship To Public Orderflow Rail

The existing public/free orderflow rail remains useful for automated capture and replay alignment. ATAS adds trader-grade manual snapshots that can validate whether public-proxy features miss relevant tape context visible in a professional UI.

Current status:

- Public exchange orderflow: `active-public-proxy`, automation-friendly, lower UI/context richness.
- ATAS manual export: `active-manual-hitl`, richer trader interface, requires Tomas to export files.

Next validation should compare ATAS-derived summaries against existing public orderflow features around the same market window before promoting any new strategy claim.
