# Data Rails

Data rails are candidate source systems. They must prove they save research time or improve evidence quality.

## Arkham

Primary use: wallet/entity intelligence.

Unknowns:

- label quality
- coverage
- entity context
- exportability
- API access
- cost
- advantage over raw on-chain data

## Nansen

Primary use: wallet/entity/context intelligence.

Unknowns:

- exportability
- cost
- unique labels
- coverage versus Arkham and raw data

## Dune

Primary use: queryable research and reproducible dashboards.

Unknowns:

- query availability
- freshness
- API/export fit
- whether it can support repeatable RALPH experiments

## DefiLlama

Primary use: protocol, TVL, stablecoin, yield, fees, and macro DeFi context.

Status: active public context rail. On 2026-08-30, `https://api.llama.fi/v2/chains` returned HTTP 200 from this workspace without a key. Use for battlefield/context labels, not trade timing.

Unknowns:

- API freshness
- coverage gaps
- suitability as battlefield context

## Public Exchange Orderflow

Primary use: short-horizon orderflow context for high-probability trade research, alert review, and strategy falsification.

Initial no-key sources:

- Binance public WebSocket: trade, aggregate trade, book ticker, diff depth, and partial depth streams for BTC/ETH/SOL spot and futures.
- Hyperliquid public WebSocket: `trades`, `l2Book`, `bbo`, `allMids`, candles, and active asset context.
- Bybit public WebSocket: public trades and orderbook snapshot/delta streams for spot/linear markets.

Status: active public proxy rail. On 2026-08-30, Binance spot `exchangeInfo`, Bybit v5 public `instruments-info`, and Hyperliquid public `info` probes returned HTTP 200 from this workspace without trading credentials.

HYPE-specific access update: on 2026-08-31, no-key live probes returned HYPE L2 snapshots from Hyperliquid `l2Book`, Binance USD-M futures `HYPEUSDT` depth, and Bybit linear `HYPEUSDT` orderbook. Basic L2 access is therefore `active-public-proxy`; the unresolved problem is capture/replay alignment around alert timestamps and whether L2-derived absorption beats price-only alert review. See `wiki/notes/2026-08-31-hype-l2-access-routes.md`.

Derived signals to test before any trading use:

- signed taker volume / CVD proxy
- orderbook imbalance near top of book
- spread and liquidity shock
- absorption after fast move
- sweep/exhaustion patterns
- post-alert follow-through versus fade context

Storage rule:

- raw ticks/deltas go to a local database or compressed JSONL, not the RALPH wiki
- compact features and run summaries go to Obsidian-friendly markdown
- `monitor-index.yaml`/SQLite-style indexes are the default agent read path

Unknowns:

- retention size and sampling level
- whether spot orderflow is enough or perps are required
- cross-exchange lead/lag value
- survivorship/overfit risk in small alert samples
- replay alignment with backtest candles and fees

Workspace evidence route:

- Use `wiki/notes/2026-09-01-workspace-evidence-routing-map.md` before broad filesystem scans.
- Use `../crypto-updates/orderflow-index.yaml` and `../crypto-updates/wiki/orderflow/replay-alignment.md` before raw orderflow databases or JSONL.
- Treat saved captures as pipeline evidence until exact symbol/time overlap exists with finalized alert reviews.

Backtest inventory update on 2026-09-20: split RALPH backtesting into price/volume, trade-print, orderflow-ish, footprint/volume-at-price, widget-state, and live-capture/forward-test categories. Default next loop is to fetch/verify as much useful no-key public historical data as practical, then derive proxies only when direct data is unavailable and label them as proxy-derived. See `wiki/notes/2026-09-20-ralph-backtest-data-inventory.md`.

Verified inventory update on 2026-09-20 15:35 UTC: local usable evidence now includes `crypto-updates` public orderflow SQLite/CSV captures, ATAS manual Bid/Ask Tape and Classic All Prices/Chart CSVs, and Zela feed-latency benchmark data. Current no-key probes returned data from Binance spot/futures klines, aggTrades, and depth; Bybit linear klines/recent trades; and Hyperliquid `l2Book`. Build the next rail from public historical fetchers, public live capture, ATAS manual import, and a unified feature-window schema. ATAS `RalphOrderflowExporter` is docs-supported but runtime-plan gated until Tomas confirms current Start setup can load custom indicators. See `wiki/notes/2026-09-20-ralph-backtest-data-inventory.md` and `wiki/notes/2026-09-20-ralph-orderflow-exporter-v0-design.md`.

## ATAS Manual Orderflow Export

Primary use: trader-grade manual Bid/Ask Tape snapshots for discretionary review, RALPH orderflow context, and public-proxy feature validation.

Status: active manual HITL rail. On 2026-09-20, Tomas verified an ATAS X Start/Beta path through `+ -> New Widget -> Bid/Ask Tape -> export/save CSV`. Earlier chart/statistic-row exports named `Volume`, `Delta`, and `Session_delta` were verified as OHLC-only and not usable as actual orderflow exports.

Confirmed sample schemas:

- Bid/Ask Tape: `Time;Bids;;;;Ask;Delta`, with bid price, bid-side size, ask-side size, ask price, and running/cumulative delta. Use as the primary ATAS orderflow export.
- Smart Tape: `Time;Price;Volume`. Use as supplemental print/tape context unless settings expose side/aggressor/delta columns.

Latest sample check on 2026-09-20: `Bid_Ask_tape_3` has 4,515 rows over `09:46:49..11:07:04`, bid-side sum `1722.685`, ask-side sum `1836.674`, and delta range `-175.663..114.220`. `Smart_tape_3` has 1,837 rows over `10:52:16..11:07:05`, volume sum `610.39`, and a max print `11:07:04;80283.0;83.98`. The largest Smart Tape print aligns with a large Bid/Ask Tape ask-side event near `80283.0`; use this as a first matching case for absorption/exhaustion/breakout-quality feature design.

Classic comparison update on 2026-09-20: Classic ATAS screenshots show the same relevant widget family (`Smart Tape`, `Bid/Ask Tape`, `All Prices`, `Heatmap`) and Classic Smart Tape has richer visible columns, but its visible context menu lacks `Export` / `Save to file`. The first received Classic Bid/Ask Tape CSV had the same schema as ATAS X Bid/Ask Tape but only 12 rows over `15:28:46..15:29:31`. A later Classic Bid/Ask export, `Bid_Ask_Classic_2`, has 153 rows over `15:28:46..15:47:43`, bid-side sum `270.692`, ask-side sum `421.677`, net ask minus bid `150.985`, and delta range `-102.358..159.050`. This proves Classic can export a longer accumulated Bid/Ask Tape buffer, but not yet a selected historical/replay slice.

All Prices Classic update on 2026-09-20: `All_prices_Classic` exports a price-level distribution schema `Price;Volume;Trades;Bid;Asks;Delta` with 5,419 rows, total volume `47330.804`, bid `24480.895`, asks `22849.909`, net delta `-1630.986`, and price range `80095.9..81294.9`. Treat it as a session/current-day price-distribution rail for HVN/LVN, price-level delta, and absorption-zone context, not as a time-sequenced tape replacement.

Second All Prices / Chart Classic batch on 2026-09-20: `Classic_All_Prices` has 6,963 rows, total volume `53390.850`, bid `27215.591`, asks `26175.259`, net delta `-1040.332`, and price range `80095.9..81294.9`. Top volume levels include `80300.0`, `80500.0`, `80400.0`, `80620.0`, and `80475.0`; top 100-price bands are `80400`, `80300`, `80500`, `80200`, and `80600`. `Chart_Classic_2` has 1,042 5m OHLC rows over `2026-09-17 02:00:00..2026-09-20 16:50:00`, but no volume/delta columns. It is useful for price-history context, not orderflow. Raw files are archived under `../raw/atas-manual-exports/2026-09-20/classic-followup-1502/`.

ATAS X ZIP follow-up on 2026-09-20: Tomas sent `Smart_Tape_ATASX.csv`, `Bid_Ask_ATASX.csv`, and `All_prices_ATASX.csv`; extracted under `../raw/atas-manual-exports/2026-09-20/atasx-followup-1538/`. `Bid_Ask_ATASX` has 9,286 rows over `16:41:16..17:33:11`, bid-side sum `1809.677`, ask-side sum `2306.228`, net ask minus bid `496.551`, delta range `-61.211..720.364`, and price range `80570.5..80910.1`. `Smart_Tape_ATASX` has 1,951 rows over `17:20:00..17:33:31`, volume sum `718.69`, and top prints including `17:27:34;80743.7;40`. `All_prices_ATASX` has 6,059 rows, total volume `52943.020`, bid `26981.378`, asks `25961.642`, net delta `-1019.736`, and the same `80095.9..81294.9` price range as Classic All Prices. This strengthens ATAS X as the default manual rail because it now proves Bid/Ask Tape, Smart Tape, and All Prices exports.

ATAS X access/update on 2026-09-20: screenshots confirm the ATAS ribbon exposes real/live providers including Binance alongside simulators/delayed feeds, but this is UI access on Tomas's machine, not workspace automation. Market Replay exists as a UI feature but is gated on the current `Start` plan; the modal says the current plan does not allow Market Replay and offers `Plus`, `Pro`, or `Ultra` / trial. Treat manual replay-export testing as blocked by subscription unless Tomas chooses to trial/upgrade. `Market Pressure` and `Delta Divergence` widgets are useful visual/feature-inspiration surfaces, but no export path is visible from the screenshots.

Replay clarification: ATAS X has a visible Replay UI surface but Start blocks Market Replay. Classic screenshots so far do not prove Replay is available in Classic; classify Classic replay as `not-visible/unverified`, not globally impossible. Current RALPH should not depend on Replay.

Operational rule:

- Do not assume the workspace can pull ATAS automatically. This rail is active only through Tomas-provided CSVs and screenshots.
- Use a hybrid manual capture regime: 3-5 minute urgent packets for live decision points, 15-30 minute review packets around setups/alerts/levels, and 30-60 minute research packets around clean moves for parser/training work.
- The main value is improving critical decisions at important levels: absorption, sweeps/fakeouts, breakout acceptance, exhaustion, and aggressive continuation. Higher-timeframe structure can use OHLC/regime data, but short-horizon entry decisions need orderflow context.
- Store raw large CSVs outside the wiki; summarize schemas, aggregate checks, and decisions in Obsidian-friendly notes.
- Parser should classify by header, preserve original row index, tolerate blank rows/zero-volume rows, and normalize/sort timestamps carefully.
- Keep a separate access audit open for whether ATAS can be queried automatically through an API, local data files, logs, database, plugin bridge, or safe export automation. Until verified, classify automated ATAS fetch as unproven.

See `wiki/notes/2026-09-20-atas-manual-orderflow-rail.md`.

Automation audit update: direct ATAS pull from this workspace remains unproven because no local ATAS install/process/export folder is currently reachable. The preferred automation route is a read-only ATAS custom indicator/exporter inside ATAS that writes append-only JSONL/CSV feature windows; a watched manual export folder is the fallback bridge. Classic ATAS is Windows/WPF, while ATAS X is cross-platform, but ATAS docs indicate a simple no-custom-UI indicator DLL should be portable if built for the installed .NET runtime. Prefer ATAS X first because Tomas already verified usable exports there and ATAS positions X as the faster/current platform; use Classic only if X lacks a needed module/export path. Keep volume velocity as the screening/trigger layer and use ATAS-derived delta velocity, bid/ask-side velocity, volume-per-price-progress, absorption score, exhaustion score, and breakout quality score as confirmation features. See `wiki/notes/2026-09-20-atas-automation-access-audit.md`, `wiki/notes/2026-09-20-atas-classic-vs-x-exporter-plan.md`, and `wiki/notes/2026-09-20-atas-x-speed-and-data-surface.md`.

Exporter gate update on 2026-09-20: official ATAS docs and public API copy support custom C# indicator development, candles, footprint/cluster price levels, online ticks, cumulative trades, historical cumulative-trade requests, and market depth callbacks. Current ATAS pricing confirms Start is free with ATAS X, real-time crypto exchange access, one active crypto connection, basic indicators, three indicators per chart, and no Market Replay; it does not explicitly verify custom DLL loading on Start. Therefore exporter code remains `gated-design` until Tomas confirms `Add custom indicator` in his current setup and provides the runtime target. See `wiki/notes/2026-09-20-ralph-orderflow-exporter-v0-design.md`.

## Raw On-Chain

Primary use: baseline and source of truth.

Unknowns:

- time-to-answer
- infra needs
- labeling burden
- replay feasibility

## Copytrading / Wallet Following

Primary use: candidate account, cohort, and prior-art discovery without reinventing existing copytrading tooling.

Verified no-key route:

- Hyperliquid official `info` endpoint: local probes returned `meta`, `spotMeta`, `userFills`, and `clearinghouseState` without a key. Use it for read-only account/fill snapshots and independent evidence checks on already discovered addresses.

Watch/manual routes:

- Hyperliquid leaderboard
- HypurrScan
- HyperDash
- ASXN Hyperscreener
- HyperTracker / CoinMarketMan
- Copin, HyperX, Dexly, and similar copytrading products as prior-art/reference UX

Needs-access routes:

- Dune API
- Arkham API
- Nansen API
- paid or account-gated product exports

Unknowns:

- whether public dashboards expose enough candidate addresses without paid accounts
- whether candidate export/API access is available under Tomas's cost constraints
- leaderboard survivor bias
- hidden hedges and multi-account behavior
- latency/cost/slippage/capacity survival
- exit-shadowing for slow accumulator cohorts

Storage rule:

- candidate/account rows go to `decisions/copytrading-watch-ledger.md`
- durable synthesis goes to `wiki/notes/`
- raw API pulls should stay out of the wiki unless summarized
- no keys, wallets, paid APIs, live copy settings, sizing, TP/SL, execution, watcher wording, or cadence changes without explicit approval

## Hyperliquid Public Data

Primary use: public/no-key perp market context, funding/basis context, copytrading address discovery, and known-address verification.

Verified on 2026-08-30:

- Public stats leaderboard: reachable without a key and useful for discovery-only address seeds.
- Official `info` endpoint: `meta`, `allMids`, `predictedFundings`, `fundingHistory`, `candleSnapshot`, `clearinghouseState`, and `userFills` returned HTTP 200 from this workspace.
- `userFills` can return capped samples, so fills are usable for conservative rejection/watch triage, not for complete wallet-history proof.

Status: active public/no-key research rail, with promotion blocked by leaderboard bias, capped fill history, hidden hedge risk, latency/cost uncertainty, and lack of non-leaderboard activity-defined discovery.

See `wiki/notes/2026-08-30-hyperliquid-data-feasibility-spike.md`.

## Public Free Source Feed Map

Primary use: compact source routing for the Market/Battlefield loop and patient-retail branch selection.

Current active or watch feeds:

- Binance, Bybit, and Hyperliquid public market data: active-public-proxy for candles/orderflow/context.
- Hyperliquid public stats leaderboard plus official info endpoint: active discovery-only plus no-key verification for known addresses.
- DefiLlama: active-public-context for protocol, TVL, fees, yields, stablecoin, and chain context.
- DEXScreener and GeckoTerminal: watch/active-proxy for token/pair liquidity and mid-cap sanity checks.
- Alternative.me Fear & Greed: watch/context only.
- CoinGecko keyless public API: watch/fragile because keyless limits are IP-based and the stable free demo path requires an account/API key.

See `wiki/notes/2026-08-30-public-free-source-feed-list.md`.

## Workspace Evidence Read Path

Primary use: choose the right local Obsidian/read path before duplicating data into RALPH.

Current map:

- `ralph-research-os/`: canonical RALPH research, routing, decisions, notes, and validation outputs.
- `../crypto-updates/`: generated alert/review/setup/orderflow evidence with compact indexes and Obsidian-friendly wiki pages.
- `../openclaw-research-os/`: global OpenClaw workflow/source-routing memory, not a crypto research dump.
- `../zela-benchmark/`: methodology source tree, already summarized through RALPH case files.
- `../memory/`: daily continuity only; promote durable RALPH decisions into the RALPH wiki/log instead of treating daily notes as first source evidence.

See `wiki/notes/2026-09-01-workspace-evidence-routing-map.md` and `wiki/notes/2026-09-01-workspace-owner-index-reconciliation.md`.
